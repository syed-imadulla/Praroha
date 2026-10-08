import httpx
import pytest


async def _setup_unfolded_project(client: httpx.AsyncClient) -> str:
    """Helper to bootstrap a project all the way to unfolded universe stage 5."""
    # 1. Create project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Solaris Archive",
            "seed_text": "An ancient archive orbiting a dead star preserves forbidden memories.",
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
            "user_rationale": "Orbiting observatory fits the philosophical tone.",
        },
    )
    assert sel_res.status_code == 200

    # 5. Unfold Universe
    unfold_res = await client.post(f"/api/projects/{project_id}/unfold", json={})
    assert unfold_res.status_code == 200

    return project_id


@pytest.mark.asyncio
async def test_character_and_scene_refinement_audit(client: httpx.AsyncClient):
    """Verify PERS-01: Component refinement creates immutable audit snapshots and increments version."""
    project_id = await _setup_unfolded_project(client)

    # Fetch unfolded universe to get character and scene IDs
    unfold_res = await client.get(f"/api/projects/{project_id}/unfolded")
    assert unfold_res.status_code == 200
    universe = unfold_res.json()["data"]

    character = universe["characters"][0]
    scene = universe["scenes"][0]
    char_id = character["id"]
    scene_id = scene["id"]

    assert character["version"] == 1
    assert scene["version"] == 1

    # 1. Refine Character
    char_refine_res = await client.patch(
        f"/api/projects/{project_id}/characters/{char_id}/refine",
        json={
            "motivation": "Recover the lost star ledger to exonerate their ancestors.",
            "core_conflict": "Torn between personal atonement and cosmic safety.",
            "revision_notes": "Deepened motivation from generic survival to ancestral atonement.",
        },
    )
    assert char_refine_res.status_code == 200
    refined_char = char_refine_res.json()["data"]
    assert refined_char["version"] == 2
    assert refined_char["motivation"] == "Recover the lost star ledger to exonerate their ancestors."
    assert refined_char["revision_notes"] == "Deepened motivation from generic survival to ancestral atonement."

    # 2. Refine Scene
    scene_refine_res = await client.patch(
        f"/api/projects/{project_id}/scenes/{scene_id}/refine",
        json={
            "dramatic_question": "Can the archivist decrypt the forbidden core before solar flare strikes?",
            "pivotal_outcome": "The core is unlocked, releasing an echo from the dying star.",
            "revision_notes": "Increased dramatic stakes by tying decryption directly to the solar storm.",
        },
    )
    assert scene_refine_res.status_code == 200
    refined_scene = scene_refine_res.json()["data"]
    assert refined_scene["version"] == 2
    assert refined_scene["pivotal_outcome"] == "The core is unlocked, releasing an echo from the dying star."
    assert refined_scene["revision_notes"] == "Increased dramatic stakes by tying decryption directly to the solar storm."

    # 3. Verify Revisions Audit Log
    revs_res = await client.get(f"/api/projects/{project_id}/revisions")
    assert revs_res.status_code == 200
    revisions = revs_res.json()["data"]
    assert len(revisions) >= 4  # 2 for character (before & after), 2 for scene (before & after)

    char_revs = [r for r in revisions if r["entity_id"] == char_id]
    assert len(char_revs) == 2
    versions = {r["version"] for r in char_revs}
    assert 1 in versions
    assert 2 in versions


@pytest.mark.asyncio
async def test_lineage_version_chaining(client: httpx.AsyncClient):
    """Verify D-02: Lineage DAG incorporates explicit version chaining (v1 -> refined_from -> v2)."""
    project_id = await _setup_unfolded_project(client)

    unfold_res = await client.get(f"/api/projects/{project_id}/unfolded")
    universe = unfold_res.json()["data"]
    char_id = universe["characters"][0]["id"]
    scene_id = universe["scenes"][0]["id"]

    # Refine character and scene to create v2
    await client.patch(
        f"/api/projects/{project_id}/characters/{char_id}/refine",
        json={
            "motivation": "A revised personal quest for knowledge.",
            "revision_notes": "Sharpened arc.",
        },
    )
    await client.patch(
        f"/api/projects/{project_id}/scenes/{scene_id}/refine",
        json={
            "dramatic_question": "Will they escape the archive intact?",
            "revision_notes": "Added escape urgency.",
        },
    )

    lineage_res = await client.get(f"/api/projects/{project_id}/lineage")
    assert lineage_res.status_code == 200
    dag = lineage_res.json()["data"]

    node_ids = {n["id"] for n in dag["nodes"]}
    # Verify historical v1 revision nodes exist
    assert f"node-char-{char_id}-v1" in node_ids
    assert f"node-char-{char_id}" in node_ids
    assert f"node-scene-{scene_id}-v1" in node_ids
    assert f"node-scene-{scene_id}" in node_ids

    # Verify refined_from edge connects v1 to latest
    refined_edges = [e for e in dag["edges"] if e["relation_type"] == "refined_from"]
    assert len(refined_edges) >= 2

    char_refined_edge = next(
        e for e in refined_edges if e["source"] == f"node-char-{char_id}-v1" and e["target"] == f"node-char-{char_id}"
    )
    assert char_refined_edge["label"] == "Creator Refinement"

    scene_refined_edge = next(
        e for e in refined_edges if e["source"] == f"node-scene-{scene_id}-v1" and e["target"] == f"node-scene-{scene_id}"
    )
    assert scene_refined_edge["label"] == "Creator Refinement"


