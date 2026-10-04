import json
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

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Initialize database tables asynchronously."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

        def _migrate_columns(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)
            if "projects" in inspector.get_table_names():
                cols = [c["name"] for c in inspector.get_columns("projects")]
                if "selected_world_id" not in cols:
                    connection.execute(text("ALTER TABLE projects ADD COLUMN selected_world_id VARCHAR"))

        await conn.run_sync(_migrate_columns)


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

            bible_record = WorldBibleRecord(
                project_id=project_id,
                world_candidate_id=world_candidate_id,
                geography=bible_data.get("geography", ""),
                physics_rules=bible_data.get("physics_rules", ""),
                history_timeline_json=json.dumps([t if isinstance(t, dict) else t.model_dump() for t in timeline_items]),
                factions_json=json.dumps([f if isinstance(f, dict) else f.model_dump() for f in factions_items]),
                canon_facts_json=json.dumps(canon_facts if isinstance(canon_facts, list) else []),
                key_locations_json=json.dumps([loc if isinstance(loc, dict) else loc.model_dump() for loc in locations_items]),
                visual_style_prompt=bible_data.get("visual_style_prompt", ""),
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



