import json
from typing import AsyncGenerator, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel, select
from backend.app.config import settings
from backend.app.models.dna import SeedDNA, SeedDNARecord
from backend.app.models.project import Asset, AssetCreate, Project, ProjectCreate

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

