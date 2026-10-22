"""
PRAROHA Cinematic Preview Proof of Concept (Phase 46).

Tatva 2: Seed to Universe — Forms Hidden in Formless.

Programmatic composition engine that assembles existing worldbuilding assets
(Concept Art, Edge-TTS Voice Narration, Procedural Ambient Soundscapes, and Scene Text)
into a deterministic, aesthetic 10-15s cinematic motion preview.

ARCHITECTURAL ISOLATION RULE:
This engine must NEVER be executed synchronously within the primary FastAPI web process.
Rendering must always occur in an isolated worker process or dedicated container
to prevent Chromium/FFmpeg memory exhaustion from crashing the main API.

HONEST LABELING RULE:
All composed outputs are explicitly tagged with:
    is_synthetic: True
    provider_label: "Cinematic Preview"
"""

import json
import logging
import os
import shutil
import subprocess
import time
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Literal, Optional

logger = logging.getLogger(__name__)


@dataclass
class CinematicPreviewSpec:
    """Specification contract for composing a cinematic motion preview."""
    project_id: str
    entity_type: str  # 'scene' or 'world'
    entity_id: str
    title: str
    location_setting: Optional[str] = None
    conflict_narrative: Optional[str] = None
    image_path: Optional[str] = None
    voice_path: Optional[str] = None
    ambient_path: Optional[str] = None
    duration_sec: int = 12
    aspect_ratio: str = "16:9"

    def validate(self) -> List[str]:
        """Check specification validity; return list of missing or invalid fields."""
        issues = []
        if not self.title or not self.title.strip():
            issues.append("Missing title")
        if self.duration_sec < 3 or self.duration_sec > 60:
            issues.append(f"Duration {self.duration_sec}s outside allowed range (3-60s)")
        return issues


@dataclass
class CinematicPreviewResult:
    """Result of preview rendering or graceful static fallback."""
    status: Literal["completed", "failed", "static_fallback"]
    video_path: Optional[str] = None
    video_bytes: Optional[bytes] = None
    mime_type: str = "video/mp4"
    metadata: Dict[str, Any] = None  # type: ignore[assignment]
    render_duration_sec: float = 0.0
    error_message: Optional[str] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        # Enforce non-negotiable honest labeling standards
        self.metadata["is_synthetic"] = True
        self.metadata["provider_label"] = "Cinematic Preview"


