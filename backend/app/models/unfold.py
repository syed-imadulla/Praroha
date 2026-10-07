import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel


OriginType = Literal[
    "SEED_EXPLICIT",
    "SEED_INFERRED",
    "HUMAN_DECISION",
    "DERIVED",
    "AI_INTRODUCED",
    "USER_ADDED",
]


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ==========================================
# Layer 1: World Bible & Key Locations
# ==========================================

class LocationItem(BaseModel):
    name: str
    description: str
    visual_prompt: str
    origin_type: str = "DERIVED"
    origin_source: Optional[str] = None


class FactionItem(BaseModel):
    name: str
    role: str
    agenda: str


class TimelineEvent(BaseModel):
    era: str
    event: str


class WorldBibleBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    world_candidate_id: str = Field(index=True, foreign_key="world_candidates.id")
    geography: str
    physics_rules: str
    history_timeline_json: str = Field(default="[]")
    factions_json: str = Field(default="[]")
    canon_facts_json: str = Field(default="[]")
    key_locations_json: str = Field(default="[]")
    visual_style_prompt: str


class WorldBibleRecord(WorldBibleBase, table=True):
    __tablename__ = "world_bibles"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self) -> "WorldBibleRead":
        try:
            timeline_raw = json.loads(self.history_timeline_json or "[]")
            timeline = [TimelineEvent(**t) if isinstance(t, dict) else TimelineEvent(era="Era", event=str(t)) for t in timeline_raw]
        except Exception:
            timeline = []

        try:
            factions_raw = json.loads(self.factions_json or "[]")
            factions = [FactionItem(**f) if isinstance(f, dict) else FactionItem(name=str(f), role="Faction", agenda="") for f in factions_raw]
        except Exception:
            factions = []

        try:
            canon_facts_raw = json.loads(self.canon_facts_json or "[]")
            if not isinstance(canon_facts_raw, list):
                canon_facts = []
            else:
                canon_facts = [
                    (item.get("fact") or item.get("rule") or item.get("text") or item.get("description") or str(item))
                    if isinstance(item, dict)
                    else str(item)
                    for item in canon_facts_raw
                ]
        except Exception:
            canon_facts = []

        try:
            locations_raw = json.loads(self.key_locations_json or "[]")
            key_locations = [LocationItem(**loc) if isinstance(loc, dict) else LocationItem(name=str(loc), description="", visual_prompt="") for loc in locations_raw]
        except Exception:
            key_locations = []

        return WorldBibleRead(
            id=self.id,
            project_id=self.project_id,
            world_candidate_id=self.world_candidate_id,
            geography=self.geography,
            physics_rules=self.physics_rules,
            history_timeline=timeline,
            factions=factions,
            canon_facts=canon_facts,
            key_locations=key_locations,
            visual_style_prompt=self.visual_style_prompt,
            created_at=self.created_at,
        )


class WorldBibleRead(BaseModel):
    id: str
    project_id: str
    world_candidate_id: str
    geography: str
    physics_rules: str
    history_timeline: List[TimelineEvent]
    factions: List[FactionItem]
    canon_facts: List[str]
    key_locations: List[LocationItem]
    visual_style_prompt: str
    created_at: datetime


# ==========================================
# Layer 2: Characters
# ==========================================

class CharacterBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    world_candidate_id: str = Field(index=True, foreign_key="world_candidates.id")
    name: str
    role: str
    archetype: str
    motivation: str
    core_conflict: str
    visual_prompt: str
    version: int = Field(default=1)
    revision_notes: Optional[str] = Field(default=None, nullable=True)
    origin_type: str = Field(default="AI_INTRODUCED")
    origin_source: Optional[str] = Field(default=None, nullable=True)


class CharacterRecord(CharacterBase, table=True):
    __tablename__ = "characters"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self) -> "CharacterRead":
        return CharacterRead(
            id=self.id,
            project_id=self.project_id,
            world_candidate_id=self.world_candidate_id,
            name=self.name,
            role=self.role,
            archetype=self.archetype,
            motivation=self.motivation,
            core_conflict=self.core_conflict,
            visual_prompt=self.visual_prompt,
            version=self.version,
            revision_notes=self.revision_notes,
            origin_type=self.origin_type,
            origin_source=self.origin_source,
            created_at=self.created_at,
        )


