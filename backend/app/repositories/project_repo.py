import json
from typing import AsyncGenerator, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from backend.app.config import settings
from backend.app.models.dna import SeedDNA, SeedDNARecord
from backend.app.models.project import Asset, AssetCreate, Project, ProjectCreate
from backend.app.models.selection import WorldSelectionRecord
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


