import json
import pytest
import httpx
from sqlmodel import select

from backend.app.models.dna import SeedDNARecord
from backend.app.models.memory import CreativeMemoryRecord
from backend.app.models.persistence import CharacterRefineRequest, SceneRefineRequest
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
from backend.app.services.context_service import ContextConstructionService
from backend.app.services.consistency_validator import ConsistencyValidator
from backend.app.services.persistence_service import PersistenceService
from backend.app.providers.storage import LocalStorageProvider
from backend.app.services.lineage_service import LineageService


def make_candidate(
    project_id: str,
    title: str,
    concept: str,
    seed_dna_id: str = "dna-1",
    batch_id: str = "b-1",
) -> WorldCandidateRecord:
    return WorldCandidateRecord(
        project_id=project_id,
        seed_dna_id=seed_dna_id,
        batch_id=batch_id,
        candidate_index=0,
        title=title,
        archetype="Familiar / Grounded",
        concept=concept,
        aesthetic="Atmospheric realism",
        core_tension="Survival and exploration",
        trade_offs="Focus on world depth",
        key_visual="Vivid horizon",
    )


@pytest.mark.asyncio
async def test_world_bible_update_syncs_memory():
    """Requirement 1: Updating an authoritative World Bible rule updates the corresponding canonical memory."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Memory Test Project", seed_text="A deep sea kingdom")
        session.add(project)
        await session.commit()
        await session.refresh(project)

        # Create candidate and world bible
        cand = make_candidate(project.id, "Aquatic Citadel", "Sunken fortress")
        session.add(cand)
        await session.commit()
        await session.refresh(cand)

        project.selected_world_id = cand.id
        session.add(project)

        bible = WorldBibleRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            geography="Deep abyssal plains",
            physics_rules="Bioluminescence powers all technology",
            canon_facts_json=json.dumps(["Rule 1: Surface light never penetrates", "Rule 2: Pressure suits are mandatory"]),
            history_timeline_json=json.dumps([{"era": "Epoch 1", "event": "The Descent"}]),
            factions_json="[]",
            key_locations_json="[]",
            visual_style_prompt="Deep cyan bioluminescence",
        )
        session.add(bible)
        await session.commit()
        await session.refresh(bible)

        # 1. Sync memory initial
        mem = await repo.sync_creative_memory_from_universe(project.id)
        assert mem is not None
        rules_initial = json.loads(mem.canon_rules_json)
        assert any("Bioluminescence powers all technology" in r.get("rule", "") for r in rules_initial)
        initial_version = mem.version

        # 2. Update World Bible rule via authoritative update
        updated_bible = await repo.update_world_bible(
            project.id,
            {"physics_rules": "Hydrothermal vent kinetic turbines power all technology"},
        )
        assert updated_bible is not None

        # 3. Verify memory automatically updated
        mem_updated = await repo.get_creative_memory(project.id)
        assert mem_updated is not None
        assert mem_updated.version > initial_version
        rules_after = json.loads(mem_updated.canon_rules_json)
        assert any("Hydrothermal vent kinetic turbines" in r.get("rule", "") for r in rules_after)
        assert not any("Bioluminescence powers all technology" in r.get("rule", "") for r in rules_after)


@pytest.mark.asyncio
async def test_creator_locks_remain_authoritative():
    """Requirement 2: Creator locks remain authoritative and cannot be silently overwritten."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Lock Test Project", seed_text="Silent monastery")
        session.add(project)
        await session.commit()
        await session.refresh(project)

        # Create candidate & selection with locked Human-Only Zone
        cand = make_candidate(project.id, "Cloistered Spire", "Monks guarding an astronomical secret")
        session.add(cand)
        await session.commit()

        hoz = HumanOnlyZones(
            core_theme="Preserving truth at personal cost",
            protagonist_motivation="Protect the celestial archives from desecration",
            central_conflict="Inquisitors demand the archives be burned",
            is_locked=True,
        )
        selection = WorldSelectionRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            batch_id="b-1",
            user_rationale="Focus on quiet ethical tension",
            human_only_zones_json=json.dumps(hoz.model_dump()),
            rejected_directions_json=json.dumps(["no magic", "hard sci-fi only"]),
        )
        session.add(selection)
        await session.commit()

        # Add protagonist character
        protagonist = CharacterRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            name="Brother Kaelen",
            role="Head Archivist",
            archetype="Devoted Scholar",
            motivation="Protect the celestial archives from desecration",
            core_conflict="Fear of the Inquisition",
            visual_prompt="Monk in weathered robes holding ancient astrolabe",
            origin_type="HUMAN_DECISION",
        )
        session.add(protagonist)
        await session.commit()
        await session.refresh(protagonist)

        # Sync creative memory
        mem = await repo.sync_creative_memory_from_universe(project.id)
        assert mem is not None
        creator_locks = json.loads(mem.creator_locks_json)
        assert creator_locks["is_locked"] is True
        assert creator_locks["protagonist_motivation"] == "Protect the celestial archives from desecration"

        # Persistence service refinement attempt with violating motivation
        storage = LocalStorageProvider()
        lineage = LineageService(repo)
        persistence = PersistenceService(repo, storage, lineage)

        # Attempt to overwrite locked motivation with contradicting intent
        with pytest.raises(ValueError) as excinfo:
            await persistence.refine_character(
                project_id=project.id,
                char_id=protagonist.id,
                req=CharacterRefineRequest(
                    motivation="Betray the archives and sell the star maps to the highest bidder",
                    revision_notes="Test rogue motivation",
                ),
            )
        assert "Creator Lock Violation" in str(excinfo.value)

        # Verify original record untouched
        refreshed_char = await repo.get_character(protagonist.id)
        assert refreshed_char.motivation == "Protect the celestial archives from desecration"


