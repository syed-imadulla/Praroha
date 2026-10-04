import pytest
from httpx import AsyncClient
from backend.app.config import Settings
from backend.app.providers.factory import get_storage_provider
from backend.app.providers.storage import LocalStorageProvider, SupabaseStorageProvider
from backend.app.repositories.project_repo import build_engine, init_db


def test_database_url_formatting_for_supabase():
    """Ensure standard Supabase connection strings are automatically normalized to asyncpg."""
    # Standard postgresql:// string copied from Supabase dashboard
    s1 = Settings(DATABASE_URL="postgresql://postgres.xxx:secret@aws-0.pooler.supabase.com:6543/postgres")
    assert s1.DATABASE_URL.startswith("postgresql+asyncpg://")

    # postgres:// shorthand
    s2 = Settings(DATABASE_URL="postgres://postgres.xxx:secret@aws-0.pooler.supabase.com:6543/postgres")
    assert s2.DATABASE_URL.startswith("postgresql+asyncpg://")

    # Already asyncpg
    s3 = Settings(DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/db")
    assert s3.DATABASE_URL == "postgresql+asyncpg://user:pass@host:5432/db"

    # Password containing unencoded '@' character
    s4 = Settings(DATABASE_URL="postgresql://postgres.xxx:pr@roha123@aws-0.pooler.supabase.com:6543/postgres")
    assert "pr%40roha123" in s4.DATABASE_URL
    assert s4.DATABASE_URL.startswith("postgresql+asyncpg://")

    # Empty string falls back to SQLite
    s5 = Settings(DATABASE_URL="")
    assert s5.DATABASE_URL == "sqlite+aiosqlite:///./seed_unfold.db"


def test_supabase_engine_configuration():
    """Verify engine creation flags for Supabase poolers."""
    pg_url = "postgresql+asyncpg://fake_user:fake_pass@fake_host:6543/postgres"
    engine = build_engine(pg_url)
    assert engine.url.drivername == "postgresql+asyncpg"
    # Pool pre-ping should be enabled for cloud PostgreSQL
    assert engine.pool._pre_ping is True


@pytest.mark.asyncio
async def test_supabase_storage_provider_fallback_when_unset():
    """When Supabase credentials are missing, automatically fall back to local storage."""
    provider = SupabaseStorageProvider(supabase_url=None, supabase_key=None)
    url = await provider.upload(b'{"test": true}', "unit_test_fallback.json", "application/json")
    assert url.startswith("/uploads/unit_test_fallback.json")
    # Clean up test asset
    await provider.delete("unit_test_fallback.json")


@pytest.mark.asyncio
async def test_supabase_storage_provider_fallback_on_network_error():
    """When Supabase endpoint is unreachable, gracefully fall back without raising unhandled exception."""
    provider = SupabaseStorageProvider(
        supabase_url="https://unreachable-test-project.supabase.co",
        supabase_key="unreachable-secret-key",
        bucket="seed-unfold-assets",
    )
    url = await provider.upload(b'{"test": true}', "unit_test_net_error.json", "application/json")
    assert url.startswith("/uploads/unit_test_net_error.json")
    await provider.delete("unit_test_net_error.json")


def test_storage_factory_supabase_resolution():
    """When STORAGE_PROVIDER=supabase but credentials missing, factory returns LocalStorageProvider."""
    provider = get_storage_provider()
    # In test environment where SUPABASE_URL is not set, it must return LocalStorageProvider
    assert isinstance(provider, LocalStorageProvider)
