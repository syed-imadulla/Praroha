# Phase 20: Human-Only Zones — Context & Decision Record

**Milestone:** 2 — Semantic Intelligence + Generative Media  
**Phase:** 20 — Human-Only Zones  
**Requirements:** HOZ-01, HOZ-02  
**Date:** October 8, 2026  
**Status:** Decisions Locked 🔒

---

## 1. Executive Overview & Problem Statement

While AI expansion in Stage 5 unfolds rich characters, locations, lore rules, and story beats, creators must retain absolute sovereignty over core thematic pillars and narrative motivations. Without hard constraints, AI models can dilute, drift from, or override fundamental human creative intent.

Phase 20 introduces **Human-Only Zones (HOZ)**, granting creators locked controls for three essential creative parameters before AI expansion begins:
1. **Core Theme** (e.g., philosophical thesis, emotional core)
2. **Protagonist Motivation** (e.g., internal drive, moral dilemma, primary quest)
3. **Central Conflict** (e.g., ideological struggle, foundational antagonism)

These parameters are immutably tagged with `HUMAN_DECISION` across **Decision DNA** and the **Universal Origin Ledger**, protected by a dual-layer AI defense mechanism, and traced directly into downstream universe entities.

---

## 2. Key Decisions Locked

### D-01: UX Placement & Journey
- **Stage 4 Integration (Human World Selection)**:
  - Inside [`SelectionCanvas.tsx`](file:///home/syed-imadulla/Desktop/Praroha/frontend/src/components/SelectionCanvas.tsx), alongside the candidate world cards, Decision DNA rationale, and creative priorities, add a prominent **Human-Only Zones (Creator Locks)** panel (`#human-only-zones-panel`).
  - Provides 3 dedicated input fields with visual lock icons (`Lock` / `Unlock` state), amber/gold glowing border accents (`border-amber-500/40`), and clear helper text explaining that locked values are inviolable axioms.
  - Can be pre-populated with suggested values derived from the chosen candidate or Seed DNA, with 1-click "Lock Parameter" toggles.
- **Stage 5 Pre-Unfold & Codex Preview**:
  - In [`UniverseCodexCanvas.tsx`](file:///home/syed-imadulla/Desktop/Praroha/frontend/src/components/UniverseCodexCanvas.tsx), before unfolding, display an **Active Human-Only Zones** banner highlighting the locked parameters.
  - After unfolding, show locked badges on the protagonist card, central conflict description, and lore facts with `CREATOR LOCKED` indicators.

### D-02: Dual-Layer AI Protection & Zero-Override Enforcement
- **Layer 1: Strict Prompt Invariance (LLM Contract)**:
  - In [`GeminiProvider.format_decision_dna_contract`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/providers/gemini_provider.py), append an explicit, high-priority instruction block:
    ```text
    === IMMUTABLE HUMAN-ONLY ZONES (CREATOR LOCKS) ===
    The following parameters were locked by the human creator and are INVIOLABLE AXIOMS:
    - CORE THEME: {core_theme}
    - PROTAGONIST MOTIVATION: {protagonist_motivation}
    - CENTRAL CONFLICT: {central_conflict}
    STRICT ZERO-OVERRIDE RULE: You MUST construct all world bible lore, character motivations, and narrative beats strictly around these exact anchors. Do NOT alter, soften, replace, or reinterpret these locked principles.
    ==================================================
    ```
- **Layer 2: Backend Schema Guard (Deterministic Post-Processing)**:
  - In [`unfold`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/routers/unfold.py) or `unfold_universe` pipeline, after receiving LLM expansion, verify and deterministically bind the locked fields:
    - The lead protagonist's core motivation/archetype alignment is guaranteed to reflect `protagonist_motivation`.
    - The central story conflict beat is guaranteed to embody `central_conflict`.
    - Any attempt by the model to hallucinate away from the locked parameters is intercepted and overwritten with the creator's exact words.
  - Zero Chain-of-Thought (CoT) leakage in all explanations.

### D-03: Data Model & Origin Ledger Persistence (HOZ-02)
- **Database Schema**:
  - Add `human_only_zones_json: Optional[str] = Field(default="{}", nullable=True)` to `world_selections` table.
  - Migration in [`ProjectRepository._migrate_columns`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/repositories/project_repo.py): `ALTER TABLE world_selections ADD COLUMN human_only_zones_json TEXT`.
- **Domain Models**:
  - In [`backend/app/models/selection.py`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/models/selection.py):
    - Define `HumanOnlyZones(BaseModel)` with fields:
      - `core_theme: Optional[str] = None`
      - `protagonist_motivation: Optional[str] = None`
      - `central_conflict: Optional[str] = None`
      - `is_locked: bool = True`
    - Add `human_only_zones: Optional[HumanOnlyZones] = None` to `DecisionDNA`, `WorldSelectionCreate`, and `WorldSelectionRead`.
- **Origin Ledger Integration**:
  - Entities directly embodying the locked zones (e.g., Protagonist Character, Key Lore Rule, Climax Scene) are tagged:
    - `origin_type`: `HUMAN_DECISION`
    - `origin_source`: `"Human-Only Zone: Protagonist Motivation"`, `"Human-Only Zone: Core Theme"`, or `"Human-Only Zone: Central Conflict"`.
  - In the "Why is this here?" explainer modal ([`WhyIsThisHereModal.tsx`](file:///home/syed-imadulla/Desktop/Praroha/frontend/src/components/WhyIsThisHereModal.tsx)), the causal justification states: *"Locked by the human creator as an inviolable Human-Only Zone before universe expansion."*

### D-04: Canonical Instant Demo Seeding
- In [`ProjectRepository.create_canonical_demo_project`](file:///home/syed-imadulla/Desktop/Praroha/backend/app/repositories/project_repo.py), seed the canonical Bio-City selection with pre-configured Human-Only Zones:
  - **Core Theme**: *"Coexistence between synthetic human biology and ancient abyssal intelligence"*
  - **Protagonist Motivation**: *"Decipher the sentient coral reef's neural frequency before corporate salvage crews arrive"*
  - **Central Conflict**: *"Bio-symbiont collective survival vs. extractive corporate exploitation"*
- Stamped with `HUMAN_DECISION` in Decision DNA, Origin Ledger, and Causal Lineage DAG.

---

## 3. Wave Architecture Plan

- **Wave 1: Backend Human-Only Zones & AI Protection Engine**:
  - `HumanOnlyZones` schema in `backend/app/models/selection.py`.
  - Database migration in `backend/app/repositories/project_repo.py`.
  - Contract formatting in `GeminiProvider.format_decision_dna_contract`.
  - Post-processing schema guard in unfolding pipeline.
  - Canonical demo seeding update.
  - Pytest regression suite.

- **Wave 2: Frontend Creator Lock Controls & Visual Indicators**:
  - Frontend TypeScript types and API client updates.
  - Stage 4 Human-Only Zones panel in `SelectionCanvas.tsx`.
  - Stage 5 locked zones banner & Codex card lock indicators in `UniverseCodexCanvas.tsx`.
  - Origin Ledger & Lineage DAG synchronization.
  - Playwright E2E verification test suite (`test_phase20_human_only_zones.cjs`).

---

## 4. Success Verification Criteria
1. User can define and lock `core_theme`, `protagonist_motivation`, and `central_conflict` in Stage 4.
2. Locked parameters are stored in `world_selections.human_only_zones_json` and serialized into `DecisionDNA`.
3. AI expansion prompt receives immutable `=== IMMUTABLE HUMAN-ONLY ZONES ===` contract block.
4. Backend schema guard enforces locked fields with zero AI deviation.
5. Generated protagonist and conflict entities bear `origin_type = 'HUMAN_DECISION'`.
6. Canonical demo seeds with complete Human-Only Zones.
7. 100% backend tests pass and Playwright E2E verifies UI, locks, and immutability.
