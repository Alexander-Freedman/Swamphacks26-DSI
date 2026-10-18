# Scorecard: the current demo vs the XII rubric

**Mode: BUILD.** This grades the demo **as a judge would see it right now**, not the plan. The demo is **orgo + calculus** (team decision Sat ~6:05 PM, NOTES.md); the script it's graded against is docs/demo-script.md on branch `alexander-freedman/demo-orgo-calc` (PR #212, not merged yet). Re-grade after every merge that changes what a judge sees.

Scores are 1-5 gut calls against the 7 official Devpost criteria plus track fit. They're not data.

**Last graded:** Sat Oct 17, ~7:50 PM, against the **live** site (https://alexander-freedman.github.io/Swamphacks26-DSI/), main at 6f52ea9 (calc chapters #221, orgo topics menu #219, Home cards #214/#205), API https://45-77-118-201.sslip.io (`/api/health` → `{"status":"ok"}`). Played with Playwright at 1440x900 and 390x844: Home, orgo menu → Build ethanol (6 taps on "add carbon" chain-bond into C6, Undo works), orgo SN2, calculus menu → The slope of a curve (sketch → drag tangent → x = 1, 2, 4 give 0.00 / -1.50 / 4.50, gap shaded), Area under a curve (opens on "One rectangle says 7.5 squares"), Slices of a surface (3D surface turns, question 1 of 2), typed topic "derivative of x squared". 0 console errors on every screen. Screenshots in `~/qa/ev1/`, `~/qa/ev2/` (local, not in the repo).

## What a judge sees right now (honest)
- **Home:** "See your thinking in layers. / Type any topic. Watch it come alive." Two illustrated cards (**Organic chemistry**, **Calculus**), a **Try any topic** box with an *auto-checked* tag and 4 hand-checked chips (+6 more), a Notebook card, "backend online" dot. Clean on desktop and phone. The three probability sessions are no longer on Home (still reachable by `?session=` and the topic box).
- **Orgo (`?session=orgo`):** a topic menu, not a session: Molecules (Build ethanol), Mechanisms (SN2, SN1, E2, E1), Guided path (Start to finish). Build ethanol: palette tap or drag adds atoms, tapping again bonds to the picked atom, live formula ("C6" vs target C₂H₆O), Undo / Clear. SN2 opens on "Find the parts" (1 of 4: tap nucleophile / substrate / leaving group), then size up, pick, arrows. SN1/E2/E1 step-by-step is PR #223, SN2 vs E2 side by side is #218, both open.
- **Calculus (`?session=calculus`):** Calc 1/2/3 course menu. Live: The slope of a curve, Area under a curve, Slope and area undo each other, Slices of a surface (3D), Start to finish. Everything else is a dashed "COMING NEXT" card (limits, chain rule, max/min, related rates, all of Calc 2...). On phone the first card a judge sees is a COMING NEXT one.
- **Slope topic** is the best screen in the product: pencil sketch of the slope, drag the tangent, the real slope inks over the dashed pencil with the gap in yellow, "Top of the hill, bottom of the valley: slope 0. Your pencil said 2.0 at the hilltop."
- **Typed topic:** "derivative of x squared" built on the live API and played as "How steep is the curve y = x^2 exactly at the point where x = 3?" with a **plain 0-12 number slider**, not a curve or a draggable tangent. So the "any topic → a visual" promise shows as a one-number guess for this topic.
- **Sponsors:** Vultr backend live (sslip.io, not a custom domain); Gemini behind typed topics + Ask panel; Tiger answer events are written but nothing on screen shows them; no domain.
- **Submission:** AI-tools disclosure in docs/devpost-draft.md is still a placeholder. docs/user-testing.md has the kit but **no results rows** (no tester quotes yet).

## Grades

| Criterion | Before (11:15 AM) | Now | Evidence (what a judge sees) | Single biggest gap |
|---|---|---|---|---|
| **Technical Understanding** | 4 | **4** | Chemistry rules in code (valence slots, live formula), closed-form slope with tested numbers (0 / -1.5 / 4.5 at x = 1, 2, 4), a real 3D surface, a live typed-topic engine with an honest no-fit path. | The engine's best output (curve/sampler) doesn't show for the demo topic: "derivative of x squared" is a number slider. |
| **Innovation & Creativity** | 4 | **4** | "Pencil vs ink" now spans chemistry and calculus: your sketch under the real slope, the gap shaded; build a molecule and get mistakes named live. | A visual "aha" in orgo that's as strong as the tangent screen (the arrows/scrubber is behind 1-3 taps of menus). |
| **Functionality** | 4 | **4** | Every live topic I opened works on desktop and phone, 0 errors, backend healthy, typed topic built inside 15 s. | Lots of COMING NEXT cards and open PRs (#218, #223, #225) make the menus look half-built; menu → topic adds clicks the script doesn't have. |
| **Design & Usability** | 4 | **4** | New Home with illustrated cards is the cleanest it's been; slope and 3D screens are polished on phone. | Calc menu on phone opens on a disabled "What a limit is" card; hide COMING NEXT or collapse it. |
| **Purpose & Audience** | 3 | **3** | Real student subjects (orgo, Calc 1-3) with named mistakes and a notebook is a clearer audience than the probability puzzles. Still zero user-test evidence. | Run round 1 on orgo + slope: 3-5 people, 2 quotable lines. |
| **Track & Challenge Relevance** (Entertainment & Creative Tech) | 4 | **4** | Toy feel: snap atoms, drag a tangent, spin a surface. | Orgo's toy moment (scrub the mechanism) should be one tap from Home. |
| **Sponsor Challenge Criteria** | 2 | **3** | Vultr: backend deployed and the dot says "backend online". Gemini: typed topics build live. Easy On The Eyes: solid. Tiger: invisible. Domain: none. | Show one thing Tiger powers (e.g. "N people missed this" on a mistake card), and a real domain if free. |
| **Track fit (prize odds)** | 4 | **4** | Any Home card a judge taps opens something to manipulate (after one menu tap). | Same as Purpose. |

**Total now: 26 / 35** (7 criteria, track fit not counted; up from 25: Sponsor +1 for the live Vultr backend and Gemini typed topics). Target at freeze: 30+. Cheapest path: demo script matched to the menus (+protects Functionality live), typed topic → visual for the demo topic (+0.5 Tech, +0.5 Innov), user test (+1 Purpose), hide COMING NEXT (+0.5 Design), Tiger visible (+0.5 Sponsor).

## Top 5 gaps, in order
| # | Gap | Owner | Cheapest fix | Est. points |
|---|---|---|---|---|
| 1 | **Demo script doesn't match the live click path.** Home → Orgo and Home → Calculus now open menus; Build ethanol is "1 of 1" (no "Push the electrons →"); SN2 starts at "Find the parts"; area is a separate topic (no "Now the area" button). | me (PR #212 script) | Rewrite the script on the menus: Orgo → **Start to finish** (or Build ethanol, then back → SN2), Calculus → **Start to finish** or slope then area; re-time with a stopwatch. | Protects Functionality and every live score |
| 2 | **Typed demo topic isn't visual.** "derivative of x squared" plays as a 0-12 number slider. | me (engine v4, prebuilt #206) | Make the derivative/tangent family pick the curve kind (or pin a hand-checked curve item for this phrase in the prebuilt set, #206) and verify it live; else change the script to a chip that's known to render a curve. | +0.5 Tech, +0.5 Innov |
| 3 | **No user-test evidence.** Purpose stuck at 3. | me (kit in docs/user-testing.md), both run it | 3-5 people tonight on orgo Build ethanol + calc slope; log rows + 2 quotes into the pitch and Devpost. | +1 Purpose, +0.5 Track fit |
| 4 | **Menus look half-built.** Calc 1/2/3 is mostly dashed COMING NEXT; on phone the first card is disabled. | @luanamaldaner (calculus/orgo UI) | Hide COMING NEXT cards (or collapse into one "more coming" line) and put the live topics first; land #218/#223/#225 or keep them out of the demo. | +0.5 Design, +0.5 Func |
| 5 | **Submission honesty + invisible sponsors.** AI-tools disclosure is a placeholder; Tiger shows nothing; no domain. | me (docs, backend) | Draft the disclosure for approval in #questions; one Tiger-backed line on a mistake card ("N people made this one"), rate-limited read only. | +0.5 Sponsor; disclosure is required by the rules |

## Demo script vs what's clickable today (PR #212, docs/demo-script.md)
| Step | Today on the live site |
|---|---|
| Before: `/api/health`, backend dot green | **Works** (`{"status":"ok"}`, "backend online"). |
| Before: calculus shows 7.5 and 4.57 | **Partly.** `?session=calculus` opens the course menu; 7.5 is on **Area under a curve** after one tap. 4.57 not checked this pass. |
| 0:00 Home → "Push the electrons" card → step 1 Build ethanol | **Fails as written.** The card is "Organic chemistry" and opens a topic menu; tap **Build ethanol** (or **Start to finish**). |
| 0:15 Build, 5th bond named live | Atoms add and bond by tap and drag on desktop and phone (verified to C6). The "A carbon with 5 bonds" message not exercised this pass. |
| 0:40 Check it → "Push the electrons →" | **Fails as written** from the Build ethanol topic (1 of 1, no next step). Only reachable via **Start to finish** or back to the menu → SN2. |
| 0:55 Draw two arrows on HO⁻ + CH₃Br | **Fails as written.** SN2 opens on "Find the parts" (1 of 4); arrows come after parts / size up / pick. Budget the extra taps or start from Start to finish. |
| 1:20 Scrubber | Not exercised this pass (behind the earlier steps). |
| 1:35 N≡C⁻ + CH₃I, Run both | Not on the menu; may be inside Start to finish ("spot the same pattern in a new reaction"), unverified. |
| 1:50 Calculus slope sketch → drag tangent | **Works** after tapping **The slope of a curve** from the menu. |
| 2:15 Area, rectangles 1 → 200 | **Fails as written** from the slope topic (no "Now the area" step). Open **Area under a curve** from the menu, or use Start to finish. |
| 2:35 Typed "derivative of x squared" → draggable tangent | **Fails.** Builds, but plays as a number slider (0-12) at x = 3, no tangent. |
| 2:50 Notebook | Notebook card on Home; contents after orgo/calc not checked this pass. |
| Fallback "palette buttons add an atom" | **Works** (tap "add carbon" chains bonded atoms). |

**Next loop:** fix the script to the menus (gap 1) and the typed demo topic (gap 2), run user test round 1, re-grade after #218/#223/#225 land.

## History
- Sat Oct 17 ~11:15 AM: graded the three probability sessions (birthday, coin streak, positive test) live: 25 / 35; top gaps were the typed-topic surface (now live), user testing (still open), backend deploy (done), disclosure + a doctor-number mismatch, two session shells.
- Sat Oct 17 ~2:20 AM: graded against the live site with only birthday as a visual session: 20 / 35; top gaps were coin + positive live (done), Home routing (done), typed-topic surface (still open), reset (done).
- Sat Oct 17 ~12:45 AM: graded after the re-plan, before any session was built: 16 / 35, biggest gap was the birthday session (now live).
- Fri Oct 16 ~11:20 PM (B1): graded the old plan (3 showcase rounds as one-guess items + the judge's live topic as the headline): 16 / 35, biggest gaps were the coin-streak card, the "How it works" drawer and hosting the live topic. The vision note (Oct 16 ~11:40 PM) and the generation trial (Sat ~12:10 AM) replaced that plan with visual sessions; that version is in git history for this file.
- Before the direction was picked (Fri ~9:50 PM), this file compared the candidates from docs/strategy.md; I picked Mental Models, general version, on the Entertainment & Creative Technology track. Full table in git history.
