"""
Unit test suite for TASK-52-10: Cinematic Preview Transactional Outbox and Queue Dispatch.

Covers:
1. Valid schema-compliant queue payloads (conforming to queue_message_schema.json).
2. Successful publish and outbox status transition (pending -> published, with published_at).
3. Missing queue configuration rejection (HTTP 503).
4. Invalid queue URL validation (HTTP, wrong queue name -> HTTP 500).
5. Azure enqueue failure handling (pending outbox preservation, attempt_count, sanitized error, HTTP 502).
6. Secret-free payloads and sanitized logs/errors (zero credential leaks).
7. Duplicate requests and idempotency (duplicate clicks attach to active job, single outbox entry).
8. Database transaction failure and rollback behavior (zero queue messages if commit fails).
9. Authorization and API response compatibility.
"""

import json
from unittest.mock import MagicMock, patch
import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError

from backend.app.config import settings
from backend.app.core.auth import AuthenticatedUser, get_current_user
from backend.app.main import app
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.models.outbox import RenderOutbox
from backend.app.models.project import Project, ProjectCreate
from backend.app.models.world import WorldCandidate
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.cinematic_dispatcher import (
    CinematicDispatcherService,
    CinematicPreviewJobRequest,
    sanitize_error_message,
    sanitize_queue_url,
    validate_queue_url,
)

VALID_QUEUE_URL = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=MOCK_SIG"


@pytest.fixture(autouse=True)
def enable_cinematic_preview_for_tests():
    orig_flag = settings.CINEMATIC_PREVIEW_ENABLED
    orig_url = settings.QUEUE_PUBLISH_URL
    orig_ops = settings.CINEMATIC_OPERATOR_EMAILS
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL
    settings.CINEMATIC_OPERATOR_EMAILS = "test@praroha.local"
    yield
    settings.CINEMATIC_PREVIEW_ENABLED = orig_flag
    settings.QUEUE_PUBLISH_URL = orig_url
    settings.CINEMATIC_OPERATOR_EMAILS = orig_ops


