from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.response import APIResponse, api_success
from backend.app.models.dna import ExtractDNARequest, SeedDNA, SeedDNARead
from backend.app.providers.factory import get_ai_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session

router = APIRouter(prefix="/projects/{project_id}/dna", tags=["dna"])


@router.post("/extract", response_model=APIResponse[SeedDNARead])
async def extract_seed_dna(
    project_id: str,
    payload: ExtractDNARequest = ExtractDNARequest(),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[SeedDNARead]:
    """Execute the Seed Understanding pass to distill raw creative seed into structured Seed DNA."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    raw_seed = (payload.raw_seed or project.seed_text or "").strip()
    if not raw_seed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seed text cannot be empty. Please provide a raw seed for DNA extraction.",
        )

    # If the user provided a fresh raw seed in this request, update project seed_text
    if payload.raw_seed and payload.raw_seed.strip() != project.seed_text:
        project.seed_text = raw_seed
        session.add(project)
        await session.commit()

    ai_provider = get_ai_provider()
    extraction_result = await ai_provider.extract_dna(raw_seed)

    dna_dict = extraction_result.get("seed_dna", {})
    validated_dna = SeedDNA.model_validate(dna_dict)
    model_used = extraction_result.get("model_used", "mock")
    fallback_used = extraction_result.get("fallback_used", False)

    # Persist the Seed DNA record with immutable raw_seed
    record = await repo.save_seed_dna(
        project_id=project_id,
        raw_seed=raw_seed,
        dna=validated_dna,
        model_used=model_used,
        fallback_used=fallback_used,
    )

    # Update project status to understood
    await repo.update_project_status(project_id, "understood")

    return api_success(data=record.to_read_schema())


@router.get("", response_model=APIResponse[SeedDNARead])
async def get_latest_seed_dna(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[SeedDNARead]:
    """Retrieve the latest extracted Seed DNA for a project."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    record = await repo.get_latest_seed_dna(project_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No Seed DNA found for project '{project_id}'. Run extraction first.",
        )

    return api_success(data=record.to_read_schema())
