# Devpost draft (mm, working name)

**Status:** draft, rewritten Sat for the visual sessions (docs/experience.md, docs/experience-look.md, the re-plan at the top of docs/build-plan.md). The name stays **mm (working name)** until @luanamaldaner picks one (options in docs/story.md). Every number has a source link or a "computed" note; anything we couldn't check is marked *unverified*. Before submitting, go through "Confirm before submit" at the bottom.

**Tagline (candidates):** "Guess in pencil. Truth in ink." / "See what you believe, next to what's true."

---

## Inspiration
Flashcards test whether you can *recall* an answer. They don't test whether you can *run* the idea in your head. Most of us "know" a probability fact and still guess wrong when the numbers change. In one classic case, about 95 of 100 doctors estimated a positive mammogram meant roughly a 75% chance of cancer; the answer was 7.7% ([APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care)).

We kept coming back to one classroom finding: students who only *watched* a physics demo understood it no better than students who never saw it, while students who *predicted* the outcome first did significantly better ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). So we built short sessions where you guess first and then *see* your own model next to reality.

## What it does
mm is a set of short visual sessions (2-3 minutes each, our design target) that take you from not getting a concept to a model you can run in your head. Three are hand-built: **the birthday problem**, **coin streaks**, and **a positive medical test**. Every session follows the same five moves:

1. **Guess in pencil.** You commit first: drag a slider, tap out a sequence, or draw a curve. Your guess is a dashed pencil mark, and it never disappears.
2. **Watch a real example run.** Fill a room and watch a line appear for every pair that could share a birthday; tap out 20 "random" flips and watch 20 real ones deal in under yours; test 1,000 people and watch the positives pile up.
3. **Push it to the extremes.** One big slider changes the knob that matters (people in the room, number of flips, how rare the condition is), and the ink truth moves live.
4. **Your model next to reality.** Your pencil curve and the ink truth share the same axes, and a highlighter shades the gap between them, so you see exactly where your model breaks.
5. **Your mistake, named.** A stamp lands (*Called it*, *Close* or *Way off*) and a card names the specific wrong idea, quoting your own number: "You need about half of 365." Then one rematch with new numbers checks that the idea stuck.

Example: in the birthday session you guess how many people it takes for a 50% chance that two share a birthday. Fill a room and 23 people already make 253 pairs (computed). Then you draw your curve, and the real one inks in over it: 23 people → 50.7%, 57 people → 99.0% (computed exactly). The card shows why it feels wrong: someone sharing *your* birthday in a room of 23 is only 5.9% (computed).

The other two: in 100 fair flips the longest run averages 6.98, and a run of 5 or more shows up 97% of the time (exact computation, [showcase-facts.md](research/showcase-facts.md)), so a hand-made row alternates too much. And with a 1% condition, a test that catches 90% and false-alarms on 9%, a positive means only a 9.2% chance you have it (computed).

**Ask a question.** A small help chat knows the topic and the screen you're on. Before you lock a guess it gives a hint, never the answer, and it points back at the visual ("drag the slider to 57 and watch the dot").

**No points, on purpose.** In a semester-long class, badges and a leaderboard lowered motivation and final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)). The reward is the moment your guess meets reality. Each mistake goes into your notebook and comes back as a remix with new numbers until you've busted it.

**Extra: try any topic.** You can type your own topic and get a short round from our generation engine, clearly labelled *auto-checked*, not *reviewed*. In our 25-topic trial it delivered 24 of 25 topics with a median of 27 seconds (our own trial, small sample, NOTES.md Sat ~12:10 AM), and a few wrong answers slipped past the checks. That's why the sessions we demo are the hand-reviewed ones.

## How we built it
- **Sessions are code, not slides.** Each session is a React + TypeScript module (`web/src/sessions/<topic>/`) that computes its own truth in the browser: exact formulas for the birthday curve and the test, exact computation and simulation for coin runs. No number on screen is one a model made up.
- **One visual language.** "Notebook Arcade": pencil (dashed) = you, ink (solid) = truth, highlighter = the gap, never told apart by color alone.
- **The engine.** Gemini 3.5 Flash-Lite turns a topic into a compact structured-JSON round (misconceptions first, then questions mapped to them). Our backend computes the truth from a spec and drops items where the model's answer disagrees.
- **Free tier only.** Gemini Flash-Lite (500 requests/day on the free tier, [gemini.md](research/gemini.md)) with a Gemma fallback; rounds are cached by topic; every public endpoint has a per-IP rate limit and a daily cap, and the key lives only on the server.
- **Tiger Data** stores answer events, which power "the room": how other players guessed, next to your guess.
- **Auth0, guest first.** You play without an account; signing in only keeps your notebook across devices.

