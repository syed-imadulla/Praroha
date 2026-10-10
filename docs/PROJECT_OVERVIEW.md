# PRAROHA — Project Overview

**Seed → Universe** · Tatva 2 — Forms Hidden in Formless

**Hackathon:** Vedanta Makeathon
**Team:** Supreme
**Members:** Sandhya C, Syed Imadulla, Thriveni S A, Teja J
**Status:** Completed hackathon project.

---

## Introduction

PRAROHA is an AI-powered creative worldbuilding platform. A user starts with a simple idea, explores three possible worlds, selects one, and develops it into a connected universe containing world details, characters, relationships, story beats, and scenes. Available AI providers generate concept images and character voices where supported.

The creator can inspect how generated elements connect to the original idea, continue refining the universe, and export the project.

---

## Philosophy: Tatva 2

PRAROHA is guided by a single philosophy: **Tatva 2 — Seed to Universe: Forms Hidden in Formless**.

> *"The seed is the idea. The universe is what it can become."*

A simple idea contains possibilities that are not immediately visible — themes, settings, characters, conflicts, and creative directions. PRAROHA helps uncover these and develop the original idea into a structured, explorable fictional universe.

- **Seed:** The user's initial idea or concept.
- **Hidden potential:** Themes, settings, characters, conflicts, and directions contained within that idea.
- **Unfolding:** AI develops the idea into multiple possible worlds.
- **Human choice:** The user selects the direction they want to pursue.
- **Visible universe:** The selected direction becomes a connected world with characters, relationships, story scenes, images, and voice narration where available.

The workflow stages in the application are practical implementation steps. They are not separate Tatvas.

---

## The Problem

Generative AI can produce text, images, and audio, but creating a consistent fictional world across multiple tools requires repeated prompting and manual effort. Characters become inconsistent, story details contradict each other, and the connection between the original idea and later outputs gets lost.

PRAROHA brings creative elements into one connected workspace while preserving the original idea, the creator's choices, and the relationships between generated elements.

---

## Target Audiences

- **Writers:** Develop story ideas, characters, settings, and plotlines.
- **Game developers:** Explore fictional worlds, characters, and narrative concepts.
- **Filmmakers:** Develop story concepts and visualise scenes.
- **Content creators:** Turn initial ideas into connected creative content.
- **Students and hobbyists:** Explore different directions for an idea.

---

## Walkthrough: "A village where nobody can lie"

**Starting Seed:** *"A village where nobody can lie."*

### Seed Understanding
Gemini extracts the structural Seed DNA:
- *Core Motifs:* Involuntary truth, social transparency, vulnerability.
- *Latent Conflicts:* Tension between social harmony and brutal honesty; individuals harbouring dangerous private truths.
- *Tone:* Melancholic, cautious, atmospheric.

### Three Divergent Worlds
- **World 1 (Botanical Curse):** Sacred pollen induces physical suffocation when speaking falsehood.
- **World 2 (Cognitive Projections):** Thoughts project above citizens' heads as bioluminescent glyphs.
- **World 3 (Architectural Vow):** An ancient bell tower vibrates with a piercing tone whenever deceit is voiced.

### Human Choice
The creator selects **World 2** and records their rationale: *"I want to explore the visual storytelling of silent characters who try to hide their thoughts."*

### Universe Unfolding
The platform unfolds World 2 into:
- **World Bible:** The village of *Lucent Veil*, governed by the Council of the Dimmed.
- **Characters:** *Kaelen*, an archivist who wears a mirrored cowl to obscure his glyphs.
- **Relationships:** Kaelen suspects an elder has discovered a way to manipulate light.
- **Scenes:** A market scene where an accidental light burst reveals a hidden secret.

### Media Generation
- Concept art visualizes the mist-shrouded village with glowing glyphs.
- Edge-TTS synthesizes a spoken monologue for Kaelen.

### Origin Trail
Clicking on *Kaelen's mirrored cowl* in the DAG reveals its exact lineage back through the character profile, world selection, Seed DNA, and original prompt.

---

## Implemented Features

| Category | Feature | Description |
| :--- | :--- | :--- |
| Ideation | Seed Submission | Plaintext prompt input with guidance and canonical demo presets. |
| Analysis | Seed DNA Extraction | Structured extraction of motifs, themes, tone, and constraints. |
| Exploration | Three Divergent Worlds | High-contrast candidate synthesis along orthogonal axes. |
| Agency | Human Choice Gate | Enforced decision recording; downstream locked until committed. |
| Lore | World Bible | Physical laws, history, factions, and key locations. |
| Cast | Character Profiles | Motivations, conflicts, flaws, and archetypes. |
| Dynamics | Relationship Matrix | Bidirectional interpersonal dynamics and conflict states. |
| Plot | Beats & Scenes | Structured story outline, scene settings, and encounters. |
| Visual Art | Concept Art | Pollinations.ai integration delivering validated JPEG art. |
| Speech | Voice & Narration | Edge-TTS neural speech synthesis with MP3 playback. |
| Provenance | Origin Trail DAG | Multi-lane DAG showing causal entity lineage. |
| Explainability | Causal Inspector | Plain-language genesis explanation for any element. |
| Simulation | Seed Mutation Lab | Preview how premise changes affect downstream lore. |
| Analysis | Counterfactual Replay | Compare chosen world against rejected directions. |
| Governance | Human-Only Zones | Creator-locked themes preserved against AI drift. |
| Realtime | Multi-Tab Sync | Supabase Realtime synchronization across browser tabs. |
| Portability | Bundle Export | Portable `.seedunfold.json` export and import. |

---

## Post-Hackathon Status

PRAROHA was completed and presented for the **Vedanta Makeathon**. This repository and its documentation serve as a consolidated record of Team Supreme's work.
