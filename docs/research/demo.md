# The 3-minute demo: live topic + showcase topics (#25)

Builds on docs/pitch.md (Candidate B script + Q&A), docs/expo-video.md (table craft, attract loop, sound, judge queue) and docs/deep-mental-models.md (the ghost). This file is about the new any-topic version: what we show, in what order, and how the live part can't sink us.

## TL;DR
- **Open with a showcase topic the judge gets wrong, not with the live topic.** The judge names a topic first, it generates in the background, and we come back to it at ~1:40. That hides the 10-20 s generation time and means the wow moment never depends on the network.
- **Showcase #1: the coin streak.** "In 100 fair flips, what's the longest run of the same side?" Most people guess low (3-4 is my guess, **unverified**: no study measures it, so I log real guesses at the event); the expected longest run is 6.98 and ≥5 shows up 97% of the time (exact DP, see showcase-facts.md). The truth is computed in the browser, so it's instant, correct and offline.
- **Showcase #2: the positive test (base rates).** Judges with a technical background still say ~90%; the truth is ~9%. The reveal is 1,000 dots sorting themselves.
- **Showcase #3 (backup / physics people): Off the Edge** (the marble ghost race already prototyped on branch luanamaldaner/pen-input).
- The live topic needs a 3-step fallback ladder: cached → generating with a visible build → "pick one of these" chips.

## Why these showcase topics
I picked by 4 tests: (1) adults, including smart ones, get it wrong at a high rate; (2) the truth is computed or simulated, never generated, so it's always right; (3) the reveal reads in under 10 s from a meter away; (4) the misconception has a name we can show.

