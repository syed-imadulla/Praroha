# Phase 3 Plan 01 Summary: Backend World Candidate Models, Provider & API

**Execution Date:** 2026-10-04  
**Status:** Completed  
**Tests:** 16/16 backend tests passed (5 new in `test_worlds.py`)

## What Was Built
1. **World Candidate Schemas & Relational Entity (`backend/app/models/world.py`)**:
   - `WorldCandidate` Pydantic model enforcing 9 core attributes: `id`, `index` (1..3), `title`, `archetype`, `concept`, `aesthetic`, `core_tension`, `trade_offs`, and `key_visual`.
   - `WorldCandidateRecord` SQLModel table (`world_candidates`) with foreign keys linking to `projects.id` and `seed_dna.id`, grouped by `batch_id` and indexed by `candidate_index`.
   - `WorldCandidateRead` schema for serialized API responses.
   - Exported in `backend/app/models/__init__.py`.

2. **AI Provider Three World Generation (`backend/app/providers/gemini_provider.py` & `mock_provider.py`)**:
   - `CANONICAL_WORLDS` updated with explicit 1-indexed ordering for *Lost Civilization*, *Bio-City*, and *Time Capsule*.
   - Implemented strict canonical detection evaluated against the persisted immutable `raw_seed` (`(dna.get("raw_seed") or "").strip().lower().rstrip(".") == "a child discovers a forgotten city beneath the ocean"`), completely immune to premise paraphrasing.
   - Structured `gemini-2.5-flash` API generation call with strict JSON array response schema for 3 candidate objects.
   - Robust `MockProvider` fallback when API keys are absent or network errors occur.

3. **Repository Persistence & Router Endpoints (`backend/app/repositories/project_repo.py`, `backend/app/routers/worlds.py`, `backend/app/main.py`)**:
   - `save_world_candidates()`: atomic persistence of 3 candidates under a unique `batch_id`.
   - `get_latest_world_candidates()`: queries the most recent `batch_id` sorted by `created_at DESC` and orders candidates by `candidate_index ASC`.
   - `POST /api/projects/{project_id}/worlds/generate`: verifies project and extracted Seed DNA, executes branching engine, persists records, and advances project status to `worlds_generated`.
   - `GET /api/projects/{project_id}/worlds`: retrieves latest 3 candidates.
   - Mounted `worlds_router` in `backend/app/main.py`.

4. **Automated Pytest Suite (`backend/tests/test_worlds.py`)**:
   - `test_world_candidate_schema_validation`: verifies Pydantic validation and field requirements.
   - `test_canonical_demo_fixtures_determinism`: tests that raw seed matching triggers canonical fixtures even with rewritten premises.
   - `test_generate_worlds_mock_fallback`: verifies mock generation when no key is set or on network failure.
   - `test_worlds_generate_and_get_endpoint`: full end-to-end API test from project creation to DNA extraction to world generation and retrieval.
   - `test_worlds_regenerate_batch_history`: validates append-only batch persistence.

## Verification
- `pytest -v backend/tests/test_worlds.py`: 5 passed in 0.77s.
- `pytest -v backend/tests/`: 16 passed in 0.88s.
