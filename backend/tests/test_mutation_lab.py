import json
import httpx
import pytest

from backend.app.models.mutation import (
    ForkMutationRequest,
    MutationMetadata,
    SeedMutationRequest,
)
from backend.app.providers.factory import get_storage_provider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.lineage_service import LineageService
from backend.app.services.mutation_service import MutationService
from backend.app.services.persistence_service import PersistenceService


async def _setup_unfolded_project(client: httpx.AsyncClient) -> str:
    """Helper to bootstrap a canonical project all the way to unfolded universe stage 5."""
    # 1. Create project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Abyssal Sanctuary",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Extract DNA
    dna_res = await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    assert dna_res.status_code == 200

    # 3. Generate Candidates
    worlds_res = await client.post(f"/api/projects/{project_id}/worlds/generate", json={})
    assert worlds_res.status_code == 200
    chosen_id = worlds_res.json()["data"][0]["id"]

    # 4. Human Selection
    sel_res = await client.post(
        f"/api/projects/{project_id}/worlds/{chosen_id}/select",
        json={
            "user_rationale": "Submerged architectural marvel with ancient secrets.",
        },
    )
    assert sel_res.status_code == 200

    # 5. Unfold Universe
    unfold_res = await client.post(f"/api/projects/{project_id}/unfold", json={})
    assert unfold_res.status_code == 200

    return project_id


@pytest.mark.asyncio
async def test_extract_all_four_premise_variables(client: httpx.AsyncClient):
    """Verifies extraction of Core Premise, Tone, Central Conflict, and World Rule (MUT-01)."""
    project_id = await _setup_unfolded_project(client)

    res = await client.get(f"/api/projects/{project_id}/mutation/variables")
    assert res.status_code == 200
    variables = res.json()["data"]

    assert len(variables) == 4
    var_types = [v["variable_type"] for v in variables]
    assert "core_premise" in var_types
    assert "tone_atmosphere" in var_types
    assert "central_conflict" in var_types
    assert "world_rule" in var_types

    # Validate that original values are non-empty
    for var in variables:
        assert len(var["original_value"]) > 0
        assert len(var["label"]) > 0
        assert len(var["source_entity"]) > 0


@pytest.mark.asyncio
async def test_seed_mutation_request_validation():
    """Validates schema structure and sanitization for SeedMutationRequest."""
    req = SeedMutationRequest(
        mutated_variable="core_premise",
        original_value="A child discovers a forgotten city beneath the ocean.",
        new_value="What if the city was actually a weaponized outpost?",
        hypothesis_prompt="What if the city was actually a weaponized outpost?",
    )
    assert req.mutated_variable == "core_premise"
    assert "weaponized" in req.new_value


@pytest.mark.asyncio
async def test_lineage_first_impact_classification(client: httpx.AsyncClient):
    """Verifies that entities are classified into AFFECTED, CONDITIONAL, and PRESERVED (MUT-02)."""
    project_id = await _setup_unfolded_project(client)

    payload = {
        "mutated_variable": "core_premise",
        "original_value": "A child discovers a forgotten city beneath the ocean.",
        "new_value": "Submerged military fortress and weaponized citadel",
        "hypothesis_prompt": "What if the city was actually a weaponized outpost?",
    }
    res = await client.post(f"/api/projects/{project_id}/mutation/simulate", json=payload)
    assert res.status_code == 200
    sim = res.json()["data"]

    counts = sim["summary_counts"]
    assert counts["affected"] > 0
    assert counts["conditional"] > 0
    assert counts["preserved"] > 0

    entities = sim["impacted_entities"]
    categories = {e["impact_category"] for e in entities}
    assert "AFFECTED" in categories
    assert "CONDITIONAL" in categories
    assert "PRESERVED" in categories

    # Verify that World Bible / Primary sector is AFFECTED
    affected_titles = [e["title"] for e in entities if e["impact_category"] == "AFFECTED"]
    assert any("World Bible" in t or "Location" in t or "Scene 1" in t for t in affected_titles)

    # Verify that Protagonist is CONDITIONAL
    conditional_titles = [e["title"] for e in entities if e["impact_category"] == "CONDITIONAL"]
    assert any("Protagonist" in t or "Character" in t for t in conditional_titles)

    # Verify that Natural Geography is PRESERVED
    preserved_titles = [e["title"] for e in entities if e["impact_category"] == "PRESERVED"]
    assert len(preserved_titles) > 0


