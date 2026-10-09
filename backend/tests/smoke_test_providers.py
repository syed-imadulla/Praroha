import asyncio
import os
import time
from typing import Dict, Any

from backend.app.config import settings
from backend.app.providers.media.pollinations import PollinationsImageProvider
from backend.app.providers.media.edge_tts import EdgeTTSProvider
from backend.app.providers.media.stable_audio import StableAudioOpenProvider
from backend.app.providers.media.ace_step import ACEStepAudioProvider
from backend.app.providers.media.base import ProviderUnavailableError
from backend.app.providers.gemini_provider import GeminiProvider


async def run_smoke_tests():
    print("==================================================================")
    print("PRAROHA — REAL PROVIDER SMOKE TEST MATRIX")
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
            tone = dna.get("tone", "") if isinstance(dna, dict) else getattr(dna, "tone", "")
            keywords = dna.get("domain_keywords", []) if isinstance(dna, dict) else getattr(dna, "domain_keywords", [])
            print(f"   PASS: Seed DNA extracted ({latency}ms). Premise: '{premise[:50]}...'")
            results.append({
                "provider": "Gemini (Flash)",
                "modality": "text / reasoning",
                "configured": True,
                "status": "VERIFIED",
                "latency_ms": latency,
                "notes": f"Generated premise, tone='{tone}', {len(keywords)} keywords",
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
            "status": "BLOCKED",
            "latency_ms": 0,
            "notes": "GEMINI_API_KEY missing",
        })

    # 2. Pollinations (Image Generation)
    has_pollinations_key = bool(settings.POLLINATIONS_API_KEY)
    print(f"\n2. Pollinations Image Provider: configured={True} (api_key_set={has_pollinations_key})")
    t0 = time.time()
    try:
        pollinations = PollinationsImageProvider()
        img_payload = await pollinations.generate_image("A bioluminescent deep ocean lotus", aspect_ratio="1:1")
        latency = round((time.time() - t0) * 1000)
        is_jpeg = img_payload.data.startswith(b"\xff\xd8")
        print(f"   PASS: Image generated ({latency}ms). Bytes={len(img_payload.data)}, MIME={img_payload.mime_type}, ValidJPEG={is_jpeg}")
        results.append({
            "provider": "Pollinations.ai",
            "modality": "image",
            "configured": True,
            "status": "VERIFIED",
            "latency_ms": latency,
            "notes": f"{img_payload.mime_type}, {len(img_payload.data)} bytes, model={img_payload.metadata.get('model')}",
        })
    except ProviderUnavailableError as pue:
        latency = round((time.time() - t0) * 1000)
        print(f"   BLOCKED: Pollinations unavailable ({latency}ms): {pue}")
        results.append({
            "provider": "Pollinations.ai",
            "modality": "image",
            "configured": True,
            "status": "BLOCKED",
            "latency_ms": latency,
            "notes": str(pue),
        })
    except Exception as e:
        latency = round((time.time() - t0) * 1000)
        print(f"   FAIL: Pollinations error ({latency}ms): {e}")
        results.append({
            "provider": "Pollinations.ai",
            "modality": "image",
            "configured": True,
            "status": "FAILED",
            "latency_ms": latency,
            "notes": str(e),
        })

    # 3. Edge-TTS (Voice & Narration)
    print(f"\n3. Edge-TTS Voice Provider: configured=True (Zero-key neural engine)")
    t0 = time.time()
    try:
        edge = EdgeTTSProvider()
        voice_payload = await edge.generate_voice("Navigation coordinates locked. We enter the trench.", voice_id="protagonist-resolute")
        latency = round((time.time() - t0) * 1000)
        is_mp3 = voice_payload.data.startswith(b"ID3") or voice_payload.data[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")
        print(f"   PASS: Speech synthesized ({latency}ms). Bytes={len(voice_payload.data)}, MIME={voice_payload.mime_type}, ValidMP3={is_mp3}")
        results.append({
            "provider": "Edge-TTS (Microsoft)",
            "modality": "voice / speech",
            "configured": True,
            "status": "VERIFIED",
            "latency_ms": latency,
            "notes": f"{voice_payload.metadata.get('voice_id')}, {len(voice_payload.data)} bytes, ~{voice_payload.metadata.get('duration_sec')}s",
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

    # 4. Stability AI Stable Audio (Atmosphere soundscapes)
    has_stability = bool(settings.STABILITY_API_KEY)
    print(f"\n4. Stability AI Stable Audio: configured={has_stability}")
    t0 = time.time()
    try:
        stable_audio = StableAudioOpenProvider()
        audio_payload = await stable_audio.generate_audio("Deep underwater metallic groan, slow rhythmic current pulse", mood="tense-dramatic", duration_sec=10)
        latency = round((time.time() - t0) * 1000)
        print(f"   PASS: Stable Audio generated ({latency}ms). Bytes={len(audio_payload.data)}")
        results.append({
            "provider": "Stability AI (Stable Audio 2)",
            "modality": "audio / atmosphere",
            "configured": has_stability,
            "status": "VERIFIED",
            "latency_ms": latency,
            "notes": f"Audio generated, {len(audio_payload.data)} bytes",
        })
    except ProviderUnavailableError as pue:
        latency = round((time.time() - t0) * 1000)
        print(f"   BLOCKED: Stable Audio ({latency}ms): {pue}")
        results.append({
            "provider": "Stability AI (Stable Audio 2)",
            "modality": "audio / atmosphere",
            "configured": has_stability,
            "status": "BLOCKED",
            "latency_ms": latency,
            "notes": str(pue),
        })
    except Exception as e:
        latency = round((time.time() - t0) * 1000)
        print(f"   FAIL: Stable Audio error ({latency}ms): {e}")
        results.append({
            "provider": "Stability AI (Stable Audio 2)",
            "modality": "audio / atmosphere",
            "configured": has_stability,
            "status": "FAILED",
            "latency_ms": latency,
            "notes": str(e),
        })

    # 5. Hugging Face ACE-Step / MusicGen
    has_hf = bool(settings.HF_TOKEN or settings.ACE_STEP_ENDPOINT)
    print(f"\n5. Hugging Face / ACE-Step Audio: configured={has_hf}")
    t0 = time.time()
    try:
        ace = ACEStepAudioProvider()
        ace_payload = await ace.generate_audio("Ethereal cavernous echoes", mood="calm-ambient", duration_sec=10)
        latency = round((time.time() - t0) * 1000)
        print(f"   PASS: ACE-Step generated ({latency}ms). Bytes={len(ace_payload.data)}")
        results.append({
            "provider": "Hugging Face (ACE-Step / MusicGen)",
            "modality": "audio / atmosphere",
            "configured": has_hf,
            "status": "VERIFIED",
            "latency_ms": latency,
            "notes": f"Audio generated, {len(ace_payload.data)} bytes",
        })
    except ProviderUnavailableError as pue:
        latency = round((time.time() - t0) * 1000)
        print(f"   BLOCKED: ACE-Step ({latency}ms): {pue}")
        results.append({
            "provider": "Hugging Face (ACE-Step / MusicGen)",
            "modality": "audio / atmosphere",
            "configured": has_hf,
            "status": "BLOCKED",
            "latency_ms": latency,
            "notes": str(pue),
        })
    except Exception as e:
        latency = round((time.time() - t0) * 1000)
        print(f"   FAIL: ACE-Step error ({latency}ms): {e}")
        results.append({
            "provider": "Hugging Face (ACE-Step / MusicGen)",
            "modality": "audio / atmosphere",
            "configured": has_hf,
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
