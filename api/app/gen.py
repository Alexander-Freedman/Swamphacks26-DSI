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
import tempfile
import threading
import time
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from pydantic import ValidationError

from app.checks import CheckFailed, check_round
from app.schema import Round

log = logging.getLogger("mm.gen")

PROMPT_VERSION = 2
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
- questions: exactly 3 prediction questions, each testing a DIFFERENT
  misconception or the same one in a new setting whose intuitive answer is WRONG for many
  people. Every wrong option or numeric band must map to exactly one
  misconception id; the correct one has misconception_id null.
- choice items need exactly one correct option.
- input_type: "slider" (give slider_min/max/step/unit and numeric bands that
  cover the whole slider) or "choice" (2-4 options).
- the truth is shown by our code, not by you: set widget "distribution" with a
  sampler (and its numbers: n, p, dice, group_size, base_rate, sensitivity,
  false_positive_rate), or "curve" with expr in x using only numbers,
  + - * / ^ and sin cos tan exp log sqrt abs min max, plus x_min/x_max, or
  "estimate" when the answer is one number you can write as answer_expr
  (a probability, a percentage, a count, a ratio, a time). Almost every topic
  has a number worth predicting: prefer slider questions with "estimate",
  "curve" or "distribution". Use "stepper" (2-6 worked steps) only for a
  question where nothing can be computed, and at most once per round.
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
    # Check report from when the round was generated (kept with the cache);
    # None for rounds cached before reports were stored.
    checks: dict | None = None


def normalize_topic(topic: str) -> str:
    """Case/space-insensitive key that keeps +, # and non-Latin letters (C++ != C)."""
    text = unicodedata.normalize("NFKC", topic).casefold()
    text = "".join(ch if ch.isalnum() or ch in "+#" else " " for ch in text)
    return re.sub(r"\s+", " ", text).strip()


def _cache_path(topic: str) -> Path:
    key = hashlib.sha256(f"v{PROMPT_VERSION}:{normalize_topic(topic)}".encode()).hexdigest()[:16]
    return CACHE_DIR / "rounds" / f"{key}.json"


def _checks_path(cached: Path) -> Path:
    return cached.with_suffix(".checks.json")


def _read_checks(cached: Path) -> dict | None:
    try:
        data = json.loads(_checks_path(cached).read_text())
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def _atomic_write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-")
    with os.fdopen(fd, "w") as f:
        f.write(text)
    os.replace(tmp, path)


def _quota_day() -> str:
    return datetime.now(PACIFIC).strftime("%Y-%m-%d")


_USAGE_LOCK = threading.Lock()


class Usage:
    """Per-quota-day call counter and per-model exhaustion flags, stored on disk.

    Writes are atomic and serialized; an unreadable file never resets the count.
    """

    _last_good: dict | None = None

    def __init__(self, path: Path | None = None) -> None:
        self.path = path or CACHE_DIR / "usage.json"

    def _load(self) -> dict:
        try:
            data = json.loads(self.path.read_text())
            Usage._last_good = data
        except FileNotFoundError:
            data = {}
        except (OSError, ValueError):
            data = dict(Usage._last_good or {})
        if data.get("day") != _quota_day():
            data = {"day": _quota_day(), "calls": {}, "exhausted": []}
        return data

    def _save(self, data: dict) -> None:
        _atomic_write(self.path, json.dumps(data))
        Usage._last_good = data

    def total(self) -> int:
        return sum(self._load()["calls"].values())

    def snapshot(self) -> dict:
        return self._load()

    def record(self, model: str) -> None:
        with _USAGE_LOCK:
            data = self._load()
            data["calls"][model] = data["calls"].get(model, 0) + 1
            self._save(data)

    def help_total(self) -> int:
        """Help-chat calls today (own bucket and cap, see app/help.py)."""
        return sum(self._load().get("help", {}).values())

    def record_help(self, model: str) -> None:
        with _USAGE_LOCK:
            data = self._load()
            bucket = data.setdefault("help", {})
            bucket[model] = bucket.get(model, 0) + 1
            self._save(data)

    def exhaust(self, model: str) -> None:
        with _USAGE_LOCK:
            data = self._load()
            if model not in data["exhausted"]:
                data["exhausted"].append(model)
            self._save(data)

    def available(self, model: str) -> bool:
        return model not in self._load()["exhausted"]


def offline() -> bool:
    return os.environ.get("MM_OFFLINE") == "1" or not os.environ.get("GEMINI_API_KEY")


_S = {"type": "string"}
_N = {"type": "number"}
_NS = {"type": "string", "nullable": True}
_NN = {"type": "number", "nullable": True}

