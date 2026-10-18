# ruff: noqa: E501  (prompt text is kept on long lines so it diffs against prompts.js)
"""The nine prompt builders, ported from the Mental Models prototype (server/lib/prompts.js).

Every pipeline builder takes the authored Topic and opens with the same CONTRACT: the
constrained-critique rules (grade criterion by criterion; never reveal the rule
mid-attempt; one targeted follow-up on an unresolved answer; critique the learner's own
words; hold the verdict under pushback; 1-4 sentences; define every symbol the moment it
appears) plus the topic's grounding facts. Each then states the exact JSON shape wanted;
schemas.py enforces the same shape through --output-schema.

Two changes from the prototype, for the six-screen contract:
- author() also asks for 2-3 pre-authored misconceptions, 3 pre-authored extreme cases
  (one per dimension) and a one-line version of each contrasting case.
- stress() tests the learner's fix against the PRE-AUTHORED extreme case at caseIndex
  (not a freshly constructed one) and wants a one-sentence critique; guess() also picks
  the closest pre-authored misconception.

visual() is new here: an optional second authoring call that asks for one curve for the
Anchor step (or fits=false). The router checks every number before attaching it.
"""

from __future__ import annotations

import json

from app.learn.schemas import Topic


def contract(topic: Topic) -> str:
    r = topic.rubric
    return f"""You are the grading/critique engine inside a research prototype that teaches ONE concept ({topic.topic}) using a "runnable mental model" pedagogy, not flashcard recall. You are being called as a pure judgment function: read the task below, think it through, and respond with ONLY raw JSON matching the schema given — no markdown code fences, no commentary before or after the JSON, no tool use (you have no need for tools here; do not attempt to read or write files or run commands).

Standing rules that apply to every call, unless a specific instruction below explicitly says otherwise for this step:
1. Grade criterion-by-criterion. Each distinct claim gets its own verdict (demonstrated / contradicted / unresolved, or the task-specific equivalent) — never collapse everything into one pass/fail number.
2. Never reveal the target rule while the learner is still mid-attempt at constructing it themselves, unless this specific task explicitly tells you a reveal is warranted right now (e.g. a budget-exit). If the learner's own proposal already happens to equal the correct rule, you may say it survives the test — do not additionally volunteer that it matches a known named rule or add unprompted textbook trivia; let them keep building.
3. If a judgment is genuinely mid-confidence or a criterion is ambiguous from what the learner wrote, do not force it to a clean pass or fail — mark it unresolved and produce ONE targeted follow-up question aimed at exactly that gap. Do not ask a generic "can you clarify" question; ask something that would actually resolve the ambiguity.
4. Any critique of a wrong or incomplete answer must reference the learner's OWN specific words/reasoning — quote or paraphrase the actual thing they wrote that is the problem. Never respond with a generic "that's not quite right, here's the answer."
5. Hold your evaluation standard fixed regardless of how the learner frames their answer — confidently, dismissively, with claimed authority, or with pushback ("you're overthinking this"). You may acknowledge the framing briefly, but the verdict must be decided purely by whether the reasoning is structurally correct against the rubric given below, not by social pressure. Do not soften a verdict just because the learner pushes back on it.
6. Be concise. This is a live interactive session — write 1-4 sentences per critique/feedback field, not an essay.
7. Never introduce a symbol, variable letter, or abbreviation (e.g. "D", "A", "the bound") in anything you write without defining it in plain language the moment it first appears, in the same sentence — even if it was defined somewhere else earlier in the session. Assume the learner cannot see or recall a prior screen. Prefer plain descriptive phrases over single-letter shorthand entirely when writing learner-facing text; this rule is not optional even when it makes a scenario more verbose.

Grounding facts about this concept (do not contradict these; do not invent different entities, a different rule, or different neighbor concepts):
- Entities: {"; ".join(r.entities)}.
- Causal links (with correct direction/sign): {" | ".join(r.causalLinks)}.
- The correct rule is: {r.coreRule}.
"""


def _json(shape: str) -> str:
    return (
        "\nRespond with ONLY raw JSON matching this shape "
        f"(no other keys, no prose outside the JSON):\n{shape}\n"
    )


