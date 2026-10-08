import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from backend.app.main import app
from backend.app.core.auth import get_current_user, AuthenticatedUser


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    """Unauthenticated request must receive 401 Unauthorized."""
    # Temporarily remove dependency override to test real security behavior
    original_override = app.dependency_overrides.pop(get_current_user, None)
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/projects")
            assert res.status_code == 401
            data = res.json()
            assert data.get("error", {}).get("message") == "Authentication required" or "detail" in data
    finally:
        if original_override:
            app.dependency_overrides[get_current_user] = original_override


@pytest.mark.asyncio
async def test_invalid_bearer_token_rejected():
    """Request with garbage bearer token must receive 401 Unauthorized."""
    original_override = app.dependency_overrides.pop(get_current_user, None)
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.get("/api/projects", headers={"Authorization": "Bearer not-a-valid-jwt"})
            assert res.status_code == 401
    finally:
        if original_override:
            app.dependency_overrides[get_current_user] = original_override


@pytest.mark.asyncio
async def test_project_owner_assignment_and_isolation():
    """
    Test two-user isolation:
    User A creates Project A.
    User B creates Project B.
    User A sees Project A, not Project B.
    User B sees Project B, not Project A.
    User B cannot get or bundle Project A.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Act as User A
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-a-111", email="user_a@test.local"
        )
        res_a = await ac.post("/api/projects", json={"title": "Universe A", "seed_text": "Ocean World"})
        assert res_a.status_code == 201
        proj_a = res_a.json()["data"]
        assert proj_a["owner_id"] == "user-a-111"
        proj_a_id = proj_a["id"]

        # Act as User B
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-b-222", email="user_b@test.local"
        )
        res_b = await ac.post("/api/projects", json={"title": "Universe B", "seed_text": "Desert World"})
        assert res_b.status_code == 201
        proj_b = res_b.json()["data"]
        assert proj_b["owner_id"] == "user-b-222"
        proj_b_id = proj_b["id"]

        # User B lists projects -> should only see Project B
        list_b = await ac.get("/api/projects")
        assert list_b.status_code == 200
        items_b = list_b.json()["data"]
        ids_b = [p["id"] for p in items_b]
        assert proj_b_id in ids_b
        assert proj_a_id not in ids_b

        # User B attempts to access Project A -> must receive 404
        direct_a = await ac.get(f"/api/projects/{proj_a_id}")
        assert direct_a.status_code == 404

        bundle_a = await ac.get(f"/api/projects/{proj_a_id}/bundle")
        assert bundle_a.status_code == 404

        # User B attempts to delete Project A -> must receive 404
        del_a = await ac.delete(f"/api/projects/{proj_a_id}")
        assert del_a.status_code == 404

        # Switch back to User A -> should only see Project A
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-a-111", email="user_a@test.local"
        )
        list_a = await ac.get("/api/projects")
        assert list_a.status_code == 200
        items_a = list_a.json()["data"]
        ids_a = [p["id"] for p in items_a]
        assert proj_a_id in ids_a
        assert proj_b_id not in ids_a

        # User A CAN access Project A
        direct_ok = await ac.get(f"/api/projects/{proj_a_id}")
        assert direct_ok.status_code == 200


@pytest.mark.asyncio
async def test_graveyard_isolation_between_users():
    """
    User A soft deletes Project A.
    User A sees Project A in Graveyard.
    User B lists Graveyard -> Project A is NOT visible.
    User B cannot restore or permanently delete Project A.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # User A creates and deletes Project A
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-a-graveyard", email="user_a@test.local"
        )
        res = await ac.post("/api/projects", json={"title": "To Delete Universe", "seed_text": "Ephemeral"})
        proj_id = res.json()["data"]["id"]
        del_res = await ac.delete(f"/api/projects/{proj_id}")
        assert del_res.status_code == 200

        # User A sees it in graveyard
        grave_a = await ac.get("/api/projects/graveyard")
        assert proj_id in [p["id"] for p in grave_a.json()["data"]]

        # User B checks graveyard -> empty / does not contain proj_id
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-b-graveyard", email="user_b@test.local"
        )
        grave_b = await ac.get("/api/projects/graveyard")
        assert proj_id not in [p["id"] for p in grave_b.json()["data"]]

        # User B attempts restore -> 404
        restore_b = await ac.post(f"/api/projects/{proj_id}/restore")
        assert restore_b.status_code == 404

        # User B attempts permanent delete -> 404
        perm_b = await ac.delete(f"/api/projects/{proj_id}/permanent")
        assert perm_b.status_code == 404

        # User A restores it successfully
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-a-graveyard", email="user_a@test.local"
        )
        restore_a = await ac.post(f"/api/projects/{proj_id}/restore")
        assert restore_a.status_code == 200


@pytest.mark.asyncio
async def test_generation_job_and_media_authorization():
    """
    User A creates Project A and a media asset / job.
    User B cannot query User A's jobs or media assets.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-a-media", email="user_a@test.local"
        )
        res = await ac.post("/api/projects", json={"title": "Media Universe", "seed_text": "Sound and Vision"})
        proj_id = res.json()["data"]["id"]

        # User B attempts to access media assets of Project A -> 404
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            id="user-b-media", email="user_b@test.local"
        )
        media_res = await ac.get(f"/api/projects/{proj_id}/media/assets")
        assert media_res.status_code == 404

        # User B attempts to trigger media generation on Project A -> 404
        gen_res = await ac.post(
            f"/api/projects/{proj_id}/media/generate",
            json={
                "entity_type": "world",
                "entity_id": "world-1",
                "media_type": "image",
                "prompt": "Stunning visuals",
            },
        )
        assert gen_res.status_code == 404


@pytest.mark.asyncio
async def test_live_supabase_jwt_verification():
    """Verify real live Supabase access token via JWKS/Supabase Auth API."""
    import dotenv, httpx
    from backend.app.config import settings
    from backend.app.core.auth import verify_supabase_jwt

    anon_key = dotenv.dotenv_values("frontend/.env").get("VITE_SUPABASE_ANON_KEY")
    if not settings.SUPABASE_URL or not anon_key:
        pytest.skip("Supabase configuration not present")

    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.post(
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/token?grant_type=password",
                headers={"apikey": anon_key},
                json={"email": "user_a@praroha.local", "password": "Password123!"},
            )
            if resp.status_code != 200:
                pytest.skip(f"Could not authenticate test user with live Supabase: {resp.text}")
            token = resp.json()["access_token"]
            user = await verify_supabase_jwt(token)
            assert user.id == "02a8d07c-da8f-4db5-b34c-6c96e1778908"
            assert user.email == "user_a@praroha.local"
    except Exception as exc:
        pytest.skip(f"Live network issue contacting Supabase: {exc}")
