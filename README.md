# Praroha
### Seed → Universe
### Tattva 2 — Forms hidden in formless

> **Vedanta Makeathon Submission**  
> **Team**: Supreme (SJCIT Chikkaballapura)  
> **Selected Theme**: Theme 2 (Tattva 2) — *Forms hidden in formless*  
> **Selected Idea**: Idea 1 — *Generative AI: “Seed → Tree / Word → Movie / Sound → Song”*

---

## 1. Problem Statement
Generative AI tools excel at generating individual text responses or images, but these outputs are created in isolation. Transforming a simple creative seed into a cohesive story-world requires repeated prompting across disjoint tools, leading to:
- **Creative Drift**: The generated world forgets its initial constraints.
- **Lore Inconsistency**: Characters, factions, and rules contradict each other.
- **Lost Agency**: Autonomous AI runaway removes human creative commitment.
- **Zero Traceability**: There is no way to audit why an entity exists or how it connects back to the original idea.

---

## 2. The Tattva 2 Connection
In Vedanta, **Tattva 2** states:
> *“Universes exist in a seed form, autonomously unfolds with initial agency. Forms hidden in formless.”*

Just as a mighty banyan tree already exists in unmanifest potential inside a tiny physical seed, a rich, multi-layered creative universe is latent within a compact creative sentence.

Praroha is our software solution to this specific Tattva 2 challenge. It does not attempt to solve multiple Tattvas; rather, it uses a **7-stage unfolding pipeline** to demonstrate how an unmanifest seed progressively reveals its latent forms.

---

## 3. Idea 1: Generative AI
Under Theme 2, we chose **Idea 1**:
> *“Start with a small prompt or input and generate a richer image, story, sound, video, or other output... The entire macro scale information was already there in the simple seed in an unmanifest form, just like the cosmos.”*

Praroha proves this concept by taking a single seed premise and expanding it into a structured, relational universe.

---

## 4. The Praroha Solution
Praroha (*Sanskrit for "Sprout"*) treats creative generation not as a conversational chatbox, but as a **disciplined, traceable state machine**:

```
Tattva 2: Forms hidden in formless
        ↓
Stage 1: Seed (Raw Formless Input)
        ↓
Stage 2: Understand (Seed DNA Distillation)
        ↓
Stage 3: 3 Worlds (Latent Manifestations)
        ↓
Stage 4: Choose (Human Choice Gate & Agency)
        ↓
Stage 5: Unfold (Progressive Mini-Universe Codex)
        ↓
Stage 6: Trace (Causal Lineage DAG Back to Seed)
        ↓
Stage 7: Refine (Evolution while Preserving Continuity)
```

### Core Features
- **Deterministic Choice Gate**: Downstream expansion is locked until the creator commits to one archetype and records their rationale.
- **World Codex**: Multi-table relational world bible (canon rules, factions, physics), grounded cast members, socio-emotional relationship graphs, and narrative scenes.
- **Interactive Provenance DAG**: Multi-lane visual graph showing the exact ancestor trail connecting every downstream entity back to the root seed.
- **Timeline Branching**: Fork alternate timelines with isolated remapped state and zero cross-branch leakage.
- **Refinement Audit Log**: Versioned modifications (`v1 -> v2`) with creator notes and visual diffs.
- **State Portability**: Export and import complete `.json` ProjectBundles and serialize universe storage snapshots.

---

## 5. System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   React 18 + Vite (SPA)                     │
│  Tailwind CSS • Framer Motion • Lucide Icons • Zustand      │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                         │
│  Python 3.12+ • SQLModel • Pydantic v2 • Topological DAG    │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│      AIProvider Layer        │ │    StorageProvider Layer    │
│ • GeminiProvider             │ │ • LocalStorageProvider      │
│   (gemini-3.5-flash)         │ │   (./uploads/)              │
│ • MockProvider               │ │ • SupabaseStorageProvider   │
│   (Deterministic Fixtures)   │ │   (Cloud Object Storage)    │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 6. AI Models, Reliability & Architecture Modes

- **Active Model**: Google **Gemini 3.5 Flash** (`gemini-3.5-flash`) via REST API with strict JSON schema enforcement (`responseMimeType: "application/json"`).
- **Architecture Modes & Reliability**:
  - **Live Pipeline**: Praroha supports a live Gemini + Supabase cloud pipeline for custom seeds, with deterministic fallback fixtures and local fallback paths for reliable demonstrations.
  - **True Live Generative Pipeline**: For custom audience prompts, Praroha can connect to the configured Gemini model through its `AIProvider` abstraction and persist application state through Supabase PostgreSQL and Supabase Storage when cloud mode is enabled.
  - **Deterministic Canonical Demo**: A pre-compiled, verified universe fixture that exercises the same application data model, persistence flow, lineage system, and frontend rendering without depending on an external LLM during presentation. The canonical demo seed (*"A child discovers a forgotten city beneath the ocean"*) hydrates in `< 500ms`, ensuring foolproof hackathon judging resilience.
  - **Graceful Fallback**: If Gemini is unavailable, the application can gracefully use deterministic `MockProvider` fixtures. If cloud database/storage configuration is unavailable, the existing local fallback (SQLite + local disk storage) remains available.

---

## 7. Quick Start & Demonstration

### Prerequisites
- Node.js 18+
- Python 3.10+

### Running Locally
```bash
# 1. Install dependencies
npm install
npm --prefix frontend install
pip install -r backend/requirements.txt

# 2. Start the Backend API (Port 8000)
uvicorn backend.app.main:app --port 8000 --host 0.0.0.0 --reload

# 3. Start the Frontend (Port 5173)
npm --prefix frontend run dev
```

### Live Demo Controls
- **Instant Full Universe**: Click `🌟 Instant Full Universe (Demo)` on Stage 1 or `TopBar` to hydrate the complete universe in `< 500ms`.
- **7-Stage Guided Tour**: Press `t` to launch the self-explaining Tattva 2 guided tour.
- **Keyboard Navigation**: Press `1` through `7` to jump directly across the 7 pipeline stages.
- **Inspector Drawer**: Press `i` to inspect Seed DNA and causal lineage.
- **Keyboard Shortcuts**: Press `?` to open the keycaps cheatsheet.

---

## 8. Technology Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand.
- **Backend**: FastAPI, SQLModel, Pydantic v2, aiosqlite / SQLite (dev) / PostgreSQL (prod).
- **AI Engine**: Google Gemini 3.5 Flash, MockProvider fallback.
- **Storage**: Local filesystem (`./uploads`), Supabase Storage interface.
- **Testing**: Pytest (53 backend tests), Playwright E2E suite.

---

## 9. Multimodal Scope: Implemented vs. Future

### Implemented Now
- Structured text generation and Pydantic v2 validation.
- Complete multi-layer universe codex generation.
- Production-ready visual prompt descriptors attached to all entities with one-click clipboard copying.
- Provenance DAG tracing and timeline branching.

### Future Scope (Post-Makeathon)
- Direct image diffusion API integration (Imagen 3 / Midjourney).
- Direct soundtrack and audio generation (Suno / MusicLM).
- Direct video scene rendering (Runway / Sora).
