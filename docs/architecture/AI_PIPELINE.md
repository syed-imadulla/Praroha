# Praroha AI Pipeline & Provider Architecture

## Master Framing
**Theme / Tattva**: Tattva 2 — *“Forms hidden in formless”*  
**Selected Idea**: Idea 1 — *Generative AI: “Seed → Tree / Word → Movie / Sound → Song”*  
**Core Purpose**: Take a compact creative seed and progressively reveal the hidden forms contained within it using structured Generative AI, human choice gates, and traceable unfolding.

---

## 1. Actual AI Provider Architecture

The AI layer in Praroha is decoupled behind an abstract base class [`AIProvider`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/providers/base.py) defined in `backend/app/providers/base.py`:

```
                    ┌────────────────────────┐
                    │   AIProvider (ABC)     │
                    └───────────┬────────────┘
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
   ┌───────────────────┐                 ┌───────────────────┐
   │  GeminiProvider   │                 │   MockProvider    │
   │ (Gemini 3.5 Flash)│                 │  (Deterministic)  │
   └─────────┬─────────┘                 └───────────────────┘
             │                                     ▲
             └────── [On Error / No Key / 429] ────┘
                          Fallback
```

### Components
1. **`AIProvider` (Abstract Base Class)**: Defines contract for `health_check()`, `extract_dna(seed)`, `generate_worlds(dna)`, `unfold_stage(stage, context)`, and `unfold_universe(context)`.
2. **`GeminiProvider`**: Concrete provider communicating with Google's Generative Language REST API (`https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`).
   - Configured Model: **`gemini-3.5-flash`** (`settings.GEMINI_MODEL`).
   - Structured Outputs: Enforced via `generationConfig.responseMimeType = "application/json"` and strict `responseSchema` definitions.
   - Pydantic v2 Validation: Validates raw LLM outputs through `SeedDNA` and `WorldCandidate` models.
3. **`MockProvider`**: High-fidelity deterministic provider returning structured domain fixtures for zero-cloud testing, offline development, and instantaneous competition judging.
4. **Provider Factory (`backend/app/providers/factory.py`)**:
   - Reads `settings.AI_PROVIDER` (default: `"mock"`, options: `"mock"`, `"gemini"`).
   - If `"gemini"` is requested, resolves `GeminiProvider()`.
   - If `"mock"` is requested, resolves `MockProvider()`.

---

## 2. Source-Accurate Pipeline Table

| Product Stage | Operation | AI Model | Request / Prompt | Output Schema | Database Record | Fallback Behavior |
|---|---|---|---|---|---|---|
| **Stage 1: Seed** | Creative Premise Capture | None (User Input) | Formless user premise string | Plain text string | `ProjectRecord.seed_text` | N/A |
| **Stage 2: Understand** | Seed DNA Distillation | `gemini-3.5-flash` | System instruction + Seed text prompt asking for premise, themes, entities, constraints, tone, domain keywords | `SeedDNA` JSON object | `SeedDNARecord` (FK: `project_id`) | Falls back to `MockProvider.extract_dna()` with client toast warning |
| **Stage 3: 3 Worlds** | World Manifestation Generation | `gemini-3.5-flash` | System prompt + Seed DNA JSON asking for exactly 3 high-contrast archetypes (Mythic, Ecological, Technological) | Array of 3 `WorldCandidate` objects | 3x `WorldCandidateRecord` (FK: `project_id`, `seed_dna_id`, `batch_id`) | Canonical ocean seed uses deterministic fixtures; custom seeds fall back to `MockProvider.generate_worlds()` |
| **Stage 4: Choose** | Human Direction Gate | None (Human Agency) | Creator commits to 1 candidate with rationale | `WorldSelectionCreate` | `WorldSelectionRecord` (FK: `project_id`, `world_candidate_id`) | Architectural choice gate; stops autonomous generation until user selects |
| **Stage 5: Unfold** | Multi-Layer Universe Expansion | `gemini-3.5-flash` | System prompt + Seed + Seed DNA + Selected World + Creator Rationale | `UnfoldedUniverseRead` (Bible, 3 Characters, Relationships, 3 Scenes) | `WorldBibleRecord`, `CharacterRecord`s, `SceneRecord`s, `EntityRevisionRecord`s | Canonical ocean seed returns verified Bio-City fixtures; custom seeds fall back to `MockProvider.unfold_universe()` |
| **Stage 6: Trace** | Causal Lineage Synthesis | None (Relational DAG Engine) | Database query of entities & relationships | `TraceGraphRead` (Nodes & Directed Edges) | Synthesized dynamically from normalized DB state | Pure relational synthesis (100% deterministic, zero LLM CoT leakage) |
| **Stage 7: Refine** | Component Refinement & Branching | None (Creator Action / Storage) | User edits character/scene traits with rationale; or forks branch | `EntityRevisionRecord`, `ProjectBundle`, `SnapshotAssetRecord` | `EntityRevisionRecord`, child `ProjectRecord` with remapped IDs | Clones state with zero foreign key leakage; persists snapshots to `StorageProvider` |

