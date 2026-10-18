# Demo script: the 3:00 table demo (orgo + calculus)

What the judge sees and does, click by click, matched to the live site (main @ 6f52ea9, walked at 1440×900 on Sat Oct 17). Spine: **Organic chemistry** (build ethanol, then SN2 step by step) and **Calculus** (Calc 1 slope, then area). The words are in [docs/pitch.md](pitch.md); this file wins for what's on screen.

Name: **Onionskin**. Headline **"See your thinking in layers."** Subline **"Type any topic. Watch it come alive."** Live at https://alexander-freedman.github.io/Swamphacks26-DSI/, API on Vultr at https://45-77-118-201.sslip.io.

**Roles:** **narrator** talks and keeps time. **Driver** runs the laptop (or hands the trackpad / phone to the judge) and takes the technical questions. Both of us learn both roles.

## The story, said over the first screen
**Chatbot line:** **"ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why."**
**AI story:** **the AI builds the simulation; code guarantees the truth; you do the thinking.** Honest scope: the orgo and calculus levels are hand-built and compute everything in the browser. A typed topic currently plays as a number slider in the round player, not yet a draggable curve, so the demo doesn't lean on it. No betting language anywhere (no "bet", "lock it in", "called it").

## Confirm before each judging block
- [ ] Home shows two cards, **Organic chemistry** and **Calculus**, plus the topic box. (The first click right after load can be ignored while the page settles: wait a second after Home appears.)
- [ ] **Organic chemistry** opens straight on **Build ethanol** ("1 of 2"), no menu (#253). Step 2 is the SN2 arrows + scrubber.
- [ ] **Calculus** opens straight on **Draw the slope.** ("1 of 4": sketch → tangent → area → card), no menu (#253); one rectangle shows **7.5**, exact **4.57**.
- [ ] Reset before each judge: open with `?reset=1` or `Shift+R` on Home (clears answers and notebook).
- [ ] #218 (SN2 vs E2) *if merged*: only then may the narrator mention it; otherwise SN2 is the mechanism we show.

## Every number on screen or out loud comes from this table

| Claim | Value | Source |
|---|---|---|
| Ethanol's formula | **C₂H₆O** (2 C, 6 H, 1 O) | standard; on screen as "target: ethanol"; `web/src/sessions/orgo/BuildStep.tsx`  |
| Same formula, different molecule | dimethyl ether is also C₂H₆O (C–O–C vs ethanol's C–C–O–H) | isomer check in `chem.ts` ; [Dimethyl ether](https://en.wikipedia.org/wiki/Dimethyl_ether) |
| Bonds per atom | C 4, H 1, O 2, N 3, Br 1 | `chem.ts` valence table  |
| Oxygen with 3 bonds | **FC = 6 − 2 − 3 = +1** (O⁺) | formal charge = valence − nonbonding electrons − bonds ([Formal charge](https://en.wikipedia.org/wiki/Formal_charge)); on-screen line in `chem.ts` |
| Cyanide's charge sits on carbon | C: 4 − 2 − 3 = **−1**; N: 5 − 2 − 3 = 0 | computed, same rule; cyanide attacks through C to give nitriles ([Kolbe nitrile synthesis](https://en.wikipedia.org/wiki/Kolbe_nitrile_synthesis)) |
| SN2 | HO⁻ + CH₃Br → CH₃OH + Br⁻; one step, backside attack, inversion; Br⁻ leaves with 4 lone pairs | [SN2 reaction](https://en.wikipedia.org/wiki/SN2_reaction), [Walden inversion](https://en.wikipedia.org/wiki/Walden_inversion); scene in `sn2.ts`  |
| Calculus curve | f(x) = (x³ − 6x² + 9x)/2 + 1; hill at x = 1 (height **3**, slope 0), valley at x = 3; steepest downhill slope **−1.5** at x = 2 | computed: f′(x) = 1.5(x − 1)(x − 3); `web/src/sessions/calculus/math.ts` |
| Area guess, one rectangle | **7.5** | computed: left edge, f(1) × 2.5 = 3 × 2.5 |
| Exact area from 1 to 3.5 | **4.57** (4.5703) | computed: F(x) = x⁴/8 − x³ + 9x²/4 + x, F(3.5) − F(1) = 585/128 |
| Rectangles, left edges | 1 → 7.50, 10 → 4.78, 50 → 4.61, **200 → 4.58** | computed (Riemann sums, same formula as `riemann()` in math.ts) |
| Area mistake trigger | a guess ≥ 7.25 is named "More rectangles = more area"; within 15% (3.88-5.26) counts as close | `readArea()` in math.ts |

Never say: "proven to make you learn faster", "permanently fixes misconceptions", or that a typed topic becomes a draggable curve.

## The 3:00 script
Timings are rough, from walking the live site at 1440×900 with a real person's pace added.

| Time | Judge sees / does | Narrator says | Driver clicks |
|---|---|---|---|
| **0:00**<br>Hook | Home: **Onionskin · See your thinking in layers.** Two cards: **Organic chemistry**, **Calculus**. | "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why." | Taps **Organic chemistry**. |
| **0:10**<br>Straight in | **Build ethanol, 1 of 2**: no menu, the first screen is already interactive. | "No menu. You're building a molecule in one tap." | Hands over the trackpad. |
| **0:15**<br>Build, one mistake named live | Empty paper, palette **C H O N Br**, **↶ Undo**, **Clear**, "target: ethanol C₂H₆O". Judge drags atoms on and bonds them. **Deliberate mistake:** a 5th bond on a carbon → **"A carbon with 5 bonds"** shows under the formula right away. | "Ethanol, C₂H₆O. Each atom has slots: carbon four, oxygen two, hydrogen one. Watch what happens with one bond too many." … "It names the mistake as I make it." | If the judge builds cleanly, the driver drags one extra H onto a full carbon. |
| **0:35**<br>Undo → Finish ✓ | **↶ Undo** takes the 5th bond back. Judge fills the last H's, taps **Check it** → "Correct!", **✓ ethanol CH₃–CH₂–OH**, then the next button → step 2. | "Undo, finish it … and it checks the actual structure, not just the count." | Taps **Show how the electrons move →**. |
| **0:55**<br>2 of 2: Draw the arrows | HO⁻ + CH₃Br. The judge drags two curved arrows (lone pair on O → carbon; C–Br bond → Br), then **Show me**: the real arrows ink over theirs and the reaction plays: **CH₃OH + Br⁻**. Drag the scrubber back and forth to replay it. | "Draw where the electrons go. Arrows start on electrons. … Pencil is you, ink is reality: in from the back, bromide leaves with the bond's two electrons." | Drag stalls: **Draw with lists**. |
| **1:30**<br>Calculus: slope | Home → **Calculus** opens straight on **Draw the slope.** Judge pencils the slope, then **Check it with a tangent** and drags the tangent along the curve; the true slope inks over the sketch. | "Calculus, same idea. Draw how steep this curve is. Now drag the tangent: the real slope draws itself over your pencil. The top of the hill is high, but it's flat there: slope zero." | Sketch copied the curve's height → the named mistake is **"Slope = height of the curve"**. |
| **2:10**<br>Calculus: area | Next screen (3 of 4): guess the area; one rectangle says **7.5**; **Fill it with rectangles**, slider **1 → 200**; the sum settles on **4.57**. | "Guess the area. One rectangle says 7.5. Thinner and thinner: 4.8, 4.6, and it lands on 4.57. Code computes every number." | Drags the slider slowly. |
| **2:40**<br>Close | 4 of 4: the card names what the pencil got wrong, saved to the notebook. | "Every wrong idea goes in your notebook. Onionskin. See your thinking in layers." | **Stop talking. Hand over for questions.** |

**Typed topics:** a typed topic plays as a number slider in the round player, not a draggable curve yet, and the live behaviour of "derivative of x squared" wasn't confirmed in the last walk. So the 3:00 doesn't type a topic. If a judge asks, tap a **hand-checked** chip (e.g. **Exponential doubling**) and say "type any topic and it builds a small model you can run; the numbers are computed in code".
**If the judge is fast:** go back to Home and type a topic (Learn session, docs/learn-plan.md) once it's live.
**If the judge is slow:** skip the area guess (go straight to rectangles). **Never cut** the live-named 5th bond, the arrows, or the tangent.

## The 90-second version (rushed judge)
| Time | What happens |
|---|---|
| 0:00 | Chatbot line. **Organic chemistry → Build ethanol**: driver forces a 5th bond → "A carbon with 5 bonds" named live → **↶ Undo** → **Check it** → **Finish ✓**. |
| 0:30 | Step 2: two arrows, **Show me**, scrub the reaction. |
| 1:00 | **Calculus**: sketch, drag the tangent over it. If time: next screen, rectangles 1 → 200, 7.5 → 4.57. |
| 1:25 | "Onionskin. See your thinking in layers." Stop at 1:30. |

## Fallbacks (driver decides, no discussion at the table)
| Breaks | Do this | Say |
|---|---|---|
| A drag doesn't take on the trackpad | Orgo build: click a palette letter to add an atom bonded to the picked one; arrows: **Draw with lists**. Calculus: use the phone | "Let me drive this one." |
| Judge builds something odd | **↶ Undo** (or Ctrl+Z) step by step, or **Clear** | "Start from one carbon." |
| Judge picks the wrong mechanism on the chart | Let it play: the reason line explains the square; pick again | "That's the point: it tells you why." |
| Page stuck or odd state | Reload with `?session=orgo` or `?session=calculus` | (nothing) |
| Backend down (dot red) | Nothing changes: orgo and calculus run fully in the browser | — |
| Venue wifi dies | Local `vite preview` build, opened before the expo | (nothing) |
| Laptop dies | Backup video, downloaded on the phone | "Here's the 2-minute cut." |

Never show a raw error or a spinner.

## Likely judge questions (short form; full set in [pitch.md](pitch.md) §3)
1. **"Is the chemistry right?"** "The rules are in code, not in a model: formal charge is valence minus nonbonding electrons minus bonds, so oxygen with three bonds is 6 − 2 − 3 = +1. SN2 is one step with backside attack, so the carbon inverts. Cyanide attacks through carbon because that's where the minus charge is."
2. **"How is the derivative checked?"** "The curve's derivative is written in closed form, f′(x) = 1.5(x − 1)(x − 3), and the area is F(3.5) − F(1) = 4.57; unit tests check them against a numeric derivative and Riemann sums (`math.test.ts`). For typed topics the model picks the curve and code computes the slope."
3. **"How is this different from a chatbot?"** The chatbot line, then: "you predict, it runs on top of your guess, and your wrong idea gets named."
4. **"Doesn't the AI hallucinate?"** "The showcase levels have no model in them. For a typed topic the model fills a spec and code computes the truth; if nothing fits, it says so."

## Rehearsal checklist
- Run the 3:00 and the 90-second versions 3 times each, both of us solo, with a stopwatch.
- Once on the phone (finger drags), once on the trackpad.
- Once with **Draw with lists** instead of dragging arrows.
- Check every number said out loud against the table above.
