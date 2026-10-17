"""Engine v4: model spec → Round, with the model stubbed out (no network)."""

import copy
import json

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schema import ModelSpec, Round
from app.spec import (
    SpecRejected,
    compile_spec,
    compute_truth,
    nearest_topics,
    topic_looks_unreal,
)
from app.truth import birthday_match_probability, sampler_stat

client = TestClient(app)

GIBBERISH = "qwzx florp blarg vvv"

MISC = [
    {
        "id": "linear-growth",
        "label": "Growth adds the same amount each year",
        "why_tempting": "Simple interest is easier to picture.",
        "refutation": "Each year's interest also earns interest, so growth speeds up.",
        "source_url": None,
    },
    {
        "id": "too-high",
        "label": "Compounding is magic",
        "why_tempting": "Stories about huge returns.",
        "refutation": "At 7% the money doubles about every 10 years, no faster.",
        "source_url": None,
    },
]


def curve_case(**over) -> dict:
    case = {
        "widget": "curve",
        "variables": [{"name": "P", "meaning": "money put in", "unit": "$", "value": 1000}],
        "expr": "P*(1+r/100)^x",
        "x_min": 0,
        "x_max": 40,
        "x_label": "years",
        "y_label": "value ($)",
        "ask_x": 30,
        "knob_param": "r",
        "knob_label": "interest rate (%)",
        "knob_min": 1,
        "knob_max": 12,
        "knob_step": 0.5,
        "knob_default": 7,
        "prompt": "You put $1,000 in at 7% a year and leave it 30 years. What is it worth?",
        "input": "slider",
        "slider_min": 1000,
        "slider_max": 15000,
        "slider_step": 100,
        "slider_unit": "$",
        "bands": [
            {"min": 1000, "max": 6400, "misconception_id": "linear-growth"},
            {"min": 6500, "max": 8700, "misconception_id": None},
            {"min": 8800, "max": 15000, "misconception_id": "too-high"},
        ],
        "extremes": [
            {"param": "r", "value": 2, "watch": "Low rates look like a straight line."},
            {"param": "r", "value": 12, "watch": "Doubles about every 6 years."},
            {"param": "nope", "value": 1, "watch": "not a knob"},
        ],
        "answer_claimed": 7612,
    }
    case.update(over)
    return case


def gen_data(topic: str = "Compound interest", **over) -> dict:
    data = {
        "recognized": True,
        "no_fit_reason": None,
        "slug": "compound-interest-v4",
        "topic": topic,
        "definition": "Compound interest is interest earned on money and on past interest.",
        "concept": "Interest earns interest, so money grows faster and faster.",
        "misconceptions": copy.deepcopy(MISC),
        "cases": [curve_case()],
        "compare_topic": None,
        "compare_principle": None,
    }
    data.update(over)
    return data


def spec_of(data: dict, topic: str = "Compound interest") -> ModelSpec:
    from app.gen import spec_from_gen

    return spec_from_gen(data, topic)


# ---- schema + compile ------------------------------------------------------


def test_curve_spec_compiles_with_computed_truth() -> None:
    compiled = compile_spec(spec_of(gen_data()))
    r = compiled.round
    assert r.spec_version == 4 and r.compare is None
    item = r.items[0]
    assert item.computed is True
    assert item.truth_value == pytest.approx(1000 * 1.07**30)
    # Variables are substituted: the browser only sees x and the knob.
    assert "P" not in item.truth.expr and "r" in item.truth.expr
    assert item.explore and item.explore.param == "r" and item.explore.default == 7
    assert [v.name for v in item.variables] == ["P"]
    # The extreme that isn't a knob/param/variable is dropped; the rest are recomputed.
    assert [e.value for e in item.extremes] == [2, 12]
    assert item.extremes[1].truth_value == pytest.approx(1000 * 1.12**30)
    assert item.targets == ["linear-growth", "too-high"]
    assert compiled.report.unchecked == []
    Round.model_validate(r.model_dump())  # still a plain Round for the player


def test_claimed_number_is_only_cross_checked() -> None:
    with pytest.raises(SpecRejected, match="claimed"):
        compile_spec(spec_of(gen_data(cases=[curve_case(answer_claimed=9000)])))
    # No claim at all is fine: code computes the truth anyway.
    r = compile_spec(spec_of(gen_data(cases=[curve_case(answer_claimed=None)]))).round
    assert r.items[0].truth_value == pytest.approx(7612.26, abs=0.01)


def test_truth_outside_correct_band_is_rejected() -> None:
    bands = [
        {"min": 1000, "max": 8700, "misconception_id": "linear-growth"},
        {"min": 8800, "max": 15000, "misconception_id": None},
    ]
    with pytest.raises(SpecRejected):
        compile_spec(spec_of(gen_data(cases=[curve_case(bands=bands, answer_claimed=None)])))


