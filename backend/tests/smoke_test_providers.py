import asyncio
import os
import time
from typing import Dict, Any

from backend.app.config import settings
from backend.app.providers.media.pollinations import PollinationsImageProvider
from backend.app.providers.media.edge_tts import EdgeTTSProvider
from backend.app.services.soundscape_library import SoundscapeComposer
from backend.app.providers.media.base import ProviderUnavailableError
from backend.app.providers.gemini_provider import GeminiProvider


async def run_smoke_tests():
    print("==================================================================")
    print("PRAROHA — OPERATIONAL PROVIDER SMOKE TEST MATRIX")
    print("==================================================================\n")

    results = []

    # 1. Gemini AI Provider (Text / Seed DNA / Worlds)
    has_gemini = bool(settings.GEMINI_API_KEY)
    print(f"1. Gemini Flash Text Provider: configured={has_gemini}")
    if has_gemini:
        t0 = time.time()
        try:
            gemini = GeminiProvider(api_key=settings.GEMINI_API_KEY)
            dna = await gemini.extract_dna("A migratory city on the backs of giant oceanic turtles.")
            latency = round((time.time() - t0) * 1000)
            premise = dna.get("premise", "") if isinstance(dna, dict) else getattr(dna, "premise", "")
            print(f"   PASS: Seed DNA extracted ({latency}ms). Premise: '{premise[:50]}...'")
            results.append({
                "provider": "Gemini (Flash)",
                "modality": "text / reasoning",
                "configured": True,
                "status": "VERIFIED",
                "latency_ms": latency,
                "notes": f"Premise: {premise[:40]}...",
            })
        except Exception as e:
            latency = round((time.time() - t0) * 1000)
            print(f"   FAIL: Gemini error ({latency}ms): {e}")
            results.append({
                "provider": "Gemini (Flash)",
                "modality": "text / reasoning",
                "configured": True,
                "status": "FAILED",
                "latency_ms": latency,
                "notes": str(e),
            })
    else:
        results.append({
            "provider": "Gemini (Flash)",
            "modality": "text / reasoning",
            "configured": False,
            "status": "UNCONFIGURED",
            "latency_ms": 0,
            "notes": "GEMINI_API_KEY missing from .env",
        })

    # 2. Pollinations Image Generation (Free Tier / Flux)
    print("\n2. Pollinations Image Generation (Free tier / Flux):")
    t0 = time.time()
    try:
        pollinations = PollinationsImageProvider()
        img_payload = await pollinations.generate_image(
            "An ethereal temple carved from glowing emerald jade, photorealistic concept art",
            aspect_ratio="16:9",
        )
        latency = round((time.time() - t0) * 1000)
        print(f"   PASS: Pollinations returned image ({latency}ms). Bytes={len(img_payload.data)}")
        results.append({
            "provider": "Pollinations (Flux)",
            "modality": "image / concept art",
            "configured": True,
            "status": "VERIFIED",
            "latency_ms": latency,
            "notes": f"Image generated, {len(img_payload.data)} bytes",
        })
    except Exception as e:
        latency = round((time.time() - t0) * 1000)
        print(f"   FAIL: Pollinations error ({latency}ms): {e}")
        results.append({
            "provider": "Pollinations (Flux)",
            "modality": "image / concept art",
            "configured": True,
            "status": "FAILED",
            "latency_ms": latency,
            "notes": str(e),
        })

    # 3. Microsoft Edge-TTS (Voice / Speech)
    print("\n3. Microsoft Edge-TTS Voice Generation (neural audio):")
    t0 = time.time()
    try:
        edge = EdgeTTSProvider()
        voice_payload = await edge.generate_voice(
            "From the primeval stillness, form arose out of the formless waters.",
            voice_id="the_chronicler",
        )
        latency = round((time.time() - t0) * 1000)
        print(f"   PASS: Edge-TTS synthesized voice ({latency}ms). Bytes={len(voice_payload.data)}")
        results.append({
            "provider": "Edge-TTS (Microsoft)",
            "modality": "voice / speech",
            "configured": True,
            "status": "VERIFIED",
            "latency_ms": latency,
            "notes": f"Audio synthesized, {len(voice_payload.data)} bytes",
        })
    except Exception as e:
        latency = round((time.time() - t0) * 1000)
        print(f"   FAIL: Edge-TTS error ({latency}ms): {e}")
        results.append({
            "provider": "Edge-TTS (Microsoft)",
            "modality": "voice / speech",
            "configured": True,
            "status": "FAILED",
            "latency_ms": latency,
            "notes": str(e),
        })

    # 4. Procedural Soundscape Composer (Multi-track Ambient Synthesis)
    print("\n4. Procedural Soundscape Composer (Built-in CC0 Audio):")
    t0 = time.time()
    try:
        composer = SoundscapeComposer()
        soundscape = composer.compose_soundscape(
            mood="deep_space",
            duration_sec=5.0,
            track_keys=["drone_low", "wind_whistle"],
        )
        latency = round((time.time() - t0) * 1000)
        print(f"   PASS: Soundscape synthesized ({latency}ms). Bytes={len(soundscape.wav_bytes)}")
        results.append({
            "provider": "SoundscapeComposer (Built-in)",
            "modality": "audio / atmosphere",
            "configured": True,
            "status": "VERIFIED",
            "latency_ms": latency,
            "notes": f"Soundscape synthesized, {len(soundscape.wav_bytes)} bytes",
        })
    except Exception as e:
        latency = round((time.time() - t0) * 1000)
        print(f"   FAIL: Soundscape Composer error ({latency}ms): {e}")
        results.append({
            "provider": "SoundscapeComposer (Built-in)",
            "modality": "audio / atmosphere",
            "configured": True,
            "status": "FAILED",
            "latency_ms": latency,
            "notes": str(e),
        })

    print("\n==================================================================")
    print("SMOKE TEST SUMMARY MATRIX")
    print("==================================================================")
    for r in results:
        print(f"[{r['status']:<8}] {r['provider']:<32} | {r['modality']:<18} | {r['latency_ms']}ms | {r['notes']}")
    print("==================================================================\n")
    return results


if __name__ == "__main__":
    asyncio.run(run_smoke_tests())
