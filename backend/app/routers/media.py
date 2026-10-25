import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.config import settings

import json
from pydantic import BaseModel

from backend.app.core.auth import (
    AuthenticatedUser,
    get_current_user,
    verify_cinematic_preview_access,
)
from backend.app.core.response import APIResponse, api_success
from backend.app.models.job import GenerationJob
from backend.app.models.media import (
    MediaAssetRead,
    MediaAssetRecord,
    MediaGenerationRequest,
    MediaJobResponse,
    get_utc_now,
)
from backend.app.providers.factory import get_storage_provider
from backend.app.providers.media.factory import get_media_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session
from backend.app.services.cinematic_dispatcher import (
    CinematicDispatcherService,
    CinematicPreviewJobRequest,
)
from backend.app.services.media_service import MediaService
from backend.app.services.soundscape_library import (
    CURATED_SOUNDSCAPE_LAYERS,
    SoundscapeComposer,
)

logger = logging.getLogger("seed_unfold.router.media")

router = APIRouter(tags=["media"])


def get_media_service(session: AsyncSession = Depends(get_session)) -> MediaService:
    repo = ProjectRepository(session)
    storage = get_storage_provider()
    media_provider = get_media_provider()
    return MediaService(repo=repo, storage=storage, media_provider=media_provider)


async def verify_project_owner(project_id: str, user_id: str, repo: ProjectRepository):
    project = await repo.get_project(project_id)
    if not project or project.owner_id != user_id:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")


@router.post(
    "/projects/{project_id}/media/generate",
    response_model=APIResponse[MediaJobResponse],
)
async def generate_media(
    project_id: str,
    payload: MediaGenerationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MediaService = Depends(get_media_service),
) -> APIResponse[MediaJobResponse]:
    """
    Dispatch non-blocking media generation job across modal providers (MED-01, MED-03).
    Returns immediately with queued job status.
    """
    await verify_project_owner(project_id, current_user.id, service.repo)
    try:
        job = await service.dispatch_job(project_id, payload)
        return api_success(job)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to dispatch media generation: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/projects/{project_id}/media/jobs/{job_id}",
    response_model=APIResponse[MediaJobResponse],
)
async def get_media_job_status(
    project_id: str,
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MediaService = Depends(get_media_service),
) -> APIResponse[MediaJobResponse]:
    """
    Poll status of a media generation job (queued -> processing -> completed / failed).
    """
    await verify_project_owner(project_id, current_user.id, service.repo)
    asset = await service.get_job(job_id)
    if not asset or asset.project_id != project_id:
        raise HTTPException(status_code=404, detail="Media job not found")

    job_res = MediaJobResponse(
        job_id=asset.id,
        status=asset.status,  # type: ignore[arg-type]
        media_type=asset.media_type,  # type: ignore[arg-type]
        entity_type=asset.entity_type,
        entity_id=asset.entity_id,
        asset_url=asset.asset_url,
        error_message=asset.error_message,
    )
    return api_success(job_res)