class CinematicPreviewComposer:
    """
    Isolated programmatic video composer.
    Assembles concept art, voiceover, and procedural ambient audio into an MP4.
    """

    def __init__(
        self,
        ffmpeg_path: Optional[str] = None,
        output_dir: Optional[str] = None,
        worker_url: Optional[str] = None,
    ):
        self.ffmpeg_path = ffmpeg_path or shutil.which("ffmpeg")
        self.output_dir = output_dir or os.path.join(os.getcwd(), "scratch", "previews")
        self.worker_url = worker_url or os.getenv("CINEMATIC_WORKER_URL")
        os.makedirs(self.output_dir, exist_ok=True)

    def is_ffmpeg_available(self) -> bool:
        """Check if FFmpeg binary is accessible."""
        return self.ffmpeg_path is not None and os.path.exists(self.ffmpeg_path)

    def compose(
        self,
        spec: CinematicPreviewSpec,
        timeout_sec: float = 30.0,
    ) -> CinematicPreviewResult:
        """
        Compose a cinematic preview in an isolated subprocess.
        Handles missing assets gracefully. Never crashes the caller.
        """
        start_time = time.perf_counter()

        # 1. Validate spec
        validation_issues = spec.validate()
        if validation_issues:
            return CinematicPreviewResult(
                status="failed",
                error_message=f"Invalid preview specification: {', '.join(validation_issues)}",
                render_duration_sec=time.perf_counter() - start_time,
                metadata={
                    "is_synthetic": True,
                    "provider_label": "Cinematic Preview",
                    "reason": "validation_failed",
                },
            )

        # 2. Check essential visual asset
        if not spec.image_path or not os.path.exists(spec.image_path):
            logger.info("Visual concept art missing for %s; returning static manifest preview.", spec.entity_id)
            return CinematicPreviewResult(
                status="static_fallback",
                error_message="Image asset not available. Provided static preview manifest.",
                render_duration_sec=time.perf_counter() - start_time,
                metadata={
                    "is_synthetic": True,
                    "provider_label": "Cinematic Preview",
                    "preview_type": "static_keyframe",
                    "title": spec.title,
                    "location_setting": spec.location_setting,
                    "conflict_narrative": spec.conflict_narrative,
                },
            )

        # 3. Check FFmpeg availability
        if not self.is_ffmpeg_available():
            logger.warning("FFmpeg renderer binary not available on host.")
            return CinematicPreviewResult(
                status="failed",
                error_message="FFmpeg rendering binary not found. Video rendering is unavailable.",
                render_duration_sec=time.perf_counter() - start_time,
                metadata={
                    "is_synthetic": True,
                    "provider_label": "Cinematic Preview",
                    "error": "renderer_missing",
                },
            )

        # 4. Prepare output destination
        output_filename = f"preview_{spec.project_id}_{spec.entity_id}_{int(time.time())}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)

        # 5. Build filter graph and arguments
        # Clean text for drawtext escaping
        safe_title = (spec.title or "Cinematic Preview").replace(":", " - ").replace("'", "")
        safe_subtitle = (spec.location_setting or "").replace(":", " - ").replace("'", "")

        has_voice = spec.voice_path and os.path.exists(spec.voice_path)
        has_ambient = spec.ambient_path and os.path.exists(spec.ambient_path)

        # Video filter: Ken Burns slow zoom + pan + text branding & title
        vf_parts = [
            "[0:v]scale=1920:1080",
            f"zoompan=z='min(zoom+0.0012,1.15)':d={spec.duration_sec * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=25",
            "drawtext=text='PRAROHA CINEMATIC PREVIEW':fontcolor=white@0.9:fontsize=20:x=40:y=40:box=1:boxcolor=black@0.5:boxborderw=6",
            f"drawtext=text='{safe_title}':fontcolor=white:fontsize=32:x=40:y=620:box=1:boxcolor=black@0.6:boxborderw=10",
        ]
        if safe_subtitle:
            vf_parts.append(
                f"drawtext=text='{safe_subtitle}':fontcolor=white@0.85:fontsize=20:x=40:y=665:box=1:boxcolor=black@0.5:boxborderw=6"
            )
        vf_string = ",".join(vf_parts) + "[v]"

        cmd = [
            self.ffmpeg_path,  # type: ignore[list-item]
            "-y",
            "-loop", "1",
            "-t", str(spec.duration_sec),
            "-i", spec.image_path,
        ]

        audio_inputs = 0
        if has_voice:
            cmd.extend(["-i", spec.voice_path])  # type: ignore[list-item]
            audio_inputs += 1
        if has_ambient:
            cmd.extend(["-stream_loop", "-1", "-i", spec.ambient_path])  # type: ignore[list-item]
            audio_inputs += 1

        # Audio mixing logic
        if audio_inputs == 2:
            # Voice is input 1, Ambient is input 2
            af_string = (
                "[1:a]volume=1.0[a_voice];"
                "[2:a]volume=0.25[a_amb];"
                "[a_voice][a_amb]amix=inputs=2:duration=first:dropout_transition=2[a]"
            )
            filter_complex = f"{vf_string};{af_string}"
            map_args = ["-map", "[v]", "-map", "[a]"]
        elif audio_inputs == 1:
            # Only voice or only ambient
            filter_complex = f"{vf_string};[1:a]volume=0.9[a]"
            map_args = ["-map", "[v]", "-map", "[a]"]
        else:
            # Silent video: generate silent audio track to ensure valid MP4 audio/video sync
            filter_complex = f"{vf_string};aevalsrc=0:d={spec.duration_sec}[a]"
            map_args = ["-map", "[v]", "-map", "[a]"]

        cmd.extend([
            "-filter_complex", filter_complex,
            *map_args,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-t", str(spec.duration_sec),
            "-movflags", "+faststart",
            output_path,
        ])

        # 6. Execute in an isolated subprocess with strict timeout
        try:
            logger.info("Executing isolated cinematic preview render for %s...", spec.entity_id)
            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=timeout_sec,
                check=False,
            )
            render_elapsed = time.perf_counter() - start_time

            if proc.returncode != 0:
                err_snippet = proc.stderr.decode("utf-8", errors="replace")[-600:]
                logger.error("FFmpeg render failed with exit code %s: %s", proc.returncode, err_snippet)
                return CinematicPreviewResult(
                    status="failed",
                    error_message=f"Rendering failed (exit code {proc.returncode}): {err_snippet}",
                    render_duration_sec=render_elapsed,
                    metadata={
                        "is_synthetic": True,
                        "provider_label": "Cinematic Preview",
                        "error_code": proc.returncode,
                    },
                )

            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                return CinematicPreviewResult(
                    status="failed",
                    error_message="Render finished but output file is empty or missing.",
                    render_duration_sec=render_elapsed,
                    metadata={
                        "is_synthetic": True,
                        "provider_label": "Cinematic Preview",
                    },
                )

            # Read rendered bytes
            with open(output_path, "rb") as f:
                video_data = f.read()

            used_modalities = ["image"]
            if has_voice:
                used_modalities.append("voice")
            if has_ambient:
                used_modalities.append("ambient")

            return CinematicPreviewResult(
                status="completed",
                video_path=output_path,
                video_bytes=video_data,
                mime_type="video/mp4",
                render_duration_sec=render_elapsed,
                metadata={
                    "is_synthetic": True,
                    "provider_label": "Cinematic Preview",
                    "duration_sec": spec.duration_sec,
                    "aspect_ratio": spec.aspect_ratio,
                    "resolution": "720p",
                    "file_size_bytes": len(video_data),
                    "assets_used": used_modalities,
                    "render_engine": "ffmpeg-motion-composer",
                },
            )

        except subprocess.TimeoutExpired:
            render_elapsed = time.perf_counter() - start_time
            logger.error("FFmpeg render timed out after %s seconds.", timeout_sec)
            return CinematicPreviewResult(
                status="failed",
                error_message=f"Preview render timed out after {timeout_sec}s.",
                render_duration_sec=render_elapsed,
                metadata={
                    "is_synthetic": True,
                    "provider_label": "Cinematic Preview",
                    "timeout": True,
                },
            )
        except Exception as exc:
            render_elapsed = time.perf_counter() - start_time
            logger.error("Unexpected error during preview rendering: %s", exc, exc_info=True)
            return CinematicPreviewResult(
                status="failed",
                error_message=str(exc),
                render_duration_sec=render_elapsed,
                metadata={
                    "is_synthetic": True,
                    "provider_label": "Cinematic Preview",
                    "error": str(exc),
                },
            )

    async def compose_async(
        self,
        spec: CinematicPreviewSpec,
        timeout_sec: float = 120.0,
    ) -> CinematicPreviewResult:
        """
        Compose a cinematic preview.
        If CINEMATIC_WORKER_URL is configured, delegates the compute-heavy FFmpeg
        work to the isolated worker container with mutual service-to-service authentication.
        Otherwise, falls back safely to local composition or static manifest.
        """
        # 1. Validate spec
        validation_issues = spec.validate()
        if validation_issues:
            return CinematicPreviewResult(
                status="failed",
                error_message=f"Invalid preview specification: {', '.join(validation_issues)}",
                render_duration_sec=0.0,
                metadata={
                    "is_synthetic": True,
                    "provider_label": "Cinematic Preview",
                    "reason": "validation_failed",
                },
            )

        # 2. Check worker delegation
        if self.worker_url and self.worker_url.strip():
            worker_target = self.worker_url.strip().rstrip("/")
            try:
                import hashlib
                from dataclasses import asdict
                import httpx

                # Derive service-to-service auth token
                auth_token = os.getenv("WORKER_AUTH_TOKEN")
                if not auth_token:
                    supa_key = os.getenv("SUPABASE_KEY")
                    if supa_key and supa_key.strip():
                        auth_token = hashlib.sha256(f"praroha-worker:{supa_key.strip()}".encode()).hexdigest()
                    else:
                        auth_token = "dev-worker-insecure-secret"

                headers = {
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "spec": asdict(spec),
                    "storage_provider": os.getenv("STORAGE_PROVIDER", "supabase"),
                    "timeout": timeout_sec,
                }

                logger.info(
                    "Delegating cinematic preview render for %s to isolated worker at %s...",
                    spec.entity_id,
                    worker_target,
                )
                async with httpx.AsyncClient(timeout=timeout_sec + 10.0) as client:
                    resp = await client.post(f"{worker_target}/render", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        return CinematicPreviewResult(
                            status=data.get("status", "completed"),
                            video_path=data.get("video_path"),
                            render_duration_sec=data.get("metrics", {}).get("render_elapsed_sec", 0.0),
                            metadata=data.get("metadata", {}),
                        )
                    else:
                        logger.warning(
                            "Worker delegation failed with HTTP %d: %s. Falling back.",
                            resp.status_code,
                            resp.text,
                        )
            except Exception as exc:
                logger.warning("Error during worker delegation: %s. Falling back to local/static.", exc)

        # 3. Fallback to local compose
        return await asyncio.to_thread(self.compose, spec, timeout_sec)

