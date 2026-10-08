import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.auth import require_project_owner
from backend.app.core.response import APIResponse, api_success
from backend.app.models.lineage import AncestorPathRead, TraceGraphRead
from backend.app.models.project import Project
from backend.app.repositories.project_repo import ProjectRepository, get_session
from backend.app.services.lineage_service import LineageService

logger = logging.getLogger("seed_unfold.router.lineage")

router = APIRouter(prefix="/projects/{project_id}", tags=["lineage"])


@router.get("/lineage", response_model=APIResponse[TraceGraphRead])
async def get_project_lineage(
    project_id: str,
    project: Project = Depends(require_project_owner),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[TraceGraphRead]:
    """
    Retrieve the dynamic causal lineage DAG for the project (TRAC-01, TRAC-02, TRAC-03).
    Synthesizes nodes, directed edges, and human-intelligible causal explanations without CoT leakage.
    """
    repo = ProjectRepository(session)
    service = LineageService(repo)
    try:
        graph = await service.build_project_lineage(project_id)
        return api_success(graph)
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error(f"Failed to build lineage graph for project {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build project lineage graph: {str(exc)}",
        )


@router.get("/lineage/node/{node_id}/ancestors", response_model=APIResponse[AncestorPathRead])
async def get_node_ancestor_path(
    project_id: str,
    node_id: str,
    project: Project = Depends(require_project_owner),
    session: AsyncSession = Depends(get_session),
) -> APIResponse[AncestorPathRead]:
    """
    Traverse and return the direct ancestor trail from a targeted node back to root_seed.
    """
    repo = ProjectRepository(session)
    service = LineageService(repo)
    try:
        path_read = await service.get_node_ancestors(project_id, node_id)
        return api_success(path_read)
    except KeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error(f"Failed to trace ancestors for node {node_id} in project {project_id}: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trace node ancestors: {str(exc)}",
        )
