import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.db.database import get_db
from app.auth.jwt import get_current_user_id
from .models import Scan, Finding
import redis
from rq import Queue
from app.config import settings

_redis_conn = redis.from_url(settings.REDIS_URL)
_scan_queue = Queue("sentinelai-scans", connection=_redis_conn)

logger = logging.getLogger("sentinelai")

router = APIRouter(prefix="/scans", tags=["scans"])
limiter = Limiter(key_func=get_remote_address)


class ScanCreate(BaseModel):
    target: str
    target_type: str = "huggingface"
    hf_token: str | None = None


@router.post("", status_code=202)
@limiter.limit("5/minute")
async def create_scan(
    request: Request,
    body: ScanCreate,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # ── Validate model exists before creating any DB record ──────────────
    if body.target_type == "huggingface":
        import httpx as _httpx
        hf_headers = {}
        if body.hf_token:
            hf_headers["Authorization"] = f"Bearer {body.hf_token}"
        try:
            async with _httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    f"https://huggingface.co/api/models/{body.target}",
                    headers=hf_headers
                )
            if r.status_code == 401 or r.status_code == 403:
                raise HTTPException(
                    status_code=404,
                    detail=f"Model '{body.target}' is private or gated. Provide a valid --hf-token to scan it."
                )
            if r.status_code == 404 or r.status_code >= 400:
                raise HTTPException(
                    status_code=404,
                    detail=f"Model '{body.target}' not found on HuggingFace. Check the model ID and try again."
                )
        except _httpx.TimeoutException:
            raise HTTPException(
                status_code=503,
                detail="Could not reach HuggingFace. Check your internet connection and try again."
            )
        except HTTPException:
            raise  # re-raise our own 404s
        except Exception:
            pass  # if validation itself fails for unexpected reason, let the scan try anyway

    scan = Scan(
        user_id=user_id,
        target=body.target,
        target_type=body.target_type,
        status="pending",
        modules_status={
            "serialization": "pending",
            "cve": "pending",
            "config": "pending",
            "behavioral": "pending",
            "bias": "pending",
        },
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)
    background_tasks.add_task(
        run_scan, str(scan.id), body.target, body.target_type, body.hf_token
    )
    return {"scan_id": str(scan.id), "status": "pending", "created_at": scan.created_at}


@router.get("/{scan_id}")
@limiter.limit("30/minute")
async def get_scan(
    request: Request,
    scan_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Scan).where(Scan.id == scan_id, Scan.user_id == user_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(404)
    counts_result = await db.execute(
        select(Finding.severity, func.count())
        .where(Finding.scan_id == scan_id)
        .group_by(Finding.severity)
    )
    counts = {row[0]: row[1] for row in counts_result}
    return {
        "scan_id": str(scan.id),
        "target": scan.target,
        "status": scan.status,
        "risk_score": scan.risk_score,
        "risk_label": scan.risk_label,
        "modules_status": scan.modules_status,
        "findings_count": counts,
        "created_at": scan.created_at,
        "completed_at": scan.completed_at,
    }


@router.get("/{scan_id}/findings")
@limiter.limit("30/minute")
async def get_findings(
    request: Request,
    scan_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    scan_result = await db.execute(
        select(Scan).where(Scan.id == scan_id, Scan.user_id == user_id)
    )
    if not scan_result.scalar_one_or_none():
        raise HTTPException(404)
    result = await db.execute(
        select(Finding).where(Finding.scan_id == scan_id).order_by(Finding.severity)
    )
    findings = result.scalars().all()
    return [
        {
            "id": str(f.id),
            "module": f.module,
            "severity": f.severity,
            "title": f.title,
            "description": f.description,
            "owasp_tag": f.owasp_tag,
            "remediation": f.remediation,
            "created_at": f.created_at,
        }
        for f in findings
    ]


@router.get("/{scan_id}/report")
@limiter.limit("10/minute")
async def get_report(
    request: Request,
    scan_id: str,
    format: str = "json",
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Scan).where(Scan.id == scan_id, Scan.user_id == user_id)
    )
    scan = result.scalar_one_or_none()
    if not scan or scan.status != "complete":
        raise HTTPException(404)
    findings = (
        (await db.execute(select(Finding).where(Finding.scan_id == scan_id)))
        .scalars()
        .all()
    )
    from app.scanner.report import generate_json_report, generate_html_report

    if format == "html":
        return HTMLResponse(
            generate_html_report(scan, findings),
            headers={
                "Content-Disposition": f'attachment; filename="scan-{scan_id}.html"'
            },
        )
    return generate_json_report(scan, findings)


@router.get("")
@limiter.limit("30/minute")
async def list_scans(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Scan)
        .where(Scan.user_id == user_id)
        .order_by(Scan.created_at.desc())
        .limit(50)
    )
    scans = result.scalars().all()
    return [
        {
            "scan_id": str(s.id),
            "target": s.target,
            "status": s.status,
            "risk_score": s.risk_score,
            "risk_label": s.risk_label,
            "created_at": s.created_at,
            "completed_at": s.completed_at,
        }
        for s in scans
    ]