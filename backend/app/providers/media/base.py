from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ProviderUnavailableError(Exception):
    """Raised when a media provider is unconfigured, unreachable, or exhausts retries."""
    pass


class MediaPayload(BaseModel):
    """Encapsulates generated binary payload and metadata from any modal provider."""

    data: bytes
    mime_type: str
    filename: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ImageProvider(ABC):
    """Abstract base interface for image generation (Pollinations, FLUX.1 schnell, Mock)."""

    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        """Generate an image from prompt and return binary payload with metadata."""
        pass

    async def health_check(self) -> Dict[str, Any]:
        """Verify health of image provider."""
        return {"status": "healthy", "provider": self.__class__.__name__}


class VoiceProvider(ABC):
    """Abstract base interface for narration voice generation (Edge TTS, Kokoro-82M, Mock)."""

    @abstractmethod
    async def generate_voice(
        self,
        text: str,
        voice_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        """Generate speech audio from text and return binary payload."""
        pass

    async def health_check(self) -> Dict[str, Any]:
        """Verify health of voice provider."""
        return {"status": "healthy", "provider": self.__class__.__name__}


class VideoProvider(ABC):
    """Abstract base interface for cinematic scene video generation (Pyramid Flow, Wan2.1, Mock)."""

    @abstractmethod
    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        """Generate short video clip from prompt and return binary payload."""
        pass

    async def health_check(self) -> Dict[str, Any]:
        """Verify health of video provider."""
        return {"status": "healthy", "provider": self.__class__.__name__}


class AudioProvider(ABC):
    """Abstract base interface for ambient soundscapes and music composition (ACE-Step 1.5, Mock)."""

    @abstractmethod
    async def generate_audio(
        self,
        prompt: str,
        mood: str = "ambient",
        duration_sec: int = 15,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        """Generate ambient atmosphere audio and return binary payload."""
        pass

    async def health_check(self) -> Dict[str, Any]:
        """Verify health of audio provider."""
        return {"status": "healthy", "provider": self.__class__.__name__}


class MediaProvider(ABC):
    """Composite coordinator interface holding sub-providers for all 4 media modalities."""

    image: ImageProvider
    voice: VoiceProvider
    video: VideoProvider
    audio: AudioProvider

    @property
    def name(self) -> str:
        return self.__class__.__name__

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        return await self.image.generate_image(
            prompt=prompt, aspect_ratio=aspect_ratio, context=context
        )

    async def generate_voice(
        self,
        text: str,
        voice_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        return await self.voice.generate_voice(
            text=text, voice_id=voice_id, context=context
        )

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        return await self.video.generate_video(
            prompt=prompt, duration_sec=duration_sec, context=context
        )

    async def generate_audio(
        self,
        prompt: str,
        mood: str = "ambient",
        duration_sec: int = 15,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        return await self.audio.generate_audio(
            prompt=prompt, mood=mood, duration_sec=duration_sec, context=context
        )

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Verify availability and health of all configured media sub-providers."""
        pass
