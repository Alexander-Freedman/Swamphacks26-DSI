import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.rounds import ROUNDS_DIR, showcase_rounds
from app.schema import Round
from app.truth import (
    birthday_match_probability,
    coin_longest_run_expected,
    eval_expr,
    p_longest_run_below,
    positive_test_chance,
)

client = TestClient(app)


def test_all_showcases_validate_and_are_reviewed() -> None:
    rounds = showcase_rounds()
    assert set(rounds) == {"coin-streak", "positive-test", "birthday"}
    assert all(r.reviewed for r in rounds.values())


def test_api_serves_rounds() -> None:
    assert {r["slug"] for r in client.get("/api/rounds").json()} == set(showcase_rounds())
    assert client.get("/api/rounds/coin-streak").json()["slug"] == "coin-streak"
    assert client.get("/api/rounds/nope").status_code == 404


def test_coin_streak_numbers() -> None:
    assert coin_longest_run_expected(100) == pytest.approx(6.977, abs=0.001)
    assert 1 - p_longest_run_below(100, 5) == pytest.approx(0.972, abs=0.001)
    item = showcase_rounds()["coin-streak"].items[0]
    assert item.answer_claimed == pytest.approx(coin_longest_run_expected(100), abs=0.01)


def test_coin_choice_sequences() -> None:
    prompt = showcase_rounds()["coin-streak"].items[1].prompt
    a = prompt.split("A: ")[1].split()[0]
    b = prompt.split("B: ")[1].split()[0]

    def longest(s: str) -> int:
        best = cur = 1
        for x, y in zip(s, s[1:], strict=False):
            cur = cur + 1 if x == y else 1
            best = max(best, cur)
        return best

    assert len(a) == len(b) == 20
    assert longest(a) <= 2 and longest(b) == 4


def test_positive_test_numbers() -> None:
    item = showcase_rounds()["positive-test"].items[0]
    expected = positive_test_chance(0.01, 0.9, 0.09) * 100
    assert eval_expr(item.answer_expr) == pytest.approx(expected)
    assert expected == pytest.approx(9.17, abs=0.01)
    assert item.answer_claimed == pytest.approx(expected, abs=0.1)


def test_birthday_numbers() -> None:
    assert birthday_match_probability(23) == pytest.approx(0.507, abs=0.001)
    assert birthday_match_probability(22) < 0.5 < birthday_match_probability(23)
    assert birthday_match_probability(57) > 0.99


def test_correct_band_contains_truth() -> None:
    truths = {
        "coin-streak": coin_longest_run_expected(100),
        "positive-test": positive_test_chance(0.01, 0.9, 0.09) * 100,
        "birthday": 23,
    }
    for slug, truth in truths.items():
        bands = showcase_rounds()[slug].items[0].bands
        correct = [b for b in bands if b.misconception_id is None]
        assert len(correct) == 1 and correct[0].min <= truth <= correct[0].max


def test_eval_expr_rejects_code() -> None:
    with pytest.raises(ValueError):
        eval_expr("__import__('os')")


def test_bad_reference_is_rejected() -> None:
    raw = json.loads((ROUNDS_DIR / "birthday.json").read_text())
    raw["items"][0]["bands"][1]["misconception_id"] = "not-a-real-id"
    with pytest.raises(ValueError):
        Round.model_validate(raw)


def test_generation_falls_back_when_offline(monkeypatch) -> None:
    monkeypatch.setenv("MM_OFFLINE", "1")
    res = client.post("/api/rounds", json={"topic": "a topic nobody cached xyz"})
    assert res.status_code == 200
    assert res.json()["status"] == "fallback"
    assert "coin-streak" in res.json()["suggestions"]


