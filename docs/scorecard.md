# Scorecard: the current demo vs the XII rubric

**Mode: BUILD.** This grades the demo **as a judge would see it right now**, not the plan. The script it's graded against is docs/demo-script.md. Re-grade after every gate and after every merge that changes what a judge sees (build-plan "Hourly").

Scores are 1-5 gut calls against the 7 official Devpost criteria. They're not data.

**Last graded:** Fri Oct 16, ~11:20 PM (B1).

## What exists right now (honest)
- **Backend (local only):** round schema + 3 hand-checked showcase rounds (`data/rounds/`, merged #54). Gemini generator + `POST /api/rounds` with a per-IP limit (PR #58, open). Generation checks: computed truth, band/claim agreement, lint, blind check, estimate widget (PR #63, open). Answer events in local SQLite, room % + collection (PR #61, open).
- **Frontend:** predict → confidence → lock + the Distribution widget for the coin streak is **in review in PR #62** (@luanamaldaner). Not on main.
- **Not built:** the reveal sequence (beat, ink over pencil, shaded gap, verdict stamp), the misconception card, the Curve widget (birthday), the positive-test dot array, the Estimate widget UI, the live-topic flow in the browser, the "How it works" drawer, the collection screen, the reset shortcut, the Notebook Arcade visual pass.
- **Hosted:** only the static GitHub Pages shell. No backend is reachable from the public site. No domain yet.
- **Not measured yet:** live generation time on our key (gemini.md §4 is still an estimate) and the generation pass rate.

## Grades

| Criterion | Now | Why | What gets it to 5 |
|---|---|---|---|
| **Technical Understanding** | **3** | The pipeline is real and I can explain every step (spec → computed truth → checks → blind second model). But there's no measured number yet (pass rate, latency) and a judge can't see any of it. | The drawer showing JSON + computed truth + check results; one pass-rate number and one latency number from our own runs; both of us pass the drill in pitch.md. |
| **Innovation & Creativity** | **3** | The idea is the strongest part (bet first, truth computed, the wrong idea named and tracked). On screen today it's a slider and a histogram, which looks like any quiz. | The reveal over the pencil guess + the misconception card landing on the judge's own answer, then their own topic built live. |
| **Functionality** | **2** | Nothing plays end to end in a browser on main. The backend works locally; the coin-streak flow is in an open PR. | All 3 showcases + a typed topic playing on the public URL, with the fallback ladder and the no-network build rehearsed. |
| **Design & Usability** | **1** | Main is a shell. No look applied yet. | Notebook Arcade applied everywhere (pencil/ink/marker, stamp, springy lock-in), one idea per screen, reduced motion, contrast checked, 5 user tests with fixes. |
| **Purpose & Audience** | **3** | The story is clear and sourced (product-spec §1-2, pitch.md), but there's no user evidence and no screen shows who it's for. | User-test lines from B4/B6 (a line like "N of 5 guessed 4 or less", filled in from real tests), the home screen speaking to a student ("What confuses you?"). |
| **Track & Challenge Relevance** (Entertainment & Creative Tech) | **2** | The track is judged on feel (track-entertainment.md): reveal, juice, collection, story. None of that is on screen yet. | The reveal moment with motion and a verdict stamp, the misconception "cast" in a collection, one cohesive art style. |
| **Sponsor Challenge Criteria** | **2** | **Gemini:** real use in the backend (3.5 Flash-Lite generates, Gemma blind-checks) but invisible to a judge, so 3. **Easy On The Eyes:** 1 (no design yet). **Domain:** 1 (not registered, nothing hosted to point it at). | Gemini visible in the drawer and the live beat; the visual pass; the domain + QR on the table pointing at a hosted backend. |
| **Track fit (prize odds)** | **2** | Right track for the product, but today we'd lose to anything with a game feel. Juice + purpose beat juice alone at XI (SignHero vs FortBox). | Same as Track Relevance; plus the "the entertainment is the learning" line (Crouch et al. 2004) in the pitch. |

**Total now: 16 / 35** (7 criteria). Target at freeze (Sat midnight): 30+.

## Biggest 5 gaps, ranked by points gained per hour
Points = my estimate of rubric points gained across all criteria. Hours = estimate for whoever owns it.

| # | Gap | Owner | Est. hours | Est. points | Points/h |
|---|---|---|---|---|---|
| 1 | **Coin streak plays on the public URL with the misconception card.** Review + merge #62, add the card (data is already in the round JSON), redeploy Pages. | @luanamaldaner (card), me (review, merge, deploy) | 1.5 | +3 (Func, Innov, Track) | **2.0** |
| 2 | **"How it works" drawer.** Round JSON beside the computed truth and the check results from #63; plus one measured pass rate and latency logged in gemini.md. | me | 1.5 | +2.5 (Tech, Gemini, Innov) | **1.7** |
| 3 | **Live topic in the browser, hosted.** Merge #58/#63/#61, host the backend (Vultr when the code arrives, Render otherwise) with HTTPS + CORS + per-IP limit + daily cap, frontend calls `POST /api/rounds` with the building chip and the 20 s fallback chips. | me (backend, host), @luanamaldaner (chip UI) | 3.5 | +3.5 (Func, Tech, Innov, Gemini) | **1.0** |
| 4 | **The reveal sequence.** ~400 ms beat, ink truth over the frozen pencil guess, shaded gap, verdict stamp. Shared by every widget. | @luanamaldaner | 2.5 | +2 (Track, Design) | **0.8** |
| 5 | **Notebook Arcade visual pass.** Tokens, fonts, stamp, springy lock-in, reduced motion. | @luanamaldaner (I can take the tokens/fonts if her queue is full) | 3 | +2 (Design, Easy On The Eyes) | **0.7** |

Just below the line: the positive-test dot array + Curve widget for the birthday problem (~3h, +1.5, 0.5/h). The 90-second demo doesn't need them; the 3:00 one does, so they come right after #5. Also small and cheap whenever someone has 20 minutes: the reset shortcut (`Shift+R` / `?reset=1`).

**Next loop:** review and merge #62, merge my open PRs (#58, #61, #63) once CI is green, redeploy Pages, then build the drawer (gap 2) while @luanamaldaner adds the misconception card (gap 1). Re-grade here after that.

## History
Before the direction was picked (Fri ~9:50 PM), this file compared the candidates from docs/strategy.md against the same 7 criteria: hazard radar (A, plus a hardware variant A+), the Mental Models tool (B, plus a Sketch-to-Sim variant B+), Bridge Oracle (C), Beat the Fingerprint (E) and a scam-call interceptor (D). The hazard radar had the best expected prize count (Sperry slots), B+/A+ the most memorable Overall shot, and B the lowest build risk. I picked Mental Models, general version, on the Entertainment & Creative Technology track; the full table is in git history for this file.
