from __future__ import annotations

import json
from functools import cache
from pathlib import Path

from app.schema import Round

ROUNDS_DIR = Path(__file__).resolve().parents[2] / "data" / "rounds"


@cache
def showcase_rounds() -> dict[str, Round]:
    rounds = {}
    for path in sorted(ROUNDS_DIR.glob("*.json")):
        r = Round.model_validate(json.loads(path.read_text()))
        rounds[r.slug] = r
    return rounds
