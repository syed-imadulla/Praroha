---
phase: 02-seed-understanding-seed-dna
plan: "01"
subsystem: backend
tags: [seed-dna, gemini, mock-fallback, pydantic, sqlmodel, pytest]
requirements:
  - DNA-02
  - DNA-03
  - DNA-05
decisions_covered:
  - D-01: GeminiProvider with live structured schema extraction and graceful MockProvider fallback
  - D-02: Strict Pydantic SeedDNA schema (premise, themes, entities, constraints, tone, domain_keywords)
  - D-03: SQLModel SeedDNARecord table with immutable raw_seed and foreign key to projects
  - D-04: API endpoints POST /projects/{id}/dna/extract and GET /projects/{id}/dna returning standardized APIResponse
---

# Plan 02-01 Summary: Backend Seed Understanding & Seed DNA Service

Implemented the complete backend foundation for the Seed Understanding pass: Pydantic schemas, relational SQLModel entity, Gemini REST provider with automatic mock fallback, FastAPI endpoints, and automated tests.

## Key Changes
1. **Pydantic & SQLModel Models (`backend/app/models/dna.py` & `backend/app/models/__init__.py`)**:
   - `SeedDNA`: strict validation for `premise`, `themes`, `entities`, `constraints`, `tone`, and `domain_keywords`.
   - `SeedDNARecord`: SQLModel entity mapped to table `seed_dna`, linked to `projects.id`, permanently and immutably recording `raw_seed`, model used, and fallback status.
   - Request and response schemas: `ExtractDNARequest` and `SeedDNARead`.
2. **Resilient AI Provider (`backend/app/providers/gemini_provider.py` & `factory.py`)**:
   - `GeminiProvider`: communicates asynchronously with Google Gemini REST API using `gemini-2.5-flash` with structured `responseSchema`.
   - Built-in fallback: catches missing credentials, timeouts, HTTP errors, or schema validation failures and transparently delegates to `MockProvider().extract_dna()` with `fallback_used: True`.
   - Factory integration: maps `AI_PROVIDER=gemini` to `GeminiProvider`.
3. **Repository & Endpoints (`backend/app/repositories/project_repo.py`, `backend/app/routers/dna.py`, `backend/app/main.py`)**:
   - Added `save_seed_dna`, `get_latest_seed_dna`, and `update_project_status` to `ProjectRepository`.
   - `POST /api/projects/{project_id}/dna/extract`: executes understanding pass, creates DNA record, and updates project status to `understood`.
   - `GET /api/projects/{project_id}/dna`: returns the latest extracted Seed DNA.
4. **Pytest Suite (`backend/tests/test_dna.py`)**:
   - 4 comprehensive tests validating schema parsing, Gemini provider fallback on missing key and network failures, extract and get endpoints, and strict raw seed immutability.
   - Full suite passes: 11 passed in 0.54s.

## Verification Results
- `pytest -v backend/tests/test_dna.py` passed (4/4 tests).
- `pytest -v backend/tests/` passed (11/11 tests across health, providers, and DNA).
- Zero cloud credential requirements for offline test execution.
