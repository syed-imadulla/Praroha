import json
import uuid
from typing import AsyncGenerator, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, delete, select
from backend.app.config import settings
from backend.app.models.dna import SeedDNA, SeedDNARecord
from backend.app.models.project import Asset, AssetCreate, Project, ProjectCreate
from backend.app.models.selection import WorldSelectionRecord
from backend.app.models.unfold import (
    CharacterRecord,
    CharacterRelationshipRecord,
    SceneRecord,
    WorldBibleRecord,
    UnfoldedUniverseRead,
)
from backend.app.models.world import WorldCandidate, WorldCandidateRecord
from backend.app.models.persistence import (
    EntityRevisionRecord,
    CharacterRefineRequest,
    SceneRefineRequest,
)
from backend.app.models.potential import (
    SeedPotentialItemRecord,
    PotentialItemStatus,
)
from backend.app.providers.mock_provider import (
    CANONICAL_SEED_DNA,
    CANONICAL_WORLDS,
    CANONICAL_SEED_POTENTIAL,
    MockProvider,
)

import logging

logger = logging.getLogger(__name__)


def build_engine(database_url: str):
    """Build async SQLAlchemy engine optimized for SQLite or PostgreSQL/Supabase."""
    url_str = str(database_url).strip()
    if url_str.startswith("sqlite"):
        return create_async_engine(
            url_str,
            echo=False,
            future=True,
            connect_args={"check_same_thread": False},
        )
    else:
        # Optimized for Supabase poolers (pgbouncer transaction & session modes)
        return create_async_engine(
            url_str,
            echo=False,
            future=True,
            pool_pre_ping=True,
            connect_args={"statement_cache_size": 0},
        )


engine = build_engine(settings.DATABASE_URL)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def _migrate_columns(connection):
    from sqlalchemy import inspect, text
    inspector = inspect(connection)
    table_names = inspector.get_table_names()

    if "projects" in table_names:
        cols = [c["name"] for c in inspector.get_columns("projects")]
        if "selected_world_id" not in cols:
            try:
                connection.execute(text("ALTER TABLE projects ADD COLUMN selected_world_id VARCHAR"))
            except Exception:
                pass
        if "parent_project_id" not in cols:
            try:
                connection.execute(text("ALTER TABLE projects ADD COLUMN parent_project_id VARCHAR"))
            except Exception:
                pass
        if "branch_name" not in cols:
            try:
                connection.execute(text("ALTER TABLE projects ADD COLUMN branch_name VARCHAR DEFAULT 'main'"))
            except Exception:
                pass

    if "characters" in table_names:
        cols = [c["name"] for c in inspector.get_columns("characters")]
        if "version" not in cols:
            try:
                connection.execute(text("ALTER TABLE characters ADD COLUMN version INTEGER DEFAULT 1"))
            except Exception:
                pass
        if "revision_notes" not in cols:
            try:
                connection.execute(text("ALTER TABLE characters ADD COLUMN revision_notes VARCHAR"))
            except Exception:
                pass

    if "scenes" in table_names:
        cols = [c["name"] for c in inspector.get_columns("scenes")]
        if "version" not in cols:
            try:
                connection.execute(text("ALTER TABLE scenes ADD COLUMN version INTEGER DEFAULT 1"))
            except Exception:
                pass
        if "revision_notes" not in cols:
            try:
                connection.execute(text("ALTER TABLE scenes ADD COLUMN revision_notes VARCHAR"))
            except Exception:
                pass

    if "world_candidates" in table_names:
        cols = [c["name"] for c in inspector.get_columns("world_candidates")]
        if "divergence_archetype" not in cols:
            try:
                connection.execute(text("ALTER TABLE world_candidates ADD COLUMN divergence_archetype VARCHAR DEFAULT 'familiar'"))
            except Exception:
                pass
        if "exploration_profile_json" not in cols:
            try:
                connection.execute(text("ALTER TABLE world_candidates ADD COLUMN exploration_profile_json TEXT DEFAULT '{}'"))
            except Exception:
                pass
        if "emphasized_potential_labels_json" not in cols:
            try:
                connection.execute(text("ALTER TABLE world_candidates ADD COLUMN emphasized_potential_labels_json TEXT DEFAULT '[]'"))
            except Exception:
                pass

    if "world_selections" in table_names:
        cols = [c["name"] for c in inspector.get_columns("world_selections")]
        if "creative_priorities_json" not in cols:
            try:
                connection.execute(text("ALTER TABLE world_selections ADD COLUMN creative_priorities_json TEXT DEFAULT '[]'"))
            except Exception:
                pass
        if "rejected_directions_json" not in cols:
            try:
                connection.execute(text("ALTER TABLE world_selections ADD COLUMN rejected_directions_json TEXT DEFAULT '[]'"))
            except Exception:
                pass
        if "custom_directives" not in cols:
            try:
                connection.execute(text("ALTER TABLE world_selections ADD COLUMN custom_directives TEXT"))
            except Exception:
                pass


