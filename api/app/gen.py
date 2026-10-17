"""Round generation with the Gemini API (free tier).

- One structured-output call per fresh topic returns a whole Round, which is
  cached on disk by normalized topic + prompt version.
- Model chain: 3.5 Flash-Lite -> 3.1 Flash-Lite -> Gemma 26B. Daily-quota 429s
  are never retried; that model is skipped until the quota day resets
  (midnight Pacific).
- A per-day request counter stops live calls at DAILY_SOFT_CAP.
- No key (or MM_OFFLINE=1): mock mode, which never calls the API.
The API key is read from the environment only and never logged.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from pydantic import ValidationError

from app.schema import Round

log = logging.getLogger("mm.gen")

PROMPT_VERSION = 1
MODEL_CHAIN = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it"]
DAILY_SOFT_CAP = 480
TIMEOUT_S = 30
CACHE_DIR = Path(__file__).resolve().parents[2] / "data" / "cache"
PACIFIC = ZoneInfo("America/Los_Angeles")

SYSTEM_PROMPT = """You write one short "predict first" learning round as JSON.

Goal: a curious college student types a topic. They will make a prediction
BEFORE seeing anything, then our code shows the true answer, then we name the
specific wrong idea their answer reveals.

Rules:
- misconceptions: 2-5 DOCUMENTED, well-known wrong ideas about this topic
  (things real learners believe), each with why it's tempting and a 1-2
  sentence refutation. Prefer ones with a source; set source_url only if you
  are sure it exists, otherwise null and say where it's known from in
  source_note.
- items: 1-3 prediction questions whose intuitive answer is WRONG for many
  people. Every wrong option or numeric band must map to exactly one
  misconception id; the correct one has misconception_id null.
- choice items need exactly one correct option.
- truth: use widget "distribution" with a sampler, or "curve" with a short
  expression in x using only numbers, + - * / ^ and sin cos tan exp log sqrt
  abs min max. If the topic can't be computed, use widget "stepper" with 2-6
  worked steps.
- Put the true numeric value in answer_expr (same expression rules) when you
  can, and your own number in answer_claimed.
- slug: lowercase words joined by hyphens. reviewed: false. schema_version: 1.
- Plain, friendly language. No markdown. Never reveal the answer in a prompt."""


class GenerationError(Exception):
    pass


@dataclass
class GenResult:
    round: Round
    source: str  # "cache" | model id | "mock"
    seconds: float


def normalize_topic(topic: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", topic.lower())).strip()


def _cache_path(topic: str) -> Path:
    key = hashlib.sha256(f"v{PROMPT_VERSION}:{normalize_topic(topic)}".encode()).hexdigest()[:16]
    return CACHE_DIR / "rounds" / f"{key}.json"


def _quota_day() -> str:
    return datetime.now(PACIFIC).strftime("%Y-%m-%d")


class Usage:
    """Per-quota-day call counter and per-model exhaustion flags, stored on disk."""

    def __init__(self, path: Path | None = None) -> None:
        self.path = path or CACHE_DIR / "usage.json"

    def _load(self) -> dict:
        try:
            data = json.loads(self.path.read_text())
        except (OSError, ValueError):
            data = {}
        if data.get("day") != _quota_day():
            data = {"day": _quota_day(), "calls": {}, "exhausted": []}
        return data

    def _save(self, data: dict) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(data))

    def total(self) -> int:
        return sum(self._load()["calls"].values())

    def snapshot(self) -> dict:
        return self._load()

    def record(self, model: str) -> None:
        data = self._load()
        data["calls"][model] = data["calls"].get(model, 0) + 1
        self._save(data)

    def exhaust(self, model: str) -> None:
        data = self._load()
        if model not in data["exhausted"]:
            data["exhausted"].append(model)
        self._save(data)

    def available(self, model: str) -> bool:
        return model not in self._load()["exhausted"]


def offline() -> bool:
    return os.environ.get("MM_OFFLINE") == "1" or not os.environ.get("GEMINI_API_KEY")


def _schema_for_model() -> dict:
    """Round JSON Schema without keywords Gemini ignores or rejects."""
    schema = Round.model_json_schema()

    def scrub(node):
        if isinstance(node, dict):
            for k in ("discriminator", "pattern", "title", "default"):
                node.pop(k, None)
            for v in node.values():
                scrub(v)
        elif isinstance(node, list):
            for v in node:
                scrub(v)

    scrub(schema)
    return schema


def _call_model(model: str, topic: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    is_gemma = model.startswith("gemma")
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        max_output_tokens=4096,
        http_options=types.HttpOptions(timeout=TIMEOUT_S * 1000),
    )
    contents = f"Topic: {topic}"
    if is_gemma:
        # Gemma gets the schema in the prompt; validated afterwards.
        contents = (
            f"{SYSTEM_PROMPT}\n\nReturn only JSON matching this schema:\n"
            f"{json.dumps(_schema_for_model())}\n\n{contents}"
        )
    else:
        config.system_instruction = SYSTEM_PROMPT
        config.response_json_schema = _schema_for_model()
        config.thinking_config = types.ThinkingConfig(thinking_level="minimal")
    resp = client.models.generate_content(model=model, contents=contents, config=config)
    finish = resp.candidates[0].finish_reason if resp.candidates else None
    if finish is not None and str(finish).split(".")[-1] not in ("STOP", "FINISH_REASON_UNSPECIFIED"):
        raise GenerationError(f"{model} stopped early ({finish})")
    return resp.text or ""


def _is_daily_quota(err: Exception) -> bool:
    text = str(err).lower()
    return "429" in text and ("per day" in text or "perday" in text or "daily" in text)


def generate_round(topic: str, usage: Usage | None = None) -> GenResult:
    """Return a schema-valid Round for a topic: cache first, then the model chain."""
    started = time.monotonic()
    topic = topic.strip()[:120]
    if not normalize_topic(topic):
        raise GenerationError("empty topic")
    cached = _cache_path(topic)
    if cached.exists():
        r = Round.model_validate_json(cached.read_text())
        return GenResult(r, "cache", time.monotonic() - started)
    if offline():
        raise GenerationError("offline: no live generation")
    usage = usage or Usage()
    if usage.total() >= DAILY_SOFT_CAP:
        raise GenerationError("daily cap reached")
    last_err: Exception | None = None
    for model in MODEL_CHAIN:
        if not usage.available(model):
            continue
        for attempt in range(2):
            usage.record(model)
            try:
                raw = _call_model(model, topic)
                data = json.loads(raw.strip().removeprefix("```json").removesuffix("```"))
                data["reviewed"] = False
                r = Round.model_validate(data)
            except (ValidationError, ValueError, GenerationError) as err:
                last_err = err
                log.warning("bad round from %s: %s", model, str(err)[:200])
                continue
            except Exception as err:  # API errors
                last_err = err
                if _is_daily_quota(err):
                    usage.exhaust(model)
                    break
                if "429" in str(err) and attempt == 0:
                    time.sleep(2)
                    continue
                log.warning("api error from %s: %s", model, type(err).__name__)
                break
            cached.parent.mkdir(parents=True, exist_ok=True)
            cached.write_text(r.model_dump_json(indent=2))
            return GenResult(r, model, time.monotonic() - started)
    raise GenerationError(f"all models failed: {type(last_err).__name__ if last_err else 'none'}")
