import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.scans.models import Scan, Finding
from .serialization import SerializationScanner
from .cve import CVEScanner
from .config_audit import ConfigAuditor
from .behavioral import BehavioralProbe
from .bias import BiasChecker
from .scorer import calculate_score

async def run_module(scanner, module_key: str, scan_id: str):
    """Run one scanner module and write its findings to DB."""
    async with AsyncSessionLocal() as db:
        # mark module as running
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalar_one()
        scan.modules_status = {**scan.modules_status, module_key: "running"}
        await db.commit()

    try:
        findings = await scanner.run()
    except Exception as e:
        findings = []
        # log the error but don't crash the whole scan
        print(f"Module {module_key} failed: {e}")

    async with AsyncSessionLocal() as db:
        # write findings
        for f in findings:
            if f.severity == "INFO": continue  # don't store INFO in DB
            db.add(Finding(
                scan_id=scan_id, module=f.module, severity=f.severity,
                title=f.title, description=f.description,
                owasp_tag=f.owasp_tag, remediation=f.remediation,
                raw_data=f.raw_data
            ))
        # mark module as complete
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalar_one()
        scan.modules_status = {**scan.modules_status, module_key: "complete"}
        await db.commit()

    return findings

async def run_scan(scan_id: str, target: str, target_type: str, hf_token: str = None):
    """Main scan orchestrator — called as a FastAPI background task."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalar_one()
        scan.status = "running"
        await db.commit()

    kwargs = {"target": target, "target_type": target_type, "hf_token": hf_token}

    try:
        # run all 5 modules in parallel
        results = await asyncio.gather(
            run_module(SerializationScanner(**kwargs), "serialization", scan_id),
            run_module(CVEScanner(**kwargs), "cve", scan_id),
            run_module(ConfigAuditor(**kwargs), "config", scan_id),
            run_module(BehavioralProbe(**kwargs), "behavioral", scan_id),
            run_module(BiasChecker(**kwargs), "bias", scan_id),
            return_exceptions=True
        )

        all_findings = [f for module_findings in results
                        if isinstance(module_findings, list)
                        for f in module_findings]

        risk_score, risk_label = calculate_score(all_findings)

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one()
            scan.status = "complete"
            scan.risk_score = risk_score
            scan.risk_label = risk_label
            scan.completed_at = datetime.now(timezone.utc)
            await db.commit()

    except Exception as e:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one()
            scan.status = "failed"
            scan.error_message = str(e)
            await db.commit()