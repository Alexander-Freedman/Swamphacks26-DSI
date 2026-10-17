# Experience look: how the new sessions look and move (#75)

The visual language for the re-planned sessions (#1, NOTES.md 11:40 PM): guess first, a concrete example you can watch and manipulate, push it to the extremes, your model next to reality, your exact mistake named. It sits on Notebook Arcade (docs/research/visual.md, `web/src/index.css`) and pairs with the storyboard in docs/experience.md.

Mockups (open in a browser, they're interactive): `docs/mockups/coin-streak.html`, `positive-test.html`, `birthday.html`, all on `docs/mockups/look.css`. Screenshots at desktop + phone in `docs/mockups/shots/`.

## The one rule: your model rides along
Your pencil guess never disappears after the reveal. It's on every screen from then on as a dashed pencil mark, so every manipulation is "reality moves, your model stays put, and the marker gap shows where they part". That's how the session reads as one model being corrected, not five slides.
- Guess and sketch → a dashed pencil line / pencil-shaded dots.
- Run it → the same pencil mark sits on the live chart while the ink truth builds up under it.
- Extremes → the pencil mark is pinned at your setting; the slider moves the ink.
- Mistake card → quotes your own number back to you.

## Colors have one job each
| Token | Means | Used for |
|---|---|---|
| ink `--ink` | truth | the live chart, the computed curve, real dots |
| pencil `--pencil`, dashed 3px | you | your guess, your sketch, your sequence |
| marker `--marker` | the gap / your mistake | shading between pencil and ink, the highlight on the run/pile/pair that breaks your model, the mistake's name |
| green `--called` | called it | the CALLED IT stamp only |

Never tell pencil from ink by color alone: dashed vs solid, plus a hand label ("you", "real").

## Manipulation
- **Big, labeled controls.** One slider or one button per screen, thumb ≥ 28px, the value shown in mono next to it, ends labeled in the hand font ("10 flips", "10,000").
- **"Run it" is a verb button** ("flip 100", "test everyone", "add a person"), and the thing it drives animates in place. Results accumulate (dot by dot histogram, a pile, a filling calendar) so repeating feels like progress, not reloading.
- **Speed control instead of skipping:** "run 1,000" plays fast, then settles. Reduced motion jumps straight to the end state.
- Graph paper only inside the play area: the grid means "this is where you touch".

## Extremes
- The slider has **break-point ticks** labeled in the hand font at the values where intuition fails (23 people, 57 people; 1% vs 50% base rate; 10 vs 10,000 flips). Dragging past one gives a short marker flash and a hand note.
- A small inset curve shows the whole range with a dot for the current setting, so you see the shape, not just one number.

## Your model next to reality
- Same axes, same scale, overlaid, never two separate charts. The marker fill between them is the gap.
- One hand-lettered arrow points at the single biggest miss with a short note ("you never wrote a run past 4").

## The mistake, named
- A white card with the stamp, the misconception's short name in marker, one sentence in plain words that uses your number, and one "try it on" next challenge. No points, no streak counter.
- Stamps: CALLED IT (green), CLOSE (amber), or the misconception's short name (red ink).

## Motion budget (from visual.md)
Lock = squash 0.95 + spring back (120 ms). Truth builds 1.2-2 s. Stamp drops in 180 ms with overshoot and a 2px shake. Chrome never animates. `prefers-reduced-motion` gets end states.

## Components this implies for the build
Shared across topics, so step 3 builds them once:
1. `PencilOverlay`: draws the locked guess (line, point, or shaded dots) on any chart.
2. `RunButton` + an accumulator (histogram, pile, calendar) with fast-play.
3. `ExtremeSlider`: log/linear slider with labeled break-point ticks + an inset curve.
4. `GapShade` + `HandNote` arrow.
5. `MistakeCard` (exists as `MisconceptionCard`; rework to quote your number).
6. `SketchPad`: pointer/touch drawing of a curve (birthday), tap-to-paint dots (positive test), tap-a-sequence (coin streak).

## Rules that came out of the mockups
- **Label every number "exact" or "simulated".** Showcase truths are exact (DP / closed form); the "run 1,000" piles are simulated and say so.
- **Seed the first run** so the demo and screenshots are the same every time (`?final` jumps a mockup to its end state).
- **Your-model curve from your own input:** on the coin streak, the dashed "a coin that switches like you" curve is computed from the sequence you tapped. The same idea carries to generated topics: turn the guess into a model, run it, overlay it.
- **Say when the guess is off the chart** ("your guess: 183, off this grid") rather than clipping it.
- **Hand notes are HTML text under or beside the SVG** (with a paper-colored halo when they must sit on a chart), so they never collide with lines on a phone.
- **The ink truth readout is the biggest type on the screen** (9 / 98, 50.7%, 6.98).
- The verdict stamp comes from the round JSON's guess bands; the mistake label comes from the round's misconception.
- **No pill shapes** (#190): buttons, chips, tags, toggles, pickers and toasts use a small 4px corner (they read as cards/stamps, not pills). Use `border-radius: var(--radius-ui)` (set in `web/src/index.css`). Circles are fine for dots, coins and slider thumbs.

## What each mockup shows (screen order)
| Topic | 1 Guess + sketch | 2 Run it | 3 Your model vs reality | 4 Extremes | 5 Mistake named |
|---|---|---|---|---|---|
| Coin streak | tap out 100 H/T; guess longest run | 100-coin strip flips; histogram builds dot by dot; exact mean 6.98 | your grid vs real grid; switch rate 69% vs 50%; runs-by-length | 10 → 10,000 flips; exact expected run (3.66 / 6.98 / 10.30 / 13.62) + "a coin like you" curve | SWITCHED TOO OFTEN; A/B "which is real" try-it |
| Positive test | guess %; paint the 1,000 dots | test everyone; positives fly into piles: 9 / 98 (9.2%) | your pile vs real pile, "these 89 were never sick" | base rate 0.1-50% + false alarms; trustworthy past 9.09% sick; 90.9% at 50% | THE TEST'S ACCURACY IS MY CHANCE; next: a second positive test (50.3%) |
| Birthday | guess people for 50%; draw your curve | fill the room: calendar + pair lines, first MATCH; 1,000 rooms of 23 | your drawn curve vs real, gap shaded | 2 → 366 people; 57 → 99.0%, 366 → certain | MY birthday 5.9% vs any two 50.7%, side by side; next: birth months |

All numbers above are computed in the pages; the python checks are in an HTML comment at the top of each file. Sources: positive test, [APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care) (about 95 of 100 physicians guessed ~75% on a similar case; the answer was 7.7%); coin streak, [Chance (Dartmouth)](https://chance.dartmouth.edu/teaching_aids/Profiles/streaks/section3_3.html) (in a class test, only one invented 100-flip sequence had a run of 5+). The 68-69% human switch rate is a mockup parameter, **unverified**.