@pytest.mark.asyncio
async def test_relevant_memory_included_in_context():
    """Requirement 3: Relevant memory is included in character and scene generation prompts."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Context Test Project", seed_text="Sunken city")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "Ocean Deep", "Sunken trench")
        session.add(cand)
        await session.commit()

        bible = WorldBibleRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            geography="Deep trench with hydrothermal towers",
            physics_rules="Atmospheric pressure requires kinetic pressure suits",
            canon_facts_json=json.dumps(["Sulfur vents provide electrical grid power"]),
            history_timeline_json=json.dumps([{"era": "The Fracture", "event": "Ocean floor split"}]),
            factions_json="[]",
            key_locations_json="[]",
            visual_style_prompt="Dark moody bioluminescent realism",
        )
        session.add(bible)

        char = CharacterRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            name="Captain Mira",
            role="Submersible Commander",
            archetype="Hardened Veteran",
            motivation="Chart the abyssal trench before the storm hits",
            core_conflict="Lingering trauma from deep dive catastrophe",
            visual_prompt="Weathered naval commander in titanium diving suit",
        )
        session.add(char)
        await session.commit()
        await session.refresh(char)

        await repo.sync_creative_memory_from_universe(project.id)

        context_service = ContextConstructionService(repo)

        # Test character context
        char_ctx = await context_service.build_character_context(
            project_id=project.id,
            character_id=char.id,
            character_name="Captain Mira",
        )
        assert "Captain Mira" in char_ctx["context_text"]
        assert "Atmospheric pressure requires kinetic pressure suits" in char_ctx["context_text"]
        assert char_ctx["estimated_tokens"] > 0
        assert char_ctx["estimated_tokens"] <= 1500

        # Test scene context
        scene_ctx = await context_service.build_scene_context(
            project_id=project.id,
            location_setting="Hydrothermal Trench",
            characters_involved=["Captain Mira"],
        )
        assert "Captain Mira" in scene_ctx["context_text"]
        assert "Deep trench with hydrothermal towers" in scene_ctx["context_text"]
        assert "The Fracture" in scene_ctx["context_text"]


@pytest.mark.asyncio
async def test_token_budget_caps_and_excludes_overflow():
    """Requirement 4: Irrelevant context or overflow is excluded when the context budget is reached."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Budget Test Project", seed_text="Metropolis")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "Spire City", "Vertical civilization")
        session.add(cand)
        await session.commit()

        # Add 10 characters to exceed a small budget
        for i in range(10):
            session.add(CharacterRecord(
                project_id=project.id,
                world_candidate_id=cand.id,
                name=f"Citizen {i}",
                role=f"Role {i}",
                archetype=f"Archetype {i}",
                motivation=f"Motivation for citizen number {i} with a detailed long narrative backstory describing their lineage",
                core_conflict=f"Conflict for citizen {i}",
                visual_prompt="Photorealistic portrait",
            ))
        await session.commit()

        await repo.sync_creative_memory_from_universe(project.id)

        context_service = ContextConstructionService(repo)

        # Request with very tight budget of 120 tokens
        tight_ctx = await context_service.build_generation_context(
            project_id=project.id,
            operation_type="character",
            budget_tokens=120,
        )

        assert tight_ctx["estimated_tokens"] <= 120
        assert tight_ctx["excluded_count"] > 0
        # Not all 10 citizens can fit within 120 tokens
        text = tight_ctx["context_text"]
        assert not all(f"Citizen {i}" in text for i in range(10))


