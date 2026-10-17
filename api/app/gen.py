"""Engine v4: a typed topic becomes a runnable model spec (Gemini API, free tier).

- One structured-output call per fresh topic returns a compact model spec:
  which of our widgets runs the idea (curve, sampler, dial, or an honest
  stepper), its numbers, the prediction, the extremes to try and the named
  misconception. app/spec.py validates it, computes every truth in code and
  compiles it into a Round. The model's own number is only cross-checked.
- Topics that aren't real concepts, or that no widget fits, get an honest
  no-fit (NoFit) instead of a made-up quiz.
- The result (spec + round + check report) is cached on disk by normalized
  topic + prompt version.
- Model chain: 3.5 Flash-Lite -> 3.1 Flash-Lite -> Gemma 26B. Daily-quota 429s
  are never retried; that model is skipped until the quota day resets
  (midnight Pacific). A bad spec gets one retry, then no-fit.
- A per-day request counter stops live calls at DAILY_SOFT_CAP.
- No key (or MM_OFFLINE=1): never calls the API.
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

from app.schema import ModelSpec, Round, SpecCase
from app.spec import (
    SpecRejected,
    compile_spec,
    definition_covers_topic,
    topic_looks_unreal,
)

log = logging.getLogger("mm.gen")

PROMPT_VERSION = 4
MODEL_CHAIN = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it"]
DAILY_SOFT_CAP = 480
MAX_CONTENT_TRIES = 2  # first spec + one retry
TIMEOUT_S = 30
CACHE_DIR = Path(__file__).resolve().parents[2] / "data" / "cache"
PACIFIC = ZoneInfo("America/Los_Angeles")

SYSTEM_PROMPT = """You turn a topic into a small RUNNABLE MODEL, as JSON.

A curious college student types a topic. They predict a number BEFORE seeing
anything, then our code RUNS the model (a curve they can drag, or thousands of
simulated trials) and shows where their guess was wrong, then we name the
specific wrong idea. You never write the answer: you fill a spec and our code
computes the truth from it.

