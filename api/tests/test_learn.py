"""Learn endpoints against the fake codex backend (MM_CODEX_FAKE=1): contract shapes only."""

import base64
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.learn import codex, router, schemas, topics
from app.learn.schemas import Topic
from app.main import app

FIXTURES = Path(__file__).parent / "fixtures" / "learn"
SLUG = "compound-interest"

client = TestClient(app)


@pytest.fixture(autouse=True)
def fake_codex(monkeypatch, tmp_path):
    """Canned replies, the fixture topic as the only prebuilt, a temp cache dir."""
    monkeypatch.setenv("MM_CODEX_FAKE", "1")
    monkeypatch.setenv("MM_LEARN_CACHE", str(tmp_path / "learn-cache"))
    monkeypatch.setattr(topics, "LEARN_DIR", FIXTURES)
    topics.prebuilt_topics.cache_clear()
    codex.reset_status_cache()
    router._hits.clear()
    router._graded_hits.clear()
    router._graded_day.clear()
    router._authoring.clear()
    yield
    topics.prebuilt_topics.cache_clear()
    router._hits.clear()


def post(path: str, **body):
    return client.post(f"/api/learn/{path}", json=body)


# ---------------------------------------------------------------------------
# topics
# ---------------------------------------------------------------------------
def test_fixture_topic_is_complete_and_loads() -> None:
    t = Topic.model_validate(json.loads((FIXTURES / f"{SLUG}.json").read_text(encoding="utf-8")))
    assert t.checked and t.visual is not None and t.visual.widget == "curve"
    assert len(t.extremeCases) == 3 and 2 <= len(t.misconceptions) <= 3
    assert topics.prebuilt_topics()[SLUG].slug == SLUG


def test_list_and_get_topics() -> None:
    res = client.get("/api/learn/topics")
    assert res.status_code == 200
    assert res.json() == [{"slug": SLUG, "topic": "compound interest", "checked": True}]
    body = client.get(f"/api/learn/topics/{SLUG}").json()
    assert set(body) == {
        "slug",
        "topic",
        "checked",
        "rubric",
        "misconceptions",
        "extremeCases",
        "visual",
    }
    assert set(body["rubric"]) == {
        "entities",
        "causalLinks",
        "coreRule",
        "whyRuleMatters",
        "whyRuleQuestion",
        "anchorDescription",
        "anchorPrompt",
        "contrastingCases",
        "extremeCaseDimensions",
        "confusableNeighbors",
        "transferStructuralRequirements",
        "referenceTransferExample",
    }
    assert client.get("/api/learn/topics/nope").status_code == 404


def test_post_known_topic_serves_prebuilt_without_a_call(monkeypatch) -> None:
    calls = []
    monkeypatch.setattr(codex, "fake_reply", lambda task, prompt: calls.append(task))
    res = post("topics", topic="Compound  Interest")
    assert res.status_code == 200 and res.json()["slug"] == SLUG and res.json()["checked"]
    assert calls == []


def test_post_new_topic_authors_live_and_caches(tmp_path) -> None:
    res = post("topics", topic="Boyle's law")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["slug"] == "boyle-s-law" and body["checked"] is False
    assert body["visual"]["widget"] == "curve"  # the fake visual passes every check
    assert (tmp_path / "learn-cache" / "boyle-s-law.json").exists()
    # Served from the cache now, listed as unchecked, and gradeable.
    assert client.get("/api/learn/topics/boyle-s-law").status_code == 200
    assert {"slug": "boyle-s-law", "topic": "Boyle's law", "checked": False} in client.get(
        "/api/learn/topics"
    ).json()
    assert (
        post("boyle-s-law/guess", text="pressure goes up when volume goes down").status_code == 200
    )


def test_post_topic_rate_limit_per_ip(monkeypatch) -> None:
    monkeypatch.setattr(router, "AUTHOR_PER_IP_PER_HOUR", 2)
    codes = [post("topics", topic=f"topic number {i}").status_code for i in range(3)]
    assert codes == [200, 200, 429]
    # A prebuilt topic never counts against the cap.
    assert post("topics", topic="compound interest").status_code == 200


def test_bad_authored_reply_is_a_502(monkeypatch) -> None:
    monkeypatch.setattr(codex, "fake_reply", lambda task, prompt: {"entities": ["x"]})
    res = post("topics", topic="entropy")
    assert res.status_code == 502 and res.json()["detail"] == "author_failed"


