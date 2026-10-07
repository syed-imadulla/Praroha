import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.response import APIResponse, api_success
from backend.app.models.mutation import (
    ForkMutationRequest,
    MutationSimulationResponse,
    PremiseVariableRead,
    SeedMutationRequest,
)
from backend.app.models.project import ProjectRead
from backend.app.providers.factory import get_storage_provider
from backend.app.repositories.project_repo import ProjectRepository, get_session
from backend.app.services.lineage_service import LineageService
from backend.app.services.mutation_service import MutationService
from backend.app.services.persistence_service import PersistenceService

logger = logging.getLogger("seed_unfold.router.mutation")

router = APIRouter(prefix="/projects", tags=["mutation"])


def get_mutation_service(session: AsyncSession = Depends(get_session)) -> MutationService:
    repo = ProjectRepository(session)
    storage = get_storage_provider()
    lineage_service = LineageService(repo)
    persistence_service = PersistenceService(repo=repo, storage=storage, lineage_service=lineage_service)
    return MutationService(repo=repo, persistence_service=persistence_service, lineage_service=lineage_service)


@router.get("/{project_id}/mutation/variables", response_model=APIResponse[List[PremiseVariableRead]])
async def get_premise_variables(
    project_id: str,
    service: MutationService = Depends(get_mutation_service),
) -> APIResponse[List[PremiseVariableRead]]:
    """
    Retrieve all curated premise variables available for counterfactual mutation (MUT-01).
    """
    try:
        variables = await service.extract_premise_variables(project_id)
        return api_success(variables)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to extract premise variables for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract premise variables: {str(exc)}",
        )


@router.post("/{project_id}/mutation/simulate", response_model=APIResponse[MutationSimulationResponse])
async def simulate_mutation(
    project_id: str,
    payload: SeedMutationRequest,
    service: MutationService = Depends(get_mutation_service),
) -> APIResponse[MutationSimulationResponse]:
    """
    Simulate downstream entity impact for a premise mutation request (MUT-02).
    Classifies entities into AFFECTED, CONDITIONAL, and PRESERVED with causal justifications.
    """
    try:
        simulation = await service.simulate_mutation(project_id, payload)
        return api_success(simulation)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to simulate mutation for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to simulate mutation: {str(exc)}",
        )


@router.post("/{project_id}/mutation/fork", response_model=APIResponse[ProjectRead])
async def fork_mutated_universe(
    project_id: str,
    payload: ForkMutationRequest,
    service: MutationService = Depends(get_mutation_service),
) -> APIResponse[ProjectRead]:
    """
    Commit a counterfactual mutation by forking an isolated child timeline branch (MUT-03).
    Guarantees parent universe immutability and complete child ID remapping.
    """
    try:
        forked_project = await service.fork_mutated_universe(project_id, payload)
        return api_success(forked_project)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to fork mutated universe for {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fork mutated universe: {str(exc)}",
        )
