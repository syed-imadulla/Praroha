import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel

from backend.app.models.dna import SeedDNARead
from backend.app.models.lineage import TraceGraphRead
from backend.app.models.project import ProjectRead
from backend.app.models.unfold import UnfoldedUniverseRead
from backend.app.models.selection import WorldSelectionRead
from backend.app.models.world import WorldCandidateRead


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class EntityRevisionBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    entity_type: str = Field(index=True)  # 'character' | 'scene'
    entity_id: str = Field(index=True)
    version: int = Field(index=True)
    snapshot_json: str
    revision_notes: str


class EntityRevisionRecord(EntityRevisionBase, table=True):
    __tablename__ = "entity_revisions"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self) -> "EntityRevisionRead":
        return EntityRevisionRead(
            id=self.id,
            project_id=self.project_id,
            entity_type=self.entity_type,
            entity_id=self.entity_id,
            version=self.version,
            snapshot_json=self.snapshot_json,
            revision_notes=self.revision_notes,
            created_at=self.created_at,
        )


class EntityRevisionRead(BaseModel):
    id: str
    project_id: str
    entity_type: str
    entity_id: str
    version: int
    snapshot_json: str
    revision_notes: str
    created_at: datetime


class BranchCreate(BaseModel):
    branch_name: str = PydanticField(description="Human-friendly label for the forked timeline")
    branch_point_stage: int = PydanticField(default=5, description="Pipeline stage to fork from (3, 4, or 5)")
    rationale: Optional[str] = PydanticField(default=None, description="Creative intent for branching")


class BranchRead(BaseModel):
    id: str
    parent_project_id: Optional[str] = None
    branch_name: str
    title: str
    status: str
    created_at: datetime


class CharacterRefineRequest(BaseModel):
    motivation: Optional[str] = None
    core_conflict: Optional[str] = None
    role: Optional[str] = None
    revision_notes: str = PydanticField(description="Explanation of what changed and why")


class SceneRefineRequest(BaseModel):
    dramatic_question: Optional[str] = None
    conflict_narrative: Optional[str] = None
    pivotal_outcome: Optional[str] = None
    revision_notes: str = PydanticField(description="Explanation of what changed and why")


class ProjectBundle(BaseModel):
    format_version: str = "1.0"
    exported_at: datetime = PydanticField(default_factory=get_utc_now)
    project: ProjectRead
    seed_dna: Optional[SeedDNARead] = None
    worlds: List[WorldCandidateRead] = []
    selection: Optional[WorldSelectionRead] = None
    unfolded_universe: Optional[UnfoldedUniverseRead] = None
    revisions: List[EntityRevisionRead] = []
    lineage: Optional[TraceGraphRead] = None


class SnapshotRead(BaseModel):
    id: str
    project_id: str
    storage_key: str
    size_bytes: int
    version: int
    created_at: datetime
