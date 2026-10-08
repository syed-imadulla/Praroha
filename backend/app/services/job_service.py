import json
import logging
import traceback
from datetime import datetime, timezone

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.job import GenerationJob
from backend.app.repositories.project_repo import async_session

logger = logging.getLogger(__name__)

async def update_job_status(
    job_id: str,
    status: str,
    progress: int = 0,
    result_json: str = None,
    error_code: str = None,
    error_message: str = None,
):
    async with async_session() as session:
        job = await session.get(GenerationJob, job_id)
        if not job:
            return
        
        job.status = status
        job.progress = progress
        job.updated_at = datetime.now(timezone.utc)
        
        if status == "processing" and job.started_at is None:
            job.started_at = datetime.now(timezone.utc)
            
        if status in ("completed", "failed") and job.completed_at is None:
            job.completed_at = datetime.now(timezone.utc)
            
        if result_json:
            job.result_json = result_json
            
        if error_code:
            job.error_code = error_code
        if error_message:
            job.error_message = error_message
            
        session.add(job)
        await session.commit()
