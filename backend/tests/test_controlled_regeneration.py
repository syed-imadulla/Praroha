import json
import pytest
import httpx
from sqlmodel import select

from backend.app.models.dependency import (
    ImpactPreviewRequest,
    SelectiveRegenerateRequest,
)
from backend.app.models.memory import CreativeMemoryRecord
from backend.app.models.persistence import EntityRevisionRecord
from backend.app.models.project import Project
from backend.app.models.selection import HumanOnlyZones, WorldSelectionRecord
from backend.app.models.unfold import (
    CharacterRecord,
    CharacterRelationshipRecord,
    SceneRecord,
    WorldBibleRecord,
)
from backend.app.models.world import WorldCandidateRecord
from backend.app.repositories.project_repo import ProjectRepository, async_session


async def _create_test_universe(
    session,
    project_title: str = "Deep Abyssal Expanse",
) -> dict:
    """Helper to populate an unfolded universe with Bible, Characters, Scenes, and Creative Memory."""
    project = Project(
        title=project_title,
        seed_text="A deep sea civilization in dark trenches",
        owner_id="test-default-user",
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)

    cand = WorldCandidateRecord(
        project_id=project.id,
        seed_dna_id="dna-test",
        batch_id="batch-1",
        candidate_index=0,
        title="Trench Civilization",
        archetype="Atmospheric Sub-Oceanic",
        concept="Civilization beneath the crushing abyss",
        aesthetic="Bioluminescent architecture",
        core_tension="Pressure containment vs expanding reach",
        trade_offs="Extreme environmental hazard",
        key_visual="Glowing geothermal vents",
    )
    session.add(cand)
    await session.commit()
    await session.refresh(cand)

    project.selected_world_id = cand.id
    session.add(project)

    hoz = HumanOnlyZones(
        protagonist_motivation="Rescue the lost thermal core at all costs",
        central_conflict="Deep trench pressure threatens the settlement",
        core_theme="Preservation of light",
        is_locked=True,
    )
    sel = WorldSelectionRecord(
        project_id=project.id,
        world_candidate_id=cand.id,
        batch_id=cand.batch_id,
        human_only_zones_json=hoz.model_dump_json(),
    )
    session.add(sel)

    bible = WorldBibleRecord(
        project_id=project.id,
        world_candidate_id=cand.id,
        geography="Sub-oceanic abyssal rift extending thousands of leagues",
        physics_rules="Bioluminescence powers ambient lighting and fluid pressure requires specialized submersibles",
        canon_facts_json=json.dumps([
            "Rule 1: Surface light never reaches the rift floor",
            "Rule 2: Trench pressure crushes unreinforced hulls",
        ]),
        history_timeline_json=json.dumps([{"era": "Epoch 1", "event": "The Great Submersion"}]),
        factions_json="[]",
        key_locations_json="[]",
        visual_style_prompt="Underwater bioluminescent rift",
        version=1,
    )
    session.add(bible)

    # Character 1: Directly tied to ocean exploration & pressure
    char_a = CharacterRecord(
        project_id=project.id,
        world_candidate_id=cand.id,
        name="Captain Nereus",
        role="Trench Navigator",
        archetype="Explorer",
        motivation="Rescue the lost thermal core at all costs",  # Matches HOZ
        core_conflict="Pressure sickness from deep ocean diving",
        visual_prompt="Weathered diving suit with amber visor",
        origin_type="HUMAN_DECISION",
        origin_source="Human-Only Zone: Inviolable protagonist trait",
        version=1,
        is_locked=True,
    )
    session.add(char_a)

    # Character 2: Independent court philosopher (unaffected by ocean physics)
    char_b = CharacterRecord(
        project_id=project.id,
        world_candidate_id=cand.id,
        name="Archivist Vaelen",
        role="Keeper of Ancient Scrolls",
        archetype="Scholar",
        motivation="Decipher dynastic inheritance genealogies",
        core_conflict="Ethical dilemmas in record keeping",
        visual_prompt="Robes woven with luminescent fibers",
        origin_type="AI_INTRODUCED",
        origin_source="Generative Genesis",
        version=1,
        is_locked=False,
    )
    session.add(char_b)

    # Scene 1: Dependent directly on water physics and pressure
    scene_1 = SceneRecord(
        project_id=project.id,
        world_candidate_id=cand.id,
        scene_number=1,
        title="Descent into the Mariana Rift",
        location_setting="Pressurized trench airlock beneath oceanic abyss",
        characters_involved_json=json.dumps(["Captain Nereus"]),
        dramatic_question="Can the submersible withstand sudden water pressure surges?",
        conflict_narrative="Water pressure threatens to breach the hull as oxygen tanks freeze",
        pivotal_outcome="The crew seals the hatch just before the bulkhead buckles",
        visual_prompt="Murky water churning outside reinforced glass",
        origin_type="AI_INTRODUCED",
        origin_source="World Unfold Synthesis",
        version=1,
        is_locked=False,
    )
    session.add(scene_1)

    # Scene 2: Independent chamber dialogue (court politics)
    scene_2 = SceneRecord(
        project_id=project.id,
        world_candidate_id=cand.id,
        scene_number=2,
        title="Council of the Archivists",
        location_setting="Sealed archive rotunda with dry air filtration",
        characters_involved_json=json.dumps(["Archivist Vaelen"]),
        dramatic_question="Will Vaelen reveal the suppressed dynastic treaty?",
        conflict_narrative="A philosophical argument over preserving historical truth vs public harmony",
        pivotal_outcome="Vaelen secretly copies the ledger before the meeting concludes",
        visual_prompt="Candlelight illuminating dust motes and ancient parchments",
        origin_type="AI_INTRODUCED",
        origin_source="World Unfold Synthesis",
        version=1,
        is_locked=False,
    )
    session.add(scene_2)

    # Creative Memory Record
    memory = CreativeMemoryRecord(
        project_id=project.id,
        world_candidate_id=cand.id,
        canon_rules_json=json.dumps([
            {"rule": "Trench pressure requires specialized submersibles", "category": "physics", "is_hard_rule": True}
        ]),
        character_profiles_json="[]",
        relationship_matrix_json="[]",
        timeline_anchors_json="[]",
        creator_locks_json=hoz.model_dump_json(),
        version=1,
    )
    session.add(memory)

    await session.commit()
    await session.refresh(bible)
    await session.refresh(char_a)
    await session.refresh(char_b)
    await session.refresh(scene_1)
    await session.refresh(scene_2)
    await session.refresh(memory)

    return {
        "project": project,
        "candidate": cand,
        "bible": bible,
        "char_a": char_a,
        "char_b": char_b,
        "scene_1": scene_1,
        "scene_2": scene_2,
        "memory": memory,
    }


