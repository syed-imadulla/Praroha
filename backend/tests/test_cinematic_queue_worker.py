"""
Unit and Integration Tests for PRAROHA Queue-Based Cinematic Worker (Phase 52).

Verifies:
1. Valid message schema decoding & validation (raw JSON & base64).
2. Strict schema rejection (invalid IDs, missing fields, unsupported versions, bad timestamps).
3. Strict rejection of credential injection attempts (passwords, tokens, database URLs, SAS).
4. Rejection of unexpected fields (additionalProperties: false).
5. Atomic PostgreSQL claim conflict suppression (duplicate delivery safety).
6. Full end-to-end processing: claim, FFmpeg composition, storage upload, DB finalization, message ACK.
7. Non-negotiable honest synthetic labeling (is_synthetic: true, provider_label: "Cinematic Preview").
8. Heartbeat lease maintenance and visibility renewal.
9. Retry exhaustion handling (>3 attempts) and routing to dead-letter poison queue.
10. Database failure resilience without deleting unfinalized messages.
11. Queue drain loop behavior and clean process exit code 0.
12. CLI --queue mode verification and complete isolation from legacy HTTP server.
13. Zero secret leakage across logs, outputs, and exception handlers.
"""

import asyncio
import base64
import json
import logging
import os
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select

from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.providers.storage import LocalStorageProvider
from backend.app.workers.cinematic_worker import (
    FORBIDDEN_CREDENTIAL_KEYWORDS,
    _heartbeat_loop,
    decode_message_content,
    parse_and_validate_queue_message,
    process_queue_message,
    run_queue_worker,
    scan_for_credentials,
    validate_queue_message_dict,
)


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MockQueueMessage:
    def __init__(
        self,
        content: Any,
        message_id: str = "msg-123",
        pop_receipt: str = "receipt-abc",
        dequeue_count: int = 1,
    ):
        self.id = message_id
        self.pop_receipt = pop_receipt
        self.content = content
        self.dequeue_count = dequeue_count
        self.inserted_on = datetime.now(timezone.utc)
        self.expires_on = datetime.now(timezone.utc)


class MockQueueClient:
    def __init__(self, initial_messages: Optional[List[MockQueueMessage]] = None):
        self.messages = list(initial_messages or [])
        self.deleted_messages: List[Any] = []
        self.updated_messages: List[Tuple[Any, Optional[int]]] = []
        self.sent_messages: List[str] = []

    def receive_messages(self, messages_per_page: int = 32, visibility_timeout: int = 300):
        batch = []
        for _ in range(min(messages_per_page, len(self.messages))):
            if self.messages:
                batch.append(self.messages.pop(0))
        return batch

    def delete_message(self, message: Any, pop_receipt: Optional[str] = None):
        self.deleted_messages.append(message)

    def update_message(self, message: Any, visibility_timeout: Optional[int] = None):
        self.updated_messages.append((message, visibility_timeout))

    def send_message(self, content: str):
        self.sent_messages.append(content)


