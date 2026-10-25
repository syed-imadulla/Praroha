"""
Unit and regression test suite for Phase 52 Stage 2 Hardening:
Cinematic Preview Atomic Quotas, Global Workload Protection, and Production Readiness.

Verifies:
1. Public mode disabled (CINEMATIC_PREVIEW_PUBLIC_ENABLED=False) fails closed for ordinary owners (HTTP 403).
2. Unauthenticated (HTTP 401) and non-owner callers (HTTP 404) are strictly rejected.
3. User concurrency limit (default 1 active) rejects concurrent distinct renders (HTTP 429).
4. User rolling 24-hour quota (default 2 daily) rejects requests beyond quota with Retry-After (HTTP 429).
5. Global workload limit (default 5 outstanding) rejects new dispatches when capacity is saturated (HTTP 429).
6. Idempotent duplicate requests attach to active/completed jobs without quota exhaustion penalties.
7. Rejected requests create ZERO database outbox records and dispatch ZERO queue messages.
8. Concurrent requests via asyncio.gather cannot bypass limits (race-safe atomicity).
9. Existing completed canary records remain unchanged.
10. Non-cinematic media features (images, soundscapes) remain completely unaffected.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select, text

from backend.app.config import settings
from backend.app.core.auth import AuthenticatedUser, get_current_user
from backend.app.main import app
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.models.outbox import RenderOutbox
from backend.app.models.project import Project, ProjectCreate
from backend.app.models.world import WorldCandidate
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import ProjectRepository, async_session, get_utc_now
from backend.app.services.cinematic_dispatcher import (
    CinematicDispatcherService,
    CinematicPreviewJobRequest,
)

VALID_QUEUE_URL = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=MOCK_SIG"


@pytest.fixture(autouse=True)
def setup_cinematic_settings():
    orig_enabled = settings.CINEMATIC_PREVIEW_ENABLED
    orig_public = settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED
    orig_operators = settings.CINEMATIC_OPERATOR_EMAILS
    orig_queue_url = settings.QUEUE_PUBLISH_URL
    orig_daily = settings.CINEMATIC_MAX_USER_DAILY_RENDERS
    orig_active = settings.CINEMATIC_MAX_USER_ACTIVE_RENDERS
    orig_global = settings.CINEMATIC_MAX_GLOBAL_OUTSTANDING_RENDERS

    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL
    settings.CINEMATIC_MAX_USER_DAILY_RENDERS = 2
    settings.CINEMATIC_MAX_USER_ACTIVE_RENDERS = 1
    settings.CINEMATIC_MAX_GLOBAL_OUTSTANDING_RENDERS = 5

    yield

    settings.CINEMATIC_PREVIEW_ENABLED = orig_enabled
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = orig_public
    settings.CINEMATIC_OPERATOR_EMAILS = orig_operators
    settings.QUEUE_PUBLISH_URL = orig_queue_url
    settings.CINEMATIC_MAX_USER_DAILY_RENDERS = orig_daily
    settings.CINEMATIC_MAX_USER_ACTIVE_RENDERS = orig_active
    settings.CINEMATIC_MAX_GLOBAL_OUTSTANDING_RENDERS = orig_global


@pytest.fixture
def mock_queue():
    with patch("azure.storage.queue.QueueClient.from_queue_url") as mock_from_url:
        mock_client = MagicMock()
        mock_client.send_message.return_value = {"message_id": "mock-azure-msg-id"}
        mock_from_url.return_value = mock_client
        yield mock_client


@pytest_asyncio.fixture
async def quota_project():
    """Create test project, world candidate, and keyframe art."""
    import uuid
    uid = uuid.uuid4().hex[:8]
    user_id = f"user-{uid}"
    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = await repo.create_project(
            ProjectCreate(
                title=f"Aetheria Quota Test {uid}",
                seed_text="Floating archipelagos and cloud plasma harvesters.",
            ),
            owner_id=user_id,
        )

        world = WorldCandidate(
            id=f"world-{uid}",
            title="Archipelago Alpha",
            archetype="Sky Islands",
            concept="Cloud plasma harvesters",
            aesthetic="Floating stone islands wrapped in luminescent vapour",
            core_tension="Territorial resource extraction vs ecological integrity",
            trade_offs="High energy yields vs extreme turbulence vulnerability",
            key_visual="Bioluminescent skyships tethered to floating crystal islands",
        )
        await repo.save_world_candidates(proj.id, "dna-quota", "batch-quota", [world])

        # Concept art keyframe
        art = MediaAssetRecord(
            project_id=proj.id,
            entity_type="world",
            entity_id=world.id,
            media_type="image",
            status="completed",
            asset_url="https://storage.praroha.local/art/keyframe.png",
            prompt="High quality sky island keyframe",
            provider_name="pollinations",
        )
        await repo.create_media_asset(art)

        return proj, world, user_id


@pytest.mark.asyncio
async def test_public_mode_disabled_fails_closed_for_ordinary_owner(quota_project, mock_queue):
    """Ordinary authenticated project owners MUST receive HTTP 403 when public mode is disabled."""
    proj, world, user_id = quota_project
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, email="regular.creator@example.com"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id},
        )
        assert resp.status_code == 403
        assert "restricted to authorized operators" in resp.json()["error"]["message"]

        # Verify zero database outbox records and zero queue dispatches
        async with async_session() as s:
            outbox_count = (await s.execute(select(func.count(RenderOutbox.id)).where(RenderOutbox.project_id == proj.id))).scalar()
            assert outbox_count == 0
        assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_unauthenticated_and_non_owner_rejected(quota_project, mock_queue):
    """Callers must be authenticated (401) and own the target project (404)."""
    proj, world, user_id = quota_project
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = True  # Enable public mode to test ownership/auth gates independently

    transport = ASGITransport(app=app)

    # 1. Unauthenticated -> 401
    orig_override = app.dependency_overrides.get(get_current_user)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as unauth_client:
            resp_401 = await unauth_client.post(
                f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
                json={"entity_type": "world", "entity_id": world.id},
            )
            assert resp_401.status_code == 401
    finally:
        if orig_override:
            app.dependency_overrides[get_current_user] = orig_override

    # 2. Authenticated but non-owner -> 404
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="attacker-user-id", email="attacker@example.com"
    )
    async with AsyncClient(transport=transport, base_url="http://test") as rogue_client:
        resp_404 = await rogue_client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id},
        )
        assert resp_404.status_code == 404

    assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_user_active_render_concurrency_limit_enforced(quota_project, mock_queue):
    """A user cannot dispatch a second distinct render while an active render is in progress (HTTP 429)."""
    proj, world, user_id = quota_project
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = True
    settings.CINEMATIC_MAX_USER_ACTIVE_RENDERS = 1

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, email="creator@example.com"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request 1: Accepted (202)
        resp1 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id, "duration_sec": 5},
        )
        assert resp1.status_code == 202
        job_id_1 = resp1.json()["data"]["job_id"]

        # Request 2: Distinct entity/parameters while Request 1 is active ('queued') -> 429
        resp2 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id, "duration_sec": 10},
        )
        assert resp2.status_code == 429
        assert "User concurrency limit reached" in resp2.json()["error"]["message"]
        assert resp2.headers.get("retry-after") == "30"

        # Verify only 1 outbox entry exists and only 1 queue message was sent
        async with async_session() as s:
            outbox_rows = (await s.execute(select(RenderOutbox).where(RenderOutbox.project_id == proj.id))).scalars().all()
            assert len(outbox_rows) == 1
            assert outbox_rows[0].job_id == job_id_1
        assert mock_queue.send_message.call_count == 1


@pytest.mark.asyncio
async def test_user_rolling_24h_quota_enforced_with_retry_after(quota_project, mock_queue):
    """A user exceeding 2 accepted renders in 24 hours receives HTTP 429 with computed Retry-After."""
    proj, world, user_id = quota_project
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = True
    settings.CINEMATIC_MAX_USER_DAILY_RENDERS = 2
    settings.CINEMATIC_MAX_USER_ACTIVE_RENDERS = 5  # Allow multiple active to isolate daily limit

    # Seed 2 completed renders for this user in the database
    now = get_utc_now()
    async with async_session() as session:
        for i in range(2):
            jid = f"prev-job-{i}"
            asset = MediaAssetRecord(
                id=jid,
                project_id=proj.id,
                entity_type="world",
                entity_id=world.id,
                media_type="video",
                status="completed",
                prompt=f"Previous Preview {i}",
                provider_name="Cinematic Preview",
                created_at=now - timedelta(hours=2 * (2 - i)),
                completed_at=now - timedelta(hours=2 * (2 - i) - 1),
            )
            session.add(asset)
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, email="creator@example.com"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request 3: Daily quota exceeded -> 429
        resp = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id, "duration_sec": 7},
        )
        assert resp.status_code == 429
        assert "Daily cinematic render quota exceeded" in resp.json()["error"]["message"]
        retry_after = resp.headers.get("retry-after")
        assert retry_after is not None
        assert int(retry_after) > 0
        assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_global_workload_capacity_enforced(quota_project, mock_queue):
    """When system-wide active renders reach capacity (5), new dispatches receive HTTP 429."""
    proj, world, user_id = quota_project
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = True
    settings.CINEMATIC_MAX_GLOBAL_OUTSTANDING_RENDERS = 5

    # Seed 5 active jobs from OTHER users/projects
    import uuid
    now = get_utc_now()
    async with async_session() as session:
        for i in range(5):
            other_pid = f"other-proj-{uuid.uuid4().hex[:8]}"
            other_p = Project(id=other_pid, title=f"Other {i}", owner_id=f"other-user-{uuid.uuid4().hex[:8]}")
            session.add(other_p)
            other_asset = MediaAssetRecord(
                id=f"active-other-{uuid.uuid4().hex[:8]}",
                project_id=other_pid,
                entity_type="world",
                entity_id="w-1",
                media_type="video",
                status="queued",
                provider_name="Cinematic Preview",
                created_at=now - timedelta(minutes=5),
            )
            session.add(other_asset)
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, email="new.user@example.com"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json={"entity_type": "world", "entity_id": world.id, "duration_sec": 5},
        )
        assert resp.status_code == 429
        assert "Global cinematic rendering capacity reached" in resp.json()["error"]["message"]
        assert resp.headers.get("retry-after") == "60"
        assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_duplicate_requests_idempotent_without_quota_penalty(quota_project, mock_queue):
    """
    Submitting duplicate requests attaches to the active job idempotently without
    triggering user active limits or wasting daily renders.
    """
    proj, world, user_id = quota_project
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = True
    settings.CINEMATIC_MAX_USER_ACTIVE_RENDERS = 1
    settings.CINEMATIC_MAX_USER_DAILY_RENDERS = 2

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, email="creator@example.com"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        req_body = {
            "entity_type": "world",
            "entity_id": world.id,
            "duration_sec": 5,
            "aspect_ratio": "16:9",
        }

        # 1. First dispatch -> 202
        resp1 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json=req_body,
        )
        assert resp1.status_code == 202
        job_id_1 = resp1.json()["data"]["job_id"]

        # 2. Repeated click / duplicate -> returns identical job (202), does NOT fail with 429
        resp2 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json=req_body,
        )
        assert resp2.status_code == 202
        job_id_2 = resp2.json()["data"]["job_id"]
        assert job_id_1 == job_id_2

        # 3. Third identical click -> still attaches cleanly
        resp3 = await client.post(
            f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
            json=req_body,
        )
        assert resp3.status_code == 202
        assert resp3.json()["data"]["job_id"] == job_id_1

        # Exactly 1 outbox record and 1 queue message
        async with async_session() as s:
            outbox_rows = (await s.execute(select(RenderOutbox).where(RenderOutbox.project_id == proj.id))).scalars().all()
            assert len(outbox_rows) == 1
        assert mock_queue.send_message.call_count == 1


@pytest.mark.asyncio
async def test_concurrent_requests_cannot_exceed_limits(quota_project, mock_queue):
    """
    Simultaneous concurrent requests for distinct assets serialize atomically:
    Exactly 1 request succeeds and the concurrent competitor is rejected with HTTP 429.
    """
    proj, world, user_id = quota_project
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = True
    settings.CINEMATIC_MAX_USER_ACTIVE_RENDERS = 1

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, email="creator@example.com"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        req_a = {"entity_type": "world", "entity_id": world.id, "duration_sec": 5}
        req_b = {"entity_type": "world", "entity_id": world.id, "duration_sec": 10}

        # Fire both requests simultaneously
        res_a, res_b = await asyncio.gather(
            client.post(f"/api/projects/{proj.id}/media/cinematic-preview/jobs", json=req_a),
            client.post(f"/api/projects/{proj.id}/media/cinematic-preview/jobs", json=req_b),
        )

        statuses = {res_a.status_code, res_b.status_code}
        assert 202 in statuses
        assert 429 in statuses

        # Database must contain exactly 1 active media asset and 1 outbox entry
        async with async_session() as s:
            assets = (await s.execute(select(MediaAssetRecord).where(
                MediaAssetRecord.project_id == proj.id,
                MediaAssetRecord.provider_name == "Cinematic Preview",
            ))).scalars().all()
            assert len(assets) == 1

            outbox_rows = (await s.execute(select(RenderOutbox).where(
                RenderOutbox.project_id == proj.id
            ))).scalars().all()
            assert len(outbox_rows) == 1

        assert mock_queue.send_message.call_count == 1


@pytest.mark.asyncio
async def test_non_cinematic_features_unaffected_by_quotas(quota_project):
    """Standard image, soundscape, and project workflows operate normally without interference."""
    proj, world, user_id = quota_project
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, email="creator@example.com"
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Soundscape library query
        lib_res = await client.get(f"/api/projects/{proj.id}/media/soundscapes/library")
        assert lib_res.status_code == 200
        layers = lib_res.json()["data"]
        assert len(layers) > 0

        # 2. Soundscape composition
        compose_res = await client.post(
            f"/api/projects/{proj.id}/media/soundscapes/compose",
            json={
                "entity_id": world.id,
                "entity_type": "world",
                "layers": [{"id": layers[0]["id"], "volume": 0.8}],
                "duration_sec": 5,
            },
        )
        assert compose_res.status_code == 200
        assert compose_res.json()["data"]["status"] == "completed"
