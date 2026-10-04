# Phase 3 Research: Three World Generation

## 1. Domain & Architecture Analysis

### Goal
Progress from Stage 2 (Seed Understanding & Seed DNA) to Stage 3 (Three World Generation), producing exactly three contrasting candidate worlds grounded in the extracted Seed DNA without narrative runaway or premature selection.

### Key Insights & Standards
1. **Tattva 2 Principle (Three Latent Forms)**:
   - Exactly three worlds are generated. Less than three reduces meaningful human creative choice; more than three introduces cognitive overload.
   - The three candidates must contrast along established axes:
     - Candidate 1: Mythic / Archaeological / Ancient
     - Candidate 2: Ecological / Biological / Symbiotic
     - Candidate 3: Technological / Retro-Futuristic / Grounded
2. **Canonical Demo Fixture Determinism**:
   - For demo fidelity and offline judging reliability, when the user is running the canonical ocean prompt (*"A child discovers a forgotten city beneath the ocean."*), the provider must deterministically provide the documented canonical demo fixtures:
     1. *Lost Civilization*
     2. *Bio-City*
     3. *Time Capsule*
   - **Detection Rule:** Detection must strictly check the persisted, immutable `raw_seed` from `SeedDNARecord` using normalized string matching (e.g., `(dna.get("raw_seed") or "").strip().lower().rstrip(".") == "a child discovers a forgotten city beneath the ocean"`). Do NOT rely on the AI-generated `premise`, as Gemini may rephrase it.
3. **Structured Gemini Generation**:
   - Model: `gemini-2.5-flash` using REST API `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
   - `systemInstruction`: World branching rules enforcing strict Seed DNA adherence, 3 distinct archetypes, and zero narrative generation beyond candidate summaries.
   - `generationConfig.responseSchema`: Array of objects with properties `id`, `title`, `archetype`, `concept`, `aesthetic`, `core_tension`, `trade_offs`, `key_visual`.
   - Automatic fallback: If `GEMINI_API_KEY` is missing or the request fails/times out, cleanly fall back to `MockProvider.generate_worlds()`.
4. **Relational Persistence & History**:
   - Table `world_candidates` linked to `projects.id` and `seed_dna.id`.
   - Batch identifier (`batch_id: str`) groups the three candidates of each generation run.
   - Re-generation appends a new batch with fresh timestamps, enabling full historical lineage without destructive overwrites.

## 2. Reusable Assets in Workspace
- `backend/app/providers/base.py`: Abstract method `generate_worlds(dna: Dict[str, Any])`.
- `backend/app/providers/mock_provider.py`: `CANONICAL_WORLDS` list with exact canonical underwater fixtures.
- `backend/app/providers/gemini_provider.py`: Already implements async `httpx` and resilient mock fallback pattern.
- `backend/app/models/dna.py`: `SeedDNA` and `SeedDNARecord` for relational linkage.
- `frontend/src/store/workspaceStore.ts`: Zustand store with stage navigation and persistence.

## 3. Potential Hazards & Mitigations
- **Hazard:** Model generating more or fewer than 3 candidates.
  - **Mitigation:** Strict `responseSchema` and server-side Pydantic array validation ensuring `len(candidates) == 3`.
- **Hazard:** Loss of previous candidate batch on re-generation.
  - **Mitigation:** Batch grouping (`batch_id`) and non-destructive inserts; retrieval queries latest `batch_id` by `created_at`.
- **Hazard:** Premature world selection in Phase 3.
  - **Mitigation:** World selection is fenced to Phase 4; Phase 3 focuses solely on generation, visual inspection, and comparative evaluation.
