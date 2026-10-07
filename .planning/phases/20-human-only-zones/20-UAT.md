# Phase 20: Human-Only Zones — User Acceptance Testing (UAT) Report

**Milestone:** 2 — Semantic Intelligence + Generative Media  
**Phase:** 20 — Human-Only Zones  
**Requirements Verified:** HOZ-01, HOZ-02  
**Date:** October 8, 2026  
**Status:** ✅ ALL TESTS PASSED (100% Verified)

---

## 1. Executive Summary

Phase 20 delivers **Human-Only Zones (HOZ)**, granting human creators inviolable creative sovereignty before AI expansion begins. Creators can lock their Core Theme, Protagonist Motivation, and Central Conflict in Stage 4. These locked parameters are protected by a strict dual-layer AI defense system:

1. **Stage 4 Creator-Locked Controls & Lock Semantics (HOZ-01)**:
   - Dedicated `#human-only-zones-panel` in Stage 4 with amber/gold styling (`border-amber-500/40`, `bg-amber-950/20`), padlock icons, and the explainer badge: `"HUMAN-ONLY ZONES: INVIOLABLE CREATIVE AXIOMS"`.
   - 3 dedicated inputs: Core Theme (`#hoz-input-theme`), Protagonist Motivation (`#hoz-input-motivation`), and Central Conflict (`#hoz-input-conflict`).
   - "Suggest from Selected World" button (`#hoz-suggest-btn`) populates unlocked draft suggestions only; creator must explicitly click "Lock Parameters" (`#hoz-lock-toggle-btn`) to freeze inputs into a readonly state with glowing amber lock badges.
2. **Dual-Layer Invariance Defense System (HOZ-01 & HOZ-02)**:
   - **Layer 1: Strict Prompt Invariance Contract**: Formats an immutable contract block `=== IMMUTABLE HUMAN-ONLY ZONES (CREATOR LOCKS) ===` with all 3 locked fields and the explicit zero-override directive: `"STRICT ZERO-OVERRIDE RULE: You MUST construct all world bible lore, character motivations, and narrative beats strictly around these exact anchors. Do NOT alter, soften, replace, or reinterpret these locked principles."`
   - **Layer 2: Deterministic Backend Schema Guard**: `enforce_human_only_zones_guard` post-processes generated data to guarantee exact verbatim restoration of the creator's locked values for canon facts, protagonist motivation, and climax conflict even if AI models drift or hallucinate, with 0 Chain-of-Thought leak.
3. **Universal Origin Ledger & Causal Lineage DAG Integration (HOZ-02)**:
   - Locked parameters are immutably tagged with `origin_type = 'HUMAN_DECISION'` and `origin_source = 'Human-Only Zone: <field>'`.
   - "Why is this here?" modal displays a prominent lock banner and deterministic plain-language attribution: *"Locked by the human creator as an inviolable Human-Only Zone before universe expansion."*
   - Causal Lineage DAG reflects `HUMAN_DECISION` nodes with locked zone metadata on the selection node.
4. **Stage 5 Pre-Unfold Banner & Codex Card Indicators (HOZ-02)**:
   - `#human-only-zones-summary-banner` rendered in Stage 5 showing active creator locks before and after unfolding.
   - `CREATOR LOCKED` pill badges displayed on Character cards (Protagonist Motivation), Scene cards (Central Conflict), and World Bible lore (Core Theme).
5. **Instant Demo Universe Seeding**:
   - Canonical ocean seed project seeded with all 3 canonical Human-Only Zones and proper `HUMAN_DECISION` citations.

---

## 2. Test Execution Results

### 2.1 Backend Automated Suite (Pytest)
- **Scope:** 154 total tests across all modules (including 8 dedicated tests in `backend/tests/test_human_only_zones.py`).
- **Result:** `154 passed in 23.84s` (100% pass rate, 0 regressions across Phases 1–20).
- **Dedicated Phase 20 Tests:**
  - `test_human_only_zones_model_serialization`: Validates Pydantic schema validation, serialization, and round-trip fidelity.
  - `test_backward_compatibility_legacy_selections`: Verifies legacy projects without `human_only_zones_json` deserialize safely without crashes.
  - `test_save_world_selection_with_human_only_zones`: Validates SQLite column migration and round-trip persistence of locked zones.
  - `test_prompt_contract_exact_invariance`: Verifies exact header `=== IMMUTABLE HUMAN-ONLY ZONES (CREATOR LOCKS) ===`, all 3 fields, zero-override text, zero CoT tokens, and absence when unlocked/empty.
  - `test_schema_guard_enforces_all_three_zones_exact_immutability`: Injects deliberately drifted/hallucinated model response; asserts backend schema guard deterministically restores exact strings for all 3 zones with `HUMAN_DECISION` origin citations.
  - `test_full_pipeline_unfold_with_human_only_zones`: Verifies full end-to-end unfolding through API preserves creator locks in the returned codex.
  - `test_origin_ledger_and_causal_dag_attribution`: Verifies `origin_type = 'HUMAN_DECISION'` across entity records, Origin Ledger, Causal DAG nodes, and deterministic "Why is this here?" explainer.
  - `test_canonical_demo_includes_human_only_zones`: Verifies instant demo universe seeds all 3 canonical zones with `HUMAN_DECISION` lineage.

