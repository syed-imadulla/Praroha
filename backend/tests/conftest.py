import asyncio
import os
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Ensure unit test suite always runs against an isolated, fast, offline SQLite test database
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_seed_unfold.db"
os.environ["STORAGE_PROVIDER"] = "local"
os.environ["AI_PROVIDER"] = "mock"

from backend.app.config import settings
settings.DATABASE_URL = "sqlite+aiosqlite:///./test_seed_unfold.db"
settings.STORAGE_PROVIDER = "local"

from backend.app.repositories import project_repo
project_repo.engine = project_repo.build_engine(settings.DATABASE_URL)
project_repo.async_session = project_repo.async_sessionmaker(
    project_repo.engine,
    class_=project_repo.AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def initialize_test_db():
    await project_repo.init_db()


@pytest_asyncio.fixture
async def client():
    from backend.app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

