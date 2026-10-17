"""The v3 compact round shape, kept for tests: builds Rounds to exercise the checks."""

import re

from pydantic import ValidationError

from app.schema import Item, Round


def _int(v):
    return int(v) if isinstance(v, (int, float)) else None


def to_round(data: dict, dropped: dict[str, str] | None = None) -> Round:
    """Map the compact generated shape onto Round (strict validation happens there).

    With `dropped`, an item that fails validation on its own (no correct option,
    no answer_expr, ...) is left out and its reason recorded there, instead of
    rejecting the whole round for one bad question.
    """
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
                "ask_x": q.get("ask_x"),
                "ask_y": q.get("ask_y"),
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
            "explore": _explore(q) if widget == "curve" else None,
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
    if dropped is not None:
        good = []
        for it in items:
            try:
                Item.model_validate(it)
                good.append(it)
            except ValidationError as err:
                msg = err.errors()[0]["msg"].removeprefix("Value error, ")
                dropped[it["id"]] = msg[:120]
        items = good
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


def _explore(q: dict) -> dict | None:
    """The curve's knob, if usable: a plain name other than x that the expr uses."""
    param, lo, hi = q.get("explore_param"), q.get("explore_min"), q.get("explore_max")
    if not isinstance(param, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9]{0,15}", param):
        return None
    if param == "x" or not isinstance(lo, (int, float)) or not isinstance(hi, (int, float)):
        return None
    if not re.search(rf"\b{param}\b", q.get("expr") or ""):
        return None  # a knob the curve doesn't use would move nothing
    step = q.get("explore_step")
    return {
        "param": param,
        "label": _clip(q.get("explore_label") or param, 60),
        "min": lo,
        "max": hi,
        "step": step if isinstance(step, (int, float)) and step > 0 else (hi - lo) / 50 or 1,
        "default": q.get("explore_default"),
    }


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
