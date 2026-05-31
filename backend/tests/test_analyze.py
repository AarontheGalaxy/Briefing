import json
import pytest
from unittest.mock import AsyncMock, patch

MOCK_LLM_RESPONSE = json.dumps({
    "summary": "Team decided to launch next Friday.",
    "key_decisions": ["Launch on Friday"],
    "action_items": [{"task": "Prepare demo", "assignee": "Alice", "due_date": None, "priority": "high"}],
    "participants": ["Alice", "Bob"],
    "topics_discussed": ["Launch", "Demo"],
    "next_meeting": None,
    "sentiment": "positive",
})

ANALYZE_PAYLOAD = {
    "text": "Alice and Bob met to discuss the launch. Decision: launch Friday. Alice to prepare demo.",
    "provider": "ollama",
    "model": "llama3.1",
    "api_key": None,
    "meeting_type": "general",
}


@pytest.mark.asyncio
async def test_analyze_success(client):
    with patch("services.llm.call_ollama", new=AsyncMock(return_value=MOCK_LLM_RESPONSE)):
        response = await client.post("/api/analyze", json=ANALYZE_PAYLOAD)

    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == "Team decided to launch next Friday."
    assert data["sentiment"] == "positive"
    assert len(data["action_items"]) == 1
    assert data["action_items"][0]["assignee"] == "Alice"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_analyze_missing_api_key_for_openai(client):
    payload = {**ANALYZE_PAYLOAD, "provider": "openai", "model": "gpt-4o", "api_key": None}
    response = await client.post("/api/analyze", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_analyze_unknown_provider(client):
    payload = {**ANALYZE_PAYLOAD, "provider": "unknown_provider"}
    with patch("services.llm.call_ollama", new=AsyncMock(return_value=MOCK_LLM_RESPONSE)):
        response = await client.post("/api/analyze", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_analyze_saves_to_history(client):
    with patch("services.llm.call_ollama", new=AsyncMock(return_value=MOCK_LLM_RESPONSE)):
        analyze_resp = await client.post("/api/analyze", json=ANALYZE_PAYLOAD)
    assert analyze_resp.status_code == 200
    analysis_id = analyze_resp.json()["id"]

    history_resp = await client.get("/api/history")
    assert history_resp.status_code == 200
    ids = [item["id"] for item in history_resp.json()["items"]]
    assert analysis_id in ids
