# Scorecard: the current demo vs the XII rubric

**Mode: BUILD.** This grades the demo **as a judge would see it right now**, not the plan. The script it's graded against is docs/demo-script.md (the three visual sessions, rewritten Sat ~12:45 AM). Re-grade after every gate in the re-plan (docs/build-plan.md, top) and after every merge that changes what a judge sees.

Scores are 1-5 gut calls against the 7 official Devpost criteria. They're not data.

**Last graded:** Sat Oct 17, ~12:45 AM (after the re-plan, before any session is built).

## What exists right now (honest)
- **Live site** (https://alexander-freedman.github.io/Swamphacks26-DSI/): the old flow. Pick a showcase round, one guess (slider + confidence + lock), then a histogram / text verdict. That's the "two slides" the vision note (NOTES.md, Oct 16 ~11:40 PM) says is **not the product**.
- **Sessions:** the scaffold is on main (`web/src/sessions/registry.ts`, `?session=` entry from Home, #91). **No session is registered yet.** Birthday (#78, me) is first; coin streak (#81) and positive test (#82) are @luanamaldaner's.
- **Design:** storyboard (docs/experience.md) and look (docs/experience-look.md) are done, with interactive mockups for all three topics in `docs/mockups/*.html` and static PNGs in `docs/experience/`. Strong, but they're mockups, not the app.
- **Reveal + misconception card + Curve widget:** in review, PR #64 (@luanamaldaner). Not on main.
- **Backend (local only):** generator + `POST /api/rounds` (#58), checks + estimate widget (#63), checks on the response (#80), answer events (#72): all open PRs. No public backend.
- **Typed topics:** measured, and not good enough to lead: median 27 s, p90 51 s, every item a plain estimate, some wrong answers slipped past the checks, and the blind check timed out while reporting a pass (NOTES.md, Sat ~12:10 AM). It's now a labelled extra from a reviewed cache, and the blind check is being fixed.
- **Not built:** pencil overlay, run-it accumulators, extremes slider, sketch pad, notebook/collection, reset shortcut, "How it works" drawer.

## Grades

| Criterion | Now | Why now | Once the 3 sessions are live | What that needs |
|---|---|---|---|---|
| **Technical Understanding** | **3** | The engine is real and I can explain it, and I have honest measured numbers (27 s median, the blind-check failure). None of it is visible, and the visible app is simple. | **4** | Sessions with exact math computed in the browser and labelled "exact" vs "simulated"; the blind check fixed or removed; a drawer or one slide showing truth-from-code. 5 needs the fixed blind check with a measured pass rate. |
| **Innovation & Creativity** | **2** | On screen it's a slider and a verdict: looks like any quiz. The idea only shows in the mockups. | **4** | Your pencil model riding along under the ink truth, drawing your own curve, the pair lines webbing up. 5 needs the "a coin like you" curve (your own sequence turned into a model) or the same trick on a typed topic. |
| **Functionality** | **2** | One guess per round works end to end on the public URL; nothing of the new demo does. | **4** | Birthday, coin streak, positive test playing end to end on desktop + phone, seeded, with the local offline build rehearsed. 5 needs the typed-topic extra working from the cache and the notebook. |
| **Design & Usability** | **2** | Notebook Arcade tokens are applied to main, but the screens are sparse and there's no motion. The mockups are a 4 on their own. | **4** | The look doc's components (pencil overlay, marker gap, stamp, big labelled sliders), reduced motion, phone layout. 5 needs the user-test fixes from Sat 1:30 PM. |
| **Purpose & Audience** | **3** | The "understanding vs recall" story is clear and sourced, but no user evidence. | **4** | A session that visibly takes a judge from wrong to right in 2 minutes is the evidence. 5 needs user-test lines (filled in from real tests, not invented). |
| **Track & Challenge Relevance** (Entertainment & Creative Tech) | **2** | The track is judged on feel (track-entertainment.md); what's live has none. | **4** | Guess → watch it move → draw → stamp is a toy you want to touch. 5 needs motion polish and the "come back tomorrow for a remix" loop working. |
| **Sponsor Challenge Criteria** | **2** | **Gemini:** real in the backend, invisible and now demoted to an extra, so 2. **Easy On The Eyes:** 2 (mockups strong, app sparse). **Domain:** 1 (not registered). | **3** | Easy On The Eyes rises to 4 with the sessions. Gemini stays modest (the typed-topic extra); being honest about it beats overselling it. Domain needs a pointer + QR. |
| **Track fit (prize odds)** | **2** | Today we'd lose to anything with a game feel. | **4** | Same as Track Relevance; the visual, hands-on sessions are exactly what this track rewards. |

**Total now: 16 / 35** (7 criteria, the prize-odds row not counted). **Once the 3 sessions are live: 27 / 35.** Target at freeze: 30+.

## Biggest gaps, in order (by points per hour)
| # | Gap | Owner | Est. hours | Est. points | Gate |
|---|---|---|---|---|---|
| 1 | **Birthday session live on Pages**, B1 → B6, desktop + phone, seeded. It's the demo's hook and the template the other two copy (pencil overlay, sketch pad, extremes slider, stamp card). | me (#78) | 4 | +5 (Func, Innov, Design, Track, Purpose) | Sat 6:00 AM |
| 2 | **Merge the reveal + card + Curve widget** (#64), so sessions reuse them instead of rebuilding. | @luanamaldaner, me reviewing | 0.5 | +1 (Design) and saves hours on #1 | now |
| 3 | **Coin streak session** (C1-C2 at least, then C3-C6). The 30-s "can you fake randomness?" taste in the script. | @luanamaldaner (#81) | 3 | +2 (Innov, Track) | Sat 9:00 AM |
| 4 | **Positive test session** (P1-P5). The second showcase. | @luanamaldaner (#82) | 3 | +1.5 (Purpose, Func) | Sat 9:00 AM |
| 5 | **Honest blind check** (or remove it) + the typed-topic extra from the reviewed cache with the auto-checked label. Without it the Q&A answer on correctness is weaker. | me | 2 | +1.5 (Tech, Gemini) | Sat 9:00 AM |
| 6 | **Session end + notebook + reset shortcut.** "Saved. Come back tomorrow for a remix", caught → busted; `Shift+R` / `?reset=1`. | both, after the sessions | 2 | +1 (Track, Func) | Sat 6:00 PM |
| 7 | **User test round 1** (5 people on the 3 sessions) and the fixes. | both | 3 | +1.5 (Purpose, Design) | Sat 1:30 PM |

**Next loop:** build the birthday session (gap 1) on the scaffold, review #64 so it can be reused, re-grade here when birthday is on Pages.

## History
- Fri Oct 16 ~11:20 PM (B1): graded the old plan (3 showcase rounds as one-guess items + the judge's live topic as the headline): 16 / 35, biggest gaps were the coin-streak card, the "How it works" drawer and hosting the live topic. The vision note (Oct 16 ~11:40 PM) and the generation trial (Sat ~12:10 AM) replaced that plan with visual sessions; that version is in git history for this file.
- Before the direction was picked (Fri ~9:50 PM), this file compared the candidates from docs/strategy.md; I picked Mental Models, general version, on the Entertainment & Creative Technology track. Full table in git history.