class CharacterRead(BaseModel):
    id: str
    project_id: str
    world_candidate_id: str
    name: str
    role: str
    archetype: str
    motivation: str
    core_conflict: str
    visual_prompt: str
    version: int = 1
    revision_notes: Optional[str] = None
    origin_type: str = "AI_INTRODUCED"
    origin_source: Optional[str] = None
    created_at: datetime


# ==========================================
# Layer 3: Character Relationships
# ==========================================

class CharacterRelationshipBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    world_candidate_id: str = Field(index=True, foreign_key="world_candidates.id")
    source_character_id: str = Field(foreign_key="characters.id")
    target_character_id: str = Field(foreign_key="characters.id")
    relation_type: str
    dynamic_description: str


class CharacterRelationshipRecord(CharacterRelationshipBase, table=True):
    __tablename__ = "character_relationships"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(
        self,
        source_name: Optional[str] = None,
        target_name: Optional[str] = None,
    ) -> "CharacterRelationshipRead":
        return CharacterRelationshipRead(
            id=self.id,
            project_id=self.project_id,
            world_candidate_id=self.world_candidate_id,
            source_character_id=self.source_character_id,
            target_character_id=self.target_character_id,
            source_character_name=source_name,
            target_character_name=target_name,
            relation_type=self.relation_type,
            dynamic_description=self.dynamic_description,
            created_at=self.created_at,
        )


class CharacterRelationshipRead(BaseModel):
    id: str
    project_id: str
    world_candidate_id: str
    source_character_id: str
    target_character_id: str
    source_character_name: Optional[str] = None
    target_character_name: Optional[str] = None
    relation_type: str
    dynamic_description: str
    created_at: datetime


# ==========================================
# Layer 4: Story Beats / Scenes
# ==========================================

class SceneBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    world_candidate_id: str = Field(index=True, foreign_key="world_candidates.id")
    scene_number: int
    title: str
    location_setting: str
    characters_involved_json: str = Field(default="[]")
    dramatic_question: str
    conflict_narrative: str
    pivotal_outcome: str
    visual_prompt: str
    version: int = Field(default=1)
    revision_notes: Optional[str] = Field(default=None, nullable=True)
    origin_type: str = Field(default="AI_INTRODUCED")
    origin_source: Optional[str] = Field(default=None, nullable=True)


class SceneRecord(SceneBase, table=True):
    __tablename__ = "scenes"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self) -> "SceneRead":
        try:
            characters_involved = json.loads(self.characters_involved_json or "[]")
            if not isinstance(characters_involved, list):
                characters_involved = []
        except Exception:
            characters_involved = []

        return SceneRead(
            id=self.id,
            project_id=self.project_id,
            world_candidate_id=self.world_candidate_id,
            scene_number=self.scene_number,
            title=self.title,
            location_setting=self.location_setting,
            characters_involved=characters_involved,
            dramatic_question=self.dramatic_question,
            conflict_narrative=self.conflict_narrative,
            pivotal_outcome=self.pivotal_outcome,
            visual_prompt=self.visual_prompt,
            version=self.version,
            revision_notes=self.revision_notes,
            origin_type=self.origin_type,
            origin_source=self.origin_source,
            created_at=self.created_at,
        )


class SceneRead(BaseModel):
    id: str
    project_id: str
    world_candidate_id: str
    scene_number: int
    title: str
    location_setting: str
    characters_involved: List[str]
    dramatic_question: str
    conflict_narrative: str
    pivotal_outcome: str
    visual_prompt: str
    version: int = 1
    revision_notes: Optional[str] = None
    origin_type: str = "AI_INTRODUCED"
    origin_source: Optional[str] = None
    created_at: datetime


# ==========================================
# Aggregated Unified Codex Schema
# ==========================================

class UnfoldedUniverseRead(BaseModel):
    world_bible: WorldBibleRead
    characters: List[CharacterRead]
    relationships: List[CharacterRelationshipRead]
    scenes: List[SceneRead]
