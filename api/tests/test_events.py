from fastapi.testclient import TestClient


def _post(client, sid, **payload):
    return client.post(
        "/api/answers", json={"session_id": sid, "round_slug": "coin-streak", **payload}
    )


def test_answers_room_and_collection(tmp_path, monkeypatch) -> None:
    import app.events as events

    monkeypatch.setattr(events, "DB_PATH", tmp_path / "t.db")
    from app.main import app

    client = TestClient(app)
    sid = "session-abc123"
    first = _post(client, sid, item_id="longest-run-100", value_num=3, confidence=2).json()
    assert first["misconception_id"] == "random-means-evenly-mixed"
    assert first["room"]["n"] == 1

    # Spamming the same item can't bust a misconception: repeats are ignored.
    for _ in range(3):
        _post(client, sid, item_id="which-is-real", option_id="b")
    col = client.get(f"/api/collection/{sid}").json()
    assert col[0]["misconception_id"] == "random-means-evenly-mixed"
    assert col[0]["wins_since"] == 1
    assert col[0]["busted"] is False


def test_answers_reject_unmatched(tmp_path, monkeypatch) -> None:
    import app.events as events

    monkeypatch.setattr(events, "DB_PATH", tmp_path / "t.db")
    from app.main import app

    client = TestClient(app)
    sid = "session-abc123"
    assert _post(client, sid, item_id="nonexistent", option_id="b").status_code == 404
    assert _post(client, sid, item_id="longest-run-100", value_num=1e9).status_code == 422
    assert _post(client, sid, item_id="longest-run-100").status_code == 422
    assert _post(client, sid, item_id="which-is-real", option_id="zzz").status_code == 422
    bad = client.post("/api/answers", json={"session_id": "x", "round_slug": "a", "item_id": "b"})
    assert bad.status_code == 422
