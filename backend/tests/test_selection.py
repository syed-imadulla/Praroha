import httpx
import pytest
from backend.app.models.selection import WorldSelectionCreate, WorldSelectionRecord


def test_selection_schema():
    create_schema = WorldSelectionCreate(user_rationale="Focused on bio-luminescence")
    assert create_schema.user_rationale == "Focused on bio-luminescence"

    empty_schema = WorldSelectionCreate()
    assert empty_schema.user_rationale is None

    record = WorldSelectionRecord(
        project_id="proj-123",
        world_candidate_id="cand-456",
        batch_id="batch-789",
        user_rationale="Personal favorite",
    )
    assert record.project_id == "proj-123"
    assert record.world_candidate_id == "cand-456"
    assert record.batch_id == "batch-789"
    assert record.user_rationale == "Personal favorite"
    assert record.created_at is not None


@pytest.mark.asyncio
async def test_select_world_success(client: httpx.AsyncClient):
    # 1. Create project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Selection Success Test",
            "seed_text": "A child discovers a forgotten city beneath the ocean.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # 2. Extract DNA & Generate Worlds
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res.status_code == 200
    candidates = gen_res.json()["data"]
    target_candidate = candidates[1]  # Candidate 2: Bio-City

    # 3. Select candidate 2
    select_res = await client.post(
        f"/api/projects/{project_id}/worlds/{target_candidate['id']}/select",
        json={},
    )
    assert select_res.status_code == 200
    select_json = select_res.json()
    assert select_json["success"] is True
    data = select_json["data"]
    assert data["world_candidate_id"] == target_candidate["id"]
    assert data["batch_id"] == target_candidate["batch_id"]
    assert data["selected_world"]["id"] == target_candidate["id"]
    assert data["selected_world"]["title"] == target_candidate["title"]

    # 4. Verify project status updated
    proj_res = await client.get(f"/api/projects/{project_id}")
    assert proj_res.status_code == 200
    proj_data = proj_res.json()["data"]
    assert proj_data["status"] == "world_selected"
    assert proj_data["selected_world_id"] == target_candidate["id"]


@pytest.mark.asyncio
async def test_select_candidate_from_older_batch_rejected(client: httpx.AsyncClient):
    """
    Verify locked decision D-01:
    Selecting a candidate from an older generation batch must be rejected with HTTP 400 Bad Request,
    while selecting a candidate from the project's latest batch succeeds.
    """
    # 1. Create project & extract DNA
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Batch Boundary Test",
            "seed_text": "Deep sea researchers encounter sentient crystals on the ocean floor.",
        },
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})

    # 2. Generate Batch 1
    gen_res_1 = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res_1.status_code == 200
    batch_1_candidates = gen_res_1.json()["data"]
    batch_1_cand_id = batch_1_candidates[0]["id"]
    batch_1_id = batch_1_candidates[0]["batch_id"]

    # 3. Re-generate to produce Batch 2
    gen_res_2 = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res_2.status_code == 200
    batch_2_candidates = gen_res_2.json()["data"]
    batch_2_cand_id = batch_2_candidates[0]["id"]
    batch_2_id = batch_2_candidates[0]["batch_id"]

    assert batch_1_id != batch_2_id

    # 4. Attempt to select candidate from older Batch 1 -> Must be rejected with HTTP 400
    older_select_res = await client.post(
        f"/api/projects/{project_id}/worlds/{batch_1_cand_id}/select",
        json={"user_rationale": "Trying to pick from obsolete batch"},
    )
    assert older_select_res.status_code == 400
    err_body = older_select_res.json()
    assert err_body["success"] is False
    assert "older generation batch" in err_body["error"]["message"].lower()

    # Project status should NOT be world_selected yet
    proj_check = await client.get(f"/api/projects/{project_id}")
    assert proj_check.json()["data"]["status"] == "worlds_generated"
    assert proj_check.json()["data"]["selected_world_id"] is None

    # 5. Select candidate from latest Batch 2 -> Must succeed with HTTP 200
    latest_select_res = await client.post(
        f"/api/projects/{project_id}/worlds/{batch_2_cand_id}/select",
        json={"user_rationale": "Selected from current latest batch"},
    )
    assert latest_select_res.status_code == 200
    latest_data = latest_select_res.json()["data"]
    assert latest_data["world_candidate_id"] == batch_2_cand_id
    assert latest_data["batch_id"] == batch_2_id

    # Project status updated to world_selected
    proj_after = await client.get(f"/api/projects/{project_id}")
    assert proj_after.json()["data"]["status"] == "world_selected"
    assert proj_after.json()["data"]["selected_world_id"] == batch_2_cand_id


