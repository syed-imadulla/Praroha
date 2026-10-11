import io
import math
import random
import struct
import wave
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class SoundscapeLayerDef(BaseModel):
    id: str
    name: str
    category: str
    description: str
    license: str = "CC0 1.0 Universal (Public Domain)"
    license_url: str = "https://creativecommons.org/publicdomain/zero/1.0/"
    source: str = "PRAROHA Curated Public Domain Acoustic Synthesis"
    tags: List[str] = []


CURATED_SOUNDSCAPE_LAYERS: List[SoundscapeLayerDef] = [
    SoundscapeLayerDef(
        id="wind_mountain",
        name="Alpine Mountain Wind",
        category="weather",
        description="Atmospheric mountain winds with gentle low-frequency resonant gusts.",
        tags=["wind", "breeze", "mountain", "atmospheric"],
    ),
    SoundscapeLayerDef(
        id="rain_monsoon",
        name="Monsoon Rainfall",
        category="weather",
        description="Continuous gentle precipitation and calming rain shower textures.",
        tags=["rain", "water", "storm", "calm"],
    ),
    SoundscapeLayerDef(
        id="temple_bells",
        name="Tibetan Singing Bowls & Temple Bells",
        category="spiritual",
        description="Warm modal bell chimes with long acoustic resonance and pure harmonics.",
        tags=["bells", "chimes", "meditation", "spiritual"],
    ),
    SoundscapeLayerDef(
        id="forest_dawn",
        name="Ancient Forest Canopy",
        category="nature",
        description="Serene woodland ambience with gentle canopy rustle and dawn chirps.",
        tags=["forest", "trees", "nature", "peaceful"],
    ),
    SoundscapeLayerDef(
        id="astral_drone",
        name="Cosmic Harmonic Drone",
        category="drone",
        description="Deep meditative drone chord with subtle acoustic beating and warm sub-bass.",
        tags=["drone", "ambient", "meditation", "drone"],
    ),
]


class SoundscapeComposer:
    """Generates and blends curated CC0 ambient audio layers into a coherent soundscape."""

    SAMPLE_RATE = 22050

    @classmethod
    def synthesize_layer(cls, layer_id: str, duration_sec: float) -> List[float]:
        num_samples = int(cls.SAMPLE_RATE * duration_sec)
        samples = [0.0] * num_samples

        if layer_id == "wind_mountain":
            # Resonant filtered pink-like noise with slow LFO gusting
            state = 0.0
            lfo_phase = 0.0
            lfo_inc = 2.0 * math.pi * 0.15 / cls.SAMPLE_RATE
            for i in range(num_samples):
                white = random.uniform(-1.0, 1.0)
                state = 0.94 * state + 0.06 * white
                gust = 0.5 + 0.5 * math.sin(lfo_phase)
                samples[i] = state * gust * 1.5
                lfo_phase += lfo_inc

        elif layer_id == "rain_monsoon":
            # Soft continuous rain noise
            state1 = 0.0
            state2 = 0.0
            for i in range(num_samples):
                white = random.uniform(-1.0, 1.0)
                state1 = 0.85 * state1 + 0.15 * white
                state2 = 0.5 * state2 + 0.5 * state1
                samples[i] = state2 * 0.8

        elif layer_id == "temple_bells":
            # Chimes every 3.5 seconds with modal frequencies
            interval = int(3.5 * cls.SAMPLE_RATE)
            modal_freqs = [220.0, 440.0, 607.0, 882.0]
            decay_rates = [1.2, 1.8, 2.4, 3.2]

            for strike in range(0, num_samples, interval):
                for i in range(strike, min(strike + interval, num_samples)):
                    t = (i - strike) / cls.SAMPLE_RATE
                    env = math.exp(-1.5 * t)
                    v = 0.0
                    for freq, decay in zip(modal_freqs, decay_rates):
                        partial_env = math.exp(-decay * t)
                        v += 0.25 * partial_env * math.sin(2.0 * math.pi * freq * t)
                    samples[i] += v * env

        elif layer_id == "forest_dawn":
            # Leafy rustle + gentle intermittent chirps
            state = 0.0
            chirp_timer = 0
            chirp_len = int(0.25 * cls.SAMPLE_RATE)
            chirp_active = False
            chirp_start = 0

            for i in range(num_samples):
                # Gentle background rustle
                white = random.uniform(-1.0, 1.0)
                state = 0.92 * state + 0.08 * white
                samples[i] = state * 0.4

                # Random chirp trigger
                if not chirp_active and random.random() < (0.8 / cls.SAMPLE_RATE):
                    chirp_active = True
                    chirp_start = i

                if chirp_active:
                    ct = (i - chirp_start) / cls.SAMPLE_RATE
                    if i - chirp_start < chirp_len:
                        freq = 2400.0 + 800.0 * math.sin(2.0 * math.pi * 8.0 * ct)
                        c_env = math.sin(math.pi * (ct / 0.25))
                        samples[i] += 0.3 * c_env * math.sin(2.0 * math.pi * freq * ct)
                    else:
                        chirp_active = False

        elif layer_id == "astral_drone":
            # Meditative harmonic triad (110 Hz, 165 Hz, 220 Hz) with soft LFO chorus
            chord_freqs = [110.0, 165.0, 220.0, 330.0]
            weights = [0.4, 0.3, 0.2, 0.1]
            lfo = 0.0
            lfo_inc = 2.0 * math.pi * 0.2 / cls.SAMPLE_RATE
            for i in range(num_samples):
                t = i / cls.SAMPLE_RATE
                detune = 1.0 + 0.005 * math.sin(lfo)
                v = sum(w * math.sin(2.0 * math.pi * (f * detune) * t) for f, w in zip(chord_freqs, weights))
                samples[i] = v * 0.7
                lfo += lfo_inc

        # Fade in/out edges to prevent clicking
        fade_len = int(0.1 * cls.SAMPLE_RATE)
        for i in range(min(fade_len, num_samples)):
            factor = i / fade_len
            samples[i] *= factor
            samples[num_samples - 1 - i] *= factor

        return samples

    @classmethod
    def compose_soundscape(
        cls,
        layers: List[Dict[str, Any]],
        duration_sec: float = 15.0,
    ) -> bytes:
        """Mix multiple layers with individual volume weights into a valid PCM WAV payload."""
        duration_clamped = max(3.0, min(float(duration_sec), 60.0))
        num_samples = int(cls.SAMPLE_RATE * duration_clamped)
        mix_buffer = [0.0] * num_samples

        for layer in layers:
            layer_id = layer.get("id")
            volume = float(layer.get("volume", 0.7))
            if volume <= 0.0:
                continue
            raw_samples = cls.synthesize_layer(layer_id, duration_clamped)
            for i in range(num_samples):
                mix_buffer[i] += raw_samples[i] * volume

        # Master soft-knee limiter and normalization
        max_amp = max(abs(s) for s in mix_buffer) if mix_buffer else 1.0
        norm_factor = 0.85 / max_amp if max_amp > 0.85 else 1.0

        # Pack into standard PCM 16-bit mono WAV binary
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(cls.SAMPLE_RATE)
            int_samples = bytearray()
            for s in mix_buffer:
                val = int(max(-32767, min(32767, s * norm_factor * 32767)))
                int_samples.extend(struct.pack("<h", val))
            wf.writeframes(bytes(int_samples))

        return wav_buffer.getvalue()
