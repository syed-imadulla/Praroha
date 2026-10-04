import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    json_data = response.json()

    assert json_data["success"] is True
    assert json_data["data"]["status"] == "healthy"
    assert "ai_provider" in json_data["data"]
    assert json_data["data"]["ai_provider"]["resolved"] == "mock"
    assert "storage_provider" in json_data["data"]
    assert json_data["data"]["storage_provider"]["type"] == "LocalStorageProvider"


@pytest.mark.asyncio
async def test_projects_crud(client: AsyncClient):
    # Test project creation
    create_payload = {
        "title": "The Sunken Ocean City",
        "seed_text": "A child discovers a forgotten city beneath the ocean.",
    }
    create_res = await client.post("/api/projects", json=create_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["success"] is True
    assert created["data"]["title"] == "The Sunken Ocean City"
    project_id = created["data"]["id"]

    # Test project retrieval
    get_res = await client.get(f"/api/projects/{project_id}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["success"] is True
    assert retrieved["data"]["id"] == project_id

    # Test projects listing
    list_res = await client.get("/api/projects")
    assert list_res.status_code == 200
    project_list = list_res.json()
    assert project_list["success"] is True
    assert len(project_list["data"]) >= 1
