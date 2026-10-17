# Build plan: from approval to the 7:30 AM Sun submit

## Re-plan (Sat ~12:30 AM): visual sessions first
The product is now **one short visual session per concept** (docs/experience.md, look in docs/experience-look.md). The block table below is kept for times and owners, but this list wins where they differ.

**Keep:** predict → confidence → lock; the Distribution + Curve widgets (reused inside sessions); stamp verdict; misconception card (now quotes your number); the extremes slider idea (#68, now inside each session); collection (#67, local first); How it works drawer (#71); the engine + checks (labelled extra, below).

**Change:**
- The demo runs on **3 hand-built sessions**: birthday (me, #78), coin streak (@luanamaldaner, #81), positive test (@luanamaldaner, #82). Each lives in `web/src/sessions/<topic>/` on the scaffold (#91).
- Every reveal draws **ink over your pencil** with the marker gap; no text-only verdicts.
- **Typed topics are a labelled extra, not the headline.** Trial (25 topics): median 27 s, every item a plain estimate, some wrong answers slipped past the checks. So generated rounds play in the existing round player, labelled *auto-checked*, from the pre-generated reviewed set first. The blind check gets fixed before anyone relies on it.

**Order (gates):**
| By | Gate | Owner |
|---|---|---|
| Sat 6:00 AM | **Birthday session live on Pages**, end to end, desktop + phone | me |
| Sat 9:00 AM | Coin streak + positive test sessions live | @luanamaldaner |
| Sat 9:00 AM | Engine: stack merged, honest blind check, tight bands (#86), checks on the response (#80) | me |
| Sat 1:30 PM | User test round 1 on the 3 sessions (5 people) | both |
| Sat 6:00 PM | Fixes from testing; Home that sells the sessions; collection; "any topic" extra with reviewed cache; backend on Vultr/Render | both |
| Sat 10:00 PM | Design pass + motion; backup video recorded | both |

**Cut lines (new order):** 1) "any topic" live generation (keep the cached reviewed set); 2) Auth0; 3) Tiger → SQLite; 4) coin streak C5 "a coin like you" curve and birthday B3 dot-plot; 5) rematch screens. **Never cut:** the three sessions' guess → watch → extremes → your model vs reality → named mistake; the deployed URL; the backup video.

---

**Status:** **approved** (plan in force from 10:48 PM Fri). The product is in docs/product-spec.md.

**Split:** **me = engine/backend/data** (Gemini generation, validation, cache, API, the event DB, deploy) · **@luanamaldaner = frontend/demo** (screens, truth widgets, the reveal, the visual design).

**Starting point:**
- Skeleton: branch `alexander-freedman/skeleton` (FastAPI `/api/health` + Vite React).
- @luanamaldaner's paused frontend shell (#10).
- The pen-input prototype (branch `luanamaldaner/pen-input`).

**Hard times (official):**
- Devpost closes **8:30 AM Sun**; we **submit by 7:30 AM**.
- Expo **Sun 10 AM-12 PM**; closing **2:30 PM** (one of us at both).

**Time budget (evidence):**
- Approval (10:48 PM Fri) → 7:30 AM Sun is ~32.7h × 2 people. After sleep (~6-7h each), meals and user tests, that's **~40-44 build person-hours**.
- **Core estimates:**
  - engine ~20-24h (any-topic-engine.md)
  - reveal + 2 widgets ~8-10h (reveal-patterns.md)
  - integration buffer 3-4h (ai-era.md)
- **Tight but fits, if we hold the cut lines.**
- Ranges come from today's measured timings plus the studies in 36-hour-plan.md and ai-era.md. *They are estimates.*

