import json
import math
from typing import Any, Dict, List, Optional
from backend.app.models.memory import CreativeMemoryRecord
from backend.app.repositories.project_repo import ProjectRepository


class ContextConstructionService:
    """
    Constructs bounded, prioritized generation context from canonical creative memory (Tatva 2).
    Enforces a context budget (< 2,000 token ceiling, targeting ~1,500 tokens) using a deterministic
    character-based heuristic (~4 characters per token estimate).

    Token counts are documented and returned as estimates to avoid heavyweight external tokenizer
    binary dependencies (e.g. tiktoken or HuggingFace tokenizers).
    Creator locks (Priority 1) and hard negative constraints (Priority 2) are inviolable and are
    never discarded on overflow, guaranteeing that authorial intent and safety guardrails are always
    injected. Downstream lore (world rules, character profiles, relationships, timeline anchors)
    is bounded, truncated, or excluded when the budget is reached.
    """

    DEFAULT_BUDGET_TOKENS = 1500
    HARD_CEILING_TOKENS = 2000

    def __init__(self, repo: ProjectRepository):
        self.repo = repo

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Deterministic token estimator (~4 characters per token)."""
        if not text:
            return 0
        return max(1, math.ceil(len(text) / 4))

    async def get_memory(self, project_id: str) -> Optional[CreativeMemoryRecord]:
        """Fetch or lazily initialize creative memory."""
        return await self.repo.get_or_create_creative_memory(project_id)

    async def build_generation_context(
        self,
        project_id: str,
        operation_type: str,  # "character", "scene", "visual", "general"
        target_name: Optional[str] = None,
        target_id: Optional[str] = None,
        involved_characters: Optional[List[str]] = None,
        location_setting: Optional[str] = None,
        budget_tokens: int = DEFAULT_BUDGET_TOKENS,
    ) -> Dict[str, Any]:
        """
        Build prioritized, token-capped context block for generation prompts.
        Prioritizes:
          1. Creator locks & Human-Only Zones (Inviolable - never discarded on overflow)
          2. Hard negative constraints (Forbidden tropes/tech - strict guardrails, never discarded)
          3. Hard world laws (Physics & Ecology - truncated cleanly to fit remaining budget)
          4. Directly involved character profiles & visual anchors
          5. Relationship tensions between involved characters
          6. Timeline anchors
          7. General lore & secondary cast (truncated when budget is reached)
        """
        budget = min(budget_tokens, self.HARD_CEILING_TOKENS)
        memory = await self.get_memory(project_id)
        if not memory:
            return {
                "context_text": "",
                "estimated_tokens": 0,
                "budget_tokens": budget,
                "token_estimation_method": "character_heuristic_approx_4_chars_per_token",
                "included_sections": [],
                "excluded_count": 0,
            }

        # Parse memory structures safely
        try:
            creator_locks = json.loads(memory.creator_locks_json or "{}")
        except Exception:
            creator_locks = {}

        try:
            negative_constraints = json.loads(memory.negative_constraints_json or "[]")
        except Exception:
            negative_constraints = []

        try:
            canon_rules = json.loads(memory.canon_rules_json or "[]")
        except Exception:
            canon_rules = []

        try:
            character_profiles = json.loads(memory.character_profiles_json or "[]")
        except Exception:
            character_profiles = []

        try:
            relationship_matrix = json.loads(memory.relationship_matrix_json or "[]")
        except Exception:
            relationship_matrix = []

        try:
            timeline_anchors = json.loads(memory.timeline_anchors_json or "[]")
        except Exception:
            timeline_anchors = []

        sections: List[str] = []
        current_tokens = 0
        included_sections: List[str] = []
        excluded_count = 0

        # Header
        header = f"=== CANONICAL CREATIVE MEMORY (Target: {operation_type.upper()}) ===\n"
        sections.append(header)
        current_tokens += self.estimate_tokens(header)

        # -----------------------------------------------------------------
        # Priority 1: Creator Locks & Human-Only Zones (Inviolable)
        # Always included: overflow never silently discards creator locks
        # -----------------------------------------------------------------
        lock_lines = []
        if creator_locks.get("core_theme"):
            lock_lines.append(f"- Locked Core Theme: {creator_locks['core_theme']}")
        if creator_locks.get("protagonist_motivation"):
            lock_lines.append(f"- Locked Protagonist Motivation: {creator_locks['protagonist_motivation']}")
        if creator_locks.get("central_conflict"):
            lock_lines.append(f"- Locked Central Conflict: {creator_locks['central_conflict']}")
        if creator_locks.get("user_rationale"):
            lock_lines.append(f"- Creator Vision / Rationale: {creator_locks['user_rationale']}")
        if creator_locks.get("creative_priorities"):
            priorities_str = ", ".join(creator_locks["creative_priorities"])
            lock_lines.append(f"- Mandatory Creative Priorities: {priorities_str}")

        if lock_lines:
            block = "[CREATOR LOCKS & HUMAN-ONLY ZONES - INVIOLABLE]\n" + "\n".join(lock_lines) + "\n"
            block_tokens = self.estimate_tokens(block)
            sections.append(block)
            current_tokens += block_tokens
            included_sections.append("creator_locks")

        # -----------------------------------------------------------------
        # Priority 2: Hard Negative Constraints (Strict Guardrails)
        # Always included: guardrails are essential to prevent forbidden tropes
        # -----------------------------------------------------------------
        if negative_constraints:
            neg_lines = [f"- FORBIDDEN / REJECTED: {neg}" for neg in negative_constraints]
            block = "[NEGATIVE CONSTRAINTS - STRICT GUARDRAILS]\n" + "\n".join(neg_lines) + "\n"
            block_tokens = self.estimate_tokens(block)
            sections.append(block)
            current_tokens += block_tokens
            included_sections.append("negative_constraints")

        # -----------------------------------------------------------------
        # Priority 3: Hard World Laws (Physics, Ecology, Canon Rules)
        # -----------------------------------------------------------------
        rule_lines = []
        for r in canon_rules:
            rule_text = r.get("rule", "")
            cat = r.get("category", "world_law")
            if "NEGATIVE CONSTRAINT" in rule_text:
                continue  # already covered in negative constraints
            rule_lines.append(f"- [{cat.upper()}] {rule_text}")

        if rule_lines:
            block = "[INVIOLABLE WORLD RULES & CANON LAWS]\n" + "\n".join(rule_lines) + "\n"
            block_tokens = self.estimate_tokens(block)
            if current_tokens + block_tokens <= budget:
                sections.append(block)
                current_tokens += block_tokens
                included_sections.append("world_rules")
            else:
                # If entire block exceeds, include as many individual rules as fit
                partial_lines = []
                for line in rule_lines:
                    line_tok = self.estimate_tokens(line + "\n")
                    if current_tokens + line_tok <= budget:
                        partial_lines.append(line)
                        current_tokens += line_tok
                    elif current_tokens < budget:
                        # Cleanly truncate an unusually long individual rule to fit remaining budget
                        remaining_tokens = budget - current_tokens
                        if remaining_tokens >= 25:  # Only if at least ~100 characters can be retained
                            remaining_chars = remaining_tokens * 4
                            truncated_line = line[:remaining_chars].rstrip() + " ... [truncated to fit budget]"
                            trunc_tok = self.estimate_tokens(truncated_line + "\n")
                            partial_lines.append(truncated_line)
                            current_tokens += trunc_tok
                        excluded_count += 1
                    else:
                        excluded_count += 1
                if partial_lines:
                    sections.append("[INVIOLABLE WORLD RULES & CANON LAWS (PARTIAL)]\n" + "\n".join(partial_lines) + "\n")
                    included_sections.append("world_rules_partial")

        # -----------------------------------------------------------------
        # Priority 4: Relevant Character Profiles & Visual Anchors
        # -----------------------------------------------------------------
        # Identify directly relevant characters
        target_norm = (target_name or "").strip().lower()
        inv_chars_norm = [c.strip().lower() for c in (involved_characters or []) if c.strip()]

        relevant_chars: List[Dict[str, Any]] = []
        other_chars: List[Dict[str, Any]] = []

        for cp in character_profiles:
            c_name = cp.get("name", "").strip().lower()
            c_id = cp.get("character_id", "")
            if (target_norm and target_norm in c_name) or (target_id and target_id == c_id) or (c_name in inv_chars_norm):
                relevant_chars.append(cp)
            else:
                other_chars.append(cp)

        # In scene or character generation, prioritize relevant characters first
        char_order = relevant_chars + other_chars
        char_lines = []
        for cp in char_order:
            flaws_str = f" | Flaws: {', '.join(cp.get('flaws', []))}" if cp.get("flaws") else ""
            locked_str = " [LOCKED]" if cp.get("is_locked") else ""
            visual_str = f"\n  Visual Anchor: {cp['visual_prompt']}" if cp.get("visual_prompt") and operation_type in ["visual", "scene"] else ""
            char_entry = (
                f"- {cp.get('name')} ({cp.get('role')}, {cp.get('archetype')}){locked_str}:\n"
                f"  Motivation: {cp.get('motivation')}\n"
                f"  Core Conflict: {cp.get('core_conflict')}{flaws_str}{visual_str}"
            )
            char_tok = self.estimate_tokens(char_entry + "\n")
            if current_tokens + char_tok <= budget:
                char_lines.append(char_entry)
                current_tokens += char_tok
            else:
                excluded_count += 1

        if char_lines:
            sections.append("[CHARACTER PROFILES & MOTIVATIONS]\n" + "\n".join(char_lines) + "\n")
            included_sections.append("character_profiles")

        # -----------------------------------------------------------------
        # Priority 5: Dynamic Relationship Tensions
        # -----------------------------------------------------------------
        rel_lines = []
        for r in relationship_matrix:
            src = r.get("source_character_name", "")
            tgt = r.get("target_character_name", "")
            is_rel_relevant = (
                (src.lower() in inv_chars_norm or tgt.lower() in inv_chars_norm)
                or (target_norm and (target_norm in src.lower() or target_norm in tgt.lower()))
            )
            rel_entry = f"- {src} <-> {tgt} [{r.get('relation_type')} - Tension: {r.get('tension_level', 'medium')}]: {r.get('dynamic_description')}"
            rel_tok = self.estimate_tokens(rel_entry + "\n")

            if is_rel_relevant or not inv_chars_norm:
                if current_tokens + rel_tok <= budget:
                    rel_lines.append(rel_entry)
                    current_tokens += rel_tok
                else:
                    excluded_count += 1
            else:
                # Lower priority relationship
                if current_tokens + rel_tok <= budget:
                    rel_lines.append(rel_entry)
                    current_tokens += rel_tok
                else:
                    excluded_count += 1

        if rel_lines:
            sections.append("[CHARACTER RELATIONSHIP DYNAMICS & TENSIONS]\n" + "\n".join(rel_lines) + "\n")
            included_sections.append("relationships")

        # -----------------------------------------------------------------
        # Priority 6: Timeline Anchors
        # -----------------------------------------------------------------
        time_lines = []
        for t in timeline_anchors:
            time_entry = f"- [{t.get('era', 'Era')}] {t.get('event', '')}"
            time_tok = self.estimate_tokens(time_entry + "\n")
            if current_tokens + time_tok <= budget:
                time_lines.append(time_entry)
                current_tokens += time_tok
            else:
                excluded_count += 1

        if time_lines:
            sections.append("[CHRONOLOGICAL TIMELINE ANCHORS]\n" + "\n".join(time_lines) + "\n")
            included_sections.append("timeline_anchors")

        # Footer
        footer = "====================================================\n"
        sections.append(footer)

        final_context_text = "\n".join(sections)
        final_tokens = self.estimate_tokens(final_context_text)

        return {
            "context_text": final_context_text,
            "estimated_tokens": final_tokens,
            "budget_tokens": budget,
            "token_estimation_method": "character_heuristic_approx_4_chars_per_token",
            "included_sections": included_sections,
            "excluded_count": excluded_count,
        }

    async def build_character_context(
        self,
        project_id: str,
        character_id: Optional[str] = None,
        character_name: Optional[str] = None,
        budget_tokens: int = DEFAULT_BUDGET_TOKENS,
    ) -> Dict[str, Any]:
        """Specialized context for character refinement and introduction."""
        return await self.build_generation_context(
            project_id=project_id,
            operation_type="character",
            target_id=character_id,
            target_name=character_name,
            budget_tokens=budget_tokens,
        )

    async def build_scene_context(
        self,
        project_id: str,
        location_setting: Optional[str] = None,
        characters_involved: Optional[List[str]] = None,
        budget_tokens: int = DEFAULT_BUDGET_TOKENS,
    ) -> Dict[str, Any]:
        """Specialized context for scene generation and dramatic beat expansion."""
        return await self.build_generation_context(
            project_id=project_id,
            operation_type="scene",
            location_setting=location_setting,
            involved_characters=characters_involved,
            budget_tokens=budget_tokens,
        )

    async def build_visual_prompt_context(
        self,
        project_id: str,
        entity_name: Optional[str] = None,
        budget_tokens: int = DEFAULT_BUDGET_TOKENS,
    ) -> Dict[str, Any]:
        """Specialized context for visual concept art and prompt synthesis."""
        return await self.build_generation_context(
            project_id=project_id,
            operation_type="visual",
            target_name=entity_name,
            budget_tokens=budget_tokens,
        )
