import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from sqlmodel import Field, SQLModel
from backend.app.models.world import WorldCandidateRead


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WorldSelectionCreate(BaseModel):
    user_rationale: Optional[str] = None


class WorldSelectionBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    world_candidate_id: str = Field(index=True, foreign_key="world_candidates.id")
    batch_id: str = Field(index=True)
    user_rationale: Optional[str] = Field(default=None, nullable=True)


class WorldSelectionRecord(WorldSelectionBase, table=True):
    __tablename__ = "world_selections"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self, candidate: WorldCandidateRead) -> "WorldSelectionRead":
        return WorldSelectionRead(
            id=self.id,
            project_id=self.project_id,
            world_candidate_id=self.world_candidate_id,
            batch_id=self.batch_id,
            user_rationale=self.user_rationale,
            selected_world=candidate,
            created_at=self.created_at,
        )


class WorldSelectionRead(BaseModel):
    id: str
    project_id: str
    world_candidate_id: str
    batch_id: str
    user_rationale: Optional[str] = None
    selected_world: WorldCandidateRead
    created_at: datetime
