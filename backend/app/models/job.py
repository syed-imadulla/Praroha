import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import BaseModel

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class GenerationJobBase(SQLModel):
    project_id: str = Field(index=True)
    job_type: str = Field(index=True)
    status: str = Field(default="queued", index=True)
    progress: int = Field(default=0)
    error_code: Optional[str] = Field(default=None, nullable=True)
    error_message: Optional[str] = Field(default=None, nullable=True)
    result_json: Optional[str] = Field(default=None, nullable=True)

class GenerationJob(GenerationJobBase, table=True):
    __tablename__ = "generation_jobs"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    created_at: datetime = Field(default_factory=get_utc_now)
    started_at: Optional[datetime] = Field(default=None, nullable=True)
    completed_at: Optional[datetime] = Field(default=None, nullable=True)
    updated_at: datetime = Field(default_factory=get_utc_now)

class GenerationJobRead(GenerationJobBase):
    id: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime
