import pytest
import httpx
from sqlmodel import select

from backend.app.models.selection import (
    HumanOnlyZones,
    WorldSelectionCreate,
    WorldSelectionRecord,
)
from backend.app.models.unfold import WorldBibleRead, CharacterRead, SceneRead
from backend.app.providers.gemini_provider import GeminiProvider
from backend.app.routers.unfold import enforce_human_only_zones_guard
from backend.app.services.lineage_service import LineageService
from backend.app.repositories.project_repo import ProjectRepository, get_session


def test_human_only_zones_model_serialization():
    """HOZ-01: Verify validation, serialization, and round-trip conversion."""
    hoz = HumanOnlyZones(
        core_theme="Ancient biotechnology vs mechanized surface extraction",
        protagonist_motivation="Rescue the abyssal choir before the tectonic mantle ruptures",
        central_conflict="Sentient coral symbionts resisting corporate planetary harvesters",
        is_locked=True,
    )
    assert hoz.core_theme == "Ancient biotechnology vs mechanized surface extraction"
    assert hoz.protagonist_motivation == "Rescue the abyssal choir before the tectonic mantle ruptures"
    assert hoz.central_conflict == "Sentient coral symbionts resisting corporate planetary harvesters"
    assert hoz.is_locked is True

    # Test round trip dump and load
    data = hoz.model_dump()
    reconstructed = HumanOnlyZones(**data)
    assert reconstructed == hoz


def test_backward_compatibility_legacy_selections():
    """HOZ-01: Verify legacy projects with empty/null human_only_zones_json deserialize safely."""
    record = WorldSelectionRecord(
        project_id="proj-legacy",
        world_candidate_id="cand-legacy",
        batch_id="batch-legacy",
        user_rationale="Legacy selection without HOZ",
        human_only_zones_json="{}",
    )
    assert record.get_human_only_zones() is None

    record_none = WorldSelectionRecord(
        project_id="proj-legacy-none",
        world_candidate_id="cand-legacy",
        batch_id="batch-legacy",
        human_only_zones_json=None,
    )
    assert record_none.get_human_only_zones() is None


@pytest.mark.asyncio
async def test_save_world_selection_with_human_only_zones(client: httpx.AsyncClient):
    """HOZ-01: Verify persistence and retrieval of Human-Only Zones in World Selection."""
    # 1. Create project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "HOZ Selection Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Extract DNA & Generate Worlds
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res.status_code == 200
    candidate_id = gen_res.json()["data"][0]["id"]

    # 3. Select candidate with locked Human-Only Zones
    hoz_payload = {
        "core_theme": "Coexistence between abyssal biology and human consciousness",
        "protagonist_motivation": "Decode the neural coral lattice to prevent planetary war",
        "central_conflict": "Ecological symbiosis vs industrial despoliation",
        "is_locked": True,
    }
    select_res = await client.post(
        f"/api/projects/{project_id}/worlds/{candidate_id}/select",
        json={
            "user_rationale": "Locked zones for test",
            "human_only_zones": hoz_payload,
        },
    )
    assert select_res.status_code == 200
    res_data = select_res.json()["data"]
    assert res_data["human_only_zones"] is not None
    assert res_data["human_only_zones"]["core_theme"] == hoz_payload["core_theme"]
    assert res_data["human_only_zones"]["protagonist_motivation"] == hoz_payload["protagonist_motivation"]
    assert res_data["human_only_zones"]["central_conflict"] == hoz_payload["central_conflict"]
    assert res_data["human_only_zones"]["is_locked"] is True

    # 4. Fetch active selection
    get_sel_res = await client.get(f"/api/projects/{project_id}/selection")
    assert get_sel_res.status_code == 200
    sel_data = get_sel_res.json()["data"]
    assert sel_data["human_only_zones"] is not None
    assert sel_data["human_only_zones"]["core_theme"] == hoz_payload["core_theme"]
    assert sel_data["decision_dna"]["human_only_zones"]["central_conflict"] == hoz_payload["central_conflict"]


