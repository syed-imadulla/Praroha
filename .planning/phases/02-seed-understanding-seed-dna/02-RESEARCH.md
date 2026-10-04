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

### 1. Gemini Current Stable API & Structured Extraction Pattern
Using the currently supported stable Gemini model identifier (`gemini-2.5-flash`, configurable via `settings.GEMINI_MODEL`), Google's current `generateContent` REST API supports strict schema enforcement and separate system instructions:

**Endpoint**:
`POST https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent`

**Headers**:
- `x-goog-api-key`: `{settings.GEMINI_API_KEY}`
- `Content-Type`: `application/json`

**Request Payload**:
```json
{
  "systemInstruction": {
    "parts": [
      {
        "text": "You are Seed Unfold's semantic understanding engine. Analyze the creative seed and distill its invariant Seed DNA parameters without generating final narrative or story content prematurely."
      }
    ]
  },
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Creative Seed: \"A child discovers a forgotten city beneath the ocean.\"" }]
    }
  ],
  "generationConfig": {
    "responseMimeType": "application/json",
    "responseSchema": {
      "type": "OBJECT",
      "properties": {
        "premise": { "type": "STRING", "description": "Core conceit and foundation of the seed" },
        "themes": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Implicit dramatic and thematic tensions" },
        "entities": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Core figures, relics, places, or structures" },
        "constraints": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Strict negative boundaries and exclusions" },
        "tone": { "type": "STRING", "description": "Atmospheric mood and aesthetic tone" },
        "domain_keywords": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Semantic keywords for world grounding" }
      },
      "required": ["premise", "themes", "entities", "constraints", "tone", "domain_keywords"]
    }
  }
}
```

**Response Parsing & Schema Validation**:
1. Extract content string from `data["candidates"][0]["content"]["parts"][0]["text"]`.
2. Parse JSON payload: `parsed_json = json.loads(text_content)`.
3. Validate through Pydantic: `seed_dna = SeedDNA.model_validate(parsed_json)`.
4. Wrap in `SeedDNARead` and return via `api_success(data=...)`.
5. On HTTP error, rate-limit, timeout, or Pydantic validation failure: catch exception, log warning, and fall back cleanly to `MockProvider().extract_dna(seed)` with `fallback_used: True`.

Using async `httpx.AsyncClient` with a 15-second timeout ensures non-blocking I/O while keeping external dependencies lean and isolated from domain logic.

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
