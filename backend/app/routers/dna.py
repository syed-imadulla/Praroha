import json
import traceback
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.errors import AIProviderError
from backend.app.core.response import APIResponse, api_success
from backend.app.models.dna import ExtractDNARequest, SeedDNA, SeedDNARead
from backend.app.models.job import GenerationJob, GenerationJobRead
from backend.app.providers.factory import get_ai_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session, async_session
from backend.app.services.job_service import update_job_status

router = APIRouter(prefix="/projects/{project_id}/dna", tags=["dna"])


async def generate_dna_task(job_id: str, project_id: str, raw_seed: str):
    await update_job_status(job_id, "processing")
    
    try:
        async with async_session() as session:
            repo = ProjectRepository(session)
            ai_provider = get_ai_provider()
            extraction_result = await ai_provider.extract_dna(raw_seed)
            
            
            
            dna_dict = extraction_result.get("seed_dna", {})
            validated_dna = SeedDNA.model_validate(dna_dict)
            model_used = extraction_result.get("model_used", "mock")
            fallback_used = extraction_result.get("fallback_used", False)
            
            record = await repo.save_seed_dna(
                project_id=project_id,
                raw_seed=raw_seed,
                dna=validated_dna,
                model_used=model_used,
                fallback_used=fallback_used,
            )
            
            await repo.update_project_status(project_id, "understood")
            
            result_json = json.dumps(record.to_read_schema().model_dump(mode="json"))
            await update_job_status(job_id, "completed", 100, result_json=result_json)
            
    except AIProviderError as e:
        await update_job_status(job_id, "failed", error_code=e.error_code, error_message=e.message)
    except Exception as e:
        import logging
        logging.getLogger("backend.app").error(f"DNA generation failed: {e}", exc_info=True)
        await update_job_status(job_id, "failed", error_code="INTERNAL_ERROR", error_message=str(e))


@router.post("/extract", response_model=APIResponse[GenerationJobRead])
async def extract_seed_dna(
    project_id: str,
    background_tasks: BackgroundTasks,
    payload: ExtractDNARequest = ExtractDNARequest(),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[GenerationJobRead]:
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

    if payload.raw_seed and payload.raw_seed.strip() != project.seed_text:
        project.seed_text = raw_seed
        session.add(project)
        await session.commit()

    job = GenerationJob(
        project_id=project_id,
        job_type="dna_extraction",
        status="queued"
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)

    background_tasks.add_task(generate_dna_task, job.id, project_id, raw_seed)

    return api_success(data=job)


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