# Compact schema the model fills. The full Round schema is over the API's
# complexity limit (generic 400), so the model gets this and to_round() maps it
# onto Round, which then validates everything strictly.
GEN_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "slug": _S,
        "topic": _S,
        "concept": _S,
        "misconceptions": {
            "type": "array",
            "minItems": 2,
            "maxItems": 5,
            "items": {
                "type": "object",
                "properties": {
                    "id": _S,
                    "label": _S,
                    "why_tempting": _S,
                    "refutation": _S,
                    "source_url": _NS,
                    "source_note": _NS,
                },
                "required": ["id", "label", "why_tempting", "refutation"],
            },
        },
        "questions": {
            "type": "array",
            "minItems": 3,
            "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {
                    "id": _S,
                    "prompt": _S,
                    "input_type": {"type": "string", "enum": ["slider", "choice"]},
                    "slider_min": _NN,
                    "slider_max": _NN,
                    "slider_step": _NN,
                    "slider_unit": _NS,
                    "options": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {"id": _S, "text": _S, "misconception_id": _NS},
                            "required": ["id", "text"],
                        },
                    },
                    "bands": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {"min": _N, "max": _N, "misconception_id": _NS},
                            "required": ["min", "max"],
                        },
                    },
                    "widget": {
                        "type": "string",
                        "enum": ["distribution", "curve", "estimate", "stepper"],
                    },
                    "sampler": {
                        "type": "string",
                        "nullable": True,
                        "enum": [
                            "coin_longest_run",
                            "base_rate_test",
                            "birthday_match",
                            "binomial_count",
                            "dice_sum",
                        ],
                    },
                    "n": _NN,
                    "p": _NN,
                    "dice": _NN,
                    "group_size": _NN,
                    "base_rate": _NN,
                    "sensitivity": _NN,
                    "false_positive_rate": _NN,
                    "expr": _NS,
                    "x_min": _NN,
                    "x_max": _NN,
                    "x_label": _NS,
                    "y_label": _NS,
                    "steps": {"type": "array", "items": _S},
                    "answer_expr": _NS,
                    "answer_claimed": _NN,
                    "targets": {"type": "array", "items": _S},
                },
                "required": ["id", "prompt", "input_type", "widget"],
            },
        },
    },
    "required": ["slug", "topic", "concept", "misconceptions", "questions"],
}


def _int(v):
    return int(v) if isinstance(v, (int, float)) else None


def to_round(data: dict) -> Round:
    """Map the compact generated shape onto Round (strict validation happens there)."""
    items = []
    for q in data.get("questions", []):
        widget = q.get("widget")
        if widget == "distribution":
            params = {
                "n": _int(q.get("n")),
                "p": q.get("p"),
                "dice": _int(q.get("dice")),
                "group_size": _int(q.get("group_size")),
                "base_rate": q.get("base_rate"),
                "sensitivity": q.get("sensitivity"),
                "false_positive_rate": q.get("false_positive_rate"),
                "population": 1000 if q.get("sampler") == "base_rate_test" else None,
            }
            truth = {
                "widget": "distribution",
                "sampler": q.get("sampler"),
                "params": {k: v for k, v in params.items() if v is not None},
                "x_label": q.get("x_label") or "",
            }
        elif widget == "curve":
            truth = {
                "widget": "curve",
                "expr": q.get("expr"),
                "x_min": q.get("x_min"),
                "x_max": q.get("x_max"),
                "x_label": q.get("x_label") or "",
                "y_label": q.get("y_label") or "",
            }
        elif widget == "estimate":
            truth = {"widget": "estimate", "unit": q.get("slider_unit") or ""}
        else:
            truth = {"widget": "stepper", "steps": q.get("steps") or []}
        item = {
            "id": q.get("id"),
            "prompt": _clip(q.get("prompt"), 300),
            "input_type": q.get("input_type"),
            "options": q.get("options") or [],
            "bands": q.get("bands") or [],
            "truth": truth,
            "answer_expr": q.get("answer_expr"),
            "answer_claimed": q.get("answer_claimed"),
            "targets": q.get("targets") or [],
        }
        if q.get("input_type") == "slider":
            item["slider"] = {
                "min": q.get("slider_min"),
                "max": q.get("slider_max"),
                "step": q.get("slider_step") or 1,
                "unit": q.get("slider_unit") or "",
            }
        items.append(item)
    known = {_slugify(m.get("id", "")) for m in data.get("misconceptions", [])}
    for it in items:
        _fix_ids(it)
        # A dangling reference can't be shown as a named wrong idea, so drop
        # that band/option rather than silently calling it "correct".
        it["bands"] = [b for b in it["bands"] if b.get("misconception_id") in known | {None}]
        it["options"] = [o for o in it["options"] if o.get("misconception_id") in known | {None}]
        it["targets"] = [t for t in it["targets"] if t in known]
    return Round.model_validate(
        {
            "schema_version": 1,
            "slug": _slugify(data.get("slug") or data.get("topic") or "topic"),
            "reviewed": False,
            "topic": _clip(data.get("topic"), 120),
            "concept": _clip(data.get("concept"), 300),
            "misconceptions": [
                {
                    **m,
                    "id": _slugify(m.get("id", "")),
                    "label": _clip(m.get("label"), 80),
                    "why_tempting": _clip(m.get("why_tempting"), 280),
                    "refutation": _clip(m.get("refutation"), 400),
                    "source_note": _clip(m.get("source_note"), 200),
                }
                for m in data.get("misconceptions", [])
            ],
            "items": items,
        }
    )