@pytest.mark.asyncio
async def test_consistency_validator_rejects_negative_constraints():
    """Requirement 5: Explicit hard-rule contradictions are rejected or flagged before persistence."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Negative Constraint Project", seed_text="Deep ocean station")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "Station Delta", "Hard sci-fi research facility")
        session.add(cand)
        await session.commit()

        selection = WorldSelectionRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            batch_id="b-1",
            rejected_directions_json=json.dumps(["no magic", "hard sci-fi only"]),
        )
        session.add(selection)

        char = CharacterRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            name="Engineer Chen",
            role="Systems Engineer",
            archetype="Pragmatic Builder",
            motivation="Keep station reactors running",
            core_conflict="Component failure",
            visual_prompt="Engineer in coveralls",
        )
        session.add(char)
        await session.commit()
        await session.refresh(char)

        await repo.sync_creative_memory_from_universe(project.id)

        storage = LocalStorageProvider()
        lineage = LineageService(repo)
        persistence = PersistenceService(repo, storage, lineage)

        # Attempt to introduce magic into a "no magic" world
        with pytest.raises(ValueError) as excinfo:
            await persistence.refine_character(
                project_id=project.id,
                char_id=char.id,
                req=CharacterRefineRequest(
                    motivation="Cast ancient magic spells to enchant the station reactor",
                    revision_notes="Adding wizardry",
                ),
            )
        assert "negative constraint" in str(excinfo.value).lower()
        assert "forbidden" in str(excinfo.value).lower() or "violation" in str(excinfo.value).lower()


@pytest.mark.asyncio
async def test_character_and_relationship_memory_retrieval():
    """Requirement 6: Existing character motivations and relationship facts are available to subsequent generation."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Relationship Test Project", seed_text="Frontier colony")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "Outpost 9", "Desert outpost")
        session.add(cand)
        await session.commit()

        c1 = CharacterRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            name="Sheriff Vance",
            role="Lawkeeper",
            archetype="Stoic Marshall",
            motivation="Maintain fragile peace across the dunes",
            core_conflict="Old debt to smugglers",
            visual_prompt="Dusty trenchcoat and mechanical revolver",
        )
        c2 = CharacterRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            name="Rhea the Scavenger",
            role="Smuggler Leader",
            archetype="Cunning Outlaw",
            motivation="Extract ancient technology buried under the dunes",
            core_conflict="Vance knows her true identity",
            visual_prompt="Goggled scavenger in patchwork cloaks",
        )
        session.add(c1)
        session.add(c2)
        await session.commit()
        await session.refresh(c1)
        await session.refresh(c2)

        rel = CharacterRelationshipRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            source_character_id=c1.id,
            target_character_id=c2.id,
            relation_type="Tense Armistice",
            dynamic_description="Vance once saved Rhea's life, but now hunts her syndicate across the sands.",
        )
        session.add(rel)
        await session.commit()

        # Sync creative memory
        mem = await repo.sync_creative_memory_from_universe(project.id)
        assert mem is not None

        rel_data = json.loads(mem.relationship_matrix_json)
        assert len(rel_data) == 1
        assert rel_data[0]["source_character_name"] == "Sheriff Vance"
        assert rel_data[0]["target_character_name"] == "Rhea the Scavenger"
        assert rel_data[0]["relation_type"] == "Tense Armistice"

        # Context builder incorporates their dynamic
        context_service = ContextConstructionService(repo)
        scene_ctx = await context_service.build_scene_context(
            project_id=project.id,
            characters_involved=["Sheriff Vance", "Rhea the Scavenger"],
        )
        assert "Sheriff Vance" in scene_ctx["context_text"]
        assert "Rhea the Scavenger" in scene_ctx["context_text"]
        assert "Tense Armistice" in scene_ctx["context_text"]


