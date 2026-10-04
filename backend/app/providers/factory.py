from backend.app.config import settings
from backend.app.providers.base import AIProvider
from backend.app.providers.mock_provider import MockProvider
from backend.app.providers.storage import (
    LocalStorageProvider,
    StorageProvider,
    SupabaseStorageProvider,
)


def get_ai_provider() -> AIProvider:
    """Resolve and return configured AI provider with graceful fallback to MockProvider."""
    provider_name = (settings.AI_PROVIDER or "mock").lower()

    if provider_name == "gemini":
        if not settings.GEMINI_API_KEY:
            # Fallback to mock if API key is not configured
            return MockProvider()
        # In Phase 2, Google Gemini SDK provider will be instantiated here
        return MockProvider()
    return MockProvider()


def get_storage_provider() -> StorageProvider:
    """Resolve and return configured storage provider with fallback to LocalStorageProvider."""
    storage_name = (settings.STORAGE_PROVIDER or "local").lower()

    if storage_name == "supabase":
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            return LocalStorageProvider()
        return SupabaseStorageProvider()
    return LocalStorageProvider()
