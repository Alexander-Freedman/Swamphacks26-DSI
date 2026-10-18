"""Where Learn topics come from, and the leak guard on what goes back to the learner.

- data/learn/*.json (repo root, next to data/rounds): hand-reviewed prebuilt topics,
  checked = true, loaded once at startup. Published to Pages as static files too.
- MM_LEARN_CACHE (default data/learn-cache, gitignored): topics authored live by a
  judge typing a new topic, checked = false, one file per slug.

Slug = normalize_topic (app.gen) turned into kebab-case. A typed topic matches a stored
one when their normalized forms agree, so "Compound Interest" never re-authors.
"""

from __future__ import annotations

import json
import logging
import os
import re
from functools import cache
from pathlib import Path

from pydantic import ValidationError

from app.gen import _atomic_write, normalize_topic
from app.learn.schemas import Topic, TopicSummary

log = logging.getLogger("mm.learn.topics")

DATA_DIR = Path(__file__).resolve().parents[3] / "data"
LEARN_DIR = DATA_DIR / "learn"


def cache_dir() -> Path:
    return Path(os.environ.get("MM_LEARN_CACHE") or DATA_DIR / "learn-cache")


def slug_for(topic: str) -> str:
    key = normalize_topic(topic).replace("+", " plus ").replace("#", " sharp ")
    key = re.sub(r"[^a-z0-9]+", "-", key).strip("-")
    return (key or "topic")[:60].rstrip("-")


@cache
def prebuilt_topics() -> dict[str, Topic]:
    """The checked topics in data/learn, by slug. Bad files are logged and skipped."""
    topics: dict[str, Topic] = {}
    for path in sorted(LEARN_DIR.glob("*.json")):
        try:
            t = Topic.model_validate(json.loads(path.read_text(encoding="utf-8")))
        except (ValueError, ValidationError) as err:
            log.warning("skipping %s: %s", path.name, str(err)[:200])
            continue
        topics[t.slug] = t
    return topics


def cached_topic(slug: str) -> Topic | None:
    path = cache_dir() / f"{slug}.json"
    if not path.exists():
        return None
    try:
        return Topic.model_validate(json.loads(path.read_text(encoding="utf-8")))
    except (ValueError, ValidationError) as err:
        log.warning("bad cached topic %s: %s", path.name, str(err)[:200])
        return None


def cached_topics() -> dict[str, Topic]:
    out: dict[str, Topic] = {}
    for path in sorted(cache_dir().glob("*.json")):
        t = cached_topic(path.stem)
        if t is not None:
            out[t.slug] = t
    return out


def save_cached(topic: Topic) -> Path:
    path = cache_dir() / f"{topic.slug}.json"
    _atomic_write(path, json.dumps(topic.model_dump(mode="json"), indent=2) + "\n")
    return path


def get_topic(slug: str) -> Topic | None:
    return prebuilt_topics().get(slug) or cached_topic(slug)


def find_topic(name: str) -> Topic | None:
    """A stored topic whose topic or slug matches the typed name (normalized)."""
    key = normalize_topic(name)
    for t in [*prebuilt_topics().values(), *cached_topics().values()]:
        if key in (normalize_topic(t.topic), normalize_topic(t.slug)):
            return t
    return get_topic(slug_for(name))


def list_topics() -> list[TopicSummary]:
    seen = prebuilt_topics()
    items = [TopicSummary(slug=t.slug, topic=t.topic, checked=t.checked) for t in seen.values()]
    for slug, t in cached_topics().items():
        if slug not in seen:
            items.append(TopicSummary(slug=t.slug, topic=t.topic, checked=t.checked))
    return items


# ---------------------------------------------------------------------------
# Leak guard (prototype server/lib/guard.js): the model was told not to state the
# rule mid-attempt; this catches it literally restating its own rule text anyway.
# ---------------------------------------------------------------------------
SCRUBBED = (
    "Your idea does not hold up on this case; think again about what breaks and why. "
    "(The fuller note was held back so the rule is not given away.)"
)


def _norm(text: str) -> str:
    text = (text or "").lower().replace("÷", "/")
    text = re.sub(r"[^a-z0-9/]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def leaks(text: str | None, core_rule: str) -> bool:
    rule = _norm(core_rule)
    return len(rule) >= 8 and rule in _norm(text or "")


def scrub(text: str | None, core_rule: str, task: str = "") -> str | None:
    if text is None or not leaks(text, core_rule):
        return text
    log.warning("leak guard: %s response restated the rule; scrubbed", task)
    return SCRUBBED
