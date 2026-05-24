# Briefing

A full-stack application designed to analyze meeting transcripts and generate structured summaries, action items, and participant insights using Large Language Models (LLMs). The project consists of a FastAPI backend and a React-based frontend.

## Features

- Multi-format file support (PDF, DOCX, TXT, MD) for transcript uploads.
- Direct text input for quick analysis of copied notes.
- Structured analysis including:
    - Executive Summary and Sentiment Analysis.
    - Action Items with assignment tracking.
    - Key Decisions and discussed topics.
    - Participant identification and next meeting scheduling.
- Support for multiple LLM providers (OpenAI, Anthropic, and local Ollama instances).
- Local history management with SQLite for retrieving past analyses.
- Persistent user settings for API keys and model preferences.

## Technical Stack

### Backend
- Framework: FastAPI (Python)
- Database: SQLite with aiosqlite (Asynchronous)
- LLM Integration: OpenAI, Anthropic, and Ollama APIs
- Document Parsing: lxml, python-docx, pypdf
- Validation: Pydantic v2

### Frontend
- Framework: React (TypeScript)
- Build Tool: Vite
- State Management: Zustand (with persistence)
- Data Fetching: TanStack Query (React Query)
- Styling: Tailwind CSS
- UI Components: Radix UI primitives and Lucide icons

## Project Structure

```
briefing/
├── backend/                # FastAPI application
│   ├── routers/            # API endpoints (Upload, Analyze, History, Settings)
│   ├── services/           # Logic (LLM connectors, Document extractors, Parsers)
│   ├── models.py           # Database schemas
│   ├── database.py         # Connection management
│   └── main.py             # Application entry point
└── frontend/               # React application
    ├── src/
    │   ├── components/     # UI components (Analysis, Layout, Settings, Upload)
    │   ├── hooks/          # Custom hooks for API interaction
    │   ├── store/          # Zustand store for settings
    │   ├── lib/            # API client and utility functions
    │   └── App.tsx         # Main application logic
```

## Installation and Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd briefing/backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd briefing/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Configuration

To use OpenAI or Anthropic models, you must provide your API keys in the Settings panel within the application UI. For local LLM analysis via Ollama, ensure an Ollama instance is running on your machine (default: `http://localhost:11434`).

## API Endpoints

- `POST /api/upload`: Uploads a document and extracts text.
- `POST /api/analyze`: Processes text through the selected LLM and returns structured analysis.
- `GET /api/history`: Retrieves a list of previously saved analyses.
- `GET /api/history/{id}`: Fetches details of a specific analysis.
- `DELETE /api/history/{id}`: Removes an analysis from the database.
- `POST /api/settings/test`: Validates LLM connectivity and API keys.

## License

Internal Project - All Rights Reserved.
