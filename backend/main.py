from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

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


async def verify_auth_token(x_api_key: str | None = Header(None)) -> None:
    if app_settings.api_auth_token and (not x_api_key or x_api_key != app_settings.api_auth_token):
        raise HTTPException(status_code=401, detail="Unauthorized")


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins_list,
    allow_methods=["GET", "POST", "DELETE", "PATCH", "PUT"],
    allow_headers=["Content-Type", "X-API-Key"],
)

app.include_router(upload.router, dependencies=[Depends(verify_auth_token)])
app.include_router(analyze.router, dependencies=[Depends(verify_auth_token)])
app.include_router(history.router, dependencies=[Depends(verify_auth_token)])
app.include_router(settings.router, dependencies=[Depends(verify_auth_token)])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
