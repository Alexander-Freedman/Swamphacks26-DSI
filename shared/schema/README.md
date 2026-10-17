# Round contract

`round.schema.json` is generated from `api/app/schema.py` (`cd api && uv run python scripts/export_schema.py`). Don't edit it by hand.

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
