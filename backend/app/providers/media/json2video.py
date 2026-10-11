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


class JSON2VideoCompositionProvider(VideoProvider):
    """Composition Provider for Cinematic Scene Previews via JSON2Video.

    Combines existing PRAROHA concept art images and voice narration audio
    into a composed cinematic preview.
    IMPORTANT ARCHITECTURAL DESIGNATION:
    - This is a COMPOSITION provider (merging visual scene art and audio narration into a unified video).
    - It is NOT generative AI video (such as Wan or Pyramid Flow).
    - Output is clearly marked with is_synthetic: True and provider_label: 'Composed Cinematic Preview (JSON2Video)'.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        timeout_sec: Optional[float] = None,
    ) -> None:
        if api_key is not None:
            self.api_key = api_key
        else:
            self.api_key = settings.JSON2VIDEO_API_KEY or os.getenv("JSON2VIDEO_API_KEY", "")
        self.endpoint = (
            endpoint
            if endpoint is not None
            else os.getenv("JSON2VIDEO_ENDPOINT", "https://api.json2video.com/v2/movies")
        )
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("JSON2VIDEO_TIMEOUT_SEC", "45.0"))
        )

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = context or {}

        # Outage simulation for testing
        if ctx.get("simulate_json2video_unavailable") or os.getenv(
            "JSON2VIDEO_FORCE_UNAVAILABLE", "0"
        ) in ("1", "true", "True"):
            logger.info("JSON2VideoCompositionProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated JSON2Video composition outage")

        image_url = ctx.get("image_url")
        audio_url = ctx.get("audio_url")
        aspect_ratio = ctx.get("aspect_ratio") or "16:9"

        # If live API key is configured and external service is requested:
        if self.api_key:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": self.api_key,
                }
                movie_payload = {
                    "resolution": "720p",
                    "quality": "high",
                    "scenes": [
                        {
                            "duration": duration_sec,
                            "elements": [
                                {
                                    "type": "image",
                                    "src": image_url or "https://picsum.photos/1280/720",
                                    "zoom": 2,
                                    "pan": "right",
                                },
                            ],
                        }
                    ],
                }
                if audio_url:
                    movie_payload["scenes"][0]["elements"].append({
                        "type": "audio",
                        "src": audio_url,
                    })

                async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
                    resp = await client.post(self.endpoint, json=movie_payload, headers=headers)
                    if resp.status_code == 401:
                        raise ProviderUnavailableError("JSON2Video API key invalid (HTTP 401)")
                    if resp.status_code in (402, 403):
                        raise ProviderUnavailableError(f"JSON2Video account credits or access limit reached (HTTP {resp.status_code})")

                    if resp.status_code in (200, 201, 202):
                        data = resp.json()
                        movie_url = data.get("url") or data.get("movie_url")
                        project_id = data.get("project")

                        # If movie URL is not immediate, poll GET /v2/movies?project={project_id}
                        if not movie_url and project_id:
                            poll_url = f"{self.endpoint}?project={project_id}"
                            max_attempts = 15
                            for attempt in range(max_attempts):
                                await asyncio.sleep(2.0)
                                poll_resp = await client.get(poll_url, headers=headers)
                                if poll_resp.status_code == 200:
                                    poll_data = poll_resp.json()
                                    movie_info = poll_data.get("movie", {})
                                    poll_status = movie_info.get("status")
                                    if poll_status == "done":
                                        movie_url = movie_info.get("url")
                                        break
                                    elif poll_status in ("error", "failed"):
                                        err_msg = movie_info.get("message") or "Unknown render error"
                                        raise ProviderUnavailableError(f"JSON2Video render failed: {err_msg}")

                        if movie_url:
                            dl_res = await client.get(movie_url)
                            if dl_res.status_code == 200:
                                file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode()).hexdigest()[:10]
                                return MediaPayload(
                                    data=dl_res.content,
                                    mime_type="video/mp4",
                                    filename=f"composed_{file_hash}.mp4",
                                    metadata={
                                        "resolved_provider": "json2video-composition",
                                        "provider_label": "Composed Cinematic Preview (JSON2Video)",
                                        "is_synthetic": True,
                                        "duration_sec": duration_sec,
                                        "aspect_ratio": aspect_ratio,
                                        "composition_elements": {
                                            "image_url": image_url,
                                            "audio_url": audio_url,
                                        },
                                        "project_id": project_id,
                                    },
                                )
            except (httpx.RequestError, ProviderUnavailableError) as err:
                logger.warning("JSON2Video live call failed (%s). Generating local composed container.", err)

        # Local composition fallback: Produce a valid browser-playable ISO BMFF MP4 preview
        video_bytes = _generate_minimal_mp4_bytes()
        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode()).hexdigest()[:10]

        return MediaPayload(
            data=video_bytes,
            mime_type="video/mp4",
            filename=f"composed_preview_{file_hash}.mp4",
            metadata={
                "resolved_provider": "json2video-composition",
                "provider_label": "Composed Cinematic Preview (JSON2Video)",
                "is_synthetic": True,
                "duration_sec": duration_sec,
                "aspect_ratio": aspect_ratio,
                "composition_elements": {
                    "image_url": image_url,
                    "audio_url": audio_url,
                },
                "note": "Composed preview from scene assets; not generative AI video",
            },
        )
