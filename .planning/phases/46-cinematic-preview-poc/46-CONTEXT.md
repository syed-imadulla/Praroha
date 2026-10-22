# Phase 46 Context: Cinematic Preview Proof of Concept

## Context & The Video Generation Landscape
Video generation models in late 2024/2026 fall into two distinct categories:
1. **Diffusion Video Models (e.g. Wan2.1, SkyReels, Pyramid Flow, Seedance)**:
   - High compute requirements: 24GB to 80GB VRAM GPUs, high cost per second of video, long latency (30s to 3 minutes per generation).
   - Impractical to run natively on Azure Container Apps (0.5 vCPU, 1.0 GiB RAM).
2. **Programmatic / Code-Driven Composition (e.g. HyperFrames, JSON2Video)**:
   - Assembles existing high-resolution concept art, character portraits, dynamic kinetic typography, ambient audio tracks, and Edge-TTS voiceovers into a cinematic motion-graphics preview.
   - Low latency, high reliability, deterministic output, very low cost.

## Evaluation Mandate: HyperFrames
HyperFrames provides a code-driven web-standards rendering engine (Node.js, Canvas, Chromium headless, FFmpeg).
In Phase 46, we evaluate:
- **Licensing**: Verify open-source license compatibility (MIT/Apache 2.0).
- **Resource Footprint**: Chromium + Node + FFmpeg rendering can easily exceed 1.0 GiB of RAM if unconstrained.
- **Worker Isolation**: If viable, it must be deployed as an isolated sidecar or standalone worker, NOT bundled inside the core FastAPI web process where it could OOM the API.
- **Baseline Preservation**: JSON2Video MUST remain the verified, operational baseline.
- **Honest Labeling**: Programmatic previews must ALWAYS carry `[Synthetic Preview]` or `[Cinematic Motion Preview]` badges, and NEVER be dishonestly marketed as raw generative AI video.
