import httpx
from app.config import settings

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"

async def exchange_code_for_token(code: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(GITHUB_TOKEN_URL, json={
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
        }, headers={"Accept": "application/json"})
    data = resp.json()
    if "access_token" not in data:
        raise ValueError("GitHub did not return access_token")
    return data["access_token"]

async def get_github_user(access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(GITHUB_USER_URL, headers=headers)
        user = user_resp.json()
        # get primary email if not public
        if not user.get("email"):
            emails_resp = await client.get(GITHUB_EMAILS_URL, headers=headers)
            primary = next((e for e in emails_resp.json() if e.get("primary")), None)
            user["email"] = primary["email"] if primary else None
    return user