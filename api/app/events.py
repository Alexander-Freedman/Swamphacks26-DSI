"""Answer events: what drives "the room" and the collection.

Two stores with the same behavior and response shapes:
- PgStore: Tiger (Postgres + TimescaleDB) when TIGER_DATABASE_URL is set.
  `answers` is a hypertable on `ts`; `room_hourly` is a continuous aggregate
  with real-time aggregation (fresh answers count right away) that room() reads.
- SqliteStore: local file, used when the URL is missing or Tiger is unreachable.
"""

from __future__ import annotations

import logging
import os
import sqlite3
import time
from collections.abc import Callable
from contextlib import closing
from pathlib import Path
from typing import Any, Protocol

log = logging.getLogger(__name__)

DB_PATH = Path(os.environ.get("MM_DB", Path(__file__).resolve().parents[2] / "data" / "local.db"))


class Store(Protocol):
    name: str

    def record_answer(
        self,
        *,
        session_id: str,
        round_slug: str,
        item_id: str,
        value_num: float | None,
        option_id: str | None,
        confidence: int | None,
        misconception_id: str | None,
    ) -> bool: ...

    def room(self, round_slug: str, item_id: str) -> dict: ...

    def collection(self, session_id: str) -> list[dict]: ...


def _room_dict(rows: list[tuple[str, int]]) -> dict:
    total = sum(n for _, n in rows)
    return {"n": total, "shares": {k: round(n / total, 3) for k, n in rows} if total else {}}


def _collection_entry(slug: str, mid: str, times: int, wins: int) -> dict:
    return {
        "round_slug": slug,
        "misconception_id": mid,
        "times_caught": times,
        "wins_since": wins,
        "busted": wins >= 2,
    }


# --- SQLite -------------------------------------------------------------------

