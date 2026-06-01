# Briefing

> Analyze your meeting notes with artificial intelligence. Upload your PDF, Word, or text file. Briefing extracts summaries, decisions, action items, participants, and sentiment analysis in seconds.

[![CI](https://github.com/AarontheGalaxy/briefing/actions/workflows/ci.yml/badge.svg)](https://github.com/AarontheGalaxy/briefing/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Node](https://img.shields.io/badge/node-20-green)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)

---

## Table of Contents

1. [What is Briefing?](#what-is-briefing)
2. [Features](#features)
3. [Supported Platforms](#supported-platforms)
4. [Architecture and Working Logic](#architecture-and-working-logic)
5. [Requirements - What is Needed Before Installation?](#requirements-what-is-needed-before-installation)
6. [Quick Start - With Docker (Recommended)](#quick-start-with-docker-recommended)
7. [Manual Installation - Step by Step](#manual-installation-step-by-step)
   - [macOS](#macos)
   - [Windows](#windows)
   - [Linux (Ubuntu / Debian)](#linux-ubuntu--debian)
8. [LLM Provider Setup](#llm-provider-setup)
   - [Ollama - Free and Local](#ollama-free-and-local)
   - [OpenAI](#openai)
   - [Anthropic](#anthropic)
9. [Configuration Reference](#configuration-reference)
10. [Using Briefing - Step by Step](#using-briefing-step-by-step)
11. [API Reference](#api-reference)
12. [Webhook Integration](#webhook-integration)
13. [Running Tests](#running-tests)
14. [CI / CD](#ci--cd)
15. [Docker - Production Environment](#docker-production-environment)
16. [Project Structure](#project-structure)
17. [Technical Stack](#technical-stack)
18. [Troubleshooting](#troubleshooting)
19. [Security](#security)
20. [Contributing](#contributing)
21. [License](#license)

---

## What is Briefing?

Briefing is a web application that transforms raw meeting transcripts into structured, actionable information.

You can:
- Upload PDF, Word (DOCX), Markdown, or plain text files
- Directly paste your notes
- Choose an LLM provider (free local or cloud-based)
- Receive the following results in seconds:

| Output | Description |
|-------|---------|
| **Summary** | A 3 to 5 sentence summary of the meeting |
| **Key Decisions** | A numbered list of decisions made |
| **Action Items** | Tasks including assignee, deadline, and priority |
| **Participants** | Names are automatically identified |
| **Topics** | A list of topics discussed |
| **Next Meeting** | Date extraction if mentioned in the text |
| **Sentiment Analysis** | Positive / Neutral / Negative |

All results are saved to a local SQLite database. If you use Ollama, your data never leaves your computer.

---

## Features

### Analysis
- **Multi-format support:** PDF, DOCX, TXT, MD up to 50 MB (configurable)
- **Text pasting:** Direct entry of notes or transcripts up to 100,000 characters
- **Batch analysis:** Queue multiple files and analyze them all with one click. Retry failed files individually
- **Meeting type templates:** General, Sales, 1:1, Sprint Review, Board Meeting. Different prompts for each format
- **Cancel button:** Cancel the analysis at any time after it starts
- **Progress tracking:** Real-time display of processing time and word count

### History and Organization
- **Persistent history:** Every analysis is saved to SQLite and is not lost after restart
- **Full-text search (FTS5):** Search through summaries, file names, decisions, topics, and participants with prefix matching
- **Tag system:** Add tags to analyses and filter by clicking tags in the sidebar
- **Action item tracking:** Mark items as completed. The status is saved in the database
- **Participant tracking:** Click a name to see all meetings that person attended
- **Pagination:** History loads 20 items at a time with a "Load More" button
- **Undo Delete:** A 5-second "Undo" toast notification is shown instead of an immediate deletion icon

### Exporting
- **Markdown export:** Download as an .md file
- **JSON export:** Download raw data as a .json file
- **Print:** Opens a clean, printer-friendly HTML page
- **Copy to clipboard:** One-click copy for summaries, decisions, and action items

### Settings and Integration
- **Three LLM providers:** Ollama (local, free), OpenAI, Anthropic
- **Session-based API keys:** Keys are only kept while the tab is open and are never sent to any server except the provider
- **Webhook notifications:** Sends a POST request to your desired URL after every successful analysis
- **Connection test:** Test provider and model settings before saving

---

## Supported Platforms

| Platform | Version | Status |
|----------|-------|-------|
| **macOS** | 12 Monterey and above | Full support |
| **macOS** | 11 Big Sur | Works but not tested |
| **Windows** | 10 (21H2+) | Full support |
| **Windows** | 11 | Full support |
| **Ubuntu** | 22.04 LTS | Full support |
| **Ubuntu** | 20.04 LTS | Works |
| **Debian** | 11+ | Works |
| **Fedora** | 38+ | Not tested but should work |
| **Windows** | 7 / 8 | Not supported |
| **macOS** | 10.x | Not supported |

### Browser Support

Briefing is a modern web application. The following browsers are supported:

| Browser | Minimum Version |
|----------|--------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |
| Opera | 76+ |

Note: Internet Explorer is not supported.

### Hardware Requirements

| Component | Minimum | Recommended |
|---------|---------|---------|
| RAM | 4 GB | 8 GB+ |
| Disk | 2 GB free space | 5 GB+ (for Ollama models) |
| CPU | Any modern processor | N/A |
| GPU | Not required | Provides speed increase for Ollama |

If you are running a large model (llama3.1 70B) with Ollama, 32+ GB RAM may be required. Smaller models (llama3.2:3b) work with 4 GB RAM.

---

## Architecture and Working Logic

```
Your Browser (React + Vite)
       |
       |  HTTP requests (REST + JSON / multipart)
       v
  FastAPI (Python 3.12)
       ├── /api/upload     -> Extracts text from PDF/DOCX/TXT
       ├── /api/analyze    -> Sends to LLM and processes response
       ├── /api/history/*  -> Manages history analysis
       └── /api/settings/* -> Model list, connection test, webhook
              |
              v
        SQLite (meetings.db)
          ├── analyses       - analysis results
          ├── analyses_fts   - FTS5 search index
          └── app_settings   - settings like webhook URL
```

**Flow of an analysis:**
1. File -> /api/upload -> text is extracted
2. Text -> /api/analyze -> LLM prompt is generated
3. LLM -> JSON response is returned -> parsed -> saved to SQLite
4. FTS5 triggers automatically index the new row
5. Webhook (if any) is sent in the background without blocking the response
6. Result is returned to the browser and the sidebar is updated

---

## Requirements - What is Needed Before Installation?

### If using Docker
Only install **Docker Desktop**. Nothing else is required.

### For manual installation

| Software | Purpose | Download Link |
|---------|-------------|---------------|
| **Python 3.12** | To run the backend server | [python.org/downloads](https://www.python.org/downloads/) |
| **Node.js 20** | To compile the frontend interface | [nodejs.org](https://nodejs.org/) |
| **Git** | To download the project | [git-scm.com](https://git-scm.com/) |
| **Ollama** (optional) | To run free local AI models | [ollama.ai](https://ollama.ai) |

Attention for Windows users during Python installation: You must check the "Add Python to PATH" box. Otherwise, the python command will not work.

Attention for Node.js installation: Choose the LTS (Long Term Support) version.

Verify installations by typing the following in your terminal or command prompt:

```
python --version    -> Should display Python 3.12.x
node --version      -> Should display v20.x.x
npm --version       -> Should display 10.x.x
git --version       -> Should display git version 2.x.x
```

---

## Quick Start - With Docker (Recommended)

If you use Docker, you can run everything with a single command.

### 1. Install Docker Desktop

- **macOS/Windows:** Download and install from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- **Ubuntu/Debian:**
  ```bash
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-plugin
  sudo systemctl start docker
  sudo usermod -aG docker $USER
  # Log out and log back in
  ```

### 2. Download the Project

```bash
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

### 3. Start

```bash
docker compose up --build
```

It may take a few minutes for the first time as images are downloaded and compiled. It is ready when you see:

```
frontend-1  | nginx started
backend-1   | Application startup complete.
```

### 4. Open in Browser

- **Application:** [http://localhost:5173](http://localhost:5173)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Stopping

Press `Ctrl + C` in the terminal. Data will not be lost.

### Running in Background

```bash
docker compose up --build -d   # start in background
docker compose down            # stop (data is preserved)
docker compose down -v         # stop AND delete all data
docker compose logs -f         # follow logs
```

---

## Manual Installation - Step by Step

### macOS

#### 1. Install Homebrew (Package Manager)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Python and Node.js

```bash
brew install python@3.12 node@20
```

Verify:
```bash
python3 --version   # Python 3.12.x
node --version      # v20.x.x
npm --version       # 10.x.x
```

#### 3. Download the Project

```bash
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

#### 4. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

#### 5. Start the Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Keep this terminal window open. Open a new terminal.

#### 6. Frontend Setup (In New Terminal)

```bash
cd briefing/frontend
npm install
```

#### 7. Start the Frontend

```bash
npm run dev
```

#### 8. Open in Browser

[http://localhost:5173](http://localhost:5173)

---

### Windows

#### 1. Install Python

1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Click the "Download Python 3.12.x" button
3. Run the downloaded .exe file
4. IMPORTANT: Check the "Add Python to PATH" box
5. Click "Install Now"

#### 2. Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Click the "20.x.x LTS" button
3. Run the downloaded .msi file and follow the instructions
4. Check the "Automatically install the necessary tools" box

#### 3. Install Git

Download and install from [git-scm.com](https://git-scm.com/).

#### 4. Download the Project

```
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

#### 5. Backend Setup

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

#### 6. Start the Backend

```
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Keep this window open. Open a new command prompt.

#### 7. Frontend Setup (In New Window)

```
cd briefing\frontend
npm install
```

#### 8. Start the Frontend

```
npm run dev
```

#### 9. Open in Browser

[http://localhost:5173](http://localhost:5173)

---

### Linux (Ubuntu / Debian)

#### 1. Update the System

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

#### 2. Install Python 3.12

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv python3.12-pip
```

#### 3. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 4. Install Git

```bash
sudo apt-get install -y git
```

#### 5. Download the Project

```bash
git clone https://github.com/AarontheGalaxy/briefing.git
cd briefing
```

#### 6. Backend Setup

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

#### 7. Start the Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open a new terminal.

#### 8. Frontend Setup

```bash
cd briefing/frontend
npm install
npm run dev
```

#### 9. Open in Browser

[http://localhost:5173](http://localhost:5173)

---

## LLM Provider Setup

Briefing works with three different AI providers. Choose one.

### Ollama - Free and Local

Ollama runs models on your computer. It does not require an internet connection or an API key. Your data never leaves your device.

#### Install Ollama

Download from [ollama.ai](https://ollama.ai) and follow the installation steps for your operating system.

#### Download a Model

Once Ollama is installed, you need to download a model:

```bash
# Recommended for most computers (approx. 4.7 GB)
ollama pull llama3.1

# For smaller computers (approx. 2.0 GB, 4 GB RAM sufficient)
ollama pull llama3.2:3b

# Smallest (approx. 1.3 GB, 2 GB RAM sufficient but lower quality)
ollama pull llama3.2:1b

# Highest quality (approx. 40 GB, 32+ GB RAM required)
ollama pull llama3.1:70b
```

#### Using Ollama in Briefing

1. Open the application
2. Click the Settings icon in the bottom left
3. Select "Ollama (Local)"
4. Click "Test Connection" to confirm it is working
5. Select your desired model from the list

---

### OpenAI

A GPT API key is required to use OpenAI models. You pay based on usage.

#### Getting an API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and go to API Keys
3. Create a new secret key and save it securely
4. Add some credits to your account

#### Using OpenAI in Briefing

1. Settings -> Select "OpenAI"
2. Paste your API key
3. Select a model: gpt-4o-mini is recommended for most uses
4. Click "Test Connection"

Security: Your API key is only stored in the browser session and is cleared when the tab is closed.

---

### Anthropic

An API key is required to use Claude models.

#### Getting an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and generate an API key

#### Using Anthropic in Briefing

1. Settings -> Select "Anthropic"
2. Paste your API key
3. Select a model: claude-sonnet-4-6 is recommended for balance
4. Click "Test Connection"

---

## Configuration Reference

### Backend .env File

Copy `backend/.env.example` to `backend/.env` and edit it.

| Variable | Default | Description |
|----------|-----------|---------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Address where Ollama is running |
| `OLLAMA_MODEL` | `llama3.1` | Default Ollama model |
| `DEFAULT_PROVIDER` | `ollama` | Default provider when opening the interface |
| `DATABASE_URL` | `sqlite+aiosqlite:///./meetings.db` | Database file path |
| `MAX_FILE_SIZE_MB` | `50` | Maximum file size for uploads |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed connection origins |

### Frontend .env File

Copy `frontend/.env.example` to `frontend/.env`.

| Variable | Default | Description |
|----------|-----------|---------|
| `VITE_API_URL` | `http://localhost:8000` | Address of the backend server |

---

## Using Briefing - Step by Step

### First Time Use

Open [http://localhost:5173](http://localhost:5173) in your browser.

- **Sidebar:** New Analysis button, search box, history list, and Settings button.
- **Main Panel:** File upload or text paste area.

### Analysis by Uploading a File

1. Ensure the "Upload File" tab is selected in the main panel
2. Drop your PDF, DOCX, TXT, or MD file into the upload zone
3. Select the Meeting Type (General, Sales, 1:1, Sprint Review, Board Meeting)
4. Choose your model and click "Analyze"
5. Results will appear in the main panel within seconds

### Analysis by Pasting Text

1. Click the "Paste Text" tab
2. Paste or type your meeting notes (up to 100,000 characters)
3. Follow the same steps as file upload to analyze

### Batch Analysis

1. Click the "Batch" tab
2. Upload multiple files at once
3. Click "Analyze N files" to process them sequentially
4. Retry any failed files individually if necessary

### Reviewing Results

- **Tags:** Add tags to categorize your analysis
- **Summary:** View a concise summary and sentiment analysis
- **Action Items:** Track tasks and mark them as completed
- **Participants:** Click names to see their meeting history
- **Export:** Download results as Markdown or JSON, or print them

---

## API Reference

All endpoints start with the /api prefix. Swagger documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### POST /api/upload
Uploads a file and extracts its text.
Rate limit: 20 requests per minute.

### POST /api/analyze
Analyzes text using an LLM.
Rate limit: 10 requests per minute.

### GET /api/history
Lists past analyses with support for pagination, search, and tag filtering.

### DELETE /api/history/{id}
Deletes a specific analysis.

### PATCH /api/history/{id}/tags
Updates tags for an analysis.

### PATCH /api/history/{id}/actions
Updates completed status for action items.

---

## Webhook Integration

Configure a Webhook URL in Settings to receive automatic notifications after every successful analysis.

### Behavior
- Webhooks are sent asynchronously
- Timeout is 10 seconds
- No retries on failure
- Webhooks are not sent for failed analyses

### Security
Localhost and private network ranges are blocked for webhook URLs to prevent server-side request forgery.

---

## Running Tests

### Backend Tests
```bash
cd briefing/backend
source venv/bin/activate
pytest
```
Tests cover health checks, file uploads, analysis logic (using mocks), and history management.

### Frontend Type Check
```bash
cd briefing/frontend
npx tsc --noEmit
```

---

## CI / CD

The CI pipeline runs on every push and pull request via GitHub Actions.

- **Secret Scan:** Detects sensitive files like .env or .db
- **Backend:** Code quality checks (ruff), security scans (pip-audit), and tests
- **Frontend:** Type checking and production build verification

---

## Project Structure

- **backend/:** FastAPI server, database management, and AI service adapters
- **frontend/:** React application, UI components, and state management
- **docker-compose.yml:** Configuration for full environment setup

---

## Technical Stack

- **Backend:** FastAPI, SQLite (aiosqlite), Pydantic, httpx
- **Frontend:** React, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS
- **AI Integration:** Ollama, OpenAI SDK, Anthropic SDK

---

## Troubleshooting

### Could not connect to Ollama
Ensure Ollama is running and accessible at http://localhost:11434. In Docker, use host.docker.internal to reach the host machine.

### Invalid API Key
Check for extra spaces and ensure the key belongs to the correct provider. Remember that keys are cleared when the tab is closed.

### 413 Error (File Too Large)
Increase the MAX_FILE_SIZE_MB variable in your backend .env file and restart the server.

---

## Security

- API keys are stored only in the browser session
- Protection against SSRF and SQL Injection
- Rate limiting for file uploads and analysis
- Automatic security scanning in the CI pipeline

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run local CI checks (tests, linting, type checks)
4. Submit a Pull Request

---

## License

Internal Project - All Rights Reserved.

No part of this software may be reproduced, distributed, or used without explicit written permission from the author.
