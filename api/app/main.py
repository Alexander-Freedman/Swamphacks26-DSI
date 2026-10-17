from fastapi import FastAPI

app = FastAPI(title="Swamphacks26-DSI API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
