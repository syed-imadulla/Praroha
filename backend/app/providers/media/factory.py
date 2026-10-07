import os
from typing import Any, Dict
from backend.app.providers.media.base import (
    AudioProvider,
    ImageProvider,
    MediaProvider,
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
from backend.app.providers.media.pyramid_flow import PyramidFlowProvider
from backend.app.providers.media.wan import WanVideoProvider
from backend.app.providers.media.ace_step import ACEStepAudioProvider
from backend.app.providers.media.stable_audio import StableAudioOpenProvider


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
        return {
            "status": "healthy",
            "provider": "ConfiguredMediaProvider",
            "modalities": {
                "image": type(self.image).__name__,
                "voice": type(self.voice).__name__,
                "video": type(self.video).__name__,
                "audio": type(self.audio).__name__,
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
        provider_name = os.getenv("VIDEO_PROVIDER", "pyramid_flow").lower()
        if provider_name == "mock":
            return MockVideoProvider()
        return CompositeVideoProvider()

    @classmethod
    def get_audio_provider(cls) -> AudioProvider:
        provider_name = os.getenv("AUDIO_PROVIDER", "ace_step").lower()
        if provider_name == "mock":
            return MockAudioProvider()
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
