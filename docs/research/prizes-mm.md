# Add-on prizes for Mental Models (#21)

Sources: the official event files (prize text, judge list) and our docs/prize-strategy.md, docs/sponsor-tech.md and docs/deepspace.md. Odds are gut estimates for ranking only.

**Bottom line:**
- **Entertainment track + Gemini (the engine) + Easy On The Eyes + GoDaddy domain + Vultr (host, if no card) + Tiger Data (answer events → streaks, "the room") + Auth0 (keep your streak).** ~5-6.5h on top of the core.
- **DeepSpace is out** unless "play with friends" becomes the headline; that's 9-12h.
- **DEV post** after the event.

# Mental Models (general, any topic): which add-on prizes fit

For issue #21. Analysis only. Inputs: event/hacker-guide.md (challenges), event/mlh-prizes.txt, event/devpost.txt, docs/prize-strategy.md, docs/sponsor-tech.md, docs/deepspace.md, docs/prizes.md, docs/deep-mental-models.md. Odds and dollar values are gut estimates for ranking, same method as prize-strategy.md.

**The app:** type any topic → predict first → see the truth interactively → the exact misconception is named → come back (streaks, review of your misconceptions). Track: Entertainment & Creative Tech.

**Budget:** the honest build budget is ~38-42 person-hours (prize-stacks-redteam.md). The core loop for *any* topic (generation + a few truth-widget templates + misconception card + review loop) is ~28-32h. That leaves **~6-10h for everything sponsor-related**. That number decides most of what follows.

## TL;DR

