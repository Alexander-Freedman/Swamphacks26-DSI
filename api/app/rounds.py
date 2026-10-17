from __future__ import annotations

import json
from functools import cache
from pathlib import Path

from app.schema import Round

ROUNDS_DIR = Path(__file__).resolve().parents[2] / "data" / "rounds"
# Hand-reviewed extra topics: served instantly for "type any topic" when the
# typed topic matches, so those topics never need live generation. Kept in a
# separate folder so the showcase set (data/rounds/*.json) is unchanged.
EXTRA_DIR = ROUNDS_DIR / "extra"


@cache
def showcase_rounds() -> dict[str, Round]:
    rounds = {}
    for path in sorted(ROUNDS_DIR.glob("*.json")):
        r = Round.model_validate(json.loads(path.read_text()))
        rounds[r.slug] = r
    return rounds


@cache
def _extras() -> tuple[dict[str, Round], dict[str, str], dict[str, list[str]]]:
    from app.gen import normalize_topic

    rounds: dict[str, Round] = {}
    keys: dict[str, str] = {}
    aliases_by_slug: dict[str, list[str]] = {}
    for path in sorted(EXTRA_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        aliases = data.pop("aliases", [])
        r = Round.model_validate(data)
        if not r.reviewed:
            continue  # only fully hand-checked rounds are served as "reviewed"
        rounds[r.slug] = r
        aliases_by_slug[r.slug] = list(aliases)
        for name in (r.topic, r.slug, *aliases):
            keys.setdefault(normalize_topic(name), r.slug)
    return rounds, keys, aliases_by_slug


def extra_aliases() -> dict[str, list[str]]:
    return _extras()[2]


def extra_rounds() -> dict[str, Round]:
    return _extras()[0]


def extra_for_topic(topic: str) -> Round | None:
    """The reviewed extra round whose topic, slug or alias matches (normalized)."""
    from app.gen import normalize_topic

    rounds, keys, _ = _extras()
    slug = keys.get(normalize_topic(topic))
    return rounds[slug] if slug else None
