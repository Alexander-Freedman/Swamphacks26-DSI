# User testing: does it click, visually, and would they come back?

Saturday, two rounds of 5 people each: **round 1 at lunch (1:30 PM)**, **round 2 at dinner (8 PM)**, both in the WERT Lab Lobby. Fix the top 3 things in between. Method, recruiting, consent background and the "why 5" sources are in [plan-extras.md](plan-extras.md) (Q5 and "User testing for Mental Models"); this page is the kit for the new product: three short visual sessions ([experience.md](experience.md)).

## Goal
Three questions, measured, not guessed:
1. **Do people go from not understanding to understanding?** A transfer question before and after each session (a new case, not the session's own question). Wrong before → right after is the signal.
2. **Does the visual do the work?** Which screen made it click, did they use the slider / go to the extremes, did they read the card or skip it.
3. **Would they come back?** What they do at the end (start another session unasked), not only what they say.

It's a hallway test, not a study: n=5 per round, anonymous, 18+. Every number we use later traces back to the log table below.

## Setup (10 min, once before round 1)
- Laptop + phone, both charged, on the live site. Links:
  - Birthday: https://alexander-freedman.github.io/Swamphacks26-DSI/?session=birthday
  - Coin: `?session=coin-streak` (when live; check the slug before round 1)
  - Positive test: `?session=positive-test` (same)
- Fresh state per tester: private window (or clear site data) so the notebook is empty.
- Add `&test=1` if the timing helper below has shipped; otherwise the note-taker times screens with a stopwatch.
- The pre/post cards below printed or on the note-taker's phone. The tester never sees the answer sheet.
- Each tester does **one or two** sessions, not all three (5 min budget). Rotate topics so each round covers all three: P1 birthday, P2 coin, P3 positive test, P4 birthday, P5 coin (round 2 starts the rotation at positive test).

## Roles
- **Driver** (one of us): reads the task card, gives the pre/post questions, says nothing else during the session except "keep talking".
- **Note-taker** (the other one): stopwatch, fills the log row live, writes quotes word for word. Doesn't talk.
- We swap roles halfway through each round. If only one of us is free, the driver also notes, and the row gets tagged "solo".

## Consent line (driver reads it, word for word)
> "We're two students testing a thing we built for SwampHacks. We're testing the app, not you; there are no wrong answers. We don't take your name, photo or voice, just what you do on screen and how long it takes. You can stop any time. Are you 18 or older? OK to start?"

No names (IDs P1-P10 only; a first name is fine to talk, never written down). No photos of faces, no audio. Under 18 or "no" → thank them, done.

## Task card (what the tester is told; nothing else)
> **Quick test, about 5 minutes.**
> First I'll ask you one quick question. Just guess, it's fine to be wrong.
> Then open this page and go through it however you like. Please say out loud what you're thinking the whole time. I can't help once you start, but I'll answer everything after.
> When you reach the end, do whatever you'd naturally do next.

No coaching. If they ask "what do I do?", the only answers are "what would you try?" or "keep talking". If they're stuck for 30 s, note it as a block and say "go ahead and move on however you can". Hard stop at 7 min.

## Pre/post check (one transfer question per topic)
Asked out loud **before** they open the session and **again right after** it, same wording. Each one is a new case, not the session's own question (birthday's own rematch is a class of 30, positive test's is 2% / 95% / 5%, coin's is two rows of 20). Write their answer down exactly, then score it with the band.

| Topic | Question (read out) | Truth | Counts as right |
|---|---|---|---|
| Birthday | "In a class of 40, how likely is it that two people share a birthday? Give me a percent." | **89.1%** (1 − ∏(365−i)/365 for i = 0..39) | 75-100% |
| Coin | "One of these rows is 30 real coin flips, the other is made up. Which is real?" (show card A) | the clumpy row (longest run 5) | picks the real row |
| Positive test | "1 in 200 bags at an airport has something banned. The scanner flags 99% of those, and also flags 5% of clean bags. A bag gets flagged. How likely is it that it really has something?" | **9.0%** (0.005·0.99 / (0.005·0.99 + 0.995·0.05)) | 0-20% |

Numbers computed in Python for this doc (same formulas as devpost-draft.md). Real coin rows were drawn with Python's `random` (seeds 17 and 41) and kept only if typical for 30 flips (longest run 5, 13-14 switches); the fake rows are hand-made, longest run 2, 23-24 switches. In 30 fair flips a run of 4+ shows up ~90% of the time and 5+ ~63% (exact count of sequences, computed).

