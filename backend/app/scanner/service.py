import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.config import settings
from app.scans.models import Scan, Finding
from .serialization import SerializationScanner
from .cve import CVEScanner
from .config_audit import ConfigAuditor
from .behavioral import BehavioralProbe
from .bias import BiasChecker
from .scorer import calculate_score

# Sync engine for the worker process (RQ is sync)
_sync_url = settings.DATABASE_URL.replace(
    "postgresql+asyncpg://", "postgresql://"
).replace(
    "postgresql+asyncpg+", "postgresql+"
)
sync_engine = create_engine(_sync_url, pool_pre_ping=True, pool_recycle=180)


def _get_sync_session() -> Session:
    return Session(sync_engine)


def run_scanner_sync(scanner_class, kwargs: dict, module_key: str):
    """Run one async scanner in a sync context. Returns (module_key, findings)."""
    try:
        scanner = scanner_class(**kwargs)
        findings = asyncio.run(scanner.run())
        return module_key, findings
    except Exception as e:
        print(f"Module {module_key} failed: {e}")
        return module_key, []


def run_scan(scan_id: str, target: str, target_type: str, hf_token: str = None):
    """Main scan orchestrator — called by RQ worker (sync)."""

    # Mark as running
    with _get_sync_session() as db:
        scan = db.execute(select(Scan).where(Scan.id == scan_id)).scalar_one()
        scan.status = "running"
        scan.modules_status = {
            "serialization": "running", "cve": "running",
            "config": "running", "behavioral": "running", "bias": "running"
        }
        db.commit()

    kwargs = {"target": target, "target_type": target_type, "hf_token": hf_token}
    scanner_classes = [
        (SerializationScanner, "serialization"),
        (CVEScanner, "cve"),
        (ConfigAuditor, "config"),
        (BehavioralProbe, "behavioral"),
        (BiasChecker, "bias"),
    ]

    all_findings = []
    modules_final = {}

    for scanner_class, module_key in scanner_classes:
        key, findings = run_scanner_sync(scanner_class, kwargs, module_key)
        modules_final[key] = "complete"
        all_findings.extend(findings)

    risk_score, risk_label = calculate_score(all_findings)

    # Write everything in one transaction
    for attempt in range(4):
        try:
            with _get_sync_session() as db:
                scan = db.execute(select(Scan).where(Scan.id == scan_id)).scalar_one()
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
                db.commit()
            print(f"[DB] Scan {scan_id} written OK")
            return
        except Exception as e:
            print(f"[DB] Write attempt {attempt+1}/4 failed: {e}")
            if attempt < 3:
                import time; time.sleep(2 ** attempt)

    # Mark failed
    try:
        with _get_sync_session() as db:
            scan = db.execute(select(Scan).where(Scan.id == scan_id)).scalar_one()
            scan.status = "failed"
            scan.error_message = "DB write failed after 4 retries"
            db.commit()
    except Exception as e:
        print(f"[DB] Could not even mark scan as failed: {e}")