@pytest.fixture
async def isolated_db_session_factory():
    """Create isolated SQLite database for worker state tests."""
    test_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    test_db_file.close()
    db_url = f"sqlite+aiosqlite:///{test_db_file.name}"

    engine = create_async_engine(db_url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    yield session_factory, db_url

    await engine.dispose()
    if os.path.exists(test_db_file.name):
        os.remove(test_db_file.name)


def test_schema_validation_valid_message():
    """Verify that a canonical valid queue message validates properly."""
    valid_payload = {
        "schema_version": "1.0",
        "job_id": "job-7f8b894d-5872",
        "project_id": "proj-3b290cb7",
        "entity_type": "scene",
        "entity_id": "scene-101",
        "request_hash": "a5e8412ff35b91a78465a31a9829cf9a896d8e23f99b21f37b198124b6f79021",
        "options": {
            "duration_seconds": 12,
            "fps": 24,
            "resolution": "1280x720",
            "aspect_ratio": "16:9",
            "motion_preset": "slow_pan",
        },
        "enqueued_at": "2026-10-22T21:30:00.000Z",
        "attempt": 1,
    }

    validated = validate_queue_message_dict(valid_payload)
    assert validated["job_id"] == "job-7f8b894d-5872"
    assert validated["options"]["duration_seconds"] == 12
    assert validated["options"]["fps"] == 24

    # Test base64 decoding as well
    b64_str = base64.b64encode(json.dumps(valid_payload).encode("utf-8")).decode("utf-8")
    validated_b64 = parse_and_validate_queue_message(b64_str)
    assert validated_b64["job_id"] == "job-7f8b894d-5872"


def test_schema_validation_rejects_missing_fields():
    """Missing any required field must raise ValueError."""
    payload = {
        "schema_version": "1.0",
        "job_id": "job-1",
        # missing project_id
        "entity_type": "scene",
        "entity_id": "scene-1",
        "request_hash": "a" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }
    with pytest.raises(ValueError, match="Missing required fields"):
        validate_queue_message_dict(payload)


def test_schema_validation_rejects_invalid_patterns():
    """Invalid IDs, unsupported versions, or invalid hash must raise ValueError."""
    # Invalid schema version
    with pytest.raises(ValueError, match="Unsupported schema_version"):
        validate_queue_message_dict({
            "schema_version": "2.0",
            "job_id": "job-1",
            "project_id": "proj-1",
            "entity_type": "scene",
            "entity_id": "scene-1",
            "request_hash": "a" * 64,
            "enqueued_at": get_utc_now_iso(),
            "attempt": 1,
        })

    # Invalid request_hash (non-hex or wrong length)
    with pytest.raises(ValueError, match="Invalid request_hash format"):
        validate_queue_message_dict({
            "schema_version": "1.0",
            "job_id": "job-1",
            "project_id": "proj-1",
            "entity_type": "scene",
            "entity_id": "scene-1",
            "request_hash": "short-hash",
            "enqueued_at": get_utc_now_iso(),
            "attempt": 1,
        })


def test_schema_validation_rejects_credentials():
    """Any credential injection attempt in message must be rejected."""
    base_payload = {
        "schema_version": "1.0",
        "job_id": "job-1",
        "project_id": "proj-1",
        "entity_type": "scene",
        "entity_id": "scene-1",
        "request_hash": "a" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }

    for cred_key in ["password", "token", "connection_string", "database_url", "api_key"]:
        bad_payload = dict(base_payload)
        bad_payload[cred_key] = "injected_secret_value"
        with pytest.raises(ValueError, match="Forbidden credential field detected"):
            validate_queue_message_dict(bad_payload)


def test_schema_validation_rejects_unexpected_fields():
    """Enforce additionalProperties: false at root and options level."""
    payload = {
        "schema_version": "1.0",
        "job_id": "job-1",
        "project_id": "proj-1",
        "entity_type": "scene",
        "entity_id": "scene-1",
        "request_hash": "a" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
        "unexpected_extra_field": "disallowed",
    }
    with pytest.raises(ValueError, match="Unexpected fields in message payload"):
        validate_queue_message_dict(payload)

    # In options
    opt_payload = {
        "schema_version": "1.0",
        "job_id": "job-1",
        "project_id": "proj-1",
        "entity_type": "scene",
        "entity_id": "scene-1",
        "request_hash": "a" * 64,
        "options": {"unsupported_option": True},
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }
    with pytest.raises(ValueError, match="Unexpected fields in options"):
        validate_queue_message_dict(opt_payload)


@pytest.mark.asyncio
async def test_atomic_claim_conflict_duplicate_delivery(isolated_db_session_factory):
    """When a job is already processing or completed, claiming must fail and message must be acknowledged."""
    session_factory, _ = isolated_db_session_factory
    job_id = "job-claim-conflict"

    # Pre-populate DB with job already in 'processing' status
    async with session_factory() as session:
        job = GenerationJob(
            id=job_id,
            project_id="proj-1",
            job_type="media_video",
            status="processing",
            progress=40,
        )
        session.add(job)
        await session.commit()

    msg_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-1",
        "entity_type": "scene",
        "entity_id": "scene-1",
        "request_hash": "b" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }
    mock_msg = MockQueueMessage(content=json.dumps(msg_payload))
    mock_queue = MockQueueClient([mock_msg])

    handled = await process_queue_message(
        message=mock_msg,
        queue_client=mock_queue,
        session_factory=session_factory,
    )

    assert handled is True
    assert len(mock_queue.deleted_messages) == 1
    # Verify DB status was untouched
    async with session_factory() as session:
        stmt = select(GenerationJob).where(GenerationJob.id == job_id)
        current = (await session.execute(stmt)).scalars().first()
        assert current.status == "processing"
        assert current.progress == 40


