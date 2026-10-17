# Frontend build plan: any-topic version (#32)

The plan for my half (UI, reveals, demo) so I can start the minute we switch to BUILD. It lines up with the engine schema in docs/research/any-topic-engine.md (#20, on alexander-freedman/research-mm) and merges it with my reveal grammar in docs/research/reveal-patterns.md (#24). It's a plan only, with no code. Checked Oct 16 2026 ~10:30 PM.

## TL;DR
- **The backend owns the contract.** I render the #20 session JSON as is: `misconceptions[]`, one `truth {widget, params}`, `items[]` (mcq / numeric / order / tf_reason). I add one item type on top: **`sketch`** (draw the curve or the histogram), because drawing is the hook and the ghost moment (#24, #25).
- **Every widget = `compute(params, inputs)` in a pure TS file + a React view.** The same `compute` runs in the browser for the reveal and in vitest. The backend can mirror it, or just call the TS once via the cached showcase JSON. One source of truth for the math.
- **Build order (my side):** shell + session player on mocks → `probability_sim` (coin streak, bayes_test) → `function_plot` + sketch → misconception card → fallbacks (`stepper`, `claim_cards`) → `compare_bars` → streak/deck → polish. Coin streak + positive test are demoable by **~hour 8**.
- **Reuse from the paused branches:** `api.ts` mock client + Source chip (PR #10), and `geometry.ts` (resample, view transforms), `ink.ts`, stage CSS and the pen handling from OffTheEdge (luanamaldaner/pen-input). OffTheEdge itself becomes the `motion_sim` projectile view later, only if time allows.
- **One flag for the research-mm branch:** it currently commits `web/node_modules` (~689 files, 970k lines incl. native `.node` binaries) and `api/**/__pycache__`. Those need dropping before it's a PR. Details are on #1.

## 1. How my reveal types map onto the #20 widgets

| #20 widget | My reveal (#24) | Prediction input | Reveal | Priority |
|---|---|---|---|---|
| `probability_sim` | Distribution | slider / numeric, or drag bars | seeded trials stream in (x1 → x10 → x1000), your guess stays as a pencil line | **P0** (coin streak, bayes_test dots) |
| `function_plot` | Curve | **sketch** on fixed axes, or mcq | truth wipes in over the pencil stroke (clipPath tween), gap shaded, one callout at the max gap | **P0** |
| `stepper` | — | none / numeric at a step | steps reveal one by one, `expr` evaluated | **P0** (default fallback) |
| `claim_cards` | — | true/false per card + confidence | card flips, verdict stamp | P1 (qualitative fallback) |
| `compare_bars` | Estimate | drag bar heights (log toggle) | true bars grow over your pencil outlines, the "off by 10x" bracket | P1 |
| `distribution` | Distribution | drag bars | live sampling into a histogram | P2 (shares the probability_sim view) |
| `timeline` | Order | drag cards onto an axis | cards slide to true slots (FLIP), crossing lines | P2 (first cut on both sides) |
| `motion_sim` | Trajectory | draw the path | ghost race (OffTheEdge) | P2 (showcase #3 only) |

`distribution` and `probability_sim` share one histogram/dot view with different samplers, so P2 there is cheap.

### The one schema addition I'm asking for
```jsonc
{ "id": "q0", "type": "sketch",
  "stem": "Sketch the slope of x^3 - 3x",
  "target": "truth",               // draws on the session's function_plot / distribution axes
  "misconception_rules": [ { "kind": "corr_with_context", "gt": 0.9, "misconception_id": "m1" } ] }
```
Grading is ours: sample the stroke at the plot's x-bins, then score = 1 - normalized area between the curves. The rules are deterministic shape checks (sign at x, slope sign, corr with the context curve, mode below x). If the engine can't produce `misconception_rules`, I fall back to the biggest-gap callout with no named misconception. So `sketch` is safe to add late.

## 2. File layout (web/src)

```
api.ts                  mock/live client (from PR #10). Mocks: src/mocks/session_<slug>.json
types.ts                Session, Item, Misconception, Truth: copied from the engine's zod schema
session/
  SessionPlayer.tsx     one item per screen: predict → lock → reveal → card → next
  useSession.ts         state machine (idle | predicting | locked | revealing | carded | done)
  score.ts              closeness % per item type
items/                  the prediction inputs
  Mcq.tsx  Numeric.tsx  Order.tsx  TfReason.tsx  Sketch.tsx
widgets/                each = compute.ts (pure, tested) + View.tsx
  probability/ { samplers.ts, samplers.test.ts, DotGrid.tsx, Histogram.tsx, StreakTiles.tsx }
  functionPlot/ { compute.ts (mathjs whitelist), compute.test.ts, Plot.tsx }
  stepper/  claimCards/  compareBars/
  registry.ts           widget name → { compute, View }; unknown name → stepper
reveal/                 the shared grammar from #24
  Lock.tsx (commit + confidence)  Wipe.tsx (clipPath tween)  GapShade.tsx  Callout.tsx
card/MisconceptionCard.tsx        label + why_tempting + refutation, never the answer as text
deck/  Deck.tsx  streak.ts        misconceptions caught/fixed, streak with a repair path (#22)
pen/   from pen-input: geometry.ts, ink.ts, the pointer handling from OffTheEdge
theme/ tokens.css (Notebook Arcade, #26), fonts
```

Rules: widgets never fetch; they get `params` + the user's inputs and return `{ truth, perItem }`. The truth isn't computed until Lock (no peeking in the DOM, #24 rule 1). `prefers-reduced-motion` skips every tween.

## 3. Libraries (exact pins at install; versions checked on npm Oct 16)
| Need | Package | Version |
|---|---|---|
| Expression eval, no `eval` | mathjs | 15.2.0 |
| Seeded RNG | seedrandom | 3.0.5 |
| Scales/paths (not full d3) | d3-scale 4.0.2, d3-shape 3.2.0 | |
| Pencil strokes | perfect-freehand | 1.2.3 |
| Tweens, FLIP layout | motion | 14.3.0 (published Oct 15, so pin the prior minor if 14.3.0 misbehaves) |
| Sketchy frames (2-3 only) | roughjs | 4.6.6 |
| Fonts | @fontsource/shantell-sans, @fontsource/atkinson-hyperlegible-next | 5.3.0 |
| Schema validation | zod | 4.6.7 (share the schema file with the backend if it's TS; else mirror pydantic) |
| Tests | vitest | 5.0.5 |

No component library. Plain CSS with tokens, as in PR #10.

## 4. Hour-by-hour (my side, from "start building")

| Hours | Deliverable | Demoable? |
|---|---|---|
| 0-1 | Shell: rebase PR #10 onto main (it's stacked on the skeleton), tokens + fonts, `types.ts` from the #20 schema, hand-written `session_coin_streak.json` + `session_positive_test.json` mocks | mock loads |
| 1-3 | `SessionPlayer` + `useSession` + `Numeric` + `Mcq` + `Lock` with confidence | answer → lock works |
| 3-6 | `probability_sim`: samplers (coin_streak, bayes_test, monty_hall) with tests, `StreakTiles`, `DotGrid`, `Histogram`, staggered reveal | **coin streak end to end** |
| 6-8 | `MisconceptionCard` + score + next item; positive-test 1,000-dot sort | **showcase #1 + #2 (the demo spine)** |
| 8-11 | `function_plot` compute (mathjs whitelist) + `Plot` + `Sketch` + `Wipe` + `GapShade` + `Callout` | calculus sketch item |
| 11-13 | Fallbacks: `stepper`, `claim_cards`; registry routes unknown widgets to them; hook to the live API (topic box, "building your session" chip) | judge topic path |
| 13-15 | `compare_bars`, `Order` | Fermi/scale topics |
| 15-18 | Deck + streak, share card ("my guess vs reality"), attract loop screen | Entertainment layer |
| 18-22 | Polish pass (juice, sound with visual twins, mobile), hallway test round 1, fixes | |
| 22+ | `motion_sim` via OffTheEdge if green; video capture; round 2 | |

That's ~22h of my time inside the 36h window, which leaves room for sleep, judging prep and fixes.

### Cut list (in this order, if I'm behind)
1. `motion_sim` / OffTheEdge → 2. `timeline` + `Order` → 3. `compare_bars` → 4. share card → 5. sound → 6. `sketch` (function_plot keeps mcq input).
Never cut: coin streak + positive test reveals, the misconception card, the stepper fallback, mock mode (it's our offline demo).

## 5. What I need from the backend side, and when
| What | Why | By |
|---|---|---|
| The session schema as a file (zod or JSON Schema) | `types.ts` + validating mocks | hour 1 |
| One real generated session JSON for any topic | proves the mocks are shaped right | hour 4 |
| `POST /api/session {topic}` streaming or not, plus a `source: reviewed|fresh` field | live topic path + the honest label | hour 11 |
| The showcase sessions frozen as JSON in the repo | offline demo + bundle them in the web build | hour 14 |

## 6. Testing
- vitest on every `compute.ts` / sampler: fixed seed → fixed output, and coin streak stats vs my 200k run (mean longest run ~7.0, P(≥5) ~97%).
- Mock mode (`npm run dev:mock`) is the default for all UI work, so the frontend never waits on the API.
- Before each PR: `npm run build` + `npm test` + a click-through of both showcase topics. CI from docs/ci.md once the skeleton is merged.

## Open questions
- Does the backend want to own `compute` in Python as well, or trust the TS one for showcase JSON? (I'd say TS only, and the backend checks `answer_expr` with its own mathjs-equivalent for linting.)
- `sketch` item: OK to add to the schema? It's the one place the "draw your guess" hook lives.
