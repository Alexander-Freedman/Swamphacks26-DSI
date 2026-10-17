"""Tiger store integration test. Skipped unless TIGER_DATABASE_URL is set.

Uses a unique round slug per run and deletes its rows at the end.
"""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.skipif(
    not os.environ.get("TIGER_DATABASE_URL"), reason="TIGER_DATABASE_URL not set"
)


def _script(client, slug):
    """Same answer sequence for both stores; returns every response body."""
    out = []

    def post(sid, **payload):
        r = client.post("/api/answers", json={"session_id": sid, "round_slug": slug, **payload})
        assert r.status_code == 200
        out.append(r.json())

    post("session-one", item_id="longest-run-100", value_num=3, confidence=2)
    for _ in range(3):  # repeats are ignored
        post("session-one", item_id="which-is-real", option_id="b")
    post("session-two", item_id="longest-run-100", value_num=3)
    post("session-three", item_id="longest-run-100", value_num=7)
    out.append(client.get("/api/collection/session-one").json())
    out.append(client.get("/api/collection/session-nobody").json())
    return out


@pytest.fixture
def slug():
    return f"test-{uuid.uuid4().hex[:12]}"


def test_tiger_matches_sqlite(slug, tmp_path, monkeypatch) -> None:
    import app.events as events
    import app.main as main

    coin = main.showcase_rounds()["coin-streak"]
    monkeypatch.setattr(main, "showcase_rounds", lambda: {slug: coin})
    client = TestClient(main.app)

    monkeypatch.setattr(events, "DB_PATH", tmp_path / "t.db")
    monkeypatch.setattr(events, "_store", events.SqliteStore())
    want = _script(client, slug)

    pg = events.PgStore(os.environ["TIGER_DATABASE_URL"])
    assert pg.name == "tiger"
    monkeypatch.setattr(events, "_store", pg)
    try:
        got = _script(client, slug)
        assert got == want
        assert got[-3]["room"]["n"] == 3  # three sessions on longest-run-100
        assert got[-2][0]["wins_since"] == 1
        # The room comes from the continuous aggregate, not the raw table.
        with pg.pool.connection() as conn:
            n = conn.execute(
                "SELECT SUM(n)::int FROM room_hourly WHERE round_slug = %s", (slug,)
            ).fetchone()[0]
        assert n == 4  # repeats were ignored
    finally:
        with pg.pool.connection() as conn:
            conn.execute("DELETE FROM answers WHERE round_slug = %s", (slug,))
            conn.execute("DELETE FROM answers_once WHERE round_slug = %s", (slug,))
            conn.commit()
            conn.autocommit = True
            conn.execute(
                "CALL refresh_continuous_aggregate('room_hourly', now() - INTERVAL '2 hours', "
                "now() + INTERVAL '1 hour')"
            )
            conn.autocommit = False
        pg.close()
