import logging
import httpx

from database import db_connection

logger = logging.getLogger(__name__)
WEBHOOK_KEY = "webhook_url"
WEBHOOK_TIMEOUT = 10.0


async def get_webhook_url() -> str | None:
    async with db_connection() as db:
        async with db.execute(
            "SELECT value FROM app_settings WHERE key = ?", (WEBHOOK_KEY,)
        ) as cursor:
            row = await cursor.fetchone()
    return row[0] if row else None


async def fire_webhook(payload: dict) -> None:
    url = await get_webhook_url()
    if not url:
        return
    try:
        async with httpx.AsyncClient(timeout=WEBHOOK_TIMEOUT) as client:
            await client.post(url, json=payload)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Webhook delivery failed for %s: %s", url, exc)
