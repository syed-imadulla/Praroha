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
async def test_init_db_refuses_production_supabase_in_test_environment(monkeypatch):
    """
    Requirement: Automated tests must NEVER execute init_db() or schema migrations against
    the production Supabase database. Attempting to do so must raise RuntimeError immediately.
    """
    prod_pg_url = "postgresql+asyncpg://postgres:fake-password@db.stxnxkzaftmwcbtvgzbm.supabase.co:5432/postgres"
    fake_engine = build_engine(prod_pg_url)
    project_repo.engine = fake_engine

    try:
        with pytest.raises(RuntimeError, match="PRODUCTION DATABASE GUARD BLOCKED init_db()"):
            await init_db()
    finally:
        await fake_engine.dispose()


@pytest.mark.asyncio
async def test_read_only_schema_audit_mode_guard(monkeypatch):
    """
    Requirement: Read-only schema audits against production Supabase are permitted ONLY
    via explicit read-only query inspection and must NEVER execute init_db() or DDL.
    """
    monkeypatch.setenv("PYTEST_CURRENT_TEST", "test_read_only_schema_audit_mode_guard")
    prod_url = "postgresql+asyncpg://postgres:fake-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    assert Settings.is_production_database_url(prod_url) is True

    fake_engine = build_engine(prod_url)
    project_repo.engine = fake_engine

    try:
        # Running init_db() against production in test mode must strictly fail
        with pytest.raises(RuntimeError, match="PRODUCTION DATABASE GUARD BLOCKED init_db()"):
            await init_db()
    finally:
        await fake_engine.dispose()


@pytest.mark.asyncio
async def test_disposable_postgres_isolation():
    """
    Requirement: PostgreSQL integration tests must ONLY run against disposable test databases
    (e.g., TEST_POSTGRESQL_DATABASE_URL), and must never point to production Supabase.
    """
    test_pg_url = os.environ.get("TEST_POSTGRESQL_DATABASE_URL")
    if not test_pg_url:
        pytest.skip("No disposable TEST_POSTGRESQL_DATABASE_URL configured")

    if Settings.is_production_database_url(test_pg_url):
        pytest.fail("CRITICAL: TEST_POSTGRESQL_DATABASE_URL illegally points to production Supabase!")

    clean_url = Settings.clean_database_url(test_pg_url)
    pg_engine = build_engine(clean_url)
    project_repo.engine = pg_engine
    project_repo.settings.ENVIRONMENT = "test"
    project_repo.settings.ALLOW_SQLITE_FALLBACK = False

    try:
        await init_db()
        assert not str(project_repo.engine.url).startswith("sqlite")
    finally:
        await pg_engine.dispose()


def test_production_runtime_validation_performs_no_ddl():
    """
    Requirement: Production runtime schema validation MUST perform ZERO DDL operations
    (no CREATE, ALTER, DROP statements). It must only inspect existing tables/columns.
    """
    mock_conn = MagicMock()
    with patch("sqlalchemy.inspect") as mock_inspect:
        inspector = MagicMock()
        mock_inspect.return_value = inspector
        # Setup valid schema
        inspector.get_table_names.return_value = project_repo.REQUIRED_TABLES
        inspector.get_columns.side_effect = lambda table: [
            {"name": col} for col in project_repo.REQUIRED_COLUMNS.get(table, ["id"])
        ]
        inspector.get_indexes.side_effect = lambda table: [
            {"name": idx} for idx in project_repo.REQUIRED_INDEXES.get(table, [])
        ]
        inspector.get_unique_constraints.return_value = []

        # Execute validation
        project_repo.validate_production_schema(mock_conn)

        # Confirm connection.execute was NEVER called with any DDL
        assert mock_conn.execute.call_count == 0


def test_production_runtime_validation_fails_on_missing_table():
    """
    Requirement: If a required table is missing in production, validation must raise
    RuntimeError with an actionable message and NOT apply DDL or fallback to SQLite.
    """
    mock_conn = MagicMock()
    with patch("sqlalchemy.inspect") as mock_inspect:
        inspector = MagicMock()
        mock_inspect.return_value = inspector
        # Table 'render_outbox' is missing
        inspector.get_table_names.return_value = [
            t for t in project_repo.REQUIRED_TABLES if t != "render_outbox"
        ]

        with pytest.raises(RuntimeError, match="missing required tables: \\['render_outbox'\\]"):
            project_repo.validate_production_schema(mock_conn)