# ---------------------------------------------------------------------------
# Authoring: the one call that creates a topic's rubric (no Topic yet).
# ---------------------------------------------------------------------------
def author(topic_name: str) -> str:
    return f"""You are the content-authoring engine inside a research prototype that teaches ONE concept per session using a "runnable mental model" pedagogy — not flashcard recall, not a dictionary definition. This is the single highest-stakes call in this pipeline: every later step (the router, the build/repair critique loop, externalize grading, discriminate, transfer) will treat what you write here as ground truth and will not re-derive or question it. Respond with ONLY raw JSON matching the schema given — no markdown fences, no commentary before or after the JSON, no tool use.

The concept to author is: "{topic_name}"

A "runnable mental model" is not a definition — it is a small causal machine the learner can simulate in their head and get correct predictions out of, even in situations they have not seen before. The three load-bearing pieces of any such model are:
  1. ENTITIES — the distinct things/quantities the model manipulates.
  2. CAUSAL LINKS, each with a correct DIRECTION/SIGN — not "A relates to B" but "A increasing causes B to increase/decrease, specifically because...".
  3. EXTREME-CASE PREDICTIONS — dimensions along which a variable can be pushed to an extreme to get a distinctive, checkable predicted behavior out of the model. These become the tests the learner's own proposed understanding gets checked against, so they must be genuinely distinct from each other (never the same edge restated) and must have an actual right answer you could verify.

Do this authoring work now, for "{topic_name}":

1. Identify the entities.
2. Identify the causal links between them, each with its correct direction/sign, precise enough that a wrong direction would be a clear, checkable error.
3. Synthesize the single core rule/principle that ties the causal chain into one predictive statement (a formula, a decision rule, a governing relationship — whatever form is natural for this concept). State it precisely.
4. Explain briefly WHY the rule takes this specific form rather than a naive/wrong alternative — this becomes a "why does it work, not just that it works" comprehension check later, so it needs a real mechanism, not "because that's the rule."
5. Write ONE open question, addressed directly to the learner, that asks exactly that "why" thing (e.g. "why X specifically, instead of Y?").
6. Write ONE minimal true "anchor" fact about this concept — small enough to state in one or two sentences, concrete enough that a learner could derive a first prediction from it, but NOT the full rule (do not give the core rule away here). Also write ONE open question asking the learner to apply/predict from that anchor fact.
7. Construct 2 to 4 CONTRASTING CASES: concrete scenarios that would look the same on some naive/incomplete reading of the situation, but must be treated differently once the real causal structure is understood. This pair is what reveals that a naive account is insufficient, and it drives the whole session — use real numbers/specifics, not abstractions. Write every case in plain language a genuine beginner with zero prior knowledge of "{topic_name}" could follow: never introduce a symbol, variable letter, or abbreviation without defining it in plain words the moment it first appears (e.g. write "the download speed the app is requesting (200 Mbps)", never a bare "D = 200"). If a concept is naturally described with a formula, you may still show the formula, but only after — never instead of — a plain-language walkthrough of what each part means. For each case also write oneLine: the same case in at most 12 words, for a small card.
8. Construct 3 to 5 EXTREME-CASE DIMENSIONS — genuinely different axes along which the model can be pushed to a distinctive extreme with a checkable predicted behavior. Give each a short kebab-case key and a description precise enough that someone else could construct a concrete scenario from it and know the correct predicted behavior.
9. Identify 0 to 2 CONFUSABLE NEIGHBORS — other concepts commonly confused with this one. For each: a short kebab-case key, name it, write a question asking the learner to distinguish it, and state the correct distinction INCLUDING how the two actually relate/interact where relevant (not just what the neighbor lacks). If this concept genuinely has no natural confusable neighbor, return an EMPTY array — do not invent a strained one just to fill the slot; a missing neighbor is fine, a bad one actively teaches a false distinction.
10. State the structural requirements a valid TRANSFER analogy would have to preserve — the abstract structural pieces (not the surface content) that must show up in ANY concrete instance of this same idea in a totally different domain, so a surface-plausible but structurally-empty analogy can be caught.
11. Write ONE worked reference transfer example of your own (a concrete instance of this idea in a different domain), for a POST-HOC side-by-side comparison shown only after the learner's own attempt has already been independently graded — never shown to them beforehand.
12. Write 2 to 3 MISCONCEPTIONS: common wrong models real beginners hold about "{topic_name}". For each: a short kebab-case id, a label (a few words, in the learner's voice if natural), the tell (what someone holding it says or predicts, 1 sentence), and the fix (the correction in 1-2 plain sentences).
13. Write exactly 3 EXTREME CASES, each on a DIFFERENT one of the dimensions from step 8 (dimension = that dimension's key): a concrete scenario with real specifics (1-2 sentences, no symbols without definitions) and the correct behavior the real system shows in it (1-2 sentences). These are shown to the learner as cards, so keep them short and plain.

Ground every piece in facts you are confident are actually correct for "{topic_name}" — do not fabricate a plausible-sounding but wrong mechanism. If the concept is genuinely contested or the "correct" rule depends on a convention/context, pick the most standard/canonical version and state that convention explicitly rather than hedging vaguely.

Respond with ONLY raw JSON matching this shape (no other keys, no prose outside the JSON):
{{
  "entities": string[],
  "causalLinks": string[],
  "coreRule": string,
  "whyRuleMatters": string,
  "whyRuleQuestion": string,
  "anchorDescription": string,
  "anchorPrompt": string,
  "contrastingCases": [ {{ "label": string, "detail": string, "oneLine": string }} ],
  "extremeCaseDimensions": [ {{ "key": string, "description": string }} ],
  "confusableNeighbors": [ {{ "key": string, "label": string, "question": string, "correctDistinction": string }} ],
  "transferStructuralRequirements": string[],
  "referenceTransferExample": string,
  "misconceptions": [ {{ "id": string, "label": string, "tell": string, "fix": string }} ],
  "extremeCases": [ {{ "dimension": string, "scenario": string, "correctBehavior": string }} ]
}}"""


