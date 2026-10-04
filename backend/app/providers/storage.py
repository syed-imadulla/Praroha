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


class SupabaseStorageProvider(StorageProvider):
    """Supabase cloud object storage provider."""

    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        bucket: Optional[str] = None,
    ):
        self.supabase_url = supabase_url or settings.SUPABASE_URL
        self.supabase_key = supabase_key or settings.SUPABASE_KEY
        self.bucket = bucket or settings.SUPABASE_BUCKET

    async def upload(self, file_data: bytes, key: str, mime_type: str) -> str:
        # In cloud environment, uses Supabase REST storage API
        # Fallback to local if credentials unset
        if not self.supabase_url or not self.supabase_key:
            fallback = LocalStorageProvider()
            return await fallback.upload(file_data, key, mime_type)

        clean_key = key.lstrip("/\\")
        # In future phases, httpx calls to Supabase Storage endpoint
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{clean_key}"

    async def get_url(self, key: str) -> str:
        if not self.supabase_url:
            return f"/uploads/{key.lstrip('/\\')}"
        clean_key = key.lstrip("/\\")
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{clean_key}"

    async def delete(self, key: str) -> bool:
        if not self.supabase_url or not self.supabase_key:
            fallback = LocalStorageProvider()
            return await fallback.delete(key)
        return True
