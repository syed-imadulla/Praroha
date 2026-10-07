import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SeedPotentialCategory(str, Enum):
    EXPLICIT = "explicit"
    INFERRED = "inferred"
    OPEN = "open"


class PotentialItemStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class SeedPotentialItemBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    label: str = Field(description="The concise potential item or question text")
    category: str = Field(description="explicit, inferred, or open")
    confidence: float = Field(default=1.0, description="Confidence score between 0.0 and 1.0")
    source_evidence: str = Field(default="", description="Snippet or theme in the seed anchoring this item")
    user_status: str = Field(default=PotentialItemStatus.PENDING.value, description="pending, accepted, or rejected")


class SeedPotentialItemRecord(SeedPotentialItemBase, table=True):
    __tablename__ = "seed_potential_items"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self) -> "SeedPotentialItemRead":
        return SeedPotentialItemRead(
            id=self.id,
            project_id=self.project_id,
            label=self.label,
            category=self.category,
            confidence=self.confidence,
            source_evidence=self.source_evidence,
            user_status=self.user_status,
            created_at=self.created_at,
        )


class SeedPotentialItemRead(BaseModel):
    id: str
    project_id: str
    label: str
    category: str
    confidence: float
    source_evidence: str
    user_status: str
    created_at: datetime


class SeedPotentialItemUpdate(BaseModel):
    user_status: PotentialItemStatus


class SinglePotentialItemStatusUpdate(BaseModel):
    id: str
    user_status: PotentialItemStatus


class BatchPotentialStatusUpdate(BaseModel):
    items: List[SinglePotentialItemStatusUpdate]