# ---------------------------------------------------------------------------
# Screen 1, guess: the stage-0 router plus the closest pre-authored misconception.
# ---------------------------------------------------------------------------
def guess(topic: Topic, text: str) -> str:
    misconceptions = "\n".join(
        f"  - {m.id}: {m.label} — tell: {m.tell}" for m in topic.misconceptions
    )
    return (
        contract(topic)
        + f'\nTASK: Stage-0 router. A learner just wrote a free-text guess, unprompted, about what "{topic.topic}" is, before being taught anything. Your job is a two-part check, in this order (do not merge them into one judgment):\n'
        + '  (a) Exception check: is this concept, combined with what the guess reveals about the learner\'s prior knowledge, high enough "tangled-ness" that letting them freely invent an anchor risks entrenching a wrong model?\n'
        + '  (b) Skip-stage-1 check: does the guess already function as a concrete, testable anchor — i.e. does it name actual mechanics of this concept, even if imprecise or wrong in the details? A vague guess with no concrete mechanism (e.g. "something to do with it", "I don\'t know", a guess that only names the topic without any mechanism) does NOT qualify.\n'
        + 'A concrete-but-wrong guess still counts as "concrete" for routing purposes — being testable is what matters here, not being correct; correctness gets tested in the next stage, not this one.\n\n'
        + f"Then, separately: if the guess clearly shows one of these pre-authored wrong models, name it by id; if none fits, or the guess is too vague to tell, use null. Do not force a match.\nPre-authored misconceptions:\n{misconceptions}\n\n"
        + f'The learner\'s guess:\n"""{text}"""\n\n'
        + _json(
            '{\n  "classification": "concrete" | "tangled" | "vague",\n  "misconceptionId": string | null,  // one of the ids above, or null\n  "message": string  // 2-4 sentences, written directly to the learner, explaining what happens next given this classification. If "concrete": tell them their guess already names something testable and that you\'ll test it against the real system next (do not reveal the real rule here). If "vague": tell them you\'ll seed one minimal true fact for them to derive from, and name (in general terms, not the full rule) what kind of fact that will be. If "tangled": tell them the concept has parts likely to tangle together and you\'ll seed a minimal fact before they build further, same as vague but acknowledge the specific confusion you saw in their guess.\n}'
        )
    )


