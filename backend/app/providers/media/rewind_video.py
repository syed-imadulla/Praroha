import asyncio
import hashlib
import logging
import os
from typing import Any, Dict, Optional

import httpx

from backend.app.config import settings
from backend.app.providers.media.base import (
    MediaPayload,
    ProviderUnavailableError,
    VideoProvider,
)
from backend.app.providers.media.mock import _generate_minimal_mp4_bytes

logger = logging.getLogger(__name__)


class RewindVideoProvider(VideoProvider):
    """Rewind.ai asynchronous video provider for cinematic generative video.

    Targets the Rewind.ai video generation API:
    POST https://api.rewind.ai/v1/videos/generate-async
    Supported model: bytedance/seedance-1-5-pro (duration 4s to 12s).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        if api_key is not None:
            self.api_key = api_key
        else:
            self.api_key = settings.REWIND_API_KEY or os.getenv("REWIND_API_KEY", "")

        self.base_url = (
            base_url
            if base_url is not None
            else getattr(settings, "REWIND_BASE_URL", "https://api.rewind.ai")
        ).rstrip("/")

        self.model = (
            model
            if model is not None
            else getattr(settings, "REWIND_VIDEO_MODEL", "bytedance/seedance-1-5-pro")
        )

        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("REWIND_VIDEO_TIMEOUT_SEC", "60.0"))
        )

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = context or {}

        # Outage simulation for testing
        if ctx.get("simulate_rewind_unavailable") or os.getenv(
            "REWIND_FORCE_UNAVAILABLE", "0"
        ) in ("1", "true", "True"):
            logger.info("RewindVideoProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated Rewind.ai video provider outage")

        # Duration clamping: seedance-1-5-pro strictly requires 4s to 12s
        clamped_duration = max(4, min(int(duration_sec), 12))
        duration_str = f"{clamped_duration}s"
        aspect_ratio = ctx.get("aspect_ratio") or "16:9"

        if not self.api_key:
            logger.warning("RewindVideoProvider missing REWIND_API_KEY; returning fallback container.")
            return self._build_fallback(prompt, clamped_duration, ctx, note="Missing REWIND_API_KEY")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "prompt": prompt,
            "duration": duration_str,
            "aspectRatio": aspect_ratio,
        }

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                submit_url = f"{self.base_url}/v1/videos/generate-async"
                res = await client.post(submit_url, json=payload, headers=headers)

                if res.status_code == 401:
                    raise ProviderUnavailableError("Rewind.ai API key is invalid or unauthorized (HTTP 401)")
                if res.status_code == 403:
                    raise ProviderUnavailableError("Rewind.ai model access restricted on current account plan (HTTP 403)")
                if res.status_code == 429:
                    err_json = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_json.get("error", {}).get("message", "Token limit or quota exceeded")
                    raise ProviderUnavailableError(f"Rewind.ai insufficient token balance: {err_msg} (HTTP 429)")
                if res.status_code not in (200, 201, 202):
                    raise ProviderUnavailableError(f"Rewind.ai video generation failed with status {res.status_code}: {res.text[:150]}")

                submit_data = res.json()
                job_id = submit_data.get("jobId") or submit_data.get("id")
                if not job_id:
                    raise ProviderUnavailableError(f"Rewind.ai response did not contain a valid jobId: {submit_data}")

                # Bounded job polling
                poll_url = f"{self.base_url}/v1/jobs/{job_id}"
                max_attempts = int(os.getenv("REWIND_MAX_POLL_ATTEMPTS", "20"))
                poll_interval = float(os.getenv("REWIND_POLL_INTERVAL_SEC", "2.5"))
                video_url = None

                for _ in range(max_attempts):
                    await asyncio.sleep(poll_interval)
                    poll_res = await client.get(poll_url, headers=headers)
                    if poll_res.status_code == 200:
                        poll_data = poll_res.json()
                        job_status = (poll_data.get("status") or "").lower()
                        if job_status in ("completed", "done", "succeeded"):
                            result_field = poll_data.get("result")
                            if isinstance(result_field, dict):
                                video_url = result_field.get("url") or result_field.get("video_url")
                            elif isinstance(result_field, str):
                                video_url = result_field
                            video_url = video_url or poll_data.get("url")
                            break
                        elif job_status in ("failed", "error"):
                            err_info = poll_data.get("error") or "Video generation job reported failure"
                            raise ProviderUnavailableError(f"Rewind video job {job_id} failed: {err_info}")

                if not video_url:
                    raise ProviderUnavailableError(f"Rewind video job {job_id} timed out before completing.")

                # Download video asset
                dl_res = await client.get(video_url, headers=headers)
                if dl_res.status_code != 200:
                    raise ProviderUnavailableError(f"Failed to download generated Rewind video asset from {video_url} (HTTP {dl_res.status_code})")

                video_bytes = dl_res.content
                if len(video_bytes) < 8 or video_bytes[4:8] != b"ftyp":
                    logger.warning("Rewind returned non-MP4 payload, falling back to minimal container.")
                    return self._build_fallback(prompt, clamped_duration, ctx, note="Rewind non-MP4 payload")

                file_hash = hashlib.md5(f"{prompt}_{clamped_duration}".encode()).hexdigest()[:10]
                return MediaPayload(
                    data=video_bytes,
                    mime_type="video/mp4",
                    filename=f"rewind_{file_hash}.mp4",
                    metadata={
                        "resolved_provider": "rewind-video",
                        "provider_label": "Rewind.ai Seedance Video",
                        "model": self.model,
                        "duration_sec": clamped_duration,
                        "aspect_ratio": aspect_ratio,
                        "job_id": job_id,
                        "is_synthetic": False,
                    },
                )
            except httpx.RequestError as exc:
                logger.warning("RewindVideoProvider network error (%s), returning fallback container.", exc)
                return self._build_fallback(prompt, clamped_duration, ctx, note=f"Network error: {exc}")

    def _build_fallback(
        self,
        prompt: str,
        duration_sec: int,
        context: Dict[str, Any],
        note: str = "",
    ) -> MediaPayload:
        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode()).hexdigest()[:10]
        return MediaPayload(
            data=_generate_minimal_mp4_bytes(),
            mime_type="video/mp4",
            filename=f"rewind_fallback_{file_hash}.mp4",
            metadata={
                "resolved_provider": "rewind-video",
                "provider_label": "Rewind.ai Seedance Video (Fallback)",
                "model": self.model,
                "duration_sec": duration_sec,
                "is_synthetic": True,
                "fallback_note": note,
            },
        )