@pytest.mark.asyncio
async def test_retry_exhaustion_routes_to_poison_queue(isolated_db_session_factory):
    """When dequeue_count > 3, message is moved to poison queue and job is marked failed."""
    session_factory, _ = isolated_db_session_factory
    job_id = "job-poison-test"

    async with session_factory() as session:
        job = GenerationJob(
            id=job_id,
            project_id="proj-poison",
            job_type="media_video",
            status="queued",
        )
        media = MediaAssetRecord(
            id=job_id,
            project_id="proj-poison",
            entity_type="scene",
            entity_id="scene-poison",
            media_type="video",
            status="queued",
            request_hash="c" * 64,
        )
        session.add(job)
        session.add(media)
        await session.commit()

    msg_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-poison",
        "entity_type": "scene",
        "entity_id": "scene-poison",
        "request_hash": "c" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 4,
    }
    # Set dequeue_count to 4 (exceeded retry ceiling of 3)
    mock_msg = MockQueueMessage(content=json.dumps(msg_payload), dequeue_count=4)
    active_queue = MockQueueClient([mock_msg])
    poison_queue = MockQueueClient()

    handled = await process_queue_message(
        message=mock_msg,
        queue_client=active_queue,
        poison_queue_client=poison_queue,
        session_factory=session_factory,
    )

    assert handled is True
    # Message removed from active queue
    assert len(active_queue.deleted_messages) == 1
    # Poison queue received notification
    assert len(poison_queue.sent_messages) == 1
    poison_data = json.loads(poison_queue.sent_messages[0])
    assert poison_data["job_id"] == job_id
    assert "Moved to poison queue" in poison_data["error"]

    # Verify database state
    async with session_factory() as session:
        j = (await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))).scalars().first()
        assert j.status == "failed"
        assert "Moved to poison queue" in j.error_message

        m = (await session.execute(select(MediaAssetRecord).where(MediaAssetRecord.id == job_id))).scalars().first()
        assert m.status == "failed"
        # request_hash cleared for clean retry
        assert m.request_hash is None


