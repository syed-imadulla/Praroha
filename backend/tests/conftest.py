import asyncio
import os
import pytest
import pytest_asyncio
import httpx
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
        original_post = ac.post

        async def auto_await_job_post(url, *args, **kwargs):
            res = await original_post(url, *args, **kwargs)
            url_str = str(url)
            # If the response is a 200 and for one of our generation endpoints, it returns a job.
            if res.status_code == 200 and any(
                endpoint in url_str for endpoint in [
                    "/dna/extract", 
                    "/potential/extract", 
                    "/worlds/generate", 
                    "/unfold"
                ]
            ):
                data = res.json().get("data", {})
                job_id = data.get("id")
                status = data.get("status")
                
                if status == "completed":
                    import json
                    result_data = json.loads(data.get("result_json", "{}"))
                    return httpx.Response(
                        status_code=200,
                        json={"success": True, "data": result_data},
                        request=res.request
                    )
                elif job_id and status == "queued":
                    import json
                    # Wait for job to complete
                    while True:
                        job_res = await ac.get(f"/api/v1/jobs/{job_id}")
                        if job_res.status_code != 200:
                            # Fallback if endpoint is under /api/jobs or something else
                            job_res = await ac.get(f"/api/jobs/{job_id}")
                        
                        job_data = job_res.json().get("data", {})
                        if job_data.get("status") in ("completed", "failed"):
                            if job_data.get("status") == "completed":
                                result_data = json.loads(job_data.get("result_json", "{}"))
                                return httpx.Response(
                                    status_code=200,
                                    json={"success": True, "data": result_data},
                                    request=res.request
                                )
                            else:
                                return httpx.Response(
                                    status_code=500,
                                    json={"success": False, "error": {"message": job_data.get("error_message")}},
                                    request=res.request
                                )
                        await asyncio.sleep(0.1)
            return res

        ac.post = auto_await_job_post
        yield ac

