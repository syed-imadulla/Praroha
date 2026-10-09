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
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_FALLBACK_MODELS: List[str] = [
        "gemini-flash-latest",
        "gemini-3.5-flash-lite",
    ]
    # Optional audio/atmosphere provider keys
    HF_TOKEN: Optional[str] = None
    ACE_STEP_ENDPOINT: Optional[str] = None
    STABILITY_API_KEY: Optional[str] = None
    STABLE_AUDIO_ENDPOINT: Optional[str] = None
    POLLINATIONS_API_KEY: Optional[str] = None
    POLLINATIONS_MODEL: str = "flux"
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: str = "seed-unfold-assets"

    @classmethod
    def clean_database_url(cls, v: Optional[str]) -> str:
        if not v or not str(v).strip():
            return "sqlite+aiosqlite:///./seed_unfold.db"
        url_str = str(v).strip()
        
        # Normalize protocol scheme
        scheme = "postgresql+asyncpg"
        if url_str.startswith("postgres://"):
            rest = url_str[len("postgres://"):]
        elif url_str.startswith("postgresql://"):
            rest = url_str[len("postgresql://"):]
        elif url_str.startswith("postgresql+asyncpg://"):
            rest = url_str[len("postgresql+asyncpg://"):]
        else:
            return url_str

        # Handle unescaped characters (e.g. '@' in passwords copied from dashboard)
        if "@" in rest:
            userinfo, hostpart = rest.rsplit("@", 1)
            if ":" in userinfo:
                import urllib.parse
                user, pwd = userinfo.split(":", 1)
                clean_user = urllib.parse.quote(urllib.parse.unquote(user), safe="")
                clean_pwd = urllib.parse.quote(urllib.parse.unquote(pwd), safe="")
                return f"{scheme}://{clean_user}:{clean_pwd}@{hostpart}"
        return f"{scheme}://{rest}"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def model_post_init(self, __context) -> None:
        self.DATABASE_URL = self.clean_database_url(self.DATABASE_URL)
        if self.SUPABASE_URL:
            self.SUPABASE_URL = self.SUPABASE_URL.strip().rstrip("/")
        if self.STORAGE_PROVIDER:
            self.STORAGE_PROVIDER = self.STORAGE_PROVIDER.strip().lower()


settings = Settings()
