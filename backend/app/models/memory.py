import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ==========================================
# Creative Memory Item Schemas
# ==========================================

class CanonRuleItem(BaseModel):
    rule: str
    category: str = "world_law"  # physics, ecology, cosmology, society
    origin_type: str = "SEED_EXPLICIT"
    source_id: Optional[str] = None
    is_hard_rule: bool = True


class CharacterProfileItem(BaseModel):
    character_id: str
    name: str
    role: str
    archetype: str
    motivation: str
    core_conflict: str
    visual_prompt: str = ""
    flaws: List[str] = PydanticField(default_factory=list)
    origin_type: str = "AI_INTRODUCED"
    is_locked: bool = False


class MemoryRelationshipItem(BaseModel):
    source_character_id: str
    target_character_id: str
    source_character_name: str
    target_character_name: str
    relation_type: str
    dynamic_description: str
    tension_level: str = "medium"  # low, medium, high, critical


class TimelineAnchorItem(BaseModel):
    era: str
    event: str
    chronology_order: int = 0


# ==========================================
# SQLModel Table & Base
# ==========================================

class CreativeMemoryBase(SQLModel):
    project_id: str = Field(index=True, unique=True, foreign_key="projects.id")
    world_candidate_id: Optional[str] = Field(default=None, nullable=True, foreign_key="world_candidates.id")
    canon_rules_json: str = Field(default="[]")
    character_profiles_json: str = Field(default="[]")
    relationship_matrix_json: str = Field(default="[]")
    timeline_anchors_json: str = Field(default="[]")
    creator_locks_json: str = Field(default="{}")
    negative_constraints_json: str = Field(default="[]")
    provenance_json: str = Field(default="{}")
    version: int = Field(default=1)


class CreativeMemoryRecord(CreativeMemoryBase, table=True):
    __tablename__ = "creative_memory"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self) -> "CreativeMemoryRead":
        try:
            canon_rules = json.loads(self.canon_rules_json or "[]")
            if not isinstance(canon_rules, list):
                canon_rules = []
        except Exception:
            canon_rules = []

        try:
            characters = json.loads(self.character_profiles_json or "[]")
            if not isinstance(characters, list):
                characters = []
        except Exception:
            characters = []

        try:
            relationships = json.loads(self.relationship_matrix_json or "[]")
            if not isinstance(relationships, list):
                relationships = []
        except Exception:
            relationships = []

        try:
            timeline = json.loads(self.timeline_anchors_json or "[]")
            if not isinstance(timeline, list):
                timeline = []
        except Exception:
            timeline = []

        try:
            creator_locks = json.loads(self.creator_locks_json or "{}")
            if not isinstance(creator_locks, dict):
                creator_locks = {}
        except Exception:
            creator_locks = {}

        try:
            negative_constraints = json.loads(self.negative_constraints_json or "[]")
            if not isinstance(negative_constraints, list):
                negative_constraints = []
        except Exception:
            negative_constraints = []

        try:
            provenance = json.loads(self.provenance_json or "{}")
            if not isinstance(provenance, dict):
                provenance = {}
        except Exception:
            provenance = {}

        return CreativeMemoryRead(
            id=self.id,
            project_id=self.project_id,
            world_candidate_id=self.world_candidate_id,
            canon_rules=canon_rules,
            character_profiles=characters,
            relationship_matrix=relationships,
            timeline_anchors=timeline,
            creator_locks=creator_locks,
            negative_constraints=negative_constraints,
            provenance=provenance,
            version=self.version,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )


class CreativeMemoryRead(BaseModel):
    id: str
    project_id: str
    world_candidate_id: Optional[str]
    canon_rules: List[Dict[str, Any]]
    character_profiles: List[Dict[str, Any]]
    relationship_matrix: List[Dict[str, Any]]
    timeline_anchors: List[Dict[str, Any]]
    creator_locks: Dict[str, Any]
    negative_constraints: List[str]
    provenance: Dict[str, Any]
    version: int
    created_at: datetime
    updated_at: datetime
