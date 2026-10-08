from typing import Any, Dict, Optional


class AIProviderError(Exception):
    """Exception raised when an AI generation provider fails or is blocked."""

    def __init__(
        self,
        message: str,
        error_code: str = "AI_GENERATION_FAILED",
        status_code: int = 502,
        retryable: bool = True,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.retryable = retryable
        self.details = details or {}