**Coin cards** (pre uses card A, post uses card B so they can't just remember a row; the real row sits on a different side):
- Card A, pre: **Row 1** `HTHTTHTHHTHTHTTHTHTHHTHTTHTHTH` (made up) · **Row 2** `HTHHTTHHTTTTHHHHHTTTHTTHTTHHTT` (real)
- Card B, post: **Row 1** `HTHTHTTTHHHHHTTHTHTHHHHHTTTTTH` (real) · **Row 2** `THTHHTHTTHTHHTHTHTTHTHHTHTTHTH` (made up)

Also ask, after each pre/post answer: "How sure, 1-5?" A confident wrong answer that flips to right is the best outcome we can see.

## Think-aloud prompts (the only things the driver may say)
- "Keep talking." / "What are you thinking right now?"
- "What do you expect will happen?" (only before they press something, never after)
- "What are you looking at?"
- After a long silence (10 s+): "What's going through your head?"
- Never: "try the slider", "read the card", "that's right", "almost". No hints, no nods.

## What to watch, per screen
For each screen, the note-taker logs seconds on screen plus a mark for anything below. Screen IDs are from experience.md.

| Watch for | How to note it |
|---|---|
| **Lost** | Paused 10 s+, wrong tap, "huh?", asked what to do → `L` + screen + what they said |
| **Guidance line** | Did they read the one-line instruction (lips move, eyes go there, they repeat it)? Which line helped them act? → `G` + screen |
| **Guess** (B1 / C1, C3 / P1) | Their guess and confidence. Did they hesitate on the slider? |
| **Poke it** (B2-B3 add people / C2 flip again / P2-P3 test everyone, tap dots) | How many times did they poke without being told? 0 = didn't get it was interactive |
| **Draw** (B4, C5 if built) | Did they draw? What shape (flat, straight, curve)? |
| **Extremes** (B5 / C5 / P4) | Did they drag the slider? To both ends? Did they say something at the ends ("oh, at 57 it's basically certain")? → `X` + max/min reached |
| **Model vs reality** | Did they notice the pencil vs ink gap out loud? |
| **Card** (B6 / C6 / P5) | Read it (time on screen > 5 s, eyes on it) or skipped? Did they say it was fair? → `C read / C skip` |
| **Rematch** (B7 / C7 / P6) | Right or wrong, and how fast |
| **Click moment** | The screen where they said "oh" / laughed / changed tone. This is the single most useful note. → `!` + screen + quote |
| **End** | Started another session or the help chat without being asked? Closed it? Looked at us? |

## Closing questions (after the post check, ~60 s)
1. "Would you do another one of these, on a different topic? Which?"
2. "What was the most confusing moment?"
3. "One word for how that felt."

Then thank them, answer anything they ask, and only now show what they missed.

## Log table (one row per tester and topic)
Paste into this file under "Results" during the round. Times in seconds; screen times as `B1 12 · B2 40 · ...`.

```
| Rnd | ID | Driver/notes | Topic | Pre answer (sure 1-5) | Post answer (sure 1-5) | Pre right | Post right | Time per screen (s) | Pokes / slider ends / drew / card | Confusion moments (screen: what) | Click moment | Quotes | Come back (did / said) | One word |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | P1 | me/L | birthday | | | Y/N | Y/N | | | | | | Y/N / Y/N | |
```

Round summary line, filled only from the rows:
`R1 (n=5): pre right __/5, post right __/5, wrong→right __, right→wrong __; median session time __ s; used extremes __/5; read the card __/5; started another unasked __/5; said they'd come back __/5. Top confusion: __. Fixes: UT1-1 __, UT1-2 __, UT1-3 __.`

## From results to the top 3 fixes
Same scoring as plan-extras.md Q5:
1. List every confusion moment; count how many testers hit each one.
2. Score **count × severity** (3 = stuck or gave up, 2 = slowed 10 s+ or asked for help, 1 = comment only). Add +1 if it sits on the screen before the click moment (it blocks the learning, not only the flow).
3. Check the pre/post: if post right is low for one topic, the click screen for that topic is a fix candidate even if nobody was "lost".
4. Take the **top 3 that each fit in ~45 min**. Open them as `UT1: ...` issues with the count in the title ("UT1: 3/5 never dragged the B5 slider"). Fix before dinner; round 2 runs the same cards so the numbers compare.

## The honest pitch line
Only from the summary lines, with n stated, never rounded up or invented. Template:
> "We put it in front of __ people at SwampHacks. Before a session, __ of __ got a new question on the idea right; after it, __ of __ did. __ of __ started another topic without being asked."

Rules: say "hallway test", not "study". If a number is bad, we don't use it as a brag; we say what we changed ("after round 1 we fixed __, and in round 2 __ of 5 ..."). Pick one real quote, word for word. The line and its table go into pitch.md and the Devpost "testing with real people" section, linking back here.

## Optional in-app helper: `?test=1` timing log (spec, not code; for @luanamaldaner if there's time)
So the note-taker reads exact screen times instead of a stopwatch.
- **Flag:** `?test=1` anywhere in the URL (works with `?session=...`). Off by default; no effect without it.
- **What it logs:** on every screen change inside a session, one `console.log` line: `[test] <session> <screenId> <seconds on previous screen>` (e.g. `[test] birthday B2 41.3`). Also log: guess locked (`[test] guess 180 sure=2`), slider min/max reached on the extremes screen, card shown/closed, rematch answer and whether it was right, and session end with total seconds.
- **Summary:** at session end, `console.table` of screen → seconds, so I can copy it into the log row.
- **Privacy:** console only. Nothing sent to the backend, nothing stored, no IDs.
- **Done =** with `?session=birthday&test=1`, going through B1-B7 prints one line per screen and the table at the end; without the flag, the console is clean.

## Results
_Round 1 (Sat 1:30 PM) and round 2 (Sat 8 PM) rows go here._
