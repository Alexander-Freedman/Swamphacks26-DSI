import json
import math

import pytest
from fastapi.testclient import TestClient

from app.checks import check_round, true_value
from app.gen import normalize_topic
from app.main import app
from app.rounds import EXTRA_DIR, extra_for_topic, extra_rounds, showcase_rounds
from app.schema import Round
from app.truth import band_for

client = TestClient(app)

EXPECTED = {
    "binary-search",
    "compound-interest",
    "dice-sums",
    "doubling",
    "monty-hall",
    "opportunity-cost",
    "orbits",
    "ph-scale",
    "regression-to-mean",
    "small-samples",
    "boyles-law",
    "caffeine-half-life",
    "herd-immunity",
    "earthquake-magnitude",
    "enzyme-saturation",
    "falling-objects",
    "hash-collisions",
    "inflation",
    "inverse-square-law",
    "kinetic-energy",
    "law-of-large-numbers",
    "logistic-growth",
    "margin-of-error",
    "newtons-law-of-cooling",
    "pendulum-period",
    "projectile-motion",
    "radioactive-half-life",
    "stopping-distance",
    "terminal-velocity",
}


def _raw() -> dict[str, dict]:
    return {p.stem: json.loads(p.read_text()) for p in sorted(EXTRA_DIR.glob("*.json"))}


def test_extras_validate_pass_checks_and_are_reviewed() -> None:
    raw = _raw()
    assert set(raw) == EXPECTED
    for stem, data in raw.items():
        data = dict(data)
        data.pop("aliases")
        r = Round.model_validate(data)
        assert r.slug == stem and r.reviewed
        _, report = check_round(r)
        assert report.dropped == {}, (stem, report.dropped)
        for m in r.misconceptions:
            assert m.source_url and m.source_url.startswith("http"), (stem, m.id)
    assert set(extra_rounds()) == EXPECTED


def test_extras_dont_touch_showcases() -> None:
    assert set(showcase_rounds()) == {"coin-streak", "positive-test", "birthday"}
    assert not set(showcase_rounds()) & set(extra_rounds())
    assert {r["slug"] for r in client.get("/api/rounds").json()} == set(showcase_rounds())


def test_aliases_are_unique_and_miss_showcases() -> None:
    showcase_keys = {
        normalize_topic(n) for r in showcase_rounds().values() for n in (r.topic, r.slug)
    }
    seen: dict[str, str] = {}
    for stem, data in _raw().items():
        for name in (data["topic"], data["slug"], *data["aliases"]):
            key = normalize_topic(name)
            assert key not in showcase_keys, (stem, name)
            assert seen.setdefault(key, stem) == stem, (stem, name, seen[key])


def test_correct_answer_is_the_computed_truth() -> None:
    for r in extra_rounds().values():
        for item in r.items:
            value = true_value(item)
            if value is not None and item.bands:
                assert band_for(item.bands, value).misconception_id is None, (r.slug, item.id)


# Independent recomputation of the headline numbers (not via the round files).
def test_extra_numbers() -> None:
    assert 100 * 1.02**5 == pytest.approx(110.41, abs=0.01)
    assert math.log(2) / math.log(1.08) == pytest.approx(9.01, abs=0.01)
    assert 10000 * 1.07**30 == pytest.approx(76123, abs=1)
    assert math.ceil(math.log2(384_400_000 / 0.0001)) == 42
    assert (10**6).bit_length() == 20  # worst-case guesses, floor(log2 n) + 1
    assert ((10**9).bit_length(), (2 * 10**9).bit_length()) == (30, 31)
    assert 100 * (6371 / 6771) ** 2 == pytest.approx(88.5, abs=0.1)
    speed_kmh = math.sqrt(398600.4418 / 6771) * 3600
    assert speed_kmh / 900 == pytest.approx(30.7, abs=0.1)
    boys = sum(math.comb(15, k) for k in range(10, 16)) / 2**15
    assert boys == pytest.approx(0.1509, abs=0.0001)
    dice3 = [a + b + c for a in range(1, 7) for b in range(1, 7) for c in range(1, 7)]
    assert (dice3.count(9), dice3.count(10)) == (25, 27)


@pytest.mark.parametrize(
    "topic,slug",
    [
        ("The Monty Hall problem", "monty-hall"),
        ("monty hall", "monty-hall"),
        ("  Regression to the MEAN ", "regression-to-mean"),
        ("pH", "ph-scale"),
        ("why do astronauts float?", "orbits"),
        ("binary-search", "binary-search"),
        ("Sunk cost fallacy", "opportunity-cost"),
    ],
)
def test_extra_topic_is_served_without_generation(monkeypatch, topic, slug) -> None:
    from app import gen, main

    def no_model(*args, **kwargs):
        raise AssertionError("model called for a reviewed topic")

    monkeypatch.setattr(gen, "_call_model", no_model)
    monkeypatch.setenv("GEMINI_API_KEY", "test-not-a-key")
    monkeypatch.delenv("MM_OFFLINE", raising=False)
    main._hits.clear()
    res = client.post("/api/rounds", json={"topic": topic}).json()
    main._hits.clear()
    assert res["status"] == "ok" and res["source"] == "reviewed"
    assert res["round"]["slug"] == slug and res["round"]["reviewed"] is True
    assert res["checks"] is None and res["seconds"] == 0.0
    assert extra_for_topic(topic).slug == slug


def test_extra_round_by_slug_and_answers(monkeypatch, tmp_path) -> None:
    from app import events, main

    monkeypatch.setattr(events, "DB_PATH", tmp_path / "test.db")

    assert client.get("/api/rounds/ph-scale").json()["slug"] == "ph-scale"
    main._hits.clear()
    res = client.post(
        "/api/answers",
        json={
            "session_id": "test-extra-1",
            "round_slug": "ph-scale",
            "item_id": "five-to-three",
            "option_id": "two",
        },
    )
    main._hits.clear()
    assert res.status_code == 200
    assert res.json()["misconception_id"] == "ph-is-linear"


def test_unmatched_topic_is_not_an_extra() -> None:
    assert extra_for_topic("photosynthesis") is None
