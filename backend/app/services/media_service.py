import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException

from backend.app.models.media import (
    MediaAssetRecord,
    MediaGenerationRequest,
    MediaJobResponse,
    get_utc_now,
)
from backend.app.providers.factory import get_storage_provider
from backend.app.providers.media.base import MediaProvider
from backend.app.providers.media.factory import get_media_provider
from backend.app.providers.storage import StorageProvider
from backend.app.repositories.project_repo import (
    ProjectRepository,
    async_session,
)

logger = logging.getLogger(__name__)


def _resolve_extension(mime_type: str) -> str:
    if "svg" in mime_type:
        return "svg"
    if "wav" in mime_type:
        return "wav"
    if "mpeg" in mime_type or "mp3" in mime_type:
        return "mp3"
    if "mp4" in mime_type:
        return "mp4"
    if "png" in mime_type:
        return "png"
    if "jpeg" in mime_type or "jpg" in mime_type:
        return "jpg"
    return "bin"


class MediaService:
    """Orchestrates decoupled, non-blocking media generation across modal providers."""

    def __init__(
        self,
        repo: ProjectRepository,
        storage: Optional[StorageProvider] = None,
        media_provider: Optional[MediaProvider] = None,
    ):
        self.repo = repo
        self.storage = storage or get_storage_provider()
        self.media_provider = media_provider or get_media_provider()

    async def dispatch_job(
        self,
        project_id: str,
        request: MediaGenerationRequest,
    ) -> MediaJobResponse:
        """Create a queued media asset and trigger background generation without blocking."""
        project = await self.repo.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        asset_record = MediaAssetRecord(
            project_id=project_id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            media_type=request.media_type,
            status="queued",
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio or "1:1",
            provider_name=self.media_provider.name,
        )
        created_asset = await self.repo.create_media_asset(asset_record)

        # Launch background task with its own independent session
        asyncio.create_task(
            self._execute_job_in_background(
                asset_id=created_asset.id,
                request=request,
            )
        )

        return MediaJobResponse(
            job_id=created_asset.id,
            status="queued",
            media_type=request.media_type,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            asset_url=None,
            error_message=None,
        )

    async def _execute_job_in_background(
        self,
        asset_id: str,
        request: MediaGenerationRequest,
    ) -> None:
        """Execute media generation in an isolated async session to avoid session collisions."""
        async with async_session() as session:
            repo = ProjectRepository(session)
            await self._run_generation_pipeline(
                asset_id=asset_id,
                request=request,
                repo=repo,
            )

    async def process_job_now(
        self,
        asset_id: str,
        request: MediaGenerationRequest,
    ) -> MediaAssetRecord:
        """Synchronously execute job for unit testing or eager evaluation."""
        return await self._run_generation_pipeline(
            asset_id=asset_id,
            request=request,
            repo=self.repo,
        )

    async def _run_generation_pipeline(
        self,
        asset_id: str,
        request: MediaGenerationRequest,
        repo: ProjectRepository,
    ) -> MediaAssetRecord:
        """Core state machine: processing -> provider synthesis -> storage -> completed/failed."""
        await repo.update_media_asset(
            asset_id=asset_id,
            updates={"status": "processing"},
        )

        try:
            asset_record = await repo.get_media_asset(asset_id)
            project_id = asset_record.project_id if asset_record else request.entity_id

            if request.media_type == "video":
                effective_aspect_ratio = request.aspect_ratio if (request.aspect_ratio and request.aspect_ratio != "1:1") else "16:9"
            else:
                effective_aspect_ratio = request.aspect_ratio or "1:1"

            context: Dict[str, Any] = {
                "project_id": project_id,
                "entity_type": request.entity_type,
                "entity_id": request.entity_id,
                "aspect_ratio": effective_aspect_ratio,
                "voice_id": request.voice_id or "default",
                "duration_sec": request.duration_sec or 5,
                "mood": request.mood or "ambient",
                **(request.context or {}),
            }

            generation_prompt = request.prompt

            if request.media_type == "image":
                # Context-aware visual prompt enrichment with Seed DNA
                if project_id:
                    dna_record = await repo.get_seed_dna(project_id)
                    if dna_record:
                        style_cues = []
                        if dna_record.tone:
                            style_cues.append(f"Tone: {dna_record.tone}")
                        try:
                            keywords = json.loads(dna_record.domain_keywords_json)
                            if keywords:
                                style_cues.append(f"Style: {', '.join(keywords[:3])}")
                        except Exception:
                            pass
                        try:
                            themes = json.loads(dna_record.themes_json)
                            if themes:
                                style_cues.append(f"Atmosphere: {', '.join(themes[:2])}")
                        except Exception:
                            pass
                        if style_cues:
                            cue_text = "; ".join(style_cues)
                            generation_prompt = f"{request.prompt.strip().rstrip('.')}. {cue_text}."

                payload = await self.media_provider.generate_image(
                    prompt=generation_prompt,
                    aspect_ratio=request.aspect_ratio or "1:1",
                    context=context,
                )
            elif request.media_type == "voice":
                # Deterministic Spoken Script Derivation Rule:
                # 1. If creator explicitly supplies spoken text in prompt, preserve it exactly.
                # 2. Otherwise derive canonical script from entity fields.
                # 3. Never silently rewrite creator-provided spoken text.
                if request.prompt and request.prompt.strip():
                    spoken_text = request.prompt.strip()
                else:
                    if request.entity_type == "character" and request.entity_id:
                        char = await repo.get_character(request.entity_id)
                        if char:
                            name = char.name
                            role = char.role
                            motivation = (char.motivation or "").rstrip(".")
                            core_conflict = (char.core_conflict or "").rstrip(".")
                            spoken_text = f"I am {name}, {role}. My motivation: {motivation}. My core conflict: {core_conflict}."
                        else:
                            spoken_text = "I am a character in this world."
                    elif request.entity_type == "scene" and request.entity_id:
                        scene = await repo.get_scene(request.entity_id)
                        if scene:
                            scene_number = scene.scene_number
                            title = scene.title
                            location_setting = (scene.location_setting or "").rstrip(".")
                            conflict_narrative = (scene.conflict_narrative or "").rstrip(".")
                            pivotal_outcome = (scene.pivotal_outcome or "").rstrip(".")
                            spoken_text = f"Scene {scene_number}: {title}. In {location_setting}. {conflict_narrative}. Outcome: {pivotal_outcome}."
                        else:
                            spoken_text = "Scene narration."
                    else:
                        spoken_text = f"Narration for {request.entity_type} {request.entity_id}."

                generation_prompt = spoken_text
                payload = await self.media_provider.generate_voice(
                    text=generation_prompt,
                    voice_id=request.voice_id or "default",
                    context=context,
                )
            elif request.media_type == "video":
                # Deterministic Video Prompt Derivation Rule:
                # 1. If creator explicitly supplies prompt text, preserve it exactly without alteration.
                # 2. If prompt is empty or omitted, derive canonical cinematic motion prompt from entity fields.
                if request.prompt and request.prompt.strip():
                    generation_prompt = request.prompt.strip()
                else:
                    if request.entity_type == "world" and request.entity_id:
                        world_cand = await repo.get_world_candidate(request.entity_id)
                        if not world_cand and project_id:
                            sel = await repo.get_world_selection(project_id)
                            if sel and sel.selected_world_id:
                                world_cand = await repo.get_world_candidate(sel.selected_world_id)
                        if world_cand:
                            title = world_cand.title
                            concept = (world_cand.concept or "").rstrip(".")
                            aesthetic = (world_cand.aesthetic or "").rstrip(".")
                            generation_prompt = f"{title}, {concept}. Visual aesthetic: {aesthetic}. Cinematic camera panning across the expansive environment, atmospheric fog, photorealistic lighting, 4k cinematic render."
                        else:
                            generation_prompt = f"Cinematic teaser for world {request.entity_id}."
                    elif request.entity_type == "scene" and request.entity_id:
                        scene = await repo.get_scene(request.entity_id)
                        if scene:
                            title = scene.title
                            location_setting = (scene.location_setting or "").rstrip(".")
                            conflict_narrative = (scene.conflict_narrative or "").rstrip(".")
                            generation_prompt = f"Cinematic scene: {title} in {location_setting}. {conflict_narrative}. Slow dramatic camera motion, dynamic environmental movement, atmospheric lighting."
                        else:
                            generation_prompt = f"Cinematic scene {request.entity_id}."
                    else:
                        generation_prompt = f"Cinematic video for {request.entity_type} {request.entity_id}."

                payload = await self.media_provider.generate_video(
                    prompt=generation_prompt,
                    duration_sec=request.duration_sec or 5,
                    context=context,
                )
            elif request.media_type == "audio":
                # Deterministic Acoustic Prompt Derivation Rule:
                # 1. If creator explicitly supplies prompt text, preserve it exactly without alteration.
                # 2. If prompt is empty or omitted, derive canonical audio soundscape prompt from entity fields.
                audio_mood = request.mood or "ambient"
                audio_duration = request.duration_sec or 15
                if request.prompt and request.prompt.strip():
                    generation_prompt = request.prompt.strip()
                else:
                    if request.entity_type == "world" and request.entity_id:
                        world_cand = await repo.get_world_candidate(request.entity_id)
                        if not world_cand and project_id:
                            sel = await repo.get_world_selection(project_id)
                            if sel and sel.selected_world_id:
                                world_cand = await repo.get_world_candidate(sel.selected_world_id)
                        if world_cand:
                            title = world_cand.title
                            aesthetic = (world_cand.aesthetic or "").rstrip(".")
                            generation_prompt = (
                                f"{title} ambient soundscape. Atmosphere: {aesthetic}. "
                                f"Mood: {audio_mood}. Drone frequencies, textured organic background resonance, "
                                f"immersive 3D acoustic field."
                            )
                        else:
                            generation_prompt = f"Ambient soundscape for world {request.entity_id}."
                    elif request.entity_type == "scene" and request.entity_id:
                        scene = await repo.get_scene(request.entity_id)
                        if scene:
                            title = scene.title
                            location_setting = (scene.location_setting or "").rstrip(".")
                            generation_prompt = (
                                f"Scene atmosphere: {title} in {location_setting}. "
                                f"Tone: {audio_mood}. Dramatic environmental underscore, "
                                f"thematic instrumentation, cinematic background score."
                            )
                        else:
                            generation_prompt = f"Atmospheric underscore for scene {request.entity_id}."
                    else:
                        generation_prompt = f"Ambient soundscape for {request.entity_type} {request.entity_id}. Mood: {audio_mood}."

                payload = await self.media_provider.generate_audio(
                    prompt=generation_prompt,
                    duration_sec=audio_duration,
                    mood=audio_mood,
                    context=context,
                )
            else:
                raise ValueError(f"Unsupported media type: {request.media_type}")

            # Store synthesized asset
            ext = _resolve_extension(payload.mime_type)
            storage_key = f"media/{request.media_type}/{asset_id}.{ext}"
            uploaded_url = await self.storage.upload(
                file_data=payload.data,
                key=storage_key,
                mime_type=payload.mime_type,
            )

            resolved_provider = payload.metadata.get("resolved_provider") or self.media_provider.name
            width = payload.metadata.get("width")
            height = payload.metadata.get("height")
            aspect_ratio = payload.metadata.get("aspect_ratio") or effective_aspect_ratio
            voice_id = payload.metadata.get("voice_id") or request.voice_id or "default"
            persona = payload.metadata.get("persona") or (request.voice_id if request.voice_id != "default" else "narrator-deep")
            duration_sec = payload.metadata.get("duration_sec")
            mood = payload.metadata.get("mood") or request.mood
            metadata_json = json.dumps({
                "resolved_provider": resolved_provider,
                "raw_prompt": request.prompt,
                "enriched_prompt": generation_prompt,
                "entity_type": request.entity_type,
                "entity_id": request.entity_id,
                "voice_id": voice_id,
                "persona": persona,
                "duration_sec": duration_sec,
                "mood": mood,
                **(payload.metadata or {}),
            })


            updated = await repo.update_media_asset(
                asset_id=asset_id,
                updates={
                    "status": "completed",
                    "asset_url": uploaded_url,
                    "mime_type": payload.mime_type,
                    "prompt": generation_prompt,
                    "provider_name": resolved_provider,
                    "width": width,
                    "height": height,
                    "aspect_ratio": aspect_ratio,
                    "metadata_json": metadata_json,
                    "completed_at": get_utc_now(),
                    "error_message": None,
                },
            )
            return updated or await repo.get_media_asset(asset_id)

        except Exception as exc:
            logger.error(
                "Media generation failed for asset %s: %s",
                asset_id,
                exc,
                exc_info=True,
            )
            updated = await repo.update_media_asset(
                asset_id=asset_id,
                updates={
                    "status": "failed",
                    "error_message": str(exc),
                    "completed_at": get_utc_now(),
                },
            )
            return updated or await repo.get_media_asset(asset_id)

    async def get_job(self, asset_id: str) -> Optional[MediaAssetRecord]:
        """Fetch media asset / job status."""
        return await self.repo.get_media_asset(asset_id)

    async def list_assets(
        self,
        project_id: str,
        entity_id: Optional[str] = None,
        media_type: Optional[str] = None,
    ) -> List[MediaAssetRecord]:
        """List media assets for a project with optional filters."""
        return await self.repo.list_media_assets(
            project_id=project_id,
            entity_id=entity_id,
            media_type=media_type,
        )

    async def get_providers_health(self) -> Dict[str, Any]:
        """Return health status across modal providers."""
        return await self.media_provider.health_check()