First: recognized = true only if the topic is a real concept, fact or
phenomenon you can define. If it is gibberish, made up, or not a topic, set
recognized = false, no_fit_reason, and leave the rest minimal. definition:
one plain sentence saying what the topic is (use the topic's own words).

Then pick ONE widget for cases[0] (in this order of preference):
1. "curve": the idea is a real formula y = f(x) (growth, decay, motion,
   cost, probability vs group size). expr uses only x, the knob name, your
   variable names, numbers, + - * / ^, sin cos tan exp log log2 log10 sqrt
   abs min max. Set exactly one of ask_x (question asks y at that x) or
   ask_y (question asks which x first reaches that y). x_min/x_max contain the
   asked point with room on both sides; y in the SAME units as the slider.
   knob_*: the one parameter a learner wants to drag; knob_default = the value
   in the question.
2. "sampler": the idea is chance and fits one of these exactly:
   coin_longest_run (n fair flips; stat mean_longest_run, or p_run_at_least
   with k), base_rate_test (base_rate, sensitivity, false_positive_rate as
   0-1 fractions; stat p_true_positive), birthday_match (group_size; stat
   p_match), binomial_count (n, p; stat mean | mode | p_at_least k |
   p_equals k), dice_sum (dice = number of six-sided dice; same stats).
   Probabilities (p_*) are answered in PERCENT 0-100.
3. "dial": one number computed from a few real quantities: variables
   (name, meaning in plain words, unit, value) and answer_expr in those names.
4. "stepper": nothing can be computed honestly; 2-6 worked steps and
   answer_text. Use only when 1-3 really don't fit.
If no widget fits at all, recognized = true but widget "none" and say why
in no_fit_reason. Never invent survey numbers ("what % of people...").

prediction: prompt (never reveals the answer), input "slider" (slider_min,
slider_max, slider_step, slider_unit, and bands covering the whole slider
with exactly one correct band, misconception_id null) or "choice" (2-4
options; each numeric option has its value; exactly one correct option,
misconception_id null). Every wrong band/option names a misconception id.
misconceptions: 1-3 documented wrong ideas real learners hold, the main one
first: label, why_tempting, refutation (1-2 sentences). source_url only if
you are sure it exists, else null.
extremes: 2-3 settings worth trying after the reveal (param = the knob, a
sampler param, or a variable name; value; watch = one line on what to look
for). answer_claimed: your own number for the answer.
compare: if a second case LOOKS different but WORKS the same, give
compare_topic, compare_principle (the shared idea in one sentence) and put
it as cases[1] with the SAME widget and its own prediction and bands.
slug: lowercase words joined by hyphens. Plain, friendly words, no markdown.

Examples (fields abridged):
{"recognized": true, "definition": "Compound interest is interest earned on
 both the money you put in and the interest it already earned.",
 "cases": [{"widget": "curve", "expr": "P*(1+r/100)^x", "variables": [{"name":
 "P", "meaning": "money put in", "unit": "$", "value": 1000}], "x_min": 0,
 "x_max": 40, "x_label": "years", "y_label": "value ($)", "ask_x": 30,
 "knob_param": "r", "knob_label": "interest rate (%)", "knob_min": 1,
 "knob_max": 12, "knob_step": 0.5, "knob_default": 7, "prompt": "You put
 $1,000 in at 7% a year and leave it 30 years. About what is it worth?",
 "input": "slider", "slider_min": 1000, "slider_max": 15000, "slider_step":
 100, "slider_unit": "$", "bands": [{"min": 1000, "max": 3500,
 "misconception_id": "linear-growth"}, {"min": 3600, "max": 6400,
 "misconception_id": "underestimate-compounding"}, {"min": 6500, "max": 8700,
 "misconception_id": null}, {"min": 8800, "max": 15000, "misconception_id":
 "overestimate"}], "extremes": [{"param": "r", "value": 2, "watch": "Low
 rates look almost like a straight line."}, {"param": "r", "value": 12,
 "watch": "At 12% it doubles about every 6 years."}], "answer_claimed": 7612}]}
{"cases": [{"widget": "sampler", "sampler": "birthday_match", "group_size": 23,
 "stat": "p_match", "prompt": "23 people in a room. What's the chance two
 share a birthday?", "input": "slider", "slider_min": 0, "slider_max": 100,
 "slider_unit": "%", ..., "extremes": [{"param": "group_size", "value": 60,
 "watch": "Almost certain by 60."}], "answer_claimed": 50.7}],
 "compare_topic": "Two files with the same short hash", "compare_principle":
 "Matches grow with the number of PAIRS, not the number of items."}"""


class GenerationError(Exception):
    pass


class NoFit(GenerationError):
    """Honest no: the topic isn't a real concept, or no widget can run it."""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


@dataclass
class GenResult:
    round: Round
    source: str  # "cache" | model id
    seconds: float
    spec: ModelSpec | None = None
    # Check report from when the spec was compiled (kept with the cache).
    checks: dict | None = None


def normalize_topic(topic: str) -> str:
    """Case/space-insensitive key that keeps +, # and non-Latin letters (C++ != C)."""
    text = unicodedata.normalize("NFKC", topic).casefold()
    text = "".join(ch if ch.isalnum() or ch in "+#" else " " for ch in text)
    return re.sub(r"\s+", " ", text).strip()


def _cache_path(topic: str) -> Path:
    key = hashlib.sha256(f"v{PROMPT_VERSION}:{normalize_topic(topic)}".encode()).hexdigest()[:16]
    return CACHE_DIR / "rounds" / f"{key}.json"


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
        # Generation and help share the same free-tier quota, so both count here.
        data = self._load()
        return sum(data["calls"].values()) + sum(data.get("help", {}).values())

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

_CASE: dict = {
    "type": "object",
    "properties": {
        "widget": {"type": "string", "enum": ["curve", "sampler", "dial", "stepper", "none"]},
        "variables": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"name": _S, "meaning": _S, "unit": _NS, "value": _N},
                "required": ["name", "meaning", "value"],
            },
        },
        "expr": _NS,
        "x_min": _NN,
        "x_max": _NN,
        "x_label": _NS,
        "y_label": _NS,
        "ask_x": _NN,
        "ask_y": _NN,
        "knob_param": _NS,
        "knob_label": _NS,
        "knob_min": _NN,
        "knob_max": _NN,
        "knob_step": _NN,
        "knob_default": _NN,
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
        "stat": {
            "type": "string",
            "nullable": True,
            "enum": [
                "mean_longest_run",
                "p_run_at_least",
                "p_true_positive",
                "p_match",
                "mean",
                "mode",
                "p_at_least",
                "p_equals",
            ],
        },
        "k": _NN,
        "answer_expr": _NS,
        "unit": _NS,
        "steps": {"type": "array", "items": _S},
        "answer_text": _NS,
        "prompt": _S,
        "input": {"type": "string", "enum": ["slider", "choice"]},
        "slider_min": _NN,
        "slider_max": _NN,
        "slider_step": _NN,
        "slider_unit": _NS,
        "options": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"id": _S, "text": _S, "value": _NN, "misconception_id": _NS},
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
        "extremes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"param": _S, "value": _N, "watch": _S},
                "required": ["param", "value", "watch"],
            },
        },
        "answer_claimed": _NN,
    },
    "required": ["widget", "prompt", "input"],
}

