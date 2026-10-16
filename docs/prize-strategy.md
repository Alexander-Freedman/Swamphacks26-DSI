# Prize strategy: winning the most prizes at once

Nothing is picked; I decide. This is built from the official guide, rules and Devpost page (in my own words) plus the research docs.

**Rules that shape stacking:**
- General/Overall is automatic.
- At most **one** specialized track: AI/ML, Hardware, Entertainment, or First Timers.
- **Any number of challenges** whose requirements we really meet. Sperry, Capital One Nessie, DeepSpace and Roblox are challenges, not tracks. So are Easy On The Eyes and the MLH prizes.
- Sponsor challenges are judged by that sponsor's judges, who have to see their tech actually working.
- Judges penalize shoehorned integrations ("Track & Challenge Relevance" is a criterion).

**Decisions so far:**
- **Least Vibe Coded is out.** We use AI heavily and disclose it.
- **Lean into the challenges that reward AI:** Gemini, Auth0 for AI Agents, Vultr GPUs, DeepSpace's AI features, and sponsor challenges that require ML (Sperry). These stack with any track.
- **Building with AI does NOT mean taking the AI/ML track.** We get one specialized track or none. Each stack below compares AI/ML (DSI reads the code, depth over polish, prize unclear) with Hardware, Entertainment and none, and picks by expected value.

## Every prize, one line each