def test_prompt_contract_exact_invariance():
    """HOZ-02: Verify prompt contract includes exact invariant headers, all 3 zones, and zero-override rule."""
    hoz = HumanOnlyZones(
        core_theme="Abyssal synthetic biology",
        protagonist_motivation="Save the reef consciousness",
        central_conflict="Reef symbionts vs planetary dredge",
        is_locked=True,
    )
    context = {
        "decision_dna": {
            "creative_priorities": ["Maintain hard sci-fi marine biology"],
            "rejected_directions": ["No high-fantasy magic"],
            "user_rationale": "Deep bio-organic focus",
            "human_only_zones": hoz.model_dump(),
        }
    }

    contract = GeminiProvider.format_decision_dna_contract(context)
    assert "=== IMMUTABLE HUMAN-ONLY ZONES (CREATOR LOCKS) ===" in contract
    assert "- CORE THEME: Abyssal synthetic biology" in contract
    assert "- PROTAGONIST MOTIVATION: Save the reef consciousness" in contract
    assert "- CENTRAL CONFLICT: Reef symbionts vs planetary dredge" in contract
    assert "STRICT ZERO-OVERRIDE RULE:" in contract
    assert "Do NOT alter, soften, replace, or reinterpret these locked principles." in contract

    # Unlocked / Empty contract verification
    context_unlocked = {
        "decision_dna": {
            "human_only_zones": {
                "core_theme": "Something",
                "is_locked": False,
            }
        }
    }
    contract_unlocked = GeminiProvider.format_decision_dna_contract(context_unlocked)
    assert "=== IMMUTABLE HUMAN-ONLY ZONES (CREATOR LOCKS) ===" not in contract_unlocked


def test_schema_guard_enforces_all_three_zones_exact_immutability():
    """HOZ-01 & HOZ-02: Backend schema guard deterministically restores all 3 zones even if AI drifts."""
    hoz = HumanOnlyZones(
        core_theme="Absolute Harmony With Living Oceans",
        protagonist_motivation="Cure the neural coral blight at all personal costs",
        central_conflict="Preservationists vs Oceanic Strip-Miners",
        is_locked=True,
    )

    # Fabricate drifted/hallucinated model response
    drifted_data = {
        "world_bible": {
            "geography": "Deep ocean trenches",
            "physics_rules": "Hydrostatic pressure wards",
            "canon_facts": [
                "Drifted law: Cybernetic submarines rule the waves",
                "Secondary lore fact",
            ],
        },
        "characters": [
            {
                "name": "Dr. Vance",
                "role": "Lead Protagonist",
                "archetype": "Drifted Archetype",
                "motivation": "Hallucinated motivation: Get rich selling rare artifacts",
                "core_conflict": "Greed vs danger",
            },
            {
                "name": "Sidekick",
                "role": "Support",
                "motivation": "Protect Vance",
            },
        ],
        "scenes": [
            {
                "scene_number": 1,
                "title": "Opening",
                "conflict_narrative": "Initial dive hazards",
            },
            {
                "scene_number": 2,
                "title": "The Trench",
                "conflict_narrative": "Submersible breakdown",
            },
            {
                "scene_number": 3,
                "title": "Climactic Confrontation",
                "conflict_narrative": "Hallucinated conflict: Battle with sea monster kraken",
            },
        ],
    }

    # Execute deterministic schema guard
    guarded_data = enforce_human_only_zones_guard(drifted_data, hoz)

    # 1. Verify Core Theme restored verbatim
    canon_fact_0 = guarded_data["world_bible"]["canon_facts"][0]
    assert canon_fact_0["fact"] == hoz.core_theme
    assert canon_fact_0["origin_type"] == "HUMAN_DECISION"
    assert canon_fact_0["origin_source"] == "Human-Only Zone: Core Theme"

    # 2. Verify Protagonist Motivation restored verbatim
    protagonist = guarded_data["characters"][0]
    assert protagonist["motivation"] == hoz.protagonist_motivation
    assert protagonist["origin_type"] == "HUMAN_DECISION"
    assert protagonist["origin_source"] == "Human-Only Zone: Protagonist Motivation"

    # 3. Verify Central Conflict restored verbatim
    climax_scene = guarded_data["scenes"][2]
    assert climax_scene["conflict_narrative"] == hoz.central_conflict
    assert climax_scene["origin_type"] == "HUMAN_DECISION"
    assert climax_scene["origin_source"] == "Human-Only Zone: Central Conflict"


