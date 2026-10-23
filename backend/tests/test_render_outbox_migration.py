"""
Unit test suite for TASK-52-09: PostgreSQL & SQLite render_outbox database migration.

Validates:
1. Schema definition, column types, and defaults.
2. Unique constraint and index coverage (job_id, project_id, pending partial index).
3. Payload credential validation guard (zero secrets, SAS tokens, or passwords permitted).
4. Status constraint validation ('pending', 'published', 'failed').
5. Repository CRUD methods for transactional outbox persistence.
6. Migration SQL script integrity and reversibility.
"""

import os
from datetime import datetime, timezone
from pathlib import Path
import pytest
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from backend.app.models.job import GenerationJob
from backend.app.models.outbox import (
    RenderOutbox,
    RenderOutboxBase,
    RenderOutboxCreate,
    RenderOutboxRead,
    assert_no_secrets_in_payload,
)
from backend.app.models.project import Project
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import ProjectRepository, async_session


@pytest.fixture
def canonical_payload():
    return {
        "schema_version": "1.0",
        "job_id": "job-test-outbox-1",
        "project_id": "proj-test-outbox-1",
        "entity_type": "scene",
        "entity_id": "scene-alpha",
        "request_hash": "a" * 64,
        "options": {
            "duration_seconds": 12,
            "fps": 24,
            "resolution": "1280x720",
            "aspect_ratio": "16:9",
            "motion_preset": "slow_pan",
        },
        "enqueued_at": "2026-10-23T04:30:00Z",
        "attempt": 1,
    }


@pytest.mark.asyncio
async def test_render_outbox_table_and_columns_exist():
    """Verify that render_outbox table and all required columns are created by init_db."""
    await project_repo.init_db()

    async with project_repo.engine.connect() as conn:
        columns = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in inspect(sync_conn).get_columns("render_outbox")]
        )

    expected_columns = {
        "id",
        "project_id",
        "job_id",
        "payload",
        "status",
        "attempt_count",
        "last_error",
        "claimed_at",
        "published_at",
        "created_at",
        "updated_at",
    }
    assert expected_columns.issubset(set(columns)), (
        f"Missing columns in render_outbox: {expected_columns - set(columns)}"
    )


@pytest.mark.asyncio
async def test_render_outbox_indexes_exist():
    """Verify that expected indexes exist on render_outbox."""
    await project_repo.init_db()

    async with project_repo.engine.connect() as conn:
        indexes = await conn.run_sync(
            lambda sync_conn: inspect(sync_conn).get_indexes("render_outbox")
        )
        index_names = {idx["name"] for idx in indexes}

    # At least the project index, unique job index, or partial pending index must be registered
    assert any("project_id" in name for name in index_names), "Missing project_id index"
    assert any("job_id" in name for name in index_names), "Missing job_id index"


@pytest.mark.asyncio
async def test_render_outbox_unique_job_id_constraint(canonical_payload):
    """Verify that each render job can have at most one outbox record."""
    await project_repo.init_db()

    async with async_session() as session:
        repo = ProjectRepository(session)
        # Create parent project and job
        project = Project(title="Outbox Unique Test")
        session.add(project)
        await session.commit()
        await session.refresh(project)

        job = GenerationJob(
            project_id=project.id,
            job_type="cinematic_preview",
            status="queued",
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)

        outbox1 = RenderOutbox(
            project_id=project.id,
            job_id=job.id,
            payload=canonical_payload,
            status="pending",
        )
        await repo.create_render_outbox_record(outbox1)

        # Attempt to insert second outbox record with identical job_id
        outbox2 = RenderOutbox(
            project_id=project.id,
            job_id=job.id,
            payload=canonical_payload,
            status="pending",
        )
        session.add(outbox2)
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()


@pytest.mark.asyncio
async def test_render_outbox_status_validation(canonical_payload):
    """Verify that invalid statuses are rejected by model validation."""
    # Valid statuses must pass
    for valid_status in ["pending", "published", "failed"]:
        outbox = RenderOutbox(
            project_id="proj-1",
            job_id="job-1",
            payload=canonical_payload,
            status=valid_status,
        )
        assert outbox.status == valid_status

    # Invalid status must raise ValueError
    with pytest.raises(ValueError, match="Invalid status"):
        RenderOutbox(
            project_id="proj-1",
            job_id="job-1",
            payload=canonical_payload,
            status="unknown_status",
        )