@pytest.mark.asyncio
async def test_older_projects_lazy_memory_initialization():
    """Requirement 7: Older projects without pre-existing CreativeMemoryRecord initialize safely on demand."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Legacy Project", seed_text="Ancient ruins")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "Timeless Bastion", "Ancient stone citadel", seed_dna_id="dna-legacy", batch_id="b-legacy")
        session.add(cand)
        await session.commit()

        project.selected_world_id = cand.id
        session.add(project)

        bible = WorldBibleRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            geography="High stone mesas",
            physics_rules="Wind currents defy conventional gravity",
            canon_facts_json=json.dumps(["The bastion has stood for 10,000 years"]),
            history_timeline_json=json.dumps([{"era": "First Age", "event": "Construction"}]),
            factions_json="[]",
            key_locations_json="[]",
            visual_style_prompt="Ancient monolithic stone architecture",
        )
        session.add(bible)
        await session.commit()

        # Ensure NO CreativeMemoryRecord exists yet
        existing_mem = await repo.get_creative_memory(project.id)
        assert existing_mem is None

        # Call lazy initialization via get_or_create_creative_memory
        mem = await repo.get_or_create_creative_memory(project.id)
        assert mem is not None
        assert mem.project_id == project.id
        assert mem.version == 1

        rules = json.loads(mem.canon_rules_json)
        assert any("Wind currents defy conventional gravity" in r.get("rule", "") for r in rules)

        # Subsequent call retrieves existing without creating duplicate
        mem2 = await repo.get_or_create_creative_memory(project.id)
        assert mem2.id == mem.id
        assert mem2.version == 1


@pytest.mark.asyncio
async def test_unfold_lifecycle_with_memory_sync(client: httpx.AsyncClient):
    """Requirement 8: Existing universe-generation, media, and lifecycle behavior operates end-to-end with memory sync."""
    # 1. Create project
    create_res = await client.post(
        "/api/projects",
        json={
            "title": "Sentient Bioluminescence Lighthouse",
            "seed_text": "A solitary lighthouse keeper discovers sentient bioluminescence",
        },
    )
    assert create_res.status_code in [200, 201]
    p_data = create_res.json()["data"]
    project_id = p_data["id"]

    # 2. Extract DNA
    dna_res = await client.post(f"/api/projects/{project_id}/dna/extract")
    assert dna_res.status_code == 200

    # 3. Generate Worlds
    gen_res = await client.post(f"/api/projects/{project_id}/worlds/generate")
    assert gen_res.status_code == 200
    candidates = gen_res.json()["data"]
    chosen_candidate = candidates[0]

    # 4. Select World with Human-Only Zone and negative constraint
    hoz_payload = {
        "core_theme": "Isolation breeds connection",
        "protagonist_motivation": "Protect the light tower at all costs",
        "central_conflict": "Winter storm threatens to extinguish the lantern",
        "is_locked": True,
    }
    sel_res = await client.post(
        f"/api/projects/{project_id}/worlds/{chosen_candidate['id']}/select",
        json={
            "user_rationale": "Focus on atmospheric solitary drama",
            "creative_priorities": ["Atmosphere", "Character Depth"],
            "rejected_directions": ["no magic", "hard sci-fi only"],
            "human_only_zones": hoz_payload,
        },
    )
    assert sel_res.status_code == 200

    # 5. Unfold Universe
    unfold_res = await client.post(f"/api/projects/{project_id}/unfold")
    assert unfold_res.status_code == 200

    # 6. Verify Memory Inspection Endpoint
    mem_res = await client.get(f"/api/projects/{project_id}/memory")
    assert mem_res.status_code == 200
    mem_data = mem_res.json()["data"]
    assert mem_data["project_id"] == project_id
    assert mem_data["creator_locks"]["is_locked"] is True
    assert mem_data["creator_locks"]["protagonist_motivation"] == "Protect the light tower at all costs"
    assert "no magic" in mem_data["negative_constraints"]
    assert len(mem_data["character_profiles"]) > 0
    assert len(mem_data["timeline_anchors"]) > 0


@pytest.mark.asyncio
async def test_scene_refinement_enforces_central_conflict_lock():
    """Requirement 9: Scene refinements cannot nullify or violate locked central conflict."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Climax Conflict Project", seed_text="Siege at dawn")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "The Iron Gate", "Siege city")
        session.add(cand)
        await session.commit()

        hoz = HumanOnlyZones(
            central_conflict="The eastern gate wall must withstand the battering ram",
            is_locked=True,
        )
        selection = WorldSelectionRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            batch_id="b-1",
            human_only_zones_json=json.dumps(hoz.model_dump()),
        )
        session.add(selection)

        scene = SceneRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            scene_number=3,
            title="The Iron Ram",
            location_setting="Eastern Gatehouse",
            dramatic_question="Can the garrison hold the breach?",
            conflict_narrative="The battering ram pounds against the timber gate.",
            pivotal_outcome="The gate buckles but holds.",
            visual_prompt="Massive bronze ram striking fortified gate",
        )
        session.add(scene)
        await session.commit()
        await session.refresh(scene)

        await repo.sync_creative_memory_from_universe(project.id)

        storage = LocalStorageProvider()
        lineage = LineageService(repo)
        persistence = PersistenceService(repo, storage, lineage)

        # Attempt to discard conflict with nullifying statement
        with pytest.raises(ValueError) as excinfo:
            await persistence.refine_scene(
                project_id=project.id,
                scene_id=scene.id,
                req=SceneRefineRequest(
                    conflict_narrative="The conflict is completely resolved happily with no tension, everyone went home peacefully.",
                    revision_notes="Nullifying conflict",
                ),
            )
        assert "Creator Lock Violation" in str(excinfo.value)
        assert "central conflict is locked" in str(excinfo.value).lower()


