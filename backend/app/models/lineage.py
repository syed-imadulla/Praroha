from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


TraceNodeType = Literal[
    "root_seed",
    "seed_dna",
    "world_candidate",
    "human_selection",
    "world_bible",
    "key_location",
    "character",
    "character_revision",
    "relationship",
    "scene",
    "scene_revision",
]

TraceRelationType = Literal[
    "derived_from",
    "selected_by",
    "constrained_by",
    "appears_in",
    "generated_for",
    "refined_from",
]


class TraceNode(BaseModel):
    """Represents a discrete creative decision or generated entity in the causal DAG."""

    id: str = Field(description="Unique node identifier in the DAG, e.g. 'node-seed', 'node-loc-0'.")
    entity_id: str = Field(description="Underlying record UUID or deterministic identifier.")
    entity_type: str = Field(description="Type of the entity in the creative pipeline.")
    label: str = Field(description="Short human-readable label or badge.")
    title: str = Field(description="Full title of the entity.")
    stage: int = Field(description="Creative workflow stage index (1 to 5).")
    summary: str = Field(description="Brief summary or excerpt of the entity content.")
    causal_explanation: str = Field(
        description="Plain-language justification of why this entity exists without exposing raw model tokens (TRAC-03)."
    )
    parent_ids: List[str] = Field(
        default_factory=list,
        description="List of direct ancestor node IDs in the DAG.",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary structured metadata (e.g. location_index, archetype).",
    )
    origin_type: Optional[str] = Field(
        default=None,
        description="Universal origin classification: SEED_EXPLICIT, SEED_INFERRED, HUMAN_DECISION, DERIVED, AI_INTRODUCED, USER_ADDED.",
    )
    origin_source: Optional[str] = Field(
        default=None,
        description="Specific origin anchor or decision citation.",
    )


class TraceEdge(BaseModel):
    """Represents a directed causal link between parent and child creative entities."""

    id: str = Field(description="Unique edge identifier, e.g. 'edge-seed-dna'.")
    source: str = Field(description="Source/parent node ID.")
    target: str = Field(description="Target/child node ID.")
    relation_type: str = Field(
        description="Semantic relation type: derived_from, selected_by, constrained_by, appears_in, generated_for."
    )
    label: str = Field(description="Human-readable descriptor for the connection.")


class TraceGraphRead(BaseModel):
    """Composite response payload representing the entire project provenance DAG."""

    project_id: str
    root_node_id: str = "node-seed"
    nodes: List[TraceNode] = Field(default_factory=list)
    edges: List[TraceEdge] = Field(default_factory=list)
    selected_node_id: Optional[str] = None


class AncestorPathRead(BaseModel):
    """Response payload for a targeted ancestor trail traversal back to root seed."""

    node_id: str
    ancestor_nodes: List[TraceNode] = Field(default_factory=list)
    ancestor_edges: List[TraceEdge] = Field(default_factory=list)
    summary_explanation: str
