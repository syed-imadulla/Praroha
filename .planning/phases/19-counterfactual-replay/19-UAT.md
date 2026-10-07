# Phase 19: Counterfactual Replay — User Acceptance Testing (UAT) Report

**Milestone:** 2 — Semantic Intelligence + Generative Media  
**Phase:** 19 — Counterfactual Replay  
**Requirements Verified:** CNTR-01, CNTR-02  
**Date:** October 8, 2026  
**Status:** ✅ ALL TESTS PASSED (100% Verified)

---

## 1. Executive Summary

Phase 19 delivers **Counterfactual Replay**, allowing creators to compare their active committed story-world against alternative candidates rejected during Stage 4 without the computational overhead of re-unfolding an entire universe. The system provides:

1. **Codex Integration & Candidate Selection (CNTR-01)**:
   - 5th Universe Codex Tab (`#codex-tab-replay`) and top header launcher button (*"What If I Chose Another World?"* / `#launcher-counterfactual-replay-btn`).
   - Candidate selector strip displaying rejected candidate worlds from the generation batch with archetype badges and inferred creative exclusions avoided in canon.
2. **50/50 Dual-Column Comparative Matrix (CNTR-02)**:
   - Side-by-side comparative layout contrasting Current Committed Canon (left, emerald) vs Counterfactual Alternative (right, violet).
   - Creator Decision Rationale citation and active story anchor summaries.
3. **Divergence Delta Cards & Exploration Profile Divergence Meters (CNTR-02)**:
   - 4 structured divergence delta cards across **Protagonist & Lead Archetype**, **Tone & Sensory Atmosphere**, **Central Dramatic Conflict**, and **Lore & Foundational Rules** with intensity badges (`RADICAL`, `INVERSE`, `MODERATE`, `CONVERGENT`) and clean narrative prose (0 Chain-of-Thought leak).
   - Side-by-side exploration profile metric comparison bars comparing Seed Fidelity, Novelty, Conceptual Distance, and Feasibility.
4. **Actionable Timeline Branching (CNTR-01)**:
   - `"Fork Timeline from This World"` action (`#fork-counterfactual-branch-btn`) with custom branch naming.
   - Spawns an isolated child timeline branch rooted in the alternative candidate world with `counterfactual_metadata_json` persistence.
   - Automatic workspace store branch switching while guaranteeing **100% parent branch immutability**.

---

## 2. Test Execution Results

### 2.1 Backend Automated Suite (Pytest)
- **Scope:** 146 total tests across all modules (including 8 dedicated tests in `backend/tests/test_counterfactual_replay.py`).
- **Result:** `146 passed in 23.25s` (100% pass rate, 0 regressions across Phases 1–19).
- **Coverage:**
  - `test_get_counterfactual_candidates_filters_selected`: Rejected candidate extraction correctly excludes active world.
  - `test_deterministic_delta_generation_baseline`: Deterministic baseline delta derivation across 4 dimensions and exploration metrics without LLM requirement.
  - `test_exploration_profile_metric_deltas`: Proper numeric deltas calculated between candidate and canon profiles.
  - `test_counterfactual_delta_no_cot_leakage`: Divergence narratives contain 0 raw model reasoning tokens or chain-of-thought phrases.
  - `test_fork_counterfactual_timeline_branch`: Child branch created rooted in candidate world with status reset and `counterfactual_metadata_json` preserved.
  - `test_parent_canon_immutability_on_counterfactual_fork`: Parent project and selection remain 100% untouched and immutable.
  - `test_branch_name_collision_safety`: Auto-increments suffix on branch naming collisions.
  - `test_counterfactual_api_error_handling`: Proper 404/400 HTTP errors for nonexistent projects or invalid candidate IDs.

### 2.2 Frontend Build & TypeScript Validation
- **Command:** `npm --prefix frontend run build`
- **Result:** Clean exit code 0 (`tsc && vite build`); 1,970 modules transformed, 0 TypeScript errors.

### 2.3 End-to-End Browser Automation (Playwright)
- **Script:** `frontend/e2e/test_phase19_counterfactual_replay.cjs`
- **Result:** All 5 user scenarios executed and passed with exit code 0.
- **Scenarios Verified:**
  1. **Launch Counterfactual Replay via Header & Tab (CNTR-01):**
     - Instant Demo universe seeded.
     - Clicked `#launcher-counterfactual-replay-btn` in Universe Codex header.
     - 5th Codex Tab `#codex-tab-replay` became active and rendered `[data-testid="counterfactual-replay-canvas"]`.
  2. **Candidate Selector Strip (CNTR-01):**
     - Rendered 2 rejected candidate worlds (`Lost Civilization` and `Time Capsule`).
     - Displayed archetype badges and inferred exclusions.
     - Clicked second candidate card; comparison updated reactively; switched back to first candidate cleanly.
  3. **50/50 Dual-Column Comparative Matrix (CNTR-02):**
     - Rendered Current Committed Canon on left column with Creator Decision Rationale.
     - Rendered Counterfactual Alternative on right column with Inferred Exclusion avoidance callout.
  4. **Divergence Delta Cards & Profile Meters (CNTR-02):**
     - Verified all 4 delta cards (`protagonist`, `tone_atmosphere`, `central_conflict`, `world_rules`) with `CANON FOCUS` and `ALTERNATIVE SHIFT` points.
     - Verified exploration profile meters for Seed Fidelity, Novelty, Conceptual Distance, and Feasibility.
  5. **Actionable Timeline Branching (CNTR-01):**
     - Filled branch name `counterfactual/sunken-archive-timeline`.
     - Clicked `#fork-counterfactual-branch-btn`.
     - Successfully branched and switched active workspace project to child branch.
     - Child project retained valid `counterfactual_metadata_json` with parent lineage.
     - Switched back to `main` branch: verified parent canon remained 100% immutable and intact (`Bio-City`).
- **Visual Artifacts:**
  - `phase19_counterfactual_matrix.png`
  - `phase19_counterfactual_forked_timeline.png`

---

## 3. Requirements Traceability Matrix

| Requirement | Description | Implementation | Status |
|-------------|-------------|----------------|--------|
| **CNTR-01** | Counterfactual replay mode allows creators to inspect rejected candidate worlds and fork alternative timeline branches without re-running full universe generation. | `CounterfactualService.get_counterfactual_candidates`, `CounterfactualService.fork_counterfactual_branch`, `CounterfactualReplayCanvas`, `#codex-tab-replay`, `#launcher-counterfactual-replay-btn`, `#fork-counterfactual-branch-btn` | ✅ PASS |
| **CNTR-02** | Side-by-side comparative matrix highlights divergence in protagonist, tone, conflict, and lore assumptions with clean narrative prose and zero CoT leak. | `CounterfactualService.compute_counterfactual_delta`, 50/50 comparative matrix, 4 divergence delta cards, exploration profile comparison meters | ✅ PASS |

---

## 4. Next Phase

**Phase 20: Human-Only Zones (HOZ-01, HOZ-02)**:
Provide creator-locked creative controls for defining core theme, protagonist motivation, and central conflict before AI expansion, protected from AI override, marked as `HUMAN_DECISION` across Decision DNA and Origin Ledger.
