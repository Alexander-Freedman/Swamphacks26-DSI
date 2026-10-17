"""Answer events: what drives "the room" and the collection.

Local SQLite tonight. The table maps 1:1 to a Postgres/Timescale hypertable on
`ts` (Tiger Data) once TIGER_DATABASE_URL arrives; queries stay plain SQL.
"""

from __future__ import annotations

import os
import sqlite3
import time
from contextlib import closing
from pathlib import Path

DB_PATH = Path(os.environ.get("MM_DB", Path(__file__).resolve().parents[2] / "data" / "local.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS answers (
    ts REAL NOT NULL,
    session_id TEXT NOT NULL,
    round_slug TEXT NOT NULL,
    item_id TEXT NOT NULL,
    value_num REAL,
    option_id TEXT,
    confidence INTEGER,
    misconception_id TEXT,
    correct INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS answers_once ON answers (session_id, round_slug, item_id);
CREATE INDEX IF NOT EXISTS answers_item ON answers (round_slug, item_id);
CREATE INDEX IF NOT EXISTS answers_session ON answers (session_id, ts);
"""


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    return conn


def record_answer(
    *,
    session_id: str,
    round_slug: str,
    item_id: str,
    value_num: float | None,
    option_id: str | None,
    confidence: int | None,
    misconception_id: str | None,
) -> bool:
    """Store a locked-in answer. One answer per session per item; returns False if repeated."""
    with closing(_conn()) as conn, conn:
        cur = conn.execute(
            "INSERT OR IGNORE INTO answers VALUES (?,?,?,?,?,?,?,?,?)",
            (
                time.time(),
                session_id,
                round_slug,
                item_id,
                value_num,
                option_id,
                confidence,
                misconception_id,
                int(misconception_id is None),
            ),
        )
        return cur.rowcount == 1


def room(round_slug: str, item_id: str) -> dict:
    """Share of answers per outcome (misconception id or 'correct') for one item."""
    with closing(_conn()) as conn:
        rows = conn.execute(
            "SELECT COALESCE(misconception_id, 'correct'), COUNT(*) FROM answers "
            "WHERE round_slug = ? AND item_id = ? GROUP BY 1",
            (round_slug, item_id),
        ).fetchall()
    total = sum(n for _, n in rows)
    return {"n": total, "shares": {k: round(n / total, 3) for k, n in rows} if total else {}}


def collection(session_id: str) -> list[dict]:
    """Per misconception: times caught and later wins.

    Busted after correct answers on 2 *different* items, answered after the
    latest catch, other than the item it was caught on.
    """
    with closing(_conn()) as conn:
        caught = conn.execute(
            "SELECT round_slug, misconception_id, COUNT(*), MAX(ts) FROM answers "
            "WHERE session_id = ? AND misconception_id IS NOT NULL GROUP BY 1, 2",
            (session_id,),
        ).fetchall()
        out = []
        for slug, mid, times, last_ts in caught:
            wins = conn.execute(
                "SELECT COUNT(DISTINCT item_id) FROM answers WHERE session_id = ? "
                "AND round_slug = ? AND correct = 1 AND ts > ? AND item_id NOT IN ("
                "SELECT item_id FROM answers WHERE session_id = ? AND misconception_id = ?)",
                (session_id, slug, last_ts, session_id, mid),
            ).fetchone()[0]
            out.append(
                {
                    "round_slug": slug,
                    "misconception_id": mid,
                    "times_caught": times,
                    "wins_since": wins,
                    "busted": wins >= 2,
                }
            )
    return out
