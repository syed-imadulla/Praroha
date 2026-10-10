# PRAROHA — Developer Setup & Installation Guide

**Project:** PRAROHA  
**Hackathon:** Vedanta Makeathon  
**Team:** Supreme  
**Status:** Post-Hackathon Developer Reference

---

## 1. System Prerequisites

Before setting up PRAROHA, ensure the following software is installed on your workstation:
- **Node.js:** v18.0.0 or higher (v20.x recommended)
- **npm:** v9.0.0 or higher
- **Python:** v3.10, v3.11, or v3.12
- **Git:** v2.30 or higher

---

## 2. Step-by-Step Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/syed-imadulla/Praroha.git
cd Praroha
```

### Step 2: Set Up Backend Virtual Environment
```bash
# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux / macOS:
source venv/bin/activate
# On Windows (PowerShell):
# .\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 3. Environment Configuration

Create a local `.env` file in the root or inside `backend/`:
```bash
cp .env.example backend/.env
```

### Key Configuration Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `AI_PROVIDER` | `gemini` | Primary AI provider (`gemini` for live models, `mock` for offline test fixtures). |
| `GEMINI_API_KEY` | *(None)* | Your Google AI Studio API key. |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Primary LLM model identifier. |
| `POLLINATIONS_API_KEY` | *(None)* | Optional API key for Pollinations.ai (unauthenticated defaults to `sana`). |
| `STORAGE_PROVIDER` | `local` | Asset storage backend (`local` for disk storage in `./uploads`, `supabase` for cloud buckets). |
| `DATABASE_URL` | `sqlite+aiosqlite:///./seed_unfold.db` | Local SQLite database path or PostgreSQL connection string. |
| `CORS_ORIGINS` | `["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000", "http://127.0.0.1:3000"]` | Permitted client origins. |

*Security Warning: Never commit actual API keys or credentials to version control.*

---

## 4. Running the Application

### 1. Start the Backend API (Port 8000)
With your Python virtual environment active:
```bash
uvicorn backend.app.main:app --port 8000 --host 0.0.0.0 --reload
```
- **API Server:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Health Check Endpoint:** `http://localhost:8000/api/health`

### 2. Start the Frontend Development Server (Port 5174)
In a separate terminal:
```bash
npm --prefix frontend run dev
```
- **Web Application:** `http://localhost:5174`

*Note: The frontend development server is configured on Port 5174 to avoid conflicts with other local dev servers.*

---

## 5. Running Tests & Verification

### Run Backend Unit & Integration Tests
```bash
pytest backend/tests
```
*Expected: 182 passed, 1 skipped.*

### Run Live Provider Smoke Tests
```bash
PYTHONPATH=. python3 backend/tests/smoke_test_providers.py
```
*Tests real network connectivity to Gemini, Pollinations.ai, and Edge-TTS.*

### Run Frontend Production Build
```bash
npm --prefix frontend run build
```
*Executes TypeScript compiler checks and Vite asset bundling.*

### Run Autonomous Browser E2E Tests
```bash
# Requires backend running on port 8000 and frontend on port 5174
node frontend/e2e/test_phase31_10_journey.mjs
node frontend/e2e/test_phase31_10_realtime.mjs
```

---

## 6. Troubleshooting Common Issues

### Issue 1: Port 5174 Already in Use
If Port 5174 is occupied by another process:
```bash
# Check process on port 5174
lsof -i :5174
# Kill if necessary
kill -9 <PID>
```

### Issue 2: Gemini Rate Limit (HTTP 429)
If Google AI Studio rate limits custom prompts, the backend automatically retries with exponential backoff. If limits persist, switch `AI_PROVIDER=mock` in `backend/.env` for deterministic testing.

### Issue 3: Pollinations Image Generation Timeout
Image generation depends on external cluster traffic. Pollinations calls are bounded by a 35-second server-side timeout. If a timeout occurs, click "Try Again" in the UI to trigger an idempotent retry job.

### Issue 4: Edge-TTS Connection Errors
Microsoft Edge-TTS relies on an online connection. Ensure your local network allows outbound HTTPS connections to Microsoft speech service endpoints.