## Blocks
| Block | Clock | Goal | Me (engine/backend) | @luanamaldaner (frontend) | Done when (gate) |
|---|---|---|---|---|---|
| **B1 Contract + first round** | Fri 10:48 PM-1:30 AM | One round plays end to end from a fixture | • Merge skeleton + CI (docs/ci.md)<br>• **JSON schema** for a round (misconceptions, items, widget spec) committed with 2 hand-checked showcase rounds (coin streak, positive test) as fixtures<br>• Gemini client: **Flash Lite** structured output + Gemma fallback + **disk cache by topic** + a request counter (1-2h). **Until the key is in the env, run on the mock/cached responses**<br>• **Tonight:** frontend live on GitHub Pages (fixtures + cached showcase rounds). The backend runs **locally on the server** for dev/tests only, on local SQLite (same schema as Tiger). **No backend deploy tonight** | • Merge #10 (shell, mock/live API, source chip)<br>• **Predict → confidence → lock** screen + **Distribution widget** against the coin-streak fixture (2-3h) | **1:30 AM:** coin streak plays predict → lock → reveal locally |
| **B2 Engine + reveal (+~2h engine buffer)** | Sat 1:30-9:00 AM | A typed topic becomes a playable, checked round | • Generation pipeline: schema-validate → compute truth → linter → **Gemma blind check** → fallback (6-9h, **+~2h buffer from the early approval: engine only, no new features**). Stay under **500 Flash Lite calls/day** (product-spec §7)<br>• Time real latency on our key and write it into gemini.md<br>• Sleep 5:30-8:30 | • Sleep 3:30-6:30<br>• **Reveal sequence** (beat, ink over pencil, shaded gap, verdict stamp) + **misconception card** + **Curve widget** (4-6h) | **9:00 AM:** a typed topic → a round on the deployed URL. If not, freeze stretch work and fix only this |
| **B3 Come-back loop** | Sat 9:00 AM-1:30 PM | It feels like a game you return to | • **Answer events** in Tiger Data (or Postgres if no card), "the room" %, collection + review queue API (3-4h)<br>• **Pre-generate + spot-check 30 cached topics** (1-2h; 30 Flash Lite calls) | • **Home**, **Building**, **Round summary**, **Collection** screens (4-5h) | Collection shows caught/busted from real plays |
| *Company Connect* | 10:30 AM-12:30 PM | Feedback | One of us shows the coin-streak round to Vobile/Roblox reps (30 min) | | Notes in docs/user-testing.md |
| **B4 Users, round 1** | Sat 1:30-2:30 PM (lunch) | Real evidence | Run 5 users with the 5-min script (plan-extras.md) | Same, in parallel | Findings + the top 3 fixes in docs/user-testing.md |
| **B5 Fix + polish + 3rd showcase** | Sat 2:30-8:00 PM | Top marks on Design + Functionality | • Fix the top 3 (≤45 min each)<br>• **Showcase #3: the birthday problem** (Curve; already built)<br>• "How it works" drawer data<br>• Auth0 (1.5-2h, **cut line 2**; keeps the collection across devices) | • **Visual pass: Notebook Arcade** (2.5-3.5h; design-depth.md, visual.md)<br>• Share card<br>• Motion polish<br>• `prefers-reduced-motion` | Scorecard re-graded; the biggest gap closed |
| **B6 Users, round 2 + freeze** | Sat 8:00 PM-12:00 AM | Lock it, protect the demo | 5 users at dinner (8-9 PM), same card. **Feature freeze at midnight.** Tag a release | **Record the backup demo video** (≤2 min, 1.5-2.5h; expo-video.md) | A before/after line for the pitch; video uploaded unlisted and its URL in the Devpost draft |
| **B7 Write + harden** | Sun 12:00-4:30 AM | Submission-ready | Bug fixes only; README (approach, generation pass-rate numbers, run in 3 commands, tools disclosure); sleep 12:30-3:30 | Devpost write-up (450-1,100 words, screenshots); sleep 3:30-6:30 | Draft complete; every sponsor tool named; **AI disclosure wording decided by me** |
| **B8 Submit** | Sun 4:30-7:30 AM | Ship with a buffer | **Submit by 7:30 AM.** Check repo/video/challenge boxes in a private window | (back at 6:30) | "Submitted" tag on Devpost |
| **B9 Rehearse** | Sun 7:30-10:00 AM | Win the table | Pre-warm the cache, set up the table (expo-video.md), breakfast 8:45 | Rehearse 3:00 + 1:30 pitches 3× each; "why did we do X" drill | Both of us can give both pitches solo |

## Integrations: keys, jobs, when, fallback
**Rule for all of them:** secrets live only in the app's git-ignored `.env` (`.env.example` lists the names with empty values). Never printed, logged or committed. Public config (the Auth0 domain + client ID) can go in repo config.

