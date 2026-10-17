# Demo script: the 3:00 table demo (orgo + calculus)

What the judge sees and does, click by click. **Team decision Sat ~6:05 PM:** the demo is the **orgo showcase** (PR #204: build a molecule, then push the electrons) and the **calculus level** (merged, PR #202, `?session=calculus`). Supporting beats: a typed topic becoming a runnable visual (engine v4, PR #187), the three probability sessions as "there's more", and the notebook. The words are in [docs/pitch.md](pitch.md); this file wins for what's on screen.

Name: **Onionskin**. Headline **"See your thinking in layers."** Subline **"Type any topic. Watch it come alive."** Live at https://alexander-freedman.github.io/Swamphacks26-DSI/, API on Vultr at https://45-77-118-201.sslip.io.

**Roles:** **narrator** talks and keeps time. **Driver** runs the laptop (or hands the trackpad / phone to the judge) and takes the technical questions. Both of us learn both roles.

## The story, said over the first screen
**Chatbot line:** **"ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why."**
**AI story:** **the AI builds the simulation; code guarantees the truth; you do the thinking.** Honest scope: the orgo and calculus levels (and the three probability sessions) are hand-built; the AI builds the simulation for a topic you *type*. No betting language anywhere (no "bet", "lock it in", "called it").

## Confirm before each judging block
- [ ] **Orgo (#204) merged and deployed** → the script runs as written, orgo first. **Not merged:** run "calculus first" (fallbacks). Every orgo beat in this file is **[if #204 merged]**.
- [ ] Calculus opens at `?session=calculus` and shows **7.5** for one rectangle and **4.57** exact.
- [ ] `https://45-77-118-201.sslip.io/api/health` → `{"status":"ok"}` and the backend dot in How it works is green. **Red:** skip the typed-topic beat.
- [ ] "derivative of x squared" builds on the live API (or is in the pre-built set, #206). If it takes over ~10 s in the check, use a pre-built chip at the table.
- [ ] Reset: `Shift+R` on Home or open with `?reset=1` (clears answers and notebook, no confirm).

## Every number on screen or out loud comes from this table

| Claim | Value | Source |
|---|---|---|
| Ethanol's formula | **C₂H₆O** (2 C, 6 H, 1 O) | standard; on screen as "target: ethanol"; `web/src/sessions/orgo/BuildStep.tsx` (#204) |
| Same formula, different molecule | dimethyl ether is also C₂H₆O (C–O–C vs ethanol's C–C–O–H) | isomer check in `chem.ts` (#204); [Dimethyl ether](https://en.wikipedia.org/wiki/Dimethyl_ether) |
| Bonds per atom | C 4, H 1, O 2, N 3, Br 1 | `chem.ts` valence table (#204) |
| Oxygen with 3 bonds | **FC = 6 − 2 − 3 = +1** (O⁺) | formal charge = valence − nonbonding electrons − bonds ([Formal charge](https://en.wikipedia.org/wiki/Formal_charge)); on-screen line in `chem.ts` |
| Cyanide's charge sits on carbon | C: 4 − 2 − 3 = **−1**; N: 5 − 2 − 3 = 0 | computed, same rule; cyanide attacks through C to give nitriles ([Kolbe nitrile synthesis](https://en.wikipedia.org/wiki/Kolbe_nitrile_synthesis)) |
| SN2 | HO⁻ + CH₃Br → CH₃OH + Br⁻; one step, backside attack, inversion; Br⁻ leaves with 4 lone pairs | [SN2 reaction](https://en.wikipedia.org/wiki/SN2_reaction), [Walden inversion](https://en.wikipedia.org/wiki/Walden_inversion); scene in `sn2.ts` (#204) |
| Calculus curve | f(x) = (x³ − 6x² + 9x)/2 + 1; hill at x = 1 (height **3**, slope 0), valley at x = 3; steepest downhill slope **−1.5** at x = 2 | computed: f′(x) = 1.5(x − 1)(x − 3); `web/src/sessions/calculus/math.ts` |
| Area guess, one rectangle | **7.5** | computed: left edge, f(1) × 2.5 = 3 × 2.5 |
| Exact area from 1 to 3.5 | **4.57** (4.5703) | computed: F(x) = x⁴/8 − x³ + 9x²/4 + x, F(3.5) − F(1) = 585/128 |
| Rectangles, left edges | 1 → 7.50, 10 → 4.78, 50 → 4.61, **200 → 4.58** | computed (Riemann sums, same formula as `riemann()` in math.ts) |
| Area mistake trigger | a guess ≥ 7.25 is named "More rectangles = more area"; within 15% (3.88-5.26) counts as close | `readArea()` in math.ts |
| Typed topic: derivative of x² at x = 3 | **6** | computed: 2x at x = 3. Use the number the screen shows (the engine picks the point) |
| "derivative of x squared" build time | ~**4 s** on Vultr, **one run** (Sat Oct 17 ~4:10 PM) | docs/submission/video-script.md notes. Engine v4 local trial: median 6.0 s, 10/15 built (PR #187). **Don't promise "seconds" out loud** |
| Birthday (only if asked for "more") | 23 people → **50.7%** | computed: 1 − ∏(365−i)/365, i = 0..22 = 0.5073 |

Never say: "proven to make you learn faster", "permanently fixes misconceptions", or that every typed topic builds live.

## The 3:00 script

| Time | Judge sees / does | Narrator says | Driver clicks |
|---|---|---|---|
| **0:00**<br>Hook | Home: **Onionskin · See your thinking in layers.** Driver opens **Push the electrons** (orgo card). Step 1 "Build ethanol": empty paper, atom palette (C, H, O, N, Br), "target: ethanol **C₂H₆O**". | "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why. Here's organic chemistry. Build me ethanol, C₂H₆O." | Hands the trackpad / phone to the judge. |
| **0:15**<br>Build, one mistake named live *[if #204 merged]* | **Judge drags atoms** onto the paper and bonds them. **Deliberate mistake:** a 5th bond on a carbon. Its valence ring turns red and **"A carbon with 5 bonds"** shows live: "Carbon has 4 slots. A 5th bond has no electrons to use." | "Each atom has slots. Watch what happens if I give a carbon one bond too many." … "It names the mistake as I make it." | If the judge is building cleanly, the driver adds the 5th bond, then drags it off and lets the judge finish. |
| **0:40**<br>Check it | Judge taps **Check it**. Clean: ethanol ✓. Built C–O–C: **"Same formula, different molecule"**, their dimethyl ether in pencil next to ethanol's C–C–O–H in ink. Oxygen with 3 bonds: **"Oxygen with 3 bonds, no charge"**, "FC = 6 − 2 − 3 = +1". | Clean: "Same atoms can make a different molecule, and it would tell you." Ether: "Same atoms, joined differently: that's dimethyl ether." | Taps **Push the electrons →**. |
| **0:55**<br>Push the electrons *[if #204 merged]* | Step 2: **HO⁻ + CH₃Br**. **Judge drags two arrows** in pencil (lone pair on O → carbon; C–Br bond → Br). Taps **Show me**: the real arrows ink over theirs, then the mechanism plays. | "Now the part everyone memorizes and nobody sees. Draw where the electrons go. Arrows start at electrons." | If the judge stalls, draws one arrow from the front side to get **"Front-side attack"**: "Br blocks the front. HO⁻ comes in from the back, opposite Br." |
| **1:20**<br>Scrub the mechanism | **Scrubber**: halfway, O–C forming and C–Br breaking, the H's flat; after, **CH₃OH + Br⁻**, the H's flipped. | "Pencil is you, ink is reality. Halfway, one bond forming, one breaking. Br leaves with the bond's two electrons, and the carbon turns inside out like an umbrella." | Drags the scrubber 0 → 50 → 100 → 50. |
| **1:35**<br>Same pattern (short) | Step 3: **N≡C⁻ + CH₃I**, tap nucleophile / carbon / leaving group in both. Tap nitrogen: **"Nitrogen as cyanide's attacker"** (the − sits on carbon). **Run both** animates the two on one slider. | "A new reaction. Same three parts. Most people pick the nitrogen: the charge is actually on carbon." | Taps **Run both**. Skip if behind time. |
| **1:50**<br>Calculus | `?session=calculus`, "Slopes and areas". **Judge pencils the slope** in the bottom box. Next: **drag the tangent** along the curve; the true slope inks over the sketch. | "Calculus, same idea. Draw how steep this curve is. … Now drag the tangent. The real slope draws itself over your pencil." | If their sketch copied the curve, the named mistake later is **"Slope = height of the curve"**: the hilltop is high (3), but its tangent is flat. |
| **2:15**<br>Area | "One rectangle says **7.5** squares." **Judge drags a guess.** Then the rectangles slider **1 → 200**: the sum closes in on **4.57**. Mistake card if named; compare (position vs velocity): "One undoes the other." | "Guess the area. … Now thinner rectangles: 7.5, 4.8, 4.6, and it lands on the exact 4.57. Code computed every number." | Drags the slider slowly to 200. Taps through the mistake card fast. |
| **2:35**<br>Any topic, 10 s | Home → **Try any topic** → types **"derivative of x squared"** → a draggable tangent opens (truth computed in code; at x = 3 it's 6). | "Type any topic. Watch it come alive. The AI builds the simulation; code guarantees the truth; you do the thinking. If nothing fits, it says so instead of faking a chart." | Backend dot red or build slow: skip and say the AI line over Home. |
| **2:50**<br>Close | **Notebook**: the judge's caught mistakes in pencil ("A carbon with 5 bonds", …). | "Every wrong idea you had is in your notebook, and it comes back with new numbers. There's more: three probability sessions. Onionskin. See your thinking in layers." | **Stop talking. Hand over for questions.** |

**If the judge is fast:** open the birthday session as "more": guess, fill the room to 23 (50.7%).
**If the judge is slow:** skip step 3 (Same pattern) and the calculus compare. **Never cut** the live-named orgo mistake, the scrubber, or the tangent.

## The 90-second version (rushed judge)
| Time | What happens |
|---|---|
| 0:00 | Chatbot line. Orgo step 1: judge drags atoms; driver forces a 5th bond → "A carbon with 5 bonds" named live. |
| 0:25 | Step 2: two arrows, **Show me**, scrub halfway → after. "Backside attack; the carbon inverts." |
| 0:50 | Calculus: drag the tangent over the pencil sketch; rectangles 1 → 200, 7.5 → 4.57. |
| 1:15 | AI line over Home: "Type any topic: the AI builds the simulation, code guarantees the truth, you do the thinking." Stop at 1:30. |

## Fallbacks (driver decides, no discussion at the table)
| Breaks | Do this | Say |
|---|---|---|
| **Orgo not merged / not deployed** | **Calculus first:** open on calculus (slope sketch → tangent → area → mistake card → compare), ~1:30; then any topic; then the birthday session as "more"; close on the notebook | "Here's calculus." Never mention orgo as live |
| A drag doesn't take on the trackpad | Orgo: palette buttons add an atom (bonded to the picked atom); arrows have "Draw with lists". Calculus: use the phone | "Let me drive this one." |
| Judge builds something odd and gets stuck | Drag atoms off the paper to remove; or reload `?session=orgo` | "Start from one carbon." |
| **Backend down** (dot red, health fails) | **Skip the typed-topic beat.** Orgo, calculus and the probability sessions compute in the browser and need no API | AI line over Home only |
| Typed topic slow (> ~10 s) or a no-fit | Tap a pre-built chip (#206 if merged). A no-fit is a feature: read the line | "It won't fake a chart when nothing fits." |
| Venue wifi dies | Local `vite preview` build, opened before the expo | (nothing; it just works) |
| Laptop dies | Backup video, downloaded on the phone | "Here's the 2-minute cut." |

Never show a raw error or a spinner.

## Likely judge questions (short form; full set in [pitch.md](pitch.md) §3)
1. **"Is the chemistry right?"** "The rules are in code, not in a model: formal charge is valence minus nonbonding electrons minus bonds, so oxygen with three bonds is 6 − 2 − 3 = +1. SN2 is one step with backside attack, so the carbon inverts; the scrubber shows the H's flip. Cyanide attacks through carbon because that's where the minus charge is."
2. **"How is the derivative checked?"** "The curve's derivative is written in closed form, f′(x) = 1.5(x − 1)(x − 3), and the area is F(3.5) − F(1) = 4.57; unit tests check them against a numeric derivative and Riemann sums (`math.test.ts`). For typed topics the model picks the curve and code computes the slope."
3. **"How is this different from a chatbot?"** The chatbot line, then: "you predict, it runs on top of your guess, and your wrong idea gets named."
4. **"Doesn't the AI hallucinate?"** "The showcase levels have no model in them. For a typed topic the model fills a spec and code computes the truth; if nothing fits, it says so."

## Rehearsal checklist
- Run the 3:00 and the 90-second versions 3 times each, both of us solo, with a stopwatch.
- Once on the phone (finger drags), once on the trackpad.
- Once with the "calculus first" fallback (as if #204 weren't live).
- Once with the backend unplugged (skip typed topic).
- Check every number said out loud against the table above.
