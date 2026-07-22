"""SSRF validator tests — IP literals only, so no real DNS lookups are needed."""

import pytest

from services.webhook import _validate_webhook_url

BLOCKED = [
    "http://127.0.0.1/hook",          # loopback
    "http://localhost/hook",           # loopback via name
    "http://[::1]/hook",               # IPv6 loopback
    "http://10.0.0.5/hook",            # private
    "http://172.16.0.1/hook",          # private
    "http://192.168.1.1/hook",         # private
    "http://169.254.169.254/latest",   # link-local (cloud metadata)
    "http://0.0.0.0/hook",             # unspecified
    "http://240.0.0.1/hook",           # reserved
    "ftp://example.com/hook",          # bad scheme
    "not a url",                       # garbage
    "http:///hook",                    # no hostname
]


@pytest.mark.parametrize("url", BLOCKED)
async def test_blocked_urls(url: str) -> None:
    assert await _validate_webhook_url(url) is False


async def test_public_ip_allowed() -> None:
    # Public IP literal — resolves locally without network access
    assert await _validate_webhook_url("http://93.184.216.34/hook") is True
