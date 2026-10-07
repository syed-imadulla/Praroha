import pytest
import httpx
from sqlmodel import select

from backend.app.models.lineage import TraceGraphRead, TraceNode
from backend.app.models.unfold import (
    CharacterBase,
    CharacterRead,
    CharacterRecord,
    LocationItem,
    SceneBase,
    SceneRead,
    SceneRecord,
)
from backend.app.repositories import project_repo
from backend.app.repositories.project_repo import ProjectRepository
from backend.app.services.lineage_service import LineageService


@pytest.mark.asyncio
async def test_entity_models_origin_defaults_and_serialization():
    """ORIG-01: Verify entity models default origin_type and accept explicit origins."""
    # 1. LocationItem
    loc = LocationItem(
        name="The Sunken Spire",
        description="A massive glowing spire.",
        visual_prompt="Spire in the abyss",
    )
    assert loc.origin_type == "DERIVED"
    assert loc.origin_source is None

    loc_custom = LocationItem(
        name="The Bioluminescent Spire",
        description="A living spire.",
        visual_prompt="Glowing coral",
        origin_type="HUMAN_DECISION",
        origin_source="Custom Directive: Enzyme bio-physics",
    )
    assert loc_custom.origin_type == "HUMAN_DECISION"
    assert loc_custom.origin_source == "Custom Directive: Enzyme bio-physics"

    # 2. CharacterBase & CharacterRead
    char = CharacterRead(
        id="c1",
        project_id="p1",
        world_candidate_id="w1",
        name="Dr. Althea Thorne",
        role="Chief Symbiologist",
        archetype="Visionary Scientist",
        motivation="Decipher coral sentience",
        core_conflict="Reef assimilation",
        visual_prompt="Scientist in dive suit",
        created_at="2026-01-01T00:00:00Z",
    )
    assert char.origin_type == "AI_INTRODUCED"
    assert char.origin_source is None

    char_explicit = CharacterRead(
        id="c2",
        project_id="p1",
        world_candidate_id="w1",
        name="Kaelen",
        role="Scavenger",
        archetype="Pragmatic Scavenger",
        motivation="Find lost sub",
        core_conflict="Distrusts coral",
        visual_prompt="Young diver",
        origin_type="SEED_EXPLICIT",
        origin_source="Seed Anchor: Child Protagonist",
        created_at="2026-01-01T00:00:00Z",
    )
    assert char_explicit.origin_type == "SEED_EXPLICIT"
    assert char_explicit.origin_source == "Seed Anchor: Child Protagonist"

    # 3. SceneBase & SceneRead
    scene = SceneRead(
        id="s1",
        project_id="p1",
        world_candidate_id="w1",
        scene_number=1,
        title="Awakening",
        location_setting="Atrium",
        characters_involved=["Dr. Althea Thorne"],
        dramatic_question="Will she survive?",
        conflict_narrative="Overload",
        pivotal_outcome="Sync",
        visual_prompt="Glowing chamber",
        created_at="2026-01-01T00:00:00Z",
    )
    assert scene.origin_type == "AI_INTRODUCED"
    assert scene.origin_source is None


@pytest.mark.asyncio
async def test_database_schema_migration_backward_compatibility():
    """ORIG-01: Verify repository handles backward compatibility and column migrations cleanly."""
    async with project_repo.async_session() as session:
        repo = ProjectRepository(session)

        # Create dummy project
        from backend.app.models.project import ProjectCreate
        project = await repo.create_project(ProjectCreate(title="Test Project", seed_text="deep sea exploration station"))
        assert project.id is not None

        # Save legacy-style character record without explicit origin
        legacy_char = CharacterRecord(
            project_id=project.id,
            world_candidate_id="world-dummy",
            name="Legacy Explorer",
            role="Navigator",
            archetype="Pioneer",
            motivation="Explore unknown depths",
            core_conflict="Low oxygen",
            visual_prompt="Explorer portrait",
        )
        session.add(legacy_char)
        await session.commit()
        await session.refresh(legacy_char)

        assert legacy_char.origin_type == "AI_INTRODUCED"
        assert legacy_char.origin_source is None

        read_schema = legacy_char.to_read_schema()
        assert read_schema.origin_type == "AI_INTRODUCED"
        assert read_schema.origin_source is None


@pytest.mark.asyncio
async def test_deterministic_explainer_zero_llm_overhead():
    """ORIG-03: Verify plain-language deterministic explainer generator across all 6 origin tiers."""
    # 1. SEED_EXPLICIT
    exp_explicit = LineageService.generate_origin_explanation(
        node_type="character",
        origin_type="SEED_EXPLICIT",
        origin_source="Seed Anchor: Child Protagonist",
        title="Kaelen",
    )
    assert "creator's original seed premise" in exp_explicit
    assert "Child Protagonist" in exp_explicit

    # 2. SEED_INFERRED
    exp_inferred = LineageService.generate_origin_explanation(
        node_type="character",
        origin_type="SEED_INFERRED",
        origin_source="Seed Potential: Ancient Symbiotic Technology",
        title="Sentry Unit Nereus",
    )
    assert "Seed Potential possibility" in exp_inferred
    assert "Ancient Symbiotic Technology" in exp_inferred

    # 3. HUMAN_DECISION
    exp_human = LineageService.generate_origin_explanation(
        node_type="character",
        origin_type="HUMAN_DECISION",
        origin_source="Decision DNA: Ecological / Symbiotic Mystery",
        title="Dr. Althea Thorne",
    )
    assert "Stage 4 Decision DNA" in exp_human
    assert "Ecological / Symbiotic Mystery" in exp_human

    # 4. DERIVED
    exp_derived = LineageService.generate_origin_explanation(
        node_type="key_location",
        origin_type="DERIVED",
        origin_source="World Bible: Thermal vent biology",
        title="The Nursery Trench",
    )
    assert "World Bible physics" in exp_derived
    assert "Thermal vent biology" in exp_derived

    # 5. AI_INTRODUCED
    exp_ai = LineageService.generate_origin_explanation(
        node_type="scene",
        origin_type="AI_INTRODUCED",
        origin_source="Generative Synthesis: Narrative Tension",
        title="Scene 2",
    )
    assert "generative narrative synthesis" in exp_ai
    assert "Decision DNA boundaries" in exp_ai

    # 6. USER_ADDED
    exp_user = LineageService.generate_origin_explanation(
        node_type="character",
        origin_type="USER_ADDED",
        origin_source="Creator Refinement v2: Shifted motivation to prioritize survival",
        title="Dr. Althea Thorne",
    )
    assert "iterative refinement" in exp_user
    assert "Creator Refinement v2" in exp_user


