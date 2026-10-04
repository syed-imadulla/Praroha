import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WorldCandidate(BaseModel):
    """Structured representation of a single creative world candidate."""
    id: str = PydanticField(description="Unique candidate identifier or slug")
    index: int = PydanticField(default=1, description="Candidate sequence number (1, 2, or 3)")
    title: str = PydanticField(description="Evocative title of the world")
    archetype: str = PydanticField(description="Creative archetype genre/theme (e.g. Lost Civilization, Bio-City)")
    concept: str = PydanticField(description="1-2 sentence high-concept premise logline")
    aesthetic: str = PydanticField(description="Visual mood, color palette, and environmental atmosphere")
    core_tension: str = PydanticField(description="Central dramatic conflict, crisis, or stakes")
    trade_offs: str = PydanticField(description="Creative pros/cons, emphasis vs sacrifices")
    key_visual: str = PydanticField(description="Signature scene vignette or focal cinematic visual")


class WorldCandidateBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    seed_dna_id: str = Field(index=True, foreign_key="seed_dna.id")
    batch_id: str = Field(index=True, description="UUID grouping all candidates from a generation run")
    candidate_index: int = Field(description="1, 2, or 3")
    title: str
    archetype: str
    concept: str
    aesthetic: str
    core_tension: str
    trade_offs: str
    key_visual: str
    model_used: str = Field(default="mock")
    fallback_used: bool = Field(default=False)


class WorldCandidateRecord(WorldCandidateBase, table=True):
    __tablename__ = "world_candidates"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_candidate(self) -> WorldCandidate:
        return WorldCandidate(
            id=self.id,
            index=self.candidate_index,
            title=self.title,
            archetype=self.archetype,
            concept=self.concept,
            aesthetic=self.aesthetic,
            core_tension=self.core_tension,
            trade_offs=self.trade_offs,
            key_visual=self.key_visual,
        )

    def to_read_schema(self) -> "WorldCandidateRead":
        return WorldCandidateRead(
            id=self.id,
            project_id=self.project_id,
            seed_dna_id=self.seed_dna_id,
            batch_id=self.batch_id,
            candidate_index=self.candidate_index,
            title=self.title,
            archetype=self.archetype,
            concept=self.concept,
            aesthetic=self.aesthetic,
            core_tension=self.core_tension,
            trade_offs=self.trade_offs,
            key_visual=self.key_visual,
            model_used=self.model_used,
            fallback_used=self.fallback_used,
            created_at=self.created_at,
        )


class WorldCandidateRead(BaseModel):
    id: str
    project_id: str
    seed_dna_id: str
    batch_id: str
    candidate_index: int
    title: str
    archetype: str
    concept: str
    aesthetic: str
    core_tension: str
    trade_offs: str
    key_visual: str
    model_used: str
    fallback_used: bool
    created_at: datetime
