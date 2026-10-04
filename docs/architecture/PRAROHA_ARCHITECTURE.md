# Praroha Master Architecture: Tattva 2 & Idea 1

## Philosophical Foundation
- **Theme / Tattva**: Tattva 2 — *“Forms hidden in formless”*  
  *(“Universes exist in a seed form, autonomously unfolds with initial agency.”)*
- **Selected Idea**: Idea 1 — *Generative AI: “Seed → Tree / Word → Movie / Sound → Song”*
- **Core Mission**: Take a compact creative seed and progressively reveal the rich forms contained within it through structured Generative AI, human choice, and traceable unfolding.

---

## 1. Conceptual Unfolding Pipeline

The 7 product stages are the **internal execution pipeline** through which Praroha demonstrates Tattva 2:

```
                          TATTVA 2
                  FORMS HIDDEN IN FORMLESS
                             │
                             ▼
                     CREATIVE SEED
            (Stage 1: Formless Potential)
                             │
                             ▼
                    Seed Understanding
                             │
                             ▼
                        SEED DNA
            (Stage 2: Distilling Hidden Rules)
                             │
                             ▼
                 3 Latent Manifestations
            (Stage 3: 3 Contrasting Archetypes)
                             │
                             ▼
                    HUMAN CHOICE GATE
            (Stage 4: Initial Agency & Commitment)
                             │
                             ▼
                  Progressive Unfolding
            (Stage 5: Unfolding Selected Form)
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
          World Bible   Characters      Scenes
          (Canon Laws)   (Grounded)   (Story Beats)
               │             │             │
               └─────────────┼─────────────┘
                             ▼
                     CONNECTED CODEX
                             │
                             ▼
                     TRACEABILITY DAG
            (Stage 6: Provenance Back to Seed)
                             │
                             ▼
                  REFINEMENT & BRANCHING
            (Stage 7: Evolution with Continuity)
```

---

## 2. Technical System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT INTERFACE                              │
│                    React 18 + TypeScript + Vite                         │
│  - StageProgressHeader (7-Stage Navigation)                             │
│  - SeedInputCanvas (Stage 1 Seed Capture & Canonical Presets)           │
│  - SeedDNACanvas (Stage 2 Semantic DNA Inspection)                      │
│  - WorldBranchesCanvas (Stage 3 Archetype Carousel)                     │
│  - ChoiceGateCanvas (Stage 4 Human Rationale Commitment)                │
│  - UniverseCodexCanvas (Stage 5 World Bible, Characters, Scenes)        │
│  - TraceabilityCanvas (Stage 6 Multi-Lane Interactive DAG with Zoom)    │
│  - RefineCanvas (Stage 7 Versioned Refinement & Branch Switcher)        │
│  - GuidedTourOverlay (Self-Explaining Tattva 2 Demo Tour)               │
│  - KeyboardShortcutsModal (Power-User Keycap Navigation)                │
│  - Zustand Global Workspace Store (`workspaceStore.ts`)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST API (JSON)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND ENGINE                                │
│                     FastAPI + Python 3.12+                              │
│  - Routers: /projects, /dna, /worlds, /selection, /unfold, /lineage     │
│  - Middleware: CORS, Validation Exception Handlers, State Guards        │
└───────┬────────────────────────────┬────────────────────────────┬───────┘
        │                            │                            │
        ▼                            ▼                            ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌───────────────────┐
│     AI PROVIDER      │   │   DATABASE LAYER     │   │ STORAGE PROVIDER  │
│  (Abstract Factory)  │   │  (SQLModel / ORM)    │   │ (Abstract Storage)│
├──────────────────────┤   ├──────────────────────┤   ├───────────────────┤
│ • GeminiProvider     │   │ • SQLite (Dev/Demo)  │   │ • LocalStorage    │
│   (gemini-3.5-flash) │   │ • PostgreSQL (Prod)  │   │   (./uploads/)    │
│ • MockProvider       │   │ • Tables:            │   │ • SupabaseStorage │
│   (Deterministic     │   │   - projects         │   │   (Cloud Bucket)  │
│    Canonical Fixtures│   │   - seed_dna         │   │ • Operations:     │
│    with <50ms seeding│   │   - world_candidates │   │   - upload        │
│    & offline fallback│   │   - world_selections │   │   - get_url       │
│ • Strict Pydantic v2 │   │   - world_bibles     │   │   - delete        │
│   JSON Schemas       │   │   - characters       │   │ • ProjectBundle   │
│                      │   │   - relationships    │   │   (Export/Import) │
│                      │   │   - scenes           │   │ • Serialized State│
│                      │   │   - entity_revisions │   │   Snapshots       │
│                      │   │   - snapshot_assets  │   │                   │
└──────────────────────┘   └──────────────────────┘   └───────────────────┘
```

---

## 3. Core Architectural Guarantees

1. **Strict Choice Gate**: Downstream universe expansion (Stage 5) cannot proceed without an explicit, validated human selection record (`world_selections`) containing creator rationale.
2. **Immutable Seed & Version History**: The original seed text and entity revision snapshots are immutable. Character and scene refinements generate incremental versioned snapshots (`v1 -> v2`) in the audit log.
3. **Causal Lineage Synthesis**: The provenance DAG is synthesized dynamically from foreign keys and relational metadata. It is 100% deterministic, auditable, and completely free of raw LLM reasoning tokens.
4. **Isolated Timeline Branching**: Forking a timeline creates a child project with completely remapped foreign keys, guaranteeing zero cross-branch state mutations.
5. **Deterministic Canonical Demo**: A pre-compiled, verified universe fixture that exercises the same application data model, persistence flow, lineage system, and frontend rendering without depending on an external LLM during presentation. The canonical ocean seed (*"A child discovers a forgotten city beneath the ocean."*) hydrates in `< 500ms`, ensuring foolproof hackathon presentations even during network outages.
6. **Pipeline Modes & Fallbacks**: Praroha supports a live Gemini + Supabase cloud pipeline for custom seeds, with deterministic fallback fixtures and local fallback paths for reliable demonstrations. When cloud mode is enabled, custom prompts connect to Gemini 3.5 Flash and persist via Supabase PostgreSQL and Supabase Storage; otherwise, seamless local/mock fallbacks provide complete resilience.
