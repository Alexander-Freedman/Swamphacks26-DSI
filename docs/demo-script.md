# Demo script: the 3:00 table demo

What the judge sees and does, click by click. Built from the 3 decided showcases (coin streak, positive test, birthday problem, product-spec §8), the judge's own topic generated in the background, the "How it works" drawer, and the close. Earlier drafts: docs/research/demo.md (timing research, fallback ladder) and docs/pitch.md (talking points).

Working name: **mm** / "the app". The name is @luanamaldaner's call (#29); swap it in here once it's in NOTES.md.

**Roles:** **narrator** talks and keeps time. **Driver** runs the laptop and takes the technical questions. Both of us learn both roles (build-plan B9).

**Every number on screen or out loud comes from these, nothing else:**

| Claim | Value | Source |
|---|---|---|
| Coin streak, 100 fair flips | mean longest run **6.98**; a run of 5+ in **97.2%** | product-spec §8, showcase-facts.md (exact DP), data/rounds/coin-streak.json |
| Positive test (1% base rate, 90% catch rate, 9% false positives) | **9.2%** | data/rounds/positive-test.json (`answer_expr`), shared/schema/README.md |
| Doctors on a similar case | most frequent estimate **90%** vs a correct **7.7%** | [APS Observer](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care) |
| Birthday problem | **23 people → 50.7%**; 23 people make **253 pairs** | shared/schema/README.md (exact formula), data/rounds/birthday.json |
| What people guess for the birthday | "about half of 365" (teaching observation, **not a survey**) | [Live Science](https://www.livescience.com/what-is-birthday-paradox) |
| Live generation time | **~8-12 s** to the full round, item 1 sooner | docs/research/gemini.md §4. **This is an estimate until the benchmark on our key is logged there.** Don't say a number out loud until it is |
| Points backfire | 16-week course, badges + leaderboard → lower motivation and exam scores; 128 experiments, expected rewards undermine motivation | docs/pitch.md "feedback is the reward" |

Never say "proven to make you learn faster", "permanently fixes misconceptions" or "addictive = more learning" (product-spec §4).

## Before the judge arrives (every time)
1. Press the **reset shortcut** (below): home screen, local collection cleared, no answers left from the last judge.
2. Home screen shows the topic box ("What confuses you?") and the 3 showcase chips.
3. Check the corner status dot: **green** = backend reachable, **grey** = static mode (use the no-network script).
4. Attract loop on the second screen (if we have one): "100 coin flips. Longest streak?" with the tiles looping (docs/research/demo.md).

## The 3:00 script

| Time | Judge sees / does | Narrator says | Driver clicks |
|---|---|---|---|
| **0:00** | Topic box. **Judge names any topic** they've always found confusing. | "Name any topic you've always found confusing. Anything." Then repeats it out loud. | Types the topic exactly as repeated, **Enter**. Within ~0.4 s the topic echoes back and a small "Building your round…" chip with the step list (writing the question → picking a reveal → computing the truth) appears in the corner. |
| **0:08** | Coin-streak card: "Flip a fair coin 100 times. What's the longest run of the same side in a row?" Slider 1-20. | "While that builds, a quick one. Your gut answer." | Hands over the trackpad or holds the slider where the judge points. |
| **0:15** | **Judge sets the slider**, taps confidence (*guessing / pretty sure / certain*), taps **Lock it in**. Pencil stamp on their guess. | "Lock it in. No changing it now." | Nothing; the judge clicks. If they hesitate, the driver locks their spoken number. |
| **0:22** | ~400 ms beat. 100 tiles stream in; the longest run lights up. Then the histogram of 10,000 simulated runs fills in ink, with the judge's pencil line on it and the gap shaded. Verdict stamp: *Called it / Close / Way off*. | "Let's flip." (pause) "Real randomness is streakier than it feels. In 100 flips the longest run averages about 7, and you get a run of 5 or more 97% of the time." | Nothing. Let it play. |
| **0:40** | **Misconception card** slides up: *"Random means evenly mixed"*, why it's tempting, the right model in two sentences, the source. | "That gut feeling has a name. Most of us picture random as switching back and forth. It isn't. The app doesn't lecture you: it names the exact wrong idea you just bet on." | Taps the card's **Next**. |
| **0:50** | Positive-test card: "1% of people have a condition. The test catches 90% of real cases and wrongly says yes for 9% of healthy people. You test positive. Chance you have it?" Slider 0-100%. **Judge answers** and locks. | "Same family, higher stakes. You just tested positive." | Nothing. |
| **1:02** | 1,000 dots. 10 sick ones light up; the positives get circled: about 9 true hits vs about 89 false alarms. Truth: **9.2%**, ink over the judge's pencil. Card: *"The test's accuracy is my chance."* | "Out of a thousand people, the false alarms from the healthy 990 swamp the real cases. 9%. On a case like this, doctors' most common answer was 90%." | Nothing. |
| **1:20** | Birthday card: "How many people need to be in a room for a 50% chance two share a birthday?" Slider 2-366. **Judge answers**, locks. | "Last one before your topic." | Nothing. |
| **1:28** | The curve of P(shared birthday) vs people draws in ink over the judge's pencil mark; it crosses 50% at **23**. Card: *"It's about MY birthday."* | "23. Not because anyone matches you: 23 people make 253 pairs, and any pair can match." | Grabs the **"run it at the extremes"** slider and drags it to 2, then to 80, so the curve and the dot calendar move live. "Push it to the edges, that's where your model breaks." |
| **1:45** | The corner chip reads **"Your topic's ready"**. Driver opens it: item 1 of the judge's own topic, labeled **auto-checked**. **Judge predicts and locks**; the reveal plays (whichever widget the round picked). | "Your topic's ready. Same loop, built for you just now." | Taps the chip. If it isn't ready: see the fallback ladder below. |
| **2:15** | **"How it works" drawer** slides in from the right: the generated round JSON on the left, the computed truth and the check results on the right (schema ✓, truth computed ✓, bands agree with the answer ✓, lint ✓, blind check ✓). | "How do we know it's right? Gemini writes the question, the wrong ideas and which reveal to use. It never writes the answer. The truth comes from code: a simulation, a formula, or a cited number. When code can't compute an answer, a second model answers that question blind, and if they disagree it gets dropped." | Opens the drawer (button or `D`), points at the `truth` spec, then at the computed number next to it. |
| **2:40** | Back to home. If the collection screen exists: the judge's wrong ideas from this session, caught. | "Everyone gamifies learning with points, and the research says points can backfire. So there's no score here. The reward is the feedback: you bet, reality plays out over your guess, and your wrong idea gets named. Then it comes back until you've busted it." | Taps home (or the collection). **Stop talking. Hand over for questions.** |

**If the judge gets the coin streak right:** "Nice, you're in the few who don't fall for it. Try this one" and go straight to the positive test.
**If the judge gets everything right:** "You're our hardest judge today. Your topic is where it gets you." Lean on the live topic.

## The 90-second version (judge queue / rushed judge)
| Time | What happens |
|---|---|
| 0:00 | Judge names a topic, Enter, build starts in the corner. |
| 0:08 | Coin streak: predict, confidence, lock. |
| 0:20 | Reveal: tiles, histogram, pencil vs ink, verdict stamp. "Longest run averages about 7; 5+ in 97% of runs." |
| 0:35 | Misconception card: "Random means evenly mixed." One line: "It names the exact wrong idea you just bet on." |
| 0:50 | "Your topic's ready": one item, predict, lock, reveal. |
| 1:15 | One sentence: "Gemini writes the question; code computes the truth; anything code can't compute gets a blind second opinion." Stop. |

Skip the positive test, the birthday problem and the drawer (open the drawer only if they ask "how is it right?").

## Live-topic fallback ladder (driver decides, no discussion at the table)
Built from docs/research/demo.md; the timings are its recommendation.
1. **Cached:** the topic (or a close match) was pre-generated. Instant; the step list still shows for ~1 s.
2. **Generating:** the showcases cover the wait. If it's not ready by the end of the birthday beat (~1:45), the narrator says "it's computing the real answer, not making one up" and we do the drawer first, then come back.
3. **Slow (past 20 s) or failed:** "That one needs a reveal we haven't built yet. Pick the closest:" and 3 cached topic chips. Never show a raw error or a spinner past 20 s. If the live round lands later, a quiet "Your topic's ready" chip appears.
4. **Weird or unsafe topic** (names, slurs, medical-advice framing): the input filter offers the safe chip row instead.

## No-network fallback (venue wifi dies)
- **What still works:** all 3 showcase rounds. They're hand-checked JSON shipped with the frontend (`rounds/*.json` on the static build) and the truth is computed in the browser, so no API call is needed.
- **How to run it:** the laptop keeps a local production build of the frontend (`vite preview` on the last tagged release), opened before the expo. The backend runs locally with `DEMO_OFFLINE=1` (cache + showcase only, product-spec §7).
- **The live-topic beat becomes:** "Pick a topic" from the pre-generated cached topics (~30 safety topics). Say it honestly: "Wifi's down, so here's one it built earlier; same pipeline." Never pass a cached round off as live.
- **Last resort:** the backup video (≤2 min, build-plan B6), already downloaded on the laptop, not streamed.

## Reset shortcut
- **`Shift+R` on the home screen, or opening the app with `?reset=1`**: clears this browser's answers and collection, cancels any pending build, returns to the home screen with the chips. No confirm dialog at the table.
- **Status: not built yet.** It's on the frontend list (my side can add it if @luanamaldaner's queue is full). Until it exists: a private window per judge.
- The drawer opens with `D` (also not built yet).

