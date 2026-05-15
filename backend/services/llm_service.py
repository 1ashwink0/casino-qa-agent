import json
import httpx
from config import settings


async def call_llm(system_prompt: str, user_prompt: str) -> dict:
    if settings.llm_provider == "anthropic":
        return await _call_anthropic(system_prompt, user_prompt)
    else:
        return await _call_openai(system_prompt, user_prompt)


async def _call_anthropic(system_prompt: str, user_prompt: str) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": settings.llm_model,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}]
            }
        )
        response.raise_for_status()
        data = response.json()
        raw_text = data["content"][0]["text"]
        return _parse_json_response(raw_text), data["usage"]


async def _call_openai(system_prompt: str, user_prompt: str) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "max_tokens": 4096,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt}
                ]
            }
        )
        response.raise_for_status()
        data = response.json()
        raw_text = data["choices"][0]["message"]["content"]
        return _parse_json_response(raw_text), data["usage"]


def _parse_json_response(raw_text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[-1] if text.count("```") >= 2 else text
        text = text.lstrip("json").strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    return json.loads(text)