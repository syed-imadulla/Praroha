# Phase 48 Context: Dedicated Worker Architecture & Local Prototype

## 1. Background & Credit Reassessment
- **Azure Education Balance**: ~₹8,711 remaining (valid through September 26, 2027; ₹952.03 current October spend).
- **Core Principle**: Decouple video rendering from the primary FastAPI web application (0.5 vCPU, 1.0 GiB RAM) to guarantee 0 OOM risk and protect web server responsiveness.
- **Renderer Selection**: Native FFmpeg composer (`backend/app/services/cinematic_preview.py`) is the primary candidate. Local benchmarks demonstrated a 12s 720p MP4 renders in 1.85s (410 MB peak RSS, 750 KB file size).

## 2. Phase 48 Scope
- Audit existing `GenerationJob` and `MediaAssetRecord` database models for preview workflow suitability.
- Design and author a minimal `Dockerfile.worker` based on `python:3.11-slim` with pinned `ffmpeg` and no web framework.
- Implement standalone worker CLI entrypoint (`backend/app/workers/cinematic_worker.py`) that accepts a job ID or specification, fetches source media, renders the MP4, uploads to Supabase Storage, and updates database records.
- Benchmark the worker container locally with Docker/Python using existing assets without making paid generative AI calls.
- Enforce strict metadata tagging: `is_synthetic: true` and `provider_label: "Cinematic Preview"`.