def test_to_round_drops_dangling_refs_and_clips() -> None:
    from app.gen import to_round

    r = to_round(
        {
            "slug": "Dice Sums!",
            "topic": "dice",
            "concept": "sums near 7 are common",
            "misconceptions": [
                {"id": "All Equal", "label": "x" * 200, "why_tempting": "w", "refutation": "r"}
            ],
            "questions": [
                {
                    "id": "q1",
                    "prompt": "most likely sum of two dice?",
                    "input_type": "slider",
                    "slider_min": 2,
                    "slider_max": 12,
                    "bands": [
                        {"min": 2, "max": 6, "misconception_id": "all-equal"},
                        {"min": 7, "max": 7, "misconception_id": None},
                        {"min": 8, "max": 12, "misconception_id": "ghost"},
                    ],
                    "widget": "distribution",
                    "sampler": "dice_sum",
                    "dice": 2,
                }
            ],
        }
    )
    assert r.slug == "dice-sums"
    assert len(r.misconceptions[0].label) <= 80
    assert [b.misconception_id for b in r.items[0].bands] == ["all-equal", None]


def test_showcases_pass_checks() -> None:
    from app.checks import check_round

    for r in showcase_rounds().values():
        checked, report = check_round(r, blind=False)
        assert report.dropped == {}, (r.slug, report.dropped)


def test_checks_drop_bad_items() -> None:
    from app.checks import CheckFailed, check_round
    from app.gen import to_round

    base = {
        "slug": "t",
        "topic": "t",
        "concept": "c",
        "misconceptions": [{"id": "m", "label": "l", "why_tempting": "w", "refutation": "r"}],
    }
    good = {
        "id": "good",
        "prompt": "chance of heads?",
        "input_type": "slider",
        "slider_min": 0,
        "slider_max": 100,
        "bands": [
            {"min": 0, "max": 40, "misconception_id": "m"},
            {"min": 41, "max": 60, "misconception_id": None},
            {"min": 61, "max": 100, "misconception_id": "m"},
        ],
        "widget": "curve",
        "expr": "x",
        "x_min": 0,
        "x_max": 1,
        "answer_expr": "0.5*100",
        "answer_claimed": 50,
    }
    lying = {**good, "id": "lying", "answer_claimed": 90}
    outside = {**good, "id": "outside", "answer_expr": "90", "answer_claimed": 90}
    r = to_round({**base, "questions": [good, lying, outside]})
    checked, report = check_round(r, blind=False)
    assert [i.id for i in checked.items] == ["good"]
    assert set(report.dropped) == {"lying", "outside"}
    with pytest.raises(CheckFailed):
        check_round(to_round({**base, "questions": [lying]}), blind=False)


@pytest.mark.parametrize("bad", ["2x", "x²", "5!", "-" * 3000 + "1", "2**3", "1_000"])
def test_eval_expr_rejects_outside_subset(bad) -> None:
    with pytest.raises(ValueError):
        eval_expr(bad, x=1)


def test_normalize_topic_keeps_symbols_and_unicode() -> None:
    from app.gen import normalize_topic

    assert normalize_topic("C++") != normalize_topic("C")
    assert normalize_topic("  Café  ") == "café"
    assert normalize_topic("量子力学") == "量子力学"


def test_band_gap_is_caught() -> None:
    from app.checks import check_item
    from app.gen import to_round

    r = to_round(
        {
            "slug": "g",
            "topic": "g",
            "concept": "c",
            "misconceptions": [{"id": "m", "label": "l", "why_tempting": "w", "refutation": "r"}],
            "questions": [
                {
                    "id": "q",
                    "prompt": "p",
                    "input_type": "slider",
                    "slider_min": 0,
                    "slider_max": 100,
                    "bands": [
                        {"min": 0, "max": 10, "misconception_id": "m"},
                        {"min": 20, "max": 100, "misconception_id": None},
                    ],
                    "widget": "estimate",
                    "answer_expr": "50",
                }
            ],
        }
    )
    assert check_item(r.items[0]) == "bands leave a gap the slider can land in"


