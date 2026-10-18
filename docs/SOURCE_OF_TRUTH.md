# Source of truth (read this first)

**Verified Sun Oct 18, ~3:45 AM ET** (Tiger correction ~4:05 AM) against `main` @ 1695e43 and the live server. If any other doc disagrees with this file or the [README](../README.md), this file and the README win. The README is the accurate product description; this file adds what's live, what's open, judging logistics, exact wording, and fallbacks.

**Stale docs (don't trust for current facts):** `docs/README.md` (says "nothing is picked yet"), `strategy.md`, `scorecard.md`, `product-spec.md`, `build-plan(s).md`, `experience.md`, `story.md`, `pitch.md`, `user-testing.md` (written for the old birthday/coin sessions). `learn-plan.md` and `learn-api.md` are the current design and API contract.

---

## 1. What Onionskin is (one breath)

Type any topic; Onionskin builds a short visual lesson that takes you from a first guess to a model you can run in your head, in eight research-backed steps, and names the wrong idea you started with. Every step cites the paper behind it.

- Headline on the site: **See your thinking in layers.** Tagline on the video: **Learn anything, one layer at a time.**
- Track: **Entertainment & Creative Technology** (not AI/ML, not First Timers).

## 2. Live right now

| Thing | State |
|---|---|
| Site | **https://onionskin.study** (GitHub Pages, HTTPS on; the old github.io link redirects here). Deployed from `main` @ 1695e43. |
| API | `https://45-77-118-201.sslip.io` (Vultr VM, Caddy, FastAPI). `/api/learn/status` returns `codex: ok`. |
| Topics | **22 on the server**: 10 reviewed (seasons, compound interest, natural selection, Ohm's law, base rates, supply and demand, opportunity cost, recursion, derivative, SN2) plus 12 built live tonight (for example Charles's law, terminal velocity, photosynthesis, Hooke's law). Home shows reviewed chips first, the rest behind *Show more*. |
| Tests on main | API **207 passed** (1 skipped), web **536 passed** (13 skipped). |
| Research page | `/?research=1` (tab **Research: why it works** in the top bar): 24 sources (each link checked to resolve), 11 step explanations, 7 FAQ answers (fold open on tap), Ask Onion limited to our research. |
| Video assets | Intro (3 s) and end card (7 s) MP4s are on Alex's laptop (`SwampHacks 2026/end-card/`), not in the repo. |

## 3. Judging logistics (official rules)

- **Feature freeze 5:30 AM.** Devpost closes **8:30 AM**; we submit by **7:30 AM**. After that, only demo-breaking fixes.
- Expo **Sun 10 AM to 12 PM**, science-fair style (judges come to the table). Closing and awards 2:30 PM in CAR 100. One of us at both.
- **Live demo: at most 3 minutes, plus 1 extra minute for judges' questions.** Plan about 1:45 of talking and demo so there's slack.
- Devpost video: at most 2 minutes. AI use **must be disclosed** (done in the README; reuse it on Devpost). "Not a simple reskin of an AI tool" is a rule: our answer is the research-designed steps plus truth computed in code.
- Mark the track (Entertainment & Creative Technology) and any challenges on Devpost.

## 4. The product (accurate wording)

The eight steps, what the learner does, and the paper (same as the why rail and the research page):

| Step | What you do | Source |
|---|---|---|
| 1 Guess first | Write a guess before being taught | Richland, Kornell & Kao 2009 (wrong guesses boost later learning) |
| 2 One true fact | Predict from one fact, often on a live graph | Fyfe et al. 2014 (concrete first, then abstract) |
| 3 Compare two cases | Two look-alikes; write *When ___, then ___, because ___* | Gentner, Loewenstein & Thompson 2003; Schwartz & Martin 2004 |
| 4 Stress test | Predict three extremes; does your rule see them coming? Add the missing piece | Clement 2009 (experts test models with extreme cases) |
| 5 Draw it | Sketch from memory; each part checked | Schmeck et al. 2014 (drawing to learn). **Not** Wammes 2016, which is about word-list memory. |
| 6 Tell it apart | Pick it against its look-alike | Brunmair & Richter 2019 |
| 7 Carry it over | Same idea, different field | Barnett & Ceci 2002 (far transfer is rare and hard) |
| 8 What you caught | The wrong idea you started with plus its fix, saved to the Notebook | Chi 2005 |

- **No points, XP, streaks, badges or leaderboards**, because expected rewards can crowd out interest in the learning itself (**Deci, Koestner & Ryan 1999**, a meta-analysis of 128 studies). The reward is understanding; the app has to work even if a reward layer were deleted.
- **Guided demos:** the Orgo card opens SN2 as a Learn topic (build ethanol, push the arrows, SN2 vs E2 inside the steps); the Calculus card opens *derivative* (sketch the slope and drag the tangent, area, slope and area undo each other).
- **Ask Onion:** a tutor beside every step and on the research page. Hints, not answers.
- **Notebook:** each wrong idea a lesson caught, with the fix; "Learn it again"; getting it right twice later crosses it off. It's stored in the browser (no accounts; accounts were cut on purpose).

## 5. How it's built (verified claims)

Use this paragraph; every clause is checked against the code:

> FastAPI on a Vultr VM behind Caddy. OpenAI's Codex CLI writes new lessons and grades answers under a fixed contract: judge piece by piece, never give the answer mid-attempt, ask one targeted follow-up, quote the learner's own words, and hold the verdict under pushback. For a new topic it also proposes a graph, which only ships if code recomputes every number and it matches. Ask Onion uses Codex with Gemini as a backup, and any reply that cites a number not on the screen is replaced with a line telling the learner to check the screen.

Details if asked:

- Contract rules 1 to 7 are verbatim in `api/app/learn/prompts.py` (rule 6: at most 2 short sentences a 15-year-old understands; rule 7: define every symbol when it first appears).
- **Truth is computed in code, never by a model.** Graph values come from `api/app/spec.py` and `truth.py`. A model-proposed graph is attached only if it passes `compile_case` (bands cover the slider, the knob moves the curve, allowed functions only), its claimed answer matches the computed one within 2%, and every number in its captions matches. Otherwise the topic is text-only. Live tonight: Charles's law, terminal velocity and the ideal gas law got graphs; recursion correctly got none.
- Ask Onion order (`api/app/help.py`, Learn path): Codex, then Gemini 3.5 Flash-Lite, then Gemma 4, then a topic-specific hint from the screen. A reply with numbers not in the screen's facts becomes the fixed line *"I'd rather not guess a number: check the readout on screen."*
- Over-long model text is trimmed at a sentence boundary instead of rejecting the lesson.
- **Data: we do NOT use Tiger Data in the current product.** The server is connected to Tiger (the env var is set, no fallback warning), but no screen calls `/api/answers`, so nothing is written (checked at 4 AM: no web code calls it; 2 stray writes in 12 hours). Learner data stays in the browser (the Notebook). **Don't claim Tiger to judges.** Ready-made topics ship as static JSON on Pages, so they open with no backend.
- Limits: 60 graded answers per IP per hour, 800 per day site-wide; 6 live-built topics per IP per hour.
- **Measured times** (live API, tonight): guess 4.3 s, anchor 4.9 s, stress 4.5 s per card, transfer 6.1 s, Ask Onion about 4 s, a brand-new typed topic **1 to 2.5 minutes** (lesson plus graph check).

## 6. Demo plan (what's decided, what's open)

- **Demo mode:** PR **#318** adds `https://onionskin.study/?learn=why-we-have-seasons&demo=1`. The scripted answers on the judging path replay the **real** model replies recorded from the live API (0.6 s each); anything a judge types still goes live. **It's open: it must be merged and deployed before the 5:30 freeze** (Alex's side merges and deploys).
- **Demo script:** PR **#316** (`docs/demo-script.md`, 1:45 plus Q&A). **It still says demo mode is "pre-staged tabs, no code"; once #318 merges, update it to use the `?demo=1` link.**
- Don't type a brand-new topic live during the 3 minutes (1 to 2.5 minute wait). If a judge asks for one, start it, keep demoing, and come back; or open one of the 12 already built.
- **Fallbacks if the API is down:** the 10 reviewed topics still open (static JSON); graded steps show an "offline check"; Ask Onion shows the topic hint. The ready-made path still demos end to end.

## 7. Say this, not this

| Say | Don't say | Why |
|---|---|---|
| "We made the decisions; the agents wrote most of the code." | "AI-assisted", "we wrote the code with help" | Understates it; one question exposes it. |
| "The agents reviewed each other's PRs under rules we set; we tested the live site." | "We reviewed or merged every PR" | 300+ PRs; not true. |
| "Codex CLI on our server" | "the OpenAI API" | We don't call the OpenAI API. |
| "Codex first, Gemini as backup" | "Gemini powers Ask Onion" | Out of date. |
| "Every number in a graph is computed by code" | "Every answer is checked by code" | Text answers are graded by the model under the contract. |
| "24 sources, each link checked" | "all peer-reviewed" | Kasneci & Kasneci 2026 is an arXiv preprint. |
| "Drawing to learn (Schmeck 2014)" | "drawing doubles recall" | That's Wammes 2016, about word lists. |
| "No recorded user tests yet" (if asked) | invented tester quotes | There are none in the repo. |
| "Learner data stays in your browser" | "We store answers in Tiger Data" | Wired up, but nothing calls it. |

## 8. Who owns what, how we work

- **Alex's side:** `api/app/learn`, `LearnSession.tsx`, `WhyPane.*`, `AskHelp.*`, `App.tsx`, `research/*`, Home. Alex's side **merges and deploys** (`scripts/deploy-pages.sh` with `PAGES_CNAME=onionskin.study` and `VITE_API_BASE`, and `deploy/vultr/update.sh`).
- **Luana's side:** `sessions/orgo`, `sessions/calculus`, `learn/stress`, `learn/draw`, `learn/contrast-visual`, `learn/custom/sn2-reaction`, demo mode (#318), demo script (#316). Comment on issue #1 when something merges so it gets deployed.
- Branches `alexander-freedman/*` and `luanamaldaner/*`, small PRs, tests and lint before each, **no AI attribution in commits or PRs** (the README disclosure is the one place it's stated).

## 9. Known gaps (be honest if asked)

- No recorded user tests (the kit in `user-testing.md` is for the old sessions).
- Live-built topics are unreviewed (labelled "built just now, not yet reviewed"); graphs only when one honestly fits.
- The Notebook lives in one browser; no accounts.
- Supply and demand, opportunity cost and recursion have no graph (no honest single curve).
- The two WIP PRs (#249, #250) are old directions; don't merge them.
