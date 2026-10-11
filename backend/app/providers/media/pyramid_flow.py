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


class PyramidFlowProvider(VideoProvider):
    """Concrete Pyramid Flow Video Provider.

    Connects to Pyramid Flow via PYRAMID_FLOW_ENDPOINT or HuggingFace Inference API with HF_TOKEN.
    Features configurable timeout (default 60.0s), outage simulation for testability, and strictly
    normalized MediaPayload outputs (D-06) that isolate vendor response shapes from the rest of the app.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        hf_token: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        self.endpoint = endpoint if endpoint is not None else os.getenv("PYRAMID_FLOW_ENDPOINT", "")
        self.hf_token = hf_token if hf_token is not None else os.getenv("HF_TOKEN", "")
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("PYRAMID_FLOW_TIMEOUT_SEC", "60.0"))
        )

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = context or {}

        # Outage simulation for testing
        if ctx.get("simulate_pyramid_unavailable") or os.getenv("PYRAMID_FORCE_UNAVAILABLE", "0") in ("1", "true", "True"):
            logger.info("PyramidFlowProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated Pyramid Flow outage")

        # Check configuration
        if not self.endpoint and not self.hf_token:
            logger.info("PyramidFlowProvider unconfigured (no endpoint or HF_TOKEN). Cascading to Wan2.1.")
            raise ProviderUnavailableError("Pyramid Flow endpoint or HF_TOKEN not configured")

        aspect_ratio = ctx.get("aspect_ratio") or "16:9"
        headers: Dict[str, str] = {"Content-Type": "application/json"}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"

        payload = {
            "inputs": prompt,
            "parameters": {
                "duration_sec": duration_sec,
                "aspect_ratio": aspect_ratio,
                "resolution": "720p",
            },
        }

        if self.endpoint:
            url = self.endpoint
            try:
                async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    if response.status_code == 401:
                        raise ProviderUnavailableError(
                            "Hugging Face API returned 401 Unauthorized: Valid HF_TOKEN required for video inference"
                        )
                    if response.status_code == 402:
                        raise ProviderUnavailableError(
                            "Hugging Face Inference Providers requires prepaid credits (HTTP 402): Account has no remaining inference credits"
                        )
                    if response.status_code == 403:
                        raise ProviderUnavailableError(
                            "Hugging Face API returned 403 Forbidden: Account lacks access permissions for video inference"
                        )
                    if response.status_code == 429:
                        raise ProviderUnavailableError(
                            "Hugging Face API returned 429 Rate Limit Exceeded: Serverless quota reached"
                        )
                    if response.status_code != 200:
                        raise ProviderUnavailableError(
                            f"Pyramid Flow API returned HTTP {response.status_code}: {response.text[:200]}"
                        )
                    # Provider normalization: normalize binary or json response strictly to MediaPayload
                    content_type = response.headers.get("content-type", "")
                    if "video" in content_type or "octet-stream" in content_type:
                        video_bytes = response.content
                    else:
                        data = response.json()
                        if isinstance(data, dict) and "video_base64" in data:
                            video_bytes = base64.b64decode(data["video_base64"])
                        elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict) and "blob" in data[0]:
                            video_bytes = base64.b64decode(data[0]["blob"])
                        else:
                            video_bytes = response.content

            except (httpx.TimeoutException, httpx.RequestError) as net_err:
                logger.warning("Pyramid Flow network error: %s (%s). Cascading to Tier 2.", type(net_err).__name__, net_err)
                raise ProviderUnavailableError(f"Pyramid Flow network error: {net_err}") from net_err
        else:
            # Modern official Hugging Face Inference Providers route
            try:
                from huggingface_hub import AsyncInferenceClient
                from huggingface_hub.errors import HfHubHTTPError
                client = AsyncInferenceClient(token=self.hf_token, timeout=self.timeout_sec)
                video_bytes = await client.text_to_video(
                    prompt=prompt,
                    model="Wan-AI/Wan2.1-T2V-1.3B",
                    num_frames=16,
                )
            except HfHubHTTPError as hf_err:
                status = (
                    hf_err.response.status_code
                    if hasattr(hf_err, "response") and hf_err.response is not None
                    else None
                )
                if status == 401:
                    raise ProviderUnavailableError(
                        "Hugging Face API returned 401 Unauthorized: Valid HF_TOKEN required for video inference"
                    )
                elif status == 402:
                    raise ProviderUnavailableError(
                        "Hugging Face account has insufficient inference credits (HTTP 402): Purchase pre-paid credits to continue using Inference Providers."
                    )
                elif status == 403:
                    raise ProviderUnavailableError(
                        "Hugging Face API returned 403 Forbidden: Account lacks permissions for video inference"
                    )
                elif status == 429:
                    raise ProviderUnavailableError("Hugging Face API returned 429 Rate Limit Exceeded")
                else:
                    raise ProviderUnavailableError(
                        f"Hugging Face Inference Provider error (HTTP {status}): {hf_err}"
                    ) from hf_err
            except (ProviderUnavailableError, Exception) as gen_err:
                if isinstance(gen_err, ProviderUnavailableError):
                    raise
                logger.warning("Hugging Face video generation error: %s (%s). Cascading to Tier 2.", type(gen_err).__name__, gen_err)
                raise ProviderUnavailableError(f"Hugging Face video inference failed: {gen_err}") from gen_err

        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode("utf-8")).hexdigest()[:10]
        return MediaPayload(
            data=video_bytes,
            mime_type="video/mp4",
            filename=f"pyramid_{file_hash}.mp4",
            metadata={
                "resolved_provider": "pyramid-flow",
                "provider_label": "Pyramid Flow",
                "is_synthetic": False,
                "duration_sec": duration_sec,
                "aspect_ratio": aspect_ratio,
                "resolution": "720p",
                "prompt": prompt,
            },
        )

    async def health_check(self) -> Dict[str, Any]:
        configured = bool(self.endpoint or self.hf_token)
        return {
            "status": "configured" if configured else "unconfigured",
            "provider": "PyramidFlowProvider",
            "endpoint": self.endpoint or "hf-inference",
            "timeout_sec": self.timeout_sec,
        }
