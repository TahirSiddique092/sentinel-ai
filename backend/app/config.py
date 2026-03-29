from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    JWT_SECRET: str
    JWT_EXPIRE_DAYS: int = 30
    FRONTEND_URL: str = "http://localhost:5173"
    HF_TOKEN: str = ""
    GEMINI_API_KEY: str = ""
    ALLOWED_ORIGINS: str = ""  # comma-separated production origins

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()