@pytest.mark.asyncio
async def test_visual_prompt_synthesis_context_generation():
    """Requirement 10: Visual prompt synthesis context incorporates visual style and character visual anchors."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Visual Synthesis Project", seed_text="Neon cyberpunk harbor")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "Neon Basin", "Cybernetic docklands")
        session.add(cand)
        await session.commit()

        bible = WorldBibleRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            geography="Rain-slicked container docks and neon canals",
            physics_rules="High-density electromagnetic fog disrupts optics",
            canon_facts_json=json.dumps(["Dock lanterns burn with chemical green flames"]),
            history_timeline_json="[]",
            factions_json="[]",
            key_locations_json="[]",
            visual_style_prompt="Syd Mead inspired cinematic neo-noir with deep amber and cyan shadows",
        )
        session.add(bible)

        char = CharacterRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            name="Pilot Jax",
            role="Tugboat Navigator",
            archetype="Reluctant Smuggler",
            motivation="Deliver cargo before dawn curfew",
            core_conflict="Damaged navigational sensor",
            visual_prompt="Cyborg pilot with optical HUD monocular visor and oil-stained slicker jacket",
        )
        session.add(char)
        await session.commit()

        await repo.sync_creative_memory_from_universe(project.id)

        context_service = ContextConstructionService(repo)
        visual_ctx = await context_service.build_visual_prompt_context(
            project_id=project.id,
            entity_name="Pilot Jax",
            budget_tokens=1500,
        )

        assert visual_ctx["estimated_tokens"] > 0
        assert visual_ctx["estimated_tokens"] <= 1500
        text = visual_ctx["context_text"]
        assert "Pilot Jax" in text
        assert "Cyborg pilot with optical HUD" in text
        assert "High-density electromagnetic fog" in text


@pytest.mark.asyncio
async def test_unfold_generation_rejects_negative_constraint_violation():
    """Acceptance Review 1: Newly generated universe candidate is checked against hard negative constraints before persistence."""
    from unittest.mock import AsyncMock, patch
    from backend.app.routers.unfold import generate_unfold_task
    from backend.app.models.job import GenerationJob

    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Strict Hard Sci-Fi Station", seed_text="Orbital mining facility in asteroid belt")
        session.add(project)
        await session.commit()
        await session.refresh(project)

        cand = make_candidate(project.id, "Station Aegis", "Asteroid belt drilling habitat")
        session.add(cand)
        await session.commit()
        await session.refresh(cand)

        # Creator selects world with strict negative constraint: 'no magic' and 'hard sci-fi only'
        selection = WorldSelectionRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            batch_id="b-1",
            rejected_directions_json=json.dumps(["no magic", "hard sci-fi only"]),
            user_rationale="Keep completely grounded in realistic orbital physics",
        )
        session.add(selection)
        project.selected_world_id = cand.id
        project.status = "unfolding"
        session.add(project)

        job = GenerationJob(
            project_id=project.id,
            job_type="universe_unfold",
            status="queued",
            progress=0,
        )
        session.add(job)
        await session.commit()
        await session.refresh(selection)
        await session.refresh(job)

        # Sync creative memory so negative constraints are active
        await repo.sync_creative_memory_from_universe(project.id)

        # Mock AI provider returning candidate universe that introduces forbidden magic
        violating_payload = {
            "world_bible": {
                "geography": "Hollowed-out asteroid cavern with pressurized domes",
                "physics_rules": "Ancient sorcery and mana crystals power the asteroid gravity field",
                "history_timeline": [{"era": "First Casting", "event": "Wizards chanted spells to split the rock"}],
                "factions": [{"name": "Order of the Star Spell", "role": "Mages", "agenda": "Spread sorcery"}],
                "canon_facts": ["Magic incantations bypass vacuum seals"],
                "key_locations": [{"name": "Sanctum of Spells", "description": "Arcane chamber", "visual_prompt": "Glowing runes"}],
                "visual_style_prompt": "Mystical crystal cavern with glowing occult glyphs",
            },
            "characters": [
                {
                    "name": "Archmage Varek",
                    "role": "Chief Sorcerer",
                    "archetype": "Astral Wizard",
                    "motivation": "Channel cosmic magic to unlock ancient portals",
                    "core_conflict": "Mana depletion",
                    "visual_prompt": "Robed wizard holding glowing staff in asteroid cavern",
                }
            ],
            "relationships": [],
            "scenes": [
                {
                    "scene_number": 1,
                    "title": "The First Incantation",
                    "location_setting": "Sanctum of Spells",
                    "dramatic_question": "Can Varek cast the spell in time?",
                    "conflict_narrative": "Varek channels forbidden magic spells into the crystalline core.",
                    "pivotal_outcome": "The spell destabilizes the asteroid.",
                    "visual_prompt": "Wizard conjuring energy vortex inside asteroid",
                }
            ],
        }

        mock_provider = AsyncMock()
        mock_provider.unfold_universe.return_value = violating_payload

        with patch("backend.app.routers.unfold.get_ai_provider", return_value=mock_provider):
            await generate_unfold_task(
                job_id=job.id,
                project_id=project.id,
                context={"seed": project.seed_text, "raw_seed": project.seed_text},
                active_selection_id=selection.id,
                candidate_id=cand.id,
            )

        # 1. Verify job was marked as failed with CONSISTENCY_VIOLATION
        await session.refresh(job)
        assert job.status == "failed"
        assert job.error_code == "CONSISTENCY_VIOLATION"
        assert "negative constraint" in (job.error_message or "").lower()
        assert "forbidden" in (job.error_message or "").lower() or "violation" in (job.error_message or "").lower()

        # 2. Verify project status was cleanly reset to 'world_selected' for safe creator retry
        await session.refresh(project)
        assert project.status == "world_selected"

        # 3. Verify NO universe records were persisted to DB
        persisted_unfold = await repo.get_unfolded_universe(project.id)
        assert persisted_unfold is None


@pytest.mark.asyncio
async def test_unfold_candidate_structured_validation():
    """Acceptance Review 1: Deterministic validation rejects malformed structured candidates with explicit reasons."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        validator = ConsistencyValidator(repo)
        project = Project(title="Structure Test Project", seed_text="Deep cave system")
        session.add(project)
        await session.commit()

        # 1. Missing world_bible
        bad_cand_1 = {"characters": [{"name": "Miner"}], "scenes": [{"scene_number": 1}]}
        res1 = await validator.validate_universe_candidate(project.id, bad_cand_1)
        assert not res1.is_valid
        assert any("missing or invalid 'world_bible'" in v.lower() for v in res1.hard_violations)

        # 2. Empty characters list
        bad_cand_2 = {
            "world_bible": {"geography": "Deep tunnels", "physics_rules": "Low friction stone"},
            "characters": [],
            "scenes": [{"scene_number": 1}],
        }
        res2 = await validator.validate_universe_candidate(project.id, bad_cand_2)
        assert not res2.is_valid
        assert any("at least one character" in v.lower() for v in res2.hard_violations)

        # 3. Empty scenes list
        bad_cand_3 = {
            "world_bible": {"geography": "Deep tunnels", "physics_rules": "Low friction stone"},
            "characters": [{"name": "Miner Sam"}],
            "scenes": [],
        }
        res3 = await validator.validate_universe_candidate(project.id, bad_cand_3)
        assert not res3.is_valid
        assert any("at least one narrative scene" in v.lower() for v in res3.hard_violations)