def _clip(text, n: int):
    if not isinstance(text, str):
        return text
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def _slugify(text: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", str(text).lower())).strip("-")[:60] or "x"


def _fix_ids(item: dict) -> dict:
    item["id"] = _slugify(item.get("id") or "q")
    for o in item["options"]:
        o["id"] = _slugify(o.get("id") or o.get("text", "o"))
        if o.get("misconception_id"):
            o["misconception_id"] = _slugify(o["misconception_id"])
    for b in item["bands"]:
        if b.get("misconception_id"):
            b["misconception_id"] = _slugify(b["misconception_id"])
    item["targets"] = [_slugify(t) for t in item["targets"]]
    return item


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
            f"{json.dumps(GEN_SCHEMA)}\n\n{contents}"
        )
    else:
        config.system_instruction = SYSTEM_PROMPT
        config.response_json_schema = GEN_SCHEMA
        config.thinking_config = types.ThinkingConfig(thinking_level="minimal")
    resp = client.models.generate_content(model=model, contents=contents, config=config)
    finish = resp.candidates[0].finish_reason if resp.candidates else None
    if finish is not None and str(finish).split(".")[-1] not in (
        "STOP",
        "FINISH_REASON_UNSPECIFIED",
    ):
        raise GenerationError(f"{model} stopped early ({finish})")
    return resp.text or ""


def _is_daily_quota(err: Exception) -> bool:
    text = str(err).lower()
    return "429" in text and ("per day" in text or "perday" in text or "daily" in text)


FAILED_TTL_S = 3600


def _slug_path(slug: str) -> Path:
    return CACHE_DIR / "by-slug" / f"{slug}.json"


def generated_round(slug: str) -> Round | None:
    """A previously generated round by slug (for answers on any-topic rounds)."""
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", slug or ""):
        return None
    path = _slug_path(slug)
    try:
        return Round.model_validate_json(path.read_text())
    except (OSError, ValidationError, ValueError):
        return None


def _failed_path(topic: str) -> Path:
    return _cache_path(topic).with_suffix(".failed")


def generate_round(topic: str, usage: Usage | None = None) -> GenResult:
    """Return a schema-valid, checked Round: cache first, then the model chain.

    Each model gets one try for content problems (bad JSON/schema/checks) and
    one quick retry for a per-minute 429. A topic that fails everywhere is
    remembered for an hour so repeated requests can't burn the daily quota.
    """

    started = time.monotonic()
    topic = topic.strip()[:120]
    if not normalize_topic(topic):
        raise GenerationError("empty topic")
    cached = _cache_path(topic)
    if cached.exists():
        try:
            r = Round.model_validate_json(cached.read_text())
            return GenResult(r, "cache", time.monotonic() - started, _read_checks(cached))
        except (ValidationError, ValueError, OSError):
            cached.unlink(missing_ok=True)  # stale or torn; regenerate
    failed = _failed_path(topic)
    if failed.exists() and time.time() - failed.stat().st_mtime < FAILED_TTL_S:
        raise GenerationError("recently failed")
    if offline():
        raise GenerationError("offline: no live generation")
    usage = usage or Usage()
    last_err: Exception | None = None
    for model in MODEL_CHAIN:
        if not usage.available(model):
            continue
        for attempt in range(2):
            if usage.total() >= DAILY_SOFT_CAP:
                raise GenerationError("daily cap reached")
            usage.record(model)
            try:
                raw = _call_model(model, topic)
                data = json.loads(raw.strip().removeprefix("```json").removesuffix("```"))
                r, report = check_round(to_round(data), usage=usage)
                log.info("checks for %r: %s", topic, report.as_dict())
            except (ValidationError, ValueError, GenerationError, CheckFailed) as err:
                last_err = err
                log.warning("bad round from %s: %s", model, str(err).replace("\n", " ")[:300])
                break  # content problem: move to the next model, don't repeat this one
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
            seconds = time.monotonic() - started
            report_out = report.public(model, seconds)
            # Report first, so a cached round always has its report next to it.
            _atomic_write(_checks_path(cached), json.dumps(report_out))
            _atomic_write(cached, r.model_dump_json(indent=2))
            _atomic_write(_slug_path(r.slug), r.model_dump_json(indent=2))
            return GenResult(r, model, seconds, report_out)
    _atomic_write(failed, "")
    raise GenerationError(f"all models failed: {type(last_err).__name__ if last_err else 'none'}")