@pytest.mark.asyncio
async def test_criterion_1_world_bible_change_identifies_dependent_scenes_affected(client: httpx.AsyncClient):
    """Criterion 1: Changing a World Bible physical law identifies dependent scenes as affected."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id

    payload = {
        "upstream_entity_type": "world_bible",
        "upstream_entity_id": bible_id,
        "proposed_change": {
            "physics_rules": "Water breathing is impossible without mechanical gills and high oceanic pressure instantly crushes submersibles"
        },
        "change_summary": "Update ocean pressure and water breathing constraints",
    }

    resp = await client.post(f"/api/projects/{pid}/lineage/impact-preview", json=payload)
    assert resp.status_code == 200
    res_data = resp.json()["data"]

    affected_scene_ids = [n["entity_id"] for n in res_data["affected_nodes"] if n["entity_type"] == "scene"]
    assert data["scene_1"].id in affected_scene_ids
    # Verify causal rationale
    scene_1_node = next(n for n in res_data["affected_nodes"] if n["entity_id"] == data["scene_1"].id)
    assert "modified physical rule" in scene_1_node["reason"]
    assert scene_1_node["link_type"] == "CANON_RULE"
    assert scene_1_node["confidence"] >= 0.9


@pytest.mark.asyncio
async def test_criterion_2_independent_character_backstories_remain_preserved(client: httpx.AsyncClient):
    """Criterion 2: Independent character backstories remain preserved."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id

    payload = {
        "upstream_entity_type": "world_bible",
        "upstream_entity_id": bible_id,
        "proposed_change": {
            "physics_rules": "Water breathing is impossible without mechanical gills"
        },
    }

    resp = await client.post(f"/api/projects/{pid}/lineage/impact-preview", json=payload)
    assert resp.status_code == 200
    res_data = resp.json()["data"]

    preserved_char_ids = [n["entity_id"] for n in res_data["preserved_nodes"] if n["entity_type"] == "character"]
    # Character B is independent court archivist
    assert data["char_b"].id in preserved_char_ids
    char_b_node = next(n for n in res_data["preserved_nodes"] if n["entity_id"] == data["char_b"].id)
    assert "independently" in char_b_node["reason"]
    assert char_b_node["classification"] == "PRESERVED"

    # Scene 2 (court dialogue) is also preserved
    preserved_scene_ids = [n["entity_id"] for n in res_data["preserved_nodes"] if n["entity_type"] == "scene"]
    assert data["scene_2"].id in preserved_scene_ids


