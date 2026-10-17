# Tasks

**Goal:** short, visual sessions that take someone from never seeing a concept to a mental model they can run (guess first, play with it, see your model next to reality, your exact mistake named, come back). Track: Entertainment & Creative.
**Mode:** BUILD (NOTES.md). Gates: docs/build-plan.md (top). Grades + gaps: docs/scorecard.md.
**Live now:** https://alexander-freedman.github.io/Swamphacks26-DSI/ (Pages, main at e09f264)
- Three sessions end to end, desktop + phone: birthday, coin streak, positive test (`?session=<slug>`)
- Notebook (`?notebook=1`), reset (`?reset=1`), URL/Back per session
- Name is **Onionskin** in the app (#142)
- **No backend deployed**: no typed topics, no help chat, no room % on the live site

Rules: every task is an issue; assign yourself + comment "on it" before starting; plan comment first (CONTRIBUTING.md). Folders: `web/` = @luanamaldaner, `api/` `shared/schema/` `data/` `docs/` = @Alexander-Freedman.

Updated Sat Oct 17 morning. Supersedes #70.

## Now

### Mine (@Alexander-Freedman: backend, deploy, data, birthday, docs)
| Issue / PR | What | Status | Next step |
|---|---|---|---|
| #146 | Doctor statistic on the positive card + demo script matches live | approved | merge, redeploy Pages |
| #145 | Favicon: Onionskin mark | approved | merge, redeploy Pages |
| #135, #152 | Birthday: "Called it." after a missed rematch; phone label sizes | open | fix in one birthday PR |
| #149, #150 | One session shell for all three; called-it card copy | shared with @luanamaldaner | agree on the shell on #149, then I do birthday, she does coin + positive |
| #118 / #116 | Backend deploy kit (Vultr Caddy + systemd, Render fallback) | PR up | deploy once a host account exists (blocked) |
| #103 / #100 | Answer events on Tiger, SQLite fallback | PR up | merge; room % shows after deploy |
| #121 | Scorecard re-grade vs live (25/35) | PR up | merge; re-grade after #136 is on Pages |
| #129 | README for judges | PR up | review |
| #123 | Pitch 3:00 + 1:30, judge Q&A | PR up | review; update after user tests |
| #125 | Notes: name is Onionskin | PR up | merge (app rename already in #142) |
| #131 | DEV post draft | PR up | publish only after the event |
| #29 | Story: pitch, Devpost, video script | open | AI-disclosure draft to #questions |
| #45, #47, #48 | Skeleton/CI, pipeline, first deploy | mostly done | close #45/#47; #48 waits on the host account |

### @luanamaldaner (orgo, Home, notebook, look)
Updated Sat ~7:30 PM. Orgo build/push #204, Undo #209 and the topic menu #211 are merged.
| Issue / PR | What | Status | Next step |
|---|---|---|---|
| #213 / #215 | Orgo: SN1, E2, E1 (draw the arrows per step, watch it run, mistakes named) | PR up | review, merge |
| #216 / #218 | Orgo: SN2 vs E2 side by side (same HO⁻, predict each path, one slider) | PR up, stacked on #215 | merge after #215 |
| #194 / #205 | No betting language, confidence picker gone, new headline | PR up | review, merge (blocks "no bets" in the Devpost) |
| #214 | Home leads with subjects: orgo, calculus | PR up | review, merge |
| #68 | Extremes slider for generated topics | open | cut if short on time |
| #11 | Pen input | parked | not in the demo |

## Next (gate order)
1. **Sat 1:30 PM: user tests round 1** (both). 3-5 people, one session each, kit in docs/user-testing.md (#120). Log guess, confidence, verdict, one quote. Top 3 fixes go in as issues.
2. **Backend deploy + help chat panel** (me: deploy #118, API from #105; @luanamaldaner: panel). Starts the moment a host account exists. Per-IP limit, daily cap, demo token. Then point the frontend at it.
3. **Sat 4:00 PM: help-chat gate.** If it slips: static per-screen "stuck?" hint (cut line 1b).
4. **Sat 6:00 PM:** fixes from testing, Home that sells the sessions (#144, #136), one shell (#149).
5. **Sat 10:00 PM: design pass + motion; backup video recorded** (both). Feature freeze at midnight.
6. **Sun 12-4:30 AM:** README, Devpost write-up, disclosure wording final.
7. **Sun 7:30 AM: submit** (Devpost closes 8:30 AM). Expo 10 AM-12 PM, closing 2:30 PM.

## Blocked / needs a human
- **Host account for the backend** (Vultr MLH code or Render). Blocks #118, the help chat panel, typed topics live, Tiger room %. Render fallback if no Vultr code by Sat 2 PM.
- **AI-tools disclosure wording**: event rule says disclose; I draft in #questions, decide by Sun ~4:30 AM.
- **License** for the repo: needs a call before submit.
- **DEV post publishing** (#131): only after the event.

## Done (merged)
- Research + direction: #30, #33, #34, #50; showcases #42; look #41; no points #39
- Plan: BUILD mode #43; storyboard #90; re-plan #94; CONTRIBUTING #77
- Backend: schema + showcase rounds #54; skeleton #52; CI #60, #65; Gemini generator #58; checks #63, #80, #96; answer events #72; stack landed #114; tighter bands #98; reviewed topics #108; help chat API #105; generator v3 #127
- Frontend: predict/lock #62; look + mockups #79; session scaffold #91; URL state #106; fonts #110
- Sessions: birthday #101 (+ #122); positive test #99; coin streak #107; notebook #130
- Pages deploy #56; Onionskin rename #142; session art #124; user-test kit #120; expo table #132; demo script/scorecard #97, #138; Devpost draft + pitch #104
