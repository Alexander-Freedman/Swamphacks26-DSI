# DEV post draft: Onionskin (MLH x DEV Writing Challenge)

**Status:** draft for after the event. I publish it myself from my DEV account; nothing gets posted from here. The post body is between the two `---- POST ----` markers.

## Challenge requirements (checked Sat Oct 17 on [dev.to/mlh-hackathon](https://dev.to/mlh-hackathon))
- **What:** publish a post about a project built at an MLH event ("Create a project at an MLH event"). No set topic. ([DEV](https://dev.to/mlh-hackathon))
- **Tags:** must include `#mlhacks`; the official template's front matter uses `mlhacks, devchallenge, hackathon`. ([DEV](https://dev.to/mlh-hackathon))
- **Account:** the template says to be signed in to DEV with the MLH account linked to the hackathon registration. ([DEV](https://dev.to/mlh-hackathon))
- **Window:** "each calendar month", publish "during the current challenge window" (Eastern Time). The page shows **no exact dates**, and says more participation terms will be added. ([DEV](https://dev.to/mlh-hackathon); our earlier note in [docs/prizes.md](prizes.md): "Post in October")
- **Judging:** "technical substance, originality, clear storytelling, and community popularity." DEV editors pick at least one project a month, $100 each. ([DEV](https://dev.to/mlh-hackathon), [docs/prize-strategy.md](prize-strategy.md))
- **Template sections:** What I Built / Demo / Partner Technologies / Hackathon Experience. The post below uses them as its spine.

**Verify before publishing (unverified now):**
1. The October window's end date and the extra participation terms (not on the page yet).
2. That SwampHacks XII counts as an MLH event for this challenge (we listed it under MLH prizes in [docs/strategy.md](strategy.md), but the DEV page doesn't list events).
3. Whether a team post counts per project or per person (not stated).
4. The name **Onionskin** is final (it's the name in PR #113; NOTES.md still says working name `mm`).
5. Partner tech list: Gemini is in the code (`api/app/gen.py`, `api/app/checks.py`, `api/app/help.py`). Check what else actually shipped (Auth0, Tiger Data, GoDaddy domain) before naming it.
6. Re-check the v3 trial numbers against PR #127 once it merges (it's open as of this draft).

## Title options
1. We built a study app where your wrong guess never disappears
2. Onionskin: guess in pencil, truth in ink (36 hours at SwampHacks XII)
3. Our generator passed its own checks with wrong answers. Here's what we did about it.
4. Understanding vs recall: building Onionskin in 36 hours

**Suggested:** 1 for reach, 3 if we want the engineering crowd.

---- POST ----

```
---
title: We built a study app where your wrong guess never disappears
published: false
tags: mlhacks, devchallenge, hackathon, webdev
---
```

*This is a submission for the [MLH x DEV Writing Challenge](https://dev.to/mlh-hackathon).*

## What I Built

Flashcards check if you can recall an answer. They don't check if you can *run* the idea in your head. Most people "know" the birthday problem and still guess wrong as soon as the numbers change.

At SwampHacks XII we built **Onionskin**, a set of short visual sessions that take you from not getting a concept to a model you can actually use. The name comes from animation: an onion skin is the faint previous frame under the one you're drawing. In our app, that faint layer is your guess. It stays on screen under the truth for the whole session, so you never lose sight of where your thinking went wrong.

Every session uses the same five moves:

1. **Guess first.** Drag a slider, tap out a sequence, or draw a curve. Your guess is a dashed pencil mark.
2. **Watch a real example run.** Fill a room one person at a time and watch a line appear for every pair that could share a birthday.
3. **Push it to the extremes.** One big slider controls the knob that matters, and the ink truth moves live.
4. **Your model next to reality.** Your pencil curve and the real curve share the same axes, and a highlighter shades the gap.
5. **Your mistake, named.** A stamp lands, and a card names the specific wrong idea using your own number.

We pulled those five out of a longer concept-to-model research pipeline. The goal was a 2-3 minute session, not a course. The learning science behind it is simple: students who predicted a physics demo's outcome before watching understood it better than students who only watched ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)), and confident errors are the ones that get corrected best ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)).

We left out points, XP and leaderboards on purpose. In one semester-long class, badges and a leaderboard *lowered* motivation and exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)). The reward is the moment your guess meets reality.

## Demo

<!-- Live link: https://alexander-freedman.github.io/Swamphacks26-DSI/ (swap for the custom domain if we have one) -->
<!-- Video: paste the 2-minute Devpost video link -->

Here's the birthday session, start to finish.

**[SCREENSHOT: qa/screens/birthday-session/desk-b1-guess.png]** *You guess how many people it takes for a 50% chance that two share a birthday.*

**[SCREENSHOT: qa/screens/birthday-session/desk-b2-room.png]** *You add people. At 23 people the room already has 253 pairs (computed: C(23,2)).*

**[SCREENSHOT: qa/screens/birthday-session/desk-b3-match.png]** *A match. Empty the room and try again; the dot plot fills up around the low 20s.*

**[SCREENSHOT: qa/screens/birthday-session/desk-b4-draw.png]** *You draw how you think the chance grows. Most people draw a slow, straight line.*

**[SCREENSHOT: qa/screens/birthday-session/desk-b5-reveal.png]** *The real curve inks in over yours: 23 people gives 50.7%, 57 gives 99.0% (computed exactly).*

**[SCREENSHOT: qa/screens/birthday-session/desk-b6-card.png]** *The mistake card: you were thinking about someone sharing YOUR birthday. In a room of 23, that's only 5.9% (computed: 1 - (364/365)^22).*

**[SCREENSHOT: qa/screens/birthday-session/desk-b7-rematch.png]** *One rematch with new numbers to check the idea stuck.*

<!-- Phone versions exist as phone-b*.png if we want one mobile shot. -->

There are two more hand-built sessions. In **coin streaks**, you fake 20 flips and real ones deal in under yours. In 100 fair flips the longest run averages 6.98, and a run of 5+ shows up 97.2% of the time (exact computation, [showcase-facts.md](https://github.com/Alexander-Freedman/Swamphacks26-DSI/blob/main/docs/research/showcase-facts.md)). In **a positive test**, 1,000 dots get tested: with a 1% condition, 90% sensitivity and 9% false positives, a positive means a 9.2% chance you have it (computed).

## How it works (the honest part)

**Truth is computed in code, never trusted from a model.** Every number the app reveals comes from a formula or a simulation that runs in the browser. Each showcase session is hand-written and reviewed, and it works offline as static JSON on GitHub Pages.

We also built an engine for typing in *any* topic. A language model writes a short round of questions, and then code checks it: the answers have to agree with the computed truth, the answer bands have to make sense, and items that fail get dropped. Then we tested it.

**The 25-topic trial.** On our second prompt version, the engine delivered 24 of 25 topics, with a median of 27 seconds and a p90 of 51 seconds ([NOTES.md](https://github.com/Alexander-Freedman/Swamphacks26-DSI/blob/main/NOTES.md), our own small trial). Two problems: 27 seconds is too slow for a live demo, and several rounds had wrong answers that got past every check. Every item also came back as a plain number to estimate, with no curve and no simulation. That's a quiz, not the visual product we were building.

So we made a call: **the demo runs on the hand-reviewed sessions.** "Try any topic" is a labeled extra, marked *auto-checked*, not *reviewed*.

**The check that lied.** For items code can't compute, we added a blind check: a second model from a different family answers each question without seeing the key, and we drop any item where the two disagree. In the trial it barely worked. Of 60 blind calls, 29 got a 500/503, 27 replies didn't parse, 36 hit our 8-second time box, and about 4 were usable (the failure types overlap) ([PR #96](https://github.com/Alexander-Freedman/Swamphacks26-DSI/pull/96)). Every report still said `blind_checked: true`.

That's the worst kind of bug for a learning app, because a wrong answer labeled "checked" teaches the wrong model. The fix ([PR #96](https://github.com/Alexander-Freedman/Swamphacks26-DSI/pull/96)):
- `blind_checked` is true only if a blind answer actually came back and was compared.
- The report lists `unchecked` item ids, so the UI never calls them checked.
- Parsing accepts fenced JSON, bare numbers and option ids. We dropped JSON mode, which was the likely cause of the 500s.
- Every blind call counts against our daily cap.
- Tests stub the model, so they don't need the network.

**Prompt v3: curves for typed topics.** The next fix was making typed topics visual. Version 3 of the prompt asks for a curve or a distribution first, with worked examples (compound growth, dice sums, half-life). New checks require a curve to draw cleanly at the asked value and at both ends of the slider, and the answer has to match the curve at that point. A question that fails is dropped on its own instead of sinking the whole round. In a 12-topic trial, median latency fell from 27.6 s to 6.8 s, and 8 of 14 kept items were curves or distributions, up from 0 of 60 ([PR #127](https://github.com/Alexander-Freedman/Swamphacks26-DSI/pull/127), small sample). I recomputed a few by hand, and they were right. I also found one wrong answer key that the checks can't see yet, so typed topics stay labeled.

## What we learned

- **A check that can't fail isn't a check.** Log what your validator actually did, not what you hoped it did.
- **Run the trial before the pitch.** Twenty-five topics and a spreadsheet changed our demo plan more than any brainstorm.
- **For learning, the visual *is* the product.** Our first build was one guess and a text verdict, and it felt like two slides. Keeping the guess on screen under the truth is what made it click.
- **Cut honestly.** Labeling generated rounds "auto-checked" cost us some wow, but it's the right call for an app whose whole job is telling you the truth.

## What's next

- Render generated curves in the session UI (the v3 schema is ready; the widget needs the knob value).
- Catch wrong answer keys that agree with themselves, for example by recomputing from the stem.
- More hand-reviewed sessions, and remixes with new numbers that come back over the following days.

## Partner Technologies

<!-- VERIFY each line against what shipped before publishing. -->
- **Google Gemini API (free tier):** writes typed-topic rounds and powers the "ask a question" hint chat. We used `gemini-3.5-flash-lite` with fallbacks, and `gemma-4-31b-it` as the blind checker because it comes from a different model family. Calls are rate-limited and capped, and the key stays on the server.
- <!-- Auth0 / Tiger Data / GoDaddy: add only if they're live in the demo. -->

## AI tools used

> **[PLACEHOLDER: I'll write this section myself.]** The event requires disclosure, so it has to be honest and match the Devpost/README wording.

## Hackathon Experience

<!-- PLACEHOLDER: write this myself. Event: SwampHacks XII, Reitz Union, Oct 16-18 2026. Team: Alex + Luana. What I'll remember most: ... -->

*Code: https://github.com/Alexander-Freedman/Swamphacks26-DSI*

---- POST ----

## Source notes (not part of the post)
- 253 pairs, 50.7%, 99.0%, 5.9%: computed in Python while drafting (`1 - prod((365-i)/365)`, `C(23,2)`, `1 - (364/365)**22` gives 0.5073 / 0.9901 / 253 / 0.0586).
- Coin 6.98 / 97.2%: exact DP, [docs/research/showcase-facts.md](research/showcase-facts.md). Positive test 9.2%: 0.009 / (0.009 + 0.99 × 0.09) = 0.0917, computed ([docs/devpost-draft.md](devpost-draft.md)).
- Trial v2: [NOTES.md](../NOTES.md) Sat ~12:10 AM (24/25, median 27 s, p90 51 s); PR #127 gives the v2 median more precisely as 27.6 s.
- Blind-check failure counts: [PR #96](https://github.com/Alexander-Freedman/Swamphacks26-DSI/pull/96) plan.
- v3 numbers: [PR #127](https://github.com/Alexander-Freedman/Swamphacks26-DSI/pull/127) body (open as of this draft).
- Model names: `api/app/gen.py` (`MODEL_CHAIN`), `api/app/checks.py` (`BLIND_MODEL`), `api/app/help.py`.
- Crouch 2004, Butterfield & Metcalfe 2001, Hanus & Fox 2015: same citations as [docs/devpost-draft.md](devpost-draft.md) and [docs/experience.md](experience.md).
