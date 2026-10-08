import json
import traceback
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import require_project_owner
from backend.app.core.errors import AIProviderError
from backend.app.core.response import APIResponse, api_success
from backend.app.models.job import GenerationJob, GenerationJobRead
from backend.app.models.project import Project
from backend.app.models.world import WorldCandidate, WorldCandidateRead
from backend.app.providers.factory import get_ai_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session, async_session
from backend.app.services.job_service import update_job_status

router = APIRouter(prefix="/projects/{project_id}/worlds", tags=["worlds"])


async def generate_worlds_task(job_id: str, project_id: str, dna_dict: dict, potential_items: list, dna_record_id: str):
    await update_job_status(job_id, "processing")
    try:
        async with async_session() as session:
            repo = ProjectRepository(session)
            ai_provider = get_ai_provider()
            raw_candidates = await ai_provider.generate_worlds(dna_dict, potential_items=potential_items)
            
            if not isinstance(raw_candidates, list) or len(raw_candidates) != 3:
                raise ValueError(f"World branching engine failed to produce exactly 3 candidates (received {len(raw_candidates) if isinstance(raw_candidates, list) else 0}).")
                
            validated_candidates = [
                WorldCandidate.model_validate({**c, "index": c.get("index", idx)})
                for idx, c in enumerate(raw_candidates, start=1)
            ]
            
            batch_id = str(uuid.uuid4())
            provider_name = getattr(ai_provider, "model", "mock")
            
            saved_records = await repo.save_world_candidates(
                project_id=project_id,
                seed_dna_id=dna_record_id,
                batch_id=batch_id,
                candidates=validated_candidates,
                model_used=provider_name,
                fallback_used=getattr(ai_provider, "fallback_used", False),
            )
            
            await repo.update_project_status(project_id, "worlds_generated")
            
            result_json = json.dumps([r.to_read_schema().model_dump(mode="json") for r in saved_records])
            await update_job_status(job_id, "completed", 100, result_json=result_json)
            
    except AIProviderError as e:
        await update_job_status(job_id, "failed", error_code=e.error_code, error_message=e.message)
    except Exception as e:
        import logging
        logging.getLogger("backend.app").error(f"World generation failed: {e}", exc_info=True)
        await update_job_status(job_id, "failed", error_code="INTERNAL_ERROR", error_message=str(e))


@router.post("/generate", response_model=APIResponse[GenerationJobRead])
async def generate_world_candidates(
    project_id: str,
    background_tasks: BackgroundTasks,
    project: Project = Depends(require_project_owner),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[GenerationJobRead]:
    """Generate exactly three contrasting world candidates grounded in the project's Seed DNA."""
    repo = ProjectRepository(session)
    latest_dna_record = await repo.get_latest_seed_dna(project_id)
    if not latest_dna_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project '{project_id}' has no Seed DNA. Extract Seed DNA in Stage 2 before generating worlds.",
        )

    dna_dict = latest_dna_record.to_seed_dna().model_dump()
    dna_dict["raw_seed"] = latest_dna_record.raw_seed

    potential_records = await repo.get_potential_items(project_id)
    potential_items = [
        {
            "label": r.label,
            "category": r.category,
            "confidence": r.confidence,
            "source_evidence": r.source_evidence,
            "user_status": r.user_status,
        }
        for r in potential_records
    ] if potential_records else None

    job = GenerationJob(
        project_id=project_id,
        job_type="world_generation",
        status="queued"
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)

    background_tasks.add_task(
        generate_worlds_task, 
        job.id, 
        project_id, 
        dna_dict, 
        potential_items, 
        latest_dna_record.id
    )

    return api_success(data=job)


@router.get("", response_model=APIResponse[List[WorldCandidateRead]])
async def get_latest_world_candidates(
    project_id: str,
    project: Project = Depends(require_project_owner),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[WorldCandidateRead]]:
    """Retrieve the latest batch of three world candidates for a project."""
    repo = ProjectRepository(session)
    records = await repo.get_latest_world_candidates(project_id)
    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No world candidates found for project '{project_id}'. Trigger generation first.",
        )

    return api_success(data=[r.to_read_schema() for r in records])
