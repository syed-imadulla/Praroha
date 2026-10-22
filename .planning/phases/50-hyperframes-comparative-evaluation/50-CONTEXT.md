# Phase 50 Context: HyperFrames Comparative Evaluation & Decision Gate

## 1. Context & Hypothesis
- HyperFrames provides HTML/CSS/Canvas-driven programmatic video rendering via Puppeteer and Chromium Headless Shell.
- In Phase 46, we observed its resource requirements (1.2–2.5 GiB RAM, 2–4 vCPU, ~1.8 GB container image).
- **Hypothesis**: If the native FFmpeg composer (Phase 48 & 49) already provides high-quality Ken Burns motion, typography overlays, synchronized speech, and ducked audio at 1.85s render time and 410 MB memory, then the significant overhead of Chromium, Node 22, and 20+ Debian graphics libraries in HyperFrames may not be justified.

## 2. Evaluation Scope
- Build an isolated prototype container for HyperFrames (`Dockerfile.hyperframes`).
- Measure image build size, cold-start latency, memory overhead, and render duration.
- Construct a side-by-side comparative matrix against the native FFmpeg composer.
- Formal Decision Gate: Recommend whether to (A) Adopt Native FFmpeg as the sole production engine, or (B) Support HyperFrames as an optional advanced engine.