# ---------------------------------------------------------------------------
# the six screens: every response has exactly the contract's keys
# ---------------------------------------------------------------------------
def test_guess_shape() -> None:
    res = post(f"{SLUG}/guess", text="interest earns interest so it snowballs over time")
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"classification", "misconceptionId", "message"}
    assert body["classification"] in ("concrete", "vague", "tangled")
    assert body["misconceptionId"] in {m["id"] for m in _topic()["misconceptions"]} | {None}
    vague = post(f"{SLUG}/guess", text="no idea").json()
    assert vague["classification"] == "vague" and vague["misconceptionId"] is None


def test_guess_drops_unknown_misconception_id(monkeypatch) -> None:
    monkeypatch.setattr(
        codex,
        "fake_reply",
        lambda task, prompt: {
            "classification": "concrete",
            "misconceptionId": "made-up",
            "message": "ok",
        },
    )
    assert post(f"{SLUG}/guess", text="something testable").json()["misconceptionId"] is None


def test_anchor_and_why_shape() -> None:
    for path in (f"{SLUG}/anchor", f"{SLUG}/why"):
        res = post(path, answer="1070 then 1144.90 because year two pays on the bigger balance")
        assert res.status_code == 200, res.text
        body = res.json()
        assert set(body) == {"verdict", "feedback", "followUpQuestion"}
        assert body["verdict"] == "demonstrated" and body["followUpQuestion"] is None
        short = post(path, answer="1070").json()
        assert short["verdict"] == "unresolved" and isinstance(short["followUpQuestion"], str)


def test_stress_shape_and_case_index() -> None:
    res = post(
        f"{SLUG}/stress",
        fix="add a share of the current balance every year",
        caseIndex=0,
        history=[],
    )
    assert res.status_code == 200
    assert res.json() == {"verdict": "survives", "critique": res.json()["critique"]}
    breaks = post(
        f"{SLUG}/stress",
        fix="add 70",
        caseIndex=1,
        history=[
            {
                "caseIndex": 0,
                "fix": "add a share of the current balance every year",
                "verdict": "survives",
            }
        ],
    ).json()
    assert breaks["verdict"] == "breaks" and breaks["critique"].count(".") <= 2
    assert post(f"{SLUG}/stress", fix="x", caseIndex=3, history=[]).status_code == 422


def test_stress_prompt_uses_the_preauthored_case(monkeypatch) -> None:
    seen = {}
    real = codex.fake_reply

    def spy(task, prompt):
        seen[task] = prompt
        return real(task, prompt)

    monkeypatch.setattr(codex, "fake_reply", spy)
    post(f"{SLUG}/stress", fix="multiply by the rate every year", caseIndex=2, history=[])
    case = _topic()["extremeCases"][2]
    assert case["scenario"] in seen["stress"]
    assert case["correctBehavior"] in seen["stress"]
    assert "ONE-sentence" in seen["stress"]


def test_reveal_shape() -> None:
    history = [{"caseIndex": i, "fix": f"fix {i}", "verdict": "breaks"} for i in range(3)]
    res = post(f"{SLUG}/reveal", history=history)
    assert res.status_code == 200
    assert set(res.json()) == {"explanation", "revealedRule", "confirmCase"}


def test_draw_shape_without_image() -> None:
    res = post(f"{SLUG}/draw", rule="balance times rate", notes="principal -> balance", image=None)
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"criteria", "followUpQuestion"}
    assert [c["id"] for c in body["criteria"]] == ["entities", "links", "rule", "why-rule"]
    assert all(set(c) == {"id", "verdict", "note"} for c in body["criteria"])


def test_draw_passes_a_png_to_codex(monkeypatch) -> None:
    seen = {}

    async def spy(prompt, *, task, schema=None, image=None, timeout_s=None):
        seen["image"] = image
        seen["prompt"] = prompt
        return codex.fake_reply(task, prompt)

    monkeypatch.setattr(codex, "run_json", spy)
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16
    data_url = "data:image/png;base64," + base64.b64encode(png).decode()
    assert post(f"{SLUG}/draw", rule="r", notes="", image=data_url).status_code == 200
    assert seen["image"] == png and "attached as an image" in seen["prompt"]
    assert (
        post(f"{SLUG}/draw", rule="r", notes="", image="data:text/plain;base64,aGk=").status_code
        == 200
    )
    assert seen["image"] is None


