"""Checks every generated round must pass before anyone sees it.

1. Structural: Round validation already ran (refs resolve, one correct option, ...).
2. Computed truth: answer_expr must evaluate, agree with answer_claimed, and land
   in the correct band; curve expressions must draw (finite, bounded, no poles)
   across the x range and the explore range, and when the question points at a
   spot on the curve (ask_x / ask_y) the answer must be that spot; samplers need
   their parameters.
3. Lint: bands cover the slider, no overlap gaps, the prompt doesn't give the answer.
4. Blind check (optional, live): a second model answers each item code can't
   compute, without the key; items it disagrees with are dropped. Items with no
   blind answer (error, timeout, unparseable reply, cap) are kept but listed as
   `unchecked`, and `blind_checked` is true only if some answer was compared.
Items that fail are dropped; a round with no items left is rejected.
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout
from dataclasses import dataclass, field

from app.schema import CurveTruth, DistributionTruth, InputType, Item, Round, Sampler
from app.truth import eval_expr

log = logging.getLogger("mm.checks")

BLIND_MODEL = "gemma-4-31b-it"
BLIND_TIMEOUT_S = 8
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
    blind_checked: bool = False  # true only if a blind answer came back and was compared
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
    if value is not None and isinstance(truth, CurveTruth) and truth.expr:
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
        try:
            ys = [_curve_at(item, truth, x, **over) for x in xs]
            if not all(math.isfinite(y) and abs(y) < CURVE_MAX_ABS for y in ys):
                return "curve not finite"
            for i in range(CURVE_POINTS):
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


def _blind_prompt(item: Item) -> str:
    if item.input_type is InputType.choice:
        opts = "\n".join(f"{o.id}: {o.text}" for o in item.options)
        return (
            f"{item.prompt}\nOptions:\n{opts}\n"
            'Reply with only {"answer": "<option id>"} or just the option id. No explanation.'
        )
    return (
        f"{item.prompt}\n"
        'Reply with only {"answer": <number>} or just the number. No explanation, no units.'
    )


def _blind_text(prompt: str, timeout_s: float) -> str:
    """One call to the blind model. Plain text out (JSON mode 500s on this model)."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    resp = client.models.generate_content(
        model=BLIND_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=200,
            http_options=types.HttpOptions(timeout=max(1, int(timeout_s * 1000))),
        ),
    )
    return resp.text or ""


_FENCE = re.compile(r"^```[a-zA-Z]*\s*|\s*```$")
_NUMBER = re.compile(r"-?\d[\d,]*(?:\.\d+)?(?:[eE][-+]?\d+)?|-?\.\d+")


def parse_blind(item: Item, text: str) -> str | float | None:
    """Option id (choice) or number (slider) from a reply; None if there isn't one."""
    text = _FENCE.sub("", (text or "").strip()).strip()
    ans: object = text
    try:
        data = json.loads(text)
        ans = data.get("answer") if isinstance(data, dict) else data
    except ValueError:
        m = re.search(r'"answer"\s*:\s*("?)([^",}\s]+)\1', text)
        if m:
            ans = m.group(2)
    if item.input_type is InputType.choice:
        ids = {o.id for o in item.options}
        ans = str(ans).strip().strip("\"'.")
        if ans in ids:
            return ans
        found = [t for t in re.findall(r"[A-Za-z0-9_-]+", str(text)) if t in ids]
        return found[0] if len(set(found)) == 1 else None
    if isinstance(ans, bool):
        return None
    if isinstance(ans, (int, float)):
        return float(ans)
    m = _NUMBER.search(str(ans))
    if not m:
        return None
    try:
        value = float(m.group(0).replace(",", ""))
    except ValueError:
        return None
    return value if math.isfinite(value) else None


def _status(err: Exception) -> int | None:
    code = getattr(err, "code", None) or getattr(err, "status_code", None)
    if isinstance(code, int):
        return code
    m = re.search(r"\b(429|5\d\d)\b", str(err))
    return int(m.group(1)) if m else None


def _daily_quota(err: Exception) -> bool:
    text = str(err).lower()
    return "429" in text and ("per day" in text or "perday" in text or "daily" in text)


class BlindUnavailable(Exception):
    pass


