import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import AuthenticatedUser, get_current_user, require_project_owner
from backend.app.core.response import APIResponse, api_success
from backend.app.models.persistence import (
    BranchCreate,
    BranchRead,
    CharacterRefineRequest,
    EntityRevisionRead,
    ProjectBundle,
    SceneRefineRequest,
    SnapshotRead,
)
from backend.app.models.project import Project, ProjectRead
from backend.app.models.unfold import CharacterRead, SceneRead
from backend.app.providers.factory import get_storage_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session
from backend.app.services.lineage_service import LineageService
from backend.app.services.persistence_service import PersistenceService

logger = logging.getLogger("seed_unfold.router.persistence")

router = APIRouter(prefix="/projects", tags=["persistence"])


def get_persistence_service(session: AsyncSession = Depends(get_session)) -> PersistenceService:
    repo = ProjectRepository(session)
    storage = get_storage_provider()
    lineage_service = LineageService(repo)
    return PersistenceService(repo=repo, storage=storage, lineage_service=lineage_service)


@router.post("/{project_id}/branch", response_model=APIResponse[ProjectRead])
async def branch_project(
    project_id: str,
    payload: BranchCreate,
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[ProjectRead]:
    """
    Fork timeline into an isolated child project with strict ID remapping (PERS-02).
    """
    try:
        child_project = await service.branch_project(project_id, payload)
        return api_success(child_project.to_read_schema())
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to branch project {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to branch project: {str(exc)}",
        )


@router.get("/{project_id}/branches", response_model=APIResponse[List[BranchRead]])
async def list_project_branches(
    project_id: str,
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[List[BranchRead]]:
    """
    List all timeline branches in the project family (PERS-02).
    """
    try:
        branches = await service.get_project_branches(project_id)
        return api_success(branches)
    except Exception as exc:
        logger.error(f"Failed to list branches for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list branches: {str(exc)}",
        )


@router.patch("/{project_id}/characters/{char_id}/refine", response_model=APIResponse[CharacterRead])
async def refine_character(
    project_id: str,
    char_id: str,
    payload: CharacterRefineRequest,
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[CharacterRead]:
    """
    Refine character with immutable before/after revision snapshots and version increment (PERS-01).
    """
    try:
        char = await service.refine_character(project_id, char_id, payload)
        return api_success(char)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to refine character {char_id} in {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refine character: {str(exc)}",
        )


@router.patch("/{project_id}/scenes/{scene_id}/refine", response_model=APIResponse[SceneRead])
async def refine_scene(
    project_id: str,
    scene_id: str,
    payload: SceneRefineRequest,
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[SceneRead]:
    """
    Refine story scene with immutable before/after revision snapshots and version increment (PERS-01).
    """
    try:
        scene = await service.refine_scene(project_id, scene_id, payload)
        return api_success(scene)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to refine scene {scene_id} in {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refine scene: {str(exc)}",
        )


@router.get("/{project_id}/revisions", response_model=APIResponse[List[EntityRevisionRead]])
async def get_project_revisions(
    project_id: str,
    entity_id: Optional[str] = Query(None, description="Optional entity ID filter"),
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[List[EntityRevisionRead]]:
    """
    Retrieve immutable audit log revisions with snapshots for project entities (PERS-01).
    """
    try:
        revisions = await service.get_project_revisions(project_id, entity_id)
        return api_success(revisions)
    except Exception as exc:
        logger.error(f"Failed to fetch revisions for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch revisions: {str(exc)}",
        )


@router.get("/{project_id}/bundle", response_model=APIResponse[ProjectBundle])
async def export_project_bundle(
    project_id: str,
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[ProjectBundle]:
    """
    Export comprehensive project state bundle including synthesized Lineage DAG (PERS-03).
    """
    try:
        bundle = await service.export_project_bundle(project_id)
        return api_success(bundle)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to export bundle for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export project bundle: {str(exc)}",
        )


@router.post("/import", response_model=APIResponse[ProjectRead])
async def import_project_bundle(
    bundle: ProjectBundle,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[ProjectRead]:
    """
    Import portable project bundle with complete ID remapping into database (PERS-03).
    Assigns ownership to current_user.id.
    """
    try:
        new_project = await service.import_project_bundle(bundle)
        new_project.owner_id = current_user.id
        service.repo.session.add(new_project)
        await service.repo.session.commit()
        await service.repo.session.refresh(new_project)
        return api_success(new_project.to_read_schema())
    except Exception as exc:
        logger.error(f"Failed to import project bundle: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import project bundle: {str(exc)}",
        )


@router.post("/{project_id}/snapshots", response_model=APIResponse[SnapshotRead])
async def create_storage_snapshot(
    project_id: str,
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[SnapshotRead]:
    """
    Create object storage snapshot of project bundle via StorageProvider.upload (PERS-03).
    """
    try:
        snapshot = await service.create_storage_snapshot(project_id)
        return api_success(snapshot)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to create snapshot for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create storage snapshot: {str(exc)}",
        )


@router.get("/{project_id}/snapshots", response_model=APIResponse[List[SnapshotRead]])
async def list_storage_snapshots(
    project_id: str,
    project: Project = Depends(require_project_owner),
    service: PersistenceService = Depends(get_persistence_service),
) -> APIResponse[List[SnapshotRead]]:
    """
    List all object storage snapshots for a project (PERS-03).
    """
    try:
        snapshots = await service.list_storage_snapshots(project_id)
        return api_success(snapshots)
    except Exception as exc:
        logger.error(f"Failed to list snapshots for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list storage snapshots: {str(exc)}",
        )