| Prize | What it takes (paraphrased) | Value to us | Judged by | Extra effort on top of the core | Crowding | Conflicts / notes |
|---|---|---|---|---|---|---|
| **Overall** (Vobile) | Innovation, technical achievement, impact, execution | $1,000 / $750 / $500 (guide; Devpost says $2,500 total). The split is unclear: among members, or 4 ways regardless | General pool (50 judges; ≥3 visit us, ~2-3 min each) | 0h | ~100 teams | none |
| **AI/ML track** (UF DSI) | AI central (fine-tune, RAG, agents, custom models, evals); public repo + README; "depth over polish, we read the code"; explain tradeoffs | Prize TBD (Devpost: "a Brick") | DSI reads repos | ~0-3h if our core *is* a model with an eval; README + clean code | High | uses our one track slot. What they look for when reading code: docs/ai-ml-track.md |
| **Hardware track** | Physical device or software controlling one | 4× Raspberry Pi 4 kits | general | 6-10h for one sensor feeding the app. The CpE lab lends ESP32/Pico/Arduino; sensors only "on request" | Low | uses the track slot instead of AI/ML |
| **Entertainment track** | Games, interactive media, art, music, story | 4× AirPods 4 | general | 0h if the idea is a game/experience | Medium | uses the track slot |
| **First Timers** | ≥50% of the team at a first hackathon | 4× Logitech sets | general | 0h | ? | only if @luanamaldaner is a first-timer; uses the track slot |
| **Sperry PlanIT Control** | Real-time hazard platform for ≥50 real power plants: lightning stop-work (10 mi, 30-min countdown resets), flood alerts, 6 PM next-day briefing, crew photo pins, supervisor risk-ranked map, ML hazard index 0-10 | iPad Air / AirPods / $100 + **internship interviews for all 3 places** | 4 Sperry judges | It *is* the core (~25-30h) | ~5-12 | stacks with AI/ML, Tiger Data, Auth0, Vultr, Gemini |
| **Capital One Nessie** | Creative use of Nessie's banking endpoints to improve users' finances | $250/member (guide) or $1,000 total (Devpost). Keys are self-serve via GitHub login on nessieisreal.com; use **https** (http is dead) | Capital One (none on the published judge list; XI had 5) | 2-4h if the core is fintech; a forced fit otherwise | ~8-15 | needs a money-centered core |
| **DeepSpace** | SDK does real work (auth, data, realtime, integrations; not just hosting) + live demo + say which features | Credits + $250 split + a CEO call | DeepSpace (none on the list) | 4-8h; alpha SDK, pin the version; referral link before signup; runs on Cloudflare Workers (no Python ML there) | ~2-5 | its auth overlaps Auth0; best when the app is realtime multi-user |
| **Roblox** | Built in Roblox Studio, core logic in Luau | $100 Robux/member + swag | 2 Roblox judges | the whole project in Luau; Studio on Win/Mac; account needed | ~2-5 | excludes almost every web sponsor; pairs with Entertainment |
| **Easy On The Eyes** | Outstanding UX, interface, polish | 4× 27" monitors | ? | 0h extra beyond the design pass (docs/design-depth.md) | Medium | compatible with everything |
| **GoDaddy domain** (MLH) | Register a domain via the MLH link | gift card | MLH (likely the on-site coach) | ~20 min | anyone | stop if checkout asks for payment |
| **Auth0** (MLH) | Use any Auth0 API; "Auth0 for AI Agents" is called out | wireless headphones each | MLH | 1-2h (roles need a namespaced claim) | **1 project at XI** | conflicts only with DeepSpace auth |
| **Vultr** (MLH) | Host/compute on Vultr; GPUs for AI are pitched | M5Stack Tab5 | MLH | ~1h (it's our host anyway); **ask whether the code needs a card** (no-spend rule) | 0 at XI | DeepSpace hosts elsewhere |
| **Tiger Data** (MLH) | Real-time/time-series on Postgres; continuous aggregates; show performance | Stream Deck Mini | MLH | 2-4h; only real if we have time-series data | 0 at XI | natural for the hazard radar, not for a classroom sim |
| **Gemini** (MLH) | Gemini API does real work in the app | swag kits | MLH | 1-3h; free tier ~250 req/day, so cache | **48% of XI used it** | crowded; tag it only if Gemini truly does a job |
| **DEV post** (MLH) | Publish the project on DEV (#mlhacks) after the event | $100 | DEV editors | 1-2h after the event; needs a DEV account (my call) | month-wide | none |
| **Solana** (MLH) | Built on Solana | hardware wallets | MLH | 4-8h, forced fit | — | **skip** |
| **Least Vibe Coded** | — | — | — | — | — | **dropped** |

## Questions to ask at the desks at 8:30 PM
1. **Help desk:** is the cash split among members or four ways? Is Overall $2,500 or $2,250? What's the AI/ML prize? Which judging sheet is used?
2. **MLH desk:** does the Vultr code need a card? Which domain endings does the GoDaddy code cover? Who judges the MLH prizes?
3. **CpE lab** (Wertheim): is there a temp/humidity sensor on request?
4. **Sperry, Capital One and DeepSpace tables:** are you judging in person? For Sperry: is 50 plants a hard minimum, and is satellite lightning OK?

## Top stacks (after the red team; nothing is picked)
The first version of stack 1 (hazard radar + DeepSpace + a Gemini agent + Tiger + Vultr) failed review (docs/prize-stacks-redteam.md):
- **Over budget.** The real build budget is ~37-41 person-hours after meals, write-up, video, user tests and buffer. That stack needed ~46-48.
- **Sprawl.** It meant ~9-10 things to show in 3 minutes, which is the sprawl Sperry's panel warned against.
- **A shaky demo.** ~50% odds of one.
- **The agent version was a safety problem.** It put an LLM plus an approval step in front of the lightning stop-work rule, which has to stay deterministic.

Lean versions keep almost all of the expected value with ~14 fewer hours.

Expected value (EV) is **reliability-adjusted**: a shaky demo keeps ~40% of its value. "A" assumes cash is split four ways regardless of team size; "B" assumes it's split among members. Odds are gut estimates for *ranking* only.

| Rank | Stack | Track (compared, not defaulted) | Prizes | Core hours (+buffer) | Adj. EV A / B |
|---|---|---|---|---|---|
| **1** | **Lean hazard radar for Sperry** (L1): one go/no-go board with a "why" drawer that opens the raw source, the exact lightning stop-work rule tested on a recorded storm day, replay mode, a calibrated daily 0-10 index with a time-split eval, phone crew reports. FastAPI on Vultr, Tiger as the only DB, React/Leaflet. **No agent.** | **AI/ML** ~+$12 for 1-2h, since the eval *is* the Sperry core. Hardware ~+$39 but 8.5h+ and no listed humidity sensor. Entertainment doesn't fit. First Timers beats all of them if we qualify. | Sperry (3 places + interviews), Tiger Data, Vultr*, GoDaddy, Gemini (briefing wording only), Easy On The Eyes, DEV; stretch: Auth0 supervisor login | ~33 (~37) | ~$280 / $306 |
| 1b | **Same + DeepSpace crew channel** (L1+DS): only if a 90-min spike passes by **Sat 12:30 AM** *and* DeepSpace confirms in-person judging. Otherwise drop it for good. | AI/ML | L1 + DeepSpace | ~38-40 | ~$290 / $329 (more variance) |
| **2** | *(pending: lean finance interceptor, being scored in the same format)* | | | | |
| **3** | **Lean Mental Models** (M1): draw your prediction, the ghost replays it against the truth, a misconception card, and an eval on answers collected from hackers at the event. DeepSpace is either the backend from the start or not used. | **AI/ML if ≥40 labeled real answers with agreement by Sat 9 PM; otherwise Entertainment** (a near-tie on EV) | Gemini (classifier), GoDaddy, Easy On The Eyes, DEV; maybe DeepSpace | ~30 (~34) | ~$132 / $194 |
| alt | **Beat the Fingerprint** (the judge tries to evade our audio matcher; tempo/pitch read back) | Entertainment | Domain, Easy On The Eyes, Vultr (no honest Gemini job) | ~31 | ~$173 / $239 before the reliability adjustment |
| alt | **Roblox "Call It"** (lobby bets on the physics outcome, then the round plays out) | Entertainment | Roblox (~45% odds, ~$400 total), domain. Needs a Win/Mac laptop and an age-checked Roblox account ≥2 days old | ~32 | ~$120 |

\* Vultr only if its credit code needs no card (no-spend rule); otherwise Render.

**Decision gates for L1** (from the red team):

| When | Gate |
|---|---|
| Fri 9:30 PM | Vultr card + Tiger signup |
| Fri 10:30 PM | Sperry answers (in-person judging, 50 plants, satellite lightning) |
| Sat 12:30 AM | Recorded storm day parses; the stop-work rule passes on it |
| Sat 5:30 AM | First eval number in the README |
| **Sat 8 AM** | **Demo runs from main on the URL, or all stretch work freezes** |
| Sat 12:30 PM | Stretch only if ≥3h of buffer is unspent |
| Sat 4:15 PM | Last scope change (after the Sperry workshop) |
| Midnight | Feature freeze + video |

**Never cut:** the board + source drawer, the tested lightning rule, replay, the eval table, phone crew report, the deployed URL, the backup video.

**Model fix:** the index is *daily* per site. The hourly strip is a separate forecast-based "likely window", labeled as such.

**Track choice (general):**
- The track is worth roughly $10-50 in EV for every idea. **The challenges carry the stacks.**
- AI/ML only pays if our core really is a model with an eval that DSI can read in the repo.
- **First Timers beats any of them (+~$40-50 for 0h) if we qualify.** @luanamaldaner please confirm whether this is your first hackathon.
- The track box is ticked on Devpost, so the final choice can wait until ~7 AM Sun.

**Why stacks 1-2 are ~2x the rest:**
- Sperry has 3 places, interviews for all of them, ~5-12 entries and 4 judges of its own.
- Tiger Data, Vultr and Auth0 were nearly unused at XI.
- The ML index makes AI/ML nearly free.

**What would change the ranking (ask at the desks at 8:30):**
- the cash split
- whether Sperry's iPad is per member (≈+$128 to stacks 1-2)
- the actual AI/ML prize
- whether the CpE lab has a sensor
- whether the Vultr code needs a card
- whether the DeepSpace and Capital One judges are there in person

**Compatibility rules we used:**
- DeepSpace and Auth0 are two login systems: pick one.
- DeepSpace and Vultr only together with a real split (DeepSpace can't run Python ML).
- Gemini only where it does a central job; tagging it on is ~2% odds at 48% crowding.
- Nessie doesn't fit Sperry: "hazard pay via Nessie" scored *lower* than without it.
- Roblox excludes almost everything else.
- Solana never fits.
- Least Vibe Coded is dropped.
