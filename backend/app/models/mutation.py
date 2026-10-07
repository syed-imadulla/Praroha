from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field as PydanticField


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


PremiseVariableType = Literal[
    "core_premise",
    "tone_atmosphere",
    "central_conflict",
    "world_rule",
]

EntityImpactCategory = Literal[
    "AFFECTED",
    "CONDITIONAL",
    "PRESERVED",
]


class PremiseVariableRead(BaseModel):
    """Premise variable available for counterfactual mutation."""
    id: str
    variable_type: PremiseVariableType
    label: str
    original_value: str
    source_entity: str


class SeedMutationRequest(BaseModel):
    """Request payload to simulate a counterfactual seed mutation."""
    mutated_variable: str
    original_value: str
    new_value: str
    hypothesis_prompt: Optional[str] = None


class EntityImpactItem(BaseModel):
    """Classification and causal justification for an individual universe entity."""
    entity_id: str
    entity_type: str  # world_bible | location | character | relationship | scene
    title: str
    impact_category: EntityImpactCategory
    causal_justification: str
    projected_impact: str
    original_summary: str


class MutationSimulationResponse(BaseModel):
    """Response containing impact classification and preview for downstream entities."""
    project_id: str
    mutated_variable: str
    original_value: str
    new_value: str
    hypothesis_prompt: Optional[str] = None
    suggested_branch_name: str
    impacted_entities: List[EntityImpactItem]
    summary_counts: Dict[str, int]


class ForkMutationRequest(BaseModel):
    """Request payload to fork a mutated universe into an isolated child branch."""
    mutated_variable: str
    original_value: str
    new_value: str
    hypothesis_prompt: Optional[str] = None
    branch_name: str
    rationale: Optional[str] = None


class MutationMetadata(BaseModel):
    """Structured mutation metadata persisted on the child project record."""
    mutated_variable: str
    original_value: str
    new_value: str
    hypothesis_prompt: Optional[str] = None
    impact_summary: Dict[str, int]
    applied_at: datetime = PydanticField(default_factory=get_utc_now)
