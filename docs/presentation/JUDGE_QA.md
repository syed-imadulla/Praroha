# Praroha Judge Q&A Cheatsheet

### 1. Why is this project Tattva 2?
Because Tattva 2 is *“Forms hidden in formless — Universes exist in a seed form, autonomously unfolds with initial agency.”* Praroha takes a single, compact, formless sentence and progressively reveals the rich, structured macro-universe latent within it, maintaining strict continuity back to that starting seed.

### 2. Why not simply use ChatGPT or Claude in a chat window?
A standard chat window provides an unstructured stream of tokens with zero architectural guarantees. It forgets constraints after three turns, hallucinates conflicting lore, provides no human-in-the-loop choice gates, cannot fork isolated timeline branches, and cannot trace which downstream rule came from which initial thought. Praroha is a structured engineering system, not a chatbox.

### 3. Is Gemini actually being used?
Yes. The backend implements `GeminiProvider` using Google's **Gemini 3.5 Flash** (`gemini-3.5-flash`) REST API with strict JSON schema response mode (`responseMimeType: "application/json"` and `responseSchema`).
- **True Live Generative Pipeline**: For custom audience prompts, Praroha can connect to the configured Gemini model through its `AIProvider` abstraction and persist application state through Supabase PostgreSQL and Supabase Storage when cloud mode is enabled.
- **Praroha supports a live Gemini + Supabase cloud pipeline for custom seeds, with deterministic fallback fixtures and local fallback paths for reliable demonstrations.**

### 4. Why didn't the live demo ask for an API key?
To guarantee presentation resilience. Live competition environments frequently suffer from spotty Wi-Fi, API rate limits (HTTP 429), or external provider throttling. Praroha features a pre-compiled, verified canonical demo fixture that runs offline in `< 500ms` without external dependencies.

### 5. What happens if Gemini goes down during a live demo?
The system will never crash or return a 500 error. The `GeminiProvider` proactively catches HTTP errors, timeouts, and rate limits, automatically degrading to `MockProvider` and displaying a non-intrusive warning toast in the UI.

### 6. Is the instant demo fake?
No. It is a **Deterministic Canonical Demo**: a pre-compiled, verified universe fixture that exercises the same application data model, persistence flow, lineage system, and frontend rendering without depending on an external LLM during presentation. It is not described as a live Gemini generation; it proves that the relational database schema, parent-child foreign keys, lineage DAG engine, and frontend rendering work end-to-end.

### 7. How does the system preserve continuity from seed to universe?
The original Seed DNA (premise, implicit themes, negative constraints, aesthetic tone) is stored as an immutable database record. Every subsequent generation pass injects this DNA into the prompt context as hard constraints, preventing lore drift.

### 8. How does human agency work?
At Stage 4, the engine halts autonomous generation. Downstream universe unfolding is architecturally locked until the creator chooses one of the three candidate worlds and records their explicit creative rationale. The backend validates and enforces this choice gate.

### 9. How does the system prevent one-click uncontrolled generation?
By decoupling generation into discrete stages with strict state validation guards. Stage 5 (Unfolding) rejects any request where `project.status` is not `world_selected`.

### 10. How is provenance represented?
As a Directed Acyclic Graph (DAG) with explicit parent references (`derived_from`, `constrained_by`, `selected_by`, `refined_from`). The frontend renders a multi-lane canvas where clicking any node highlights its ancestor path and reveals a plain-English explanation.

### 11. Why a relational database instead of a dedicated graph database like Neo4j?
For an MVP, relational integrity (foreign keys, atomic multi-table transactions, cascading deletes) is paramount for story entities (bibles, cast, relationships, scenes). The provenance DAG is acyclic and bounded (< 50 nodes per universe), making topological synthesis in Python/SQLModel sub-millisecond fast without the operational overhead of a separate graph DB cluster.

### 12. What is stored in object storage?
Binary payloads, portable `.json` ProjectBundles, and serialized universe state snapshots. In local mode, these are stored in `./uploads/`. In cloud mode, they map to Supabase Storage.

### 13. Is Supabase actually being used right now?
Praroha supports a live Gemini + Supabase cloud pipeline for custom seeds, with deterministic fallback fixtures and local fallback paths for reliable demonstrations. When cloud mode is configured (`AI_PROVIDER=gemini`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`), application state persists via Supabase PostgreSQL and Supabase Storage. If cloud configuration is unavailable, the local SQLite database and `LocalStorageProvider` fallback paths run seamlessly for zero-cloud independence.

### 14. Can this generate actual images, audio, or video right now?
No, and we are honest about this. Praroha currently generates **production-ready visual prompt descriptors** attached to every world, character, key location, and scene, with one-click clipboard copying. Integrating direct diffusion image (Imagen 3), audio (Suno), and video (Runway) APIs is planned for our post-MVP roadmap.

### 15. Can this architecture scale?
Yes. The backend is stateless FastAPI, the database abstraction (SQLModel) seamlessly connects to PostgreSQL in production, and object storage cleanly offloads binary assets to cloud buckets.

### 16. What is the key technical innovation?
Treating generative creative expansion not as conversational text, but as a **versioned, branchable, and traceable state machine** that proves causal provenance from an unmanifest seed to a manifest universe.
