import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx
import jwt
from jwt import PyJWKClient
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.config import settings
from backend.app.repositories.project_repo import get_session

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

# Cached JWKS client
_jwks_client: Optional[PyJWKClient] = None


def get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client
    if _jwks_client is None and settings.SUPABASE_URL:
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True, max_cached_keys=10)
    return _jwks_client


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: str = "authenticated"


async def verify_supabase_jwt(token: str) -> AuthenticatedUser:
    """
    Verify Supabase JWT using JWKS public keys.
    Falls back to Supabase /auth/v1/user endpoint if JWKS verification encounters an issue.
    """
    jwks = get_jwks_client()
    if jwks:
        try:
            signing_key = jwks.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256", "HS256"],
                audience="authenticated",
                options={"verify_exp": True},
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing subject claim",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return AuthenticatedUser(
                id=str(user_id),
                email=payload.get("email"),
                role=payload.get("role", "authenticated"),
            )
        except jwt.PyJWTError as jwt_err:
            logger.warning(f"JWKS token verification failed: {jwt_err}. Attempting fallback...")
        except Exception as e:
            logger.warning(f"JWKS key resolution error: {e}. Attempting fallback...")

    # Fallback: Query Supabase Auth API directly
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {token}",
                }
                res = await client.get(
                    f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user",
                    headers=headers,
                )
                if res.status_code == 200:
                    data = res.json()
                    user_id = data.get("id")
                    if user_id:
                        return AuthenticatedUser(
                            id=str(user_id),
                            email=data.get("email"),
                            role=data.get("role", "authenticated"),
                        )
        except Exception as fallback_err:
            logger.error(f"Supabase Auth API verification fallback failed: {fallback_err}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthenticatedUser:
    """
    FastAPI dependency to authenticate requests via Supabase JWT.
    Raises 401 if missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await verify_supabase_jwt(credentials.credentials)


async def require_project_owner(
    project_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from backend.app.repositories.project_repo import ProjectRepository
    repo = ProjectRepository(session)
    project = await repo.get_project(project_id)
    if not project or project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )
    return project