# Compact schema the model fills (the nested ModelSpec is over the API's
# schema complexity limit). spec_from_gen() maps it onto ModelSpec, which then
# validates everything strictly.
GEN_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "recognized": {"type": "boolean"},
        "no_fit_reason": _NS,
        "slug": _S,
        "topic": _S,
        "definition": _S,
        "concept": _S,
        "misconceptions": {
            "type": "array",
            "minItems": 1,
            "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {
                    "id": _S,
                    "label": _S,
                    "why_tempting": _S,
                    "refutation": _S,
                    "source_url": _NS,
                },
                "required": ["id", "label", "why_tempting", "refutation"],
            },
        },
        "cases": {"type": "array", "minItems": 1, "maxItems": 2, "items": _CASE},
        "compare_topic": _NS,
        "compare_principle": _NS,
    },
    "required": ["recognized", "slug", "topic", "definition", "concept", "cases"],
}

_INT_FIELDS = ("n", "dice", "group_size")
_SAMPLER_FIELDS = (
    "n",
    "p",
    "dice",
    "group_size",
    "base_rate",
    "sensitivity",
    "false_positive_rate",
)


def _clip(text, n: int):
    if not isinstance(text, str):
        return text
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def _slugify(text) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", str(text).lower())).strip("-")[:60] or "x"


def _ref(mid):
    return _slugify(mid) if mid else None


