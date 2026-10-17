# The 3-minute demo: live topic + showcase topics (#25)

Builds on docs/pitch.md (Candidate B script + Q&A), docs/expo-video.md (table craft, attract loop, sound, judge queue) and docs/deep-mental-models.md (the ghost). This file is about the new any-topic version: what we show, in what order, and how the live part can't sink us.

## TL;DR
- **Open with a showcase topic the judge gets wrong, not with the live topic.** The judge names a topic first, it generates in the background, and we come back to it at ~1:40. That hides the 10-20 s generation time and means the wow moment never depends on the network.
- **Showcase #1: the coin streak.** "In 100 fair flips, what's the longest run of the same side?" Most people guess 3-4; the real answer is usually 6-8, and ≥5 shows up 97% of the time. The truth is computed in the browser, so it's instant, correct and offline.
- **Showcase #2: the positive test (base rates).** Judges with a technical background still say ~90%; the truth is ~9%. The reveal is 1,000 dots sorting themselves.
- **Showcase #3 (backup / physics people): Off the Edge** (the marble ghost race already prototyped on branch luanamaldaner/pen-input).
- The live topic needs a 3-step fallback ladder: cached → generating with a visible build → "pick one of these" chips.

## Why these showcase topics
I picked by 4 tests: (1) adults, including smart ones, get it wrong at a high rate; (2) the truth is computed or simulated, never generated, so it's always right; (3) the reveal reads in under 10 s from a meter away; (4) the misconception has a name we can show.

