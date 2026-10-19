from fastapi.testclient import TestClient


def _client(tmp_path, monkeypatch):
    import app.events as events

    monkeypatch.setattr(events, "DB_PATH", tmp_path / "t.db")
    monkeypatch.setattr(events, "_store", events.SqliteStore())
    from app.main import app

    return TestClient(app)


def _post(client, **body):
    return client.post("/api/learn-events", json={"slug": "why-we-have-seasons", **body})


def test_guess_and_stress_land_in_the_room(tmp_path, monkeypatch) -> None:
    from app.learn.topics import get_topic

    client = _client(tmp_path, monkeypatch)
    choices = get_topic("why-we-have-seasons").extremeCases[2].predict.choices
    right = next(i for i, c in enumerate(choices) if c.correct)
    wrong = next(i for i, c in enumerate(choices) if not c.correct)

    g = _post(
        client, session_id="session-aaa111", step="guess", misconception_id="closer-means-summer"
    )
    assert g.status_code == 200
    assert g.json()["room"] == {"n": 1, "shares": {"closer-means-summer": 1.0}}

    # right or wrong is decided by the server from the topic's own predict card
    _post(client, session_id="session-aaa111", step="stress", case_index=2, choice=right)
    r = _post(client, session_id="session-bbb222", step="stress", case_index=2, choice=wrong).json()
    assert r["room"]["n"] == 2
    assert r["room"]["shares"]["correct"] == 0.5

    # one answer per session per step: a repeat doesn't count twice
    again = _post(
        client, session_id="session-bbb222", step="stress", case_index=2, choice=right
    ).json()
    assert again["room"]["n"] == 2


def test_learn_events_reject_bad_input(tmp_path, monkeypatch) -> None:
    client = _client(tmp_path, monkeypatch)
    sid = "session-ccc333"
    assert (
        _post(client, session_id=sid, step="guess", misconception_id="made-up").status_code == 422
    )
    assert _post(client, session_id=sid, step="stress", case_index=0).status_code == 422
    assert _post(client, session_id=sid, step="stress", case_index=0, choice=9).status_code == 422
    bad_slug = client.post(
        "/api/learn-events", json={"slug": "nope", "session_id": sid, "step": "guess"}
    )
    assert bad_slug.status_code == 404
