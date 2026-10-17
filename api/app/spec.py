"""Engine v4: compile a model spec into a playable Round, with every truth computed in code.

The generator only fills a ModelSpec (app/schema.py). Here code:
- computes the true answer from the spec (a curve's value, slope, area or
  limit; an exact sampler stat); the generator's own number is only
  cross-checked;
- recomputes the answer at each extreme the spec suggests;
- runs the same item checks as before (bands cover the slider, the correct band
  holds the truth, curves draw, the prompt doesn't give the answer away);
- compiles the result into a Round the existing player can show.
Also here: the topic guard (gibberish never gets a made-up model) and the
"nearest reviewed topics" list for an honest no-fit.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.checks import Report, check_item
from app.schema import (
    Item,
    ModelSpec,
    Round,
    SpecCase,
    SpecWidget,
)
from app.truth import _FUNCS, eval_expr, sampler_stat

_EXPR_ERRORS = (ValueError, ZeroDivisionError, OverflowError, TypeError)
SAMPLER_PARAMS = (
    "n",
    "p",
    "population",
    "base_rate",
    "sensitivity",
    "false_positive_rate",
    "group_size",
    "dice",
)
INT_PARAMS = ("n", "population", "group_size", "dice")
CHOICE_TOLERANCE = 0.05


class SpecRejected(Exception):
    """The spec can't be turned into a checked runnable model."""


def substitute(expr: str, values: dict[str, float]) -> str:
    """Replace variable names with their numbers so the browser only sees x and the knob."""
    for name in sorted(values, key=len, reverse=True):
        expr = re.sub(rf"\b{re.escape(name)}\b", f"({values[name]!r})", expr)
    return expr


def _vars(case: SpecCase, override: dict[str, float] | None = None) -> dict[str, float]:
    out = {v.name: v.value for v in case.variables}
    if override:
        out.update({k: v for k, v in override.items() if k in out})
    return out


def _crossing(f, lo: float, hi: float, target: float, n: int = 400) -> float | None:
    xs = [lo + (hi - lo) * i / n for i in range(n + 1)]
    gs = [f(x) - target for x in xs]
    for i in range(n):
        if gs[i] == 0:
            return xs[i]
        if gs[i] * gs[i + 1] < 0:
            a, b, ga = xs[i], xs[i + 1], gs[i]
            for _ in range(60):
                mid = (a + b) / 2
                gm = f(mid) - target
                if ga * gm <= 0:
                    b = mid
                else:
                    a, ga = mid, gm
            return (a + b) / 2
    return xs[n] if gs[n] == 0 else None


def _slope(f, a: float, scale: float) -> float:
    """Derivative at a; rejects a corner (left and right slopes differ) or a jump."""
    h = scale * 1e-5
    right = (f(a + h) - f(a)) / h
    left = (f(a) - f(a - h)) / h
    if not math.isclose(left, right, rel_tol=1e-2, abs_tol=1e-3 * max(1.0, abs(right))):
        raise SpecRejected("the curve has no single slope there")
    central = (f(a + h) - f(a - h)) / (2 * h)
    return float(f"{central:.6g}")  # numerical noise off: 5.9999999 -> 6


def _area(f, lo: float, hi: float, n: int = 2000) -> float:
    """Integral by Simpson's rule (n even)."""
    h = (hi - lo) / n
    total = f(lo) + f(hi)
    for i in range(1, n):
        total += (4 if i % 2 else 2) * f(lo + i * h)
    return total * h / 3


def left_riemann(f, lo: float, hi: float, n: int) -> float:
    """What n left-endpoint rectangles add up to (what the picture shows for that knob)."""
    n = max(1, int(n))
    h = (hi - lo) / n
    return sum(f(lo + i * h) for i in range(n)) * h


def _limit(f, a: float, scale: float) -> float:
    """Limit at a from both sides; rejects one that doesn't settle or differs by side."""
    sides = []
    for sign in (-1, 1):
        vals = [f(a + sign * scale * h) for h in (1e-4, 1e-6)]
        if not math.isclose(vals[0], vals[1], rel_tol=1e-3, abs_tol=1e-6):
            raise SpecRejected("the curve doesn't settle near the asked x")
        sides.append(vals[1])
    if not math.isclose(sides[0], sides[1], rel_tol=1e-3, abs_tol=1e-6):
        raise SpecRejected("left and right limits differ")
    return float(f"{(sides[0] + sides[1]) / 2:.6g}")


