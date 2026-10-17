# Round contract

`round.schema.json` and `model-spec.schema.json` are generated from `api/app/schema.py` (`cd api && uv run python scripts/export_schema.py`). Don't edit them by hand.

## Engine v4: topic → runnable model spec (#179, player side #184)

The generator no longer writes a quiz. For a typed topic it fills a **model spec** (`ModelSpec`, `model-spec.schema.json`): it picks one of our visual widgets and fills its numbers. Code validates the spec, **computes every truth from it**, and compiles it to a normal `Round`, so the round player keeps working and only needs to learn the new optional fields below. **Every v4 result is an interactive visual** (a curve with a knob, or a sampler); there is no text-only result type. If nothing honest fits, the API says so (no-fit) instead.

### The spec (`ModelSpec`)
| field | what |
|---|---|
| `spec_version` | `4` |
| `slug`, `topic` | as in Round |
| `concept` | the idea in plain words (≤ 300) |
| `definition` | one plain sentence defining the topic. Unreal topics never get here: gibberish is refused before any model call, the model must report `recognized: false` for made-up topics, and a definition that doesn't mention the typed words is a no-fit |
| `case` | the runnable case (`SpecCase`, below) |
| `misconceptions` | 1-3 `Misconception`s (same shape as Round: `id, label, why_tempting, refutation, source_url \| null, source_note`); the **first is the main named mistake**. `source_url: null` comes with `source_note: "unverified"`; the UI says so |
| `compare` | optional `{topic, prompt = "What's the same about how these work?", shared_principle, case?}`; `case` uses the **same widget** with a different surface |

`SpecCase`:
| field | what |
|---|---|
| `widget` | `curve` \| `sampler` |
| `approximate` | `true` = a simplified picture of the main relationship, not an established formula. Show **"approximate picture, not a full model"** |
| `variables` | `[{name, meaning, unit, value}]`: named numbers in plain words; exprs may use the names |
| `curve` | `{expr, mode, x_min, x_max, x_label, y_label, ask_x?, ask_y?, area_from?, area_to?, knob: {param, label, min, max, step, default}}`. y = expr(x, knob, variables). `mode`: `value` = y at `ask_x`, or the first x reaching `ask_y`; `slope` = derivative at `ask_x` (draw the tangent); `area` = integral from `area_from` to `area_to`, the knob is the **number of rectangles** (left Riemann sum); `limit` = limit at `ask_x` (the curve may have a hole there) |
| `sampler` | `{sampler, params, stat, k?, x_label}`: one of our samplers; `stat` says which number is asked (table below) |
| `prediction` | `{prompt, input: "slider" \| "choice", slider?: {min, max, step, unit}, options?: [{id, text, value?, misconception_id}]}`. No betting words (bet, wager, lock in, called it, confidence): code rejects them |
| `bands` | slider answers → misconception id or `null` (correct); same rules as below |
| `extremes` | 2-3 `{param, value, watch}`: a knob / sampler param / variable value to try, with one short line on what to watch |
| `answer_claimed` | the generator's own number: only cross-checked against the computed truth (> 2% off → rejected), **never shown** |

Sampler stats (all computed exactly in `api/app/truth.py`; probabilities are in **percent** 0-100):
| sampler | stats |
|---|---|
| `coin_longest_run` (`n`, fair coin) | `mean_longest_run`, `p_run_at_least` (k) |
| `base_rate_test` (`base_rate`, `sensitivity`, `false_positive_rate`; `population` is set by code so the icon array shows ≥ 20 sick) | `p_true_positive` |
| `birthday_match` (`group_size`) | `p_match` |
| `binomial_count` (`n`, `p`) | `mean`, `mode`, `p_at_least` (k), `p_equals` (k) |
| `dice_sum` (`dice`) | `mean`, `mode`, `p_at_least` (k), `p_equals` (k) |

### How a spec compiles to a Round (what the player reads)
- `round.spec_version = 4`; `round.concept`, `round.misconceptions` straight from the spec.
- `items[0]` = the main case (id `model`), `items[1]` = the compare case (id `compare`, only if it has one and it passes checks).
- `curve` → `truth: {widget: "curve", expr, x_min, x_max, x_label, y_label, ask_x, ask_y, show, area_from, area_to}` + `explore` = the knob. Variable names are substituted with their values, so `expr` only uses `x` and `explore.param`. **New optional `truth.show`:** `"tangent"` (draw the tangent at `ask_x`; answer = its slope), `"riemann"` (draw `explore` = n left rectangles from `area_from` to `area_to`; answer = the exact area), `"limit"` (mark `ask_x`, the curve may be undefined exactly there; answer = the limit); `null` = plain curve (answer = y at `ask_x` or the x reaching `ask_y`).
- `sampler` → `truth: {widget: "distribution", sampler, params, x_label}`.
- `prediction` → `input_type` + `slider` / `options` (option `value` is dropped; code checked that the correct option is the one nearest the truth), `bands` as is, `targets` = the misconceptions the bands/options name.
- **New optional item fields:** `truth_value` (the answer, computed by code), `computed` (true for every v4 item; null = older rounds), `approximate` (true → label "approximate picture, not a full model"), `variables` (`[{name, meaning, unit, value}]`, for a "what's in the model" panel), `extremes` (`[{param, value, watch, truth_value}]`; `truth_value` is the answer recomputed by code at that setting (for `riemann` with param = the rectangles knob: what that many rectangles add up to), or null).
- **New optional round field:** `compare: {topic, item_id | null, prompt, shared_principle}`. `item_id` points at the compare item when there is one; otherwise the compare screen shows the second case as text + the principle.
- Old rounds (showcase, reviewed extras) have none of these fields; the player must treat them as absent.