def test_render_outbox_payload_secret_guard(canonical_payload):
    """Verify that credential leaks into outbox payload are strictly rejected."""
    # Valid payload passes
    assert_no_secrets_in_payload(canonical_payload)

    # Payloads containing forbidden keys must fail
    leak_examples = [
        {"secret": "xyz"},
        {"database_url": "postgresql://user:pass@host/db"},
        {"connection_string": "Endpoint=sb://..."},
        {"account_key": "abc123key"},
        {"api_key": "live_key_999"},
        {"sas": "?sv=2020-08-04&sp=a"},
        {"client_secret": "my-secret"},
        {"nested": {"auth_token": "token123"}},
        {"nested_list": [{"password": "hunter2"}]},
    ]

    for leaked in leak_examples:
        test_payload = dict(canonical_payload)
        test_payload.update(leaked)
        with pytest.raises(ValueError, match="Forbidden secret key"):
            assert_no_secrets_in_payload(test_payload)

        with pytest.raises(ValueError, match="Forbidden secret key"):
            RenderOutbox(
                project_id="proj-1",
                job_id="job-1",
                payload=test_payload,
                status="pending",
            )


@pytest.mark.asyncio
async def test_render_outbox_repository_crud(canonical_payload):
    """Verify complete CRUD lifecycle via ProjectRepository."""
    await project_repo.init_db()

    async with async_session() as session:
        repo = ProjectRepository(session)

        # Setup test entities
        project = Project(title="Repository CRUD Outbox Test")
        session.add(project)
        await session.commit()
        await session.refresh(project)

        job = GenerationJob(
            project_id=project.id,
            job_type="cinematic_preview",
            status="queued",
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)

        # 1. Create outbox record
        outbox = RenderOutbox(
            project_id=project.id,
            job_id=job.id,
            payload=canonical_payload,
            status="pending",
        )
        created = await repo.create_render_outbox_record(outbox)
        assert created.id is not None
        assert created.status == "pending"
        assert created.attempt_count == 0

        # 2. Get by job_id
        fetched = await repo.get_render_outbox_by_job_id(job.id)
        assert fetched is not None
        assert fetched.id == created.id
        assert fetched.job_id == job.id

        # 3. List pending records
        pending_list = await repo.get_pending_render_outbox_records(limit=100)
        job_ids = [p.job_id for p in pending_list]
        assert job.id in job_ids

        # 4. Update status to failed with error
        now = datetime.now(timezone.utc)
        updated_failed = await repo.update_render_outbox_status(
            job_id=job.id,
            status="failed",
            last_error="Transient connection timeout",
            increment_attempt=True,
        )
        assert updated_failed is not None
        assert updated_failed.status == "failed"
        assert updated_failed.attempt_count == 1
        assert updated_failed.last_error == "Transient connection timeout"

        # 5. Update status to published
        updated_pub = await repo.update_render_outbox_status(
            job_id=job.id,
            status="published",
            published_at=now,
        )
        assert updated_pub is not None
        assert updated_pub.status == "published"
        assert updated_pub.published_at is not None

        # 6. Verify to_read_schema
        read_model = updated_pub.to_read_schema()
        assert isinstance(read_model, RenderOutboxRead)
        assert read_model.id == created.id
        assert read_model.status == "published"


def test_sql_migration_file_integrity():
    """Verify backend/migrations/0001_create_render_outbox.sql syntax and safety."""
    migration_path = Path("backend/migrations/0001_create_render_outbox.sql")
    assert migration_path.exists(), "Migration SQL file does not exist"

    content = migration_path.read_text(encoding="utf-8")
    assert "CREATE TABLE IF NOT EXISTS render_outbox" in content
    assert "job_id VARCHAR(64) NOT NULL UNIQUE REFERENCES generation_jobs(id)" in content
    assert "payload JSONB NOT NULL" in content
    assert "CHECK (status IN ('pending', 'published', 'failed'))" in content
    assert "idx_render_outbox_pending" in content
    assert "DROP TABLE IF EXISTS render_outbox" in content

    # Security check: zero credentials in migration file
    for secret_keyword in ["password", "secret", "private_key", "sas_token"]:
        assert secret_keyword not in content.lower()