def _case_from_gen(c: dict) -> dict:
    """Compact case → SpecCase dict (no validation here; ModelSpec does that)."""
    widget = c.get("widget")
    out: dict = {
        "widget": widget,
        "variables": [
            {
                "name": v.get("name"),
                "meaning": _clip(v.get("meaning"), 120),
                "unit": _clip(v.get("unit") or "", 30),
                "value": v.get("value"),
            }
            for v in c.get("variables") or []
        ],
        "prediction": {
            "prompt": _clip(c.get("prompt"), 300),
            "input": c.get("input"),
            "options": [
                {
                    "id": _slugify(o.get("id") or o.get("text") or "o"),
                    "text": _clip(o.get("text"), 200),
                    "value": o.get("value"),
                    "misconception_id": _ref(o.get("misconception_id")),
                }
                for o in c.get("options") or []
            ],
        },
        "bands": [
            {
                "min": b.get("min"),
                "max": b.get("max"),
                "misconception_id": _ref(b.get("misconception_id")),
            }
            for b in c.get("bands") or []
        ],
        "extremes": [
            {"param": e.get("param"), "value": e.get("value"), "watch": _clip(e.get("watch"), 160)}
            for e in (c.get("extremes") or [])[:3]
        ],
        "answer_claimed": c.get("answer_claimed"),
    }
    if c.get("input") == "slider":
        out["prediction"]["slider"] = {
            "min": c.get("slider_min"),
            "max": c.get("slider_max"),
            "step": c.get("slider_step") or 1,
            "unit": c.get("slider_unit") or "",
        }
    if widget == "curve":
        lo, hi = c.get("knob_min"), c.get("knob_max")
        step = c.get("knob_step")
        if not (isinstance(step, (int, float)) and step > 0):
            step = (
                (hi - lo) / 50
                if isinstance(lo, (int, float)) and isinstance(hi, (int, float))
                else 1
            )
        out["curve"] = {
            "expr": c.get("expr"),
            "x_min": c.get("x_min"),
            "x_max": c.get("x_max"),
            "x_label": _clip(c.get("x_label") or "", 60),
            "y_label": _clip(c.get("y_label") or "", 60),
            "ask_x": c.get("ask_x"),
            "ask_y": c.get("ask_y"),
            "knob": {
                "param": c.get("knob_param"),
                "label": _clip(c.get("knob_label") or c.get("knob_param") or "", 60),
                "min": lo,
                "max": hi,
                "step": step or 1,
                "default": c.get("knob_default"),
            },
        }
    elif widget == "sampler":
        params = {}
        for f in _SAMPLER_FIELDS:
            v = c.get(f)
            if isinstance(v, (int, float)):
                params[f] = int(v) if f in _INT_FIELDS else v
        if c.get("sampler") == "base_rate_test":
            params["population"] = 1000
        out["sampler"] = {
            "sampler": c.get("sampler"),
            "params": params,
            "stat": c.get("stat"),
            "k": c.get("k"),
            "x_label": _clip(c.get("x_label") or "", 60),
        }
    elif widget == "dial":
        out["dial"] = {"answer_expr": c.get("answer_expr"), "unit": _clip(c.get("unit") or "", 30)}
    elif widget == "stepper":
        out["stepper"] = {
            "steps": [_clip(s, 300) for s in (c.get("steps") or [])[:8]],
            "answer_text": _clip(c.get("answer_text") or "", 200),
        }
    return out


def _compare_case(c: dict, data: dict) -> dict | None:
    """The second case, or None if it's malformed (the compare screen then stays text-only)."""
    case = _case_from_gen(c)
    known = {_slugify(m.get("id", "")) for m in data.get("misconceptions") or []}
    refs = [b["misconception_id"] for b in case["bands"]]
    refs += [o["misconception_id"] for o in case["prediction"]["options"]]
    if {r for r in refs if r} - known:
        return None
    try:
        SpecCase.model_validate(case)
    except ValidationError:
        return None
    return case


def spec_from_gen(data: dict, topic: str) -> ModelSpec:
    """Compact generated JSON → validated ModelSpec. Raises NoFit for an honest no.

    Raises pydantic ValidationError / ValueError for a malformed spec (worth a retry).
    """
    if data.get("recognized") is False:
        raise NoFit(
            _clip(data.get("no_fit_reason") or "That doesn't look like a topic I know.", 200)
        )
    cases = data.get("cases") or []
    if not cases or cases[0].get("widget") in (None, "none"):
        raise NoFit(
            _clip(data.get("no_fit_reason") or "None of my models can run this topic yet.", 200)
        )
    definition = data.get("definition") or ""
    if not definition_covers_topic(topic, definition, data.get("concept") or ""):
        raise NoFit("I couldn't pin down what that topic is, so I won't make up a model for it.")
    compare = None
    if data.get("compare_topic") and data.get("compare_principle"):
        second = (
            cases[1]
            if len(cases) > 1 and cases[1].get("widget") == cases[0].get("widget")
            else None
        )
        compare = {
            "topic": _clip(data["compare_topic"], 120),
            "shared_principle": _clip(data["compare_principle"], 300),
            "case": _compare_case(second, data) if second else None,
        }
    return ModelSpec.model_validate(
        {
            "slug": _slugify(data.get("slug") or data.get("topic") or topic),
            "topic": _clip(data.get("topic") or topic, 120),
            "concept": _clip(data.get("concept"), 300),
            "definition": _clip(definition, 300),
            "case": _case_from_gen(cases[0]),
            "misconceptions": [
                {
                    "id": _slugify(m.get("id", "")),
                    "label": _clip(m.get("label"), 80),
                    "why_tempting": _clip(m.get("why_tempting"), 280),
                    "refutation": _clip(m.get("refutation"), 400),
                    "source_url": m.get("source_url") or None,
                    "source_note": None if m.get("source_url") else "unverified",
                }
                for m in (data.get("misconceptions") or [])[:3]
            ],
            "compare": compare,
        }
    )


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


