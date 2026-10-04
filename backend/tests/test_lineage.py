import httpx
import pytest


@pytest.mark.asyncio
async def test_lineage_initial_project(client: httpx.AsyncClient):
    """Verify DAG for brand new project contains only root_seed node and no edges."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Initial Lineage Test",
            "seed_text": "A clockmaker finds a gear that turns backward.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    res_data = lineage_res.json()["data"]

    assert res_data["project_id"] == project_id
    assert res_data["root_node_id"] == "node-seed"
    assert len(res_data["nodes"]) == 1
    assert len(res_data["edges"]) == 0

    root_node = res_data["nodes"][0]
    assert root_node["id"] == "node-seed"
    assert root_node["entity_type"] == "root_seed"
    assert root_node["summary"] == "A clockmaker finds a gear that turns backward."
    assert root_node["stage"] == 1


@pytest.mark.asyncio
async def test_lineage_with_dna(client: httpx.AsyncClient):
    """Verify DAG extends to include node-dna after Seed DNA extraction."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "DNA Lineage Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]

    # Extract DNA
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    res_data = lineage_res.json()["data"]

    assert len(res_data["nodes"]) == 2
    assert len(res_data["edges"]) == 1

    node_ids = {n["id"] for n in res_data["nodes"]}
    assert "node-seed" in node_ids
    assert "node-dna" in node_ids

    edge = res_data["edges"][0]
    assert edge["source"] == "node-seed"
    assert edge["target"] == "node-dna"
    assert edge["relation_type"] == "derived_from"


@pytest.mark.asyncio
async def test_lineage_with_worlds(client: httpx.AsyncClient):
    """Verify DAG extends to include 3 world candidate nodes connected to node-dna."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Worlds Lineage Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    await client.post(f"/api/projects/{project_id}/worlds/generate")

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    res_data = lineage_res.json()["data"]

    # 1 seed + 1 dna + 3 worlds = 5 nodes
    assert len(res_data["nodes"]) == 5
    # 1 seed->dna + 3 dna->world = 4 edges
    assert len(res_data["edges"]) == 4

    world_nodes = [n for n in res_data["nodes"] if n["entity_type"] == "world_candidate"]
    assert len(world_nodes) == 3
    for wn in world_nodes:
        assert wn["parent_ids"] == ["node-dna"]
        assert wn["stage"] == 3


@pytest.mark.asyncio
async def test_lineage_with_selection(client: httpx.AsyncClient):
    """Verify DAG includes human_selection node connected with selected_by edge and rationale."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Selection Lineage Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidates = gen_res.json()["data"]
    bio_city = next(c for c in candidates if "Bio-City" in c["title"])

    # Select with explicit rationale
    test_rationale = "Deep organic symbiosis and ecological wonder."
    await client.post(
        f"/api/projects/{project_id}/worlds/{bio_city['id']}/select",
        json={"user_rationale": test_rationale},
    )

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    res_data = lineage_res.json()["data"]

    # 5 previous + 1 selection node = 6 nodes
    assert len(res_data["nodes"]) == 6
    selection_node = next(n for n in res_data["nodes"] if n["id"] == "node-selection")
    assert selection_node["entity_type"] == "human_selection"
    assert selection_node["parent_ids"] == [f"node-world-{bio_city['id']}"]
    assert test_rationale in selection_node["causal_explanation"]

    # Check edge from chosen world to selection
    sel_edge = next(e for e in res_data["edges"] if e["target"] == "node-selection")
    assert sel_edge["source"] == f"node-world-{bio_city['id']}"
    assert sel_edge["relation_type"] == "selected_by"


