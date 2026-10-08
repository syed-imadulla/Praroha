from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.core.errors import AIProviderError
from backend.app.core.response import api_error
from backend.app.repositories.project_repo import init_db
from backend.app.routers.dna import router as dna_router
from backend.app.routers.health import router as health_router
from backend.app.routers.lineage import router as lineage_router
from backend.app.routers.media import router as media_router
from backend.app.routers.mutation import router as mutation_router
from backend.app.routers.counterfactual import router as counterfactual_router
from backend.app.routers.persistence import router as persistence_router
from backend.app.routers.potential import router as potential_router
from backend.app.routers.projects import router as projects_router
from backend.app.routers.selection import router as selection_router
from backend.app.routers.unfold import router as unfold_router
from backend.app.routers.worlds import router as worlds_router
from backend.app.routers.jobs import router as jobs_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle handler."""
    # Initialize SQLModel database tables on startup
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Seed Unfold backend service for human-guided generative world unfolding.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for AI provider errors to return explicit error envelopes
@app.exception_handler(AIProviderError)
async def ai_provider_error_handler(request: Request, exc: AIProviderError) -> JSONResponse:
    import logging
    logging.getLogger("backend.app").warning(
        f"AIProviderError on {request.method} {request.url.path}: [{exc.error_code}] {exc.message}"
    )
    error_res = api_error(
        code=exc.error_code,
        message=exc.message,
        retryable=exc.retryable,
    )
    content = error_res.model_dump()
    content["error_code"] = exc.error_code
    content["message"] = exc.message
    content["retryable"] = exc.retryable
    content["status"] = "error"
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )


# Exception handler for HTTP exceptions to preserve standardized APIResponse format
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    error_res = api_error(
        code=f"HTTP_{exc.status_code}",
        message=str(exc.detail),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_res.model_dump(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import logging
    logging.getLogger("backend.app").error(
        f"Unhandled exception on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )
    error_res = api_error(
        code="INTERNAL_SERVER_ERROR",
        message=str(exc) or "Internal server error occurred.",
    )
    return JSONResponse(
        status_code=500,
        content=error_res.model_dump(),
    )


# Mount routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(projects_router, prefix=settings.API_V1_PREFIX)
app.include_router(dna_router, prefix=settings.API_V1_PREFIX)
app.include_router(potential_router, prefix=settings.API_V1_PREFIX)
app.include_router(worlds_router, prefix=settings.API_V1_PREFIX)
app.include_router(selection_router, prefix=settings.API_V1_PREFIX)
app.include_router(unfold_router, prefix=settings.API_V1_PREFIX)
app.include_router(lineage_router, prefix=settings.API_V1_PREFIX)
app.include_router(persistence_router, prefix=settings.API_V1_PREFIX)
app.include_router(mutation_router, prefix=settings.API_V1_PREFIX)
app.include_router(counterfactual_router, prefix=settings.API_V1_PREFIX)
app.include_router(media_router, prefix=settings.API_V1_PREFIX)
app.include_router(jobs_router, prefix=settings.API_V1_PREFIX)

# Ensure upload directory exists and is mounted for static asset retrieval
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

