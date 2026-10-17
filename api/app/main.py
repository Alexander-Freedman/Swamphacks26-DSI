import os
import time
from collections import defaultdict, deque

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.gen import GenerationError, Usage, generate_round, offline
from app.rounds import showcase_rounds
from app.schema import Round

app = FastAPI(title="mm API")
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
_hits: dict[str, deque[float]] = defaultdict(deque)


def _rate_limited(ip: str) -> bool:
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > 3600:
        q.popleft()
    if not q:
        _hits.pop(ip, None)
        q = _hits[ip]
    if len(q) >= PER_IP_PER_HOUR:
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
    }


@app.get("/api/usage")
def usage() -> dict:
    snap = Usage().snapshot()
    return {"offline": offline(), "day": snap["day"], "calls": snap["calls"]}