def compute_truth(case: SpecCase, override: dict[str, float] | None = None) -> float:
    """The case's true answer, computed by code from the spec.

    `override` sets a knob / sampler param / variable (used for the extremes).
    For an area curve the knob is the number of rectangles: with it overridden
    the answer is what that many left rectangles add up to.
    Raises SpecRejected if the spec doesn't compute.
    """
    override = override or {}
    try:
        if case.widget is SpecWidget.curve:
            c = case.curve
            assert c is not None
            names = _vars(case, override)
            names[c.knob.param] = override.get(c.knob.param, c.knob.default)

            def f(x: float) -> float:
                return eval_expr(c.expr, x=x, **names)

            scale = c.x_max - c.x_min
            if c.mode == "slope":
                value = _slope(f, c.ask_x, scale)
            elif c.mode == "limit":
                value = _limit(f, c.ask_x, scale)
            elif c.mode == "area":
                if c.knob.param in override:
                    value = left_riemann(f, c.area_from, c.area_to, override[c.knob.param])
                else:
                    value = _area(f, c.area_from, c.area_to)
            elif c.ask_x is not None:
                value = f(c.ask_x)
            else:
                assert c.ask_y is not None
                value = _crossing(f, c.x_min, c.x_max, c.ask_y)
                if value is None:
                    raise SpecRejected("curve never reaches the asked y in its range")
        else:
            s = case.sampler
            assert s is not None
            params = s.params.model_dump()
            for k, v in override.items():
                if k in SAMPLER_PARAMS:
                    params[k] = int(v) if k in INT_PARAMS else v
            k_val = override.get("k", s.k)
            value = sampler_stat(s.sampler.value, params, s.stat.value, k_val)
    except _EXPR_ERRORS as err:
        raise SpecRejected(f"truth doesn't compute: {str(err)[:80]}") from err
    if value is None or not math.isfinite(value):
        raise SpecRejected("truth isn't a finite number")
    return float(value)


_BANNED = re.compile(
    r"\b(bets?|betting|wagers?|lock (it )?in|locked in|called it|confiden(ce|t))\b", re.I
)


def _wording_problem(case: SpecCase) -> str | None:
    """No betting words anywhere a learner reads them."""
    texts = [case.prediction.prompt] + [o.text for o in case.prediction.options]
    texts += [e.watch for e in case.extremes]
    if case.curve:
        texts += [case.curve.knob.label, case.curve.x_label, case.curve.y_label]
    for t in texts:
        m = _BANNED.search(t or "")
        if m:
            return f"wording: don't use '{m.group(0)}'"
    return None


def _curve_shape_problem(case: SpecCase) -> str | None:
    c = case.curve
    if c is None:
        return None
    if not re.search(r"\bx\b", c.expr):
        return "curve expr must use x (otherwise the picture is a flat line)"
    if c.mode == "area" and re.search(rf"\b{re.escape(c.knob.param)}\b", c.expr):
        return "area curve: the knob is the number of rectangles, not part of the expr"
    allowed = {"x", c.knob.param, *(v.name for v in case.variables)} | set(_FUNCS)
    no_numbers = re.sub(r"(?<![A-Za-z_\d])(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?", " ", c.expr)
    unknown = sorted(set(re.findall(r"[A-Za-z_][A-Za-z0-9_]*", no_numbers)) - allowed)
    if unknown:
        return (
            f"expr uses {', '.join(unknown)}: every name must be x, the knob "
            f"({c.knob.param}) or a declared variable"
        )
    if c.mode != "area" and not _knob_moves(case):
        return "the knob doesn't change the curve; pick a parameter the curve depends on"
    return None


