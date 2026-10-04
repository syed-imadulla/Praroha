# Requirements: Seed Unfold

**Defined:** 2026-10-04  
**Core Value:** One incomplete seed becomes structured intent, exactly three distinct creative worlds, a human-selected direction, and then a coherent persistent mini-universe whose evolution can be inspected and traced.

---

## v1 Requirements (MVP)

### Shell & Foundation (SHEL)
- [ ] **SHEL-01**: User opens a calm, dark content-first creative development workspace.
- [ ] **SHEL-02**: Frontend (React + Vite + TypeScript) communicates with backend (FastAPI) via typed API endpoints.
- [ ] **SHEL-03**: Backend uses AI Provider abstraction (`AIProvider`) allowing swappable LLM clients (Gemini default).

### Seed Understanding & Seed DNA (DNA)
- [ ] **DNA-01**: User enters a raw seed string (or loads the canonical demo seed).
- [ ] **DNA-02**: System validates seed input and prevents empty or malformed submissions.
- [ ] **DNA-03**: System extracts structured Seed DNA containing core premise, themes, entities, constraints, tone, and domain keywords.
- [ ] **DNA-04**: User can inspect extracted Seed DNA in an inspection panel.
- [ ] **DNA-05**: Original seed string is stored immutably and never silently altered.

### Three World Generation (WGEN)
- [ ] **WGEN-01**: Engine generates exactly three distinct world candidates (World A, World B, World C) from the Seed DNA.
- [ ] **WGEN-02**: Each world candidate contains title, concept logline, aesthetic mood, core conflict, and creative trade-offs.
- [ ] **WGEN-03**: World generation strictly adheres to Seed DNA constraints and themes.

### Human World Selection (HCHO)
- [ ] **HCHO-01**: UI displays the three world candidates in a side-by-side comparative layout.
- [ ] **HCHO-02**: Unfolding process halts until user explicitly selects one world candidate.
- [ ] **HCHO-03**: Selected world is highlighted, and its selection event is recorded in the traceability graph.

### Progressive World Unfolding (UNFL)
- [ ] **UNFL-01**: System progressively unfolds the selected world into a World Bible (physical laws, factions, history, canon facts).
- [ ] **UNFL-02**: System generates 2-4 core characters grounded in World Bible rules and Seed DNA constraints.
- [ ] **UNFL-03**: System maps relationship webs and socio-emotional tensions between generated characters.
- [ ] **UNFL-04**: System generates key scenes / narrative story beats featuring the characters within the world.
- [ ] **UNFL-05**: System optionally generates visual prompt descriptors / placeholder asset cards for key entities without blocking text generation.

### Traceability & Provenance (TRAC)
- [ ] **TRAC-01**: System records parent-child DAG relations (`derived_from`, `selected_by`, `constrained_by`, `appears_in`, `generated_for`) for every entity.
- [ ] **TRAC-02**: User can select any character, scene, or lore rule and view its provenance trail back to the root seed.
- [ ] **TRAC-03**: System provides human-intelligible explanations for why an entity exists without exposing raw model chain-of-thought tokens.

### Refine, Branch & Persistence (PERS)
- [ ] **PERS-01**: User can refine an individual component (e.g. adjust character traits or scene conflict) producing an auditable new version.
- [ ] **PERS-02**: User can branch from any stage or world candidate, creating a new exploratory timeline while preserving the original branch.
- [ ] **PERS-03**: User can save the full project state (seed, DNA, worlds, selected world, unfolded universe, trace DAG) and reload it.

### Reliability & Demo Resilience (DEMO)
- [ ] **DEMO-01**: System includes pre-baked deterministic fixtures for the canonical demo seed (*"A child discovers a forgotten city beneath the ocean"*).
- [ ] **DEMO-02**: If external LLM API is unavailable, throttled, or offline, system falls back gracefully to demo fixtures with user notification.

---

## v2 Requirements (Post-MVP)

### Multimodal Pipeline
- **MMOD-01**: Direct integration with image generation models (Imagen / Stable Diffusion) for high-res character and scene artwork.
- **MMOD-02**: Voice and audio mood generation via TTS / ambient audio APIs.
- **MMOD-03**: Short video prototype generation (Runway / Pika / VideoFX integration).

### Collaboration & Publishing
- **COLL-01**: Multi-user shared creative workspace with real-time presence.
- **PUBL-01**: Community world-bible explorer and export to EPUB / PDF / Game Engine formats.

---

## Out of Scope (Explicitly Excluded from MVP)

| Feature | Reason |
|---|---|
| Full movie / video rendering pipeline | Non-core to text-first story-world logic; high compute latency |
| Autonomous multi-agent swarm orchestration | Adds unpredictability and hallucination risks; human-in-the-loop is our core USP |
| External graph database (Neo4j / Memgraph) | Excessive infrastructure complexity; DAG in SQLite/JSON is fast and portable |
| User authentication / billing / subscriptions | Distraction from core hackathon creative engine and judging evaluation |
| Real-time multi-cursor collaboration | Unnecessary complexity for single-creator ideation and initial product validation |