@pytest.mark.asyncio
async def test_timeline_branching_strict_id_remapping(client: httpx.AsyncClient):
    """Verify PERS-02: Timeline branching strictly isolates child project with complete ID remapping."""
    project_id = await _setup_unfolded_project(client)

    # Get parent entities
    parent_unfold = (await client.get(f"/api/projects/{project_id}/unfolded")).json()["data"]
    parent_worlds = (await client.get(f"/api/projects/{project_id}/worlds")).json()["data"]
    parent_cand_ids = {w["id"] for w in parent_worlds}
    parent_char_ids = {c["id"] for c in parent_unfold["characters"]}
    parent_scene_ids = {s["id"] for s in parent_unfold["scenes"]}

    # Create Branch
    branch_res = await client.post(
        f"/api/projects/{project_id}/branch",
        json={
            "branch_name": "solar-rebellion",
            "branch_point_stage": 5,
            "rationale": "Explore what happens if the solar flare breaches the station.",
        },
    )
    assert branch_res.status_code == 200
    child_project = branch_res.json()["data"]
    child_id = child_project["id"]

    assert child_id != project_id
    assert child_project["parent_project_id"] == project_id
    assert child_project["branch_name"] == "solar-rebellion"

    # Verify Branches list
    branches_res = await client.get(f"/api/projects/{project_id}/branches")
    assert branches_res.status_code == 200
    branch_list = branches_res.json()["data"]
    branch_names = {b["branch_name"] for b in branch_list}
    assert "main" in branch_names
    assert "solar-rebellion" in branch_names

    # Verify Child Candidates: brand new IDs, zero parent ID leakage
    child_worlds = (await client.get(f"/api/projects/{child_id}/worlds")).json()["data"]
    child_cand_ids = {w["id"] for w in child_worlds}
    assert len(child_cand_ids) == len(parent_cand_ids)
    assert child_cand_ids.isdisjoint(parent_cand_ids)  # Completely separate set of IDs!

    # Verify Child Selection
    child_sel_res = await client.get(f"/api/projects/{child_id}/selection")
    assert child_sel_res.status_code == 200
    child_sel = child_sel_res.json()["data"]
    assert child_sel["world_candidate_id"] in child_cand_ids
    assert child_sel["world_candidate_id"] not in parent_cand_ids

    # Verify Child Unfold: Characters, Relationships, Scenes
    child_unfold = (await client.get(f"/api/projects/{child_id}/unfolded")).json()["data"]
    child_char_ids = {c["id"] for c in child_unfold["characters"]}
    child_scene_ids = {s["id"] for s in child_unfold["scenes"]}

    assert child_char_ids.isdisjoint(parent_char_ids)
    assert child_scene_ids.isdisjoint(parent_scene_ids)

    # Verify Child Relationships reference CHILD character IDs
    for rel in child_unfold["relationships"]:
        assert rel["source_character_id"] in child_char_ids
        assert rel["target_character_id"] in child_char_ids
        assert rel["source_character_id"] not in parent_char_ids
        assert rel["target_character_id"] not in parent_char_ids


@pytest.mark.asyncio
async def test_bundle_export_and_import_with_lineage(client: httpx.AsyncClient):
    """Verify PERS-03: Complete project bundle export (with lineage) and roundtrip import."""
    project_id = await _setup_unfolded_project(client)

    # 1. Export Bundle
    bundle_res = await client.get(f"/api/projects/{project_id}/bundle")
    assert bundle_res.status_code == 200
    bundle_data = bundle_res.json()["data"]

    assert bundle_data["format_version"] == "1.0"
    assert bundle_data["project"]["id"] == project_id
    assert bundle_data["seed_dna"] is not None
    assert len(bundle_data["world_candidates"]) == 3
    assert bundle_data["world_selection"] is not None
    assert bundle_data["unfolded_universe"] is not None
    # Crucial D-03: Complete ProjectBundle includes synthesized lineage DAG
    assert bundle_data["lineage"] is not None
    assert len(bundle_data["lineage"]["nodes"]) >= 6

    # 2. Import Bundle
    import_res = await client.post("/api/projects/import", json=bundle_data)
    assert import_res.status_code == 200
    imported_proj = import_res.json()["data"]
    imported_id = imported_proj["id"]

    assert imported_id != project_id
    assert "(Imported)" in imported_proj["title"]

    # Verify imported project has working unfolded universe
    imp_unfold_res = await client.get(f"/api/projects/{imported_id}/unfolded")
    assert imp_unfold_res.status_code == 200
    imp_unfold = imp_unfold_res.json()["data"]
    assert len(imp_unfold["characters"]) == len(bundle_data["unfolded_universe"]["characters"])


@pytest.mark.asyncio
async def test_storage_snapshots_persistence(client: httpx.AsyncClient):
    """Verify PERS-03: Storage snapshots via StorageProvider.upload."""
    project_id = await _setup_unfolded_project(client)

    # Create Snapshot
    snap_res = await client.post(f"/api/projects/{project_id}/snapshots")
    assert snap_res.status_code == 200
    snap = snap_res.json()["data"]

    assert snap["project_id"] == project_id
    assert snap["storage_key"].startswith("/uploads/snapshots/")
    assert snap["size_bytes"] > 0

    # List Snapshots
    list_res = await client.get(f"/api/projects/{project_id}/snapshots")
    assert list_res.status_code == 200
    snapshots = list_res.json()["data"]
    assert len(snapshots) >= 1
    assert snapshots[0]["id"] == snap["id"]
