import asyncio
import hashlib
import logging
import os
import urllib.parse
from typing import Any, Dict, Optional
import httpx

from backend.app.providers.media.base import (
    ImageProvider,
    MediaPayload,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)

ASPECT_RATIO_DIMENSIONS = {
    "1:1": (1024, 1024),
    "16:9": (1280, 720),
    "9:16": (720, 1280),
}


class PollinationsImageProvider(ImageProvider):
    """Concrete image provider integrating Pollinations.ai keyless REST endpoint

    Features configurable timeout (default 25s), exponential backoff retry for
    transient rate limits / 5xx / network errors, and ProviderUnavailableError
    cascade on retry exhaustion.
    """

    def __init__(
        self,
        timeout_sec: Optional[float] = None,
        max_retries: int = 2,
        initial_backoff: float = 1.0,
        backoff_multiplier: float = 2.0,
    ) -> None:
        env_timeout = os.getenv("POLLINATIONS_TIMEOUT_SEC")
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else (float(env_timeout) if env_timeout else 25.0)
        )
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self.backoff_multiplier = backoff_multiplier
        self.default_model = os.getenv("POLLINATIONS_MODEL", "flux")
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
            "model": self.default_model,
            "seed": str(seed),
            "nologo": "true",
        }
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
                    response = await client.get(url)

                    # Transient retryable status codes (429 Rate Limit, 5xx server errors)
                    if response.status_code in (429, 500, 502, 503, 504):
                        error_msg = f"HTTP {response.status_code} received from Pollinations"
                        logger.warning(
                            "Transient failure on attempt %d: %s. Backoff %.1fs.",
                            attempt + 1,
                            error_msg,
                            current_backoff,
                        )
                        last_exception = ProviderUnavailableError(error_msg)
                        if attempt < self.max_retries:
                            await asyncio.sleep(current_backoff)
                            current_backoff *= self.backoff_multiplier
                            continue
                        raise ProviderUnavailableError(f"Pollinations retry exhaustion: {error_msg}")

                    response.raise_for_status()

                    content = response.content
                    if not content or len(content) < 50:
                        raise ProviderUnavailableError("Empty or truncated image binary from Pollinations")

                    content_type = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
                    ext = "png" if "png" in content_type else "jpg"
                    file_hash = hashlib.md5(content[:256]).hexdigest()[:10]

                    return MediaPayload(
                        data=content,
                        mime_type=content_type,
                        filename=f"pollinations_{file_hash}.{ext}",
                        metadata={
                            "width": width,
                            "height": height,
                            "aspect_ratio": aspect_ratio,
                            "resolved_provider": "pollinations",
                            "model": self.default_model,
                            "seed": seed,
                            "prompt": prompt,
                        },
                    )

            except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as net_err:
                last_exception = net_err
                logger.warning(
                    "Network error on attempt %d: %s. Backoff %.1fs.",
                    attempt + 1,
                    net_err,
                    current_backoff,
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(current_backoff)
                    current_backoff *= self.backoff_multiplier
                    continue
                break
            except httpx.HTTPStatusError as http_err:
                if http_err.response.status_code == 402:
                    logger.error("Pollinations returned 402 Payment Required. Halting retries.")
                    raise ProviderUnavailableError("Client error '402 Payment Required'") from http_err
                
                last_exception = http_err
                logger.warning(
                    "HTTP error on attempt %d: %s. Backoff %.1fs.",
                    attempt + 1,
                    http_err,
                    current_backoff,
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(current_backoff)
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
            f"Pollinations retry exhaustion: {last_exception}"
        ) from last_exception

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "PollinationsImageProvider",
            "model": self.default_model,
            "timeout_sec": self.timeout_sec,
            "max_retries": self.max_retries,
        }
