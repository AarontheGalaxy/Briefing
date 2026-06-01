from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import settings as app_settings
from database import init_db
from routers import analyze, history, settings, upload

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    yield


_MAX_BODY_BYTES = 10 * 1024 * 1024  # 10 MB max for JSON bodies (text already limited in parser)

app = FastAPI(title="Briefing", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):  # type: ignore[no-untyped-def]
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > _MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"detail": "Request body too large."})
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins_list,
    allow_methods=["GET", "POST", "DELETE", "PATCH", "PUT"],
    allow_headers=["Content-Type"],
)

app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(settings.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
