import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SeedDNA(BaseModel):
    """Structured semantic intent extracted from a creative seed."""
    premise: str = PydanticField(description="Core distilled premise of the world")
    themes: List[str] = PydanticField(default_factory=list, description="Implicit dramatic and philosophical themes")
    entities: List[str] = PydanticField(default_factory=list, description="Core figures, places, relics, or systems")
    constraints: List[str] = PydanticField(default_factory=list, description="Strict negative boundaries and exclusions")
    tone: str = PydanticField(description="Emotional atmosphere and aesthetic tone")
    domain_keywords: List[str] = PydanticField(default_factory=list, description="Semantic anchors for world generation")


class SeedDNABase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    raw_seed: str
    premise: str
    themes_json: str = Field(default="[]")
    entities_json: str = Field(default="[]")
    constraints_json: str = Field(default="[]")
    tone: str
    domain_keywords_json: str = Field(default="[]")
    model_used: str = Field(default="mock")
    fallback_used: bool = Field(default=False)


class SeedDNARecord(SeedDNABase, table=True):
    __tablename__ = "seed_dna"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_seed_dna(self) -> SeedDNA:
        return SeedDNA(
            premise=self.premise,
            themes=json.loads(self.themes_json),
            entities=json.loads(self.entities_json),
            constraints=json.loads(self.constraints_json),
            tone=self.tone,
            domain_keywords=json.loads(self.domain_keywords_json),
        )

    def to_read_schema(self) -> "SeedDNARead":
        return SeedDNARead(
            id=self.id,
            project_id=self.project_id,
            raw_seed=self.raw_seed,
            dna=self.to_seed_dna(),
            fallback_used=self.fallback_used,
            model_used=self.model_used,
            created_at=self.created_at,
        )


class ExtractDNARequest(BaseModel):
    raw_seed: Optional[str] = None


class SeedDNARead(BaseModel):
    id: str
    project_id: str
    raw_seed: str
    dna: SeedDNA
    fallback_used: bool
    model_used: str
    created_at: datetime
