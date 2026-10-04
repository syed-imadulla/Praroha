from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Seed Unfold (Praroha)"
    API_V1_PREFIX: str = "/api"
    AI_PROVIDER: str = "mock"  # options: mock, gemini
    STORAGE_PROVIDER: str = "local"  # options: local, supabase
    DATABASE_URL: str = "sqlite+aiosqlite:///./seed_unfold.db"
    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Optional provider keys
    GEMINI_API_KEY: Optional[str] = None
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: str = "seed-unfold-assets"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
