from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.auth import require_project_owner
from backend.app.core.response import APIResponse, api_success
from backend.app.models.memory import CreativeMemoryRead
from backend.app.models.project import Project
from backend.app.repositories.project_repo import ProjectRepository, get_session

router = APIRouter(prefix="/projects", tags=["creative-memory"])


@router.get("/{project_id}/memory", response_model=APIResponse[CreativeMemoryRead])
async def get_project_creative_memory(
    project_id: str,
    project: Project = Depends(require_project_owner),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[CreativeMemoryRead]:
    """
    Inspect the canonical creative memory ledger for a project.

    Retrieves the compiled creative memory snapshot, or automatically synchronizes
    it from existing canonical records (World Bible, Characters, Selections) if not yet created.
    Guarantees backward compatibility for pre-existing projects without duplicate sources of truth.
    """
    repo = ProjectRepository(session)
    mem = await repo.get_or_create_creative_memory(project_id)
    if not mem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Creative memory for project '{project_id}' could not be resolved.",
        )
    return api_success(data=mem.to_read_schema())