@router.get(
    "/projects/{project_id}/media/assets",
    response_model=APIResponse[List[MediaAssetRead]],
)
async def list_media_assets(
    project_id: str,
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    media_type: Optional[str] = Query(None, description="Filter by media type (image, voice, video, audio)"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MediaService = Depends(get_media_service),
) -> APIResponse[List[MediaAssetRead]]:
    """
    List all media assets associated with a project or specific entity (MED-02).
    """
    await verify_project_owner(project_id, current_user.id, service.repo)
    assets = await service.list_assets(
        project_id=project_id,
        entity_id=entity_id,
        media_type=media_type,
    )
    res_list = [
        MediaAssetRead(
            id=a.id,
            project_id=a.project_id,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            media_type=a.media_type,
            status=a.status,
            asset_url=a.asset_url,
            mime_type=a.mime_type,
            prompt=a.prompt,
            provider_name=a.provider_name,
            error_message=a.error_message,
            width=a.width,
            height=a.height,
            aspect_ratio=a.aspect_ratio,
            metadata_json=a.metadata_json,
            created_at=a.created_at,
            completed_at=a.completed_at,
        )
        for a in assets
    ]
    return api_success(res_list)


@router.get(
    "/media/providers/health",
    response_model=APIResponse[Dict[str, Any]],
)
async def get_media_providers_health(
    service: MediaService = Depends(get_media_service),
) -> APIResponse[Dict[str, Any]]:
    """
    Return operational readiness and health across all modal media providers (MED-01).
    """
    health = await service.get_providers_health()
    return api_success(health)


class SoundscapeComposePayload(BaseModel):
    entity_id: str
    entity_type: str = "scene"
    layers: List[Dict[str, Any]]
    duration_sec: int = 15
    title: Optional[str] = None


@router.get(
    "/projects/{project_id}/media/soundscapes/library",
    response_model=APIResponse[List[Dict[str, Any]]],
)
async def list_soundscape_library(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MediaService = Depends(get_media_service),
) -> APIResponse[List[Dict[str, Any]]]:
    """
    Returns curated, legally verified CC0 ambient audio soundscape layers.
    """
    await verify_project_owner(project_id, current_user.id, service.repo)
    layers_data = [layer.model_dump() for layer in CURATED_SOUNDSCAPE_LAYERS]
    return api_success(layers_data)


@router.post(
    "/projects/{project_id}/media/soundscapes/compose",
    response_model=APIResponse[MediaJobResponse],
)
async def compose_soundscape(
    project_id: str,
    payload: SoundscapeComposePayload,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: MediaService = Depends(get_media_service),
) -> APIResponse[MediaJobResponse]:
    """
    Combines verified CC0 ambient audio layers, persists the composition through
    the project media pipeline, associates it with the entity, and labels it
    honestly as a Composed Soundscape (never AI-generated).
    """
    await verify_project_owner(project_id, current_user.id, service.repo)
    if not payload.layers:
        raise HTTPException(status_code=400, detail="Must select at least one soundscape layer to compose.")

    layer_ids = [l.get("id") for l in payload.layers if l.get("id")]
    known_ids = {l.id for l in CURATED_SOUNDSCAPE_LAYERS}
    invalid_ids = [lid for lid in layer_ids if lid not in known_ids]
    if invalid_ids:
        raise HTTPException(status_code=400, detail=f"Unknown soundscape layer(s): {invalid_ids}")

    # Synthesize blended PCM WAV audio
    wav_bytes = SoundscapeComposer.compose_soundscape(
        layers=payload.layers,
        duration_sec=float(payload.duration_sec),
    )

    # Create Asset Record in PostgreSQL
    layer_names = [l.name for l in CURATED_SOUNDSCAPE_LAYERS if l.id in layer_ids]
    prompt_desc = payload.title or f"Composed Soundscape: {', '.join(layer_names)}"

    asset_record = MediaAssetRecord(
        project_id=project_id,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        media_type="audio",
        status="processing",
        prompt=prompt_desc,
        provider_name="curated-soundscape-library",
    )
    created_asset = await service.repo.create_media_asset(asset_record)

    # Upload to storage
    storage_key = f"projects/{project_id}/media/audio/{created_asset.id}.wav"
    uploaded_url = await service.storage.upload(
        file_data=wav_bytes,
        key=storage_key,
        mime_type="audio/wav",
    )

    metadata = {
        "resolved_provider": "curated-soundscape-library",
        "provider_label": "Composed Soundscape (Curated Library)",
        "is_synthetic": True,
        "is_ambient_music": False,
        "is_environmental_foley": True,
        "is_ai_generated": False,
        "license": "CC0 1.0 Universal (Public Domain)",
        "layers": payload.layers,
        "layer_ids": layer_ids,
        "duration_sec": payload.duration_sec,
        "notes": "Composed from verified CC0 public domain acoustic layers; not generative AI audio.",
    }

    # Mark as completed
    await service.repo.update_media_asset(
        asset_id=created_asset.id,
        updates={
            "status": "completed",
            "asset_url": uploaded_url,
            "mime_type": "audio/wav",
            "metadata_json": json.dumps(metadata),
            "completed_at": get_utc_now(),
        },
    )

    # Create lockstep completed GenerationJob
    job_record = GenerationJob(
        id=created_asset.id,
        project_id=project_id,
        job_type="media_audio",
        status="completed",
        progress=100,
        result_json=json.dumps({"asset_id": created_asset.id, "asset_url": uploaded_url}),
    )
    await service.repo.create_generation_job(job_record)

    return api_success(
        MediaJobResponse(
            job_id=created_asset.id,
            status="completed",
            media_type="audio",
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            asset_url=uploaded_url,
            error_message=None,
        )
    )


def get_cinematic_dispatcher(session: AsyncSession = Depends(get_session)) -> CinematicDispatcherService:
    repo = ProjectRepository(session)
    return CinematicDispatcherService(repo=repo)


@router.post(
    "/projects/{project_id}/media/cinematic-preview/jobs",
    status_code=202,
    response_model=APIResponse[MediaJobResponse],
)
async def create_cinematic_preview_job(
    project_id: str,
    payload: CinematicPreviewJobRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    dispatcher: CinematicDispatcherService = Depends(get_cinematic_dispatcher),
) -> APIResponse[MediaJobResponse]:
    """
    Non-blocking dispatch of a cinematic preview rendering job to the dedicated worker (Phase 51).
    Validates project authorization, asset integrity, and returns HTTP 202 immediately.
    FastAPI never renders locally or blocks waiting for FFmpeg.
    """
    if not getattr(settings, "CINEMATIC_PREVIEW_ENABLED", False):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cinematic preview generation is currently disabled on this server.",
        )
    verify_cinematic_preview_access(current_user)
    await verify_project_owner(project_id, current_user.id, dispatcher.repo)
    job = await dispatcher.dispatch_preview_job(project_id, payload, user_id=current_user.id)
    return api_success(job)


@router.post(
    "/projects/{project_id}/media/cinematic-preview/generate",
    status_code=202,
    response_model=APIResponse[MediaJobResponse],
)
async def generate_cinematic_preview(
    project_id: str,
    payload: CinematicPreviewJobRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    dispatcher: CinematicDispatcherService = Depends(get_cinematic_dispatcher),
) -> APIResponse[MediaJobResponse]:
    """Alias for create_cinematic_preview_job."""
    if not getattr(settings, "CINEMATIC_PREVIEW_ENABLED", False):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cinematic preview generation is currently disabled on this server.",
        )
    verify_cinematic_preview_access(current_user)
    await verify_project_owner(project_id, current_user.id, dispatcher.repo)
    job = await dispatcher.dispatch_preview_job(project_id, payload, user_id=current_user.id)
    return api_success(job)

