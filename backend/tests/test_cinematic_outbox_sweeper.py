"""
Tests for PRAROHA Phase 52 TASK-52-11:
Outbox Sweeper, Safe Job Recovery, Canonical Schema Alignment, and Concurrency Leasing.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from backend.app.config import settings
from backend.app.main import app
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.models.outbox import RenderOutbox
from backend.app.models.project import Project
from backend.app.models.unfold import SceneRecord
from backend.app.models.world import WorldCandidateRecord
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import (
    ProjectRepository,
    async_session,
    ensure_utc,
    get_utc_now,
    init_db,
)
from backend.app.services.cinematic_dispatcher import (
    CinematicDispatcherService,
    CinematicPreviewJobRequest,
)
from backend.app.services.cinematic_outbox_sweeper import (
    CinematicOutboxSweeper,
    get_outbox_sweeper,
)
from backend.app.workers.cinematic_worker import (
    decode_message_content,
    process_queue_message,
    validate_queue_message_dict,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_test_database():
    """Ensure clean schema initialization before each test and clear outbox."""
    await init_db()
    async with async_session() as session:
        from sqlmodel import delete
        await session.execute(delete(RenderOutbox))
        await session.commit()
    yield


@pytest.fixture
def mock_azure_queue():
    """Mock Azure Storage Queue client to intercept enqueue calls."""
    with patch("azure.storage.queue.QueueClient.from_queue_url") as mock_from_url:
        mock_client = MagicMock()
        mock_client.send_message = MagicMock(return_value={"id": "msg-sweeper-123", "pop_receipt": "receipt-123"})
        mock_from_url.return_value = mock_client
        yield mock_client


@pytest.mark.asyncio
async def test_dispatcher_payload_conforms_to_canonical_schema_and_worker_validator(setup_test_database):
    """
    Step 1 Regression Test:
    Verify that payloads produced by CinematicDispatcherService match the canonical
    queue_message_schema.json contract and pass validate_queue_message_dict in the worker.
    """
    valid_queue_url = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=valid_test_signature"

    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = Project(title="Schema Alignment Project")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        from backend.app.models.world import WorldCandidate
        world = WorldCandidate(
            id=f"world-{uuid.uuid4().hex[:8]}",
            title="Aetheria",
            archetype="Sky Realm",
            concept="Floating sky islands",
            aesthetic="Clouds and brass",
            core_tension="Altitude vs gravity",
            trade_offs="Freedom vs storms",
            key_visual="Floating citadel",
        )
        await repo.save_world_candidates(proj.id, "dna-01", "batch-01", [world])

        img_asset = MediaAssetRecord(
            id=f"asset-img-{uuid.uuid4().hex[:8]}",
            project_id=proj.id,
            entity_type="world",
            entity_id=world.id,
            media_type="image",
            status="completed",
            asset_url="https://storage.praroha.app/aetheria.png",
            prompt="Aetheria sky realm",
            aspect_ratio="16:9",
        )
        await repo.create_media_asset(img_asset)

    mock_client = MagicMock()
    mock_client.send_message = MagicMock(return_value={"id": "msg-1"})

    dispatcher = CinematicDispatcherService(
        repo=ProjectRepository(session),
        queue_publish_url=valid_queue_url,
        queue_client=mock_client,
    )

    req = CinematicPreviewJobRequest(
        entity_type="world",
        entity_id=world.id,
        title="Epic Skyrealm",
        duration_sec=12,
        aspect_ratio="16:9",
        fps=24,
        resolution="1280x720",
        motion_preset="slow_pan",
        force_regenerate=True,
    )

    with patch.object(settings, "CINEMATIC_PREVIEW_ENABLED", True):
        resp = await dispatcher.dispatch_preview_job(proj.id, req)
    assert resp.status == "queued"
    assert resp.job_id is not None

    # Inspect the exact payload dispatched
    assert mock_client.send_message.called
    raw_message = mock_client.send_message.call_args[0][0]
    payload = json.loads(raw_message)

    # 1. Top level validation
    assert payload["schema_version"] == "1.0"
    assert payload["job_id"] == resp.job_id
    assert payload["project_id"] == proj.id
    assert payload["entity_type"] == "world"
    assert payload["entity_id"] == world.id
    assert len(payload["request_hash"]) == 64
    assert payload["attempt"] == 1

    # 2. Options validation against canonical schema
    opts = payload["options"]
    assert opts["duration_seconds"] == 12
    assert opts["fps"] == 24
    assert opts["resolution"] == "1280x720"
    assert opts["aspect_ratio"] == "16:9"
    assert opts["motion_preset"] == "slow_pan"
    # Ensure disallowed fields like duration_sec, include_audio, style are NOT present
    assert "duration_sec" not in opts
    assert "include_audio" not in opts
    assert "style" not in opts

    # 3. Direct execution of worker's strict validator
    worker_validated = validate_queue_message_dict(payload)
    assert worker_validated["job_id"] == resp.job_id
    assert worker_validated["options"]["duration_seconds"] == 12


@pytest.mark.asyncio
async def test_concurrency_safe_lease_claiming(setup_test_database):
    """
    Step 2: Verify that two sweeper workers/iterations cannot claim the same
    record concurrently (atomic CAS claim leasing).
    """
    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = Project(title="Lease Concurrency Test")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        job_id = f"job-lease-{uuid.uuid4().hex[:8]}"
        job = GenerationJob(id=job_id, project_id=proj.id, job_type="media_video", status="queued")
        session.add(job)
        await session.commit()

        canonical_payload = {
            "schema_version": "1.0",
            "job_id": job_id,
            "project_id": proj.id,
            "entity_type": "scene",
            "entity_id": "scene-lease-1",
            "request_hash": "a" * 64,
            "options": {
                "duration_seconds": 12,
                "fps": 24,
                "resolution": "1280x720",
                "aspect_ratio": "16:9",
                "motion_preset": "slow_pan",
            },
            "enqueued_at": get_utc_now().isoformat(),
            "attempt": 1,
        }

        outbox = RenderOutbox(
            project_id=proj.id,
            job_id=job_id,
            payload=canonical_payload,
            status="pending",
        )
        await repo.create_render_outbox_record(outbox)

    # Simulate Sweeper A claiming the record
    async with async_session() as session_a:
        repo_a = ProjectRepository(session_a)
        claimed_a = await repo_a.claim_eligible_outbox_records(limit=10, lease_seconds=60)
        claimed_ids_a = [r.job_id for r in claimed_a]
        assert job_id in claimed_ids_a

    # Simulate Sweeper B attempting to claim concurrently while Sweeper A holds an active lease
    async with async_session() as session_b:
        repo_b = ProjectRepository(session_b)
        claimed_b = await repo_b.claim_eligible_outbox_records(limit=10, lease_seconds=60)
        claimed_ids_b = [r.job_id for r in claimed_b]
        # Sweeper B MUST NOT claim the record held by Sweeper A
        assert job_id not in claimed_ids_b


@pytest.mark.asyncio
async def test_sweeper_successful_publication_updates_status(setup_test_database):
    """
    Step 2: Verify that when the sweeper publishes a pending outbox record,
    status transitions to 'published', published_at is set, and claim is released.
    """
    valid_url = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=test"

    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = Project(title="Sweeper Success Test")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        job_id = f"job-success-{uuid.uuid4().hex[:8]}"
        job = GenerationJob(id=job_id, project_id=proj.id, job_type="media_video", status="queued")
        session.add(job)
        await session.commit()

        canonical_payload = {
            "schema_version": "1.0",
            "job_id": job_id,
            "project_id": proj.id,
            "entity_type": "scene",
            "entity_id": "scene-succ-1",
            "request_hash": "b" * 64,
            "options": {
                "duration_seconds": 12,
                "fps": 24,
                "resolution": "1280x720",
                "aspect_ratio": "16:9",
                "motion_preset": "slow_pan",
            },
            "enqueued_at": get_utc_now().isoformat(),
            "attempt": 1,
        }

        outbox = RenderOutbox(
            project_id=proj.id,
            job_id=job_id,
            payload=canonical_payload,
            status="pending",
        )
        await repo.create_render_outbox_record(outbox)

    mock_client = MagicMock()
    mock_client.send_message = MagicMock(return_value={"id": "msg-succ-123"})

    sweeper = CinematicOutboxSweeper(
        queue_publish_url=valid_url,
        queue_client=mock_client,
    )

    count = await sweeper.sweep_once()
    assert count >= 1

    async with async_session() as session:
        repo = ProjectRepository(session)
        rec = await repo.get_render_outbox_by_job_id(job_id)
        assert rec is not None
        assert rec.status == "published"
        assert rec.published_at is not None
        assert rec.claimed_at is None


@pytest.mark.asyncio
async def test_sweeper_failure_preserves_pending_record_with_backoff(setup_test_database):
    """
    Step 2: Verify that when Azure queue enqueue fails, the outbox record
    remains 'pending', attempt_count is incremented, error is sanitized,
    and claim is released.
    """
    valid_url = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=secret_token_123"

    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = Project(title="Sweeper Failure Test")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        job_id = f"job-fail-{uuid.uuid4().hex[:8]}"
        job = GenerationJob(id=job_id, project_id=proj.id, job_type="media_video", status="queued")
        session.add(job)
        await session.commit()

        canonical_payload = {
            "schema_version": "1.0",
            "job_id": job_id,
            "project_id": proj.id,
            "entity_type": "scene",
            "entity_id": "scene-fail-1",
            "request_hash": "c" * 64,
            "options": {
                "duration_seconds": 12,
                "fps": 24,
                "resolution": "1280x720",
                "aspect_ratio": "16:9",
                "motion_preset": "slow_pan",
            },
            "enqueued_at": get_utc_now().isoformat(),
            "attempt": 1,
        }

        outbox = RenderOutbox(
            project_id=proj.id,
            job_id=job_id,
            payload=canonical_payload,
            status="pending",
            attempt_count=0,
        )
        await repo.create_render_outbox_record(outbox)

    mock_client = MagicMock()
    mock_client.send_message.side_effect = RuntimeError("Connection dropped to queue?sig=secret_token_123")

    sweeper = CinematicOutboxSweeper(
        queue_publish_url=valid_url,
        queue_client=mock_client,
        base_backoff_seconds=30,
    )

    published = await sweeper.sweep_once()
    assert published == 0

    async with async_session() as session:
        repo = ProjectRepository(session)
        rec = await repo.get_render_outbox_by_job_id(job_id)
        assert rec is not None
        # Record is preserved in pending status
        assert rec.status == "pending"
        assert rec.attempt_count == 1
        assert rec.claimed_at is None
        # Sanitized diagnostics: secret token scrubbed
        assert "sig=REDACTED" in rec.last_error
        assert "secret_token_123" not in rec.last_error


@pytest.mark.asyncio
async def test_sweeper_retry_exhaustion_transitions_to_terminal_failed(setup_test_database):
    """
    Step 2: Verify that when a record reaches 5 attempts, it transitions
    to terminal 'failed', updates GenerationJob and MediaAssetRecord to 'failed',
    and clears request_hash.
    """
    valid_url = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=test"

    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = Project(title="Exhaustion Test")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        job_id = f"job-exhaust-{uuid.uuid4().hex[:8]}"
        job = GenerationJob(id=job_id, project_id=proj.id, job_type="media_video", status="queued")
        session.add(job)

        asset = MediaAssetRecord(
            id=job_id,
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-exhaust-1",
            media_type="video",
            status="queued",
            prompt="Exhaustion Prompt",
            request_hash="d" * 64,
        )
        session.add(asset)
        await session.commit()

        canonical_payload = {
            "schema_version": "1.0",
            "job_id": job_id,
            "project_id": proj.id,
            "entity_type": "scene",
            "entity_id": "scene-exhaust-1",
            "request_hash": "d" * 64,
            "options": {
                "duration_seconds": 12,
                "fps": 24,
                "resolution": "1280x720",
                "aspect_ratio": "16:9",
                "motion_preset": "slow_pan",
            },
            "enqueued_at": get_utc_now().isoformat(),
            "attempt": 1,
        }

        # Simulate a record that already failed 4 times
        outbox = RenderOutbox(
            project_id=proj.id,
            job_id=job_id,
            payload=canonical_payload,
            status="pending",
            attempt_count=4,
            updated_at=get_utc_now() - timedelta(seconds=300),  # backoff passed
        )
        await repo.create_render_outbox_record(outbox)

    mock_client = MagicMock()
    mock_client.send_message.side_effect = RuntimeError("Queue offline")

    sweeper = CinematicOutboxSweeper(
        queue_publish_url=valid_url,
        queue_client=mock_client,
        max_attempts=5,
    )

    published = await sweeper.sweep_once()
    assert published == 0

    async with async_session() as session:
        repo = ProjectRepository(session)
        rec = await repo.get_render_outbox_by_job_id(job_id)
        assert rec is not None
        assert rec.status == "failed"
        assert rec.attempt_count == 5
        assert "retry limit exhausted" in rec.last_error

        # Corresponding job and asset transitioned to failed
        gen_job = await repo.get_generation_job(job_id)
        assert gen_job.status == "failed"

        media_asset = await repo.get_media_asset(job_id)
        assert media_asset.status == "failed"
        # request_hash cleared for clean creator retry
        assert media_asset.request_hash is None


@pytest.mark.asyncio
async def test_crash_after_enqueue_safe_against_duplicate_rendering(setup_test_database):
    """
    Step 2: Crash-after-enqueue scenario.
    If Azure accepted the message, but the server crashed before the database outbox was marked published,
    retrying enqueue causes duplicate message delivery to the worker.
    Verify that the worker's atomic CAS claim rejects duplicate processing and acknowledges the duplicate.
    """
    async with async_session() as session:
        proj = Project(title="Duplicate Safety Project")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        job_id = f"job-dup-{uuid.uuid4().hex[:8]}"
        job = GenerationJob(
            id=job_id,
            project_id=proj.id,
            job_type="media_video",
            status="processing",  # already claimed and in progress by first delivery
            started_at=get_utc_now(),
            updated_at=get_utc_now(),
        )
        session.add(job)
        await session.commit()

    # Worker receives the duplicate queue message
    duplicate_payload = {
        "schema_version": "1.0",
        "job_id": job_id,
        "project_id": proj.id,
        "entity_type": "scene",
        "entity_id": "scene-dup-1",
        "request_hash": "e" * 64,
        "options": {
            "duration_seconds": 12,
            "fps": 24,
            "resolution": "1280x720",
            "aspect_ratio": "16:9",
            "motion_preset": "slow_pan",
        },
        "enqueued_at": get_utc_now().isoformat(),
        "attempt": 2,
    }

    mock_queue = MagicMock()
    mock_message = MagicMock(content=json.dumps(duplicate_payload), id="msg-dup-123", pop_receipt="rcpt-123")
    mock_message.dequeue_count = 1

    with patch("backend.app.workers.cinematic_worker.execute_cinematic_job") as mock_exec:
        processed = await process_queue_message(
            message=mock_message,
            queue_client=mock_queue,
            session_factory=async_session,
        )

        assert processed is True
        # Execution must NOT have run for the duplicate message
        assert not mock_exec.called
        # Duplicate message was safely acknowledged (deleted)
        assert mock_queue.delete_message.called


@pytest.mark.asyncio
async def test_missing_queue_config_does_not_falsely_publish_or_spin(setup_test_database):
    """
    Step 2: Verify that when QUEUE_PUBLISH_URL is absent/empty,
    sweeper does not claim records, does not mark them published, and returns 0.
    """
    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = Project(title="Missing Config Test")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        job_id = f"job-noconfig-{uuid.uuid4().hex[:8]}"
        job = GenerationJob(id=job_id, project_id=proj.id, job_type="media_video", status="queued")
        session.add(job)
        await session.commit()

        outbox = RenderOutbox(
            project_id=proj.id,
            job_id=job_id,
            payload={"schema_version": "1.0", "job_id": job_id},
            status="pending",
        )
        await repo.create_render_outbox_record(outbox)

    sweeper = CinematicOutboxSweeper(queue_publish_url="")
    published = await sweeper.sweep_once()
    assert published == 0

    async with async_session() as session:
        repo = ProjectRepository(session)
        rec = await repo.get_render_outbox_by_job_id(job_id)
        assert rec.status == "pending"
        assert rec.attempt_count == 0


@pytest.mark.asyncio
async def test_recover_orphaned_jobs_hardened_lifecycle(setup_test_database):
    """
    Step 3 Verification:
    - Fresh worker heartbeat (<90s) protects active rendering job.
    - Stale processing job (>90s) is recovered as failed with request_hash cleared.
    - Queued job with pending outbox is NOT marked failed.
    - Queued job with published outbox (<15m) is NOT marked failed.
    - Queued job with published outbox (>15m) IS marked failed.
    - Queued job with failed outbox IS marked failed.
    """
    now = get_utc_now()

    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = Project(title="Orphan Recovery Lifecycle Project")
        session.add(proj)
        await session.commit()
        await session.refresh(proj)

        # 1. Fresh processing job (worker heartbeat 10s ago)
        fresh_job_id = f"job-fresh-{uuid.uuid4().hex[:8]}"
        fresh_job = GenerationJob(
            id=fresh_job_id,
            project_id=proj.id,
            job_type="media_video",
            status="processing",
            updated_at=now - timedelta(seconds=10),
        )
        fresh_asset = MediaAssetRecord(
            id=fresh_job_id,
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-fresh",
            media_type="video",
            status="processing",
            request_hash="hash_fresh",
        )
        fresh_outbox = RenderOutbox(
            project_id=proj.id,
            job_id=fresh_job_id,
            status="published",
            published_at=now - timedelta(minutes=2),
            payload={"schema_version": "1.0"},
        )
        session.add(fresh_job)
        session.add(fresh_asset)
        session.add(fresh_outbox)

        # 2. Stale processing job (heartbeat 120s ago > 90s)
        stale_job_id = f"job-stale-{uuid.uuid4().hex[:8]}"
        stale_job = GenerationJob(
            id=stale_job_id,
            project_id=proj.id,
            job_type="media_video",
            status="processing",
            updated_at=now - timedelta(seconds=120),
        )
        stale_asset = MediaAssetRecord(
            id=stale_job_id,
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-stale",
            media_type="video",
            status="processing",
            request_hash="hash_stale",
        )
        stale_outbox = RenderOutbox(
            project_id=proj.id,
            job_id=stale_job_id,
            status="published",
            published_at=now - timedelta(minutes=5),
            payload={"schema_version": "1.0"},
        )
        session.add(stale_job)
        session.add(stale_asset)
        session.add(stale_outbox)

        # 3. Queued job with pending outbox (created 5 minutes ago)
        pending_outbox_job_id = f"job-pending-outbox-{uuid.uuid4().hex[:8]}"
        pending_job = GenerationJob(
            id=pending_outbox_job_id,
            project_id=proj.id,
            job_type="media_video",
            status="queued",
            created_at=now - timedelta(minutes=5),
        )
        pending_asset = MediaAssetRecord(
            id=pending_outbox_job_id,
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-pending",
            media_type="video",
            status="queued",
            request_hash="hash_pending",
        )
        pending_outbox = RenderOutbox(
            project_id=proj.id,
            job_id=pending_outbox_job_id,
            status="pending",
            payload={"schema_version": "1.0"},
        )
        session.add(pending_job)
        session.add(pending_asset)
        session.add(pending_outbox)

        # 4. Queued job with published outbox (<15 minutes ago, e.g. 5m)
        published_recent_job_id = f"job-pub-recent-{uuid.uuid4().hex[:8]}"
        pub_recent_job = GenerationJob(
            id=published_recent_job_id,
            project_id=proj.id,
            job_type="media_video",
            status="queued",
            created_at=now - timedelta(minutes=5),
        )
        pub_recent_asset = MediaAssetRecord(
            id=published_recent_job_id,
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-pub-recent",
            media_type="video",
            status="queued",
            request_hash="hash_pub_recent",
        )
        pub_recent_outbox = RenderOutbox(
            project_id=proj.id,
            job_id=published_recent_job_id,
            status="published",
            published_at=now - timedelta(minutes=5),
            payload={"schema_version": "1.0"},
        )
        session.add(pub_recent_job)
        session.add(pub_recent_asset)
        session.add(pub_recent_outbox)

        # 5. Queued job with published outbox (>15 minutes ago, e.g. 20m)
        published_old_job_id = f"job-pub-old-{uuid.uuid4().hex[:8]}"
        pub_old_job = GenerationJob(
            id=published_old_job_id,
            project_id=proj.id,
            job_type="media_video",
            status="queued",
            created_at=now - timedelta(minutes=20),
        )
        pub_old_asset = MediaAssetRecord(
            id=published_old_job_id,
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-pub-old",
            media_type="video",
            status="queued",
            request_hash="hash_pub_old",
        )
        pub_old_outbox = RenderOutbox(
            project_id=proj.id,
            job_id=published_old_job_id,
            status="published",
            published_at=now - timedelta(minutes=20),
            payload={"schema_version": "1.0"},
        )
        session.add(pub_old_job)
        session.add(pub_old_asset)
        session.add(pub_old_outbox)

        # 6. Queued job with failed outbox
        failed_outbox_job_id = f"job-outbox-failed-{uuid.uuid4().hex[:8]}"
        failed_ob_job = GenerationJob(
            id=failed_outbox_job_id,
            project_id=proj.id,
            job_type="media_video",
            status="queued",
            created_at=now - timedelta(minutes=2),
        )
        failed_ob_asset = MediaAssetRecord(
            id=failed_outbox_job_id,
            project_id=proj.id,
            entity_type="scene",
            entity_id="scene-ob-failed",
            media_type="video",
            status="queued",
            request_hash="hash_ob_failed",
        )
        failed_outbox = RenderOutbox(
            project_id=proj.id,
            job_id=failed_outbox_job_id,
            status="failed",
            last_error="All retries exhausted",
            payload={"schema_version": "1.0"},
        )
        session.add(failed_ob_job)
        session.add(failed_ob_asset)
        session.add(failed_outbox)

        await session.commit()

        # Run recovery
        recovered_count = await repo.recover_orphaned_jobs(
            stale_lease_seconds=90,
            queued_timeout_seconds=900,
        )

        # Expected recoveries:
        # - stale processing job: recovered
        # - published old job (>15m): recovered
        # - failed outbox job: recovered
        # Fresh job, pending outbox job, and recent published job MUST NOT be recovered
        assert recovered_count >= 3

        # Assertions on each entity
        res_fresh = await repo.get_generation_job(fresh_job_id)
        assert res_fresh.status == "processing", "Fresh heartbeat job must NOT be failed"

        res_stale = await repo.get_generation_job(stale_job_id)
        assert res_stale.status == "failed", "Stale processing job must be marked failed"
        stale_asset_check = await repo.get_media_asset(stale_job_id)
        assert stale_asset_check.request_hash is None, "Failed asset must clear request_hash"

        res_pending_ob = await repo.get_generation_job(pending_outbox_job_id)
        assert res_pending_ob.status == "queued", "Job with pending outbox must NOT be failed"

        res_pub_recent = await repo.get_generation_job(published_recent_job_id)
        assert res_pub_recent.status == "queued", "Recent published queued job must NOT be failed"

        res_pub_old = await repo.get_generation_job(published_old_job_id)
        assert res_pub_old.status == "failed", "Queued job > 15m must be marked failed"
        pub_old_asset_check = await repo.get_media_asset(published_old_job_id)
        assert pub_old_asset_check.request_hash is None

        res_failed_ob = await repo.get_generation_job(failed_outbox_job_id)
        assert res_failed_ob.status == "failed", "Job with failed outbox must be marked failed"


@pytest.mark.asyncio
async def test_sweeper_task_lifecycle_clean_shutdown(setup_test_database):
    """
    Step 4: Verify that starting and stopping the background sweeper works
    without leaking asyncio tasks or hanging shutdown.
    """
    sweeper = CinematicOutboxSweeper(
        queue_publish_url="https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=test",
        interval_seconds=1.0,
    )

    task = sweeper.start()
    assert not task.done()

    # Let it run briefly
    await asyncio.sleep(0.05)

    # Clean shutdown
    await sweeper.stop()
    assert task.done()
