from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.scans.router import router as scans_router
from app.db.database import engine
from app.users.models import Base as UserBase
from app.scans.models import Base as ScanBase

app = FastAPI(title="SentinelAI API")

app.add_middleware(CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Tables are managed by Neon/alembic — no DB call needed at startup.
    # NullPool provides fresh connections per request, so no warm-up is required.
    print("✓ SentinelAI API starting up")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(scans_router)

@app.get("/health")
async def health():
    return {"status": "ok"}