# Round contract

`round.schema.json` is generated from `api/app/schema.py` (`cd api && uv run python scripts/export_schema.py`). Don't edit it by hand.

- `GET /api/rounds` → `[{slug, topic, reviewed}]`
- `POST /api/rounds {topic}` → `{status: "ok", source, seconds, round}` or `{status: "fallback", suggestions: [slug…]}` (any failure, offline, quota, rate limit 12/h per IP → 429)
- `GET /api/rounds/{slug}` → a `Round`
- Showcase rounds live in `data/rounds/*.json` (`reviewed: true`).

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
