# Devpost draft: Onionskin

**Status:** draft, rewritten Sat ~1 PM for the direction update (NOTES.md, Sat ~12:15 PM, #185): the new headline, the compare screen and the any-topic engine. Every number has a source link or a "computed" note; anything we couldn't check is marked *unverified*. Parts marked **[landing today]** describe work that isn't merged yet: keep them only if they're live at submit time (checklist at the bottom). The submission copy in docs/submission/devpost.md is not on main yet (PR #113, @luanamaldaner's side); bring the same changes over there when it merges.

**Tagline:** "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why."
**Short tagline (if Devpost's field is too short):** "Guess in pencil. Truth in ink."

---

## Inspiration
Ask a chatbot why something is true and you get a clear explanation. You nod, and a week later you'd still guess wrong. Being told isn't the same as having a model you can run in your head. In one classic case, about 95 of 100 doctors estimated a positive mammogram meant roughly a 75% chance of cancer; the answer was 7.7% ([APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care)).

One classroom finding kept pulling us back: students who only *watched* a physics demo understood it no better than students who never saw it, while students who *predicted* the outcome first did significantly better ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). So we built the opposite of a chatbot. **The AI builds the simulation; code guarantees the truth; you do the thinking.**

## What it does
Onionskin is a set of short visual sessions (2-3 minutes each, our design target) that take you from not getting a concept to a model you can run in your head. Three are hand-built: **the birthday problem**, **coin streaks**, and **a positive medical test**. Every session follows the same moves:

1. **Guess in pencil.** You commit first: drag a slider, tap out a sequence, or draw a curve. Your guess is a dashed pencil mark, and it never disappears.
2. **Watch a real example run.** Fill a room and watch a line appear for every pair that could share a birthday; tap out 20 "random" flips and watch 20 real ones deal in under yours; test 1,000 people and watch the positives pile up.
3. **Push it to the extremes.** One big slider changes the knob that matters, and the ink truth moves live.
4. **Your model next to reality.** Your pencil and the ink truth share the same axes, and a highlighter shades the gap, so you see exactly where your model breaks.
5. **Your mistake, named.** A stamp lands (*Called it*, *Close* or *Way off*) and a card names the specific wrong idea, quoting your own number.
6. **Pull out the structure. [landing today]** One compare screen: a second case that looks different but works the same (birthdays → shared 4-digit PINs). You say what they have in common, then the shared principle inks in. Comparing two cases beats studying them one at a time for carrying an idea to new situations ([Gentner, Loewenstein & Thompson 2003](https://doi.org/10.1037/0022-0663.95.2.393): "a marked advantage" in negotiation training).

Example: in the birthday session you guess how many people it takes for a 50% chance that two share a birthday. 23 people already make 253 pairs (computed). You draw your curve and the real one inks in over it: 23 people → 50.7%, 57 → 99.0% (computed exactly). The card shows why it feels wrong: someone sharing *your* birthday in a room of 23 is only 5.9% (computed). Then the compare case: with 10,000 possible PINs, about 119 people give a 50% chance that two share one (computed). Same structure: pairs grow much faster than people.

The other two: in 100 fair flips the longest run averages 6.98, and a run of 5 or more shows up 97% of the time (exact computation, [showcase-facts.md](research/showcase-facts.md)). With a 1% condition and a test that catches 90% and false-alarms on 9%, a positive means only a 9.2% chance you have it (computed).

**Any topic → a runnable model. [landing today]** Type a topic and the AI picks one of our simulation widgets (a curve with a knob, a sampler, a dial) and fills in the parameters, the guess prompt, the extremes to try and the misconception people have. The true answer is computed in code from that spec, never written by the model. If no widget fits, it says so and offers the nearest checked topic instead of faking a chart. Topics we've hand-checked are served instantly from a pre-built set.

**No points, on purpose.** In a semester-long class, badges and a leaderboard lowered motivation and final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)). The reward is the moment your guess meets reality. Each mistake goes into your notebook and comes back as a remix with new numbers until you've busted it.

## How we built it
- **Sessions are code, not slides.** Each session is a React + TypeScript module (`web/src/sessions/<topic>/`) that computes its own truth in the browser: exact formulas for the birthday curve and the test, exact computation and simulation for coin runs.
- **One visual language.** "Notebook Arcade": pencil (dashed) = you, ink (solid) = truth, highlighter = the gap, never told apart by color alone.
- **The engine.** Gemini Flash-Lite returns a structured-JSON spec, validated against a schema; our backend computes the truth from it and drops anything that doesn't check out. **[landing today: the v4 runnable-model spec; until then, rounds of 3 questions with a computed answer.]**
- **Backend on Vultr.** FastAPI on one Vultr VM (Ubuntu 24.04, Caddy for automatic HTTPS), set up with one script. A fresh topic took 5.5 s on it in a Saturday smoke test (one run, previous engine, NOTES.md); checked topics are instant.
- **Free tier only.** Gemini Flash-Lite (500 requests/day on the free tier, [gemini.md](research/gemini.md)); every public endpoint has a per-IP rate limit and a daily cap, and the key lives only on the server. The sessions don't need the backend at all.

## Challenges we ran into
- **"Any topic" vs honest.** Our first engine wrote questions and answers. In a 25-topic trial it took a median 27 s and some wrong answers slipped past our checks (our own trial). So we changed what the AI does: it builds the simulation, and code computes the answer.
- **Text verdicts don't teach.** Our first build showed a guess and a text answer: correct and forgettable. Keeping your pencil guess on screen while reality moves is what made it click.

## Accomplishments that we're proud of
- The birthday reveal: your own hand-drawn curve under the real one, with the gap shaded.
- Every number on screen is computed or sourced.

## What we learned
- Confident mistakes are the best teaching moment ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)).
- Learning that works often *feels* harder ([Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116)).
- Generating content is easy; checking it is the product.

