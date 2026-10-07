import json
import httpx
import pytest

from backend.app.models.counterfactual import (
    ForkCounterfactualRequest,
    CounterfactualMetadata,
)
from backend.app.providers.factory import get_ai_provider, get_storage_provider
from backend.app.repositories.project_repo import ProjectRepository, async_session
from backend.app.services.counterfactual_service import CounterfactualService
from backend.app.services.lineage_service import LineageService
from backend.app.services.persistence_service import PersistenceService


async def _setup_unfolded_project(client: httpx.AsyncClient) -> tuple[str, str, list[str]]:
    """
    Helper to bootstrap a canonical project to unfolded universe stage 5.
    Returns (project_id, chosen_candidate_id, all_candidate_ids).
    """
    # 1. Create project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Oceanic Discovery",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Extract DNA
    dna_res = await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    assert dna_res.status_code == 200

    # 3. Generate Candidates (Stage 3)
    worlds_res = await client.post(f"/api/projects/{project_id}/worlds/generate", json={})
    assert worlds_res.status_code == 200
    all_cand_ids = [w["id"] for w in worlds_res.json()["data"]]
    chosen_id = all_cand_ids[0]

    # 4. Human Selection (Stage 4)
    sel_res = await client.post(
        f"/api/projects/{project_id}/worlds/{chosen_id}/select",
        json={
            "user_rationale": "Deep underwater exploration and forgotten civilization mystery.",
            "creative_priorities": ["Atmospheric Lore Depth", "Intimate Personal Scale"],
            "rejected_directions": ["Cold War militarized technology", "Pure cybernetic hard scifi"],
        },
    )
    assert sel_res.status_code == 200

    # 5. Unfold Universe (Stage 5)
    unfold_res = await client.post(f"/api/projects/{project_id}/unfold", json={})
    assert unfold_res.status_code == 200

    return project_id, chosen_id, all_cand_ids


@pytest.mark.asyncio
async def test_get_counterfactual_candidates_filters_selected(client: httpx.AsyncClient):
    """Verifies that only non-selected rejected candidate worlds are returned (CNTR-01)."""
    project_id, chosen_id, all_cand_ids = await _setup_unfolded_project(client)

    res = await client.get(f"/api/projects/{project_id}/counterfactual/candidates")
    assert res.status_code == 200
    data = res.json()["data"]

    # Exactly 2 rejected candidates from the batch of 3
    assert len(data) == 2
    returned_ids = [c["id"] for c in data]
    assert chosen_id not in returned_ids
    for cid in returned_ids:
        assert cid in all_cand_ids

    # Each rejected candidate has required metadata
    for cand in data:
        assert cand["title"]
        assert cand["archetype"]
        assert cand["concept"]
        assert cand["aesthetic"]
        assert cand["divergence_archetype"] in ["familiar", "radical", "inverse"]
        assert "exploration_profile" in cand
        assert "inferred_exclusion" in cand
        assert len(cand["inferred_exclusion"]) > 0


@pytest.mark.asyncio
async def test_deterministic_delta_generation_baseline(client: httpx.AsyncClient):
    """Verifies instant deterministic delta generation without external AI (CNTR-02)."""
    project_id, chosen_id, _ = await _setup_unfolded_project(client)

    cands_res = await client.get(f"/api/projects/{project_id}/counterfactual/candidates")
    rejected_cands = cands_res.json()["data"]
    target_cand = rejected_cands[0]

    # Explicitly disable AI to test pure baseline
    res = await client.get(f"/api/projects/{project_id}/counterfactual/delta/{target_cand['id']}?use_ai=false")
    assert res.status_code == 200
    delta = res.json()["data"]

    assert delta["project_id"] == project_id
    assert delta["canon_world_id"] == chosen_id
    assert delta["counterfactual_world_id"] == target_cand["id"]
    assert delta["counterfactual_title"] == target_cand["title"]
    assert delta["suggested_branch_name"].startswith("counterfactual/")

    # Assert 5 structured dimensions
    dimensions = delta["dimensions"]
    assert len(dimensions) == 5
    dimension_names = [d["dimension"] for d in dimensions]
    assert "protagonist" in dimension_names
    assert "tone_atmosphere" in dimension_names
    assert "central_conflict" in dimension_names
    assert "world_rules" in dimension_names
    assert "trade_offs" in dimension_names

    # Check protagonist comparison
    protagonist_dim = next(d for d in dimensions if d["dimension"] == "protagonist")
    assert len(protagonist_dim["canon_value"]) > 0
    assert len(protagonist_dim["counterfactual_value"]) > 0
    assert len(protagonist_dim["divergence_analysis"]) > 0
    assert protagonist_dim["divergence_level"] in ["subtle", "moderate", "radical", "inverse"]


