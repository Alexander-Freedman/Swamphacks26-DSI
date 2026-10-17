from fastapi.testclient import TestClient


def test_answers_room_and_collection(tmp_path, monkeypatch) -> None:
    import app.events as events

    monkeypatch.setattr(events, "DB_PATH", tmp_path / "t.db")
    from app.main import app

    client = TestClient(app)
    sid = "session-abc123"
    first = client.post(
        "/api/answers",
        json={
            "session_id": sid,
            "round_slug": "coin-streak",
            "item_id": "longest-run-100",
            "value_num": 3,
            "confidence": 2,
        },
    ).json()
    assert first["misconception_id"] == "random-means-evenly-mixed"
    assert first["room"]["n"] == 1
    for _ in range(2):
        client.post(
            "/api/answers",
            json={
                "session_id": sid,
                "round_slug": "coin-streak",
                "item_id": "which-is-real",
                "option_id": "b",
            },
        )
    col = client.get(f"/api/collection/{sid}").json()
    assert col[0]["misconception_id"] == "random-means-evenly-mixed"
    assert col[0]["busted"] is True
    bad = client.post("/api/answers", json={"session_id": "x", "round_slug": "a", "item_id": "b"})
    assert bad.status_code == 422
