import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status
import httpx
import re
from pydantic import BaseModel, field_validator

from backend.app.config import settings
from backend.app.core.response import APIResponse, api_success

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", clean):
            raise ValueError("Invalid email format")
        return clean


class SignUpResponse(BaseModel):
    id: str
    email: str


@router.post("/signup", response_model=APIResponse[SignUpResponse])
async def signup_user(payload: SignUpRequest) -> APIResponse[SignUpResponse]:
    """
    Create a pre-confirmed Supabase Auth user via the Supabase Admin API.
    Bypasses the public SMTP rate limits by setting email_confirm=True server-side.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not configured.",
        )

    admin_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "email": payload.email.lower().strip(),
        "password": payload.password,
        "email_confirm": True,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(admin_url, headers=headers, json=body)
            if resp.status_code in (200, 201):
                data = resp.json()
                return api_success(
                    data=SignUpResponse(
                        id=data["id"],
                        email=data["email"],
                    )
                )

            # Handle existing user or other Supabase auth errors
            error_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            msg = error_data.get("msg") or error_data.get("message") or resp.text

            if resp.status_code == 422 or "already" in msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists.",
                )

            logger.warning(f"Supabase Admin signup failed (HTTP {resp.status_code}): {msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=msg or "Unable to create account. Please check your credentials.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error during server-side Supabase sign up: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong creating your account. Please try again.",
        )
