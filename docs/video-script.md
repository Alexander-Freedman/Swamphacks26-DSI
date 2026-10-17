# Demo video script ([NAME], 2:00 max)

**Rules:** 2:00 hard limit ([XII rules](https://swamphacks-xii.devpost.com/rules)); target 1:50. Burned-in captions on every line (judges often watch muted). **No music needed:** the cut works with voice only; a bed is optional per docs/expo-video.md (~-20 dB under the voice, or none). Screen recording at 1080p, real app, no mockups. `[NAME]` is a placeholder until the name is picked. Production steps (ffmpeg cut, captions, export) are in docs/expo-video.md.

**Shots:** S = screen recording, T = title card. VO ≈ 245 words at ~140 wpm, leaving room for the reveal beats.

| Time | Shot | On screen | Voiceover (caption = same text) |
|---|---|---|---|
| 0:00-0:10 | S1 | **Cold open on the coin-streak reveal.** The pencil guess is already locked at 4. The 100 coin tiles stream in, the longest run (7) lights up, the ink truth lands over the pencil, stamp: **Way off**. | "I guessed the longest streak in 100 coin flips would be four. It's usually seven. A run of five or more happens 97% of the time." |
| 0:10-0:18 | S2 | Misconception card slides up: "Random means evenly mixed", why it's tempting, the right model, the source link. | "And it tells me exactly which wrong idea I bet on: random means evenly mixed." |
| 0:18-0:26 | T1 | Title card: `[NAME]` + tagline. | "This is [NAME]. You bet first, then reality grades you, on any topic you type." |
| 0:26-0:50 | S3 | Home screen. Type a topic live (e.g. "why ice floats" or a judge-style pick). "Building your round" chip; cut to item 1 on screen. | "Every AI tutor will explain things to you. We don't, until you've committed, because watching an answer teaches far less than predicting it first. Type any topic, coin flips, physics, calculus, and in a few seconds you get a short round of questions built for it." |
| 0:50-1:10 | S4 | Predict on the generated item: drag the slider, tap confidence "certain", press **Lock it in**. Reveal + stamp. | "Drag your guess, say how sure you are, and lock it. No take-backs. Then the truth draws in ink over your pencil guess, and the gap is shaded. Confident mistakes are the ones people fix best, so being sure and wrong gets the biggest reveal." |
| 1:10-1:22 | S5 | Collection screen: caught vs busted wrong ideas. | "Your wrong ideas go into a collection, and they come back as new questions until you bust them. No points, no leaderboard. The feedback is the reward." |
| 1:22-1:45 | S6 | "How it works" drawer: the generated JSON next to the computed truth; the check report (kept / dropped items). | "Under the hood, Gemini Flash-Lite writes the round as structured JSON, but it never writes the answer. Our code computes the truth and lints every question. When code can't compute the answer, a second model, Gemma, answers it blind, and anything they disagree on gets dropped." |
| 1:45-1:55 | S7 | Back to the coin reveal frame, then the live URL + QR. | "Our showcase rounds are hand-checked and work offline. Generated ones are labeled auto-checked, and when we can't check a topic, we say so. Bet your hunch. Bust your myths." |
| 1:55-2:00 | T2 | End card: `[NAME]`, URL, "SwampHacks XII · Entertainment & Creative Technology". | (silence) |

**VO word count:** ~245 (room to add ~25 words if the takes run short).

## Notes
- **Stat check:** "usually seven" = mean longest run 6.98; "97%" = ≥5 in 97.2% ([showcase-facts.md](research/showcase-facts.md), NOTES.md). "Confident mistakes are the ones people fix best" = hypercorrection ([review](https://pmc.ncbi.nlm.nih.gov/articles/PMC3604148)). "Watching an answer teaches far less than predicting it first" = [Crouch et al. 2004](https://doi.org/10.1119/1.1707018) (watch-only students did no better than students who never saw the demo). No other numbers in the VO.
- **S1 setup:** record the coin round with the slider locked at 4 *before* rolling, so the video opens mid-reveal. If the stamp for 4 isn't "Way off" in the build, change the stamp word in the shot list, not the data. The simulated run that lights up varies by seed; pick a take where it shows 6-8 so "usually seven" matches the screen.
- **S3 topic:** use a cached topic so the take is repeatable; say "in a few seconds", not a specific number, unless we've measured it on our key (gemini.md has only an estimate).
- **S5:** if the collection screen isn't in the build, cut S5 and give its 12 s to S6.
- **Cut to 1:30 if needed:** drop T1's line into S2's caption and trim S3 to 15 s.
- Captions: time the SRT from this table and burn in (docs/expo-video.md, step 7a).
