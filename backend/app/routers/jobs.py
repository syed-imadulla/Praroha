from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.auth import AuthenticatedUser, get_current_user
from backend.app.repositories.project_repo import get_session
from backend.app.models.job import GenerationJob, GenerationJobRead
from backend.app.models.project import Project
from backend.app.core.response import APIResponse, api_success

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=APIResponse[List[GenerationJobRead]])
async def list_jobs(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(GenerationJob)
        .join(Project, GenerationJob.project_id == Project.id)
        .where(Project.owner_id == current_user.id)
    )
    if project_id:
        query = query.where(GenerationJob.project_id == project_id)
    if status:
        query = query.where(GenerationJob.status == status)

    result = await session.execute(query)
    jobs = result.scalars().all()
    return api_success(data=list(jobs))


@router.get("/{job_id}", response_model=APIResponse[GenerationJobRead])
async def get_job(
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    job = await session.get(GenerationJob, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    project = await session.get(Project, job.project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return api_success(data=job)
