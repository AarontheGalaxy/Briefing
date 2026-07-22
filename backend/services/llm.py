import urllib.parse

import httpx

from config import settings

OLLAMA_TIMEOUT = 120.0
TEST_PROMPT = "Reply with only the word: OK"

_ALLOWED_OLLAMA_SCHEMES = {"http", "https"}
_ALLOWED_OLLAMA_HOSTS = {"localhost", "127.0.0.1", "::1"}


def validate_ollama_url(url: str) -> str:
    """Validate that an Ollama URL points to a local host only."""
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Invalid URL format.") from exc

    if parsed.scheme not in _ALLOWED_OLLAMA_SCHEMES:
        raise ValueError(f"URL scheme must be http or https, got: {parsed.scheme!r}")

    hostname = parsed.hostname or ""
    if hostname not in _ALLOWED_OLLAMA_HOSTS:
        raise ValueError(
            f"Ollama URL must point to localhost or 127.0.0.1, got: {hostname!r}"
        )

    return url


async def call_ollama(prompt: str, model: str, base_url: str) -> str:
    base_url = validate_ollama_url(base_url)
    async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
        response = await client.post(
            f"{base_url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
        )
        response.raise_for_status()
        return response.json()["response"]


async def call_openai(prompt: str, model: str, api_key: str) -> str:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=api_key)
    completion = await client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    return completion.choices[0].message.content or ""


async def call_anthropic(prompt: str, model: str, api_key: str) -> str:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text  # type: ignore[index]


async def call_llm(
    prompt: str,
    provider: str,
    model: str,
    api_key: str | None = None,
    ollama_url: str = "http://localhost:11434",
) -> str:
    if provider == "ollama":
        if not settings.enable_ollama:
            raise ValueError("Ollama is disabled on this server. Use OpenAI or Anthropic with your own API key.")
        return await call_ollama(prompt, model, ollama_url)
    elif provider == "openai":
        if not api_key:
            raise ValueError("API key is required for OpenAI.")
        return await call_openai(prompt, model, api_key)
    elif provider == "anthropic":
        if not api_key:
            raise ValueError("API key is required for Anthropic.")
        return await call_anthropic(prompt, model, api_key)
    else:
        raise ValueError(f"Unknown provider: {provider}")


async def test_connection(
    provider: str,
    model: str,
    api_key: str | None = None,
    ollama_url: str = "http://localhost:11434",
) -> bool:
    result = await call_llm(TEST_PROMPT, provider, model, api_key, ollama_url)
    return bool(result.strip())


async def fetch_ollama_models(base_url: str) -> list[str]:
    base_url = validate_ollama_url(base_url)
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{base_url}/api/tags")
        response.raise_for_status()
        data = response.json()
        return [m["name"] for m in data.get("models", [])]
