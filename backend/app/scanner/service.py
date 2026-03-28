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


async def run_scanner_safe(scanner, module_key: str) -> tuple[str, list]:
    """Run one scanner. Returns (module_key, findings). Never raises."""
    try:
        findings = await scanner.run()
        return module_key, findings
    except Exception as e:
        print(f"Module {module_key} failed: {e}")
        return module_key, []


async def write_results(scan_id: str, all_findings: list, modules_final: dict,
                        risk_score: int, risk_label: str):
    """Single DB write for everything — retried up to 4 times."""
    for attempt in range(4):
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Scan).where(Scan.id == scan_id))
                scan = result.scalar_one()
                scan.status = "complete"
                scan.risk_score = risk_score
                scan.risk_label = risk_label
                scan.modules_status = modules_final
                scan.completed_at = datetime.now(timezone.utc)
                for f in all_findings:
                    if f.severity != "INFO":
                        db.add(Finding(
                            scan_id=scan_id, module=f.module, severity=f.severity,
                            title=f.title, description=f.description,
                            owasp_tag=f.owasp_tag, remediation=f.remediation,
                            raw_data=f.raw_data
                        ))
                await db.commit()
                print(f"[DB] Scan {scan_id} written successfully")
                return
        except Exception as e:
            print(f"[DB] Write attempt {attempt+1}/4 failed: {e}")
            if attempt < 3:
                await asyncio.sleep(2 ** attempt)  # 1s, 2s, 4s backoff

    # Last resort — mark failed
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one()
            scan.status = "failed"
            scan.error_message = "DB write failed after 4 retries"
            await db.commit()
    except Exception as e:
        print(f"[DB] Could not even mark scan as failed: {e}")


async def run_scan(scan_id: str, target: str, target_type: str, hf_token: str = None):
    # Mark scan as running
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one()
            scan.status = "running"
            scan.modules_status = {
                "serialization": "running", "cve": "running",
                "config": "running", "behavioral": "running", "bias": "running"
            }
            await db.commit()
    except Exception as e:
        print(f"[DB] Could not mark scan as running: {e}")

    kwargs = {"target": target, "target_type": target_type, "hf_token": hf_token}

    # Run all 5 modules in parallel — all results collected in memory
    results = await asyncio.gather(
        run_scanner_safe(SerializationScanner(**kwargs), "serialization"),
        run_scanner_safe(CVEScanner(**kwargs), "cve"),
        run_scanner_safe(ConfigAuditor(**kwargs), "config"),
        run_scanner_safe(BehavioralProbe(**kwargs), "behavioral"),
        run_scanner_safe(BiasChecker(**kwargs), "bias"),
    )

    # Flatten all findings
    modules_final = {}
    all_findings = []
    for module_key, findings in results:
        modules_final[module_key] = "complete"
        all_findings.extend(findings)

    risk_score, risk_label = calculate_score(all_findings)

    # One single DB write for everything
    await write_results(scan_id, all_findings, modules_final, risk_score, risk_label)