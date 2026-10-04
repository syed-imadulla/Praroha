# Phase 2 Context: Seed Understanding + Seed DNA

## Phase Goal
Enable users to enter or choose a creative seed, execute an AI understanding pass that extracts structured Seed DNA (premise, themes, entities, constraints, tone, domain keywords), inspect the DNA parameters in the workspace shell and inspector drawer, and maintain raw seed immutability.

---

## Decisions & Boundaries

### AI Provider & Extraction Engine
- **D-01**: **Gemini Provider with Mock Fallback**: Implement `GeminiProvider(AIProvider)` utilizing Google Gemini API with structured JSON/schema extraction. If `GEMINI_API_KEY` is missing or invalid, or if the API request times out/fails, fallback automatically to `MockProvider` returning deterministic canonical fixtures with a `{ fallback_used: true, warning: '...' }` envelope. — **Reversibility:** costly — defines live AI extraction client.
- **D-02**: **Strict Pydantic SeedDNA Schema**: Seed DNA data model enforced across backend and frontend:
  ```python
  class SeedDNA(BaseModel):
      premise: str
      themes: List[str]
      entities: List[str]
      constraints: List[str]
      tone: str
      domain_keywords: List[str]
  ```
  Any LLM output must be parsed and validated through this schema before returning to the frontend. — **Reversibility:** one-way — standardizes Seed DNA data contract across all downstream phases.
- **D-03**: **Raw Seed Immutability Contract**: The raw user input seed text is stored permanently and immutably alongside the extracted `SeedDNA`. Subsequent understanding passes or re-runs create a new version without mutating past runs. — **Reversibility:** one-way — permanent project rule (Rule #1).

### User Experience & Seed Ingestion
- **D-04**: **Presets & Seed Ingestion UX**: Canvas provides the canonical ocean city prompt (*"A child discovers a forgotten city beneath the ocean"*) plus two diverse presets (Sci-Fi orbital generation ship, Ancient whispering forest) for instant exploration, alongside a freeform multi-line text input with character/word counting. — **Reversibility:** reversible — front-end input presets.
- **D-05**: **Stage Transition (Seed -> Understand)**: Submitting a seed triggers the understanding pass, displays an animated analysis state (showing the model analyzing intent without generating final story content prematurely), and automatically unlocks and transitions the workspace to Stage 2 (`understand`). — **Reversibility:** reversible — stage transition logic.
- **D-06**: **Inspection-Only with Seed Refinement**: Seed DNA parameters are presented as a structured inspection pass. Users unsatisfied with the DNA can adjust their raw seed and re-run extraction, preserving the AI understanding boundary without ad-hoc parameter tampering. — **Reversibility:** reversible.

### Inspector Drawer & Visual Presentation
- **D-07**: **Structured Parameter Cards & Badge Chips**: The "Seed DNA" tab of `InspectorDrawer` renders dedicated cards:
  - Core Premise (highlighted callout)
  - Themes (cyan badge chips)
  - Entities (emerald badge chips)
  - Boundary Constraints (amber warning-styled badge chips)
  - Emotional Tone (styled italic badge)
  - Domain Keywords (slate badge chips)
  — **Reversibility:** reversible — UI presentation component.
- **D-08**: **Copy / Export DNA Action**: A quick-action button in the Inspector Drawer allows creators to copy the raw structured Seed DNA as formatted JSON to the clipboard or export it. — **Reversibility:** reversible.

---

## Out of Scope (Deferred to Future Phases)
- **World Generation (Phase 3)**: Generating the 3 distinct world candidates will happen in Phase 3; Phase 2 strictly ends at Seed DNA extraction and inspection.
- **Human Choice Gate (Phase 4)**: World comparison and selection.
- **Full Traceability Graph Rendering (Phase 6)**: DAG visualization in the Traceability tab.
- **Image Generation / Visual Assets**: Concept art generation for Seed DNA is deferred; focus is on semantic intent.
