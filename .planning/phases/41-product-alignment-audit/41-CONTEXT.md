# Phase 41 Context: Product Alignment & Technical Audit

## Philosophical Alignment
PRAROHA is anchored in **Tatva 2 — Seed to Universe: Forms Hidden in Formless**.
The seed is pure latent potential. It must not generate an unguided stream of generic text, but structured intent (Seed DNA) that branches into exactly three distinct possibilities (Familiar, Radical, Inverse), gives agency to human choice (Decision DNA), and progressively manifests into an auditable, persistent universe.

## Audit Baseline Objectives
Phase 41 establishes the empirical baseline for the entire Milestone 6 cycle without modifying application code or incurring paid API usage:

1. **Seed Interpretation & 3-World Divergence**:
   - Test Seed A: *"A silent monastery floating in the upper atmosphere of Venus"* (Sci-Fi / Solarpunk)
   - Test Seed B: *"A clockmaker realizes that whenever he repairs an antique timepiece, someone's forgotten memory is erased"* (Magical Realism / Drama)
   - Test Seed C: Canonical demo seed (*"A child discovers a forgotten city beneath the ocean"*)
   - Assess: Do the three generated worlds offer genuine conceptual contrast (Familiar vs Radical vs Inverse), or do they cluster around predictable tropes?

2. **Universe Entity Consistency**:
   - Audit the structural alignment across World Bible rules, character motivations, character relationships, and generated scenes.
   - Trace whether World Bible physics laws constrain scene conflict, or whether scenes introduce ad-hoc contradictions.

3. **Origin Trail & Provenance Accuracy**:
   - Verify that all generated nodes in `LineageService` carry valid `origin_type` (`SEED_EXPLICIT`, `SEED_INFERRED`, `HUMAN_DECISION`, `DERIVED`, `AI_INTRODUCED`, `USER_ADDED`).
   - Identify any orphaned nodes, broken edges, or missing parent-child links.

4. **Media Failure Modes & Credit Restrictions**:
   - Audit current responses from external media APIs: Pollinations, Edge-TTS, Stability AI (Stable Audio), Hugging Face (MusicGen/ACE-Step), Pixazo, and JSON2Video.
   - Catalog HTTP 401/402 credit exhaustion behavior, HTTP 429 rate limits, and provider fallback cascading.
   - Quantify redundant generation requests caused by un-cached identical dispatch calls.