| Topic | Prediction input | Truth | Wrong rate / evidence | Named misconception | Reveal |
|---|---|---|---|---|---|
| **Coin streak** | slider: longest run in 100 flips (1-20), or draw a fake sequence of 100 | Simulated in the browser. My run of 200k sequences: mean longest run 7.0; P(≥5) 97%, P(≥6) 81%, P(=4 or less) 3% | Invented sequences alternate too much and rarely contain runs of 5+; a teacher can spot fakes from that alone ([Dartmouth Chance notes](https://chance.dartmouth.edu/teaching_aids/Profiles/streaks/section3_3.html), [NPR / Gelman](https://www.npr.org/transcripts/7320273)); Schilling's rule: ~log₂(n/2) ([1990, via Wolfram demo](https://demonstrations.wolfram.com/ConsecutiveHeadsOrTails)) | "Random means evenly mixed" (representativeness / gambler's fallacy) | 100 flips stream in as tiles, the longest run lights up; then 10,000 sequences fill a histogram and the judge's guess is a pencil line at the far left |
| **Positive test** | slider: "you test positive, chance you have it?" (0-100%) | Bayes from the numbers on the card (1% base rate, 90% sensitivity, 9% false positives → ~9%) | On a mammography case whose correct answer was 7.7%, doctors' most frequent estimate was 90% (earlier German study; the 160 gynecologists tested in 2007 gave "the same exact result") ([Gigerenzer, via APS](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care), [Natural frequency](https://en.wikipedia.org/wiki/Natural_frequency_(statistics))) | Base-rate neglect (confusing P(+\|sick) with P(sick\|+)) | 1,000 dots → 10 sick light up → positives get circled → the 9 true positives vs ~89 false ones. Natural frequencies are also what fixes the error in the studies, so the reveal *is* the teaching |
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

## Live-topic latency budget (queue #3)
Question: the judge types a topic and Gemini needs several seconds to ~15 s for the full JSON. How long can the live beat wait, and what's on screen meanwhile?

**What the research says**
- **Nielsen's 3 limits:** 0.1 s feels instant, 1 s keeps flow of thought, 10 s is about the limit for keeping attention on the task; past that, show when it'll finish ([NN/g, Response Times: The 3 Important Limits](https://nngroup.com/articles/response-times-3-important-limits)). Our 5-15 s straddles the 10 s line, so the wait has to be filled, not just indicated.
- **Doherty threshold:** acknowledge input within ~400 ms (Doherty & Thadani, IBM 1982, via [Laws of UX](https://lawsofux.com/doherty-threshold/)). The exact year/original paper I haven't checked: **unverified**. Practical rule: something visibly changes on Enter, under 0.4 s.
- **Labor illusion:** people can prefer a slower service when it shows the work being done, even for identical results (Buell & Norton 2011, *Management Science* 57(9):1564-1579, [RePEc/HBS listing](https://ideas.repec.org/p/hbs/wpaper/14-034.html) for the authors' related work). I only read secondary summaries, not the paper: details like effect size are **unverified**. Takeaway: show real build steps, not a spinner.
- **Occupied time feels shorter than unoccupied time:** Maister's first proposition ([The Psychology of Waiting Lines](https://davidmaister.com/articles/5/52/index.html)). A Utrecht study (n=410) found active waiting was judged shorter than passive watching of a progress bar ([van Nimwegen & van Rijn, UU repository PDF](https://dspace.library.uu.nl/bitstream/handle/1874/431886/3552327.3552329.pdf?sequence=1)). PDF returned 403 for me, so that's from the search summary: **unverified**.
- **Progress bars:** bar behavior changes perceived duration even when the real time is the same ([Harrison et al., Rethinking the Progress Bar, UIST '07](https://www.chrisharrison.net/index.php/Research/ProgressBars); [Faster Progress Bars, CHI '10](https://www.figlab.com/research/2010/faster-progress-bars)). The commonly quoted details (accelerating toward the end feels faster, backwards-moving ribbing reads ~11% faster) I couldn't confirm from the pages I could open: **unverified**.
- **Skeleton screens are not a sure win:** Viget's test (136 people) had skeletons perceived as the *longest* wait (2.82 s vs 2.41 s spinner vs 2.29 s blank), possibly because an unfamiliar skeleton draws attention to the wait ([Viget](https://www.viget.com/articles/a-bone-to-pick-with-skeleton-screens)). One study, small effect, but enough that I won't lean on a skeleton for a UI the judge has never seen.
- **Our model's real numbers:** Artificial Analysis lists Gemini 3.7 Flash (high) at ~9.8 s time to first answer token (includes thinking) and ~340 tokens/s output ([Artificial Analysis](https://artificialanalysis.ai/models/gemini-3-7-flash/providers)). A secondary post gives ~0.7 s TTFT at low thinking and ~4.2 s at medium ([Pillitteri](https://pasqualepillitteri.it/en/news/11139/gemini-3-7-flash-fastest-ai-model)): **unverified**. So thinking level is the biggest single latency knob; at ~300 tok/s, a ~1.5k-token question set is ~5 s of output after the first token (my estimate, measure it).
- **Streaming JSON works:** Gemini supports `generateContentStream` with a response schema; chunks are text fragments you concatenate and parse with a partial-JSON parser ([Google AI forum](https://discuss.ai.google.dev/t/do-stream-responses-support-structured-output/79482)). Not from official docs: **unverified** until I try it Saturday.

**Patterns that make 5-15 s feel fast**
1. **Stream the first question, generate the rest behind it.** Put question 1 first in the schema (or make it a separate small call) so the judge is answering while questions 2-N arrive. Once they're answering, the wait is gone from their point of view. Best option by far.
2. **Warm-up prediction during the wait.** The coin-streak question already in our ladder: it's on-brand (predict first), it takes ~10-20 s to answer, and it keeps them occupied (Maister). The judge doesn't sit and watch a loader.
3. **Labor-illusion step list, real events only.** "Writing your question → picking a reveal → computing the truth", each step ticking when the matching JSON field arrives in the stream. Don't fake ticks on a timer; if it stalls, a fake bar is worse.
4. **Cached showcase topics are instant.** Fuzzy-match the input to the ~40 pre-generated topics; on a hit, still show the step list for ~1 s so it reads as "built for you" and not a lookup (that's design choice, not research).
5. **Low thinking, small prompt, short JSON.** Lowest thinking setting, schema-only output, no explanations in the first pass. Cheapest latency win before any UI trick.

**Recommendation for the live beat**
- **Target:** first question on screen by ~5 s. **Max acceptable:** 15 s to first question. **Hard cap:** 20 s, then fall back (matches the 20 s budget in the ladder above).
- Second by second:
  - **0-0.4 s:** on Enter, the input locks, the topic echoes back big ("Black holes. Building your questions…"), step 1 starts animating. (Doherty)
  - **0.4-1 s:** the coin-streak warm-up slides in: "While I build yours: 100 coin flips, longest streak?" Driver/narrator hands the judge the slider.
  - **1-10 s:** judge answers the warm-up, gets the reveal. Step list ticks on real stream events in the corner. If question 1 lands earlier, a "Your topic's ready" chip shows; it doesn't interrupt the warm-up reveal.
  - **10-15 s:** if not ready after the warm-up reveal: a second short warm-up (positive test) or the narrator's line "it's computing the real answer, not making one up". Step list stays honest.
  - **15-20 s:** show "Almost there" plus the 3 closest cached topic chips alongside, so the judge can tap one or keep waiting.
  - **20 s:** fallback. Cancel or keep the request in the background, switch to "That one's taking a while. Try the closest:" with the 3 cached chips. If the live result lands later, quietly drop a "Your topic's ready" chip; never a spinner or raw error.
- **Rehearsal rule:** log time-to-first-question and time-to-full-JSON for 20 random topics on Saturday into NOTES.md. If the p90 to first question is over 10 s, split the first question into its own call and drop thinking to the lowest level.

**New questions this raised**
- Can we stream question 1 as a separate small call in parallel with the full set, and what does that cost in quota?
- Does partial-JSON parsing of Gemini's stream hold up with our schema, or do we need a line-delimited format instead?
- What's our measured TTFT on venue Wi-Fi vs a phone hotspot?
