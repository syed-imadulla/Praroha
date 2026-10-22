import asyncio
import hashlib
import logging
import os
from typing import Any, Dict, Optional, Set

import httpx

from backend.app.providers.media.base import (
    AuthenticationError,
    MediaPayload,
    PaymentRequiredError,
    ProviderUnavailableError,
    QuotaExceededError,
    VideoProvider,
)

logger = logging.getLogger(__name__)


class PixazoVideoProvider(VideoProvider):
    """Pixazo Generative Video Provider.

    Connects to Pixazo's unified AI Gateway (e.g. Wan 3.0 or LTX 2.5) via PIXAZO_API_KEY.
    Uses asynchronous job submission, bounded polling via /v2/requests/status/{request_id},
    and strict ISO BMFF MP4 binary validation.

    Safeguards:
    - Header: Ocp-Apim-Subscription-Key (Azure APIM gateway convention).
    - Duration bounds: Clamped between 3s and 10s (default 5s) to preserve quotas.
    - Duplicate submission protection: In-flight deduplication by prompt+duration hash.
    - Explicit quota error reporting on HTTP 402/429 without silent fallback to paid tiers.
    """

    _inflight_hashes: Set[str] = set()

    def __init__(
        self,
        api_key: Optional[str] = None,
        gateway_url: Optional[str] = None,
        model_path: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        from backend.app.config import settings

        self.api_key = (
            api_key
            if api_key is not None
            else (settings.PIXAZO_API_KEY or os.getenv("PIXAZO_API_KEY", ""))
        )
        self.gateway_url = (
            (gateway_url or settings.PIXAZO_GATEWAY_URL or os.getenv("PIXAZO_GATEWAY_URL", "https://gateway.pixazo.ai"))
            .rstrip("/")
        )
        self.model_path = model_path or os.getenv(
            "PIXAZO_VIDEO_MODEL_PATH", "wan-3-0-video/v1/text-to-video"
        )
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("PIXAZO_VIDEO_TIMEOUT_SEC", "90.0"))
        )

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = context or {}

        # Outage simulation for testing
        if (
            ctx.get("simulate_pixazo_unavailable")
            or ctx.get("simulate_pyramid_unavailable")
            or os.getenv("PIXAZO_FORCE_UNAVAILABLE", "0") in ("1", "true", "True")
        ):
            logger.info("PixazoVideoProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated Pixazo Video outage")

        if not self.api_key:
            logger.info("PixazoVideoProvider unconfigured (no PIXAZO_API_KEY). Cascading.")
            raise ProviderUnavailableError("Pixazo API Key not configured")

        # Duration safety bounds: strictly 3s to 10s
        clamped_duration = min(max(duration_sec, 3), 10)
        aspect_ratio = ctx.get("aspect_ratio") or "16:9"

        # Duplicate submission guard
        request_hash = hashlib.md5(f"{prompt}_{clamped_duration}_{aspect_ratio}".encode("utf-8")).hexdigest()
        if request_hash in self._inflight_hashes:
            logger.warning("Duplicate Pixazo video generation in-flight for hash %s. Rejecting redundant call.", request_hash)
            raise ProviderUnavailableError("Duplicate video generation request already in progress")

        self._inflight_hashes.add(request_hash)

        try:
            return await self._execute_generation_flow(
                prompt=prompt,
                duration_sec=clamped_duration,
                aspect_ratio=aspect_ratio,
            )
        finally:
            self._inflight_hashes.discard(request_hash)

    async def _execute_generation_flow(
        self,
        prompt: str,
        duration_sec: int,
        aspect_ratio: str,
    ) -> MediaPayload:
        headers = {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": self.api_key,
        }

        submit_url = f"{self.gateway_url}/{self.model_path.lstrip('/')}"
        payload = {
            "prompt": prompt,
            "duration": duration_sec,
            "aspect_ratio": aspect_ratio,
        }

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                submit_res = await client.post(submit_url, json=payload, headers=headers)
            except (httpx.TimeoutException, httpx.RequestError) as req_err:
                logger.warning("Pixazo submission network error: %s", req_err)
                raise ProviderUnavailableError(f"Pixazo network connection failed: {req_err}") from req_err

            if submit_res.status_code == 401:
                raise AuthenticationError("Pixazo API Key is invalid or unauthorized (HTTP 401)")
            if submit_res.status_code == 402:
                raise PaymentRequiredError(
                    "Pixazo account has insufficient credits or no free tier allowance (HTTP 402): "
                    "Cannot generate video without active credits."
                )
            if submit_res.status_code == 403:
                raise AuthenticationError("Pixazo API access forbidden (HTTP 403)")
            if submit_res.status_code == 429:
                raise QuotaExceededError("Pixazo rate limit exceeded (HTTP 429)")
            if submit_res.status_code not in (200, 201, 202):
                raise ProviderUnavailableError(
                    f"Pixazo submission failed with HTTP {submit_res.status_code}: {submit_res.text[:200]}"
                )

            # Check if synchronous video bytes were returned directly
            ct = submit_res.headers.get("content-type", "")
            if "video" in ct or "octet-stream" in ct or submit_res.content.startswith(b"\x00\x00\x00"):
                video_bytes = submit_res.content
            else:
                try:
                    submit_data = submit_res.json()
                except Exception as json_err:
                    raise ProviderUnavailableError(f"Pixazo returned invalid response JSON: {json_err}") from json_err

                # Asynchronous flow: Extract job/request ID
                request_id = (
                    submit_data.get("request_id")
                    or submit_data.get("id")
                    or submit_data.get("task_id")
                )

                if not request_id:
                    # Check if direct media url was returned in initial json
                    media_url = submit_data.get("media_url") or submit_data.get("video_url")
                    if media_url:
                        video_bytes = await self._download_asset(client, media_url, headers)
                    else:
                        raise ProviderUnavailableError(f"Pixazo response missing request_id or media_url: {submit_data}")
                else:
                    video_bytes = await self._poll_and_download(client, request_id, headers)

        # Validate genuine MP4 binary container
        if not (b"ftyp" in video_bytes or video_bytes.startswith(b"\x00\x00\x00")):
            raise ProviderUnavailableError("Pixazo payload did not contain a valid MP4 ISO BMFF container")

        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode("utf-8")).hexdigest()[:10]
        return MediaPayload(
            data=video_bytes,
            mime_type="video/mp4",
            filename=f"pixazo_video_{file_hash}.mp4",
            metadata={
                "resolved_provider": "pixazo-video",
                "provider_label": "Pixazo Video",
                "is_synthetic": False,
                "duration_sec": duration_sec,
                "aspect_ratio": aspect_ratio,
                "resolution": "720p",
            },
        )

    async def _poll_and_download(
        self,
        client: httpx.AsyncClient,
        request_id: str,
        headers: Dict[str, str],
    ) -> bytes:
        """Poll status endpoint until COMPLETED or timeout."""
        status_url = f"{self.gateway_url}/v2/requests/status/{request_id}"
        elapsed = 0.0
        interval = 3.0
        max_time = self.timeout_sec

        while elapsed < max_time:
            await asyncio.sleep(interval)
            elapsed += interval

            try:
                status_res = await client.get(status_url, headers=headers)
            except Exception as poll_err:
                logger.warning("Error during Pixazo status polling: %s", poll_err)
                continue

            if status_res.status_code == 402:
                raise PaymentRequiredError("Pixazo account quota exhausted during video rendering (HTTP 402)")
            if status_res.status_code != 200:
                logger.warning("Pixazo polling returned HTTP %d: %s", status_res.status_code, status_res.text[:100])
                continue

            data = status_res.json()
            status_str = (data.get("status") or "").upper()

            if status_str in ("COMPLETED", "SUCCESS", "DONE"):
                media_url = (
                    data.get("media_url")
                    or data.get("video_url")
                    or data.get("output_url")
                    or data.get("url")
                )
                if not media_url and isinstance(data.get("output"), dict):
                    media_url = data["output"].get("media_url") or data["output"].get("video_url")

                if not media_url:
                    raise ProviderUnavailableError(f"Pixazo job completed but returned no download URL: {data}")

                return await self._download_asset(client, media_url, headers)

            if status_str in ("FAILED", "ERROR"):
                error_msg = data.get("error") or data.get("message") or "Unknown generation failure"
                raise ProviderUnavailableError(f"Pixazo video generation failed: {error_msg}")

        raise ProviderUnavailableError(f"Pixazo video generation timed out after {int(elapsed)} seconds")

    async def _download_asset(
        self,
        client: httpx.AsyncClient,
        url: str,
        headers: Dict[str, str],
    ) -> bytes:
        """Download binary content from remote media URL."""
        try:
            dl_res = await client.get(url, timeout=30.0)
            if dl_res.status_code != 200:
                raise ProviderUnavailableError(f"Failed to download Pixazo video asset: HTTP {dl_res.status_code}")
            return dl_res.content
        except Exception as dl_err:
            raise ProviderUnavailableError(f"Failed to retrieve Pixazo video bytes: {dl_err}") from dl_err
