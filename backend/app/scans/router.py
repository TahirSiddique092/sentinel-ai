from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db.database import get_db
from app.auth.jwt import get_current_user_id
from .models import Scan, Finding
from app.scanner.service import run_scan  # Member 4 writes this

router = APIRouter(prefix="/scans", tags=["scans"])

class ScanCreate(BaseModel):
    target: str
    target_type: str = "huggingface"
    hf_token: str | None = None

@router.post("", status_code=202)
async def create_scan(
    body: ScanCreate,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    scan = Scan(user_id=user_id, target=body.target, target_type=body.target_type,
                status="pending", modules_status={
                    "serialization": "pending", "cve": "pending",
                    "config": "pending", "behavioral": "pending", "bias": "pending"
                })
    db.add(scan)
    await db.commit()
    await db.refresh(scan)
    background_tasks.add_task(run_scan, str(scan.id), body.target,
                               body.target_type, body.hf_token)
    return {"scan_id": str(scan.id), "status": "pending",
            "created_at": scan.created_at}

@router.get("/{scan_id}")
async def get_scan(scan_id: str, user_id: str = Depends(get_current_user_id),
                    db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == scan_id, Scan.user_id == user_id))
    scan = result.scalar_one_or_none()
    if not scan: raise HTTPException(404)
    # count findings by severity
    counts_result = await db.execute(
        select(Finding.severity, func.count()).where(Finding.scan_id == scan_id).group_by(Finding.severity)
    )
    counts = {row[0]: row[1] for row in counts_result}
    return {"scan_id": str(scan.id), "target": scan.target, "status": scan.status,
            "risk_score": scan.risk_score, "risk_label": scan.risk_label,
            "modules_status": scan.modules_status, "findings_count": counts,
            "created_at": scan.created_at, "completed_at": scan.completed_at}

@router.get("/{scan_id}/findings")
async def get_findings(scan_id: str, user_id: str = Depends(get_current_user_id),
                         db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Finding).where(Finding.scan_id == scan_id).order_by(
            Finding.severity.desc()))  # CRITICAL first
    return ["id", "module", "severity", "title", "description",
            "owasp_tag", "remediation", "created_at"]  # Member 3: serialize properly

@router.get("/{scan_id}/report")
async def get_report(scan_id: str, format: str = "json",
                       user_id: str = Depends(get_current_user_id),
                       db: AsyncSession = Depends(get_db)):
    # Member 4 writes report generation; this route just fetches and returns
    result = await db.execute(select(Scan).where(Scan.id == scan_id, Scan.user_id == user_id))
    scan = result.scalar_one_or_none()
    if not scan or scan.status != "complete": raise HTTPException(404)
    findings = (await db.execute(select(Finding).where(Finding.scan_id == scan_id))).scalars().all()
    from app.scanner.report import generate_json_report, generate_html_report
    if format == "html":
        return HTMLResponse(generate_html_report(scan, findings),
                             headers={"Content-Disposition": f'attachment; filename="scan-{scan_id}.html"'})
    return generate_json_report(scan, findings)