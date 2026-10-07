from unittest.mock import AsyncMock, patch
import httpx
import pytest
from backend.app.models.potential import (
    PotentialItemStatus,
    SeedPotentialCategory,
    SeedPotentialItemBase,
    SeedPotentialItemRecord,
)
from backend.app.providers.gemini_provider import GeminiProvider
from backend.app.providers.mock_provider import (
    CANONICAL_SEED_DNA,
    CANONICAL_SEED_POTENTIAL,
    CANONICAL_SEED_TEXT,
    MockProvider,
)
from backend.app.repositories.project_repo import ProjectRepository


def test_potential_schema_models():
    item = SeedPotentialItemBase(
        project_id="test-proj-123",
        label="Underwater city has ancient hydrothermal power generators",
        category=SeedPotentialCategory.INFERRED.value,
        confidence=0.88,
        source_evidence="city beneath the ocean",
        user_status=PotentialItemStatus.PENDING.value,
    )
    assert item.project_id == "test-proj-123"
    assert item.category == "inferred"
    assert item.user_status == "pending"
    assert item.confidence == 0.88


@pytest.mark.asyncio
async def test_mock_provider_extract_potential_canonical():
    provider = MockProvider()
    result = await provider.extract_potential(CANONICAL_SEED_TEXT, CANONICAL_SEED_DNA)
    items = result if isinstance(result, list) else result.get("potential_items", [])
    assert len(items) == len(CANONICAL_SEED_POTENTIAL)

    categories = {it["category"] for it in items}
    assert "explicit" in categories
    assert "inferred" in categories
    assert "open" in categories

    # Explicit items should have 1.0 confidence
    explicit_items = [it for it in items if it["category"] == "explicit"]
    for it in explicit_items:
        assert it["confidence"] == 1.0


@pytest.mark.asyncio
async def test_mock_provider_extract_potential_arbitrary_seed():
    provider = MockProvider()
    custom_seed = "An orbital lighthouse guiding sleeper ships across the Kuiper belt."
    result = await provider.extract_potential(custom_seed, {})
    items = result if isinstance(result, list) else result.get("potential_items", [])
    assert len(items) >= 4
    categories = {it["category"] for it in items}
    assert "explicit" in categories
    assert "inferred" in categories
    assert "open" in categories


@pytest.mark.asyncio
async def test_gemini_provider_potential_fallback():
    provider_no_key = GeminiProvider(api_key=None, model="gemini-3.5-flash")
    res = await provider_no_key.extract_potential(CANONICAL_SEED_TEXT, CANONICAL_SEED_DNA)
    items = res if isinstance(res, list) else res.get("potential_items", [])
    assert len(items) > 0

    provider_with_key = GeminiProvider(api_key="fake-test-key", model="gemini-3.5-flash")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Network down")
        res_fail = await provider_with_key.extract_potential(CANONICAL_SEED_TEXT, CANONICAL_SEED_DNA)
        items_fail = res_fail if isinstance(res_fail, list) else res_fail.get("potential_items", [])
        assert len(items_fail) > 0


@pytest.mark.asyncio
async def test_potential_endpoints_lifecycle(client: httpx.AsyncClient):
    # 1. Create a project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Sunken Spire",
            "seed_text": CANONICAL_SEED_TEXT,
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Before extraction, GET /potential should return empty list
    get_before = await client.get(f"/api/projects/{project_id}/potential")
    assert get_before.status_code == 200
    assert get_before.json()["data"] == []

    # 3. Extract potential map
    extract_res = await client.post(f"/api/projects/{project_id}/potential/extract")
    assert extract_res.status_code == 200
    extract_data = extract_res.json()["data"]
    assert len(extract_data) > 0

    # Locate an inferred item
    inferred_items = [it for it in extract_data if it["category"] == "inferred"]
    assert len(inferred_items) > 0
    target_item = inferred_items[0]
    target_id = target_item["id"]
    assert target_item["user_status"] == "pending"

    # 4. Patch single item status to 'accepted'
    patch_res = await client.patch(
        f"/api/projects/{project_id}/potential/{target_id}",
        json={"user_status": "accepted"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["user_status"] == "accepted"

    # 5. Batch update statuses
    open_items = [it for it in extract_data if it["category"] == "open"]
    assert len(open_items) > 0
    open_id = open_items[0]["id"]

    batch_res = await client.post(
        f"/api/projects/{project_id}/potential/batch",
        json={
            "items": [
                {"id": target_id, "user_status": "rejected"},
                {"id": open_id, "user_status": "accepted"},
            ]
        },
    )
    assert batch_res.status_code == 200
    updated_items = batch_res.json()["data"]
    status_map = {it["id"]: it["user_status"] for it in updated_items}
    assert status_map[target_id] == "rejected"
    assert status_map[open_id] == "accepted"

    # 6. Verify GET returns updated statuses
    get_after = await client.get(f"/api/projects/{project_id}/potential")
    assert get_after.status_code == 200
    after_data = get_after.json()["data"]
    after_map = {it["id"]: it["user_status"] for it in after_data}
    assert after_map[target_id] == "rejected"
    assert after_map[open_id] == "accepted"


@pytest.mark.asyncio
async def test_canonical_demo_includes_potential_items(client: httpx.AsyncClient):
    # Instant canonical demo endpoint
    demo_res = await client.post("/api/projects/canonical-demo")
    assert demo_res.status_code == 201
    project_id = demo_res.json()["data"]["id"]

    # Verify potential items were pre-seeded
    pot_res = await client.get(f"/api/projects/{project_id}/potential")
    assert pot_res.status_code == 200
    pot_items = pot_res.json()["data"]
    assert len(pot_items) == len(CANONICAL_SEED_POTENTIAL)

    # Categories present
    cat_counts = {}
    for it in pot_items:
        cat_counts[it["category"]] = cat_counts.get(it["category"], 0) + 1
    assert cat_counts.get("explicit", 0) >= 3
    assert cat_counts.get("inferred", 0) >= 3
    assert cat_counts.get("open", 0) >= 2