def _fake_generation(topic: str) -> dict:
    base_item = {
        "input_type": "slider",
        "slider_min": 0,
        "slider_max": 100,
        "bands": [
            {"min": 0, "max": 40, "misconception_id": "m"},
            {"min": 41, "max": 60, "misconception_id": None},
            {"min": 61, "max": 100, "misconception_id": "m"},
        ],
        "widget": "estimate",
    }
    return {
        "slug": "fake-topic",
        "topic": topic,
        "concept": "c",
        "misconceptions": [{"id": "m", "label": "l", "why_tempting": "w", "refutation": "r"}],
        "questions": [
            {**base_item, "id": "computed", "prompt": "half of 100?", "answer_expr": "100/2"},
            {
                **base_item,
                "id": "lying",
                "prompt": "also half?",
                "answer_expr": "100/2",
                "answer_claimed": 90,
            },
            {
                **base_item,
                "id": "blind",
                "prompt": "no formula for this one",
                "widget": "curve",
                "expr": "x",
                "x_min": 0,
                "x_max": 1,
            },
        ],
    }


@pytest.fixture
def live_gen(monkeypatch, tmp_path):
    """Generation with a fake key and the model calls stubbed out (no network)."""
    from app import checks, gen, main

    monkeypatch.setenv("GEMINI_API_KEY", "test-not-a-key")
    monkeypatch.delenv("MM_OFFLINE", raising=False)
    monkeypatch.setattr(gen, "CACHE_DIR", tmp_path)
    calls = []

    def fake_call(model, topic):
        calls.append(model)
        return json.dumps(_fake_generation(topic))

    monkeypatch.setattr(gen, "_call_model", fake_call)
    monkeypatch.setattr(checks, "_blind_answer", lambda item: 50)
    main._hits.clear()
    yield calls
    main._hits.clear()


def test_generated_round_returns_checks_and_cache_keeps_them(live_gen) -> None:
    first = client.post("/api/rounds", json={"topic": "Some fresh topic"}).json()
    assert first["status"] == "ok" and first["source"] == "gemini-3.5-flash-lite"
    checks = first["checks"]
    assert checks["kept"] == 2
    assert checks["dropped"] == [{"item_id": "lying", "reason": "claimed 90.0 but computed 50"}]
    assert checks["blind_checked"] is True
    assert checks["model"] == "gemini-3.5-flash-lite"
    assert isinstance(checks["seconds"], float)
    assert [i["id"] for i in first["round"]["items"]] == ["computed", "blind"]

    again = client.post("/api/rounds", json={"topic": "  some FRESH topic "}).json()
    assert again["source"] == "cache"
    assert again["checks"] == checks
    assert again["round"] == first["round"]
    assert live_gen == ["gemini-3.5-flash-lite"]  # one model call in total


def test_blind_disagreement_is_reported(live_gen, monkeypatch) -> None:
    from app import checks

    monkeypatch.setattr(checks, "_blind_answer", lambda item: 90)
    res = client.post("/api/rounds", json={"topic": "another topic"}).json()
    dropped = {d["item_id"]: d["reason"] for d in res["checks"]["dropped"]}
    assert set(dropped) == {"lying", "blind"}
    assert "blind check" in dropped["blind"]
    assert res["checks"]["kept"] == 1


def test_cached_round_without_report_returns_null_checks(live_gen) -> None:
    from app import gen

    client.post("/api/rounds", json={"topic": "old cached topic"})
    gen._checks_path(gen._cache_path("old cached topic")).unlink()
    res = client.post("/api/rounds", json={"topic": "old cached topic"}).json()
    assert res["source"] == "cache" and res["checks"] is None


def test_showcase_topic_returns_null_checks(live_gen) -> None:
    for topic in ("Streaks in coin flips", "coin-streak"):
        res = client.post("/api/rounds", json={"topic": topic}).json()
        assert res["status"] == "ok" and res["source"] == "showcase"
        assert res["round"]["slug"] == "coin-streak" and res["round"]["reviewed"] is True
        assert res["checks"] is None
    assert live_gen == []  # no model call for a showcase
