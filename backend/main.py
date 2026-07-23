from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from auth import current_user_id
from config import settings as app_settings
from database import init_db
from routers import analyze, history, settings, upload

# ponytail: blanket IP limit for all routes; per-route decorators stay stricter.
# In-memory per-process — switch to redis storage if we ever run multiple workers.
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    yield


_MAX_BODY_BYTES = 10 * 1024 * 1024  # 10 MB max for JSON bodies (text already limited in parser)

app = FastAPI(title="Briefing", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):  # type: ignore[no-untyped-def]
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > _MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"detail": "Request body too large."})
    return await call_next(request)


# Same headers nginx used to set — needed now that uvicorn serves the SPA too.
# Clerk domains allowed for auth; using a Clerk custom domain? Add it here.
_SECURITY_HEADERS = {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' https://*.clerk.accounts.dev; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https://img.clerk.com; "
        "connect-src 'self' https://*.clerk.accounts.dev; "
        "worker-src 'self' blob:; "
        "frame-ancestors 'self'"
    ),
}


@app.middleware("http")
async def security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
    response = await call_next(request)
    response.headers.update(_SECURITY_HEADERS)
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins_list,
    allow_methods=["GET", "POST", "DELETE", "PATCH", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(upload.router, dependencies=[Depends(current_user_id)])
app.include_router(analyze.router, dependencies=[Depends(current_user_id)])
app.include_router(history.router, dependencies=[Depends(current_user_id)])
app.include_router(settings.router, dependencies=[Depends(current_user_id)])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# Serve the built frontend from the same origin (single-container deploy).
# Mounted last so /api/* and /health always take precedence.
_STATIC_DIR = Path(__file__).parent / "static"
if (_STATIC_DIR / "index.html").is_file():
    app.mount("/assets", StaticFiles(directory=_STATIC_DIR / "assets"), name="assets")

    @app.get("/{_path:path}")
    async def spa_fallback(_path: str) -> FileResponse:
        """Any non-API path returns index.html — the SPA router handles it."""
        return FileResponse(_STATIC_DIR / "index.html")
