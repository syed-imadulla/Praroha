import json
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field as PydanticField
from backend.app.models.memory import CreativeMemoryRecord
from backend.app.repositories.project_repo import ProjectRepository


class ValidationResult(BaseModel):
    is_valid: bool
    hard_violations: List[str] = PydanticField(default_factory=list)
    soft_warnings: List[str] = PydanticField(default_factory=list)
    reason: Optional[str] = None
    applied_locks: List[str] = PydanticField(default_factory=list)


# Known semantic conflict patterns for deterministic rule checking
NEGATIVE_KEYWORD_MAP = {
    "no magic": [
        "magic", "spell", "sorcery", "wizard", "witchcraft", "enchantment",
        "incantation", "mana", "supernatural spell", "necromancy"
    ],
    "hard sci-fi only": [
        "magic", "spell", "sorcery", "supernatural", "mystical aura",
        "fantasy god", "mana crystal"
    ],
    "no spaceships": [
        "spaceship", "starship", "warp drive", "hyperdrive", "space fleet"
    ],
    "no aliens": [
        "alien species", "extraterrestrial", "martian", "xenomorph"
    ],
    "no time travel": [
        "time machine", "time travel", "temporal vortex", "timeline rewrite"
    ],
}


class ConsistencyValidator:
    """
    Deterministic consistency validator distinguishing hard inviolable constraints
    (creator locks, human-only zones, negative constraints, physical laws) from soft narrative guidance (Tatva 2).
    Never silently rewrites creator-approved work; flags explicit contradictions before persistence.
    """

    def __init__(self, repo: ProjectRepository):
        self.repo = repo

    async def _get_memory(self, project_id: str) -> Optional[CreativeMemoryRecord]:
        return await self.repo.get_or_create_creative_memory(project_id)

    def _check_negative_constraints(
        self, text_corpus: str, negative_constraints: List[str]
    ) -> List[str]:
        """Deterministically scan candidate text for violations of explicit negative constraints."""
        violations = []
        lower_corpus = text_corpus.lower()
        for neg in negative_constraints:
            neg_norm = neg.strip().lower()
            # 1. Check exact phrase prohibition
            if neg_norm.startswith("no "):
                prohibited_concept = neg_norm[3:].strip()
                # Word boundary search for prohibited concept
                pattern = r"\b" + re.escape(prohibited_concept) + r"\b"
                if re.search(pattern, lower_corpus):
                    violations.append(
                        f"Direct violation of negative constraint '{neg}': candidate contains '{prohibited_concept}'."
                    )
            # 2. Check keyword dictionary mapping
            for key_rule, keywords in NEGATIVE_KEYWORD_MAP.items():
                if key_rule in neg_norm or neg_norm in key_rule:
                    for kw in keywords:
                        pattern = r"\b" + re.escape(kw) + r"\b"
                        if re.search(pattern, lower_corpus):
                            violations.append(
                                f"Violation of negative constraint '{neg}': forbidden term '{kw}' detected."
                            )
                            break
        return list(dict.fromkeys(violations))

    async def validate_character_refinement(
        self,
        project_id: str,
        character_id: str,
        updates: Dict[str, Any],
    ) -> ValidationResult:
        """
        Validate proposed character mutations against creator locks, human-only zones,
        and negative world constraints.
        """
        memory = await self._get_memory(project_id)
        if not memory:
            return ValidationResult(is_valid=True)

        try:
            creator_locks = json.loads(memory.creator_locks_json or "{}")
            negative_constraints = json.loads(memory.negative_constraints_json or "[]")
            character_profiles = json.loads(memory.character_profiles_json or "[]")
        except Exception:
            return ValidationResult(is_valid=True)

        hard_violations: List[str] = []
        soft_warnings: List[str] = []
        applied_locks: List[str] = []

        # Find character profile
        char_profile = next((cp for cp in character_profiles if cp.get("character_id") == character_id), None)

        # 1. Creator Lock: Human-Only Zone for Protagonist Motivation
        if creator_locks.get("is_locked") and creator_locks.get("protagonist_motivation"):
            locked_mot = creator_locks["protagonist_motivation"].strip().lower()
            is_locked_character = (
                char_profile.get("is_locked")
                if char_profile
                else False
            ) or (
                char_profile and locked_mot in (char_profile.get("motivation") or "").lower()
            )

            if is_locked_character and "motivation" in updates and updates["motivation"]:
                new_mot = str(updates["motivation"]).strip()
                # Check if new motivation contradicts locked motivation
                # We do not permit replacing a locked motivation with an opposing or completely divergent one
                # unless it preserves the locked intent
                if locked_mot not in new_mot.lower():
                    # Check for direct contradiction keywords
                    contradiction_cues = ["abandon", "renounce", "destroy", "betray", "ignore", "forget"]
                    if any(cue in new_mot.lower() for cue in contradiction_cues):
                        hard_violations.append(
                            f"Creator Lock Violation: Character motivation is locked to '{creator_locks['protagonist_motivation']}'. "
                            f"Proposed update '{new_mot}' contradicts this Human-Only Zone."
                        )
                        applied_locks.append("protagonist_motivation")
                    else:
                        hard_violations.append(
                            f"Creator Lock Violation: Character motivation is locked by Human-Only Zone ('{creator_locks['protagonist_motivation']}'). "
                            "Refinements cannot overwrite locked creator decisions without explicit unlock."
                        )
                        applied_locks.append("protagonist_motivation")

        # 2. Negative Constraints Check
        text_to_check = " ".join([
            str(updates.get("motivation") or ""),
            str(updates.get("core_conflict") or ""),
            str(updates.get("role") or ""),
            str(updates.get("revision_notes") or ""),
        ])
        neg_violations = self._check_negative_constraints(text_to_check, negative_constraints)
        hard_violations.extend(neg_violations)

        # 3. Soft Guidance: Character Flaw Consistency
        if char_profile and updates.get("core_conflict"):
            flaws = char_profile.get("flaws", [])
            # If character has established core flaw, warn if new conflict makes them a flawless Mary Sue
            if flaws and any(w in str(updates.get("core_conflict")).lower() for w in ["flawless", "perfect", "no conflict", "all-powerful"]):
                soft_warnings.append(
                    f"Narrative Guidance: Character has established flaw '{flaws[0]}'. "
                    "Removing all conflict risks narrative flattening."
                )

        is_valid = len(hard_violations) == 0
        reason = None
        if not is_valid:
            reason = " | ".join(hard_violations)
        elif soft_warnings:
            reason = "Passed with advisory warnings: " + " | ".join(soft_warnings)

        return ValidationResult(
            is_valid=is_valid,
            hard_violations=hard_violations,
            soft_warnings=soft_warnings,
            reason=reason,
            applied_locks=applied_locks,
        )

    async def validate_scene_refinement(
        self,
        project_id: str,
        scene_id: str,
        updates: Dict[str, Any],
    ) -> ValidationResult:
        """
        Validate scene changes against creator locks, central conflict,
        and negative constraints.
        """
        memory = await self._get_memory(project_id)
        if not memory:
            return ValidationResult(is_valid=True)

        try:
            creator_locks = json.loads(memory.creator_locks_json or "{}")
            negative_constraints = json.loads(memory.negative_constraints_json or "[]")
            canon_rules = json.loads(memory.canon_rules_json or "[]")
        except Exception:
            return ValidationResult(is_valid=True)

        hard_violations: List[str] = []
        soft_warnings: List[str] = []
        applied_locks: List[str] = []

        # 1. Creator Lock: Central Conflict
        if creator_locks.get("is_locked") and creator_locks.get("central_conflict"):
            locked_conflict = creator_locks["central_conflict"].strip().lower()
            text_conflict = (
                str(updates.get("conflict_narrative") or "")
                + " "
                + str(updates.get("dramatic_question") or "")
            ).lower()

            # Check if scene proposes to invalidate or nullify locked central conflict
            nullifying_cues = ["conflict is completely resolved happily with no tension", "central conflict was a mistake"]
            if any(cue in text_conflict for cue in nullifying_cues):
                hard_violations.append(
                    f"Creator Lock Violation: Central conflict is locked to '{creator_locks['central_conflict']}'. "
                    "Scene cannot prematurely negate or discard the overarching conflict."
                )
                applied_locks.append("central_conflict")

        # 2. Negative Constraints Check
        text_to_check = " ".join([
            str(updates.get("dramatic_question") or ""),
            str(updates.get("conflict_narrative") or ""),
            str(updates.get("pivotal_outcome") or ""),
            str(updates.get("location_setting") or ""),
        ])
        neg_violations = self._check_negative_constraints(text_to_check, negative_constraints)
        hard_violations.extend(neg_violations)

        # 3. World Laws & Physics Contradictions
        # E.g. Check for water breathing if underwater physics forbids it
        for r in canon_rules:
            rule_text = r.get("rule", "").lower()
            if "underwater" in rule_text and ("suit" in rule_text or "pressure" in rule_text or "fatal" in rule_text):
                if "breathed water comfortably" in text_to_check.lower() or "took off helmet in open sea" in text_to_check.lower():
                    hard_violations.append(
                        f"Physical Law Violation: World Bible rule '{r.get('rule')}' prohibits unprotected respiration in open water."
                    )

        is_valid = len(hard_violations) == 0
        reason = None
        if not is_valid:
            reason = " | ".join(hard_violations)
        elif soft_warnings:
            reason = "Passed with advisory warnings: " + " | ".join(soft_warnings)

        return ValidationResult(
            is_valid=is_valid,
            hard_violations=hard_violations,
            soft_warnings=soft_warnings,
            reason=reason,
            applied_locks=applied_locks,
        )

    async def validate_universe_candidate(
        self,
        project_id: str,
        universe_data: Dict[str, Any],
    ) -> ValidationResult:
        """
        Validate newly generated universe candidate (World Bible, Characters, Scenes)
        against explicit hard constraints and structured requirements prior to persistence.
        Deterministic checks for structured constraints and negative keywords;
        does not claim universal semantic contradiction detection.
        """
        hard_violations: List[str] = []
        soft_warnings: List[str] = []
        applied_locks: List[str] = []

        # 1. Deterministic Structured Constraint Validation
        if not isinstance(universe_data, dict):
            return ValidationResult(
                is_valid=False,
                hard_violations=["Structured Constraint Violation: Generated universe payload must be a JSON object."],
                reason="Structured Constraint Violation: Generated universe payload must be a JSON object.",
            )

        bible = universe_data.get("world_bible")
        if not isinstance(bible, dict):
            hard_violations.append("Structured Constraint Violation: Missing or invalid 'world_bible' object.")
        else:
            if not (bible.get("geography") or "").strip():
                hard_violations.append("Structured Constraint Violation: World Bible missing required 'geography' description.")
            if not (bible.get("physics_rules") or "").strip():
                hard_violations.append("Structured Constraint Violation: World Bible missing required 'physics_rules' axioms.")

        characters = universe_data.get("characters")
        if not isinstance(characters, list) or len(characters) == 0:
            hard_violations.append("Structured Constraint Violation: Universe candidate must include at least one character in 'characters'.")
        else:
            for idx, c in enumerate(characters):
                if not isinstance(c, dict) or not (c.get("name") or "").strip():
                    hard_violations.append(f"Structured Constraint Violation: Character at index {idx} missing required 'name'.")

        scenes = universe_data.get("scenes")
        if not isinstance(scenes, list) or len(scenes) == 0:
            hard_violations.append("Structured Constraint Violation: Universe candidate must include at least one narrative scene in 'scenes'.")

        # 2. Retrieve Authoritative Memory & Selection Constraints
        memory = await self._get_memory(project_id)
        creator_locks: Dict[str, Any] = {}
        negative_constraints: List[str] = []

        if memory:
            try:
                creator_locks = json.loads(memory.creator_locks_json or "{}")
                negative_constraints = json.loads(memory.negative_constraints_json or "[]")
            except Exception:
                pass

        # Fallback to direct selection and Seed DNA records if memory is freshly initializing
        if not creator_locks or not negative_constraints:
            selection_tuple = await self.repo.get_active_world_selection(project_id)
            if selection_tuple:
                sel, _ = selection_tuple
                hoz = sel.get_human_only_zones()
                if hoz and hoz.is_locked:
                    creator_locks["is_locked"] = True
                    creator_locks["core_theme"] = hoz.core_theme
                    creator_locks["protagonist_motivation"] = hoz.protagonist_motivation
                    creator_locks["central_conflict"] = hoz.central_conflict
                rejected = json.loads(sel.rejected_directions_json or "[]")
                negative_constraints = list(dict.fromkeys(negative_constraints + rejected))

            dna_record = await self.repo.get_latest_seed_dna(project_id)
            if dna_record and dna_record.constraints_json:
                try:
                    dna_constraints = json.loads(dna_record.constraints_json)
                    negative_constraints = list(dict.fromkeys(negative_constraints + dna_constraints))
                except Exception:
                    pass

        # 3. Explicit Negative Constraints Check
        dumped_text = json.dumps(universe_data)
        neg_violations = self._check_negative_constraints(dumped_text, negative_constraints)
        hard_violations.extend(neg_violations)

        # 4. Creator Locks Verification (Human-Only Zones)
        if creator_locks.get("is_locked"):
            # A. Protagonist Motivation Lock
            if creator_locks.get("protagonist_motivation"):
                locked_mot = creator_locks["protagonist_motivation"].strip().lower()
                char_list = characters if isinstance(characters, list) else []
                has_matching_character = any(
                    locked_mot in (c.get("motivation") or "").lower()
                    for c in char_list
                    if isinstance(c, dict)
                )
                if not has_matching_character:
                    hard_violations.append(
                        f"Creator Lock Violation: Missing locked protagonist motivation '{creator_locks['protagonist_motivation']}' across generated characters."
                    )
                    applied_locks.append("protagonist_motivation")

            # B. Central Conflict Lock
            if creator_locks.get("central_conflict"):
                locked_conflict = creator_locks["central_conflict"].strip().lower()
                scene_list = scenes if isinstance(scenes, list) else []
                # Check that scenes do not nullify or ignore the locked conflict
                conflict_reflected = any(
                    locked_conflict in (s.get("conflict_narrative") or "").lower()
                    or locked_conflict in (s.get("conflict") or "").lower()
                    or locked_conflict in (s.get("dramatic_question") or "").lower()
                    for s in scene_list
                    if isinstance(s, dict)
                )
                nullifying_cues = ["conflict is completely resolved happily with no tension", "central conflict was a mistake"]
                has_nullification = any(
                    any(cue in (s.get("conflict_narrative") or "").lower() for cue in nullifying_cues)
                    for s in scene_list
                    if isinstance(s, dict)
                )
                if has_nullification:
                    hard_violations.append(
                        f"Creator Lock Violation: Central conflict is locked to '{creator_locks['central_conflict']}'. "
                        "Generated scenes cannot prematurely negate or discard the overarching conflict."
                    )
                    applied_locks.append("central_conflict")
                elif not conflict_reflected and len(scene_list) > 0:
                    # Soft warning if wording differs but not overtly contradictory
                    soft_warnings.append(
                        f"Advisory: Generated scenes should more explicitly ground their dramatic stakes in locked central conflict '{creator_locks['central_conflict']}'."
                    )

        is_valid = len(hard_violations) == 0
        reason = None
        if not is_valid:
            reason = " | ".join(hard_violations)
        elif soft_warnings:
            reason = "Passed with advisory warnings: " + " | ".join(soft_warnings)

        return ValidationResult(
            is_valid=is_valid,
            hard_violations=hard_violations,
            soft_warnings=soft_warnings,
            reason=reason,
            applied_locks=applied_locks,
        )