### POST /api/rounds with v4
- Success: `{status: "ok", ok: true, source, seconds, round, spec, checks}`. `round` is the compiled Round above; `spec` is the validated ModelSpec (null for showcase/reviewed).
- **Honest no fit:** if the topic isn't a real concept, no visual fits honestly (e.g. reaction mechanisms, history), or the spec fails validation/checks after one retry (the retry is told which check failed): `{status: "fallback", ok: false, reason, nearest: [{slug, topic, kind: "session" | "reviewed"}] (3, by keyword overlap with the 3 sessions + reviewed extras, padded with the sessions), suggestions: [slug…]}` (`suggestions` = the nearest slugs, kept for the current player). No quiz is made up.
- `checks` for v4: `{kept, dropped, blind_checked: false, blind_ok: 0, blind_failed: 0, unchecked: [], computed: [item ids], model, seconds}`. There is no blind second-model check any more: every v4 truth is computed by code.

## Help chat: `POST /api/help`
Request: `{session_slug | round_slug, screen_id, question, locked, context: {guess?}}`
- `session_slug` / `round_slug`: `birthday`, `coin-streak` (alias `coin`), `positive-test` (alias `ptest`). Optional; if sent it must match the screen's topic.
- `screen_id`: a storyboard screen from docs/experience.md: `B1`-`B7`, `C1`-`C7`, `P1`-`P6`. Unknown screen or wrong topic → 404.
- `question`: 1-300 chars (longer → 422).
- `locked`: true once the guess for this screen's question is locked in. Screens with no guess of their own: send true once the session's guess is locked (C1-C2 and B4 are before a guess, so false there).
- `context.guess`: the learner's own guess (number or short text), optional. Anything else in `context` (e.g. `truth`) is ignored: the server builds the topic, screen description, misconceptions and the true value from `data/rounds` + `api/app/help_context.py`.

Response, always HTTP 200 for a known screen: `{answer: string, hint_only: bool}`
- `answer`: plain text, ≤ 3 sentences, no markdown; points back at the visual on screen.
- `hint_only: true` = a hint, not the answer: before lock-in, or a fallback. Before lock-in the answer is scanned for the true value; if it leaks, the screen's static hint is sent instead.
- Fallbacks (still 200): no key/offline or daily cap hit → `"Help is resting for today; the screen has everything you need: <static hint>"`; per-IP limit hit → `"Lots of questions at once! Give the screen a minute: <static hint>"`. The panel can show the text as is; the session never depends on it.
- Limits: daily cap `HELP_DAILY_CAP` (default 150, plus a shared total with generation at the 480/day soft cap; own `help` bucket in the usage file, shown under `help` in `GET /api/usage`), per IP `HELP_PER_IP` per `HELP_PER_IP_WINDOW_S` (default 10 per 600 s), separate from the round/answer limiters. Model: 3.5 Flash-Lite (minimal thinking), then 3.1 Flash-Lite.

## Truth: what the browser computes (the backend re-derives the same numbers in `api/app/truth.py` for checks)

| `sampler` / `preset` | params | what to compute |
|---|---|---|
| `coin_longest_run` | `n`, `p`, `trials` | Simulate `trials` sequences of `n` flips (P(heads) = `p`). Histogram of the longest run of the same side. Exact mean for n=100, p=0.5 is 6.977. |
| `base_rate_test` | `population`, `base_rate`, `sensitivity`, `false_positive_rate` | Icon array of `population` people: sick = round(pop·base_rate); true positives = sick·sensitivity; false positives = (pop−sick)·fpr. Truth = TP / (TP + FP). 1%/90%/9% → 9.17%. |
| `birthday_match` | `group_size`, `trials` | Simulate rooms of `group_size` people with uniform birthdays over 365 days; share with ≥1 match. |
| `binomial_count` | `n`, `p`, `trials` | Histogram of heads count in `n` flips. |
| `dice_sum` | `dice`, `trials` | Histogram of the sum of `dice` fair d6. |
| curve preset `birthday_match_probability` | x = group size | Exact: 1 − ∏_{i=0}^{x−1} (365−i)/365. 23 → 0.5073. |
| curve `expr` | mathjs subset in `x` (+ the explore param) | numbers, + − * / ^, sin cos tan exp log sqrt abs min max pow. Nothing else (no `**`, no `2x`, no `pi`). |
| `estimate` | the item's `answer_expr` + `unit` | One computed number on a number line against the guess. |

## Reading an answer
- `slider`: sort bands by `min` and take the **first** band with `min ≤ value ≤ max` (inclusive). `misconception_id: null` = correct. The backend lint guarantees bands cover the slider with no gap bigger than one `step`. Backend helper: `api/app/truth.py::band_for`.
- `choice`: the picked `option.misconception_id`; `null` = correct (exactly one per item).
- `sketch`: run `sketch_rules` on the polyline (normalized 0-1). Rule kinds are a fixed list in the schema.
- Name a misconception on the card only after 2+ consistent signals across items; before that, say "this looks like…".
