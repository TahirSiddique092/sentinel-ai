# app/users/router.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.auth.jwt import get_current_user_id
from app.users.models import User
from app.scans.models import Scan

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(404)
    count = await db.execute(select(func.count()).where(Scan.user_id == user_id))
    return {
        "id": str(user.id), "github_username": user.github_username,
        "email": user.email, "avatar_url": user.avatar_url,
        "created_at": user.created_at, "scan_count": count.scalar()
    }