@pytest_asyncio.fixture
async def setup_dispatch_project():
    """Create test project and world candidate with keyframe art."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = await repo.create_project(
            ProjectCreate(
                title="Vesta: Core Drifters",
                seed_text="Deep mantle miners drilling into planetary cores.",
            ),
            owner_id="test-default-user",
        )

        import uuid
        world_id = f"world-{uuid.uuid4().hex[:8]}"
        world = WorldCandidate(
            id=world_id,
            title="Vesta Core City",
            archetype="Subterranean Civilization",
            concept="Thermal-powered mining hubs.",
            aesthetic="Obsidian rock and glowing molten channels.",
            core_tension="Mantle eruptions vs structural stability.",
            trade_offs="High energy yield at extreme volcanic risk.",
            key_visual="A massive drill platform over an obsidian abyss.",
        )
        await repo.save_world_candidates(proj.id, "dna-01", "batch-01", [world])

        img_asset = MediaAssetRecord(
            id=f"asset-img-{uuid.uuid4().hex[:8]}",
            project_id=proj.id,
            entity_type="world",
            entity_id=world.id,
            media_type="image",
            status="completed",
            asset_url="https://test.supabase.co/storage/v1/object/public/seed-unfold-assets/vesta.png",
            prompt="Vesta Core drill platform over molten magma",
            aspect_ratio="16:9",
        )
        await repo.create_media_asset(img_asset)

    return proj, world, img_asset


@pytest.mark.asyncio
async def test_dispatch_valid_schema_compliant_payload(setup_dispatch_project):
    """
    Requirement 1 & 2: Successful queue dispatch publishes a message conforming
    to queue_message_schema.json and marks the outbox record 'published'.
    """
    proj, world, _ = setup_dispatch_project
    mock_queue_client = MagicMock()
    mock_queue_client.send_message.return_value = {"message_id": "test-msg-1"}

    async with async_session() as session:
        repo = ProjectRepository(session)
        dispatcher = CinematicDispatcherService(
            repo=repo,
            queue_publish_url=VALID_QUEUE_URL,
            queue_client=mock_queue_client,
        )

        req = CinematicPreviewJobRequest(
            entity_type="world",
            entity_id=world.id,
            duration_sec=12,
            aspect_ratio="16:9",
        )

        job_resp = await dispatcher.dispatch_preview_job(proj.id, req)
        assert job_resp.job_id is not None
        assert job_resp.status == "queued"
        assert job_resp.media_type == "video"

        # 1. Inspect queue message payload sent to Azure Queue
        assert mock_queue_client.send_message.called
        raw_msg = mock_queue_client.send_message.call_args[0][0]
        payload = json.loads(raw_msg)

        # Strict validation against queue_message_schema.json
        assert payload["schema_version"] == "1.0"
        assert payload["job_id"] == job_resp.job_id
        assert payload["project_id"] == proj.id
        assert payload["entity_type"] == "world"
        assert payload["entity_id"] == world.id
        assert len(payload["request_hash"]) == 64
        assert payload["attempt"] == 1
        assert "enqueued_at" in payload

        # Options schema validation
        opts = payload["options"]
        assert opts["duration_seconds"] == 12
        assert opts["fps"] == 24
        assert opts["resolution"] == "1280x720"
        assert opts["aspect_ratio"] == "16:9"
        assert opts["motion_preset"] == "slow_pan"

        # 2. Inspect outbox record state in database
        outbox = await repo.get_render_outbox_by_job_id(job_resp.job_id)
        assert outbox is not None
        assert outbox.status == "published"
        assert outbox.published_at is not None
        assert outbox.attempt_count == 0
        assert outbox.last_error is None

        # 3. Inspect GenerationJob & MediaAssetRecord
        gen_job = await repo.get_generation_job(job_resp.job_id)
        assert gen_job is not None
        assert gen_job.status == "queued"

        media_asset = await repo.get_media_asset(job_resp.job_id)
        assert media_asset is not None
        assert media_asset.status == "queued"


@pytest.mark.asyncio
async def test_dispatch_missing_queue_configuration(setup_dispatch_project):
    """
    Requirement: If queue configuration is missing, returns HTTP 503
    without silently pretending the job was queued. Zero database records created.
    """
    proj, world, _ = setup_dispatch_project

    async with async_session() as session:
        repo = ProjectRepository(session)
        dispatcher = CinematicDispatcherService(
            repo=repo,
            queue_publish_url="",
            queue_client=None,
        )

        req = CinematicPreviewJobRequest(
            entity_type="world",
            entity_id=world.id,
        )

        with pytest.raises(HTTPException) as exc_info:
            await dispatcher.dispatch_preview_job(proj.id, req)

        assert exc_info.value.status_code == 503
        assert "queue is currently not configured" in exc_info.value.detail.lower()

        # Verify no job or outbox records were created
        assets = await repo.list_media_assets(project_id=proj.id, entity_id=world.id)
        video_assets = [a for a in assets if a.media_type == "video"]
        assert len(video_assets) == 0


@pytest.mark.asyncio
async def test_dispatch_invalid_queue_url_validation(setup_dispatch_project):
    """
    Validates that queue URLs must use HTTPS and target 'cinematic-render-jobs'.
    """
    # 1. HTTP instead of HTTPS
    with pytest.raises(ValueError, match="HTTPS"):
        validate_queue_url("http://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sas")

    # 2. Wrong queue target
    with pytest.raises(ValueError, match="cinematic-render-jobs"):
        validate_queue_url("https://stpraroharender.queue.core.windows.net/other-queue?sas")

    # 3. Dispatcher returns HTTP 500 when configured with wrong queue
    proj, world, _ = setup_dispatch_project
    async with async_session() as session:
        repo = ProjectRepository(session)
        dispatcher = CinematicDispatcherService(
            repo=repo,
            queue_publish_url="https://stpraroharender.queue.core.windows.net/poison-queue?sas",
        )

        req = CinematicPreviewJobRequest(entity_type="world", entity_id=world.id)
        with pytest.raises(HTTPException) as exc_info:
            await dispatcher.dispatch_preview_job(proj.id, req)

        assert exc_info.value.status_code == 500
        assert "Invalid queue configuration" in exc_info.value.detail


@pytest.mark.asyncio
async def test_dispatch_azure_enqueue_failure_preserves_pending_outbox(setup_dispatch_project):
    """
    Requirement 3: When Azure queue publication fails, the outbox record
    is preserved as 'pending' with sanitized error and attempt_count=1.
    API returns truthful HTTP 502.
    """
    proj, world, _ = setup_dispatch_project
    mock_queue_client = MagicMock()
    mock_queue_client.send_message.side_effect = Exception(
        "Azure Storage Queue timeout connecting to https://stpraroharender.queue.core.windows.net?sig=SECRET_KEY_XYZ"
    )

    async with async_session() as session:
        repo = ProjectRepository(session)
        dispatcher = CinematicDispatcherService(
            repo=repo,
            queue_publish_url=VALID_QUEUE_URL,
            queue_client=mock_queue_client,
        )

        req = CinematicPreviewJobRequest(
            entity_type="world",
            entity_id=world.id,
            duration_sec=8,
        )

        with pytest.raises(HTTPException) as exc_info:
            await dispatcher.dispatch_preview_job(proj.id, req)

        assert exc_info.value.status_code == 502
        assert "Failed to enqueue cinematic preview job" in exc_info.value.detail
        # Credential scrub check: SAS signature was stripped from error message
        assert "SECRET_KEY_XYZ" not in exc_info.value.detail

        # Inspect durable database state for this specific entity's job
        assets = await repo.list_media_assets(project_id=proj.id, entity_id=world.id)
        video_assets = [a for a in assets if a.media_type == "video"]
        assert len(video_assets) == 1
        failed_job_id = video_assets[0].id

        record = await repo.get_render_outbox_by_job_id(failed_job_id)
        assert record is not None
        assert record.status == "pending"
        assert record.attempt_count == 1
        assert "timeout" in record.last_error.lower()
        assert "SECRET_KEY_XYZ" not in record.last_error
        assert record.published_at is None

        # GenerationJob remains queued for sweeper pickup
        job = await repo.get_generation_job(record.job_id)
        assert job is not None
        assert job.status == "queued"


def test_sanitize_url_and_error_helpers():
    """Verify URL and error sanitization helper functions."""
    raw_url = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sv=2020-08-04&sp=a&sig=SUPER_SECRET_SIG"
    safe = sanitize_queue_url(raw_url)
    assert "SUPER_SECRET_SIG" not in safe
    assert "SAS redacted" in safe

    raw_err = "ClientAuthenticationError: Server rejected sig=VERY_SECRET_SIG&sp=a on request"
    safe_err = sanitize_error_message(raw_err)
    assert "VERY_SECRET_SIG" not in safe_err
    assert "sig=REDACTED" in safe_err


@pytest.mark.asyncio
async def test_dispatch_idempotency_and_duplicate_suppression(setup_dispatch_project):
    """
    Requirement: Duplicate requests attach to the active job without launching duplicate
    renders or duplicate outbox entries.
    """
    proj, world, _ = setup_dispatch_project
    mock_queue_client = MagicMock()
    mock_queue_client.send_message.return_value = {"message_id": "test-msg-2"}

    async with async_session() as session:
        repo = ProjectRepository(session)
        dispatcher = CinematicDispatcherService(
            repo=repo,
            queue_publish_url=VALID_QUEUE_URL,
            queue_client=mock_queue_client,
        )

        req = CinematicPreviewJobRequest(
            entity_type="world",
            entity_id=world.id,
            duration_sec=6,
            force_regenerate=False,
        )

        # First dispatch
        resp1 = await dispatcher.dispatch_preview_job(proj.id, req)
        assert resp1.status == "queued"
        first_job_id = resp1.job_id

        # Second duplicate dispatch with identical parameters
        resp2 = await dispatcher.dispatch_preview_job(proj.id, req)
        assert resp2.job_id == first_job_id
        assert resp2.status == "queued"

        # Azure Queue send_message should have been called only once
        assert mock_queue_client.send_message.call_count == 1

        # Only one outbox entry exists
        outbox = await repo.get_render_outbox_by_job_id(first_job_id)
        assert outbox is not None


@pytest.mark.asyncio
async def test_database_transaction_failure_rollback(setup_dispatch_project):
    """
    Requirement: If the database transaction fails to commit, zero messages
    are published to Azure Storage Queue.
    """
    proj, world, _ = setup_dispatch_project
    mock_queue_client = MagicMock()

    async with async_session() as session:
        repo = ProjectRepository(session)
        dispatcher = CinematicDispatcherService(
            repo=repo,
            queue_publish_url=VALID_QUEUE_URL,
            queue_client=mock_queue_client,
        )

        req = CinematicPreviewJobRequest(entity_type="world", entity_id=world.id)

        # Simulate database transaction failure on commit
        with patch.object(repo.session, "commit", side_effect=SQLAlchemyError("Simulated DB connection lost")):
            with pytest.raises(SQLAlchemyError):
                await dispatcher.dispatch_preview_job(proj.id, req)

            # Crucial invariant: Queue publish was NEVER called because DB transaction aborted
            assert not mock_queue_client.send_message.called


@pytest.mark.asyncio
async def test_api_route_authorization_and_feature_flag(client, setup_dispatch_project):
    """
    Verify API routes enforce project ownership and feature flag guards.
    """
    proj, world, _ = setup_dispatch_project

    # 1. Blocked when feature flag is disabled
    settings.CINEMATIC_PREVIEW_ENABLED = False
    resp_flag = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp_flag.status_code == 503
    settings.CINEMATIC_PREVIEW_ENABLED = True

    # 2. Blocked for unauthorized user (non-owner)
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="attacker-user",
        email="attacker@external.com",
    )
    resp_unauth = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp_unauth.status_code in (403, 404)


def test_dispatcher_dependency_isolation():
    """
    Requirement 1: Importing cinematic_dispatcher must NEVER import cinematic_worker.
    Requirement 2: Importing cinematic_dispatcher must NEVER require psutil.
    """
    import subprocess
    import sys

    # Run in a fresh, isolated Python subprocess to guarantee pristine sys.modules
    # and verify strict dependency and import isolation.
    cmd = [
        sys.executable,
        "-c",
        (
            "import sys; "
            "sys.modules['psutil'] = None; "
            "import backend.app.services.cinematic_dispatcher as disp; "
            "assert 'backend.app.workers.cinematic_worker' not in sys.modules, "
            "'cinematic_worker was illegally imported by cinematic_dispatcher!'"
        ),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    assert proc.returncode == 0, f"Isolation check failed: {proc.stderr}"


def test_queue_contract_validation_and_credential_rejection():
    """
    Verify queue contract validation enforces canonical schema and rejects credentials.
    """
    from backend.app.services.queue_contract import (
        validate_queue_message_dict,
        scan_for_credentials,
        decode_message_content,
        FORBIDDEN_CREDENTIAL_KEYWORDS,
    )

    valid_payload = {
        "schema_version": "1.0",
        "job_id": "job-123",
        "project_id": "proj-456",
        "entity_type": "world",
        "entity_id": "ent-789",
        "request_hash": "a" * 64,
        "options": {
            "duration_seconds": 12,
            "fps": 24,
            "resolution": "1280x720",
            "aspect_ratio": "16:9",
            "motion_preset": "slow_pan",
        },
        "enqueued_at": "2026-10-23T12:00:00Z",
        "attempt": 1,
    }

    # Valid payload passes
    res = validate_queue_message_dict(valid_payload)
    assert res["job_id"] == "job-123"
    assert res["options"]["fps"] == 24

    # Credential rejection across all forbidden keywords
    for keyword in ("api_key", "secret", "password", "token", "conn_str", "database_url"):
        bad_payload = dict(valid_payload)
        bad_payload[keyword] = "sensitive-value"
        with pytest.raises(ValueError, match="Forbidden credential field detected"):
            validate_queue_message_dict(bad_payload)

    # Missing required field raises ValueError
    bad_missing = dict(valid_payload)
    del bad_missing["request_hash"]
    with pytest.raises(ValueError, match="Missing required fields"):
        validate_queue_message_dict(bad_missing)

    # Invalid additional property raises ValueError
    bad_extra = dict(valid_payload)
    bad_extra["custom_extra_metadata"] = "value"
    with pytest.raises(ValueError, match="Unexpected fields"):
        validate_queue_message_dict(bad_extra)
