# Research queue

Ranked by how much the answer changes what we do. Each pass takes the top open question, answers it with sources into the right doc, marks it done, and adds the 2-3 new questions it raised. The queue is never empty.

## Open
Direction is Mental Models, any-topic (Oct 16 ~9:50 PM). Hazard/Sperry questions are parked at the bottom.

1. Off the Edge has no good adult error-rate source. Swap it for "ball dropped while walking" (McCloskey 1983), or drop it? Goes in the spec for review. → docs/research/demo.md
2. Log real longest-streak guesses at the event (first 10 testers) so the pitch has our own number instead of an unverified one. → docs/research/showcase-facts.md
2b. Grid guess input: tap-to-fill vs a slider with a live grid preview. Which gives a more accurate guess (people mark blank grids badly)? → docs/research/frontend-plan.md
3. Can question 1 run as its own parallel Gemini call, and what does that cost in quota? Does partial-JSON parsing of the stream hold up with our schema? → docs/research/demo.md
3b. Real time-to-first-token on venue wifi vs a hotspot (time 20 random topics Sat, log in NOTES.md). → NOTES.md
4. Does the `sketch` item fit in the #20 schema, and which misconception signal does it give per showcase topic? → docs/research/frontend-plan.md
5. Who runs each test round (the driver can't also take notes), and does round 2 use the same task card or one changed from round 1's issues? → docs/plan-extras.md
8. Which judging sheet do judges actually get: Devpost's 7 criteria or the rules page's 5? (Ask at the help desk.) → strategy.md.
9. Cash split: the guide says among team members, the rules say four ways regardless of size. (Ask at the help desk.) → strategy.md, prizes.md.
19. What goes on the table tent card and the 10-20 s attract loop? → expo-video.md
23. Does the Vultr MLH credit need a credit card? (Ask at the MLH desk.) → 36-hour-plan.md
31. Which Gemini calls should run in the first hour so the showcase topics are cached before the venue wifi gets busy? → kickoff.md

### Parked (hazard direction, dropped)
17, 26, 27, 29 (Sperry/sensor questions); keep for reference only.

## Done
- Icon arrays: yes for single-proportion + Bayes items, 10x10 filled row by row, truth builds in over ~1.2 s, guess as pencil outline → docs/research/reveal-patterns.md
- Saturday user testing plan: round 1 Sat lunch 1:30pm, round 2 dinner 8pm, WERT Lab Lobby; task card + log table → docs/plan-extras.md (also fixed meal times and nap slots there)
- Base-rate card facts (Manrai 2014 14/61 correct; Gigerenzer & Hoffrage 16% vs 46%) and no study on longest-streak guesses → docs/research/showcase-facts.md
- Showcase facts (coin streak DP: expected longest run 6.98, P(6+)=80.7%; Falk & Konold alternation .56-.63; Wason 22/29 wrong first; hypercorrection 87% vs 61%, modest r) → docs/research/showcase-facts.md
- Live-topic latency budget: first question ≤5 s target, 15 s OK, 20 s cutoff to cached chips → docs/research/demo.md
- What one person can start alone at 8:30 → kickoff.md
- First 30-60 min setup steps at 8:30 → kickoff.md
- What DSI judges check in a repo → ai-ml-track.md
- Winners rarely quantify user testing (none gave counts or quotes) → 36-hour-plan.md B4
- Go/no-go board layout + replay data plan → hazard-board-replay.md
- CI setup → ci.md
- Every prize, red team, lean stacks, Best Overall simulation → prize-strategy.md and friends
- Official event facts: times, expo format, tracks, challenges, prizes, CpE lab hardware list, schedule → strategy.md, 36-hour-plan.md
- AI-tools disclosure: draft sent to #questions for approval
- Design method + one depth feature per candidate → design-depth.md
- User testing (2 rounds of 5), 2 timeboxed prototypes, repo rules for 2 people + 2 assistants, sleep schedule → plan-extras.md, 36-hour-plan.md
- Deploy path (Vultr + Caddy + sslip.io, Render fallback) and provenance UI patterns → deploy-provenance.md
- Where AI tools are slow (METR, SO 2025, package/API errors, embedded), what judges reward once everyone ships fast, realistic task ranges → ai-era.md, 36-hour-plan.md
- Expo table craft, 2-hour video workflow with tested ffmpeg commands, Devpost checklist → expo-video.md
- Sperry's last-challenge winners + spec for our entry (go/no-go board, provenance drawer, stop-work CI test) → sperry-deep.md
- Hazard index design: label, leakage traps, model, eval, the calibration chart; GLM is too slow for training, NCEI strike tiles used instead → hazard-ml.md
- How judges score (all events), SwampHacks XII rules, prizes and history → strategy.md
- Winner teardowns, judge quotes → teardowns.md
- Per-prize analysis, Sperry brief → prizes.md
- 18 ideas + stress tests → ideas.md
- Feasibility, libraries, hours → feasibility.md
- Data reachability + replay day → data-check.md
- Judges by org → judges.md
- Fact-check of 24 claims → corrections across the docs
- Paper-card input → sketch-input.md
- Beat the Fingerprint deep dive → ideas.md
- Mental Models deep dive (how to beat Loomin, eval plan, build order) → ideas.md
