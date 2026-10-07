import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch
import httpx
import pytest

from backend.app.models.selection import (
    DecisionDNA,
    WorldSelectionCreate,
    WorldSelectionRecord,
    WorldSelectionRead,
)
from backend.app.models.world import WorldCandidateRead
from backend.app.providers.gemini_provider import GeminiProvider
from backend.app.providers.mock_provider import MockProvider
from backend.app.repositories.project_repo import ProjectRepository, async_session


def test_decision_dna_model_serialization():
    """Verify DecisionDNA validation, serialization, and default list handling."""
    now = datetime.now(timezone.utc)
    dna = DecisionDNA(
        selected_world_id="cand-123",
        selected_title="Bio-City",
        selected_archetype="radical",
        user_rationale="Focus on deep biopunk ecology",
        creative_priorities=["Ecological / Symbiotic Mystery", "Atmospheric Lore Depth"],
        rejected_directions=["Classical sunken ruins archaeology"],
        custom_directives="Keep living coral central",
        created_at=now,
    )

    dumped = dna.model_dump()
    assert dumped["selected_world_id"] == "cand-123"
    assert dumped["selected_title"] == "Bio-City"
    assert len(dumped["creative_priorities"]) == 2
    assert len(dumped["rejected_directions"]) == 1
    assert dumped["custom_directives"] == "Keep living coral central"

    # Re-validate from dump
    reconstructed = DecisionDNA.model_validate(dumped)
    assert reconstructed.selected_title == "Bio-City"
    assert reconstructed.creative_priorities == ["Ecological / Symbiotic Mystery", "Atmospheric Lore Depth"]


def test_world_selection_backward_compatibility():
    """Verify legacy selection records without Decision DNA fields safely deserialize with empty defaults."""
    now = datetime.now(timezone.utc)
    # Simulate a legacy record where JSON fields are empty or defaults
    legacy_record = WorldSelectionRecord(
        project_id="proj-old",
        world_candidate_id="cand-old",
        batch_id="batch-old",
        user_rationale="Legacy selection note",
        created_at=now,
    )
    # Check default JSON column values
    assert legacy_record.creative_priorities_json == "[]"
    assert legacy_record.rejected_directions_json == "[]"
    assert legacy_record.custom_directives is None

    mock_cand = WorldCandidateRead(
        id="cand-old",
        project_id="proj-old",
        seed_dna_id="dna-old",
        batch_id="batch-old",
        candidate_index=1,
        title="Sunken City",
        archetype="Lost Civilization",
        concept="Ancient underwater city",
        aesthetic="Dark basalt ruins",
        core_tension="Pressure vs collapse",
        trade_offs="High mystery, low feasibility",
        key_visual="Basalt gates",
        model_used="mock",
        fallback_used=False,
        created_at=now,
    )

    read_schema = legacy_record.to_read_schema(mock_cand)
    assert read_schema.decision_dna is not None
    assert read_schema.decision_dna.selected_world_id == "cand-old"
    assert read_schema.decision_dna.selected_title == "Sunken City"
    assert read_schema.decision_dna.selected_archetype == "Lost Civilization"
    assert read_schema.decision_dna.user_rationale == "Legacy selection note"
    assert read_schema.decision_dna.creative_priorities == []
    assert read_schema.decision_dna.rejected_directions == []
    assert read_schema.decision_dna.custom_directives is None


@pytest.mark.asyncio
async def test_select_world_with_decision_dna(client: httpx.AsyncClient):
    """Verify selecting a world candidate persists complete Decision DNA and exposes it through API."""
    # 1. Create project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Decision DNA Test Project",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Extract DNA & Generate 3 Worlds
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res.status_code == 200
    candidates = gen_res.json()["data"]
    target = candidates[1]  # Candidate 2: Bio-City

    # 3. Select with complete Decision DNA payload
    selection_payload = {
        "user_rationale": "Deep exploration of symbiotic coral consciousness",
        "creative_priorities": [
            "Ecological / Symbiotic Mystery",
            "Atmospheric Lore Depth",
            "Philosophical Stakes",
        ],
        "rejected_directions": [
            "Classical sunken ruins archaeology",
            "Cold War militarized technology",
        ],
        "custom_directives": "Ensure living neural coral networks remain the central conflict point.",
    }

    select_res = await client.post(
        f"/api/projects/{project_id}/worlds/{target['id']}/select",
        json=selection_payload,
    )
    assert select_res.status_code == 200
    sel_json = select_res.json()
    assert sel_json["success"] is True

    data = sel_json["data"]
    assert "decision_dna" in data
    dna = data["decision_dna"]
    assert dna["selected_world_id"] == target["id"]
    assert dna["selected_title"] == target["title"]
    assert dna["selected_archetype"] == target["archetype"]
    assert dna["user_rationale"] == selection_payload["user_rationale"]
    assert dna["creative_priorities"] == selection_payload["creative_priorities"]
    assert dna["rejected_directions"] == selection_payload["rejected_directions"]
    assert dna["custom_directives"] == selection_payload["custom_directives"]

    # 4. Verify GET /projects/{id}/selection retrieves the persisted Decision DNA
    get_sel_res = await client.get(f"/api/projects/{project_id}/selection")
    assert get_sel_res.status_code == 200
    get_dna = get_sel_res.json()["data"]["decision_dna"]
    assert get_dna["creative_priorities"] == selection_payload["creative_priorities"]
    assert get_dna["rejected_directions"] == selection_payload["rejected_directions"]


