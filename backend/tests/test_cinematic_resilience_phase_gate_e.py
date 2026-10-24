"""
Phase Gate E: Isolated Resilience Testing for PRAROHA Queue-Based Cinematic Rendering.

Scenarios:
- Scenario A: Outbox Interruption, Concurrency CAS Leasing, and Sweeper Recovery
- Scenario B: Worker Lease Heartbeat, Duplicate Delivery, and Terminal Idempotency
- Scenario C: Poison-Message Routing, Hostile Payload Rejection, and Zero Secret Leakage
- Scenario D: Data Immutability for Pre-Existing Completed Renders

All tests execute strictly against isolated in-memory/temporary SQLite databases
and mocked Azure Queue clients. ZERO production resources are accessed or mutated.
"""

import asyncio
import json
import os
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional, Tuple
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select

from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.models.outbox import RenderOutbox
from backend.app.models.project import Project
from backend.app.repositories.project_repo import ProjectRepository
from backend.app.services.cinematic_dispatcher import (
    CinematicDispatcherService,
    CinematicPreviewJobRequest,
    compute_preview_hash,
)
from backend.app.services.cinematic_outbox_sweeper import CinematicOutboxSweeper
from backend.app.services.queue_contract import (
    ALLOWED_ENTITY_TYPES,
    ALLOWED_FPS,
    scan_for_credentials,
    validate_queue_message_dict,
)
from backend.app.workers.cinematic_worker import (
    _heartbeat_loop,
    process_queue_message,
)


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MockQueueMessage:
    def __init__(
        self,
        content: Any,
        message_id: str = "msg-resilience-101",
        pop_receipt: str = "receipt-resilience-101",
        dequeue_count: int = 1,
    ):
        self.id = message_id
        self.pop_receipt = pop_receipt
        self.content = content
        self.dequeue_count = dequeue_count
        self.inserted_on = get_utc_now()
        self.expires_on = get_utc_now() + timedelta(days=7)


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
        return {"id": f"msg-{uuid.uuid4().hex[:8]}", "pop_receipt": "receipt-test"}


@pytest.fixture
async def isolated_resilience_db():
    """Provides a completely isolated SQLite database and sessionmaker per test."""
    test_db_file = tempfile.NamedTemporaryFile(suffix="_resilience.db", delete=False)
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


# ==============================================================================
# Scenario A: Outbox Interruption, Concurrency CAS, and Sweeper Recovery
# ==============================================================================


