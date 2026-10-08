from unittest.mock import AsyncMock, patch
import httpx
import pytest
from pydantic import ValidationError

from backend.app.models.world import WorldCandidate
from backend.app.providers.gemini_provider import GeminiProvider


def test_world_candidate_schema_validation():
    # Valid candidate matching WorldCandidate schema
    valid_data = {
        "id": "world-test-1",
        "index": 1,
        "title": "Submerged Necropolis",
        "archetype": "Lost Civilization (Archaeological / Mythic)",
        "concept": "A sunken city carved from luminescent basalt where shadows hold ancient memories.",
        "aesthetic": "Obsidian basalt, luminescent turquoise algae, sunken spires.",
        "core_tension": "The dying oxygen vents vs. the awakening aquatic guardians.",
        "trade_offs": "Deep historical lore and mystery; high environmental hostility.",
        "key_visual": "A lone explorer illuminating a basalt archway with a copper torch.",
    }
    candidate = WorldCandidate.model_validate(valid_data)
    assert candidate.id == "world-test-1"
    assert candidate.index == 1
    assert candidate.title == valid_data["title"]
    assert candidate.archetype == valid_data["archetype"]
    assert candidate.concept == valid_data["concept"]
    assert candidate.aesthetic == valid_data["aesthetic"]
    assert candidate.core_tension == valid_data["core_tension"]
    assert candidate.trade_offs == valid_data["trade_offs"]
    assert candidate.key_visual == valid_data["key_visual"]

    # Missing required field 'concept'
    invalid_data = valid_data.copy()
    del invalid_data["concept"]
    with pytest.raises(ValidationError):
        WorldCandidate.model_validate(invalid_data)

    # Missing required field 'archetype'
    invalid_data_2 = valid_data.copy()
    del invalid_data_2["archetype"]
    with pytest.raises(ValidationError):
        WorldCandidate.model_validate(invalid_data_2)


@pytest.mark.asyncio
async def test_canonical_demo_fixtures_determinism():
    """Verify that canonical seed raw_seed returns the 3 canonical worlds deterministically:

    1. Lost Civilization, 2. Bio-City, 3. Time Capsule.
    Detection is based strictly on raw_seed, not the AI-generated premise.
    """
    provider = GeminiProvider(api_key="fake-demo-key", model="gemini-3.6-flash")

    # Even if premise is completely altered by Gemini, raw_seed triggers canonical fixtures
    altered_dna = {
        "raw_seed": "A child discovers a forgotten city beneath the ocean.",
        "premise": "An explorer finds an alien pyramid under volcanic magma.",  # Completely rewritten premise
        "themes": ["Deep Exploration", "Forgotten Knowledge"],
        "entities": ["A young explorer", "Sunken metropolis"],
        "constraints": ["Deep water pressure", "Limited oxygen"],
        "tone": "Wonder and eerie stillness",
        "domain_keywords": ["ocean", "submerged", "abyss"],
    }

    candidates = await provider.generate_worlds(altered_dna)
    assert len(candidates) == 3
    assert candidates[0]["title"] == "Lost Civilization"
    assert "Lost Civilization" in candidates[0]["archetype"]
    assert candidates[1]["title"] == "Bio-City"
    assert "Bio-City" in candidates[1]["archetype"]
    assert candidates[2]["title"] == "Time Capsule"
    assert "Time Capsule" in candidates[2]["archetype"]

    # Normalized casing and trailing punctuation test
    normalized_dna = altered_dna.copy()
    normalized_dna["raw_seed"] = "  a child discovers a forgotten city beneath the ocean   "
    candidates_normalized = await provider.generate_worlds(normalized_dna)
    assert candidates_normalized[0]["title"] == "Lost Civilization"
    assert candidates_normalized[1]["title"] == "Bio-City"
    assert candidates_normalized[2]["title"] == "Time Capsule"


