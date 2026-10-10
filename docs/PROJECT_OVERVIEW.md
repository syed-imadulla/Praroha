# PRAROHA — Project Overview
### Seed → Universe: Forms Hidden in Formless

**Hackathon:** Vedanta Makeathon  
**Team:** Supreme  
**Institution:** SJCIT, Chikkaballapura  
**Team Members:** Sandhya C, Syed Imadulla, Thriveni S A, Teja J  
**Project Status:** Completed hackathon project; documentation consolidated post-Vedanta Makeathon.

---

## 1. Introduction

What if one small idea could become an entire universe?

That is the question behind **PRAROHA**. Developed for the Vedanta Makeathon by Team Supreme, PRAROHA takes inspiration from **Tatva 2 — Seed to Universe: Forms Hidden in Formless**. The platform helps creators uncover the latent potential inside a simple creative thought and systematically unfold it into a coherent, explorable, and persistent fictional universe.

---

## 2. The Single Guiding Philosophy: Tatva 2

PRAROHA is guided by a single philosophical foundation: **Tatva 2 — Seed to Universe: Forms Hidden in Formless**.

> **“The seed is the idea. The universe is what it can become.”**

In traditional philosophical thought, a giant banyan tree exists in unmanifest potential inside a tiny physical seed. In the same manner, an unadorned story idea contains worlds, characters, ethical conflicts, factions, and visual aesthetics that are not immediately visible on the surface.

PRAROHA connects this philosophy directly to modern generative software engineering:

- **The Seed:** The user's initial sentence, premise, or concept.
- **The Hidden Potential:** The latent themes, physical rules, conflicts, character arcs, and creative directions dormant within that idea.
- **The Unfolding:** Structured AI reasoning that expands the seed into multiple possible worlds along divergent axes.
- **Human Choice:** The creator's initial agency in choosing which latent world to manifest.
- **The Visible Universe:** The selected world developed into a cohesive Codex with lore, cast profiles, relationships, dramatic scenes, concept art, and voice narration.

The technical workflow stages in the application are practical implementation steps that demonstrate this single philosophy. They are not separate Tatvas.

---

## 3. The Problem PRAROHA Solves

Generative AI models are capable of generating prose, visual art, and speech. However, using these models to build consistent fictional worlds typically involves fragmented, disjoint tools:

1. **Creative Drift:** A language model forgets the original premise after several turns of conversation, introducing contradictions.
2. **Lore and Character Inconsistency:** Characters change motivations, factions violate their own stated rules, and settings alter arbitrarily across different scenes.
3. **Loss of Provenance:** When looking at a downstream character or plot twist, creators cannot trace *why* that element exists or how it originated from their initial prompt.
4. **Scattered Workflows:** Generating lore in one tool, character art in another, and voiceovers in a third requires manual glue and loses the structural relationship between assets.

PRAROHA solves these issues by acting as a **connected creative workspace**. Instead of an unstructured chatbot, PRAROHA implements a structured state machine where every generated entity remains anchored to the root seed through a database-backed provenance model.

---

## 4. Target Audiences

- **Writers & Novelists:** Brainstorm new story worlds, develop multi-character conflict webs, outline plot beats, and maintain continuity across chapters.
- **Game Developers & Narrative Designers:** Explore alternative setting archetypes, establish world lore bibles, design NPC backstories, and export structured JSON bundles directly into game engines.
- **Filmmakers & Screenwriters:** Conceptualize premises, draft location concept art, visualize scene settings, and listen to spoken character dialogue.
- **Content Creators:** Transform raw creative concepts into cohesive multimedia world presentations.
- **Students & Creative Hobbyists:** Safely experiment with creative ideation, test "what-if" premise mutations, and understand how stories unfold.

---

## 5. Walkthrough Example: “A village where nobody can lie”

To understand how PRAROHA works in practice, consider the starting prompt:

> **Starting Seed:** *“A village where nobody can lie.”*

### Step 1: Seed Understanding
Gemini parses the prompt and extracts its structural **Seed DNA**:
- *Core Motifs:* Involuntary truth, social transparency, surveillance, vulnerability.
- *Latent Conflicts:* The tension between social harmony and brutal honesty; individuals who harbor dangerous private truths.
- *Tone:* Melancholic, cautious, atmospheric.