def test_curve_ask_y_finds_the_crossing() -> None:
    case = curve_case(
        ask_x=None,
        ask_y=2000,
        prompt="How many years until $1,000 at 7% doubles?",
        slider_min=0,
        slider_max=40,
        slider_step=1,
        slider_unit="years",
        bands=[
            {"min": 0, "max": 7, "misconception_id": "too-high"},
            {"min": 8, "max": 12, "misconception_id": None},
            {"min": 13, "max": 40, "misconception_id": "linear-growth"},
        ],
        answer_claimed=10.2,
    )
    item = compile_spec(spec_of(gen_data(cases=[case]))).round.items[0]
    assert item.truth_value == pytest.approx(10.245, abs=0.01)


def test_curve_needs_exactly_one_ask() -> None:
    with pytest.raises(ValidationError):
        spec_of(gen_data(cases=[curve_case(ask_y=5000)]))


def sampler_case(**over) -> dict:
    case = {
        "widget": "sampler",
        "sampler": "birthday_match",
        "group_size": 23,
        "stat": "p_match",
        "x_label": "rooms with a shared birthday",
        "prompt": "23 people in a room. What's the chance two share a birthday?",
        "input": "slider",
        "slider_min": 0,
        "slider_max": 100,
        "slider_step": 1,
        "slider_unit": "%",
        "bands": [
            {"min": 0, "max": 30, "misconception_id": "linear-growth"},
            {"min": 31, "max": 70, "misconception_id": None},
            {"min": 71, "max": 100, "misconception_id": "too-high"},
        ],
        "extremes": [{"param": "group_size", "value": 60, "watch": "Almost certain."}],
        "answer_claimed": 50.7,
    }
    case.update(over)
    return case


def test_sampler_truth_is_computed_exactly() -> None:
    item = compile_spec(spec_of(gen_data(cases=[sampler_case()]))).round.items[0]
    assert item.truth.widget == "distribution" and item.truth.params.group_size == 23
    assert item.truth_value == pytest.approx(100 * birthday_match_probability(23))
    assert item.extremes[0].truth_value == pytest.approx(100 * birthday_match_probability(60))


def test_sampler_stat_must_fit_the_sampler() -> None:
    with pytest.raises(ValidationError):
        spec_of(gen_data(cases=[sampler_case(stat="mode")]))


def test_sampler_stats() -> None:
    assert sampler_stat("dice_sum", {"dice": 2}, "mode") == 7
    assert sampler_stat("dice_sum", {"dice": 2}, "p_equals", 7) == pytest.approx(100 / 6)
    assert sampler_stat("dice_sum", {"dice": 3}, "mean") == pytest.approx(10.5)
    assert sampler_stat("binomial_count", {"n": 10, "p": 0.5}, "p_at_least", 8) == pytest.approx(
        100 * 56 / 1024
    )
    assert sampler_stat("binomial_count", {"n": 10000, "p": 0.5}, "mode") == 5000
    assert sampler_stat("coin_longest_run", {"n": 100}, "mean_longest_run") == pytest.approx(
        6.977, abs=0.001
    )
    rate = {"base_rate": 0.01, "sensitivity": 0.9, "false_positive_rate": 0.09}
    assert sampler_stat("base_rate_test", rate, "p_true_positive") == pytest.approx(9.17, abs=0.01)
    with pytest.raises(ValueError):
        sampler_stat("dice_sum", {"dice": 1}, "mode")  # every face ties
    with pytest.raises(ValueError):
        sampler_stat("coin_longest_run", {"n": 100, "p": 0.3}, "mean_longest_run")


def dice_choice(correct_value=7, marked="seven") -> dict:
    options = [
        {"id": "seven", "text": "7", "value": 7},
        {"id": "two", "text": "2", "value": 2},
        {"id": "all-equal", "text": "All totals are equally likely", "value": None},
    ]
    for o in options:
        o["misconception_id"] = None if o["id"] == marked else "linear-growth"
    options[0]["value"] = correct_value
    return sampler_case(
        sampler="dice_sum",
        group_size=None,
        dice=2,
        stat="mode",
        prompt="Roll two dice and add them. Which total comes up most often?",
        input="choice",
        options=options,
        bands=[],
        extremes=[{"param": "dice", "value": 5, "watch": "A bell shape appears."}],
        answer_claimed=7,
    )


