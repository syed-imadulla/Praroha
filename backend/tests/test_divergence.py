import pytest
from httpx import AsyncClient, ASGITransport
from pydantic import ValidationError

from backend.app.main import app
from backend.app.models.world import (
    DivergenceArchetype,
    ExplorationProfile,
    WorldCandidate,
    WorldCandidateRecord,
    WorldCandidateRead,
)
from backend.app.providers.mock_provider import MockProvider, CANONICAL_WORLDS
from backend.app.providers.gemini_provider import GeminiProvider


def test_exploration_profile_and_archetype_validation():
    """Verify ExplorationProfile bounds checking (0-100) and DivergenceArchetype enums."""
    # Test valid profile
    profile = ExplorationProfile(
        seed_fidelity=95,
        novelty=50,
        conceptual_distance=30,
        feasibility=85,
        summary="High fidelity grounded world",
    )
    assert profile.seed_fidelity == 95
    assert profile.novelty == 50
    assert profile.conceptual_distance == 30
    assert profile.feasibility == 85

    # Test out-of-bounds metrics raise validation error
    with pytest.raises(ValidationError):
        ExplorationProfile(seed_fidelity=105)

    with pytest.raises(ValidationError):
        ExplorationProfile(novelty=-5)

    # Test archetype enums
    assert DivergenceArchetype.familiar.value == "familiar"
    assert DivergenceArchetype.radical.value == "radical"
    assert DivergenceArchetype.inverse.value == "inverse"


@pytest.mark.asyncio
async def test_canonical_demo_fixtures_divergence_triad():
    """Verify MockProvider produces exactly the Familiar/Radical/Inverse triad for canonical seed."""
    provider = MockProvider()
    dna = {
        "raw_seed": "A child discovers a forgotten city beneath the ocean.",
        "premise": "A child discovers a forgotten city beneath the ocean.",
        "themes": ["Discovery", "Ancient Secrets"],
    }
    candidates = await provider.generate_worlds(dna)
    assert len(candidates) == 3

    w1, w2, w3 = candidates[0], candidates[1], candidates[2]

    # World 1: Familiar
    assert w1["divergence_archetype"] == "familiar"
    assert w1["exploration_profile"]["seed_fidelity"] >= 85
    assert w1["exploration_profile"]["feasibility"] >= 80
    assert len(w1["emphasized_potential_labels"]) > 0

    # World 2: Radical
    assert w2["divergence_archetype"] == "radical"
    assert w2["exploration_profile"]["novelty"] >= 85
    assert len(w2["emphasized_potential_labels"]) > 0

    # World 3: Inverse
    assert w3["divergence_archetype"] == "inverse"
    assert w3["exploration_profile"]["conceptual_distance"] >= 80
    assert len(w3["emphasized_potential_labels"]) > 0


@pytest.mark.asyncio
async def test_mock_provider_arbitrary_seed_with_potential():
    """Verify MockProvider generates divergence archetypes and incorporates accepted potential items for arbitrary seeds."""
    provider = MockProvider()
    dna = {
        "raw_seed": "In a forest of singing glass trees, a clockmaker repairs silence.",
        "premise": "A clockmaker restores quiet amidst glass resonance.",
        "themes": ["Resonance", "Acoustics", "Silence"],
    }
    potential_items = [
        {"label": "Singing Glass Trees", "user_status": "accepted"},
        {"label": "Acoustic Overload Hazard", "user_status": "accepted"},
        {"label": "Clockmaker's Guild Politics", "user_status": "rejected"},
    ]

    candidates = await provider.generate_worlds(dna, potential_items=potential_items)
    assert len(candidates) == 3

    archetypes = [c["divergence_archetype"] for c in candidates]
    assert archetypes == ["familiar", "radical", "inverse"]

    # Accepted potential items should be incorporated into emphasized labels
    all_emphasized = [lbl for c in candidates for lbl in c["emphasized_potential_labels"]]
    assert "Singing Glass Trees" in all_emphasized


