import math
import pytest
from backend.app.services.soundscape_library import (
    CURATED_SOUNDSCAPE_LAYERS,
    SoundscapeComposer,
)


def test_soundscape_library_metadata_and_licenses():
    """Verify all soundscape layers have valid CC0 licenses and descriptions."""
    assert len(CURATED_SOUNDSCAPE_LAYERS) >= 5
    ids = {layer.id for layer in CURATED_SOUNDSCAPE_LAYERS}
    assert "wind_mountain" in ids
    assert "rain_monsoon" in ids
    assert "temple_bells" in ids
    assert "forest_dawn" in ids
    assert "astral_drone" in ids

    for layer in CURATED_SOUNDSCAPE_LAYERS:
        assert "CC0" in layer.license
        assert layer.name
        assert layer.description
        assert layer.category


def test_soundscape_layer_synthesis():
    """Verify acoustic synthesis produces valid non-empty audio samples with no NaN/Inf."""
    for layer in CURATED_SOUNDSCAPE_LAYERS:
        samples = SoundscapeComposer.synthesize_layer(layer.id, duration_sec=2.0)
        assert len(samples) == int(SoundscapeComposer.SAMPLE_RATE * 2.0)
        assert all(isinstance(s, float) for s in samples)
        assert all(not math.isnan(s) and not math.isinf(s) for s in samples)
        # Verify edge fade-in / fade-out (first sample should be 0.0)
        assert abs(samples[0]) < 1e-4
        assert abs(samples[-1]) < 1e-4


def test_soundscape_composition_wav_packing():
    """Verify multi-layer blending generates a valid standard PCM WAV binary."""
    layers = [
        {"id": "temple_bells", "volume": 0.8},
        {"id": "wind_mountain", "volume": 0.4},
        {"id": "astral_drone", "volume": 0.3},
    ]
    wav_bytes = SoundscapeComposer.compose_soundscape(layers=layers, duration_sec=3.0)
    assert len(wav_bytes) > 44
    assert wav_bytes[:4] == b"RIFF"
    assert wav_bytes[8:12] == b"WAVE"
    assert wav_bytes[12:16] == b"fmt "
