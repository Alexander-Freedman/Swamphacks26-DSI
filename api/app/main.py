import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.events import StoreError, collection, get_store, record_answer, room
from app.gen import (
    GenerationError,
    Usage,
    generate_round,
    generated_round,
    normalize_topic,
    offline,
)
from app.rounds import showcase_rounds
from app.schema import Round
from app.truth import band_for


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Pick the answer store (Tiger or SQLite fallback) and set up its schema once.
    store = get_store()
    yield
    if hasattr(store, "close"):
        store.close()


app = FastAPI(title="mm API", lifespan=lifespan)


@app.exception_handler(StoreError)
async def store_error(_request: Request, _exc: StoreError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "answer store unavailable"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        o
        for o in os.environ.get(
            "MM_CORS_ORIGINS", "https://alexander-freedman.github.io,http://localhost:5173"
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


def _rate_limited(ip: str, limit: int = PER_IP_PER_HOUR) -> bool:
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
    r = showcase_rounds().get(slug)
    if r is None:
        raise HTTPException(status_code=404, detail="no such round")
    return r


@app.post("/api/rounds")
def create_round(body: TopicIn, request: Request) -> dict:
    """Build (or fetch from cache) a round for any topic. Falls back to showcase suggestions."""
    ip = request.client.host if request.client else "unknown"
    if _rate_limited(ip):
        raise HTTPException(status_code=429, detail="slow down: try a showcase topic")
    key = normalize_topic(body.topic)
    for r in showcase_rounds().values():
        if key in (normalize_topic(r.topic), normalize_topic(r.slug)):
            # Hand-reviewed showcase: no generation, so no check report.
            return {
                "status": "ok",
                "source": "showcase",
                "seconds": 0.0,
                "round": r,
                "checks": None,
            }
    try:
        res = generate_round(body.topic)
    except GenerationError:
        return {
            "status": "fallback",
            "suggestions": [r.slug for r in showcase_rounds().values()],
        }
    return {
        "status": "ok",
        "source": res.source,
        "seconds": round(res.seconds, 1),
        "round": res.round,
        "checks": None if res.round.reviewed else res.checks,
    }


@app.get("/api/usage")
def usage() -> dict:
    snap = Usage().snapshot()
    return {"offline": offline(), "day": snap["day"], "calls": snap["calls"]}


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
    r = showcase_rounds().get(body.round_slug) or generated_round(body.round_slug)
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
