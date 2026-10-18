# Onionskin: 2-minute video script

**Status:** rewritten Sat evening for the current flow (NOTES.md Sat ~1:05 PM, #193: learn any topic visually, no betting language, headline "See your thinking in layers.", subline "Type any topic. Watch it come alive."). Matches the submission text in [devpost.md](devpost.md). **Hard limit 2:00** ([XII rules](https://swamphacks-xii.devpost.com/rules)); this cut runs 1:55. Screen recording of the real app at 1080p, no mockups. Burned-in captions = the voiceover text (judges often watch muted). Production steps (cut, captions, export): docs/expo-video.md.

**Shots:** S = screen recording, T = title card. Flow: onion-skin hook → birthday (guess, room, reveal, compare with PINs) → a typed topic becoming a visual → calculus tangent (only if #202 is merged; else the alternate below) → honest no-fit → close.

| Time | Shot | Screen | Voiceover (caption = same text) | On-screen text |
|---|---|---|---|---|
| 0:00-0:07 | T1 | An animator's onion skin: a faint pencil frame under a crisp ink frame, the ink drawing in on top. | "Animators draw on onion skin. The last frame stays faint under the new one, so you see exactly what changed." | — |
| 0:07-0:14 | T2 | Title card over the new Home. | "This is Onionskin. Type any topic, and watch it come alive." | **Onionskin** · See your thinking in layers. · Type any topic. Watch it come alive. |
| 0:14-0:24 | S1 | **Birthday, guess:** "How many people?" slider dragged to 120, then continue. | "Every topic starts with your guess. How many people for even odds that two share a birthday? I said a hundred twenty." | your guess, in pencil |
| 0:24-0:36 | S2 | **Birthday, room:** people drop in, pair lines web up, counter **23 people · 253 pairs**, a match circles in highlighter. | "Then watch it run. Every line is a pair that could match. Twenty-three people make two hundred fifty-three pairs." | 23 people · 253 pairs |
| 0:36-0:50 | S3 | **Birthday, reveal:** my dashed pencil curve; the ink S-curve sweeps in over it; highlighter fills the gap; slider to 23 → **50.7%**, 57 → **99.0%**; the mistake card: **5.9%** vs **50.7%**. | "My guess stays as a faint layer under reality. Twenty-three people: fifty-one percent. I was picturing someone matching *me*. That's only six percent." | 23 → 50.7% · mine: 5.9% |
| 0:50-1:03 | S4 | **Birthday, compare:** "Birthdays in a room" next to "PINs in a crowd"; the PIN curve crosses 50% at **119**; I pick what's the same; the principle inks in. | "Then a case that looks different but works the same. Ten thousand PINs, and a hundred nineteen people already make a match likely. Pairs grow faster than people." | 10,000 PINs → 119 people |
| 1:03-1:22 | S5 | **Typed topic:** type "derivative of x squared", Go; the visual builds (a few seconds, keep the real wait, cut to ~3 s); guess the slope at x = 3 by dragging; the ink truth **6** inks in; the "auto-checked" label in view. | "Now any topic. I type derivative of x squared. The AI picks the picture and fills it in. The answer is computed in code, never written by the model." | the AI builds it · code checks it |
| 1:22-1:36 | S6 | **Calculus level (if #202 merged):** drag the tangent line along x²; its slope readout tracks; fill the area under the curve with rectangles. | "In calculus you drag the tangent and watch the slope change, then fill the area with rectangles until it's exact." | drag the tangent |
| 1:36-1:45 | S7 | **Honest no-fit:** type "the French Revolution"; the plain message and the nearest checked topics. | "And when it can't draw something honestly, it says so instead of faking a chart." | no fake charts |
| 1:45-1:55 | T3 | End card: Onionskin, URL, headline, "SwampHacks XII · Entertainment & Creative Technology". | "No points, no bets. Just your layer meeting reality. Onionskin. See your thinking in layers." | **Onionskin** · See your thinking in layers. |

**Voiceover word count: 202 words** (counted by script over the VO column), about 1:33 at ~130 wpm, leaving room for the visual beats (the room filling, the ink sweep, the build) with no talking. Cap 250.

## Notes
- **If calculus (#202) isn't merged:** cut S6 and give its 14 s to S5 (show the slope guess and the ink line more slowly) and S4. Still under 2:00. If the orgo level (#204) is merged and looks better on video, it can take S6's slot instead: "In chemistry you build the molecule atom by atom." Pick one, not both.
- **S5 live build:** "derivative of x squared" built in ~4 s on the Vultr API (measured Sat Oct 17 ~4:10 PM, one run). Record the real build; if it takes longer in a take, cut the wait down but don't fake the result. If it's in the pre-built set (#206), it loads instantly; then say "The AI built this and we hand-checked it" and show the "hand-checked" label instead of "auto-checked". Derivative of x² at x = 3 is 6 (computed).
- **S7 no-fit:** the French Revolution came back as an honest no-fit in our trial (docs/research/gemini.md, Run 3). Check it does on the live API before recording; if the engine now builds something for it, use gibberish ("asdf qwer") instead, which is refused before any model call.
- **Stat check (every number in the VO and on-screen text, re-run in Python for this draft):** 23 → 50.7% (0.5073, said "fifty-one"), 57 → 99.0% (0.9901), 253 = C(23,2), "my birthday" 1 − (364/365)^22 = 5.9% (0.0586, said "six percent"), PINs: smallest n with ≥ 50% for 10,000 = 119 (0.5058). "120" is my example guess, not data.
- **No betting language on screen or in the VO** (#193): no "lock it in", "called it", "bet", confidence picker or XP. Re-record any take that shows them if the Home/no-betting PR (#205) lands first.
- **T1 hook:** a short drawn animation (two layered SVG frames) or a real tracing-paper shot. No stock footage with a brand on it.
- **End card URL:** onionskin.study only once it points at the site; until then `alexander-freedman.github.io/Swamphacks26-DSI`.
- **Cut to 1:30 if needed:** drop S6 and T2's subline line.
