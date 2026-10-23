"""
Unit and integration tests for Phase 52 Production Database Initialization and Migration Safety.

Verifies:
1. Production database initialization fails closed (raises RuntimeError) rather than silently falling back to SQLite.
2. Local development fallback is restricted to explicit opt-in (ALLOW_SQLITE_FALLBACK=True).
3. _migrate_columns uses BOOLEAN DEFAULT FALSE (compatible with both PostgreSQL and SQLite).
4. _safe_execute uses nested transactions (SAVEPOINT) on PostgreSQL to prevent transaction abortion.
5. Live PostgreSQL database initializes cleanly without transaction errors or fallback.
"""

import os
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from sqlalchemy import text
from sqlmodel import SQLModel

from backend.app.config import Settings
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import (
    _migrate_columns,
    _safe_execute,
    build_engine,
    init_db,
)


@pytest.fixture(autouse=True)
async def restore_database_repo_state():
    """Ensure engine, async_session, and settings in project_repo are strictly restored."""
    orig_engine = project_repo.engine
    orig_session = project_repo.async_session
    orig_env = project_repo.settings.ENVIRONMENT
    orig_fallback = project_repo.settings.ALLOW_SQLITE_FALLBACK
    orig_url = project_repo.settings.DATABASE_URL
    yield
    # Dispose current engine if it was dynamically created
    if project_repo.engine is not orig_engine:
        try:
            await project_repo.engine.dispose()
        except Exception:
            pass
    project_repo.engine = orig_engine
    project_repo.async_session = orig_session
    project_repo.settings.ENVIRONMENT = orig_env
    project_repo.settings.ALLOW_SQLITE_FALLBACK = orig_fallback
    project_repo.settings.DATABASE_URL = orig_url


