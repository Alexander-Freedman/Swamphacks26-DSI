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
- **Lean into prizes that reward AI:** the AI/ML track, Gemini, Auth0 for AI Agents, Vultr GPUs, DeepSpace's AI features, and sponsor challenges that require ML (Sperry).

## Every prize, one line each

| Prize | What it takes (paraphrased) | Value to us | Judged by | Extra effort on top of the core | Crowding | Conflicts / notes |
|---|---|---|---|---|---|---|
| **Overall** (Vobile) | Innovation, technical achievement, impact, execution | $1,000 / $750 / $500 (guide; Devpost says $2,500 total). The split is unclear: among members, or 4 ways regardless | General pool (50 judges; ≥3 visit us, ~2-3 min each) | 0h | ~100 teams | none |
| **AI/ML track** (UF DSI) | AI central (fine-tune, RAG, agents, custom models, evals); public repo + README; "depth over polish, we read the code"; explain tradeoffs | Prize TBD (Devpost: "a Brick") | DSI reads repos | ~0-3h if our core *is* a model with an eval; README + clean code | High | uses our one track slot |
| **Hardware track** | Physical device or software controlling one | 4× Raspberry Pi 4 kits | general | 6-10h for one sensor feeding the app. The CpE lab lends ESP32/Pico/Arduino; sensors only "on request" | Low | uses the track slot instead of AI/ML |
| **Entertainment track** | Games, interactive media, art, music, story | 4× AirPods 4 | general | 0h if the idea is a game/experience | Medium | uses the track slot |
| **First Timers** | ≥50% of the team at a first hackathon | 4× Logitech sets | general | 0h | ? | only if @luanamaldaner is a first-timer; uses the track slot |
| **Sperry PlanIT Control** | Real-time hazard platform for ≥50 real power plants: lightning stop-work (10 mi, 30-min countdown resets), flood alerts, 6 PM next-day briefing, crew photo pins, supervisor risk-ranked map, ML hazard index 0-10 | iPad Air / AirPods / $100 + **internship interviews for all 3 places** | 4 Sperry judges | It *is* the core (~25-30h) | ~5-12 | stacks with AI/ML, Tiger Data, Auth0, Vultr, Gemini |
| **Capital One Nessie** | Creative use of Nessie's banking endpoints to improve users' finances | $250/member | Capital One (none on the published judge list; XI had 5) | 2-4h if the core is fintech; a forced fit otherwise | ~8-15 | needs a money-centered core |
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

## Top stacks
*(being finalized; posted to #questions at the usage wind-down or 8:30 PM)*
