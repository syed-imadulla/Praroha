import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ProjectBase(SQLModel):
    title: str = Field(index=True)
    seed_text: str = Field(default="")
    status: str = Field(default="draft")
    selected_world_id: Optional[str] = Field(default=None, nullable=True)
    parent_project_id: Optional[str] = Field(default=None, index=True, nullable=True)
    branch_name: str = Field(default="main", index=True)
    mutation_metadata_json: Optional[str] = Field(default=None, nullable=True)
    counterfactual_metadata_json: Optional[str] = Field(default=None, nullable=True)


class Project(ProjectBase, table=True):
    __tablename__ = "projects"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    def to_read_schema(self) -> "ProjectRead":
        return ProjectRead.model_validate(self)


class ProjectCreate(SQLModel):
    title: str
    seed_text: Optional[str] = ""


class ProjectRead(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime


class AssetBase(SQLModel):
    project_id: str = Field(index=True)
    asset_type: str  # e.g., 'concept_art', 'audio_clip', 'lore_document'
    mime_type: str
    storage_key: str
    size_bytes: int
    source_ref: Optional[str] = None
    version: int = Field(default=1)


class Asset(AssetBase, table=True):
    __tablename__ = "assets"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)


class AssetCreate(AssetBase):
    pass


class AssetRead(AssetBase):
    id: str
    created_at: datetime
