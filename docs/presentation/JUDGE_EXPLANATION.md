# Praroha: Comprehensive Judge Explanation

## 1. What Tattva did you select?
We selected **Theme 2 (Tattva 2): Forms hidden in formless** (*“Universes exist in a seed form, autonomously unfolds with initial agency. Forms hidden in formless.”*).

## 2. Why Tattva 2?
In Indian philosophy, the macrocosm is latent within the microcosm; a giant banyan tree already exists in unmanifest potential inside a tiny seed. In modern creative workflows, human ideas start as compact, formless thoughts. Tattva 2 poses the profound technical challenge of how an unmanifest creative seed can unfold into a visible, coherent universe while preserving its core identity.

## 3. What is Idea 1?
We selected **Idea 1 — Generative AI: “Seed → Tree / Word → Movie / Sound → Song”**.
The challenge asks: *“Start with a small prompt or input and generate a richer image, story, sound, video, or other output... The entire macro scale information was already there in the simple seed in an unmanifest form, just like the cosmos.”*

## 4. What problem are you solving?
Modern generative AI creates isolated fragments—an image here, a chat paragraph there, a sound snippet elsewhere. Turning a simple seed into a coherent creative universe currently requires repeated manual prompting across disjoint tools, resulting in hallucinated drift, contradictory lore, and a complete breakdown of causal continuity.

## 5. What is Praroha?
Praroha (Sanskrit for *“Sprout”* or *“Germination”*) is a specialized Seed-to-Universe creative engine. It takes a compact creative seed and progressively reveals the rich forms latent within it through structured Generative AI, human choice gates, relational world-building, and an auditable causal lineage DAG.

## 6. Where is Generative AI used?
Generative AI is applied at three key transformative junctions:
1. **Semantic Seed DNA Distillation (Stage 2)**: Extracting core premise, implicit themes, negative constraints, and tone.
2. **High-Contrast World Branching (Stage 3)**: Synthesizing exactly three divergent creative archetypes.
3. **Multi-Layer Universe Unfolding (Stage 5)**: Expanding the committed world into a 4-layer codex (World Bible, Characters, Relationships, Narrative Scenes) with cinematic visual prompts.

## 7. Which LLM are you using?
We use Google's **Gemini 3.5 Flash** (`gemini-3.5-flash`), interfaced via REST API with strict JSON schema response enforcement.

## 8. Why Gemini 3.5 Flash?
Gemini 3.5 Flash provides ultra-fast inference latency (< 1.5s), large context capacity, and state-of-the-art compliance with strict structured JSON schemas (`responseSchema` / `responseMimeType`), preventing hallucinated formats and malformed keys.

## 9. How do Live Mode, Canonical Demo, and Fallback differ?
- **Praroha supports a live Gemini + Supabase cloud pipeline for custom seeds, with deterministic fallback fixtures and local fallback paths for reliable demonstrations.**
- **True Live Generative Pipeline**: For custom audience prompts, Praroha can connect to the configured Gemini model through its `AIProvider` abstraction and persist application state through Supabase PostgreSQL and Supabase Storage when cloud mode is enabled.
- **Deterministic Canonical Demo**: A pre-compiled, verified universe fixture that exercises the same application data model, persistence flow, lineage system, and frontend rendering without depending on an external LLM during presentation.
- **Graceful Fallback**: If Gemini is unavailable, the application can gracefully use deterministic `MockProvider` fixtures. If cloud database/storage configuration is unavailable, the existing local fallback remains available.

## 10. What happens without an API key or during network throttling?
If `GEMINI_API_KEY` is not configured or rate-limited, the backend automatically and gracefully drops into **Mock Fallback Mode** (`MockProvider`). The user receives a clear visual notification in the UI (`AI Provider Throttled/Unavailable — Gracefully transitioned to deterministic mock fixtures`), and the application continues to run without crashing or throwing HTTP 500 errors.

## 11. What is the canonical demo mode?
For live competition evaluations, network latencies, API rate limits, or external outages can ruin a presentation. Praroha features a **Deterministic Canonical Demo**: a pre-compiled, verified universe fixture for our primary demo seed (*“A child discovers a forgotten city beneath the ocean”*). The **“🌟 Instant Full Universe (Demo)”** button hydrates all 7 stages in `< 500ms`, exercising the exact same relational data model and UI rendering without depending on an external LLM during presentation.

## 12. How does the seed become a universe?
Through our **7-stage unfolding pipeline**:
1. **Seed**: Formless input premise.
2. **Understand**: Distills structural Seed DNA.
3. **3 Worlds**: Generates 3 contrasting latent archetypes.
4. **Choose**: Human commits to one path and records creative rationale.
5. **Unfold**: Generates the multi-layer universe codex.
6. **Trace**: Maps every lore rule and character back to the seed via a DAG.
7. **Refine**: Evolve and branch the universe while preserving seed identity.

## 13. Where does human agency enter?
At **Stage 4 (The Choice Gate)**. Praroha strictly rejects autonomous AI runaway. The system halts after generating three world candidates and will not unlock downstream universe unfolding until the human creator chooses one direction and explicitly records their creative rationale.

## 14. How is the original seed preserved?
The original seed text and its distilled Seed DNA are stored as immutable root records in the relational database. During universe expansion, every generation prompt injects the original Seed DNA and negative constraints as immutable guardrails, preventing creative drift.

## 15. How does traceability work?
Praroha builds a topological **Causal Lineage DAG** (Directed Acyclic Graph). Every character, world rule, and scene stores explicit parent references (`derived_from`, `constrained_by`, `selected_by`, `refined_from`). Clicking any node in the UI highlights its exact causal ancestor trail back to the root seed, accompanied by plain-English explanations free of raw LLM reasoning tokens.

## 16. How is project data stored?
Structured domain state is stored in a relational database using **SQLModel** (SQLite for local zero-cloud development, PostgreSQL for production). Foreign keys enforce relational integrity across projects, seeds, candidates, bibles, cast members, relationships, scenes, and revision logs.

## 17. What is cloud storage?
Binary payloads, portable project bundles, and state snapshots are handled through the abstract [`StorageProvider`](../../backend/app/providers/storage.py). The system supports local filesystem storage (`LocalStorageProvider`) and cloud bucket storage (`SupabaseStorageProvider`).

## 18. What is currently implemented?
- 100% of the 7-stage unfolding pipeline.
- Structured text generation and Pydantic v2 validation.
- Interactive Multi-Lane Provenance DAG with zoom/pan and ancestor path illumination.
- Component refinement with immutable audit logs and version incrementing (`v1 -> v2`).
- Timeline branching with zero foreign key leakage.
- Portable Project Bundle export/import (`.json`) and storage snapshots.
- Self-explaining 7-Stage Guided Demo Tour and global keyboard shortcuts.

## 19. What is future scope?
- Direct rendering APIs for diffusion images (Imagen 3), audio/music (Suno/MusicLM), and video generation (Runway/Sora). Currently, Praroha generates production-ready visual prompt descriptors that can be copied with one click.
- Collaborative multi-user world building via WebSockets.
- Embedding-based semantic similarity search across historical world branches.

## 20. Why is this different from a normal AI prompt box?
A normal AI prompt box is an unstructured, forgetful text stream that hallucinates freely, forgets constraints, offers no choice gates, and cannot explain why an entity exists. Praroha is a **disciplined world-building system** that treats creative generation as a traceable, branchable, and verifiable unfolding process—embodying Tattva 2 by proving that an entire universe was already latent in the seed.