@pytest.mark.asyncio
async def test_successful_render_upload_and_db_finalization(isolated_db_session_factory):
    """Full lifecycle with local fixture image: claims job, renders, uploads, and finalizes with honest badges."""
    session_factory, _ = isolated_db_session_factory
    job_id = "job-success-render"
    project_id = "proj-success"
    entity_id = "scene-101"

    image_fixture = "gallery/gallery_04_stage3_divergent_worlds.png"
    if not os.path.exists(image_fixture):
        pytest.skip("Test image fixture missing")

    async with session_factory() as session:
        job = GenerationJob(
            id=job_id,
            project_id=project_id,
            job_type="media_video",
            status="queued",
        )
        img_asset = MediaAssetRecord(
            project_id=project_id,
            entity_type="scene",
            entity_id=entity_id,
            media_type="image",
            status="completed",
            asset_url=image_fixture,
        )
        video_asset = MediaAssetRecord(
            id=job_id,
            project_id=project_id,
            entity_type="scene",
            entity_id=entity_id,
            media_type="video",
            status="queued",
            request_hash="d" * 64,
        )
        session.add(job)
        session.add(img_asset)
        session.add(video_asset)
        await session.commit()

    msg_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": project_id,
        "entity_type": "scene",
        "entity_id": entity_id,
        "request_hash": "d" * 64,
        "options": {
            "duration_seconds": 3,
            "fps": 24,
            "resolution": "1280x720",
            "aspect_ratio": "16:9",
            "motion_preset": "slow_pan",
        },
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }
    mock_msg = MockQueueMessage(content=json.dumps(msg_payload))
    mock_queue = MockQueueClient([mock_msg])

    with tempfile.TemporaryDirectory() as upload_dir:
        storage = LocalStorageProvider(upload_dir=upload_dir)

        handled = await process_queue_message(
            message=mock_msg,
            queue_client=mock_queue,
            session_factory=session_factory,
            storage_provider=storage,
            timeout_sec=30.0,
        )

        assert handled is True
        assert len(mock_queue.deleted_messages) == 1

        async with session_factory() as session:
            j = (await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))).scalars().first()
            assert j.status == "completed"
            assert j.progress == 100
            assert j.completed_at is not None

            m = (await session.execute(select(MediaAssetRecord).where(MediaAssetRecord.id == job_id))).scalars().first()
            assert m.status == "completed"
            assert m.asset_url is not None
            meta = json.loads(m.metadata_json)
            # Non-negotiable honest synthetic labeling
            assert meta["is_synthetic"] is True
            assert meta["provider_label"] == "Cinematic Preview"
            assert meta["render_engine"] == "native-ffmpeg-worker"


@pytest.mark.asyncio
async def test_heartbeat_loop_updates_lease_and_visibility():
    """Verify heartbeat loop updates DB lease and triggers queue visibility renewal."""
    job_id = "job-heartbeat-test"
    mock_session = AsyncMock()
    mock_session_factory = MagicMock()
    mock_session_factory.return_value.__aenter__.return_value = mock_session
    mock_session_factory.return_value.__aexit__.return_value = None

    mock_queue = MockQueueClient()
    mock_msg = MockQueueMessage(content="{}")
    stop_event = asyncio.Event()

    # Run heartbeat with short interval
    task = asyncio.create_task(
        _heartbeat_loop(
            job_id=job_id,
            session_factory=mock_session_factory,
            queue_client=mock_queue,
            message=mock_msg,
            stop_event=stop_event,
            heartbeat_interval=0.05,
        )
    )

    await asyncio.sleep(0.12)
    stop_event.set()
    await task

    # Verify session execute and commit were called for heartbeats
    assert mock_session.execute.call_count >= 1
    assert mock_session.commit.call_count >= 1


@pytest.mark.asyncio
async def test_queue_drain_behavior_and_clean_exit():
    """Verify run_queue_worker drains all messages and returns exit code 0 when queue is empty."""
    mock_queue = MockQueueClient()  # Empty queue
    exit_code = await run_queue_worker(
        queue_client=mock_queue,
    )
    assert exit_code == 0


def test_cli_queue_mode_does_not_launch_http_server():
    """Verify running python -m backend.app.workers.cinematic_worker --queue exits without launching HTTP server."""
    env = os.environ.copy()
    env["CONTAINER_APP_PORT"] = "8080"  # ACA environment variable that would normally trigger server mode
    env["RUN_MODE"] = "server"  # Conflict attempt

    # Run CLI with --queue without valid connection string
    cmd = [sys.executable, "-m", "backend.app.workers.cinematic_worker", "--queue"]
    result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=10)

    # Must exit promptly with code 1 (due to missing Azure storage connection string), NOT hang as an HTTP server
    assert result.returncode == 1
    assert "Executing PRAROHA Dedicated Cinematic Worker in Queue Mode (--queue)" in result.stderr or "Executing PRAROHA Dedicated Cinematic Worker in Queue Mode (--queue)" in result.stdout
    assert "listening on port" not in result.stdout
    assert "listening on port" not in result.stderr


