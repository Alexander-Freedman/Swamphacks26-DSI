from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.events import collection, record_answer, room
from app.rounds import showcase_rounds
from app.schema import Round

app = FastAPI(title="mm API")


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


class AnswerIn(BaseModel):
    session_id: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    round_slug: str = Field(max_length=60)
    item_id: str = Field(max_length=60)
    value_num: float | None = None
    option_id: str | None = Field(default=None, max_length=60)
    confidence: int | None = Field(default=None, ge=0, le=2)


@app.post("/api/answers")
def post_answer(body: AnswerIn) -> dict:
    """Record a locked-in answer; return the misconception it maps to and the room."""
    r = showcase_rounds().get(body.round_slug)
    item = next((i for i in r.items if i.id == body.item_id), None) if r else None
    misconception_id = None
    if item is not None:
        if body.option_id is not None:
            opt = next((o for o in item.options if o.id == body.option_id), None)
            misconception_id = opt.misconception_id if opt else None
        elif body.value_num is not None:
            band = next((b for b in item.bands if b.min <= body.value_num <= b.max), None)
            misconception_id = band.misconception_id if band else None
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