### Step 2: Three Divergent World Possibilities
The engine explores three distinct interpretations along orthogonal creative axes:
- **World 1 (Botanical Curse):** A sacred mountain pollen infuses the valley; speaking a falsehood induces physical suffocation.
- **World 2 (Cognitive Projections):** Unspoken thoughts project above citizens' heads as bioluminescent glyphs, making deception impossible.
- **World 3 (Architectural Vow):** An ancient resonant bell tower at the village center vibrates with a piercing tone whenever a deceit is voiced within its perimeter.

### Step 3: Human Choice Gate
The creator reviews the three worlds and commits to **World 2 (Cognitive Projections)**, recording their decision rationale: *"I want to explore the visual storytelling of silent characters who try to hide their thoughts."* This commitment forms the project's **Decision DNA**.

### Step 4: Universe Unfolding (The Codex)
The platform unfolds World 2 into a 5-layer universe:
- **World Bible:** The village of *Lucent Veil*, governed by the Council of the Dimmed. Physical rules specify how light glyphs dissipate in fog.
- **Characters:** *Kaelen*, an archivist who wears a mirrored cowl to obscure his glyphs; *Sari*, a town elder who has mastered emotional stillness.
- **Relationships:** A tense dynamic where Kaelen suspects Sari has discovered an ancient way to manipulate light.
- **Scenes:** A public market scene where an accidental light burst reveals a hidden secret during an inspection.

### Step 5: Bringing Elements to Life
- **Concept Art:** Pollinations.ai generates an evocative watercolor image of the mist-shrouded village with glowing glyphs hovering over stone rooftops.
- **Character Voice:** Edge-TTS synthesizes an audio monologue for Kaelen, using a subdued narrative persona.

### Step 6: Origin Trail & Causal Inspection
The creator opens the **Origin Trail Lineage DAG**. Clicking on *Kaelen's mirrored cowl* reveals its exact lineage:
- *Derived from:* Character profile *Kaelen* (Stage 5)
- *Selected by:* World 2 *Cognitive Projections* (Stage 4)
- *Constrained by:* Involuntary truth motif in *Seed DNA* (Stage 2)
- *Root origin:* The initial prompt (Stage 1)

### Step 7: Refine, Mutate & Export
The creator tests a counterfactual scenario (*"What if the bell tower world was chosen instead?"*), snapshots the universe state, and exports the full world as a portable `.seedunfold.json` bundle.

---

## 6. Implemented Features Summary

| Category | Feature | Description |
| :--- | :--- | :--- |
| **Ideation** | Seed Submission | Plaintext prompt input with guidance and canonical demo presets. |
| **Analysis** | Seed DNA Extraction | Structured Pydantic extraction of motifs, themes, tone, and constraints. |
| **Exploration** | Three Divergent Worlds | High-contrast candidate synthesis along orthogonal narrative axes. |
| **Agency** | Human Choice Gate | Enforced decision recording; downstream unlocking requires human commitment. |
| **Lore** | World Bible | Relational storage of physical laws, cultural history, factions, and locations. |
| **Cast** | Character Profiles | Motivations, internal conflicts, flaws, and narrative archetypes. |
| **Dynamics** | Relationship Matrix | Bidirectional interpersonal dynamics, alliances, and rivalry states. |
| **Plot** | Beats & Scenes | Structured story outline, scene settings, and dramatic encounters. |
| **Visual Art** | Concept Art Generation | Pollinations.ai integration delivering verified 1024×1024 JPEG location and character art. |
| **Speech** | Voice & Narration | Edge-TTS neural speech synthesis generating playable MP3 dialogue and narration. |
| **Provenance** | Origin Trail DAG | Multi-lane Directed Acyclic Graph showing causal entity lineage. |
| **Explainability** | Causal Inspector | Explains the creative genesis of any element without LLM reasoning token leakage. |
| **Simulation** | Seed Mutation Lab | Preview how modifying a root premise variable affects downstream lore. |
| **Analysis** | Counterfactual Replay | Comparative matrix evaluating the chosen world against rejected directions. |
| **Governance** | Human-Only Zones | Creator-locked themes and rules preserved against AI drift. |
| **Realtime** | Multi-Tab Sync | Project-scoped Supabase Realtime synchronization across active browser tabs. |
| **Portability** | Bundle Export | Portable `.seedunfold.json` export and import for universe preservation. |

---

## 7. Post-Hackathon Status

PRAROHA was completed and presented for the **Vedanta Makeathon**. The repository and documentation are consolidated to serve as an enduring, verifiable record of Team Supreme's engineering and design work.
