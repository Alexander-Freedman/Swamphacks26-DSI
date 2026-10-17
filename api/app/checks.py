"""Checks every generated round must pass before anyone sees it.

1. Structural: Round validation already ran (refs resolve, one correct option, ...).
2. Computed truth: answer_expr must evaluate, agree with answer_claimed, and land
   in the correct band; curve expressions must draw (finite, bounded, no poles)
   across the x range and the explore range, and when the question points at a
   spot on the curve (ask_x / ask_y) the answer must be that spot; samplers need
   their parameters.
3. Lint: bands cover the slider, no overlap gaps, the prompt doesn't give the answer.
There is no blind second-model check any more (engine v4 computes every truth
in code). Items without a computed truth are listed as `unchecked`. Items that
fail are dropped; a round with no items left is rejected.
"""

from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass, field

from app.schema import CurveTruth, DistributionTruth, InputType, Item, Round, Sampler
from app.truth import eval_expr

log = logging.getLogger("mm.checks")

REQUIRED_PARAMS = {
    Sampler.coin_longest_run: ("n",),
    Sampler.base_rate_test: ("base_rate", "sensitivity", "false_positive_rate"),
    Sampler.birthday_match: ("group_size",),
    Sampler.binomial_count: ("n", "p"),
    Sampler.dice_sum: ("dice",),
}


@dataclass
class Report:
    kept: list[str] = field(default_factory=list)
    dropped: dict[str, str] = field(default_factory=dict)
    # Kept in the report shape for the player; there is no blind check, so always false/0.
    blind_checked: bool = False
    blind_ok: int = 0
    blind_failed: int = 0
    unchecked: list[str] = field(default_factory=list)  # kept, but no truth and no blind answer

    def as_dict(self) -> dict:
        return {
            "kept": self.kept,
            "dropped": self.dropped,
            "blind_checked": self.blind_checked,
            "blind_ok": self.blind_ok,
            "blind_failed": self.blind_failed,
            "unchecked": self.unchecked,
        }

    def public(self, model: str, seconds: float) -> dict:
        """The shape POST /api/rounds returns as `checks` (and the cache keeps)."""
        return {
            "kept": len(self.kept),
            "dropped": [{"item_id": k, "reason": v} for k, v in self.dropped.items()],
            "blind_checked": self.blind_checked,
            "blind_ok": self.blind_ok,
            "blind_failed": self.blind_failed,
            "unchecked": self.unchecked,
            "model": model,
            "seconds": round(seconds, 1),
        }


class CheckFailed(Exception):
    pass


def true_value(item: Item) -> float | None:
    if item.answer_expr:
        return eval_expr(item.answer_expr)
    return None


def check_item(item: Item) -> str | None:
    """Return a reason to drop the item, or None if it passes."""
    truth = item.truth
    if isinstance(truth, DistributionTruth):
        params = truth.params.model_dump()
        missing = [p for p in REQUIRED_PARAMS[truth.sampler] if params.get(p) is None]
        if missing:
            return f"sampler {truth.sampler.value} missing {missing}"
    if isinstance(truth, CurveTruth) and truth.expr:
        reason = _curve_problem(item, truth)
        if reason:
            return reason
    try:
        value = true_value(item)
    except (ValueError, ZeroDivisionError, OverflowError, TypeError) as err:
        return f"answer_expr: {str(err)[:60]}"
    if value is not None and isinstance(truth, CurveTruth) and truth.expr and not truth.show:
        # (slope / area / limit answers are computed from the curve in app/spec.py)
        reason = _curve_disagrees(item, truth, value)
        if reason:
            return reason
    if value is not None and item.answer_claimed is not None:
        if not math.isclose(value, item.answer_claimed, rel_tol=0.02, abs_tol=1e-6):
            return f"claimed {item.answer_claimed} but computed {value:.4g}"
    if item.input_type is InputType.slider:
        assert item.slider is not None
        if not item.bands:
            return "slider without bands"
        bands = sorted(item.bands, key=lambda b: b.min)
        if bands[0].min > item.slider.min + 1e-9 or bands[-1].max < item.slider.max - 1e-9:
            return "bands don't cover the slider"
        for lo, hi in zip(bands, bands[1:], strict=False):
            if hi.min - lo.max > item.slider.step + 1e-9:
                return "bands leave a gap the slider can land in"
        correct = [b for b in bands if b.misconception_id is None]
        if len(correct) != 1:
            return "slider needs exactly one correct band"
        if not any(b.misconception_id for b in bands):
            return "no band names a misconception"
        lo_c, hi_c, st = correct[0].min, correct[0].max, item.slider.step
        first_stop = item.slider.min + math.ceil((lo_c - item.slider.min) / st - 1e-9) * st
        if first_stop > hi_c + 1e-9:
            return "no slider stop lands in the correct band"
        if value is not None and not (correct[0].min <= value <= correct[0].max):
            return f"computed truth {value:.4g} is outside the correct band"
        if value is not None and _gives_away(item.prompt, value):
            return "prompt gives away the answer"
    return None


_EXPR_ERRORS = (ValueError, ZeroDivisionError, OverflowError, TypeError)
CURVE_POINTS = 80
CURVE_MAX_ABS = 1e12


def _curve_names(item: Item) -> dict[str, float]:
    """The explore knob's value as asked (exprs may use it next to x)."""
    if item.explore and item.explore.default is not None:
        return {item.explore.param: item.explore.default}
    return {}


def _curve_at(item: Item, truth: CurveTruth, x: float, **override: float) -> float:
    assert truth.expr is not None
    return eval_expr(truth.expr, x=x, **{**_curve_names(item), **override})