def test_choice_correct_option_is_checked_against_the_truth() -> None:
    item = compile_spec(spec_of(gen_data(cases=[dice_choice()]))).round.items[0]
    assert item.input_type == "choice" and item.truth_value == 7
    assert next(o.id for o in item.options if o.misconception_id is None) == "seven"
    with pytest.raises(SpecRejected, match="nearest option"):
        compile_spec(spec_of(gen_data(cases=[dice_choice(marked="two")])))


def test_dial_and_stepper() -> None:
    dial = curve_case(
        widget="dial",
        variables=[
            {"name": "d", "meaning": "distance to the Moon", "unit": "km", "value": 384400},
            {"name": "v", "meaning": "car speed", "unit": "km/h", "value": 100},
        ],
        answer_expr="d/v/24",
        unit="days",
        prompt="Driving to the Moon at highway speed nonstop: how many days?",
        slider_min=0,
        slider_max=400,
        slider_step=1,
        slider_unit="days",
        bands=[
            {"min": 0, "max": 100, "misconception_id": "linear-growth"},
            {"min": 101, "max": 220, "misconception_id": None},
            {"min": 221, "max": 400, "misconception_id": "too-high"},
        ],
        extremes=[{"param": "v", "value": 1000, "watch": "A jet: about 16 days."}],
        answer_claimed=160.2,
    )
    item = compile_spec(spec_of(gen_data(cases=[dial]))).round.items[0]
    assert item.truth.widget == "estimate" and item.truth_value == pytest.approx(160.17, abs=0.01)
    assert item.extremes[0].truth_value == pytest.approx(16.02, abs=0.01)

    stepper = curve_case(
        widget="stepper",
        steps=["Start with the claim.", "Check it against the rule."],
        answer_text="It depends on the rule.",
        answer_claimed=None,
        extremes=[],
    )
    compiled = compile_spec(spec_of(gen_data(cases=[stepper])))
    item = compiled.round.items[0]
    assert item.computed is False and item.truth_value is None
    assert compiled.report.unchecked == [item.id]  # "worked example, not checked"


def test_compare_case_compiles_to_a_second_item() -> None:
    second = sampler_case(
        group_size=30,
        prompt="30 shared PINs... what's the chance two match?",
        answer_claimed=70.6,
        bands=[
            {"min": 0, "max": 50, "misconception_id": "linear-growth"},
            {"min": 51, "max": 85, "misconception_id": None},
            {"min": 86, "max": 100, "misconception_id": "too-high"},
        ],
    )
    data = gen_data(
        cases=[sampler_case(), second],
        compare_topic="Two people with the same short hash",
        compare_principle="Matches grow with the number of pairs, not of people.",
    )
    r = compile_spec(spec_of(data)).round
    assert [i.id for i in r.items] == ["model", "compare"]
    assert r.compare.item_id == "compare"
    assert r.compare.prompt == "What's the same about how these work?"

    # A broken or different-widget second case leaves a text-only compare screen.
    data["cases"][1] = curve_case()
    r = compile_spec(spec_of(data)).round
    assert len(r.items) == 1 and r.compare.item_id is None


# ---- no-fit + guards -------------------------------------------------------


def test_gibberish_topic_is_refused_before_any_call() -> None:
    assert topic_looks_unreal(GIBBERISH)
    for real in ("compound interest", "DNA replication", "mRNA vaccines", "pH scale", "C++"):
        assert not topic_looks_unreal(real), real


def test_nearest_topics_by_keyword_overlap() -> None:
    near = nearest_topics("probability of dice sums")
    assert near[0] == {"slug": "dice-sums", "topic": "Sums of dice", "kind": "reviewed"}
    assert len(near) == 3
    assert {n["slug"] for n in nearest_topics(GIBBERISH)} == {
        "birthday",
        "coin-streak",
        "positive-test",
    }


@pytest.fixture
def live_gen(monkeypatch, tmp_path):
    """Generation with a fake key and the model call stubbed out (no network).

    Push replies onto the returned list's `.replies` (dicts or raw strings).
    """
    from app import gen, main

    monkeypatch.setenv("GEMINI_API_KEY", "test-not-a-key")
    monkeypatch.delenv("MM_OFFLINE", raising=False)
    monkeypatch.setattr(gen, "CACHE_DIR", tmp_path)
    monkeypatch.setattr(gen.time, "sleep", lambda s: None)

    class Calls(list):
        replies: list = []

    calls = Calls()
    calls.replies = []

    def fake_call(model, topic):
        calls.append(model)
        reply = calls.replies.pop(0) if calls.replies else gen_data(topic)
        return reply if isinstance(reply, str) else json.dumps(reply)

    monkeypatch.setattr(gen, "_call_model", fake_call)
    main._hits.clear()
    yield calls
    main._hits.clear()


