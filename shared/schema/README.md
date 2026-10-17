# Round contract

`round.schema.json` and `model-spec.schema.json` are generated from `api/app/schema.py` (`cd api && uv run python scripts/export_schema.py`). Don't edit them by hand.

## Engine v4: topic → runnable model spec (#179, player side #184)

The generator no longer writes a quiz. For a typed topic it fills a **model spec** (`ModelSpec`, `model-spec.schema.json`): it picks one of our existing widgets and fills its numbers. Code validates the spec, **computes every truth from it**, and compiles it to a normal `Round`, so the round player keeps working and only needs to learn the new optional fields below.

### The spec (`ModelSpec`)
| field | what |
|---|---|
| `spec_version` | `4` |
| `slug`, `topic` | as in Round |
| `concept` | the idea in plain words (≤ 300) |
| `definition` | one plain sentence defining the topic; the generator must say if the topic isn't a real concept (then: no fit) |
| `case` | the runnable case (`SpecCase`, below) |
| `misconceptions` | 1-3 `Misconception`s (same shape as Round: `id, label, why_tempting, refutation, source_url \| null, source_note`); the **first is the main named mistake**. `source_url: null` = unverified, the UI says so |
| `compare` | optional `{topic, prompt = "What's the same about how these work?", shared_principle, case?}`; `case` uses the **same widget** with a different surface |

`SpecCase`:
| field | what |
|---|---|
| `widget` | `curve` \| `sampler` \| `dial` \| `stepper` |
| `variables` | `[{name, meaning, unit, value}]`: named numbers in plain words; exprs may use the names |
| `curve` | `{expr, x_min, x_max, x_label, y_label, ask_x \| ask_y, knob: {param, label, min, max, step, default}}`: y = expr(x, knob, variables). The asked point is the curve's y at `ask_x`, or the first x where it reaches `ask_y` |
| `sampler` | `{sampler, params, stat, k?, x_label}`: one of our samplers; `stat` says which number is asked (table below) |
| `dial` | `{answer_expr, unit}`: one computed value from the variables (shown on a number line, `truth.widget = "estimate"`) |
| `stepper` | `{steps[2-8], answer_text}`: honest fallback with **no computed truth**, labelled "worked example, not checked" |
| `prediction` | `{prompt, input: "slider" \| "choice", slider?: {min, max, step, unit}, options?: [{id, text, value?, misconception_id}]}` |
| `bands` | slider answers → misconception id or `null` (correct); same rules as below |
| `extremes` | 2-3 `{param, value, watch}`: a knob / sampler param / variable value to try, with one line on what to watch |
| `answer_claimed` | the generator's own number: only cross-checked against the computed truth (> 2% off → rejected), **never shown** |

Sampler stats (all computed exactly in `api/app/truth.py`; probabilities are in **percent** 0-100):
| sampler | stats |
|---|---|
| `coin_longest_run` (`n`, fair coin) | `mean_longest_run`, `p_run_at_least` (k) |
| `base_rate_test` (`base_rate`, `sensitivity`, `false_positive_rate`) | `p_true_positive` |
| `birthday_match` (`group_size`) | `p_match` |
| `binomial_count` (`n`, `p`) | `mean`, `mode`, `p_at_least` (k), `p_equals` (k) |
| `dice_sum` (`dice`) | `mean`, `mode`, `p_at_least` (k), `p_equals` (k) |