@pytest.mark.asyncio
async def test_select_world_with_rationale(client: httpx.AsyncClient):
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Rationale Test Project",
            "seed_text": "A lone astronomer decodes cosmic chime frequencies.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidates = gen_res.json()["data"]
    target_id = candidates[0]["id"]

    rationale_text = "Emphasizes acoustic resonance and solitary exploration over conflict."
    select_res = await client.post(
        f"/api/projects/{project_id}/worlds/{target_id}/select",
        json={"user_rationale": rationale_text},
    )
    assert select_res.status_code == 200
    data = select_res.json()["data"]
    assert data["user_rationale"] == rationale_text

    # Verify retrieval preserves rationale
    get_res = await client.get(f"/api/projects/{project_id}/selection")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["user_rationale"] == rationale_text


@pytest.mark.asyncio
async def test_switch_world_selection(client: httpx.AsyncClient):
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Switching Selection Test",
            "seed_text": "Subterranean clockwork city powered by magma currents.",
        },
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidates = gen_res.json()["data"]
    cand_1_id = candidates[0]["id"]
    cand_3_id = candidates[2]["id"]

    # Select Candidate 1
    res1 = await client.post(f"/api/projects/{project_id}/worlds/{cand_1_id}/select", json={})
    assert res1.status_code == 200
    assert res1.json()["data"]["world_candidate_id"] == cand_1_id

    # Switch to Candidate 3
    res2 = await client.post(
        f"/api/projects/{project_id}/worlds/{cand_3_id}/select",
        json={"user_rationale": "Changed direction to Time Capsule clockwork."},
    )
    assert res2.status_code == 200
    assert res2.json()["data"]["world_candidate_id"] == cand_3_id
    assert res2.json()["data"]["user_rationale"] == "Changed direction to Time Capsule clockwork."

    # Verify project state has candidate 3
    proj = await client.get(f"/api/projects/{project_id}")
    assert proj.json()["data"]["selected_world_id"] == cand_3_id


@pytest.mark.asyncio
async def test_select_invalid_candidate(client: httpx.AsyncClient):
    create_res = await client.post(
        "/api/projects",
        json={"title": "Invalid Candidate Test", "seed_text": "Seed test text"},
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    await client.post(f"/api/projects/{project_id}/worlds/generate")

    # Non-existent candidate ID
    res = await client.post(f"/api/projects/{project_id}/worlds/non-existent-candidate-id/select", json={})
    assert res.status_code == 404

    # Non-existent project ID
    res_fake_proj = await client.post("/api/projects/fake-project-id/worlds/non-existent-id/select", json={})
    assert res_fake_proj.status_code == 404


@pytest.mark.asyncio
async def test_get_active_selection_endpoint(client: httpx.AsyncClient):
    create_res = await client.post(
        "/api/projects",
        json={"title": "Active Selection Retrieval Test", "seed_text": "Seed test text"},
    )
    project_id = create_res.json()["data"]["id"]

    # Before selection -> 404
    get_before = await client.get(f"/api/projects/{project_id}/selection")
    assert get_before.status_code == 404

    # Extract DNA & Generate
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    cand_id = gen_res.json()["data"][0]["id"]

    # Select
    await client.post(f"/api/projects/{project_id}/worlds/{cand_id}/select", json={})

    # Retrieve active selection
    get_after = await client.get(f"/api/projects/{project_id}/selection")
    assert get_after.status_code == 200
    data = get_after.json()["data"]
    assert data["world_candidate_id"] == cand_id
    assert data["selected_world"]["id"] == cand_id
    assert "title" in data["selected_world"]


@pytest.mark.asyncio
async def test_cannot_select_world_after_stage5_unfolding_begun(client: httpx.AsyncClient):
    """Verify that once a project enters Stage 5 unfolding, re-selection is rejected with HTTP 400."""
    from backend.app.repositories.project_repo import ProjectRepository, async_session

    create_res = await client.post(
        "/api/projects",
        json={"title": "Stage 5 Immutability Test", "seed_text": "Seed test text"},
    )
    project_id = create_res.json()["data"]["id"]
    await client.post(f"/api/projects/{project_id}/dna/extract", json={})
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    candidates = gen_res.json()["data"]
    cand_1 = candidates[0]["id"]
    cand_2 = candidates[1]["id"]

    # Select Candidate 1
    sel_res = await client.post(f"/api/projects/{project_id}/worlds/{cand_1}/select", json={})
    assert sel_res.status_code == 200

    # Advance project status to 'unfolding' (simulating Stage 5 having begun)
    async with async_session() as session:
        repo = ProjectRepository(session)
        await repo.update_project_status(project_id, "unfolding")

    # Attempt to change selection to Candidate 2 -> Must be rejected with HTTP 400
    switch_res = await client.post(f"/api/projects/{project_id}/worlds/{cand_2}/select", json={})
    assert switch_res.status_code == 400
    assert "locked because stage 5" in switch_res.json()["error"]["message"].lower()