@pytest.mark.asyncio
async def test_production_fails_closed_on_db_error(monkeypatch):
    """
    Requirement 4: In production, failure to initialize the configured primary database
    must raise RuntimeError and fail startup immediately. It must NEVER switch to SQLite.
    """
    monkeypatch.setattr(project_repo.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(project_repo.settings, "ALLOW_SQLITE_FALLBACK", False)

    # Configure engine pointing to an unreachable postgres database
    bad_pg_url = "postgresql+asyncpg://baduser:badpass@127.0.0.1:59999/baddb"
    fake_engine = build_engine(bad_pg_url)
    project_repo.engine = fake_engine

    try:
        with pytest.raises(RuntimeError, match="Silent fallback to SQLite is disabled"):
            await init_db()

        # Confirm engine was NOT silently changed to SQLite
        assert not str(project_repo.engine.url).startswith("sqlite"), "Engine was illegally switched to SQLite!"
    finally:
        await fake_engine.dispose()


@pytest.mark.asyncio
async def test_development_fallback_requires_explicit_opt_in(monkeypatch):
    """
    Requirement 5: In development, fallback to SQLite requires explicit ALLOW_SQLITE_FALLBACK=True.
    By default (ALLOW_SQLITE_FALLBACK=False), connection failure still fails closed.
    """
    monkeypatch.setattr(project_repo.settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(project_repo.settings, "ALLOW_SQLITE_FALLBACK", False)

    bad_pg_url = "postgresql+asyncpg://baduser:badpass@127.0.0.1:59999/baddb"
    fake_engine = build_engine(bad_pg_url)
    project_repo.engine = fake_engine

    try:
        # Without explicit opt-in, it fails closed
        with pytest.raises(RuntimeError, match="Silent fallback to SQLite is disabled"):
            await init_db()

        # With explicit opt-in, it allows development fallback
        monkeypatch.setattr(project_repo.settings, "ALLOW_SQLITE_FALLBACK", True)
        await init_db()
        assert str(project_repo.engine.url).startswith("sqlite"), "Engine should have fallen back to SQLite with explicit opt-in"
    finally:
        await fake_engine.dispose()


@pytest.mark.asyncio
async def test_sqlite_migration_succeeds():
    """
    Requirement 2: _migrate_columns executes cleanly against SQLite with BOOLEAN DEFAULT FALSE.
    """
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        test_sqlite_url = f"sqlite+aiosqlite:///{tmp.name}"
        sqlite_engine = build_engine(test_sqlite_url)
        try:
            async with sqlite_engine.begin() as conn:
                # Create base tables without the migrated columns
                await conn.execute(text("CREATE TABLE characters (id VARCHAR PRIMARY KEY, name VARCHAR);"))
                await conn.execute(text("CREATE TABLE scenes (id VARCHAR PRIMARY KEY, title VARCHAR);"))
                await conn.execute(text("CREATE TABLE world_bibles (id VARCHAR PRIMARY KEY, title VARCHAR);"))

                # Run migration
                await conn.run_sync(_migrate_columns)

                # Verify boolean columns were added with valid defaults
                for table in ["characters", "scenes", "world_bibles"]:
                    res = await conn.execute(text(f"PRAGMA table_info({table})"))
                    cols = {row[1]: row for row in res.fetchall()}
                    assert "is_stale" in cols, f"is_stale missing from {table}"
                    dflt = str(cols["is_stale"][4]).lower()
                    assert "false" in dflt or dflt in ("0", "'0'"), f"Unexpected default in {table}: {dflt}"
        finally:
            await sqlite_engine.dispose()


@pytest.mark.asyncio
async def test_safe_execute_savepoint_isolation_on_postgres():
    """
    Requirement 3: On PostgreSQL, individual statement errors must be rolled back to
    savepoint without aborting the overall transaction block.
    """
    # Test savepoint logic using mock connection simulating PostgreSQL dialect
    mock_conn = MagicMock()
    mock_conn.dialect.name = "postgresql"
    mock_nested = MagicMock()
    mock_conn.begin_nested.return_value.__enter__.return_value = mock_nested

    # Case 1: Statement raises exception
    mock_conn.execute.side_effect = Exception("column already exists or syntax error")
    # Should not raise exception
    _safe_execute(mock_conn, text("ALTER TABLE test ADD COLUMN bad_col INTEGER"))
    assert mock_conn.begin_nested.called

    # Case 2: Subsequent statement succeeds because outer transaction is intact
    mock_conn.execute.side_effect = None
    _safe_execute(mock_conn, text("ALTER TABLE test ADD COLUMN good_col INTEGER"))
    assert mock_conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_live_postgres_init_db_no_fallback():
    """
    Integration verification: If live PostgreSQL connection is available in .env,
    verify init_db runs against PostgreSQL and completes without SQLite fallback.
    """
    from pathlib import Path
    from dotenv import dotenv_values
    env_vars = dotenv_values(Path(__file__).parents[2] / ".env")
    raw_url = env_vars.get("DATABASE_URL")
    if not raw_url or "sqlite" in raw_url:
        pytest.skip("No PostgreSQL DATABASE_URL configured in .env")

    db_url = Settings.clean_database_url(raw_url)

    orig_engine = project_repo.engine
    orig_env = project_repo.settings.ENVIRONMENT
    orig_fallback = project_repo.settings.ALLOW_SQLITE_FALLBACK

    pg_engine = build_engine(db_url)
    project_repo.engine = pg_engine
    project_repo.settings.ENVIRONMENT = "production"
    project_repo.settings.ALLOW_SQLITE_FALLBACK = False

    try:
        await init_db()
        assert not str(project_repo.engine.url).startswith("sqlite"), (
            "init_db() illegally fell back to SQLite when connected to PostgreSQL!"
        )
        assert project_repo.engine.url.drivername == "postgresql+asyncpg"
    finally:
        await pg_engine.dispose()
        project_repo.engine = orig_engine
        project_repo.settings.ENVIRONMENT = orig_env
        project_repo.settings.ALLOW_SQLITE_FALLBACK = orig_fallback
