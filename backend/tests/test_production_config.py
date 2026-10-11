import os
import pytest
from pathlib import Path
from backend.app.config import Settings
from backend.app.providers.factory import get_storage_provider
from backend.app.providers.storage import LocalStorageProvider, SupabaseStorageProvider


def test_database_url_normalization():
    # PostgreSQL standard URL
    assert Settings.clean_database_url("postgresql://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"
    # Postgres protocol shorthand
    assert Settings.clean_database_url("postgres://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"
    # Already normalized
    assert Settings.clean_database_url("postgresql+asyncpg://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"
    # SQLite fallback
    assert Settings.clean_database_url(None) == "sqlite+aiosqlite:///./seed_unfold.db"
    assert Settings.clean_database_url("") == "sqlite+aiosqlite:///./seed_unfold.db"


def test_cors_origins_parsing():
    # Comma-separated string
    s1 = Settings(CORS_ORIGINS="https://praroha.app, https://app.praroha.app")
    assert s1.CORS_ORIGINS == ["https://praroha.app", "https://app.praroha.app"]

    # JSON array string
    s2 = Settings(CORS_ORIGINS='["https://example.com", "https://api.example.com"]')
    assert s2.CORS_ORIGINS == ["https://example.com", "https://api.example.com"]

    # List of strings
    s3 = Settings(CORS_ORIGINS=["https://custom.com"])
    assert s3.CORS_ORIGINS == ["https://custom.com"]


def test_storage_provider_resolution(monkeypatch):
    from backend.app.config import settings

    # Local storage
    monkeypatch.setattr(settings, "STORAGE_PROVIDER", "local")
    provider = get_storage_provider()
    assert isinstance(provider, LocalStorageProvider)

    # Supabase cloud storage (with dummy URL)
    monkeypatch.setattr(settings, "STORAGE_PROVIDER", "supabase")
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://dummy.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_KEY", "anon-key")
    provider_supa = get_storage_provider()
    assert isinstance(provider_supa, SupabaseStorageProvider)


def test_production_deployment_artifacts_exist():
    root = Path(__file__).resolve().parent.parent.parent
    assert (root / "Dockerfile.backend").exists(), "Dockerfile.backend must exist"
    assert (root / "Dockerfile.frontend").exists(), "Dockerfile.frontend must exist"
    assert (root / "docker-compose.prod.yml").exists(), "docker-compose.prod.yml must exist"
    assert (root / "deployment" / "nginx.conf").exists(), "deployment/nginx.conf must exist"
    assert (root / ".env.production.example").exists(), ".env.production.example must exist"
    assert (root / "docs" / "DEPLOYMENT.md").exists(), "docs/DEPLOYMENT.md must exist"