| Integration | Key / config | What it's for | Wired in | If it's missing |
|---|---|---|---|---|
| **Gemini** (MLH) | `GEMINI_API_KEY` (free tier, saved on the server 10:30 PM; live after the next restart) | Generates each topic's full package; Gemma blind-checks it (product-spec §7) | B1 client, B2 pipeline | Mock client serving the cached/hand-made rounds; the demo still works on showcase + cached topics |
| **Tiger Data** (MLH) | `TIGER_DATABASE_URL` (from @luanamaldaner by DM). **Until it arrives: local SQLite, same schema** | Answer events (hypertable) → "the room" %, the rhythm line and the review queue (continuous aggregates) | B3 | Local SQLite with the same schema; drop the Tiger prize if it never arrives |
| **Auth0** (MLH) | Domain + Client ID (public, posted in #hack-chat by @luanamaldaner) | "Sign in to keep your collection" (Google login); guest play first | B5 (cut line 2) | Guest only; collection in localStorage |
| **Domain** (MLH GoDaddy) | Registered by @luanamaldaner via the MLH link | The demo URL + QR on the table | DNS as soon as it's registered; HTTPS on `<ip>.sslip.io` meanwhile | The host's default URL (sslip.io / Render) on the QR |
| **Frontend hosting** | GitHub Pages (`gh-pages`, `scripts/deploy-pages.sh`) | The live site; works with no backend | Live from Fri night | — |
| **Backend hosting** | Vultr (MLH code arrives **Sat**) with HTTPS + CORS for the Pages origin | API (generation, events) | **Sat**, when the code is posted; then point the frontend at it | **Render free tier if there's no Vultr code by Sat 2 PM**. Tonight: local only |

**Spending stays at $0** unless I say otherwise. **Free Gemini only:** Flash Lite for live calls within the free limits. Showcase topics are written by us during the build and stored. Visuals are designed in code (SVG/CSS), with no AI image generation.

### Azure image generation (my paid Azure account; added 11:15 PM)
- **gpt-image-2** via an Azure AI Foundry endpoint (OpenAI client). **Build-time only:** a script generates images, they're committed as files, and served static. The public site never calls Azure.
- **Hard cap: 40 images** for the whole hackathon (count in NOTES.md), ≤1024x1024.
- **Planned use (~15):**
  - brand mark/hero (2-3)
  - 3 showcase illustrations
  - misconception "cast" portraits for the showcase ideas (~6)
  - a share-card background (1-2)
  - the rest held back
- **Owner:** me (script + generation), with @luanamaldaner choosing what's needed for the UI. SVG/CSS stays the base design system.

### Optional upgrade (only if I add $5 OpenAI credit; never depend on it)
- **OpenAI image generation** (`OPENAI_API_KEY`) for brand art and the cast card icons, generated once and saved as files.
- **Status (10:30 PM):** the account has no billing and a $0 balance, so any call is refused (insufficient quota).
- **Default:** the SVG/CSS icon set stays the plan either way.

## Never cut
- predict → lock → reveal on the coin streak
- the misconception card
- typed topic → checked round (with fallback)
- the cached showcase rounds
- the deployed URL + QR
- the backup video

## Cut lines, in this order, if a gate slips
1. Showcase #3 polish (the 23-dot calendar) and the Trajectory widget
2. Auth0 (guest only; the collection is stored locally)
3. Tiger Data → plain Postgres or SQLite (drop that prize)
4. Typed "why" classification (choices/bands only)
5. Review queue timing (collection only)
6. Estimate/Order widgets (Distribution + Curve + fallback only)

## Risks
| Risk | Evidence | Mitigation |
|---|---|---|
| Generated items are wrong | Studies found 22% factual errors in generated MCQs, and model distractors miss real student errors (any-topic-engine.md) | The truth is computed in code; linter + blind check; showcase rounds hand-checked; "auto-checked" label |
| Live generation is slow or rate-limited | Free tier: Flash 20/day, Flash Lite 500/day, Pro unavailable (AI Studio rate-limit page, our project) | Cache, pre-generate 30 topics, build in the background during the showcase, chips fallback |
| Integration bugs between our halves | ai-era.md: AI is slowest on the last 30% | The schema/contract lands first in B1; build against fixtures; merge small and often |
| Design looks generic | Judges mark down the default generated look (ai-era.md) | Notebook Arcade tokens and the banned-patterns list from design-depth.md |
| Sleep debt at the expo | 24h awake ≈ 0.10% BAC (plan-extras.md) | Staggered sleeps above; never both asleep; no deploys after ~17h awake without the other person |

## Marketing and story (issue #29, me unless noted)
| By | Task |
|---|---|
| Sat 12 PM | Name + one-liner decided; domain claimed via the MLH code |
| Sat 6 PM | Devpost draft started (template headings, screenshots as features land) |
| Sat 10 PM | 2-min video script final (@luanamaldaner records in B6) |
| Sun 4 AM | Devpost final, README, the 3-min pitch and judge Q&A sheet (pitch.md + demo.md) |
| Sun 7:30-10 AM | Rehearsals, table tent card + QR |
| After the event | DEV post (needs my DEV account) |

## Hourly
- **HOURLY DIGEST** in #updates (both sides).
- Claim lock on every issue.
- PRs under ~200 lines.
- main always runs.
- Re-grade docs/scorecard.md after every gate.
