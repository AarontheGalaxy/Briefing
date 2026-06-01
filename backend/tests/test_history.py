import json
from unittest.mock import AsyncMock, patch

import pytest

MOCK_LLM = json.dumps({
    "summary": "A short meeting.",
    "key_decisions": [],
    "action_items": [],
    "participants": ["Carol"],
    "topics_discussed": [],
    "next_meeting": None,
    "sentiment": "neutral",
})

PAYLOAD = {
    "text": "Carol discussed the roadmap briefly.",
    "provider": "ollama",
    "model": "llama3.1",
    "api_key": None,
    "meeting_type": "general",
}


async def _create_analysis(client) -> str:
    with patch("services.llm.call_ollama", new=AsyncMock(return_value=MOCK_LLM)):
        resp = await client.post("/api/analyze", json=PAYLOAD)
    assert resp.status_code == 200
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_list_history(client):
    await _create_analysis(client)
    resp = await client.get("/api/history")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert body["total"] >= 1


@pytest.mark.asyncio
async def test_get_analysis_by_id(client):
    analysis_id = await _create_analysis(client)
    resp = await client.get(f"/api/history/{analysis_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == analysis_id


@pytest.mark.asyncio
async def test_get_analysis_invalid_uuid(client):
    resp = await client.get("/api/history/not-a-uuid")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_analysis_not_found(client):
    resp = await client.get("/api/history/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_analysis(client):
    analysis_id = await _create_analysis(client)
    del_resp = await client.delete(f"/api/history/{analysis_id}")
    assert del_resp.status_code == 200

    get_resp = await client.get(f"/api/history/{analysis_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_search_history(client):
    with patch("services.llm.call_ollama", new=AsyncMock(return_value=MOCK_LLM)):
        await client.post("/api/analyze", json={**PAYLOAD, "text": "unique_search_term meeting notes"})

    resp = await client.get("/api/history", params={"search": "unique_search_term"})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_update_tags(client):
    analysis_id = await _create_analysis(client)
    patch_resp = await client.patch(
        f"/api/history/{analysis_id}/tags",
        json={"tags": ["q1", "sales"]},
    )
    assert patch_resp.status_code == 200

    get_resp = await client.get(f"/api/history/{analysis_id}")
    assert "q1" in get_resp.json()["tags"]


@pytest.mark.asyncio
async def test_update_completed_items(client):
    analysis_id = await _create_analysis(client)
    patch_resp = await client.patch(
        f"/api/history/{analysis_id}/actions",
        json={"completed": [0, 2]},
    )
    assert patch_resp.status_code == 200
