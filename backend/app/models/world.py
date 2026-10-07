import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DivergenceArchetype(str, Enum):
    familiar = "familiar"
    radical = "radical"
    inverse = "inverse"


class ExplorationProfile(BaseModel):
    """Normalized metrics (0-100%) capturing the divergence dimensions of a world."""
    seed_fidelity: int = PydanticField(default=80, ge=0, le=100, description="Alignment with seed anchors (0-100%)")
    novelty: int = PydanticField(default=70, ge=0, le=100, description="Conceptual originality and surprise (0-100%)")
    conceptual_distance: int = PydanticField(default=50, ge=0, le=100, description="Departure from genre tropes (0-100%)")
    feasibility: int = PydanticField(default=80, ge=0, le=100, description="World stability and narrative tractability (0-100%)")
    summary: str = PydanticField(default="Balanced exploration profile", description="Profile rationale summary")


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
    divergence_archetype: str = PydanticField(default="familiar", description="Divergence archetype: familiar, radical, or inverse")
    exploration_profile: ExplorationProfile = PydanticField(default_factory=ExplorationProfile)
    emphasized_potential_labels: List[str] = PydanticField(default_factory=list, description="Seed potential labels emphasized in this candidate")


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
    divergence_archetype: str = Field(default="familiar")
    exploration_profile_json: str = Field(default="{}")
    emphasized_potential_labels_json: str = Field(default="[]")


class WorldCandidateRecord(WorldCandidateBase, table=True):
    __tablename__ = "world_candidates"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_candidate(self) -> WorldCandidate:
        try:
            profile_dict = json.loads(self.exploration_profile_json) if self.exploration_profile_json else {}
            profile = ExplorationProfile.model_validate(profile_dict)
        except Exception:
            profile = ExplorationProfile()

        try:
            potential_labels = json.loads(self.emphasized_potential_labels_json) if self.emphasized_potential_labels_json else []
        except Exception:
            potential_labels = []

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
            divergence_archetype=self.divergence_archetype or "familiar",
            exploration_profile=profile,
            emphasized_potential_labels=potential_labels,
        )

    def to_read_schema(self) -> "WorldCandidateRead":
        try:
            profile_dict = json.loads(self.exploration_profile_json) if self.exploration_profile_json else {}
            profile = ExplorationProfile.model_validate(profile_dict)
        except Exception:
            profile = ExplorationProfile()

        try:
            potential_labels = json.loads(self.emphasized_potential_labels_json) if self.emphasized_potential_labels_json else []
        except Exception:
            potential_labels = []

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
            divergence_archetype=self.divergence_archetype or "familiar",
            exploration_profile=profile,
            emphasized_potential_labels=potential_labels,
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
    divergence_archetype: str = "familiar"
    exploration_profile: ExplorationProfile = PydanticField(default_factory=ExplorationProfile)
    emphasized_potential_labels: List[str] = PydanticField(default_factory=list)