@pytest.mark.asyncio
async def test_lineage_graph_returns_populated_origins():
    """ORIG-02: Verify lineage DAG synthesizes origin_type and origin_source on all nodes."""
    async with project_repo.async_session() as session:
        repo = ProjectRepository(session)
        service = LineageService(repo)

        # Create canonical demo project
        demo = await repo.create_canonical_demo_project()
        graph: TraceGraphRead = await service.build_project_lineage(demo.id)

        assert len(graph.nodes) > 0
        node_map = {n.id: n for n in graph.nodes}

        # Verify root seed origin
        seed_node = node_map.get("node-seed")
        assert seed_node is not None
        assert seed_node.origin_type == "SEED_EXPLICIT"
        assert seed_node.origin_source == "Raw Seed Text"

        # Verify seed DNA origin
        dna_node = node_map.get("node-dna")
        assert dna_node is not None
        assert dna_node.origin_type == "SEED_EXPLICIT"

        # Verify candidate origin
        cand_nodes = [n for n in graph.nodes if n.entity_type == "world_candidate"]
        assert len(cand_nodes) == 3
        for cn in cand_nodes:
            assert cn.origin_type == "SEED_INFERRED"

        # Verify human selection origin
        sel_node = node_map.get("node-selection")
        assert sel_node is not None
        assert sel_node.origin_type == "HUMAN_DECISION"

        # Verify world bible origin
        bible_node = node_map.get("node-bible")
        assert bible_node is not None
        assert bible_node.origin_type == "DERIVED"

        # Verify location origins
        loc_nodes = [n for n in graph.nodes if n.entity_type == "key_location"]
        assert len(loc_nodes) >= 2
        for ln in loc_nodes:
            assert ln.origin_type in ["HUMAN_DECISION", "DERIVED"]

        # Verify character origins
        char_nodes = [n for n in graph.nodes if n.entity_type == "character"]
        char_origins = {n.title: n.origin_type for n in char_nodes}
        assert "Dr. Althea Thorne" in char_origins
        assert char_origins["Dr. Althea Thorne"] == "HUMAN_DECISION"
        assert "Sentry Unit Nereus" in char_origins
        assert char_origins["Sentry Unit Nereus"] == "SEED_INFERRED"
        assert "Kaelen" in char_origins
        assert char_origins["Kaelen"] == "SEED_EXPLICIT"

        # Verify scene origins
        scene_nodes = [n for n in graph.nodes if n.entity_type == "scene"]
        scene_origins = {n.metadata.get("scene_number"): n.origin_type for n in scene_nodes}
        assert scene_origins.get(1) == "SEED_EXPLICIT"
        assert scene_origins.get(2) == "AI_INTRODUCED"
        assert scene_origins.get(3) == "HUMAN_DECISION"


@pytest.mark.asyncio
async def test_canonical_demo_seeding_origin_diversity():
    """ORIG-01 / ORIG-02: Verify Canonical Demo hydrates all distinct origin classifications."""
    async with project_repo.async_session() as session:
        repo = ProjectRepository(session)
        service = LineageService(repo)

        demo = await repo.create_canonical_demo_project()
        graph = await service.build_project_lineage(demo.id)

        origin_types_found = {n.origin_type for n in graph.nodes if n.origin_type}
        # Expected in canonical demo: SEED_EXPLICIT, SEED_INFERRED, HUMAN_DECISION, DERIVED, AI_INTRODUCED
        assert "SEED_EXPLICIT" in origin_types_found
        assert "SEED_INFERRED" in origin_types_found
        assert "HUMAN_DECISION" in origin_types_found
        assert "DERIVED" in origin_types_found
        assert "AI_INTRODUCED" in origin_types_found


@pytest.mark.asyncio
async def test_ancestor_path_traversal_preserves_origins():
    """ORIG-02: Ancestor traversal retains origin classifications along the backward trace."""
    async with project_repo.async_session() as session:
        repo = ProjectRepository(session)
        service = LineageService(repo)

        demo = await repo.create_canonical_demo_project()
        graph = await service.build_project_lineage(demo.id)

        # Find Dr. Althea Thorne node
        althea_node = next(n for n in graph.nodes if n.entity_type == "character" and "Althea" in n.title)

        ancestor_path = await service.get_node_ancestors(demo.id, althea_node.id)
        assert len(ancestor_path.ancestor_nodes) >= 4

        # Check root is SEED_EXPLICIT
        root = ancestor_path.ancestor_nodes[0]
        assert root.id == "node-seed"
        assert root.origin_type == "SEED_EXPLICIT"

        # Target node should have its origin intact
        target = next(n for n in ancestor_path.ancestor_nodes if n.id == althea_node.id)
        assert target.origin_type == "HUMAN_DECISION"