def test_production_runtime_validation_fails_on_missing_column():
    """
    Requirement: If a required column (e.g. is_stale) is missing in production,
    validation must raise RuntimeError with clear diagnosis.
    """
    mock_conn = MagicMock()
    with patch("sqlalchemy.inspect") as mock_inspect:
        inspector = MagicMock()
        mock_inspect.return_value = inspector
        inspector.get_table_names.return_value = project_repo.REQUIRED_TABLES
        # Characters missing 'is_stale'
        def cols_for_table(table):
            cols = project_repo.REQUIRED_COLUMNS.get(table, ["id"])
            if table == "characters":
                return [{"name": c} for c in cols if c != "is_stale"]
            return [{"name": c} for c in cols]
        inspector.get_columns.side_effect = cols_for_table

        with pytest.raises(RuntimeError, match="missing required columns: \\['characters.is_stale'\\]"):
            project_repo.validate_production_schema(mock_conn)


def test_production_runtime_validation_fails_on_missing_index():
    """
    Requirement: If a required index/constraint is missing in production,
    validation must raise RuntimeError.
    """
    mock_conn = MagicMock()
    with patch("sqlalchemy.inspect") as mock_inspect:
        inspector = MagicMock()
        mock_inspect.return_value = inspector
        inspector.get_table_names.return_value = project_repo.REQUIRED_TABLES
        inspector.get_columns.side_effect = lambda table: [
            {"name": col} for col in project_repo.REQUIRED_COLUMNS.get(table, ["id"])
        ]
        # Missing uq_render_outbox_job_id
        def indexes_for_table(table):
            idxs = project_repo.REQUIRED_INDEXES.get(table, [])
            if table == "render_outbox":
                return [{"name": i} for i in idxs if i != "uq_render_outbox_job_id"]
            return [{"name": i} for i in idxs]
        inspector.get_indexes.side_effect = indexes_for_table
        inspector.get_unique_constraints.return_value = []

        with pytest.raises(RuntimeError, match="missing required indexes/constraints: \\['render_outbox:uq_render_outbox_job_id'\\]"):
            project_repo.validate_production_schema(mock_conn)


@pytest.mark.asyncio
async def test_disposable_sqlite_development_path_supported():
    """
    Requirement: In development/test with isolated SQLite database,
    automatic initialization (create_all and _migrate_columns) operates smoothly.
    """
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        dev_url = f"sqlite+aiosqlite:///{tmp.name}"
        dev_engine = build_engine(dev_url)
        project_repo.engine = dev_engine
        project_repo.settings.ENVIRONMENT = "development"
        project_repo.settings.ALLOW_SQLITE_FALLBACK = False

        try:
            await init_db()
            assert str(project_repo.engine.url).startswith("sqlite")
        finally:
            await dev_engine.dispose()


@pytest.mark.asyncio
async def test_init_db_in_production_calls_validation_with_zero_ddl(monkeypatch):
    """
    Requirement: When ENVIRONMENT=production and ALLOW_PRODUCTION_DB_MIGRATIONS=False,
    init_db() invokes validate_production_schema() on a read-only connection and performs ZERO DDL.
    """
    monkeypatch.setattr(project_repo.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(project_repo.settings, "ALLOW_PRODUCTION_DB_MIGRATIONS", False)
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)

    fake_pg_url = "postgresql+asyncpg://disposable_user:pass@127.0.0.1:5432/disposable_db"
    assert Settings.is_production_database_url(fake_pg_url) is False

    mock_engine = MagicMock()
    mock_engine.url.drivername = "postgresql+asyncpg"
    mock_conn = MagicMock()

    # Async context manager for engine.connect()
    mock_engine.connect.return_value.__aenter__.return_value = mock_conn
    mock_conn.run_sync = AsyncMock()

    project_repo.engine = mock_engine

    with patch("backend.app.repositories.project_repo.validate_production_schema") as mock_val:
        await init_db()
        assert mock_conn.run_sync.called
        # Verify connect was called, but begin (transaction for DDL) was NOT called
        assert mock_engine.connect.called
        assert mock_engine.begin.call_count == 0
