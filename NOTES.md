Mode: BUILD (approved by Alex; plan in force from 10:48 PM Fri)

Team rules: [CONTRIBUTING.md](CONTRIBUTING.md) (plan every task first; goal: help people understand concepts faster, visually).

# Notes

Decisions + how to run things. Keep current.

## Decisions
- Phase 1 is research only. Phase 2 (building) starts after I pick a direction from docs/strategy.md.
- Branches: `alexander-freedman/<topic>` and @luanamaldaner's equivalent. PRs into main, reviewed by the other side. Never force-push main.

- Research scope (2026-10-16): research ALL hackathons, not just SwampHacks: MLH, Devpost, big university and corporate events. Cover how winning teams pick ideas, what judges reward, pitch/demo playbooks, prize stacking, time plans, team workflows, what repeat winners do differently. Apply it to SwampHacks at the end.
- Rough direction (2026-10-16, NOT locked): my Mental Models Tool, a study tool that helps students build deep "runnable" mental models of hard concepts (understanding you can simulate and apply), not flashcards/recall. Whether we go with it depends on SwampHacks tracks/prizes. It goes in strategy.md as one ranked direction, with track fit + 2-day scope + demo plan, ranked honestly against alternatives.

- Event facts (from docs/strategy.md): SwampHacks XII is Oct 16-18 2026 at Reitz Union. Devpost opens Fri 8:00pm, closes **Sun 8:00am** (target submit ~6am). All code must be written during the event: no project code before hacking opens. Expo judging: 3 min demo + 1 min Q&A, video 2 min max. General + max one track, unlimited sponsor/MLH prizes. One of us must be at judging and closing. Tool use must be credited on Devpost; I decide the wording before submit.

- Oct 16 ~2pm: I'm deciding the direction later; event starts at 4pm. Build plans for the top two are in docs/build-plans.md.

- Oct 16: nothing is picked. Research continues nonstop until I say "we have an idea". Hazard radar and Mental Models Tool are candidates, not decisions.

- Oct 16 4pm: hacking (code allowed) starts ~8:30pm Fri, matching the Notion rules. Doors and check-in are earlier. No project code before 8:30pm.

- Oct 16 6:40pm (replaces the 5:30pm rule): research runs full speed, several passes in parallel, until a USAGE WIND-DOWN line or until I say "we have an idea". Usage is in ~/hack/usage.txt on the bot box.

- Oct 16 6:50pm: two modes. RESEARCH (now): work docs/research-queue.md top-down. BUILD (after I say "we have an idea" and hacking has opened): docs/demo-script.md + docs/scorecard.md drive the work. The plan for the 35h is docs/36-hour-plan.md.

- Oct 16 7 PM, official (hacker rules): code 8:30 PM Fri → 8:30 AM Sun; Devpost closes 8:30 AM, we submit by 7:30 AM; after that only demo-breaking fixes. Expo Sun 10-12, closing 2:30 PM (one of us at both). An idea from before is OK, code from before isn't. AI tools must be credited on Devpost/README. Max ONE specialized track + any challenges we meet.

- Oct 16 7:10 PM: AI-tools disclosure wording gets decided at the end (B7, Sun ~4:30 AM). The draft is in #questions.

- Oct 16 7:20 PM: Least Vibe Coded is dropped completely; it's out of every stack. Lean into heavy-AI prizes (AI/ML track, Gemini, anything AI) plus the sponsor challenges.

- Oct 16 7:20 PM: building with AI ≠ the AI/ML track. One specialized track or none; choose per stack by expected value, and don't default to AI/ML. Gemini/MLH prizes are challenges and stack with any track.

- Oct 16 9:30 PM: not my first hackathon, so First Timers is out. Track choice is AI/ML, Entertainment, Hardware or none.

