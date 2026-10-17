"""Checks every generated round must pass before anyone sees it.

1. Structural: Round validation already ran (refs resolve, one correct option, ...).
2. Computed truth: answer_expr must evaluate, agree with answer_claimed, and land
   in the correct band; curve expressions must be finite across the x range;
   samplers need their parameters.
3. Lint: bands cover the slider, no overlap gaps, the prompt doesn't give the answer.
4. Blind check (optional, live): a second model answers each item without the key;
   items it disagrees with are dropped.
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
    blind_checked: bool = False

    def as_dict(self) -> dict:
        return {"kept": self.kept, "dropped": self.dropped, "blind_checked": self.blind_checked}


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
        try:
            for i in range(21):
                x = truth.x_min + (truth.x_max - truth.x_min) * i / 20
                if not math.isfinite(eval_expr(truth.expr, x=x)):
                    return "curve not finite"
        except (ValueError, ZeroDivisionError, OverflowError, TypeError) as err:
            return f"curve expr: {str(err)[:60]}"
    try:
        value = true_value(item)
    except (ValueError, ZeroDivisionError, OverflowError, TypeError) as err:
        return f"answer_expr: {str(err)[:60]}"
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
        correct = [b for b in bands if b.misconception_id is None]
        if len(correct) != 1:
            return "slider needs exactly one correct band"
        if not any(b.misconception_id for b in bands):
            return "no band names a misconception"
        if value is not None and not (correct[0].min <= value <= correct[0].max):
            return f"computed truth {value:.4g} is outside the correct band"
        if value is not None and _gives_away(item.prompt, value):
            return "prompt gives away the answer"
    return None


def _gives_away(prompt: str, value: float) -> bool:
    if abs(value) < 10:
        return False  # small numbers show up in setups all the time
    shown = f"{value:.0f}"
    return re.search(rf"(?<![\d.]){re.escape(shown)}(?![\d.])", prompt) is not None


def _blind_answer(item: Item) -> str | float | None:
    """Ask a second model to answer without the key. Returns option id or number."""
    from google import genai
    from google.genai import types

    if item.input_type is InputType.choice:
        opts = "\n".join(f"{o.id}: {o.text}" for o in item.options)
        ask = f'{item.prompt}\nOptions:\n{opts}\nReply with JSON {{"answer": "<option id>"}}.'
    else:
        ask = f'{item.prompt}\nReply with JSON {{"answer": <number>}} only.'
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    resp = client.models.generate_content(
        model=BLIND_MODEL,
        contents=ask,
        config=types.GenerateContentConfig(
            response_mime_type="application/json", max_output_tokens=200
        ),
    )
    text = (resp.text or "").strip().removeprefix("```json").removesuffix("```")
    return json.loads(text).get("answer")


def blind_disagrees(item: Item) -> str | None:
    try:
        ans = _blind_answer(item)
    except Exception as err:  # the blind check is best effort
        log.warning("blind check skipped: %s", type(err).__name__)
        return None
    if item.input_type is InputType.choice:
        correct = next(o.id for o in item.options if o.misconception_id is None)
        return None if str(ans) == correct else f"blind check picked {ans}, key says {correct}"
    if item.input_type is InputType.slider and isinstance(ans, (int, float)):
        correct = next(b for b in item.bands if b.misconception_id is None)
        if correct.min <= ans <= correct.max:
            return None
        return f"blind check answered {ans}, outside the correct band"
    return None


def check_round(r: Round, blind: bool | None = None) -> tuple[Round, Report]:
    """Drop failing items; raise CheckFailed if none survive."""
    if blind is None:
        blind = bool(os.environ.get("GEMINI_API_KEY")) and os.environ.get("MM_OFFLINE") != "1"
    report = Report(blind_checked=blind)
    kept: list[Item] = []
    reasons = {item.id: check_item(item) for item in r.items}
    if blind:
        # Run blind checks in parallel and time-box them: a slow check is skipped, not fatal.
        todo = [i for i in r.items if reasons[i.id] is None]
        pool = ThreadPoolExecutor(max_workers=3)
        futures = {i.id: pool.submit(blind_disagrees, i) for i in todo}
        deadline = time.monotonic() + BLIND_TIMEOUT_S
        for iid, fut in futures.items():
            try:
                reasons[iid] = fut.result(timeout=max(0.0, deadline - time.monotonic()))
            except FutureTimeout:
                log.warning("blind check timed out for %s", iid)
        # Don't wait for stragglers; their answers are simply ignored.
        pool.shutdown(wait=False, cancel_futures=True)
    for item in r.items:
        reason = reasons[item.id]
        if reason:
            report.dropped[item.id] = reason
        else:
            kept.append(item)
            report.kept.append(item.id)
    if not kept:
        raise CheckFailed(f"no item survived: {report.dropped}")
    return r.model_copy(update={"items": kept}), report