| Prize | Honest fit? | Real job in this app | Extra hours | Core / stretch / skip | Rough EV |
|---|---|---|---|---|---|
| **Gemini (MLH)** | **Yes, it's the engine** | Turns any topic into a session: prediction prompt, answer options, the true outcome, widget params, and a misconception code list (structured output, JSON schema). Also labels a free-text prediction against that code list | 0 (it's core) | **Core** | low prize, but free |
| **Easy On The Eyes** | Yes | The reveal animation is the product; Entertainment judges reward polish anyway | 0 beyond the design pass | **Core** (opt in) | best $ in the stack |
| **GoDaddy domain (MLH)** | Yes | QR on the table → judge plays on their own phone | 0.3 | **Core** | small, nearly free |
| **Vultr (MLH)** | Yes, as host | FastAPI (Gemini calls, cache, DB access) on a Vultr VM | ~1 | **Core** if the code needs no card; else Render and drop it | small-medium, 0 used it at XI |
| **Auth0 (MLH)** | Yes, modestly | Accounts so streaks and your misconception history follow you across devices ("come back" needs an identity). Google login, guest first, sign in to keep your streak | 1.5-2 | **Core-lite** (cut line 2) | medium, ~1 project used it at XI |
| **Tiger Data (MLH)** | Yes now (wasn't for the physics-only version) | Every answer is an event: (user, topic, concept, misconception code, correct, confidence, time). Hypertable + continuous aggregates drive streaks, "misconceptions you've fixed this week", and "the room": what % of everyone at SwampHacks predicted the same wrong thing | 2-3 (we need a DB anyway; Tiger as the only DB) | **Core** if signup is no-card; else stretch | medium, 0 used it at XI |
| **DeepSpace** | Only if multiplayer is the headline | Live "class / party" rooms: room code, everyone locks a prediction, reveal shows the room's spread; realtime leaderboard | 9-12 (deepspace.md, live classroom) | **Stretch at most; default skip** | low per hour |
| **DEV writing (MLH)** | Yes | Post-event write-up | 1-2 after the event; needs my DEV account | **After** | small |
| **Roblox** | No | Any-topic generation + web loop doesn't live in Luau; would mean a different product | whole project | **Skip** | — |

**Recommended stack:** Entertainment track + Gemini + Easy On The Eyes + GoDaddy + Vultr + Tiger Data + Auth0 (cut line) + DEV after. ~5-6.5 extra hours total. DeepSpace stays out unless I make multiplayer rooms the core idea (see "DeepSpace decision" below).

## Per prize

### Gemini API (MLH): core
- **Job:** the any-topic engine. One call per topic with `responseSchema` returns: the prediction question, 3-5 answer options (each wrong option tied to a named misconception code with a one-line "why people think this"), the true outcome, and params for one of our widget templates (slider/sim, number line, graph, sequence/timeline, probability simulator). A second small call maps a free-text prediction onto that code list (enum + `other`/`unclear`), per deep-mental-models.md.
- **Why it's honest:** without Gemini the app only works on topics we hand-write. "Any topic" *is* the Gemini job.
- **Accuracy (judges will ask):** truths that are numbers get computed by our code, not the model (the widget runs the formula/sim; Gemini only picks the template and params). Optional second Gemini pass to self-check the session; flag "unverified" otherwise. Pre-generate and cache the demo topics so the expo never waits on the API.
- **Limits:** free-tier RPD only visible in AI Studio; cache by topic hash, reset is 3 AM our time. Fallback: cached sessions.
- **Judging:** MLH (MLH coach likely). ~48% of XI projects tagged Gemini (**unverified**: from our earlier gallery count in docs/prizes.md, not re-linked here), so ~5-10% odds; ours is above average because Gemini is the engine, not a chatbot.
- **Demo moment:** *the judge types their own topic ("why do ice skaters spin faster?") and ~5s later it's a playable predict-and-reveal round.* An "under the hood" toggle shows the structured JSON.

### Easy On The Eyes (UI/UX): core
- **Job:** none extra; it's the design pass we need for Entertainment anyway (the reveal, the misconception card, the streak screen).
- **Judging:** organizer/general pool, not a sponsor. Everyone is implicitly in; XI's equivalent went to a polished 3D viewer and mentioned accessibility.
- **Odds:** ~8-12%. The guide says the monitor prize is x4, but the Devpost page lists one monitor (**sources conflict; unverified**). Ask the help desk.
- **Demo moment:** the reveal itself: your guess "ghost" vs. the truth, then the misconception card sliding in.

### GoDaddy domain (MLH): core
- **Job:** a short, on-theme name; QR on the table card. Stop if checkout asks for payment; ask the MLH desk which endings are covered.
- **Odds:** ~10-15% (it's "best name", so make the name clever and live).
- **Demo moment:** *the judge scans the QR and plays the round on their own phone.*

### Vultr (MLH): core if no card
- **Job:** host the FastAPI backend (Gemini calls + cache + DB access) and the static frontend on a $5 1 GB VM (atl/mia). No GPU; nothing here needs one, and a GPU left on is the only way we'd spend real money.
- **Conflict:** only with DeepSpace hosting (see below). If the code needs a card, use Render and drop the prize.
- **Odds:** ~20-30% (0 entries at XI). Weak to "show", so the README needs an architecture line.
- **Demo moment:** the domain resolves to the Vultr box; one line in the pitch ("generation and the event stream run on our Vultr VM in Miami"), plus a `/health` page showing cache hits and Gemini latency.

### Auth0 (MLH): core-lite (cut line 2)
- **Job:** login so the loop is real: streak, misconception history, "come back tomorrow, here are 3 you still get wrong". Guest play first (no friction at the expo), "sign in to keep your streak" after the first round. Google social login. No roles needed (unlike the old instructor idea), so ~1.5h incl. callback URLs for localhost + domain and JWKS check in FastAPI.
- **Conflict:** DeepSpace has its own auth. Two login systems in one app is a bad answer to "why?". Pick one.
- **Odds:** ~25-35% (1 project used it at XI). It's a generic use, which is the main risk.
- **Demo moment:** *the judge signs in with Google on their phone after the first round and the streak flame lights up at 1, with their missed misconception already queued for review.*

### Tiger Data (MLH): core if no card, else stretch
- **Job (real, not tacked on):** the answer log is time-series by nature.
  - `answers` hypertable: ts, user_id (or guest id), topic, concept, misconception_code, correct, confidence, ms_to_answer.
  - Continuous aggregates: daily per-user (streaks, accuracy), per-user per-misconception over time ("you fixed *heavier falls faster*: 4/5 wrong on Fri → 0/3 on Sun"), and global per-topic per-option ("62% of SwampHacks predicted the same wrong thing you did").
  - Relational users/topics/sessions in the same Postgres, so it's our only DB (no extra store).
- **Why it's stronger than the old verdict:** the physics-only version had no time dimension; the "come back" loop and "you vs the room" do. Still, it's 36 hours of data. Seed realistic history for a demo user (clearly labeled) and let the "room" panel fill with real expo answers.
- **Ask MLH:** does self-hosted TimescaleDB on the Vultr box count, if Tiger Cloud wants a card?
- **Odds:** ~20-30% (0 at XI). "Performance-driven" is in the brief: show the cagg query time.
- **Demo moment:** *the judge answers, and the "the room" bar updates: "you and 58% of SwampHacks picked this; here's the misconception", backed by a continuous aggregate (query time shown).*

### DeepSpace: stretch at most, default skip
- **Job if used:** live party/class rooms: room code, presence roster, predictions locked by a server action, reveal shows the whole room's spread, realtime leaderboard and streak sync. This is the best "Entertainment" feature on paper ("Kahoot for intuition").
- **Cost:** 9-12h for a live classroom (deepspace.md), alpha SDK (pin 0.42.3), Node ≥22.15 + npm ≥11.6, a human must create the account via the referral link, judges can't email-sign-up (test accounts or `allowAnonymous`), WebSockets on venue Wi-Fi.
- **Conflicts:**
  - *Auth:* DeepSpace's RBAC runs on its own JWTs. With DeepSpace, drop Auth0 (or run anonymous DeepSpace rooms beside Auth0, which is two identity systems; don't).
  - *Hosting:* the frontend lives on `*.app.space` (Cloudflare Workers). Vultr can still honestly host the Python API (Gemini + Tiger proxy), called from the worker over HTTPS on 443. GoDaddy domain can be attached with `domain attach --external` (no cost).
  - *Tiger:* no Hyperdrive; Tiger only behind our HTTPS API.
- **Judging:** no DeepSpace person on the 50-judge list; ask at the desk whether they judge in person. 2 winners, ~2-5 entries.
- **EV:** 1st is credits + $250 cash split; 2nd is credits only. Credits are near-worthless to us after the event (expire Oct 28). ~30-40% odds of placing *if done well*, but it eats ~25% of the build budget and would push Auth0 out and Tiger to stretch. Net per hour it's the worst add-on.
- **Demo moment (if built):** *two phones (judge + us) join room "SWAMP", both lock a prediction, and the reveal shows both ghosts against the truth at the same moment.*
- **Cheaper alternative for the same "room" feeling:** the Tiger "the room" panel (everyone at the event, asynchronously). It gets ~70% of the wow for ~10% of the hours.

### DEV writing (MLH): after the event
- 1-2h on Sun/Mon; needs a DEV account that I make. Monthly editorial pick, ~5-10%. The eval-ish numbers (how often Gemini's sessions were right, how many misconceptions the room had) make a better post than a feature list.

### Roblox: skip
- Built in Roblox Studio with Luau only. Our product is a web loop over any topic; Roblox would mean a separate, fixed-content game. 2 Roblox judges are present and crowding is low, but it excludes every web sponsor and doubles the build. No.

## DeepSpace decision (the only real fork)

| | A. Recommended: no DeepSpace | B. DeepSpace-first (multiplayer is the headline) |
|---|---|---|
| Auth | Auth0 | DeepSpace (Google/GitHub) |
| Hosting | Vultr (API + static), GoDaddy domain | app.space (frontend + rooms), Vultr (Python API), GoDaddy domain attached |
| DB | Tiger (only DB) | DeepSpace records for rooms; Tiger for the answer log via our API (stretch) |
| Sponsor extra hours | ~5-6.5 | ~11-14 (DeepSpace 9-12 + Vultr/domain/Gemini wiring) |
| Prizes in play | Gemini, UI/UX, GoDaddy, Vultr, Auth0, Tiger, DEV | Gemini, UI/UX, GoDaddy, Vultr, DeepSpace, (Tiger), DEV |
| Risk | low; one backend, one DB | alpha SDK, two runtimes, WS on venue Wi-Fi, Node upgrade |

A wins on EV per hour. B only makes sense if I want "play with friends" to be the main Entertainment pitch. If B, decide **before the first commit** (DeepSpace is either the base from the start or not used), and only if DeepSpace confirms in-person judging at the 8:30 PM desk.

## Core vs stretch and cut order
- **Core:** Gemini engine, design pass (UI/UX), domain, Vultr host, Tiger answer log + "the room" + streak cagg.
- **Cut line 2:** Auth0 (if not working by ~H22, ship guest-only streaks keyed to a device id; still feeds Tiger).
- **Stretch:** Tiger "misconceptions you fixed this week" chart with seeded history; free-text prediction labeling.
- **Out:** DeepSpace (unless I pick B), Roblox, Solana, Nessie, Sperry, Least Vibe Coded.
- **Cut order if behind:** DeepSpace (n/a) → Auth0 → Tiger history chart (keep "the room") → Vultr (fall back to Render) → never cut Gemini generation, the reveal, or the domain/QR.

## One-line demo moments (table script order)
1. **GoDaddy:** judge scans the QR on the table; the app opens on their phone at our domain.
2. **Gemini:** judge types any topic; ~5s later it's a playable predict-first round (JSON under the hood toggle).
3. **Easy On The Eyes:** they lock a guess; the truth plays out against their ghost and the misconception card names exactly why.
4. **Tiger Data:** "you and 58% of SwampHacks picked this" updates live from a continuous aggregate (query ms shown).
5. **Auth0:** "sign in to keep your streak" with Google; the streak lights up and their miss is queued for tomorrow.
6. **Vultr:** one sentence + `/health` page: generation, cache and the event stream run on our Vultr VM.
7. **DeepSpace (only if B):** two phones in room "SWAMP" reveal together.

## Ask at the 8:30 PM desks (adds to prize-strategy.md's list)
- MLH: Vultr code needs a card? GoDaddy endings? Self-hosted TimescaleDB counts for Tiger? Who judges MLH prizes and do they come to tables?
- DeepSpace: judging in person? (decides whether B is even on the table)
- Help desk: Easy On The Eyes judged by whom, and is it 4 monitors per team?