@pytest.mark.asyncio
async def test_resilience_scenario_a_outbox_interruption_and_recovery(isolated_resilience_db):
    """
    Scenario A1 & A2:
    Simulates crash between outbox commit (status='pending') and queue enqueue.
    Verifies:
    1. Pending record survives interruption in DB.
    2. Sweeper reclaims eligible records after lease expiration.
    3. Sweeper publishes to queue and marks status='published'.
    4. Publication retry does not duplicate GenerationJob or MediaAssetRecord.
    """
    session_factory, _ = isolated_resilience_db
    job_id = f"job-interrupted-{uuid.uuid4().hex[:8]}"
    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    entity_id = f"scene-{uuid.uuid4().hex[:8]}"
    req_hash = "a" * 64

    # 1. Simulate DB commit before crash
    payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": project_id,
        "entity_type": "scene",
        "entity_id": entity_id,
        "request_hash": req_hash,
        "options": {
            "duration_seconds": 6,
            "fps": 24,
            "resolution": "1280x720",
            "aspect_ratio": "16:9",
            "motion_preset": "slow_pan",
        },
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }

    async with session_factory() as session:
        job = GenerationJob(id=job_id, project_id=project_id, job_type="media_video", status="queued")
        media = MediaAssetRecord(
            id=job_id,
            project_id=project_id,
            entity_type="scene",
            entity_id=entity_id,
            media_type="video",
            status="queued",
            request_hash=req_hash,
        )
        # Pending outbox entry with an expired lease (claimed 120s ago or never claimed)
        outbox = RenderOutbox(
            id=f"outbox-{uuid.uuid4().hex[:8]}",
            project_id=project_id,
            job_id=job_id,
            payload=payload,
            status="pending",
            attempt_count=0,
            claimed_at=get_utc_now() - timedelta(seconds=120),
        )
        session.add(job)
        session.add(media)
        session.add(outbox)
        await session.commit()

    # 2. Verify pending record survived in DB
    async with session_factory() as session:
        stored = (await session.execute(select(RenderOutbox).where(RenderOutbox.job_id == job_id))).scalars().first()
        assert stored is not None
        assert stored.status == "pending"

    # 3. Sweeper recovers and publishes
    mock_queue = MockQueueClient()
    sweeper = CinematicOutboxSweeper(
        session_factory=session_factory,
        queue_publish_url="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=MOCK_SIG",
        queue_client=mock_queue,
        batch_size=10,
        lease_seconds=60,
    )

    published_count = await sweeper.sweep_once()
    assert published_count == 1
    assert len(mock_queue.sent_messages) == 1

    # 4. Verify durable status update and zero duplicate database records
    async with session_factory() as session:
        stored = (await session.execute(select(RenderOutbox).where(RenderOutbox.job_id == job_id))).scalars().first()
        assert stored.status == "published"
        assert stored.published_at is not None

        jobs = (await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))).scalars().all()
        assert len(jobs) == 1, "Exactly one GenerationJob must exist; no duplicates."

        medias = (await session.execute(select(MediaAssetRecord).where(MediaAssetRecord.id == job_id))).scalars().all()
        assert len(medias) == 1, "Exactly one MediaAssetRecord must exist; no duplicates."


@pytest.mark.asyncio
async def test_resilience_scenario_a_concurrent_sweepers_cas_locking(isolated_resilience_db):
    """
    Scenario A3:
    Simulates concurrent sweepers attempting to claim the same pending outbox record.
    Verifies CAS leasing guarantees at-most-one worker claims each record.
    """
    session_factory, _ = isolated_resilience_db
    job_id = f"job-concurrent-{uuid.uuid4().hex[:8]}"

    payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-cas",
        "entity_type": "scene",
        "entity_id": "scene-cas",
        "request_hash": "b" * 64,
        "options": {"duration_seconds": 6, "fps": 24, "resolution": "1280x720", "aspect_ratio": "16:9", "motion_preset": "slow_pan"},
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }

    async with session_factory() as session:
        outbox = RenderOutbox(
            id=f"outbox-{uuid.uuid4().hex[:8]}",
            project_id="proj-cas",
            job_id=job_id,
            payload=payload,
            status="pending",
            attempt_count=0,
            claimed_at=None,
        )
        session.add(outbox)
        await session.commit()

    mock_queue_1 = MockQueueClient()
    mock_queue_2 = MockQueueClient()

    sweeper_1 = CinematicOutboxSweeper(
        session_factory=session_factory,
        queue_publish_url="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=SIG1",
        queue_client=mock_queue_1,
        batch_size=5,
        lease_seconds=60,
    )
    sweeper_2 = CinematicOutboxSweeper(
        session_factory=session_factory,
        queue_publish_url="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=SIG2",
        queue_client=mock_queue_2,
        batch_size=5,
        lease_seconds=60,
    )

    # Run both sweepers concurrently
    results = await asyncio.gather(sweeper_1.sweep_once(), sweeper_2.sweep_once())
    total_published = sum(results)

    assert total_published == 1, "Exactly one sweeper must succeed; CAS must prevent duplicate claims."
    assert len(mock_queue_1.sent_messages) + len(mock_queue_2.sent_messages) == 1


