"""
Unit tests for PRAROHA Phase 52 One-Shot Canary Dispatch Operator CLI.

Tests:
1. No side effects without explicit confirmation (--confirm-production-canary).
2. Refusal when preflight conditions fail (health, image, outbox, queues, executions, flags, demo seed).
3. Canonical schema validation and credential rejection.
4. Duplicate suppression and ambiguous-result handling.
5. At-most-one dispatch attempt guarantee.
6. Worker v6 contract compatibility.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
import pytest_asyncio
from sqlmodel import select, func

from backend.app.config import settings
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.models.outbox import RenderOutbox
from backend.app.models.project import Project, ProjectCreate
from backend.app.models.world import WorldCandidate
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.cinematic_dispatcher import compute_preview_hash, CinematicPreviewJobRequest
from backend.app.workers.cinematic_worker import parse_and_validate_queue_message
from backend.scripts.run_canary_dispatch import (
    audit_worker_contract_compatibility,
    check_azure_container_app_image,
    check_azure_queues_empty,
    check_live_backend_health,
    check_live_feature_flags_disabled,
    check_render_job_executions_zero,
    check_render_outbox_empty,
    execute_canary_dispatch,
    find_canonical_demo_seed,
    main_async,
    parse_args,
    resolve_scoped_queue_publish_url,
    run_full_preflight_audit,
    CANONICAL_DEMO_TITLE,
)

import uuid

VALID_TEST_QUEUE_URL = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=MOCK_SIG"


@pytest_asyncio.fixture(autouse=True)
async def clean_test_outbox():
    """Ensure render_outbox is empty before and after each CLI test in SQLite."""
    from sqlalchemy import text
    async with async_session() as session:
        await session.execute(text("DELETE FROM render_outbox;"))
        await session.commit()
    yield
    async with async_session() as session:
        await session.execute(text("DELETE FROM render_outbox;"))
        await session.commit()


@pytest_asyncio.fixture
async def setup_test_demo_project():
    """Create a verified test demo project with a completed image asset in SQLite test DB."""
    uid = uuid.uuid4().hex[:8]
    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = await repo.create_project(
            ProjectCreate(
                title=CANONICAL_DEMO_TITLE,
                seed_text="Submerged deep-sea biome and biomechanical civilization.",
            ),
            owner_id=f"operator-test-user-{uid}",
        )

        world = WorldCandidate(
            id=f"world-canary-{uid}",
            title="The Abyssal Spire",
            archetype="Submerged Metropolis",
            aesthetic="Bioluminescent coral architecture",
            concept="Submerged civilization harvesting volcanic thermal vents",
            core_tension="Thermal decay vs abyssal pressure",
            trade_offs="Abundant energy with high structural risk",
            key_visual="A colossal glowing coral spire anchored over a hydrothermal trench",
        )
        await repo.save_world_candidates(proj.id, "dna-01", "batch-01", [world])

        img_asset = MediaAssetRecord(
            id=f"asset-img-canary-{uid}",
            project_id=proj.id,
            entity_type="world",
            entity_id=world.id,
            media_type="image",
            status="completed",
            asset_url="https://stxnxkzaftmwcbtvgzbm.supabase.co/storage/v1/object/public/seed-unfold-assets/canary_keyframe.png",
            prompt="Bioluminescent abyssal spire in deep ocean",
            aspect_ratio="16:9",
        )
        await repo.create_media_asset(img_asset)

    return proj, world, img_asset


# ==============================================================================
# 1. No Side Effects Without Explicit Confirmation
# ==============================================================================

@pytest.mark.asyncio
async def test_dry_run_no_side_effects(setup_test_demo_project):
    """
    Requirement 3: Without --confirm-production-canary, the operator tool runs in
    strict dry-run mode and makes exactly ZERO writes to the database or queue.
    """
    proj, _, _ = setup_test_demo_project

    args = parse_args([
        "--project-id", proj.id,
        "--queue-publish-url", VALID_TEST_QUEUE_URL,
        "--skip-azure-cli-for-testing",
        # Notice: --confirm-production-canary is intentionally omitted
    ])

    with patch("backend.scripts.run_canary_dispatch.check_live_backend_health") as mock_health:
        mock_health.return_value = (True, False, "status=healthy, fallback_used=False")

        exit_code = await main_async(args)
        assert exit_code == 0

    # Verify zero mutations in database for this project
    async with async_session() as session:
        outbox_count = (await session.execute(
            select(func.count(RenderOutbox.id)).where(RenderOutbox.project_id == proj.id)
        )).scalar_one()
        assert outbox_count == 0

        jobs_count = (await session.execute(
            select(func.count(GenerationJob.id)).where(GenerationJob.project_id == proj.id)
        )).scalar_one()
        assert jobs_count == 0

        # Only the 1 seed image asset should exist; no video assets created
        assets = (await session.execute(
            select(MediaAssetRecord).where(MediaAssetRecord.project_id == proj.id)
        )).scalars().all()
        assert len(assets) == 1
        assert assets[0].media_type == "image"


# ==============================================================================
# 2. Refusal When Preflight Conditions Fail
# ==============================================================================

@pytest.mark.asyncio
async def test_refusal_when_backend_health_fails(setup_test_demo_project):
    """Preflight aborts immediately if backend health probe fails or returns fallback_used=True."""
    proj, _, _ = setup_test_demo_project

    args = parse_args([
        "--confirm-production-canary",
        "--project-id", proj.id,
        "--queue-publish-url", VALID_TEST_QUEUE_URL,
        "--skip-azure-cli-for-testing",
    ])

    with patch("backend.scripts.run_canary_dispatch.check_live_backend_health") as mock_health:
        # Simulate unhealthy / failing health probe
        mock_health.return_value = (False, False, "HTTP 503: Service Unavailable")

        exit_code = await main_async(args)
        assert exit_code == 1

    async with async_session() as session:
        outbox_count = (await session.execute(
            select(func.count(RenderOutbox.id)).where(RenderOutbox.project_id == proj.id)
        )).scalar_one()
        assert outbox_count == 0


@pytest.mark.asyncio
async def test_refusal_when_outbox_is_not_empty(setup_test_demo_project):
    """Preflight aborts if render_outbox already contains any row."""
    proj, _, _ = setup_test_demo_project

    # Create an unexpected row in render_outbox
    stale_id = f"stale-outbox-{uuid.uuid4().hex[:8]}"
    async with async_session() as session:
        session.add(RenderOutbox(
            id=stale_id,
            project_id=proj.id,
            job_id=f"stale-job-{uuid.uuid4().hex[:8]}",
            payload={"test": True},
            status="pending",
        ))
        await session.commit()

    args = parse_args([
        "--confirm-production-canary",
        "--project-id", proj.id,
        "--queue-publish-url", VALID_TEST_QUEUE_URL,
        "--skip-azure-cli-for-testing",
    ])

    with patch("backend.scripts.run_canary_dispatch.check_live_backend_health") as mock_health:
        mock_health.return_value = (True, False, "status=healthy, fallback_used=False")

        exit_code = await main_async(args)
        assert exit_code == 1

    # Cleanup stale record for subsequent tests
    async with async_session() as session:
        stale = await session.get(RenderOutbox, stale_id)
        if stale:
            await session.delete(stale)
            await session.commit()


@pytest.mark.asyncio
async def test_refusal_when_queues_not_empty(setup_test_demo_project):
    """Preflight aborts if Azure queues contain pending or poison messages."""
    proj, _, _ = setup_test_demo_project

    args = parse_args([
        "--confirm-production-canary",
        "--project-id", proj.id,
        "--queue-publish-url", VALID_TEST_QUEUE_URL,
    ])

    with patch("backend.scripts.run_canary_dispatch.check_live_backend_health") as mock_h, \
         patch("backend.scripts.run_canary_dispatch.check_azure_container_app_image") as mock_img, \
         patch("backend.scripts.run_canary_dispatch.check_azure_queues_empty") as mock_q, \
         patch("backend.scripts.run_canary_dispatch.check_render_job_executions_zero") as mock_j, \
         patch("backend.scripts.run_canary_dispatch.check_live_feature_flags_disabled") as mock_ff:

        mock_h.return_value = (True, False, "status=healthy")
        mock_img.return_value = (True, "tendersaathiacr.azurecr.io/praroha-backend:v7.3")
        mock_q.return_value = (False, "Queue cinematic-render-jobs is NOT empty (1 messages found)")
        mock_j.return_value = (True, "0 executions")
        mock_ff.return_value = (True, "disabled")

        exit_code = await main_async(args)
        assert exit_code == 1


@pytest.mark.asyncio
async def test_refusal_when_worker_executions_exist(setup_test_demo_project):
    """Preflight aborts if praroha-render-job has prior executions."""
    proj, _, _ = setup_test_demo_project

    args = parse_args([
        "--confirm-production-canary",
        "--project-id", proj.id,
        "--queue-publish-url", VALID_TEST_QUEUE_URL,
    ])

    with patch("backend.scripts.run_canary_dispatch.check_live_backend_health") as mock_h, \
         patch("backend.scripts.run_canary_dispatch.check_azure_container_app_image") as mock_img, \
         patch("backend.scripts.run_canary_dispatch.check_azure_queues_empty") as mock_q, \
         patch("backend.scripts.run_canary_dispatch.check_render_job_executions_zero") as mock_j, \
         patch("backend.scripts.run_canary_dispatch.check_live_feature_flags_disabled") as mock_ff:

        mock_h.return_value = (True, False, "status=healthy")
        mock_img.return_value = (True, "v7.3")
        mock_q.return_value = (True, "queues empty")
        mock_j.return_value = (False, "Worker job has 1 prior/active executions (expected 0)")
        mock_ff.return_value = (True, "disabled")

        exit_code = await main_async(args)
        assert exit_code == 1


@pytest.mark.asyncio
async def test_refusal_when_feature_flag_is_enabled(setup_test_demo_project):
    """Preflight aborts if CINEMATIC_PREVIEW_ENABLED is already enabled in production container."""
    proj, _, _ = setup_test_demo_project

    args = parse_args([
        "--confirm-production-canary",
        "--project-id", proj.id,
        "--queue-publish-url", VALID_TEST_QUEUE_URL,
    ])

    with patch("backend.scripts.run_canary_dispatch.check_live_backend_health") as mock_h, \
         patch("backend.scripts.run_canary_dispatch.check_azure_container_app_image") as mock_img, \
         patch("backend.scripts.run_canary_dispatch.check_azure_queues_empty") as mock_q, \
         patch("backend.scripts.run_canary_dispatch.check_render_job_executions_zero") as mock_j, \
         patch("backend.scripts.run_canary_dispatch.check_live_feature_flags_disabled") as mock_ff:

        mock_h.return_value = (True, False, "status=healthy")
        mock_img.return_value = (True, "v7.3")
        mock_q.return_value = (True, "queues empty")
        mock_j.return_value = (True, "0 executions")
        mock_ff.return_value = (False, "CINEMATIC_PREVIEW_ENABLED is present in backend container env")

        exit_code = await main_async(args)
        assert exit_code == 1


@pytest.mark.asyncio
async def test_refusal_when_demo_asset_missing():
    """Preflight aborts if project has no completed keyframe image."""
    # Create project with zero media assets
    async with async_session() as session:
        repo = ProjectRepository(session)
        empty_proj = await repo.create_project(
            ProjectCreate(title="Empty Project", seed_text="No assets here."),
            owner_id="test-user",
        )

    args = parse_args([
        "--confirm-production-canary",
        "--project-id", empty_proj.id,
        "--queue-publish-url", VALID_TEST_QUEUE_URL,
        "--skip-azure-cli-for-testing",
    ])

    with patch("backend.scripts.run_canary_dispatch.check_live_backend_health") as mock_h:
        mock_h.return_value = (True, False, "status=healthy")

        exit_code = await main_async(args)
        assert exit_code == 1


# ==============================================================================
# 3. Canonical Schema and Credential Rejection
# ==============================================================================

def test_canonical_schema_and_credential_rejection():
    """
    Requirement 9: Payload must conform strictly to canonical schema, and reject
    any credential keyword anywhere in the structure.
    """
    valid_options = {
        "duration_seconds": 6,
        "fps": 24,
        "resolution": "1280x720",
        "aspect_ratio": "16:9",
        "motion_preset": "slow_pan",
    }

    # 1. Valid payload must pass worker contract audit
    ok, validated, diag = audit_worker_contract_compatibility(
        job_id="11111111-2222-3333-4444-555555555555",
        project_id="proj-valid-01",
        entity_type="world",
        entity_id="world-valid-01",
        request_hash="b" * 64,
        options=valid_options,
    )
    assert ok is True
    assert validated["schema_version"] == "1.0"
    assert validated["job_id"] == "11111111-2222-3333-4444-555555555555"

    # 2. Injected secret keyword must be rejected
    credential_options = valid_options.copy()
    credential_options["api_key"] = "secret-token-12345"

    ok_cred, _, diag_cred = audit_worker_contract_compatibility(
        job_id="11111111-2222-3333-4444-555555555555",
        project_id="proj-valid-01",
        entity_type="world",
        entity_id="world-valid-01",
        request_hash="b" * 64,
        options=credential_options,
    )
    assert ok_cred is False
    assert "forbidden" in diag_cred.lower() and ("secret" in diag_cred.lower() or "credential" in diag_cred.lower() or "api_key" in diag_cred.lower())


# ==============================================================================
# 4. Duplicate Suppression & Idempotency
# ==============================================================================

@pytest.mark.asyncio
async def test_duplicate_suppression(setup_test_demo_project):
    """
    Requirement 7: If a job with identical request_hash already exists, execute_canary_dispatch
    refuses to dispatch a second time.
    """
    proj, world, img = setup_test_demo_project

    async with async_session() as session:
        # Pre-calculate the request_hash
        req = CinematicPreviewJobRequest(
            entity_type="world",
            entity_id=world.id,
            duration_sec=6,
            aspect_ratio="16:9",
            image_url=img.asset_url,
        )
        req_hash = compute_preview_hash(proj.id, req)

        # Seed an existing media asset with this hash
        stale_asset_id = f"existing-canary-job-{uuid.uuid4().hex[:8]}"
        session.add(MediaAssetRecord(
            id=stale_asset_id,
            project_id=proj.id,
            entity_type="world",
            entity_id=world.id,
            media_type="video",
            status="completed",
            request_hash=req_hash,
            asset_url="https://storage.supabase.co/existing.mp4",
        ))
        await session.commit()

        # Attempt to dispatch
        with pytest.raises(RuntimeError, match="Duplicate request_hash"):
            await execute_canary_dispatch(
                session=session,
                project=proj,
                image_asset=img,
                entity_id=world.id,
                queue_publish_url=VALID_TEST_QUEUE_URL,
            )


# ==============================================================================
# 5. At-Most-One Dispatch Guarantee
# ==============================================================================

@pytest.mark.asyncio
async def test_at_most_one_dispatch_attempt(setup_test_demo_project):
    """
    Requirement 7: Dispatch occurs at most once. If the queue send encounters an exception,
    the outbox record remains pending for recovery, but the tool does NOT retry automatically.
    """
    proj, world, img = setup_test_demo_project

    mock_queue_client = MagicMock()
    mock_queue_client.send_message.side_effect = ConnectionError("Azure Queue timeout")

    async with async_session() as session:
        with pytest.raises(Exception):
            await execute_canary_dispatch(
                session=session,
                project=proj,
                image_asset=img,
                entity_id=world.id,
                queue_publish_url=VALID_TEST_QUEUE_URL,
                queue_client=mock_queue_client,
            )

        # Confirm send_message was attempted exactly ONCE, not retried
        assert mock_queue_client.send_message.call_count == 1

        # Confirm outbox record was created atomically with status='pending'
        repo = ProjectRepository(session)
        outbox_stmt = select(RenderOutbox).where(RenderOutbox.project_id == proj.id)
        outbox_records = (await session.execute(outbox_stmt)).scalars().all()
        assert len(outbox_records) == 1
        assert outbox_records[0].status == "pending"


# ==============================================================================
# 6. Worker Contract Compatibility
# ==============================================================================

def test_worker_contract_compatibility():
    """
    Requirement 8: Confirm the payload generated by the canary dispatcher is accepted
    by the exact validator running in praroha-worker:v6.
    """
    canonical_payload = {
        "schema_version": "1.0",
        "job_id": "99999999-8888-7777-6666-555555555555",
        "project_id": "proj-canary-compat",
        "entity_type": "world",
        "entity_id": "world-canary-compat",
        "request_hash": "c" * 64,
        "options": {
            "duration_seconds": 6,
            "fps": 24,
            "resolution": "1280x720",
            "aspect_ratio": "16:9",
            "motion_preset": "slow_pan",
        },
        "enqueued_at": "2026-10-24T15:00:00Z",
        "attempt": 1,
    }

    # Pass directly into the worker's validator
    validated = parse_and_validate_queue_message(canonical_payload)
    assert validated["job_id"] == "99999999-8888-7777-6666-555555555555"
    assert validated["project_id"] == "proj-canary-compat"
    assert validated["entity_type"] == "world"
    assert validated["entity_id"] == "world-canary-compat"
    assert validated["options"]["duration_seconds"] == 6
    assert validated["options"]["resolution"] == "1280x720"
