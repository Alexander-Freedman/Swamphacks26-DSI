# Demo script: the 3:00 table demo (visual sessions)

What the judge sees and does, click by click. Built on the three visual sessions in docs/experience.md (storyboard) and docs/experience-look.md (look + motion), and the re-plan at the top of docs/build-plan.md. The judge's own typed topic is a **labelled extra** at the end, not the headline: live generation took a median 27 s in our trial (NOTES.md, Sat ~12:10 AM), too slow for the stage, so it plays from the hand-reviewed cached set.

Working name: **mm** / "the app". The name is @luanamaldaner's call (#29); swap it in here once it's in NOTES.md.

**Roles:** **narrator** talks and keeps time. **Driver** runs the laptop (or hands the trackpad / phone to the judge) and takes the technical questions. Both of us learn both roles (build-plan B9).

## The story (why this exists), ~20 s, said over the first screen
Flashcards test whether you can *recall* an answer. They don't test whether you can *run* the idea in your head. Most of us "know" a probability fact and still guess wrong the moment the numbers change. So the app does the opposite of a flashcard: you guess first, you watch a real example play out, you push it to the extremes, and your own guess stays on screen next to the truth until you can see exactly where your model broke. Then it names that mistake. A couple of minutes per concept, and it comes back tomorrow with new numbers.

One-line version: **"Quizlet tests what you remember. This shows you what you actually believe, next to what's true."**

## Every number on screen or out loud comes from this table, nothing else

