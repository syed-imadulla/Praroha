import asyncio
import hashlib
import logging
import os
import random
import urllib.parse
from typing import Any, Dict, Optional
import httpx

from backend.app.providers.media.base import (
    AuthenticationError,
    ImageProvider,
    MediaPayload,
    PaymentRequiredError,
    ProviderUnavailableError,
    QuotaExceededError,
    TransientProviderError,
)

# Models supported via the legacy anonymous compatibility route on https://image.pollinations.ai/prompt.
# ARCHITECTURAL NOTICE:
# 1. In Pollinations' official OpenAPI catalog (https://gen.pollinations.ai), models marked `paid_only: false`
#    carry pollen unit pricing (e.g. flux: 0.002, z-image-turbo: 0.004, sana: 0.0001) when an authenticated key is used.
#    `paid_only: false` does NOT prove guaranteed zero-cost generation across all access methods.
# 2. This unauthenticated route is maintained strictly as a legacy, best-effort compatibility path.
#    It does NOT have guaranteed future availability or rate-limit invariance.
# 3. Any model not explicitly in this compatibility set is treated as cost-ambiguous / paid-only
#    and blocked from unauthenticated automatic routing with an AuthenticationError.
# 4. If an authenticated key with 0 pollen balance is used, Pollinations returns HTTP 402,
#    which triggers the cost-safe circuit breaker immediately without secondary paid cascading.
PUBLIC_UNAUTHENTICATED_MODELS = {
    "flux",
    "black-forest-labs/flux.1-schnell",
    "sana",
    "dreamshaper",
    "lykon/dreamshaper-8-lcm",
    "z-image",
    "zimage",
    "z-image-turbo",
    "tongyi-mai/z-image-turbo",
}
# Backward compatibility alias
VERIFIED_FREE_MODELS = PUBLIC_UNAUTHENTICATED_MODELS

logger = logging.getLogger(__name__)

ASPECT_RATIO_DIMENSIONS = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "9:16": (720, 1280),
}


