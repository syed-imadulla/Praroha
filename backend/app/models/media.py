import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Literal, Optional
from sqlmodel import Field, SQLModel


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


MediaType = Literal["image", "voice", "video", "audio"]
MediaJobStatus = Literal["queued", "processing", "completed", "failed"]


class MediaAssetBase(SQLModel):
    project_id: str = Field(index=True)
    entity_type: str = Field(index=True)  # 'world', 'character', 'location', 'scene'
    entity_id: str = Field(index=True)
    media_type: str = Field(index=True)  # 'image', 'voice', 'video', 'audio'
    status: str = Field(default="queued", index=True)  # 'queued', 'processing', 'completed', 'failed'
    asset_url: Optional[str] = Field(default=None, nullable=True)
    mime_type: Optional[str] = Field(default=None, nullable=True)
    prompt: str = Field(default="")
    provider_name: str = Field(default="mock")
    error_message: Optional[str] = Field(default=None, nullable=True)
    width: Optional[int] = Field(default=None, nullable=True)
    height: Optional[int] = Field(default=None, nullable=True)
    aspect_ratio: Optional[str] = Field(default="1:1", nullable=True)
    metadata_json: Optional[str] = Field(default="{}", nullable=True)


class MediaAssetRecord(MediaAssetBase, table=True):
    __tablename__ = "media_assets"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)
    completed_at: Optional[datetime] = Field(default=None, nullable=True)


class MediaGenerationRequest(SQLModel):
    entity_type: Literal["world", "character", "location", "scene"]
    entity_id: str
    media_type: MediaType
    prompt: str
    aspect_ratio: Optional[str] = "1:1"
    voice_id: Optional[str] = "default"
    duration_sec: Optional[int] = 5
    mood: Optional[str] = "ambient"
    context: Optional[Dict[str, Any]] = None


class MediaJobResponse(SQLModel):
    job_id: str
    status: MediaJobStatus
    media_type: MediaType
    entity_type: str
    entity_id: str
    asset_url: Optional[str] = None
    error_message: Optional[str] = None


class MediaAssetRead(MediaAssetBase):
    id: str
    created_at: datetime
    completed_at: Optional[datetime] = None
