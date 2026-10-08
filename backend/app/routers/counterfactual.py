import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import require_project_owner
from backend.app.core.response import APIResponse, api_success
from backend.app.models.counterfactual import (
    CounterfactualCandidateRead,
    CounterfactualDeltaResponse,
    ForkCounterfactualRequest,
)
from backend.app.models.project import Project, ProjectRead
from backend.app.providers.factory import get_ai_provider, get_storage_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session
from backend.app.services.counterfactual_service import CounterfactualService
from backend.app.services.lineage_service import LineageService
from backend.app.services.persistence_service import PersistenceService

logger = logging.getLogger("seed_unfold.router.counterfactual")

router = APIRouter(prefix="/projects", tags=["counterfactual"])


def get_counterfactual_service(session: AsyncSession = Depends(get_session)) -> CounterfactualService:
    repo = ProjectRepository(session)
    storage = get_storage_provider()
    lineage_service = LineageService(repo)
    persistence_service = PersistenceService(repo=repo, storage=storage, lineage_service=lineage_service)
    ai_provider = get_ai_provider()
    return CounterfactualService(
        repo=repo,
        persistence_service=persistence_service,
        ai_provider=ai_provider,
    )


@router.get("/{project_id}/counterfactual/candidates", response_model=APIResponse[List[CounterfactualCandidateRead]])
async def get_counterfactual_candidates(
    project_id: str,
    project: Project = Depends(require_project_owner),
    service: CounterfactualService = Depends(get_counterfactual_service),
) -> APIResponse[List[CounterfactualCandidateRead]]:
    """
    Retrieve all rejected candidate worlds available for counterfactual exploration (CNTR-01).
    """
    try:
        candidates = await service.get_counterfactual_candidates(project_id)
        return api_success(candidates)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to fetch counterfactual candidates for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch counterfactual candidates: {str(exc)}",
        )


@router.get("/{project_id}/counterfactual/delta/{candidate_id}", response_model=APIResponse[CounterfactualDeltaResponse])
async def get_counterfactual_delta(
    project_id: str,
    candidate_id: str,
    use_ai: bool = Query(default=True),
    project: Project = Depends(require_project_owner),
    service: CounterfactualService = Depends(get_counterfactual_service),
) -> APIResponse[CounterfactualDeltaResponse]:
    """
    Compute structured divergence delta comparing current canon against a rejected candidate (CNTR-02).
    """
    try:
        delta = await service.generate_counterfactual_delta(project_id, candidate_id, use_ai=use_ai)
        return api_success(delta)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to compute counterfactual delta for {project_id}/{candidate_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute counterfactual delta: {str(exc)}",
        )


@router.post("/{project_id}/counterfactual/fork", response_model=APIResponse[ProjectRead])
async def fork_counterfactual_branch(
    project_id: str,
    payload: ForkCounterfactualRequest,
    project: Project = Depends(require_project_owner),
    service: CounterfactualService = Depends(get_counterfactual_service),
) -> APIResponse[ProjectRead]:
    """
    Fork an isolated timeline branch rooted in a rejected candidate world (CNTR-01).
    """
    try:
        child_project = await service.fork_counterfactual_branch(project_id, payload)
        return api_success(child_project)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to fork counterfactual branch for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fork counterfactual branch: {str(exc)}",
        )