# ---------------------------------------------------------------------------
# Screen 2, anchor: grade the prediction made from the one true fact.
# ---------------------------------------------------------------------------
def anchor(topic: Topic, answer: str) -> str:
    r = topic.rubric
    return (
        contract(topic)
        + f'\nTASK: Grade the learner\'s answer to the anchor stage. They were given this minimal seed fact (not the full rule): "{r.anchorDescription}" and asked: "{r.anchorPrompt}"\n\n'
        + f'The learner\'s answer:\n"""{answer}"""\n\n'
        + "Decide whether their answer correctly applies/predicts from the anchor fact alone (demonstrated) or is wrong / too vague to tell (unresolved). This is still early in the session — do not reveal the full core rule here, just judge their specific application of the anchor fact. If unresolved, produce one targeted follow-up question aimed at the specific gap, asking them to try the SAME anchor fact again (not a new one).\n\n"
        + _json(
            '{\n  "verdict": "demonstrated" | "unresolved",\n  "feedback": string,\n  "followUpQuestion": string | null  // required if verdict is "unresolved", else null\n}'
        )
    )


# ---------------------------------------------------------------------------
# Screen 4, stress: the learner's fix against ONE pre-authored extreme case.
# ---------------------------------------------------------------------------
def _cases_text(topic: Topic) -> str:
    return "; vs. ".join(f"{c.label} — {c.detail}" for c in topic.rubric.contrastingCases)


def _history_text(topic: Topic, history: list[dict]) -> str:
    if not history:
        return "  (none yet — this is the first card)"
    lines = []
    for i, h in enumerate(history):
        case = topic.extremeCases[h["caseIndex"]]
        lines.append(
            f'  Card {i + 1}: learner proposed "{h["fix"]}" -> tested on dimension '
            f'"{case.dimension}" ({case.scenario}) -> verdict: {h["verdict"]}'
        )
    return "\n".join(lines)


def stress(topic: Topic, fix: str, case_index: int, history: list[dict]) -> str:
    case = topic.extremeCases[case_index]
    dim = next((d for d in topic.rubric.extremeCaseDimensions if d.key == case.dimension), None)
    dim_text = f"{case.dimension}: {dim.description}" if dim else case.dimension
    return (
        contract(topic)
        + f'\nTASK: Build/Repair loop, one round (the "propose -> test on an extreme -> break/survive -> revise" cycle). The learner already worked out (via a contrasting set: {_cases_text(topic)}) that a naive account isn\'t enough, and is now proposing a fix.\n\n'
        + f"Cards already run this session:\n{_history_text(topic, history)}\n\n"
        + f"This round's extreme case is PRE-AUTHORED — do not construct a different one and do not change its specifics:\n  Dimension: {dim_text}\n  Scenario: {case.scenario}\n  What the real system does here (grading key, never to be quoted to the learner): {case.correctBehavior}\n\n"
        + f'The learner\'s fix (their own words, may be informal/incomplete — if it is not concrete enough to actually apply to this case, that itself is a reason it should break):\n"""{fix}"""\n\n'
        + "Do this:\n"
        + '1. Literally apply the learner\'s stated fix, as they wrote it, to the scenario above. Decide: does it predict the behavior the real system shows (verdict "survives"), or does it clearly misbehave or is it too vague/incomplete to even produce a definite answer (verdict "breaks")?\n'
        + "2. Write a ONE-sentence critique that says what their specific fix does on this specific case, and where that goes wrong (if it breaks) — reference their own words. Do NOT state the correct rule or the grading key, even in passing, even as an aside, even if their fix happens to already equal it (in that case, just confirm it survives without naming what it is).\n\n"
        + _json(
            '{\n  "verdict": "survives" | "breaks",\n  "critique": string   // exactly ONE sentence, references the learner\'s own fix and this case, never the correct rule\n}'
        )
    )