def _nofit_path(topic: str) -> Path:
    return _cache_path(topic).with_suffix(".nofit")


def _read_cache(cached: Path, started: float) -> GenResult | None:
    try:
        data = json.loads(cached.read_text())
        r = Round.model_validate(data["round"])
        spec = ModelSpec.model_validate(data["spec"])
    except (OSError, ValueError, KeyError, TypeError, ValidationError):
        cached.unlink(missing_ok=True)  # stale or torn; regenerate
        return None
    checks = data.get("checks") if isinstance(data.get("checks"), dict) else None
    return GenResult(r, "cache", time.monotonic() - started, spec, checks)


def generate_round(topic: str, usage: Usage | None = None) -> GenResult:
    """Return a checked Round compiled from a model spec: cache first, then the model chain.

    Raises NoFit for an honest no (unreal topic, nothing fits, or the spec still
    fails validation/checks after one retry) and GenerationError for anything
    else (offline, cap, API errors). A failed topic is remembered for an hour so
    repeated requests can't burn the daily quota; a no-fit is remembered for good.
    """

    started = time.monotonic()
    topic = topic.strip()[:120]
    if not normalize_topic(topic):
        raise GenerationError("empty topic")
    if topic_looks_unreal(topic):
        raise NoFit("That doesn't look like a topic I know, so I won't make up a model for it.")
    cached = _cache_path(topic)
    if cached.exists():
        hit = _read_cache(cached, started)
        if hit is not None:
            return hit
    nofit = _nofit_path(topic)
    if nofit.exists():
        raise NoFit(nofit.read_text()[:200] or "None of my models can run this topic yet.")
    failed = _failed_path(topic)
    if failed.exists() and time.time() - failed.stat().st_mtime < FAILED_TTL_S:
        raise GenerationError("recently failed")
    if offline():
        raise GenerationError("offline: no live generation")
    usage = usage or Usage()
    last_err: Exception | None = None
    content_tries = 0
    for model in MODEL_CHAIN:
        if content_tries >= MAX_CONTENT_TRIES:
            break
        if not usage.available(model):
            continue
        for attempt in range(2):
            if usage.total() >= DAILY_SOFT_CAP:
                raise GenerationError("daily cap reached")
            usage.record(model)
            try:
                raw = _call_model(model, topic)
                data = json.loads(raw.strip().removeprefix("```json").removesuffix("```"))
                if not isinstance(data, dict):
                    raise ValueError("spec is not an object")
                spec = spec_from_gen(data, topic)
                compiled = compile_spec(spec)
            except NoFit as err:
                _atomic_write(nofit, err.reason)
                raise
            except (ValidationError, ValueError, TypeError, SpecRejected, GenerationError) as err:
                last_err = err
                content_tries += 1
                log.warning("bad spec from %s: %s", model, str(err).replace("\n", " ")[:300])
                break  # content problem: the retry goes to the next model
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
            r = compiled.round
            report = compiled.report.public(model, seconds)
            report["computed"] = [i.id for i in r.items if i.computed]
            log.info("checks for %r: %s", topic, report)
            entry = {
                "spec": spec.model_dump(mode="json"),
                "round": r.model_dump(mode="json"),
                "checks": report,
            }
            _atomic_write(cached, json.dumps(entry, indent=2))
            _atomic_write(_slug_path(r.slug), r.model_dump_json(indent=2))
            return GenResult(r, model, seconds, spec, report)
    if content_tries >= MAX_CONTENT_TRIES:
        # Two specs in a row that don't compute or don't check: say so honestly.
        _atomic_write(failed, "")
        raise NoFit("I couldn't build a model I could check for this topic.")
    _atomic_write(failed, "")
    raise GenerationError(f"all models failed: {type(last_err).__name__ if last_err else 'none'}")
