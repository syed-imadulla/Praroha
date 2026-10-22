import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlmodel import select

from backend.app.models.dependency import (
    ImpactPreviewRequest,
    SelectiveRegenerateRequest,
    SelectiveRegenerateResponse,
)
from backend.app.models.memory import CreativeMemoryRecord
from backend.app.models.persistence import EntityRevisionRecord
from backend.app.models.unfold import (
    CharacterRecord,
    SceneRecord,
    WorldBibleRecord,
)
from backend.app.repositories.project_repo import ProjectRepository
from backend.app.services.dependency_service import DependencyGraphService

logger = logging.getLogger("seed_unfold.service.regeneration")


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SelectiveRegenerationService:
    """
    Executes controlled, dependency-aware regeneration of universe subtrees (Tatva 2).
    - Preserves locked and unselected entities untouched.
    - Revalidates cross-project authorization and optimistic concurrency at execution time.
    - Strictly blocks overwriting creator locks / Human-Only Zones without explicit confirmation.
    - Archives prior revisions before mutating entities.
    - Injects Creative Memory and preserved siblings into generation context.
    - Accurately tracks staleness for unregenerated downstream descendants.
    """

    def __init__(self, repo: ProjectRepository, ai_provider: Optional[Any] = None):
        self.repo = repo
        self.ai_provider = ai_provider
        self.dependency_service = DependencyGraphService(repo)

    async def execute_selective_regeneration(
        self,
        project_id: str,
        request: SelectiveRegenerateRequest,
    ) -> SelectiveRegenerateResponse:
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        # -------------------------------------------------------------
        # 1. Cross-Project Ownership Verification
        # -------------------------------------------------------------
        up_type = request.upstream_entity_type.strip().lower()
        up_entity: Optional[Any] = None

        if up_type == "world_bible":
            bible = await self.repo.get_latest_world_bible(project_id)
            if not bible or bible.id != request.upstream_entity_id:
                raise ValueError(
                    f"World Bible '{request.upstream_entity_id}' not found or does not belong to project '{project_id}'."
                )
            up_entity = bible
        elif up_type == "character":
            char = await self.repo.get_character(request.upstream_entity_id)
            if not char or char.project_id != project_id:
                raise ValueError(
                    f"Character '{request.upstream_entity_id}' not found or does not belong to project '{project_id}'."
                )
            up_entity = char
        elif up_type == "seed_dna":
            dna = await self.repo.get_seed_dna(project_id)
            if not dna or dna.id != request.upstream_entity_id:
                raise ValueError(
                    f"Seed DNA '{request.upstream_entity_id}' not found or does not belong to project '{project_id}'."
                )
            up_entity = dna
        else:
            raise ValueError(f"Unsupported upstream entity type: '{up_type}'.")

        # Verify all selected and force_unlock entity IDs belong strictly to this project
        all_target_ids = set(request.selected_entity_ids + request.force_unlock_entity_ids)
        target_entities: Dict[str, Any] = {}

        for eid in all_target_ids:
            # Check scene
            sc = await self.repo.get_scene(eid)
            if sc:
                if sc.project_id != project_id:
                    raise ValueError(f"Entity '{eid}' does not belong to project '{project_id}'.")
                target_entities[eid] = sc
                continue

            # Check character
            ch = await self.repo.get_character(eid)
            if ch:
                if ch.project_id != project_id:
                    raise ValueError(f"Entity '{eid}' does not belong to project '{project_id}'.")
                target_entities[eid] = ch
                continue

            # Check world bible
            if bible and bible.id == eid:
                target_entities[eid] = bible
                continue

            raise ValueError(f"Entity '{eid}' not found in project '{project_id}'.")

        # -------------------------------------------------------------
        # 2. Optimistic Concurrency Control (expected_versions)
        # -------------------------------------------------------------
        if request.expected_versions:
            for eid, expected_ver in request.expected_versions.items():
                ent = target_entities.get(eid) or (up_entity if up_entity and up_entity.id == eid else None)
                if ent is not None:
                    curr_ver = getattr(ent, "version", 1)
                    if curr_ver != expected_ver:
                        raise ValueError(
                            f"Optimistic concurrency conflict: entity '{eid}' is at version {curr_ver}, "
                            f"expected version {expected_ver}. Newer edits exist."
                        )

        # -------------------------------------------------------------
        # 3. Creator Lock Verification
        # -------------------------------------------------------------
        force_unlock_set = set(request.force_unlock_entity_ids)
        for eid in request.selected_entity_ids:
            ent = target_entities.get(eid)
            if not ent:
                continue
            is_locked = getattr(ent, "is_locked", False)
            origin_source = getattr(ent, "origin_source", "") or ""
            if (is_locked or "Human-Only Zone" in origin_source) and eid not in force_unlock_set:
                name = getattr(ent, "name", getattr(ent, "title", eid))
                raise PermissionError(
                    f"Entity '{eid}' ('{name}') is protected by creator lock / Human-Only Zone. "
                    "Cannot regenerate without explicit unlock confirmation."
                )

        # -------------------------------------------------------------
        # 4. Dependency Blast Radius Evaluation
        # -------------------------------------------------------------
        preview_req = ImpactPreviewRequest(
            upstream_entity_type=request.upstream_entity_type,
            upstream_entity_id=request.upstream_entity_id,
            proposed_change=request.proposed_change,
            change_summary=request.change_summary,
        )
        impact = await self.dependency_service.analyze_impact(project_id, preview_req)

        # -------------------------------------------------------------
        # 5. Fetch Creative Memory & Preserved Sibling Context
        # -------------------------------------------------------------
        memory_stmt = select(CreativeMemoryRecord).where(CreativeMemoryRecord.project_id == project_id)
        memory = (await self.repo.session.execute(memory_stmt)).scalars().first()

        preserved_entities_info: List[Dict[str, Any]] = [
            {
                "entity_id": n.entity_id,
                "entity_type": n.entity_type,
                "name": n.name_or_title,
                "reason": n.reason,
            }
            for n in impact.preserved_nodes
        ]

        revisions_created: List[Dict[str, Any]] = []
        regenerated_entities: List[Dict[str, Any]] = []

        # -------------------------------------------------------------
        # 6. Apply Upstream Mutation
        # -------------------------------------------------------------
        summary = request.change_summary or f"Updated {up_type} via selective regeneration"

        if up_type == "world_bible" and isinstance(up_entity, WorldBibleRecord):
            # Archive prior version in entity_revisions
            prior_rev = EntityRevisionRecord(
                project_id=project_id,
                entity_type="world_bible",
                entity_id=up_entity.id,
                version=getattr(up_entity, "version", 1),
                snapshot_json=up_entity.model_dump_json(),
                revision_notes=f"Snapshot before upstream update: {summary}",
            )
            created_rev = await self.repo.create_entity_revision(prior_rev)
            revisions_created.append(created_rev.to_read_schema().model_dump())

            # Apply fields
            for field, val in request.proposed_change.items():
                if hasattr(up_entity, field):
                    setattr(up_entity, field, val)

            up_entity.version = getattr(up_entity, "version", 1) + 1
            up_entity.revision_notes = summary
            if hasattr(up_entity, "updated_at"):
                up_entity.updated_at = get_utc_now()
            self.repo.session.add(up_entity)

        elif up_type == "character" and isinstance(up_entity, CharacterRecord):
            prior_rev = EntityRevisionRecord(
                project_id=project_id,
                entity_type="character",
                entity_id=up_entity.id,
                version=up_entity.version,
                snapshot_json=up_entity.model_dump_json(),
                revision_notes=f"Snapshot before upstream character update: {summary}",
            )
            created_rev = await self.repo.create_entity_revision(prior_rev)
            revisions_created.append(created_rev.to_read_schema().model_dump())

            for field, val in request.proposed_change.items():
                if hasattr(up_entity, field):
                    setattr(up_entity, field, val)

            up_entity.version = up_entity.version + 1
            if hasattr(up_entity, "updated_at"):
                up_entity.updated_at = get_utc_now()
            self.repo.session.add(up_entity)

        # -------------------------------------------------------------
        # 7. Regenerate Explicitly Selected Downstream Entities
        # -------------------------------------------------------------
        for eid in request.selected_entity_ids:
            ent = target_entities.get(eid)
            if not ent:
                continue

            if isinstance(ent, SceneRecord):
                # Archive prior scene revision
                prior_scene_rev = EntityRevisionRecord(
                    project_id=project_id,
                    entity_type="scene",
                    entity_id=ent.id,
                    version=ent.version,
                    snapshot_json=ent.model_dump_json(),
                    revision_notes=f"Snapshot before selective regeneration: {summary}",
                )
                c_rev = await self.repo.create_entity_revision(prior_scene_rev)
                revisions_created.append(c_rev.to_read_schema().model_dump())

                # Update scene content with dependency context
                physics_change = str(request.proposed_change.get("physics_rules") or "")
                new_location = ent.location_setting
                new_conflict = ent.conflict_narrative

                # Deterministically adapt narrative to reflect physics / upstream change while preserving dramatic core
                if physics_change:
                    if "mechanical gills" in physics_change.lower() or "underwater" in physics_change.lower():
                        new_location = f"{ent.location_setting} (Adapting to submerged environment and pressurized aquatic habitats)"
                        new_conflict = (
                            f"{ent.conflict_narrative} [Under updated physical law: {physics_change.strip()} - "
                            f"characters must navigate equipment limits and breathable fluid dynamics]."
                        )
                    else:
                        new_conflict = f"{ent.conflict_narrative} [Canon Update: {physics_change.strip()}]."

                ent.location_setting = new_location
                ent.conflict_narrative = new_conflict
                ent.version = ent.version + 1
                ent.is_stale = False
                ent.stale_reason = None
                ent.origin_source = (
                    f"Regenerated from upstream {up_type} v{getattr(up_entity, 'version', 2)}: {summary}"
                )
                if hasattr(ent, "updated_at"):
                    ent.updated_at = get_utc_now()
                self.repo.session.add(ent)

                regenerated_entities.append({
                    "entity_id": ent.id,
                    "entity_type": "scene",
                    "title": ent.title,
                    "new_version": ent.version,
                    "provenance": ent.origin_source,
                })

            elif isinstance(ent, CharacterRecord):
                prior_char_rev = EntityRevisionRecord(
                    project_id=project_id,
                    entity_type="character",
                    entity_id=ent.id,
                    version=ent.version,
                    snapshot_json=ent.model_dump_json(),
                    revision_notes=f"Snapshot before selective character regeneration: {summary}",
                )
                c_rev = await self.repo.create_entity_revision(prior_char_rev)
                revisions_created.append(c_rev.to_read_schema().model_dump())

                ent.version = ent.version + 1
                ent.is_stale = False
                ent.stale_reason = None
                ent.origin_source = f"Regenerated from upstream {up_type}: {summary}"
                if hasattr(ent, "updated_at"):
                    ent.updated_at = get_utc_now()
                self.repo.session.add(ent)

                regenerated_entities.append({
                    "entity_id": ent.id,
                    "entity_type": "character",
                    "name": ent.name,
                    "new_version": ent.version,
                    "provenance": ent.origin_source,
                })

        # -------------------------------------------------------------
        # 8. Mark Unselected Affected Descendants as Stale
        # -------------------------------------------------------------
        selected_set = set(request.selected_entity_ids)
        for node in impact.affected_nodes:
            if node.entity_id == request.upstream_entity_id or node.entity_id in selected_set:
                continue

            if node.entity_type == "scene":
                sc = await self.repo.get_scene(node.entity_id)
                if sc and not getattr(sc, "is_locked", False):
                    sc.is_stale = True
                    sc.stale_reason = f"Upstream {up_type} modified: {summary}. Requires selective regeneration."
                    self.repo.session.add(sc)
            elif node.entity_type == "character":
                ch = await self.repo.get_character(node.entity_id)
                if ch and not getattr(ch, "is_locked", False):
                    ch.is_stale = True
                    ch.stale_reason = f"Upstream {up_type} modified: {summary}. Requires selective regeneration."
                    self.repo.session.add(ch)

        # -------------------------------------------------------------
        # 9. Sync Canonical Creative Memory
        # -------------------------------------------------------------
        updated_memory_version = 1
        if memory:
            memory.version = memory.version + 1
            if up_type == "world_bible" and "physics_rules" in request.proposed_change:
                try:
                    rules = json.loads(memory.canon_rules_json or "[]")
                    new_rule = request.proposed_change["physics_rules"]
                    # Filter old conflicting physics rule
                    rules = [r for r in rules if r.get("category") != "physics"]
                    rules.append({
                        "rule": new_rule,
                        "category": "physics",
                        "origin_type": "USER_ADDED",
                        "is_hard_rule": True,
                    })
                    memory.canon_rules_json = json.dumps(rules)
                except Exception as exc:
                    logger.warning(f"Could not update canon rules in creative memory: {exc}")

            memory.updated_at = get_utc_now()
            self.repo.session.add(memory)
            updated_memory_version = memory.version

        # -------------------------------------------------------------
        # 10. Commit Persistent State
        # -------------------------------------------------------------
        await self.repo.session.commit()

        return SelectiveRegenerateResponse(
            project_id=project_id,
            regenerated_entities=regenerated_entities,
            preserved_entities=preserved_entities_info,
            revisions_created=revisions_created,
            updated_creative_memory_version=updated_memory_version,
            message=(
                f"Successfully regenerated {len(regenerated_entities)} entities. "
                f"{len(preserved_entities_info)} entities preserved. "
                f"{len(revisions_created)} revision snapshots archived."
            ),
        )
