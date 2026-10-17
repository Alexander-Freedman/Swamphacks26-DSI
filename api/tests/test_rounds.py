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
