from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.response import APIResponse, api_error, api_success
from backend.app.models.project import ProjectCreate, ProjectRead, ProjectBundleRead
from backend.app.repositories.project_repo import ProjectRepository, get_session

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=APIResponse[List[ProjectRead]])
async def list_projects(
    archived: bool = Query(False, description="Filter for archived/graveyard projects"),
    include_deleted: bool = Query(False, description="Include both active and deleted projects"),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[ProjectRead]]:
    repo = ProjectRepository(session)
    projects = await repo.list_projects(include_deleted=include_deleted, archived_only=archived)
    project_reads = [p.to_read_schema() for p in projects]
    return api_success(data=project_reads)


@router.get("/graveyard", response_model=APIResponse[List[ProjectRead]])
async def list_graveyard(
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[ProjectRead]]:
    repo = ProjectRepository(session)
    projects = await repo.list_projects(archived_only=True)
    project_reads = [p.to_read_schema() for p in projects]
    return api_success(data=project_reads)


@router.post("", response_model=APIResponse[ProjectRead], status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[ProjectRead]:
    repo = ProjectRepository(session)
    project = await repo.create_project(data)
    return api_success(data=project.to_read_schema())


@router.post("/canonical-demo", response_model=APIResponse[ProjectRead], status_code=status.HTTP_201_CREATED)
async def create_canonical_demo(
    session: AsyncSession = Depends(get_session),
) -> APIResponse[ProjectRead]:
    repo = ProjectRepository(session)
    project = await repo.create_canonical_demo_project()
    return api_success(data=project.to_read_schema())


@router.get("/{project_id}/bundle", response_model=APIResponse[ProjectBundleRead])
async def get_project_bundle(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[ProjectBundleRead]:
    repo = ProjectRepository(session)
    bundle = await repo.get_project_bundle(project_id)
    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )
    return api_success(data=bundle)


@router.get("/{project_id}", response_model=APIResponse[ProjectRead])
async def get_project(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[ProjectRead]:
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )
    return api_success(data=project.to_read_schema())


@router.delete("/{project_id}", response_model=APIResponse[ProjectRead])
async def soft_delete_project(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[ProjectRead]:
    repo = ProjectRepository(session)
    project = await repo.soft_delete_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )
    return api_success(data=project.to_read_schema())


@router.post("/{project_id}/restore", response_model=APIResponse[ProjectRead])
async def restore_project(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[ProjectRead]:
    repo = ProjectRepository(session)
    project = await repo.restore_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )
    return api_success(data=project.to_read_schema())


@router.delete("/{project_id}/permanent", response_model=APIResponse[Dict[str, Any]])
async def delete_project_permanently(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[Dict[str, Any]]:
    repo = ProjectRepository(session)
    success = await repo.delete_project_permanently(project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )
    return api_success(data={"deleted": True, "project_id": project_id})