def test_neighbor_shape() -> None:
    res = post(
        f"{SLUG}/neighbor",
        key="simple-interest",
        answer="simple pays on the original only",
        priorAnswer=None,
    )
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"verdict", "feedback", "followUpQuestion"}
    assert body["verdict"] == "partial" and body["followUpQuestion"]
    full = post(
        f"{SLUG}/neighbor",
        key="simple-interest",
        answer="both pay a share each year but compound pays on the current balance "
        "so they agree only in year one",
        priorAnswer="simple pays on the original only",
    ).json()
    assert full["verdict"] == "correct" and full["followUpQuestion"] is None
    assert post(f"{SLUG}/neighbor", key="nope", answer="x", priorAnswer=None).status_code == 404


def test_transfer_shape() -> None:
    res = post(f"{SLUG}/transfer", analogy="growth", wasPushed=False)
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"verdict", "critique", "missingPiece"}
    assert body["verdict"] == "too-abstract"
    maps = post(
        f"{SLUG}/transfer",
        analogy="a rumor where each day ten percent more people hear it than already know",
        wasPushed=True,
    ).json()
    assert maps["verdict"] == "maps"


def test_unknown_slug_is_404_everywhere() -> None:
    assert post("nope/guess", text="x").status_code == 404
    assert post("nope/transfer", analogy="x", wasPushed=False).status_code == 404


# ---------------------------------------------------------------------------
# status, availability, leak guard
# ---------------------------------------------------------------------------
def test_status_endpoint() -> None:
    body = client.get("/api/learn/status").json()
    assert body == {"codex": "ok", "inFlight": 0, "topics": 1}


def test_503_when_codex_is_not_ok(monkeypatch) -> None:
    monkeypatch.setattr(codex, "status", lambda: "unauthenticated")
    res = post(f"{SLUG}/guess", text="interest on interest")
    assert res.status_code == 503 and res.json() == {"detail": "codex_unavailable"}
    assert post("topics", topic="entropy").status_code == 503
    assert client.get("/api/learn/status").json()["codex"] == "unauthenticated"
    assert client.get(f"/api/learn/topics/{SLUG}").status_code == 200  # prebuilt still works


def test_leak_guard_scrubs_a_restated_rule(monkeypatch) -> None:
    rule = _topic()["rubric"]["coreRule"]
    monkeypatch.setattr(
        codex,
        "fake_reply",
        lambda task, prompt: {"verdict": "breaks", "critique": f"Remember, {rule.upper()}!"},
    )
    body = post(f"{SLUG}/stress", fix="add 70", caseIndex=0, history=[]).json()
    assert body["critique"] == topics.SCRUBBED
    assert topics.leaks("x " + rule + " y", rule) and not topics.leaks("nothing here", rule)


# ---------------------------------------------------------------------------
# the wrapper itself
# ---------------------------------------------------------------------------
def test_last_agent_message_and_extract_json() -> None:
    events = "\n".join(
        [
            '{"type":"thread.started","thread_id":"t"}',
            '{"type":"item.completed","item":{"id":"i0","type":"reasoning","text":"hmm"}}',
            '{"type":"item.completed","item":{"id":"i1","type":"agent_message",'
            '"text":"```json\\n{\\"ok\\": true}\\n```"}}',
            '{"type":"turn.completed","usage":{"input_tokens":1}}',
        ]
    )
    assert codex.extract_json(codex.last_agent_message(events)) == {"ok": True}
    assert codex.last_agent_message("not json at all") == "not json at all"
    assert codex.extract_json('Sure: {"a": {"b": "}"}, "c": 1} trailing') == {
        "a": {"b": "}"},
        "c": 1,
    }
    with pytest.raises(ValueError):
        codex.extract_json("no object here")


def test_build_args_matches_the_verified_invocation(monkeypatch, tmp_path) -> None:
    monkeypatch.delenv("MM_CODEX_MODEL", raising=False)
    args = codex.build_args("codex", tmp_path / "s.json", tmp_path, None, "hello")
    assert args == [
        "codex",
        "exec",
        "--json",
        "--output-schema",
        str(tmp_path / "s.json"),
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--ephemeral",
        "-C",
        str(tmp_path),
        "hello",
    ]
    monkeypatch.setenv("MM_CODEX_MODEL", "gpt-6")
    args = codex.build_args("codex", None, tmp_path, tmp_path / "input.png", None)
    assert "-m" in args and args[args.index("-m") + 1] == "gpt-6"
    assert "--output-schema" not in args and args[-2:] == ["-i", str(tmp_path / "input.png")]


