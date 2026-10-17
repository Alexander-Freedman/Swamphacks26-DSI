Mode: BUILD (approved by Alex; plan in force from 10:48 PM Fri)

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
  - **Image count: 0 / 40**

## How to run
- **Live site (GitHub Pages):** https://alexander-freedman.github.io/Swamphacks26-DSI/ is served from the `gh-pages` branch. After **every merge to main that touches `web/` or `data/rounds/`**, run `scripts/deploy-pages.sh` on a clean, up-to-date `main`. It builds web/ with base `/Swamphacks26-DSI/`, copies the showcase rounds to `/rounds/*.json` (+ `rounds/index.json`), adds `.nojekyll` and a 404 fallback, refuses to publish anything key-shaped, and pushes gh-pages. The site works with no backend: the frontend falls back to `${import.meta.env.BASE_URL}rounds/<slug>.json`. No API key ever goes in the frontend.
- **Backend hosting (later):** Render or Vultr over HTTPS. CORS allows the Pages origin `https://alexander-freedman.github.io` and later the custom domain. Until then the site runs on the static showcase rounds.
- Vite: `base` is `/Swamphacks26-DSI/` (override with `VITE_BASE=/` for a root deploy). Use `import.meta.env.BASE_URL` for asset/data paths and as the router basename. The dev server proxies `/api` to `localhost:8000`.
Nothing to run yet. Build box tooling (my side): Python 3.12, uv 0.13, Node 22.23 / npm 10.9 in `~/.local/bin` (DeepSpace would also need `npm i -g npm@11`). No Docker on the build box; deploys go to Vultr/Render. The box is 1 CPU, so heavy model training should be kept small or run on Vultr.
