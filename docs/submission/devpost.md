# Devpost submission draft: Onionskin

**Status:** draft for SwampHacks XII, Entertainment & Creative Technology track. Built from the #104 Devpost draft and docs/experience.md, checked against the session code (birthday on main; coin streak on PR #107; positive test on PR #99; reviewed extras on PR #108). Every number has a source link or a "computed" note; anything we couldn't check is marked *unverified*. The AI tools disclosure is a draft and needs my approval before it goes anywhere. Go through "Confirm before submit" at the bottom before pasting.

- **Name:** Onionskin
- **Tagline:** See your thinking in layers.
- **Live:** https://onionskin.study (registered, not pointed yet) · current live link: https://alexander-freedman.github.io/Swamphacks26-DSI/
- **Repo:** https://github.com/Alexander-Freedman/Swamphacks26-DSI
- **Track:** Entertainment & Creative Technology

---

## Inspiration
Animators draw on onion skin: the last frame stays faintly visible under the new one. We wanted that for ideas. You draw what you think is true, reality inks in on top, and your guess stays underneath as a faint layer. The gap between the layers is the lesson.

Flashcards test whether you can *recall* an answer, not whether you can *run* the idea in your head. In one classic case, about 95 of 100 doctors estimated a positive mammogram meant roughly a 75% chance of cancer; the answer was 7.7% ([APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care)).

Watching isn't enough: students who only *watched* a physics demo understood it no better than students who never saw it, while students who *predicted* first did significantly better ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). So every Onionskin session starts with your guess.

## What it does
Onionskin is short visual sessions (2-3 minutes each, our design target) that take you from not getting a concept to a model you can run in your head. Three are hand-built: **the birthday problem**, **coin streaks**, and **a positive medical test**. Each follows the same moves:

1. **Guess first, in pencil.** Drag, tap or draw. Your guess is a dashed pencil layer that never disappears.
2. **Watch a real example run.** People, coins or patients play out step by step, and you can poke it.
3. **Push it to the extremes.** One slider changes the knob that matters and the ink truth moves live.
4. **Your layer under the truth.** Pencil and ink share the same axes; a highlighter shades the gap.
5. **Your mistake, named.** A stamp lands (*Called it*, *Close* or *Way off*) and a card names the wrong idea behind your guess, quoting your number, with a source. A rematch with new numbers checks that it stuck.

**Birthday.** How many people for a 50% chance that two share a birthday? Fill a room and watch a line appear for every pair: 23 people make 253 pairs (computed). Draw your curve, and the real one inks in over it: 23 people → 50.7%, 57 → 99.0% (computed exactly). Why it feels wrong: someone sharing *your* birthday in a room of 23 is only 5.9% (computed).

**Coin streak.** Be a coin: tap out 20 flips, and 20 real ones deal in underneath with each row's longest run highlighted. Yours switches sides too often. In 100 real flips the longest run averages 6.98, and a run of 5 or more shows up 97.2% of the time (computed exactly).

**Positive test.** 1% of people have it; the test catches 90% and false-alarms on 9% of healthy people. You test positive. Test 1,000 people and the positives fly into two piles, 9 sick and 89 false alarms: a 9.2% chance you have it (computed). Then drag how common it is.

**No points, on purpose.** In a semester-long class, badges and a leaderboard lowered final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)). The reward is the moment your layer meets reality.

**Extra: more topics.** 10 extra topics (Monty Hall, compound interest and more) were checked by hand and load instantly. Type any other topic and our generator builds a short round, labelled *auto-checked*, not *reviewed*. In our 25-topic trial a few wrong answers slipped past the checks (small sample, NOTES.md), so we demo the hand-built sessions.

## How we built it
- **Sessions are code, not slides.** Each session is a React + TypeScript module that computes its own truth in the browser: the exact birthday formula, an exact dynamic program for the longest coin run (tested against brute force up to 12 flips), exact counts for the test. No number on screen comes from a language model.
- **One visual language.** Pencil (dashed) = you, ink (solid) = truth, highlighter = the gap, never told apart by color alone.
- **Generator for typed topics.** A FastAPI backend asks Gemini Flash-Lite for a structured-JSON round (misconceptions first, questions mapped to them). Code computes answers where it can; items that fail the checks are dropped.
- **$0 spent.** Free tier, a Gemma fallback, rounds cached by topic, per-IP rate limits and a daily cap, and the API key only on the server.

## Challenges we ran into
- **"Any topic" vs honest.** Our first version generated everything: too slow for a live demo and not reliable without review. We flipped it: hand-built visual sessions first, generation as a labelled extra.
- **Text verdicts don't teach.** A guess plus a text answer was correct and forgettable. Keeping your pencil layer on screen while reality moves is what made it click.
- **Exact, not "about".** Simulations wobble, so we wrote and tested the exact math.

## Accomplishments that we're proud of
- The birthday reveal: your hand-drawn curve under the real one, gap shaded.
- Every number on screen is computed or sourced.
- Every session works on a phone and by keyboard.

## What we learned
- Confident mistakes teach best: high-confidence errors are the ones corrected best ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)).
- Learning that works often *feels* harder: active-learning students learned more but felt they learned less ([Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116)).
- Generating content is easy; checking it is the product.

## What's next (planned, not built)
- An "ask a question" panel beside each session: a hint, never the answer, before you lock a guess (backend in review).
- A notebook of your mistakes, with remixes that bring each back with new numbers until you've busted it.
- More hand-built sessions, and typed topics that build a full visual session.

