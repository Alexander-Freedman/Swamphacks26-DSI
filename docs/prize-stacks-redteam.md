# Red team of the prize stacks + lean versions

Feeds docs/prize-strategy.md. Nothing is picked.

# Red team: prize stacks vs "narrow scope wins"

Oct 16. Reviewed: docs/prize-strategy.md (Top stacks), scratchpad ps-stacks.md, docs/36-hour-plan.md, docs/sperry-deep.md, docs/ai-era.md, docs/teardowns.md, plus feasibility.md Table A, hazard-ml.md and deep-mental-models.md for hour numbers. All probabilities are gut estimates for ranking, same as ps-stacks.

## Bottom line

- **Stack 1 as written breaks our own research.** Five integrations + an agent on top of the Sperry core, two backends, two data stores, two deploy targets, and a plan at 46-48h when the honest build budget is ~38-42h. I put **~50% odds the demo path isn't reliable by 7:30 AM Sun**. Reliability-adjusted, its EV drops from $370/$429 to roughly **$260/$300**.
- **Stack 2's headline feature is a safety anti-pattern for Sperry.** An LLM agent that *proposes* a lightning stop-work, waiting on a supervisor's Auth0 approval, puts an LLM and a human delay into the one deterministic rule that's our strongest piece. sperry-deep.md explicitly cuts "agents, chat, any LLM in a numeric path". Drop the agent; keep plain Auth0 roles.
- **Lean hazard radar (L1) at ~33h core keeps ~95% of stack 1's reliability-adjusted EV** and leaves 6-9h for user tests, design and rehearsal, which our research says is where winners spend their time (and which the EV model doesn't credit).
- **Recommended:** 1) L1 lean hazard radar, 2) L1 + DeepSpace crew channel only if a spike passes by Sat 12:30 AM, 3) lean Mental Models built on DeepSpace from hour 0. Tracks: AI/ML / AI/ML / AI/ML-or-Entertainment by gate. First Timers beats all of them if we qualify.

---

## 1. Red team of stacks 1-3

### 1a. The real budget is ~38-42 build person-hours, not 48

- Awake time Fri 8:30 PM to the Sun 7:30 AM submit, with the plan's sleep schedule: ~28.5h each, so ~57 person-hours.
- Taken out before any feature work:
  - meals, Company Connect, Sperry workshop: ~3-4h
  - Devpost write-up, README and AI-tools section: ~2h
  - backup video: 2-3h
  - two user-test rounds: ~2-3h
  - both of us reading the core code (Technical Understanding is criterion 1): 1-2h
  - setup and accounts: 1-3h (@luanamaldaner's side spent ~3h on setup today)
- That leaves **~40-45h**. Then subtract the 3-4h integration-surprise buffer from 36-hour-plan.md: **~37-41h of actual feature build.**
- Table A's 42h (and so stack 1's 46-48h) has **no buffer line, no design pass, and no user testing** in it. Stack 1 is planned ~6-10h over before anything goes wrong.

### 1b. Where the hours are underestimated (all stacks)

| Item | Plan says | Evidence-based range | Why |
|---|---|---|---|
| Hazard ML (labels + features + model + eval) | 9h (Table A: 3+2+4) | **10-14h** | Our own hazard-ml.md says ~10-14h for one person. There's also a leakage trap: the Historical Forecast API is near-analysis, so the honest test needs the Previous Runs API. |
| Data sources | 6 in Table A | **+3 unbudgeted** | sperry-deep.md's board wants USGS gauges, NIFC/FIRMS wildfire and iNaturalist/FWC wildlife columns. None of them have hours. Today 1 in 3 sources misbehaved, at +30-60 min each. Across ~9 sources that's ~3 surprises, **+1.5-3h**. |
| DeepSpace (stack 1, 3) | 5-6h, 4h timebox | **6-10h** | Alpha SDK: 110 npm versions in 3 months. The docs footer says 0.30.1 while npm is at 0.42.3, so the docs examples are ~12 minors stale. AI accuracy drops from 56% to 32.5% on APIs newer than the model. |
| DeepSpace fallback | "fall back to S1-AI" | **+3-4h on top of the sunk 4h** | The timebox isn't free. The fail branch costs ~7.5h total for a crew channel. |
| Gemini agent + vision (stack 1, 2) | 3h | **4-6h** | Tool-call schema, the grounding validator, caching, and the free tier (10-15 RPM, ~250/day per project) under 3+ judges plus sponsor judges at the expo. |
| Auth0 for AI Agents (stack 2) | 2h | **3-5h** | Async authorization is a new API we haven't checked. Plain Auth0 roles already need a namespaced claim (1-3h). |
| Two backends talking (stack 1) | 0 | **1-3h** | Each contract mismatch costs 30-90 min, and two different assistants working in parallel had a 41.7% conflict rate. |
| Real classroom answers (stack 3) | implicit | **3-5 person-h** | Running the kiosk plus blind-labeling 40-150 answers by both of us. |