@pytest.mark.asyncio
async def test_criterion_3_locked_entities_cannot_regenerate_without_unlock_confirmation(client: httpx.AsyncClient):
    """Criterion 3: Locked entities cannot be regenerated without the required explicit unlock confirmation."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id
        locked_char_id = data["char_a"].id

    # 1. Attempt regeneration selecting locked character without force_unlock
    payload_blocked = {
        "upstream_entity_type": "world_bible",
        "upstream_entity_id": bible_id,
        "proposed_change": {"physics_rules": "Underwater volcanic pressure increases tenfold"},
        "selected_entity_ids": [locked_char_id],
        "force_unlock_entity_ids": [],
    }

    resp_blocked = await client.post(f"/api/projects/{pid}/lineage/regenerate-selective", json=payload_blocked)
    assert resp_blocked.status_code == 403
    err_msg = resp_blocked.json().get("error", {}).get("message") or resp_blocked.json().get("detail", "")
    assert "protected by creator lock" in err_msg

    # 2. When explicitly confirming unlock in force_unlock_entity_ids, it succeeds
    payload_unlocked = {
        "upstream_entity_type": "world_bible",
        "upstream_entity_id": bible_id,
        "proposed_change": {"physics_rules": "Underwater volcanic pressure increases tenfold"},
        "selected_entity_ids": [locked_char_id],
        "force_unlock_entity_ids": [locked_char_id],
        "change_summary": "Deliberate creator modification of protagonist",
    }
    resp_ok = await client.post(f"/api/projects/{pid}/lineage/regenerate-selective", json=payload_unlocked)
    assert resp_ok.status_code == 200
    assert resp_ok.json()["success"] is True


@pytest.mark.asyncio
async def test_criterion_4_preview_cancellation_leaves_database_state_unchanged(client: httpx.AsyncClient):
    """Criterion 4: Preview cancellation leaves database state unchanged."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id
        orig_physics = data["bible"].physics_rules
        orig_version = data["bible"].version

    # Run impact preview multiple times
    for _ in range(3):
        resp = await client.post(
            f"/api/projects/{pid}/lineage/impact-preview",
            json={
                "upstream_entity_type": "world_bible",
                "upstream_entity_id": bible_id,
                "proposed_change": {"physics_rules": "DRASTIC OVERHAUL: All water replaced by acid"},
            },
        )
        assert resp.status_code == 200

    # User cancels preview (no call to regenerate-selective)
    # Check DB state directly
    async with async_session() as session:
        repo = ProjectRepository(session)
        current_bible = await repo.get_latest_world_bible(pid)
        assert current_bible.physics_rules == orig_physics
        assert current_bible.version == orig_version

        # No spurious entity revisions created
        rev_stmt = select(EntityRevisionRecord).where(EntityRevisionRecord.project_id == pid)
        revs = list((await session.execute(rev_stmt)).scalars().all())
        assert len(revs) == 0