- **Oct 16 ~9:50 PM, DIRECTION DECIDED:** we're building **Mental Models, general version**: one engine that works on ANY topic someone types in (coin flips, physics, calculus, anything), not physics-only. Goal: nuanced understanding of complex subjects in a Quizlet-style loop that's addictive to use. **Predict first → see the truth interactively → get your exact misconception named → keep coming back.**
  - **Track:** Entertainment & Creative Technology (not AI/ML).
  - **Dropped:** the hazard radar and fraud stacks.
  - **Paused:** Luana's #11-#16 and PR #10.
  - **Research mode** until I say "start building"; the product spec (docs/product-spec.md) gets my review before anything is built.

- Oct 16 ~10:10 PM, approval rule: I post the product spec + build plan in #questions with an @. If there's no answer in 30 min, it counts as approved: set "Mode: BUILD (auto-approved at <time>)" here, comment on #1 that building starts and which issues are @luanamaldaner's, open the build issues, and build through the night (claim lock, small PRs, main always runs, hourly digests). A later answer from me overrides the plan.

- Oct 16 10:30 PM: **spending stays $0.** Free Gemini only (key saved on the server; free tier). OpenAI has no billing, so no AI image generation: visuals are SVG/CSS. Showcase topics are written by us during the build and stored.

- Oct 16 10:40 PM: **the product name is @luanamaldaner's call** (asked on #1, options in docs/story.md). Code uses the neutral working name `mm` until it's recorded here. Look / showcase #3 / label follow the auto-approval rule unless I answer first.

- Oct 16 10:50 PM: **learning-first, no XP/points/badges/levels/leaderboards.** The reward is the feedback (reveal, misconception named, busted, a mastery map). I kept a light informational "N of the last 7 days" line: forgiving, nothing to lose, cut if user tests read it as a counter. Talking point + Q&A in docs/pitch.md. My Mental Models research is a resource, not a rulebook.