### 2.2 Frontend Build & TypeScript Validation
- **Command:** `npm --prefix frontend run build`
- **Result:** Clean exit code 0 (`tsc && vite build`); 1,970 modules transformed, 0 TypeScript errors.

### 2.3 End-to-End Browser Automation (Playwright)
- **Script:** `frontend/e2e/test_phase20_human_only_zones.cjs`
- **Result:** All 7 user scenarios executed and passed with exit code 0.
- **Scenarios Verified:**
  1. **Stage 4 Human-Only Zones Panel Render (HOZ-01):**
     - Navigated fresh project from Stage 1 to Stage 4.
     - Verified `#human-only-zones-panel` renders with 3 inputs (`#hoz-input-theme`, `#hoz-input-motivation`, `#hoz-input-conflict`), lock toggle (`#hoz-lock-toggle-btn`), and suggest button (`#hoz-suggest-btn`).
  2. **Suggestion Draft & Lock Semantics (HOZ-01):**
     - Clicked "Suggest from Selected World", confirmed fields populated as unlocked draft text.
     - Entered custom values for all 3 zones.
     - Clicked "Lock Parameters", verified inputs froze into readonly state with glowing amber lock badges.
     - Captured visual artifact: `phase20_human_only_zones_panel.png`.
  3. **Commit Selection with Human-Only Zones (HOZ-01):**
     - Confirmed world selection; verified transition to Stage 5 with locked zones transmitted in payload.
  4. **Stage 5 Pre-Unfold Summary Banner (HOZ-01 & HOZ-02):**
     - Verified `#human-only-zones-summary-banner` is displayed prior to unfolding showing all 3 locked parameters and `CREATOR LOCKED` pill badge.
  5. **Unfold Universe & Verify Creator Locked Badges (HOZ-01 & HOZ-02):**
     - Unfolded universe into Codex.
     - Tab 1 (World Bible): Verified Core Theme rendered verbatim with `CREATOR LOCKED` badge and `HUMAN_DECISION` origin badge.
     - Tab 2 (Characters): Verified Protagonist Motivation rendered verbatim with `CREATOR LOCKED` badge and `HUMAN_DECISION` origin badge.
     - Tab 3 (Story Beats): Verified Central Conflict rendered verbatim with `CREATOR LOCKED` badge and `HUMAN_DECISION` origin badge.
     - Captured visual artifact: `phase20_stage5_locked_codex.png`.
  6. **Conflicting Expansion Invariance Resilience (HOZ-02):**
     - Verified dual-layer defense guarantees exact creator lock strings in UI without any model hallucination.
  7. **"Why is this here?" Modal HOZ Attributions (HOZ-02):**
     - Clicked origin badge on locked scene; verified `#why-modal-hoz-callout` appears with explicit lock attribution: *"Locked by human creator before universe expansion. AI models are strictly prohibited from overriding this constraint."*
  8. **Regression Verification:**
     - Verified Phase 19 Counterfactual Replay remains fully operational.
     - Verified Phase 18 Seed Mutation Lab remains fully operational.

---

## 3. Visual Artifacts Captured

| Artifact | Path | Description |
|---|---|---|
| **Stage 4 Locked Panel** | `phase20_human_only_zones_panel.png` | Amber-accented Human-Only Zones panel in Stage 4 with locked Core Theme, Protagonist Motivation, and Central Conflict. |
| **Stage 5 Locked Codex** | `phase20_stage5_locked_codex.png` | Stage 5 Codex showing `#human-only-zones-summary-banner` and `CREATOR LOCKED` indicators across character and scene cards. |

---

## 4. Verification Sign-Off

- **HOZ-01 (Creator-Locked Controls & Dual-Layer AI Invariance):** Verified ✅
- **HOZ-02 (Causal Provenance, Lineage DAG & Codex Visual Indicators):** Verified ✅
- **Zero Regressions:** 154/154 backend tests pass, full frontend production bundle builds cleanly, Playwright E2E 7/7 scenarios pass ✅
- **Milestone 2 Completion:** Phase 20 is complete, achieving 100% delivery of Milestone 2 (Phases 11–20, 40/40 plans)!
