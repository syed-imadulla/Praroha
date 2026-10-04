# Seed Unfold — Product Concepts Glossary

This dictionary defines the fundamental product concepts that form the conceptual grammar of **Seed Unfold**. These concepts must remain discoverable, consistent, and strictly adhered to across all specifications, code, and agent operations.

---

### 1. Seed
The raw, unfiltered input provided by the user. It may be a short phrase, a single sentence, a fragment, a thematic question, or an initial prompt (e.g., *"A child discovers a forgotten city beneath the ocean"*). The original seed is immutable; it is never overwritten or mutated.

### 2. Intent / Understanding
The first AI interpretation pass over the raw seed. Rather than immediately leaping into generation, the system parses the implicit core conflict, emotional core, scope, target audience, and underlying desires hidden within the ambiguous seed.

### 3. Seed DNA
The structured, canonical data representation extracted during the Understanding phase. It normalizes the seed into validated fields:
- `core_premise`: Fundamental statement of the scenario.
- `themes`: Central motifs and philosophical ideas.
- `entities`: Key nouns, beings, or central artifacts.
- `constraints`: Boundaries and negative constraints (what cannot happen).
- `tone`: Emotional register (e.g., melancholic, awe-inspiring, suspenseful).
- `domain_keywords`: Key taxonomy tags for downstream prompt grounding.
Seed DNA serves as the bedrock anchor for all downstream unfolding.

### 4. Three World Candidates
The branching engine's output. Given the Seed DNA, the system generates **exactly three** distinct, creative, and viable world interpretations (World A, World B, World C). Each candidate has a distinct creative angle, logline, aesthetic mood, and structural trade-off.

### 5. Human Selection
The mandatory user-in-the-loop decision gate. Seed Unfold never autonomously picks a world. The human user compares the three candidates side-by-side, reviews their trade-offs, and explicitly selects one to champion.

### 6. Selected World
The chosen candidate that forms the active foundation for deep world unfolding. All future stages inherit the combined context of the original Seed DNA and this Selected World.

### 7. World Bible
The master codex of the selected world. Contains the physical laws, magic or technology systems, geographical landscape, cultural factions, historical chronology, and core socio-political tensions.

### 8. Characters
The individuals and entities populating the selected world. Each character is grounded in the world's rules and Seed DNA constraints, with defined motivations, backstories, flaws, and distinctive voices.

### 9. Relationships
The social, political, and emotional network connecting characters and factions. Maps alliances, rivalries, debts, familial ties, and conflicting agendas across the world.

### 10. Scenes
Key narrative moments, dramatic encounters, or episodic story beats that unfold within the world. Each scene tracks its active characters, setting, dramatic conflict, and consequences for the world state.

### 11. Assets
Sensory and multimedia artifacts generated to illustrate the world (e.g., concept art prompts, generated images, mood soundtracks, dialogue snippets, prototype storyboards). Assets are optional and subordinate to the text narrative.

### 12. Traceability
The system capability that records and visualizes the causal parent-child lineage of every generated item. Users can click any character, scene, or world rule to see exactly what decisions, rules, and seed inputs created it.

### 13. Refine
The localized iteration loop. Allows the user to tweak constraints, adjust attributes, or regenerate a specific sub-component (e.g., rewrite a scene or alter a character's backstory) without invalidating the rest of the universe.

### 14. Branch
The macro exploration capability. Enables the user to fork the project at any stage (e.g., branching back to try World B, or creating an alternate timeline from Scene 2) while preserving the original branch in a pristine, accessible state.

### 15. Save / Load
Full project state persistence. Serializes the seed, Seed DNA, three world candidates, human choice, unfolded mini-universe, version history, and complete lineage graph into persistent storage.

### 16. Canon
The established, immutable truths of the unfolded world. Once an element is locked into canon, downstream generation must respect it as ground truth. Canon can only be modified through explicit, auditable user actions.

### 17. Provenance
The formal audit record answering *why* an element exists and *where* it originated. It connects artifacts to parent nodes (e.g., `derived_from`, `constrained_by`) with human-intelligible justifications, without exposing private LLM chain-of-thought tokens.