@pytest.mark.asyncio
async def test_exploration_profile_metric_deltas(client: httpx.AsyncClient):
    """Verifies 4-metric exploration profile delta calculations between canon and candidate."""
    project_id, chosen_id, _ = await _setup_unfolded_project(client)

    cands_res = await client.get(f"/api/projects/{project_id}/counterfactual/candidates")
    target_cand = cands_res.json()["data"][0]

    res = await client.get(f"/api/projects/{project_id}/counterfactual/delta/{target_cand['id']}?use_ai=false")
    assert res.status_code == 200
    delta = res.json()["data"]

    prof_comp = delta["profile_comparison"]
    assert "canon_profile" in prof_comp
    assert "counterfactual_profile" in prof_comp
    assert "seed_fidelity_delta" in prof_comp
    assert "novelty_delta" in prof_comp
    assert "conceptual_distance_delta" in prof_comp
    assert "feasibility_delta" in prof_comp
    assert isinstance(prof_comp["summary"], str)


@pytest.mark.asyncio
async def test_counterfactual_delta_no_cot_leakage(client: httpx.AsyncClient):
    """Verifies that counterfactual delta output contains zero Chain-of-Thought leakage."""
    project_id, _, _ = await _setup_unfolded_project(client)

    cands_res = await client.get(f"/api/projects/{project_id}/counterfactual/candidates")
    target_cand = cands_res.json()["data"][0]

    res = await client.get(f"/api/projects/{project_id}/counterfactual/delta/{target_cand['id']}?use_ai=true")
    assert res.status_code == 200
    delta = res.json()["data"]

    leak_tokens = ["chain of thought", "reasoning:", "hidden thoughts", "system prompt", "instruction:", "<think>"]
    for dim in delta["dimensions"]:
        analysis = dim["divergence_analysis"].lower()
        for token in leak_tokens:
            assert token not in analysis, f"Chain-of-thought leak detected in dimension '{dim['dimension']}': {token}"


@pytest.mark.asyncio
async def test_fork_counterfactual_timeline_branch(client: httpx.AsyncClient):
    """Verifies spawning an isolated child branch rooted in a rejected candidate world (CNTR-01)."""
    project_id, chosen_id, _ = await _setup_unfolded_project(client)

    cands_res = await client.get(f"/api/projects/{project_id}/counterfactual/candidates")
    target_cand = cands_res.json()["data"][0]

    fork_res = await client.post(
        f"/api/projects/{project_id}/counterfactual/fork",
        json={
            "candidate_id": target_cand["id"],
            "branch_name": "counterfactual/test-branch",
            "rationale": "Exploring alternative timeline with different candidate.",
        },
    )
    assert fork_res.status_code == 200
    child_project = fork_res.json()["data"]

    # Child project attributes
    assert child_project["id"] != project_id
    assert child_project["parent_project_id"] == project_id
    assert child_project["branch_name"] == "counterfactual/test-branch"
    assert child_project["status"] == "world_selected"

    # Counterfactual metadata verification
    assert child_project.get("counterfactual_metadata_json") is not None
    meta = json.loads(child_project["counterfactual_metadata_json"])
    assert meta["parent_project_id"] == project_id
    assert meta["counterfactual_candidate_id"] == target_cand["id"]
    assert meta["counterfactual_title"] == target_cand["title"]
    assert meta["rationale"] == "Exploring alternative timeline with different candidate."


