import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.auth import AuthenticatedUser, get_current_user


@pytest.mark.asyncio
async def test_auth_signup_validation_invalid_email():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/signup", json={"email": "invalid-email", "password": "password123"})
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_auth_resend_verification_invalid_email():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/resend-verification", json={"email": "invalid-email"})
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_auth_recover_password_invalid_email():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/auth/recover-password", json={"email": "not-an-email"})
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_project_ownership_isolation_rejects_unowned_project():
    transport = ASGITransport(app=app)
    # Mock user A
    user_a = AuthenticatedUser(id="user_a", email="a@example.com", role="authenticated")
    app.dependency_overrides[get_current_user] = lambda: user_a

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Attempt to access non-existent or unowned project
        resp = await client.get("/api/projects/unowned_project_123")
        assert resp.status_code == 404

    app.dependency_overrides.pop(get_current_user, None)