def test_output_schemas_are_closed_and_fully_required() -> None:
    for model in (schemas.GuessOut, schemas.DrawOut, schemas.Authored):
        schema = json.loads(schemas.schema_file(model).read_text())

        def check(node):
            if isinstance(node, dict):
                if node.get("type") == "object" and "properties" in node:
                    assert node["additionalProperties"] is False
                    assert node["required"] == list(node["properties"])
                assert "default" not in node and "maxLength" not in node
                for v in node.values():
                    check(v)
            elif isinstance(node, list):
                for v in node:
                    check(v)

        check(schema)
    assert set(json.loads(schemas.schema_file(schemas.GuessOut).read_text())["properties"]) == {
        "classification",
        "misconceptionId",
        "message",
    }


def test_fake_author_builds_a_valid_topic() -> None:
    authored = schemas.Authored.model_validate(codex.fake_authored("osmosis"))
    t = schemas.topic_from_authored("osmosis", "osmosis", authored, checked=False)
    assert t.slug == "osmosis" and not t.checked


def test_slug_for() -> None:
    assert topics.slug_for("Compound  Interest!") == "compound-interest"
    assert topics.slug_for("C++ templates") == "c-plus-plus-templates"
    assert topics.slug_for("Boyle's law") == "boyle-s-law"


def _topic() -> dict:
    return client.get(f"/api/learn/topics/{SLUG}").json()


def test_graded_calls_are_rate_limited(monkeypatch) -> None:
    monkeypatch.setattr(router, "GRADED_PER_IP_PER_HOUR", 2)
    codes = [
        post(f"{SLUG}/guess", text="interest is the same every year").status_code for _ in range(3)
    ]
    assert codes == [200, 200, 429]


def test_graded_daily_cap(monkeypatch) -> None:
    monkeypatch.setattr(router, "GRADED_DAILY_CAP", 1)
    assert post(f"{SLUG}/guess", text="interest is the same every year").status_code == 200
    assert post(f"{SLUG}/guess", text="interest is the same every year").status_code == 429


def test_overlong_author_text_is_trimmed_not_rejected() -> None:
    from app.learn.schemas import Rubric, validate_clipped

    data = json.loads((FIXTURES / f"{SLUG}.json").read_text(encoding="utf-8"))["rubric"]
    data["coreRule"] = "First sentence of the rule. " * 60
    data["entities"] = [f"thing {i}" for i in range(14)]
    r = validate_clipped(Rubric, data)
    assert len(r.coreRule) <= 700 and r.coreRule.endswith(".")
    assert len(r.entities) == 10


def test_other_validation_errors_still_raise() -> None:
    import pytest
    from pydantic import ValidationError

    from app.learn.schemas import Rubric, validate_clipped

    data = json.loads((FIXTURES / f"{SLUG}.json").read_text(encoding="utf-8"))["rubric"]
    del data["coreRule"]
    with pytest.raises(ValidationError):
        validate_clipped(Rubric, data)


# ---------------------------------------------------------------------------
# the optional curve visual on a live-authored topic
# ---------------------------------------------------------------------------
def _with_visual(monkeypatch, edit) -> None:
    """Fake codex, but the visual reply goes through edit(spec) first."""
    real = codex.fake_reply

    def reply(task, prompt):
        out = real(task, prompt)
        if task == "visual":
            edit(out["visual"]["spec"])
        return out

    monkeypatch.setattr(codex, "fake_reply", reply)


def test_live_topic_gets_a_checked_visual(tmp_path) -> None:
    from app.spec import compute_truth

    res = post("topics", topic="Newton's law of cooling")
    assert res.status_code == 200, res.text
    t = Topic.model_validate(res.json())
    assert t.visual is not None and t.visual.widget == "curve"
    case = t.visual.spec
    assert abs(compute_truth(case) - case.answer_claimed) < 0.01 * case.answer_claimed
    assert {b.misconception_id for b in case.bands} - {None} <= {m.id for m in t.misconceptions}
    cached = json.loads(
        (tmp_path / "learn-cache" / "newton-s-law-of-cooling.json").read_text(encoding="utf-8")
    )
    assert cached["visual"]["spec"]["curve"]["expr"] == case.curve.expr


