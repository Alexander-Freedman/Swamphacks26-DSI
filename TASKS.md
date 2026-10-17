# Tasks

> **Direction:** Mental Models, general version (any topic: predict → lock → truth over your guess → misconception named → come back). **Track:** Entertainment & Creative.
> **Mode:** BUILD since 10:48 PM Fri (docs/build-plan.md). Name TBD (my call); working name `mm`.
> **Gate 1:30 AM:** coin streak plays predict → lock → reveal locally. **9 AM:** a typed topic → a round on the deployed URL.

Shared board. Every task is a GitHub issue; assign yourself + comment "on it" before starting. Plan: #1. Folders: `web/` = @luanamaldaner, `api/` `shared/schema/` `data/` = @Alexander-Freedman.

## Build (B1-B3)

| Issue | Task | Owner | Status |
|---|---|---|---|
| #44 | Round schema + 3 showcase fixtures | @Alexander-Freedman | merged (#54) |
| #45 | Skeleton + CI | @Alexander-Freedman | merged (#60) |
| #46 | Gemini client + POST /api/rounds | @Alexander-Freedman | PR #58 |
| #47 | Generation pipeline (validate, truth, lint, blind check, fallback) | @Alexander-Freedman | |
| #48 | First deploy (Pages now; Vultr/Render Sat) | @Alexander-Freedman | Pages live |
| — | Answer events, "the room" %, collection API | @Alexander-Freedman | PR #61 |
| #49 | Predict → confidence → lock + Distribution | @luanamaldaner | merged (#62) |
| #51 | Reveal sequence + misconception card + Curve + icon array | @luanamaldaner | PR #64 |
| #66 | Home (topic box) + Building screen | @luanamaldaner | in progress (branch home-building) |
| #67 | Round summary + Collection | @luanamaldaner | in progress (with #66) |
| #68 | Play with it: extremes slider | @luanamaldaner | in progress (branch extremes) |
| #71 | How it works drawer (D), reset (Shift+R), status dot | @luanamaldaner | in progress (branch demo-controls) |
| #11 | Sketch input + shape rules | @luanamaldaner | parked: not in the demo script; after B5 if time |
| #29 | Name, one-liner, pitch, Devpost, video script | @Alexander-Freedman | |

## Next (my side)
- B5 visual pass (Notebook Arcade), share card, motion polish, reduced motion
- B6 backup demo video (≤2 min)

## Phase 1: research (done)

| Issue | Task | Owner | Status |
|---|---|---|---|
| #2 | docs/strategy.md: how to win, SwampHacks, ranked project directions | @Alexander-Freedman | merged |
| #5 | Research round 2 (teardowns, prizes, ideas, feasibility, ...; start at docs/README.md) | @Alexander-Freedman | merged via #7 |
| #3 | docs/sponsor-tech.md: live setup checks of sponsor/MLH APIs (builds on prize-strategy + feasibility) | @luanamaldaner | PR up |

## Next
- Research keeps going until I say "we have an idea". Nothing is picked; hazard radar and Mental Models Tool are candidates only. Going deeper: winner teardowns, judge/organizer interviews, per-prize analysis, new ideas, stress tests, pitch outlines + demo scripts.
- Then I pick a direction from docs/strategy.md (ranked: 1 hazard radar for Sperry, 2 Mental Models Tool, 3 hazard radar + sensor, 4 Nessie, 5 Roblox/game)
- No project code until hacking opens Fri ~8pm (event rule)
- Split phase 2 build into issues per docs/first-6h.md: @Alexander-Freedman backend/data/model, @luanamaldaner frontend/demo
- Skeleton (FastAPI + Vite) is on branch alexander-freedman/skeleton; @luanamaldaner reviews once it's a PR
