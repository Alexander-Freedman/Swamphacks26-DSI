# Onionskin: 2-minute video script

**Status:** draft, built from the #97 video script and the session code (birthday on main; coin streak PR #107; positive test PR #99). **Hard limit 2:00** ([XII rules](https://swamphacks-xii.devpost.com/rules)); this cut runs 1:55. Screen recording of the real app at 1080p, no mockups. Burned-in captions = the voiceover text (judges often watch muted). Voice only; a music bed is optional (docs/expo-video.md). Production steps (cut, captions, export): docs/expo-video.md.

**Shots:** S = screen recording, T = title card. Order matches the live demo: onion-skin hook, birthday, coin streak, positive test, close on the name.

| Time | Shot | Screen | Voiceover (caption = same text) | On-screen text |
|---|---|---|---|---|
| 0:00-0:07 | T1 | An animator's onion skin: a faint pencil frame under a crisp ink frame, the ink drawing in on top. | "Animators draw on onion skin. The last frame stays faint under the new one, so you see exactly what changed." | — |
| 0:07-0:15 | S1 | **Birthday reveal (step 5):** a straight dashed pencil curve; the ink S-curve sweeps in over it; highlighter fills the gap. | "We did that for ideas. That dashed line is my guess. The ink is reality. The yellow is what I got wrong." | pencil = you · ink = truth |
| 0:15-0:21 | T2 | Title card. | "This is Onionskin." | **Onionskin** · See your thinking in layers. |
| 0:21-0:31 | S2 | **Birthday step 1:** "How many people?" slider dragged to 120, confidence "pretty sure", **Lock it in**. | "Every session starts with a guess. How many people for even odds that two share a birthday? I said a hundred twenty." | Guess first, in pencil |
| 0:31-0:45 | S3 | **Birthday step 2:** people drop onto the calendar, pair lines web up, counter **23 people · 253 pairs**, a match circles in highlighter. | "Then watch it run. Every line is a pair that could match. Twenty-three people make two hundred fifty-three pairs." | 23 people · 253 pairs |
| 0:45-0:57 | S4 | **Birthday step 5:** group-size slider dragged 2 → 23 → 57; the dot rides the ink curve; readouts **50.7%** then **99.0%**; the pencil curve stays put. | "Drag to the extremes. Twenty-three people: fifty-one percent. Fifty-seven: ninety-nine. My guess never leaves the screen." | 23 → 50.7% · 57 → 99.0% |
| 0:57-1:07 | S5 | **Birthday step 6:** stamp **Way off** lands; card "It's about MY birthday"; side by side **5.9%** vs **50.7%**. | "Then it names my mistake. I pictured someone matching me. That's six percent. Any two people: fifty-one." | the mistake, named |
| 1:07-1:25 | S6 | **Coin streak, step 1:** a hand taps out 20 H/T; 20 real flips deal in underneath; each row's longest run gets the highlighter; tally "your longest: 2 · real: 5". Cut to the 100-flip histogram filling under the dashed guess, ink line "6.98". | "Can you fake a coin? My row keeps switching. Real coins clump. In a hundred real flips, a run of five or more shows up ninety-seven percent of the time." | runs of 5+ in 100 flips: 97.2% |
| 1:25-1:41 | S7 | **Positive test, step 2:** "Test all 1,000": positives fly into two piles, 9 sick vs 89 healthy; readout **9 / 98 · 9.2%**; my pencil guess at 90% next to it. Quick drag of the crowd slider. | "Test positive for something rare. Out of a thousand people, ninety-eight positives, but only nine are sick. Nine percent, not ninety." | 9 of 98 = 9.2% |
| 1:41-1:48 | S8 | Home: the three sessions, the "auto-checked" label on a typed topic in view. | "Every number is computed by code, and no points. The reward is seeing your layer meet reality." | computed, not generated |
| 1:48-1:55 | T3 | End card: Onionskin, onionskin.study, tagline, "SwampHacks XII · Entertainment & Creative Technology". | "Onionskin. See your thinking in layers." | **Onionskin** · onionskin.study · See your thinking in layers. |

**Voiceover word count: 193 words** (counted by script over the VO column), about 1:29 at ~130 wpm. That leaves ~25 s for the visual beats (the reveal sweep, the room filling, the piles flying) with no talking. The cap was 260 words.

## Notes
- **Stat check (every number in the VO and on-screen text; re-run in Python for this draft):** 23 → 50.7% (1 − ∏(365−i)/365 = 0.5073; said "fifty-one"), 57 → 99.0% (0.9901), 253 pairs = C(23,2), "my birthday" 1 − (364/365)^22 = 0.0586 (said "six percent"), runs of 5+ in 100 fair flips = 97.2% (exact DP, 0.9717), mean longest run 6.98 (exact), positive test 0.009 / (0.009 + 0.99 × 0.09) = 9.2%, crowd of 1,000 → 9 true + 89 false = 98 positives (computed). "120" and "90%" are my example guesses (120 falls in the 31-150 band, so the card is "It's about MY birthday" and the stamp is *Way off*: |120 − 23| > 15% of the 2-366 slider; 180 would show "You need about half of 365" instead, data/rounds/birthday.json), not data. No other numbers.
- **Coin tally:** the "your longest: 2 · real: 5" numbers depend on the take. Pick a take where the real row's longest run is clearly longer than the tapped one, and don't say the 20-flip numbers out loud.
- **T1 hook:** a short drawn animation (two layered SVG frames) or a real tracing-paper shot. No stock footage with a brand on it.
- **S1 / S2 order:** record the whole birthday session once with the guess at 120 and a straight pencil line, then cut: open on the step-5 reveal, flash back to step 1. The seeded room makes the first match land the same in every take.
- **S8:** only show the "auto-checked" label if typed topics work on the live site. If not, show Home with the three sessions and keep the same VO.
- **Before recording:** coin streak (#107) and positive test (#99) must be merged and live. If one isn't, cut its shot and give the time to S3/S4 (still under 2:00).
- **End card URL:** use onionskin.study only once it points at the site; until then show `alexander-freedman.github.io/Swamphacks26-DSI`.
- **Cut to 1:30 if needed:** drop S8 and trim S6 to 12 s.