@pytest.mark.asyncio
async def test_gemini_provider_fallback_divergence():
    """Verify GeminiProvider falls back gracefully with full divergence metadata when no API key is present."""
    gemini = GeminiProvider(api_key=None, model="gemini-2.5-flash")
    dna = {
        "raw_seed": "An alchemist converts moonlight into breathable atmosphere.",
        "premise": "Moonlight transmuting into atmospheric air.",
        "themes": ["Alchemy", "Atmosphere"],
    }
    candidates = await gemini.generate_worlds(dna)
    assert len(candidates) == 3
    for c in candidates:
        assert c["divergence_archetype"] in ("familiar", "radical", "inverse")
        assert "seed_fidelity" in c["exploration_profile"]
        assert "novelty" in c["exploration_profile"]


@pytest.mark.asyncio
async def test_divergent_worlds_endpoints_lifecycle():
    """Verify full REST lifecycle: project -> DNA -> potential items -> generate worlds -> read worlds."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create project
        p_res = await client.post(
            "/api/projects",
            json={"title": "Abyssal Exploration", "seed_text": "A diver encounters sentient bioluminescence in the Mariana Trench."},
        )
        assert p_res.status_code == 201
        project_id = p_res.json()["data"]["id"]

        # 2. Extract DNA
        dna_res = await client.post(f"/api/projects/{project_id}/dna/extract")
        assert dna_res.status_code == 200

        # 3. Extract & accept potential items
        pot_extract = await client.post(f"/api/projects/{project_id}/potential/extract")
        assert pot_extract.status_code == 200
        items = pot_extract.json()["data"]
        assert len(items) > 0

        # Accept the first item, reject the second
        item_1_id = items[0]["id"]
        await client.patch(
            f"/api/projects/{project_id}/potential/{item_1_id}",
            json={"user_status": "accepted"},
        )
        if len(items) > 1:
            item_2_id = items[1]["id"]
            await client.patch(
                f"/api/projects/{project_id}/potential/{item_2_id}",
                json={"user_status": "rejected"},
            )

        # 4. Generate world candidates
        gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
        assert gen_res.status_code == 200
        worlds_data = gen_res.json()["data"]
        assert len(worlds_data) == 3

        archetypes = [w["divergence_archetype"] for w in worlds_data]
        assert set(archetypes) == {"familiar", "radical", "inverse"}

        for w in worlds_data:
            assert "exploration_profile" in w
            profile = w["exploration_profile"]
            assert 0 <= profile["seed_fidelity"] <= 100
            assert 0 <= profile["novelty"] <= 100
            assert 0 <= profile["conceptual_distance"] <= 100
            assert 0 <= profile["feasibility"] <= 100
            assert isinstance(profile["summary"], str)
            assert isinstance(w["emphasized_potential_labels"], list)

        # 5. Fetch stored candidates
        get_res = await client.get(f"/api/projects/{project_id}/worlds")
        assert get_res.status_code == 200
        stored_worlds = get_res.json()["data"]
        assert len(stored_worlds) == 3
        for sw in stored_worlds:
            assert sw["divergence_archetype"] in ("familiar", "radical", "inverse")
            assert sw["exploration_profile"]["seed_fidelity"] >= 0


def test_backward_compatibility_empty_profile():
    """Verify older records without exploration profiles convert to schemas with defaults."""
    record = WorldCandidateRecord(
        project_id="legacy-proj",
        seed_dna_id="legacy-dna",
        batch_id="legacy-batch",
        candidate_index=1,
        title="Legacy Submerged World",
        archetype="Mythic Archetype",
        concept="A forgotten kingdom beneath the waves.",
        aesthetic="Blue and gold.",
        core_tension="Pressure collapse.",
        trade_offs="High mystery.",
        key_visual="Drowned arch.",
        divergence_archetype="",
        exploration_profile_json="",
        emphasized_potential_labels_json="",
    )

    candidate = record.to_candidate()
    assert candidate.divergence_archetype == "familiar"
    assert candidate.exploration_profile.seed_fidelity == 80
    assert candidate.emphasized_potential_labels == []

    read_schema = record.to_read_schema()
    assert read_schema.divergence_archetype == "familiar"
    assert read_schema.exploration_profile.novelty == 70
    assert read_schema.emphasized_potential_labels == []