## Challenges we ran into
- **"Any topic" vs honest.** Our first version generated everything. It was too slow for a live demo and not reliable enough without review, so we flipped the product: hand-built visual sessions first, generation as a labelled extra.
- **Text verdicts don't teach.** Our first build showed a guess and a text answer: correct and forgettable. Keeping your pencil guess on screen while reality moves is what made it click.

## Accomplishments that we're proud of
- The birthday reveal: your own hand-drawn curve under the real one, with the gap shaded.
- Every number on screen is computed or sourced.

## What we learned
- Confident mistakes are the best teaching moment: errors made with high confidence are corrected best ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)).
- Learning that works often *feels* harder: students in active learning learned more but felt they learned less ([Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116)).
- Generating content is easy; checking it is the product.

## What's next
- More sessions on topics where a visual makes it click.
- Remix scheduling that brings each unbusted mistake back on growing gaps.
- Typed topics that build a full visual session, not just a round.

## How we used AI tools
> **TO BE WORDED BY ME BEFORE SUBMIT.** Placeholder only. SwampHacks XII requires disclosing AI/LLM tool use. Keep this separate from the Gemini/Gemma models the app calls at runtime.

## Built with
- React, TypeScript, Vite, GitHub Pages
- Python, FastAPI, Pydantic, Uvicorn
- Google Gen AI SDK: Gemini API (`gemini-3.5-flash-lite`), Gemma
- Tiger Data (Postgres)
- Auth0

---

### Confirm before submit (not part of the Devpost text)
- **Sessions live:** as of this draft only the birthday session has QA screenshots. Coin streak (#81) and positive test (#82) are in progress. If either isn't live, move it to "What's next" and drop its example paragraph.
- **Help chat:** planned for Sat (gate 4 PM, build-plan.md). If it hits the cut line (static per-screen hint), rewrite that paragraph to "a 'stuck?' hint on every screen".
- **Tiger Data:** SQLite until `TIGER_DATABASE_URL` is set (NOTES.md Sat ~12:20 AM). Keep Tiger in "How we built it" and "Built with" only if answer events and "the room" actually run on it. *Unverified as shipped.*
- **Auth0:** planned, cut line 2 (build-plan.md), guest play first. Remove both mentions if it isn't wired. *Unverified as shipped.*
- **Notebook / remix:** keep in "What it does" only if the end screen and notebook ship; otherwise move to "What's next".
- **Backend host:** add Vultr or Render to "Built with" only if deployed there.
- **"2-3 minutes per session"** is the design target from docs/experience.md, not a timed measurement. Replace with a user-test number if we get one (docs/user-testing.md).
- **Trial numbers** (24/25, median 27 s, p90 51 s): our own 25-topic trial, NOTES.md Sat ~12:10 AM. Update if we re-run after fixing the blind check.
- **Doctors 95/100, ~75% vs 7.7%:** secondary source (APS Observer); the original Eddy 1982 chapter isn't checked. *Unverified against the primary.*
- **Computed numbers** (formulas: birthday 1 − ∏(365−i)/365; my-birthday 1 − (364/365)^22; pairs C(n,2); test 0.009 / (0.009 + 0.99 × 0.09); re-run for this draft in Python): birthday 23 → 0.5073, 57 → 0.9901, my-birthday 22 others → 0.0586, C(23,2) = 253; positive test 0.0917. Coin 6.98 / 97.2% from showcase-facts.md (exact DP).
- **Gemma model IDs:** list the exact ones the code calls at submit time.
- Body word count (Inspiration through Built with, link URLs and this list excluded): ~1,110 with the disclosure placeholder, ~1,075 without. Near the 1,100 cap: trim before adding anything (the real disclosure text will add words).


## Best Use of Vultr (notes)
- The API runs on one Vultr VM (`onionskin-api`, vc2-1c-1gb, Ubuntu 24.04, Miami) paid from the MLH credit: FastAPI + uvicorn under systemd, Caddy in front with automatic HTTPS on sslip.io, CORS locked to our Pages origin, per-IP limits and a daily cap on the free Gemini tier.
- It powers the any-topic engine (topic → runnable model spec → code-computed truth), the ask-a-question help chat, and answer events. Setup is one script (`deploy/vultr/setup.sh`), updates are `deploy/vultr/update.sh`.
- Measured on it: live generation 5.5 s for a two-curve round (Sat 12:10 PM); re-measure with the new engine before quoting.
- Cost control: one server, no extra resources; it is destroyed after judging on Mon Oct 19.