def _knob_moves(case: SpecCase) -> bool:
    c = case.curve
    assert c is not None
    names = _vars(case)
    xs = [c.x_min + (c.x_max - c.x_min) * i / 7 for i in range(1, 7)]
    for x in xs:
        try:
            lo = eval_expr(c.expr, x=x, **names, **{c.knob.param: c.knob.min})
            hi = eval_expr(c.expr, x=x, **names, **{c.knob.param: c.knob.max})
        except _EXPR_ERRORS:
            continue
        if not math.isclose(lo, hi, rel_tol=1e-9, abs_tol=1e-12):
            return True
    return False


def _extreme_params(case: SpecCase) -> set[str]:
    names = {v.name for v in case.variables}
    if case.curve:
        names.add(case.curve.knob.param)
    if case.sampler:
        names.update(SAMPLER_PARAMS)
        names.add("k")
    return names


def _check_choice(case: SpecCase, truth: float | None) -> str | None:
    """The option marked correct must be the one whose number is nearest the computed truth."""
    if case.prediction.input != "choice" or truth is None:
        return None
    correct = next(o for o in case.prediction.options if o.misconception_id is None)
    if correct.value is None:
        return "correct option has no value to check against the truth"
    valued = [o for o in case.prediction.options if o.value is not None]
    nearest = min(valued, key=lambda o: abs(o.value - truth))
    if nearest.id != correct.id:
        return f"computed truth {truth:.4g} is nearest option {nearest.id}, not the marked one"
    if not math.isclose(correct.value, truth, rel_tol=CHOICE_TOLERANCE, abs_tol=0.5):
        return f"correct option {correct.value:g} is not the computed truth {truth:.4g}"
    return None


def compile_case(case: SpecCase, item_id: str, known: set[str]) -> Item:
    """One spec case → one Round item (truth computed; raises SpecRejected if it fails checks)."""
    reason = _wording_problem(case) or _curve_shape_problem(case)
    if reason:
        raise SpecRejected(reason)
    truth = compute_truth(case)
    reason = _check_choice(case, truth)
    if reason:
        raise SpecRejected(reason)
    values = _vars(case)
    if case.widget is SpecWidget.curve:
        c = case.curve
        assert c is not None
        body = {
            "widget": "curve",
            "expr": substitute(c.expr, values),
            "x_min": c.x_min,
            "x_max": c.x_max,
            "x_label": c.x_label,
            "y_label": c.y_label,
            "ask_x": c.ask_x if c.mode != "area" else None,
            "ask_y": c.ask_y if c.mode == "value" else None,
            "show": {"slope": "tangent", "area": "riemann", "limit": "limit"}.get(c.mode),
            "area_from": c.area_from if c.mode == "area" else None,
            "area_to": c.area_to if c.mode == "area" else None,
        }
        explore = c.knob.model_dump()
    else:
        s = case.sampler
        assert s is not None
        body = {
            "widget": "distribution",
            "sampler": s.sampler.value,
            "params": s.params.model_dump(exclude_none=True),
            "x_label": s.x_label,
        }
        explore = None
    allowed = _extreme_params(case)
    extremes = []
    for ex in case.extremes:
        if ex.param not in allowed:
            continue  # a setting the model can't change would move nothing
        try:
            at = compute_truth(case, {ex.param: ex.value})
        except SpecRejected:
            at = None
        extremes.append({**ex.model_dump(), "truth_value": at})
    p = case.prediction
    refs = [b.misconception_id for b in case.bands] + [o.misconception_id for o in p.options]
    item = {
        "id": item_id,
        "prompt": p.prompt,
        "input_type": p.input,
        "slider": p.slider.model_dump() if p.slider else None,
        "options": [
            {"id": o.id, "text": o.text, "misconception_id": o.misconception_id} for o in p.options
        ],
        "bands": [b.model_dump() for b in case.bands] if p.input == "slider" else [],
        "truth": body,
        "answer_expr": None if truth is None else repr(truth),
        "answer_claimed": case.answer_claimed,
        "explore": explore,
        "targets": sorted({r for r in refs if r} & known),
        "variables": [v.model_dump() for v in case.variables],
        "extremes": extremes,
        "truth_value": truth,
        "computed": True,
        "approximate": case.approximate,
    }
    try:
        compiled = Item.model_validate(item)
    except ValidationError as err:
        raise SpecRejected(f"item doesn't validate: {err.errors()[0]['msg'][:80]}") from err
    reason = check_item(compiled)
    if reason:
        raise SpecRejected(reason)
    return compiled