## 6 likely judge questions
1. **"How do you know the answer is right? Doesn't the model hallucinate?"**
   "The model never writes the answer. It writes a spec: a simulation, a formula or a cited number, and our code computes the truth from it. Then we check: the JSON against the schema, the computed answer against the bands, a linter on the wording, and for any question where code can't compute the answer, a second model (Gemma) answers it blind; disagreement drops the item. When code computes the truth, code wins (api/app/checks.py). The three showcase rounds are hand-checked and labeled 'reviewed'; generated ones say 'auto-checked'." (Open the drawer.)
2. **"What if my topic can't be simulated, like history?"**
   "Then it doesn't pretend. If fewer than 3 items survive the checks, it falls back to a worked-example stepper or claim cards with sources, and if a topic can't be checked at all, it says so." (product-spec §6.)
3. **"How is this different from ChatGPT's study mode or Brilliant?"**
   "Every AI tutor explains. We make you bet first, then show the truth as something you can play with, and name the exact wrong idea you bet on, and that idea comes back until it's busted. Brilliant is closest, but its courses are hand-written and fixed; ours works on whatever you type." (competitors.md via product-spec §1-2.)
4. **"Does it actually help people learn?"**
   "We can't run a learning study in 36 hours, so we don't claim one. What we built on: predicting before a demo beat just watching it (Crouch et al. 2004), and confident mistakes are the ones people correct best (hypercorrection). That's why there's a lock-in and a confidence tap." (product-spec §2; add our user-test numbers from docs/user-testing.md once B4 runs.)
5. **"Why no streaks or points? And then why is it Entertainment?"**
   Use the answer in docs/pitch.md ("Judge Q&A: Why no streaks or points?"). Short form: "A 16-week study found badges and a leaderboard lowered motivation and exam scores. So the reward is the reveal and seeing your wrong idea named. The fun is the bet and the reveal: you guess, it plays out over your guess, a stamp lands."
6. **"What does Gemini actually do, and what happens when you hit limits?"**
   "Gemini 3.5 Flash-Lite generates each topic's full round in one structured-output call; Gemma 4 31B does the blind check on its own quota. Rounds are cached by topic forever, showcases need no call at all, and the live endpoint is rate-limited per IP with a daily cap. If Flash-Lite runs out it falls back down a model chain, and with no network the showcases still run." (product-spec §7, gemini.md.)

## Rehearsal checklist (B9)
- Run the 3:00 and the 90-second versions 3 times each, both of us solo, with a stopwatch.
- 5 random topics from strangers; log time to "Your topic's ready" and anything that broke in NOTES.md.
- Kill the wifi once mid-run and do the no-network version.
