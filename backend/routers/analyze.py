import asyncio
import json
import logging
import time
import uuid
from datetime import UTC, datetime

import httpx
from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from config import settings
from database import db_connection
from models import ActionItem, AnalysisResponse, AnalyzeRequest
from services.llm import call_llm
from services.parser import build_prompt, parse_llm_response
from services.webhook import fire_webhook

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/analyze", response_model=AnalysisResponse)
@limiter.limit("10/minute")
async def analyze(request: Request, body: AnalyzeRequest) -> AnalysisResponse:  # noqa: ARG001
    ollama_url = settings.ollama_base_url

    prompt = build_prompt(body.text, body.meeting_type)
    start = time.monotonic()

    try:
        raw = await call_llm(
            prompt=prompt,
            provider=body.provider,
            model=body.model,
            api_key=body.api_key,
            ollama_url=ollama_url,
        )
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Ollama. Make sure Ollama is running.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        error_msg = str(exc)
        safe_msg = error_msg if "sk-" not in error_msg else "[redacted]"
        logger.error("LLM analysis failed: %s", safe_msg)
        auth_err = (
            "api_key" in error_msg.lower()
            or "authentication" in error_msg.lower()
            or "invalid_api_key" in error_msg.lower()
        )
        if auth_err:
            raise HTTPException(
                status_code=401,
                detail="API key is invalid or quota is exhausted.",
            ) from exc
        raise HTTPException(
            status_code=500,
            detail="LLM call failed. Check provider is running and API key is valid.",
        ) from exc

    elapsed_ms = int((time.monotonic() - start) * 1000)

    try:
        parsed = parse_llm_response(raw)
    except (ValueError, KeyError, TypeError):
        parsed = {
            "summary": raw[:500],
            "key_decisions": [],
            "action_items": [],
            "participants": [],
            "topics_discussed": [],
            "next_meeting": None,
            "sentiment": "neutral",
        }

    action_items = [
        ActionItem(
            task=item.get("task", ""),
            assignee=item.get("assignee"),
            due_date=item.get("due_date"),
            priority=item.get("priority", "medium"),
        )
        for item in parsed.get("action_items", [])
        if isinstance(item, dict)
    ]

    analysis_id = str(uuid.uuid4())
    created_at = datetime.now(UTC).isoformat()
    word_count = len(body.text.split())

    async with db_connection() as db:
        await db.execute(
            """
            INSERT INTO analyses
              (id, file_name, word_count, summary, key_decisions, action_items,
               participants, topics_discussed, next_meeting, sentiment,
               provider, model, processing_time_ms, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                analysis_id,
                body.file_name,
                word_count,
                parsed.get("summary", ""),
                json.dumps(parsed.get("key_decisions", [])),
                json.dumps([item.model_dump() for item in action_items]),
                json.dumps(parsed.get("participants", [])),
                json.dumps(parsed.get("topics_discussed", [])),
                parsed.get("next_meeting"),
                parsed.get("sentiment", "neutral"),
                body.provider,
                body.model,
                elapsed_ms,
                created_at,
            ),
        )
        await db.commit()

    response = AnalysisResponse(
        id=analysis_id,
        summary=parsed.get("summary", ""),
        key_decisions=parsed.get("key_decisions", []),
        action_items=action_items,
        participants=parsed.get("participants", []),
        topics_discussed=parsed.get("topics_discussed", []),
        next_meeting=parsed.get("next_meeting"),
        sentiment=parsed.get("sentiment", "neutral"),
        created_at=created_at,
        word_count=word_count,
        processing_time_ms=elapsed_ms,
        provider=body.provider,
        model=body.model,
    )

    # Fire webhook in the background — never blocks the response
    asyncio.create_task(fire_webhook(response.model_dump()))

    return response