def test_api_returns_spec_round_and_caches(live_gen) -> None:
    first = client.post("/api/rounds", json={"topic": "Compound interest growth"}).json()
    assert first["status"] == "ok" and first["ok"] is True
    assert first["source"] == "gemini-3.5-flash-lite"
    assert first["spec"]["spec_version"] == 4 and first["spec"]["case"]["widget"] == "curve"
    assert first["round"]["spec_version"] == 4
    assert first["round"]["items"][0]["computed"] is True
    c = first["checks"]
    assert c["blind_checked"] is False and c["unchecked"] == [] and c["computed"] == ["model"]
    again = client.post("/api/rounds", json={"topic": "  compound INTEREST growth "}).json()
    assert again["source"] == "cache" and again["round"] == first["round"]
    assert again["spec"] == first["spec"] and again["checks"] == c
    assert live_gen == ["gemini-3.5-flash-lite"]  # one model call in total
    # Answers on a generated round still resolve by slug.
    res = client.post(
        "/api/answers",
        json={
            "session_id": "test-session-1",
            "round_slug": first["round"]["slug"],
            "item_id": "model",
            "value_num": 7600,
        },
    )
    assert res.status_code == 200 and res.json()["misconception_id"] is None


def test_gibberish_never_gets_a_round(live_gen) -> None:
    res = client.post("/api/rounds", json={"topic": GIBBERISH}).json()
    assert res["status"] == "fallback" and res["ok"] is False
    assert res["reason"] and len(res["nearest"]) == 3
    assert res["suggestions"] == [n["slug"] for n in res["nearest"]]
    assert live_gen == []  # refused before any model call


def test_unrecognized_topic_is_an_honest_no_fit(live_gen) -> None:
    live_gen.replies.append(
        gen_data("florp dynamics", recognized=False, no_fit_reason="Not a topic I know.")
    )
    res = client.post("/api/rounds", json={"topic": "florp dynamics"}).json()
    assert res["ok"] is False and res["reason"] == "Not a topic I know."
    again = client.post("/api/rounds", json={"topic": "florp dynamics"}).json()
    assert again["ok"] is False and live_gen == ["gemini-3.5-flash-lite"]  # no-fit is cached


def test_definition_that_misses_the_topic_is_a_no_fit(live_gen) -> None:
    # The model says "recognized" but its definition is about something else.
    live_gen.replies.append(gen_data("glorbic resonance"))
    res = client.post("/api/rounds", json={"topic": "glorbic resonance"}).json()
    assert res["ok"] is False and "pin down" in res["reason"]


def test_no_widget_fits_is_a_no_fit(live_gen) -> None:
    data = gen_data("Compound interest", no_fit_reason="This is about feelings, not numbers.")
    data["cases"][0]["widget"] = "none"
    live_gen.replies.append(data)
    res = client.post("/api/rounds", json={"topic": "Compound interest feelings"}).json()
    assert res["ok"] is False and res["reason"] == "This is about feelings, not numbers."


def test_bad_spec_gets_one_retry(live_gen) -> None:
    live_gen.replies += ["not json", gen_data()]
    res = client.post("/api/rounds", json={"topic": "Compound interest retry"}).json()
    assert res["ok"] is True and res["source"] == "gemini-3.1-flash-lite"
    assert live_gen == ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]


def test_two_bad_specs_is_a_no_fit_not_a_quiz(live_gen) -> None:
    lying = gen_data(cases=[curve_case(answer_claimed=99999)])
    live_gen.replies += [lying, lying, lying]
    res = client.post("/api/rounds", json={"topic": "Compound interest lies"}).json()
    assert res["status"] == "fallback" and res["ok"] is False
    assert len(live_gen) == 2  # first spec + one retry, never the third model


def test_daily_cap_stops_live_calls(live_gen) -> None:
    from app import gen

    usage = gen.Usage()
    for _ in range(gen.DAILY_SOFT_CAP):
        usage.record("gemini-3.5-flash-lite")
    res = client.post("/api/rounds", json={"topic": "Compound interest capped"}).json()
    assert res["ok"] is False and live_gen == []


def test_showcase_and_reviewed_topics_skip_the_model(live_gen) -> None:
    for topic, source in (("Streaks in coin flips", "showcase"), ("monty hall", "reviewed")):
        res = client.post("/api/rounds", json={"topic": topic}).json()
        assert res["ok"] is True and res["source"] == source
        assert res["spec"] is None and res["checks"] is None
    assert live_gen == []


def test_compute_truth_rejects_a_spec_that_does_not_compute() -> None:
    spec = spec_of(gen_data(cases=[curve_case(expr="P*(1+r/100)^x/(x-x)", answer_claimed=None)]))
    with pytest.raises(SpecRejected):
        compute_truth(spec.case)