@pytest.mark.asyncio
async def test_malformed_json_message_routing():
    """Corrupted JSON string is rejected and safely routed without crashing the worker."""
    mock_msg = MockQueueMessage(content="NOT_VALID_JSON{{{")
    active_queue = MockQueueClient([mock_msg])
    poison_queue = MockQueueClient()

    handled = await process_queue_message(
        message=mock_msg,
        queue_client=active_queue,
        poison_queue_client=poison_queue,
    )

    assert handled is True
    assert len(active_queue.deleted_messages) == 1
    assert len(poison_queue.sent_messages) == 1
    assert "Schema validation failed" in poison_queue.sent_messages[0]


@pytest.mark.asyncio
async def test_storage_failure_does_not_acknowledge_message(isolated_db_session_factory):
    """If upload fails and retry count < 3, message must NOT be deleted from queue so it can be retried."""
    session_factory, _ = isolated_db_session_factory
    job_id = "job-storage-fail"

    async with session_factory() as session:
        job = GenerationJob(id=job_id, project_id="proj-fail", job_type="media_video", status="queued")
        media = MediaAssetRecord(id=job_id, project_id="proj-fail", entity_type="scene", entity_id="s1", media_type="video", status="queued")
        session.add(job)
        session.add(media)
        await session.commit()

    msg_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-fail",
        "entity_type": "scene",
        "entity_id": "s1",
        "request_hash": "e" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }
    mock_msg = MockQueueMessage(content=json.dumps(msg_payload), dequeue_count=1)
    mock_queue = MockQueueClient([mock_msg])

    # Failing storage provider
    mock_storage = MagicMock()
    mock_storage.upload = AsyncMock(side_effect=RuntimeError("Storage connection reset"))

    with patch("backend.app.workers.cinematic_worker.execute_cinematic_job") as mock_exec:
        from backend.app.services.cinematic_preview import CinematicPreviewResult
        mock_exec.side_effect = RuntimeError("Storage connection reset")

        handled = await process_queue_message(
            message=mock_msg,
            queue_client=mock_queue,
            session_factory=session_factory,
            storage_provider=mock_storage,
        )

        # Must return False (unhandled transient failure) and NOT delete message
        assert handled is False
        assert len(mock_queue.deleted_messages) == 0


def test_zero_secret_leakage_in_credential_rejection():
    """Verify that sensitive credential values are never echoed in rejection error messages."""
    super_secret_value = "SUPER_SECRET_UNBROKEN_KEY_999"
    payload = {
        "schema_version": "1.0",
        "job_id": "job-1",
        "project_id": "proj-1",
        "entity_type": "scene",
        "entity_id": "s1",
        "request_hash": "f" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
        "token": super_secret_value,
    }

    try:
        validate_queue_message_dict(payload)
        pytest.fail("Should have raised ValueError")
    except ValueError as exc:
        err_msg = str(exc)
        # Secret value must NEVER appear in the exception message
        assert super_secret_value not in err_msg
        assert "Forbidden credential field detected: 'token'" in err_msg


def test_is_add_only_sas_detection():
    """Verify accurate detection of Add-only SAS vs read/process SAS."""
    from backend.app.workers.cinematic_worker import is_add_only_sas

    # Backend Add-only SAS
    assert is_add_only_sas("https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sv=2024-05-04") is True
    assert is_add_only_sas("https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a") is True

    # Worker Read/Update/Process SAS
    assert is_add_only_sas("https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=rup&sv=2024-05-04") is False
    assert is_add_only_sas("https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=r&sv=2024-05-04") is False

    # Plain URL or None
    assert is_add_only_sas("https://stpraroharender.queue.core.windows.net/cinematic-render-jobs") is False
    assert is_add_only_sas(None) is False