@pytest.mark.asyncio
async def test_full_pipeline_unfold_with_human_only_zones(client: httpx.AsyncClient):
    """HOZ-01 & HOZ-02: End-to-end unfolding with Human-Only Zones preserves locks in codex."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "HOZ Full Unfold Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidate_id = gen_res.json()["data"][0]["id"]

    hoz_payload = {
        "core_theme": "Coexistence between abyssal biology and human consciousness",
        "protagonist_motivation": "Decode the neural coral lattice to prevent planetary war",
        "central_conflict": "Ecological symbiosis vs industrial despoliation",
        "is_locked": True,
    }
    await client.post(
        f"/api/projects/{project_id}/worlds/{candidate_id}/select",
        json={
            "user_rationale": "Pipeline test rationale",
            "human_only_zones": hoz_payload,
        },
    )

    unfold_res = await client.post(f"/api/projects/{project_id}/unfold")
    assert unfold_res.status_code == 200
    codex = unfold_res.json()["data"]

    # World Bible canon fact contains locked theme
    assert hoz_payload["core_theme"] in codex["world_bible"]["canon_facts"][0]

    # Protagonist has locked motivation and origin
    protagonist = codex["characters"][0]
    assert protagonist["motivation"] == hoz_payload["protagonist_motivation"]
    assert protagonist["origin_type"] == "HUMAN_DECISION"
    assert protagonist["origin_source"] == "Human-Only Zone: Protagonist Motivation"

    # Climax scene has locked conflict and origin
    climax_scene = codex["scenes"][2] if len(codex["scenes"]) >= 3 else codex["scenes"][-1]
    assert climax_scene["conflict_narrative"] == hoz_payload["central_conflict"]
    assert climax_scene["origin_type"] == "HUMAN_DECISION"
    assert climax_scene["origin_source"] == "Human-Only Zone: Central Conflict"


@pytest.mark.asyncio
async def test_origin_ledger_and_causal_dag_attribution(client: httpx.AsyncClient):
    """HOZ-02: Verify Causal DAG, Origin Ledger, and plain-language explanation for Human-Only Zones."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "HOZ Lineage Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidate_id = gen_res.json()["data"][0]["id"]

    hoz_payload = {
        "core_theme": "Abyssal living tech",
        "protagonist_motivation": "Protect ancient ecosystem",
        "central_conflict": "Harmony vs Exploitation",
        "is_locked": True,
    }
    await client.post(
        f"/api/projects/{project_id}/worlds/{candidate_id}/select",
        json={
            "user_rationale": "Lineage test",
            "human_only_zones": hoz_payload,
        },
    )
    await client.post(f"/api/projects/{project_id}/unfold")

    # Fetch Lineage Graph
    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    lineage = lineage_res.json()["data"]

    # Verify selection node contains HOZ in metadata
    sel_node = next((n for n in lineage["nodes"] if n["id"] == "node-selection"), None)
    assert sel_node is not None
    assert sel_node["metadata"].get("human_only_zones") is not None
    assert sel_node["metadata"]["human_only_zones"]["core_theme"] == hoz_payload["core_theme"]

    # Verify protagonist character node has HUMAN_DECISION
    char_node = next((n for n in lineage["nodes"] if n["entity_type"] == "character" and n["origin_source"] == "Human-Only Zone: Protagonist Motivation"), None)
    assert char_node is not None
    assert char_node["origin_type"] == "HUMAN_DECISION"
    assert "Locked by the human creator as an inviolable Human-Only Zone before universe expansion." in char_node["causal_explanation"]

    # Verify scene node has HUMAN_DECISION
    scene_node = next((n for n in lineage["nodes"] if n["entity_type"] == "scene" and n["origin_source"] == "Human-Only Zone: Central Conflict"), None)
    assert scene_node is not None
    assert scene_node["origin_type"] == "HUMAN_DECISION"
    assert "Locked by the human creator as an inviolable Human-Only Zone before universe expansion." in scene_node["causal_explanation"]

    # Test static explanation generator directly
    explanation = LineageService.generate_origin_explanation(
        node_type="character",
        origin_type="HUMAN_DECISION",
        origin_source="Human-Only Zone: Protagonist Motivation",
        title="Dr. Althea Thorne",
    )
    assert "Locked by the human creator as an inviolable Human-Only Zone before universe expansion." in explanation