---

## 3. Fallback & Failure Modes (Actual Source Behavior)

From [`backend/app/providers/gemini_provider.py`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/providers/gemini_provider.py):

```python
FALLBACK_WARNING_MESSAGE = (
    "AI Provider Throttled/Unavailable — Gracefully transitioned to deterministic mock fixtures"
)
```

1. **`GEMINI_API_KEY` Missing**:
   - `GeminiProvider.__init__()` detects `not self.api_key`.
   - Bypasses external HTTP calls immediately.
   - Invokes `self._mock_provider` methods directly.
   - Sets `last_fallback_warning` and returns `fallback_used: True` with client notification.
2. **HTTP 429 (Rate Limit / Quota Exceeded)**:
   - `httpx.AsyncClient` raises `httpx.HTTPStatusError(429)`.
   - Caught by `except (httpx.HTTPError, ...)` block.
   - Logs warning: `Gemini API call failed (HTTPStatusError: ...). Falling back gracefully to MockProvider.`
   - Instantly recovers by returning high-fidelity `MockProvider` results with fallback warning attached.
3. **Network Failure / DNS Resolution Error**:
   - Caught by `httpx.HTTPError`.
   - Seamlessly returns `MockProvider` results without 500 server crash.
4. **Request Timeout**:
   - Configured timeout: `30.0s` for DNA extraction and universe unfolding; `35.0s` for world candidate generation.
   - If timeout expires, caught by `httpx.TimeoutException` and falls back cleanly.
5. **Malformed LLM Output / Pydantic Validation Error**:
   - If Gemini returns invalid JSON or schema violates required fields, caught by `(json.JSONDecodeError, ValidationError, ValueError)`.
   - Prevents corrupted data from entering the database; safely falls back to schema-compliant `MockProvider` response.

---

## 4. Canonical Demo vs Live Custom Seed Operation

Praroha supports a live Gemini + Supabase cloud pipeline for custom seeds, with deterministic fallback fixtures and local fallback paths for reliable demonstrations.

### Deterministic Canonical Demo (`POST /api/projects/canonical-demo`)
- **Nature**: Deterministic Canonical Demo — A pre-compiled, verified universe fixture that exercises the same application data model, persistence flow, lineage system, and frontend rendering without depending on an external LLM during presentation.
- **Trigger**: "🌟 Instant Full Universe (Demo)" button or `TopBar` launcher.
- **Backend Latency**: `< 50ms`.
- **Purpose**: Guaranteed presentation resilience for live judge evaluation without latency, quota limits, or network dependencies.
- **Transparency**: Not described as a live Gemini generation; explicitly documented as pre-compiled canonical fixtures for the canonical premise: *"A child discovers a forgotten city beneath the ocean."*

### True Live Generative Pipeline (Custom Seeds)
- **Nature**: True Live Generative Pipeline: For custom audience prompts, Praroha can connect to the configured Gemini model through its `AIProvider` abstraction and persist application state through Supabase PostgreSQL and Supabase Storage when cloud mode is enabled.
- **Trigger**: Entering custom premise text on Stage 1 and clicking "Distill Seed DNA".
- **Execution Path**:
  - If `GEMINI_API_KEY` is configured and active: Calls live **Gemini 3.5 Flash** (`gemini-3.5-flash`) endpoint with strict JSON schema.
  - If `GEMINI_API_KEY` is unset or throttled: Gracefully executes deterministic mock generation with amber toast warning.

---

## 5. Multimodal Capabilities Reality Check

To maintain complete credibility with judges, the exact multimodal status is:

### Implemented Now
- **Structured Text Generation**: Complete multi-tier world bibles, factions, physics laws, history, canon facts.
- **Structured Character Architectures**: Grounded motivations, archetypes, internal/external conflicts, socio-emotional relationship graphs.
- **Structured Dramatic Scenes**: Conflict questions, pivotal outcomes, scene locations.
- **Visual Prompt Descriptors**: Generates production-ready, photographic/cinematic visual prompts (`image_prompt` / `visual_prompt`) attached to every world, character, key location, and narrative scene, with one-click clipboard copying.

### Future / Optional Scope (Explicitly NOT Live Now)
- Direct image generation API execution (e.g. Imagen 3 / Midjourney API).
- Direct audio or music generation API execution (e.g. Suno / MusicLM).
- Direct video generation API execution (e.g. Runway / Sora).

*Judges can inspect visual prompts directly in the UI and test them in any external diffusion model.*