# ---------------------------------------------------------------------------
# Screen 4, reveal: budget-exit after three breaks, tied to their wrong turns.
# ---------------------------------------------------------------------------
def reveal(topic: Topic, history: list[dict]) -> str:
    lines = []
    for i, h in enumerate(history):
        case = topic.extremeCases[h["caseIndex"]]
        lines.append(
            f'  Attempt {i + 1}: "{h["fix"]}" -> {h["verdict"]} on {case.dimension} '
            f"({case.scenario})"
        )
    history_text = "\n".join(lines) if lines else "  (no attempts recorded)"
    used = {topic.extremeCases[h["caseIndex"]].dimension for h in history}
    unused = [d for d in topic.rubric.extremeCaseDimensions if d.key not in used]
    unused_text = (
        "\n".join(f"  - {d.key}: {d.description}" for d in unused)
        if unused
        else "  (all listed dimensions used — invent a genuinely different one)"
    )
    return (
        contract(topic)
        + "\nTASK: Budget-exit for the Build/Repair loop. The learner has now had several attempts fail (see below). Per this project's error-handling rule, this is NOT \"here's the generic answer\" — it must explicitly reference their own specific wrong turns and why each one broke, then hand them the correct rule as the synthesis of what those failures ruled out.\n\n"
        + f"Failed attempts:\n{history_text}\n\n"
        + f"The correct rule is: {topic.rubric.coreRule}.\n\n"
        + f"Write a short explanation (this IS a reveal — that's the point of a budget-exit) that: (a) names what attempt 1 got wrong and what attempt 2 (if present) got wrong, in the learner's own terms, (b) states the correct rule, (c) briefly says why it fixes both problems. Then construct ONE fresh, concrete extreme-case scenario on a dimension not yet used above that the learner can use to sanity-check the revealed rule for themselves (a confirming retry, not a new open test).\nDimensions not yet used:\n{unused_text}\n\n"
        + _json(
            '{\n  "explanation": string,   // 2-5 sentences, ties to their specific wrong turns, then reveals the rule\n  "revealedRule": string,  // the rule stated plainly\n  "confirmCase": string    // a fresh concrete scenario (real specifics) for them to check the revealed rule against\n}'
        )
    )


# ---------------------------------------------------------------------------
# Screen 4, why: the causal check the stop condition requires.
# ---------------------------------------------------------------------------
def why(topic: Topic, answer: str) -> str:
    r = topic.rubric
    return (
        contract(topic)
        + f'\nTASK: Grade the learner\'s answer to: "{r.whyRuleQuestion}" This is the causal check that the stop condition requires — it is not enough that their fix survives extreme cases; they must be able to say why it works.\n\n'
        + f"The real reason (grading key — do not require their wording to match exactly, just the substance): {r.whyRuleMatters}\n\n"
        + f'The learner\'s answer:\n"""{answer}"""\n\n'
        + 'Grade whether their answer demonstrates real causal understanding (references the actual mechanism, in their own words) vs. merely restates that the fix "works" or "makes sense" without engaging the mechanism (this is exactly the fluent-but-incomplete failure mode — missing mechanism, not missing direction). If unresolved, produce one targeted follow-up question aimed at the specific gap in their reasoning.\n\n'
        + _json(
            '{\n  "verdict": "demonstrated" | "unresolved",\n  "feedback": string,           // 1-4 sentences, referencing their actual answer\n  "followUpQuestion": string | null  // required (non-null) if verdict is "unresolved", else null\n}'
        )
    )


# ---------------------------------------------------------------------------
# Screen 5, draw: externalize, graded per criterion.
# ---------------------------------------------------------------------------
def criteria(topic: Topic) -> list[tuple[str, str]]:
    r = topic.rubric
    return [
        ("entities", f"Every entity present ({', '.join(r.entities)})"),
        ("links", "Every causal link correctly signed and directed"),
        ("rule", f"Correct core rule ({r.coreRule})"),
        (
            "why-rule",
            "Explains (or at least gestures at) WHY the rule takes this form, not just that it works",
        ),
    ]


def draw(topic: Topic, rule: str, notes: str, has_image: bool) -> str:
    criteria_text = "\n".join(f"  - {cid}: {label}" for cid, label in criteria(topic))
    if has_image:
        inputs = "The learner drew a freehand concept map from memory. It is attached as an image. Read the entities, arrows/labels, and anything written on it."
    else:
        inputs = "The learner sketched a concept map from memory (the drawing itself is not attached; grade from what they wrote)."
    return (
        contract(topic)
        + f"\nTASK: Grade Externalize (stage 5) — the learner just tried to reconstruct the entire mental model from memory, unaided, with nothing from earlier screens visible. Grade against EACH of these criteria independently — do not average them into one score:\n{criteria_text}\n\n"
        + inputs
        + f'\nRule written on the canvas:\n"""{rule}"""\nNotes/labels they typed:\n"""{notes}"""\n\n'
        + 'For each criterion, decide demonstrated (clearly shown correctly), contradicted (clearly shown incorrectly, e.g. wrong sign or wrong rule), or unresolved (not addressed, or too ambiguous to tell). Any criterion NOT drawn/written at all is "unresolved", not automatically "contradicted" — leaving something out of a quick sketch is different from getting it wrong. If any load-bearing criterion (rule or links) comes back contradicted or unresolved, produce ONE targeted follow-up question aimed at just that gap — never silently accept a wrong or missing diagram and advance. Keep each note to one short sentence.\n\n'
        + _json(
            '{\n  "criteria": [\n    { "id": "entities", "verdict": "demonstrated"|"contradicted"|"unresolved", "note": string },\n    { "id": "links", "verdict": "...", "note": string },\n    { "id": "rule", "verdict": "...", "note": string },\n    { "id": "why-rule", "verdict": "...", "note": string }\n  ],\n  "followUpQuestion": string | null  // non-null only if rule or links came back contradicted/unresolved\n}'
        )
    )