def _curve_problem(item: Item, truth: CurveTruth) -> str | None:
    """The curve must draw: finite, bounded, no poles across its range.

    A flat line is allowed (acceleration not depending on mass is a lesson).

    Checked at the asked knob value and at both ends of the explore range.
    """
    ex = item.explore
    settings: list[dict[str, float]] = [{}]
    if ex is not None and re.search(rf"\b{re.escape(ex.param)}\b", truth.expr or ""):
        if ex.default is None or not (ex.min <= ex.default <= ex.max) or ex.max <= ex.min:
            return "explore knob needs min < max and a default inside the range"
        settings = [{}, {ex.param: ex.min}, {ex.param: ex.max}]
    for over in settings:
        xs = [
            truth.x_min + (truth.x_max - truth.x_min) * i / CURVE_POINTS
            for i in range(CURVE_POINTS + 1)
        ]
        if truth.show == "limit" and truth.ask_x is not None:
            # The point a limit asks about may be a hole in the curve: don't sample it.
            xs = [x for x in xs if abs(x - truth.ask_x) > 1e-9]
        try:
            ys = [_curve_at(item, truth, x, **over) for x in xs]
            if not all(math.isfinite(y) and abs(y) < CURVE_MAX_ABS for y in ys):
                return "curve not finite"
            for i in range(len(xs) - 1):
                if ys[i] * ys[i + 1] < 0 and _pole_between(item, truth, xs[i], xs[i + 1], over):
                    return "curve jumps across a pole"
        except _EXPR_ERRORS as err:
            return f"curve expr: {str(err)[:60]}"
    return None


def _pole_between(item: Item, truth: CurveTruth, lo: float, hi: float, over: dict) -> bool:
    """Bisect a sign change: near a real root the values shrink, near a pole they grow."""
    f_lo, f_hi = _curve_at(item, truth, lo, **over), _curve_at(item, truth, hi, **over)
    start = max(abs(f_lo), abs(f_hi))
    for _ in range(30):
        mid = (lo + hi) / 2
        f_mid = _curve_at(item, truth, mid, **over)
        if not math.isfinite(f_mid):
            return True
        if f_lo * f_mid <= 0:
            hi, f_hi = mid, f_mid
        else:
            lo, f_lo = mid, f_mid
    return max(abs(f_lo), abs(f_hi)) > start


def _curve_disagrees(item: Item, truth: CurveTruth, value: float) -> str | None:
    """When the question points at a spot on the curve, the answer must be that spot."""
    try:
        if truth.ask_x is not None:
            if not truth.x_min <= truth.ask_x <= truth.x_max:
                return "asked x is off the curve's range"
            y = _curve_at(item, truth, truth.ask_x)
            if not math.isclose(y, value, rel_tol=0.02, abs_tol=1e-6):
                return f"curve at x={truth.ask_x:g} is {y:.4g} but answer is {value:.4g}"
        if truth.ask_y is not None:
            if not truth.x_min <= value <= truth.x_max:
                return "answer x is off the curve's range"
            y = _curve_at(item, truth, value)
            if math.isclose(y, truth.ask_y, rel_tol=0.02, abs_tol=1e-6):
                return None
            # "How many days until it passes 50,000?" answers in whole steps:
            # accept an answer within one slider step of the exact crossing.
            step = item.slider.step if item.slider else 0.0
            cross = _crossing(item, truth, truth.ask_y)
            if cross is None or abs(value - cross) > max(step, 0.02 * abs(cross)):
                return f"curve at the answer x={value:.4g} is {y:.4g}, not {truth.ask_y:g}"
    except _EXPR_ERRORS as err:
        return f"curve expr: {str(err)[:60]}"
    return None


def _crossing(item: Item, truth: CurveTruth, target: float) -> float | None:
    """First x in range where the curve reaches target (scan, then bisect)."""
    n = 400
    xs = [truth.x_min + (truth.x_max - truth.x_min) * i / n for i in range(n + 1)]
    gs = [_curve_at(item, truth, x) - target for x in xs]
    for i in range(n):
        if gs[i] == 0:
            return xs[i]
        if gs[i] * gs[i + 1] < 0:
            lo, hi, g_lo = xs[i], xs[i + 1], gs[i]
            for _ in range(50):
                mid = (lo + hi) / 2
                g_mid = _curve_at(item, truth, mid) - target
                if g_lo * g_mid <= 0:
                    hi = mid
                else:
                    lo, g_lo = mid, g_mid
            return (lo + hi) / 2
    return xs[n] if gs[n] == 0 else None


def _gives_away(prompt: str, value: float) -> bool:
    if abs(value) < 10:
        return False  # small numbers show up in setups all the time
    shown = f"{value:.0f}"
    return re.search(rf"(?<![\d.]){re.escape(shown)}(?![\d.])", prompt) is not None


def check_round(r: Round) -> tuple[Round, Report]:
    """Drop failing items; raise CheckFailed if none survive.

    No blind second-model check: an item without a computed truth is kept but
    listed as `unchecked`, so the UI never calls it checked.
    """
    report = Report()
    kept: list[Item] = []
    for item in r.items:
        reason = check_item(item)
        if reason:
            report.dropped[item.id] = reason
            continue
        kept.append(item)
        report.kept.append(item.id)
        try:
            if true_value(item) is None:
                report.unchecked.append(item.id)
        except ValueError:
            report.unchecked.append(item.id)
    if not kept:
        raise CheckFailed(f"no item survived: {report.dropped}")
    return r.model_copy(update={"items": kept}), report