@pytest.mark.asyncio
async def test_canonical_demo_includes_human_only_zones(client: httpx.AsyncClient):
    """HOZ-01 & HOZ-02: Instant Demo Universe seeds canonical Human-Only Zones."""
    demo_res = await client.post("/api/projects/canonical-demo")
    assert demo_res.status_code == 201
    demo_data = demo_res.json()["data"]
    project_id = demo_data["id"]

    # 1. Active selection has exact canonical HOZ strings
    sel_res = await client.get(f"/api/projects/{project_id}/selection")
    assert sel_res.status_code == 200
    sel = sel_res.json()["data"]
    hoz = sel["human_only_zones"]
    assert hoz is not None
    assert hoz["core_theme"] == "Coexistence between synthetic human biology and ancient abyssal intelligence"
    assert hoz["protagonist_motivation"] == "Decipher the sentient coral reef's neural frequency before corporate salvage crews arrive"
    assert hoz["central_conflict"] == "Bio-symbiont collective survival vs. extractive corporate exploitation"
    assert hoz["is_locked"] is True

    # 2. Decision DNA carries exact canonical HOZ strings
    assert sel.get("decision_dna") is not None
    dna_hoz = sel["decision_dna"].get("human_only_zones")
    assert dna_hoz is not None
    assert dna_hoz["core_theme"] == "Coexistence between synthetic human biology and ancient abyssal intelligence"
    assert dna_hoz["protagonist_motivation"] == "Decipher the sentient coral reef's neural frequency before corporate salvage crews arrive"
    assert dna_hoz["central_conflict"] == "Bio-symbiont collective survival vs. extractive corporate exploitation"

    # 3. Codex has locked core theme, character motivation, and climax conflict
    codex_res = await client.get(f"/api/projects/{project_id}/unfolded")
    assert codex_res.status_code == 200
    codex = codex_res.json()["data"]

    # Check World Bible canon fact #0
    assert len(codex["world_bible"]["canon_facts"]) > 0
    assert codex["world_bible"]["canon_facts"][0] == "Coexistence between synthetic human biology and ancient abyssal intelligence"

    # Check Dr. Althea Thorne
    althea = next((c for c in codex["characters"] if "althea" in c["name"].lower()), None)
    assert althea is not None
    assert althea["motivation"] == "Decipher the sentient coral reef's neural frequency before corporate salvage crews arrive"
    assert althea["origin_type"] == "HUMAN_DECISION"
    assert althea["origin_source"] == "Human-Only Zone: Protagonist Motivation"

    # Check Scene 3
    scene_3 = next((s for s in codex["scenes"] if s["scene_number"] == 3), None)
    assert scene_3 is not None
    assert scene_3["conflict_narrative"] == "Bio-symbiont collective survival vs. extractive corporate exploitation"
    assert scene_3["origin_type"] == "HUMAN_DECISION"
    assert scene_3["origin_source"] == "Human-Only Zone: Central Conflict"

    # 4. Lineage DAG attribution for canonical demo
    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    lineage = lineage_res.json()["data"]
    
    # Selection node in DAG carries exact HOZ in metadata
    sel_node = next((n for n in lineage["nodes"] if n["id"] == "node-selection"), None)
    assert sel_node is not None
    assert sel_node["metadata"].get("human_only_zones") is not None
    assert sel_node["metadata"]["human_only_zones"]["core_theme"] == "Coexistence between synthetic human biology and ancient abyssal intelligence"

    # Character node has HUMAN_DECISION and deterministic causal explanation
    char_node = next((n for n in lineage["nodes"] if n["entity_type"] == "character" and n["origin_source"] == "Human-Only Zone: Protagonist Motivation"), None)
    assert char_node is not None
    assert char_node["origin_type"] == "HUMAN_DECISION"
    assert "Locked by the human creator as an inviolable Human-Only Zone before universe expansion." in char_node["causal_explanation"]

    # Scene node has HUMAN_DECISION and deterministic causal explanation
    scene_node = next((n for n in lineage["nodes"] if n["entity_type"] == "scene" and n["origin_source"] == "Human-Only Zone: Central Conflict"), None)
    assert scene_node is not None
    assert scene_node["origin_type"] == "HUMAN_DECISION"
    assert "Locked by the human creator as an inviolable Human-Only Zone before universe expansion." in scene_node["causal_explanation"]
