"""The /api/learn endpoints from docs/learn-api.md.

Every model-graded step: look up the topic, build the prompt, run codex with the
response's output schema, validate the reply, scrub a leaked rule, return the contract
shape. 503 codex_unavailable when the CLI is missing or signed out; 502 when a call
fails or times out. POST /api/learn/topics (live authoring) is rate-limited per IP the
same way /api/rounds is.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import math
import os
import re
import time
from collections import defaultdict, deque
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, ValidationError

from app.learn import codex, prompts, topics
from app.learn.schemas import (
    AnchorOut,
    Authored,
    DrawOut,
    GuessOut,
    NeighborOut,
    RevealOut,
    StatusOut,
    StressOut,
    Topic,
    TopicSummary,
    TransferOut,
    Visual,
    VisualReply,
    WhyOut,
    schema_file,
    topic_from_authored,
    validate_clipped,
)
from app.schema import SpecWidget
from app.spec import SpecRejected, compile_case, compute_truth

log = logging.getLogger("mm.learn")

router = APIRouter(prefix="/api/learn", tags=["learn"])

# Live authoring is the expensive call (30-90 s of codex): a small per-IP hourly cap.
AUTHOR_PER_IP_PER_HOUR = int(os.environ.get("MM_LEARN_PER_IP_PER_HOUR", "6"))
_hits: dict[str, deque[float]] = defaultdict(deque)


def _rate_limited(ip: str, limit: int | None = None) -> bool:
    limit = AUTHOR_PER_IP_PER_HOUR if limit is None else limit
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > 3600:
        q.popleft()
    if not q:
        _hits.pop(ip, None)
        q = _hits[ip]
    if len(q) >= limit:
        return True
    q.append(now)
    return False


def _ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


# Graded calls (guess, anchor, stress, why, reveal, draw, neighbor, transfer) also spend Codex:
# a per-IP hourly cap (one full session is ~10 calls) and a site-wide daily cap.
GRADED_PER_IP_PER_HOUR = int(os.environ.get("MM_LEARN_GRADED_PER_IP_PER_HOUR", "60"))
GRADED_DAILY_CAP = int(os.environ.get("MM_LEARN_DAILY_CAP", "800"))
_graded_hits: dict[str, deque[float]] = defaultdict(deque)
_graded_day: dict[str, int] = {}


def _graded_limited(ip: str) -> str | None:
    now = time.monotonic()
    q = _graded_hits[ip]
    while q and now - q[0] > 3600:
        q.popleft()
    if len(q) >= GRADED_PER_IP_PER_HOUR:
        return "slow down: too many answers this hour"
    day = time.strftime("%Y-%m-%d", time.gmtime())
    if _graded_day.get(day, 0) >= GRADED_DAILY_CAP:
        return "daily limit reached: prebuilt answers still work offline"
    q.append(now)
    if day not in _graded_day:
        _graded_day.clear()  # new day: drop yesterday's count
    _graded_day[day] = _graded_day.get(day, 0) + 1
    return None


def graded_limit(request: Request) -> None:
    reason = _graded_limited(_ip(request))
    if reason:
        raise HTTPException(status_code=429, detail=reason)


def _require_topic(slug: str) -> Topic:
    t = topics.get_topic(slug)
    if t is None:
        raise HTTPException(status_code=404, detail="no such topic")
    return t


def _require_codex() -> None:
    if codex.status() != "ok":
        raise HTTPException(status_code=503, detail="codex_unavailable")


async def _judge(task: str, prompt: str, model: type[BaseModel], **kw) -> BaseModel:
    """One codex call validated into the response model."""
    _require_codex()
    try:
        raw = await codex.run_json(prompt, task=task, schema=schema_file(model), **kw)
    except codex.CodexTimeout:
        raise HTTPException(status_code=504, detail="codex_timeout") from None
    except codex.CodexError as err:
        log.warning("%s: %s", task, err)
        raise HTTPException(status_code=502, detail="codex_call_failed") from None
    try:
        return model.model_validate(raw)
    except ValidationError as err:
        log.warning("%s: bad reply shape: %s", task, str(err)[:300])
        raise HTTPException(status_code=502, detail="codex_bad_reply") from None


# ---------------------------------------------------------------------------
# topics
# ---------------------------------------------------------------------------
class TopicIn(BaseModel):
    topic: str = Field(min_length=2, max_length=120)


_authoring: dict[str, asyncio.Task[Topic]] = {}


async def _author(name: str, slug: str) -> Topic:
    raw = await codex.run_json(
        prompts.author(name),
        task="author",
        schema=schema_file(Authored),
        timeout_s=float(os.environ.get("MM_CODEX_AUTHOR_TIMEOUT_S", codex.AUTHOR_TIMEOUT_S)),
    )
    authored = validate_clipped(Authored, raw)
    topic = topic_from_authored(slug, name, authored, checked=False)
    visual = await _author_visual(topic)
    if visual is not None:
        topic = Topic.model_validate(
            {**topic.model_dump(mode="json"), "visual": visual.model_dump(mode="json")}
        )
    topics.save_cached(topic)
    return topic


# ---------------------------------------------------------------------------
# the optional curve for a live topic: a bad graph never ships, a missing one is fine
# ---------------------------------------------------------------------------
VISUAL_TIMEOUT_S = 60
ANSWER_TOLERANCE = 0.02  # answer_claimed vs the computed truth
WATCH_TOLERANCE = 0.05  # a number in a watch line vs the computed value there
_WATCH_NUMBER = re.compile(r"(?<![\w.])-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|(?<![\w.])\.\d+")


def _watch_numbers(text: str) -> list[float]:
    return [float(m.replace(",", "")) for m in _WATCH_NUMBER.findall(text or "")]


def _vet_visual(topic: Topic, reply: VisualReply) -> Visual | None:
    """The reply's visual if every check passes, None if it says no curve fits.

    Raises SpecRejected (or ValueError) with the reason on any failed check.
    """
    if not reply.fits or reply.visual is None:
        return None
    visual = reply.visual
    case = visual.spec
    c = case.curve
    if visual.widget != "curve" or case.widget is not SpecWidget.curve or c is None:
        raise SpecRejected("not a curve")
    if c.mode != "value" or c.ask_x is None:
        raise SpecRejected("the curve must ask for y at ask_x")
    if case.prediction.input != "slider":
        raise SpecRejected("the prediction must be a slider")
    known = {m.id for m in topic.misconceptions}
    unknown = {b.misconception_id for b in case.bands if b.misconception_id} - known
    if unknown:
        raise SpecRejected(f"bands name unknown misconceptions {sorted(unknown)}")
    if case.answer_claimed is None:
        raise SpecRejected("no answer_claimed")
    item_id = f"{topic.slug[:52].rstrip('-')}-anchor"  # item ids are slugs, max 60 chars
    compile_case(case, item_id, known)  # bands cover the slider, knob moves, expr names, ...
    truth = compute_truth(case)
    if not math.isclose(case.answer_claimed, truth, rel_tol=ANSWER_TOLERANCE, abs_tol=1e-6):
        raise SpecRejected(f"answer_claimed {case.answer_claimed:g} but computed {truth:.4g}")
    if not 2 <= len(case.extremes) <= 3:
        raise SpecRejected("needs 2 or 3 extremes")
    settable = {c.knob.param, *(v.name for v in case.variables)}
    for ex in case.extremes:
        if ex.param not in settable:
            raise SpecRejected(f"extreme sets {ex.param}, which is not in the formula")
        if ex.param == c.knob.param and not c.knob.min <= ex.value <= c.knob.max:
            raise SpecRejected(f"extreme {ex.param}={ex.value:g} is off the knob's range")
        at = compute_truth(case, {ex.param: ex.value})
        numbers = _watch_numbers(ex.watch)
        if numbers and not any(
            math.isclose(n, at, rel_tol=WATCH_TOLERANCE, abs_tol=0.005) for n in numbers
        ):
            raise SpecRejected(f"watch line for {ex.param}={ex.value:g} misstates {at:.4g}")
    return Visual(widget="curve", spec=case)


async def _author_visual(topic: Topic) -> Visual | None:
    """Ask codex for one curve and keep it only if it passes every check. Never raises."""
    try:
        raw = await codex.run_json(
            prompts.visual(topic),
            task="visual",
            schema=schema_file(VisualReply),
            timeout_s=float(os.environ.get("MM_CODEX_VISUAL_TIMEOUT_S", VISUAL_TIMEOUT_S)),
        )
        visual = _vet_visual(topic, VisualReply.model_validate(raw))
    except Exception as err:  # any failure: keep the text-only topic
        log.warning("visual %s: dropped: %s", topic.slug, str(err)[:300])
        return None
    if visual is None:
        log.info("visual %s: no single curve fits", topic.slug)
    return visual


@router.get("/status")
def status() -> StatusOut:
    return StatusOut(
        codex=codex.status(), inFlight=codex.in_flight(), topics=len(topics.list_topics())
    )


@router.get("/topics")
def list_topics() -> list[TopicSummary]:
    return topics.list_topics()


@router.get("/topics/{slug}")
def get_topic(slug: str) -> Topic:
    return _require_topic(slug)


@router.post("/topics")
async def create_topic(body: TopicIn, request: Request) -> Topic:
    """A stored topic as-is, else author it live (cached on disk, checked = false)."""
    name = body.topic.strip()
    existing = topics.find_topic(name)
    if existing is not None:
        return existing
    if _rate_limited(_ip(request)):
        raise HTTPException(status_code=429, detail="slow down: try a prebuilt topic")
    _require_codex()
    slug = topics.slug_for(name)
    task = _authoring.get(slug)
    if task is None or task.done():
        task = asyncio.ensure_future(_author(name, slug))
        _authoring[slug] = task
    try:
        return await asyncio.shield(task)
    except codex.CodexTimeout:
        raise HTTPException(status_code=504, detail="codex_timeout") from None
    except codex.CodexError as err:
        log.warning("author %r: %s", name, err)
        raise HTTPException(status_code=502, detail="codex_call_failed") from None
    except (ValidationError, ValueError) as err:
        log.warning("author %r: bad topic: %s", name, str(err)[:300])
        raise HTTPException(status_code=502, detail="author_failed") from None
    finally:
        if task.done():
            _authoring.pop(slug, None)


# ---------------------------------------------------------------------------
# the six screens
# ---------------------------------------------------------------------------
class GuessIn(BaseModel):
    text: str = Field(min_length=1, max_length=600)


class AnswerIn(BaseModel):
    answer: str = Field(min_length=1, max_length=1200)


class HistoryItem(BaseModel):
    caseIndex: int = Field(ge=0, le=2)
    fix: str = Field(max_length=600)
    verdict: Literal["survives", "breaks"]


class StressIn(BaseModel):
    fix: str = Field(min_length=1, max_length=600)
    caseIndex: int = Field(ge=0, le=2)
    history: list[HistoryItem] = Field(default_factory=list, max_length=12)


class RevealIn(BaseModel):
    history: list[HistoryItem] = Field(default_factory=list, max_length=12)


class DrawIn(BaseModel):
    rule: str = Field(max_length=400)
    notes: str = Field(default="", max_length=2000)
    image: str | None = Field(default=None, max_length=8_000_000)


class NeighborIn(BaseModel):
    key: str = Field(min_length=1, max_length=60)
    answer: str = Field(min_length=1, max_length=1200)
    priorAnswer: str | None = Field(default=None, max_length=1200)


class TransferIn(BaseModel):
    analogy: str = Field(min_length=1, max_length=1200)
    wasPushed: bool = False


@router.post("/{slug}/guess", dependencies=[Depends(graded_limit)])
async def guess(slug: str, body: GuessIn) -> GuessOut:
    t = _require_topic(slug)
    out = await _judge("guess", prompts.guess(t, body.text.strip()), GuessOut)
    ids = {m.id for m in t.misconceptions}
    if out.misconceptionId is not None and out.misconceptionId not in ids:
        out.misconceptionId = None
    out.message = topics.scrub(out.message, t.rubric.coreRule, "guess")
    return out


@router.post("/{slug}/anchor", dependencies=[Depends(graded_limit)])
async def anchor(slug: str, body: AnswerIn) -> AnchorOut:
    t = _require_topic(slug)
    out = await _judge("anchor", prompts.anchor(t, body.answer.strip()), AnchorOut)
    out.feedback = topics.scrub(out.feedback, t.rubric.coreRule, "anchor")
    out.followUpQuestion = topics.scrub(out.followUpQuestion, t.rubric.coreRule, "anchor")
    return out


@router.post("/{slug}/stress", dependencies=[Depends(graded_limit)])
async def stress(slug: str, body: StressIn) -> StressOut:
    t = _require_topic(slug)
    history = [h.model_dump() for h in body.history]
    prompt = prompts.stress(t, body.fix.strip(), body.caseIndex, history)
    out = await _judge("stress", prompt, StressOut)
    out.critique = topics.scrub(out.critique, t.rubric.coreRule, "stress")
    return out


@router.post("/{slug}/why", dependencies=[Depends(graded_limit)])
async def why(slug: str, body: AnswerIn) -> WhyOut:
    t = _require_topic(slug)
    out = await _judge("why", prompts.why(t, body.answer.strip()), WhyOut)
    out.feedback = topics.scrub(out.feedback, t.rubric.coreRule, "why")
    out.followUpQuestion = topics.scrub(out.followUpQuestion, t.rubric.coreRule, "why")
    return out


@router.post("/{slug}/reveal", dependencies=[Depends(graded_limit)])
async def reveal(slug: str, body: RevealIn) -> RevealOut:
    t = _require_topic(slug)
    history = [h.model_dump() for h in body.history]
    return await _judge("reveal", prompts.reveal(t, history), RevealOut)


_DATA_URL = re.compile(r"^data:image/png;base64,([A-Za-z0-9+/=\s]+)$")


def _png_bytes(data_url: str | None) -> bytes | None:
    """The PNG in a canvas data URL, or None (anything else is graded from text only)."""
    if not data_url:
        return None
    m = _DATA_URL.match(data_url.strip())
    if not m:
        return None
    try:
        raw = base64.b64decode(m.group(1), validate=False)
    except ValueError:
        return None
    return raw if raw.startswith(b"\x89PNG") else None


@router.post("/{slug}/draw", dependencies=[Depends(graded_limit)])
async def draw(slug: str, body: DrawIn) -> DrawOut:
    t = _require_topic(slug)
    image = _png_bytes(body.image)
    prompt = prompts.draw(t, body.rule.strip(), body.notes.strip(), image is not None)
    out = await _judge("draw", prompt, DrawOut, image=image)
    wanted = [cid for cid, _ in prompts.criteria(t)]
    by_id = {c.id: c for c in out.criteria}
    out.criteria = [by_id[cid] for cid in wanted if cid in by_id]  # contract order, no dupes
    return out


@router.post("/{slug}/neighbor", dependencies=[Depends(graded_limit)])
async def neighbor(slug: str, body: NeighborIn) -> NeighborOut:
    t = _require_topic(slug)
    if t.neighbor(body.key) is None:
        raise HTTPException(status_code=404, detail="no such neighbor")
    prior = body.priorAnswer.strip() if body.priorAnswer else None
    prompt = prompts.neighbor(t, body.key, body.answer.strip(), prior)
    return await _judge("neighbor", prompt, NeighborOut)


@router.post("/{slug}/transfer", dependencies=[Depends(graded_limit)])
async def transfer(slug: str, body: TransferIn) -> TransferOut:
    t = _require_topic(slug)
    prompt = prompts.transfer(t, body.analogy.strip(), body.wasPushed)
    return await _judge("transfer", prompt, TransferOut)
