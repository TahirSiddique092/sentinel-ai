from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import settings

database_url = settings.DATABASE_URL
# Ensure correct asyncpg scheme
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Neon free tier drops idle connections aggressively.
# These settings keep the pool healthy across long scans.
engine = create_async_engine(
    database_url,
    echo=False,
    pool_size=3,
    max_overflow=5,
    pool_timeout=60,
    pool_recycle=180,       # recycle every 3 min — Neon idles at 5 min
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session