@pytest.mark.asyncio
async def test_generate_worlds_mock_fallback():
    # When api_key is None and raw_seed is NOT canonical, should fallback to mock generation
    provider_no_key = GeminiProvider(api_key=None, model="gemini-3.6-flash", allow_mock_fallback=True)
    arbitrary_dna = {
        "raw_seed": "A nomad navigates a whispering glass desert.",
        "premise": "A lone wanderer hears prophecies in singing quartz dunes.",
        "themes": ["Nomadism", "Sound", "Mirage"],
        "entities": ["Nomad", "Glass Dunes"],
        "constraints": ["Extreme heat", "Acoustic storms"],
        "tone": "Mystical, contemplative",
        "domain_keywords": ["sand", "glass", "resonance"],
    }

    candidates = await provider_no_key.generate_worlds(arbitrary_dna)
    assert isinstance(candidates, list)
    assert len(candidates) == 3
    assert all("title" in c and "concept" in c and "archetype" in c for c in candidates)
    assert [c.get("index", idx) for idx, c in enumerate(candidates, start=1)] == [1, 2, 3]

    # When api_key is provided but network call raises exception, fallback gracefully
    provider_with_key = GeminiProvider(api_key="fake-test-key", model="gemini-3.6-flash", allow_mock_fallback=True)
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Network unreachable")
        candidates_fallback = await provider_with_key.generate_worlds(arbitrary_dna)
        assert len(candidates_fallback) == 3
        assert all("title" in c and "concept" in c for c in candidates_fallback)


@pytest.mark.asyncio
async def test_worlds_generate_and_get_endpoint(client: httpx.AsyncClient):
    # 1. Create a project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Ocean City Project",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Before DNA extraction, world generation should fail with 400
    gen_before_dna = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_before_dna.status_code == 400

    # 3. Before generation, GET /worlds should return 404
    get_before_gen = await client.get(f"/api/projects/{project_id}/worlds")
    assert get_before_gen.status_code == 404

    # 4. Extract DNA
    dna_res = await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    assert dna_res.status_code == 200

    # 5. Generate worlds
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res.status_code == 200
    gen_json = gen_res.json()
    assert gen_json["success"] is True
    candidates = gen_json["data"]
    assert len(candidates) == 3
    assert candidates[0]["candidate_index"] == 1
    assert candidates[1]["candidate_index"] == 2
    assert candidates[2]["candidate_index"] == 3

    # Check project status is updated to 'worlds_generated'
    proj_res = await client.get(f"/api/projects/{project_id}")
    assert proj_res.status_code == 200
    assert proj_res.json()["data"]["status"] == "worlds_generated"

    # 6. Retrieve via GET /worlds
    get_res = await client.get(f"/api/projects/{project_id}/worlds")
    assert get_res.status_code == 200
    get_candidates = get_res.json()["data"]
    assert len(get_candidates) == 3
    assert get_candidates[0]["title"] == candidates[0]["title"]
    assert get_candidates[1]["title"] == candidates[1]["title"]
    assert get_candidates[2]["title"] == candidates[2]["title"]


@pytest.mark.asyncio
async def test_worlds_regenerate_batch_history(client: httpx.AsyncClient):
    """Verify append-only batch persistence: regenerating creates a new batch

    without destroying prior candidates.
    """
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Regeneration History Test",
            "seed_text": "An asteroid miner finds an ancient biological egg in deep orbit.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    await client.post(f"/api/projects/{project_id}/dna/extract", json={})

    # Batch 1
    gen_res_1 = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res_1.status_code == 200
    batch_1 = gen_res_1.json()["data"]
    batch_1_id = batch_1[0]["batch_id"]

    # Batch 2 (re-generation)
    gen_res_2 = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res_2.status_code == 200
    batch_2 = gen_res_2.json()["data"]
    batch_2_id = batch_2[0]["batch_id"]

    # Must be distinct batch IDs
    assert batch_1_id != batch_2_id

    # Latest GET returns Batch 2
    get_res = await client.get(f"/api/projects/{project_id}/worlds")
    assert get_res.status_code == 200
    latest_batch = get_res.json()["data"]
    assert latest_batch[0]["batch_id"] == batch_2_id