def _blind_answer(item: Item, deadline: float, usage=None, cap: int | None = None):
    """Ask the blind model; counted in usage; at most one retry on 429/5xx."""
    prompt = _blind_prompt(item)
    for attempt in range(2):
        left = deadline - time.monotonic()
        if left <= 0.2:
            raise BlindUnavailable("out of time")
        if usage is not None:
            if not usage.available(BLIND_MODEL):
                raise BlindUnavailable("blind model quota exhausted")
            if cap is not None and usage.total() >= cap:
                raise BlindUnavailable("daily cap reached")
            usage.record(BLIND_MODEL)
        try:
            text = _blind_text(prompt, left)
        except Exception as err:
            if _daily_quota(err):
                if usage is not None:
                    usage.exhaust(BLIND_MODEL)
                raise
            code = _status(err)
            if attempt == 0 and code is not None and (code == 429 or code >= 500):
                time.sleep(0.5)
                continue
            raise
        ans = parse_blind(item, text)
        if ans is None:
            raise BlindUnavailable("unparseable reply")
        return ans
    raise BlindUnavailable("retry failed")


_UNCHECKED = object()


def blind_disagrees(item: Item, deadline: float, usage=None, cap: int | None = None):
    """Reason to drop, None if it agrees, or _UNCHECKED if no answer came back."""
    try:
        ans = _blind_answer(item, deadline, usage, cap)
    except Exception as err:  # the blind check is best effort
        log.warning("blind check failed for %s: %s", item.id, type(err).__name__)
        return _UNCHECKED
    if item.input_type is InputType.choice:
        correct = next(o.id for o in item.options if o.misconception_id is None)
        return None if str(ans) == correct else f"blind check picked {ans}, key says {correct}"
    correct_band = next(b for b in item.bands if b.misconception_id is None)
    if correct_band.min <= ans <= correct_band.max:
        return None
    return f"blind check answered {ans:g}, outside the correct band"


def _needs_blind(item: Item) -> bool:
    """Items whose answer code can't compute and a blind answer can be compared to."""
    if item.input_type not in (InputType.slider, InputType.choice):
        return False
    try:
        return true_value(item) is None
    except ValueError:
        return False


def check_round(r: Round, blind: bool | None = None, usage=None) -> tuple[Round, Report]:
    """Drop failing items; raise CheckFailed if none survive.

    `usage` (gen.Usage) counts blind calls and enforces the daily cap.
    """
    if blind is None:
        blind = bool(os.environ.get("GEMINI_API_KEY")) and os.environ.get("MM_OFFLINE") != "1"
    report = Report()
    kept: list[Item] = []
    reasons = {item.id: check_item(item) for item in r.items}
    todo = [i for i in r.items if reasons[i.id] is None and _needs_blind(i)]
    todo_ids = {i.id for i in todo}
    answered: set[str] = set()
    if blind and todo:
        # Only items without a computed truth need a second opinion: when code
        # computes the answer, code wins (counterintuitive items would otherwise
        # be dropped because the checker falls for the same misconception).
        # Run in parallel, time-boxed; an item without a blind answer stays but
        # is reported as unchecked.
        from app import gen

        usage = usage if usage is not None else gen.Usage()
        deadline = time.monotonic() + BLIND_TIMEOUT_S
        pool = ThreadPoolExecutor(max_workers=3)
        futures = {
            i.id: pool.submit(blind_disagrees, i, deadline, usage, gen.DAILY_SOFT_CAP) for i in todo
        }
        for iid, fut in futures.items():
            try:
                result = fut.result(timeout=max(0.0, deadline - time.monotonic()))
            except FutureTimeout:
                log.warning("blind check timed out for %s", iid)
                result = _UNCHECKED
            if result is _UNCHECKED:
                report.blind_failed += 1
                continue
            report.blind_ok += 1
            answered.add(iid)
            reasons[iid] = result
        # Don't wait for stragglers; their answers are simply ignored.
        pool.shutdown(wait=False, cancel_futures=True)
    report.blind_checked = report.blind_ok > 0
    for item in r.items:
        reason = reasons[item.id]
        if reason:
            report.dropped[item.id] = reason
        else:
            kept.append(item)
            report.kept.append(item.id)
            if item.id in todo_ids and item.id not in answered:
                report.unchecked.append(item.id)
    if not kept:
        raise CheckFailed(f"no item survived: {report.dropped}")
    return r.model_copy(update={"items": kept}), report
