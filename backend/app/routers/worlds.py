import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.response import APIResponse, api_success
from backend.app.models.world import WorldCandidate, WorldCandidateRead
from backend.app.providers.factory import get_ai_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session

router = APIRouter(prefix="/projects/{project_id}/worlds", tags=["worlds"])


@router.post("/generate", response_model=APIResponse[List[WorldCandidateRead]])
async def generate_world_candidates(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[WorldCandidateRead]]:
    """Generate exactly three contrasting world candidates grounded in the project's Seed DNA."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    latest_dna_record = await repo.get_latest_seed_dna(project_id)
    if not latest_dna_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project '{project_id}' has no Seed DNA. Extract Seed DNA in Stage 2 before generating worlds.",
        )

    # Package Seed DNA dictionary and ensure immutable raw_seed is passed for canonical detection
    dna_dict = latest_dna_record.to_seed_dna().model_dump()
    dna_dict["raw_seed"] = latest_dna_record.raw_seed

    ai_provider = get_ai_provider()
    raw_candidates = await ai_provider.generate_worlds(dna_dict)

    if not isinstance(raw_candidates, list) or len(raw_candidates) != 3:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"World branching engine failed to produce exactly 3 candidates (received {len(raw_candidates) if isinstance(raw_candidates, list) else 0}).",
        )

    validated_candidates = [
        WorldCandidate.model_validate({**c, "index": c.get("index", idx)})
        for idx, c in enumerate(raw_candidates, start=1)
    ]

    batch_id = str(uuid.uuid4())
    provider_name = getattr(ai_provider, "model", "mock")

    saved_records = await repo.save_world_candidates(
        project_id=project_id,
        seed_dna_id=latest_dna_record.id,
        batch_id=batch_id,
        candidates=validated_candidates,
        model_used=provider_name,
        fallback_used=getattr(ai_provider, "fallback_used", False),
    )

    await repo.update_project_status(project_id, "worlds_generated")

    return api_success(data=[r.to_read_schema() for r in saved_records])


@router.get("", response_model=APIResponse[List[WorldCandidateRead]])
async def get_latest_world_candidates(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[WorldCandidateRead]]:
    """Retrieve the latest batch of three world candidates for a project."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    records = await repo.get_latest_world_candidates(project_id)
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No world candidates found for project '{project_id}'. Trigger generation first.",
        )

    return api_success(data=[r.to_read_schema() for r in records])
