from unittest.mock import AsyncMock, patch
import httpx
import pytest
from sqlmodel import select

from backend.app.models.unfold import (
    CharacterRecord,
    CharacterRelationshipRecord,
    SceneRecord,
    WorldBibleRecord,
    UnfoldedUniverseRead,
)
from backend.app.providers.mock_provider import MockProvider
from backend.app.repositories.project_repo import async_session


@pytest.mark.asyncio
async def test_unfold_universe_success(client: httpx.AsyncClient):
    """Verify complete end-to-end unfolding flow from seed selection to 4-layer codex."""
    # 1. Create project with canonical ocean seed
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Bio-City Unfold Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Extract DNA & Generate 3 worlds
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res.status_code == 200
    candidates = gen_res.json()["data"]

    # Candidate 1 is Bio-City in canonical list
    bio_city_candidate = next(c for c in candidates if "Bio-City" in c["title"])

    # 3. Select Bio-City candidate with rationale
    select_res = await client.post(
        f"/api/projects/{project_id}/worlds/{bio_city_candidate['id']}/select",
        json={"user_rationale": "Focusing on symbiotic bioluminescence and living coral architectures."},
    )
    assert select_res.status_code == 200

    # 4. Trigger Unfold
    unfold_res = await client.post(f"/api/projects/{project_id}/unfold")
    assert unfold_res.status_code == 200
    unfold_json = unfold_res.json()
    assert unfold_json["success"] is True

    data = unfold_json["data"]
    assert "world_bible" in data
    assert "characters" in data
    assert "relationships" in data
    assert "scenes" in data

    # Assert World Bible & Key Locations
    bible = data["world_bible"]
    assert bible["world_candidate_id"] == bio_city_candidate["id"]
    assert len(bible["key_locations"]) >= 2
    for loc in bible["key_locations"]:
        assert loc["name"]
        assert loc["description"]
        assert loc["visual_prompt"]

    # Assert Characters
    chars = data["characters"]
    assert len(chars) >= 2
    for char in chars:
        assert char["world_candidate_id"] == bio_city_candidate["id"]
        assert char["name"]
        assert char["archetype"]
        assert char["motivation"]
        assert char["visual_prompt"]

    # Assert Relationships with world_candidate_id
    relationships = data["relationships"]
    assert len(relationships) >= 1
    for rel in relationships:
        assert rel["world_candidate_id"] == bio_city_candidate["id"]
        assert rel["source_character_id"]
        assert rel["target_character_id"]
        assert rel["source_character_name"]
        assert rel["target_character_name"]
        assert rel["relation_type"]

    # Assert Scenes
    scenes = data["scenes"]
    assert len(scenes) >= 2
    for scene in scenes:
        assert scene["world_candidate_id"] == bio_city_candidate["id"]
        assert scene["title"]
        assert scene["location_setting"]
        assert scene["dramatic_question"]
        assert scene["visual_prompt"]

    # 5. Verify project status updated to universe_unfolded
    proj_res = await client.get(f"/api/projects/{project_id}")
    assert proj_res.status_code == 200
    assert proj_res.json()["data"]["status"] == "universe_unfolded"