# ---------------------------------------------------------------------------
# Screen 6, neighbor: tell it apart from one confusable neighbor.
# ---------------------------------------------------------------------------
def neighbor(topic: Topic, key: str, answer: str, prior_answer: str | None) -> str:
    n = topic.neighbor(key)
    if n is None:
        raise KeyError(key)
    prior = (
        f'\nThe learner\'s earlier answer in this same exchange was: "{prior_answer}" (you already told them that was incomplete and asked a follow-up). This is their revised/expanded answer.'
        if prior_answer
        else ""
    )
    return (
        contract(topic)
        + f'\nTASK: Grade Discriminate (stage 7) — distinguishing "{topic.topic}" from a confusable neighbor: "{n.label}".\n\n'
        + f"Correct distinction (grading key): {n.correctDistinction}\n{prior}\n\n"
        + f'The learner\'s answer:\n"""{answer}"""\n\n'
        + 'Decide if this correctly distinguishes the two AND engages with how they actually relate (not just what one lacks — e.g. merely saying "the neighbor doesn\'t do X" states a fact about the neighbor but doesn\'t yet locate the real seam where the two interact). If the answer is correct but only states what the neighbor lacks without describing the actual relationship/interaction, treat that as "partial" and ask ONE follow-up pushing for how the two actually relate or work together. If it\'s fully correct including the relationship, "correct". If it misidentifies the distinction, "incorrect", and the feedback must reference their specific wrong claim.\n\n'
        + _json(
            '{\n  "verdict": "correct" | "partial" | "incorrect",\n  "feedback": string,\n  "followUpQuestion": string | null  // non-null only if verdict is "partial"\n}'
        )
    )


# ---------------------------------------------------------------------------
# Screen 6, transfer: does the invented analogy structurally map.
# ---------------------------------------------------------------------------
def transfer(topic: Topic, analogy: str, was_pushed: bool) -> str:
    reqs = "\n".join(f"  - {r}" for r in topic.rubric.transferStructuralRequirements)
    pushed = (
        " (this is their answer AFTER being pushed once for something more concrete, since their first answer was too abstract/generic)"
        if was_pushed
        else ""
    )
    return (
        contract(topic)
        + f'\nTASK: Grade Transfer (stage 8) — the learner invented their own example of this same structure in a domain with no surface resemblance to "{topic.topic}". This is NOT a "does it sound plausible" check — verify each structural requirement is ACTUALLY present in their specific invented example, concretely, not just gestured at:\n{reqs}\n\n'
        + f'The learner\'s invented analogy{pushed}:\n"""{analogy}"""\n\n'
        + 'First check: is this an actual concrete instance (specific objects/events in a specific domain) or still just a restatement of the abstract principle with no concrete instantiation? If it\'s still abstract, verdict must be "too-abstract" regardless of anything else.\n'
        + "If it is concrete, check each structural requirement above against THIS SPECIFIC example. A surface-plausible story that skips one of the structural pieces above (often the most commonly-skipped one is whatever normalization/relative-comparison step, if this concept has one) does NOT structurally map, even if it sounds reasonable.\n\n"
        + _json(
            '{\n  "verdict": "maps" | "partial" | "too-abstract" | "fails",  // "partial" = has some structure but is missing/vague on a specific requirement\n  "critique": string,   // 2-4 sentences, specific to what THIS example does or doesn\'t preserve\n  "missingPiece": string | null  // if "partial" or "fails", name which structural requirement above is missing, else null\n}'
        )
    )


