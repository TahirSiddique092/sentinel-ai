import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from app.db.database import AsyncSessionLocal
from app.scans.models import Scan, Finding
from .serialization import SerializationScanner
from .cve import CVEScanner
from .config_audit import ConfigAuditor
from .behavioral import BehavioralProbe
from .bias import BiasChecker
from .scorer import calculate_score


async def _db_with_retry(fn, retries=4, delay=1.5):
    """Execute an async DB operation with exponential backoff retries.
    Handles transient ConnectionResetError / OperationalError from Neon serverless."""
    last_exc = None
    for attempt in range(retries):
        try:
            async with AsyncSessionLocal() as db:
                return await fn(db)
        except (OperationalError, ConnectionResetError, OSError) as e:
            last_exc = e
            wait = delay * (2 ** attempt)
            print(f"[DB] Transient error (attempt {attempt+1}/{retries}), retrying in {wait:.1f}s: {e}")
            await asyncio.sleep(wait)
    raise last_exc


async def _mark_running(scan_id: str, module_key: str):
    async def fn(db):
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalar_one()
        scan.modules_status = {**scan.modules_status, module_key: "running"}
        await db.commit()
    await _db_with_retry(fn)


async def _save_findings(scan_id: str, module_key: str, findings):
    async def fn(db):
        for f in findings:
            if f.severity == "INFO":
                continue
            db.add(Finding(
                scan_id=scan_id, module=f.module, severity=f.severity,
                title=f.title, description=f.description,
                owasp_tag=f.owasp_tag, remediation=f.remediation,
                raw_data=f.raw_data
            ))
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalar_one()
        scan.modules_status = {**scan.modules_status, module_key: "complete"}
        await db.commit()
    await _db_with_retry(fn)


async def run_module(scanner, module_key: str, scan_id: str):
    """Run one scanner module and write its findings to DB."""
    await _mark_running(scan_id, module_key)

    try:
        findings = await scanner.run()
    except Exception as e:
        findings = []
        print(f"Module {module_key} failed: {e}")

    await _save_findings(scan_id, module_key, findings)
    return findings


async def run_scan(scan_id: str, target: str, target_type: str, hf_token: str = None):
    """Main scan orchestrator — called as a FastAPI background task."""
    async def mark_running(db):
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalar_one()
        scan.status = "running"
        await db.commit()
    await _db_with_retry(mark_running)

    kwargs = {"target": target, "target_type": target_type, "hf_token": hf_token}

    # Run cheap / fast modules in parallel, but serialization (large download)
    # runs alone first to avoid hitting Neon's connection limit simultaneously.
    try:
        serialization_findings = await run_module(
            SerializationScanner(**kwargs), "serialization", scan_id
        )

        # Now run remaining 4 modules in parallel (no large downloads)
        remaining = await asyncio.gather(
            run_module(CVEScanner(**kwargs), "cve", scan_id),
            run_module(ConfigAuditor(**kwargs), "config", scan_id),
            run_module(BehavioralProbe(**kwargs), "behavioral", scan_id),
            run_module(BiasChecker(**kwargs), "bias", scan_id),
            return_exceptions=True,
        )

        all_findings = list(serialization_findings)
        for res in remaining:
            if isinstance(res, list):
                all_findings.extend(res)

        risk_score, risk_label = calculate_score(all_findings)

        async def finalize(db):
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one()
            scan.status = "complete"
            scan.risk_score = risk_score
            scan.risk_label = risk_label
            scan.completed_at = datetime.now(timezone.utc)
            await db.commit()
        await _db_with_retry(finalize)

    except Exception as e:
        async def mark_failed(db):
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one()
            scan.status = "failed"
            scan.error_message = str(e)
            await db.commit()
        await _db_with_retry(mark_failed)