SQLITE_SCHEMA = """
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


class SqliteStore:
    name = "sqlite"

    def _conn(self) -> sqlite3.Connection:
        # DB_PATH is read per call so tests can point it at a temp file.
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.executescript(SQLITE_SCHEMA)
        return conn

    def record_answer(
        self,
        *,
        session_id: str,
        round_slug: str,
        item_id: str,
        value_num: float | None,
        option_id: str | None,
        confidence: int | None,
        misconception_id: str | None,
    ) -> bool:
        with closing(self._conn()) as conn, conn:
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

    def room(self, round_slug: str, item_id: str) -> dict:
        with closing(self._conn()) as conn:
            rows = conn.execute(
                "SELECT COALESCE(misconception_id, 'correct'), COUNT(*) FROM answers "
                "WHERE round_slug = ? AND item_id = ? GROUP BY 1 ORDER BY 1",
                (round_slug, item_id),
            ).fetchall()
        return _room_dict(rows)

    def collection(self, session_id: str) -> list[dict]:
        with closing(self._conn()) as conn:
            caught = conn.execute(
                "SELECT round_slug, misconception_id, COUNT(*), MAX(ts) FROM answers "
                "WHERE session_id = ? AND misconception_id IS NOT NULL "
                "GROUP BY 1, 2 ORDER BY 1, 2",
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
                out.append(_collection_entry(slug, mid, times, wins))
        return out


# --- Tiger (Postgres + TimescaleDB) ---------------------------------------------

# Unique indexes on a hypertable must include the time column, so
# one-answer-per-(session, round, item) lives in a small regular table that the
# insert claims first, in the same transaction.
PG_SCHEMA = [
    "CREATE EXTENSION IF NOT EXISTS timescaledb",
    """CREATE TABLE IF NOT EXISTS answers (
        ts timestamptz NOT NULL DEFAULT now(),
        session_id text NOT NULL,
        round_slug text NOT NULL,
        item_id text NOT NULL,
        value_num double precision,
        option_id text,
        confidence integer,
        misconception_id text,
        correct boolean NOT NULL
    )""",
    "SELECT create_hypertable('answers', by_range('ts'), if_not_exists => true)",
    "CREATE INDEX IF NOT EXISTS answers_item ON answers (round_slug, item_id, ts DESC)",
    "CREATE INDEX IF NOT EXISTS answers_session ON answers (session_id, ts DESC)",
    """CREATE TABLE IF NOT EXISTS answers_once (
        session_id text NOT NULL,
        round_slug text NOT NULL,
        item_id text NOT NULL,
        PRIMARY KEY (session_id, round_slug, item_id)
    )""",
    """CREATE MATERIALIZED VIEW IF NOT EXISTS room_hourly
        WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
        SELECT time_bucket(INTERVAL '1 hour', ts) AS bucket,
               round_slug,
               item_id,
               COALESCE(misconception_id, 'correct') AS outcome,
               count(*) AS n
        FROM answers
        GROUP BY bucket, round_slug, item_id, outcome
        WITH NO DATA""",
    # Real-time aggregation: unmaterialized recent answers are unioned in at query time.
    "ALTER MATERIALIZED VIEW room_hourly SET (timescaledb.materialized_only = false)",
    """SELECT add_continuous_aggregate_policy('room_hourly',
        start_offset => INTERVAL '7 days',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '15 minutes',
        if_not_exists => true)""",
]


class StoreError(RuntimeError):
    """Generic store failure. Never carries driver text: it can include connection details."""


class PgStore:
    name = "tiger"

    def __init__(self, url: str) -> None:
        from psycopg_pool import ConnectionPool

        self.pool = ConnectionPool(
            url,
            min_size=1,
            max_size=4,
            kwargs={"connect_timeout": 10},
            open=False,
            name="answers",
        )
        try:
            self.pool.open(wait=True, timeout=15)
            self.setup()
        except Exception:
            self.pool.close()
            raise

    def setup(self) -> None:
        """Idempotent schema setup. Continuous aggregates can't be created in a transaction."""
        with self.pool.connection() as conn:
            conn.autocommit = True
            try:
                for stmt in PG_SCHEMA:
                    conn.execute(stmt)
            finally:
                conn.autocommit = False

    def close(self) -> None:
        self.pool.close()

    def _run(self, fn: Callable[[Any], Any]) -> Any:
        import psycopg

        try:
            with self.pool.connection() as conn:
                return fn(conn)
        except (psycopg.Error, OSError) as e:
            log.error("answer store query failed (%s)", type(e).__name__)
            raise StoreError("answer store unavailable") from None

    def record_answer(
        self,
        *,
        session_id: str,
        round_slug: str,
        item_id: str,
        value_num: float | None,
        option_id: str | None,
        confidence: int | None,
        misconception_id: str | None,
    ) -> bool:
        def go(conn: Any) -> bool:
            with conn.transaction():
                claimed = conn.execute(
                    "INSERT INTO answers_once VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                    (session_id, round_slug, item_id),
                ).rowcount
                if claimed != 1:
                    return False
                conn.execute(
                    "INSERT INTO answers (session_id, round_slug, item_id, value_num, "
                    "option_id, confidence, misconception_id, correct) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        session_id,
                        round_slug,
                        item_id,
                        value_num,
                        option_id,
                        confidence,
                        misconception_id,
                        misconception_id is None,
                    ),
                )
                return True

        return self._run(go)

    def room(self, round_slug: str, item_id: str) -> dict:
        rows = self._run(
            lambda conn: conn.execute(
                "SELECT outcome, SUM(n)::int FROM room_hourly "
                "WHERE round_slug = %s AND item_id = %s GROUP BY 1 ORDER BY 1",
                (round_slug, item_id),
            ).fetchall()
        )
        return _room_dict(rows)

    def collection(self, session_id: str) -> list[dict]:
        def go(conn: Any) -> list[dict]:
            caught = conn.execute(
                "SELECT round_slug, misconception_id, COUNT(*)::int, MAX(ts) FROM answers "
                "WHERE session_id = %s AND misconception_id IS NOT NULL "
                "GROUP BY 1, 2 ORDER BY 1, 2",
                (session_id,),
            ).fetchall()
            out = []
            for slug, mid, times, last_ts in caught:
                wins = conn.execute(
                    "SELECT COUNT(DISTINCT item_id)::int FROM answers WHERE session_id = %s "
                    "AND round_slug = %s AND correct AND ts > %s AND item_id NOT IN ("
                    "SELECT item_id FROM answers WHERE session_id = %s AND misconception_id = %s)",
                    (session_id, slug, last_ts, session_id, mid),
                ).fetchone()[0]
                out.append(_collection_entry(slug, mid, times, wins))
            return out

        return self._run(go)


# --- choosing the store ----------------------------------------------------------

_store: Store | None = None


def make_store() -> Store:
    """Tiger if TIGER_DATABASE_URL is set and reachable, SQLite otherwise."""
    url = os.environ.get("TIGER_DATABASE_URL", "").strip()
    if not url:
        log.warning("TIGER_DATABASE_URL not set; answer events use local SQLite")
        return SqliteStore()
    try:
        return PgStore(url)
    except Exception as e:  # any startup failure means fall back
        log.warning(
            "Tiger unreachable at startup (%s); answer events use local SQLite",
            type(e).__name__,
        )
        return SqliteStore()


def get_store() -> Store:
    global _store
    if _store is None:
        _store = make_store()
    return _store


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
    return get_store().record_answer(
        session_id=session_id,
        round_slug=round_slug,
        item_id=item_id,
        value_num=value_num,
        option_id=option_id,
        confidence=confidence,
        misconception_id=misconception_id,
    )


def room(round_slug: str, item_id: str) -> dict:
    """Share of answers per outcome (misconception id or 'correct') for one item."""
    return get_store().room(round_slug, item_id)


def collection(session_id: str) -> list[dict]:
    """Per misconception: times caught and later wins.

    Busted after correct answers on 2 *different* items, answered after the
    latest catch, other than the item it was caught on.
    """
    return get_store().collection(session_id)