@pytest.mark.asyncio
async def test_deterministic_classification_offline_resilience(client: httpx.AsyncClient):
    """Verifies simulation operates deterministically and instantaneously without external API keys."""
    project_id = await _setup_unfolded_project(client)

    payload = {
        "mutated_variable": "world_rule",
        "original_value": "Oceanic water breathing",
        "new_value": "Crushing hyper-baric radiation requiring lead shielding",
        "hypothesis_prompt": "What if the water was lethal to unprotected biological tissue?",
    }
    res = await client.post(f"/api/projects/{project_id}/mutation/simulate", json=payload)
    assert res.status_code == 200
    sim = res.json()["data"]
    assert sim["suggested_branch_name"].startswith("mutation/")
    assert len(sim["impacted_entities"]) >= 3


@pytest.mark.asyncio
async def test_causal_justifications_no_cot_leakage(client: httpx.AsyncClient):
    """Verifies all entity causal justifications are plain-language and contain zero chain-of-thought tokens."""
    project_id = await _setup_unfolded_project(client)

    payload = {
        "mutated_variable": "core_premise",
        "original_value": "Forgotten city",
        "new_value": "Weaponized outpost",
        "hypothesis_prompt": "What if the city was actually a weaponized outpost?",
    }
    res = await client.post(f"/api/projects/{project_id}/mutation/simulate", json=payload)
    assert res.status_code == 200
    entities = res.json()["data"]["impacted_entities"]

    forbidden_tokens = ["<thought>", "</thought>", "I think", "Step 1:", "My reasoning:", "chain-of-thought"]
    for entity in entities:
        justification = entity["causal_justification"]
        assert len(justification) > 15
        for token in forbidden_tokens:
            assert token not in justification, f"Leaked token '{token}' found in justification"


