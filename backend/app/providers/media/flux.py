import base64
import hashlib
import logging
import os
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


class FluxSchnellProvider(ImageProvider):
    """Local inference image provider targeting FLUX.1 schnell / ComfyUI / Diffusers endpoint.

    If FLUX_ENDPOINT is unset or unreachable, raises ProviderUnavailableError to allow
    clean cascade to Tier 3 MockImageProvider.
    """

    def __init__(self, endpoint: Optional[str] = None, timeout_sec: float = 30.0) -> None:
        self.endpoint = endpoint or os.getenv("FLUX_ENDPOINT")
        self.timeout_sec = timeout_sec

    def _resolve_dimensions(self, aspect_ratio: str) -> tuple[int, int]:
        return ASPECT_RATIO_DIMENSIONS.get(aspect_ratio, (1024, 1024))

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        if not self.endpoint:
            logger.info("FLUX_ENDPOINT not configured. Cascading to fallback.")
            raise ProviderUnavailableError("FLUX_ENDPOINT environment variable is not configured")

        width, height = self._resolve_dimensions(aspect_ratio)
        payload_data = {
            "prompt": prompt,
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "num_inference_steps": 4,  # schnell default
            "context": context or {},
        }

        try:
            logger.info("Dispatching image generation to local FLUX endpoint: %s", self.endpoint)
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                response = await client.post(self.endpoint, json=payload_data)
                response.raise_for_status()

                content_type = response.headers.get("content-type", "").split(";")[0].strip()
                # If JSON payload returned (e.g. base64 image field)
                if "application/json" in content_type:
                    res_json = response.json()
                    b64_str = res_json.get("image") or res_json.get("data")
                    if not b64_str:
                        raise ProviderUnavailableError("FLUX endpoint JSON missing image/data field")
                    raw_bytes = base64.b64decode(b64_str)
                    mime_type = res_json.get("mime_type", "image/png")
                else:
                    raw_bytes = response.content
                    mime_type = content_type or "image/png"

                if not raw_bytes or len(raw_bytes) < 50:
                    raise ProviderUnavailableError("Empty image binary returned from FLUX endpoint")

                ext = "png" if "png" in mime_type else "jpg"
                file_hash = hashlib.md5(raw_bytes[:256]).hexdigest()[:10]

                return MediaPayload(
                    data=raw_bytes,
                    mime_type=mime_type,
                    filename=f"flux_{file_hash}.{ext}",
                    metadata={
                        "width": width,
                        "height": height,
                        "aspect_ratio": aspect_ratio,
                        "resolved_provider": "flux",
                        "prompt": prompt,
                    },
                )

        except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError) as exc:
            logger.warning("Local FLUX endpoint unreachable or error: %s", exc)
            raise ProviderUnavailableError(f"FLUX endpoint failed: {exc}") from exc
        except ProviderUnavailableError:
            raise
        except Exception as exc:
            logger.warning("Unexpected error communicating with FLUX endpoint: %s", exc)
            raise ProviderUnavailableError(f"FLUX endpoint error: {exc}") from exc

    async def health_check(self) -> Dict[str, Any]:
        if not self.endpoint:
            return {
                "status": "disabled",
                "provider": "FluxSchnellProvider",
                "configured": False,
                "message": "FLUX_ENDPOINT not set",
            }
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.endpoint.rstrip('/')}/health")
                status = "healthy" if resp.status_code == 200 else "degraded"
        except Exception:
            status = "unreachable"

        return {
            "status": status,
            "provider": "FluxSchnellProvider",
            "endpoint": self.endpoint,
            "configured": True,
        }
