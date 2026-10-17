# Demo script: the 3:00 table demo (visual sessions)

What the judge sees and does, click by click. Built on the three visual sessions in docs/experience.md (storyboard) and docs/experience-look.md (look + motion), the re-plan at the top of docs/build-plan.md, and the **direction update of Sat ~12:15 PM** (NOTES.md, #185): one compare screen per session after the reveal, and the any-topic engine that turns a typed topic into a runnable model. The words are in [docs/pitch.md](pitch.md); this file wins for what's on screen.

Name: **Onionskin** ("See your thinking in layers."), live at https://alexander-freedman.github.io/Swamphacks26-DSI/, API on Vultr at https://45-77-118-201.sslip.io (NOTES.md, Sat ~12:00 PM).

**Roles:** **narrator** talks and keeps time. **Driver** runs the laptop (or hands the trackpad / phone to the judge) and takes the technical questions. Both of us learn both roles (build-plan B9).

## The story (why this exists), said over the room filling
**Headline:** **"ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why."**

A chatbot *explains*. Explaining is the part that doesn't stick. Onionskin makes you *predict*, runs a simulation that shows where you were wrong, and names the mistake. **The AI builds the simulation; code guarantees the truth; you do the thinking.** (Honest scope: the three showcase sessions are hand-built; the AI builds the simulation for a topic you type.)

## Landing today: confirm before showing
These beats depend on unmerged work (Sat ~1 PM). Tick each one on the deployed site before a judging block; until then use the fallback in the script.
- [ ] Birthday compare screen (#181) → beat **1:15**. Fallback: say the PIN line over the B6 card.
- [ ] Coin + positive compare screens (#182, #183) → only for "every session has one".
- [ ] Engine v4 on the API (#179) + round player renders v4 specs (#184) → beat **1:40** with a typed topic. Fallback: a reviewed chip.
- [ ] Pre-built v4 set, 20-30 hand-checked topics (#180) → the chips at beat 1:40. Fallback: the 10 reviewed extras (PR #108).
- [ ] v4 latency measured on Vultr (#179 trial) → decides whether the judge types live or taps a chip. Rule: if the measured median is over ~10 s, chips only.

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
| Compare case: 4-digit PINs, 50% chance two share one | **119 people** (50.6%) | computed: 1 − ∏(10000−i)/10000, i = 0..118 = 0.5058 (#181 plan). Use the number the live screen shows |
| Comparing two cases helps transfer | "a marked advantage" for comparing two cases over studying them separately (negotiation, 3 studies) | [Gentner, Loewenstein & Thompson 2003](https://doi.org/10.1037/0022-0663.95.2.393) abstract. **No "3x" in this paper's abstract** |
| "Nearly three times more likely" to use the strategy | business students who compared two cases vs got them separately | [Loewenstein, Thompson & Gentner 1999](https://kellogg.northwestern.edu/faculty/research/detail/1999/analogical-encoding-facilitates-knowledge-transfer-in-negotiation?p=1) abstract. Only with this citation |
| Live generation on Vultr (old engine) | **5.5 s**, one topic (2 curve items, 1 dropped by checks) | NOTES.md, Sat ~12:10 PM smoke test. **One run, not engine v4** |
| Typed-topic generation time (old engine, before Vultr) | median **27 s**, p90 51 s (25-topic trial, prompt v2) | NOTES.md, Sat ~12:10 AM. **Our own trial, small sample.** Don't promise "seconds" out loud |
| Points backfire | 16-week course, badges + leaderboard → lower motivation and exam scores | docs/pitch.md "feedback is the reward" (source links there) |

Never say "proven to make you learn faster", "permanently fixes misconceptions", "addictive = more learning" (product-spec §4), or that a typed topic is "built live in seconds".

## Before the judge arrives (every time)
1. Press the **reset shortcut** (below): Home, local notebook cleared, no answers left from the last judge.
2. Home shows the three session cards (birthday first) and, below them, the "Try any topic" box with its chips.
3. Hit `https://45-77-118-201.sslip.io/api/health` (expect `{"status":"ok"}`) and check the backend dot in the How it works drawer is green. If it isn't, the any-topic beat runs on chips only.
4. The birthday session is **seeded** (experience-look.md, "seed the first run"), so the room fills the same way every time and the first match lands where we expect.
5. A phone with the session open as a second device, for a judge who'd rather touch than watch.

## The 3:00 script

| Time | Judge sees / does | Narrator says | Driver clicks |
|---|---|---|---|
| **0:00** | **B1 Guess** already open (`?session=birthday`): "How many people for a 50% chance two share a birthday?" Big slider 2-366 + confidence. **Judge drags and locks.** The pencil tick lands. | "Quick one before I explain anything. How many people for a coin-flip chance two share a birthday? Lock it in, no changing it." | Hands over the trackpad / phone. If the judge hesitates, locks their spoken number. |
| **0:15** | **B2 Fill the room.** People drop onto their days; pair lines web up; counter **people · pairs**. At 23: **23 · 253**. A match circles; the room shakes. | The headline: "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why." Then: "Watch the lines, not the people. 23 people already make 253 pairs." | Holds **Add a person** (seeded run). |
| **0:35** | **B4 Draw your curve.** **Judge draws** in pencil. | "Draw how you think the chance grows as the room fills." | Points at the axes. Say nothing about the drawing yet. |
| **0:50** | **B5 Reveal + extremes.** Ink S-curve over the pencil, gap shaded. Slider: **23 → 50.7%**, **57 → 99.0%**. | "Pencil is you, ink is reality. The gap is where your model broke. 23 people, 50.7%. 57, 99%." | Drags 2 → 23 → 57 → 80. |
| **1:05** | **B6 Stamp + card.** The mistake the guess points to (31-150 → **"It's about MY birthday"**, 151-249 → "You need about half of 365", 250+ → "A coin flip needs a full year"), quoting their number: *you* 5.9%, *any two* 50.7%. | "And it names the exact wrong idea. Most people picture someone matching *them*: 5.9%. Any two people: 50.7%." | Taps **Got it**. Skip the B7 rematch at the table. |
| **1:15** | **NEW: Compare, "pull out the structure"** *(landing today, #181)*. A second case that looks different but works the same: **shared 4-digit PINs**, same pair picture, 50% at **119 people** out of 10,000 PINs. Prompt: "What's the same about how these work?" **Judge names it** (types or picks). The shared principle inks in: *pairs grow much faster than people, so matches come early.* One guidance line. | "A case that looks nothing like it: 4-digit PINs. About 119 people before two share one. What's the same? … Pairs grow way faster than people. Comparing two cases side by side is how you pull out the structure; in a negotiation study, people who compared two cases transferred the idea markedly better than people who studied them one at a time." | Lets the judge answer; taps **Show me** if they stall. **Not live yet:** say the PIN line over the B6 card and move on. |
| **1:40** | **NEW: Any topic → a runnable model** *(engine v4 landing today, #179 + #184)*. Home → **Try any topic** → judge types a topic (or taps a pre-built chip). A runnable model opens in the round player: one of our widgets (curve with a knob, sampler, dial), a guess prompt, **extremes to try**, the guess vs the **code-computed** truth, the named misconception, and a compare screen when the spec has a second case. If nothing fits: an honest "no runnable model for this" + the nearest checked topic. | "That one was hand-built. Now type anything. The AI picks one of our simulations and fills in the knobs, the extremes and the mistake people make. It never writes the answer: our code computes it from the model. If nothing fits, it says so instead of faking a chart." | **Live typing only if** the v4 latency box above is ticked and the backend dot is green; otherwise taps a **pre-built chip** (#180 set; before that, a reviewed extra). Points at the label. **Before v4 is live:** reviewed chip, and "the AI builds these as a spec; this one we've hand-checked." |
| **2:15** | **How it works** drawer, backend dot green. | "The AI builds the simulation, code guarantees the truth, you do the thinking. Every number you saw was computed, never written by a model. The backend is one Vultr server; Gemini on the free tier, rate-limited, with a daily cap." | Opens the drawer, points at the dot. |
| **2:40** | Session end: **"Saved to your notebook. Come back tomorrow for a remix."** The notebook shows the judge's mistake as *caught* (pencil). | "No points, no streaks: the research says points can backfire. The reward is the moment your guess meets reality. ChatGPT tells you the answer. Onionskin shows you why you were wrong." | Taps **Notebook**. **Stop talking. Hand over for questions.** |

**If the judge gets the birthday guess right:** "You're in the few who knew it. Draw the curve anyway, that's where people miss."
**If the judge is fast:** add the **coin streak taste (C1-C2)** before any-topic: judge taps 20 coins, 20 real flips deal in under, longest runs underlined. "Yours switches back and forth. Real coins clump. In 100 real flips you get a run of 5 or more 97% of the time." Or the **positive test** (P1-P3): "9 out of about 98 positives are real: 9.2%. About 95 of 100 doctors guessed around 75% on a case like this; the answer was 7.7%."
**If the judge is slow:** chips instead of typing at 1:40. **Never cut** the headline or the compare beat (NOTES.md, Sat ~12:15 PM).

## The 90-second version (judge queue / rushed judge)
| Time | What happens |
|---|---|
| 0:00 | Open Birthday. Judge guesses, locks. |
| 0:10 | Fill the room to 23 while saying the headline: "23 people, 253 pairs." |
| 0:25 | Judge draws the curve. Ink over it, gap shaded. Slider to 23 (50.7%) and 57 (99.0%). |
| 0:45 | Stamp + the named mistake: 5.9% vs 50.7%. |
| 0:55 | Compare screen (or the line over the card): "4-digit PINs, about 119 people. Same structure: pairs grow faster than people." |
| 1:05 | Home, "Try any topic": "Type anything: the AI builds the simulation, code computes the truth, you do the thinking." Stop at 1:30. |

## Fallbacks (driver decides, no discussion at the table)
| Breaks | Do this | Say |
|---|---|---|
| A session screen hangs or errors | Reload with `?session=<slug>`; if it fails twice, switch to the next session | "Let me show you the coin one." |
| The drawing pad won't take input (trackpad) | Use the phone, or skip B4 and go to the reveal; the pencil guess tick still rides along | "Picture a straight line, that's what most people draw." |
| The room hasn't matched by ~30 people | **Empty the room, try again** once, then move on; the B5 slider carries the numbers anyway | "Sometimes it takes a while. That's randomness." |
| A session fails to load at the table | Open the interactive mockup `docs/mockups/<topic>.html` locally (`?final` jumps to the end state) | "This one's the prototype, same numbers." Never pass a mockup off as the app |
| Live generation is slow (> ~10 s) or the backend dot is red | Tap a **pre-built chip** (#180 set; before that, a reviewed extra). These are cached and need no model call | "Let's use one from our checked set." |
| Generation returns "no runnable model" | That's a feature: read the line, tap the nearest checked topic it offers | "It won't fake a chart when nothing fits." |
| The any-topic chip fails too | Skip the beat; say the AI line over Home | "Type any topic and the AI builds the simulation; code computes the truth." |
| The compare screen isn't live or breaks | Say the PIN line over the B6 card, go to any-topic | "Same structure with 4-digit PINs: about 119 people." |
| Venue wifi dies | Local `vite preview` build, opened before the expo. The sessions compute everything in the browser, no API | (nothing; it just works) |
| Laptop dies | Backup video, downloaded on the phone, not streamed | "Here's the 2-minute cut." |

Never show a raw error or a spinner. Run a fresh generation at the table **only** once engine v4 is merged and its measured latency on Vultr is under ~10 s (box above); otherwise the pre-built set only.

## Reset shortcut
- **`Shift+R` on Home, or opening the app with `?reset=1`**: clears this browser's answers and notebook, returns Home. No confirm dialog at the table.
- **Status: built (#67).** A "Notebook cleared" pill shows for a few seconds. Shift+R is ignored while typing in a field.

## Likely judge questions
The full set (16, sourced) is in [docs/pitch.md](pitch.md) §3; that file wins. The top four, short form:
1. **"How is this different from a chatbot?"** "A chatbot explains; watching or being told is the part that doesn't stick (Crouch et al. 2004). Here you predict, a simulation runs on top of your guess, and your wrong idea gets named. The AI builds the simulation, code guarantees the truth, you do the thinking."
2. **"Doesn't the model hallucinate?"** "The three sessions have no model in them: every number is a formula or exact count. For typed topics the model fills a spec and our code computes the answer from it, and if nothing fits it says so. Nothing is labelled *reviewed* unless a person checked it."
3. **"What's the compare screen for?"** *(only if live)* "Comparing two cases that look different but work the same is how people pull out the principle (Gentner, Loewenstein & Thompson 2003: 'a marked advantage' over studying them separately)."
4. **"How fast is any topic?"** "Checked topics are instant. One fresh topic took 5.5 s on our Vultr server Saturday, on the previous engine; I haven't measured the new one yet, so at the table I use the pre-built set." (Update from the #179 trial.)

## Rehearsal checklist (B9)
- Run the 3:00 and the 90-second versions 3 times each, both of us solo, with a stopwatch. Log drift here.
- Once on the phone (drawing with a finger), once on the laptop trackpad.
- Kill the wifi once mid-run and do it from the local build.
- Check every number said out loud against the table above.
- Once with the compare screen and once without (fallback line), so both are smooth.
- Once with a typed topic and once with a chip, timing the generation on the table wifi.
