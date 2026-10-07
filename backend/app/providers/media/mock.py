import base64
import hashlib
import math
import struct
import uuid
from typing import Any, Dict, Optional
from backend.app.providers.media.base import (
    AudioProvider,
    ImageProvider,
    MediaPayload,
    MediaProvider,
    VideoProvider,
    VoiceProvider,
)


def _generate_wav_bytes(duration_sec: float = 1.0, freq: float = 330.0, sample_rate: int = 22050) -> bytes:
    """Generate a clean, valid standard PCM RIFF/WAV binary payload in pure Python."""
    duration = max(0.5, min(10.0, duration_sec))
    num_samples = int(duration * sample_rate)
    subchunk2_size = num_samples * 2  # 16-bit mono = 2 bytes per sample
    chunk_size = 36 + subchunk2_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        chunk_size,
        b"WAVE",
        b"fmt ",
        16,  # PCM subchunk size
        1,   # AudioFormat (PCM)
        1,   # Channels (mono)
        sample_rate,
        sample_rate * 2,  # ByteRate
        2,   # BlockAlign
        16,  # BitsPerSample
        b"data",
        subchunk2_size,
    )

    fade_samples = int(0.05 * sample_rate)
    samples = bytearray()
    for i in range(num_samples):
        t = i / sample_rate
        # Avoid clicking with edge envelopes
        envelope = min(1.0, i / max(1, fade_samples), (num_samples - i) / max(1, fade_samples))
        val = int(8000 * envelope * math.sin(2 * math.pi * freq * t))
        samples.extend(struct.pack("<h", max(-32768, min(32767, val))))

    return bytes(header + samples)


def _generate_svg_bytes(title: str, aspect_ratio: str = "1:1") -> bytes:
    """Generate a clean, high-aesthetic responsive SVG graphic."""
    if aspect_ratio == "1:1":
        width, height = (800, 800)
    elif aspect_ratio == "9:16":
        width, height = (720, 1280)
    else:
        width, height = (1200, 675)
    clean_title = (title or "Universe Visual Asset")[:60]
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#030712"/>
      <stop offset="40%" stop-color="#090d1a"/>
      <stop offset="100%" stop-color="#161b33"/>
    </linearGradient>
    <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="{width}" height="{height}" fill="url(#bg)"/>
  <circle cx="{width // 2}" cy="{height // 2}" r="{min(width, height) // 2}" fill="url(#cyanGlow)"/>

  <!-- Aesthetic Framing Grid -->
  <rect x="24" y="24" width="{width - 48}" height="{height - 48}" fill="none" stroke="url(#borderGrad)" stroke-width="2" rx="20"/>
  <circle cx="40" cy="40" r="4" fill="#06b6d4"/>
  <circle cx="{width - 40}" cy="40" r="4" fill="#06b6d4"/>
  <circle cx="40" cy="{height - 40}" r="4" fill="#8b5cf6"/>
  <circle cx="{width - 40}" cy="{height - 40}" r="4" fill="#8b5cf6"/>

  <!-- Visual Central Emblem -->
  <g transform="translate({width // 2}, {height // 2 - 40})">
    <circle r="60" fill="#06b6d4" fill-opacity="0.1" stroke="#06b6d4" stroke-width="1.5"/>
    <polygon points="0,-35 30,25 -30,25" fill="none" stroke="#38bdf8" stroke-width="2"/>
    <circle cx="0" cy="5" r="8" fill="#a5f3fc"/>
  </g>

  <!-- Text Hierarchy -->
  <text x="{width // 2}" y="{height // 2 + 55}" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="0.5">
    {clean_title}
  </text>
  <text x="{width // 2}" y="{height // 2 + 90}" font-family="ui-monospace, monospace" font-size="12" font-weight="bold" fill="#22d3ee" text-anchor="middle" letter-spacing="3">
    SEED UNFOLD • MOCK VISUAL ENGINE
  </text>
  <text x="{width // 2}" y="{height - 48}" font-family="ui-monospace, monospace" font-size="10" fill="#64748b" text-anchor="middle">
    OFFLINE DETERMINISTIC ASSET • ZERO-COST FALLBACK
  </text>
