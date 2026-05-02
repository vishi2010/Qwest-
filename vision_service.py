import base64
import json
import mimetypes
import os
import re
from typing import Any

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava")
VISION_PROVIDER = os.getenv("VISION_PROVIDER", "ollama").strip().lower()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
OPENAI_VISION_MODEL = os.getenv("OPENAI_VISION_MODEL", "gpt-4.1-mini")
ANTHROPIC_VISION_MODEL = os.getenv("ANTHROPIC_VISION_MODEL", "claude-sonnet-4-20250514")
VISION_MIN_CONFIDENCE = float(os.getenv("VISION_MIN_CONFIDENCE", "0.80"))


def _encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _image_mime_type(image_path: str) -> str:
    guessed, _ = mimetypes.guess_type(image_path)
    return guessed or "image/jpeg"


def _build_prompt(vision_prompt: str) -> str:
    return (
        "You verify player photo submissions for real-world challenges.\n"
        f"Acceptance criteria for this challenge: {vision_prompt}\n\n"
        "Rules:\n"
        "1) ACCEPT only when the required object/action is clearly visible in this image.\n"
        "2) REJECT if uncertain, blurry, partially visible, occluded, or likely a different object.\n"
        "3) Be strict about similar-looking objects (for example: shoe is not book).\n"
        "4) Never guess intent.\n\n"
        "Respond with JSON only (no markdown):\n"
        '{\n'
        '  "decision": "ACCEPT" | "REJECT",\n'
        '  "confidence": number between 0 and 1,\n'
        '  "detected_objects": ["object1", "object2"],\n'
        '  "reason": "short concrete reason based on visible evidence"\n'
        '}\n'
    )


def _extract_json_from_text(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        return {}
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}
    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _normalize_result(raw: str) -> tuple[bool, str]:
    parsed = _extract_json_from_text(raw)
    decision = str(parsed.get("decision", "")).strip().upper()
    confidence_raw = parsed.get("confidence", 0)
    try:
        confidence = float(confidence_raw)
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    reason = str(parsed.get("reason", "")).strip()
    detected = parsed.get("detected_objects", [])
    if isinstance(detected, list):
        detected_objects = [str(item).strip() for item in detected if str(item).strip()]
    else:
        detected_objects = []

    verified = decision == "ACCEPT" and confidence >= VISION_MIN_CONFIDENCE
    if decision == "ACCEPT" and confidence < VISION_MIN_CONFIDENCE and not reason:
        reason = f"Model said ACCEPT but confidence {confidence:.2f} is below threshold {VISION_MIN_CONFIDENCE:.2f}."
    if not reason:
        reason = "No structured reason returned by vision model."
    stored = _normalize_stored_response(reason, detected_objects, confidence, verified)
    return verified, stored


def _normalize_stored_response(
    reason: str,
    detected_objects: list[str],
    confidence: float,
    verified: bool,
) -> str:
    """Human-readable audit trail saved on the submission."""
    verdict_word = "YES" if verified else "NO"
    objects = ", ".join(detected_objects) if detected_objects else "none listed"
    return (
        f"Model verdict: {verdict_word}\n"
        f"Confidence: {confidence:.2f} (threshold {VISION_MIN_CONFIDENCE:.2f})\n"
        f"Detected objects: {objects}\n"
        f"Reasoning: {reason}"
    )


def _extract_openai_text(data: dict[str, Any]) -> str:
    choices = data.get("choices", [])
    if not choices:
        return ""
    message = choices[0].get("message", {})
    content = message.get("content", "")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = [str(item.get("text", "")).strip() for item in content if isinstance(item, dict)]
        return "\n".join([part for part in parts if part]).strip()
    return ""


async def _verify_with_ollama(image_path: str, vision_prompt: str) -> tuple[bool, str]:
    encoded = _encode_image(image_path)
    payload = {
        "model": VISION_MODEL,
        "prompt": _build_prompt(vision_prompt),
        "images": [encoded],
        "stream": False,
        "options": {"temperature": 0.0, "num_predict": 320},
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()
    raw_text = str(data.get("response", "")).strip()
    return _normalize_result(raw_text)


async def _verify_with_openai(image_path: str, vision_prompt: str) -> tuple[bool, str]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing but VISION_PROVIDER=openai.")

    encoded = _encode_image(image_path)
    mime = _image_mime_type(image_path)
    data_url = f"data:{mime};base64,{encoded}"
    payload = {
        "model": OPENAI_VISION_MODEL,
        "temperature": 0.0,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _build_prompt(vision_prompt)},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(f"{OPENAI_BASE_URL}/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
    raw_text = _extract_openai_text(data)
    return _normalize_result(raw_text)


async def _verify_with_anthropic(image_path: str, vision_prompt: str) -> tuple[bool, str]:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing but VISION_PROVIDER=anthropic.")

    encoded = _encode_image(image_path)
    mime = _image_mime_type(image_path)

    payload = {
        "model": ANTHROPIC_VISION_MODEL,
        "max_tokens": 512,
        "temperature": 0.0,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime,
                            "data": encoded,
                        },
                    },
                    {"type": "text", "text": _build_prompt(vision_prompt)},
                ],
            }
        ],
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages", json=payload, headers=headers
        )
        response.raise_for_status()
        data = response.json()

    # Extract text from Anthropic content blocks
    raw_text = ""
    for block in data.get("content", []):
        if isinstance(block, dict) and block.get("type") == "text":
            raw_text = block.get("text", "").strip()
            break

    return _normalize_result(raw_text)


async def verify_quest_image(image_path: str, vision_prompt: str) -> tuple[bool, str]:
    if VISION_PROVIDER == "ollama":
        return await _verify_with_ollama(image_path, vision_prompt)
    if VISION_PROVIDER == "openai":
        return await _verify_with_openai(image_path, vision_prompt)
    if VISION_PROVIDER == "anthropic":
        return await _verify_with_anthropic(image_path, vision_prompt)
    raise RuntimeError(
        f"Unsupported VISION_PROVIDER='{VISION_PROVIDER}'. Use 'ollama', 'openai', or 'anthropic'."
    )


async def check_vision_service_health() -> bool:
    try:
        if VISION_PROVIDER == "ollama":
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                return r.status_code == 200
        if VISION_PROVIDER == "openai":
            return bool(os.getenv("OPENAI_API_KEY", "").strip())
        if VISION_PROVIDER == "anthropic":
            return bool(os.getenv("ANTHROPIC_API_KEY", "").strip())
        return False
    except Exception:
        return False
