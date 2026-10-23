import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Literal, Optional
from pydantic import field_validator
from sqlalchemy import Column, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

OutboxStatus = Literal["pending", "published", "failed"]

FORBIDDEN_PAYLOAD_KEYS = {
    "password",
    "secret",
    "token",
    "credential",
    "api_key",
    "apikey",
    "connection_string",
    "database_url",
    "sas",
    "key",
    "access_key",
    "account_key",
    "client_secret",
    "private_key",
}


def assert_no_secrets_in_payload(payload: Dict[str, Any]) -> None:
    """Validate that payload dictionary does not leak sensitive credentials or secrets."""
    if not isinstance(payload, dict):
        raise ValueError("Render outbox payload must be a dictionary")

    def _traverse(obj: Any, path: str = "") -> None:
        if isinstance(obj, dict):
            for k, val in obj.items():
                lower_k = str(k).lower().strip()
                for forbidden in FORBIDDEN_PAYLOAD_KEYS:
                    if forbidden in lower_k:
                        raise ValueError(
                            f"Forbidden secret key '{k}' detected at '{path}.{k}' in render outbox payload"
                        )
                _traverse(val, f"{path}.{k}" if path else str(k))
        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                _traverse(item, f"{path}[{idx}]")

    _traverse(payload)


class RenderOutboxBase(SQLModel):
    project_id: str = Field(index=True, foreign_key="projects.id")
    job_id: str = Field(index=True, unique=True, foreign_key="generation_jobs.id")
    status: str = Field(default="pending", index=True)
    attempt_count: int = Field(default=0)
    last_error: Optional[str] = Field(default=None, nullable=True)
    claimed_at: Optional[datetime] = Field(default=None, nullable=True)
    published_at: Optional[datetime] = Field(default=None, nullable=True)


class RenderOutbox(RenderOutboxBase, table=True):
    __tablename__ = "render_outbox"

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True,
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON().with_variant(JSONB, "postgresql"), nullable=False),
    )
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)
        if "payload" in kwargs and kwargs["payload"] is not None:
            assert_no_secrets_in_payload(kwargs["payload"])
        if "status" in kwargs and kwargs["status"] is not None:
            self._validate_status(kwargs["status"])

    @staticmethod
    def _validate_status(v: str) -> str:
        allowed = {"pending", "published", "failed"}
        if v not in allowed:
            raise ValueError(f"Invalid status '{v}'. Must be one of {allowed}")
        return v

    @field_validator("payload")
    @classmethod
    def validate_payload(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        assert_no_secrets_in_payload(v)
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        return cls._validate_status(v)

    def to_read_schema(self) -> "RenderOutboxRead":
        return RenderOutboxRead.model_validate(self)


class RenderOutboxCreate(SQLModel):
    project_id: str
    job_id: str
    payload: Dict[str, Any]
    status: str = "pending"

    @field_validator("payload")
    @classmethod
    def validate_payload(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        assert_no_secrets_in_payload(v)
        return v


class RenderOutboxRead(RenderOutboxBase):
    id: str
    payload: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