@pytest.mark.asyncio
async def test_canonical_fixtures_by_raw_seed_and_title(client: httpx.AsyncClient):
    """Verify that canonical fixtures are resolved by raw_seed + world title, ignoring Seed DNA premise."""
    mock_provider = MockProvider()

    # Even if seed_dna premise is completely mutated, raw_seed triggers canonical fixtures
    dna_context = {"premise": "An unrelated space anomaly premise modified by an external LLM"}

    # 1. Lost Civilization title
    res_lost = await mock_provider.unfold_universe({
        "raw_seed": "A child discovers a forgotten city beneath the ocean.",
        "seed_dna": dna_context,
        "selected_world": {"title": "Lost Civilization: The Sunken Vaults"},
    })
    assert "cyclopean basalt" in res_lost["world_bible"]["geography"].lower()
    assert any("Matthew Voss" in c["name"] for c in res_lost["characters"])

    # 2. Time Capsule title
    res_time = await mock_provider.unfold_universe({
        "raw_seed": "a child discovers a forgotten city beneath the ocean",
        "seed_dna": dna_context,
        "selected_world": {"title": "Time Capsule: Station Zero"},
    })
    assert "geodesic dome" in res_time["world_bible"]["geography"].lower()
    assert any("Robert Sterling" in c["name"] for c in res_time["characters"])

    # 3. Bio-City title
    res_bio = await mock_provider.unfold_universe({
        "raw_seed": "A child discovers a forgotten city beneath the ocean",
        "seed_dna": dna_context,
        "selected_world": {"title": "Bio-City: The Living Reef"},
    })
    assert "coral" in res_bio["world_bible"]["geography"].lower()
    assert any("Althea" in c["name"] for c in res_bio["characters"])


@pytest.mark.asyncio
async def test_unfold_requires_world_selection(client: httpx.AsyncClient):
    """Calling unfold before selecting a world returns HTTP 400."""
    create_res = await client.post(
        "/api/projects",
        json={"title": "Unselected Test", "seed_text": "A desert planet where water is memory."},
    )
    project_id = create_res.json()["data"]["id"]

    # Attempt to unfold while in 'created' status
    res = await client.post(f"/api/projects/{project_id}/unfold")
    assert res.status_code == 400
    assert "world_selected" in res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_unfold_concurrency_rejection(client: httpx.AsyncClient):
    """When project is in 'unfolding' status, POST /unfold rejects with HTTP 409 Conflict."""
    create_res = await client.post(
        "/api/projects",
        json={"title": "Concurrency Guard Test", "seed_text": "A child discovers a forgotten city beneath the ocean."},
    )
    project_id = create_res.json()["data"]["id"]

    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidates = gen_res.json()["data"]

    await client.post(f"/api/projects/{project_id}/worlds/{candidates[0]['id']}/select", json={})

    # Manually simulate project in "unfolding" state
    async with async_session() as session:
        from backend.app.repositories.project_repo import ProjectRepository
        repo = ProjectRepository(session)
        project = await repo.get_project(project_id)
        assert project is not None
        project.status = "unfolding"
        session.add(project)
        await session.commit()

    # Attempting to call unfold again should return 409 Conflict
    conflict_res = await client.post(f"/api/projects/{project_id}/unfold")
    assert conflict_res.status_code == 409
    assert "already in progress" in conflict_res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_unfold_idempotency_when_already_unfolded(client: httpx.AsyncClient):
    """When project is already 'universe_unfolded', POST /unfold returns existing codex without duplicating rows."""
    create_res = await client.post(
        "/api/projects",
        json={"title": "Idempotency Test", "seed_text": "A child discovers a forgotten city beneath the ocean."},
    )
    project_id = create_res.json()["data"]["id"]

    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidates = gen_res.json()["data"]
    await client.post(f"/api/projects/{project_id}/worlds/{candidates[0]['id']}/select", json={})

    # First unfold
    res1 = await client.post(f"/api/projects/{project_id}/unfold")
    assert res1.status_code == 200

    # Count database rows
    async with async_session() as session:
        chars_stmt = select(CharacterRecord).where(CharacterRecord.project_id == project_id)
        chars_before = len((await session.execute(chars_stmt)).scalars().all())

    # Second unfold (idempotent duplicate call)
    res2 = await client.post(f"/api/projects/{project_id}/unfold")
    assert res2.status_code == 200
    assert res2.json()["data"]["world_bible"]["id"] == res1.json()["data"]["world_bible"]["id"]

    async with async_session() as session:
        chars_stmt = select(CharacterRecord).where(CharacterRecord.project_id == project_id)
        chars_after = len((await session.execute(chars_stmt)).scalars().all())

    assert chars_before == chars_after


