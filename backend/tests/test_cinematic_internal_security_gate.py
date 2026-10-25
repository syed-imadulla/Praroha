"""
Unit and regression test suite for Phase 52: Cinematic Preview Internal-Only Security Gate.

Proves:
1. Disabled feature flag (CINEMATIC_PREVIEW_ENABLED=False) rejects with HTTP 503
   before any authorization or dispatch checks, with 0 DB records and 0 queue messages.
2. Enabling CINEMATIC_PREVIEW_ENABLED=True with CINEMATIC_PREVIEW_PUBLIC_ENABLED=False
   (internal verification mode) strictly prevents ordinary authenticated users from
   enqueuing renders (HTTP 403 Forbidden).
3. Client-supplied role claims (e.g. role='admin') are rejected if the user's verified
   email is not in the server-side CINEMATIC_OPERATOR_EMAILS or ADMIN_EMAILS allowlist.
4. System fails closed when no operator emails are configured (HTTP 403 Forbidden).
5. System fails closed when the user email is missing or empty (HTTP 403 Forbidden).
6. Authorized internal operators (email in allowlist) successfully enqueue renders (HTTP 202).
7. Public mode (CINEMATIC_PREVIEW_PUBLIC_ENABLED=True) allows ordinary authenticated project owners.
8. Both endpoints (/cinematic-preview/jobs and /cinematic-preview/generate) enforce identical gates.
9. Rejected requests create ZERO database records (render_outbox, generation_jobs, media_assets)
   and dispatch ZERO queue messages.
"""

from unittest.mock import MagicMock, patch
import pytest
import pytest_asyncio
from sqlalchemy import select

from backend.app.config import settings
from backend.app.core.auth import AuthenticatedUser, get_current_user
from backend.app.main import app
from backend.app.models.job import GenerationJob
from backend.app.models.media import MediaAssetRecord
from backend.app.models.outbox import RenderOutbox
from backend.app.models.project import ProjectCreate
from backend.app.models.world import WorldCandidate
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import ProjectRepository, async_session

VALID_QUEUE_URL = "https://stpraroharender.queue.core.windows.net/cinematic-render-jobs?sp=a&sig=MOCK_SIG"