## AI tools disclosure (DRAFT, needs approval)
**How we built it.** We used AI coding assistants heavily, mainly Claude Code. They helped with research (finding and summarizing sources), planning, writing code and tests, reviewing pull requests, and drafting docs, including this write-up. We directed the product: we picked the idea, designed the sessions and the look, made the decisions, reviewed the work, and approved what shipped. We checked every number and source against code or the linked page.

**What the app calls at runtime.** The typed-topic generator calls Google's Gemini 3.5 Flash-Lite (falling back to Gemini 3.1 Flash-Lite, then Gemma 4 26B), and a Gemma 4 31B model double-checks answers. The three main sessions and the 10 reviewed topics use no AI at runtime. Every number shown in the sessions is computed by our own code, not by a model.

## Built with
- React, TypeScript, Vite, Vitest
- Python, FastAPI, Pydantic, Uvicorn
- Google Gen AI SDK: Gemini API (Gemini 3.5 / 3.1 Flash-Lite), Gemma
- GitHub Pages, GitHub Actions

---

### Confirm before submit (not part of the Devpost text)
For each claim, what must be true on the live site at submit time. If something isn't true, cut or move it to "What's next".

- [ ] **Birthday session live** (main, `web/src/sessions/birthday/`): open the live link, Home → birthday; guess → fill room (23 people · 253 pairs) → draw → reveal shows 50.7% at 23 and 99.0% at 57 → card shows 5.9% vs 50.7% → rematch.
- [ ] **Coin streak live** (PR #107, `luanamaldaner/coin`): merged and deployed; 20-flip row deals in, "4.66" and "6.98" / "97.2%" on screen. If not merged, drop the coin paragraph and the step-2/3 coin examples.
- [ ] **Positive test live** (PR #99, `luanamaldaner/positive`): merged and deployed; piles 9 / 98 and 9.2% on screen; crowd slider moves. If not merged, drop its paragraph.
- [ ] **"Rematch with new numbers" on every session:** birthday (class of 30), coin (which row is real), positive (a second positive test). Check each on the live site.
- [ ] **10 reviewed extras** (PR #108): merged, deployed (`/rounds/extra/index.json` on Pages) and reachable from the typed-topic box. If not, cut "10 extra topics".
- [ ] **Typed topics / generator:** Gemini client and checks are on open PRs (#58, #63, #80, #96), not on main as of this draft. The live site has no backend yet. Keep the typed-topic sentence and "Generator for typed topics" only if a deployed backend answers typed topics from the live site; otherwise reword to "planned" and move it to "What's next". The *auto-checked* label is already on main (`web/src/App.tsx`).
- [ ] **Blind check (Gemma 4 31B):** only claim "double-checks answers" if #96 is merged and the check actually runs. Otherwise drop that clause from the disclosure and "How we built it".
- [ ] **Model IDs** (from code on the open PR branches: `api/app/gen.py` MODEL_CHAIN = gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemma-4-26b-a4b-it; `api/app/checks.py` BLIND_MODEL = gemma-4-31b-it): re-read the merged code at submit time. If the help chat (#105) ships, add it to the runtime list (it calls the same two Flash-Lite models).
- [ ] **Rate limit + daily cap:** true in the generator/help PRs; confirm on the deployed backend.
- [ ] **Not claimed, on purpose:** Auth0 sign-in (not wired), Tiger Data (PR #103 open), "the room" (how others guessed, PR #72 open), the notebook page (the session only saves to localStorage), the help panel. Add any of them to "What it does" / "Built with" only if live. Add Vultr/Render to "Built with" only if the backend runs there.
- [ ] **onionskin.study** points at the site; until then lead with the GitHub Pages URL.
- [ ] **"Phone + keyboard"** accomplishment: PR #99/#107 report Playwright runs at 390 px and keyboard controls; birthday has 390/360 screenshots (commit d86aa2f). Re-check on a real phone.
- [ ] **"2-3 minutes per session"** is the design target (docs/experience.md), not a timed measurement. Replace with a user-test number if we get one.
- [ ] **Trial claim** ("a few wrong answers slipped past the checks"): our own 25-topic trial, NOTES.md Sat ~12:10 AM. Update if re-run after #96.
- [ ] **Doctors 95/100, ~75% vs 7.7%:** the APS Observer page states it (checked: "Approximately 95 out of 100 physicians wrongly reckoned this probability to be around 75 percent, whereas the correct answer is 7.7 percent (Eddy, 1982)"). The original Eddy 1982 chapter isn't checked: *unverified against the primary*.
- [ ] **DOIs** (Crouch 2004, Hanus & Fox 2015, Butterfield & Metcalfe 2001, Deslauriers 2019): all resolve to the right articles (Crossref title for Crouch: "Classroom demonstrations: Learning tools or entertainment?"); the claims come from the #104 draft's check.
- [ ] **Computed numbers, re-run in Python for this draft:** birthday 1 − ∏(365−i)/365: n=23 → 0.5073, n=57 → 0.9901; C(23,2) = 253; my birthday 1 − (364/365)^22 = 0.0586; positive test 0.009 / (0.009 + 0.99 × 0.09) = 0.0917, crowd 9 true + 89.1 false of 1,000; longest run (exact DP over sequences): N=100 mean 6.977, P(≥5) = 0.9717; N=20 mean 4.659. These match the session tests on #107/#99 and `web/src/sessions/birthday/math.test.ts`.
- [ ] **Disclosure approved** by me, then copied to the README as well (the rules ask for disclosure; [Devpost rules](https://swamphacks-xii.devpost.com/rules)).
- [ ] **Word count:** body (Inspiration through Built with, URLs excluded, disclosure included) = 1,097 words (computed by script). Trim before adding anything.
