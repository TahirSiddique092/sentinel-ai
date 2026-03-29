import urllib.parse
import logging

from fastapi import APIRouter, Depends, Query, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address
import httpx

from app.db.database import get_db
from app.users.models import User
from app.config import settings
from .github import exchange_code_for_token, get_github_user
from .jwt import create_token, get_current_user_id, decode_token_full

logger = logging.getLogger("sentinelai")

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/github")
@limiter.limit("10/minute")
async def github_login(request: Request, redirect_uri: str = Query(None)):
    callback = redirect_uri or f"{settings.FRONTEND_URL}/auth/callback"
    state = urllib.parse.quote(callback)
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}&scope=user:email&state={state}"
    )
    return RedirectResponse(url)


@router.get("/callback")
@limiter.limit("10/minute")
async def github_callback(
    request: Request, code: str, state: str = "", db: AsyncSession = Depends(get_db)
):
    redirect_to = (
        urllib.parse.unquote(state) if state else f"{settings.FRONTEND_URL}/auth/callback"
    )

    try:
        gh_token = await exchange_code_for_token(code)
        gh_user = await get_github_user(gh_token)
    except Exception as e:
        logger.error(f"GitHub OAuth failed: {e}")
        raise HTTPException(status_code=502, detail="GitHub authentication failed")

    result = await db.execute(select(User).where(User.github_id == gh_user["id"]))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            github_id=gh_user["id"],
            github_username=gh_user["login"],
            email=gh_user.get("email"),
            avatar_url=gh_user.get("avatar_url"),
        )
        db.add(user)
    else:
        user.github_username = gh_user["login"]
        user.avatar_url = gh_user.get("avatar_url")

    await db.commit()
    await db.refresh(user)
    token = create_token(str(user.id), gh_token)
    return RedirectResponse(f"{redirect_to}?token={token}")


@router.get("/me")
@limiter.limit("30/minute")
async def get_me(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404)
    return {
        "id": str(user.id),
        "github_username": user.github_username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
    }


@router.post("/logout")
@limiter.limit("10/minute")
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
):
    """Revoke the GitHub OAuth token so GitHub will show the auth screen next login."""
    payload = decode_token_full(credentials.credentials)
    gh_token = payload.get("gh", "")
    if gh_token:
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f"https://api.github.com/applications/{settings.GITHUB_CLIENT_ID}/grant",
                    auth=(settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET),
                    json={"access_token": gh_token},
                    headers={"Accept": "application/vnd.github+json"},
                )
        except Exception:
            pass  # best-effort revocation
    return {"ok": True}