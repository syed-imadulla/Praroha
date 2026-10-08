import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import AuthenticatedUser, get_current_user
from backend.app.core.response import APIResponse, api_success
from backend.app.models.media import (
    MediaAssetRead,
    MediaGenerationRequest,
    MediaJobResponse,
)
from backend.app.providers.factory import get_storage_provider
from backend.app.providers.media.factory import get_media_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session
from backend.app.services.media_service import MediaService

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