async def init_db() -> None:
    """Initialize database tables asynchronously with automatic fallback to local SQLite."""
    global engine, async_session
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
            await conn.run_sync(_migrate_columns)
        logger.info("Database initialized successfully using %s", engine.url.drivername)
    except Exception as exc:
        if not str(engine.url).startswith("sqlite"):
            logger.warning(
                "Failed to connect to primary database (%s: %s). Falling back gracefully to local SQLite.",
                type(exc).__name__,
                exc,
            )
            sqlite_url = "sqlite+aiosqlite:///./seed_unfold.db"
            engine = build_engine(sqlite_url)
            async_session = async_sessionmaker(
                engine,
                class_=AsyncSession,
                expire_on_commit=False,
            )
            async with engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.create_all)
                await conn.run_sync(_migrate_columns)
            logger.info("Local SQLite fallback database initialized successfully.")
        else:
            raise exc


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection session generator for route handlers."""
    async with async_session() as session:
        yield session


class ProjectRepository:
    """Repository abstracting database interactions from FastAPI routes."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_project(self, data: ProjectCreate) -> Project:
        project = Project(
            title=data.title,
            seed_text=data.seed_text or "",
            status="draft",
        )
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def get_project(self, project_id: str) -> Optional[Project]:
        statement = select(Project).where(Project.id == project_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def list_projects(self) -> List[Project]:
        statement = select(Project).order_by(Project.created_at.desc())
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def create_asset_metadata(self, data: AssetCreate) -> Asset:
        asset = Asset(
            project_id=data.project_id,
            asset_type=data.asset_type,
            mime_type=data.mime_type,
            storage_key=data.storage_key,
            size_bytes=data.size_bytes,
            source_ref=data.source_ref,
            version=data.version,
        )
        self.session.add(asset)
        await self.session.commit()
        await self.session.refresh(asset)
        return asset

    async def update_project_status(self, project_id: str, status: str) -> Optional[Project]:
        project = await self.get_project(project_id)
        if not project:
            return None
        project.status = status
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def list_assets(self, project_id: str) -> List[Asset]:
        statement = select(Asset).where(Asset.project_id == project_id)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def save_seed_dna(
        self,
        project_id: str,
        raw_seed: str,
        dna: SeedDNA,
        model_used: str = "mock",
        fallback_used: bool = False,
    ) -> SeedDNARecord:
        record = SeedDNARecord(
            project_id=project_id,
            raw_seed=raw_seed,
            premise=dna.premise,
            themes_json=json.dumps(dna.themes),
            entities_json=json.dumps(dna.entities),
            constraints_json=json.dumps(dna.constraints),
            tone=dna.tone,
            domain_keywords_json=json.dumps(dna.domain_keywords),
            model_used=model_used,
            fallback_used=fallback_used,
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def get_latest_seed_dna(self, project_id: str) -> Optional[SeedDNARecord]:
        statement = (
            select(SeedDNARecord)
            .where(SeedDNARecord.project_id == project_id)
            .order_by(SeedDNARecord.created_at.desc())
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def save_world_candidates(
        self,
        project_id: str,
        seed_dna_id: str,
        batch_id: str,
        candidates: List[WorldCandidate],
        model_used: str = "mock",
        fallback_used: bool = False,
    ) -> List[WorldCandidateRecord]:
        records = []
        for cand in candidates:
            profile_dump = cand.exploration_profile.model_dump() if hasattr(cand.exploration_profile, "model_dump") else (cand.exploration_profile or {})
            rec = WorldCandidateRecord(
                project_id=project_id,
                seed_dna_id=seed_dna_id,
                batch_id=batch_id,
                candidate_index=cand.index,
                title=cand.title,
                archetype=cand.archetype,
                concept=cand.concept,
                aesthetic=cand.aesthetic,
                core_tension=cand.core_tension,
                trade_offs=cand.trade_offs,
                key_visual=cand.key_visual,
                model_used=model_used,
                fallback_used=fallback_used,
                divergence_archetype=cand.divergence_archetype or "familiar",
                exploration_profile_json=json.dumps(profile_dump),
                emphasized_potential_labels_json=json.dumps(cand.emphasized_potential_labels or []),
            )
            self.session.add(rec)
            records.append(rec)
        await self.session.commit()
        for rec in records:
            await self.session.refresh(rec)
        return records

    async def get_latest_world_candidates(self, project_id: str) -> List[WorldCandidateRecord]:
        latest_stmt = (
            select(WorldCandidateRecord.batch_id)
            .where(WorldCandidateRecord.project_id == project_id)
            .order_by(WorldCandidateRecord.created_at.desc())
            .limit(1)
        )
        res = await self.session.execute(latest_stmt)
        latest_batch = res.scalar_one_or_none()
        if not latest_batch:
            return []

        stmt = (
            select(WorldCandidateRecord)
            .where(WorldCandidateRecord.project_id == project_id)
            .where(WorldCandidateRecord.batch_id == latest_batch)
            .order_by(WorldCandidateRecord.candidate_index.asc())
        )
        candidates_res = await self.session.execute(stmt)
        return list(candidates_res.scalars().all())

    async def get_world_candidate(self, candidate_id: str) -> Optional[WorldCandidateRecord]:
        """Fetch a specific WorldCandidateRecord by ID."""
        stmt = select(WorldCandidateRecord).where(WorldCandidateRecord.id == candidate_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def save_world_selection(
        self,
        project_id: str,
        candidate_id: str,
        user_rationale: Optional[str] = None,
        creative_priorities: Optional[List[str]] = None,
        rejected_directions: Optional[List[str]] = None,
        custom_directives: Optional[str] = None,
    ) -> WorldSelectionRecord:
        """
        Enforce selection validation:
        1. Candidate exists.
        2. Candidate belongs to project.
        3. Candidate.batch_id matches the project's latest world generation batch.
        4. Otherwise reject by raising ValueError / KeyError.
        """
        # 0. Check if project exists and whether Stage 5 has already begun
        project = await self.get_project(project_id)
        if not project:
            raise KeyError(f"Project with ID '{project_id}' not found.")
        if project.status in ["unfolding", "unfolded", "bible_generated", "characters_generated", "scenes_generated"]:
            raise ValueError("World selection is locked because Stage 5 universe unfolding has already begun. Branch the project to explore a different direction.")

        # 1. Candidate exists
        cand_stmt = select(WorldCandidateRecord).where(WorldCandidateRecord.id == candidate_id)
        res = await self.session.execute(cand_stmt)
        candidate = res.scalar_one_or_none()
        if not candidate:
            raise KeyError(f"World candidate '{candidate_id}' not found.")

        # 2. Candidate belongs to project
        if candidate.project_id != project_id:
            raise ValueError(f"World candidate '{candidate_id}' does not belong to project '{project_id}'.")

        # 3. Candidate.batch_id matches project's latest world generation batch
        latest_batch_stmt = (
            select(WorldCandidateRecord.batch_id)
            .where(WorldCandidateRecord.project_id == project_id)
            .order_by(WorldCandidateRecord.created_at.desc())
            .limit(1)
        )
        batch_res = await self.session.execute(latest_batch_stmt)
        latest_batch_id = batch_res.scalar_one_or_none()
        if candidate.batch_id != latest_batch_id:
            raise ValueError("Candidate belongs to an older generation batch. Only candidates from the latest batch can be selected.")

        # 4. Create and persist selection record (preserving history)
        selection = WorldSelectionRecord(
            project_id=project_id,
            world_candidate_id=candidate.id,
            batch_id=candidate.batch_id,
            user_rationale=user_rationale,
            creative_priorities_json=json.dumps(creative_priorities or []),
            rejected_directions_json=json.dumps(rejected_directions or []),
            custom_directives=custom_directives,
        )
        self.session.add(selection)

        # Update project status and selected world pointer
        project = await self.get_project(project_id)
        if project:
            project.selected_world_id = candidate.id
            project.status = "world_selected"
            self.session.add(project)

        await self.session.commit()
        await self.session.refresh(selection)
        if project:
            await self.session.refresh(project)

        return selection

    async def get_active_world_selection(
        self,
        project_id: str,
    ) -> Optional[Tuple[WorldSelectionRecord, WorldCandidateRecord]]:
        """Fetch the latest WorldSelectionRecord for project with its WorldCandidateRecord."""
        stmt = (
            select(WorldSelectionRecord, WorldCandidateRecord)
            .join(WorldCandidateRecord, WorldSelectionRecord.world_candidate_id == WorldCandidateRecord.id)
            .where(WorldSelectionRecord.project_id == project_id)
            .order_by(WorldSelectionRecord.created_at.desc())
            .limit(1)
        )
        res = await self.session.execute(stmt)
        row = res.first()
        if not row:
            return None
        return (row[0], row[1])

    async def save_unfolded_universe(
        self,
        project_id: str,
        world_candidate_id: str,
        data: dict,
    ) -> UnfoldedUniverseRead:
        """Persist the 4 unfolded layers atomically within a database transaction."""
        try:
            # 1. Cleanse previous unfolded entities for this project/candidate to allow safe retries
            await self.session.execute(
                delete(SceneRecord).where(
                    SceneRecord.project_id == project_id,
                    SceneRecord.world_candidate_id == world_candidate_id,
                )
            )
            await self.session.execute(
                delete(CharacterRelationshipRecord).where(
                    CharacterRelationshipRecord.project_id == project_id,
                    CharacterRelationshipRecord.world_candidate_id == world_candidate_id,
                )
            )
            await self.session.execute(
                delete(CharacterRecord).where(
                    CharacterRecord.project_id == project_id,
                    CharacterRecord.world_candidate_id == world_candidate_id,
                )
            )
            await self.session.execute(
                delete(WorldBibleRecord).where(
                    WorldBibleRecord.project_id == project_id,
                    WorldBibleRecord.world_candidate_id == world_candidate_id,
                )
            )

            # 2. Persist World Bible
            bible_data = data.get("world_bible", {})
            timeline_items = bible_data.get("history_timeline", [])
            factions_items = bible_data.get("factions", [])
            canon_facts = bible_data.get("canon_facts", [])
            locations_items = bible_data.get("key_locations", [])

            clean_canon_facts = [
                (f.get("fact") or f.get("text") or f.get("description") or str(f)) if isinstance(f, dict) else str(f)
                for f in (canon_facts if isinstance(canon_facts, list) else [])
            ]
            raw_physics = bible_data.get("physics_rules", "")
            physics_rules = json.dumps(raw_physics) if isinstance(raw_physics, (list, dict)) else str(raw_physics or "")
            raw_geo = bible_data.get("geography", "")
            geography = json.dumps(raw_geo) if isinstance(raw_geo, (list, dict)) else str(raw_geo or "")

            bible_record = WorldBibleRecord(
                project_id=project_id,
                world_candidate_id=world_candidate_id,
                geography=geography,
                physics_rules=physics_rules,
                history_timeline_json=json.dumps([t if isinstance(t, dict) else t.model_dump() for t in timeline_items]),
                factions_json=json.dumps([f if isinstance(f, dict) else f.model_dump() for f in factions_items]),
                canon_facts_json=json.dumps(clean_canon_facts),
                key_locations_json=json.dumps([loc if isinstance(loc, dict) else loc.model_dump() for loc in locations_items]),
                visual_style_prompt=str(bible_data.get("visual_style_prompt", "") or ""),
            )
            self.session.add(bible_record)

            # 3. Persist Characters
            created_characters: List[CharacterRecord] = []
            char_items = data.get("characters", [])
            for c in char_items:
                char_record = CharacterRecord(
                    project_id=project_id,
                    world_candidate_id=world_candidate_id,
                    name=c.get("name", "Unnamed"),
                    role=c.get("role", "Cast Member"),
                    archetype=c.get("archetype", "Archetype"),
                    motivation=c.get("motivation", ""),
                    core_conflict=c.get("core_conflict") or c.get("conflict", ""),
                    visual_prompt=c.get("visual_prompt", ""),
                )
                self.session.add(char_record)
                created_characters.append(char_record)

            # Flush to generate character IDs for relationships
            await self.session.flush()

            name_to_id = {c.name.strip().lower(): c.id for c in created_characters}

            # 4. Persist Character Relationships
            rel_items = data.get("relationships", [])
            for r in rel_items:
                source_id = r.get("source_character_id")
                if not source_id and r.get("source_character_name"):
                    source_id = name_to_id.get(r["source_character_name"].strip().lower())

                target_id = r.get("target_character_id")
                if not target_id and r.get("target_character_name"):
                    target_id = name_to_id.get(r["target_character_name"].strip().lower())

                # If we have both character IDs, persist relationship
                if source_id and target_id:
                    rel_record = CharacterRelationshipRecord(
                        project_id=project_id,
                        world_candidate_id=world_candidate_id,
                        source_character_id=source_id,
                        target_character_id=target_id,
                        relation_type=r.get("relation_type", "Dynamic Tension"),
                        dynamic_description=r.get("dynamic_description", ""),
                    )
                    self.session.add(rel_record)

            # 5. Persist Scenes
            scene_items = data.get("scenes", [])
            for s in scene_items:
                characters_involved = s.get("characters_involved", [])
                scene_record = SceneRecord(
                    project_id=project_id,
                    world_candidate_id=world_candidate_id,
                    scene_number=s.get("scene_number", 1),
                    title=s.get("title", "Untitled Scene"),
                    location_setting=s.get("location_setting") or s.get("setting", ""),
                    characters_involved_json=json.dumps(characters_involved if isinstance(characters_involved, list) else []),
                    dramatic_question=s.get("dramatic_question", ""),
                    conflict_narrative=s.get("conflict_narrative") or s.get("conflict", ""),
                    pivotal_outcome=s.get("pivotal_outcome") or s.get("outcome", ""),
                    visual_prompt=s.get("visual_prompt", ""),
                )
                self.session.add(scene_record)

            # 6. Update project status to universe_unfolded
            project = await self.get_project(project_id)
            if project:
                project.status = "universe_unfolded"
                self.session.add(project)

            # Commit the atomic transaction
            await self.session.commit()

            unfolded = await self.get_unfolded_universe(project_id)
            if not unfolded:
                raise RuntimeError("Failed to retrieve unfolded universe after commit")
            return unfolded

        except Exception:
            await self.session.rollback()
            raise

    async def get_unfolded_universe(self, project_id: str) -> Optional[UnfoldedUniverseRead]:
        """Fetch the complete unfolded universe codex for a project."""
        # 1. Fetch latest WorldBibleRecord
        bible_stmt = (
            select(WorldBibleRecord)
            .where(WorldBibleRecord.project_id == project_id)
            .order_by(WorldBibleRecord.created_at.desc())
            .limit(1)
        )
        bible_res = await self.session.execute(bible_stmt)
        bible = bible_res.scalar_one_or_none()
        if not bible:
            return None

        world_candidate_id = bible.world_candidate_id

        # 2. Fetch Characters
        char_stmt = (
            select(CharacterRecord)
            .where(
                CharacterRecord.project_id == project_id,
                CharacterRecord.world_candidate_id == world_candidate_id,
            )
            .order_by(CharacterRecord.created_at.asc())
        )
        char_res = await self.session.execute(char_stmt)
        characters = list(char_res.scalars().all())

        id_to_name = {c.id: c.name for c in characters}

        # 3. Fetch Relationships
        rel_stmt = (
            select(CharacterRelationshipRecord)
            .where(
                CharacterRelationshipRecord.project_id == project_id,
                CharacterRelationshipRecord.world_candidate_id == world_candidate_id,
            )
            .order_by(CharacterRelationshipRecord.created_at.asc())
        )
        rel_res = await self.session.execute(rel_stmt)
        relationships = list(rel_res.scalars().all())

        # 4. Fetch Scenes
        scene_stmt = (
            select(SceneRecord)
            .where(
                SceneRecord.project_id == project_id,
                SceneRecord.world_candidate_id == world_candidate_id,
            )
            .order_by(SceneRecord.scene_number.asc())
        )
        scene_res = await self.session.execute(scene_stmt)
        scenes = list(scene_res.scalars().all())

        return UnfoldedUniverseRead(
            world_bible=bible.to_read_schema(),
            characters=[c.to_read_schema() for c in characters],
            relationships=[
                r.to_read_schema(
                    source_name=id_to_name.get(r.source_character_id),
                    target_name=id_to_name.get(r.target_character_id),
                )
                for r in relationships
            ],
            scenes=[s.to_read_schema() for s in scenes],
        )

    async def get_raw_unfolded_records(
        self, project_id: str
    ) -> Tuple[
        Optional[WorldBibleRecord],
        List[CharacterRecord],
        List[CharacterRelationshipRecord],
        List[SceneRecord],
    ]:
        bible_stmt = select(WorldBibleRecord).where(WorldBibleRecord.project_id == project_id)
        bible_res = await self.session.execute(bible_stmt)
        bible = bible_res.scalars().first()

        char_stmt = (
            select(CharacterRecord)
            .where(CharacterRecord.project_id == project_id)
            .order_by(CharacterRecord.created_at.asc())
        )
        char_res = await self.session.execute(char_stmt)
        characters = list(char_res.scalars().all())

        rel_stmt = (
            select(CharacterRelationshipRecord)
            .where(CharacterRelationshipRecord.project_id == project_id)
            .order_by(CharacterRelationshipRecord.created_at.asc())
        )
        rel_res = await self.session.execute(rel_stmt)
        relationships = list(rel_res.scalars().all())

        scene_stmt = (
            select(SceneRecord)
            .where(SceneRecord.project_id == project_id)
            .order_by(SceneRecord.scene_number.asc())
        )
        scene_res = await self.session.execute(scene_stmt)
        scenes = list(scene_res.scalars().all())

        return bible, characters, relationships, scenes

    async def create_entity_revision(self, revision: EntityRevisionRecord) -> EntityRevisionRecord:
        self.session.add(revision)
        await self.session.commit()
        await self.session.refresh(revision)
        return revision

    async def get_entity_revisions(
        self, project_id: str, entity_id: Optional[str] = None
    ) -> List[EntityRevisionRecord]:
        query = select(EntityRevisionRecord).where(EntityRevisionRecord.project_id == project_id)
        if entity_id:
            query = query.where(EntityRevisionRecord.entity_id == entity_id)
        query = query.order_by(EntityRevisionRecord.created_at.desc(), EntityRevisionRecord.version.desc())
        res = await self.session.execute(query)
        return list(res.scalars().all())

    async def get_project_branches(self, project_id: str) -> List[Project]:
        curr = await self.get_project(project_id)
        if not curr:
            return []
        root_id = curr.parent_project_id or curr.id
        stmt = (
            select(Project)
            .where((Project.id == root_id) | (Project.parent_project_id == root_id))
            .order_by(Project.created_at.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def refine_character(
        self, project_id: str, char_id: str, updates: CharacterRefineRequest
    ) -> Optional[CharacterRecord]:
        stmt = select(CharacterRecord).where(
            CharacterRecord.id == char_id,
            CharacterRecord.project_id == project_id,
        )
        res = await self.session.execute(stmt)
        record = res.scalars().first()
        if not record:
            return None

        # Capture snapshot before mutating
        snapshot_before = json.dumps(record.to_read_schema().model_dump(), default=str)
        rev_before = EntityRevisionRecord(
            project_id=project_id,
            entity_type="character",
            entity_id=char_id,
            version=record.version,
            snapshot_json=snapshot_before,
            revision_notes=f"Snapshot before revision v{record.version + 1}: {updates.revision_notes}",
        )
        self.session.add(rev_before)

        # Mutate
        if updates.motivation is not None:
            record.motivation = updates.motivation
        if updates.core_conflict is not None:
            record.core_conflict = updates.core_conflict
        if updates.role is not None:
            record.role = updates.role
        record.revision_notes = updates.revision_notes
        record.version += 1

        # Capture snapshot after mutating
        snapshot_after = json.dumps(record.to_read_schema().model_dump(), default=str)
        rev_after = EntityRevisionRecord(
            project_id=project_id,
            entity_type="character",
            entity_id=char_id,
            version=record.version,
            snapshot_json=snapshot_after,
            revision_notes=updates.revision_notes,
        )
        self.session.add(rev_after)

        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def refine_scene(
        self, project_id: str, scene_id: str, updates: SceneRefineRequest
    ) -> Optional[SceneRecord]:
        stmt = select(SceneRecord).where(
            SceneRecord.id == scene_id,
            SceneRecord.project_id == project_id,
        )
        res = await self.session.execute(stmt)
        record = res.scalars().first()
        if not record:
            return None

        snapshot_before = json.dumps(record.to_read_schema().model_dump(), default=str)
        rev_before = EntityRevisionRecord(
            project_id=project_id,
            entity_type="scene",
            entity_id=scene_id,
            version=record.version,
            snapshot_json=snapshot_before,
            revision_notes=f"Snapshot before revision v{record.version + 1}: {updates.revision_notes}",
        )
        self.session.add(rev_before)

        if updates.dramatic_question is not None:
            record.dramatic_question = updates.dramatic_question
        if updates.conflict_narrative is not None:
            record.conflict_narrative = updates.conflict_narrative
        if updates.pivotal_outcome is not None:
            record.pivotal_outcome = updates.pivotal_outcome
        record.revision_notes = updates.revision_notes
        record.version += 1

        snapshot_after = json.dumps(record.to_read_schema().model_dump(), default=str)
        rev_after = EntityRevisionRecord(
            project_id=project_id,
            entity_type="scene",
            entity_id=scene_id,
            version=record.version,
            snapshot_json=snapshot_after,
            revision_notes=updates.revision_notes,
        )
        self.session.add(rev_after)

        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def create_snapshot_asset(
        self, project_id: str, storage_key: str, size_bytes: int, version: int = 1
    ) -> Asset:
        asset = Asset(
            project_id=project_id,
            asset_type="project_snapshot",
            mime_type="application/json",
            storage_key=storage_key,
            size_bytes=size_bytes,
            version=version,
        )
        self.session.add(asset)
        await self.session.commit()
        await self.session.refresh(asset)
        return asset

    async def list_project_snapshots(self, project_id: str) -> List[Asset]:
        stmt = (
            select(Asset)
            .where(Asset.project_id == project_id, Asset.asset_type == "project_snapshot")
            .order_by(Asset.created_at.desc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def create_canonical_demo_project(self) -> Project:
        """Atomically seed the complete canonical Bio-City universe for zero-latency hackathon demos.

        Populates:
        - Project ("The Sunken City: Bio-City")
        - SeedDNA (canonical ocean seed)
        - 3 World Candidates (Lost Civilization, Bio-City, Time Capsule)
        - World Selection (Bio-City selected)
        - World Bible (Bio-City canon, locations, factions, timeline)
        - Characters (Dr. Althea Thorne, Sentry Unit Nereus, Kaelen)
        - Character Relationships (3 relationships)
        - Scenes (Scenes 1, 2, and 3)
        - Baseline Entity Revisions (Dr. Althea Thorne v1, Scene 1 v1)
        """
        # 1. Create Project
        project = Project(
            title="The Sunken City: Bio-City",
            seed_text="A child discovers a forgotten city beneath the ocean.",
            status="universe_unfolded",
            branch_name="main",
        )
        self.session.add(project)
        await self.session.flush()

        # 2. Add Seed DNA
        dna_record = SeedDNARecord(
            project_id=project.id,
            raw_seed=project.seed_text,
            premise=CANONICAL_SEED_DNA["premise"],
            themes_json=json.dumps(CANONICAL_SEED_DNA["themes"]),
            entities_json=json.dumps(CANONICAL_SEED_DNA["entities"]),
            constraints_json=json.dumps(CANONICAL_SEED_DNA["constraints"]),
            tone=CANONICAL_SEED_DNA["tone"],
            domain_keywords_json=json.dumps(CANONICAL_SEED_DNA["domain_keywords"]),
        )
        self.session.add(dna_record)
        await self.session.flush()

        # 3. Add 3 World Candidates
        batch_id = str(uuid.uuid4())
        created_worlds: List[WorldCandidateRecord] = []
        for w in CANONICAL_WORLDS:
            world_rec = WorldCandidateRecord(
                project_id=project.id,
                seed_dna_id=dna_record.id,
                batch_id=batch_id,
                candidate_index=w["index"],
                title=w["title"],
                archetype=w["archetype"],
                concept=w["concept"],
                aesthetic=w["aesthetic"],
                core_tension=w["core_tension"],
                trade_offs=w["trade_offs"],
                key_visual=w["key_visual"],
                divergence_archetype=w.get("divergence_archetype", "familiar"),
                exploration_profile_json=json.dumps(w.get("exploration_profile", {})),
                emphasized_potential_labels_json=json.dumps(w.get("emphasized_potential_labels", [])),
            )
            self.session.add(world_rec)
            created_worlds.append(world_rec)

        await self.session.flush()

        # Candidate 2 is Bio-City (candidate_index == 2)
        bio_city_candidate = next((cw for cw in created_worlds if cw.candidate_index == 2), created_worlds[1])
        project.selected_world_id = bio_city_candidate.id
        self.session.add(project)

        # 4. Add World Selection Record
        selection = WorldSelectionRecord(
            project_id=project.id,
            world_candidate_id=bio_city_candidate.id,
            batch_id=batch_id,
            user_rationale="Selected Bio-City (Symbiotic / Ecological) for deep biopunk exploration and rich ecological tension.",
            creative_priorities_json=json.dumps([
                "Ecological / Symbiotic Mystery",
                "Atmospheric Lore Depth",
                "Ethical Stakes",
            ]),
            rejected_directions_json=json.dumps([
                "Classical sunken ruins archaeology",
                "Cold War militarized technology",
            ]),
            custom_directives="Ensure coral bio-luminescence and symbiotic sentience remain central across all layers.",
        )
        self.session.add(selection)

        # 5. Retrieve canonical unfolding data for Bio-City
        mock_provider = MockProvider()
        unfold_data = await mock_provider.unfold_universe({
            "raw_seed": "a child discovers a forgotten city beneath the ocean",
            "selected_world": {"title": "Bio-City"},
        })

        # 6. Save World Bible
        bible_data = unfold_data.get("world_bible", {})
        timeline_items = bible_data.get("history_timeline", [])
        factions_items = bible_data.get("factions", [])
        canon_facts = bible_data.get("canon_facts", [])
        locations_items = bible_data.get("key_locations", [])

        bible_record = WorldBibleRecord(
            project_id=project.id,
            world_candidate_id=bio_city_candidate.id,
            geography=bible_data.get("geography", ""),
            physics_rules=bible_data.get("physics_rules", ""),
            history_timeline_json=json.dumps(timeline_items),
            factions_json=json.dumps(factions_items),
            canon_facts_json=json.dumps(canon_facts),
            key_locations_json=json.dumps(locations_items),
            visual_style_prompt=bible_data.get("visual_style_prompt", ""),
        )
        self.session.add(bible_record)

        # 7. Save Characters
        created_characters: List[CharacterRecord] = []
        for c in unfold_data.get("characters", []):
            char_record = CharacterRecord(
                project_id=project.id,
                world_candidate_id=bio_city_candidate.id,
                name=c.get("name", "Unnamed"),
                role=c.get("role", "Cast Member"),
                archetype=c.get("archetype", "Archetype"),
                motivation=c.get("motivation", ""),
                core_conflict=c.get("core_conflict") or c.get("conflict", ""),
                visual_prompt=c.get("visual_prompt", ""),
                version=1,
            )
            self.session.add(char_record)
            created_characters.append(char_record)

        await self.session.flush()

        name_to_id = {c.name.strip().lower(): c.id for c in created_characters}

        # 8. Save Character Relationships
        for r in unfold_data.get("relationships", []):
            source_id = name_to_id.get(r.get("source_character_name", "").strip().lower())
            target_id = name_to_id.get(r.get("target_character_name", "").strip().lower())
            if source_id and target_id:
                rel_record = CharacterRelationshipRecord(
                    project_id=project.id,
                    world_candidate_id=bio_city_candidate.id,
                    source_character_id=source_id,
                    target_character_id=target_id,
                    relation_type=r.get("relation_type", "Dynamic Tension"),
                    dynamic_description=r.get("dynamic_description", ""),
                )
                self.session.add(rel_record)

        # 9. Save Scenes (Scenes 1 & 2 + Scene 3 for complete 3-scene arc)
        scene_items = list(unfold_data.get("scenes", []))
        if len(scene_items) < 3:
            scene_items.append({
                "scene_number": 3,
                "title": "Heart of the Siphonophore",
                "location_setting": "The Abyssal Coral Neural Core",
                "characters_involved": ["Dr. Althea Thorne", "Kaelen"],
                "dramatic_question": "Can Althea and Kaelen prevent the neural core from severing its link with the surface world?",
                "conflict_narrative": "Toxic runoff from an illegal deep-sea drilling rig penetrates the outer caldera, threatening the core with irreparable necrotic collapse.",
                "pivotal_outcome": "Althea integrates her biometric slate into the neural core, reversing the necrosis and broadcasting a distress beacon across the ocean shelf.",
                "visual_prompt": "Climactic sci-fi underwater chamber, massive translucent siphonophore floating in a crystal sphere, glowing neural sparks, human figures backlit by cyan and gold bioluminescence, photorealistic 8k",
            })

        created_scenes: List[SceneRecord] = []
        for s in scene_items:
            scene_rec = SceneRecord(
                project_id=project.id,
                world_candidate_id=bio_city_candidate.id,
                scene_number=s.get("scene_number", 1),
                title=s.get("title", "Untitled Scene"),
                location_setting=s.get("location_setting") or s.get("setting", ""),
                characters_involved_json=json.dumps(s.get("characters_involved", [])),
                dramatic_question=s.get("dramatic_question", ""),
                conflict_narrative=s.get("conflict_narrative") or s.get("conflict", ""),
                pivotal_outcome=s.get("pivotal_outcome") or s.get("outcome", ""),
                visual_prompt=s.get("visual_prompt", ""),
                version=1,
            )
            self.session.add(scene_rec)
            created_scenes.append(scene_rec)

        await self.session.flush()

        # 10. Baseline Entity Revisions for Character and Scene
        if created_characters:
            lead_char = created_characters[0]
            rev_char = EntityRevisionRecord(
                project_id=project.id,
                entity_type="character",
                entity_id=lead_char.id,
                version=1,
                snapshot_json=json.dumps({
                    "name": lead_char.name,
                    "role": lead_char.role,
                    "archetype": lead_char.archetype,
                    "motivation": lead_char.motivation,
                    "core_conflict": lead_char.core_conflict,
                }),
                revision_notes="Initial baseline creation from Bio-City unfolding",
            )
            self.session.add(rev_char)

        if created_scenes:
            lead_scene = created_scenes[0]
            rev_scene = EntityRevisionRecord(
                project_id=project.id,
                entity_type="scene",
                entity_id=lead_scene.id,
                version=1,
                snapshot_json=json.dumps({
                    "title": lead_scene.title,
                    "location_setting": lead_scene.location_setting,
                    "dramatic_question": lead_scene.dramatic_question,
                    "conflict_narrative": lead_scene.conflict_narrative,
                    "pivotal_outcome": lead_scene.pivotal_outcome,
                }),
                revision_notes="Initial baseline creation from Bio-City unfolding",
            )
            self.session.add(rev_scene)

        # 11. Seed Canonical Potential Map Items
        for pot in CANONICAL_SEED_POTENTIAL:
            pot_rec = SeedPotentialItemRecord(
                project_id=project.id,
                label=pot["label"],
                category=pot["category"],
                confidence=pot["confidence"],
                source_evidence=pot["source_evidence"],
                user_status="accepted" if pot["category"] in ("explicit", "inferred") else "pending",
            )
            self.session.add(pot_rec)

        # Commit everything in this atomic transaction
        await self.session.commit()
        await self.session.refresh(project)
        return project

    async def save_potential_items(
        self, project_id: str, items: List[dict]
    ) -> List[SeedPotentialItemRecord]:
        """Save extracted potential items for a project, clearing previous pending ones if needed."""
        await self.session.execute(
            delete(SeedPotentialItemRecord).where(SeedPotentialItemRecord.project_id == project_id)
        )
        records = []
        for item in items:
            rec = SeedPotentialItemRecord(
                project_id=project_id,
                label=item.get("label", ""),
                category=item.get("category", "inferred"),
                confidence=float(item.get("confidence", 0.85)),
                source_evidence=item.get("source_evidence", ""),
                user_status=item.get("user_status", PotentialItemStatus.PENDING.value),
            )
            self.session.add(rec)
            records.append(rec)
        await self.session.commit()
        for r in records:
            await self.session.refresh(r)
        return records

    async def get_potential_items(
        self, project_id: str
    ) -> List[SeedPotentialItemRecord]:
        """Get all potential items for a project."""
        stmt = (
            select(SeedPotentialItemRecord)
            .where(SeedPotentialItemRecord.project_id == project_id)
            .order_by(SeedPotentialItemRecord.created_at.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def update_potential_item_status(
        self, project_id: str, item_id: str, status: str
    ) -> Optional[SeedPotentialItemRecord]:
        """Update user_status of a specific potential item."""
        stmt = select(SeedPotentialItemRecord).where(
            SeedPotentialItemRecord.id == item_id,
            SeedPotentialItemRecord.project_id == project_id,
        )
        res = await self.session.execute(stmt)
        rec = res.scalar_one_or_none()
        if not rec:
            return None
        rec.user_status = status
        self.session.add(rec)
        await self.session.commit()
        await self.session.refresh(rec)
        return rec

    async def batch_update_potential_item_statuses(
        self, project_id: str, updates: List[dict]
    ) -> List[SeedPotentialItemRecord]:
        """Batch update statuses for potential items."""
        updated = []
        for up in updates:
            item_id = up.get("id")
            status = up.get("user_status")
            if not item_id or not status:
                continue
            stmt = select(SeedPotentialItemRecord).where(
                SeedPotentialItemRecord.id == item_id,
                SeedPotentialItemRecord.project_id == project_id,
            )
            res = await self.session.execute(stmt)
            rec = res.scalar_one_or_none()
            if rec:
                rec.user_status = status
                self.session.add(rec)
                updated.append(rec)
        if updated:
            await self.session.commit()
            for rec in updated:
                await self.session.refresh(rec)
        return updated




