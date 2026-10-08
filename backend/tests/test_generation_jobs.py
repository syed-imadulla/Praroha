import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.fixture
async def clean_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_generation_job_lifecycle(clean_client: AsyncClient):
    # Setup: Switch to mock provider
    await clean_client.post("/api/health/ai-provider", json={"provider": "mock"})

    # 1. Create a project
    create_res = await clean_client.post(
        "/api/projects", 
        json={"title": "Job Test", "seed_text": "A world of endless jobs."}
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Trigger DNA extraction job
    job_res = await clean_client.post(
        f"/api/projects/{project_id}/dna/extract",
        json={"raw_seed": "A world of endless jobs."}
    )
    assert job_res.status_code == 200
    job_data = job_res.json()["data"]
    job_id = job_data["id"]
    
    # 3. Verify Job Creation / Queued State
    assert job_data["status"] == "queued"
    assert job_data["project_id"] == project_id
    assert job_data["job_type"] == "dna_extraction"

    # 4. List jobs by project_id and status (Project Isolation & Retrieval)
    list_res = await clean_client.get(f"/api/jobs?project_id={project_id}")
    assert list_res.status_code == 200
    list_data = list_res.json()["data"]
    assert any(j["id"] == job_id for j in list_data)

    # 5. Poll until completed
    max_retries = 20
    completed_job = None
    for _ in range(max_retries):
        poll_res = await clean_client.get(f"/api/jobs/{job_id}")
        assert poll_res.status_code == 200
        current_job = poll_res.json()["data"]
        
        if current_job["status"] == "completed":
            completed_job = current_job
            break
        elif current_job["status"] == "failed":
            pytest.fail("Job failed unexpectedly")
        
        await asyncio.sleep(0.1)

    # 6. Verify Completed State
    assert completed_job is not None
    assert completed_job["status"] == "completed"
    assert completed_job["progress"] == 100
    assert completed_job["started_at"] is not None
    assert completed_job["completed_at"] is not None

@pytest.mark.asyncio
async def test_generation_job_invalid_id(clean_client: AsyncClient):
    # 7. Invalid job ID
    res = await clean_client.get("/api/jobs/invalid-uuid-123")
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_generation_job_failure(clean_client: AsyncClient):
    # Setup: Switch to mock provider
    await clean_client.post("/api/health/ai-provider", json={"provider": "mock"})

    # 1. Create a project
    create_res = await clean_client.post(
        "/api/projects", 
        json={"title": "Failure Test", "seed_text": "Will fail."}
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Trigger DNA extraction job and patch provider to fail
    from unittest.mock import AsyncMock, patch
    from backend.app.core.errors import AIProviderError
    
    with patch("backend.app.providers.mock_provider.MockProvider.extract_dna", new_callable=AsyncMock) as mock_extract:
        mock_extract.side_effect = AIProviderError(message="Mock forced failure", error_code="MOCK_FAIL")
        
        job_res = await clean_client.post(
            f"/api/projects/{project_id}/dna/extract",
            json={"raw_seed": "Will fail."}
        )
        assert job_res.status_code == 200
        job_id = job_res.json()["data"]["id"]
        
        # Poll for failure
        max_retries = 20
        failed_job = None
        for _ in range(max_retries):
            poll_res = await clean_client.get(f"/api/jobs/{job_id}")
            assert poll_res.status_code == 200
            current_job = poll_res.json()["data"]
            
            if current_job["status"] == "failed":
                failed_job = current_job
                break
            elif current_job["status"] == "completed":
                pytest.fail("Job completed unexpectedly")
            
            await asyncio.sleep(0.1)

        assert failed_job is not None
        assert failed_job["status"] == "failed"
        assert failed_job["error_message"] == "Mock forced failure"
        assert failed_job["error_code"] == "MOCK_FAIL"