@pytest_asyncio.fixture
async def setup_test_project():
    """Create test project and world candidate with keyframe art."""
    import uuid
    uid = uuid.uuid4().hex[:8]
    async with async_session() as session:
        repo = ProjectRepository(session)
        proj = await repo.create_project(
            ProjectCreate(
                title=f"Vesta: Security Test {uid}",
                seed_text="Subterranean core testing installation.",
            ),
            owner_id="regular-user-id",
        )

        world = WorldCandidate(
            id=f"world-sec-{uid}",
            title="Vesta Core Sector",
            archetype="Subterranean Civilization",
            concept="Thermal-powered mining hubs.",
            aesthetic="Obsidian rock and glowing molten channels.",
            core_tension="Mantle eruptions vs structural stability.",
            trade_offs="High energy yield at extreme volcanic risk.",
            key_visual="A massive drill platform over an obsidian abyss.",
        )
        await repo.save_world_candidates(proj.id, "dna-sec", "batch-sec", [world])

        img_asset = MediaAssetRecord(
            id=f"asset-sec-{uid}",
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


@pytest.fixture
def mock_queue():
    with patch("azure.storage.queue.QueueClient.from_queue_url") as mock_from_url:
        mock_client = MagicMock()
        mock_client.send_message.return_value = {"message_id": "mock-sec-msg-id"}
        mock_from_url.return_value = mock_client
        yield mock_client


async def count_db_records(project_id: str) -> dict:
    """Helper to verify zero side-effects in database."""
    async with async_session() as session:
        outbox_res = await session.execute(
            select(RenderOutbox).where(RenderOutbox.project_id == project_id)
        )
        jobs_res = await session.execute(
            select(GenerationJob).where(GenerationJob.project_id == project_id)
        )
        assets_res = await session.execute(
            select(MediaAssetRecord).where(
                MediaAssetRecord.project_id == project_id,
                MediaAssetRecord.media_type == "video",
            )
        )
        return {
            "outbox_count": len(outbox_res.scalars().all()),
            "jobs_count": len(jobs_res.scalars().all()),
            "video_assets_count": len(assets_res.scalars().all()),
        }


@pytest.mark.asyncio
async def test_feature_flag_disabled_rejects_with_503_and_zero_side_effects(
    client, setup_test_project, mock_queue
):
    """
    When CINEMATIC_PREVIEW_ENABLED=False, requests MUST return HTTP 503 Service Unavailable
    without evaluating authorization or creating any database records or queue messages.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = False
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Test ordinary user
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="regular-user-id", email="user@example.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 503
    assert "disabled on this server" in resp.json()["error"]["message"]

    # Test alias endpoint as well
    resp_alias = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/generate",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp_alias.status_code == 503

    # Assert 0 side effects
    db_counts = await count_db_records(proj.id)
    assert db_counts["outbox_count"] == 0
    assert db_counts["jobs_count"] == 0
    assert db_counts["video_assets_count"] == 0
    assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_internal_mode_rejects_ordinary_authenticated_user_with_403(
    client, setup_test_project, mock_queue
):
    """
    When CINEMATIC_PREVIEW_ENABLED=True but CINEMATIC_PREVIEW_PUBLIC_ENABLED=False,
    ordinary authenticated users (even if they own the project) MUST be rejected with HTTP 403 Forbidden.
    Zero outbox rows, zero jobs, zero queue messages.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "authorized.operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Caller is project owner, but NOT an operator
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="regular-user-id", email="regular.user@example.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 403
    assert "restricted to authorized operators" in resp.json()["error"]["message"]

    # Verify zero side-effects
    db_counts = await count_db_records(proj.id)
    assert db_counts["outbox_count"] == 0
    assert db_counts["jobs_count"] == 0
    assert db_counts["video_assets_count"] == 0
    assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_internal_mode_rejects_client_role_spoofing(
    client, setup_test_project, mock_queue
):
    """
    Client-supplied role claims (e.g. role='admin' or role='operator') MUST NEVER bypass
    operator verification. Access strictly checks server-side email allowlist.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "authorized.operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Attacker crafts role="admin"
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="regular-user-id",
        email="attacker@external-domain.com",
        role="admin",  # Client-supplied claim attempt
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 403
    assert "restricted to authorized operators" in resp.json()["error"]["message"]

    db_counts = await count_db_records(proj.id)
    assert db_counts["outbox_count"] == 0
    assert db_counts["jobs_count"] == 0
    assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_internal_mode_fails_closed_when_allowlist_unconfigured(
    client, setup_test_project, mock_queue
):
    """
    If CINEMATIC_OPERATOR_EMAILS and ADMIN_EMAILS are both unset/empty,
    the gate MUST fail closed (HTTP 403) for all users.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = ""
    settings.ADMIN_EMAILS = ""
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="regular-user-id", email="anyone@example.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 403
    assert "restricted to authorized operators" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_internal_mode_fails_closed_when_user_email_missing(
    client, setup_test_project, mock_queue
):
    """
    If the caller's verified token lacks an email claim, access MUST fail closed (HTTP 403).
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="regular-user-id", email=None
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 403
    assert "restricted to authorized operators" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_internal_mode_allows_authorized_operator(
    client, setup_test_project, mock_queue
):
    """
    When the caller's email matches CINEMATIC_OPERATOR_EMAILS and they own the project,
    the job is cleanly enqueued with HTTP 202.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Update project owner to operator
    async with async_session() as session:
        repo = ProjectRepository(session)
        p = await repo.get_project(proj.id)
        p.owner_id = "operator-user-id"
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="operator-user-id", email="operator@praroha.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 202
    data = resp.json()["data"]
    assert data["job_id"] is not None
    assert data["status"] in ("queued", "processing", "completed")

    # Verify 1 outbox row published and 1 queue message sent
    db_counts = await count_db_records(proj.id)
    assert db_counts["outbox_count"] == 1
    assert db_counts["jobs_count"] == 1
    assert db_counts["video_assets_count"] == 1
    assert mock_queue.send_message.call_count == 1


@pytest.mark.asyncio
async def test_internal_mode_allows_admin_email(
    client, setup_test_project, mock_queue
):
    """
    ADMIN_EMAILS list also qualifies for operator access during internal verification.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = ""
    settings.ADMIN_EMAILS = "admin@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Update project owner to admin
    async with async_session() as session:
        repo = ProjectRepository(session)
        p = await repo.get_project(proj.id)
        p.owner_id = "admin-user-id"
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="admin-user-id", email="admin@praroha.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 202
    assert mock_queue.send_message.call_count == 1


@pytest.mark.asyncio
async def test_public_mode_allows_ordinary_authenticated_project_owner(
    client, setup_test_project, mock_queue
):
    """
    When CINEMATIC_PREVIEW_PUBLIC_ENABLED=True, ordinary authenticated project owners
    can trigger preview jobs without being in the operator list.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = True
    settings.CINEMATIC_OPERATOR_EMAILS = ""
    settings.ADMIN_EMAILS = ""
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Reset owner to regular user
    async with async_session() as session:
        repo = ProjectRepository(session)
        p = await repo.get_project(proj.id)
        p.owner_id = "regular-user-id"
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="regular-user-id", email="regular.user@example.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 202
    assert mock_queue.send_message.call_count == 1


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected_with_401_on_both_endpoints(
    setup_test_project, mock_queue
):
    """
    Unauthenticated requests (missing/invalid Bearer token) MUST return HTTP 401 Unauthorized
    on both /jobs and /generate endpoints before any processing.
    """
    from httpx import ASGITransport, AsyncClient
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Clear any dependency overrides to test raw unauthenticated request
    orig_overrides = dict(app.dependency_overrides)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as raw_client:
            # 1. /jobs endpoint
            resp_jobs = await raw_client.post(
                f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
                json={"entity_type": "world", "entity_id": world.id},
            )
            assert resp_jobs.status_code == 401

            # 2. /generate endpoint
            resp_gen = await raw_client.post(
                f"/api/projects/{proj.id}/media/cinematic-preview/generate",
                json={"entity_type": "world", "entity_id": world.id},
            )
            assert resp_gen.status_code == 401

        # Assert zero side effects
        db_counts = await count_db_records(proj.id)
        assert db_counts["outbox_count"] == 0
        assert db_counts["jobs_count"] == 0
        assert mock_queue.send_message.call_count == 0
    finally:
        app.dependency_overrides = orig_overrides


@pytest.mark.asyncio
async def test_project_ownership_violation_rejected_with_404_even_for_operator(
    client, setup_test_project, mock_queue
):
    """
    Even an authorized internal operator cannot trigger renders for projects they do not own.
    Must return 404 Not Found, creating zero records.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # Project is owned by 'regular-user-id', caller is operator
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="operator-user-id", email="operator@praroha.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 404

    # Assert zero side effects
    db_counts = await count_db_records(proj.id)
    assert db_counts["outbox_count"] == 0
    assert db_counts["jobs_count"] == 0
    assert mock_queue.send_message.call_count == 0


@pytest.mark.asyncio
async def test_malformed_allowlist_fails_closed_with_403(
    client, setup_test_project, mock_queue
):
    """
    Malformed allowlists (e.g. whitespace, commas with no valid email) MUST fail closed.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "  , notanemail,  ,,, random_text "
    settings.ADMIN_EMAILS = "  ,  ,, "
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="operator-user-id", email="operator@praroha.com"
    )

    resp = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp.status_code == 403
    assert "restricted to authorized operators" in resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_route_alias_enforces_identical_operator_gate(
    client, setup_test_project, mock_queue
):
    """
    Verify /api/projects/{proj.id}/media/cinematic-preview/generate strictly enforces
    the same operator gate as /jobs.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    # 1. Ordinary user -> 403
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="regular-user-id", email="regular.user@example.com"
    )
    resp_unauth = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/generate",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp_unauth.status_code == 403
    assert "restricted to authorized operators" in resp_unauth.json()["error"]["message"]

    # 2. Authorized operator -> 202
    async with async_session() as session:
        repo = ProjectRepository(session)
        p = await repo.get_project(proj.id)
        p.owner_id = "operator-user-id"
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="operator-user-id", email="operator@praroha.com"
    )
    resp_auth = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/generate",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp_auth.status_code == 202
    assert resp_auth.json()["data"]["job_id"] is not None


@pytest.mark.asyncio
async def test_authorized_operator_duplicate_requests_idempotent(
    client, setup_test_project, mock_queue
):
    """
    Duplicate requests by an authorized operator attach to the active job idempotently.
    """
    proj, world, _ = setup_test_project
    settings.CINEMATIC_PREVIEW_ENABLED = True
    settings.CINEMATIC_PREVIEW_PUBLIC_ENABLED = False
    settings.CINEMATIC_OPERATOR_EMAILS = "operator@praroha.com"
    settings.QUEUE_PUBLISH_URL = VALID_QUEUE_URL

    async with async_session() as session:
        repo = ProjectRepository(session)
        p = await repo.get_project(proj.id)
        p.owner_id = "operator-user-id"
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="operator-user-id", email="operator@praroha.com"
    )

    # First request
    resp1 = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp1.status_code == 202
    job_id_1 = resp1.json()["data"]["job_id"]

    # Second duplicate request (clicking again while queued)
    resp2 = await client.post(
        f"/api/projects/{proj.id}/media/cinematic-preview/jobs",
        json={"entity_type": "world", "entity_id": world.id},
    )
    assert resp2.status_code == 202
    job_id_2 = resp2.json()["data"]["job_id"]

    assert job_id_1 == job_id_2

    # Exactly 1 outbox record, 1 job record in DB
    db_counts = await count_db_records(proj.id)
    assert db_counts["outbox_count"] == 1
    assert db_counts["jobs_count"] == 1

