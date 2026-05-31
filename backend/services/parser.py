import json
import re
from typing import Any

MAX_TRANSCRIPT_CHARS = 80_000

_SYSTEM_INSTRUCTIONS = """You are a meeting analysis assistant. Analyze the meeting transcript provided after the separator and respond ONLY with the JSON structure below. Do not add any other text, explanation, or markdown.

JSON format:
{
  "summary": "3-5 sentence summary of the meeting",
  "key_decisions": ["decision 1", "decision 2"],
  "action_items": [
    {
      "task": "Task description",
      "assignee": "Person name or null",
      "due_date": "date or null",
      "priority": "high|medium|low"
    }
  ],
  "participants": ["name1", "name2"],
  "topics_discussed": ["topic 1", "topic 2"],
  "next_meeting": "date or null",
  "sentiment": "positive|neutral|negative"
}"""

_SEPARATOR = "--- TRANSCRIPT START ---"


def build_prompt(transcript: str) -> str:
    # Truncate oversized transcripts before they reach the LLM
    safe_transcript = transcript[:MAX_TRANSCRIPT_CHARS]
    return f"{_SYSTEM_INSTRUCTIONS}\n\n{_SEPARATOR}\n{safe_transcript}"


def _extract_json_block(text: str) -> str | None:
    """Extract the first JSON object from text without backtracking regex."""
    if len(text) > 50_000:
        text = text[:50_000]
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    return text[start : end + 1]


def parse_llm_response(raw: str) -> dict[str, Any]:
    cleaned = raw.strip()

    json_str = _extract_json_block(cleaned)
    if json_str:
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass

    return _fallback_parse(cleaned)


def _fallback_parse(text: str) -> dict[str, Any]:
    result: dict[str, Any] = {
        "summary": "",
        "key_decisions": [],
        "action_items": [],
        "participants": [],
        "topics_discussed": [],
        "next_meeting": None,
        "sentiment": "neutral",
    }

    summary_match = re.search(r'"summary"\s*:\s*"([^"]+)"', text)
    if summary_match:
        result["summary"] = summary_match.group(1)

    sentiment_match = re.search(r'"sentiment"\s*:\s*"(positive|neutral|negative)"', text)
    if sentiment_match:
        result["sentiment"] = sentiment_match.group(1)

    return result