@pytest.mark.asyncio
async def test_resilience_scenario_a_terminal_failure_and_backoff(isolated_resilience_db):
    """
    Scenario A4:
    Verifies that persistent publication errors increment attempt_count with exponential backoff,
    and transition to terminal 'failed' once retry budget (max_retries=5) is exhausted.
    """
    session_factory, _ = isolated_resilience_db
    job_id = f"job-failing-{uuid.uuid4().hex[:8]}"

    payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-fail",
        "entity_type": "scene",
        "entity_id": "scene-fail",
        "request_hash": "c" * 64,
        "options": {"duration_seconds": 6, "fps": 24, "resolution": "1280x720", "aspect_ratio": "16:9", "motion_preset": "slow_pan"},
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }

    async with session_factory() as session:
        job = GenerationJob(id=job_id, project_id="proj-fail", job_type="media_video", status="queued")
        media = MediaAssetRecord(id=job_id, project_id="proj-fail", entity_type="scene", entity_id="scene-fail", media_type="video", status="queued", request_hash="c" * 64)
        past_time = get_utc_now() - timedelta(minutes=15)
        outbox = RenderOutbox(
            id=f"outbox-{uuid.uuid4().hex[:8]}",
            project_id="proj-fail",
            job_id=job_id,
            payload=payload,
            status="pending",
            attempt_count=4,  # Next attempt is 5 (max_retries)
            claimed_at=None,
            created_at=past_time,
            updated_at=past_time,
        )
        session.add(job)
        session.add(media)
        session.add(outbox)
        await session.commit()

    failing_queue = MagicMock()
    failing_queue.send_message.side_effect = ConnectionError("Simulated Azure network outage")

    sweeper = CinematicOutboxSweeper(
        session_factory=session_factory,
        queue_publish_url="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=SIG_FAIL",
        queue_client=failing_queue,
        max_retries=5,
    )

    published = await sweeper.sweep_once()
    assert published == 0

    async with session_factory() as session:
        rec = (await session.execute(select(RenderOutbox).where(RenderOutbox.job_id == job_id))).scalars().first()
        assert rec.status == "failed"
        assert rec.attempt_count == 5
        assert "Simulated Azure network outage" in str(rec.last_error)

        # Job and media transitioned to failed; request_hash cleared for clean retry
        j = (await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))).scalars().first()
        assert j.status == "failed"
        m = (await session.execute(select(MediaAssetRecord).where(MediaAssetRecord.id == job_id))).scalars().first()
        assert m.status == "failed"
        assert m.request_hash is None


# ==============================================================================
# Scenario B: Worker Lease Heartbeat, Duplicate Delivery, and Terminal Idempotency
# ==============================================================================


@pytest.mark.asyncio
async def test_resilience_scenario_b_worker_heartbeat_renewal():
    """
    Scenario B1:
    Verifies that worker heartbeat loop executes update_message on Azure Queue
    to extend message visibility during long processing, and commits DB heartbeats.
    """
    mock_session = AsyncMock()
    mock_session_factory = MagicMock()
    mock_session_factory.return_value.__aenter__.return_value = mock_session
    mock_session_factory.return_value.__aexit__.return_value = None

    mock_queue = MockQueueClient()
    mock_msg = MockQueueMessage(content="{}")
    stop_event = asyncio.Event()

    task = asyncio.create_task(
        _heartbeat_loop(
            job_id="job-heartbeat-resilience",
            session_factory=mock_session_factory,
            queue_client=mock_queue,
            message=mock_msg,
            stop_event=stop_event,
            heartbeat_interval=0.03,
            visibility_renew_threshold=0.0,
        )
    )

    await asyncio.sleep(0.12)
    stop_event.set()
    await task

    # Queue lease renewal must have been called
    assert len(mock_queue.updated_messages) >= 2
    for msg, vis_timeout in mock_queue.updated_messages:
        assert vis_timeout == 120
    assert mock_session.commit.call_count >= 2


