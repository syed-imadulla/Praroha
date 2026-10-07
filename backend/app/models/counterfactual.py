from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from backend.app.models.world import ExplorationProfile


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


DeltaDimensionType = Literal[
    "protagonist",
    "tone_atmosphere",
    "central_conflict",
    "world_rules",
    "trade_offs",
]


class CounterfactualCandidateRead(BaseModel):
    """Structured representation of a rejected world candidate available for counterfactual exploration."""
    id: str
    index: int
    title: str
    archetype: str
    concept: str
    aesthetic: str
    core_tension: str
    trade_offs: str
    key_visual: str
    divergence_archetype: str = "familiar"
    exploration_profile: ExplorationProfile = Field(default_factory=ExplorationProfile)
    inferred_exclusion: str = Field(
        default="",
        description="Creative trope or direction intentionally avoided by not selecting this candidate",
    )


class CounterfactualDeltaDimension(BaseModel):
    """Comparative delta analysis across a key story dimension."""
    dimension: DeltaDimensionType
    title: str
    canon_value: str
    counterfactual_value: str
    divergence_analysis: str
    divergence_level: Literal["subtle", "moderate", "radical", "inverse"] = "moderate"


class ExplorationProfileComparison(BaseModel):
    """Exploration profile delta metrics comparing canon and counterfactual candidates."""
    canon_profile: ExplorationProfile
    counterfactual_profile: ExplorationProfile
    seed_fidelity_delta: int = 0
    novelty_delta: int = 0
    conceptual_distance_delta: int = 0
    feasibility_delta: int = 0
    summary: str = "Comparative exploration profile"


class CounterfactualDeltaResponse(BaseModel):
    """Structured response detailing the delta between active universe canon and a counterfactual candidate."""
    project_id: str
    canon_world_id: str
    counterfactual_world_id: str
    canon_title: str
    counterfactual_title: str
    decision_dna_rationale: Optional[str] = None
    dimensions: List[CounterfactualDeltaDimension]
    profile_comparison: ExplorationProfileComparison
    suggested_branch_name: str


class ForkCounterfactualRequest(BaseModel):
    """Request payload for spawning an isolated timeline branch rooted in a rejected candidate."""
    candidate_id: str
    branch_name: Optional[str] = None
    rationale: Optional[str] = None


class CounterfactualMetadata(BaseModel):
    """Metadata persisted in project.counterfactual_metadata_json on child timeline branches."""
    parent_project_id: str
    counterfactual_candidate_id: str
    counterfactual_title: str
    forked_at: datetime = Field(default_factory=get_utc_now)
    rationale: Optional[str] = None
