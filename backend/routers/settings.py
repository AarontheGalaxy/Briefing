import logging

from fastapi import APIRouter, HTTPException
import httpx

from config import settings

logger = logging.getLogger(__name__)
from models import ModelsResponse, TestConnectionRequest, TestConnectionResponse
from services.llm import fetch_ollama_models, test_connection

router = APIRouter(prefix="/api/settings", tags=["settings"])

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
        try:
            models = await fetch_ollama_models(settings.ollama_base_url)
            return ModelsResponse(models=models if models else ["llama3.1"])
        except Exception:
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
        raise HTTPException(status_code=400, detail=str(exc))
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
