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
        provider_name = os.getenv("IMAGE_PROVIDER", "mock").lower()
        if provider_name == "mock":
            return MockImageProvider()
        # Downstream (Phase 14): add Pollinations / Flux
        return MockImageProvider()

    @classmethod
    def get_voice_provider(cls) -> VoiceProvider:
        provider_name = os.getenv("VOICE_PROVIDER", "mock").lower()
        if provider_name == "mock":
            return MockVoiceProvider()
        # Downstream (Phase 15): add Edge TTS / Kokoro
        return MockVoiceProvider()

    @classmethod
    def get_video_provider(cls) -> VideoProvider:
        provider_name = os.getenv("VIDEO_PROVIDER", "mock").lower()
        if provider_name == "mock":
            return MockVideoProvider()
        # Downstream (Phase 16): add Pyramid Flow / Wan
        return MockVideoProvider()

    @classmethod
    def get_audio_provider(cls) -> AudioProvider:
        provider_name = os.getenv("AUDIO_PROVIDER", "mock").lower()
        if provider_name == "mock":
            return MockAudioProvider()
        # Downstream (Phase 17): add ACE-Step
        return MockAudioProvider()

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
