from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


ImpactClassification = Literal["AFFECTED", "CONDITIONAL", "PRESERVED"]
DependencyLinkType = Literal[
    "CAUSAL_DIRECT",
    "CAUSAL_TRANSITIVE",
    "CANON_RULE",
    "RELATIONSHIP",
    "HEURISTIC_AMBIGUOUS",
]


class ImpactedNodeRead(BaseModel):
    """Represents a universe node classified by the dependency blast radius analyzer."""

    entity_id: str = Field(description="Database UUID or identifier of the entity.")
    entity_type: str = Field(
        description="Entity type: world_bible, character, relationship, scene, media_asset."
    )
    name_or_title: str = Field(description="Name or title of the node for human readability.")
    classification: ImpactClassification = Field(
        description="AFFECTED (direct descendant), CONDITIONAL (thematic/contextual overlap requiring review), PRESERVED (isolated/locked)."
    )
    reason: str = Field(description="Deterministic explanation of why this classification was assigned.")
    link_type: DependencyLinkType = Field(
        description="Nature of the connection: CAUSAL_DIRECT, CAUSAL_TRANSITIVE, CANON_RULE, RELATIONSHIP, HEURISTIC_AMBIGUOUS."
    )
    is_locked: bool = Field(
        default=False,
        description="True if protected by Human-Only Zone or creator lock; requires explicit unlock to regenerate.",
    )
    is_approved: bool = Field(
        default=False,
        description="True if marked as approved by the creator.",
    )
    confidence: float = Field(
        default=1.0,
        description="Confidence score: 1.0 for established causal links, 0.7 for canon rules, 0.4 for ambiguous/heuristic.",
    )
    current_version: int = Field(default=1, description="Current entity revision version.")
    provenance_summary: Optional[str] = Field(
        default=None,
        description="Established origin anchor or citation.",
    )


class ImpactPreviewRequest(BaseModel):
    """Input payload to evaluate the blast radius of a proposed upstream change."""

    upstream_entity_type: str = Field(
        description="Entity type being modified: 'world_bible', 'seed_dna', 'character', 'world_candidate'."
    )
    upstream_entity_id: str = Field(description="UUID of the upstream entity being changed.")
    proposed_change: Dict[str, Any] = Field(
        description="Dictionary of proposed field updates, e.g. {'physics_rules': 'Water breathing is impossible without mechanical gills'}."
    )
    change_summary: Optional[str] = Field(
        default=None,
        description="Short description of the creator's proposed change.",
    )


class ImpactPreviewResponse(BaseModel):
    """Preview report returned to the creator before applying any changes to persistent state."""

    project_id: str
    upstream_entity_type: str
    upstream_entity_id: str
    change_summary: str
    affected_nodes: List[ImpactedNodeRead] = Field(default_factory=list)
    conditional_nodes: List[ImpactedNodeRead] = Field(default_factory=list)
    preserved_nodes: List[ImpactedNodeRead] = Field(default_factory=list)
    locked_node_count: int = 0
    has_ambiguous_provenance: bool = False
    ambiguity_warnings: List[str] = Field(default_factory=list)


class SelectiveRegenerateRequest(BaseModel):
    """Payload to execute controlled selective regeneration on approved candidate subtrees."""

    upstream_entity_type: str = Field(
        description="Entity type being modified: 'world_bible', 'seed_dna', 'character'."
    )
    upstream_entity_id: str = Field(description="UUID of the upstream entity being changed.")
    proposed_change: Dict[str, Any] = Field(description="The validated changes to apply upstream.")
    selected_entity_ids: List[str] = Field(
        default_factory=list,
        description="Explicit list of downstream entity IDs authorized by the creator to regenerate.",
    )
    force_unlock_entity_ids: List[str] = Field(
        default_factory=list,
        description="Explicit confirmation list of locked entity IDs that creator deliberately chooses to unlock.",
    )
    expected_versions: Optional[Dict[str, int]] = Field(
        default=None,
        description="Optimistic concurrency control mapping entity_id -> expected version.",
    )
    change_summary: Optional[str] = Field(
        default=None,
        description="Human-readable reason for the regeneration run.",
    )


class SelectiveRegenerateResponse(BaseModel):
    """Result report summarizing regenerated entities, preserved entities, and audit revisions."""

    project_id: str
    regenerated_entities: List[Dict[str, Any]] = Field(default_factory=list)
    preserved_entities: List[Dict[str, Any]] = Field(default_factory=list)
    revisions_created: List[Dict[str, Any]] = Field(default_factory=list)
    updated_creative_memory_version: int
    message: str
