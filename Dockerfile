# Single-container build: React SPA served by the FastAPI backend.
# Used by Render (see render.yaml). The per-service Dockerfiles in backend/
# and frontend/ still work for two-container hosts.

# ── Stage 1: build the frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Same origin — the backend serves these files, so no API base URL needed
ENV VITE_API_URL=""
# Clerk publishable key (pk_*) is public by design, not a secret
ARG VITE_CLERK_PUBLISHABLE_KEY=
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN npm run build

# ── Stage 2: backend + built frontend ──────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend /build/dist ./static

# Non-root; /app/data holds the SQLite DB (Render mounts a disk there)
RUN useradd --create-home app && mkdir -p /app/data && chown -R app /app
USER app

EXPOSE 8000

# Render sets $PORT; default to 8000 for local runs.
# --proxy-headers so rate limiting sees the real client IP behind Render's proxy.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips '*'"]
