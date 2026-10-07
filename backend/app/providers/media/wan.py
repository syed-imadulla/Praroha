import base64
import hashlib
import logging
import os
from typing import Any, Dict, Optional

import httpx

from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
    VideoProvider,
)

logger = logging.getLogger(__name__)


class WanVideoProvider(VideoProvider):
    """Concrete Wan2.1 T2V-1.3B Local/Microservice Video Provider.

    Connects to local Wan2.1 inference microservice via WAN_ENDPOINT.
    Features configurable timeout (default 60.0s), outage simulation for testability, and strictly
    normalized MediaPayload outputs (D-06) that isolate vendor response shapes from the rest of the app.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        self.endpoint = endpoint if endpoint is not None else os.getenv("WAN_ENDPOINT", "")
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("WAN_TIMEOUT_SEC", "60.0"))
        )

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = context or {}

        # Outage simulation for testing
        if ctx.get("simulate_wan_unavailable") or os.getenv("WAN_FORCE_UNAVAILABLE", "0") in ("1", "true", "True"):
            logger.info("WanVideoProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated Wan2.1 outage")

        # Check configuration
        if not self.endpoint:
            logger.info("WanVideoProvider unconfigured (no WAN_ENDPOINT). Cascading to Tier 3 Mock.")
            raise ProviderUnavailableError("Wan2.1 endpoint not configured")

        aspect_ratio = ctx.get("aspect_ratio") or "16:9"
        headers = {"Content-Type": "application/json"}
        payload = {
            "prompt": prompt,
            "duration": duration_sec,
            "aspect_ratio": aspect_ratio,
            "resolution": "720p",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                response = await client.post(self.endpoint, json=payload, headers=headers)
                if response.status_code != 200:
                    raise ProviderUnavailableError(
                        f"Wan2.1 API returned HTTP {response.status_code}: {response.text[:200]}"
                    )
                # Provider normalization: normalize binary or json response strictly to MediaPayload
                content_type = response.headers.get("content-type", "")
                if "video" in content_type or "octet-stream" in content_type:
                    video_bytes = response.content
                else:
                    data = response.json()
                    if isinstance(data, dict) and "video_base64" in data:
                        video_bytes = base64.b64decode(data["video_base64"])
                    elif isinstance(data, dict) and "data" in data:
                        video_bytes = base64.b64decode(data["data"])
                    else:
                        video_bytes = response.content

        except (httpx.TimeoutException, httpx.RequestError) as net_err:
            logger.warning("Wan2.1 network error: %s (%s). Cascading to Tier 3 Mock.", type(net_err).__name__, net_err)
            raise ProviderUnavailableError(f"Wan2.1 network error: {net_err}") from net_err

        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode("utf-8")).hexdigest()[:10]
        return MediaPayload(
            data=video_bytes,
            mime_type="video/mp4",
            filename=f"wan_{file_hash}.mp4",
            metadata={
                "resolved_provider": "wan2.1",
                "duration_sec": duration_sec,
                "aspect_ratio": aspect_ratio,
                "resolution": "720p",
                "prompt": prompt,
            },
        )

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "configured" if bool(self.endpoint) else "unconfigured",
            "provider": "WanVideoProvider",
            "endpoint": self.endpoint,
            "timeout_sec": self.timeout_sec,
        }