@pytest.mark.asyncio
async def test_criterion_5_selective_regeneration_leaves_untouched_entities_unchanged(client: httpx.AsyncClient):
    """Criterion 5: Selective regeneration leaves untouched entities unchanged."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id
        scene_1_id = data["scene_1"].id
        scene_2_id = data["scene_2"].id
        char_b_id = data["char_b"].id
        orig_scene_2_title = data["scene_2"].title
        orig_scene_2_conflict = data["scene_2"].conflict_narrative

    # Selectively regenerate ONLY Scene 1
    resp = await client.post(
        f"/api/projects/{pid}/lineage/regenerate-selective",
        json={
            "upstream_entity_type": "world_bible",
            "upstream_entity_id": bible_id,
            "proposed_change": {
                "physics_rules": "Water breathing is impossible without mechanical gills"
            },
            "selected_entity_ids": [scene_1_id],
            "change_summary": "Update ocean rules and regenerate Scene 1",
        },
    )
    assert resp.status_code == 200, resp.text

    # Verify Untouched Scene 2 and Character B
    async with async_session() as session:
        repo = ProjectRepository(session)
        s2 = await repo.get_scene(scene_2_id)
        assert s2.version == 1
        assert s2.title == orig_scene_2_title
        assert s2.conflict_narrative == orig_scene_2_conflict

        cb = await repo.get_character(char_b_id)
        assert cb.version == 1
        assert cb.name == "Archivist Vaelen"


@pytest.mark.asyncio
async def test_criterion_6_regenerated_records_retain_accurate_edges_revisions_and_provenance(client: httpx.AsyncClient):
    """Criterion 6: Regenerated records retain accurate parent edges, revision numbers, and provenance."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id
        scene_1_id = data["scene_1"].id

    resp = await client.post(
        f"/api/projects/{pid}/lineage/regenerate-selective",
        json={
            "upstream_entity_type": "world_bible",
            "upstream_entity_id": bible_id,
            "proposed_change": {
                "physics_rules": "Underwater navigation requires mechanical gills and thermal shielding"
            },
            "selected_entity_ids": [scene_1_id],
            "change_summary": "Evolve diving technology",
        },
    )
    assert resp.status_code == 200
    res_data = resp.json()["data"]

    # Check regenerated entities in response
    assert len(res_data["regenerated_entities"]) == 1
    assert res_data["regenerated_entities"][0]["new_version"] == 2
    assert "Regenerated from upstream world_bible" in res_data["regenerated_entities"][0]["provenance"]

    # Verify revision snapshots archived
    assert len(res_data["revisions_created"]) >= 2  # World bible snapshot + Scene 1 snapshot

    # Verify Lineage DAG reflects accurate edges
    lineage_resp = await client.get(f"/api/projects/{pid}/lineage")
    assert lineage_resp.status_code == 200
    graph = lineage_resp.json()["data"]

    # Find scene 1 node in lineage graph
    scene_node = next(n for n in graph["nodes"] if n.get("entity_id") == scene_1_id or n["id"] == f"node-scene-{scene_1_id}")
    assert scene_node["entity_type"] == "scene"
    assert "Regenerated" in (scene_node.get("provenance") or scene_node.get("causal_explanation") or "")


