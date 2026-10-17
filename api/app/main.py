from fastapi import FastAPI, HTTPException

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
