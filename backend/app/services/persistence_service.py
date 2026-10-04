import json
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from backend.app.models.dna import SeedDNARecord
from backend.app.models.persistence import (
    BranchCreate,
    BranchRead,
    CharacterRefineRequest,
    EntityRevisionRead,
    EntityRevisionRecord,
    ProjectBundle,
    SceneRefineRequest,
    SnapshotRead,
)
from backend.app.models.project import Project, ProjectRead
from backend.app.models.selection import WorldSelectionRecord
from backend.app.models.unfold import (
    CharacterRead,
    CharacterRecord,
    CharacterRelationshipRecord,
    SceneRead,
    SceneRecord,
    WorldBibleRecord,
)
from backend.app.models.world import WorldCandidateRecord
from backend.app.providers.storage import StorageProvider
from backend.app.repositories.project_repo import ProjectRepository
from backend.app.services.lineage_service import LineageService


class PersistenceService:
    """Service handling branching timeline isolation, component refinement with revision snapshots,
    project bundling (with lineage DAG), and snapshot persistence via StorageProvider (Tattva 6)."""

    def __init__(
        self,
        repo: ProjectRepository,
        storage: StorageProvider,
        lineage_service: LineageService,
    ):
        self.repo = repo
        self.storage = storage
        self.lineage_service = lineage_service

    async def branch_project(self, source_project_id: str, request: BranchCreate) -> Project:
        """Branch timeline by cloning source project state into an isolated child project with strict ID remapping (PERS-02)."""
        source = await self.repo.get_project(source_project_id)
        if not source:
            raise KeyError(f"Source project with ID '{source_project_id}' not found.")

        # 1. Create Child Project
        child_project = Project(
            title=f"{source.title} ({request.branch_name})",
            seed_text=source.seed_text,
            status=source.status,
            parent_project_id=source.id,
            branch_name=request.branch_name,
            selected_world_id=None,
        )
        self.repo.session.add(child_project)
        await self.repo.session.flush()

        # 2. Clone SeedDNA
        child_dna_id = str(uuid.uuid4())
        seed_dna_record = await self.repo.get_latest_seed_dna(source_project_id)
        if seed_dna_record:
            child_dna = SeedDNARecord(
                id=child_dna_id,
                project_id=child_project.id,
                raw_seed=seed_dna_record.raw_seed,
                premise=seed_dna_record.premise,
                tone=seed_dna_record.tone,
                themes_json=seed_dna_record.themes_json,
                entities_json=seed_dna_record.entities_json or "[]",
                constraints_json=seed_dna_record.constraints_json,
                domain_keywords_json=seed_dna_record.domain_keywords_json,
                model_used=seed_dna_record.model_used,
                fallback_used=seed_dna_record.fallback_used,
            )
            self.repo.session.add(child_dna)

        # 3. Clone WorldCandidates with candidate_id_map
        candidate_id_map: Dict[str, str] = {}
        candidates = await self.repo.get_latest_world_candidates(source_project_id)
        for cand in candidates:
            new_cand_id = str(uuid.uuid4())
            candidate_id_map[cand.id] = new_cand_id
            new_cand = WorldCandidateRecord(
                id=new_cand_id,
                project_id=child_project.id,
                seed_dna_id=child_dna_id,
                batch_id=cand.batch_id,
                candidate_index=cand.candidate_index,
                title=cand.title,
                concept=cand.concept,
                archetype=cand.archetype,
                aesthetic=cand.aesthetic,
                core_tension=cand.core_tension,
                trade_offs=cand.trade_offs,
                key_visual=cand.key_visual,
                model_used=cand.model_used,
                fallback_used=cand.fallback_used,
            )
            self.repo.session.add(new_cand)

        # 4. Clone Selection with remapped candidate ID
        selection_tuple = await self.repo.get_active_world_selection(source_project_id)
        if selection_tuple:
            sel, _ = selection_tuple
            new_chosen_id = candidate_id_map.get(sel.world_candidate_id)
            if new_chosen_id:
                child_project.selected_world_id = new_chosen_id
                child_sel = WorldSelectionRecord(
                    project_id=child_project.id,
                    world_candidate_id=new_chosen_id,
                    batch_id=sel.batch_id,
                    user_rationale=sel.user_rationale,
                )
                self.repo.session.add(child_sel)

        # 5. Clone Unfolded Universe with strict candidate_id_map & char_id_map
        bible, characters, relationships, scenes = await self.repo.get_raw_unfolded_records(source_project_id)

        if bible:
            new_bible = WorldBibleRecord(
                project_id=child_project.id,
                world_candidate_id=candidate_id_map.get(bible.world_candidate_id, bible.world_candidate_id),
                geography=bible.geography,
                physics_rules=bible.physics_rules,
                history_timeline_json=bible.history_timeline_json,
                factions_json=bible.factions_json,
                canon_facts_json=bible.canon_facts_json,
                key_locations_json=bible.key_locations_json,
                visual_style_prompt=bible.visual_style_prompt,
            )
            self.repo.session.add(new_bible)

        char_id_map: Dict[str, str] = {}
        for c in characters:
            new_char_id = str(uuid.uuid4())
            char_id_map[c.id] = new_char_id
            new_char = CharacterRecord(
                id=new_char_id,
                project_id=child_project.id,
                world_candidate_id=candidate_id_map.get(c.world_candidate_id, c.world_candidate_id),
                name=c.name,
                role=c.role,
                archetype=c.archetype,
                motivation=c.motivation,
                core_conflict=c.core_conflict,
                visual_prompt=c.visual_prompt,
                version=c.version,
                revision_notes=c.revision_notes,
            )
            self.repo.session.add(new_char)

        for r in relationships:
            new_src_id = char_id_map.get(r.source_character_id)
            new_tgt_id = char_id_map.get(r.target_character_id)
            if new_src_id and new_tgt_id:
                new_rel = CharacterRelationshipRecord(
                    project_id=child_project.id,
                    world_candidate_id=candidate_id_map.get(r.world_candidate_id, r.world_candidate_id),
                    source_character_id=new_src_id,
                    target_character_id=new_tgt_id,
                    relation_type=r.relation_type,
                    dynamic_description=r.dynamic_description,
                )
                self.repo.session.add(new_rel)

        scene_id_map: Dict[str, str] = {}
        for s in scenes:
            new_scene_id = str(uuid.uuid4())
            scene_id_map[s.id] = new_scene_id
            new_scene = SceneRecord(
                id=new_scene_id,
                project_id=child_project.id,
                world_candidate_id=candidate_id_map.get(s.world_candidate_id, s.world_candidate_id),
                scene_number=s.scene_number,
                title=s.title,
                location_setting=s.location_setting,
                characters_involved_json=s.characters_involved_json,
                dramatic_question=s.dramatic_question,
                conflict_narrative=s.conflict_narrative,
                pivotal_outcome=s.pivotal_outcome,
                visual_prompt=s.visual_prompt,
                version=s.version,
                revision_notes=s.revision_notes,
            )
            self.repo.session.add(new_scene)

        # 6. Clone Revisions with remapped entity IDs for full historical lineage in child branch
        revisions = await self.repo.get_entity_revisions(source_project_id)
        for rev in revisions:
            remapped_entity_id = char_id_map.get(rev.entity_id) or scene_id_map.get(rev.entity_id) or rev.entity_id
            new_rev = EntityRevisionRecord(
                project_id=child_project.id,
                entity_type=rev.entity_type,
                entity_id=remapped_entity_id,
                version=rev.version,
                snapshot_json=rev.snapshot_json,
                revision_notes=rev.revision_notes,
            )
            self.repo.session.add(new_rev)

        await self.repo.session.commit()
        await self.repo.session.refresh(child_project)
        return child_project

    async def get_project_branches(self, project_id: str) -> List[BranchRead]:
        """Fetch all timeline branches for a project family."""
        branches = await self.repo.get_project_branches(project_id)
        return [
            BranchRead(
                id=b.id,
                parent_project_id=b.parent_project_id,
                branch_name=b.branch_name,
                title=b.title,
                status=b.status,
                created_at=b.created_at,
            )
            for b in branches
        ]

    async def refine_character(
        self, project_id: str, char_id: str, req: CharacterRefineRequest
    ) -> CharacterRead:
        """Refine character with before/after revision snapshots (PERS-01)."""
        record = await self.repo.refine_character(project_id, char_id, req)
        if not record:
            raise KeyError(f"Character with ID '{char_id}' not found in project '{project_id}'.")
        return record.to_read_schema()

    async def refine_scene(
        self, project_id: str, scene_id: str, req: SceneRefineRequest
    ) -> SceneRead:
        """Refine story scene with before/after revision snapshots (PERS-01)."""
        record = await self.repo.refine_scene(project_id, scene_id, req)
        if not record:
            raise KeyError(f"Scene with ID '{scene_id}' not found in project '{project_id}'.")
        return record.to_read_schema()

    async def get_project_revisions(
        self, project_id: str, entity_id: Optional[str] = None
    ) -> List[EntityRevisionRead]:
        """Retrieve audit log revisions for a project or specific entity."""
        revs = await self.repo.get_entity_revisions(project_id, entity_id)
        return [r.to_read_schema() for r in revs]

    async def export_project_bundle(self, project_id: str) -> ProjectBundle:
        """Export comprehensive project bundle including synthesized Lineage DAG (PERS-03)."""
        project = await self.repo.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")

        seed_dna_record = await self.repo.get_latest_seed_dna(project_id)
        seed_dna = seed_dna_record.to_read_schema() if seed_dna_record else None

        candidates = await self.repo.get_latest_world_candidates(project_id)
        worlds = [w.to_read_schema() for w in candidates]

        selection_tuple = await self.repo.get_active_world_selection(project_id)
        selection = (
            selection_tuple[0].to_read_schema(selection_tuple[1].to_read_schema())
            if selection_tuple
            else None
        )

        unfolded = await self.repo.get_unfolded_universe(project_id)
        revisions = await self.get_project_revisions(project_id)
        lineage = await self.lineage_service.build_project_lineage(project_id)

        return ProjectBundle(
            format_version="1.0",
            exported_at=datetime.now(timezone.utc),
            project=project.to_read_schema(),
            seed_dna=seed_dna,
            worlds=worlds,
            selection=selection,
            unfolded_universe=unfolded,
            revisions=revisions,
            lineage=lineage,
        )

    async def import_project_bundle(self, bundle: ProjectBundle) -> Project:
        """Import standalone project bundle with remapped IDs into database (PERS-03)."""
        new_proj = Project(
            title=f"{bundle.project.title} (Imported)",
            seed_text=bundle.project.seed_text,
            status=bundle.project.status,
            parent_project_id=bundle.project.parent_project_id,
            branch_name=bundle.project.branch_name or "main",
            selected_world_id=None,
        )
        self.repo.session.add(new_proj)
        await self.repo.session.flush()

        # Restore SeedDNA
        child_dna_id = str(uuid.uuid4())
        if bundle.seed_dna:
            child_dna = SeedDNARecord(
                id=child_dna_id,
                project_id=new_proj.id,
                raw_seed=bundle.seed_dna.raw_seed or bundle.project.seed_text or "",
                premise=bundle.seed_dna.dna.premise,
                tone=bundle.seed_dna.dna.tone,
                themes_json=json.dumps(bundle.seed_dna.dna.themes),
                entities_json=json.dumps(bundle.seed_dna.dna.entities),
                constraints_json=json.dumps(bundle.seed_dna.dna.constraints),
                domain_keywords_json=json.dumps(bundle.seed_dna.dna.domain_keywords),
                model_used=bundle.seed_dna.model_used,
                fallback_used=bundle.seed_dna.fallback_used,
            )
            self.repo.session.add(child_dna)

        # Restore Candidates & Remap
        candidate_id_map: Dict[str, str] = {}
        for w in bundle.worlds:
            new_w_id = str(uuid.uuid4())
            candidate_id_map[w.id] = new_w_id
            new_w = WorldCandidateRecord(
                id=new_w_id,
                project_id=new_proj.id,
                seed_dna_id=child_dna_id,
                batch_id=w.batch_id,
                candidate_index=w.candidate_index,
                title=w.title,
                concept=w.concept,
                archetype=w.archetype,
                aesthetic=w.aesthetic,
                core_tension=w.core_tension,
                trade_offs=w.trade_offs,
                key_visual=w.key_visual,
                model_used=w.model_used,
                fallback_used=w.fallback_used,
            )
            self.repo.session.add(new_w)

        # Restore Selection
        if bundle.selection:
            new_chosen_id = candidate_id_map.get(
                bundle.selection.world_candidate_id, bundle.selection.world_candidate_id
            )
            new_proj.selected_world_id = new_chosen_id
            child_sel = WorldSelectionRecord(
                project_id=new_proj.id,
                world_candidate_id=new_chosen_id,
                batch_id=bundle.selection.batch_id,
                user_rationale=bundle.selection.user_rationale,
            )
            self.repo.session.add(child_sel)

        # Restore Unfolded Universe
        char_id_map: Dict[str, str] = {}
        scene_id_map: Dict[str, str] = {}
        if bundle.unfolded_universe:
            bible = bundle.unfolded_universe.world_bible
            if bible:
                new_bible = WorldBibleRecord(
                    project_id=new_proj.id,
                    world_candidate_id=candidate_id_map.get(bible.world_candidate_id, bible.world_candidate_id),
                    geography=bible.geography,
                    physics_rules=bible.physics_rules,
                    history_timeline_json=json.dumps([t.model_dump() for t in bible.history_timeline]),
                    factions_json=json.dumps([f.model_dump() for f in bible.factions]),
                    canon_facts_json=json.dumps(bible.canon_facts),
                    key_locations_json=json.dumps([l.model_dump() for l in bible.key_locations]),
                    visual_style_prompt=bible.visual_style_prompt,
                )
                self.repo.session.add(new_bible)

            for c in bundle.unfolded_universe.characters:
                new_c_id = str(uuid.uuid4())
                char_id_map[c.id] = new_c_id
                new_c = CharacterRecord(
                    id=new_c_id,
                    project_id=new_proj.id,
                    world_candidate_id=candidate_id_map.get(c.world_candidate_id, c.world_candidate_id),
                    name=c.name,
                    role=c.role,
                    archetype=c.archetype,
                    motivation=c.motivation,
                    core_conflict=c.core_conflict,
                    visual_prompt=c.visual_prompt,
                    version=c.version,
                    revision_notes=c.revision_notes,
                )
                self.repo.session.add(new_c)

            for r in bundle.unfolded_universe.relationships:
                new_src = char_id_map.get(r.source_character_id, r.source_character_id)
                new_tgt = char_id_map.get(r.target_character_id, r.target_character_id)
                new_rel = CharacterRelationshipRecord(
                    project_id=new_proj.id,
                    world_candidate_id=candidate_id_map.get(r.world_candidate_id, r.world_candidate_id),
                    source_character_id=new_src,
                    target_character_id=new_tgt,
                    relation_type=r.relation_type,
                    dynamic_description=r.dynamic_description,
                )
                self.repo.session.add(new_rel)

            for s in bundle.unfolded_universe.scenes:
                new_s_id = str(uuid.uuid4())
                scene_id_map[s.id] = new_s_id
                new_s = SceneRecord(
                    id=new_s_id,
                    project_id=new_proj.id,
                    world_candidate_id=candidate_id_map.get(s.world_candidate_id, s.world_candidate_id),
                    scene_number=s.scene_number,
                    title=s.title,
                    location_setting=s.location_setting,
                    characters_involved_json=json.dumps(s.characters_involved),
                    dramatic_question=s.dramatic_question,
                    conflict_narrative=s.conflict_narrative,
                    pivotal_outcome=s.pivotal_outcome,
                    visual_prompt=s.visual_prompt,
                    version=s.version,
                    revision_notes=s.revision_notes,
                )
                self.repo.session.add(new_s)

        # Restore Revisions
        for rev in bundle.revisions:
            mapped_eid = char_id_map.get(rev.entity_id) or scene_id_map.get(rev.entity_id) or rev.entity_id
            new_rev = EntityRevisionRecord(
                project_id=new_proj.id,
                entity_type=rev.entity_type,
                entity_id=mapped_eid,
                version=rev.version,
                snapshot_json=rev.snapshot_json,
                revision_notes=rev.revision_notes,
            )
            self.repo.session.add(new_rev)

        await self.repo.session.commit()
        await self.repo.session.refresh(new_proj)
        return new_proj

    async def create_storage_snapshot(self, project_id: str) -> SnapshotRead:
        """Create cloud/local object storage snapshot of project bundle via StorageProvider.upload (PERS-03)."""
        bundle = await self.export_project_bundle(project_id)
        bundle_json = bundle.model_dump_json(indent=2)
        bundle_bytes = bundle_json.encode("utf-8")
        timestamp = int(time.time())
        storage_key = f"snapshots/{project_id}/snapshot_{timestamp}.json"

        # Use verified upload(file_data, key, mime_type) method
        uploaded_uri = await self.storage.upload(
            file_data=bundle_bytes,
            key=storage_key,
            mime_type="application/json",
        )

        asset = await self.repo.create_snapshot_asset(
            project_id=project_id,
            storage_key=uploaded_uri,
            size_bytes=len(bundle_bytes),
        )

        return SnapshotRead(
            id=asset.id,
            project_id=asset.project_id,
            storage_key=asset.storage_key,
            size_bytes=asset.size_bytes,
            version=asset.version,
            created_at=asset.created_at,
        )

    async def list_storage_snapshots(self, project_id: str) -> List[SnapshotRead]:
        """List all object storage snapshots created for this project."""
        assets = await self.repo.list_project_snapshots(project_id)
        return [
            SnapshotRead(
                id=a.id,
                project_id=a.project_id,
                storage_key=a.storage_key,
                size_bytes=a.size_bytes,
                version=a.version,
                created_at=a.created_at,
            )
            for a in assets
        ]
