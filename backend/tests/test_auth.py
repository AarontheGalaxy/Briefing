"""Auth + user-isolation tests.

Tests run with CLERK_ISSUER unset (local mode, user id "local"). To test the
enforced path we point auth at a dummy JWKS client and override the dependency
result per request via a real Bearer token check.
"""

import json
import uuid

import pytest
from fastapi import HTTPException

import auth


async def test_local_mode_user_id() -> None:
    assert await auth.current_user_id(None) == "local"


async def test_enforced_mode_rejects_missing_token(monkeypatch) -> None:
    monkeypatch.setattr(auth, "_jwks", object())  # any non-None → auth enforced
    for header in (None, "not-bearer"):
        with pytest.raises(HTTPException) as exc_info:
            await auth.current_user_id(header)
        assert exc_info.value.status_code == 401


async def test_user_cannot_see_other_users_analysis(client, monkeypatch) -> None:
    """Insert a row for another user directly, then verify 'local' can't read,
    modify, or delete it, and it never shows up in listings."""
    from database import db_connection

    other_id = str(uuid.uuid4())
    async with db_connection() as db:
        await db.execute(
            """INSERT INTO analyses
               (id, file_name, word_count, summary, key_decisions, action_items,
                participants, topics_discussed, next_meeting, sentiment,
                provider, model, processing_time_ms, created_at, user_id,
                completed_items, tags)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                other_id, "secret.pdf", 10, "someone else's meeting",
                json.dumps([]), json.dumps([]), json.dumps(["Alice"]),
                json.dumps([]), None, "neutral", "openai", "gpt-4o", 5,
                "2026-01-01T00:00:00+00:00", "other-user",
                json.dumps([]), json.dumps([]),
            ),
        )
        await db.commit()

    # Direct fetch → 404
    resp = await client.get(f"/api/history/{other_id}")
    assert resp.status_code == 404
    # Delete → 404
    resp = await client.delete(f"/api/history/{other_id}")
    assert resp.status_code == 404
    # Tag update → 404
    resp = await client.patch(f"/api/history/{other_id}/tags", json={"tags": ["x"]})
    assert resp.status_code == 404
    # Listing never contains it
    resp = await client.get("/api/history")
    assert other_id not in [item["id"] for item in resp.json()["items"]]
    # Search never contains it
    resp = await client.get("/api/history", params={"search": "someone"})
    assert other_id not in [item["id"] for item in resp.json()["items"]]
    # Participant view never contains it
    resp = await client.get("/api/participants/Alice/analyses")
    assert other_id not in [item["id"] for item in resp.json()["items"]]
