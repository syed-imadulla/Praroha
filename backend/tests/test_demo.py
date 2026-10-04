import time
import httpx
import pytest
from backend.app.providers.gemini_provider import GeminiProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session


@pytest.mark.asyncio
async def test_create_canonical_demo_project_repository():
    """Verify DEMO-01: Direct repository seeding populates the full canonical universe in under 500ms."""
    start_time = time.perf_counter()
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = await repo.create_canonical_demo_project()

        duration = time.perf_counter() - start_time
        assert duration < 0.5, f"Seeding took {duration:.3f}s, expected < 0.5s"

        # 1. Project details
        assert project.id is not None
        assert project.title == "The Sunken City: Bio-City"
        assert project.status == "universe_unfolded"
        assert project.selected_world_id is not None
        assert project.branch_name == "main"

        # 2. Seed DNA
        dna = await repo.get_latest_seed_dna(project.id)
        assert dna is not None
        assert "submerged, lost" in dna.premise

        # 3. World Candidates & Selection
        worlds = await repo.get_latest_world_candidates(project.id)
        assert len(worlds) == 3
        bio_city = next(w for w in worlds if "Bio-City" in w.title)
        assert bio_city.id == project.selected_world_id

        active_sel = await repo.get_active_world_selection(project.id)
        assert active_sel is not None
        selection, selected_cand = active_sel
        assert selection.world_candidate_id == bio_city.id
        assert selected_cand.id == bio_city.id

        # 4. Unfolded Universe (Bible, Characters, Relationships, Scenes)
        unfolded = await repo.get_unfolded_universe(project.id)
        assert unfolded is not None
        assert unfolded.world_bible is not None
        assert len(unfolded.world_bible.key_locations) >= 2
        assert len(unfolded.world_bible.history_timeline) >= 2
        assert len(unfolded.world_bible.canon_facts) >= 2

        # 3 Characters
        assert len(unfolded.characters) == 3
        char_names = [c.name for c in unfolded.characters]
        assert "Dr. Althea Thorne" in char_names
        assert "Sentry Unit Nereus" in char_names
        assert "Kaelen" in char_names

        # Relationships
        assert len(unfolded.relationships) >= 3

        # 3 Scenes
        assert len(unfolded.scenes) == 3
        assert unfolded.scenes[0].scene_number == 1
        assert unfolded.scenes[1].scene_number == 2
        assert unfolded.scenes[2].scene_number == 3

        # Baseline Entity Revisions
        revisions = await repo.get_entity_revisions(project.id)
        assert len(revisions) >= 2
        types = [r.entity_type for r in revisions]
        assert "character" in types
        assert "scene" in types


@pytest.mark.asyncio
async def test_canonical_demo_api_endpoint(client: httpx.AsyncClient):
    """Verify DEMO-01: POST /api/projects/canonical-demo returns full project in < 1s."""
    start_time = time.perf_counter()
    res = await client.post("/api/projects/canonical-demo")
    duration = time.perf_counter() - start_time

    assert res.status_code == 201
    assert duration < 1.0, f"Endpoint took {duration:.3f}s, expected < 1.0s"

    body = res.json()
    assert body["success"] is True
    data = body["data"]

    assert data["title"] == "The Sunken City: Bio-City"
    assert data["status"] == "universe_unfolded"
    assert data["selected_world_id"] is not None
    assert data["branch_name"] == "main"
    project_id = data["id"]

    # Verify that unfolded universe endpoint immediately serves the seeded codex
    unfolded_res = await client.get(f"/api/projects/{project_id}/unfolded")
    assert unfolded_res.status_code == 200
    unfolded_data = unfolded_res.json()["data"]
    assert len(unfolded_data["characters"]) == 3
    assert len(unfolded_data["scenes"]) == 3


@pytest.mark.asyncio
async def test_gemini_provider_graceful_fallback():
    """Verify DEMO-02: Gemini provider gracefully falls back to mock fixtures upon error/timeout."""
    # Initialize with invalid key and non-existent model to force an API failure / fallback
    provider = GeminiProvider(api_key="invalid-demo-key-12345", model="gemini-nonexistent")

    # 1. extract_dna fallback
    dna_result = await provider.extract_dna("A forgotten spacecraft drifting at the edge of the galaxy")
    assert dna_result is not None
    assert "seed_dna" in dna_result
    assert dna_result["fallback_used"] is True
    assert provider.last_fallback_warning is not None
    assert "AI Provider Throttled/Unavailable" in provider.last_fallback_warning

    # 2. generate_worlds fallback with non-canonical seed
    worlds_result = await provider.generate_worlds({
        "raw_seed": "A forgotten spacecraft drifting at the edge of the galaxy",
        "premise": "Deep space salvage mystery",
        "themes": ["Loneliness", "Survival"],
        "entities": ["Astronaut", "Derelict ship"],
        "constraints": ["No aliens"],
        "tone": "Suspenseful",
        "domain_keywords": ["Space", "Derelict", "Vacuum"],
    })
    assert len(worlds_result) == 3
    assert provider.last_fallback_warning is not None

    # 3. unfold_universe fallback with non-canonical seed
    unfold_result = await provider.unfold_universe({
        "raw_seed": "A forgotten spacecraft drifting at the edge of the galaxy",
        "selected_world": {"title": "Solar Orbiting Geodesic Station"},
    })
    assert "world_bible" in unfold_result
    assert "characters" in unfold_result
    assert "scenes" in unfold_result
    assert provider.last_fallback_warning is not None