### How a spec compiles to a Round (what the player reads)
- `round.spec_version = 4`; `round.concept`, `round.misconceptions` straight from the spec.
- `items[0]` = the main case, `items[1]` = the compare case (only if it has one and it passes checks).
- `curve` → `truth: {widget: "curve", expr, x_min, x_max, x_label, y_label, ask_x | ask_y}` + `explore` = the knob. Variable names are substituted with their values, so `expr` only uses `x` and `explore.param` (same as today).
- `sampler` → `truth: {widget: "distribution", sampler, params, x_label}`.
- `dial` → `truth: {widget: "estimate", unit}`, `answer_expr` with the numbers substituted.
- `stepper` → `truth: {widget: "stepper", steps}`, `computed: false`.
- `prediction` → `input_type` + `slider` / `options` (option `value` is dropped; code checked that the correct option is the one nearest the truth), `bands` as is, `targets` = the misconceptions the bands/options name.
- **New optional item fields:** `truth_value` (the computed answer; null for stepper), `computed` (true = computed by code; false = worked example, not checked; null = older rounds), `variables` (`[{name, meaning, unit, value}]`, for a "what's in the model" panel), `extremes` (`[{param, value, watch, truth_value}]`, where `truth_value` is the answer recomputed by code at that setting, or null).
- **New optional round field:** `compare: {topic, item_id | null, prompt, shared_principle}`. `item_id` points at the compare item in `items` when there is one; otherwise show the compare screen as text only.
- Old rounds (showcase, reviewed extras) have none of these fields; the player must treat them as absent.

### POST /api/rounds with v4
- Success: `{status: "ok", ok: true, source, seconds, round, spec, checks}`. `round` is the compiled Round above; `spec` is the validated ModelSpec (null for showcase/reviewed).
- **Honest no fit:** if the topic isn't a real concept, no widget fits, or the spec fails validation/checks after one retry: `{status: "fallback", ok: false, reason, nearest: [{slug, topic, kind: "session" | "reviewed"}] (3, by keyword overlap with the 3 sessions + reviewed extras), suggestions: [slug…]}` (`suggestions` = the nearest slugs, kept for the current player). No quiz is made up.
- `checks` for v4: `blind_checked` is always false (every v4 item is computed by code, or is a stepper labelled "worked example, not checked"); `unchecked` lists stepper items; `computed` lists items whose truth code computed.

- `GET /api/rounds` → `[{slug, topic, reviewed}]`
- `POST /api/rounds {topic}` → `{status: "ok", source, seconds, round, checks}` or `{status: "fallback", suggestions: [slug…]}` (any failure, offline, quota, rate limit 12/h per IP → 429)
  - `source`: the model id that wrote it, `"cache"`, `"showcase"` (topic matches a showcase's topic or slug; no model call), or `"reviewed"` (topic matches a hand-reviewed extra's topic, slug or alias after `normalize_topic`; no model call).
  - `checks`: the generation check report, for the "How it works" drawer: `{kept: int, dropped: [{item_id, reason}], blind_checked: bool, blind_ok: int, blind_failed: int, unchecked: [item_id], model: str, seconds: float}`. `model` is the model that wrote the round, `seconds` is how long generation + checks took that first time. The cache keeps it, so a cached topic returns the same report. `blind_checked` is true only when a blind answer actually came back and was compared (`blind_ok` items); `blind_failed` counts items whose blind call errored, timed out, hit the cap or didn't parse. `unchecked` lists kept items with no computed answer and no blind answer, so the UI must not call them checked; items with a computed truth are never blind-checked (code wins). `dropped` items are already removed from `round.items`.
  - `checks: null` for showcase/reviewed rounds (hand-checked, nothing generated) and for rounds cached before reports were stored.
- `GET /api/rounds/{slug}` → a `Round` (showcase or reviewed extra)
- Showcase rounds live in `data/rounds/*.json` (`reviewed: true`).
- Reviewed extra topics live in `data/rounds/extra/*.json`: a `Round` plus a top-level `aliases: [str]` (ignored by `Round`). Not listed by `GET /api/rounds`. The static site gets them at `/rounds/extra/<slug>.json` with `/rounds/extra/index.json` = `[{slug, topic, aliases}]`; match a typed topic the same way (lowercase, non-alphanumerics except `+#` to spaces, collapse spaces).

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
- Limits: daily cap `HELP_DAILY_CAP` (default 300, own `help` bucket in the usage file, shown under `help` in `GET /api/usage`), per IP `HELP_PER_IP` per `HELP_PER_IP_WINDOW_S` (default 10 per 600 s), separate from the round/answer limiters. Model: 3.5 Flash-Lite (minimal thinking), then 3.1 Flash-Lite.

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