| Topic | Prediction input | Truth | Wrong rate / evidence | Named misconception | Reveal |
|---|---|---|---|---|---|
| **Coin streak** | slider: longest run in 100 flips (1-20), or draw a fake sequence of 100 | Simulated in the browser. My run of 200k sequences: mean longest run 7.0; P(≥5) 97%, P(≥6) 81%, P(=4 or less) 3% | Invented sequences alternate too much and rarely contain runs of 5+; a teacher can spot fakes from that alone ([Dartmouth Chance notes](https://chance.dartmouth.edu/teaching_aids/Profiles/streaks/section3_3.html), [NPR / Gelman](https://www.npr.org/transcripts/7320273)); Schilling's rule: ~log₂(n/2) ([1990, via Wolfram demo](https://demonstrations.wolfram.com/ConsecutiveHeadsOrTails)) | "Random means evenly mixed" (representativeness / gambler's fallacy) | 100 flips stream in as tiles, the longest run lights up; then 10,000 sequences fill a histogram and the judge's guess is a pencil line at the far left |
| **Positive test** | slider: "you test positive, chance you have it?" (0-100%) | Bayes from the numbers on the card (1% base rate, 90% sensitivity, 9% false positives → ~9%) | Of 160 gynecologists, the most common answer was 90% for a mammography case whose real answer was ~10% ([Gigerenzer, via APS](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care), [Natural frequency](https://en.wikipedia.org/wiki/Natural_frequency_(statistics))) | Base-rate neglect (confusing P(+\|sick) with P(sick\|+)) | 1,000 dots → 10 sick light up → positives get circled → the 9 true positives vs ~89 false ones. Natural frequencies are also what fixes the error in the studies, so the reveal *is* the teaching |
| **Off the Edge** | draw the marble's path | analytic projectile, tested | FCI-style item; impetus misconceptions are common in intro physics (deep-mental-models.md) | "Push runs out" (impetus) | the judge's own drawing replays as a ghost that hangs in the air, then drops |
| Seasons (live-topic test, not a showcase) | pick: distance / tilt / other | — | Harvard graduates on camera blaming orbit distance ([A Private Universe, SERC](https://serc.carleton.edu/resources/1672.html)) | "Closer = hotter" | needs a 3D or diagram reveal, so it's a good stress test for the generator but a bad thing to promise live |

Why the coin streak leads: it's 5 seconds to ask, nobody needs a background, the judge is wrong with ~97% odds, and it's pure Entertainment-track fun (tiles, streak lighting up). The positive test is the "this matters" follow-up: it's the same engine on a topic with real stakes. Calculus or physics goes to judges who say "I'm an engineer".

## The 3:00 script

| Time | Narrator says | Driver shows |
|---|---|---|
| 0:00 | "Give us any topic you've always found confusing. Anything." | Topic box. Type the judge's topic, press Enter. A small "building your round…" chip appears in the corner. |
| 0:08 | "While that builds: quick one. 100 coin flips. What's the longest streak of the same side in a row?" | Slider. **Judge answers.** Lock it in. |
| 0:20 | "Let's flip." | 100 tiles stream in, the longest run lights up (usually 6-8). Then the histogram of 10,000 runs fills, with the judge's pencil line far left. |
| 0:35 | "Almost everyone says 3 or 4. Real randomness is streakier than people think." | Misconception card: **"Random means evenly mixed."** It names the wrong idea and doesn't lecture. |
| 0:50 | "That's the loop: you predict first, reality grades you, and it names exactly which wrong idea you have. Then it tests that idea somewhere new." | Next card: the positive-test question (same misconception family: intuitions about chance). |
| 1:00 | (Judge answers, usually ~90%.) | 1,000 dots sort; ~9% shows. The judge's guess and the truth sit side by side. |
| 1:20 | "That one fools doctors too." | Their collection / streak view: two misconceptions caught, one fixed. |
| 1:40 | "Your topic's ready." | The judge's topic: one predict → reveal round. |
| 2:15 | "How it works: the model only writes the question and picks the reveal type. The truth comes from code: a simulation, a calculation, or a cited source. It never just tells you." | One slide or a dev drawer showing the generated JSON + the computed truth. |
| 2:40 | "It's built to be the thing you open instead of flashcards: streaks for predictions, not for showing up." | Back to the home screen. Stop. |

**90-second version** (judge queue, docs/expo-video.md): topic → coin streak → card → "your topic's ready" → stop. Skip the positive test.

**If the judge gets the coin streak right**: "Nice, you're in the 3%. Try this one" → positive test, which catches most people who know the coin result.

## Live-topic fallback ladder (decided before Sat midnight, rehearsed)
1. **Cached:** we pre-generate ~40 topics judges are likely to say (probability, compound interest, vaccines, black holes, recursion, entropy, supply and demand, photosynthesis, neural nets, the electoral college, …). Fuzzy-match the input; if it hits, it's instant.
2. **Generating:** show the build steps (writing the question → picking a reveal → computing the truth). The coin streak covers the wait. Budget: 20 s. Use the lowest-latency model setting (no long thinking): published time-to-first-token for current Flash models with thinking on is 11-17 s on a 10k-token prompt ([Artificial Analysis](https://artificialanalysis.ai/models/gemini-3-6-flash/providers)), so measure ours on Saturday.
3. **Failed / weird topic:** "That one needs a reveal we haven't built yet. Pick the closest:" and show 3 chips from the cache. Never show a raw error or a spinner past 20 s.
4. **No network:** the showcase topics run fully offline; put the cache in the bundle.

Rules that keep it safe:
- Filter the topic input (no slurs / people's names / medical advice framing) and keep a "safe topic" chip row visible.
- One driver, one narrator. The driver never types the judge's topic before the narrator repeats it out loud.
- Rehearse 5 random topics from strangers on Saturday; log what breaks into NOTES.md.

## Attract loop (second screen, 10-20 s)
- Big question on screen: **"100 coin flips. Longest streak?"** with a looping 100-tile flip and the histogram filling, then: "Most people guess 4. Come find out what you'd guess wrong."
- No audio needed. Loops from a local file, so no network risk.

## Showcase polish list (what makes these hit, in order)
1. The judge's guess stays visible in pencil while the truth draws in ink.
2. The streak tiles light up one by one, with a short pause before the longest run highlights.
3. The card names the misconception in 5 words, with one sentence of "why people think this", and never shows the answer as text.
4. The collection: misconceptions caught as cards in a deck (the Entertainment angle; see engagement.md once it lands).

## Open questions for the spec
- Do we let the judge type the topic, or say it while the driver types? (Typing is slower but more "real".)
- Is the coin streak input a slider or "draw your own fake 100 flips"? Drawing is more fun and gives us a richer misconception signal (alternation rate), but it takes ~20 s longer.
- Showcase count: 2 polished beats 4 half-done. I'd build coin streak + positive test first, and Off the Edge only if the reveal components already cover it.
- From engagement.md: add a confidence slider to every lock-in. A confident wrong guess is the one people correct best (hypercorrection), and it makes the coin-streak reveal hit harder ("you were 80% sure").