@pytest.mark.asyncio
async def test_parent_canon_immutability_on_counterfactual_fork(client: httpx.AsyncClient):
    """Verifies that the parent universe remains 100% immutable after counterfactual branching."""
    project_id, chosen_id, _ = await _setup_unfolded_project(client)

    # Capture parent snapshot
    parent_before = (await client.get(f"/api/projects/{project_id}")).json()["data"]
    bible_before = (await client.get(f"/api/projects/{project_id}/unfolded")).json()["data"]

    cands_res = await client.get(f"/api/projects/{project_id}/counterfactual/candidates")
    target_cand = cands_res.json()["data"][0]

    # Fork timeline
    fork_res = await client.post(
        f"/api/projects/{project_id}/counterfactual/fork",
        json={"candidate_id": target_cand["id"]},
    )
    assert fork_res.status_code == 200

    # Verify parent project is unchanged
    parent_after = (await client.get(f"/api/projects/{project_id}")).json()["data"]
    assert parent_after["selected_world_id"] == chosen_id
    assert parent_after["branch_name"] == "main"
    assert parent_after["status"] == parent_before["status"]
    assert parent_after["counterfactual_metadata_json"] is None

    # Verify parent universe canon is untouched
    bible_after = (await client.get(f"/api/projects/{project_id}/unfolded")).json()["data"]
    assert bible_after["world_bible"]["physics_rules"] == bible_before["world_bible"]["physics_rules"]
    assert len(bible_after["characters"]) == len(bible_before["characters"])
    assert len(bible_after["scenes"]) == len(bible_before["scenes"])


@pytest.mark.asyncio
async def test_branch_name_collision_safety(client: httpx.AsyncClient):
    """Verifies automatic collision avoidance for counterfactual branch names."""
    project_id, _, _ = await _setup_unfolded_project(client)

    cands_res = await client.get(f"/api/projects/{project_id}/counterfactual/candidates")
    target_cand = cands_res.json()["data"][0]

    # Fork once with explicit name
    res1 = await client.post(
        f"/api/projects/{project_id}/counterfactual/fork",
        json={"candidate_id": target_cand["id"], "branch_name": "counterfactual/col-test"},
    )
    assert res1.status_code == 200
    assert res1.json()["data"]["branch_name"] == "counterfactual/col-test"

    # Fork second time with the exact same name
    res2 = await client.post(
        f"/api/projects/{project_id}/counterfactual/fork",
        json={"candidate_id": target_cand["id"], "branch_name": "counterfactual/col-test"},
    )
    assert res2.status_code == 200
    # Must append collision suffix (-2)
    assert res2.json()["data"]["branch_name"] == "counterfactual/col-test-2"


@pytest.mark.asyncio
async def test_counterfactual_api_error_handling(client: httpx.AsyncClient):
    """Verifies proper HTTP error codes for invalid project and candidate IDs."""
    # Non-existent project
    res_fake_proj = await client.get("/api/projects/fake-project-999/counterfactual/candidates")
    assert res_fake_proj.status_code == 404

    project_id, _, _ = await _setup_unfolded_project(client)

    # Non-existent candidate delta
    res_fake_cand = await client.get(f"/api/projects/{project_id}/counterfactual/delta/fake-cand-999")
    assert res_fake_cand.status_code == 404

    # Non-existent candidate fork
    res_fake_fork = await client.post(
        f"/api/projects/{project_id}/counterfactual/fork",
        json={"candidate_id": "fake-cand-999"},
    )
    assert res_fake_fork.status_code == 404
