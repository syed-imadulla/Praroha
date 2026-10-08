from typing import Any, Dict, Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from backend.app.config import settings
from backend.app.core.response import APIResponse, api_success
from backend.app.providers.base import AIProvider
from backend.app.providers.factory import get_ai_provider, get_storage_provider
from backend.app.providers.storage import StorageProvider

router = APIRouter(prefix="", tags=["health"])


class AIProviderUpdateRequest(BaseModel):
    provider: str = Field(description="'mock' or 'gemini'")
    model: Optional[str] = Field(default=None, description="e.g. 'gemini-3.6-flash', 'gemini-3.1-flash-lite'")


def _get_health_payload(ai_health: Dict[str, Any], storage_provider: StorageProvider) -> Dict[str, Any]:
    resolved = ai_health.get("provider", "unknown")
    model_name = ai_health.get("model", settings.GEMINI_MODEL if resolved == "gemini" else "mock-deterministic")
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": "development",
        "ai_provider": {
            "configured": settings.AI_PROVIDER,
            "resolved": resolved,
            "model": model_name,
            "status": ai_health.get("status", "unknown"),
            "available_providers": ["mock", "gemini"],
            "available_models": [
                "gemini-3.6-flash",
                "gemini-3.1-flash-lite",
            ],
            "message": ai_health.get("message"),
        },
        "storage_provider": {
            "configured": settings.STORAGE_PROVIDER,
            "type": storage_provider.__class__.__name__,
            "status": "ready",
        },
    }


@router.get("/health", response_model=APIResponse[Dict[str, Any]])
async def health_check(
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage_provider: StorageProvider = Depends(get_storage_provider),
) -> APIResponse[Dict[str, Any]]:
    """Return health status of the application shell, AI provider, and storage provider."""
    ai_health = await ai_provider.health_check()
    return api_success(data=_get_health_payload(ai_health, storage_provider))


@router.post("/health/ai-provider", response_model=APIResponse[Dict[str, Any]])
async def update_ai_provider(
    body: AIProviderUpdateRequest,
    storage_provider: StorageProvider = Depends(get_storage_provider),
) -> APIResponse[Dict[str, Any]]:
    """Update active AI provider and/or model at runtime."""
    prov = body.provider.strip().lower()
    if prov in ["mock", "gemini"]:
        settings.AI_PROVIDER = prov
    if body.model and body.model.strip():
        settings.GEMINI_MODEL = body.model.strip()

    current_ai = get_ai_provider()
    ai_health = await current_ai.health_check()
    return api_success(data=_get_health_payload(ai_health, storage_provider))
