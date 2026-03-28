from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings

database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

if "sslmode=require" in database_url:
    database_url = database_url.replace("sslmode=require", "ssl=require")
database_url = database_url.replace("&channel_binding=require", "")
database_url = database_url.replace("?channel_binding=require", "")
if database_url.endswith("?"):
    database_url = database_url[:-1]

# NullPool is required for Neon serverless + asyncpg.
# It creates a fresh connection per request so Neon can never
# hand back a stale "connection is closed" socket.
engine = create_async_engine(
    database_url,
    echo=False,
    poolclass=NullPool,
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session