class PollinationsImageProvider(ImageProvider):
    """Concrete image provider integrating Pollinations.ai REST endpoint.

    Features configurable timeout (default 25s), authenticated Bearer token
    support via POLLINATIONS_API_KEY, exponential backoff with jitter for
    transient errors (429, 5xx, network errors), and immediate non-retrying
    ProviderUnavailableError cascade for 401/402 authentication/credits failures.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout_sec: Optional[float] = None,
        max_retries: int = 2,
        initial_backoff: float = 1.0,
        backoff_multiplier: float = 2.0,
    ) -> None:
        from backend.app.config import settings

        env_timeout = os.getenv("POLLINATIONS_TIMEOUT_SEC")
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else (float(env_timeout) if env_timeout else 25.0)
        )
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self.backoff_multiplier = backoff_multiplier

        self.api_key = (
            api_key
            if api_key is not None
            else (settings.POLLINATIONS_API_KEY or os.getenv("POLLINATIONS_API_KEY", ""))
        )
        self.default_model = (
            model
            if model is not None
            else (settings.POLLINATIONS_MODEL or os.getenv("POLLINATIONS_MODEL", "flux"))
        )
        self.base_url = "https://image.pollinations.ai/prompt"

    def _derive_seed(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> int:
        """Derive deterministic positive integer seed for reproducibility."""
        ctx = context or {}
        project_id = str(ctx.get("project_id", ""))
        entity_id = str(ctx.get("entity_id", ""))
        seed_key = f"{project_id}_{entity_id}_{prompt}" if (project_id or entity_id) else prompt
        hash_digest = hashlib.sha256(seed_key.encode("utf-8")).hexdigest()
        return int(hash_digest[:8], 16) % 1_000_000_000

    def _resolve_dimensions(self, aspect_ratio: str) -> tuple[int, int]:
        return ASPECT_RATIO_DIMENSIONS.get(aspect_ratio, (1024, 1024))

    def build_generation_url(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        context: Optional[Dict[str, Any]] = None,
    ) -> tuple[str, int, int, int]:
        """Construct full encoded target URL and query parameters."""
        width, height = self._resolve_dimensions(aspect_ratio)
        seed = self._derive_seed(prompt, context)
        encoded_prompt = urllib.parse.quote(prompt.strip(), safe="")

        params = {
            "width": str(width),
            "height": str(height),
            "seed": str(seed),
            "nologo": "true",
        }
        effective_model = (context.get("model") if context else None) or self.default_model
        if not self.api_key and effective_model and effective_model.lower() not in VERIFIED_FREE_MODELS:
            raise AuthenticationError(
                f"Model '{effective_model}' is not in the confirmed zero-cost catalog and requires an authenticated API key (POLLINATIONS_API_KEY)."
            )

        if effective_model:
            params["model"] = effective_model

        query_string = urllib.parse.urlencode(params)
        url = f"{self.base_url}/{encoded_prompt}?{query_string}"
        return url, width, height, seed

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        url, width, height, seed = self.build_generation_url(prompt, aspect_ratio, context)
        last_exception: Optional[Exception] = None

        current_backoff = self.initial_backoff

        headers = {
            "Accept": "image/*",
            "User-Agent": "Praroha/1.0",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        for attempt in range(self.max_retries + 1):
            try:
                logger.info(
                    "Pollinations generation attempt %d/%d (timeout=%.1fs, ratio=%s)",
                    attempt + 1,
                    self.max_retries + 1,
                    self.timeout_sec,
                    aspect_ratio,
                )
                async with httpx.AsyncClient(
                    timeout=self.timeout_sec,
                    follow_redirects=True,
                ) as client:
                    response = await client.get(url, headers=headers)

                    # 1. Non-retryable payment, quota, and authorization errors
                    if response.status_code == 401:
                        logger.error("Pollinations returned 401 Unauthorized (Invalid API Key). Halting.")
                        raise AuthenticationError("Pollinations API Key is invalid or unauthorized (HTTP 401)")
                    if response.status_code == 402:
                        logger.error("Pollinations returned 402 Payment Required (Insufficient credits). Halting.")
                        raise PaymentRequiredError(
                            "Pollinations account has insufficient credits or requires payment (HTTP 402)"
                        )
                    if response.status_code == 403:
                        logger.error("Pollinations returned 403 Forbidden. Halting.")
                        raise AuthenticationError("Pollinations API access forbidden (HTTP 403)")
                    if response.status_code == 429:
                        logger.error("Pollinations returned 429 Rate Limit Exceeded. Halting cascade.")
                        raise QuotaExceededError("Pollinations rate limit exceeded (HTTP 429)")

                    # 2. Transient retryable status codes (5xx server errors)
                    if response.status_code in (500, 502, 503, 504):
                        error_msg = f"HTTP {response.status_code} received from Pollinations"
                        jitter = random.uniform(0.1, 0.4)
                        logger.warning(
                            "Transient failure on attempt %d: %s. Backoff %.1fs.",
                            attempt + 1,
                            error_msg,
                            current_backoff + jitter,
                        )
                        last_exception = TransientProviderError(error_msg)
                        if attempt < self.max_retries:
                            await asyncio.sleep(current_backoff + jitter)
                            current_backoff *= self.backoff_multiplier
                            continue
                        raise TransientProviderError(f"Pollinations retry exhaustion: {error_msg}")

                    response.raise_for_status()

                    content = response.content
                    if not content or len(content) < 50:
                        raise ProviderUnavailableError("Empty or truncated image binary from Pollinations")

                    # Validate binary magic bytes for image formats (JPEG: \xff\xd8, PNG: \x89PNG, WebP: RIFF...WEBP)
                    is_valid_image = (
                        content.startswith(b"\xff\xd8")
                        or content.startswith(b"\x89PNG")
                        or (content.startswith(b"RIFF") and b"WEBP" in content[:16])
                    )
                    if not is_valid_image:
                        logger.warning("Pollinations returned binary payload without standard image magic bytes.")

                    content_type = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
                    ext = "png" if "png" in content_type else "jpg"
                    file_hash = hashlib.md5(content[:256]).hexdigest()[:10]

                    resolved_model = response.headers.get("x-model-used", self.default_model)

                    return MediaPayload(
                        data=content,
                        mime_type=content_type,
                        filename=f"pollinations_{file_hash}.{ext}",
                        metadata={
                            "width": width,
                            "height": height,
                            "aspect_ratio": aspect_ratio,
                            "resolved_provider": "pollinations",
                            "model": resolved_model,
                            "seed": seed,
                            "prompt": prompt,
                        },
                    )

            except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as net_err:
                last_exception = net_err
                jitter = random.uniform(0.1, 0.4)
                logger.warning(
                    "Network error on attempt %d: %s. Backoff %.1fs.",
                    attempt + 1,
                    net_err,
                    current_backoff + jitter,
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(current_backoff + jitter)
                    current_backoff *= self.backoff_multiplier
                    continue
                break
            except ProviderUnavailableError:
                raise
            except Exception as unhandled:
                last_exception = unhandled
                logger.warning(
                    "Unexpected error in Pollinations attempt %d: %s",
                    attempt + 1,
                    unhandled,
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(current_backoff)
                    current_backoff *= self.backoff_multiplier
                    continue
                break

        # If exhausted all retries
        logger.error(
            "Pollinations provider exhausted all %d retries. Triggering cascade.",
            self.max_retries + 1,
        )
        raise ProviderUnavailableError(
            f"Pollinations service unavailable after {self.max_retries + 1} attempts: {last_exception}"
        ) from last_exception

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "PollinationsImageProvider",
            "model": self.default_model,
            "timeout_sec": self.timeout_sec,
            "has_api_key": bool(self.api_key),
        }