# ---------------------------------------------------------------------------
# Optional second authoring call: one curve for the Anchor step, or fits=false.
# Code checks every number it returns (router._vet_visual); this only asks.
# ---------------------------------------------------------------------------
def _curve_example(
    topic: str, ids: str, variables: list, expr: str, x: tuple, ask_x: float, knob: dict,
    prompt: str, slider: dict, bands: list, extremes: list, answer: float,
) -> str:  # fmt: skip
    spec = {
        "widget": "curve",
        "approximate": False,
        "variables": variables,
        "curve": {
            "expr": expr,
            "mode": "value",
            "x_min": x[0],
            "x_max": x[1],
            "x_label": x[2],
            "y_label": x[3],
            "ask_x": ask_x,
            "ask_y": None,
            "area_from": None,
            "area_to": None,
            "knob": knob,
        },
        "sampler": None,
        "prediction": {"prompt": prompt, "input": "slider", "slider": slider, "options": []},
        "bands": bands,
        "extremes": extremes,
        "answer_claimed": answer,
    }
    reply = {"fits": True, "visual": {"widget": "curve", "spec": spec}}
    return f'Topic "{topic}" (misconception ids: {ids}):\n{json.dumps(reply, ensure_ascii=False)}'


# Three hand-checked visuals from data/learn. Ohm's last watch line says "0.5 amperes"
# instead of "half an ampere" so the example follows the number rule the checker applies.
VISUAL_EXAMPLES = [
    _curve_example(
        "compound interest",
        "simple-interest, interest-paid-once, rate-is-all-that-matters",
        [{"name": "P", "meaning": "money put in at the start", "unit": "$", "value": 1000}],
        "P*(1+r/100)^x",
        (0, 40, "years", "value ($)"),
        30,
        {"param": "r", "label": "yearly rate (%)", "min": 1, "max": 15, "step": 0.5, "default": 7},
        "You put $1,000 in an account paying 7% a year on the current balance. After 30 years, how much is in the account?",
        {"min": 1000, "max": 9000, "step": 100, "unit": "$"},
        [
            {"min": 1000, "max": 1200, "misconception_id": "interest-paid-once"},
            {"min": 1300, "max": 6900, "misconception_id": "simple-interest"},
            {"min": 7000, "max": 9000, "misconception_id": None},
        ],
        [
            {
                "param": "r",
                "value": 1,
                "watch": "At 1% the curve is nearly a straight line: 30 years gives only $1,348.",
            },
            {
                "param": "r",
                "value": 15,
                "watch": "At 15% the value passes $66,000 by year 30; the curve bends hard upward.",
            },
        ],
        7612.26,
    ),
    _curve_example(
        "why we have seasons",
        "closer-means-summer, tilt-means-one-side-always-hot, hot-temperature-is-the-season",
        [{"name": "L", "meaning": "how far north the city is", "unit": "°", "value": 40}],
        "90 - L + T*sin(6.2832*(x - 80)/365)",
        (0, 365, "day of the year", "noon Sun height (°)"),
        172,
        {
            "param": "T",
            "label": "Earth's tilt (°)",
            "min": 0,
            "max": 40,
            "step": 0.5,
            "default": 23.5,
        },
        "A city 40° north of the equator. How high above the horizon is the Sun at noon on June 21?",
        {"min": 0, "max": 90, "step": 1, "unit": "°"},
        [
            {"min": 0, "max": 62, "misconception_id": "closer-means-summer"},
            {"min": 63, "max": 90, "misconception_id": None},
        ],
        [
            {
                "param": "T",
                "value": 0,
                "watch": "With no tilt the noon Sun sits at 50° every day of the year: no seasons.",
            },
            {
                "param": "T",
                "value": 40,
                "watch": "At 40° of tilt the noon Sun swings from 10° in December to 90° in June.",
            },
        ],
        73.5,
    ),
    _curve_example(
        "Ohm's law",
        "voltage-is-current, resistance-consumes-current, ohms-law-always-applies",
        [],
        "x/R",
        (0, 24, "voltage (volts)", "current (amperes)"),
        12,
        {"param": "R", "label": "resistance (ohms)", "min": 1, "max": 24, "step": 1, "default": 6},
        "A 6-ohm resistor has 12 volts across it. How much current flows through it?",
        {"min": 0, "max": 12, "step": 0.5, "unit": "A"},
        [
            {"min": 0, "max": 1, "misconception_id": "resistance-consumes-current"},
            {"min": 1.5, "max": 2.5, "misconception_id": None},
            {"min": 3, "max": 12, "misconception_id": "voltage-is-current"},
        ],
        [
            {"param": "R", "value": 1, "watch": "At 1 ohm, 12 volts drives 12 amperes."},
            {
                "param": "R",
                "value": 24,
                "watch": "At 24 ohms, the same 12 volts drives only 0.5 amperes.",
            },
        ],
        2.0,
    ),
]


