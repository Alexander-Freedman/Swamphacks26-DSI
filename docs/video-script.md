# Demo video script ([NAME], 2:00 max)

**Rules:** 2:00 hard limit ([XII rules](https://swamphacks-xii.devpost.com/rules)); target 1:50. Burned-in captions on every line (judges often watch muted). **No music needed:** voice only works; a bed is optional per docs/expo-video.md (~-20 dB under the voice, or none). Screen recording at 1080p of the real app, no mockups. `[NAME]` is a placeholder until the name is picked. Production steps (ffmpeg cut, captions, export) are in docs/expo-video.md.

Built on the three visual sessions (docs/experience.md) in the same order as the live demo (docs/demo-script.md): birthday as the hook, a taste of the coin streak, the positive test, typed topics as a labelled extra, close on "come back tomorrow".

**Shots:** S = screen recording, T = title card. VO ≈ 250 words at ~140 wpm, leaving room for the visual beats.

| Time | Shot | On screen | Voiceover (caption = same text) |
|---|---|---|---|
| 0:00-0:08 | S1 | **Cold open on the birthday reveal (B5).** A pencil curve (a slow straight line) is already drawn; the ink S-curve sweeps in over it and the marker fills the gap. | "I drew how likely a shared birthday is as a room fills up. That's my pencil. The ink is reality." |
| 0:08-0:14 | T1 | Title card: `[NAME]` + tagline. | "This is [NAME]. Flashcards test what you remember. This shows you what you actually believe, next to what's true." |
| 0:14-0:24 | S2 | **B1 Guess:** "How many people for a 50% chance two share a birthday?" Slider dragged to 180, confidence "pretty sure", **Lock it in** (squash + spring). | "Every session starts with a guess. How many people for a fifty-fifty chance two share a birthday? I said a hundred and eighty. Locked." |
| 0:24-0:42 | S3 | **B2 Fill the room:** people drop onto the calendar, pair lines web up, counter climbs to **23 · 253**, a match circles in marker and the room shakes. | "Then you watch it run. Every line is a pair that could match. Twenty-three people make two hundred fifty-three pairs, so a match shows up fast." |
| 0:42-0:56 | S4 | **B5 extremes:** the group-size slider drags 2 → 23 → 57; the dot rides the ink curve; readouts **50.7%** and **99.0%**; the pencil curve stays put. | "Push it to the extremes. Twenty-three people: fifty point seven percent. Fifty-seven: ninety-nine. My model stays on screen the whole time, so I can see exactly where it broke." |
| 0:56-1:06 | S5 | **B6 Stamp + card:** stamp drops; card "It's about MY birthday", quoting 180; side by side 5.9% vs 50.7%. | "Then it names the mistake. I was picturing someone matching me. That's under six percent. Any two people: fifty point seven." |
| 1:06-1:22 | S6 | **Coin streak C1-C2:** a hand taps out 20 H/T; 20 real flips deal in underneath; the longest run in each row gets a marker underline; the real row clumps. | "Same idea, other concepts. Can you fake randomness? My row switches back and forth. Real coins clump: in a hundred real flips, a run of five or more shows up ninety-seven percent of the time." |
| 1:22-1:36 | S7 | **Positive test P2-P3:** "Test everyone": 1,000 dots, positives fly into a pile, 9 ink among 89 grey; readout **9.2%**. | "Test positive for something rare, and most positives are false alarms. Nine real cases out of about ninety-eight." |
| 1:36-1:46 | S8 | Home → "Try any topic" → a cached topic plays one item with the **auto-checked** label in view. | "You can type your own topic too. Those rounds are labelled auto-checked: code computes the answer, and when it can't, a second model answers blind, and disagreements get dropped." |
| 1:46-1:55 | S9 | Session end screen: "Saved to your notebook. Come back tomorrow for a remix." Notebook with the caught mistakes in pencil. | "No points, no streaks. It comes back tomorrow with new numbers, until your own model gets it right." |
| 1:55-2:00 | T2 | End card: `[NAME]`, URL, "SwampHacks XII · Entertainment & Creative Technology". | (silence) |

**VO word count:** ~250.

## Notes
- **Stat check (every number in the VO):** 23 → 50.7%, 57 → 99.0%, 253 pairs, "my birthday" 5.9% (= 1 − (364/365)^22 = 0.0586): computed, see the number table in docs/demo-script.md. "Five or more ninety-seven percent of the time" = 97.2% for 100 fair flips (exact DP, [showcase-facts.md](research/showcase-facts.md)). "Nine out of about ninety-eight" = 0.009 / (0.009 + 0.99 × 0.09) = 9.2% per 1,000 people (data/rounds/positive-test.json). "180" is my example guess, not data. No other numbers.
- **The auto-checked line** must stay true: if the blind check isn't fixed when we record, cut "a second model answers blind" and say "code computes the answer where it can, and they're labelled auto-checked". Never imply a check that isn't running.
- **S1 / S2 order:** record the full birthday session once with the guess at 180 and a straight pencil line, then cut: open on the B5 reveal, flash back to B1. Use the seeded room so the first match lands the same in every take.
- **S6 coin rows:** the real row varies by run; pick a take where the real row's longest run is clearly longer than the tapped one. Don't say a specific run length for the 20-flip rows.
- **S8:** cached topic only, so the take is repeatable. Don't say how fast generation is (median 27 s in our trial, NOTES.md).
- **S9:** if the notebook isn't built, show the session end line only and give the spare seconds to S4.
- **Cut to 1:30 if needed:** drop S7 (positive test) and trim S3 to 12 s.
- **Before the sessions are live** we don't record; the mockups are not the app.
- Captions: time the SRT from this table and burn in (docs/expo-video.md, step 7a).
