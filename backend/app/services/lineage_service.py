from typing import Any, Dict, List, Optional, Set
from backend.app.models.lineage import (
    AncestorPathRead,
    TraceEdge,
    TraceGraphRead,
    TraceNode,
)
from backend.app.repositories.project_repo import ProjectRepository


class LineageService:
    """Service that dynamically synthesizes the project causal DAG from relational records (ADR-002)."""

    def __init__(self, repo: ProjectRepository):
        self.repo = repo

    @staticmethod
    def generate_origin_explanation(
        node_type: str,
        origin_type: str,
        origin_source: Optional[str] = None,
        title: Optional[str] = None,
        context_info: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Synthesize plain-language, deterministic causal justification for why an entity exists (ORIG-03).
        Guarantees zero LLM token overhead, zero latency, and zero chain-of-thought leakage.
        """
        source_label = origin_source or "Creative Context"
        title_label = title or "This entity"

        if source_label and "Human-Only Zone" in source_label:
            return (
                f"Locked by the human creator as an inviolable Human-Only Zone before universe expansion. "
                f"Creator lock: '{source_label}'."
            )

        if origin_type == "SEED_EXPLICIT":
            return (
                f"Grounded directly in the creator's original seed premise. "
                f"Direct anchor: '{source_label}'. Serves as an immutable conceptual foundation."
            )
        elif origin_type == "SEED_INFERRED":
            return (
                f"Developed from an accepted Seed Potential possibility or inferred thematic premise: '{source_label}'. "
                f"Logically extrapolates foundational seed implications without canon drift."
            )
        elif origin_type == "HUMAN_DECISION":
            return (
                f"Created to fulfill explicit creator commitment in Stage 4 Decision DNA: '{source_label}'. "
                f"Embodies chosen archetypes, creative priorities, and custom directives."
            )
        elif origin_type == "DERIVED":
            return (
                f"Derived logically from established World Bible physics, geography, and systemic rules. "
                f"Canon anchor: '{source_label}'. Maintains strict ecological and world consistency."
            )
        elif origin_type == "AI_INTRODUCED":
            return (
                f"Introduced via generative narrative synthesis to expand atmospheric depth, character friction, and dramatic stakes. "
                f"Source context: '{source_label}'. Strictly constrained by all Decision DNA boundaries."
            )
        elif origin_type == "USER_ADDED":
            return (
                f"Authored or refined directly by the creator during iterative refinement: '{source_label}'. "
                f"Represents a verified, creator-committed branch mutation."
            )
        return (
            f"Provenance established under '{origin_type}' classification. "
            f"Anchor citation: '{source_label}'."
        )

    async def build_project_lineage(self, project_id: str) -> TraceGraphRead:
        """Dynamically synthesize nodes and edges for the entire creative lineage of a project."""
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        nodes: List[TraceNode] = []
        edges: List[TraceEdge] = []

        # ---------------------------------------------------------
        # Layer 1: Root Idea Seed (Stage 1)
        # ---------------------------------------------------------
        seed_node = TraceNode(
            id="node-seed",
            entity_id=project.id,
            entity_type="root_seed",
            label="Root Idea Seed",
            title="Original Creative Premise",
            stage=1,
            summary=project.seed_text or "No seed text recorded",
            causal_explanation="The immutable root inspiration and starting anchor for all downstream worldbuilding.",
            parent_ids=[],
            origin_type="SEED_EXPLICIT",
            origin_source="Raw Seed Text",
            metadata={"seed_text": project.seed_text},
        )
        nodes.append(seed_node)

        # ---------------------------------------------------------
        # Layer 2: Seed DNA (Stage 2)
        # ---------------------------------------------------------
        seed_dna_record = await self.repo.get_latest_seed_dna(project_id)
        if seed_dna_record:
            dna = seed_dna_record.to_seed_dna()
            themes_str = ", ".join(dna.themes[:3]) if dna.themes else "None"
            constraints_str = ", ".join(dna.constraints[:2]) if dna.constraints else "None"
            dna_node = TraceNode(
                id="node-dna",
                entity_id=seed_dna_record.id,
                entity_type="seed_dna",
                label="Distilled Seed DNA",
                title=dna.premise,
                stage=2,
                summary=f"Tone: {dna.tone} • Themes: {themes_str}",
                causal_explanation=(
                    f"Extracted during Seed Understanding to establish canon boundary constraints ({constraints_str}) "
                    f"and thematic pillars ({themes_str}) without altering original seed intent."
                ),
                parent_ids=["node-seed"],
                origin_type="SEED_EXPLICIT",
                origin_source="Thematic Analysis",
                metadata={
                    "tone": dna.tone,
                    "themes": dna.themes,
                    "constraints": dna.constraints,
                    "domain_keywords": dna.domain_keywords,
                },
            )
            nodes.append(dna_node)
            edges.append(
                TraceEdge(
                    id="edge-seed-dna",
                    source="node-seed",
                    target="node-dna",
                    relation_type="derived_from",
                    label="Understands Intent",
                )
            )

        # ---------------------------------------------------------
        # Layer 3: Three World Candidates (Stage 3)
        # ---------------------------------------------------------
        candidates = await self.repo.get_latest_world_candidates(project_id)
        for w in candidates:
            cand_node_id = f"node-world-{w.id}"
            cand_node = TraceNode(
                id=cand_node_id,
                entity_id=w.id,
                entity_type="world_candidate",
                label=f"Candidate 0{w.candidate_index}: {w.title}",
                title=w.title,
                stage=3,
                summary=w.concept,
                causal_explanation=(
                    f"Formulated as an exploration of the {w.archetype} archetype with aesthetic '{w.aesthetic}', "
                    f"testing the core tension '{w.core_tension}' under Seed DNA constraints."
                ),
                parent_ids=["node-dna"] if seed_dna_record else ["node-seed"],
                origin_type="SEED_INFERRED",
                origin_source=f"Triad Archetype: {w.archetype}",
                metadata={
                    "archetype": w.archetype,
                    "aesthetic": w.aesthetic,
                    "candidate_index": w.candidate_index,
                    "core_tension": w.core_tension,
                    "trade_offs": w.trade_offs,
                },
            )
            nodes.append(cand_node)
            edges.append(
                TraceEdge(
                    id=f"edge-dna-world-{w.id}",
                    source="node-dna" if seed_dna_record else "node-seed",
                    target=cand_node_id,
                    relation_type="derived_from",
                    label="Explores Archetype",
                )
            )

        # ---------------------------------------------------------
        # Layer 4: Human World Selection Gate (Stage 4)
        # ---------------------------------------------------------
        selection_tuple = await self.repo.get_active_world_selection(project_id)
        chosen_world = None
        if selection_tuple:
            selection, chosen_world = selection_tuple
            chosen_parent_id = f"node-world-{chosen_world.id}"
            sel_metadata = {
                "chosen_candidate_id": chosen_world.id,
                "user_rationale": selection.user_rationale,
                "archetype": chosen_world.archetype,
            }
            if getattr(selection, "human_only_zones_json", None):
                hoz_obj = selection.get_human_only_zones()
                if hoz_obj and hoz_obj.is_locked:
                    sel_metadata["human_only_zones"] = hoz_obj.model_dump()

            selection_node = TraceNode(
                id="node-selection",
                entity_id=selection.id,
                entity_type="human_selection",
                label=f"Selected: {chosen_world.title}",
                title=f"Creative Commitment: {chosen_world.title}",
                stage=4,
                summary=selection.user_rationale or "Confirmed creative direction without additional rationale.",
                causal_explanation=(
                    f"Human creator locked {chosen_world.title} ({chosen_world.archetype}) as the canonical foundation "
                    f"for universe expansion. Creator Rationale: '{selection.user_rationale or 'Direct creator commitment'}."
                ),
                parent_ids=[chosen_parent_id],
                origin_type="HUMAN_DECISION",
                origin_source=f"Committed Direction: {chosen_world.title}",
                metadata=sel_metadata,
            )
            nodes.append(selection_node)
            edges.append(
                TraceEdge(
                    id="edge-world-selection",
                    source=chosen_parent_id,
                    target="node-selection",
                    relation_type="selected_by",
                    label="Human Choice Gate",
                )
            )

        # Fetch entity revisions for version lineage chaining (PERS-01 & Phase 7)
        revisions = await self.repo.get_entity_revisions(project_id)
        revisions_by_entity: Dict[str, List[Any]] = {}
        for rev in revisions:
            revisions_by_entity.setdefault(rev.entity_id, []).append(rev)

        # ---------------------------------------------------------
        # Layer 5: Unfolded Universe Codex (Stage 5)
        # ---------------------------------------------------------
        unfolded = await self.repo.get_unfolded_universe(project_id)
        if unfolded and chosen_world:
            bible = unfolded.world_bible

            # 5a. World Bible Node
            bible_summary = bible.physics_rules
            if len(bible_summary) > 130:
                bible_summary = bible_summary[:130] + "..."

            bible_node = TraceNode(
                id="node-bible",
                entity_id=bible.id,
                entity_type="world_bible",
                label="World Bible & Laws",
                title=f"Canon Laws of {chosen_world.title}",
                stage=5,
                summary=bible_summary,
                causal_explanation=(
                    f"Constructed to define physical laws, environmental constraints, and factions for {chosen_world.title}, "
                    f"strictly abiding by Seed DNA parameters and creator commitment."
                ),
                parent_ids=["node-selection"],
                origin_type="DERIVED",
                origin_source="Stage 5 World Bible Synthesis",
                metadata={
                    "factions_count": len(bible.factions),
                    "timeline_count": len(bible.history_timeline),
                    "canon_facts_count": len(bible.canon_facts),
                },
            )
            nodes.append(bible_node)
            edges.append(
                TraceEdge(
                    id="edge-selection-bible",
                    source="node-selection",
                    target="node-bible",
                    relation_type="generated_for",
                    label="Establishes Canon",
                )
            )

            # 5b. Key Locations (Deterministic IDs node-loc-{i})
            for idx, loc in enumerate(bible.key_locations):
                loc_node_id = f"node-loc-{idx}"
                loc_orig_type = getattr(loc, "origin_type", None) or "DERIVED"
                loc_orig_source = getattr(loc, "origin_source", None) or "World Bible Geography"
                if loc_orig_source and "Human-Only Zone" in loc_orig_source:
                    loc_orig_type = "HUMAN_DECISION"
                loc_node = TraceNode(
                    id=loc_node_id,
                    entity_id=f"loc-{idx}",
                    entity_type="key_location",
                    label=loc.name,
                    title=loc.name,
                    stage=5,
                    summary=loc.description,
                    causal_explanation=(
                        f"Established as a landmark location within {chosen_world.title}: {loc.description}. "
                        + LineageService.generate_origin_explanation("key_location", loc_orig_type, loc_orig_source, loc.name)
                    ),
                    parent_ids=["node-bible"],
                    origin_type=loc_orig_type,
                    origin_source=loc_orig_source,
                    metadata={
                        "location_index": idx,
                        "location_name": loc.name,
                        "visual_prompt": loc.visual_prompt,
                    },
                )
                nodes.append(loc_node)
                edges.append(
                    TraceEdge(
                        id=f"edge-bible-loc-{idx}",
                        source="node-bible",
                        target=loc_node_id,
                        relation_type="appears_in",
                        label="Anchored in Canon",
                    )
                )

            # 5c. Characters & Name Map (with version chaining)
            char_map: Dict[str, str] = {c.id: c.name for c in unfolded.characters}
            char_node_map: Dict[str, str] = {c.name: f"node-char-{c.id}" for c in unfolded.characters}

            for c in unfolded.characters:
                char_node_id = f"node-char-{c.id}"
                c_orig_type = getattr(c, "origin_type", None) or "AI_INTRODUCED"
                c_orig_source = getattr(c, "origin_source", None)
                if c_orig_source and "Human-Only Zone" in c_orig_source:
                    c_orig_type = "HUMAN_DECISION"
                char_revs = [r for r in revisions_by_entity.get(c.id, []) if r.version < c.version]
                char_revs.sort(key=lambda r: (r.version, r.created_at))
                seen_versions: Set[int] = set()
                unique_char_revs = []
                for r in char_revs:
                    if r.version not in seen_versions:
                        seen_versions.add(r.version)
                        unique_char_revs.append(r)

                if not unique_char_revs:
                    # Baseline v1 character
                    char_node = TraceNode(
                        id=char_node_id,
                        entity_id=c.id,
                        entity_type="character",
                        label=f"{c.name} ({c.role})" if c.version == 1 else f"{c.name} ({c.role}) [v{c.version}]",
                        title=c.name,
                        stage=5,
                        summary=f"Motivation: {c.motivation} • Conflict: {c.core_conflict}",
                        causal_explanation=(
                            f"Cast as {c.role} ({c.archetype}) in {chosen_world.title} to embody the narrative tension "
                            f"between '{c.motivation}' and '{c.core_conflict}' under canon physical rules. "
                            + LineageService.generate_origin_explanation("character", c_orig_type, c_orig_source, c.name)
                        ),
                        parent_ids=["node-bible"],
                        origin_type=c_orig_type,
                        origin_source=c_orig_source,
                        metadata={
                            "role": c.role,
                            "archetype": c.archetype,
                            "motivation": c.motivation,
                            "core_conflict": c.core_conflict,
                            "version": c.version,
                            "revision_notes": c.revision_notes,
                            "visual_prompt": c.visual_prompt,
                        },
                    )
                    nodes.append(char_node)
                    edges.append(
                        TraceEdge(
                            id=f"edge-bible-char-{c.id}",
                            source="node-bible",
                            target=char_node_id,
                            relation_type="constrained_by",
                            label="Inhabits Canon",
                        )
                    )
                else:
                    # Version chaining: node-bible -> v1 -> ... -> latest
                    prev_node_id = "node-bible"
                    for r in unique_char_revs:
                        rev_node_id = f"node-char-{c.id}-v{r.version}"
                        r_orig_type = "USER_ADDED" if r.version > 1 else c_orig_type
                        r_orig_source = f"Creator Refinement v{r.version}: {r.revision_notes or 'Baseline revision'}"
                        rev_node = TraceNode(
                            id=rev_node_id,
                            entity_id=r.id,
                            entity_type="character_revision",
                            label=f"{c.name} (v{r.version})",
                            title=f"{c.name} v{r.version}",
                            stage=5,
                            summary=f"Historical Snapshot: {r.revision_notes or 'Baseline revision'}",
                            causal_explanation=(
                                f"Historical snapshot of {c.name} preserved prior to revision v{r.version + 1}. "
                                f"Creator notes: '{r.revision_notes or 'Baseline version'}'. Immutable audit record. "
                                + LineageService.generate_origin_explanation("character_revision", r_orig_type, r_orig_source, c.name)
                            ),
                            parent_ids=[prev_node_id],
                            origin_type=r_orig_type,
                            origin_source=r_orig_source,
                            metadata={
                                "version": r.version,
                                "revision_notes": r.revision_notes,
                                "created_at": str(r.created_at),
                            },
                        )
                        nodes.append(rev_node)
                        if prev_node_id == "node-bible":
                            edges.append(
                                TraceEdge(
                                    id=f"edge-bible-char-{c.id}-v{r.version}",
                                    source="node-bible",
                                    target=rev_node_id,
                                    relation_type="constrained_by",
                                    label="Inhabits Canon (v1)",
                                )
                            )
                        else:
                            edges.append(
                                TraceEdge(
                                    id=f"edge-char-{c.id}-rev-{r.version}",
                                    source=prev_node_id,
                                    target=rev_node_id,
                                    relation_type="refined_from",
                                    label="Creator Refinement",
                                )
                            )
                        prev_node_id = rev_node_id

                    # Current / latest character node
                    latest_char_orig_source = f"Creator Refinement v{c.version}: {c.revision_notes or 'Refined parameter update'}"
                    char_node = TraceNode(
                        id=char_node_id,
                        entity_id=c.id,
                        entity_type="character",
                        label=f"{c.name} ({c.role}) [v{c.version}]",
                        title=f"{c.name} v{c.version}" if c.version > 1 else c.name,
                        stage=5,
                        summary=f"Motivation: {c.motivation} • Conflict: {c.core_conflict}",
                        causal_explanation=(
                            f"Active refined incarnation of {c.name} ({c.role}, {c.archetype}) in {chosen_world.title}. "
                            f"Refined from v{c.version - 1} with creator notes: '{c.revision_notes or 'Refined parameter update'}'. "
                            + LineageService.generate_origin_explanation("character", "USER_ADDED", latest_char_orig_source, c.name)
                        ),
                        parent_ids=[prev_node_id],
                        origin_type="USER_ADDED",
                        origin_source=latest_char_orig_source,
                        metadata={
                            "role": c.role,
                            "archetype": c.archetype,
                            "motivation": c.motivation,
                            "core_conflict": c.core_conflict,
                            "version": c.version,
                            "revision_notes": c.revision_notes,
                            "visual_prompt": c.visual_prompt,
                        },
                    )
                    nodes.append(char_node)
                    edges.append(
                        TraceEdge(
                            id=f"edge-char-{c.id}-latest-refined",
                            source=prev_node_id,
                            target=char_node_id,
                            relation_type="refined_from",
                            label="Creator Refinement",
                        )
                    )

            # 5d. Character Relationships (resolving names against char_map)
            for r in unfolded.relationships:
                rel_node_id = f"node-rel-{r.id}"
                src_name = char_map.get(r.source_character_id, "Character A")
                tgt_name = char_map.get(r.target_character_id, "Character B")
                src_node_id = f"node-char-{r.source_character_id}"
                tgt_node_id = f"node-char-{r.target_character_id}"

                rel_node = TraceNode(
                    id=rel_node_id,
                    entity_id=r.id,
                    entity_type="relationship",
                    label=f"{src_name} ↔ {tgt_name}",
                    title=r.relation_type,
                    stage=5,
                    summary=r.dynamic_description,
                    causal_explanation=(
                        f"Interpersonal dynamic connecting {src_name} and {tgt_name} ({r.relation_type}): {r.dynamic_description}. "
                        + LineageService.generate_origin_explanation("relationship", "DERIVED", "Interpersonal Dynamic Synthesis", f"{src_name} ↔ {tgt_name}")
                    ),
                    parent_ids=[src_node_id, tgt_node_id],
                    origin_type="DERIVED",
                    origin_source="Interpersonal Dynamic Synthesis",
                    metadata={
                        "source_character_id": r.source_character_id,
                        "target_character_id": r.target_character_id,
                        "source_character_name": src_name,
                        "target_character_name": tgt_name,
                        "relation_type": r.relation_type,
                    },
                )
                nodes.append(rel_node)
                edges.append(
                    TraceEdge(
                        id=f"edge-char-rel-src-{r.id}",
                        source=src_node_id,
                        target=rel_node_id,
                        relation_type="appears_in",
                        label="Participant",
                    )
                )
                edges.append(
                    TraceEdge(
                        id=f"edge-char-rel-tgt-{r.id}",
                        source=tgt_node_id,
                        target=rel_node_id,
                        relation_type="appears_in",
                        label="Participant",
                    )
                )

            # 5e. Story Scenes (with version chaining)
            for s in unfolded.scenes:
                scene_node_id = f"node-scene-{s.id}"
                s_orig_type = getattr(s, "origin_type", None) or "AI_INTRODUCED"
                s_orig_source = getattr(s, "origin_source", None)
                if s_orig_source and "Human-Only Zone" in s_orig_source:
                    s_orig_type = "HUMAN_DECISION"
                scene_parents: List[str] = ["node-bible"]

                # Link character parents if characters_involved match
                for char_name in s.characters_involved:
                    matching_node_id = char_node_map.get(char_name)
                    if matching_node_id and matching_node_id not in scene_parents:
                        scene_parents.append(matching_node_id)

                scene_revs = [r for r in revisions_by_entity.get(s.id, []) if r.version < s.version]
                scene_revs.sort(key=lambda r: (r.version, r.created_at))
                seen_scene_versions: Set[int] = set()
                unique_scene_revs = []
                for r in scene_revs:
                    if r.version not in seen_scene_versions:
                        seen_scene_versions.add(r.version)
                        unique_scene_revs.append(r)

                if not unique_scene_revs:
                    # Baseline v1 scene
                    scene_node = TraceNode(
                        id=scene_node_id,
                        entity_id=s.id,
                        entity_type="scene",
                        label=f"Scene {s.scene_number}: {s.title}" if s.version == 1 else f"Scene {s.scene_number}: {s.title} [v{s.version}]",
                        title=s.title,
                        stage=5,
                        summary=f"Dramatic Q: {s.dramatic_question}",
                        causal_explanation=(
                            f"Dramatic scenario staged at {s.location_setting} putting characters into active conflict. "
                            f"Tests the question: '{s.dramatic_question}' leading to pivotal outcome '{s.pivotal_outcome}'. "
                            + LineageService.generate_origin_explanation("scene", s_orig_type, s_orig_source, s.title)
                        ),
                        parent_ids=scene_parents,
                        origin_type=s_orig_type,
                        origin_source=s_orig_source,
                        metadata={
                            "scene_number": s.scene_number,
                            "location_setting": s.location_setting,
                            "characters_involved": s.characters_involved,
                            "dramatic_question": s.dramatic_question,
                            "pivotal_outcome": s.pivotal_outcome,
                            "version": s.version,
                            "revision_notes": s.revision_notes,
                            "visual_prompt": s.visual_prompt,
                        },
                    )
                    nodes.append(scene_node)
                    edges.append(
                        TraceEdge(
                            id=f"edge-bible-scene-{s.id}",
                            source="node-bible",
                            target=scene_node_id,
                            relation_type="appears_in",
                            label="Enacts World Canon",
                        )
                    )

                    for parent_char_node in scene_parents:
                        if parent_char_node != "node-bible":
                            edges.append(
                                TraceEdge(
                                    id=f"edge-char-scene-{parent_char_node}-{s.id}",
                                    source=parent_char_node,
                                    target=scene_node_id,
                                    relation_type="appears_in",
                                    label="Features Character",
                                )
                            )
                else:
                    # Version chaining for scene: scene_parents -> v1 -> ... -> latest
                    prev_scene_id = "node-bible"
                    for r in unique_scene_revs:
                        rev_node_id = f"node-scene-{s.id}-v{r.version}"
                        sr_orig_type = "USER_ADDED" if r.version > 1 else s_orig_type
                        sr_orig_source = f"Creator Refinement v{r.version}: {r.revision_notes or 'Baseline scene'}"
                        rev_node = TraceNode(
                            id=rev_node_id,
                            entity_id=r.id,
                            entity_type="scene_revision",
                            label=f"Scene {s.scene_number}: {s.title} (v{r.version})",
                            title=f"{s.title} v{r.version}",
                            stage=5,
                            summary=f"Historical Scene Snapshot: {r.revision_notes or 'Baseline revision'}",
                            causal_explanation=(
                                f"Historical snapshot of Scene {s.scene_number} preserved prior to revision v{r.version + 1}. "
                                f"Creator notes: '{r.revision_notes or 'Baseline version'}'. Immutable audit record. "
                                + LineageService.generate_origin_explanation("scene_revision", sr_orig_type, sr_orig_source, s.title)
                            ),
                            parent_ids=scene_parents if prev_scene_id == "node-bible" else [prev_scene_id],
                            origin_type=sr_orig_type,
                            origin_source=sr_orig_source,
                            metadata={
                                "version": r.version,
                                "revision_notes": r.revision_notes,
                                "created_at": str(r.created_at),
                            },
                        )
                        nodes.append(rev_node)
                        if prev_scene_id == "node-bible":
                            edges.append(
                                TraceEdge(
                                    id=f"edge-bible-scene-{s.id}-v{r.version}",
                                    source="node-bible",
                                    target=rev_node_id,
                                    relation_type="appears_in",
                                    label="Enacts World Canon (v1)",
                                )
                            )
                            for parent_char_node in scene_parents:
                                if parent_char_node != "node-bible":
                                    edges.append(
                                        TraceEdge(
                                            id=f"edge-char-scene-{parent_char_node}-{s.id}-v{r.version}",
                                            source=parent_char_node,
                                            target=rev_node_id,
                                            relation_type="appears_in",
                                            label="Features Character",
                                        )
                                    )
                        else:
                            edges.append(
                                TraceEdge(
                                    id=f"edge-scene-{s.id}-rev-{r.version}",
                                    source=prev_scene_id,
                                    target=rev_node_id,
                                    relation_type="refined_from",
                                    label="Creator Refinement",
                                )
                            )
                        prev_scene_id = rev_node_id

                    # Current / latest scene node
                    latest_scene_orig_source = f"Creator Refinement v{s.version}: {s.revision_notes or 'Refined scene outcome'}"
                    scene_node = TraceNode(
                        id=scene_node_id,
                        entity_id=s.id,
                        entity_type="scene",
                        label=f"Scene {s.scene_number}: {s.title} [v{s.version}]",
                        title=f"{s.title} v{s.version}" if s.version > 1 else s.title,
                        stage=5,
                        summary=f"Dramatic Q: {s.dramatic_question}",
                        causal_explanation=(
                            f"Active refined scenario staged at {s.location_setting}. Refined from v{s.version - 1} "
                            f"with creator notes: '{s.revision_notes or 'Refined scene outcome'}'. "
                            f"Dramatic Q: '{s.dramatic_question}' leading to pivotal outcome '{s.pivotal_outcome}'. "
                            + LineageService.generate_origin_explanation("scene", "USER_ADDED", latest_scene_orig_source, s.title)
                        ),
                        parent_ids=[prev_scene_id],
                        origin_type="USER_ADDED",
                        origin_source=latest_scene_orig_source,
                        metadata={
                            "scene_number": s.scene_number,
                            "location_setting": s.location_setting,
                            "characters_involved": s.characters_involved,
                            "dramatic_question": s.dramatic_question,
                            "pivotal_outcome": s.pivotal_outcome,
                            "version": s.version,
                            "revision_notes": s.revision_notes,
                            "visual_prompt": s.visual_prompt,
                        },
                    )
                    nodes.append(scene_node)
                    edges.append(
                        TraceEdge(
                            id=f"edge-scene-{s.id}-latest-refined",
                            source=prev_scene_id,
                            target=scene_node_id,
                            relation_type="refined_from",
                            label="Creator Refinement",
                        )
                    )

        return TraceGraphRead(
            project_id=project_id,
            root_node_id="node-seed",
            nodes=nodes,
            edges=edges,
        )

    async def get_node_ancestors(self, project_id: str, node_id: str) -> AncestorPathRead:
        """Traverse the ancestor trail backwards from target node to root_seed."""
        graph = await self.build_project_lineage(project_id)
        node_map: Dict[str, TraceNode] = {n.id: n for n in graph.nodes}

        if node_id not in node_map:
            raise KeyError(f"Node '{node_id}' not found in project lineage graph.")

        target_node = node_map[node_id]

        # BFS / Backwards traversal through parent_ids
        visited_ids: Set[str] = set()
        queue: List[str] = [node_id]

        while queue:
            current_id = queue.pop(0)
            if current_id in visited_ids:
                continue
            visited_ids.add(current_id)

            curr_node = node_map.get(current_id)
            if curr_node:
                for parent_id in curr_node.parent_ids:
                    if parent_id in node_map and parent_id not in visited_ids:
                        queue.append(parent_id)

        # Collect ordered ancestor nodes from root to target
        ancestor_nodes = [node_map[nid] for nid in visited_ids if nid in node_map]
        ancestor_nodes.sort(key=lambda n: (n.stage, n.id))

        ancestor_id_set = {n.id for n in ancestor_nodes}
        ancestor_edges = [
            e for e in graph.edges if e.source in ancestor_id_set and e.target in ancestor_id_set
        ]

        summary = (
            f"Lineage trail for '{target_node.title}' ({target_node.entity_type}) links back through "
            f"{len(ancestor_nodes) - 1} parent decision(s) directly to the Root Seed."
        )

        return AncestorPathRead(
            node_id=node_id,
            ancestor_nodes=ancestor_nodes,
            ancestor_edges=ancestor_edges,
            summary_explanation=summary,
        )
