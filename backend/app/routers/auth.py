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
    requires_verification: bool = True


class EmailActionRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", clean):
            raise ValueError("Invalid email format")
        return clean


class ActionResponse(BaseModel):
    message: str


@router.post("/signup", response_model=APIResponse[SignUpResponse])
async def signup_user(payload: SignUpRequest) -> APIResponse[SignUpResponse]:
    """
    Register a new user in Supabase Auth.
    In production mode, email_confirm defaults to False to enforce email verification.
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
    should_auto_confirm = bool(settings.DEV_AUTO_CONFIRM_EMAILS)
    body = {
        "email": payload.email.lower().strip(),
        "password": payload.password,
        "email_confirm": should_auto_confirm,
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
                        requires_verification=not should_auto_confirm,
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


@router.post("/resend-verification", response_model=APIResponse[ActionResponse])
async def resend_verification(payload: EmailActionRequest) -> APIResponse[ActionResponse]:
    """
    Resend verification email to user via Supabase Auth.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not configured.",
        )

    resend_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/resend"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Content-Type": "application/json",
    }
    body = {
        "type": "signup",
        "email": payload.email.lower().strip(),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(resend_url, headers=headers, json=body)
            # Supabase returns 200 on success or generic response
            return api_success(
                data=ActionResponse(
                    message=f"If an unverified account exists for {payload.email}, a verification link has been sent."
                )
            )
    except Exception as exc:
        logger.error(f"Error resending verification email: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to resend verification email right now. Please try again later.",
        )


@router.post("/recover-password", response_model=APIResponse[ActionResponse])
async def recover_password(payload: EmailActionRequest) -> APIResponse[ActionResponse]:
    """
    Send password recovery email via Supabase Auth.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not configured.",
        )

    recover_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/recover"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Content-Type": "application/json",
    }
    body = {
        "email": payload.email.lower().strip(),
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(recover_url, headers=headers, json=body)
            return api_success(
                data=ActionResponse(
                    message=f"If an account exists for {payload.email}, a password reset link has been sent."
                )
            )
    except Exception as exc:
        logger.error(f"Error sending password recovery email: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send password recovery email right now. Please try again later.",
        )
