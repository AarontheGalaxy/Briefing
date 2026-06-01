import asyncio
import ipaddress
import logging
import socket
import urllib.parse

import httpx

from database import db_connection

logger = logging.getLogger(__name__)
WEBHOOK_KEY = "webhook_url"
WEBHOOK_TIMEOUT = 10.0

_ALLOWED_SCHEMES = {"http", "https"}


async def _validate_webhook_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:  # noqa: BLE001
        return False
    if parsed.scheme not in _ALLOWED_SCHEMES:
        return False
    hostname = parsed.hostname
    if not hostname:
        return False

    try:
        loop = asyncio.get_running_loop()
        infos = await loop.getaddrinfo(hostname, parsed.port or 80, family=socket.AF_INET)
    except Exception:  # noqa: BLE001
        return False

    for info in infos:
        ip_str = info[4][0]
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            return False

    return True


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
    if not await _validate_webhook_url(url):
        logger.warning("Webhook URL blocked (SSRF protection): %s", url)
        return
    try:
        async with httpx.AsyncClient(timeout=WEBHOOK_TIMEOUT, follow_redirects=False) as client:
            await client.post(url, json=payload)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Webhook delivery failed for %s: %s", url, exc)
