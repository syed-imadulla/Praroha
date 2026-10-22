import asyncio
import hashlib
import logging
import os
from typing import Any, Dict, Optional, Set

import httpx

from backend.app.providers.media.ace_step import detect_audio_mime_type
from backend.app.providers.media.base import (
    AudioProvider,
    AuthenticationError,
    MediaPayload,
    PaymentRequiredError,
    ProviderUnavailableError,
    QuotaExceededError,
)

logger = logging.getLogger(__name__)


class PixazoTracksAudioProvider(AudioProvider):
    """Pixazo Tracks Music & Ambient Background Score Provider.

    Connects to Pixazo's music synthesis gateway (/tracks/generate-music) via PIXAZO_API_KEY.
    Produces musical compositions and background scores.
    IMPORTANT CONSTRAINT: This provider generates ambient musical compositions/scores.
    It does NOT provide verified environmental sound effects (foley/nature sounds).

    Safeguards:
    - Header: Ocp-Apim-Subscription-Key.
    - Duration bounds: Clamped between 5s and 15s (default 10s) to conserve free allowance.
    - In-flight deduplication: Prevents double-submission by prompt+duration hash.
    - Explicit quota error reporting on HTTP 402/429 without automatic fallback to paid providers.
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
            "PIXAZO_TRACKS_MODEL_PATH", "tracks/v1/generate"
        )
        self.timeout_sec = (
            timeout_sec
            if timeout_sec is not None
            else float(os.getenv("PIXAZO_TRACKS_TIMEOUT_SEC", "60.0"))
        )

    async def generate_audio(
        self,
        prompt: str,
        mood: str = "ambient",
        duration_sec: int = 15,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        ctx = context or {}

        # Outage simulation for testing
        if (
            ctx.get("simulate_pixazo_tracks_unavailable")
            or ctx.get("simulate_acestep_unavailable")
            or os.getenv("PIXAZO_TRACKS_FORCE_UNAVAILABLE", "0") in ("1", "true", "True")
        ):
            logger.info("PixazoTracksAudioProvider simulated outage triggered.")
            raise ProviderUnavailableError("Simulated Pixazo Tracks outage")

        if not self.api_key:
            logger.info("PixazoTracksAudioProvider unconfigured (no PIXAZO_API_KEY). Cascading.")
            raise ProviderUnavailableError("Pixazo API Key not configured")

        # Duration safety bounds: strictly 5s to 15s
        clamped_duration = min(max(duration_sec, 5), 15)

        # Duplicate submission guard
        request_hash = hashlib.md5(f"{prompt}_{clamped_duration}_{mood}".encode("utf-8")).hexdigest()
        if request_hash in self._inflight_hashes:
            logger.warning("Duplicate Pixazo tracks generation in-flight for hash %s. Rejecting redundant call.", request_hash)
            raise ProviderUnavailableError("Duplicate music generation request already in progress")

        self._inflight_hashes.add(request_hash)

        try:
            return await self._execute_generation_flow(
                prompt=prompt,
                mood=mood,
                duration_sec=clamped_duration,
            )
        finally:
            self._inflight_hashes.discard(request_hash)

    async def _execute_generation_flow(
        self,
        prompt: str,
        mood: str,
        duration_sec: int,
    ) -> MediaPayload:
        headers = {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": self.api_key,
        }

        submit_url = f"{self.gateway_url}/{self.model_path.lstrip('/')}"
        payload = {
            "prompt": prompt,
            "duration": duration_sec,
            "mood": mood,
            "bpm": 120,
        }

        async with httpx.AsyncClient(timeout=self.timeout_sec) as client:
            try:
                submit_res = await client.post(submit_url, json=payload, headers=headers)
            except (httpx.TimeoutException, httpx.RequestError) as req_err:
                logger.warning("Pixazo Tracks submission network error: %s", req_err)
                raise ProviderUnavailableError(f"Pixazo Tracks network connection failed: {req_err}") from req_err

            if submit_res.status_code == 401:
                raise AuthenticationError("Pixazo API Key is invalid or unauthorized (HTTP 401)")
            if submit_res.status_code == 402:
                raise PaymentRequiredError(
                    "Pixazo account has insufficient credits or no free tier allowance (HTTP 402): "
                    "Cannot generate music without active credits."
                )
            if submit_res.status_code == 403:
                raise AuthenticationError("Pixazo API access forbidden (HTTP 403)")
            if submit_res.status_code == 429:
                raise QuotaExceededError("Pixazo rate limit exceeded (HTTP 429)")
            if submit_res.status_code not in (200, 201, 202):
                raise ProviderUnavailableError(
                    f"Pixazo Tracks submission failed with HTTP {submit_res.status_code}: {submit_res.text[:200]}"
                )

            # Check for direct synchronous audio bytes
            ct = submit_res.headers.get("content-type", "")
            if "audio" in ct or "octet-stream" in ct or submit_res.content.startswith(b"ID3") or submit_res.content.startswith(b"RIFF"):
                audio_bytes = submit_res.content
            else:
                try:
                    submit_data = submit_res.json()
                except Exception as json_err:
                    raise ProviderUnavailableError(f"Pixazo Tracks returned invalid response JSON: {json_err}") from json_err

                request_id = (
                    submit_data.get("request_id")
                    or submit_data.get("id")
                    or submit_data.get("task_id")
                )

                if not request_id:
                    media_url = submit_data.get("media_url") or submit_data.get("audio_url")
                    if media_url:
                        audio_bytes = await self._download_asset(client, media_url, headers)
                    else:
                        raise ProviderUnavailableError(f"Pixazo Tracks response missing request_id or media_url: {submit_data}")
                else:
                    audio_bytes = await self._poll_and_download(client, request_id, headers)

        mime_type, ext = detect_audio_mime_type(ct, audio_bytes)
        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode("utf-8")).hexdigest()[:10]

        return MediaPayload(
            data=audio_bytes,
            mime_type=mime_type,
            filename=f"pixazo_tracks_{file_hash}{ext}",
            metadata={
                "resolved_provider": "pixazo-tracks",
                "provider_label": "Pixazo Tracks (Music)",
                "is_synthetic": False,
                "duration_sec": duration_sec,
                "mood": mood,
                "acoustic_nature": "ambient_music",
                "note": "Ambient background music composition; not environmental sound effects",
            },
        )

    async def _poll_and_download(
        self,
        client: httpx.AsyncClient,
        request_id: str,
        headers: Dict[str, str],
    ) -> bytes:
        status_url = f"{self.gateway_url}/v2/requests/status/{request_id}"
        elapsed = 0.0
        interval = 2.5
        max_time = self.timeout_sec

        while elapsed < max_time:
            await asyncio.sleep(interval)
            elapsed += interval

            try:
                status_res = await client.get(status_url, headers=headers)
            except Exception as poll_err:
                logger.warning("Error during Pixazo Tracks status polling: %s", poll_err)
                continue

            if status_res.status_code == 402:
                raise PaymentRequiredError("Pixazo account quota exhausted during music rendering (HTTP 402)")
            if status_res.status_code != 200:
                logger.warning("Pixazo Tracks polling returned HTTP %d: %s", status_res.status_code, status_res.text[:100])
                continue

            data = status_res.json()
            status_str = (data.get("status") or "").upper()

            if status_str in ("COMPLETED", "SUCCESS", "DONE"):
                media_url = (
                    data.get("media_url")
                    or data.get("audio_url")
                    or data.get("output_url")
                    or data.get("url")
                )
                if not media_url and isinstance(data.get("output"), dict):
                    media_url = data["output"].get("media_url") or data["output"].get("audio_url")

                if not media_url:
                    raise ProviderUnavailableError(f"Pixazo Tracks job completed but returned no download URL: {data}")

                return await self._download_asset(client, media_url, headers)

            if status_str in ("FAILED", "ERROR"):
                error_msg = data.get("error") or data.get("message") or "Unknown music generation failure"
                raise ProviderUnavailableError(f"Pixazo music generation failed: {error_msg}")

        raise ProviderUnavailableError(f"Pixazo music generation timed out after {int(elapsed)} seconds")

    async def _download_asset(
        self,
        client: httpx.AsyncClient,
        url: str,
        headers: Dict[str, str],
    ) -> bytes:
        try:
            dl_res = await client.get(url, timeout=30.0)
            if dl_res.status_code != 200:
                raise ProviderUnavailableError(f"Failed to download Pixazo Tracks asset: HTTP {dl_res.status_code}")
            return dl_res.content
        except Exception as dl_err:
            raise ProviderUnavailableError(f"Failed to retrieve Pixazo Tracks audio bytes: {dl_err}") from dl_err