@pytest.mark.asyncio
async def test_lineage_with_unfolded_universe(client: httpx.AsyncClient):
    """Verify full DAG contains all 5 stages and all unfolded entities (bible, locations, chars, rels, scenes)."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Full Universe Lineage Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    bio_city = next(c for c in gen_res.json()["data"] if "Bio-City" in c["title"])
    await client.post(
        f"/api/projects/{project_id}/worlds/{bio_city['id']}/select",
        json={"user_rationale": "Organic ecology"},
    )
    # Unfold universe
    unfold_res = await client.post(f"/api/projects/{project_id}/unfold")
    assert unfold_res.status_code == 200

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    res_data = lineage_res.json()["data"]

    node_types = {n["entity_type"] for n in res_data["nodes"]}
    assert "root_seed" in node_types
    assert "seed_dna" in node_types
    assert "world_candidate" in node_types
    assert "human_selection" in node_types
    assert "world_bible" in node_types
    assert "key_location" in node_types
    assert "character" in node_types
    assert "relationship" in node_types
    assert "scene" in node_types

    # Verify deterministic location node IDs and metadata
    loc_nodes = [n for n in res_data["nodes"] if n["entity_type"] == "key_location"]
    assert len(loc_nodes) >= 2
    for idx, ln in enumerate(loc_nodes):
        assert ln["id"] == f"node-loc-{idx}"
        assert ln["metadata"]["location_index"] == idx

    # Verify relationship node character names resolved without relying on db columns
    rel_nodes = [n for n in res_data["nodes"] if n["entity_type"] == "relationship"]
    assert len(rel_nodes) >= 1
    for rn in rel_nodes:
        assert "↔" in rn["label"]
        assert len(rn["parent_ids"]) == 2


@pytest.mark.asyncio
async def test_relation_types_coverage(client: httpx.AsyncClient):
    """Verify all required relation types are present in the full project DAG (TRAC-01)."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Relation Types Coverage Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    bio_city = next(c for c in gen_res.json()["data"] if "Bio-City" in c["title"])
    await client.post(f"/api/projects/{project_id}/worlds/{bio_city['id']}/select", json={})
    await client.post(f"/api/projects/{project_id}/unfold")

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    res_data = lineage_res.json()["data"]
    edge_relations = {e["relation_type"] for e in res_data["edges"]}

    assert "derived_from" in edge_relations
    assert "selected_by" in edge_relations
    assert "constrained_by" in edge_relations
    assert "appears_in" in edge_relations
    assert "generated_for" in edge_relations


@pytest.mark.asyncio
async def test_ancestor_path_traversal(client: httpx.AsyncClient):
    """Verify get_node_ancestors traverses back to root_seed in chronological order (TRAC-02)."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Ancestor Traversal Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    bio_city = next(c for c in gen_res.json()["data"] if "Bio-City" in c["title"])
    await client.post(f"/api/projects/{project_id}/worlds/{bio_city['id']}/select", json={})
    await client.post(f"/api/projects/{project_id}/unfold")

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    res_data = lineage_res.json()["data"]

    # Pick a character node
    char_node = next(n for n in res_data["nodes"] if n["entity_type"] == "character")

    # Traverse ancestors
    ancestor_res = await client.get(f"/api/projects/{project_id}/lineage/node/{char_node['id']}/ancestors")
    assert ancestor_res.status_code == 200
    anc_data = ancestor_res.json()["data"]

    anc_ids = [n["id"] for n in anc_data["ancestor_nodes"]]
    # Must start with node-seed and end with char_node['id']
    assert anc_ids[0] == "node-seed"
    assert "node-dna" in anc_ids
    assert f"node-world-{bio_city['id']}" in anc_ids
    assert "node-selection" in anc_ids
    assert "node-bible" in anc_ids
    assert anc_ids[-1] == char_node["id"]
    assert "Root Seed" in anc_data["summary_explanation"]


@pytest.mark.asyncio
async def test_no_cot_leakage(client: httpx.AsyncClient):
    """Verify causal explanations contain natural language prose with zero raw CoT tokens (TRAC-03)."""
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Zero CoT Leakage Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    bio_city = next(c for c in gen_res.json()["data"] if "Bio-City" in c["title"])
    await client.post(
        f"/api/projects/{project_id}/worlds/{bio_city['id']}/select",
        json={"user_rationale": "Focus on living coral structures."},
    )
    await client.post(f"/api/projects/{project_id}/unfold")

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    res_data = lineage_res.json()["data"]

    forbidden_tokens = [
        "<thought>",
        "</thought>",
        "thinking_process",
        "system prompt",
        "assistant:",
        "user:",
        "```json",
        "chain-of-thought",
    ]

    for node in res_data["nodes"]:
        explanation = node["causal_explanation"].lower()
        assert len(explanation) > 10, f"Node {node['id']} has empty explanation"
        for token in forbidden_tokens:
            assert token not in explanation, f"Forbidden CoT token '{token}' found in node {node['id']}"