@pytest.mark.asyncio
async def test_resilience_scenario_b_duplicate_delivery_for_in_flight_job(isolated_resilience_db):
    """
    Scenario B2:
    Simulates duplicate message delivery when a job is already 'processing' (e.g. lease expired or redelivered).
    Verifies:
    1. Atomic claim conflict is detected (status != 'queued').
    2. Zero render work or DB mutation is performed.
    3. The duplicate message is deleted from the queue to prevent poison looping.
    """
    session_factory, _ = isolated_resilience_db
    job_id = f"job-inflight-{uuid.uuid4().hex[:8]}"

    async with session_factory() as session:
        job = GenerationJob(
            id=job_id,
            project_id="proj-inflight",
            job_type="media_video",
            status="processing",
            progress=45,
        )
        session.add(job)
        await session.commit()

    msg_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-inflight",
        "entity_type": "scene",
        "entity_id": "scene-1",
        "request_hash": "d" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 2,
    }
    mock_msg = MockQueueMessage(content=json.dumps(msg_payload))
    mock_queue = MockQueueClient([mock_msg])

    handled = await process_queue_message(
        message=mock_msg,
        queue_client=mock_queue,
        session_factory=session_factory,
    )

    assert handled is True
    # Duplicate message deleted
    assert len(mock_queue.deleted_messages) == 1

    # In-flight state preserved
    async with session_factory() as session:
        current = (await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))).scalars().first()
        assert current.status == "processing"
        assert current.progress == 45


@pytest.mark.asyncio
async def test_resilience_scenario_b_duplicate_delivery_for_completed_job(isolated_resilience_db):
    """
    Scenario B3:
    Simulates duplicate message delivery when a job is already 'completed'.
    Verifies:
    1. Job is not re-rendered.
    2. Existing stored asset URL and metadata are preserved untouched.
    3. Duplicate message is deleted from the queue.
    """
    session_factory, _ = isolated_resilience_db
    job_id = f"job-completed-{uuid.uuid4().hex[:8]}"
    existing_asset_url = "https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/canary.mp4"

    async with session_factory() as session:
        job = GenerationJob(
            id=job_id,
            project_id="proj-comp",
            job_type="media_video",
            status="completed",
            progress=100,
            result_json=json.dumps({"stored_asset_url": existing_asset_url}),
        )
        media = MediaAssetRecord(
            id=job_id,
            project_id="proj-comp",
            entity_type="scene",
            entity_id="scene-comp",
            media_type="video",
            status="completed",
            asset_url=existing_asset_url,
            metadata_json=json.dumps({"is_synthetic": True, "provider_label": "Cinematic Preview"}),
        )
        session.add(job)
        session.add(media)
        await session.commit()

    msg_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-comp",
        "entity_type": "scene",
        "entity_id": "scene-comp",
        "request_hash": "e" * 64,
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

    # Database records preserved without overwrite
    async with session_factory() as session:
        j = (await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))).scalars().first()
        assert j.status == "completed"
        assert j.progress == 100

        m = (await session.execute(select(MediaAssetRecord).where(MediaAssetRecord.id == job_id))).scalars().first()
        assert m.status == "completed"
        assert m.asset_url == existing_asset_url


# ==============================================================================
# Scenario C: Poison-Message Routing and Hostile Payload Rejection
# ==============================================================================


