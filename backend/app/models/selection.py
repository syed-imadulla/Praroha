import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel
from backend.app.models.world import WorldCandidateRead


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DecisionDNA(BaseModel):
    selected_world_id: str
    selected_title: str
    selected_archetype: str
    user_rationale: Optional[str] = None
    creative_priorities: List[str] = PydanticField(default_factory=list)
    rejected_directions: List[str] = PydanticField(default_factory=list)
    custom_directives: Optional[str] = None
    created_at: datetime


class WorldSelectionCreate(BaseModel):
    user_rationale: Optional[str] = None
    creative_priorities: List[str] = PydanticField(default_factory=list)
    rejected_directions: List[str] = PydanticField(default_factory=list)
    custom_directives: Optional[str] = None


class WorldSelectionBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    world_candidate_id: str = Field(index=True, foreign_key="world_candidates.id")
    batch_id: str = Field(index=True)
    user_rationale: Optional[str] = Field(default=None, nullable=True)
    creative_priorities_json: str = Field(default="[]")
    rejected_directions_json: str = Field(default="[]")
    custom_directives: Optional[str] = Field(default=None, nullable=True)


class WorldSelectionRecord(WorldSelectionBase, table=True):
    __tablename__ = "world_selections"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_decision_dna(self, candidate: WorldCandidateRead) -> DecisionDNA:
        try:
            priorities = json.loads(self.creative_priorities_json or "[]")
            if not isinstance(priorities, list):
                priorities = []
        except Exception:
            priorities = []

        try:
            rejected = json.loads(self.rejected_directions_json or "[]")
            if not isinstance(rejected, list):
                rejected = []
        except Exception:
            rejected = []

        return DecisionDNA(
            selected_world_id=self.world_candidate_id,
            selected_title=candidate.title,
            selected_archetype=candidate.archetype,
            user_rationale=self.user_rationale,
            creative_priorities=priorities,
            rejected_directions=rejected,
            custom_directives=self.custom_directives,
            created_at=self.created_at,
        )

    def to_read_schema(self, candidate: WorldCandidateRead) -> "WorldSelectionRead":
        return WorldSelectionRead(
            id=self.id,
            project_id=self.project_id,
            world_candidate_id=self.world_candidate_id,
            batch_id=self.batch_id,
            user_rationale=self.user_rationale,
            selected_world=candidate,
            created_at=self.created_at,
            decision_dna=self.to_decision_dna(candidate),
        )


class WorldSelectionRead(BaseModel):
    id: str
    project_id: str
    world_candidate_id: str
    batch_id: str
    user_rationale: Optional[str] = None
    selected_world: WorldCandidateRead
    created_at: datetime
    decision_dna: Optional[DecisionDNA] = None

