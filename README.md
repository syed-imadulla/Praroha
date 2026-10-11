<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/brand-light.svg">
  <img alt="PRAROHA — Seed → Universe" src="docs/assets/brand-light.svg" width="250">
</picture>

*Tatva 2 — Forms Hidden in Formless*

An AI-powered creative worldbuilding platform built for the **Vedanta Makeathon** by **Team Supreme**.

**[Live Web App & PWA](https://frontend-iota-green-73.vercel.app)** · **[Live API Health](https://praroha-backend.whiteground-dc69e38a.centralindia.azurecontainerapps.io/api/health)**

</div>

## Introduction

What if one small idea could become an entire universe?

PRAROHA takes a single creative prompt and unfolds it into a structured fictional world — complete with lore, characters, relationships, story scenes, concept art, and voice narration. The creator stays in control throughout, choosing which direction the world develops and inspecting how every element traces back to the original idea.

The name comes from Sanskrit: *sprouting*, *germination* — the moment latent potential becomes visible form.

## The Problem

Generative AI can produce text, images, and audio, but building a *consistent* fictional world across these outputs requires repeated prompting, manual coordination, and careful continuity management. Characters drift, lore contradicts itself, and the connection between the original idea and later outputs gets lost.

PRAROHA solves this by treating world creation as a structured pipeline rather than an open-ended chat. Every generated element is anchored to the root idea through a database-backed provenance model.

## Philosophical Foundation: Tatva 2

> *"The seed is the idea. The universe is what it can become."*

PRAROHA is guided by a single philosophy: **Tatva 2 — Seed to Universe: Forms Hidden in Formless**. A simple idea contains hidden themes, possible settings, characters, conflicts, and story directions. PRAROHA unfolds that potential into alternative worlds, lets the creator choose a direction, and develops the selection into a connected universe.

The application's workflow stages are practical implementation steps demonstrating this philosophy. They are not separate Tatvas.

## How It Works

1. **Enter an idea** — A short narrative premise (a sentence, question, or scenario).
2. **Understand the seed** — Gemini extracts structured Seed DNA: core motifs, themes, tone, and constraints.
3. **Explore three worlds** — The engine generates three divergent world candidates along different creative axes.
4. **Choose a direction** — The creator commits to one world and records their rationale. Downstream generation is locked until this human choice is made.
5. **Develop the universe** — The selected world unfolds into a World Bible, Characters, Relationships, and Story Scenes.
6. **Bring elements to life** — Concept art (Pollinations.ai) and character voices (Edge-TTS) are generated for scenes and characters.
7. **Explore connections** — An interactive Origin Trail DAG shows how every rule, character, and scene traces back to the original seed.
8. **Refine and export** — Test premise mutations, replay counterfactuals, and export a portable `.seedunfold.json` bundle.

## Key Features

- **Seed DNA Extraction** — Structured identification of latent motifs, conflicts, and constraints.
- **Three-World Divergence** — Three meaningfully distinct candidate worlds from a single seed.
- **Human Choice Gate** — No autonomous runaway; the creator must commit before unfolding proceeds.
- **Universe Codex** — Interconnected World Bible, Cast Profiles, Relational Dynamics, and Story Scenes.
- **Concept Art** — Server-side Pollinations.ai integration producing validated JPEG images.
- **Voice & Narration** — Edge-TTS neural speech synthesis with curated character personas.
- **Origin Trail DAG** — Visual provenance graph mapping every entity back to the root seed.
- **Causal Inspector** — Plain-language explanations of why any element exists.
- **Mutation Lab** — Test how changing the premise affects downstream content.
- **Counterfactual Replay** — Compare the chosen world against rejected alternatives.
- **Realtime Sync** — Multi-tab synchronization via Supabase Realtime.
- **Portable Export** — Full project export/import as structured JSON.

## Example: "A village where nobody can lie"

**Seed DNA extracted:** Involuntary truth, societal vulnerability, trust economics, emotional friction.

**Three worlds generated:**
- *Botanical Truth* — Sacred pollen physically chokes anyone attempting falsehood.
- *Cognitive Mirror* — Thoughts project visually above citizens' heads as bioluminescent halos.
- *Architectural Vow* — An ancient bell tower tolls violently whenever deceit is spoken.

**Creator selects** *Cognitive Mirror*. The platform unfolds the village name, social hierarchy, characters (an archivist wearing a mirrored veil), strained relationships, and an opening scene. Concept art visualizes the misty valley; narration audio reads the archivist's monologue. Every element traces back to the original sentence.

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Zustand, Framer Motion, `vite-plugin-pwa` |
| **PWA** | Installable Web App Manifest, Service Worker (Workbox precache), Offline banner |
| **Backend** | Python 3.11+, FastAPI, SQLModel, Pydantic v2, Uvicorn |
| **Database** | SQLite / aiosqlite (local), Supabase / PostgreSQL (production cloud) |
| **Object Storage** | Local filesystem (`./uploads`), Supabase Cloud Storage (`STORAGE_PROVIDER=supabase`) |
| **Realtime** | Supabase Realtime broadcast channels |
| **Authentication** | Supabase Auth (Email/Password, Email Verification, Password Reset, Guest Demo) |
| **Text Generation** | Google Gemini (`gemini-3.1-flash-lite`, `gemini-flash-latest`) |
| **Image Generation** | Pollinations.ai (Flux / Sana models) with FLUX.1 schnell fallback |
| **Speech & Voice** | Edge-TTS (online neural speech with 6 curated archetypes) |
| **Atmospheric Audio** | Curated CC0 Ambient Library (Wind, Rain, Temple Bells, Forest, Drones) · Stability AI & Pixazo Tracks *(requires funded API tokens)* |
| **Video Generation** | Composed Cinematic Previews (JSON2Video) · Wan 2.1 / Pyramid Flow / Pixazo *(requires funded API tokens)* |
| **Deployment** | Azure Container Apps, Vercel Edge, Supabase Cloud, Docker Compose, Nginx Alpine |

## Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React + Vite + TypeScript)"]
        UI[Workspace & Stage Navigation]
        Store[Zustand Store]
        RT[Supabase Realtime]
        UI --> Store --> RT
    end

    subgraph Server ["Backend (FastAPI + Python)"]
        API[API Routers]
        Svc[UniverseService · MediaService · LineageService]
        Repo[SQLModel Repository]
        API --> Svc --> Repo
    end

    subgraph Data ["Persistence"]
        DB[(SQLite / PostgreSQL)]
        Storage[(Local disk / Supabase Storage)]
        Repo --> DB
        Svc --> Storage
    end

    subgraph AI ["AI Providers"]
        Gemini[Google Gemini]
        Pollinations[Pollinations.ai]
        EdgeTTS[Edge-TTS]
    end

    Client -- REST --> API
    RT -- WebSockets --> DB
    Svc --> Gemini
    Svc --> Pollinations
    Svc --> EdgeTTS
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full data model, sequence diagrams, and security details.

## Quick Start

**Prerequisites:** Node.js 18+, Python 3.10+, Git.

```bash
# Clone and set up
git clone https://github.com/syed-imadulla/Praroha.git
cd Praroha

# Backend
python3 -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install && cd ..

# Configure environment
cp .env.example backend/.env
# Edit backend/.env — set GEMINI_API_KEY for live generation,
# or leave AI_PROVIDER=mock for offline demo mode.

# Run (two terminals)
uvicorn backend.app.main:app --port 8000 --reload    # Backend
npm --prefix frontend run dev                          # Frontend → http://localhost:5174
```

## AI & Media Provider Status

| Provider / Engine | Purpose | Status | Cost / Tier |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | Text generation (Seed DNA, 3-world divergence, Universe Codex) | **Verified Live** | Free Tier (`gemini-3.1-flash-lite`) |
| **Pollinations.ai** | Concept art, scene illustrations, character portraits | **Verified Live** | Free Tier (FLUX.1 / Sana models) |
| **Edge-TTS** | Character dialogue voice and scene narration | **Verified Live** | Free Service (Neural Speech) |
| **Procedural Soundscape Composer** | Multi-layer ambient audio (Wind, Rain, Singing Bowls, Forest, Drones) | **Verified Live** | **100% Free** (Pure Python PCM synthesis, CC0 1.0 Universal) |
| **JSON2Video** | Composed Cinematic Preview MP4 rendering | **Verified Live** | Free Allowance (594s remaining, `is_synthetic: true`) |
| **Generative Video** (Wan 2.1 / Pixazo / Rewind Seedance) | Live AI text-to-video / image-to-video | **Visibly Disabled** | Badged `AI Video (Credits Required)` to protect creators from billing failures |
| **Generative Music** (Stable Audio / Pixazo Tracks / Rewind Lyria) | Live text-to-music AI synthesis | **Visibly Disabled** | Honest error states displayed when unconfigured |

When a generative provider is unavailable or unfunded, PRAROHA displays transparent status badges without disrupting the creator workflow. Setting `AI_PROVIDER=mock` enables deterministic offline fixtures for demonstration and air-gapped evaluation.

See [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full integration details.

## Production Verification & Test Suite

Milestone 5 complete verification battery:

| Suite | Command | Result | Duration |
| :--- | :--- | :--- | :--- |
| **Backend Tests** | `pytest backend/tests` | **211 passed**, 1 skipped | 76.0s |
| **Frontend Production Build** | `npm --prefix frontend run build` | Clean (0 errors, Workbox precaches 33 entries) | 12.8s |
| **PWA Installation Audit** | `node frontend/e2e/test_phase37_pwa.mjs` | 100% Passed (Live Vercel domain: Manifest, SW, Offline banner) | 3.12s |
| **Full Creative Journey E2E** | `node frontend/e2e/test_phase31_10_journey.mjs` | 100% Passed (Live Azure + Vercel: All 7 Stages with live Gemini & EdgeTTS) | 68.4s |
| **Realtime Multi-Tab & Isolation** | `node frontend/e2e/test_phase31_10_realtime.mjs` | 100% Passed (Live stack: Multi-tab broadcast sync & project isolation) | 31.5s |
| **Release Media & Isolation E2E** | `node frontend/e2e/test_release_media_and_isolation.mjs` | 100% Passed (Live ACA: 10/10 checks across CC0 soundscapes, JSON2Video, isolation) | 28.1s |

See [docs/TESTING.md](docs/TESTING.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for execution and deployment instructions.

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md) — Purpose, philosophy, workflow, and a detailed example.
- [Architecture](docs/ARCHITECTURE.md) — System design, data model, request flow, and security.
- [Production Deployment](docs/DEPLOYMENT.md) — Comprehensive runbooks, Docker Compose, Supabase setup, and backups.
- [AI Providers](docs/AI_PROVIDERS.md) — Provider contracts, authentication, and limitations.
- [Setup Guide](docs/SETUP.md) — Installation, configuration, and troubleshooting.
- [Testing Report](docs/TESTING.md) — Test strategy, results, and execution instructions.

## Team

**Team Supreme**

| Member | GitHub |
| :--- | :--- |
| Syed Imadulla | [https://github.com/syed-imadulla](https://github.com/syed-imadulla) |
| Sandhya C | [https://github.com/Sandhya2209-ui](https://github.com/Sandhya2209-ui) |
| Thriveni S A | [https://github.com/thriveni-sa](https://github.com/thriveni-sa) |
| Teja J | [https://github.com/TEJA-12345678](https://github.com/TEJA-12345678) |

## Hackathon

PRAROHA was built for the **Vedanta Makeathon**.

> **Theme 2 (Tattva 2):** *Forms hidden in formless*
> **Idea 1:** *Generative AI — Seed → Tree / Word → Movie / Sound → Song*
