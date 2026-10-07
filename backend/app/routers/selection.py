from typing import Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.response import APIResponse, api_success
from backend.app.models.selection import WorldSelectionCreate, WorldSelectionRead
from backend.app.repositories.project_repo import ProjectRepository, get_session

router = APIRouter(prefix="/projects/{project_id}", tags=["selection"])


@router.post("/worlds/{candidate_id}/select", response_model=APIResponse[WorldSelectionRead])
async def select_world_candidate(
    project_id: str,
    candidate_id: str,
    body: Optional[WorldSelectionCreate] = Body(default=None),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[WorldSelectionRead]:
    """
    Select a creative world candidate for a project.

    Enforces:
    1. Project exists (HTTP 404 if missing)
    2. Candidate exists and belongs to the project (HTTP 404 if missing or mismatched)
    3. Candidate belongs to the project's LATEST world generation batch (HTTP 400 if older batch)
    4. Records human selection and creator rationale, updates project status to 'world_selected'.
    """
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    user_rationale = body.user_rationale if body else None
    creative_priorities = body.creative_priorities if body else None
    rejected_directions = body.rejected_directions if body else None
    custom_directives = body.custom_directives if body else None
    human_only_zones = body.human_only_zones if body else None

    try:
        selection = await repo.save_world_selection(
            project_id=project_id,
            candidate_id=candidate_id,
            user_rationale=user_rationale,
            creative_priorities=creative_priorities,
            rejected_directions=rejected_directions,
            custom_directives=custom_directives,
            human_only_zones=human_only_zones,
        )
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except ValueError as exc:
        if "does not belong to project" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    active_selection = await repo.get_active_world_selection(project_id)
    if not active_selection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve active world selection after saving.",
        )

    sel_rec, cand_rec = active_selection
    return api_success(data=sel_rec.to_read_schema(cand_rec.to_read_schema()))


@router.get("/selection", response_model=APIResponse[WorldSelectionRead])
async def get_active_selection(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[WorldSelectionRead]:
    """Retrieve the active human world selection and selected candidate details for a project."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    active_selection = await repo.get_active_world_selection(project_id)
    if not active_selection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No world selected yet for project '{project_id}'. Make a selection in Stage 4 first.",
        )

    sel_rec, cand_rec = active_selection
    return api_success(data=sel_rec.to_read_schema(cand_rec.to_read_schema()))
