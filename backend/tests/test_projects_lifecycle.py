import httpx
import pytest


@pytest.mark.asyncio
async def test_project_lifecycle_soft_delete_and_restore(client: httpx.AsyncClient):
    """Test full cycle: create active projects, soft delete to graveyard, list active/graveyard, restore."""
    # 1. Create Project A and Project B
    res_a = await client.post(
        "/api/projects",
        json={"title": "Project Alpha", "seed_text": "Seed Alpha in the stars."},
    )
    assert res_a.status_code == 201
    proj_a = res_a.json()["data"]
    id_a = proj_a["id"]
    assert proj_a["deleted_at"] is None

    res_b = await client.post(
        "/api/projects",
        json={"title": "Project Beta", "seed_text": "Seed Beta underwater."},
    )
    assert res_b.status_code == 201
    proj_b = res_b.json()["data"]
    id_b = proj_b["id"]
    assert proj_b["deleted_at"] is None

    # 2. List active projects -> Both Alpha and Beta present
    list_active = await client.get("/api/projects")
    assert list_active.status_code == 200
    active_ids = [p["id"] for p in list_active.json()["data"]]
    assert id_a in active_ids
    assert id_b in active_ids

    # 3. List graveyard -> neither is in graveyard
    list_grave = await client.get("/api/projects/graveyard")
    assert list_grave.status_code == 200
    grave_ids = [p["id"] for p in list_grave.json()["data"]]
    assert id_a not in grave_ids
    assert id_b not in grave_ids

    # 4. Soft delete Project A
    del_res = await client.delete(f"/api/projects/{id_a}")
    assert del_res.status_code == 200
    del_data = del_res.json()["data"]
    assert del_data["id"] == id_a
    assert del_data["deleted_at"] is not None

    # 5. List active projects -> Only Project B is active (Isolation verified)
    list_active2 = await client.get("/api/projects")
    assert list_active2.status_code == 200
    active_ids2 = [p["id"] for p in list_active2.json()["data"]]
    assert id_a not in active_ids2
    assert id_b in active_ids2

    # 6. List graveyard -> Project A appears in graveyard
    list_grave2 = await client.get("/api/projects/graveyard")
    assert list_grave2.status_code == 200
    grave_ids2 = [p["id"] for p in list_grave2.json()["data"]]
    assert id_a in grave_ids2
    assert id_b not in grave_ids2

    # Also test query parameter ?archived=true
    list_grave_param = await client.get("/api/projects?archived=true")
    assert list_grave_param.status_code == 200
    assert id_a in [p["id"] for p in list_grave_param.json()["data"]]

    # Also test query parameter ?include_deleted=true
    list_all = await client.get("/api/projects?include_deleted=true")
    assert list_all.status_code == 200
    all_ids = [p["id"] for p in list_all.json()["data"]]
    assert id_a in all_ids
    assert id_b in all_ids

    # 7. Restore Project A
    restore_res = await client.post(f"/api/projects/{id_a}/restore")
    assert restore_res.status_code == 200
    restored_data = restore_res.json()["data"]
    assert restored_data["id"] == id_a
    assert restored_data["deleted_at"] is None
    assert restored_data["seed_text"] == "Seed Alpha in the stars."

    # 8. List active projects -> Both Project A and Project B are active again
    list_active3 = await client.get("/api/projects")
    assert list_active3.status_code == 200
    active_ids3 = [p["id"] for p in list_active3.json()["data"]]
    assert id_a in active_ids3
    assert id_b in active_ids3

    # Graveyard is free of Project A
    list_grave3 = await client.get("/api/projects/graveyard")
    assert id_a not in [p["id"] for p in list_grave3.json()["data"]]


@pytest.mark.asyncio
async def test_project_permanent_delete(client: httpx.AsyncClient):
    """Test permanent deletion of a project and its related data."""
    # Create project
    res = await client.post(
        "/api/projects",
        json={"title": "To Be Destroyed", "seed_text": "Ephemeral project."},
    )
    assert res.status_code == 201
    proj_id = res.json()["data"]["id"]

    # Permanent delete
    perm_res = await client.delete(f"/api/projects/{proj_id}/permanent")
    assert perm_res.status_code == 200
    assert perm_res.json()["data"]["deleted"] is True

    # Check project no longer exists
    get_res = await client.get(f"/api/projects/{proj_id}")
    assert get_res.status_code == 404

    # 404 when attempting to delete non-existent project
    not_found_res = await client.delete(f"/api/projects/{proj_id}/permanent")
    assert not_found_res.status_code == 404