@pytest.mark.asyncio
async def test_criterion_7_missing_or_ambiguous_dependency_reported_honestly(client: httpx.AsyncClient):
    """Criterion 7: Missing or ambiguous dependency data is reported honestly."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id

    # Propose high-level premise shift with exploratory/unanchored terms
    resp = await client.post(
        f"/api/projects/{pid}/lineage/impact-preview",
        json={
            "upstream_entity_type": "seed_dna",
            "upstream_entity_id": "dna-test",
            "proposed_change": {"premise": "A metaphysical dream realm where physics is subjective"},
            "change_summary": "Radical thematic shift",
        },
    )
    assert resp.status_code == 200
    res_data = resp.json()["data"]

    assert res_data["has_ambiguous_provenance"] is True
    assert len(res_data["ambiguity_warnings"]) > 0
    assert any("Conservative impact assessment" in w for w in res_data["ambiguity_warnings"])

    # Characters receive HEURISTIC_AMBIGUOUS link type with lower confidence
    for node in res_data["conditional_nodes"]:
        if node["entity_type"] == "character":
            assert node["link_type"] == "HEURISTIC_AMBIGUOUS"
            assert node["confidence"] <= 0.5


@pytest.mark.asyncio
async def test_criterion_8_unauthorized_cross_project_entity_ids_rejected(client: httpx.AsyncClient):
    """Criterion 8: Unauthorized or cross-project entity IDs are rejected."""
    async with async_session() as session:
        univ1 = await _create_test_universe(session, "Universe A")
        univ2 = await _create_test_universe(session, "Universe B")
        pid1 = univ1["project"].id
        bible1_id = univ1["bible"].id
        alien_scene_id = univ2["scene_1"].id

    # Attempt to regenerate an entity from Universe B inside Universe A
    resp = await client.post(
        f"/api/projects/{pid1}/lineage/regenerate-selective",
        json={
            "upstream_entity_type": "world_bible",
            "upstream_entity_id": bible1_id,
            "proposed_change": {"physics_rules": "Valid update"},
            "selected_entity_ids": [alien_scene_id],
        },
    )
    assert resp.status_code == 400
    err_msg = resp.json().get("error", {}).get("message") or resp.json().get("detail", "")
    assert "does not belong to project" in err_msg


@pytest.mark.asyncio
async def test_criterion_9_concurrent_edits_do_not_silently_overwrite_newer_revisions(client: httpx.AsyncClient):
    """Criterion 9: Concurrent edits do not silently overwrite newer approved revisions."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id
        scene_1_id = data["scene_1"].id

    # First regeneration brings Scene 1 to version 2
    resp1 = await client.post(
        f"/api/projects/{pid}/lineage/regenerate-selective",
        json={
            "upstream_entity_type": "world_bible",
            "upstream_entity_id": bible_id,
            "proposed_change": {"physics_rules": "Version 1 update"},
            "selected_entity_ids": [scene_1_id],
        },
    )
    assert resp1.status_code == 200

    # A concurrent client attempts an update expecting version 1
    resp_conflict = await client.post(
        f"/api/projects/{pid}/lineage/regenerate-selective",
        json={
            "upstream_entity_type": "world_bible",
            "upstream_entity_id": bible_id,
            "proposed_change": {"physics_rules": "Conflicting parallel edit"},
            "selected_entity_ids": [scene_1_id],
            "expected_versions": {scene_1_id: 1},  # Stale version expectation!
        },
    )
    assert resp_conflict.status_code == 400
    err_msg = resp_conflict.json().get("error", {}).get("message") or resp_conflict.json().get("detail", "")
    assert "Optimistic concurrency conflict" in err_msg


@pytest.mark.asyncio
async def test_criterion_10_creative_memory_syncs_and_media_safety(client: httpx.AsyncClient):
    """Criterion 10: Creative Memory synchronizes and media protection remains intact."""
    async with async_session() as session:
        data = await _create_test_universe(session)
        pid = data["project"].id
        bible_id = data["bible"].id
        scene_1_id = data["scene_1"].id

    resp = await client.post(
        f"/api/projects/{pid}/lineage/regenerate-selective",
        json={
            "upstream_entity_type": "world_bible",
            "upstream_entity_id": bible_id,
            "proposed_change": {
                "physics_rules": "All kinetic machinery emits green bioluminescent radiation"
            },
            "selected_entity_ids": [scene_1_id],
            "change_summary": "Radiation canon update",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["updated_creative_memory_version"] == 2

    # Verify CreativeMemory in database
    async with async_session() as session:
        mem_stmt = select(CreativeMemoryRecord).where(CreativeMemoryRecord.project_id == pid)
        mem = (await session.execute(mem_stmt)).scalars().first()
        assert mem.version == 2
        rules = json.loads(mem.canon_rules_json)
        assert any("green bioluminescent radiation" in r.get("rule", "") for r in rules)