def test_visual_prompt_carries_the_rubric_and_examples(monkeypatch) -> None:
    seen = {}
    real = codex.fake_reply

    def spy(task, prompt):
        seen[task] = prompt
        return real(task, prompt)

    monkeypatch.setattr(codex, "fake_reply", spy)
    t = Topic.model_validate(post("topics", topic="radioactive decay").json())
    prompt = seen["visual"]
    assert t.rubric.anchorDescription in prompt
    assert all(m.id in prompt for m in t.misconceptions)
    assert all(c.scenario in prompt for c in t.extremeCases)
    assert '"fits"' in prompt and "P*(1+r/100)^x" in prompt and "fits=false" in prompt


def test_fits_false_keeps_visual_null(monkeypatch) -> None:
    monkeypatch.setenv("MM_CODEX_FAKE_VISUAL", "none")
    res = post("topics", topic="recursion")
    assert res.status_code == 200 and res.json()["visual"] is None


def test_spec_failing_compile_case_keeps_null_and_topic_still_200(monkeypatch) -> None:
    def edit(spec):
        spec["curve"]["expr"] = "A*(1+r/pi)^x"  # pi is not an allowed name

    _with_visual(monkeypatch, edit)
    res = post("topics", topic="exponential growth")
    assert res.status_code == 200, res.text
    assert res.json()["visual"] is None and res.json()["rubric"]["coreRule"]


def test_bad_visual_shape_or_codex_failure_keeps_null(monkeypatch) -> None:
    real = codex.fake_reply

    def reply(task, prompt):
        if task == "visual":
            raise codex.CodexTimeout("slow")
        return real(task, prompt)

    monkeypatch.setattr(codex, "fake_reply", reply)
    assert post("topics", topic="half life").json()["visual"] is None
    monkeypatch.setattr(
        codex,
        "fake_reply",
        lambda task, prompt: {"fits": True} if task == "visual" else real(task, prompt),
    )
    assert post("topics", topic="doubling time").json()["visual"] is None


@pytest.mark.parametrize(
    "edit",
    [
        pytest.param(lambda s: s.update(answer_claimed=200.0), id="wrong-answer-claimed"),
        pytest.param(
            lambda s: s["extremes"][1].update(watch="At 30% a step, 10 steps reach about 900."),
            id="watch-number-wrong",
        ),
        pytest.param(
            lambda s: s["bands"][2].update(misconception_id="made-up-id"), id="unknown-band-id"
        ),
        pytest.param(lambda s: s["bands"].pop(1), id="bands-leave-a-gap"),
        pytest.param(lambda s: s["extremes"][1].update(value=80), id="extreme-off-the-knob"),
        pytest.param(lambda s: s["curve"].update(expr="A*(1+3/100)^x"), id="knob-does-nothing"),
    ],
)
def test_bad_visual_is_rejected(monkeypatch, edit) -> None:
    _with_visual(monkeypatch, edit)
    res = post("topics", topic="population growth")
    assert res.status_code == 200 and res.json()["visual"] is None


def test_vet_visual_rejects_wrong_answer_claimed_directly() -> None:
    from app.learn.schemas import VisualReply
    from app.spec import SpecRejected

    t = Topic.model_validate(_topic())
    reply = codex.fake_visual([m.id for m in t.misconceptions])
    good = VisualReply.model_validate(reply)
    assert router._vet_visual(t, good) is not None
    reply["visual"]["spec"]["answer_claimed"] = 280.0  # computed is 259.37: 8% off
    with pytest.raises(SpecRejected):
        router._vet_visual(t, VisualReply.model_validate(reply))


def test_hand_checked_visual_passes_the_vetting() -> None:
    from app.learn.schemas import VisualReply

    t = Topic.model_validate(_topic())
    assert t.visual is not None
    assert router._vet_visual(t, VisualReply(fits=True, visual=t.visual)) is not None


def test_watch_numbers() -> None:
    assert router._watch_numbers("At 1% only $1,348 after 30 years; 0.5 A, -3 C") == [
        1,
        1348,
        30,
        0.5,
        -3,
    ]
    assert router._watch_numbers("CO2 at 10-20 ppm") == [10, 20]
