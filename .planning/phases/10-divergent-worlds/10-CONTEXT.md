# Phase 10 Context: Divergent Worlds Engine

**Milestone:** 2 — Semantic Intelligence + Generative Media  
**Phase:** 10 — Divergent Worlds Engine (`DIV-01`, `DIV-02`, `DIV-03`)  
**Status:** Ready for Research & Planning  
**Date:** October 7, 2026  

---

## 1. Phase Goal
Transform candidate world generation from generic contrasting archetypes into an intentional **Divergence Engine**. The engine synthesizes exactly three distinct exploration archetypes (**Familiar**, **Radical**, **Inverse**), generates an **Exploration Profile** across four key dimensions (Seed Fidelity, Novelty, Conceptual Distance, Feasibility), and strictly anchors generation to the creator's accepted and rejected Seed Potential items from Phase 9.

---

## 2. Divergence Archetypes

Each generation batch produces exactly three worlds, mapped to one of three canonical divergence archetypes:

1. **World A: Familiar (High Seed Fidelity)**
   - *Nature*: Grounded, intuitive, direct realization of the seed premise.
   - *Profile Tendency*: High Seed Fidelity (85–95%), High Feasibility (80–90%), Moderate Novelty (40–60%), Low Conceptual Distance (20–40%).
   - *Role*: Satisfies the creator's immediate intuition and provides an accessible, grounded narrative baseline.

2. **World B: Radical (High Novelty & Paradigm Shift)**
   - *Nature*: Transformative leap, symbiotic/ecological/metaphysical mutation of the premise.
   - *Profile Tendency*: Very High Novelty (85–98%), High Conceptual Distance (70–85%), Moderate-High Feasibility (60–75%), Moderate Fidelity (50–70%).
   - *Role*: Expands creative horizons with a bold, unexpected interpretation.

3. **World C: Inverse (Conceptual Subversion)**
   - *Nature*: Conceptual flip or subversion of core assumptions (e.g. what if the discovery is a trap, or the discoverer is the one being studied?).
   - *Profile Tendency*: Extreme Conceptual Distance (80–95%), High Novelty (75–90%), Moderate Fidelity (45–65%), Polarized Feasibility.
   - *Role*: Tests the boundary conditions of the creative seed through dramatic reversal.

---

## 3. Exploration Profile Metrics (0–100%)

Each world candidate includes an **Exploration Profile** evaluated across four normalized dimensions:

| Dimension | Color Theme | Description |
|---|---|---|
| **Seed Fidelity** | Cyan (`#06b6d4`) | Alignment with literal seed anchors, explicit entities, and tone. |
| **Novelty** | Violet (`#8b5cf6`) | Conceptual uniqueness, originality, and surprise factor. |
| **Conceptual Distance** | Rose (`#f43f5e`) | How far the world departs from conventional genre tropes. |
| **Feasibility** | Emerald (`#10b981`) | Internal world coherence, narrative tractability, and worldbuilding stability. |

---

## 4. Seed Potential Map Integration (Phase 9 Bridge)

- **Accepted Potential Items**: Injected as **mandatory creative pillars** into the generation prompt. Each candidate explicitly highlights which accepted potential items it emphasizes.
- **Rejected Potential Items**: Injected as **strict negative constraints** (e.g. *"Do NOT include the following rejected concepts: [list]"*).
- **Open Questions**: Used as catalytic inspiration for the candidate's `core_tension` and `trade_offs`.

---

<decisions>
## 5. Implementation Decisions

### D-01: Data Model Expansion (`backend/app/models/world.py`)
- Define `DivergenceArchetype` enum (`familiar`, `radical`, `inverse`).
- Define `ExplorationProfile` schema:
  - `seed_fidelity: int` (0–100)
  - `novelty: int` (0–100)
  - `conceptual_distance: int` (0–100)
  - `feasibility: int` (0–100)
  - `summary: str` (1 sentence explanation of the profile)
- Add fields to `WorldCandidate`:
  - `divergence_archetype: str`
  - `exploration_profile: ExplorationProfile`
  - `emphasized_potential_labels: List[str]`
- Add corresponding columns/JSON storage in `WorldCandidateRecord` with backward-compatible defaults.

### D-02: AI Provider Engine (`backend/app/providers/`)
- Update `AIProvider.generate_worlds(dna, potential_items=None)` to accept optional potential items list.
- **GeminiProvider**:
  - System prompt instructs model to synthesize the triad: Familiar, Radical, and Inverse.
  - Injects accepted items as required pillars and rejected items as negative constraints.
  - Generates structured JSON adhering to the updated `ExplorationProfile` schema.
- **MockProvider**:
  - Canonical ocean fixtures mapped deterministically:
    - Candidate 1: *Lost Civilization* → `familiar` (Fidelity: 92%, Novelty: 54%, Distance: 28%, Feasibility: 88%)
    - Candidate 2: *Bio-City* → `radical` (Fidelity: 68%, Novelty: 94%, Distance: 82%, Feasibility: 72%)
    - Candidate 3: *Time Capsule* → `inverse` (Fidelity: 58%, Novelty: 82%, Distance: 88%, Feasibility: 65%)
  - Dynamic heuristic fallback for arbitrary seeds synthesizes contrasting scores across the 3 archetypes.

### D-03: Repository & Service Layer (`backend/app/repositories/project_repo.py`)
- When generating worlds for a project, automatically fetch the project's current potential items (`user_status == 'accepted'` and `'rejected'`) and pass to provider.
- Persist divergence archetype and exploration profile fields cleanly.

### D-04: Frontend Presentation (`frontend/src/components/WorldCandidateCard.tsx`)
- Archetype Badges: Render prominent top badges on candidate cards:
  - `Familiar • Grounded Archetype` (Cyan)
  - `Radical • Paradigm Shift` (Emerald/Violet)
  - `Inverse • Conceptual Subversion` (Amber/Rose)
- Exploration Profile Meters: 4 horizontal color-coded progress bars (Fidelity, Novelty, Distance, Feasibility) with percentage indicators and clean tooltips/labels.
- Emphasized Potential Tags: Small badge pills indicating which accepted potential items this candidate incorporates.

### D-05: Demo Resilience & Backward Compatibility
- 100% offline-ready canonical demo fixtures pre-populated with divergence profiles.
- Any existing or legacy world candidates without exploration profiles fall back to sensible defaults without throwing null-pointer exceptions.
</decisions>

---

## 6. Out of Scope for Phase 10
- **Decision DNA (Phase 11)**: Tracking why the user picked a specific candidate and propagating that choice downstream belongs to Phase 11.
- **Origin Ledger (Phase 12)**: Tagging entities as `SEED_EXPLICIT` vs `HUMAN_DECISION` belongs to Phase 12.
- **Media Generation (Phases 13–17)**: Generating image/video/audio assets belongs to subsequent phases.
