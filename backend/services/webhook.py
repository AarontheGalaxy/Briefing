import logging
import urllib.parse

import httpx

from database import db_connection

logger = logging.getLogger(__name__)
WEBHOOK_KEY = "webhook_url"
WEBHOOK_TIMEOUT = 10.0

# Block internal/private network ranges to prevent SSRF
_BLOCKED_HOSTS = {
    "localhost", "127.0.0.1", "::1",
    "0.0.0.0", "169.254.169.254",  # AWS metadata
}
_ALLOWED_SCHEMES = {"http", "https"}


def _validate_webhook_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:  # noqa: BLE001
        return False
    if parsed.scheme not in _ALLOWED_SCHEMES:
        return False
    host = (parsed.hostname or "").lower()
    if host in _BLOCKED_HOSTS:
        return False
    # Block private IPv4 ranges
    if host.startswith(("10.", "172.16.", "192.168.", "fd", "fc")):
        return False
    return bool(host)


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
    if not _validate_webhook_url(url):
        logger.warning("Webhook URL blocked (SSRF protection): %s", url)
        return
    try:
        async with httpx.AsyncClient(timeout=WEBHOOK_TIMEOUT) as client:
            await client.post(url, json=payload)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Webhook delivery failed for %s: %s", url, exc)
