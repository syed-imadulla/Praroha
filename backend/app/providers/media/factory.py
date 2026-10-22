import os
from typing import Any, Dict
from backend.app.providers.media.base import (
    AudioProvider,
    ImageProvider,
    MediaProvider,
    ProviderUnavailableError,
    VideoProvider,
    VoiceProvider,
)
from backend.app.providers.media.mock import (
    MockAudioProvider,
    MockImageProvider,
    MockMediaProvider,
    MockVideoProvider,
    MockVoiceProvider,
)
from backend.app.providers.media.composite import CompositeImageProvider
from backend.app.providers.media.composite_voice import CompositeVoiceProvider
from backend.app.providers.media.composite_video import CompositeVideoProvider
from backend.app.providers.media.composite_audio import CompositeAudioProvider
from backend.app.providers.media.edge_tts import EdgeTTSProvider
from backend.app.providers.media.kokoro import KokoroVoiceProvider
from backend.app.providers.media.wan import WanVideoProvider


class ConfiguredMediaProvider(MediaProvider):
    """Dynamic composite media provider that orchestrates modular modality sub-providers."""

    def __init__(
        self,
        image: ImageProvider,
        voice: VoiceProvider,
        video: VideoProvider,
        audio: AudioProvider,
    ) -> None:
        self.image = image
        self.voice = voice
        self.video = video
        self.audio = audio

    async def health_check(self) -> Dict[str, Any]:
        image_h = await self.image.health_check() if hasattr(self.image, "health_check") else {"status": "healthy", "type": type(self.image).__name__}
        voice_h = await self.voice.health_check() if hasattr(self.voice, "health_check") else {"status": "healthy", "type": type(self.voice).__name__}
        video_h = await self.video.health_check() if hasattr(self.video, "health_check") else {"status": "healthy", "type": type(self.video).__name__}
        audio_h = await self.audio.health_check() if hasattr(self.audio, "health_check") else {"status": "healthy", "type": type(self.audio).__name__}

        return {
            "status": "healthy",
            "provider": "ConfiguredMediaProvider",
            "modalities": {
                "image": image_h,
                "voice": voice_h,
                "video": video_h,
                "audio": audio_h,
            },
        }


class MediaProviderFactory:
    """Factory creating configured media providers per modality with safe mock fallbacks."""

    @classmethod
    def get_image_provider(cls) -> ImageProvider:
        provider_name = os.getenv("IMAGE_PROVIDER", "pollinations").lower()
        if provider_name == "mock":
            return MockImageProvider()
        return CompositeImageProvider()

    @classmethod
    def get_voice_provider(cls) -> VoiceProvider:
        provider_name = os.getenv("VOICE_PROVIDER", "edge_tts").lower()
        if provider_name == "mock":
            return MockVoiceProvider()
        return CompositeVoiceProvider()

    @classmethod
    def get_video_provider(cls) -> VideoProvider:
        provider_name = os.getenv("VIDEO_PROVIDER", "composite").lower()
        if provider_name == "mock":
            return MockVideoProvider()
        if provider_name in ("rewind", "pixazo", "json2video", "composition", "pyramid_flow"):
            raise ProviderUnavailableError(
                f"Video provider '{provider_name}' has been retired due to unreliability. Video generation is currently unavailable."
            )
        if provider_name == "wan":
            return WanVideoProvider()
        return CompositeVideoProvider()

    @classmethod
    def get_audio_provider(cls) -> AudioProvider:
        provider_name = os.getenv("AUDIO_PROVIDER", "composite").lower()
        if provider_name == "mock":
            return MockAudioProvider()
        if provider_name in ("rewind", "rewind_music", "pixazo", "pixazo_tracks", "stable_audio", "ace_step"):
            raise ProviderUnavailableError(
                f"Audio provider '{provider_name}' has been retired due to unreliability. Use the built-in Procedural Soundscape Composer."
            )
        return CompositeAudioProvider()

    @classmethod
    def get_media_provider(cls) -> MediaProvider:
        image = cls.get_image_provider()
        voice = cls.get_voice_provider()
        video = cls.get_video_provider()
        audio = cls.get_audio_provider()

        # If all four are mock, return the standard MockMediaProvider
        if (
            isinstance(image, MockImageProvider)
            and isinstance(voice, MockVoiceProvider)
            and isinstance(video, MockVideoProvider)
            and isinstance(audio, MockAudioProvider)
        ):
            return MockMediaProvider()

        return ConfiguredMediaProvider(
            image=image,
            voice=voice,
            video=video,
            audio=audio,
        )

    @classmethod
    def create_provider(cls) -> MediaProvider:
        return cls.get_media_provider()



_global_media_provider: MediaProvider = None


def get_media_provider() -> MediaProvider:
    """Retrieve singleton media provider instance."""
    global _global_media_provider
    if _global_media_provider is None:
        _global_media_provider = MediaProviderFactory.get_media_provider()
    return _global_media_provider
