"""Pre-built engine v4 topics (data/specs -> data/rounds/extra): stored rounds match
their specs, and each headline truth is recomputed here from first principles."""

import json
import math

import pytest

from app.rounds import EXTRA_DIR, ROUNDS_DIR, extra_for_topic
from app.schema import ModelSpec
from app.spec import compile_spec
from app.truth import band_for

SPECS = sorted((ROUNDS_DIR.parent / "specs").glob("*.json"))


def _binom_at_least(n: int, k: int) -> float:
    return 100 * sum(math.comb(n, i) for i in range(k, n + 1)) / 2**n


# Independent recomputation (closed forms, not the engine's evaluator).
TRUTHS = {
    "boyles-law": 1 * 10 / 2,
    "caffeine-half-life": 100 * 0.5 ** (15 / 5),
    "earthquake-magnitude": 10 ** (1.5 * 2),
    "enzyme-saturation": 100 * 15 / (5 + 15),
    "falling-objects": 0.5 * 9.81 * 4**2,
    "hash-collisions": 100 * (1 - math.exp(-(1000**2) / (2 * 1_000_000))),
    "inflation": 100 / 1.03**30,
    "inverse-square-law": 16 / 4**2,
    "kinetic-energy": 0.5 * 2 * 20**2,
    "law-of-large-numbers": _binom_at_least(100, 60),
    "logistic-growth": 1000 / (1 + 99 * math.exp(-0.3 * 20)),
    "herd-immunity": 100 * (1 - 1 / 4),
    "margin-of-error": 0.25 * (1.96 * 100 / 1.55) ** 2,
    "newtons-law-of-cooling": 20 + 80 * math.exp(-0.05 * 30),
    "pendulum-period": 2 * math.pi * math.sqrt(4 / 9.81),
    "projectile-motion": 30 * 2 - 0.5 * 9.8 * 2**2,
    "radioactive-half-life": 5730 * math.log2(100 / 10),
    "stopping-distance": 80 / 3.6 + (80 / 3.6) ** 2 / (2 * 6),
    "terminal-velocity": 50 * math.tanh(9.8 * 10 / 50),
}


def test_every_spec_has_a_truth() -> None:
    assert {p.stem for p in SPECS} == set(TRUTHS)


@pytest.mark.parametrize("path", SPECS, ids=lambda p: p.stem)
def test_stored_round_matches_spec_and_truth(path) -> None:
    data = json.loads(path.read_text())
    spec = ModelSpec.model_validate(data["spec"])
    compiled = compile_spec(spec)
    assert not compiled.report.dropped
    stored = json.loads((EXTRA_DIR / f"{path.stem}.json").read_text())
    assert stored["reviewed"] is True and stored["spec_version"] == 4
    assert stored["aliases"] == data["aliases"]
    expected = compiled.round.model_copy(update={"reviewed": True}).model_dump(mode="json")
    assert {k: v for k, v in stored.items() if k != "aliases"} == expected
    item = stored["items"][0]
    truth = item["truth_value"]
    assert truth == pytest.approx(TRUTHS[path.stem], rel=2e-3)
    from app.schema import Band

    assert band_for([Band(**b) for b in item["bands"]], truth).misconception_id is None
    for m in stored["misconceptions"]:
        assert m["source_url"].startswith("https://")
    assert extra_for_topic(data["aliases"][0]).slug == path.stem
