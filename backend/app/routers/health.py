from typing import Any, Dict
from fastapi import APIRouter, Depends
from backend.app.config import settings
from backend.app.core.response import APIResponse, api_success
from backend.app.providers.base import AIProvider
from backend.app.providers.factory import get_ai_provider, get_storage_provider
from backend.app.providers.storage import StorageProvider

router = APIRouter(prefix="", tags=["health"])


@router.get("/health", response_model=APIResponse[Dict[str, Any]])
async def health_check(
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage_provider: StorageProvider = Depends(get_storage_provider),
) -> APIResponse[Dict[str, Any]]:
    """Return health status of the application shell, AI provider, and storage provider."""
    ai_health = await ai_provider.health_check()

    health_data = {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": "development",
        "ai_provider": {
            "configured": settings.AI_PROVIDER,
            "resolved": ai_health.get("provider", "unknown"),
            "status": ai_health.get("status", "unknown"),
        },
        "storage_provider": {
            "configured": settings.STORAGE_PROVIDER,
            "type": storage_provider.__class__.__name__,
            "status": "ready",
        },
    }

    return api_success(data=health_data)