### 1c. Shoehorn risk per integration (what a general or Sperry judge sees)

| Integration | Stack | Reads as shoehorned? | Notes |
|---|---|---|---|
| Ask-the-board Gemini agent | 1 | **High** | sperry-deep.md cuts "chat, agents, ask the map". This is the "chatbot where a form would do" pattern judges mark down. The board already answers "can site X work 2-5 PM". |
| Gemini safety agent + Auth0 for AI Agents approving stop-work | 2 | **High, and a safety problem** | The lightning rule must fire automatically. An agent proposal plus human approval adds latency and an LLM to a life-safety path. Humza: "tools that hold up in the field". Even moved to "schedule changes only", it's a second product. |
| Tiger "query speed panel" in the UI | 1, 2 | Medium | A DB benchmark widget in a supervisor tool is for MLH, not Sperry. Keep Tiger as the database and show the speed in the README/Devpost, not on the board. |
| DeepSpace + Vultr + Tiger together | 1 | Medium | It's defensible in one sentence, but it's two hosts, two stores and two languages for a 2-person team. "Why two databases?" becomes a Technical Understanding question we have to win. |
| Gemini photo auto-tagging | 1, 2 | Low-medium | Sperry wants "one tap with gloves on". Auto-tagging is fine only as a suggestion next to the one-tap picker, never as a step that blocks. |
| DeepSpace crew rooms | 1 | Low on fit (the brief asks for instant crew sharing) | The risk is hours and reliability, not relevance. |
| Gemini writing the 6 PM briefing (with a number validator) | all hazard | Low | A required Sperry feature. Template first, Gemini words on top. |
| Vultr as host, GoDaddy domain | all | None | Invisible to Sperry judges. Honest if it really is our host. |
| DeepSpace rooms + Gemini classifier | 3 | Low | Both are the core interaction. |

**The 3-minute test:** sperry-deep.md's demo outline already fills 3:00 with the board, the drawer, the lightning replay, the phone report, the model tab and the briefing. Stack 1 adds DeepSpace presence, photo tagging, the agent and the Tiger panel. That's 9-10 things, the "8-10 features that don't connect" judges mark down. Mr.Gridy (voice agent with 28 tools plus a GPU sim) tied for last among Sperry's winners; Common Ground won with one picture.
- Mitigation that does hold: sponsor judges visit separately, so the DeepSpace pitch can be its own 1-minute walk-through.
- Mitigation that doesn't: general judges score one product.

### 1d. Probability the demo path isn't reliable by 7:30 AM Sun

"Reliable" means the 3-minute path runs from main on the deployed URL 3 times in a row, the backup video is recorded, and both of us can explain the core.

| Stack | P(not reliable) | Main drivers |
|---|---|---|
| **1 (N1)** | **~45-55%** | 6-10h over budget before surprises; ~3 data-source surprises; 5 service sign-ups; alpha SDK; two deploy targets; the freeze slips past midnight, which squeezes the video and the code-reading |
| **2 (S1-AI)** | **~35-45%** | Over budget too (~47h); a new Auth0 API; agent rate limits at the expo; an agent in the live path |
| **3 (N2)** | **~30-35%** | Fits the hours, but DeepSpace sits in the core with no good fallback (deep-mental-models.md itself put live classroom *below the cut line*). The eval depends on enough real people answering. |
| L1 (lean hazard, below) | ~15-20% | One backend, one store; the live demo runs on replay |
| M1 (lean Mental Models, below) | ~15-20% | DeepSpace decided by a spike at H4 |

