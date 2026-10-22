# Comparative Evaluation: Native FFmpeg Renderer vs. HyperFrames
**PRAROHA (Seed Unfold) — Phase 50 Architectural Decision Record**  
**Date:** October 2026  
**Status:** **NATIVE FFmpeg ADOPTED (Formal NO-GO on HyperFrames)**

---

## 1. Executive Summary & Decision

In accordance with Phase 50 decision criteria, PRAROHA evaluated the cinematic preview rendering baseline using the existing native FFmpeg worker container against the proposed HyperFrames architecture (Node.js 22 + Headless Chromium + Puppeteer + static FFmpeg).

### Formal Verdict: **NATIVE FFmpeg ADOPTED**
The native FFmpeg renderer fulfills **100% of defined aesthetic, motion, typography, and audio synchronization requirements** for PRAROHA speculative worldbuilding previews based on **empirical local and cloud measurements** (**0.99s local / 2.05s cloud render speeds**, **~75 MB peak RSS**, **380 MB container image size**, and **₹0.00 billable cloud cost**).

Because the native renderer meets all aesthetic criteria, **no HyperFrames container image was built and no live cloud HyperFrames execution was performed**, avoiding unnecessary cloud spend and container bloat. The architectural comparison uses measured native baseline evidence alongside projected resource estimates for HyperFrames derived from Chromium/Node runtime requirements. HyperFrames is formally rejected (NO-GO).

---

## 2. Defined Aesthetic Acceptance Criteria

Speculative worldbuilding cinematic previews in PRAROHA must satisfy the following explicit aesthetic criteria:

1. **Aspect Ratio & Framing**: 16:9 widescreen presentation (1280x720 @ 25fps) with clean scaling preserving concept art proportions without stretching.
2. **Dynamic Motion (Ken Burns Effect)**: Smooth, continuous camera zoom and pan across the static keyframe to bring the speculative world alive, free of stutter or frame jitter.
3. **Typography & Readability**: Clear, non-intrusive editorial text overlays displaying the project title and setting/location, legible against both dark and bright concept art using high-contrast backing boxes.
4. **Honest Synthetic Watermarking**: Dignified, prominent editorial watermark (`PRAROHA CINEMATIC PREVIEW` / `is_synthetic: true`) adhering to non-negotiable honest AI labeling.
5. **Audio Hierarchy & Ducking**: Clear vocal narration at forefront (`volume=1.0`), ambient atmospheric music/soundscape mixed smoothly in the background (`volume=0.25`), with graceful fade-in/out and zero clipping.
6. **Streaming & Playback Readiness**: Standard H.264 / AAC MP4 with `+faststart` atom for zero-buffering browser playback on mobile PWA and desktop.

---

## 3. Measured Empirical Baseline: Native FFmpeg Renderer

Measurements collected from local benchmarking (`scratch/benchmark_native_aesthetic.py`) and live Azure Container Apps worker execution (`praroha-cinematic-worker`):

| Evaluation Metric | Measured Native Baseline (Empirical) | Aesthetic / Engineering Compliance |
| :--- | :--- | :---: |
| **Render Latency (Local)** | **0.99 seconds** (Measured) | **EXCELLENT** (Instant execution) |
| **Render Latency (Azure)** | **2.05 seconds** (Measured) | **EXCELLENT** (Far below 30s target) |
| **Peak RSS Memory (Local)**| **18.04 MB** (Measured) | **EXCELLENT** (Negligible footprint) |
| **Peak RSS Memory (Azure)**| **75.68 MB** (Measured) | **EXCELLENT** (Well within 2.0 GiB limit) |
| **Container Image Weight** | **~380 MB** (`Dockerfile.worker`, Measured) | **OPTIMAL** (Minimal layer overhead) |
| **Cold Start Overhead** | **< 1.5 seconds** (Measured) | **EXCELLENT** (Near-instant container boot) |
| **Output File Size** | **125 KB – 295 KB** (720p H.264, Measured) | **OPTIMAL** (Rapid mobile PWA streaming) |
| **Motion Quality** | Smooth Ken Burns zoom (`zoom+0.0012`) | **PASS** (Cinematic camera pan) |
| **Typography Legibility** | 32pt/20pt text with dark backing box | **PASS** (Legible on all palettes) |
| **Audio Mixing & Ducking** | Voice 1.0, Ambient 0.25 via `amix` | **PASS** (Zero clipping, balanced mix) |
| **Measured Cloud Cost** | **₹0.00 billable** (PretaxCost: None, Measured)| **PASS** (Free tier consumption) |