</svg>"""
    return svg.encode("utf-8")


_PLAYABLE_MP4_B64 = (
    "AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAARmbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAA+gAAQAAAQ"
    "AAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAg"
    "AAA5F0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAA"
    "AAAAAAAAAAAAAAABAAAAAAUAAAADwAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPoAAAEAAABAAAAAAMJbWRpYQAAACBtZG"
    "hkAAAAAAAAAAAAAAAAAAAyAAAAMgBVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACtG"
    "1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAnRzdGJsAAAAwHN0c2"
    "QAAAAAAAAAAQAAALBhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAUAA8ABIAAAASAAAAAAAAAABFUxhdmM2Mi4xMS4xMDAgbG"
    "lieDI2NAAAAAAAAAAAAAAAGP//AAAANmF2Y0MBZAAN/+EAGWdkAA2s2UFB+wEQAAADABAAAAMDIPFCmWABAAZo6+PLIsD9+PgAAA"
    "AAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAI1gAAAAAAAAAGHN0dHMAAAAAAAAAAQAAABkAAAIAAAAAFHN0c3MAAAAAAAAAAQ"
    "AAAAEAAADYY3R0cwAAAAAAAAAZAAAAAQAABAAAAAABAAAKAAAAAAEAAAQAAAAAAQAAAAAAAAABAAACAAAAAAEAAAoAAAAAAQAABAAA"
    "AAABAAAAAAAAAAEAAAIAAAAAAQAACgAAAAABAAAEAAAAAAEAAAAAAAAAAQAAAgAAAAABAAAKAAAAAAEAAAQAAAAAAQAAAAAAAAAB"
    "AAACAAAAAAEAAAoAAAAAAQAABAAAAAABAAAAAAAAAAEAAAIAAAAAAQAACgAAAAABAAAEAAAAAAEAAAAAAAAAAQAAAgAAAAAcc3Rz"
    "YwAAAAAAAAABAAAAAQAAABkAAAABAAAAeHN0c3oAAAAAAAAAAAAAABkAAALjAAAAEQAAAA4AAAAOAAAADgAAABcAAAAQAAAADgAA"
    "AA4AAAAXAAAAEAAAAA4AAAAOAAAAFwAAABAAAAAOAAAADgAAABYAAAAQAAAADgAAAA4AAAAWAAAAEAAAAA4AAAAOAAAAFHN0Y28A"
    "AAAAAAAAAQAABJYAAABhdWR0YQAAAFltZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACxpbHN0AAAA"
    "JKl0b28AAAAcZGF0YQAAAAEAAAAATGF2ZjYyLjMuMTAwAAAACGZyZWUAAARzbWRhdAAAAqAGBf//nNxF6b3m2Ui3lizYINkj7u94"
    "MjY0IC0gY29yZSAxNjUgLSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDI1IC0gaHR0cDovL3d3dy52"
    "aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MSByZWY9MyBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgzOjB4"
    "MTEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21l"
    "PTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0y"
    "IHRocmVhZHM9NyBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9"
    "MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlh"
    "cz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9MjUwIGtleWludF9taW49MjUgc2NlbmVj"
    "dXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIzLjAgcWNvbXA9MC42MCBx"
    "cG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAA7ZYiEADv//vdOvwKbVMIqA5JXCvbK"
    "pCZZuVJrAfKmAADzSlmhv3vLXujwBQgAAGzEsx3RIaU4jI83Q4EAAAANQZokbEO//qmWAABvwAAAAApBnkJ4hf8AAIOBAAAACgGe"
    "YXRCvwAAtoAAAAAKAZ5jakK/AAC2gQAAABNBmmhJqEFomUwId//+qZYAAG/BAAAADEGehkURLC//AACDgQAAAAoBnqV0Qr8AALaB"
    "AAAAKAGep2pCvwAAtoAAAAATQZqsSahBbJlMCHf//qmWAABvwAAAAAxBnspFFSwv/wAAg4EAAAAKAZ7pdEK/AAC2gAAAAAoBnutq"
    "Qr8AALaAAAAAE0Ga8EmoQWyZTAhv//6nhAAA3oEAAAAMQZ8ORRUsL/8AAIOBAAAACgGfLXRCvwAAtoEAAAAKAZ8vakK/AAC2gAAA"
    "ABJBmzRJqEFsmUwIZ//+nhAAA2YAAAAMQZ9SRRUsL/8AAIOBAAAACgGfcXRCvwAAtoAAAAAKAZ9zakK/AAC2gAAAABJBm3hJqEFs"
    "mUwIV//+OEAADUkAAAAMQZ+WRRUsL/8AAIOAAAAACgGftXRCvwAAtoEAAAAKAZ+3akK/AAC2gQ=="
)


def _generate_minimal_mp4_bytes() -> bytes:
    """Generate a valid browser-playable ISO base media file (MP4 container with ftyp/moov/trak/mdat)."""
    return base64.b64decode(_PLAYABLE_MP4_B64)


class MockImageProvider(ImageProvider):
    """Deterministic mock image provider generating aesthetic SVG vector art."""

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        title = (context or {}).get("entity_title") or prompt.split(".")[0][:40]
        data = _generate_svg_bytes(title, aspect_ratio)
        if aspect_ratio == "1:1":
            width, height = (800, 800)
        elif aspect_ratio == "9:16":
            width, height = (720, 1280)
        else:
            width, height = (1200, 675)
        file_hash = hashlib.md5(f"{prompt}_{aspect_ratio}".encode("utf-8")).hexdigest()[:10]
        return MediaPayload(
            data=data,
            mime_type="image/svg+xml",
            filename=f"mock_image_{file_hash}.svg",
            metadata={
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio,
                "provider": "MockImageProvider",
                "resolved_provider": "mock",
                "mock": True,
                "prompt": prompt,
            },
        )


class MockVoiceProvider(VoiceProvider):
    """Deterministic mock voice provider generating valid WAV speech audio."""

    async def generate_voice(
        self,
        text: str,
        voice_id: str = "default",
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        duration = min(6.0, max(1.5, len(text) * 0.05))
        data = _generate_wav_bytes(duration_sec=duration, freq=280.0)
        file_hash = hashlib.md5(f"{text}_{voice_id}".encode("utf-8")).hexdigest()[:10]
        persona = (context or {}).get("persona") or (voice_id if voice_id != "default" else "narrator-deep")
        return MediaPayload(
            data=data,
            mime_type="audio/wav",
            filename=f"mock_voice_{file_hash}.wav",
            metadata={
                "voice_id": voice_id,
                "persona": persona,
                "resolved_provider": "mock",
                "duration_sec": duration,
                "provider": "MockVoiceProvider",
                "mock": True,
                "text_snippet": text[:50],
            },
        )



class MockVideoProvider(VideoProvider):
    """Deterministic mock video provider generating valid, browser-playable MP4 clip payloads."""

    async def generate_video(
        self,
        prompt: str,
        duration_sec: int = 5,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        data = _generate_minimal_mp4_bytes()
        file_hash = hashlib.md5(f"{prompt}_{duration_sec}".encode("utf-8")).hexdigest()[:10]
        aspect_ratio = (context or {}).get("aspect_ratio") or "16:9"
        return MediaPayload(
            data=data,
            mime_type="video/mp4",
            filename=f"mock_video_{file_hash}.mp4",
            metadata={
                "resolved_provider": "mock",
                "duration_sec": duration_sec,
                "aspect_ratio": aspect_ratio,
                "resolution": "720p",
                "provider": "MockVideoProvider",
                "mock": True,
                "prompt": prompt,
            },
        )


class MockAudioProvider(AudioProvider):
    """Deterministic mock audio provider generating ambient WAV soundscapes."""

    MOOD_FREQUENCIES = {
        "serene-ambient": 196.0,   # G3 warm drone
        "ambient": 196.0,          # G3 warm drone
        "tense-dramatic": 110.0,   # A2 low tension drone
        "mystic-ethereal": 329.63, # E4 shimmering resonance
        "ominous-drone": 73.42,    # D2 sub-bass foundation
        "epic-orchestral": 220.0,  # A3 brass harmonic
    }

    async def generate_audio(
        self,
        prompt: str,
        mood: str = "ambient",
        duration_sec: int = 15,
        context: Optional[Dict[str, Any]] = None,
    ) -> MediaPayload:
        freq = self.MOOD_FREQUENCIES.get(mood, 196.0)
        duration = min(8.0, max(2.0, float(duration_sec)))
        data = _generate_wav_bytes(duration_sec=duration, freq=freq)
        file_hash = hashlib.md5(f"{prompt}_{mood}".encode("utf-8")).hexdigest()[:10]
        return MediaPayload(
            data=data,
            mime_type="audio/wav",
            filename=f"mock_audio_{file_hash}.wav",
            metadata={
                "resolved_provider": "mock",
                "mood": mood,
                "duration_sec": duration,
                "provider": "MockAudioProvider",
                "mock": True,
                "prompt": prompt,
            },
        )


class MockMediaProvider(MediaProvider):
    """Composite coordinator bundling all four deterministic mock media providers."""

    def __init__(
        self,
        image_provider: Optional[ImageProvider] = None,
        voice_provider: Optional[VoiceProvider] = None,
        video_provider: Optional[VideoProvider] = None,
        audio_provider: Optional[AudioProvider] = None,
    ) -> None:
        self.image = image_provider or MockImageProvider()
        self.voice = voice_provider or MockVoiceProvider()
        self.video = video_provider or MockVideoProvider()
        self.audio = audio_provider or MockAudioProvider()

    @property
    def name(self) -> str:
        return "mock"

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "provider": "MockMediaProvider",
            "modalities": {
                "image": type(self.image).__name__,
                "voice": type(self.voice).__name__,
                "video": type(self.video).__name__,
                "audio": type(self.audio).__name__,
            },
            "offline_ready": True,
        }

