# Any-topic engine: what to generate + how to keep it accurate (#20)

**Bottom line:**
- **Each topic gets a misconception list first.** Every wrong option and numeric band maps to a misconception id.
- **One "truth" widget from a fixed library of 8**, which the model only fills with parameters (no generated code).
- **Answers are computed by our code, not trusted from the model.** A rule-based linter plus a blind second-call check; fallback to a worked example or claim cards when unsure.
- **Cache by topic, plus 12 hand-checked showcase topics.**
- **Stream item 1 in ~3-4 s** with low thinking; latency numbers are from docs/benchmarks and not yet measured on our key.
- **~20-24h to build.**

# Any-topic engine: schema, truth widgets, accuracy, latency, build plan

Research for #20 (any-topic engine + accuracy). Builds on deep-mental-models.md, feasibility.md (Gemini structured output), sponsor-tech.md (Gemini keys/limits) and ai-era.md. Nothing here is built yet.

## What this means for us (short)

1. **The model never draws or computes the truth. It fills in parameters for one of ~8 widgets we wrote and tested.** Letting it write code is what Google's own Generative UI work does, and they report it "can sometimes take a minute or more" with "occasional inaccuracies" ([Google Research](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/)). That's a demo killer.
2. **Every number the user is graded on comes from our code, not the LLM.** The model gives a math expression or a sim spec, we evaluate it (mathjs / our Monte Carlo / our physics step), and if its claimed answer disagrees with ours, ours wins or the item is dropped. That's PAL-style "LLM writes the program, interpreter does the math" (+15 pts absolute on GSM8K over CoT, [Gao et al., ICML 2023](https://arxiv.org/abs/2211.10435)).
3. **Hide verification inside the user's thinking time.** Item 1 arrives in ~2-3 s. While the judge is predicting (10-20 s), the rest of the session gets generated, linted and cross-checked in the background. The reveal never waits on verification.
4. **Expect LLM quiz items to be flawed often, so lint them with plain rules.** In published studies, 31-49% of LLM-written MCQs had item-writing flaws and up to 22% had factual errors (sources in section 4). Rule checks caught more flaws than GPT-4 did (91% vs 79%, [Moore et al. 2023](https://arxiv.org/abs/2307.08161)).
5. **Pre-generate and hand-check 10-15 showcase topics. The live path is labeled "fresh, auto-checked"; the showcase path is "reviewed".** If the judge's topic is fuzzy or not quantitative, use the honest fallback (worked-example stepper + claim cards), never a made-up sim.

---

## 1. Content schema (one topic = one session)

Design rules:
- The **misconceptions list comes first**. Every distractor and every refutation points to a misconception by `id`, so a wrong pick tells us which wrong idea the user holds.
- Exactly one `truth` block per session. Items reference it, so the reveal is the same widget each time with different inputs.
- Answers for quantitative items are an `answer_expr` that we evaluate. The model's own `answer_claimed` is only used to cross-check.
- Keep it flat and short. Gemini warns that "very large or deeply nested schemas may be rejected", and it supports only a subset of JSON Schema: types, enum, min/max, minItems/maxItems, required, anyOf/$ref, recursive schemas ([structured output docs](https://ai.google.dev/gemini-api/docs/structured-output)).

```jsonc
{
  "topic": "Monty Hall problem",
  "concept": "Switching wins 2/3 of the time because the host's reveal is not random.",
  "domain": "probability",            // enum: probability|calculus|kinematics|statistics|growth|scale|history|process|other
  "confidence": "high",               // enum high|medium|low; low => fallback path
  "misconceptions": [
    { "id": "m1", "label": "Two doors left means 50/50",
      "why_tempting": "Counting outcomes without asking how they were produced.",
      "refutation": "The host always opens a goat door he knows about. Your first pick stays 1/3; all the other 2/3 moves to the door he leaves shut.",
      "evidence_hook": "Run 1,000 games: switch wins ~667." }
  ],
  "truth": {
    "widget": "probability_sim",        // enum, see section 2
    "params": { "template": "monty_hall", "n_doors": 3, "trials": 1000 },
    "caption": "Each dot is one game. Green = switching won."
  },
  "items": [
    { "id": "q1", "type": "mcq",
      "stem": "You pick door 1, the host opens door 3 (a goat). Should you switch?",
      "options": [
        { "text": "Switch: 2/3 chance", "correct": true },
        { "text": "Doesn't matter: 50/50", "misconception_id": "m1" },
        { "text": "Stay: your first instinct is usually right", "misconception_id": "m2" }
      ],
      "truth_inputs": { "strategy": "switch" } },
    { "id": "q2", "type": "numeric",
      "stem": "Out of 1,000 games, how many does switching win?",
      "min": 0, "max": 1000, "unit": "wins",
      "answer_expr": "1000 * 2/3", "answer_claimed": 667, "tolerance": 0.05,
      "misconception_bands": [ { "range": [450, 550], "misconception_id": "m1" } ] },
    { "id": "q3", "type": "order",
      "stem": "Order by win rate: switch with 3 doors, stay with 3 doors, switch with 10 doors",
      "items_in_correct_order_exprs": ["9/10", "2/3", "1/3"] },
    { "id": "q4", "type": "tf_reason",
      "statement": "If the host opened a door at random and it happened to be a goat, switching would still win 2/3.",
      "answer": false,
      "reasons": [
        { "text": "False: with a random host, it's 1/2", "correct": true },
        { "text": "True: the math is the same", "misconception_id": "m3" } ] }
  ],
  "follow_ups": [
    { "id": "f1", "targets_misconception": "m1", "type": "mcq", "stem": "..." }
  ]
}
```

Item types and what each catches:
| type | Input | Grading | Catches |
|---|---|---|---|
| `mcq` | 3-4 options, each wrong one mapped to a misconception | exact | the specific wrong idea |
| `numeric` (slider) | min/max/unit, `answer_expr` | within tolerance (log scale for spans >100x) | the size of the error ("off by 10x") plus bands mapped to misconceptions |
| `order` | 3-5 items | Kendall distance; the first swapped pair is named | relative intuitions (timelines, scale, rates) |
| `tf_reason` | T/F + pick a reason | both must be right | "right for the wrong reason", which is the most diagnostic |

Keep a session to 3-5 items plus at most 2 follow-ups targeting whatever misconception the user hit. That's ~90 s of play, which fits a 3-minute demo with room to spare.

## 2. Truth widgets

### Library vs model-written code
| | Widget library (model fills params) | Model writes code |
|---|---|---|
| Latency | params ~200-400 tokens; renders instantly | full HTML/JS ~2-5k tokens; Google reports a minute or more |
| Correctness | our code; tested once | unknown per run; silent physics/maths bugs |
| Safety | no eval of model code | needs a sandboxed iframe at minimum |
| Look | consistent and polished (Design score) | random every time |
| Coverage | only what we built | anything |

**Pick: the library.** For the "anything" gap, use honest fallbacks (stepper, claim cards, compare bars), not generated code. If we want an "AI-built sim" stretch, run it in a sandboxed iframe for showcase topics only, generated ahead of time and hand-checked.

### The library (8 widgets, ~1-2.5 h each)
Each widget = a React component + a param JSON schema + a `compute(params, inputs)` that returns the true values. Grading uses `compute`, never the model.

| Widget | Params (model fills) | What our code does | Example topics |
|---|---|---|---|
| `probability_sim` | `template` enum (coin_streak, dice_sum, birthday, monty_hall, bayes_test, gamblers_fallacy, sampling_without_replacement) + numbers | Runs N trials live (seeded RNG), dot grid + running frequency converging on the exact value | Monty Hall, birthday paradox, false positives, hot hand |
| `function_plot` | `exprs[]` (mathjs strings), `params[]` with slider ranges, `x_range`, optional derivative/area shading | Evaluates and plots; sliders change params; derivative/integral computed numerically | limits, derivatives, exponential vs linear, compound interest |
| `motion_sim` | `model` enum (projectile, free_fall, incline, pendulum, spring, circular, two_body_collision), numbers, `drag` bool | Fixed-step integration in our code, canvas animation, ghost of the user's prediction | "heavier falls faster", "dropped vs thrown bullet", pendulum period |
| `distribution` | `dist` enum (normal, binomial, uniform, exponential, poisson) + params, or `sample_mean_of` for the CLT | Samples live into a histogram; marks mean/median/percentile | regression to the mean, CLT, average vs typical |
| `compare_bars` | `quantities[] {label, value_expr, unit, source}` | Bars with a log-scale toggle; the user drags the bar heights first | scale of the universe, energy use, "how many X fit in Y" |
| `timeline` | `events[] {label, year, precision}` | Plots on an axis; the user's order sits above the true order | history, evolution, tech history |
| `stepper` | `steps[] {text, expr?, check_expr?}` | Steps revealed one by one; any `expr` is evaluated and shown | worked examples, any maths derivation; **the default fallback** |
| `claim_cards` | `claims[] {claim, verdict, why, source_hint}` | Flip cards, no numbers | non-quantitative topics (biology myths, nutrition, language) |

Notes:
- `mathjs` (or `expr-eval`) evaluates strings without `eval`. Whitelist functions, cap the expression length, and wrap evaluation in try/catch so a bad expression throws and the widget falls back.
- `probability_sim` uses templates, not a general probability DSL. A general DSL is a rabbit hole; seven templates cover most "probability is weird" topics a judge will name.
- PhET research is the design guide: little text, constrained controls, the sim itself as the feedback, "guides without students feeling guided" ([Podolefsky, Perkins & Adams, implicit scaffolding](https://arxiv.org/pdf/1306.6544)).

### Choosing the widget
1. In the first, small call, the model returns `domain`, `widget` (an enum over the 8), `widget_fit` (0-1) and `confidence`. An enum constraint guarantees a valid name, not a good choice ([structured output docs](https://ai.google.dev/gemini-api/docs/structured-output)).
2. Validate the params against the widget's schema, then run `compute` once on the server. If validation fails, the output is NaN/Infinity, or `widget_fit < 0.6`, fall to `stepper` (quantitative) or `claim_cards` (qualitative).
3. Put 1-2 short few-shot examples per widget in the system prompt (topic → widget + params). That's the cheapest accuracy gain for the picker.
4. Log every (topic, widget, fit, fallback) row. That's our eval table for the write-up ("we tested 60 judge-style topics, X% got a sim, Y% fell back, 0 wrong reveals").

## 3. Accuracy

Tactics in order of value per hour:

1. **Compute, don't trust.** Every graded number = `compute(params)` or `eval(answer_expr)`. Compare with `answer_claimed`. If they differ by more than the tolerance, drop the item (or regenerate once in the background). The disagreement rate is itself a nice stat for the write-up. Background: PAL ([Gao et al.](https://arxiv.org/abs/2211.10435)) and Gemini's own code execution tool (Python sandbox with numpy/sympy/scipy, 30 s max, up to 5 retries) ([docs](https://ai.google.dev/gemini-api/docs/code-execution)). We do it client/server side with mathjs instead because it's faster and deterministic.
2. **Structured output with our JSON schema**: `response_mime_type: application/json` + `response_json_schema`. Output is guaranteed to be valid JSON, but Google itself says to "validate values in your application" ([docs](https://ai.google.dev/gemini-api/docs/structured-output)). Validate with zod/pydantic.
3. **Rule-based item linter** (an hour of regex, no model): duplicate options; >1 option marked correct; the correct option is the longest by >30%; absolute words ("always/never") only in distractors; "all/none of the above"; answer text appearing in the stem; every distractor has a `misconception_id`; numeric `min < answer < max` and the answer isn't at an edge. These are the five rubric flaws QuestionWell targets ([Bialik & Cummings](https://questionwell.org/hubfs/Papers/mcq-paper-llncs-main.pdf)) plus the ones Doughty saw (multiple correct answers, distractors that give the answer away) ([Doughty et al., ACE 2024](https://arxiv.org/abs/2312.03173)). Rules beat GPT-4 at flaw detection: 91% vs 79% ([Moore et al.](https://arxiv.org/abs/2307.08161)).
4. **Independent verify pass, run in the background.** A second call (a different model or at least a fresh context) gets only stem + options and must answer blind. If its answer ≠ our key, drop the item. That's "answer the verification question without seeing the draft", the Chain-of-Verification idea ([Dhuliawala et al., ACL Findings 2024](https://arxiv.org/abs/2309.11495)). Don't do "please review your answer" in the same context: intrinsic self-correction doesn't reliably help and can hurt ([Huang et al., ICLR 2024](https://arxiv.org/abs/2310.01798)). For factual (non-computable) items, the verifier can use Gemini with Google Search grounding. Gemini 3 can combine grounding with structured output (preview) ([docs](https://ai.google.dev/gemini-api/docs/structured-output)). It's slower, which is fine in the background.
5. **Refuse or fall back when unsure.** `confidence: low`, an unknown/vague topic, a contested topic (politics, live medical advice), or more than 1 of 4 items dropped → show the stepper/claim-card path with the label "we couldn't verify a sim for this; here's a worked example". Showing honest uncertainty is something recent winners got rewarded for (Untangled labels AI-only judgments, per deep-mental-models.md).
6. **Cache.** Key on the normalized topic (lowercase, strip punctuation, embedding-nearest within a threshold). A second judge naming "monty hall" gets the same verified session instantly. Free-tier limits are per project and reset at 3 AM our time (sponsor-tech.md), so the cache also protects the demo.
7. **Showcase set: 10-15 topics, generated by the same pipeline, then checked by us by hand** and frozen as JSON. Pick them to cover every widget: Monty Hall, birthday paradox, false positives (Bayes), "heavier falls faster", projectile, derivative as slope, compound interest, CLT, scale of the solar system, timeline of life on Earth, seasons (claim cards), plus 2-3 UF-flavored ones. Label them "reviewed".

Even curated human MCQs have wrong keys (6.5% of MMLU; 57% of its virology subset, [Gema et al., NAACL 2025](https://arxiv.org/abs/2406.04127)), so "a human looked at it" plus "code computed it" is the realistic bar, not perfection.

### Latency budget (live judge topic)
Measured third-party numbers (Artificial Analysis rolling medians **as of Oct 16 evening**; they move, so measure on our key): Gemini 3.5 Flash at *minimal* thinking has ~0.80 s time-to-first-token and ~192 tok/s. Gemini 3.6 Flash at *high* has ~14.5 s TTFT (~224 tok/s) (thinking counts) and ~304 tok/s ([AA comparison](https://artificialanalysis.ai/models/comparisons/gemini-3-6-flash-vs-gemini-3-5-flash-minimal)). Thinking level is what decides whether we're fast. `thinking_level` minimum is `minimal` on 3.6 Flash and `low` on 3.8 Flash. Default is medium (dynamic). Thinking tokens count against `max_output_tokens`, so don't try to cap thinking with a small max ([thinking docs](https://ai.google.dev/gemini-api/docs/thinking)). **Set thinking explicitly to minimal/low for the generation calls.**

Streaming works with a schema, and the chunks are "valid partial JSON strings that can be concatenated" ([docs](https://ai.google.dev/gemini-api/docs/structured-output)). Gemini follows schema key order (feasibility.md), so put `concept`, `truth` and `items[0]` first and render them with a partial-JSON parser as they arrive.

| Step | When | Budget |
|---|---|---|
| Cache / showcase hit | t=0 | <100 ms |
| Call A (stream): concept, misconceptions, truth widget + params, item 1 | t=0 | first token ~1 s, item 1 complete ~2.5-3.5 s (~400-600 tokens) |
| Validate widget params + compute + lint item 1 | after A | <50 ms |
| **User sees item 1** | | **~3-4 s** (show a "building your session" animation with the concept line as it streams) |
| Call B: items 2-5 + follow-ups (given A's output) | parallel, starts when A's misconceptions are in | ~4-6 s |
| Call C: blind verify for each item (a batch call) | after B | ~2-4 s, done before the user finishes item 1 |
| Reveal | after the user answers | instant (widget is local) |

Fallback if A is slow (>6 s) or errors: switch to the nearest showcase topic with "here's a close one while that loads", or to the stepper. Rehearse with 20 random topics on venue Wi-Fi and log the p50/p95 to NOTES.md.

## 4. Evidence on LLM-generated quiz items

| Study | Setting | Finding |
|---|---|---|
| [Doughty et al., ACE 2024](https://arxiv.org/abs/2312.03173) | 651 GPT-4 vs 449 human MCQs, 6 Python courses | Mostly clear, one correct answer, good distractors, LO-aligned; failures: multiple correct answers, distractors that give the answer away ([summary](https://warwick.ac.uk/fac/cross_fac/eduport/edufund/projects/yang/projects/a-comparative-study-of-ai-generated-gpt-4-and-human-crafted-mcqs-in-programming-education/)) |
| [Camarata et al., Adv Physiol Educ 2025](https://researchdiscovery.drexel.edu/esploro/outputs/journalArticle/LLM-Generated-Multiple-Choice-Practice-Quizzes-for/991022059818004721) | ChatGPT renal physiology quizzes | 49% item-writing flaws, 22% factual/conceptual errors; 91% "reasonable starting point" for revision |
| [Bialik & Cummings (QuestionWell)](https://questionwell.org/hubfs/Papers/mcq-paper-llncs-main.pdf) | Rubric of 5 auto-checkable flaws | gemini-2.5-flash 69.2% unflawed, gpt-4.1-nano 55.1%, their tuned model 96.0% |
| [Feng et al., NAACL Findings 2024](https://arxiv.org/abs/2404.02124) | Math MCQ distractors (Eedi data) | LLMs make mathematically valid distractors but are weaker at matching the errors real students make |
| [Scarlatos et al., BEA 2024](https://arxiv.org/abs/2405.05144) | Overgenerate-and-rank | Ranking by predicted student selection helps; teachers still prefer human distractors |
| [Zengaffinen et al., 2026](https://arxiv.org/abs/2603.15547) | How LLMs reason when making distractors | Models solve first, then simulate misconceptions, then pick; failures come from not recovering from their own mistakes |
| [Eedi Kaggle "Mining Misconceptions"](https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions) | Map wrong answers to a misconception bank | LLM-written misconception explanations improved retrieval a lot (2nd place) |
| [Moore et al. 2023](https://arxiv.org/abs/2307.08161) | Flaw detection | Rules found 91% of human-flagged flaws, GPT-4 79% |
| [BMC Med Educ 2025](https://pubmed.ncbi.nlm.nih.gov/39923067/) | High-stakes EM exam, ChatGPT-4o vs human | AI items had more factual errors (6 vs 4%), irrelevance (6 vs 0%), wrong difficulty (14 vs 1%) |
| [Parker & Zavala-Cerna 2026](https://arxiv.org/abs/2605.00294) | LLMs characterizing misconceptions from quiz data | Experts rated them "excellent" (qualitative only) |

Known failure modes to design against:
- More than one correct option, or a "distractor" that is actually right. Fix: blind verify + `compute`.
- Answer cues: the longest option, absolute words, "all of the above". Fix: linter.
- Plausible-sounding but invented misconceptions. Fix: prompt for *documented/common* misconceptions with a `why_tempting` field; for the showcase set we check them by hand; for physics, align with known lists (FCI, deep-mental-models.md).
- Arithmetic/numeric errors. Fix: `answer_expr` evaluated by us.
- Wrong difficulty. Fix: one `audience` param (curious adult default); difficulty matters less in a demo.
- Refutations that just restate the answer. Refutation texts work when they name the wrong idea, say why it's tempting, and then show the counter-evidence (meta-analysis g = 0.41 over other conditions, [Educ Psychol Rev 2021](https://link.springer.com/article/10.1007/s10648-021-09656-z)). The schema forces `label` + `why_tempting` + `refutation` + `evidence_hook` (which points at the widget).

## 5. Pipeline and build plan (~20 person-hours)

```
topic ─► normalize ─► cache/showcase hit? ──yes──► session
                │no
                ▼
     Call A (stream, thinking=min/low, schema A)
     concept, misconceptions, truth{widget,params}, item1
                │
     validate params ─► compute() ─► lint item1 ──fail──► fallback (stepper/claim_cards)
                │ok
     render item1  ║  Call B (items 2-5 + follow-ups, schema B)
                   ║        │
                   ║  compute/eval answer_expr ─► lint ─► Call C blind verify ─► drop mismatches
                   ║        │
     user answers ─► reveal = widget(params, user inputs) + misconception named + refutation
                │
     cache verified session; log (topic, widget, fallbacks, drops, latency)
```

| # | Piece | Hours | Owner hint |
|---|---|---|---|
| 1 | Schemas (zod/pydantic) for session, items, widget params | 1.5 | backend |
| 2 | Gemini client: streaming + partial JSON parse, thinking level, timeouts, retries | 2 | backend |
| 3 | Prompts A/B/C with few-shots per widget | 2 | backend |
| 4 | Evaluator (mathjs whitelist) + `compute` for each widget + answer cross-check | 2 | backend |
| 5 | Item linter (rules) | 1 | backend |
| 6 | Cache + showcase loader + topic normalizer | 1 | backend |
| 7 | Widgets: `stepper`, `claim_cards`, `compare_bars` (the fallbacks first) | 2.5 | frontend |
| 8 | Widgets: `probability_sim` (3-4 templates), `function_plot` | 3 | frontend |
| 9 | Widgets: `motion_sim` (projectile + free fall with drag), `distribution` | 3 | frontend |
| 10 | Item UIs: mcq, numeric slider, order, tf_reason + reveal flow | 2 | frontend |
| 11 | Generate + hand-check 12 showcase topics; 40-topic stress run; log table | 2 | both |
| | **Total** | **~24 h** | cut `timeline` and `distribution` (and the order item type) to land at ~20 |

Cut line, in order: `timeline` widget → `distribution` → the order item type → Call C (keep compute + lint) → `motion_sim` drag. Never cut: compute-not-trust, the linter, the showcase cache, the fallback widget.

## Open questions (my call)
- Default audience level: high-school/curious adult (my pick) or college?
- Do we show the "reviewed / auto-checked" label in the UI? I'd say yes, since it's a good judge talking point.
- Which model is live on our key at the event (3.6 Flash allows `minimal` thinking; 3.8 only goes down to `low`). Pin it after `models.list`.
