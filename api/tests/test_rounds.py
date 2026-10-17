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


def test_bands_cover_slider_and_stay_tight() -> None:
    # Sorted, no gaps wider than a step, and the slider ends never land in the correct band
    # (a guess of 2 people or 0% must not read as "Called it").
    for slug, rnd in showcase_rounds().items():
        for item in rnd.items:
            if not item.bands or item.slider is None:
                continue
            bands, s = item.bands, item.slider
            assert [b.min for b in bands] == sorted(b.min for b in bands), slug
            assert bands[0].min <= s.min and bands[-1].max >= s.max, slug
            for a, b in zip(bands, bands[1:], strict=False):
                assert b.min - a.max <= s.step, (slug, a, b)
            correct = next(b for b in bands if b.misconception_id is None)
            assert correct.min > s.min and correct.max < s.max, slug


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
    from v3_compact import to_round

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
        checked, report = check_round(r)
        assert report.dropped == {}, (r.slug, report.dropped)


def test_checks_drop_bad_items() -> None:
    from v3_compact import to_round

    from app.checks import CheckFailed, check_round

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
    checked, report = check_round(r)
    assert [i.id for i in checked.items] == ["good"]
    assert set(report.dropped) == {"lying", "outside"}
    with pytest.raises(CheckFailed):
        check_round(to_round({**base, "questions": [lying]}))


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
    from v3_compact import to_round

    from app.checks import check_item

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


def _curve_round(**q):
    from v3_compact import to_round

    question = {
        "id": "q",
        "prompt": "worth after 30 years?",
        "input_type": "slider",
        "slider_min": 1000,
        "slider_max": 15000,
        "slider_step": 100,
        "bands": [
            {"min": 1000, "max": 5999, "misconception_id": "m"},
            {"min": 6000, "max": 9000, "misconception_id": None},
            {"min": 9001, "max": 15000, "misconception_id": "m"},
        ],
        "widget": "curve",
        "expr": "1000*(1+r/100)^x",
        "x_min": 0,
        "x_max": 40,
        "ask_x": 30,
        "explore_param": "r",
        "explore_label": "rate (%)",
        "explore_min": 1,
        "explore_max": 12,
        "explore_step": 0.5,
        "explore_default": 7,
        "answer_expr": "1000*1.07^30",
        **q,
    }
    return to_round(
        {
            "slug": "c",
            "topic": "c",
            "concept": "c",
            "misconceptions": [{"id": "m", "label": "l", "why_tempting": "w", "refutation": "r"}],
            "questions": [question],
        }
    )


def test_curve_with_knob_passes_and_maps() -> None:
    from app.checks import check_item

    item = _curve_round().items[0]
    assert item.explore is not None and item.explore.default == 7
    assert item.truth.ask_x == 30
    assert check_item(item) is None


@pytest.mark.parametrize(
    ("change", "reason"),
    [
        ({"ask_x": 20}, "curve at x=20"),
        ({"ask_x": 50}, "asked x is off"),
        ({"expr": "tan(x)", "ask_x": None, "explore_param": None}, "pole"),
        ({"expr": "10^x", "ask_x": None, "explore_param": None}, "not finite"),
        ({"explore_default": None}, "explore knob"),
        ({"explore_default": 30}, "explore knob"),
        ({"explore_param": None}, "curve expr"),  # expr uses r but no knob defines it
    ],
)
def test_bad_curves_are_dropped(change, reason) -> None:
    from app.checks import check_item

    got = check_item(_curve_round(**change).items[0])
    assert got is not None and reason in got


def test_ask_y_checks_the_x_that_reaches_it() -> None:
    from app.checks import check_item

    half_life = {
        "expr": "400*0.5^(x/h)",
        "x_min": 0,
        "x_max": 36,
        "ask_x": None,
        "ask_y": 50,
        "explore_param": "h",
        "explore_min": 1,
        "explore_max": 24,
        "explore_default": 6,
        "slider_min": 0,
        "slider_max": 60,
        "slider_step": 1,
        "bands": [
            {"min": 0, "max": 15, "misconception_id": "m"},
            {"min": 16, "max": 20, "misconception_id": None},
            {"min": 21, "max": 60, "misconception_id": "m"},
        ],
    }
    assert check_item(_curve_round(**half_life, answer_expr="6*3").items[0]) is None
    got = check_item(_curve_round(**half_life, answer_expr="6*3.2").items[0])
    assert got is not None and "not 50" in got


def test_bad_knob_name_is_ignored() -> None:
    item = _curve_round(explore_param="x", expr="1000*1.07^x").items[0]
    assert item.explore is None


def test_flat_curve_is_allowed() -> None:
    from app.checks import check_item

    item = _curve_round(expr="7612", ask_x=None, explore_param=None).items[0]
    assert check_item(item) is None


def test_ask_y_accepts_the_whole_step_after_the_crossing() -> None:
    from app.checks import check_item

    # Doubling daily from 1 case: 50,000 is crossed at x = 15.6, so "day 16" is right.
    pandemic = {
        "expr": "2^x",
        "x_min": 0,
        "x_max": 25,
        "ask_x": None,
        "ask_y": 50000,
        "explore_param": None,
        "slider_min": 0,
        "slider_max": 30,
        "slider_step": 1,
        "bands": [
            {"min": 0, "max": 14, "misconception_id": "m"},
            {"min": 15, "max": 17, "misconception_id": None},
            {"min": 18, "max": 30, "misconception_id": "m"},
        ],
    }
    assert check_item(_curve_round(**pandemic, answer_expr="16").items[0]) is None
    got = check_item(_curve_round(**pandemic, answer_expr="15").items[0])
    assert got is None  # 15.6 is within one step either way
    got = check_item(_curve_round(**pandemic, answer_expr="12").items[0])
    assert got is not None and "not 50000" in got


def test_one_invalid_question_no_longer_sinks_the_round() -> None:
    from pydantic import ValidationError
    from v3_compact import to_round

    choice = {
        "prompt": "p",
        "input_type": "choice",
        "options": [{"id": "a", "text": "a", "misconception_id": "m"}, {"id": "b", "text": "b"}],
        "widget": "estimate",
    }
    data = {
        "slug": "c",
        "topic": "c",
        "concept": "c",
        "misconceptions": [{"id": "m", "label": "l", "why_tempting": "w", "refutation": "r"}],
        "questions": [{**choice, "id": "bad"}, {**choice, "id": "good", "answer_expr": "1"}],
    }
    dropped: dict[str, str] = {}
    r = to_round(data, dropped)
    assert [i.id for i in r.items] == ["good"]
    assert "answer_expr" in dropped["bad"]
    with pytest.raises(ValidationError):
        to_round(data)


def test_correct_band_between_slider_stops_is_dropped() -> None:
    from app.checks import check_item

    narrow = {
        "expr": "g",
        "ask_x": 50,
        "x_min": 1,
        "x_max": 100,
        "explore_param": "g",
        "explore_min": 5,
        "explore_max": 15,
        "explore_default": 9.81,
        "slider_min": 1,
        "slider_max": 30,
        "slider_step": 0.5,
        "bands": [
            {"min": 1, "max": 9.7, "misconception_id": "m"},
            {"min": 9.8, "max": 9.82, "misconception_id": None},
            {"min": 9.83, "max": 30, "misconception_id": "m"},
        ],
        "answer_expr": "9.81",
    }
    assert check_item(_curve_round(**narrow).items[0]) == "no slider stop lands in the correct band"


def test_unused_knob_is_dropped() -> None:
    item = _curve_round(expr="1000*1.07^x").items[0]
    assert item.explore is None
