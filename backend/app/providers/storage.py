import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional
from backend.app.config import settings


class StorageProvider(ABC):
    """Abstract base class for cloud object storage with local filesystem fallback."""

    @abstractmethod
    async def upload(self, file_data: bytes, key: str, mime_type: str) -> str:
        """Store binary payload and return an accessible URL or file path."""
        pass

    @abstractmethod
    async def get_url(self, key: str) -> str:
        """Retrieve public or signed access URL for stored key."""
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Remove binary payload from storage provider."""
        pass


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider for zero-cloud development and offline demos."""

    def __init__(self, upload_dir: Optional[str] = None):
        self.upload_dir = Path(upload_dir or settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def upload(self, file_data: bytes, key: str, mime_type: str) -> str:
        # Sanitize key and preserve directory structure if needed
        clean_key = key.lstrip("/\\")
        dest_path = self.upload_dir / clean_key
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dest_path, "wb") as f:
            f.write(file_data)
        return f"/uploads/{clean_key}"

    async def get_url(self, key: str) -> str:
        clean_key = key.lstrip("/\\")
        return f"/uploads/{clean_key}"

    async def delete(self, key: str) -> bool:
        clean_key = key.lstrip("/\\")
        target_path = self.upload_dir / clean_key
        if target_path.exists() and target_path.is_file():
            target_path.unlink()
            return True
        return False


import logging
import httpx

logger = logging.getLogger(__name__)


_UNSET = object()


class SupabaseStorageProvider(StorageProvider):
    """Supabase cloud object storage provider."""

    def __init__(
        self,
        supabase_url: Any = _UNSET,
        supabase_key: Any = _UNSET,
        bucket: Any = _UNSET,
    ):
        raw_url = settings.SUPABASE_URL if supabase_url is _UNSET else supabase_url
        self.supabase_url = raw_url.strip().rstrip("/") if raw_url else None
        self.supabase_key = settings.SUPABASE_KEY if supabase_key is _UNSET else supabase_key
        self.bucket = settings.SUPABASE_BUCKET if bucket is _UNSET else (bucket or settings.SUPABASE_BUCKET)

    async def upload(self, file_data: bytes, key: str, mime_type: str) -> str:
        # Fallback to local storage if credentials unset
        if not self.supabase_url or not self.supabase_key:
            fallback = LocalStorageProvider()
            return await fallback.upload(file_data, key, mime_type)

        clean_key = key.lstrip("/\\")
        upload_endpoint = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{clean_key}"
        headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
            "Content-Type": mime_type,
            "x-upsert": "true",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(upload_endpoint, headers=headers, content=file_data)
                if response.status_code in (200, 201):
                    logger.info("Successfully uploaded %s to Supabase bucket '%s'", clean_key, self.bucket)
                    return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{clean_key}"
                else:
                    logger.warning(
                        "Supabase storage upload returned HTTP %s (%s). Falling back gracefully to LocalStorageProvider.",
                        response.status_code,
                        response.text,
                    )
                    fallback = LocalStorageProvider()
                    return await fallback.upload(file_data, key, mime_type)
        except Exception as exc:
            logger.warning(
                "Supabase storage upload failed (%s: %s). Falling back gracefully to LocalStorageProvider.",
                type(exc).__name__,
                exc,
            )
            fallback = LocalStorageProvider()
            return await fallback.upload(file_data, key, mime_type)

    async def get_url(self, key: str) -> str:
        clean_key = key.lstrip("/\\")
        if not self.supabase_url:
            return f"/uploads/{clean_key}"
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{clean_key}"

    async def delete(self, key: str) -> bool:
        if not self.supabase_url or not self.supabase_key:
            fallback = LocalStorageProvider()
            return await fallback.delete(key)

        clean_key = key.lstrip("/\\")
        delete_endpoint = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{clean_key}"
        headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.delete(delete_endpoint, headers=headers)
                return response.status_code in (200, 204)
        except Exception as exc:
            logger.warning("Supabase storage delete failed (%s).", exc)
            fallback = LocalStorageProvider()
            return await fallback.delete(key)
