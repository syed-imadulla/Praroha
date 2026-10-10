# PRAROHA — Product Concepts Glossary

**Project:** PRAROHA (Seed → Universe)  
**Hackathon:** Vedanta Makeathon  
**Team:** Supreme  
**Philosophy:** Tatva 2 — Forms Hidden in Formless

This glossary defines the foundational concepts that form the conceptual grammar of **PRAROHA**.

---

### 1. Seed
The raw, unfiltered input premise provided by the creator. It may be a short phrase, a single sentence, a thematic question, or a creative scenario (e.g., *“A village where nobody can lie”*). In PRAROHA, the seed is the immutable root from which the entire universe grows.

### 2. Intent / Understanding
The initial AI interpretation pass over the raw seed. Rather than jumping directly to generation, Google Gemini analyzes the implicit core conflicts, emotional register, thematic scope, and latent narrative vectors hidden within the ambiguous seed.

### 3. Seed DNA
The structured, validated data representation extracted during the Understanding phase:
- `core_premise`: The fundamental statement of the world's situation.
- `themes`: Central philosophical motifs and emotional axes.
- `entities`: Key factions, artifacts, and figures.
- `constraints`: Inviolable boundaries (what cannot happen).
- `tone`: Aesthetic and emotional register (e.g., melancholic, wondrous, claustrophobic).
- `domain_keywords`: Grounding vocabulary for downstream generative passes.

### 4. Three World Candidates
The branching engine's output. Given the Seed DNA, PRAROHA synthesizes **exactly three** distinct, creative, and viable world interpretations (Grounded, Radical, and Inverse archetypes) exploring orthogonal directions of the same root seed.

### 5. Human Selection & Decision DNA
The mandatory user-in-the-loop choice gate. PRAROHA never autonomously picks a world direction. The human creator reviews the three candidates, compares their trade-offs, and commits to one direction. The creator's reasoning is recorded as **Decision DNA**, which acts as an active constraint on all downstream generation.

### 6. Selected World
The chosen candidate that forms the active foundation for deep world unfolding. Downstream stages inherit the unified context of the original Seed DNA and this committed world.

### 7. World Bible
The master codex of the selected world. Contains the physical laws, cultural history, societal factions, geography, and magic/technology systems.

### 8. Characters
The individuals populating the selected world. Each character is grounded in the world's rules and Seed DNA constraints, with defined motivations, flaws, narrative arcs, and visual prompt descriptors.

### 9. Relationships
The dynamic socio-emotional web connecting characters and factions. Maps alliances, rivalries, debts, and conflicting agendas across the world.

### 10. Story Beats & Scenes
Dramatic narrative milestones and structured scene encounters. Each scene tracks active participants, location setting, dramatic tension, and consequences for the world state.

### 11. Concept Art & Neural Speech
Sensory media assets bringing the world to life:
- **Concept Art:** Server-side image generation via Pollinations.ai, generating valid JPEG location art and character portraits.
- **Neural Speech:** Real online speech synthesis via Microsoft Edge-TTS, generating MP3 audio for character dialogue and scene narration.

### 12. Origin Trail Lineage DAG
A visual Directed Acyclic Graph tracking the causal parent-child provenance of every generated entity back to the root seed.

### 13. Causal Inspector
An explainability tool that answers *"Where did this come from?"* for any character, rule, or scene, providing human-intelligible justifications without exposing raw LLM chain-of-thought tokens.

### 14. Seed Mutation Lab
A premise simulation environment where creators can alter fundamental seed variables (`core_premise`, `tone`, `central_conflict`, `world_rule`) and preview downstream impacts (Affected, Conditional, Preserved) before forking an alternate timeline.

### 15. Counterfactual Replay
A comparative analysis engine that derives the deterministic delta between the committed world and rejected candidates, evaluating narrative differences without full regeneration.

### 16. Human-Only Zones
Creator-locked creative guardrails for core themes, protagonist motivations, and central conflicts. Ensures that human creative choices cannot be overridden by AI drift during automated unfolding.

### 17. Canon & Provenance
The immutable truths of the unfolded world. Provenance formalizes the relational audit trail connecting each canon element to its ancestors (`derived_from`, `constrained_by`, `selected_by`, `human_locked`).