@dataclass
class Compiled:
    round: Round
    report: Report


def compile_spec(spec: ModelSpec) -> Compiled:
    """ModelSpec → checked Round. The main case must pass; a failing compare case is dropped."""
    known = {m.id for m in spec.misconceptions}
    report = Report()
    main = compile_case(spec.case, "model", known)
    items = [main]
    report.kept.append(main.id)
    compare = None
    if spec.compare:
        item_id = None
        if spec.compare.case:
            try:
                second = compile_case(spec.compare.case, "compare", known)
                items.append(second)
                report.kept.append(second.id)
                item_id = second.id
            except SpecRejected as err:
                report.dropped["compare"] = str(err)[:120]
        compare = {
            "topic": spec.compare.topic,
            "item_id": item_id,
            "prompt": spec.compare.prompt,
            "shared_principle": spec.compare.shared_principle,
        }
    r = Round.model_validate(
        {
            "slug": spec.slug,
            "topic": spec.topic,
            "concept": spec.concept,
            "reviewed": False,
            "misconceptions": [m.model_dump() for m in spec.misconceptions],
            "items": [i.model_dump() for i in items],
            "spec_version": 4,
            "compare": compare,
        }
    )
    return Compiled(r, report)


# ---------------------------------------------------------------------------
# Topic guard and nearest topics

_STOP = {
    "the", "and", "for", "how", "why", "what", "does", "work", "works", "with", "are", "is",
    "of", "a", "an", "in", "on", "to", "vs", "do", "you", "it", "its", "about", "from", "that",
    "this", "when", "can", "into", "your", "my",
}  # fmt: skip
_ACRONYMS = {"mrna", "html", "http", "https", "xml", "sql", "cpu", "gpu", "rng", "dns", "tcp"}
_VOWELS = set("aeiouy")


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-z0-9+#]+", (text or "").casefold())


def _gibberish(tok: str) -> bool:
    if not tok.isalpha() or tok in _ACRONYMS:
        return False
    if re.search(r"(.)\1\1", tok):
        return True  # "vvv", "zzzz"
    return len(tok) >= 4 and not (set(tok) & _VOWELS)


def topic_looks_unreal(topic: str) -> bool:
    """Cheap pre-check: half or more of the words look like keyboard mashing."""
    toks = [t for t in _tokens(topic) if t.isalpha()]
    bad = sum(_gibberish(t) for t in toks)
    return bad > 0 and bad * 2 >= len(toks)


def _stems(text: str) -> set[str]:
    return {t[:5] for t in _tokens(text) if len(t) >= 3 and t not in _STOP}


def definition_covers_topic(topic: str, definition: str, concept: str) -> bool:
    """The model's own definition should mention what was typed (catches made-up topics)."""
    want = _stems(topic)
    return not want or bool(want & _stems(f"{definition} {concept}"))


def nearest_topics(topic: str, n: int = 3) -> list[dict]:
    """Reviewed topics by keyword overlap (3 sessions + reviewed extras); sessions pad it."""
    from app.rounds import extra_aliases, extra_rounds, showcase_rounds

    want = _stems(topic)
    scored = []
    sessions = list(showcase_rounds().values())
    for kind, rounds in (("session", sessions), ("reviewed", list(extra_rounds().values()))):
        for r in rounds:
            words = " ".join([r.topic, r.slug.replace("-", " "), r.concept])
            words += " " + " ".join(extra_aliases().get(r.slug, []))
            score = len(want & _stems(words))
            if score:
                scored.append((score, kind, r))
    scored.sort(key=lambda t: (-t[0], t[1] != "session"))
    out = [{"slug": r.slug, "topic": r.topic, "kind": kind} for _, kind, r in scored[:n]]
    for r in sessions:
        if len(out) >= n:
            break
        if all(o["slug"] != r.slug for o in out):
            out.append({"slug": r.slug, "topic": r.topic, "kind": "session"})
    return out
