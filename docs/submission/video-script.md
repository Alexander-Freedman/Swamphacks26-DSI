# Onionskin: 2-minute video script

**Status:** rewritten Sat Oct 17 evening to match the live site (main @ 6f52ea9): **Organic chemistry and Calculus are the spine.** Headline "See your thinking in layers.", subline "Type any topic. Watch it come alive.", no betting language. Matches [devpost.md](devpost.md) and [docs/demo-script.md](../demo-script.md). **Hard limit 2:00** ([XII rules](https://swamphacks-xii.devpost.com/rules)); this cut runs about 1:55. Screen recording of the real app at 1080p, no mockups. Burned-in captions = the voiceover (judges often watch muted). Production steps: docs/expo-video.md.

**Shots:** S = screen recording, T = title card. Flow: onion-skin hook → Home → Build ethanol with a named mistake → SN2 step by step to the arrows → calculus slope → area → close.

| Time | Shot | Screen | Voiceover (caption = same text) | On-screen text |
|---|---|---|---|---|
| 0:00-0:07 | T1 | An animator's onion skin: a faint pencil frame under a crisp ink frame, the ink drawing in on top. | "Animators draw on onion skin. The last frame stays faint under the new one, so you see exactly what changed." | — |
| 0:07-0:13 | T2 | Title card over Home: the **Organic chemistry** and **Calculus** cards. | "This is Onionskin. Pick a subject and work it out, step by step." | **Onionskin** · See your thinking in layers. |
| 0:13-0:35 | S1 | **Organic chemistry → Build ethanol:** atoms dragged on, bonds snapping; a 5th bond on a carbon and **"A carbon with 5 bonds"** appears; **↶ Undo**; **Check it** → ✓ ethanol; **Finish ✓**. | "Organic chemistry. Build ethanol, atom by atom. Give a carbon a fifth bond, and it names the mistake while you make it. Undo, finish, and it checks the real structure." | target: C₂H₆O |
| 0:35-1:05 | S2 | **SN2:** tap the three parts in HO⁻ + CH₃Br; Strong / Methyl / Good; the chart, pick **SN2**; draw two arrows, **Show me**: the real arrows ink over mine, **CH₃OH + Br⁻**. | "Then a mechanism, the way you'd work it on an exam. Find the parts. Size them up. Pick it off the chart. Then draw where the electrons go: my arrows in pencil, the real ones in ink." | find → size up → pick → draw |
| 1:05-1:25 | S3 | **Calculus → The slope of a curve:** my pencil sketch; **Check it with a tangent**; I drag the tangent and the true slope inks over my sketch. | "Calculus. I sketch how steep the curve is, then drag the tangent. At the top of the hill the slope is zero, even though the curve is high." | pencil = you · ink = reality |
| 1:25-1:42 | S4 | **Area under a curve:** one rectangle says **7.5**; the slider runs 1 → 200 rectangles and the sum settles at **4.57**. | "One rectangle says seven and a half. Thinner and thinner, it lands on four point five seven." | 7.5 → 4.57 |
| 1:42-1:48 | S5 | The Calculus menu: Calc 1, 2, 3; a quick turn of the Calc 3 surface. | "Three courses of calculus, one step at a time." | — |
| 1:48-1:55 | T3 | End card: Onionskin, URL, headline, "SwampHacks XII · Entertainment & Creative Technology". | "Onionskin. See your thinking in layers." | **Onionskin** · See your thinking in layers. |

**Voiceover word count: 160 words** (counted by script over the VO column), well under the 250 cap at ~130 wpm, leaving room for drags with no talking.

## Notes
- **Numbers (all computed):** C₂H₆O; SN2 one step, backside attack ([SN2](https://en.wikipedia.org/wiki/SN2_reaction)); calculus curve f(x) = (x³ − 6x² + 9x)/2 + 1, hill at x = 1 (slope 0), one left rectangle on [1, 3.5] = 3 × 2.5 = 7.5, exact area F(3.5) − F(1) = 4.5703, 200 left rectangles = 4.58 (`web/src/sessions/calculus/math.ts`).
- **No typed topic in this cut.** A typed topic plays as a number slider in the round player today, not a draggable curve; show it only once that's live and checked.
- **#218 (SN2 vs E2), if merged:** can replace S5 with a 6-s shot of E2 on the chart.
- **No betting language** on screen or in the VO: no "bet", "lock it in", "called it", confidence picker or XP.
- **T1 hook:** a short drawn animation (two layered SVG frames) or a real tracing-paper shot. No stock footage with a brand on it.
- **End card URL:** onionskin.study only once it points at the site; until then `alexander-freedman.github.io/Swamphacks26-DSI`.
- **Cut to 1:30 if needed:** drop S5 and shorten S2 to the arrows only.
