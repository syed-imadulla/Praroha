from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str


class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
    fallback_used: bool = False
    warning: Optional[str] = None


def api_success(
    data: Optional[T] = None,
    fallback_used: bool = False,
    warning: Optional[str] = None,
) -> APIResponse[T]:
    return APIResponse(
        success=True,
        data=data,
        error=None,
        fallback_used=fallback_used,
        warning=warning,
    )


def api_error(
    code: str,
    message: str,
    warning: Optional[str] = None,
) -> APIResponse[None]:
    return APIResponse(
        success=False,
        data=None,
        error=ErrorDetail(code=code, message=message),
        fallback_used=False,
        warning=warning,
    )
