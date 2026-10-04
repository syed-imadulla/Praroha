# Phase 2 Context: Seed Understanding + Seed DNA

## Phase Goal
Enable users to enter or choose a creative seed, execute an AI understanding pass that extracts structured Seed DNA (premise, themes, entities, constraints, tone, domain keywords), inspect the DNA parameters in the workspace shell and inspector drawer, and maintain raw seed immutability.

---

<decisions>
## Implementation Decisions

### AI Provider & Extraction Engine
- **D-01:** Implement `GeminiProvider(AIProvider)` utilizing Google Gemini API with structured JSON/schema extraction and automatic `MockProvider` fallback if key is missing or calls fail. — **Reversibility:** costly — defines live AI extraction client.
- **D-02:** Strict Pydantic SeedDNA schema validating premise, themes, entities, constraints, tone, and domain_keywords before returning. — **Reversibility:** one-way — standardizes Seed DNA data contract across all downstream phases.
- **D-03:** Raw user input seed text is stored permanently and immutably in SQLModel SeedDNARecord table alongside extracted SeedDNA. — **Reversibility:** one-way — permanent project rule.

### User Experience & Seed Ingestion
- **D-04:** Input canvas provides canonical demo seed and 2 genre presets (Sci-Fi orbital ark, Fantasy whispering forest) alongside freeform textarea. — **Reversibility:** reversible — front-end input presets.
- **D-05:** Submitting seed displays animated understanding pass state and automatically transitions workspace to Stage 2 (understand). — **Reversibility:** reversible — stage transition logic.
- **D-06:** Seed DNA parameters are presented as a structured inspection pass; users can adjust raw seed and re-extract if desired. — **Reversibility:** reversible.

### Inspector Drawer & Visual Presentation
- **D-07:** Inspector Drawer renders structured cards with cyan theme pills, emerald entity pills, and amber warning constraint badges. — **Reversibility:** reversible — UI presentation component.
- **D-08:** Quick-action button in Inspector Drawer allows copying formatted Seed DNA JSON to clipboard or exporting it. — **Reversibility:** reversible.
</decisions>

---

## Out of Scope (Deferred to Future Phases)
- **World Generation (Phase 3)**: Generating the 3 distinct world candidates will happen in Phase 3; Phase 2 strictly ends at Seed DNA extraction and inspection.
- **Human Choice Gate (Phase 4)**: World comparison and selection.
- **Full Traceability Graph Rendering (Phase 6)**: DAG visualization in the Traceability tab.
- **Image Generation / Visual Assets**: Concept art generation for Seed DNA is deferred; focus is on semantic intent.