**Reliability-adjusted EV.** Assumes a shaky demo keeps ~40% of value (MLH tech prizes survive; Sperry, Overall and UI mostly don't). Factor = P_ok + (1-P_ok)×0.4.
- Stack 1: $370/$429 × 0.70 → **~$260/$300**
- Stack 2: $346/$380 × 0.77 → **~$265/$290**
- Stack 3: $149/$218 × 0.81 → **~$120/$175**

### 1e. Other holes found

- **The hourly cells don't match the model.** sperry-deep.md shows a 0-10 index per *hour* cell. hazard-ml.md's model is per *site-day*, because multi-year lightning only exists daily. If the hourly cells look like model output, Humza will catch it. Fix: a daily 0-10 model score per row, plus a labeled non-ML "likely window" strip from the hourly forecast. hazard-ml.md already suggests this.
- **DeepSpace judges aren't on the published judge list.** If no one from DeepSpace is in the room, its "live demo" requirement and its 22% odds are shaky. This is a gate below.
- **The EV model credits integrations and gives slack zero value.** Under XII's rubric (Understanding, Functionality, Design, Purpose), the 6-9h a lean plan frees for user tests, design and rehearsal raises Sperry, Overall and UI odds together. One point of Sperry 1st alone is worth ~$8.

---

## 2. L1: lean hazard radar ("Tomorrow's go/no-go board"), ~33h core

One picture: the board (sites × tomorrow, a daily 0-10 score plus an hourly window strip) with the "Why 7.4?" source drawer. One live moment: the lightning countdown resetting on replay. One phone moment: a crew report pin.

**Architecture:** FastAPI on Vultr → Tiger Data as the *only* database → React + Leaflet. No second backend, no second store.

### Core (never cut)

| Piece | Hours |
|---|---|
| Sites (EIA-860M FL, prebuilt csv) | 0.5 |
| GLM replay day + live poller (live poller is cuttable, see cut list) | 3 |
| 10 mi / 30-min reset rule + golden test in CI | 2 |
| Replay mode | 2 |
| NWS live alerts + polygon intersect | 2 |
| Labels + features + LightGBM/LogReg + time-split eval vs baseline | 10 |
| Heat index (not WBGT, and we say so) | 0.5 |
| 6 PM briefing: template + Gemini words + number validator + "Send now" | 2 |
| Crew report phone page: one-tap category, photo, GPS, 5-10 s polling (no websockets) | 2 |
| Board + map + drawer with provenance chips | 6 |
| Tiger hypertables + 1 continuous aggregate behind the ranking | 1.5 |
| Deploy: Vultr + Caddy + GoDaddy domain | 1.5 |
| **Total** | **~33** |

Add the 3-4h integration buffer and it's ~37h, with 3-5h left inside a ~40h build for stretch, design and user-test fixes.

### Prizes kept

Sperry, Tiger (central: it's the only store), Vultr (gated on the card question), GoDaddy, Gemini (briefing words only, honest but low odds), Easy On The Eyes, DEV.

**Stretch, added only in this order and only after the 8 AM Sat "can we demo now?" is yes:**
1. Auth0 supervisor login, with the crew page staying login-free (1.5h, ~$30 EV).
2. Gemini photo-tag *suggestion* (1h).
3. USGS gauge flood check on 1-2 river sites (1.5h).
4. WBGT instead of heat index (2h).

**Cut entirely:** the ask-the-board agent, Auth0 for AI Agents, storm clustering, wildfire and wildlife data (shown as hatched "not covered"), the Tiger speed panel in the UI.

**Ordered cut list, if behind** (cut #1 first):
1. any stretch item not started
2. live GLM poller (keep replay; live = NWS alerts only)
3. Gemini briefing words (keep the template; we lose the Gemini prize, ~$3)
4. second continuous aggregate / Tiger extras (keep hypertables)
5. map polish (board table first, plain dots)
6. LightGBM → logistic regression on the same features and eval
7. Vultr → Render free + Tiger Cloud (we lose the Vultr prize, ~$23)

Never cut: the board and drawer, the lightning rule with its golden test and replay, the time-split eval table, the phone report, the deployed URL, the backup video.

### Decision gates (clock time)

| When | Check | If no |
|---|---|---|
| Fri 9:30 PM | MLH desk: does the Vultr code need a card? Tiger Cloud signup works? | Card needed → Render + Tiger Cloud, drop Vultr. Tiger signup fails → TimescaleDB in Docker on our host |
| Fri 10:30 PM | Sperry table: judging in person, 50-plant minimum, satellite (GLM) lightning OK? | GLM not OK → ask what is; don't build the poller yet |
| Sat 12:30 AM (H4) | GLM replay day parsed into flashes; the stop-work rule passes on it | Hand-pick a different recorded storm day; poller is cut now, not later |
| Sat 5:30 AM (H9) | Labels and features joined; first eval number in the README | Rules score + logistic regression; consider no AI/ML track |
| **Sat 8:00 AM** | Demo path from main on the deployed URL | All stretch frozen until yes |
| Sat 12:30 PM | After Company Connect: core yes and ≥3h buffer unspent | No stretch at all; spend it on design + user tests |
| Sat 4:15 PM | After the Sperry workshop: any scope change Sperry asks for | Last point to change scope; nothing new after 8:30 PM |
| Sat ~midnight | Feature freeze, video recorded | Cut from the list above, never the video |
| Sun 7:00 AM | Track tick (see section 4) | — |

### EV

- Core: S1 minus Auth0 = $293/$323. Plus Auth0 at P(done) 0.7 → **$314/$344**.
- Reliability-adjusted (P_ok ~0.82, factor 0.89): **~$280/$306**. That's ~105% of stack 1's adjusted EV at ~14 fewer hours, before crediting the slack.

### L1+DS: L1 with DeepSpace as the crew channel, decided early

- **How:** @luanamaldaner's B1 prototype slot (Fri 10 PM-Sat 12:30 AM) is a 90-min DeepSpace spike: `deepspace@0.42.3` pinned, two phones in one site room, a pin appears on both, deployed to app.space.
- **Go only if** the spike passes by **Sat 12:30 AM** *and* DeepSpace confirmed in-person judging at 8:30 PM. DeepSpace then replaces the crew page and Auth0 (not both).
- **If not:** stay on plain L1. No second attempt later, since a late alpha-SDK integration is the worst timing.
- **Hours:** ~38-40.
- **EV:** expected ~$344/$390. Reliability-adjusted ~$290/$329, which is within noise of L1 and has more variance.

---

## 3. M1: lean Mental Models, ~30h core

- **Key change from N2:** DeepSpace is either the backend from hour 0 or not used at all. N2 has it as a bolt-on; deep-mental-models.md had it below the cut line. When it is used, it holds auth, rooms, presence and stored answers, and Gemini is called from the Worker. The eval harness is offline Python in the repo (fine for DSI, who read code).
- **Prizes kept:** DeepSpace (if the gate passes), Gemini (central: the classifier), GoDaddy, Easy On The Eyes, DEV.
- **Dropped:** Auth0 (clashes with DeepSpace auth), Vultr (no honest job on app.space; it comes back as the host only in the FastAPI fallback), Tiger (no honest fit).

### Core

| Piece | Hours |
|---|---|
| Item 1 sim + ghost reveal | 6 |
| Prediction UI | 3 |
| Gemini structured classifier | 3 |
| Eval harness (kappa, per-code P/R, keyword baseline, bootstrap CI) | 3 |
| Kiosk collection sessions | 2 |
| Blind labeling (both of us) | 3 |
| DeepSpace room (teacher opens, students lock in, reveal + class histogram) | 4 |
| Deploy + domain | 1 |
| Design pass | 3 |
| Misconception histogram | 2 |
| **Total** | **~30** |

With the buffer it's ~34h, leaving ~5h slack.

**Ordered cut list** (cut #1 first):
1. Item 3
2. Item 2
3. adaptive follow-ups (use a fixed sequence)
4. teacher dashboard graph (use a colored list)
5. DeepSpace room → single-device "pass the phone" mode (we lose DeepSpace)
6. bootstrap CIs

Never cut: Item 1 loop + ghost, the classifier, the real-data eval table.

### Gates

| When | Check | If no |
|---|---|---|
| Fri 9:30 PM | DeepSpace judging in person? | Build on FastAPI + SQLite from the start, host on Vultr, Vultr back in |
| Sat 12:30 AM (H4) | Spike: two browsers in one room with presence and shared predictions, deployed to app.space | FastAPI WebSocket room (3h) or single-device; DeepSpace dropped |
| Sat 8:00 AM | Item 1 end to end on the deployed URL | Cut Items 2-3 now |
| Sat 2:30 PM | ≥20 real explanations from the lunch kiosk | Roam the hacking floor with the QR code at 3-5 PM |
| Sat 9:00 PM | ≥40 real explanations labeled, with kappa | Track → Entertainment (section 4) |

**EV:** N2 minus nothing material: $147-151/$216-220. Reliability-adjusted (P_ok ~0.82): **~$132/$194**. Still less than half of L1, because there's no Sperry-sized prize to aim at.

---

## 4. Final ranking + track per stack

| Rank | Stack | One-line reason | Track (EV reasoning) | Adj. EV A/B | Person-h |
|---|---|---|---|---|---|
| **1** | **L1 lean hazard radar** (Sperry + Tiger + Vultr + GoDaddy + Gemini briefing + UI + DEV; Auth0 as stretch #1) | Keeps ~all of the hazard EV; one picture, one backend; leaves room for the user tests and rehearsal that actually win Sperry | **AI/ML** (~+$12 for ~1-2h: the time-split eval *is* the Sperry core, and DSI reads it). Hardware is +$39 on paper but costs 8.5h+ and the lab has no RH sensor or ESP32, so it's out for a lean plan. Entertainment doesn't fit. **First Timers instead if we qualify** (+$50, 0h). | ~$280 / $306 | ~33 core / ~37 with buffer |
| **2** | **L1+DS** (L1 with the DeepSpace crew channel replacing Auth0, only via the Sat 12:30 AM spike gate) | Higher ceiling (DeepSpace's ~2-5 entrants), same picture, but two backends and alpha risk; within noise of L1 on adjusted EV | **AI/ML** (same reasoning; First Timers if eligible) | ~$290 / $329 | ~38-40 |
| **3** | **M1 lean Mental Models** (DeepSpace-native or not at all, Gemini classifier + real eval, GoDaddy, UI, DEV) | Best non-Sperry option: reliable, fits the hours, a strong AI/ML story, but a thin sponsor stack | **AI/ML if the Sat 9 PM gate passes** (≥40 real labeled answers + kappa): DSI asked for "evals, non-trivial", and I think ps-stacks' 12% understates our odds in a wrapper-heavy pool. **Otherwise Entertainment** (~$18, an "interactive media" fit, but a stretch for a teaching tool). First Timers beats both if eligible. | ~$132 / $194 | ~30 core / ~34 |

**Dropped from the top 3:**
- **Stack 2 (Auth0 for AI Agents safety agent).** It's a Sperry safety anti-pattern, and its honest parts (Auth0 roles) are already stretch #1 in L1.
- **Stack 1 as written.** It's over budget, has ~50% demo risk, and carries the agent sprawl Sperry's panel warned against.

**What would flip 1 vs 2:** DeepSpace judging in person, the spike passing in ≤90 min, and @luanamaldaner's setup going fast. If all three happen, L1+DS is reasonable. If any one fails, stay on L1.
