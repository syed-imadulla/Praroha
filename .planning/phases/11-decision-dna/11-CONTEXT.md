# Phase 11 Context: Decision DNA

**Milestone:** 2 — Semantic Intelligence + Generative Media  
**Phase:** 11 — Decision DNA (`DDNA-01`, `DDNA-02`, `DDNA-03`)  
**Status:** Ready for Research & Planning  
**Date:** October 7, 2026  

---

## 1. Phase Goal
Capture rich, intentional human creative choices during **Stage 4: World Selection** into a persistent **Decision DNA** record. Instead of treating selection as a simple pointer to a candidate ID, Decision DNA captures the creator's rationale, prioritized thematic pillars, automatically inferred and custom rejected directions, and explicit creative notes. This Decision DNA is relationally persisted and injected as an immutable creative contract into all downstream universe unfolding operations (World Bible, Characters, Relationships, Scenes) in **Stage 5**.

---

## 2. Core Elements of Decision DNA

A complete Decision DNA record consists of:

1. **Selected World Direction**:
   - `world_candidate_id`: ID of chosen world.
   - `selected_title`: e.g. "Bio-City".
   - `selected_archetype`: e.g. "radical" / "Bio-City (Symbiotic / Ecological)".

2. **Creator Rationale**:
   - Freeform explanation of why this world was chosen over alternatives.

3. **Creative Priorities**:
   - Interactive preset tags + custom user tags.
   - Preset options:
     - `Atmospheric Lore Depth`
     - `Character-Driven Conflict`
     - `Ecological / Symbiotic Mystery`
     - `Philosophical & Ethical Stakes`
     - `Visceral Sensory Worldbuilding`
     - `Intimate Personal Scale`

4. **Rejected Directions & Creative Guardrails**:
   - Inferred from the two non-selected candidate worlds (e.g. for Bio-City selection, reject "Classical submerged archaeology tropes" and "Cold War retro-tech military paranoia").
   - Creators can toggle these inferred exclusions on/off or add custom negative guardrails (e.g. "No magical teleportation").

5. **Custom Creative Directives**:
   - Specific non-negotiable guidelines provided by the user for subsequent generation.

---

## 3. Downstream Propagation & Integration (Stage 5 Bridge)

- **AI Prompt Injection**:
  - Unfolding prompts for World Bible, Characters, and Scenes receive a dedicated `DECISION DNA CREATIVE CONTRACT` section:
    - `MANDATORY CREATIVE PRIORITIES`: Prioritize [priorities list].
    - `NEGATIVE GUARDRAILS & REJECTED DIRECTIONS`: Strictly avoid [rejected directions list].
    - `CREATOR RATIONALE`: [user rationale].
- **Stage 5 Codex UI Presentation**:
  - Persistent **Decision DNA Summary Strip** in Stage 5 header / inspector drawer:
    - Highlights the locked priorities and rejected directions.
    - Provides creators with complete transparency on how their Stage 4 choices shaped the generated universe.

---

<decisions>
## 4. Implementation Decisions

### D-01: Data Model Expansion (`backend/app/models/selection.py`)
- Define `DecisionDNA` schema:
  - `selected_world_id: str`
  - `selected_title: str`
  - `selected_archetype: str`
  - `user_rationale: Optional[str] = None`
  - `creative_priorities: List[str] = []`
  - `rejected_directions: List[str] = []`
  - `custom_directives: Optional[str] = None`
  - `created_at: datetime`
- Extend `WorldSelectionBase` and `WorldSelectionRecord`:
  - `creative_priorities_json: str = Field(default="[]")`
  - `rejected_directions_json: str = Field(default="[]")`
  - `custom_directives: Optional[str] = Field(default=None)`
- Extend `WorldSelectionCreate`:
  - `user_rationale: Optional[str] = None`
  - `creative_priorities: List[str] = []`
  - `rejected_directions: List[str] = []`
  - `custom_directives: Optional[str] = None`
- Extend `WorldSelectionRead` to return full `DecisionDNA` payload.

### D-02: Repository & Database Migration (`backend/app/repositories/project_repo.py`)
- In `_migrate_columns`:
  - Ensure columns `creative_priorities_json`, `rejected_directions_json`, `custom_directives` are migrated on `world_selections`.
- In `select_world_candidate`:
  - Accept and persist priorities, rejected directions, and custom directives.
- In `create_canonical_demo_project`:
  - Pre-populate canonical Decision DNA for Bio-City:
    - Priorities: `["Ecological / Symbiotic Mystery", "Atmospheric Lore Depth", "Ethical Stakes"]`
    - Rejected Directions: `["Classical sunken ruins archaeology", "Cold War militarized technology"]`
    - Rationale: `"Selected Bio-City for deep biopunk exploration and rich ecological tension."`

### D-03: Provider & Unfold Router Integration (`backend/app/routers/unfold.py` & `providers/`)
- In `unfold_universe` route:
  - Fetch active `WorldSelectionRecord` and build `DecisionDNA`.
  - Pass `decision_dna` dictionary into `context` object for `ai_provider.unfold_universe(context)`.
- In `GeminiProvider`:
  - Format `decision_dna` into explicit system instructions and prompt contents with mandatory positive pillars and negative constraints.
- In `MockProvider`:
  - Inspect `decision_dna` in canonical and fallback generation.

### D-04: Stage 4 Selection UI (`frontend/src/components/WorldSelectionCanvas.tsx`)
- Enhance the selection drawer / confirmation panel with:
  - Priority selector chips (toggleable presets + custom input tag).
  - Inferred rejected directions checklist (auto-populated based on the other 2 candidates, with toggle checkboxes).
  - Freeform rationale and custom directives textarea.
- Store updates in `workspaceStore`:
  - Update `confirmWorldSelection(worldId, payload)` to transmit full Decision DNA payload.

### D-05: Stage 5 Codex UI (`frontend/src/components/UniverseCodexCanvas.tsx`)
- Display a dedicated **Decision DNA Anchor Pill Bar** at the top of the universe codex:
  - Displays selected archetype, top priorities, and active exclusions.
  - Clicking opens the Inspector tab to view the complete Decision DNA.
</decisions>

---

## 5. Out of Scope for Phase 11
- **Universal Entity Origin Ledger (Phase 12)**: Tagging individual characters, scenes, and lore items as `HUMAN_DECISION` vs `AI_INTRODUCED` belongs to Phase 12.
- **Media Asset Generation (Phases 13–17)**: Generating voice, image, or video assets belongs to subsequent phases.
- **Mutation & Counterfactual Lab (Phases 18–19)**: Modifying Decision DNA after unfolding begins belongs to Phase 18/19.