@pytest.mark.asyncio
async def test_context_builder_preserves_creator_locks_with_unusually_long_rules():
    """Acceptance Review 2: Creator locks are never discarded on overflow, and token estimation heuristic is documented."""
    async with async_session() as session:
        repo = ProjectRepository(session)
        project = Project(title="Long Rules Test Project", seed_text="Grand planetary empire")
        session.add(project)
        await session.commit()

        cand = make_candidate(project.id, "Imperial Capital", "Sprawling planetary city")
        session.add(cand)
        await session.commit()

        # Create unusually long creator lock (approx 600 characters)
        long_motivation = (
            "Ensure the constitutional transition of the solar council without triggering a civil war between "
            "the planetary guilds, preserving the centuries-old treaty of the outer moons at all personal cost "
            "even when faced with assassination attempts by extremist factions who seek total martial control."
        ) * 2

        hoz = HumanOnlyZones(
            core_theme="Preserving democratic federation in a decaying interstellar empire",
            protagonist_motivation=long_motivation,
            central_conflict="Planetary council faction maneuvers to dissolve the senate and seize planetary weapons",
            is_locked=True,
        )

        selection = WorldSelectionRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            batch_id="b-1",
            human_only_zones_json=json.dumps(hoz.model_dump()),
            rejected_directions_json=json.dumps(["no faster-than-light communication", "no time manipulation"]),
        )
        session.add(selection)

        # Create an unusually long canon rule in World Bible (approx 1,200 characters)
        very_long_rule = (
            "Hyper-dense gravitational distortion prevents any wireless communications across planetary hemispheres, "
            "requiring physical couriers to carry encrypted neural capsules through subterranean magnetic railways "
            "monitored by regional customs syndicates with strict authorization protocols."
        ) * 4

        bible = WorldBibleRecord(
            project_id=project.id,
            world_candidate_id=cand.id,
            geography="Dense planetary metropolis spanning seven continents with interconnected mag-rail tubes",
            physics_rules=very_long_rule,
            canon_facts_json=json.dumps(["Couriers are sworn to silence on pain of exile"]),
            history_timeline_json=json.dumps([{"era": "The Concordat", "event": "Treaty signed"}]),
            factions_json="[]",
            key_locations_json="[]",
            visual_style_prompt="Sleek brutalist monumental architecture with vast assembly plazas",
        )
        session.add(bible)
        await session.commit()

        await repo.sync_creative_memory_from_universe(project.id)

        context_service = ContextConstructionService(repo)

        # Request with a tight budget (350 tokens) where long rules + locks exceed the budget
        ctx = await context_service.build_generation_context(
            project_id=project.id,
            operation_type="character",
            budget_tokens=350,
        )

        # 1. Verify creator locks are NEVER discarded on overflow
        assert "creator_locks" in ctx["included_sections"]
        assert "negative_constraints" in ctx["included_sections"]
        assert long_motivation in ctx["context_text"]
        assert "no faster-than-light communication" in ctx["context_text"]

        # 2. Verify token estimation method is reported
        assert ctx["token_estimation_method"] == "character_heuristic_approx_4_chars_per_token"

        # 3. Verify ceiling behavior: world rules are cleanly handled (partial or truncated) without throwing
        assert ctx["estimated_tokens"] > 0
        assert ctx["estimated_tokens"] <= ContextConstructionService.HARD_CEILING_TOKENS