@pytest.mark.asyncio
async def test_character_relationships_scoped_to_candidate(client: httpx.AsyncClient):
    """Verify that CharacterRelationshipRecord includes world_candidate_id foreign key."""
    create_res = await client.post(
        "/api/projects",
        json={"title": "Rel Scope Test", "seed_text": "A child discovers a forgotten city beneath the ocean."},
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidate = gen_res.json()["data"][0]
    await client.post(f"/api/projects/{project_id}/worlds/{candidate['id']}/select", json={})

    unfold_res = await client.post(f"/api/projects/{project_id}/unfold")
    assert unfold_res.status_code == 200

    async with async_session() as session:
        stmt = select(CharacterRelationshipRecord).where(CharacterRelationshipRecord.project_id == project_id)
        rels = (await session.execute(stmt)).scalars().all()
        assert len(rels) > 0
        for r in rels:
            assert r.world_candidate_id == candidate["id"]


@pytest.mark.asyncio
async def test_unfold_failure_lifecycle_and_rollback(client: httpx.AsyncClient):
    """Mocks provider error during unfold; verifies project status remains world_selected, selected world intact, and retry succeeds."""
    create_res = await client.post(
        "/api/projects",
        json={"title": "Rollback Test", "seed_text": "A child discovers a forgotten city beneath the ocean."},
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidate = gen_res.json()["data"][0]
    await client.post(f"/api/projects/{project_id}/worlds/{candidate['id']}/select", json={"user_rationale": "My chosen rationale"})

    # Mock provider failure
    with patch("backend.app.routers.unfold.get_ai_provider") as mock_get_provider:
        mock_provider_instance = AsyncMock()
        mock_provider_instance.unfold_universe.side_effect = RuntimeError("Simulated LLM network timeout")
        mock_get_provider.return_value = mock_provider_instance

        fail_res = await client.post(f"/api/projects/{project_id}/unfold")
        assert fail_res.status_code == 500
        assert "Simulated LLM network timeout" in fail_res.json()["error"]["message"]

    # Verify project status reset to world_selected, and selected world is preserved
    proj_res = await client.get(f"/api/projects/{project_id}")
    assert proj_res.json()["data"]["status"] == "world_selected"
    assert proj_res.json()["data"]["selected_world_id"] == candidate["id"]

    # Verify no partial records committed
    async with async_session() as session:
        bibles = (await session.execute(select(WorldBibleRecord).where(WorldBibleRecord.project_id == project_id))).scalars().all()
        assert len(bibles) == 0

    # Retry unfolding without mock failure
    retry_res = await client.post(f"/api/projects/{project_id}/unfold")
    assert retry_res.status_code == 200
    assert retry_res.json()["data"]["world_bible"]["world_candidate_id"] == candidate["id"]

    # Status is now universe_unfolded
    proj_res_after = await client.get(f"/api/projects/{project_id}")
    assert proj_res_after.json()["data"]["status"] == "universe_unfolded"


@pytest.mark.asyncio
async def test_get_unfolded_endpoint(client: httpx.AsyncClient):
    """GET /api/projects/{id}/unfolded returns 404 before unfold and 200 after."""
    create_res = await client.post(
        "/api/projects",
        json={"title": "Get Unfolded Test", "seed_text": "A child discovers a forgotten city beneath the ocean."},
    )
    project_id = create_res.json()["data"]["id"]

    # 404 before unfolding
    res_404 = await client.get(f"/api/projects/{project_id}/unfolded")
    assert res_404.status_code == 404

    # Setup world selection
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidate = gen_res.json()["data"][0]
    await client.post(f"/api/projects/{project_id}/worlds/{candidate['id']}/select", json={})

    # Unfold
    await client.post(f"/api/projects/{project_id}/unfold")

    # 200 after unfolding
    res_200 = await client.get(f"/api/projects/{project_id}/unfolded")
    assert res_200.status_code == 200
    data = res_200.json()["data"]
    assert data["world_bible"]["world_candidate_id"] == candidate["id"]
    assert len(data["characters"]) >= 2
    assert len(data["scenes"]) >= 2
