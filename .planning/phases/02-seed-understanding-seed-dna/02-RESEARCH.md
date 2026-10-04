# Phase 2 Research: Seed Understanding + Seed DNA

## Domain & Problem Analysis
Phase 2 turns a raw, ambiguous creative thought into structured semantic intent ("Seed DNA") without rushing into generative narrative output.

### The Seed DNA Contract
The Seed DNA represents the invariant boundary parameters of the unfolding universe:
1. **Core Premise**: The foundational narrative or conceptual conceit distilled from the user's input.
2. **Implicit Themes**: Underlying philosophical, dramatic, or thematic tensions (e.g. "Preservation vs. Exploitation").
3. **Identified Entities**: Core figures, artifacts, structures, or ecological systems implied by the seed.
4. **Boundary Constraints**: Strict guardrails ("what this world does NOT contain", e.g. "No modern surface military intervention").
5. **Emotional Tone**: The atmosphere and mood governing subsequent world generation (e.g. "Awe-inspiring, melancholic").
6. **Domain Keywords**: Specific semantic anchors used for prompting downstream generators.

---

## Technical Architecture & Implementation Patterns

### 1. Gemini Structured Extraction Pattern
Google Gemini 1.5/2.0 natively supports structured JSON outputs through its `generationConfig`:
```json
{
  "response_mime_type": "application/json",
  "response_schema": {
    "type": "OBJECT",
    "properties": {
      "premise": { "type": "STRING" },
      "themes": { "type": "ARRAY", "items": { "type": "STRING" } },
      "entities": { "type": "ARRAY", "items": { "type": "STRING" } },
      "constraints": { "type": "ARRAY", "items": { "type": "STRING" } },
      "tone": { "type": "STRING" },
      "domain_keywords": { "type": "ARRAY", "items": { "type": "STRING" } }
    },
    "required": ["premise", "themes", "entities", "constraints", "tone", "domain_keywords"]
  }
}
```
Using an asynchronous `httpx.AsyncClient` with a 15-second timeout ensures fast, non-blocking requests without adding bulky external dependencies.

### 2. Resilience & Fallback Hierarchy
When `extract_dna(seed)` is called:
1. If `settings.AI_PROVIDER == "mock"`: immediately return deterministic canonical fixtures.
2. If `settings.AI_PROVIDER == "gemini"`:
   - Check if `settings.GEMINI_API_KEY` is present. If missing, log a warning and delegate to `MockProvider` with `fallback_used: true`.
   - Call Gemini endpoint via async `httpx`.
   - If response status is non-200, or payload fails Pydantic `SeedDNA` validation, or a timeout occurs, catch exception and delegate to `MockProvider` with `fallback_used: true` and diagnostic warning message.
   - Return verified `APIResponse[SeedDNAResponse]`.

### 3. Immutability & Persistence
In `backend/app/models/dna.py`:
- `SeedDNARecord` table stores `project_id`, `raw_seed`, `premise`, `themes_json`, `entities_json`, `constraints_json`, `tone`, `domain_keywords_json`, `model_used`, `fallback_used`, `created_at`.
- Even if a user updates their prompt and re-extracts, previous records remain intact in the database with their respective timestamps.

---

## Frontend Component & Visual Strategy
- **Seed Input**: Multi-line textarea with word counter, canonical prompt chip, and 2 diverse genre preset buttons.
- **Extraction Loader**: Cyan glowing pulse showing semantic analysis steps: *"Extracting premise..."* → *"Identifying constraints..."* → *"Structuring Seed DNA..."*
- **Inspector Drawer Cards**:
  - Premise: prominent dark callout card with cyan left accent.
  - Themes: cyan glowing pills (`bg-cyan-950/60 text-cyan-300 border-cyan-800/60`).
  - Entities: emerald pills (`bg-emerald-950/60 text-emerald-300 border-emerald-800/60`).
  - Constraints: amber warning badges (`bg-amber-950/60 text-amber-300 border-amber-800/60`).
  - Tone & Keywords: zinc badges with copy-as-JSON action.
