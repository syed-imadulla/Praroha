# ADR-001: Core Architecture & Stack Selection

## Status
Accepted

## Context
Seed Unfold is an AI-powered creative development workspace requiring high responsiveness, strict schema validation for AI outputs, progressive disclosure UX, and rapid local iteration for hackathon delivery and future SaaS evolution.

## Decision
1. **Frontend**: React with Vite and TypeScript. Styling via Tailwind CSS with a dark mode design palette and Framer Motion for progressive disclosure transitions.
2. **Backend**: Python 3.11+ with FastAPI and Pydantic v2. Provides asynchronous execution, typed data contracts, and first-class compatibility with AI provider libraries.
3. **AI Layer**: Abstract provider interface (`AIProvider`) decoupling application logic from concrete LLM APIs (Gemini, Claude, OpenAI).
4. **Persistence**: Relational SQLite with JSON DAG structures for local MVP; migration path to PostgreSQL / Supabase for cloud deployment.
5. **No Microservices**: A modular single-service backend avoids premature operational complexity.

## Consequences
- **Positive**: Rapid build velocity, strict schema compliance, local offline testing capability, clean separation of concerns.
- **Negative**: Monolithic backend must maintain internal module boundaries to prevent tight coupling.
