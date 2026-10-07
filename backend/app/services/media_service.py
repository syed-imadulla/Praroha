import asyncio
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException

from backend.app.models.media import (
    MediaAssetRecord,
    MediaGenerationRequest,
    MediaJobResponse,
    get_utc_now,
)
from backend.app.providers.factory import get_storage_provider
from backend.app.providers.media.base import MediaProvider
from backend.app.providers.media.factory import get_media_provider
from backend.app.providers.storage import StorageProvider
from backend.app.repositories.project_repo import (
    ProjectRepository,
    async_session,
)

logger = logging.getLogger(__name__)


def _resolve_extension(mime_type: str) -> str:
    if "svg" in mime_type:
        return "svg"
    if "wav" in mime_type:
        return "wav"
    if "mp4" in mime_type:
        return "mp4"
    if "png" in mime_type:
        return "png"
    if "jpeg" in mime_type or "jpg" in mime_type:
        return "jpg"
    return "bin"


class MediaService:
    """Orchestrates decoupled, non-blocking media generation across modal providers."""

    def __init__(
        self,
        repo: ProjectRepository,
        storage: Optional[StorageProvider] = None,
        media_provider: Optional[MediaProvider] = None,
    ):
        self.repo = repo
        self.storage = storage or get_storage_provider()
        self.media_provider = media_provider or get_media_provider()

    async def dispatch_job(
        self,
        project_id: str,
        request: MediaGenerationRequest,
    ) -> MediaJobResponse:
        """Create a queued media asset and trigger background generation without blocking."""
        project = await self.repo.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        asset_record = MediaAssetRecord(
            project_id=project_id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            media_type=request.media_type,
            status="queued",
            prompt=request.prompt,
            provider_name=self.media_provider.name,
        )
        created_asset = await self.repo.create_media_asset(asset_record)

        # Launch background task with its own independent session
        asyncio.create_task(
            self._execute_job_in_background(
                asset_id=created_asset.id,
                request=request,
            )
        )

        return MediaJobResponse(
            job_id=created_asset.id,
            status="queued",
            media_type=request.media_type,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            asset_url=None,
            error_message=None,
        )

    async def _execute_job_in_background(
        self,
        asset_id: str,
        request: MediaGenerationRequest,
    ) -> None:
        """Execute media generation in an isolated async session to avoid session collisions."""
        async with async_session() as session:
            repo = ProjectRepository(session)
            await self._run_generation_pipeline(
                asset_id=asset_id,
                request=request,
                repo=repo,
            )

    async def process_job_now(
        self,
        asset_id: str,
        request: MediaGenerationRequest,
    ) -> MediaAssetRecord:
        """Synchronously execute job for unit testing or eager evaluation."""
        return await self._run_generation_pipeline(
            asset_id=asset_id,
            request=request,
            repo=self.repo,
        )

    async def _run_generation_pipeline(
        self,
        asset_id: str,
        request: MediaGenerationRequest,
        repo: ProjectRepository,
    ) -> MediaAssetRecord:
        """Core state machine: processing -> provider synthesis -> storage -> completed/failed."""
        await repo.update_media_asset(
            asset_id=asset_id,
            updates={"status": "processing"},
        )

        try:
            context: Dict[str, Any] = {
                "project_id": request.entity_id,
                "entity_type": request.entity_type,
                "entity_id": request.entity_id,
                "aspect_ratio": request.aspect_ratio or "1:1",
                "voice_id": request.voice_id or "default",
                "duration_sec": request.duration_sec or 5,
                "mood": request.mood or "ambient",
                **(request.context or {}),
            }

            if request.media_type == "image":
                payload = await self.media_provider.generate_image(
                    prompt=request.prompt,
                    aspect_ratio=request.aspect_ratio or "1:1",
                    context=context,
                )
            elif request.media_type == "voice":
                payload = await self.media_provider.generate_voice(
                    text=request.prompt,
                    voice_id=request.voice_id or "default",
                    context=context,
                )
            elif request.media_type == "video":
                payload = await self.media_provider.generate_video(
                    prompt=request.prompt,
                    context=context,
                )
            elif request.media_type == "audio":
                payload = await self.media_provider.generate_audio(
                    prompt=request.prompt,
                    duration_sec=request.duration_sec or 5,
                    mood=request.mood or "ambient",
                    context=context,
                )
            else:
                raise ValueError(f"Unsupported media type: {request.media_type}")

            # Store synthesized asset
            ext = _resolve_extension(payload.mime_type)
            storage_key = f"media/{request.media_type}/{asset_id}.{ext}"
            uploaded_url = await self.storage.upload(
                file_data=payload.data,
                key=storage_key,
                mime_type=payload.mime_type,
            )

            updated = await repo.update_media_asset(
                asset_id=asset_id,
                updates={
                    "status": "completed",
                    "asset_url": uploaded_url,
                    "mime_type": payload.mime_type,
                    "completed_at": get_utc_now(),
                    "error_message": None,
                },
            )
            return updated or await repo.get_media_asset(asset_id)

        except Exception as exc:
            logger.error(
                "Media generation failed for asset %s: %s",
                asset_id,
                exc,
                exc_info=True,
            )
            updated = await repo.update_media_asset(
                asset_id=asset_id,
                updates={
                    "status": "failed",
                    "error_message": str(exc),
                    "completed_at": get_utc_now(),
                },
            )
            return updated or await repo.get_media_asset(asset_id)

    async def get_job(self, asset_id: str) -> Optional[MediaAssetRecord]:
        """Fetch media asset / job status."""
        return await self.repo.get_media_asset(asset_id)

    async def list_assets(
        self,
        project_id: str,
        entity_id: Optional[str] = None,
        media_type: Optional[str] = None,
    ) -> List[MediaAssetRecord]:
        """List media assets for a project with optional filters."""
        return await self.repo.list_media_assets(
            project_id=project_id,
            entity_id=entity_id,
            media_type=media_type,
        )

    async def get_providers_health(self) -> Dict[str, Any]:
        """Return health status across modal providers."""
        return await self.media_provider.health_check()

