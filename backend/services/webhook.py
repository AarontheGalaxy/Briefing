import asyncio
import ipaddress
import logging
import socket
import urllib.parse

import httpx

from database import db_connection

logger = logging.getLogger(__name__)
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
        # AF_UNSPEC: check IPv6 (AAAA) records too, not just IPv4
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        infos = await loop.getaddrinfo(hostname, port, family=socket.AF_UNSPEC)
    except Exception:  # noqa: BLE001
        return False

    if not infos:
        return False

    # ponytail: resolve-then-connect leaves a DNS-rebinding window; pin the
    # resolved IP on the request if this ever needs to be airtight.
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_unspecified
            or ip.is_multicast
        ):
            return False

    return True


async def get_webhook_url(user_id: str) -> str | None:
    async with db_connection() as db:
        async with db.execute(
            "SELECT value FROM app_settings WHERE key = ?", (f"webhook_url:{user_id}",)
        ) as cursor:
            row = await cursor.fetchone()
    return row[0] if row else None


async def fire_webhook(payload: dict, user_id: str) -> None:
    url = await get_webhook_url(user_id)
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
