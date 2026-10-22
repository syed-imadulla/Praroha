import json
import re
from typing import Any, Dict, List, Optional, Set

from sqlmodel import select

from backend.app.models.dependency import (
    ImpactClassification,
    ImpactedNodeRead,
    ImpactPreviewRequest,
    ImpactPreviewResponse,
)
from backend.app.models.media import MediaAssetRecord
from backend.app.models.memory import CreativeMemoryRecord
from backend.app.models.selection import WorldSelectionRecord
from backend.app.models.unfold import (
    CharacterRecord,
    CharacterRelationshipRecord,
    SceneRecord,
    WorldBibleRecord,
)
from backend.app.repositories.project_repo import ProjectRepository


class DependencyGraphService:
    """
    Computes dependency blast radius and change impact across the creative universe DAG (ADR-002, Tatva 2).
    Evaluates verified causal links, canon rule dependencies, and interpersonal couplings.
    Treats ambiguous provenance conservatively and strictly protects locked Human-Only Zones.
    Pure read-only analysis with zero persistent database side-effects.
    """

    def __init__(self, repo: ProjectRepository):
        self.repo = repo

    @staticmethod
    def _extract_keywords(text: str) -> Set[str]:
        """Extract meaningful semantic tokens for deterministic keyword overlap analysis."""
        if not text:
            return set()
        words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
        stop_words = {
            "this", "that", "with", "from", "have", "were", "been", "must", "they", "their",
            "which", "would", "could", "should", "there", "where", "about", "under", "these",
            "other", "after", "before", "through", "during", "while", "every", "within",
        }
        return {w for w in words if w not in stop_words}

    async def analyze_impact(
        self,
        project_id: str,
        request: ImpactPreviewRequest,
    ) -> ImpactPreviewResponse:
        """
        Analyze the direct and transitive blast radius of a proposed upstream mutation.
        Classifies all downstream nodes into AFFECTED, CONDITIONAL, or PRESERVED.
        """
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        # 1. Fetch Universe Entities
        bible = await self.repo.get_latest_world_bible(project_id)
        selection_tuple = await self.repo.get_active_world_selection(project_id)

        # Creator locks from selection or memory
        hoz_locked_motivation: Optional[str] = None
        hoz_locked_conflict: Optional[str] = None
        hoz_locked_theme: Optional[str] = None
        is_hoz_locked: bool = False

        if selection_tuple:
            sel, _ = selection_tuple
            hoz = sel.get_human_only_zones()
            if hoz and hoz.is_locked:
                is_hoz_locked = True
                hoz_locked_motivation = (hoz.protagonist_motivation or "").strip().lower()
                hoz_locked_conflict = (hoz.central_conflict or "").strip().lower()
                hoz_locked_theme = (hoz.core_theme or "").strip().lower()

        char_stmt = (
            select(CharacterRecord)
            .where(CharacterRecord.project_id == project_id)
            .order_by(CharacterRecord.created_at.asc())
        )
        characters = list((await self.repo.session.execute(char_stmt)).scalars().all())

        rel_stmt = (
            select(CharacterRelationshipRecord)
            .where(CharacterRelationshipRecord.project_id == project_id)
            .order_by(CharacterRelationshipRecord.created_at.asc())
        )
        relationships = list((await self.repo.session.execute(rel_stmt)).scalars().all())

        scene_stmt = (
            select(SceneRecord)
            .where(SceneRecord.project_id == project_id)
            .order_by(SceneRecord.scene_number.asc())
        )
        scenes = list((await self.repo.session.execute(scene_stmt)).scalars().all())

        media_stmt = (
            select(MediaAssetRecord)
            .where(MediaAssetRecord.project_id == project_id)
            .order_by(MediaAssetRecord.created_at.asc())
        )
        media_assets = list((await self.repo.session.execute(media_stmt)).scalars().all())

        affected_nodes: List[ImpactedNodeRead] = []
        conditional_nodes: List[ImpactedNodeRead] = []
        preserved_nodes: List[ImpactedNodeRead] = []
        ambiguity_warnings: List[str] = []
        locked_node_count = 0

        up_type = request.upstream_entity_type.strip().lower()
        change_text = " ".join([str(v) for v in request.proposed_change.values()])
        change_keywords = self._extract_keywords(change_text)
        change_summary = request.change_summary or f"Proposed modification to {up_type}"

        # -------------------------------------------------------------
        # Scenario A: World Bible Modification (e.g. Physics / Ecology)
        # -------------------------------------------------------------
        if up_type == "world_bible":
            # Upstream Bible itself is the locus of change
            if bible:
                bible_node = ImpactedNodeRead(
                    entity_id=bible.id,
                    entity_type="world_bible",
                    name_or_title="World Bible & Laws",
                    classification="AFFECTED",
                    reason="Root locus of proposed canon rule modification.",
                    link_type="CAUSAL_DIRECT",
                    is_locked=getattr(bible, "is_locked", False),
                    is_approved=False,
                    confidence=1.0,
                    current_version=getattr(bible, "version", 1),
                    provenance_summary="World Bible",
                )
                affected_nodes.append(bible_node)

            # Analyze Characters
            for c in characters:
                c_is_locked = (
                    getattr(c, "is_locked", False)
                    or (c.origin_source and "Human-Only Zone" in c.origin_source)
                    or (is_hoz_locked and hoz_locked_motivation and hoz_locked_motivation in c.motivation.lower())
                )
                if c_is_locked:
                    locked_node_count += 1
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=c.id,
                            entity_type="character",
                            name_or_title=c.name,
                            classification="PRESERVED",
                            reason="Protected by Human-Only Zone / creator lock. Preserved by default against canon drift.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=True,
                            is_approved=getattr(c, "is_approved", False),
                            confidence=1.0,
                            current_version=c.version,
                            provenance_summary=c.origin_source,
                        )
                    )
                    continue

                # Check if character motivation, conflict, or visual prompt depends on changed rule
                char_corpus = f"{c.motivation} {c.core_conflict} {c.role} {c.archetype} {c.visual_prompt}".lower()
                overlap = change_keywords.intersection(self._extract_keywords(char_corpus))

                if overlap:
                    conditional_nodes.append(
                        ImpactedNodeRead(
                            entity_id=c.id,
                            entity_type="character",
                            name_or_title=c.name,
                            classification="CONDITIONAL",
                            reason=f"Character concepts overlap with updated canon terms ({', '.join(sorted(list(overlap))[:3])}). Creator review advised.",
                            link_type="CANON_RULE",
                            is_locked=False,
                            is_approved=getattr(c, "is_approved", False),
                            confidence=0.8,
                            current_version=c.version,
                            provenance_summary=c.origin_source,
                        )
                    )
                else:
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=c.id,
                            entity_type="character",
                            name_or_title=c.name,
                            classification="PRESERVED",
                            reason="Character backstory, motivation, and conflicts operate independently from this world rule.",
                            link_type="CANON_RULE",
                            is_locked=False,
                            is_approved=getattr(c, "is_approved", False),
                            confidence=0.9,
                            current_version=c.version,
                            provenance_summary=c.origin_source,
                        )
                    )

            # Analyze Scenes
            for s in scenes:
                s_is_locked = (
                    getattr(s, "is_locked", False)
                    or (s.origin_source and "Human-Only Zone" in s.origin_source)
                    or (is_hoz_locked and hoz_locked_conflict and hoz_locked_conflict in s.conflict_narrative.lower())
                )
                if s_is_locked:
                    locked_node_count += 1
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="PRESERVED",
                            reason="Locked by Human-Only Zone / creator lock. Protected from automated modification.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=True,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=1.0,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )
                    continue

                scene_corpus = f"{s.location_setting} {s.conflict_narrative} {s.dramatic_question} {s.pivotal_outcome} {s.visual_prompt}".lower()
                overlap = change_keywords.intersection(self._extract_keywords(scene_corpus))

                # Check for explicit physical law conflict cues
                physics_change = str(request.proposed_change.get("physics_rules") or "").lower()
                has_direct_law_link = False
                if physics_change:
                    # E.g. pressure suits, underwater, magic, oxygen, gravity
                    for key in ["pressure", "water", "gravity", "magic", "oxygen", "breathe", "radiation", "vacuum", "fog", "bioluminescence"]:
                        if key in physics_change and key in scene_corpus:
                            has_direct_law_link = True
                            break

                if has_direct_law_link:
                    affected_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="AFFECTED",
                            reason=f"Scene narrative relies directly on modified physical rule: '{physics_change[:60]}...'",
                            link_type="CANON_RULE",
                            is_locked=False,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=0.95,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )
                elif overlap:
                    conditional_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="CONDITIONAL",
                            reason=f"Scene setting or dramatic action mentions terms touched by canon update ({', '.join(sorted(list(overlap))[:3])}).",
                            link_type="CANON_RULE",
                            is_locked=False,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=0.75,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )
                else:
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="PRESERVED",
                            reason="Scene dramatic conflict and setting are unaffected by the modified physical law.",
                            link_type="CANON_RULE",
                            is_locked=False,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=0.9,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )

            # Analyze Relationships
            affected_char_ids = {n.entity_id for n in affected_nodes if n.entity_type == "character"}
            conditional_char_ids = {n.entity_id for n in conditional_nodes if n.entity_type == "character"}
            for r in relationships:
                if r.source_character_id in affected_char_ids or r.target_character_id in affected_char_ids:
                    conditional_nodes.append(
                        ImpactedNodeRead(
                            entity_id=r.id,
                            entity_type="relationship",
                            name_or_title=f"{r.source_character_name or 'Char A'} ↔ {r.target_character_name or 'Char B'}",
                            classification="CONDITIONAL",
                            reason="Involves a character whose core traits are affected by the world change.",
                            link_type="RELATIONSHIP",
                            is_locked=False,
                            is_approved=False,
                            confidence=0.8,
                            current_version=1,
                            provenance_summary="Interpersonal Dynamic",
                        )
                    )
                else:
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=r.id,
                            entity_type="relationship",
                            name_or_title=f"{r.source_character_name or 'Char A'} ↔ {r.target_character_name or 'Char B'}",
                            classification="PRESERVED",
                            reason="Both participating characters remain preserved; dynamic tension intact.",
                            link_type="RELATIONSHIP",
                            is_locked=False,
                            is_approved=False,
                            confidence=1.0,
                            current_version=1,
                            provenance_summary="Interpersonal Dynamic",
                        )
                    )

        # -------------------------------------------------------------
        # Scenario B: Character Modification
        # -------------------------------------------------------------
        elif up_type == "character":
            target_char = next((c for c in characters if c.id == request.upstream_entity_id), None)
            target_name = target_char.name.strip().lower() if target_char else ""

            for c in characters:
                if c.id == request.upstream_entity_id:
                    c_is_locked = (
                        getattr(c, "is_locked", False)
                        or (c.origin_source and "Human-Only Zone" in c.origin_source)
                        or (is_hoz_locked and hoz_locked_motivation and hoz_locked_motivation in c.motivation.lower())
                    )
                    if c_is_locked:
                        locked_node_count += 1
                    affected_nodes.append(
                        ImpactedNodeRead(
                            entity_id=c.id,
                            entity_type="character",
                            name_or_title=c.name,
                            classification="AFFECTED",
                            reason="Direct upstream target of proposed mutation.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=c_is_locked,
                            is_approved=getattr(c, "is_approved", False),
                            confidence=1.0,
                            current_version=c.version,
                            provenance_summary=c.origin_source,
                        )
                    )
                else:
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=c.id,
                            entity_type="character",
                            name_or_title=c.name,
                            classification="PRESERVED",
                            reason="Peer character with independent arc and motivation.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=getattr(c, "is_locked", False),
                            is_approved=getattr(c, "is_approved", False),
                            confidence=1.0,
                            current_version=c.version,
                            provenance_summary=c.origin_source,
                        )
                    )

            # Relationships involving this character
            for r in relationships:
                is_involved = (
                    r.source_character_id == request.upstream_entity_id
                    or r.target_character_id == request.upstream_entity_id
                )
                if is_involved:
                    affected_nodes.append(
                        ImpactedNodeRead(
                            entity_id=r.id,
                            entity_type="relationship",
                            name_or_title=f"{r.source_character_name or 'Char A'} ↔ {r.target_character_name or 'Char B'}",
                            classification="AFFECTED",
                            reason=f"Directly links to modified character '{target_char.name if target_char else 'target'}'.",
                            link_type="RELATIONSHIP",
                            is_locked=False,
                            is_approved=False,
                            confidence=1.0,
                            current_version=1,
                            provenance_summary="Interpersonal Dynamic",
                        )
                    )
                else:
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=r.id,
                            entity_type="relationship",
                            name_or_title=f"{r.source_character_name or 'Char A'} ↔ {r.target_character_name or 'Char B'}",
                            classification="PRESERVED",
                            reason="Independent relationship not involving modified character.",
                            link_type="RELATIONSHIP",
                            is_locked=False,
                            is_approved=False,
                            confidence=1.0,
                            current_version=1,
                            provenance_summary="Interpersonal Dynamic",
                        )
                    )

            # Scenes involving this character
            for s in scenes:
                s_is_locked = (
                    getattr(s, "is_locked", False)
                    or (s.origin_source and "Human-Only Zone" in s.origin_source)
                )
                if s_is_locked:
                    locked_node_count += 1
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="PRESERVED",
                            reason="Locked by Human-Only Zone / creator lock. Protected from automated modification.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=True,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=1.0,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )
                    continue

                try:
                    involved_names = [n.strip().lower() for n in json.loads(s.characters_involved_json or "[]")]
                except Exception:
                    involved_names = []

                # Exact case-insensitive matching to prevent substring false-positives
                is_char_in_scene = target_name and any(target_name == inv for inv in involved_names)

                if is_char_in_scene:
                    affected_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="AFFECTED",
                            reason=f"Features modified character '{target_char.name if target_char else 'target'}'.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=False,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=1.0,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )
                else:
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="PRESERVED",
                            reason=f"Scene does not involve modified character '{target_char.name if target_char else 'target'}'.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=False,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=0.95,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )

            if bible:
                preserved_nodes.append(
                    ImpactedNodeRead(
                        entity_id=bible.id,
                        entity_type="world_bible",
                        name_or_title="World Bible & Laws",
                        classification="PRESERVED",
                        reason="Upstream World Bible laws are not mutated by downstream character refinement.",
                        link_type="CAUSAL_DIRECT",
                        is_locked=getattr(bible, "is_locked", False),
                        is_approved=False,
                        confidence=1.0,
                        current_version=getattr(bible, "version", 1),
                        provenance_summary="World Bible",
                    )
                )

        # -------------------------------------------------------------
        # Scenario C: Seed DNA / Generic Upstream Modification
        # -------------------------------------------------------------
        else:
            ambiguity_warnings.append(
                f"Upstream entity type '{up_type}' represents an exploratory or high-level premise shift. Conservative impact assessment applied."
            )
            if bible:
                affected_nodes.append(
                    ImpactedNodeRead(
                        entity_id=bible.id,
                        entity_type="world_bible",
                        name_or_title="World Bible & Laws",
                        classification="AFFECTED",
                        reason="World Bible canon derives directly from Seed DNA foundation.",
                        link_type="CAUSAL_DIRECT",
                        is_locked=getattr(bible, "is_locked", False),
                        is_approved=False,
                        confidence=0.9,
                        current_version=getattr(bible, "version", 1),
                        provenance_summary="World Bible",
                    )
                )
            for c in characters:
                if getattr(c, "is_locked", False) or (c.origin_source and "Human-Only Zone" in c.origin_source):
                    locked_node_count += 1
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=c.id,
                            entity_type="character",
                            name_or_title=c.name,
                            classification="PRESERVED",
                            reason="Locked by Human-Only Zone / creator lock.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=True,
                            is_approved=getattr(c, "is_approved", False),
                            confidence=1.0,
                            current_version=c.version,
                            provenance_summary=c.origin_source,
                        )
                    )
                else:
                    conditional_nodes.append(
                        ImpactedNodeRead(
                            entity_id=c.id,
                            entity_type="character",
                            name_or_title=c.name,
                            classification="CONDITIONAL",
                            reason="Underlying premise updated; character alignment should be verified.",
                            link_type="HEURISTIC_AMBIGUOUS",
                            is_locked=False,
                            is_approved=getattr(c, "is_approved", False),
                            confidence=0.5,
                            current_version=c.version,
                            provenance_summary=c.origin_source,
                        )
                    )
            for s in scenes:
                if getattr(s, "is_locked", False) or (s.origin_source and "Human-Only Zone" in s.origin_source):
                    locked_node_count += 1
                    preserved_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="PRESERVED",
                            reason="Locked by Human-Only Zone / creator lock.",
                            link_type="CAUSAL_DIRECT",
                            is_locked=True,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=1.0,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )
                else:
                    conditional_nodes.append(
                        ImpactedNodeRead(
                            entity_id=s.id,
                            entity_type="scene",
                            name_or_title=f"Scene {s.scene_number}: {s.title}",
                            classification="CONDITIONAL",
                            reason="Scene dramatic question and outcome may reflect premise evolution.",
                            link_type="HEURISTIC_AMBIGUOUS",
                            is_locked=False,
                            is_approved=getattr(s, "is_approved", False),
                            confidence=0.5,
                            current_version=s.version,
                            provenance_summary=s.origin_source,
                        )
                    )

        # Media Assets impact mapping
        affected_ids = {n.entity_id for n in affected_nodes}
        for m in media_assets:
            if m.entity_id in affected_ids:
                conditional_nodes.append(
                    ImpactedNodeRead(
                        entity_id=m.id,
                        entity_type="media_asset",
                        name_or_title=f"{m.asset_type.capitalize()} Asset",
                        classification="CONDITIONAL",
                        reason=f"Synthesized from an entity ({m.entity_type}) that has been marked as affected.",
                        link_type="CAUSAL_TRANSITIVE",
                        is_locked=False,
                        is_approved=False,
                        confidence=0.9,
                        current_version=1,
                        provenance_summary=f"Generated {m.asset_type}",
                    )
                )

        has_ambiguous = len(ambiguity_warnings) > 0 or any(
            n.link_type == "HEURISTIC_AMBIGUOUS" for n in (affected_nodes + conditional_nodes)
        )

        return ImpactPreviewResponse(
            project_id=project_id,
            upstream_entity_type=request.upstream_entity_type,
            upstream_entity_id=request.upstream_entity_id,
            change_summary=change_summary,
            affected_nodes=affected_nodes,
            conditional_nodes=conditional_nodes,
            preserved_nodes=preserved_nodes,
            locked_node_count=locked_node_count,
            has_ambiguous_provenance=has_ambiguous,
            ambiguity_warnings=ambiguity_warnings,
        )
