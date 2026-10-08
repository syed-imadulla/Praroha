import json
import traceback
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from backend.app.core.errors import AIProviderError
from backend.app.core.response import APIResponse, api_success
from backend.app.models.job import GenerationJob, GenerationJobRead
from backend.app.models.potential import (
    BatchPotentialStatusUpdate,
    SeedPotentialItemRead,
    SeedPotentialItemUpdate,
)
from backend.app.providers.factory import get_ai_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session, async_session
from backend.app.services.job_service import update_job_status

router = APIRouter(prefix="/projects/{project_id}/potential", tags=["potential"])


async def generate_potential_task(job_id: str, project_id: str, seed_text: str, dna_dict: dict):
    await update_job_status(job_id, "processing")
    try:
        async with async_session() as session:
            repo = ProjectRepository(session)
            ai_provider = get_ai_provider()
            extraction_result = await ai_provider.extract_potential(seed_text, dna_dict)
            
            
            if isinstance(extraction_result, list):
                raw_items = extraction_result
            else:
                raw_items = extraction_result.get("potential_items", [])
                
            records = await repo.save_potential_items(project_id, raw_items)
            
            result_json = json.dumps([r.to_read_schema().model_dump(mode="json") for r in records])
            await update_job_status(job_id, "completed", 100, result_json=result_json)
    except AIProviderError as e:
        await update_job_status(job_id, "failed", error_code=e.error_code, error_message=e.message)
    except Exception as e:
        import logging
        logging.getLogger("backend.app").error(f"Potential generation failed: {e}", exc_info=True)
        await update_job_status(job_id, "failed", error_code="INTERNAL_ERROR", error_message=str(e))


@router.post("/extract", response_model=APIResponse[GenerationJobRead])
async def extract_potential_map(
    project_id: str,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[GenerationJobRead]:
    """Extract Seed Potential items (explicit, inferred, open) from seed and DNA."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    # Need seed text and DNA if available
    seed_text = (project.seed_text or "").strip()
    if not seed_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot extract potential map without a creative seed.",
        )

    dna_rec = await repo.get_latest_seed_dna(project_id)
    dna_dict = dna_rec.to_seed_dna().model_dump() if dna_rec else {}

    job = GenerationJob(
        project_id=project_id,
        job_type="potential_extraction",
        status="queued"
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)

    background_tasks.add_task(generate_potential_task, job.id, project_id, seed_text, dna_dict)

    return api_success(data=job)


@router.get("", response_model=APIResponse[List[SeedPotentialItemRead]])
async def get_potential_map(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[SeedPotentialItemRead]]:
    """Retrieve all potential items stored for this project."""
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    records = await repo.get_potential_items(project_id)
    return api_success(data=[r.to_read_schema() for r in records])


@router.patch("/{item_id}", response_model=APIResponse[SeedPotentialItemRead])
async def update_potential_item(
    project_id: str,
    item_id: str,
    payload: SeedPotentialItemUpdate,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[SeedPotentialItemRead]:
    """Update status of a specific potential item (e.g. accepted, rejected, pending)."""
    repo = ProjectRepository(session)
    record = await repo.update_potential_item_status(
        project_id=project_id,
        item_id=item_id,
        status=payload.user_status.value,
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Potential item '{item_id}' not found for project '{project_id}'.",
        )

    return api_success(data=record.to_read_schema())


@router.post("/batch", response_model=APIResponse[List[SeedPotentialItemRead]])
async def batch_update_potential_items(
    project_id: str,
    payload: BatchPotentialStatusUpdate,
    session: AsyncSession = Depends(get_session),
) -> APIResponse[List[SeedPotentialItemRead]]:
    """Batch update user status of multiple potential items."""
    repo = ProjectRepository(session)
    updates = [
        {"id": item.id, "user_status": item.user_status.value}
        for item in payload.items
    ]
    updated_records = await repo.batch_update_potential_item_statuses(
        project_id=project_id,
        updates=updates,
    )
    return api_success(data=[r.to_read_schema() for r in updated_records])