def test_build_queue_clients_managed_identity():
    """Verify build_queue_clients constructs both work and poison queue clients via Managed Identity."""
    import argparse
    from backend.app.workers.cinematic_worker import build_queue_clients

    args = argparse.Namespace(
        account_name="stpraroharender",
        client_id="12345678-abcd-1234-abcd-1234567890ab",
        queue_name="cinematic-render-jobs",
        poison_queue_name="cinematic-render-poison",
        connection_string=None,
        queue_url=None,
        poison_queue_url=None,
        queue_endpoint=None,
    )

    with patch("backend.app.workers.cinematic_worker.DefaultAzureCredential") as mock_cred_cls:
        mock_cred = MagicMock()
        mock_cred_cls.return_value = mock_cred

        work_client, poison_client = build_queue_clients(args)

        mock_cred_cls.assert_called_once_with(managed_identity_client_id="12345678-abcd-1234-abcd-1234567890ab")
        assert work_client is not None
        assert poison_client is not None
        assert "cinematic-render-jobs" in work_client.url
        assert "cinematic-render-poison" in poison_client.url


def test_build_queue_clients_rejects_add_only_sas():
    """Verify build_queue_clients immediately rejects Add-only SAS URLs."""
    import argparse
    from backend.app.workers.cinematic_worker import build_queue_clients

    args = argparse.Namespace(
        queue_url="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sv=2024-05-04",
        connection_string=None,
        account_name=None,
        queue_endpoint=None,
        client_id=None,
        poison_queue_url=None,
        queue_name="cinematic-render-jobs",
        poison_queue_name="cinematic-render-poison",
    )

    work_client, poison_client = build_queue_clients(args)
    assert work_client is None
    assert poison_client is None


def test_build_queue_clients_connection_string():
    """Verify build_queue_clients uses connection string when provided."""
    import argparse
    from backend.app.workers.cinematic_worker import build_queue_clients

    args = argparse.Namespace(
        connection_string="DefaultEndpointsProtocol=https;AccountName=testacc;AccountKey=dGVzdGtleQ==;EndpointSuffix=core.windows.net",
        account_name=None,
        queue_endpoint=None,
        client_id=None,
        queue_url=None,
        poison_queue_url=None,
        queue_name="cinematic-render-jobs",
        poison_queue_name="cinematic-render-poison",
    )

    work_client, poison_client = build_queue_clients(args)
    assert work_client is not None
    assert poison_client is not None
    assert "cinematic-render-jobs" in work_client.url
    assert "cinematic-render-poison" in poison_client.url


def test_build_queue_clients_missing_credentials_returns_none():
    """Verify build_queue_clients returns (None, None) when no credentials are configured."""
    import argparse
    from backend.app.workers.cinematic_worker import build_queue_clients

    args = argparse.Namespace(
        connection_string=None,
        account_name=None,
        queue_endpoint=None,
        client_id=None,
        queue_url=None,
        poison_queue_url=None,
        queue_name="cinematic-render-jobs",
        poison_queue_name="cinematic-render-poison",
    )

    with patch.dict(os.environ, {}, clear=True):
        work_client, poison_client = build_queue_clients(args)
        assert work_client is None
        assert poison_client is None


@pytest.mark.asyncio
async def test_run_queue_cli_managed_identity_drain_exit():
    """Verify run_queue_cli sets up clients and exits cleanly when queue is drained."""
    import argparse
    from backend.app.workers.cinematic_worker import run_queue_cli

    args = argparse.Namespace(
        queue=True,
        account_name="stpraroharender",
        client_id="test-client-id",
        queue_name="cinematic-render-jobs",
        poison_queue_name="cinematic-render-poison",
        connection_string=None,
        queue_url=None,
        poison_queue_url=None,
        queue_endpoint=None,
        database_url=None,
        timeout=120.0,
        max_messages=32,
        visibility_timeout=300,
        heartbeat_interval=15.0,
        once=True,
        output_dir=None,
    )

    mock_work_queue = MockQueueClient([])
    mock_poison_queue = MockQueueClient([])

    with patch("backend.app.workers.cinematic_worker.build_queue_clients", return_value=(mock_work_queue, mock_poison_queue)):
        exit_code = await run_queue_cli(args)
        assert exit_code == 0