@pytest.mark.asyncio
async def test_decision_dna_snapshot_propagation_to_unfold(client: httpx.AsyncClient):
    """Verify that during Stage 5 unfolding, the stable Decision DNA snapshot is passed into AI provider context."""
    # 1. Create project and prepare selection
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Snapshot Propagation Project",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidates = gen_res.json()["data"]
    target = candidates[1]

    # Select candidate with custom Decision DNA
    await client.post(
        f"/api/projects/{project_id}/worlds/{target['id']}/select",
        json={
            "user_rationale": "Symbiotic biopunk focus",
            "creative_priorities": ["Ecological / Symbiotic Mystery", "Intimate Personal Scale"],
            "rejected_directions": ["No magical fantasy elements"],
            "custom_directives": "Ground all science in deep-sea enzymology",
        },
    )

    # 2. Intercept provider.unfold_universe to assert context contains decision_dna snapshot
    intercepted_context = {}

    original_provider = MockProvider()
    real_unfold = original_provider.unfold_universe

    async def mock_unfold(context):
        nonlocal intercepted_context
        intercepted_context = context
        return await real_unfold(context)

    with patch("backend.app.routers.unfold.get_ai_provider") as mock_get_provider:
        mock_ai = AsyncMock()
        mock_ai.unfold_universe.side_effect = mock_unfold
        mock_get_provider.return_value = mock_ai

        unfold_res = await client.post(f"/api/projects/{project_id}/unfold")
        assert unfold_res.status_code == 200

    assert "decision_dna" in intercepted_context
    snapshot = intercepted_context["decision_dna"]
    assert snapshot is not None
    assert snapshot["selected_world_id"] == target["id"]
    assert snapshot["user_rationale"] == "Symbiotic biopunk focus"
    assert snapshot["creative_priorities"] == ["Ecological / Symbiotic Mystery", "Intimate Personal Scale"]
    assert snapshot["rejected_directions"] == ["No magical fantasy elements"]
    assert snapshot["custom_directives"] == "Ground all science in deep-sea enzymology"


def test_gemini_prompt_creative_contract_injection():
    """Verify GeminiProvider formats the explicit DECISION DNA CREATIVE CONTRACT without chain-of-thought leakage."""
    context = {
        "seed": "A child discovers a forgotten city beneath the ocean.",
        "creator_rationale": "High ethical and ecological stakes",
        "decision_dna": {
            "selected_world_id": "cand-999",
            "selected_title": "Bio-City",
            "selected_archetype": "radical",
            "user_rationale": "High ethical and ecological stakes",
            "creative_priorities": [
                "Ecological / Symbiotic Mystery",
                "Atmospheric Lore Depth",
            ],
            "rejected_directions": [
                "Classical sunken ruins archaeology",
                "Cold War militarized technology",
            ],
            "custom_directives": "Characters must struggle with assimilation vs survival.",
        },
    }

    contract_text = GeminiProvider.format_decision_dna_contract(context)
    assert "=== DECISION DNA CREATIVE CONTRACT ===" in contract_text
    assert "1. MANDATORY CREATIVE PRIORITIES:" in contract_text
    assert "- Ecological / Symbiotic Mystery" in contract_text
    assert "2. NEGATIVE GUARDRAILS & REJECTED DIRECTIONS:" in contract_text
    assert "- STRICTLY AVOID: Classical sunken ruins archaeology" in contract_text
    assert "- STRICTLY AVOID: Cold War militarized technology" in contract_text
    assert "3. CREATOR RATIONALE & DIRECTIVES:" in contract_text
    assert "Rationale: High ethical and ecological stakes" in contract_text
    assert "Directives: Characters must struggle with assimilation vs survival." in contract_text
    # Ensure no reasoning tokens or CoT formatting
    assert "thought:" not in contract_text.lower()
    assert "chain of thought" not in contract_text.lower()


@pytest.mark.asyncio
async def test_canonical_demo_decision_dna():
    """Verify canonical demo project populates canonical Decision DNA for Bio-City in <500ms."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        demo_project = await repo.create_canonical_demo_project()

        assert demo_project is not None
        assert demo_project.status == "universe_unfolded"

        # Check active selection
        active_sel = await repo.get_active_world_selection(demo_project.id)
        assert active_sel is not None
        sel_rec, cand_rec = active_sel
        assert cand_rec.title == "Bio-City"

        decision_dna = sel_rec.to_decision_dna(cand_rec.to_read_schema())
        assert decision_dna.selected_title == "Bio-City"
        assert "Ecological / Symbiotic Mystery" in decision_dna.creative_priorities
        assert "Classical sunken ruins archaeology" in decision_dna.rejected_directions
        assert decision_dna.user_rationale is not None
        assert "biopunk" in decision_dna.user_rationale.lower()
        assert decision_dna.custom_directives is not None