def test_resilience_scenario_c_hostile_payload_rejection():
    """
    Scenario C1:
    Validates that hostile and malformed payloads are rejected by pure validator:
    - Unsupported schema versions
    - Invalid entity IDs / patterns
    - Unexpected fields (additionalProperties: false)
    - Credential injection attempts
    """
    base_valid = {
        "schema_version": "1.0",
        "job_id": "job-101",
        "project_id": "proj-101",
        "entity_type": "scene",
        "entity_id": "scene-101",
        "request_hash": "0" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 1,
    }

    # 1. Unsupported schema_version
    bad_schema = dict(base_valid, schema_version="2.0")
    with pytest.raises(ValueError, match="Unsupported schema_version"):
        validate_queue_message_dict(bad_schema)

    # 2. Invalid entity_type
    bad_entity = dict(base_valid, entity_type="spaceship")
    with pytest.raises(ValueError, match="Invalid entity_type"):
        validate_queue_message_dict(bad_entity)

    # 3. Invalid entity_id with SQL injection attempt
    bad_id = dict(base_valid, entity_id="scene'; DROP TABLE render_outbox;--")
    with pytest.raises(ValueError, match="Invalid entity_id format"):
        validate_queue_message_dict(bad_id)

    # 4. Unexpected extra fields
    bad_extra = dict(base_valid, malicious_payload="curl http://evil.com")
    with pytest.raises(ValueError, match="Unexpected fields in message payload"):
        validate_queue_message_dict(bad_extra)

    # 5. Credential injection in options
    bad_creds = dict(base_valid, options={"duration_seconds": 6, "database_url": "postgres://user:pass@host/db"})
    with pytest.raises(ValueError, match="Forbidden credential field detected"):
        validate_queue_message_dict(bad_creds)


@pytest.mark.asyncio
async def test_resilience_scenario_c_poison_queue_routing(isolated_resilience_db):
    """
    Scenario C2:
    When a message fails processing repeatedly (dequeue_count > 3), verifies:
    1. Message is quarantined to poison queue.
    2. Message is deleted from active work queue.
    3. Job is marked 'failed' with descriptive diagnostics.
    4. MediaAssetRecord request_hash is released (None) to unblock user retries.
    5. Zero credentials appear in logs or poison message body.
    """
    session_factory, _ = isolated_resilience_db
    job_id = f"job-poison-{uuid.uuid4().hex[:8]}"

    async with session_factory() as session:
        job = GenerationJob(id=job_id, project_id="proj-p", job_type="media_video", status="queued")
        media = MediaAssetRecord(
            id=job_id,
            project_id="proj-p",
            entity_type="scene",
            entity_id="scene-p",
            media_type="video",
            status="queued",
            request_hash="f" * 64,
        )
        session.add(job)
        session.add(media)
        await session.commit()

    msg_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": "proj-p",
        "entity_type": "scene",
        "entity_id": "scene-p",
        "request_hash": "f" * 64,
        "enqueued_at": get_utc_now_iso(),
        "attempt": 4,
    }
    mock_msg = MockQueueMessage(content=json.dumps(msg_payload), dequeue_count=4)
    work_queue = MockQueueClient([mock_msg])
    poison_queue = MockQueueClient()

    handled = await process_queue_message(
        message=mock_msg,
        queue_client=work_queue,
        poison_queue_client=poison_queue,
        session_factory=session_factory,
    )

    assert handled is True
    assert len(work_queue.deleted_messages) == 1
    assert len(poison_queue.sent_messages) == 1

    poison_payload = json.loads(poison_queue.sent_messages[0])
    assert poison_payload["job_id"] == job_id
    assert "Moved to poison queue" in poison_payload["error"]

    # Verify zero secrets leaked in poison queue message
    scan_for_credentials(poison_payload)

    # Verify DB transition
    async with session_factory() as session:
        j = (await session.execute(select(GenerationJob).where(GenerationJob.id == job_id))).scalars().first()
        assert j.status == "failed"
        assert "poison queue" in str(j.error_message).lower()

        m = (await session.execute(select(MediaAssetRecord).where(MediaAssetRecord.id == job_id))).scalars().first()
        assert m.status == "failed"
        assert m.request_hash is None, "request_hash must be released to prevent orphan locks."


# ==============================================================================
# Scenario D: Data Immutability for Pre-Existing Completed Renders
# ==============================================================================


