# Tasks

> **Direction:** Mental Models, general version. **Track:** Entertainment & Creative. Name TBD (my call); working name `mm`.
> **Goal now (11:40 PM re-plan, CONTRIBUTING.md):** short, visual sessions that take someone from not getting a concept to a model they can run: guess first, a concrete example you manipulate, push it to the extremes, your model drawn next to reality, your exact mistake named. Every task starts with a plan comment (goal fit, steps, done + screenshot).
> **By morning:** the live site shows at least one full session built from the storyboard. Design stops ~1:00 AM.

Shared board. Every task is a GitHub issue; assign yourself + comment "on it" before starting. Plan: #1. Folders: `web/` = @luanamaldaner, `api/` `shared/schema/` `data/` = @Alexander-Freedman.

## Sessions (from 12:00 AM Sat)

| Issue | Task | Owner | Status |
|---|---|---|---|
| — | docs/experience.md storyboard | @Alexander-Freedman | in progress |
| #75 | Look + interactive mockups for all 3 showcases (docs/experience-look.md, docs/mockups/) | @luanamaldaner | merged (#79) |
| #81 | Coin streak session (`web/src/sessions/coin/`) | @luanamaldaner | building |
| #78 | Birthday session (`web/src/sessions/birthday/`) | @Alexander-Freedman | building |
| #82 | Positive test session (`web/src/sessions/positive/`) | @luanamaldaner | building |

## Build (B1-B3)

| Issue | Task | Owner | Status |
|---|---|---|---|
| #44 | Round schema + 3 showcase fixtures | @Alexander-Freedman | merged (#54) |
| #45 | Skeleton + CI | @Alexander-Freedman | merged (#60) |
| #46 | Gemini client + POST /api/rounds | @Alexander-Freedman | PR #58 (approved) |
| #47 | Generation pipeline (validate, truth, lint, blind check, fallback) | @Alexander-Freedman | PR #63 (approved); check report on the response in PR #80 (approved) |
| #48 | First deploy (Pages now; Vultr/Render Sat) | @Alexander-Freedman | Pages live |
| — | Answer events, "the room" %, collection API | @Alexander-Freedman | PR #72 (approved, replaces #61) |
| #49 | Predict → confidence → lock + Distribution | @luanamaldaner | merged (#62) |
| #51 | Reveal for generated rounds (showcases use their sessions) | @luanamaldaner | PR #64, rebase after #81/#82 |
| #66 | Home (topic box) + Building chip | @luanamaldaner | parked behind #81 (WIP on home-building) |
| #67 | Round summary + Collection | @luanamaldaner | parked behind #81 |
| #68 | Play with it: extremes slider + Estimate widget (from #63) | @luanamaldaner | re-scoped to generated topics; parked behind #81 |
| #71 | How it works drawer (D), reset (Shift+R), status dot | @luanamaldaner | parked behind #81 (WIP on demo-controls) |
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

## QA (fix first, CONTRIBUTING.md §4)

| Issue | Problem | Owner | Plan |
|---|---|---|---|
| #83 | Positive test reveal: NaN, wrong units, 9.2% not shown | @luanamaldaner | replaced by the #82 session |
| #87 | Which-is-real coin item reveal | @luanamaldaner | replaced by the #81 session |
| #89 | Distribution labels tiny on phone, truth line color | @luanamaldaner | sessions + #64 |
| #88 | Round URL / back button | @luanamaldaner | after #81/#82 |
| #85 | Birthday reveal text-only | @luanamaldaner | covered by the birthday session (#78, other side) |
| #86 | Bands too wide | @Alexander-Freedman | |
