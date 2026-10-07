import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.app.models.counterfactual import (
    CounterfactualCandidateRead,
    CounterfactualDeltaDimension,
    CounterfactualDeltaResponse,
    CounterfactualMetadata,
    ExplorationProfileComparison,
    ForkCounterfactualRequest,
)
from backend.app.models.persistence import BranchCreate
from backend.app.models.project import ProjectRead
from backend.app.models.world import ExplorationProfile, WorldCandidateRecord
from backend.app.providers.base import AIProvider
from backend.app.repositories.project_repo import ProjectRepository
from backend.app.services.persistence_service import PersistenceService

logger = logging.getLogger("seed_unfold.counterfactual")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9_\-]+", "-", text).strip("-").lower()
    slug = re.sub(r"-+", "-", slug)
    return slug or "alternative-world"


class CounterfactualService:
    """
    Service managing Counterfactual Replay workflows (CNTR-01, CNTR-02).
    Allows creators to inspect structured divergence deltas between selected canon
    and rejected candidate worlds, and fork isolated alternative timeline branches.
    """

    def __init__(
        self,
        repo: ProjectRepository,
        persistence_service: PersistenceService,
        ai_provider: Optional[AIProvider] = None,
    ):
        self.repo = repo
        self.persistence_service = persistence_service
        self.ai_provider = ai_provider

    def sanitize_branch_name(self, name: Optional[str], existing_branches: List[str]) -> str:
        """Sanitize branch name with collision safety and 'counterfactual/' prefix."""
        raw = (name or "").strip()
        if not raw:
            candidate = "counterfactual/alternative-world"
        else:
            if raw.startswith("counterfactual/"):
                raw = raw[len("counterfactual/") :]
            candidate = f"counterfactual/{slugify(raw)[:48]}"

        final_name = candidate
        counter = 2
        while final_name in existing_branches:
            final_name = f"{candidate}-{counter}"
            counter += 1
        return final_name

    def _derive_inferred_exclusion(self, title: str, archetype: str, rejected_list: List[str]) -> str:
        """Derive a clean human-readable trope tag indicating what was avoided."""
        t_low = title.lower()
        if "lost civilization" in t_low:
            return "Classical sunken ruins archaeology"
        if "time capsule" in t_low:
            return "Cold War militarized technology"
        if "bio-city" in t_low:
            return "Symbiotic cellular oceanography"
        for item in rejected_list:
            if isinstance(item, str) and (title.lower() in item.lower() or archetype.lower() in item.lower()):
                return item
        return f"Archetype conventions of {title} ({archetype})"

    async def get_counterfactual_candidates(self, project_id: str) -> List[CounterfactualCandidateRead]:
        """
        Extract all rejected candidate worlds from the active project's Stage 3 generation batch (CNTR-01).
        """
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        active_selection = await self.repo.get_active_world_selection(project_id)
        if not active_selection:
            raise ValueError(f"Project '{project_id}' does not have an active world selection. Select a world first.")

        sel_rec, chosen_cand_rec = active_selection

        rejected_directions: List[str] = []
        try:
            rejected_directions = json.loads(sel_rec.rejected_directions_json or "[]")
            if not isinstance(rejected_directions, list):
                rejected_directions = []
        except Exception:
            rejected_directions = []

        all_candidates = await self.repo.get_latest_world_candidates(project_id)
        rejected_candidates: List[CounterfactualCandidateRead] = []

        for cand in all_candidates:
            if cand.id == chosen_cand_rec.id:
                continue

            prof = ExplorationProfile()
            if cand.exploration_profile_json:
                try:
                    prof_data = json.loads(cand.exploration_profile_json)
                    prof = ExplorationProfile(**prof_data)
                except Exception:
                    pass

            exclusion_tag = self._derive_inferred_exclusion(cand.title, cand.archetype, rejected_directions)

            rejected_candidates.append(
                CounterfactualCandidateRead(
                    id=cand.id,
                    index=cand.candidate_index,
                    title=cand.title,
                    archetype=cand.archetype,
                    concept=cand.concept,
                    aesthetic=cand.aesthetic,
                    core_tension=cand.core_tension,
                    trade_offs=cand.trade_offs,
                    key_visual=cand.key_visual,
                    divergence_archetype=cand.divergence_archetype or "familiar",
                    exploration_profile=prof,
                    inferred_exclusion=exclusion_tag,
                )
            )

        rejected_candidates.sort(key=lambda c: c.index)
        return rejected_candidates

    async def generate_counterfactual_delta(
        self,
        project_id: str,
        candidate_id: str,
        use_ai: bool = True,
    ) -> CounterfactualDeltaResponse:
        """
        Compute hybrid divergence delta comparing active universe canon against a rejected candidate (CNTR-02).
        Includes instant deterministic baseline and optional AI semantic delta projection.
        """
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        active_selection = await self.repo.get_active_world_selection(project_id)
        if not active_selection:
            raise ValueError(f"Project '{project_id}' does not have an active world selection.")

        sel_rec, canon_cand_rec = active_selection

        all_candidates = await self.repo.get_latest_world_candidates(project_id)
        cf_cand_rec: Optional[WorldCandidateRecord] = None
        for cand in all_candidates:
            if cand.id == candidate_id:
                cf_cand_rec = cand
                break

        if not cf_cand_rec:
            raise KeyError(f"Counterfactual candidate with ID '{candidate_id}' not found in project '{project_id}'.")

        # Fetch active unfolded universe anchors
        bible = await self.repo.get_latest_world_bible(project_id)
        characters = await self.repo.get_latest_characters(project_id)
        scenes = await self.repo.get_latest_scenes(project_id)

        # 1. Canon Values
        if characters:
            lead_char = characters[0]
            canon_protagonist = f"{lead_char.name} ({lead_char.archetype}) — {lead_char.motivation}"
        else:
            canon_protagonist = f"Young Explorer / Inhabitant shaped by {canon_cand_rec.archetype}"

        canon_tone = canon_cand_rec.aesthetic
        canon_conflict = canon_cand_rec.core_tension

        if bible and bible.physics_rules:
            canon_rules = bible.physics_rules
        else:
            canon_rules = f"Ecological laws and sensory architecture of {canon_cand_rec.title}"

        canon_trade_offs = (
            sel_rec.user_rationale
            or f"Prioritized {canon_cand_rec.archetype} dynamics over alternative genre pathways."
        )

        # 2. Counterfactual Projected Values (Deterministic Baseline)
        cf_title_low = cf_cand_rec.title.lower()
        if "time capsule" in cf_title_low or "archive" in cf_cand_rec.archetype.lower():
            cf_protagonist = "Military Salvager / Cryptographer decoding Cold War automated defenses"
        elif "lost civilization" in cf_title_low or "ruins" in cf_cand_rec.archetype.lower():
            cf_protagonist = "Relic Hunter / Historian deciphering an ancient pre-cataclysm dynasty"
        elif "bio-city" in cf_title_low or "symbiotic" in cf_cand_rec.archetype.lower():
            cf_protagonist = "Symbiont Cultivator / Genetic Caretaker bonded with cellular structures"
        else:
            cf_protagonist = f"Specialist / Inhabitant navigating {cf_cand_rec.archetype} ({cf_cand_rec.title})"

        cf_tone = cf_cand_rec.aesthetic
        cf_conflict = cf_cand_rec.core_tension
        cf_rules = f"Physical constraints governing {cf_cand_rec.archetype}: {cf_cand_rec.trade_offs}"
        cf_trade_offs = cf_cand_rec.trade_offs

        # 3. Exploration Profile Arithmetic Comparison
        canon_prof = ExplorationProfile()
        if canon_cand_rec.exploration_profile_json:
            try:
                canon_prof = ExplorationProfile(**json.loads(canon_cand_rec.exploration_profile_json))
            except Exception:
                pass

        cf_prof = ExplorationProfile()
        if cf_cand_rec.exploration_profile_json:
            try:
                cf_prof = ExplorationProfile(**json.loads(cf_cand_rec.exploration_profile_json))
            except Exception:
                pass

        profile_comparison = ExplorationProfileComparison(
            canon_profile=canon_prof,
            counterfactual_profile=cf_prof,
            seed_fidelity_delta=cf_prof.seed_fidelity - canon_prof.seed_fidelity,
            novelty_delta=cf_prof.novelty - canon_prof.novelty,
            conceptual_distance_delta=cf_prof.conceptual_distance - canon_prof.conceptual_distance,
            feasibility_delta=cf_prof.feasibility - canon_prof.feasibility,
            summary=(
                f"{cf_cand_rec.title} exhibits a "
                f"{'+' if cf_prof.novelty >= canon_prof.novelty else ''}"
                f"{cf_prof.novelty - canon_prof.novelty}% novelty shift and "
                f"{'+' if cf_prof.conceptual_distance >= canon_prof.conceptual_distance else ''}"
                f"{cf_prof.conceptual_distance - canon_prof.conceptual_distance}% conceptual distance shift."
            ),
        )

        # 4. Construct Structured Dimensions
        c_dist_delta = abs(cf_prof.conceptual_distance - canon_prof.conceptual_distance)
        protagonist_level = "radical" if c_dist_delta > 20 else "moderate"
        tone_level = "radical" if cf_cand_rec.divergence_archetype in ["radical", "inverse"] else "moderate"
        conflict_level = "moderate"
        rules_level = "radical" if cf_cand_rec.divergence_archetype == "inverse" else "moderate"

        protagonist_analysis = (
            f"Switching from {canon_cand_rec.title} to {cf_cand_rec.title} re-anchors the primary protagonist arc. "
            f"Rather than exploring {canon_protagonist.split('—')[0].strip()}, the narrative centers on {cf_protagonist}."
        )
        tone_analysis = (
            f"Atmosphere pivots from canon '{canon_tone}' to counterfactual '{cf_tone}', "
            f"altering sensory immersion and environmental pressure."
        )
        conflict_analysis = (
            f"Central dramatic tension diverges from '{canon_conflict}' to '{cf_conflict}', "
            f"shifting narrative stakes and crisis escalation."
        )
        rules_analysis = (
            f"Foundational rules shift from canon physics to {cf_cand_rec.archetype} mechanics: {cf_rules}."
        )
        trade_offs_analysis = (
            f"Choosing this alternative world trades away canon focus ({canon_trade_offs}) "
            f"in favor of: {cf_trade_offs}."
        )

        # 5. Optional AI Semantic Enhancement with Fallback
        if use_ai and self.ai_provider:
            try:
                system_prompt = (
                    "You are a narrative intelligence engine analyzing counterfactual story world divergence. "
                    "Compare the current committed story world against a rejected candidate world. "
                    "Output clean, evocative, professional comparative prose without any meta-talk or chain-of-thought."
                )
                user_prompt = (
                    f"Canon World: '{canon_cand_rec.title}' ({canon_cand_rec.archetype})\n"
                    f"Concept: {canon_cand_rec.concept}\n"
                    f"Tone: {canon_tone}\n"
                    f"Conflict: {canon_conflict}\n\n"
                    f"Counterfactual World: '{cf_cand_rec.title}' ({cf_cand_rec.archetype})\n"
                    f"Concept: {cf_cand_rec.concept}\n"
                    f"Tone: {cf_tone}\n"
                    f"Conflict: {cf_conflict}\n\n"
                    f"Provide a 2-sentence comparative analysis for each dimension:\n"
                    f"1. Protagonist shift\n"
                    f"2. Tone shift\n"
                    f"3. Conflict shift\n"
                    f"4. Rule shift\n"
                    f"Format output as JSON with keys: protagonist_analysis, tone_analysis, conflict_analysis, rules_analysis."
                )
                ai_resp = await self.ai_provider.generate_json(system_prompt, user_prompt)
                if isinstance(ai_resp, dict):
                    protagonist_analysis = ai_resp.get("protagonist_analysis") or protagonist_analysis
                    tone_analysis = ai_resp.get("tone_analysis") or tone_analysis
                    conflict_analysis = ai_resp.get("conflict_analysis") or conflict_analysis
                    rules_analysis = ai_resp.get("rules_analysis") or rules_analysis
            except Exception as e:
                logger.debug(f"AI semantic delta enhancement fallback to deterministic: {e}")

        dimensions = [
            CounterfactualDeltaDimension(
                dimension="protagonist",
                title="Protagonist & Lead Archetype",
                canon_value=canon_protagonist,
                counterfactual_value=cf_protagonist,
                divergence_analysis=protagonist_analysis,
                divergence_level=protagonist_level,
            ),
            CounterfactualDeltaDimension(
                dimension="tone_atmosphere",
                title="Tone & Sensory Atmosphere",
                canon_value=canon_tone,
                counterfactual_value=cf_tone,
                divergence_analysis=tone_analysis,
                divergence_level=tone_level,
            ),
            CounterfactualDeltaDimension(
                dimension="central_conflict",
                title="Central Dramatic Conflict",
                canon_value=canon_conflict,
                counterfactual_value=cf_conflict,
                divergence_analysis=conflict_analysis,
                divergence_level=conflict_level,
            ),
            CounterfactualDeltaDimension(
                dimension="world_rules",
                title="World Rules & Physical Lore",
                canon_value=canon_rules,
                counterfactual_value=cf_rules,
                divergence_analysis=rules_analysis,
                divergence_level=rules_level,
            ),
            CounterfactualDeltaDimension(
                dimension="trade_offs",
                title="Narrative Trade-Offs",
                canon_value=canon_trade_offs,
                counterfactual_value=cf_trade_offs,
                divergence_analysis=trade_offs_analysis,
                divergence_level="subtle",
            ),
        ]

        suggested_branch = f"counterfactual/{slugify(cf_cand_rec.title)}"

        return CounterfactualDeltaResponse(
            project_id=project_id,
            canon_world_id=canon_cand_rec.id,
            counterfactual_world_id=cf_cand_rec.id,
            canon_title=canon_cand_rec.title,
            counterfactual_title=cf_cand_rec.title,
            decision_dna_rationale=sel_rec.user_rationale,
            dimensions=dimensions,
            profile_comparison=profile_comparison,
            suggested_branch_name=suggested_branch,
        )

    async def fork_counterfactual_branch(
        self,
        project_id: str,
        request: ForkCounterfactualRequest,
    ) -> ProjectRead:
        """
        Fork an isolated timeline branch rooted in a rejected candidate world (CNTR-01).
        Guarantees:
          - Zero destruction: Parent universe canon remains 100% immutable.
          - Child branch updates selected world to counterfactual candidate.
          - Counterfactual metadata persisted on child project.
          - Child project status set to 'world_selected'.
        """
        parent = await self.repo.get_project(project_id)
        if not parent:
            raise KeyError(f"Parent project with ID '{project_id}' not found.")

        all_candidates = await self.repo.get_latest_world_candidates(project_id)
        cf_cand_rec: Optional[WorldCandidateRecord] = None
        for cand in all_candidates:
            if cand.id == request.candidate_id:
                cf_cand_rec = cand
                break

        if not cf_cand_rec:
            raise KeyError(f"Counterfactual candidate with ID '{request.candidate_id}' not found.")

        # 1. Sanitize branch name with collision safety
        existing_branches_records = await self.repo.get_project_branches(project_id)
        existing_branch_names = [b.branch_name for b in existing_branches_records]
        sanitized_branch = self.sanitize_branch_name(
            request.branch_name or f"counterfactual/{slugify(cf_cand_rec.title)}",
            existing_branch_names,
        )

        # 2. Fork project via PersistenceService
        branch_create = BranchCreate(
            branch_name=sanitized_branch,
            branch_point_stage=4,
            rationale=request.rationale or f"Forked counterfactual timeline exploring '{cf_cand_rec.title}'",
        )
        child_project = await self.persistence_service.branch_project(project_id, branch_create)

        # 3. In child project, locate the cloned candidate corresponding to the selected counterfactual
        child_candidates = await self.repo.get_latest_world_candidates(child_project.id)
        target_child_cand: Optional[WorldCandidateRecord] = None
        for cand in child_candidates:
            if cand.candidate_index == cf_cand_rec.candidate_index or cand.title == cf_cand_rec.title:
                target_child_cand = cand
                break

        if not target_child_cand and child_candidates:
            target_child_cand = child_candidates[0]

        # Ensure child status allows selection
        child_project.status = "world_selected"
        self.repo.session.add(child_project)
        await self.repo.session.commit()
        await self.repo.session.refresh(child_project)

        if target_child_cand:
            # Save new world selection in child project
            await self.repo.save_world_selection(
                project_id=child_project.id,
                candidate_id=target_child_cand.id,
                user_rationale=request.rationale or f"Counterfactual timeline chosen: '{cf_cand_rec.title}'",
                creative_priorities=["Counterfactual Exploration", "Alternative Lore Focus"],
                rejected_directions=[f"Canon direction from parent: {parent.title}"],
                custom_directives="Explore counterfactual narrative path.",
            )

        # 4. Persist Counterfactual Metadata on Child Project
        metadata = CounterfactualMetadata(
            parent_project_id=project_id,
            counterfactual_candidate_id=cf_cand_rec.id,
            counterfactual_title=cf_cand_rec.title,
            forked_at=get_utc_now(),
            rationale=request.rationale,
        )
        child_project.counterfactual_metadata_json = metadata.model_dump_json()
        self.repo.session.add(child_project)
        await self.repo.session.commit()
        await self.repo.session.refresh(child_project)

        # 5. Return updated child project
        fresh_child = await self.repo.get_project(child_project.id)
        return fresh_child.to_read_schema()