- Oct 16 ~10:55 PM, **my decision: the look is Notebook Arcade.** Pencil = your guess, ink = truth, marker = the gap, a stamped verdict, a chunky display face. (The name is still @luanamaldaner's call.)

- Oct 16 ~11:00 PM, **showcase topics (my call, delegated by Alex):** picked for being easy to demo reliably, fun to watch, and fully computed in the browser (offline, never generated). Only 2 widgets needed.
  1. **Coin streak** (Distribution): longest run in 100 flips. Exact: mean 6.98, ≥5 in 97.2%.
  2. **Positive test / base rates** (Distribution, 1,000 dots): 1% base rate, 90% sensitivity, 9% false positives → 9.2%.
  3. **Birthday problem** (Curve + a 23-dot calendar lighting up): P(shared birthday) with 23 people = 50.7% (computed). People tend to guess about half of 365 ([Live Science](https://www.livescience.com/what-is-birthday-paradox); a teaching observation, not a survey). Misconception: "it's about MY birthday" ([Conversable Economist on Hand](https://conversableeconomist.com/2014/02/22/intuition-behind-the-birthday-bets/)).
  - **Dropped as showcases** (generated topics can still cover them): Off the Edge (no solid adult error-rate source; needs the Trajectory widget) and Wason 2-4-6 (great, but a rule-discovery game, not a reveal over your guess).
  - **The live "judge names any topic" moment** goes on top of these.

- Oct 16 ~11:05 PM, **approved:** build-plan.md is good. Name later, keep the working name `mm`. B1 starts at approval (10:48 PM). The ~2 extra hours go to engine buffer in B2, **not** to new features.

- Oct 16 ~11:15 PM, **Azure image generation available (my paid account):** build-time only (a script generates, files are committed, served as static assets; the public site never calls Azure). **Hard cap 40 images** unless I say more; ≤1024x1024. Key stays in `~/.hack-app.env` / `.env` only. Use it where it helps the demo + Easy On The Eyes (brand art, showcase illustrations, share card); SVG/CSS stays the base.
  - **Budget raised to 100 images (Sat ~12:00 AM); beyond 100 needs my approval.** Same rules.
  - **Image count: 10 / 100** (5 early tries: coin streak, positive test, birthday, 2 hero, none committed; 5 for session cards on Home: 3 first passes + 2 retries, 3 picks committed in `web/public/art/`, see docs/art-manifest.md)

- **Oct 16 ~11:40 PM, MOST IMPORTANT DIRECTION:** what's live feels like two slides (one guess, one text verdict). That is not the product. **The product takes someone from never having seen a concept to a mental model they can actually run, and it is inherently visual:** you manipulate things, watch them move, draw, and see your own model next to reality.
  - **Backbone:** the 10-stage concept-to-runnable-model pipeline (from my research):
    0. surface your guess and sketch
    1. a concrete anchor you can run
    2. contrasting cases side by side, then name what's the same
    3. an explanation tied to YOUR mistake
    4. run it at the extremes until it breaks
    5. draw it from memory and get it checked
    6. fade the help
    7. tell it apart from its neighbor
    8. carry it somewhere new
    9. space and re-quiz
  - Adapted to a fun creative-track experience and a 3-min demo; some stages take seconds.
  - **Plan before building:**
    - **Step 1:** docs/experience.md, a storyboard per showcase topic, screen by screen, plus low-fi mockups (HTML/SVG, screenshotted).
    - **Step 2:** @luanamaldaner reviews, we agree, then re-plan build-plan.md.
    - **Step 3:** build toward it, with QA checking every deploy against the storyboard.
  - **Nothing already built is "done";** judge everything against this goal.
  - **Clarified (~11:45 PM): NOT all 10 stages.** The pipeline is the inspiration, not a checklist; a 10-stage course isn't Quizlet-style. **Goal: take someone from not understanding a concept to understanding it through visualizations, in a quick session that feels good to come back to.** Borrow the strongest moves:
    - guess first
    - a concrete example you can watch and manipulate
    - push it to the extremes
    - your own model drawn next to reality
    - your exact mistake named
  - Per topic, pick only what makes it click visually. Keep sessions short.
- Oct 16 ~11:35 PM: **standing QA reviewer.** After every Pages deploy and at least every 30 min, a QA pass plays every showcase round at desktop + phone sizes (~/qa Playwright), screenshots every state, and files one `qa` issue per real problem (frontend → @luanamaldaner, backend/data → me). It re-checks closed qa issues each pass. QA never blocks the build.

- Sat ~12:00 AM, **takeover rule:** while @luanamaldaner's side is offline, I own everything (frontend + backend, storyboard, screens, reveal, design, QA fixes, deploys). Any issue/PR assigned to her with no commit or comment from her side for 30+ min is mine: comment "taking this while your side is offline", reassign, build on her branch or a new one, keep her work. Hand-back signal: **"BACK ONLINE"** on #1 → I reply with the state, hand back the frontend issues I'm not mid-way through, and we return to the normal split. Rule 17 still applies.
- Sat ~12:10 AM, **design phase closed** (docs/experience.md + docs/experience-look.md). **By morning the live site shows a real working visual session for at least one topic** (rule from me). Build order: birthday (#78) and coin streak sessions first, then positive test.
- Sat ~12:10 AM, **generation trial (25 topics, prompt v2):** 24/25 delivered, median 27 s (p90 51 s): too slow to generate live on stage. Every generated item came out as a plain estimate (no curve/sampler), several had wrong answers the checks didn't catch, and the blind check mostly timed out or errored while reporting `blind_checked: true`. **Decision:** the demo runs on hand-reviewed rounds; "try any topic" is a labeled extra, and the blind check gets fixed or removed before anyone relies on it.

- Sat ~12:20 AM, **Auth0 + Tiger + name:**
  - Auth0 SPA app "Mental Models": domain `dev-vngwndh6p388zoms.us.auth0.com`, client ID `eU3gBCqk5V0yHLdq03UHCrJmOGF5ZGBb`. **Public config** (no client secret), fine in frontend config. Allowed callback/logout URLs + web origins only cover `http://localhost:5173` so far; asked @luanamaldaner on #1 to add `https://alexander-freedman.github.io` and `https://alexander-freedman.github.io/Swamphacks26-DSI/` (custom domain later). Wired per the build plan (cut line 2, Sat afternoon), **guest play first**.
  - Tiger Data service exists; `TIGER_DATABASE_URL` goes in `.env` when I paste it. SQLite until then.
  - Name: @luanamaldaner picks; working name `mm` until she posts it.
  - **Name decided Sat ~1:35 AM (@luanamaldaner): Onionskin** (like an animator's onion skin: your guess stays as a faint layer under the truth). Domain **onionskin.study** registered; Auth0 already allows https://onionskin.study. Tagline: "See your thinking in layers."

- Sat ~12:30 AM, **my decisions on the storyboard + re-plan (#94 approved):**
  - Every screen gets **one plain-language sentence: what to do and why it matters** (list in docs/experience.md). Keep the visuals, add the guidance.
  - **Final product feature (Saturday, after the 3 sessions are live): "ask a question" help chat** beside each session. Knows the topic + screen, plain words, a hint (not the answer) before lock-in, never replaces the visuals; free Gemini tier with a per-IP rate limit and a daily cap (rule 16). Gate Sat 4 PM; cut line: a static per-screen hint.

- Sat ~12:00 PM, **backend live on Vultr (my decision + setup):** server `onionskin-api`, 45.77.118.201, Miami, Ubuntu 24.04, vc2-1c-1gb ($5/mo from the $100 MLH credit). API at **https://45-77-118-201.sslip.io** (Caddy auto-HTTPS; domain later), systemd `mm-api`, kit in deploy/ (#118). `/etc/mm/env` (mm:mm 600) holds only GEMINI_API_KEY, TIGER_DATABASE_URL, MM_CORS_ORIGINS (Pages origin + onionskin.study); per-IP limits and daily caps on (code defaults). Pages is built with `VITE_API_BASE=https://45-77-118-201.sslip.io`. **No Vultr API key; never create, resize or add any Vultr resource** (no extra servers, backups, snapshots, block storage, load balancers, DDoS add-on). **The server is destroyed after judging on Mon Oct 19** (I have a calendar reminder). Smoke test 12:10 PM: health ok, 3 rounds, CORS allows Pages only, reviewed topic instant, live generation 5.5 s (2 curve items, 1 dropped by checks), help chat answers hint-only before lock.
- Sat ~12:15 PM, **DIRECTION UPDATE (my decision; a reframe, not a restart; keep the 3 sessions, the visuals, the backend and everything merged):** a chatbot *explains*; Onionskin makes you *predict*, runs a simulation that shows where you were wrong, and names the mistake.
  1. **Any-topic engine = the AI turns a topic into a RUNNABLE MODEL:** it picks one of our existing widgets (curve, sampler, dial…) and fills its parameters, variables, the prediction prompt, the extremes to try and the named misconception, as a JSON spec validated against a schema. The true answer is always computed in code from the spec, never written by the model. If no widget fits or validation fails, say so honestly and offer the nearest reviewed topic. Re-measure latency + quality on the Vultr API; if live stays slow, pre-build and hand-check 20-30 topics with the new engine and serve them cached. Retire the old "AI writes a round" path where this replaces it; never claim checked when it wasn't.
  2. **Stage 2 "pull out the structure"** (comparing two cases beat studying them separately: "a marked advantage", Gentner, Loewenstein & Thompson 2003; "nearly three times more likely" to transfer is from Loewenstein, Thompson & Gentner 1999 on negotiation students; abstracts only, effect sizes unverified): one **compare screen** per session after the reveal: a second case that looks different but works the same (birthday → hash collisions / shared PINs; coin streak → another run of streaks; positive test → spam filter / airport screening); ask "what's the same about how these work?", let the user name it, then show the shared principle. One guidance line, Notebook Arcade style. Generated topics get one when the spec includes a second case.
  3. **Pitch headline:** "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why." AI story everywhere: **the AI builds the simulation; code guarantees the truth; you do the thinking.**
  - **Never cut:** compare screens, the pitch. **Live generation falls back to the pre-built set.** Devpost due Sun 8:30 AM (we submit by 7:30).

- **Sat Oct 17 ~1:05 PM, AGREED DIRECTION (Luana + Alex; supersedes the 12:15 PM pitch line and anything below that conflicts):** Onionskin = **type any topic (incl. orgo and calculus) and learn it visually.** Problem now: it's barely visual (most questions are text + a number box). Fix:
  1. **Every step is a visual you interact with:** drag, draw, slide, build, watch it move. Text only as short labels/captions next to the picture. No round is just a question + a number box.
  2. **Typed topics come back as an interactive visual** (graph, diagram, animation, molecule, simulation), never a text quiz. If the engine can't build a visual for that topic, show a visual it *can* make (a chart/diagram), never plain text.
  3. **Showcase levels to build:** calculus = drag the tangent line, fill the area under a curve with rectangles, sketch the derivative over the function; orgo = build a molecule by dragging atoms/bonds, animate a reaction mechanism with curved arrows.
  4. **No betting language** (bet, "lock it in", "called it", confidence picker) and **no XP/points.** At most a subtle "mastered" check per topic. Keep the notebook of mistakes.
  5. **Headline:** "See your thinking in layers." **Subline:** "Type any topic. Watch it come alive."
  - Still: truth computed in code, never by a model; no pill shapes (4px corners, #190). Split + issues on #1.
- **Sat ~12:50 PM, UI rule:** no pill-shaped buttons, chips, tags, toggles, pickers or toasts: 4px corners so they read as cards/stamps. Circles stay for dots, coins and slider thumbs (#190).

## How to run
- **Live site (GitHub Pages):** https://alexander-freedman.github.io/Swamphacks26-DSI/ is served from the `gh-pages` branch. After **every merge to main that touches `web/` or `data/rounds/`**, run `scripts/deploy-pages.sh` on a clean, up-to-date `main`. It builds web/ with base `/Swamphacks26-DSI/`, copies the showcase rounds to `/rounds/*.json` (+ `rounds/index.json`), adds `.nojekyll` and a 404 fallback, refuses to publish anything key-shaped, and pushes gh-pages. The site works with no backend: the frontend falls back to `${import.meta.env.BASE_URL}rounds/<slug>.json`. No API key ever goes in the frontend.
- **Hosting tonight (decided Fri ~11:25 PM):** frontend on GitHub Pages; backend local on the server for dev/tests only; local SQLite until the Tiger URL arrives. **Sat:** Vultr (MLH code) with HTTPS + CORS, then point the frontend at it. Render free tier if no Vultr code by Sat 2 PM.
- **Deploying the API:** everything is in [deploy/README.md](deploy/README.md). Vultr: `sudo bash setup.sh` from `deploy/vultr/` on a fresh Ubuntu 24.04 VM (Caddy HTTPS on `<ip-dashes>.sslip.io`, systemd `mm-api`, keys only in `/etc/mm/env`), `update.sh` after merges. Render fallback: `render.yaml` Blueprint, values set in the dashboard. Then smoke-test and publish the site with `VITE_API_BASE=https://<host> scripts/deploy-pages.sh` (the web app still needs to read `VITE_API_BASE`; see the README).
- **Backend hosting (later):** Render or Vultr over HTTPS. CORS allows the Pages origin `https://alexander-freedman.github.io` and later the custom domain. Until then the site runs on the static showcase rounds.
- Vite: `base` is `/Swamphacks26-DSI/` (override with `VITE_BASE=/` for a root deploy). Use `import.meta.env.BASE_URL` for asset/data paths and as the router basename. The dev server proxies `/api` to `localhost:8000`.
Nothing to run yet. Build box tooling (my side): Python 3.12, uv 0.13, Node 22.23 / npm 10.9 in `~/.local/bin` (DeepSpace would also need `npm i -g npm@11`). No Docker on the build box; deploys go to Vultr/Render. The box is 1 CPU, so heavy model training should be kept small or run on Vultr.
