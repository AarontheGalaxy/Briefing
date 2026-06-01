# Briefing

> **AI-powered meeting analysis tool.** Upload a transcript or paste your notes — Briefing extracts summaries, decisions, action items, participants and sentiment using your choice of LLM provider (Ollama, OpenAI or Anthropic). Everything runs locally; no data leaves your machine unless you use a cloud provider.

[![CI](https://github.com/AarontheGalaxy/briefing/actions/workflows/ci.yml/badge.svg)](https://github.com/AarontheGalaxy/briefing/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Node](https://img.shields.io/badge/node-20-green)
![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

---

## Table of Contents

1. [What is Briefing?](#what-is-briefing)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Prerequisites](#prerequisites)
7. [Quick Start — Docker](#quick-start--docker)
8. [Manual Setup](#manual-setup)
   - [Backend](#backend-setup)
   - [Frontend](#frontend-setup)
9. [Configuration Reference](#configuration-reference)
10. [LLM Provider Setup](#llm-provider-setup)
    - [Ollama (local, free)](#ollama-local-free)
    - [OpenAI](#openai)
    - [Anthropic](#anthropic)
11. [Using Briefing — Step by Step](#using-briefing--step-by-step)
12. [API Reference](#api-reference)
13. [Webhook Integration](#webhook-integration)
14. [Running Tests](#running-tests)
15. [CI / CD](#ci--cd)
16. [Docker — Production Deployment](#docker--production-deployment)
17. [Troubleshooting](#troubleshooting)
18. [Security](#security)
19. [Contributing](#contributing)
20. [License](#license)

---

## What is Briefing?

Briefing is a full-stack web application that turns raw meeting transcripts into structured, actionable intelligence. You upload a PDF, Word document, Markdown file or plain text, choose an LLM provider, and within seconds you receive:

- A concise **summary** of the meeting
- All **key decisions** made
- **Action items** with assignees, due dates and priority levels
- A list of **participants** and **topics discussed**
- The **next meeting date** if mentioned
- An overall **sentiment score** (positive / neutral / negative)

Results are saved to a local SQLite database so you can browse, search and revisit past analyses at any time.

---

## Features

### Analysis
| Feature | Details |
|---------|---------|
| **Multi-format upload** | PDF, DOCX, TXT, MD — up to 50 MB (configurable) |
| **Paste text** | Directly type or paste notes, up to 100 000 characters |
| **Batch analysis** | Upload multiple files at once; they are processed sequentially with a live progress queue and per-item retry |
| **Meeting type templates** | Choose from five prompt templates — General, Sales, 1:1, Sprint Review, Board Meeting — to focus the LLM on what matters for each format |
| **Cancel in-flight** | A **Cancel** button appears while analysis is running; the HTTP request is aborted immediately |
| **Structured output** | Summary, key decisions, action items (task / assignee / due date / priority), participants, topics, next meeting date, sentiment |

### History & Organisation
| Feature | Details |
|---------|---------|
| **Persistent history** | Every analysis is saved to SQLite and survives restarts |
| **Full-text search** | Sidebar search uses SQLite FTS5 — prefix matching, relevance ranking, searches across summary, file name, key decisions, topics and participants |
| **Tag system** | Add free-form tags to any analysis; click a tag in the sidebar to filter history to that tag |
| **Action item persistence** | Check off action items; state is saved to the database and restored when you reopen the analysis |
| **Participant tracking** | Click any participant name to open a modal listing every meeting they appeared in; click a row to jump to that analysis |
| **Pagination** | History loads 20 items at a time; a **Load more** button fetches the next page |
| **Undo delete** | Clicking the trash icon shows a 5-second undo toast instead of deleting immediately |

### Export & Share
| Feature | Details |
|---------|---------|
| **Markdown export** | Downloads the full analysis as a `.md` file |
| **JSON export** | Downloads the raw analysis object as `.json` |
| **Print view** | Opens a clean, printer-friendly HTML page and triggers the browser print dialog |
| **Copy to clipboard** | One-click copy for the summary, key decisions, and action item list (works with HTTP fallback for non-HTTPS contexts) |

### Settings & Integration
| Feature | Details |
|---------|---------|
| **Multiple LLM providers** | Ollama (local), OpenAI, Anthropic — switch with a radio button |
| **Session-scoped API keys** | Keys are kept in `sessionStorage` only, never written to `localStorage` or sent to any server |
| **Configurable Ollama URL** | Point Briefing at any Ollama instance, not just localhost |
| **Webhook notifications** | Configure a URL; Briefing POSTs the full analysis JSON to that URL after every successful analysis (SSRF protection built-in) |
| **Test connection** | A button tests that the chosen provider and model are reachable before you commit to an analysis |

### Developer / Ops
| Feature | Details |
|---------|---------|
| **Docker Compose** | `docker compose up --build` starts both services; SQLite data persists via a named volume |
| **GitHub Actions CI** | Secret scan → backend (ruff + pip-audit + pytest 17 tests) → frontend (tsc + build) |
| **Rate limiting** | Upload: 20 req/min per IP; Analyze: 10 req/min per IP |
| **SSRF protection** | Ollama URL and webhook URL are validated against an allowlist; internal network ranges are blocked |
| **Error boundary** | React error boundary wraps the app and each analysis result; a crash in one panel never takes down the whole UI |

---

## Architecture

```
Browser (React + Vite)
    │
    │  HTTP (REST + JSON / multipart)
    ▼
FastAPI  (Python 3.12)
    ├── /api/upload        ─► PyPDF / python-docx / text decode
    ├── /api/analyze       ─► LLM provider (Ollama / OpenAI / Anthropic)
    │                          └── fire_webhook (asyncio.create_task)
    ├── /api/history/*     ─► SQLite FTS5 (aiosqlite)
    └── /api/settings/*    ─► Model list, connection test, webhook CRUD
              │
              ▼
       SQLite  (meetings.db)
         ├── analyses        — main results table
         ├── analyses_fts    — FTS5 virtual table (auto-synced via triggers)
         └── app_settings    — key-value store (webhook URL, etc.)
```

### Data flow — single analysis
1. User drops a file or pastes text in the browser.
2. If file: `POST /api/upload` → server reads up to `MAX_FILE_SIZE_MB + 1` bytes, extracts text.
3. Text is sent to `POST /api/analyze` with provider, model, API key and meeting type.
4. Backend builds a prompt from the template and calls the chosen LLM.
5. LLM JSON response is parsed; action items are validated; result is written to `analyses` table.
6. FTS5 triggers automatically index the new row.
7. Webhook (if configured) is fired as a background task — it never blocks the HTTP response.
8. JSON response returned to browser; React Query cache is invalidated; sidebar refreshes.

---

## Tech Stack

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.136 | ASGI web framework |
| aiosqlite | 0.20 | Async SQLite driver |
| Pydantic v2 | 2.9 | Request/response validation |
| pydantic-settings | 2.6 | `.env` config loading |
| pypdf | 6.12 | PDF text extraction |
| python-docx | 1.2 | DOCX text extraction |
| httpx | 0.27 | HTTP client (Ollama calls) |
| openai | 1.54 | OpenAI SDK |
| anthropic | 0.37 | Anthropic SDK |
| slowapi | 0.1.9 | Rate limiting |
| uvicorn | 0.30 | ASGI server |

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5.7 | Type safety |
| Vite | 6 | Build tool & dev server |
| TanStack Query | 5 | Server state, caching, mutations |
| Zustand | 5 | Client settings state |
| Tailwind CSS | 3.4 | Utility-first styling |
| Axios | 1.7 | HTTP client |
| Sonner | 1.7 | Toast notifications |
| Lucide React | 0.468 | Icon library |

---

## Project Structure

```
briefing/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions: secret scan, ruff, pytest, tsc, build
├── backend/
│   ├── routers/
│   │   ├── analyze.py          # POST /api/analyze — LLM orchestration
│   │   ├── history.py          # GET/DELETE/PATCH history endpoints
│   │   ├── settings.py         # GET /api/settings/models, test, webhook
│   │   └── upload.py           # POST /api/upload — file ingestion
│   ├── services/
│   │   ├── extractor.py        # PDF / DOCX / TXT text extraction
│   │   ├── llm.py              # Ollama / OpenAI / Anthropic adapters
│   │   ├── parser.py           # Prompt builder + LLM response parser
│   │   └── webhook.py          # Async webhook delivery + SSRF guard
│   ├── tests/
│   │   ├── conftest.py         # Shared fixtures (temp DB, async HTTP client)
│   │   ├── test_analyze.py     # 4 tests — analyze endpoint with mocked LLM
│   │   ├── test_health.py      # 1 test  — health check
│   │   ├── test_history.py     # 8 tests — CRUD, search, tags, completed items
│   │   └── test_upload.py      # 4 tests — file types, size limits, encodings
│   ├── .dockerignore
│   ├── .env.example            # Template for all environment variables
│   ├── config.py               # Pydantic Settings class
│   ├── database.py             # Connection context manager + schema migrations
│   ├── Dockerfile
│   ├── main.py                 # FastAPI app, CORS, rate limiter, body size guard
│   ├── models.py               # Pydantic request/response models
│   ├── pytest.ini
│   ├── requirements.txt
│   └── ruff.toml               # Linter configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── analysis/
│   │   │   │   ├── ActionItems.tsx      # Checklist with persistent state
│   │   │   │   ├── AnalysisResult.tsx   # Result container + export buttons
│   │   │   │   ├── ParticipantModal.tsx # Per-person meeting history modal
│   │   │   │   ├── Participants.tsx     # Participants, topics, decisions panel
│   │   │   │   ├── Summary.tsx          # Summary + sentiment + stats
│   │   │   │   └── TagEditor.tsx        # Inline tag editor
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx       # Shell: sidebar + main content
│   │   │   │   └── Sidebar.tsx          # History list, search, tag filter, settings
│   │   │   ├── settings/
│   │   │   │   └── SettingsPanel.tsx    # Provider, model, API key, Ollama URL, webhook
│   │   │   ├── upload/
│   │   │   │   ├── BatchUpload.tsx      # Multi-file queue with retry
│   │   │   │   ├── ModelSelector.tsx    # Inline model dropdown
│   │   │   │   └── UploadZone.tsx       # File / text / batch tabs
│   │   │   └── ErrorBoundary.tsx        # React error boundary
│   │   ├── hooks/
│   │   │   ├── useAnalysis.ts           # useMutation wrapper + abort controller
│   │   │   ├── useCopy.ts               # Clipboard with HTTP fallback
│   │   │   └── useHistory.ts            # usePaginatedHistory + useDeleteAnalysis
│   │   ├── lib/
│   │   │   ├── api.ts                   # Axios instance + all API functions
│   │   │   └── utils.ts                 # formatDate, truncate, export helpers
│   │   ├── store/
│   │   │   └── settingsStore.ts         # Zustand + sessionStorage persistence
│   │   ├── types/
│   │   │   └── index.ts                 # All TypeScript interfaces
│   │   ├── App.tsx                      # Root component + routing state
│   │   ├── main.tsx                     # React entry point + QueryClient
│   │   └── vite-env.d.ts                # Vite env type declarations
│   ├── .dockerignore
│   ├── .env.example                     # VITE_API_URL template
│   ├── Dockerfile                       # Multi-stage: Node build → nginx serve
│   ├── nginx.conf                       # SPA fallback + gzip + security headers
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml                   # Full-stack one-command deployment
├── .gitignore
└── README.md
```

---

## Prerequisites

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Python | 3.12 | 3.10+ works but 3.12 is tested in CI |
| Node.js | 20 | Required for frontend dev and Docker build |
| npm | 10 | Comes with Node 20 |
| Docker + Compose | 24 / 2.20 | Only for Docker setup |
| Ollama | latest | Only if using local LLM |

> **Note for Windows users:** All commands below use Unix-style paths. On Windows, use `venv\Scripts\activate` instead of `source venv/bin/activate`, and PowerShell or Git Bash for the rest.

---

## Quick Start — Docker

The fastest way to run Briefing is with Docker Compose. Both services start with a single command and SQLite data persists in a named Docker volume.

```bash
# 1. Clone the repository
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing

# 2. (Optional) copy and edit environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your preferred settings

# 3. Build and start
docker compose up --build

# The app is now available at:
#   Frontend  →  http://localhost:5173
#   Backend   →  http://localhost:8000
#   API docs  →  http://localhost:8000/docs
```

To run in detached (background) mode:

```bash
docker compose up --build -d
```

To stop and remove containers (data is preserved in the volume):

```bash
docker compose down
```

To stop **and** delete all data:

```bash
docker compose down -v
```

### Docker environment variables

You can override any setting by creating a `.env` file next to `docker-compose.yml` or by passing `-e` flags:

```bash
# Use a custom Ollama instance
OLLAMA_BASE_URL=http://192.168.1.10:11434 docker compose up

# Change allowed CORS origins for production
VITE_API_URL=https://api.yourdomain.com CORS_ORIGINS=https://yourdomain.com docker compose up
```

---

## Manual Setup

### Backend Setup

```bash
# 1. Enter the backend directory
cd briefing/backend

# 2. Create a virtual environment
python3 -m venv venv

# 3. Activate it
#    macOS / Linux:
source venv/bin/activate
#    Windows (PowerShell):
# venv\Scripts\Activate.ps1

# 4. Install all dependencies
pip install -r requirements.txt

# 5. Copy the example environment file
cp .env.example .env
# Open .env and fill in any values you want to change (all have sane defaults)

# 6. Start the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs (Swagger UI) are at `http://localhost:8000/docs`.  
Alternative docs (ReDoc) at `http://localhost:8000/redoc`.

> **`--reload`** watches for file changes and restarts automatically. Remove it in production.

---

### Frontend Setup

```bash
# 1. Enter the frontend directory
cd briefing/frontend

# 2. Install dependencies
npm install

# 3. (Optional) set the backend URL
cp .env.example .env
# .env contains:  VITE_API_URL=http://localhost:8000
# Change this if your backend runs on a different host or port.

# 4. Start the development server
npm run dev
```

The frontend is available at `http://localhost:5173`.

To build a production bundle:

```bash
npm run build
# Output is in frontend/dist/
```

To preview the production build locally:

```bash
npm run preview
```

---

## Configuration Reference

All backend settings are read from environment variables (or a `.env` file in the `backend/` directory).  
**None of these are required** — the server starts with sensible defaults for local development.

### `backend/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL of your Ollama instance. Must point to localhost (SSRF protection). |
| `OLLAMA_MODEL` | `llama3.1` | Default model name used when provider is Ollama. |
| `DEFAULT_PROVIDER` | `ollama` | Which provider the UI defaults to on first load (`ollama`, `openai`, `anthropic`). |
| `DATABASE_URL` | `sqlite+aiosqlite:///./meetings.db` | Full SQLite connection string. The file path is extracted automatically. |
| `MAX_FILE_SIZE_MB` | `50` | Maximum size of uploaded files in megabytes. |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed CORS origins. Add your frontend URL in production. |

### `frontend/.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the backend API. The frontend reads this at build time. |

> **Security note:** Never commit `.env` files. Only `.env.example` files (which contain no real secrets) should be tracked in git. The CI pipeline will fail if a real `.env` file is detected.

---

## LLM Provider Setup

Briefing supports three LLM providers. You can switch between them at any time from the Settings panel (click the ⚙ icon at the bottom of the sidebar).

### Ollama (local, free)

Ollama runs models entirely on your machine — no API key, no data leaves your computer.

1. **Install Ollama:** Download from [ollama.ai](https://ollama.ai) and follow the installer.

2. **Pull a model:**
   ```bash
   # Recommended for most hardware (4–8 GB RAM)
   ollama pull llama3.1

   # Smaller model for limited hardware (< 4 GB RAM)
   ollama pull llama3.2:3b

   # Larger, higher quality (requires 16+ GB RAM)
   ollama pull llama3.1:70b
   ```

3. **Verify Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   # Should return a JSON list of installed models
   ```

4. In Briefing Settings, select **Ollama (Local)**, then pick your model from the dropdown.  
   Click **Test Connection** to verify everything works.

> **Custom Ollama URL:** If Ollama runs on a different machine on your local network, enter its URL in the "Ollama URL" field in Settings. Only local network addresses are allowed (SSRF protection).

---

### OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com).

2. In Briefing Settings, select **OpenAI**, then enter your API key in the "API Key" field.

3. Choose a model:
   - `gpt-4o` — best quality, highest cost
   - `gpt-4o-mini` — good quality, much lower cost (recommended for most use cases)
   - `gpt-4-turbo` — high quality
   - `gpt-3.5-turbo` — fastest, lowest cost

4. Click **Test Connection** to verify the key works.

> **Key storage:** Your API key is stored only in your browser's `sessionStorage`. It is cleared automatically when you close the tab. It is never sent to any Briefing server — it goes directly from your browser to OpenAI's API.

---

### Anthropic

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).

2. In Briefing Settings, select **Anthropic**, then enter your API key.

3. Choose a model:
   - `claude-opus-4-7` — most capable, highest cost
   - `claude-sonnet-4-6` — excellent balance of quality and speed (recommended)
   - `claude-3-5-sonnet-20241022` — strong performance
   - `claude-3-5-haiku-20241022` — fast and affordable

4. Click **Test Connection** to confirm the key is valid.

---

## Using Briefing — Step by Step

### Analysing a file

1. Open `http://localhost:5173` in your browser.
2. The **Upload File** tab is active by default. Drag a PDF, DOCX, TXT or MD file onto the drop zone, or click it to browse.
3. The file is uploaded and parsed server-side. You will see the file name and word count appear.
4. (Optional) Change the **Meeting Type** dropdown to match your meeting format. This adjusts the LLM prompt for better results:
   - **General** — balanced, works for any meeting
   - **Sales** — focuses on deal status, objections, next steps with prospects
   - **1:1** — emphasises personal goals, blockers, manager feedback
   - **Sprint Review** — highlights completed stories, velocity, retrospective items
   - **Board Meeting** — extracts strategic decisions, financial metrics, governance items
5. (Optional) Change the model from the **model selector** dropdown. Use the ⚙ Settings icon to switch providers or configure your API key.
6. Click **Analyze**. A spinner appears. Click **Cancel** at any time to abort.
7. The analysis result appears in the main panel with:
   - Tags field (click to add tags, press Enter or comma to confirm)
   - Summary + sentiment indicator + processing stats
   - Action items — check them off; state is saved automatically
   - Key decisions — copy with the clipboard icon
   - Participants (clickable — see [Participant Tracking](#participant-tracking))
   - Topics discussed
   - Next meeting date (if mentioned)
8. Use the **MD**, **JSON** and **Print** buttons in the top-right to export or print.

### Pasting text

1. Click the **Paste Text** tab.
2. Paste your notes or transcript (up to 100 000 characters).
3. Follow steps 4–8 above.

### Batch analysis

1. Click the **Batch** tab.
2. Drop multiple files onto the zone (or click to browse; hold Ctrl/Cmd to select multiple).
3. Files appear in a queue with a **pending** status.
4. Click the **Analyze N files** button. Each file is uploaded and analysed sequentially.
5. Watch the status update in real time: `Uploading… → Analyzing… → Done / Failed`.
6. If an item fails, a **↺** retry button appears next to it. You can retry individual files without re-queuing everything.
7. When all files are done, a "Batch complete" toast appears. Results appear in the sidebar history automatically.

### Searching history

Type in the **search box** at the top of the sidebar. Briefing uses SQLite FTS5 full-text search across the summary, file name, key decisions, topics and participants. Results update with a 300 ms debounce.

### Filtering by tag

Click any `#tag` shown below a history item to filter the list to only analyses that carry that tag. A blue `#tag` chip appears at the top of the sidebar showing the active filter. Click it or `✕` to clear.

### Participant tracking

In any analysis result, participant names are shown as buttons. Click a name to open the **participant modal** — it shows every meeting that person attended. Click a row in the modal to jump directly to that analysis.

---

## API Reference

All endpoints are prefixed with `/api`. The interactive docs are at `http://localhost:8000/docs`.

### `POST /api/upload`

Upload a document and extract its text.

**Rate limit:** 20 requests / minute per IP.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | ✅ | PDF, DOCX, TXT or MD file. Max size set by `MAX_FILE_SIZE_MB`. |

**Success response `200`:**
```json
{
  "text": "Meeting started at 10:00...",
  "word_count": 1243,
  "file_name": "q1-review.pdf"
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | Unsupported file type or empty file |
| `413` | File exceeds size limit |
| `429` | Rate limit exceeded |

---

### `POST /api/analyze`

Run LLM analysis on a block of text.

**Rate limit:** 10 requests / minute per IP.

**Request body:**
```json
{
  "text": "Full meeting transcript here...",
  "provider": "ollama",
  "model": "llama3.1",
  "api_key": null,
  "meeting_type": "general",
  "file_name": "optional-source-filename.pdf"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `text` | string | ✅ | — | The transcript text. Must not be blank. Max 80 000 chars sent to LLM. |
| `provider` | string | — | `"ollama"` | `"ollama"`, `"openai"` or `"anthropic"` |
| `model` | string | — | `"llama3.1"` | Model identifier for the chosen provider |
| `api_key` | string \| null | — | `null` | Required for OpenAI and Anthropic |
| `meeting_type` | string | — | `"general"` | `"general"`, `"sales"`, `"one_on_one"`, `"sprint_review"`, `"board"` |
| `file_name` | string \| null | — | `null` | Original filename, stored for display purposes |

**Success response `200`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": "The team reviewed Q1 results and agreed to move the launch date to March 15th.",
  "key_decisions": ["Launch on March 15th", "Alice leads the demo"],
  "action_items": [
    {
      "task": "Prepare demo environment",
      "assignee": "Alice",
      "due_date": "2025-03-10",
      "priority": "high"
    }
  ],
  "participants": ["Alice", "Bob", "Carol"],
  "topics_discussed": ["Q1 results", "Launch timeline", "Demo preparation"],
  "next_meeting": "March 22nd, 10:00 AM",
  "sentiment": "positive",
  "created_at": "2025-03-01T14:32:11.000Z",
  "word_count": 1243,
  "processing_time_ms": 4312,
  "provider": "ollama",
  "model": "llama3.1",
  "file_name": "q1-review.pdf",
  "completed_items": [],
  "tags": []
}
```

**Error responses:**
| Status | Meaning |
|--------|---------|
| `400` | Blank text, unknown provider, or missing API key |
| `401` | Invalid API key or quota exhausted |
| `429` | Rate limit exceeded |
| `500` | LLM call failed |
| `503` | Cannot connect to Ollama |

---

### `GET /api/history`

List all past analyses with optional search and tag filtering.

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Items per page (1–100) |
| `search` | string | `""` | Full-text search query (FTS5 with prefix matching) |
| `tag` | string | `""` | Filter by exact tag value |

**Success response `200`:**
```json
{
  "items": [ /* array of analysis objects */ ],
  "total": 47,
  "page": 1,
  "limit": 20
}
```

---

### `GET /api/history/{analysis_id}`

Fetch a single analysis by its UUID.

**Path parameter:** `analysis_id` — must be a valid UUID v4. Returns `422` if not.

**Success response `200`:** Full analysis object (see `/api/analyze` response above).

**Error `404`:** Analysis not found.

---

### `DELETE /api/history/{analysis_id}`

Permanently delete an analysis.

**Success response `200`:**
```json
{ "deleted": true }
```

---

### `PATCH /api/history/{analysis_id}/tags`

Update the tags on an analysis.

**Request body:**
```json
{ "tags": ["q1", "sales", "urgent"] }
```

Tags are sanitised server-side: trimmed, lowercased, max 32 chars each, max 20 tags total.

**Success response `200`:**
```json
{ "updated": true }
```

---

### `PATCH /api/history/{analysis_id}/actions`

Update completed action item indices.

**Request body:**
```json
{ "completed": [0, 2] }
```

The array contains zero-based indices of action items that have been checked off.

**Success response `200`:**
```json
{ "updated": true }
```

---

### `GET /api/participants/{name}/analyses`

Get all analyses where a specific participant appeared.

**Path parameter:** `name` — exact participant name string (URL-encoded).

**Query parameters:** `page`, `limit` (same as `/api/history`).

**Success response `200`:** Same shape as `/api/history` response.

---

### `GET /api/settings/models`

Get the list of available models for a provider.

**Query parameter:** `provider` — `"ollama"`, `"openai"` or `"anthropic"`.

**Success response `200`:**
```json
{ "models": ["llama3.1", "llama3.2:3b", "llama3.2:1b"] }
```

For Ollama, the list is fetched live. For OpenAI and Anthropic, a hardcoded list is returned.

---

### `POST /api/settings/test`

Test that a provider is reachable and the API key (if required) is valid.

**Request body:**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "api_key": "sk-...",
  "ollama_url": null
}
```

**Success response `200`:**
```json
{ "success": true, "message": "Connection successful" }
```

A `200` is returned even if the test fails — check the `success` field.

---

### `GET /api/settings/webhook`

Get the currently configured webhook URL.

**Success response `200`:**
```json
{ "url": "https://your-server.com/webhook" }
```

Returns `{ "url": null }` if no webhook is configured.

---

### `PUT /api/settings/webhook`

Set or clear the webhook URL.

**Request body:**
```json
{ "url": "https://your-server.com/webhook" }
```

Pass `"url": null` to remove the webhook.

---

### `GET /health`

Simple health check endpoint.

**Success response `200`:**
```json
{ "status": "ok" }
```

---

## Webhook Integration

Briefing can POST the full analysis result to a URL of your choice immediately after every successful analysis. This lets you integrate with Slack, Notion, n8n, Zapier, or any custom service.

### Setting up a webhook

1. Open the **Settings** panel (⚙ icon at the bottom of the sidebar).
2. Scroll to the **Webhook URL** section.
3. Enter your webhook endpoint URL (must be HTTPS for production).
4. Click **Save**.

### Payload format

The payload is the complete analysis JSON object — the same shape as the `/api/analyze` response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": "...",
  "key_decisions": ["..."],
  "action_items": [{ "task": "...", "assignee": "...", "due_date": null, "priority": "high" }],
  "participants": ["Alice", "Bob"],
  "topics_discussed": ["..."],
  "next_meeting": null,
  "sentiment": "positive",
  "created_at": "2025-03-01T14:32:11.000Z",
  "word_count": 1243,
  "processing_time_ms": 4312,
  "provider": "openai",
  "model": "gpt-4o-mini",
  "file_name": "meeting.pdf",
  "completed_items": [],
  "tags": []
}
```

### Behaviour

- The webhook is delivered **asynchronously** — it never delays the API response to the browser.
- If delivery fails (timeout, connection error, non-2xx response), a warning is logged server-side. The analysis is still saved. There is no retry.
- Timeout: **10 seconds**.

### Security

The webhook URL is validated before delivery:
- Must use `http` or `https` scheme.
- Localhost / `127.0.0.1` / `::1` / `0.0.0.0` are **blocked** (prevents local service probing).
- Private IPv4 ranges (`10.x`, `172.16.x`, `192.168.x`) are **blocked** (prevents internal network scanning).
- AWS metadata endpoint (`169.254.169.254`) is **blocked**.

---

## Running Tests

### Backend

```bash
cd briefing/backend
source venv/bin/activate
pip install -r requirements.txt   # includes pytest, pytest-asyncio, anyio

pytest                             # run all 17 tests
pytest -v                          # verbose output
pytest tests/test_upload.py        # run a specific file
pytest -k "test_analyze"           # run tests matching a pattern
```

The test suite uses an in-process FastAPI client (`httpx.AsyncClient` + `ASGITransport`) against a temporary SQLite database. LLM calls are mocked — no real API calls are made.

**Current test coverage:**
| File | Tests | What's covered |
|------|-------|----------------|
| `test_health.py` | 1 | Health check endpoint |
| `test_upload.py` | 4 | TXT upload, unsupported extension, file too large, non-UTF-8 encoding |
| `test_analyze.py` | 4 | Successful analysis, missing API key, unknown provider, saves to history |
| `test_history.py` | 8 | List, get by ID, invalid UUID, 404, delete, search, tag update, completed items |

### Frontend type checking

```bash
cd briefing/frontend
npx tsc --noEmit    # type check without emitting files
npm run build       # full build (type checks + Vite bundling)
```

---

## CI / CD

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and pull request to `main` / `master`. It has three jobs that run in sequence:

```
secret-scan → backend → frontend
```

### Job: secret-scan

Fails the entire pipeline if any of the following are found committed to git:
- `.env` files (except `.env.example`)
- `.envrc` files
- Private key files (`.pem`, `.key`, `.p12`, `.pfx`, `id_rsa`)
- Service account JSON files
- SQLite database files (`.db`, `.sqlite`, `.sqlite3`)

### Job: backend

1. Sets up Python 3.12 with pip cache.
2. Installs all dependencies including `ruff` and `pip-audit`.
3. Runs `ruff check .` — enforces clean code (E, F, W, I, UP, B, BLE, ARG, SIM rules).
4. Runs `pip-audit -r requirements.txt` — checks for known CVEs in all dependencies.
5. Runs `pytest` — executes all 17 tests.

### Job: frontend

1. Sets up Node 20 with npm cache.
2. Runs `npm ci` (uses `package-lock.json` for reproducible installs).
3. Runs `npx tsc --noEmit` — TypeScript type check with zero tolerance.
4. Runs `npm run build` — full production build.

---

## Docker — Production Deployment

### Environment variables for production

Create a file called `.env` next to `docker-compose.yml`:

```env
# Backend
OLLAMA_BASE_URL=http://host.docker.internal:11434
DEFAULT_PROVIDER=openai
MAX_FILE_SIZE_MB=25
CORS_ORIGINS=https://yourdomain.com

# Frontend (used at build time)
VITE_API_URL=https://api.yourdomain.com
```

Then start with:

```bash
docker compose --env-file .env up --build -d
```

### Persisting the database

The SQLite database is stored inside a Docker named volume (`briefing_data`). This volume survives `docker compose down` but is deleted by `docker compose down -v`.

To back up the database:

```bash
# Copy the database file out of the container
docker compose cp backend:/app/data/meetings.db ./meetings_backup.db
```

To restore from a backup:

```bash
docker compose cp ./meetings_backup.db backend:/app/data/meetings.db
docker compose restart backend
```

### Updating

```bash
git pull
docker compose up --build -d
```

---

## Troubleshooting

### "Could not connect to Ollama"

- Make sure Ollama is running: `ollama serve` or check the system tray icon.
- Verify it responds: `curl http://localhost:11434/api/tags`
- In Docker, the backend uses `host.docker.internal` to reach Ollama on the host. On Linux, this requires the `extra_hosts: host-gateway` setting which is already included in `docker-compose.yml`.

### "API key is invalid or quota is exhausted"

- Double-check your key has no extra spaces or line breaks.
- For OpenAI, check your usage limits at [platform.openai.com/usage](https://platform.openai.com/usage).
- For Anthropic, check at [console.anthropic.com](https://console.anthropic.com).
- Remember: keys are session-scoped and cleared when you close the browser tab. You will need to re-enter them after reopening the app.

### Analysis returns empty or nonsensical results

- Try a different model. Smaller models (3B parameters) sometimes struggle to follow structured JSON output instructions.
- For Ollama, `llama3.1` (8B) gives the best balance of speed and quality.
- Ensure the transcript is in a language the model supports well.

### The frontend shows "Something went wrong"

- Open the browser console (F12) for the actual error.
- Try refreshing the page. If the error boundary triggered, click **Try again**.
- If the issue persists, file a bug report with the console output.

### File upload returns 413

- Your file exceeds `MAX_FILE_SIZE_MB` (default 50 MB).
- Increase the limit in `backend/.env`:  `MAX_FILE_SIZE_MB=100`
- Restart the backend after changing this value.

### Search returns no results

- The FTS5 index is rebuilt on every server start. If you migrated from an older version, the index may be empty — restart the backend once to trigger a rebuild.
- FTS5 uses prefix matching. Search for the beginning of a word; `meet` will find "meeting" but `eting` will not.

### Port already in use

```bash
# Find what is using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

Similarly for port 5173 (frontend dev server).

---

## Security

Briefing was built with the following security principles in mind:

| Area | Measure |
|------|---------|
| **API keys** | Never stored server-side. The frontend keeps them in `sessionStorage` (cleared on tab close) and passes them per-request to the backend, which forwards them directly to the provider. |
| **SSRF** | Ollama URL is restricted to localhost. Webhook URLs are validated against a blocklist that covers localhost, private ranges and the AWS metadata endpoint. |
| **File upload** | Size is checked before the file is fully read into memory. Extension allowlist prevents executable uploads. |
| **SQL injection** | All database queries use parameterised statements. No string interpolation in SQL. |
| **Prompt injection** | Transcript and instructions are separated by a hard delimiter. Transcript length is capped at 80 000 characters. |
| **Rate limiting** | IP-based rate limiting via slowapi (10 req/min on analyze, 20 req/min on upload). |
| **Body size** | A middleware guard rejects request bodies over 10 MB before they are parsed. |
| **CORS** | Origins are restricted to the configured `CORS_ORIGINS` list. Methods are explicitly enumerated. |
| **Dependency scanning** | `pip-audit` runs in CI on every push and fails the build if any known CVE is detected. |
| **Secret scanning** | CI fails if `.env`, private key or database files are committed to git. |
| **UUID validation** | History endpoint path parameters are typed as `UUID` — non-UUID strings return 422 without hitting the database. |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes. Keep commits focused and descriptive.
3. Make sure the CI checks pass locally before pushing:
   ```bash
   # Backend
   cd backend
   ruff check .
   pip-audit -r requirements.txt
   pytest

   # Frontend
   cd ../frontend
   npx tsc --noEmit
   npm run build
   ```
4. Open a pull request. Describe what changed and why.

---

## License

Internal Project — All Rights Reserved.

No part of this software may be reproduced, distributed or used without explicit written permission from the author.
