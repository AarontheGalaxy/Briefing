"""Security headers must be on every response (they replaced nginx's)."""


async def test_security_headers_present(client) -> None:
    resp = await client.get("/health")
    assert resp.headers["x-frame-options"] == "SAMEORIGIN"
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "max-age=31536000" in resp.headers["strict-transport-security"]
    assert "default-src 'self'" in resp.headers["content-security-policy"]


async def test_headers_on_error_responses(client) -> None:
    resp = await client.get("/api/history/not-a-uuid")
    assert resp.status_code == 422
    assert resp.headers["x-content-type-options"] == "nosniff"


async def test_api_routes_not_shadowed_by_spa_fallback(client) -> None:
    """The SPA catch-all must never swallow /api or /health."""
    assert (await client.get("/health")).json() == {"status": "ok"}
    # A real API route still returns JSON, not index.html
    resp = await client.get("/api/history")
    assert resp.status_code == 200
    assert "items" in resp.json()