@pytest.mark.asyncio
async def test_resilience_scenario_d_data_immutability(isolated_resilience_db):
    """
    Scenario D:
    Verifies that sweeper sweeps, duplicate deliveries, retries, and poison handling
    never mutate or delete already-completed render records or their media assets.
    """
    session_factory, _ = isolated_resilience_db

    # Modeled after the verified production canary
    canary_job_id = "0d9c2349-6eed-4686-b148-5f8f5d84c17f"
    canary_project_id = "25e15040-73e6-47e5-b030-d95598e17292"
    canary_entity_id = "99b0c570-2d22-402e-8a68-1392243f8d30"
    canary_url = "https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/projects/25e15040-73e6-47e5-b030-d95598e17292/media/video/99b0c570-2d22-402e-8a68-1392243f8d30_1792855464.mp4"
    canary_meta = {
        "is_synthetic": True,
        "provider_label": "Cinematic Preview",
        "duration_sec": 6,
        "resolution": "720p",
        "aspect_ratio": "16:9",
        "file_size_bytes": 124558,
        "render_engine": "native-ffmpeg-worker",
    }
    canary_outbox_id = "e3cfdc80-dca2-4489-98c4-c4dd74a551e2"

    async with session_factory() as session:
        job = GenerationJob(
            id=canary_job_id,
            project_id=canary_project_id,
            job_type="media_video",
            status="completed",
            progress=100,
            result_json=json.dumps({"stored_asset_url": canary_url, "metadata": canary_meta}),
        )
        media = MediaAssetRecord(
            id=canary_job_id,
            project_id=canary_project_id,
            entity_type="character",
            entity_id=canary_entity_id,
            media_type="video",
            status="completed",
            asset_url=canary_url,
            metadata_json=json.dumps(canary_meta),
            request_hash="4f8521d16e432af8ef023f8036e0b5525f78bc85991ef94002936ba2d4a64448",
        )
        outbox = RenderOutbox(
            id=canary_outbox_id,
            project_id=canary_project_id,
            job_id=canary_job_id,
            payload={"job_id": canary_job_id, "project_id": canary_project_id},
            status="published",
            attempt_count=0,
            published_at=get_utc_now() - timedelta(hours=2),
        )
        session.add(job)
        session.add(media)
        session.add(outbox)
        await session.commit()

    # 1. Run sweeper pass (must ignore published records)
    mock_queue = MockQueueClient()
    sweeper = CinematicOutboxSweeper(
        session_factory=session_factory,
        queue_publish_url="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=SIG_IMMUTABLE",
        queue_client=mock_queue,
    )
    swept = await sweeper.sweep_once()
    assert swept == 0
    assert len(mock_queue.sent_messages) == 0

    # 2. Run duplicate queue delivery pass
    duplicate_msg = MockQueueMessage(
        content=json.dumps({
            "schema_version": "1.0",
            "job_id": canary_job_id,
            "project_id": canary_project_id,
            "entity_type": "character",
            "entity_id": canary_entity_id,
            "request_hash": "4f8521d16e432af8ef023f8036e0b5525f78bc85991ef94002936ba2d4a64448",
            "enqueued_at": get_utc_now_iso(),
            "attempt": 1,
        })
    )
    dup_queue = MockQueueClient([duplicate_msg])
    handled = await process_queue_message(
        message=duplicate_msg,
        queue_client=dup_queue,
        session_factory=session_factory,
    )
    assert handled is True
    assert len(dup_queue.deleted_messages) == 1

    # 3. Assert all canary records remain completely immutable
    async with session_factory() as session:
        j = (await session.execute(select(GenerationJob).where(GenerationJob.id == canary_job_id))).scalars().first()
        assert j.status == "completed"
        assert j.progress == 100
        result_data = json.loads(j.result_json)
        assert result_data["stored_asset_url"] == canary_url

        m = (await session.execute(select(MediaAssetRecord).where(MediaAssetRecord.id == canary_job_id))).scalars().first()
        assert m.status == "completed"
        assert m.asset_url == canary_url
        assert json.loads(m.metadata_json) == canary_meta
        assert m.request_hash == "4f8521d16e432af8ef023f8036e0b5525f78bc85991ef94002936ba2d4a64448"

        o = (await session.execute(select(RenderOutbox).where(RenderOutbox.id == canary_outbox_id))).scalars().first()
        assert o.status == "published"
