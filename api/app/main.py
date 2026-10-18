import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, BeforeValidator, Field, ValidationError

from app import help as help_chat
from app.events import StoreError, collection, get_store, record_answer, room
from app.gen import (
    GenerationError,
    NoFit,
    Usage,
    generate_round,
    generated_round,
    normalize_topic,
    offline,
)
from app.learn.router import router as learn_router
from app.learn.topics import prebuilt_topics
from app.rounds import extra_for_topic, extra_rounds, showcase_rounds
from app.schema import Round
from app.spec import nearest_topics
from app.truth import band_for


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Pick the answer store (Tiger or SQLite fallback) and set up its schema once.
    store = get_store()
    prebuilt_topics()  # hand-checked Learn topics from data/learn, once
    yield
    if hasattr(store, "close"):
        store.close()


app = FastAPI(title="Onionskin API", lifespan=lifespan)
app.include_router(learn_router)


@app.exception_handler(StoreError)
async def store_error(_request: Request, _exc: StoreError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "answer store unavailable"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o
        for o in os.environ.get(
            "MM_CORS_ORIGINS",
            "https://alexander-freedman.github.io,https://onionskin.study,http://localhost:5173",
        ).split(",")
        if o
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Public endpoint: per-IP rate limit on top of the generator's daily cap.
PER_IP_PER_HOUR = int(os.environ.get("MM_PER_IP_PER_HOUR", "12"))
ANSWERS_PER_IP_PER_HOUR = int(os.environ.get("MM_ANSWERS_PER_IP_PER_HOUR", "600"))
_hits: dict[str, deque[float]] = defaultdict(deque)


def _rate_limited(ip: str, limit: int | None = None) -> bool:
    limit = PER_IP_PER_HOUR if limit is None else limit
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


class TopicIn(BaseModel):
    topic: str = Field(min_length=2, max_length=120)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/rounds")
def list_rounds() -> list[dict[str, str | bool]]:
    return [
        {"slug": r.slug, "topic": r.topic, "reviewed": r.reviewed}
        for r in showcase_rounds().values()
    ]


@app.get("/api/rounds/{slug}")
def get_round(slug: str) -> Round:
    r = showcase_rounds().get(slug) or extra_rounds().get(slug)
    if r is None:
        raise HTTPException(status_code=404, detail="no such round")
    return r


@app.post("/api/rounds")
def create_round(body: TopicIn, request: Request) -> dict:
    """Turn any topic into a runnable model (engine v4), or say honestly that none fits.

    Showcase and reviewed-extra topics are served as-is with no model call.
    """
    ip = request.client.host if request.client else "unknown"
    if _rate_limited(ip):
        raise HTTPException(status_code=429, detail="slow down: try a showcase topic")
    key = normalize_topic(body.topic)
    for r in showcase_rounds().values():
        if key in (normalize_topic(r.topic), normalize_topic(r.slug)):
            # Hand-reviewed showcase: no generation, so no check report.
            return _ok("showcase", 0.0, r, None, None)
    extra = extra_for_topic(body.topic)
    if extra is not None:
        # Hand-reviewed extra topic: served as-is, no model call.
        return _ok("reviewed", 0.0, extra, None, None)
    try:
        res = generate_round(body.topic)
    except NoFit as err:
        return _no_fit(body.topic, err.reason)
    except GenerationError:
        return _no_fit(body.topic, "I can't build a new model right now; try one of these.")
    return _ok(res.source, round(res.seconds, 1), res.round, res.spec, res.checks)


def _ok(source: str, seconds: float, r: Round, spec, checks: dict | None) -> dict:
    return {
        "status": "ok",
        "ok": True,
        "source": source,
        "seconds": seconds,
        "round": r,
        "spec": spec,
        "checks": None if r.reviewed else checks,
    }


def _no_fit(topic: str, reason: str) -> dict:
    nearest = nearest_topics(topic)
    return {
        "status": "fallback",
        "ok": False,
        "reason": reason,
        "nearest": nearest,
        "suggestions": [n["slug"] for n in nearest],
    }


@app.get("/api/usage")
def usage() -> dict:
    snap = Usage().snapshot()
    return {
        "offline": offline(),
        "day": snap["day"],
        "calls": snap["calls"],
        "help": snap.get("help", {}),
    }


class AnswerIn(BaseModel):
    session_id: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    round_slug: str = Field(max_length=60)
    item_id: str = Field(max_length=60)
    value_num: float | None = None
    option_id: str | None = Field(default=None, max_length=60)
    confidence: int | None = Field(default=None, ge=0, le=2)


@app.post("/api/answers")
def post_answer(body: AnswerIn, request: Request) -> dict:
    """Record a locked-in answer; return the misconception it maps to and the room."""
    ip = request.client.host if request.client else "unknown"
    if _rate_limited("answers:" + ip, ANSWERS_PER_IP_PER_HOUR):
        raise HTTPException(status_code=429, detail="slow down")
    r = (
        showcase_rounds().get(body.round_slug)
        or extra_rounds().get(body.round_slug)
        or generated_round(body.round_slug)
    )
    item = next((i for i in r.items if i.id == body.item_id), None) if r else None
    if item is None:
        raise HTTPException(status_code=404, detail="unknown round or item")
    if body.option_id is not None:
        opt = next((o for o in item.options if o.id == body.option_id), None)
        if opt is None:
            raise HTTPException(status_code=422, detail="unknown option")
        misconception_id = opt.misconception_id
    elif body.value_num is not None:
        band = band_for(item.bands, body.value_num)
        if band is None:
            raise HTTPException(status_code=422, detail="value outside the slider")
        misconception_id = band.misconception_id
    else:
        raise HTTPException(status_code=422, detail="need option_id or value_num")
    record_answer(
        session_id=body.session_id,
        round_slug=body.round_slug,
        item_id=body.item_id,
        value_num=body.value_num,
        option_id=body.option_id,
        confidence=body.confidence,
        misconception_id=misconception_id,
    )
    return {"misconception_id": misconception_id, "room": room(body.round_slug, body.item_id)}


@app.get("/api/collection/{session_id}")
def get_collection(session_id: str) -> list[dict]:
    return collection(session_id)


class HelpContextIn(BaseModel):
    # Only the learner's own guess is used; anything else (e.g. "truth") is ignored.
    guess: float | str | None = None


class HelpIn(BaseModel):
    session_slug: str | None = Field(default=None, max_length=60)
    round_slug: str | None = Field(default=None, max_length=60)
    screen_id: str = Field(min_length=2, max_length=4)
    question: str = Field(min_length=1, max_length=300)
    locked: bool = False
    context: HelpContextIn | None = None


def _cut(n: int):
    """Trim client text to n chars instead of rejecting the whole request."""
    return BeforeValidator(lambda v: v[:n] if isinstance(v, str) else v)


class HelpLayerIn(BaseModel):
    n: int = Field(ge=0, le=99)
    title: Annotated[str, _cut(120)] = ""


class HelpTurnIn(BaseModel):
    role: Literal["user", "tutor", "assistant"]  # the web panel sends "assistant"
    text: Annotated[str, _cut(400)]


class HelpGenericIn(BaseModel):
    subject: Annotated[str, _cut(60)] = ""
    topic: Annotated[str, _cut(120)] = Field(min_length=1)
    layer: HelpLayerIn
    on_screen: Annotated[str, _cut(600)] = ""
    facts: Annotated[
        list[Annotated[str, _cut(200)]],
        BeforeValidator(lambda v: v[:10] if isinstance(v, list) else v),
    ] = []
    last_action: Annotated[str, _cut(200)] | None = None
    history: Annotated[
        list[HelpTurnIn], BeforeValidator(lambda v: v[-4:] if isinstance(v, list) else v)
    ] = []
    question: str = Field(min_length=1, max_length=300)
    hint: Annotated[str, _cut(300)] | None = None


def _validate(model: type[BaseModel], raw: dict) -> BaseModel:
    try:
        return model.model_validate(raw)
    except ValidationError as err:
        raise RequestValidationError(err.errors()) from None


@app.post("/api/help")
def post_help(request: Request, raw: Annotated[dict, Body()]) -> dict:
    """Plain-words help for the screen or layer someone is on.

    Old shape (screen_id + session/round slug): the 3 probability sessions.
    New shape (topic + layer + on_screen + facts): any lesson layer.
    """
    ip = request.client.host if request.client else "unknown"
    if "screen_id" not in raw and ("layer" in raw or "topic" in raw):
        g = _validate(HelpGenericIn, raw)
        ctx = help_chat.LayerContext(
            subject=g.subject,
            topic=g.topic,
            layer_n=g.layer.n,
            layer_title=g.layer.title,
            on_screen=g.on_screen,
            facts=list(g.facts),
            last_action=g.last_action or "",
            history=[help_chat.HistoryTurn(t.role, t.text) for t in g.history],
            hint=(g.hint or "").strip(),
        )
        return help_chat.answer_generic(ctx, g.question.strip(), ip).as_dict()
    body = _validate(HelpIn, raw)
    screen = help_chat.resolve_screen(body.session_slug or body.round_slug, body.screen_id)
    if screen is None:
        raise HTTPException(status_code=404, detail="unknown session or screen")
    guess = body.context.guess if body.context else None
    if isinstance(guess, str):
        guess = guess.strip()[:40] or None
    elif isinstance(guess, float):
        guess = f"{guess:g}"
    reply = help_chat.answer(screen, body.question.strip(), body.locked, guess, ip)
    return {"answer": reply.answer, "hint_only": reply.hint_only}
