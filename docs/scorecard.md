# Scorecard: the current demo vs the XII rubric

**Mode: BUILD.** This grades the demo **as a judge would see it right now**, not the plan. The script it's graded against is docs/demo-script.md (the three visual sessions). Re-grade after every gate in the re-plan (docs/build-plan.md, top) and after every merge that changes what a judge sees.

Scores are 1-5 gut calls against the 7 official Devpost criteria. They're not data.

**Last graded:** Sat Oct 17, ~11:15 AM, against the **live** site (https://alexander-freedman.github.io/Swamphacks26-DSI/), main at e09f264 (coin streak #107, positive test #99, notebook #130, URL/Back #106, Onionskin #142, birthday card fixes #122, generator v3 #127 backend only). Played all three sessions end to end with the QA drivers (`~/qa/bday.mjs`, `rev107c.mjs`, `rev99b.mjs`, pointed at the live URL) at 1440×900 and 390×844, plus a flow check (Home card → URL, refresh, Back, notebook after a session, `?reset=1`): 0 console errors, 0 horizontal overflow on every screen. Screenshots in `~/qa/regrade2/` (local, not in the repo).

## What a judge sees right now (honest)
- **Home:** "Bet on your gut. Then watch reality." with **three matching session cards** (birthday, *Be a coin*, *You tested positive. Are you sick?*), each with a subtitle, and a dashed **Notebook** card. No "Try any topic" box (#136 has changes requested). On desktop it's a narrow column with a lot of empty page; the session art (#124) isn't on Home. Tab icon is still the Vite bolt (#145 open).
- **Birthday (`?session=birthday`):** unchanged from the last grade and still the strongest: guess → room fills with pair lines → draw → ink over pencil → WAY OFF + "You need about half of 365" + 5.9% vs 50.7% wheels → rematch → "Saved to your notebook ... Open notebook". The double paren is fixed.
- **Coin streak (`?session=coin-streak`):** live, 5 steps. Tap 20 H/T, a real 20 deals in under yours with runs marked in yellow, "your longest: 2 · real: 5", **Flip again**; guess the longest run in 100; *Your coin vs the real coin* (your pencil row next to a real 100, runs of 5+ marked, switch-rate and longest-run gap bars); extremes to 10,000; card "RANDOM MEANS EVENLY MIXED" quoting your guess and your 79% switch rate, then a "which row is the real coin" rematch. Numbers labelled exact (DP).
- **Positive test (`?session=positive-test`):** live, 6 steps. Guess + sketch, **Test all 1,000**: positives fly into piles, **9 / 98 → 9.2% EXACT** next to "you guessed 90%"; compare; *Same test. Change the crowd* with prevalence / false-alarm sliders, the 1,000-dot grid recolouring and an ink curve over your dashed guess (coin flip at 9.1%); card "The test's accuracy is my chance", WAY OFF, "One more, new numbers".
- **URL / Back / reset:** Home cards put `?session=<slug>` in the URL, Back returns Home, `?reset=1` clears `mm.sessions` and shows a "Notebook cleared" pill. **Refresh mid-session restarts the session at step 1** (the locked guess is gone).
- **Notebook (`?notebook=1`):** after one birthday run: "1 caught · 0 busted · 1 session played", the mistake in pencil, "1 more right answer to bust it". Coin and positive write to it too. Only the birthday end screen links to it.
- **Two session shells:** coin plays inside the white framed card with numbered step tabs; birthday and positive play full-width on the grid with progress dots. Each looks good alone; side by side they read like two apps.
- **Backend:** still not deployed (#118). Nothing Gemini-powered is visible: no typed topics, no help-chat panel, no Tiger room % (#103 open). Generator v3 (#127) is merged but only in the backend.
- **Facts:** the positive card's source line says doctors' "most frequent estimate was 90% vs a correct 7.7%" (data/rounds/positive-test.json); demo-script, pitch and Devpost say "about 95 of 100 guessed ~75%" (APS Observer on Eddy 1982). One of them is wrong or they cite different studies; the 7.7% primary isn't checked (unverified, see devpost-draft.md).
- **Submission:** AI-tools disclosure in docs/devpost-draft.md is still a placeholder. User testing round 1 hasn't run (1:30 PM).

## Grades

| Criterion | Before (2:20 AM) | Now | Evidence (what a judge sees) | Single biggest gap |
|---|---|---|---|---|
| **Technical Understanding** | 3 | **4** | All three sessions label numbers EXACT and say how (formula under B5, "dynamic programming over run length" on the coin card, 9 / 98 counts on positive). Real simulation in the room, the coin rows and the 1,000 dots. The generator, its checks and the backend are invisible. | One visible typed topic with its *auto-checked* / *reviewed* label (#136), so the engine shows. |
| **Innovation & Creativity** | 3 | **4** | "Your model next to reality" is now a pattern, three times over: pencil curve under ink, your tapped row next to a real 100, your dashed guess over the ink curve while you change the crowd. | The kickoff pitch is *any topic*. With no topic box, the "general engine" claim is only words. |
| **Functionality** | 3 | **4** | 3 / 3 sessions end to end on desktop and phone, 0 errors, 0 overflow. URL per session, Back, reset and notebook all work live. | Typed topics don't play (no box, no backend); refresh mid-session drops your locked guess. |
| **Design & Usability** | 3 | **4** | Session screens are strong (stamps, hand lettering, marker gaps, clean phone layouts). Home now routes only into sessions with matching cards. Drags: two session shells, a narrow bare Home on desktop, Vite favicon. | One session shell for all three + session art on the Home cards. |
| **Purpose & Audience** | 3 | **3** | Each session walks a wrong, confident guess to a named mistake and a rematch in ~2 min, and the notebook gives a reason to come back. Still zero evidence from real users. | User test round 1 (1:30 PM) and 2 quotable lines. |
| **Track & Challenge Relevance** (Entertainment & Creative Tech) | 3 | **4** | Toy feel in all three: drop people into a room, tap coins and watch a real one out-streak you, test 1,000 people and drag the crowd. | Same as Design: Home doesn't sell the toys (text-only cards). |
| **Sponsor Challenge Criteria** | 2 | **2** | Easy On The Eyes: now a solid 4. Gemini: nothing visible. Tiger: #103 open, invisible. Domain: none (github.io). Averaged over what we enter, still a 2. | A visible Gemini moment (#136 with the truth shown), then the backend deploy. |
| **Track fit (prize odds)** | 3 | **4** | Any card a judge taps opens a visual session. | Same as Purpose: real user lines. |

**Total now: 25 / 35** (up from 20 at 2:20 AM; coin + positive + notebook are the gain, 2 under the 27 I forecast because Purpose waits on user testing and Sponsor on anything Gemini). Target at freeze: 30+. The cheapest path there: #136 (+1 Sponsor, +0.5 Tech), user test (+1 Purpose), one shell + Home art (+0.5 Design), deploy (+0.5-1 Sponsor).

## Top 5 gaps, in order
| # | Gap | Owner | Cheapest fix | Est. points |
|---|---|---|---|---|
| 1 | **Typed topics have no surface.** The only Gemini moment and the proof of "any topic". #136 is up but reviewed topics show no true answer after the guess. | @luanamaldaner (topic box, round player) | Fix the reveal in #136 so a reviewed item shows the truth + its label, merge it. No backend needed: chips play the cached reviewed set. | +1 Sponsor, +0.5 Tech/Innov |
| 2 | **No user-test evidence.** Purpose & Audience is stuck at 3. | me (kit #120, docs/user-testing.md), both run it | Round 1 at 1:30 PM: 3-5 people, one session each, log guess, confidence, verdict and one quote; put 2 lines in the pitch and the Devpost. | +1 Purpose, +0.5 Track fit |
| 3 | **Backend not deployed.** Help chat (API merged, no panel), live typed topics, Tiger room % all dark. | me (#118 deploy, #103 Tiger) | Deploy after #136 lands, with the per-IP limit, daily cap and demo token already in the kit; then one small "N people guessed this" line from Tiger on a session card. Skip the chat panel unless it's free. | +0.5-1 Sponsor |
| 4 | **Submission honesty: AI disclosure blank + a fact mismatch.** The positive card says doctors' "most frequent estimate was 90%"; every script says "~75%". | me (docs, data) | Draft the disclosure for approval in #questions; check the APS source and make data/rounds/positive-test.json and the scripts say the same sourced thing. | Protects every score (a wrong number at the table costs more than a point) |
| 5 | **Two session shells, bare Home.** Coin is framed with step tabs, birthday/positive full-width with dots; desktop Home is a narrow text list; Vite favicon. | @luanamaldaner (Home, coin, positive); me favicon (#145) | Pick one shell (the full-width one has more room for visuals) and use it for coin; put the #124 session art on the three Home cards; merge #145. | +0.5 Design, +0.5 Track |

Next after these: keep the locked guess on refresh (store the session step in the URL or sessionStorage), an "Open notebook" link on the coin and positive end screens like birthday's, notebook bust rule (#143), domain + QR.

## Demo script vs what's clickable today (docs/demo-script.md)
| Step | Today on the live site |
|---|---|
| Before: reset shortcut | **Works.** `?reset=1` clears the notebook and shows "Notebook cleared". |
| Before: Home shows three session cards + "Try any topic" box | **Partly.** Three cards yes; **no topic box** (#136). |
| Before: birthday seeded | Works: first match at 23 again. |
| 0:00 Home → Birthday | Works; URL becomes `?session=birthday`. |
| 0:10-1:00 B1-B5 | Work as before (desktop + phone). "Add a person" is a tap, not a hold. |
| 1:20 B6 stamp + card | Works, **narration mismatch still in the script**: the card is **"You need about half of 365"** (WAY OFF stamp), not "It's about MY birthday"; the MY-birthday idea is the left wheel. Fix the script line, not the app. |
| 1:35 Coin streak C1-C2 | **Works.** Tap 20, real row deals under, runs marked, "your longest: 2 · real: 5", Flip again. |
| 2:05 Positive test P1-P3 | **Works**, with two narration fixes: the dots are **9 sick (dark) among 89 healthy (yellow)**, not "9 ink among 89 grey"; and "almost all doctors guessed around 75%" contradicts the card's own source line (90%). Don't say the doctor number until gap 4 is fixed. |
| 2:30 Any-topic extra | **Fails.** No box on live, backend not deployed. Skip the beat (the fallback line covers it). |
| 2:45 End screen + Notebook | **Works for birthday** ("Saved to your notebook ... Open notebook" → caught in pencil). Coin and positive save too but have no notebook link on their end screen. |
| Fallback: reload `?session=<slug>` | Works for all three slugs, but restarts at step 1. |
| Fallback: "a session isn't live yet (true right now)" | Outdated: all three are live. Mockups only matter for the any-topic beat now. |
| Script header "Working name: mm" and Q&A 6 ("every item came out as a plain number guess") | Outdated: name is Onionskin (#142); generator v3 (#127) makes curve/distribution items for most quantitative topics. Update in the script/pitch PRs. |

**Next loop:** review #136 again so it can merge (gap 1), run user test round 1 (gap 2), then deploy (gap 3); re-grade here after #136 is on Pages.

## History
- Sat Oct 17 ~2:20 AM: graded against the live site with only birthday as a visual session: 20 / 35; top gaps were coin + positive live (done), Home routing (done), typed-topic surface (still open), reset (done).
- Sat Oct 17 ~12:45 AM: graded after the re-plan, before any session was built: 16 / 35, biggest gap was the birthday session (now live).
- Fri Oct 16 ~11:20 PM (B1): graded the old plan (3 showcase rounds as one-guess items + the judge's live topic as the headline): 16 / 35, biggest gaps were the coin-streak card, the "How it works" drawer and hosting the live topic. The vision note (Oct 16 ~11:40 PM) and the generation trial (Sat ~12:10 AM) replaced that plan with visual sessions; that version is in git history for this file.
- Before the direction was picked (Fri ~9:50 PM), this file compared the candidates from docs/strategy.md; I picked Mental Models, general version, on the Entertainment & Creative Technology track. Full table in git history.
