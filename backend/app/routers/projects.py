from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.response import APIResponse, api_error, api_success
from backend.app.models.project import ProjectCreate, ProjectRead
from backend.app.repositories.project_repo import ProjectRepository, get_session

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=APIResponse[List[ProjectRead]])
async def list_projects(
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[ProjectRead]]:
    repo = ProjectRepository(session)
    projects = await repo.list_projects()
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