## What's next
- More widgets, so more typed topics become runnable models.
- Remix scheduling that brings each unbusted mistake back on growing gaps.

## How we used AI tools
> **TO BE WORDED BY ME BEFORE SUBMIT.** Placeholder only. SwampHacks XII requires disclosing AI/LLM tool use. Keep this separate from the Gemini/Gemma models the app calls at runtime.

## Built with
- React, TypeScript, Vite, GitHub Pages
- Python, FastAPI, Pydantic, Uvicorn
- Vultr (API server), Caddy
- Google Gen AI SDK: Gemini API (`gemini-3.5-flash-lite`)
- Tiger Data (Postgres) **[confirm]**
- Auth0 **[confirm]**

---

### Confirm before submit (not part of the Devpost text)
- **[landing today] Compare screens** (#181 birthday, #182 coin, #183 positive): keep move 6 and the PIN example only if the birthday one is live; say "each session" only if all three are. Use the number the screen shows (119 is computed in the table below).
- **[landing today] Engine v4** (#179 API, #184 round player, #180 pre-built set): keep the "Any topic → a runnable model" paragraph only if a typed topic plays as a widget with extremes on the live site. Otherwise rewrite it as "Type a topic and get a short round, labelled *auto-checked*; checked topics are instant."
- **v4 latency:** replace the 5.5 s line with the #179 trial numbers (median + p90, N topics) once measured on Vultr. 5.5 s is one smoke-test run on the previous engine (NOTES.md, Sat ~12:10 PM).
- **Gentner et al. 2003:** the abstract says "a marked advantage" for comparing two cases; it gives **no "3x"**. "Nearly three times more likely" is from [Loewenstein, Thompson & Gentner 1999](https://kellogg.northwestern.edu/faculty/research/detail/1999/analogical-encoding-facilitates-knowledge-transfer-in-negotiation?p=1); only use it with that citation. Full texts not read; effect sizes *unverified*.
- **Help chat:** API only (`POST /api/help`); no panel in the app as of Sat ~1 PM, so it's not in "What it does". Add it back only if the panel ships.
- **Tiger Data:** `TIGER_DATABASE_URL` is set on the Vultr server (NOTES.md, Sat ~12:00 PM). Keep it in "Built with" only if answer events actually write there (#103 open). *Unverified as shipped.*
- **Auth0:** remove unless sign-in is wired. *Unverified as shipped.*
- **"2-3 minutes per session"** is the design target from docs/experience.md, not a timed measurement. Replace with a user-test number if we get one.
- **Doctors 95/100, ~75% vs 7.7%:** secondary source (APS Observer); the original Eddy 1982 chapter isn't checked. *Unverified against the primary.*
- **Computed numbers** (re-run for this draft in Python): birthday 1 − ∏(365−i)/365: 23 → 0.5073, 57 → 0.9901; my-birthday 1 − (364/365)^22 = 0.0586; C(23,2) = 253; PINs 1 − ∏(10000−i)/10000, 119 → 0.5058 (118 → below 0.5); positive test 0.009 / (0.009 + 0.99 × 0.09) = 0.0917. Coin 6.98 / 97.2% from showcase-facts.md (exact DP).
- **Word count:** ~1,130 now (counted Sat ~1 PM, link URLs excluded, markers included); re-count before submit; the cap we set is ~1,100 (Inspiration through Built with), and the real disclosure text adds words.

## Best Use of Vultr (notes)
- The API runs on one Vultr VM (`onionskin-api`, vc2-1c-1gb, Ubuntu 24.04, Miami) paid from the MLH credit: FastAPI + uvicorn under systemd, Caddy in front with automatic HTTPS on sslip.io (https://45-77-118-201.sslip.io), CORS locked to our Pages origin, per-IP limits and a daily cap on the free Gemini tier.
- It serves the any-topic engine (topic → spec → code-computed truth), the pre-built topic set, the help endpoint and answer events. Setup is one script (`deploy/vultr/setup.sh`), updates are `deploy/vultr/update.sh`.
- Measured on it: live generation 5.5 s for one topic, 2 curve items, 1 dropped by checks (Sat 12:10 PM smoke test, previous engine); re-measure with engine v4 before quoting.
- Cost control: one server, no extra resources; it is destroyed after judging on Mon Oct 19.
