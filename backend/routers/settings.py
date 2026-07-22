import logging

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import settings
from database import db_connection
from models import ModelsResponse, TestConnectionRequest, TestConnectionResponse
from services.llm import fetch_ollama_models, test_connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["settings"])

WEBHOOK_KEY = "webhook_url"


class WebhookConfig(BaseModel):
    url: str | None = None


@router.get("/webhook", response_model=WebhookConfig)
async def get_webhook() -> WebhookConfig:
    async with db_connection() as db:
        async with db.execute(
            "SELECT value FROM app_settings WHERE key = ?", (WEBHOOK_KEY,)
        ) as cursor:
            row = await cursor.fetchone()
    return WebhookConfig(url=row[0] if row else None)


@router.put("/webhook", response_model=WebhookConfig)
async def set_webhook(body: WebhookConfig) -> WebhookConfig:
    async with db_connection() as db:
        if body.url:
            await db.execute(
                "INSERT INTO app_settings (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (WEBHOOK_KEY, str(body.url)),
            )
        else:
            await db.execute(
                "DELETE FROM app_settings WHERE key = ?", (WEBHOOK_KEY,)
            )
        await db.commit()
    return WebhookConfig(url=body.url)

OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
ANTHROPIC_MODELS = [
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022",
]


@router.get("/models", response_model=ModelsResponse)
async def get_models(provider: str = "ollama") -> ModelsResponse:
    if provider == "ollama":
        if not settings.enable_ollama:
            raise HTTPException(status_code=400, detail="Ollama is disabled on this server.")
        try:
            models = await fetch_ollama_models(settings.ollama_base_url)
            return ModelsResponse(models=models if models else ["llama3.1"])
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to fetch Ollama models: %s", exc)
            return ModelsResponse(models=["llama3.1"])
    elif provider == "openai":
        return ModelsResponse(models=OPENAI_MODELS)
    elif provider == "anthropic":
        return ModelsResponse(models=ANTHROPIC_MODELS)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")


@router.post("/test", response_model=TestConnectionResponse)
async def test_provider(request: TestConnectionRequest) -> TestConnectionResponse:
    ollama_url = request.ollama_url or settings.ollama_base_url
    try:
        ok = await test_connection(
            provider=request.provider,
            model=request.model,
            api_key=request.api_key,
            ollama_url=ollama_url,
        )
        if ok:
            return TestConnectionResponse(success=True, message="Connection successful")
        return TestConnectionResponse(success=False, message="Model returned an empty response.")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except httpx.ConnectError:
        return TestConnectionResponse(
            success=False,
            message="Could not connect to Ollama. Make sure Ollama is running.",
        )
    except Exception as exc:
        logger.error("Connection test failed: %s", str(exc), exc_info=True)
        error_msg = str(exc)
        if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            return TestConnectionResponse(
                success=False, message="API key is invalid or quota is exhausted."
            )
        return TestConnectionResponse(
            success=False, message="Connection test failed. Check your provider settings."
        )