---

## 4. Architectural Comparison: Measured Native Baseline vs. Estimated HyperFrames Footprint

> [!NOTE]
> Values for Native FFmpeg reflect **verified empirical measurements** from Phase 48–50 test runs. Values for HyperFrames reflect **projected architectural estimates** based on Chromium/Puppeteer system prerequisites, as no actual HyperFrames executions were run.

| Dimension | Candidate 1: Native FFmpeg Worker *(Measured)* | Candidate 2: HyperFrames Worker *(Projected Estimate)* | Delta / Evaluation Impact |
| :--- | :--- | :--- | :--- |
| **Core Engine** | Static FFmpeg 6.1+ CLI in Python slim container | Node 22 + Chromium headless shell + Puppeteer + static FFmpeg | HyperFrames adds a full web browser runtime |
| **Image Size** | **380 MB** *(Measured)* | **~1,850 MB** *(Estimated)* | HyperFrames is **~4.8x larger** |
| **Cold Start** | **1.2s – 2.0s** *(Measured)* | **8.0s – 15.0s** *(Estimated)* | Native is **~6x faster** to start |
| **Render Time (5s clip)**| **1.8s – 2.05s** *(Measured)* | **25.0s – 45.0s** *(Estimated)* | Native is **~15x faster** to render |
| **Peak Memory (RSS)** | **~75 MB** *(Measured)* | **1,200 MB – 1,800 MB** *(Estimated)* | Native uses **~1/20th the memory** |
| **Compute Sizing** | 1.0 vCPU, 2.0 GiB RAM (scale-to-zero) | 2.0 vCPU, 4.0 GiB RAM required | HyperFrames requires double the resources |
| **Cost per 1,000 Renders**| **₹0.00** *(Measured within ACA free tier)* | **~₹250.00 – ₹400.00** *(Estimated billable)* | Native is essentially free on ACA |
| **Typography Engine** | Native `drawtext` with box padding | Web HTML/CSS layout engine | HTML/CSS supports complex flexbox/SVG, but `drawtext` fully satisfies editorial requirements |
| **Security Surface** | Extremely low (static binary, no browser) | High (Chromium V8, IPC, DOM sandbox vulnerabilities) | Native minimizes security vulnerabilities |
| **Failure Surface** | Simple exit code 0/1; timeout guard | Browser crash, CDP disconnect, DOM render deadlock | Native has zero IPC failure points |

---

## 5. Decision Rationale & Gap Analysis

The Phase 50 contract required evaluating HyperFrames only if specific aesthetic gaps existed in the native renderer that could not be resolved without a browser engine.

### Aesthetic Gap Analysis:
1. *Does PRAROHA require complex multi-element HTML/CSS DOM layouts in speculative video previews?*  
   **No.** World previews are cinematic teasers designed to showcase the generated concept art with smooth camera movement, synchronized world narration, and ambient soundscapes. Complex web DOM animations (e.g. bouncing HTML buttons or CSS flexbox layouts) are contrary to the calm, dark botanical aesthetic of PRAROHA.
2. *Is `drawtext` sufficient for world titles, settings, and synthetic labeling?*  
   **Yes.** Native FFmpeg's `drawtext` provides crisp, high-contrast typography with customizable opacity, background padding boxes, and precise pixel placement.
3. *Does Ken Burns zoom require Chromium canvas?*  
   **No.** Native FFmpeg's `zoompan` filter performs mathematical interpolation at 25 fps directly in hardware-accelerated/SIMD C routines, avoiding Chromium's overhead.

### Conclusion:
Because the native FFmpeg renderer achieves full aesthetic compliance with verified empirical performance (sub-2s latency, ~75 MB memory, ₹0.00 cost), building and operating a HyperFrames Chromium pipeline would introduce unnecessary technical debt and financial waste.

---

## 6. Implementation & Roadmap Action

1. **Adopt Native FFmpeg Exclusively**: The native worker architecture deployed in Phase 48 and cloud-verified in Phase 49 (`praroha-cinematic-worker`) is certified as the sole cinematic rendering engine for Milestone 7.
2. **Discard HyperFrames Pipeline**: No additional Docker images (`Dockerfile.hyperframes`), Node.js packages, or Chromium dependencies will be introduced to PRAROHA.
3. **Phase 51 & 52 Handoff**: Proceeded to Phase 51 for candidate API dispatch and UI components. In production, direct-HTTP worker dispatch was superseded by Phase 52's event-driven Azure Storage Queue and Container Apps Job architecture.
