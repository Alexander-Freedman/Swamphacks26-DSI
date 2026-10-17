# Scorecard: the current demo vs the XII rubric

**Mode: BUILD.** This grades the demo **as a judge would see it right now**, not the plan. The script it's graded against is docs/demo-script.md (the three visual sessions, rewritten Sat ~12:45 AM). Re-grade after every gate in the re-plan (docs/build-plan.md, top) and after every merge that changes what a judge sees.

Scores are 1-5 gut calls against the 7 official Devpost criteria. They're not data.

**Last graded:** Sat Oct 17, ~2:20 AM, against the **live** site (https://alexander-freedman.github.io/Swamphacks26-DSI/), main at 4f69609. Played the birthday session end to end with the QA driver (`~/qa/bday.mjs`) at 1440×900, 390×844 and 360×640: 0 console errors, 0 horizontal overflow at all three. Screenshots in `~/qa/regrade-live/` (local, not in the repo).

## What a judge sees right now (honest)
- **Home:** the "Bet on your gut. Then watch reality." card with **four** entries: *The birthday problem* (the new session), then three old round chips: *Streaks in coin flips*, *What a positive test really means*, *Shared birthdays*. The last one duplicates the birthday session as a one-guess round. No "Try any topic" box, no notebook link.
- **Birthday session (`?session=birthday`): live and good.** B1 big slider + confidence + lock → B2/B3 room fills on a calendar grid with the pair-line web, "MATCH · MAR 23" stamp, first match at 23 · 253 pairs (seeded), rooms histogram vs "your guess: 180" → B4 draw your curve (finger works on phone) → B5 ink "real (exact)" over the pencil "you" curve, gap shaded, slider with 23 / 57 ticks, 50.7% → B6 WAY OFF stamp, "You need about half of 365" card, *Someone shares MY birthday 5.9%* vs *Any two 50.7%* wheels → B7 rematch (class of 30, CALLED IT) and the yellow "Saved. Caught ... Come back tomorrow for a remix" bar. Formula footnote and "exact" labels on screen.
- **Coin streak and positive test from Home:** both open the **old one-guess flow** (plain slider 1-20 / 0-100, "reviewed" pill, text verdict). The visual sessions are in PRs #107 and #99, not on main. `?session=coin-streak` / `?session=positive-test` silently show Home.
- **Old rounds don't put anything in the URL**, so a refresh mid-round drops to Home (#106 open).
- **Backend:** not deployed (deploy kit #118 open). Help chat API merged, no panel in the UI. Tiger answer events #103 open. Nothing Gemini-powered is visible.
- **Not built:** reset shortcut (`?reset=1` just shows Home; nothing cleared that a judge would notice), notebook view, typed-topic box, "How it works" drawer.
- Small bug: the B6 source line ends in a double paren: "(teaching observation, not a survey))".

## Grades

| Criterion | Now | Evidence (what a judge sees) | Once coin + positive are live | Single biggest gap |
|---|---|---|---|---|
| **Technical Understanding** | **3** | Birthday labels every number "exact" and shows the formula under B5; the room is a real simulation and the histogram band is the exact median. The engine, checks and generator are invisible, and the backend isn't public. | **4** | One visible "how it's computed" path per session (the B5 footnote pattern on coin + positive), plus an honest answer on the blind check. |
| **Innovation & Creativity** | **3** | Birthday is the idea made real: your pencil curve under the ink one, the pair-line web, MY-birthday vs any-two wheels. The other two topics are a slider and a verdict, so the idea shows once, not as a pattern. | **4** | Coin streak: your tapped flips next to real ones, longest runs underlined. That's the second "your model next to reality" moment. |
| **Functionality** | **3** | Birthday: B1→B7 end to end on desktop + phone + small phone, no errors, seeded first match. But 2 of the 3 demo topics play the old flow, Home has a duplicate birthday chip, refresh drops old rounds to Home, no reset. | **4** | Coin + positive merged and reachable from Home by `?session=`. |
| **Design & Usability** | **3** | Session screens are a 4 (Notebook Arcade look, stamps, hand lettering, phone layout clean). Home is a narrow card with mismatched entries (one with a subtitle, three without), and clicking two of them drops into a visibly plainer UI. | **4** | Home as three matching session cards in the session look. |
| **Purpose & Audience** | **3** | Birthday visibly walks a wrong guess (180, "pretty sure") to "Called it" on the rematch in ~2 min. No user-test evidence yet. | **4** | User-test lines from real people (round 1). |
| **Track & Challenge Relevance** (Entertainment & Creative Tech) | **3** | Birthday has toy feel: drop people in, matches stamp, draw, the stamp lands. Only one of three topics feels like that. | **4** | Same as Innovation: coin streak is the most "toy" of the three (tap coins, watch real ones clump). |
| **Sponsor Challenge Criteria** | **2** | Easy On The Eyes: birthday is a 4 on its own, Home drags it to 3. Gemini: nothing visible (backend not deployed, no typed-topic box, no chat panel). Tiger: #103 open, invisible. Domain: none. | **3** | Any visible Gemini moment (typed-topic box from a cached, reviewed set) and a domain pointer. |
| **Track fit (prize odds)** | **3** | One strong session wins a judge who opens it; a judge who taps the coin chip first sees a quiz. | **4** | Home routing every card into a session. |

**Total now: 20 / 35** (up from 16 at 12:45 AM; birthday is the whole gain). **Once coin + positive are live: 27 / 35.** Target at freeze: 30+.

## Top 5 gaps, in order (biggest gap to visual understanding first)
| # | Gap | Owner | Cheapest fix | Est. points |
|---|---|---|---|---|
| 1 | **Coin streak session live.** The 1:35 beat is the old slider today. | @luanamaldaner (#107) | Review + merge #107 as it stands (C1-C2 are enough for the demo beat), register the slug, point the Home card at `?session=coin-streak`. C3-C6 can follow. | +2 (Innov, Track, Func) |
| 2 | **Positive test session live.** The 2:05 beat is the old slider today. | @luanamaldaner (#99) | Review + merge #99 (P1-P3 is the demo beat: lock, Test everyone, 9 ink among 89 grey, 9.2%). | +1.5 (Func, Purpose) |
| 3 | **Home routes only into sessions.** Old chips (coin, positive, duplicate "Shared birthdays") drop judges into the plain one-guess flow. | @luanamaldaner (Home) | Build Home cards from the session registry only, same card style with subtitles; hide the old reviewed rounds (keep them reachable for the typed-topic extra later). | +1 (Design, Track) |
| 4 | **Typed-topic extra has no surface** (2:30 beat, and the only visible Gemini moment). | me | Skip the live backend for the demo: ship 3-4 reviewed cached topics as static JSON and a "Try any topic" box with chips that play them client-side with the **auto-checked** label. Deploy #118 only after that works. | +1.5 (Tech, Sponsor) |
| 5 | **Reset shortcut** (`?reset=1` / Shift+R). The script starts every judge with it; today it does nothing. | me | ~20 lines: clear this app's localStorage keys, `history.replaceState` to Home. Fix the B6 double paren in the same PR. | +0.5 (Func) and saves the table demo from a stale "Called it" |

Not in the top 5 but next: notebook view (2:45 beat, the birthday "Saved" bar already covers the line), help-chat panel (merged API, no UI), Tiger #103, user test round 1, domain + QR.

## Demo script vs what's clickable today (docs/demo-script.md)
| Step | Today on the live site |
|---|---|
| Before: reset shortcut | **Fails.** Not built; `?reset=1` shows Home and clears nothing. Use a private window per judge. |
| Before: Home shows three session cards + "Try any topic" box | **Fails.** Four entries, three of them old rounds; no topic box. |
| Before: birthday seeded | Works: first match at 23 in every run I did. |
| 0:00 Home → Birthday | Works (card or `?session=birthday`). |
| 0:10 B1 guess + lock | Works on desktop and phone. |
| 0:20 B2 fill the room, 23 · 253 | Works. "Add a person" is a tap, not a hold; "+5" button also there. |
| 0:45 B4 draw your curve | Works with mouse and touch. |
| 1:00 B5 reveal + slider, 23 → 50.7%, 57 → 99.0% | Works (labelled ticks at 23 and 57). |
| 1:20 B6 stamp + card | Works, but **wording mismatch**: the stamp is WAY OFF / CLOSE etc. and the card's headline mistake is **"You need about half of 365"**; "It's about MY birthday" is the left wheel, not the card title. Update the narration, not the app. |
| 1:35 Coin streak C1-C2 | **Fails.** Home → coin opens the old "longest run in 100 flips" slider; no tapping coins. Needs #107. |
| 2:05 Positive test P1-P3 | **Fails.** Old 0-100% slider; no 1,000 dots. Needs #99. |
| 2:30 Any-topic extra | **Fails.** No box, no cached chips, backend not deployed. |
| 2:45 End screen + Notebook | **Partly.** Birthday's B7 bar says "Saved ... Come back tomorrow for a remix"; there's no Notebook to tap. |
| Fallback: reload `?session=<slug>` | Works for birthday only; other slugs land on Home. |
| Fallback: mockup for a session that isn't live | Works (local `docs/mockups/*.html`); needed for coin + positive until #107/#99 merge. |

**Next loop:** review #107 and #99 so they can merge (gaps 1-2), then build gaps 4-5 on my side; re-grade here when coin + positive are on Pages.

## History
- Sat Oct 17 ~12:45 AM: graded after the re-plan, before any session was built: 16 / 35, biggest gap was the birthday session (now live).
- Fri Oct 16 ~11:20 PM (B1): graded the old plan (3 showcase rounds as one-guess items + the judge's live topic as the headline): 16 / 35, biggest gaps were the coin-streak card, the "How it works" drawer and hosting the live topic. The vision note (Oct 16 ~11:40 PM) and the generation trial (Sat ~12:10 AM) replaced that plan with visual sessions; that version is in git history for this file.
- Before the direction was picked (Fri ~9:50 PM), this file compared the candidates from docs/strategy.md; I picked Mental Models, general version, on the Entertainment & Creative Technology track. Full table in git history.
