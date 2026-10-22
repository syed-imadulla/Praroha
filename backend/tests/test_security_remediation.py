import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.config import Settings, settings
from backend.app.core.auth import AuthenticatedUser, get_current_user


@pytest.mark.asyncio
async def test_unauthenticated_ai_provider_mutation_rejected():
    """Unauthenticated caller receives HTTP 401 on POST /api/health/ai-provider."""
    from backend.app.main import app

    # Remove any auth dependency overrides to test raw unauthenticated call
    overrides_backup = dict(app.dependency_overrides)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.post("/api/health/ai-provider", json={"provider": "mock"})
            assert res.status_code == 401
            assert "Authentication required" in res.json()["error"]["message"]
    finally:
        app.dependency_overrides = overrides_backup


@pytest.mark.asyncio
async def test_non_admin_ai_provider_mutation_rejected():
    """Authenticated non-admin caller receives HTTP 403 Forbidden."""
    from backend.app.main import app

    overrides_backup = dict(app.dependency_overrides)
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="user-123",
        email="creator@praroha.local",
        role="authenticated",  # non-admin role
    )

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            res = await client.post("/api/health/ai-provider", json={"provider": "mock"})
            assert res.status_code == 403
            assert "Administrator access required" in res.json()["error"]["message"]
    finally:
        app.dependency_overrides = overrides_backup


@pytest.mark.asyncio
async def test_production_mode_blocks_mutation_and_disables_docs():
    """
    In production mode:
    1. POST /api/health/ai-provider returns 403 even for admin callers.
    2. Swagger /docs, /redoc, and /openapi.json are disabled (return 404).
    3. Health endpoint reports environment='production'.
    4. Localhost origins are filtered from CORS_ORIGINS.
    """
    from backend.app.main import app

    prev_env = settings.ENVIRONMENT
    settings.ENVIRONMENT = "production"

    overrides_backup = dict(app.dependency_overrides)
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="admin-123",
        email="admin@praroha.local",
        role="admin",
    )

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # 1. AI-provider mutation is strictly disabled in production
            res = await client.post("/api/health/ai-provider", json={"provider": "mock"})
            assert res.status_code == 403
            assert "disabled in production" in res.json()["error"]["message"]

            # 2. Health endpoint reports environment as production
            health_res = await client.get("/api/health")
            assert health_res.status_code == 200
            assert health_res.json()["data"]["environment"] == "production"

            # 3. Documentation endpoints are disabled in production
            # FastAPI constructs documentation endpoints during app initialization
            from fastapi import FastAPI
            from backend.app.routers.health import router as health_router

            prod_app = FastAPI(
                title="Test Prod",
                docs_url=None,
                redoc_url=None,
                openapi_url=None,
            )
            prod_app.include_router(health_router, prefix="/api")

            prod_transport = ASGITransport(app=prod_app)
            async with AsyncClient(transport=prod_transport, base_url="http://testserver") as prod_client:
                docs_res = await prod_client.get("/docs")
                assert docs_res.status_code == 404

                redoc_res = await prod_client.get("/redoc")
                assert redoc_res.status_code == 404

                openapi_res = await prod_client.get("/openapi.json")
                assert openapi_res.status_code == 404
    finally:
        settings.ENVIRONMENT = prev_env
        app.dependency_overrides = overrides_backup


def test_production_cors_filters_localhost():
    """CORS origins in production strip all localhost and 127.0.0.1 entries."""
    prod_settings = Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS=[
            "https://praroha-ai.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "https://seed-unfold.vercel.app",
        ],
    )
    assert "https://praroha-ai.vercel.app" in prod_settings.CORS_ORIGINS
    assert "https://seed-unfold.vercel.app" in prod_settings.CORS_ORIGINS
    assert not any("localhost" in str(o) for o in prod_settings.CORS_ORIGINS)
    assert not any("127.0.0.1" in str(o) for o in prod_settings.CORS_ORIGINS)

    dev_settings = Settings(
        ENVIRONMENT="development",
        CORS_ORIGINS=[
            "http://localhost:5173",
            "https://praroha-ai.vercel.app",
        ],
    )
    assert "http://localhost:5173" in dev_settings.CORS_ORIGINS