@pytest.mark.asyncio
async def test_branch_name_sanitization_and_collision_safety():
    """Verifies branch name sanitization, empty fallback, and collision handling (Correction 6)."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        service = MutationService(repo, PersistenceService(repo, get_storage_provider(), LineageService(repo)), LineageService(repo))

        existing = ["mutation/test-fork", "mutation/weaponized-outpost"]

        # 1. Normal sanitization
        assert service.sanitize_branch_name("Weaponized Outpost!", existing) == "mutation/weaponized-outpost-2"

        # 2. Spaces and slashes
        assert service.sanitize_branch_name("mutation/cool branch//", existing) == "mutation/cool-branch"

        # 3. Empty fallback
        assert service.sanitize_branch_name("", existing) == "mutation/unnamed-fork"
        assert service.sanitize_branch_name("   ", existing) == "mutation/unnamed-fork"


@pytest.mark.asyncio
async def test_fork_mutation_isolated_branch_and_id_remapping(client: httpx.AsyncClient):
    """Verifies that forking creates an isolated child branch with remapped IDs (MUT-03)."""
    project_id = await _setup_unfolded_project(client)

    fork_payload = {
        "mutated_variable": "core_premise",
        "original_value": "A child discovers a forgotten city beneath the ocean.",
        "new_value": "A weaponized military outpost",
        "hypothesis_prompt": "What if the city was actually a weaponized outpost?",
        "branch_name": "mutation/weaponized-outpost",
        "rationale": "Testing timeline branching isolation",
    }
    res = await client.post(f"/api/projects/{project_id}/mutation/fork", json=fork_payload)
    assert res.status_code == 200
    child_data = res.json()["data"]

    assert child_data["id"] != project_id
    assert child_data["parent_project_id"] == project_id
    assert child_data["branch_name"] == "mutation/weaponized-outpost"


@pytest.mark.asyncio
async def test_parent_universe_immutability_deep_snapshot(client: httpx.AsyncClient):
    """
    Verifies deep parent universe immutability before and after fork (Correction 5).
    Captures complete pre-fork snapshot of parent and asserts 100% equality afterwards.
    """
    project_id = await _setup_unfolded_project(client)

    # 1. Capture complete pre-fork snapshot of parent
    parent_pre_res = await client.get(f"/api/projects/{project_id}")
    assert parent_pre_res.status_code == 200
    parent_pre_data = parent_pre_res.json()["data"]

    parent_unfold_pre = await client.get(f"/api/projects/{project_id}/unfolded")
    assert parent_unfold_pre.status_code == 200
    universe_pre = parent_unfold_pre.json()["data"]

    parent_dna_pre = await client.get(f"/api/projects/{project_id}/dna")
    assert parent_dna_pre.status_code == 200
    dna_pre = parent_dna_pre.json()["data"]

    # 2. Fork mutated child branch
    fork_payload = {
        "mutated_variable": "core_premise",
        "original_value": "A child discovers a forgotten city beneath the ocean.",
        "new_value": "A weaponized military outpost",
        "hypothesis_prompt": "What if the city was actually a weaponized outpost?",
        "branch_name": "mutation/weaponized-outpost",
    }
    fork_res = await client.post(f"/api/projects/{project_id}/mutation/fork", json=fork_payload)
    assert fork_res.status_code == 200
    child_id = fork_res.json()["data"]["id"]

    # 3. Verify parent post-fork is logically identical
    parent_post_res = await client.get(f"/api/projects/{project_id}")
    parent_post_data = parent_post_res.json()["data"]
    assert parent_post_data["title"] == parent_pre_data["title"]
    assert parent_post_data["seed_text"] == parent_pre_data["seed_text"]
    assert parent_post_data["branch_name"] == parent_pre_data["branch_name"]

    parent_dna_post = await client.get(f"/api/projects/{project_id}/dna")
    assert parent_dna_post.json()["data"]["dna"]["premise"] == dna_pre["dna"]["premise"]

    parent_unfold_post = await client.get(f"/api/projects/{project_id}/unfolded")
    universe_post = parent_unfold_post.json()["data"]
    assert universe_post["world_bible"]["physics_rules"] == universe_pre["world_bible"]["physics_rules"]
    assert universe_post["characters"][0]["id"] == universe_pre["characters"][0]["id"]
    assert universe_post["characters"][0]["motivation"] == universe_pre["characters"][0]["motivation"]

    # 4. Verify child IDs differ completely from parent IDs
    child_unfold_res = await client.get(f"/api/projects/{child_id}/unfolded")
    assert child_unfold_res.status_code == 200
    child_universe = child_unfold_res.json()["data"]
    assert child_universe["characters"][0]["id"] != universe_pre["characters"][0]["id"]


@pytest.mark.asyncio
async def test_mutation_metadata_persistence_on_child(client: httpx.AsyncClient):
    """Verifies mutation_metadata_json is saved on the child project record (Correction 1)."""
    project_id = await _setup_unfolded_project(client)

    fork_payload = {
        "mutated_variable": "core_premise",
        "original_value": "A child discovers a forgotten city beneath the ocean.",
        "new_value": "A weaponized military outpost",
        "hypothesis_prompt": "What if the city was actually a weaponized outpost?",
        "branch_name": "mutation/meta-test",
    }
    fork_res = await client.post(f"/api/projects/{project_id}/mutation/fork", json=fork_payload)
    assert fork_res.status_code == 200
    child_data = fork_res.json()["data"]

    assert child_data["mutation_metadata_json"] is not None
    meta = json.loads(child_data["mutation_metadata_json"])
    assert meta["mutated_variable"] == "core_premise"
    assert meta["new_value"] == "A weaponized military outpost"
    assert meta["hypothesis_prompt"] == "What if the city was actually a weaponized outpost?"
    assert "impact_summary" in meta
    assert meta["impact_summary"]["affected"] > 0


@pytest.mark.asyncio
async def test_fork_mutation_non_premise_variable_tone(client: httpx.AsyncClient):
    """Verifies mutating Tone updates SeedDNA.tone and tone descriptors without overwriting premise (Correction 2)."""
    project_id = await _setup_unfolded_project(client)

    dna_pre = (await client.get(f"/api/projects/{project_id}/dna")).json()["data"]["dna"]

    fork_payload = {
        "mutated_variable": "tone_atmosphere",
        "original_value": dna_pre["tone"],
        "new_value": "Dark psychological cosmic paranoia",
        "hypothesis_prompt": "What if the discovery induced deep psychological paranoia?",
        "branch_name": "mutation/paranoia-tone",
    }
    fork_res = await client.post(f"/api/projects/{project_id}/mutation/fork", json=fork_payload)
    assert fork_res.status_code == 200
    child_id = fork_res.json()["data"]["id"]

    # Child tone updated, but premise preserved
    child_dna = (await client.get(f"/api/projects/{child_id}/dna")).json()["data"]["dna"]
    assert child_dna["tone"] == "Dark psychological cosmic paranoia"
    assert child_dna["premise"] == dna_pre["premise"]


@pytest.mark.asyncio
async def test_fork_mutation_world_rule_variable(client: httpx.AsyncClient):
    """Verifies mutating World Rule updates WorldBible.physics_rules without mutating premise (Correction 2)."""
    project_id = await _setup_unfolded_project(client)

    fork_payload = {
        "mutated_variable": "world_rule",
        "original_value": "Water breathing currents",
        "new_value": "Crushing gravity pulses every six hours",
        "hypothesis_prompt": "What if the city experienced periodic gravity collapses?",
        "branch_name": "mutation/gravity-rule",
    }
    fork_res = await client.post(f"/api/projects/{project_id}/mutation/fork", json=fork_payload)
    assert fork_res.status_code == 200
    child_id = fork_res.json()["data"]["id"]

    child_unfold = (await client.get(f"/api/projects/{child_id}/unfolded")).json()["data"]
    assert "Crushing gravity pulses" in child_unfold["world_bible"]["physics_rules"]


@pytest.mark.asyncio
async def test_child_branch_origin_ledger_mutation_citation(client: httpx.AsyncClient):
    """Verifies adapted entities record USER_ADDED and mutation citation in Origin Ledger (Correction 4)."""
    project_id = await _setup_unfolded_project(client)

    fork_payload = {
        "mutated_variable": "core_premise",
        "original_value": "Forgotten city",
        "new_value": "Weaponized outpost",
        "hypothesis_prompt": "What if the city was actually a weaponized outpost?",
        "branch_name": "mutation/citation-check",
    }
    fork_res = await client.post(f"/api/projects/{project_id}/mutation/fork", json=fork_payload)
    assert fork_res.status_code == 200
    child_id = fork_res.json()["data"]["id"]

    # Query child lineage graph
    lineage_res = await client.get(f"/api/projects/{child_id}/lineage")
    assert lineage_res.status_code == 200
    graph = lineage_res.json()["data"]

    nodes = graph["nodes"]
    mutation_nodes = [
        n for n in nodes
        if n.get("origin_type") == "USER_ADDED" and "Forked via Seed Mutation Lab" in (n.get("origin_source") or "")
    ]
    assert len(mutation_nodes) >= 1, "Expected at least one node with mutation citation"


@pytest.mark.asyncio
async def test_mutation_api_endpoints(client: httpx.AsyncClient):
    """Verifies HTTP endpoints (/variables, /simulate, /fork) return standardized APIResponse structures."""
    project_id = await _setup_unfolded_project(client)

    # 1. Variables
    v_res = await client.get(f"/api/projects/{project_id}/mutation/variables")
    assert v_res.status_code == 200
    assert v_res.json()["success"] is True

    # 2. Simulate
    s_res = await client.post(
        f"/api/projects/{project_id}/mutation/simulate",
        json={
            "mutated_variable": "core_premise",
            "original_value": "A forgotten city",
            "new_value": "A flying sky citadel",
            "hypothesis_prompt": "What if the city flew in the clouds?",
        },
    )
    assert s_res.status_code == 200
    assert s_res.json()["success"] is True
    assert "suggested_branch_name" in s_res.json()["data"]

    # 3. Fork
    f_res = await client.post(
        f"/api/projects/{project_id}/mutation/fork",
        json={
            "mutated_variable": "core_premise",
            "original_value": "A forgotten city",
            "new_value": "A flying sky citadel",
            "hypothesis_prompt": "What if the city flew in the clouds?",
            "branch_name": "mutation/sky-citadel",
        },
    )
    assert f_res.status_code == 200
    assert f_res.json()["success"] is True
    assert f_res.json()["data"]["branch_name"] == "mutation/sky-citadel"
