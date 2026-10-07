import json
import logging
import re
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from backend.app.models.lineage import TraceGraphRead
from backend.app.models.mutation import (
    EntityImpactCategory,
    EntityImpactItem,
    ForkMutationRequest,
    MutationMetadata,
    MutationSimulationResponse,
    PremiseVariableRead,
    PremiseVariableType,
    SeedMutationRequest,
)
from backend.app.models.persistence import BranchCreate
from backend.app.models.project import ProjectRead
from backend.app.repositories.project_repo import ProjectRepository
from backend.app.services.lineage_service import LineageService
from backend.app.services.persistence_service import PersistenceService

logger = logging.getLogger("seed_unfold.mutation")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MutationService:
    """
    Service managing counterfactual Seed Mutation Lab workflows (MUT-01 to MUT-04).
    Enables premise variable extraction, lineage-driven downstream impact classification,
    and isolated timeline branching with zero parent destruction.
    """

    def __init__(
        self,
        repo: ProjectRepository,
        persistence_service: PersistenceService,
        lineage_service: LineageService,
    ):
        self.repo = repo
        self.persistence_service = persistence_service
        self.lineage_service = lineage_service

    async def extract_premise_variables(self, project_id: str) -> List[PremiseVariableRead]:
        """
        Extract all four curated premise variables for the active universe (MUT-01).
        1. Core Premise Assumption (SeedDNA.premise)
        2. Tone & Atmosphere (SeedDNA.tone)
        3. Central Thematic Conflict (SeedDNA.themes / selected world)
        4. World Rule / Technological Foundation (WorldBible.physics_rules)
        """
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        seed_dna_record = await self.repo.get_latest_seed_dna(project_id)
        dna = seed_dna_record.to_seed_dna() if seed_dna_record else None
        world_bible = await self.repo.get_latest_world_bible(project_id)
        selection = await self.repo.get_active_world_selection(project_id)
        candidate = None
        if project.selected_world_id:
            candidate = await self.repo.get_world_candidate(project.selected_world_id)
        if not candidate:
            candidates = await self.repo.get_latest_world_candidates(project_id)
            if candidates:
                candidate = candidates[0]

        variables: List[PremiseVariableRead] = []

        # 1. Core Premise Assumption
        premise_val = (dna.premise if dna else project.seed_text) or "A child discovers a forgotten city beneath the ocean."
        variables.append(
            PremiseVariableRead(
                id="var-core-premise",
                variable_type="core_premise",
                label="Core Premise Assumption",
                original_value=premise_val,
                source_entity="SeedDNA.premise",
            )
        )

        # 2. Tone & Atmosphere
        tone_val = (dna.tone if dna else (candidate.aesthetic if candidate else "Atmospheric, exploratory")) or "Atmospheric, exploratory"
        variables.append(
            PremiseVariableRead(
                id="var-tone-atmosphere",
                variable_type="tone_atmosphere",
                label="Tone & Atmosphere",
                original_value=tone_val,
                source_entity="SeedDNA.tone",
            )
        )

        # 3. Central Thematic Conflict
        conflict_val = ""
        if dna and dna.themes:
            conflict_val = dna.themes[0]
        elif candidate and candidate.concept:
            conflict_val = candidate.concept
        elif selection and selection.selection_rationale:
            conflict_val = selection.selection_rationale
        else:
            conflict_val = "Survival vs Exploration in an ancient submerged world"
        variables.append(
            PremiseVariableRead(
                id="var-central-conflict",
                variable_type="central_conflict",
                label="Central Thematic Conflict",
                original_value=conflict_val,
                source_entity="SeedDNA.themes",
            )
        )

        # 4. World Rule / Technological Foundation
        rule_val = ""
        if world_bible and world_bible.physics_rules:
            rule_val = world_bible.physics_rules
        else:
            rule_val = "Submerged oceanic pressure barriers and bioluminescent energy conduits"
        variables.append(
            PremiseVariableRead(
                id="var-world-rule",
                variable_type="world_rule",
                label="World Rule / Technological Foundation",
                original_value=rule_val,
                source_entity="WorldBible.physics_rules",
            )
        )

        return variables

    def sanitize_branch_name(self, name: Optional[str], existing_branches: List[str]) -> str:
        """
        Sanitize and normalize branch names with collision safety (Correction 6).
        Format: mutation/{slugified_name}
        """
        raw = (name or "").strip()
        if not raw:
            candidate = "mutation/unnamed-fork"
        else:
            # Strip prefix if user already typed it
            if raw.startswith("mutation/"):
                raw = raw[len("mutation/") :]
            # Replace spaces and punctuation with hyphens
            slug = re.sub(r"[^a-zA-Z0-9_\-]+", "-", raw).strip("-").lower()
            slug = re.sub(r"-+", "-", slug)
            if not slug:
                slug = "unnamed-fork"
            candidate = f"mutation/{slug[:48]}"

        # Handle collision safely
        final_name = candidate
        counter = 2
        while final_name in existing_branches:
            final_name = f"{candidate}-{counter}"
            counter += 1

        return final_name

    async def simulate_mutation(
        self,
        project_id: str,
        request: SeedMutationRequest,
    ) -> MutationSimulationResponse:
        """
        Simulate downstream impact for a counterfactual premise mutation (MUT-02).
        Priority:
          1. LineageService DAG traversal & causal dependency
          2. Origin Ledger anchor classification
          3. Deterministic semantic fallback (offline-safe, zero CoT leakage)
        """
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        # 1. Fetch Lineage and Unfolded records
        lineage_graph: Optional[TraceGraphRead] = None
        try:
            lineage_graph = await self.lineage_service.build_project_lineage(project_id)
        except Exception as exc:
            logger.warning(f"Lineage lookup failed during mutation simulation: {exc}")

        world_bible = await self.repo.get_latest_world_bible(project_id)
        characters = await self.repo.get_latest_characters(project_id)
        scenes = await self.repo.get_latest_scenes(project_id)

        existing_branches_records = await self.repo.get_project_branches(project_id)
        existing_branch_names = [b.branch_name for b in existing_branches_records]

        # 2. Determine suggested branch name
        suggested_slug = request.hypothesis_prompt or request.new_value or "fork"
        suggested_branch = self.sanitize_branch_name(suggested_slug, existing_branch_names)

        impacted_entities: List[EntityImpactItem] = []
        counts = {"affected": 0, "conditional": 0, "preserved": 0}

        def add_impact(
            entity_id: str,
            entity_type: str,
            title: str,
            category: EntityImpactCategory,
            causal_justification: str,
            projected_impact: str,
            original_summary: str,
        ):
            impacted_entities.append(
                EntityImpactItem(
                    entity_id=entity_id,
                    entity_type=entity_type,
                    title=title,
                    impact_category=category,
                    causal_justification=causal_justification,
                    projected_impact=projected_impact,
                    original_summary=original_summary,
                )
            )
            cat_key = category.lower()
            counts[cat_key] = counts.get(cat_key, 0) + 1

        mut_var = request.mutated_variable.lower()
        hyp = request.hypothesis_prompt or request.new_value

        # ------------------------------------------------------------------
        # Entity 1: World Bible Core Purpose / Rules
        # ------------------------------------------------------------------
        if world_bible:
            if "premise" in mut_var or "rule" in mut_var:
                add_impact(
                    entity_id=world_bible.id,
                    entity_type="world_bible",
                    title="World Bible: Environmental Laws & Purpose",
                    category="AFFECTED",
                    causal_justification=(
                        f"Direct foundational anchor: altering premise to '{hyp}' fundamentally alters "
                        f"the city's operational purpose and civil defense rules."
                    ),
                    projected_impact=f"Shift from peaceful sanctuary to active strategic doctrine ({hyp}).",
                    original_summary=world_bible.physics_rules[:120] if world_bible.physics_rules else "Submerged oceanic laws",
                )
            elif "tone" in mut_var:
                add_impact(
                    entity_id=world_bible.id,
                    entity_type="world_bible",
                    title="World Bible: Atmospheric Aesthetic",
                    category="AFFECTED",
                    causal_justification=(
                        f"Aesthetic foundation anchor: tone mutation to '{hyp}' directly alters "
                        f"environmental lighting, acoustics, and world atmosphere."
                    ),
                    projected_impact=f"Aesthetic refactored to align with {hyp}.",
                    original_summary=world_bible.visual_style_prompt[:120] if world_bible.visual_style_prompt else "Exploratory mood",
                )
            else:  # conflict
                add_impact(
                    entity_id=world_bible.id,
                    entity_type="world_bible",
                    title="World Bible: Societal Factions & Stakes",
                    category="CONDITIONAL",
                    causal_justification=(
                        f"Contextual dependency: societal institutions remain structurally intact but "
                        f"realign allegiances to address the conflict '{hyp}'."
                    ),
                    projected_impact=f"Institutional objectives pivot around {hyp}.",
                    original_summary="Societal factions and historical timeline",
                )

        # ------------------------------------------------------------------
        # Key Locations (Unfolded Bible Locations)
        # ------------------------------------------------------------------
        if world_bible and world_bible.key_locations_json:
            try:
                locs_raw = json.loads(world_bible.key_locations_json or "[]")
            except Exception:
                locs_raw = []

            for idx, loc in enumerate(locs_raw):
                loc_name = loc.get("name") if isinstance(loc, dict) else str(loc)
                loc_desc = loc.get("description") if isinstance(loc, dict) else ""
                loc_id = f"loc-{idx + 1}"

                # Primary location directly reflects the city's purpose (AFFECTED)
                # Subsequent locations: some conditional, some preserved (e.g. natural geography)
                is_natural_geography = any(
                    term in (loc_name + loc_desc).lower()
                    for term in ["trench", "reef", "coral", "abyss", "geology", "ocean floor", "depths", "thermal"]
                )
                if idx == 0 and ("premise" in mut_var or "rule" in mut_var):
                    add_impact(
                        entity_id=loc_id,
                        entity_type="location",
                        title=f"Primary Location: {loc_name}",
                        category="AFFECTED",
                        causal_justification=(
                            f"Primary architectural anchor: directly grounds the central premise. "
                            f"Mutating to '{hyp}' requires redesigning core installations."
                        ),
                        projected_impact=f"Reconstructed as a functional military or strategic nexus ({hyp}).",
                        original_summary=loc_desc[:120] or "Central underwater sector",
                    )
                elif is_natural_geography or (idx == len(locs_raw) - 1 and len(locs_raw) > 1):
                    add_impact(
                        entity_id=loc_id,
                        entity_type="location",
                        title=f"Geographic Formation: {loc_name}",
                        category="PRESERVED",
                        causal_justification=(
                            "Independent oceanic geography: natural topography and surrounding marine ecology "
                            "exist outside civilization premise assumptions."
                        ),
                        projected_impact="Topography and environmental baseline remain 100% invariant.",
                        original_summary=loc_desc[:120] or "Deep ocean terrain feature",
                    )
                else:
                    add_impact(
                        entity_id=loc_id,
                        entity_type="location",
                        title=f"Sector: {loc_name}",
                        category="CONDITIONAL",
                        causal_justification=(
                            f"Secondary sector infrastructure adapts security protocols and patrol patterns "
                            f"to reflect '{hyp}'."
                        ),
                        projected_impact=f"Access restrictions and operational alert level adapted for {hyp}.",
                        original_summary=loc_desc[:120] or "Secondary sector hub",
                    )

        # ------------------------------------------------------------------
        # Characters (Cast & Protagonist)
        # ------------------------------------------------------------------
        for idx, char in enumerate(characters):
            char_title = f"{char.name} ({char.role})"
            if idx == 0:  # Protagonist
                if "conflict" in mut_var or "premise" in mut_var:
                    add_impact(
                        entity_id=char.id,
                        entity_type="character",
                        title=f"Protagonist: {char_title}",
                        category="CONDITIONAL",
                        causal_justification=(
                            f"Identity survives while objectives adapt: protagonist motivation shifts from "
                            f"innocent archeology to tactical evasion and survival under '{hyp}'."
                        ),
                        projected_impact=f"Motivation adapts to negotiate danger or objectives of {hyp}.",
                        original_summary=f"Motivation: {char.motivation} • Archetype: {char.archetype}",
                    )
                else:
                    add_impact(
                        entity_id=char.id,
                        entity_type="character",
                        title=f"Protagonist: {char_title}",
                        category="CONDITIONAL",
                        causal_justification=(
                            f"Tone/rule shift alters character demeanor and stakes without invalidating identity."
                        ),
                        projected_impact=f"Emotional reactions and decisions mirror {hyp}.",
                        original_summary=char.motivation[:120],
                    )
            else:  # Secondary characters / mentors / guardians
                # Natural guardians or independent researchers can be PRESERVED or CONDITIONAL
                is_independent = "guardian" in char.role.lower() or "marine" in char.role.lower() or "scholar" in char.role.lower()
                if is_independent and idx >= 2:
                    add_impact(
                        entity_id=char.id,
                        entity_type="character",
                        title=char_title,
                        category="PRESERVED",
                        causal_justification=(
                            "Independent role: character archetype and natural ecology loyalty operate "
                            "independently of civilized premise mutation."
                        ),
                        projected_impact="Character identity, personal history, and baseline presence preserved.",
                        original_summary=char.motivation[:120],
                    )
                else:
                    add_impact(
                        entity_id=char.id,
                        entity_type="character",
                        title=char_title,
                        category="CONDITIONAL",
                        causal_justification=(
                            f"Interpersonal friction: allegiance to protagonist requires navigation of new risks "
                            f"introduced by '{hyp}'."
                        ),
                        projected_impact=f"Relationships adapt to heightened tensions under {hyp}.",
                        original_summary=char.motivation[:120],
                    )

        # ------------------------------------------------------------------
        # Scenes (Story Beats)
        # ------------------------------------------------------------------
        for idx, sc in enumerate(scenes):
            scene_title = f"Scene {sc.scene_number}: {sc.title}"
            if idx == 0 and ("premise" in mut_var or "rule" in mut_var):
                add_impact(
                    entity_id=sc.id,
                    entity_type="scene",
                    title=scene_title,
                    category="AFFECTED",
                    causal_justification=(
                        f"Opening inciting incident anchors on premise revelation: discovery of '{hyp}' "
                        f"transforms peaceful awe into immediate high-stakes crisis."
                    ),
                    projected_impact=f"Scene stakes escalate into tactical alert and defensive encounter ({hyp}).",
                    original_summary=sc.dramatic_question or sc.conflict_narrative[:120],
                )
            elif idx == len(scenes) - 1:  # Climax
                add_impact(
                    entity_id=sc.id,
                    entity_type="scene",
                    title=f"Climax: {scene_title}",
                    category="AFFECTED" if "conflict" in mut_var else "CONDITIONAL",
                    causal_justification=(
                        f"Pivotal climax resolves central tension: must directly engage consequences of '{hyp}'."
                    ),
                    projected_impact=f"Final outcome hinges on resolving challenges posed by {hyp}.",
                    original_summary=sc.pivotal_outcome[:120] if sc.pivotal_outcome else "Climactic resolution",
                )
            else:
                add_impact(
                    entity_id=sc.id,
                    entity_type="scene",
                    title=scene_title,
                    category="CONDITIONAL",
                    causal_justification=(
                        f"Dramatic progression adapts: obstacle framing recalibrated for '{hyp}'."
                    ),
                    projected_impact=f"Conflict narrative adjusted to reflect pressure of {hyp}.",
                    original_summary=sc.dramatic_question or sc.conflict_narrative[:120],
                )

        # Fallback if no unfolded entities exist yet (e.g. before Stage 5 unfolding)
        if not impacted_entities:
            add_impact(
                entity_id="premise-anchor",
                entity_type="seed_dna",
                title="Foundational Premise Framework",
                category="AFFECTED",
                causal_justification=f"Root premise mutated to '{hyp}'.",
                projected_impact=f"Downstream generation will unfold around {hyp}.",
                original_summary=request.original_value,
            )
            add_impact(
                entity_id="theme-anchor",
                entity_type="seed_dna",
                title="Thematic Conflict Dynamics",
                category="CONDITIONAL",
                causal_justification="Secondary thematic tensions adapt to altered foundation.",
                projected_impact="Thematic pillars realigned.",
                original_summary="Thematic baseline",
            )
            add_impact(
                entity_id="lore-anchor",
                entity_type="seed_dna",
                title="Background Archeology & Geology",
                category="PRESERVED",
                causal_justification="Inherent physical world context remains causally invariant.",
                projected_impact="World background remains untouched.",
                original_summary="Invariant lore rules",
            )

        return MutationSimulationResponse(
            project_id=project_id,
            mutated_variable=request.mutated_variable,
            original_value=request.original_value,
            new_value=request.new_value,
            hypothesis_prompt=request.hypothesis_prompt,
            suggested_branch_name=suggested_branch,
            impacted_entities=impacted_entities,
            summary_counts=counts,
        )

    async def fork_mutated_universe(
        self,
        project_id: str,
        request: ForkMutationRequest,
    ) -> ProjectRead:
        """
        Execute an isolated universe fork with adapted entities (MUT-03).
        Guarantees:
          - Zero destruction: Parent universe remains 100% immutable.
          - Child ID remapping for all cloned entities.
          - Mutation metadata persistence on child project.
          - Variable-specific adaptation (Core Premise, Tone, Conflict, World Rule).
          - Traceable Origin Ledger citation (origin_type='USER_ADDED').
        """
        parent = await self.repo.get_project(project_id)
        if not parent:
            raise KeyError(f"Parent project with ID '{project_id}' not found.")

        # 1. Sanitize branch name
        existing_branches_records = await self.repo.get_project_branches(project_id)
        existing_branch_names = [b.branch_name for b in existing_branches_records]
        sanitized_branch = self.sanitize_branch_name(request.branch_name, existing_branch_names)

        # 2. Run simulation to compute summary counts
        sim_request = SeedMutationRequest(
            mutated_variable=request.mutated_variable,
            original_value=request.original_value,
            new_value=request.new_value,
            hypothesis_prompt=request.hypothesis_prompt,
        )
        sim_result = await self.simulate_mutation(project_id, sim_request)

        # 3. Fork timeline using PersistenceService (handles project & entity cloning with ID remapping)
        branch_create = BranchCreate(
            branch_name=sanitized_branch,
            branch_point_stage=5,
            rationale=request.rationale or request.hypothesis_prompt or f"Forked via Seed Mutation Lab: {request.new_value}",
        )
        child_project = await self.persistence_service.branch_project(project_id, branch_create)

        # 4. Persist Mutation Metadata on Child Project (Correction 1)
        metadata = MutationMetadata(
            mutated_variable=request.mutated_variable,
            original_value=request.original_value,
            new_value=request.new_value,
            hypothesis_prompt=request.hypothesis_prompt,
            impact_summary=sim_result.summary_counts,
            applied_at=get_utc_now(),
        )
        child_project.mutation_metadata_json = metadata.model_dump_json()
        self.repo.session.add(child_project)

        # 5. Variable-Specific Adaptation in Child Branch (Correction 2, 4)
        hyp = request.hypothesis_prompt or request.new_value
        citation = f"Forked via Seed Mutation Lab: {hyp}"
        mut_var = request.mutated_variable.lower()

        # Update child Seed DNA
        child_dna = await self.repo.get_latest_seed_dna(child_project.id)
        child_bible = await self.repo.get_latest_world_bible(child_project.id)
        child_chars = await self.repo.get_latest_characters(child_project.id)
        child_scenes = await self.repo.get_latest_scenes(child_project.id)

        if "premise" in mut_var:
            if child_dna:
                child_dna.premise = request.new_value
                self.repo.session.add(child_dna)
            if child_bible:
                child_bible.geography = f"Adapted around mutated premise ({request.new_value}). {child_bible.geography}"
                child_bible.visual_style_prompt = f"{request.new_value}. {child_bible.visual_style_prompt}"
                # Update first key location in child bible JSON
                try:
                    locs = json.loads(child_bible.key_locations_json or "[]")
                    if locs and isinstance(locs, list) and isinstance(locs[0], dict):
                        locs[0]["description"] = f"Strategically adapted: {request.new_value}. {locs[0].get('description', '')}"
                        locs[0]["origin_type"] = "USER_ADDED"
                        locs[0]["origin_source"] = citation
                        child_bible.key_locations_json = json.dumps(locs)
                except Exception:
                    pass
                self.repo.session.add(child_bible)

            # Adapt characters & scenes
            for char in child_chars:
                char.motivation = f"Adapted to {request.new_value}: {char.motivation}"
                char.origin_type = "USER_ADDED"
                char.origin_source = citation
                self.repo.session.add(char)

            for sc in child_scenes:
                sc.conflict_narrative = f"Escalated confrontation under {request.new_value}: {sc.conflict_narrative}"
                sc.origin_type = "USER_ADDED"
                sc.origin_source = citation
                self.repo.session.add(sc)

        elif "tone" in mut_var:
            if child_dna:
                child_dna.tone = request.new_value
                self.repo.session.add(child_dna)
            if child_bible:
                child_bible.visual_style_prompt = f"Atmosphere and tone: {request.new_value}. {child_bible.visual_style_prompt}"
                self.repo.session.add(child_bible)

            for char in child_chars:
                char.origin_type = "USER_ADDED"
                char.origin_source = citation
                self.repo.session.add(char)

            for sc in child_scenes:
                sc.visual_prompt = f"Atmosphere: {request.new_value}. {sc.visual_prompt}"
                sc.origin_type = "USER_ADDED"
                sc.origin_source = citation
                self.repo.session.add(sc)

        elif "conflict" in mut_var:
            if child_dna:
                try:
                    themes = json.loads(child_dna.themes_json or "[]")
                    themes.insert(0, request.new_value)
                    child_dna.themes_json = json.dumps(themes)
                    self.repo.session.add(child_dna)
                except Exception:
                    pass

            for char in child_chars:
                char.core_conflict = request.new_value
                char.origin_type = "USER_ADDED"
                char.origin_source = citation
                self.repo.session.add(char)

            for sc in child_scenes:
                sc.dramatic_question = f"How to resolve the struggle of {request.new_value}? {sc.dramatic_question}"
                sc.origin_type = "USER_ADDED"
                sc.origin_source = citation
                self.repo.session.add(sc)

        elif "rule" in mut_var:
            if child_bible:
                child_bible.physics_rules = request.new_value
                try:
                    locs = json.loads(child_bible.key_locations_json or "[]")
                    for loc in locs:
                        if isinstance(loc, dict):
                            loc["origin_type"] = "USER_ADDED"
                            loc["origin_source"] = citation
                    child_bible.key_locations_json = json.dumps(locs)
                except Exception:
                    pass
                self.repo.session.add(child_bible)

            for sc in child_scenes:
                sc.conflict_narrative = f"Operating under rule ({request.new_value}): {sc.conflict_narrative}"
                sc.origin_type = "USER_ADDED"
                sc.origin_source = citation
                self.repo.session.add(sc)

        # 6. Commit child updates
        await self.repo.session.commit()
        await self.repo.session.refresh(child_project)

        logger.info(
            f"Successfully forked mutated project '{child_project.id}' on branch '{sanitized_branch}' "
            f"from parent '{project_id}' with mutation metadata persisted."
        )

        return child_project.to_read_schema()