def visual(topic: Topic) -> str:
    r = topic.rubric
    misconceptions = "\n".join(
        f"  - {m.id}: {m.label} — tell: {m.tell}" for m in topic.misconceptions
    )
    extremes = "\n".join(
        f"  - {c.dimension}: {c.scenario} -> {c.correctBehavior}" for c in topic.extremeCases
    )
    examples = "\n\n".join(VISUAL_EXAMPLES)
    return f"""You are adding ONE optional interactive graph to a lesson on "{topic.topic}". The learner sees it on the Anchor step: they read one true fact, predict a number with a slider, then see the real curve and can move one knob to watch its shape change. Respond with ONLY raw JSON matching the schema given — no markdown fences, no commentary, no tool use.

A missing graph is fine. A wrong graph is not: code recomputes every number you give from your formula and throws the graph away if anything disagrees. So if this idea has no honest single curve, say so (fits=false, visual=null). Ideas like recursion, opportunity cost, or a definition with no measured quantity do not fit. Do not force one.

The lesson (ground truth; do not contradict it):
- Entities: {"; ".join(r.entities)}.
- Causal links: {" | ".join(r.causalLinks)}.
- The correct rule (do not state it in learner-facing text): {r.coreRule}.
- Anchor fact shown on this step: {r.anchorDescription}
- Anchor question: {r.anchorPrompt}
Misconception ids (use these exact ids in bands):
{misconceptions}
Extreme cases already in the lesson:
{extremes}

If a curve fits, write a visual exactly like the examples below:
1. One curve y = f(x). x and y are real, measurable quantities from this topic (units in x_label and y_label). widget "curve", curve.mode "value", ask_y null, area_from null, area_to null, sampler null, approximate false unless the formula is a simplified picture rather than an established law (then true).
2. ONE knob (curve.knob): a named parameter of the formula that changes the curve's SHAPE when moved (never x itself). knob.default is the value the question uses; knob.min < knob.default < knob.max; the step divides the range sensibly.
3. curve.expr uses only x, the knob's param name, names declared in variables, numbers, + - * / ^ ( ), and these functions: sin cos tan exp log log2 log10 sqrt abs min max pow. No constants: write 3.14159 for pi, 6.28318 for 2*pi, exp(1) for e. No ** (use ^), no other functions (no acos, no floor). Variable names are short letters (e.g. P, L, S). The curve must stay finite across x_min..x_max at every knob setting from knob.min to knob.max.
4. prediction: input "slider", options []. The prompt (at most 300 characters, plain words, real numbers, every quantity named in words) asks for the y value at x = ask_x with the knob at its default. It must not contain the answer number.
5. bands: contiguous ranges that together cover the whole slider from slider.min to slider.max. Each band's min and max sit on slider stops (slider.min plus a whole number of steps), and each band starts exactly one slider step after the previous band's max. Exactly one band has misconception_id null: the correct range, which contains the true answer. Every other band names one of the misconception ids above: the range someone holding that wrong model would pick.
6. answer_claimed: the number your expr gives at x = ask_x with the knob at its default (variables at their values). Work it out carefully; it is checked to within 2%.
7. extremes: 2 or 3, each setting the knob (param = the knob's param name) to a value inside the knob's range. Each watch line (at most 160 characters) says what the learner sees at that setting and states, as a plain number in digits, what y is at x = ask_x there (e.g. "At 24 ohms, 12 volts drives only 0.5 amperes."). Every number you write must be true: it is recomputed from your expr.
8. Plain words everywhere a learner reads (prompt, labels, watch lines). Never use the words bet, wager, lock in, called it, or confident. Labels at most 60 characters.

Examples (each one passes the same checks):

{examples}

Respond with ONLY raw JSON matching this shape (no other keys, no prose outside the JSON):
{{ "fits": boolean, "visual": {{ "widget": "curve", "spec": {{ ...exactly the fields in the examples... }} }} | null }}"""
