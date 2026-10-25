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
    SoundscapeLayerDef(
        id="submerged_dock",
        name="Submerged Docking Bay",
        category="water",
        description="Sub-aquatic low-frequency swell, distant resonant hull creaks, and oceanic pressure textures.",
        tags=["dock", "docking", "submerged", "underwater", "water", "ocean", "harbor", "port", "bay"],
    ),
    SoundscapeLayerDef(
        id="tense_pulse",
        name="Suspense Heartbeat & Tension Pulse",
        category="suspense",
        description="Subtle rhythmic sub-bass pulse with dark cinematic tension and brooding low tones.",
        tags=["tense", "dramatic", "suspense", "heartbeat", "pulse", "conflict", "danger", "dark", "forbidden"],
    ),
    SoundscapeLayerDef(
        id="cavern_ambience",
        name="Subterranean Cavern & Echoes",
        category="ambience",
        description="Distant subterranean acoustic echoes, stone resonance, and cavernous air currents.",
        tags=["cavern", "cave", "subterranean", "underground", "stone", "ruin", "forge"],
    ),
    SoundscapeLayerDef(
        id="cosmic_shimmer",
        name="Celestial Shimmer & Ethereal Resonance",
        category="ethereal",
        description="Airy high-register crystalline pads and ethereal harmonics.",
        tags=["mystic", "ethereal", "celestial", "shimmer", "stars", "cosmic", "astral", "crystal"],
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

        elif layer_id == "submerged_dock":
            # Deep aquatic low-frequency surge with slow tidal LFO (0.07 Hz) and distant resonant creaks
            state = 0.0
            lfo_phase = 0.0
            lfo_inc = 2.0 * math.pi * 0.07 / cls.SAMPLE_RATE
            for i in range(num_samples):
                white = random.uniform(-1.0, 1.0)
                state = 0.96 * state + 0.04 * white  # deep low-pass brown-like noise
                surge = 0.5 + 0.5 * math.sin(lfo_phase)
                samples[i] = state * surge * 2.2
                lfo_phase += lfo_inc
            # Distant resonant hull creaks every 4.0s
            creak_interval = int(4.0 * cls.SAMPLE_RATE)
            for strike in range(0, num_samples, creak_interval):
                decay_len = min(int(1.8 * cls.SAMPLE_RATE), num_samples - strike)
                for j in range(decay_len):
                    t = j / cls.SAMPLE_RATE
                    decay = math.exp(-2.2 * t)
                    samples[strike + j] += 0.25 * decay * math.sin(2.0 * math.pi * 174.0 * t)

        elif layer_id == "tense_pulse":
            # 48 BPM suspense heartbeat pulse (interval = 1.25s) with 65 Hz sub-bass decay over 55 Hz brooding drone
            pulse_interval = int(1.25 * cls.SAMPLE_RATE)
            drone_lfo = 0.0
            drone_lfo_inc = 2.0 * math.pi * 0.15 / cls.SAMPLE_RATE
            for i in range(num_samples):
                t = i / cls.SAMPLE_RATE
                detune = 1.0 + 0.003 * math.sin(drone_lfo)
                drone = 0.35 * math.sin(2.0 * math.pi * (55.0 * detune) * t)
                drone += 0.15 * math.sin(2.0 * math.pi * (82.5 * detune) * t)
                samples[i] = drone
                drone_lfo += drone_lfo_inc
            for strike in range(0, num_samples, pulse_interval):
                pulse_len = min(int(0.6 * cls.SAMPLE_RATE), num_samples - strike)
                for j in range(pulse_len):
                    t = j / cls.SAMPLE_RATE
                    env = math.exp(-7.0 * t)
                    samples[strike + j] += 0.5 * env * math.sin(2.0 * math.pi * 65.0 * t)

        elif layer_id == "cavern_ambience":
            # Low cavernous air current with sparse crystalline water drips
            state = 0.0
            for i in range(num_samples):
                white = random.uniform(-1.0, 1.0)
                state = 0.93 * state + 0.07 * white
                samples[i] = state * 0.45
            # Sparse drips every ~2.5s
            drip_interval = int(2.5 * cls.SAMPLE_RATE)
            for strike in range(int(0.8 * cls.SAMPLE_RATE), num_samples, drip_interval):
                drip_len = min(int(0.4 * cls.SAMPLE_RATE), num_samples - strike)
                for j in range(drip_len):
                    t = j / cls.SAMPLE_RATE
                    env = math.exp(-12.0 * t)
                    samples[strike + j] += 0.2 * env * math.sin(2.0 * math.pi * 1200.0 * t)

        elif layer_id == "cosmic_shimmer":
            # Ethereal high celestial triad (528 Hz, 660 Hz, 792 Hz) with gentle tremolo
            lfo = 0.0
            lfo_inc = 2.0 * math.pi * 0.3 / cls.SAMPLE_RATE
            for i in range(num_samples):
                t = i / cls.SAMPLE_RATE
                tremolo = 0.7 + 0.3 * math.sin(lfo)
                v = 0.15 * math.sin(2.0 * math.pi * 528.0 * t)
                v += 0.12 * math.sin(2.0 * math.pi * 660.0 * t)
                v += 0.08 * math.sin(2.0 * math.pi * 792.0 * t)
                samples[i] = v * tremolo
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

    @classmethod
    def select_layers_for_scene(
        cls,
        mood: str = "ambient",
        prompt: str = "",
        context: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Select matching acoustic layers based on mood, scene description, and environment."""
        text = f"{mood} {prompt}".lower()
        if context:
            ctx_text = f"{context.get('entity_type', '')} {context.get('entity_id', '')} {context.get('location_setting', '')} {context.get('title', '')}".lower()
            text = f"{text} {ctx_text}"

        scores: Dict[str, float] = {}

        # Thematic keyword mapping
        if any(w in text for w in ("dock", "docking", "submerged", "underwater", "ocean", "harbor", "port", "bay", "water", "sea")):
            scores["submerged_dock"] = 0.85
        if any(w in text for w in ("tense", "dramatic", "suspense", "danger", "conflict", "forbidden", "dark", "heartbeat", "pulse")):
            scores["tense_pulse"] = 0.80
        if any(w in text for w in ("rain", "monsoon", "storm", "wet", "downpour")):
            scores["rain_monsoon"] = 0.75
        if any(w in text for w in ("wind", "mountain", "alpine", "cliff", "gust", "breeze", "blizzard", "height")):
            scores["wind_mountain"] = 0.75
        if any(w in text for w in ("forest", "canopy", "woodland", "trees", "nature", "leaf", "leaves", "jungle")):
            scores["forest_dawn"] = 0.70
        if any(w in text for w in ("temple", "bells", "sacred", "bowl", "singing", "spiritual", "shrine", "ritual")):
            scores["temple_bells"] = 0.70
        if any(w in text for w in ("cavern", "cave", "subterranean", "underground", "basalt", "grotto", "forge")):
            scores["cavern_ambience"] = 0.75
        if any(w in text for w in ("mystic", "ethereal", "celestial", "shimmer", "stars", "cosmic", "astral", "crystal")):
            scores["cosmic_shimmer"] = 0.70
        if any(w in text for w in ("drone", "deep", "space", "resonance", "meditation", "ambient")):
            scores["astral_drone"] = 0.65

        # Mood-based defaults if few keywords matched
        clean_mood = mood.lower().strip()
        if clean_mood in ("tense-dramatic", "tense", "dramatic"):
            scores.setdefault("tense_pulse", 0.80)
            scores.setdefault("astral_drone", 0.40)
        elif clean_mood in ("serene-ambient", "serene", "ambient"):
            scores.setdefault("astral_drone", 0.65)
            scores.setdefault("forest_dawn", 0.45)
        elif clean_mood in ("mystic-ethereal", "mystic", "ethereal"):
            scores.setdefault("cosmic_shimmer", 0.65)
            scores.setdefault("temple_bells", 0.50)
        elif clean_mood in ("ominous-drone", "ominous"):
            scores.setdefault("astral_drone", 0.70)
            scores.setdefault("cavern_ambience", 0.55)
        elif clean_mood in ("epic-orchestral", "epic"):
            scores.setdefault("astral_drone", 0.70)
            scores.setdefault("tense_pulse", 0.60)
        else:
            scores.setdefault("astral_drone", 0.70)
            scores.setdefault("wind_mountain", 0.40)

        # Sort layers by score descending, take top 2 or 3
        sorted_layers = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]
        return [{"id": layer_id, "volume": round(weight, 2)} for layer_id, weight in sorted_layers]

    @classmethod
    def compose_procedural_soundscape(
        cls,
        mood: str = "ambient",
        prompt: str = "",
        duration_sec: float = 15.0,
        context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bytes, Dict[str, Any]]:
        """Procedurally synthesize ambient WAV audio tailored to mood, scene, and duration."""
        layers = cls.select_layers_for_scene(mood=mood, prompt=prompt, context=context)
        duration_clamped = max(3.0, min(float(duration_sec), 60.0))
        wav_bytes = cls.compose_soundscape(layers=layers, duration_sec=duration_clamped)

        metadata = {
            "resolved_provider": "procedural-soundscape",
            "provider_label": "Procedural Soundscape Composer",
            "is_synthetic": True,
            "is_procedural": True,
            "mood": mood,
            "duration_sec": int(duration_clamped),
            "layers": layers,
            "license": "CC0 1.0 Universal (Public Domain)",
            "generator": "PRAROHA Procedural Soundscape Composer",
        }
        return wav_bytes, metadata
