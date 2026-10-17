# Onionskin: 2-minute video script

**Status:** rewritten Sat evening for the team decision of Sat ~6:05 PM: **orgo (PR #204) and calculus (PR #202, merged) are the spine**; a typed topic and an honest no-fit support them. Headline "See your thinking in layers.", subline "Type any topic. Watch it come alive.", no betting language. Matches [devpost.md](devpost.md) and [docs/demo-script.md](../demo-script.md). **Hard limit 2:00** ([XII rules](https://swamphacks-xii.devpost.com/rules)); this cut runs 1:55. Screen recording of the real app at 1080p, no mockups. Burned-in captions = the voiceover (judges often watch muted). Production steps: docs/expo-video.md.

**Shots:** S = screen recording, T = title card. Flow: onion-skin hook → orgo build with a named mistake → push the electrons → calculus tangent + area → typed topic → honest no-fit → close. Orgo shots are **[if #204 merged]**; see Notes for the cut without them.

| Time | Shot | Screen | Voiceover (caption = same text) | On-screen text |
|---|---|---|---|---|
| 0:00-0:07 | T1 | An animator's onion skin: a faint pencil frame under a crisp ink frame, the ink drawing in on top. | "Animators draw on onion skin. The last frame stays faint under the new one, so you see exactly what changed." | — |
| 0:07-0:13 | T2 | Title card over Home. | "This is Onionskin. Type any topic, and watch it come alive." | **Onionskin** · See your thinking in layers. |
| 0:13-0:30 | S1 | **Orgo, build ethanol:** atoms dragged onto the paper, bonds snapping; I give a carbon a 5th bond, its ring goes red, **"A carbon with 5 bonds"** appears. | "Organic chemistry. Build ethanol, atom by atom. Give a carbon a fifth bond, and it names the mistake while you make it." | target: C₂H₆O |
| 0:30-0:38 | S2 | **Check it:** a three-bond oxygen gets **"Oxygen with 3 bonds, no charge"**, FC = 6 − 2 − 3 = +1; fixed, ethanol ✓. | "An oxygen with three bonds isn't neutral. It's plus one." | FC = 6 − 2 − 3 = +1 |
| 0:38-1:00 | S3 | **Push the electrons:** HO⁻ + CH₃Br; my two pencil arrows; **Show me** inks the real ones over them; the scrubber runs: partial bonds at halfway, Br⁻ leaves, the H's flip. | "Then draw where the electrons go. My arrows stay in pencil, the real ones ink over them, and the reaction plays: in from the back, bromide out, the carbon flipped like an umbrella." | pencil = you · ink = reality |
| 1:00-1:15 | S4 | **Calculus, slope:** my pencil sketch of the slope; I drag the tangent along the curve and the true slope inks over my sketch; the card **"Slope = height of the curve"**. | "Calculus. I sketch how steep the curve is, then drag the tangent. My sketch copied the curve's height. At the top of the hill the slope is zero." | Slope = height of the curve |
| 1:15-1:27 | S5 | **Calculus, area:** one rectangle says **7.5**; the slider runs 1 → 200 rectangles and the sum settles at **4.57**. | "One rectangle says seven and a half. Thinner and thinner, it lands on exactly four point five seven." | 7.5 → 4.57 |
| 1:27-1:40 | S6 | **Typed topic:** type "derivative of x squared", Go; the visual builds (real wait, cut to ~3 s); drag the tangent to x = 3, slope **6**. | "Any topic. The AI builds the simulation, code guarantees the truth, and you do the thinking." | the AI builds it · code checks it |
| 1:40-1:47 | S7 | **Honest no-fit:** type "the French Revolution"; the plain message and the nearest checked topics. | "When it can't draw something honestly, it says so." | no fake charts |
| 1:47-1:55 | T3 | End card: Onionskin, URL, headline, "SwampHacks XII · Entertainment & Creative Technology". | "Onionskin. See your thinking in layers." | **Onionskin** · See your thinking in layers. |

**Voiceover word count: 173 words** (counted by script over the VO column), about 1:20 at ~130 wpm, leaving room for drags and the mechanism with no talking. Cap 250.

## Notes
- **If orgo (#204) isn't merged at record time:** cut S1-S3 (47 s). Put calculus first and give it the room: S4 slope sketch → tangent (25 s), S5 area (15 s), plus the position-vs-velocity compare "one undoes the other" (10 s); then the birthday session as one 12 s shot ("23 people: 50.7%"). Still under 2:00. Don't mention chemistry in the VO.
- **Numbers (all computed):** C₂H₆O; FC = 6 − 2 − 3 = +1 ([formal charge](https://en.wikipedia.org/wiki/Formal_charge)); SN2 backside attack with inversion ([SN2](https://en.wikipedia.org/wiki/SN2_reaction), [Walden inversion](https://en.wikipedia.org/wiki/Walden_inversion)); calculus curve f(x) = (x³ − 6x² + 9x)/2 + 1, hill at x = 1 (slope 0), one left rectangle on [1, 3.5] = 3 × 2.5 = 7.5, exact area F(3.5) − F(1) = 4.5703, 200 left rectangles = 4.58 (`web/src/sessions/calculus/math.ts`); derivative of x² at x = 3 = 6. If S4's sketch doesn't trigger "Slope = height of the curve", re-take with a sketch that copies the curve's shape, or swap the caption for the mistake actually shown.
- **S6 live build:** "derivative of x squared" built in ~4 s on the Vultr API (Sat Oct 17 ~4:10 PM, one run). Record the real build; cut the wait down but don't fake the result. If it comes from the pre-built set (#206), show the "hand-checked" label instead of "auto-checked".
- **S7 no-fit:** the French Revolution came back as an honest no-fit in our trial (PR #187, run 3). Check it on the live API before recording; if it now builds, use gibberish ("asdf qwer"), which is refused before any model call.
- **No betting language** on screen or in the VO: no "bet", "lock it in", "called it", confidence picker or XP.
- **T1 hook:** a short drawn animation (two layered SVG frames) or a real tracing-paper shot. No stock footage with a brand on it.
- **End card URL:** onionskin.study only once it points at the site; until then `alexander-freedman.github.io/Swamphacks26-DSI`.
- **Cut to 1:30 if needed:** drop S2 and S7.