| Claim | Value | Source |
|---|---|---|
| Birthday: people for a 50% chance of a shared birthday | **23 → 50.7%** | computed: 1 − ∏(365−i)/365 for i = 0..22 = 0.5073 (also shared/schema/README.md, data/rounds/birthday.json) |
| Birthday: pairs among 23 people | **253** | computed: C(23,2) = 253 |
| Birthday: 57 people | **99.0%** | computed: same formula, n = 57 → 0.9901 |
| Birthday: someone in a room of 23 shares *my* birthday | **5.9%** | computed: 1 − (364/365)^22 = 0.0586 (birthday mockup, docs/experience-look.md) |
| What people guess for the birthday | "about half of 365" (teaching observation, **not a survey**) | [Live Science](https://www.livescience.com/what-is-birthday-paradox) |
| Coin streak, 100 fair flips | expected longest run **6.98**; a run of 5+ in **97.2%** | exact DP (docs/research/showcase-facts.md, data/rounds/coin-streak.json); re-run for this doc: 6.977 and 0.9717 |
| People faking flips avoid long runs | one class: only one invented 100-flip sequence had a run of 5+ (**one class, anecdote, not a study**) | [Dartmouth Chance, Streaks notes](https://chance.dartmouth.edu/teaching_aids/Profiles/streaks/section3_3.html) |
| Positive test (1% have it, 90% caught, 9% false alarms) | **9.2%** (≈ 9 true hits out of ≈ 98 positives per 1,000) | computed: 0.009 / (0.009 + 0.99 × 0.09) = 0.0917 (data/rounds/positive-test.json) |
| Doctors on a similar case | about 95 of 100 guessed ~75%; the answer was 7.7% | [APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care) |
| Typed-topic generation time | median **27 s**, p90 51 s (25-topic trial, prompt v2) | NOTES.md, Sat ~12:10 AM. **Our own trial, small sample.** Don't promise "seconds" out loud |
| Points backfire | 16-week course, badges + leaderboard → lower motivation and exam scores | docs/pitch.md "feedback is the reward" (source links there) |

Never say "proven to make you learn faster", "permanently fixes misconceptions", "addictive = more learning" (product-spec §4), or that a typed topic is "built live in seconds".

## Before the judge arrives (every time)
1. Press the **reset shortcut** (below): Home, local notebook cleared, no answers left from the last judge.
2. Home shows the three session cards (birthday first) and, below them, the small "Try any topic (auto-checked)" box.
3. The birthday session is **seeded** (experience-look.md, "seed the first run"), so the room fills the same way every time and the first match lands where we expect.
4. A phone with the session open as a second device, for a judge who'd rather touch than watch.

## The 3:00 script

| Time | Judge sees / does | Narrator says | Driver clicks |
|---|---|---|---|
| **0:00** | Home: three session cards. | The story line: "Quizlet tests what you remember. This shows you what you actually believe, next to what's true. Two minutes per idea. Let's do one." | Opens **Birthday** (`?session=birthday`). |
| **0:10** | **B1 Guess.** "How many people for a 50% chance two share a birthday?" Big slider 2-366 + confidence. **Judge drags and locks.** The pencil tick lands with the squash-and-spring lock. | "Your gut number. Lock it in, no changing it." | Hands over the trackpad / phone. If the judge hesitates, locks their spoken number. |
| **0:20** | **B2 Fill the room.** Calendar strip + room. People drop onto their days; thin pair lines web up between every two people; counter **people · pairs**. At 23 people it reads **23 · 253**. A match lands: the day circles in marker, the room shakes. | "Let's fill a room. Watch the lines, not the people. Every line is a pair that could match. 23 people already make 253 pairs." | Holds **Add a person** (seeded run). One **Empty the room, try again** if there's time. |
| **0:45** | **B4 Draw your curve.** Empty axes: people (2-80) × chance of a match. **Judge draws their curve** with a finger or the trackpad, in pencil. | "Now draw what you think the chance looks like as the room grows." | Points at the axes. Most people draw a slow straight line; say nothing about it yet. |
| **1:00** | **B5 Reveal + extremes.** The ink S-curve draws in **over the judge's pencil curve**; marker shading fills the gap. The group-size slider moves a dot along the ink: **23 → 50.7%**, **57 → 99.0%**, with the pairs counter. | "Ink is reality, pencil is you. The gap is where your model broke. 23 people, 50.7%. 57 people, 99%." | Drags the slider 2 → 23 → 57 → 80 across the labelled break-point ticks. |
| **1:20** | **B6 Stamp + card.** The stamp drops (CLOSE / the mistake's name). Card: **"It's about MY birthday"**, quoting the judge's number, side by side: someone matches *you* 5.9%, *any two* match 50.7%. | "And it names the exact wrong idea: you were picturing someone matching *you*. That's 5.9%. Any two people: 50.7%." | Taps **Got it**. Skip the B7 rematch at the table unless the judge asks. |
| **1:35** | **Coin streak taste (C1-C2).** Home → Coin streak. "Make up 20 fair coin flips." **Judge taps 20 coins H/T.** 20 **real** flips deal in under their row; the longest run in each row gets a marker underline; tally "your longest: 2 · real: 5" (example; real values vary by run). | "Thirty seconds: can you fake randomness? Tap out 20 coin flips." (after) "Yours switches back and forth. Real coins clump. In 100 real flips you get a run of 5 or more 97% of the time." | Opens the session; taps **Flip again** once so a second real row clumps too. |
| **2:05** | *Only if we're at or under 2:05:* **Positive test P1-P3.** "You test positive. Chance you have it?" Judge locks a %; **Test everyone**: 1,000 dots, the positives fly into a pile, **9 ink among 89 grey**. Ink readout **9.2%**. | "When the thing is rare, most positives are false alarms. 9 out of about 98. On a case like this, almost all doctors guessed around 75%." | Locks, taps **Test everyone**, one drag of the rarity slider toward 50%. *Over time: skip this beat.* |
| **2:30** | **Any-topic extra (~15 s).** Home → "Try any topic" → a cached topic chip; one item plays in the round player with the **auto-checked** label visible. | "You can also type your own topic. Those rounds say *auto-checked*, not *reviewed*: code computes the answer, and when code can't compute the answer, a second model answers it blind, and anything they disagree on gets dropped." | Taps a cached chip (never a fresh live generation on stage). Points at the label. |
| **2:45** | Session end screen: **"Saved to your notebook. Come back tomorrow for a remix."** The notebook shows the judge's mistakes as *caught* (pencil). | "No points, no streaks: the research says points can backfire. The reward is the moment your guess meets reality. Tomorrow it comes back with new numbers until you've busted it." | Taps **Notebook** if it exists. **Stop talking. Hand over for questions.** |

**If the judge gets the birthday guess right:** "You're in the few who knew it. Draw the curve anyway, that's where people miss."
**If the judge is fast:** do the positive test in full, including the rarity slider.
**If the judge is slow:** cut the positive test, keep the coin taste to 20 s.

## The 90-second version (judge queue / rushed judge)
| Time | What happens |
|---|---|
| 0:00 | One line of story. Open Birthday. Judge guesses, locks. |
| 0:10 | Fill the room to 23: "23 people, 253 pairs." |
| 0:30 | Judge draws the curve. Ink S-curve over it, gap shaded. Slider to 23 (50.7%) and 57 (99.0%). |
| 0:55 | Stamp + "It's about MY birthday": 5.9% vs 50.7%. |
| 1:10 | "Coin streaks and medical tests work the same way; typed topics are a labelled extra. No points: come back tomorrow for a remix." Stop. |

## Fallbacks (driver decides, no discussion at the table)
| Breaks | Do this | Say |
|---|---|---|
| A session screen hangs or errors | Reload with `?session=<slug>`; if it fails twice, switch to the next session | "Let me show you the coin one." |
| The drawing pad won't take input (trackpad) | Use the phone, or skip B4 and go to the reveal; the pencil guess tick still rides along | "Picture a straight line, that's what most people draw." |
| The room hasn't matched by ~30 people | **Empty the room, try again** once, then move on; the B5 slider carries the numbers anyway | "Sometimes it takes a while. That's randomness." |
| A session isn't live yet (true right now, see docs/scorecard.md) | Open the interactive mockup `docs/mockups/<topic>.html` locally (`?final` jumps to the end state) | "This one's the prototype, same numbers." Never pass a mockup off as the app |
| The any-topic chip fails | Skip the beat | "There's also a typed-topic mode, labelled auto-checked." |
| Venue wifi dies | Local `vite preview` build, opened before the expo. The sessions compute everything in the browser, no API | (nothing; it just works) |
| Laptop dies | Backup video, downloaded on the phone, not streamed | "Here's the 2-minute cut." |

Never show a raw error or a spinner. Never run a fresh generation at the table.

## Reset shortcut
- **`Shift+R` on Home, or opening the app with `?reset=1`**: clears this browser's answers and notebook, returns Home. No confirm dialog at the table.
- **Status: built (#67).** A "Notebook cleared" pill shows for a few seconds. Shift+R is ignored while typing in a field.

## 6 likely judge questions
1. **"How do you know the answers are right? Doesn't the model hallucinate?"**
   "The three sessions are hand-built: every number comes from a formula or an exact calculation, and each mockup carries its check. For typed topics the model never writes the answer. It writes a spec and our code computes the truth. When code can't compute the answer, a second model answers it blind, and anything they disagree on gets dropped. To be straight with you: that blind check is being made honest right now. In our trial it often timed out and still reported a pass, so typed topics come from a reviewed set and are labelled auto-checked until it's fixed." (NOTES.md, Sat ~12:10 AM.)
2. **"What if my topic can't be visualised, like history?"**
   "Then it doesn't pretend. A typed topic gets a short round with a worked-example stepper or sourced claims, labelled auto-checked. The visual sessions are hand-built for concepts where seeing it run changes your mind." (product-spec §6, experience.md "Any typed topic".)
3. **"How is this different from Quizlet, ChatGPT's study mode or Brilliant?"**
   "Quizlet checks recall. Chat tutors explain. Here you commit a guess, then reality plays out *on top of* it, and your model stays on screen next to the truth so you see where it broke. Brilliant is closest, but its courses are long and fixed; this is two minutes per idea and comes back with new numbers." (product-spec §1-2.)
4. **"Does it actually help people learn?"**
   "We can't run a learning study in a weekend, so we don't claim one. What we built on: predicting before a demo beats just watching it (Crouch et al. 2004), and confident mistakes are the ones people correct best (hypercorrection). That's why there's a lock-in and a confidence tap." (Sources in docs/experience.md; add user-test lines from docs/user-testing.md after round 1, Sat 1:30 PM.)
5. **"Why no streaks or points? And then why is it Entertainment?"**
   Use the answer in docs/pitch.md ("Judge Q&A: Why no streaks or points?"). Short form: "A 16-week study found badges and a leaderboard lowered motivation and exam scores. The fun is the bet and the reveal: you guess, you draw, reality draws in over your pencil, a stamp lands."
6. **"Where's Gemini in this, and why isn't typed-topic the headline?"**
   "Gemini writes the typed-topic rounds as structured JSON, never the answer. I measured it: median 27 seconds per topic in a 25-topic trial, and every item came out as a plain number guess, not a visual. That's not good enough to lead with, so the headline is hand-built visual sessions and typed topics are a labelled extra from a reviewed cache." (NOTES.md trial.)

## Rehearsal checklist (B9)
- Run the 3:00 and the 90-second versions 3 times each, both of us solo, with a stopwatch. Log drift here.
- Once on the phone (drawing with a finger), once on the laptop trackpad.
- Kill the wifi once mid-run and do it from the local build.
- Check every number said out loud against the table above.
