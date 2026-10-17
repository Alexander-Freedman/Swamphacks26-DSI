# User testing: the kit for round 1 and round 2

**Round 1:** Sat 1:30-2:30 PM (lunch line). **Round 2:** Sat 8-9 PM (dinner), same kit, new people. Plan: #137. Background and the why behind the numbers: docs/plan-extras.md (Q5).

**Goal:** find where people *don't* get it visually, before the judges do. We're not checking that the buttons work (tests do that). We're checking whether someone who has never seen the app goes from wrong to right through the visuals alone, and whether they'd come back.

Anyone on the team should be able to run a test cold from this page. Bring: a laptop **and** a phone with the site open, a stopwatch (phone), and a copy of the recording sheet (below) per tester.

## Why this setup (sources)
- **5 people per round, then fix, then 5 more.** One user finds about 31% of usability problems, so 5 find about 85%; NN/g recommends several small rounds with fixes in between over one big test ([Nielsen, NN/g: Why you only need to test with 5 users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)). That's about usability problems on a focused task, not a statistic about learning. We call it a hallway test, never a study.
- **Think-aloud.** People use the app and say what they're thinking as they go; the facilitator keeps them talking without steering them, and drops any part where they did steer them ([Nielsen, NN/g: Thinking aloud](https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/)).
- **Don't answer their questions during the task.** Use echo ("the slider?"), boomerang ("what do you think it does?") or just wait; "count to 10 silently" before saying anything ([NN/g: Talking with participants during a usability test](https://www.nngroup.com/articles/talking-to-users/)).

## Who to recruit (5 per round)
- **Who:** hackers, volunteers, mentors at the venue. UF students are the closest to our real users. **Not** teammates, not anyone who has seen the demo or the mockups, not the other side's testers from round 1 (round 2 needs fresh eyes).
- **Where:** the meal line (lunch 1:30-2:30 PM, dinner 8-9 PM, WERT Lab Lobby), sponsor-table queues, the hacker area. People already standing in a line say yes most often.
- **Ask:** "Got 10 minutes to try a thing we built and tell us where it's confusing? Anonymous, no wrong answers."
- **Screen:** "Are you 18 or older?" If no, thank them and stop. Then one tag question: "Have you taken a stats or probability class?" (yes / no). Write the answer down; we report both groups.
- Expect about half the people asked to say yes, so ask ~10 (our guess, no source).
- Split: we both run tests in parallel, ~3 each. Each tester is P1-P5 (round 1) or P6-P10 (round 2). No names.

## Consent (say it, then wait for a yes)
> "We're testing the app, not you. We don't take your name, photo, face or voice: I only write notes on what happens on screen and how long it takes. You can stop any time. OK to start?"

- No recording faces or audio. No photos of people. Notes only (screen-only recording is fine if they say yes to it separately; default is none).
- Stop the moment they want to stop. Don't ask anything sensitive.
- Never call it "research" or a "study" anywhere (docs/plan-extras.md, consent and privacy basics).

## Before each tester
1. Open the site and press **Shift+R** on Home (or open with `?reset=1`): notebook cleared, Home with the session cards.
2. Device: alternate laptop and phone between testers, and note which one on the sheet.
3. New recording sheet, P-number at the top, stopwatch at 0.

## Facilitator script (read it word for word)

**Intro (~30 s):**
> "Thanks for doing this. This is an app that tries to make a probability idea click in about two minutes per idea. There are three short ones, then a box where you can type any topic. I'm testing the app, not you; if something's confusing, that's the app's fault and exactly what I need to know.
>
> One thing I'll ask: please think out loud the whole time. Say what you're looking at, what you're trying to do, what you expect to happen. I can't help you while you're going, but tell me what you're thinking. I'll answer every question at the end."

**Start each session:**
> "Here's the first one. Start whenever you're ready." (Point at the card. Start the stopwatch when they first touch the screen.)

**If they go quiet for ~10 s:** "What are you thinking?" (only that, nothing else).

**If they ask a question** ("is this the slider?", "what do I press?"): echo it back ("the slider?") or "What do you think?" Never point, never say "yes". Write the question down verbatim.

**If they're stuck for 60 s:** "What would you do if I weren't here?" At 90 s, give the smallest possible hint, mark the screen **H** (hint) on the sheet, and keep going. At 2 min on one screen, move them on and mark it **X** (blocked).

**Don't:** explain the concept, praise their guess, fix their wrong answer, or demo what they missed. That all goes in the debrief at the end.

**End:**
> "That's everything. Thank you. What was the most confusing part?" (Write one quote word for word.) Then answer their questions.

## Task order
1. **Birthday** (Home → Birthday card, `?session=birthday`)
2. **Coin streak** (Home → Coin streak)
3. **Positive test** (Home → Positive test)
4. **Any-topic box** (Home → "Try any topic"): "Type something you'd like to understand better." If the box isn't on the build yet, have them open one of the topic rounds on Home and write "box not built" on the sheet.

Same order for everyone, so round 1 and round 2 compare. After each session: the comprehension check and the two ratings (below), before opening the next one. Whole thing ~10-12 min.

## What to watch on each screen

Write down, per screen: **hesitations over 5 s** (with what they said), **mis-taps** (tapped something that isn't a control, or the wrong control), **questions asked**, and whether they **read the pencil vs ink** right (do they know which mark is theirs and which is reality?). The guidance lines are in docs/experience.md; one thing to watch is whether they read them at all.

### Birthday (7 steps, `web/src/sessions/birthday/`)
| Step (on screen) | Watch for |
|---|---|
| 1 How many people? (slider 2-366, unsure / pretty sure / certain, **Lock it in**) | Do they get that the lock button needs a slider move *and* a confidence pick ("Move the slider first" / "Pick how sure you are")? Note their guess and their confidence. |
| 2 Fill a room (**+ Add a person**, **+5**, hold to add fast) | Do they find "hold to add fast"? Do they notice the **pair lines** and the people · pairs counter, or only the people? Do they say anything about pairs out loud? |
| 3 The match (**Empty the room, try again**) | Do they understand what the circled day means? Do they try again on their own? At how many people do they say "oh"? |
| 4 Draw your curve (**Show me the real one**) | Do they understand what to draw on empty axes? Trackpad vs finger trouble? Do they redraw? What shape do they draw (straight line is the common one)? |
| 5 Your curve vs the real one (group-size slider, **What did I get wrong? →**) | Do they say which line is theirs (pencil) and which is real (ink) without being told? Do they drag the slider to 23 / 57? Do they read the highlighted gap? |
| 6 What happened in your head (card, **Got it →** / **Show me again**) | Do they read the card or skip it? Do they react to "someone shares *my* birthday" vs "any two"? |
| 7 Rematch (**More likely than not** / **Less likely than not**) | Right or wrong? Fast or slow? |

### Coin streak (5 steps, `web/src/sessions/coin/`)
| Step (on screen) | Watch for |
|---|---|
| 1 Be a coin (**H** / **T**, Undo, Clear, 20 / 100 flips; real row deals under yours, **Flip again**; then the 100-flip longest-run slider + how sure + **Lock it in**) | Do they get that they're *making up* flips? Do they try to be "random" out loud? Do they press **Flip again**? Do they notice their row switches more than the real one ("your longest: 2 · real: 5")? Is the 20-flips row vs the 100-flips guess confusing? |
| 2 Flip it (**Flip 100 again**, **Run 1,000 times**) | Do they understand "each dot is one round of 100 flips"? Do they see where their guess sits vs the pile? |
| 3 Yours vs real (runs of 5+ marked, "How often you switch sides") | Can they say which row clumps? Do they get the switch-rate comparison (theirs vs a coin's 50%)? |
| 4 Extremes (Number of flips slider) | Do they drag it at all? Do they read the two curves (real coin vs "a coin that switches like you")? Is the log scale confusing? |
| 5 Your mistake (card, then the rematch: spot the real row, **Done**) | Do they read the card? Do they pick the real row in the rematch, and how fast? |

### Positive test (6 steps, `web/src/sessions/positive/`)
| Step (on screen) | Watch for |
|---|---|
| 1 You tested positive. (slider, optional how sure, optional "paint who lights up positive", **Lock in N%**) | Do they read the numbers in the question (1% / 90% / 9%) or skip to the slider? Is the optional paint grid confusing or ignored? Note their guess (~90% is the common answer). |
| 2 Test all 1,000. (**Test everyone**, then **Compare with my guess →**) | Do they watch the dots light up? Can they say what the ink dots vs grey dots mean? |
| 3 Your pile vs the real pile. (tap positives, **Now change the crowd →**) | Do they tap dots? Do they say "most of these are healthy" (or similar) out loud? Do they read "your guess / reality / the gap"? |
| 4 Same test. Change the crowd. (how-common slider, rare 0.1% → common 50%, **What did I get wrong? →**) | Do they drag it? Do they connect "rarer → a positive means less"? Is the log-scale chart readable? |
| 5 What happened in your head (card, **One more, new numbers →**) | Do they read it? Any "ohh"? |
| 6 Rematch (slider, **Lock in N% and show me**, **Done**) | How close is the rematch guess to the truth vs their first guess? |

### Any-topic box
| Watch for |
|---|
| Do they find the box? What do they type (write it down)? How long until something plays? Do they notice the **auto-checked** label, and do they know what it means? Does anything look wrong or slow? |

## Comprehension check (after each session, before the ratings)
Ask exactly this, then stay quiet and write their answer down as close to verbatim as you can. Don't correct them.

| Session | Question |
|---|---|
| Birthday | "In your own words: why is it only about 23 people?" |
| Coin streak | "In your own words: why do real coin flips clump into streaks more than the ones you made up?" |
| Positive test | "In your own words: why does a positive test only mean about 9% here?" |

**Score 0 / 1 / 2:**
| Score | Birthday | Coin streak | Positive test |
|---|---|---|---|
| **2** (has the model) | Says it's about **pairs** (any two people, not you), and pairs grow much faster than people (e.g. "23 people is 253 pairs", "everyone can match everyone"). | Says each flip is independent / a coin doesn't "remember", so runs happen naturally, and that **people switch too often** when faking it (or "longer sequences → longer streaks"). | Says the condition is **rare**, so the many healthy people produce more false alarms than the few sick people produce true positives (e.g. "9 sick vs ~89 false alarms"). |
| **1** (partly) | Mentions "lots of combinations" or "it's not about my birthday" but can't say why it grows fast. | "Random is streaky" or "mine switched too much", without why. | "Lots of false positives" or "it's rare", without connecting the two. |
| **0** (not yet) | Repeats the number only ("because it's 23"), or still reasons from 365/2 or their own birthday. | Says streaks mean the coin isn't fair, or can't say. | Restates the test's accuracy ("90% accurate so ~90%"), or can't say. |

Score it right after the tester leaves, from the written answer. If the two of us disagree on a score, take the lower one.

## Ratings (after each session)
- **Fun:** "From 1 to 5, how fun was that one?" (1 = boring, 5 = really fun)
- **Come back:** "From 1 to 5, how likely would you open a new one tomorrow?" (1 = no way, 5 = definitely)

Write the number they say. If they say "like a 3.5", write 3.5.

## Timing
- **Target:** 2-3 min per session (docs/experience.md).
- Start the stopwatch at their first touch in the session, stop at **Done** / the end screen. Record the actual time, even if it's way over. Note the screen where most of the time went.
- Any-topic: time from submit to the first playable question.

## Recording sheet (copy one per tester)

```
Tester: P__   Round: 1 / 2   Facilitator: ____   Device: laptop / phone
Stats or probability class: yes / no     Start time: __:__

BIRTHDAY                       time: ___:___   guess: ___ (conf: ______)  rematch: right / wrong
  step | hesitated >5s (what they said) | mis-taps | questions asked | pencil vs ink read right? | H/X
  1    |                                |          |                 |                           |
  2    |                                |          |                 |                           |
  3    |                                |          |                 |                           |
  4    |                                |          |                 |                           |
  5    |                                |          |                 |                           |
  6    |                                |          |                 |                           |
  7    |                                |          |                 |                           |
  "why only about 23?" (verbatim):
  score 0/1/2: ___   fun 1-5: ___   come back 1-5: ___

COIN STREAK                    time: ___:___   guess: ___ in a row (conf: ______)  rematch: right / wrong
  step | hesitated >5s | mis-taps | questions | pencil vs ink | H/X
  1-5  (one line each)
  "why do real flips clump more than yours?" (verbatim):
  score 0/1/2: ___   fun 1-5: ___   come back 1-5: ___

POSITIVE TEST                  time: ___:___   guess: ___% (conf: ______)  rematch guess: ___%
  step | hesitated >5s | mis-taps | questions | pencil vs ink | H/X
  1-6  (one line each)
  "why only about 9%?" (verbatim):
  score 0/1/2: ___   fun 1-5: ___   come back 1-5: ___

ANY TOPIC                      typed: "______________"   time to first question: ___ s
  found the box? y/n   noticed "auto-checked"? y/n   notes:

Most confusing part (one quote, verbatim):
```

H = needed a hint, X = blocked (moved on after 2 min).

## Turning findings into qa issues (right after the round, ~15 min)
1. Put both sheets side by side. List every problem once, with a count of how many of the 5 hit it ("3/5 didn't find hold to add fast").
2. Give each a severity, in the CONTRIBUTING.md QA order:
   1. **breaks the demo** (blocked, X, an error, a screen that can't be finished)
   2. **wrong facts** (a number or claim on screen is wrong, or a tester read a true number as something false)
   3. **the core reveal feeling** (didn't read pencil vs ink, missed the pair lines / the clumping / the pile, scored 0 on the check)
   4. **polish** (copy, layout, a slow animation, a mis-tap with no harm)
3. Sort by severity first, then by count. Fix the top 3 that each take ≤45 min before round 2; anything bigger gets its own issue for later.
4. Open one issue per problem, label `qa`:
   - **Title:** `UT1: <Session> step <n>: <what happened> (<count>/5)` (round 2: `UT2: ...`). Example shape: `UT1: Birthday step 2: missed the pair lines (3/5)`.
   - **Body:** severity (1-4), the tester IDs, one verbatim quote, the screen, the proposed fix, and "Done looks like" (CONTRIBUTING.md §2).
   - **Owner by folder:** `web/src/sessions/birthday/` → @Alexander-Freedman; `web/src/sessions/coin/` and `web/src/sessions/positive/` → me; the any-topic box, `api/` and the engine → @Alexander-Freedman; shared bits (`web/src/App.tsx`, `web/src/components/`, notebook) → whoever touched it last (`git log -1 -- <path>`), or ask on the issue.
5. Write the tallies into the results tables below in the same PR as the issue links, so every number traces back to a sheet.

## How results feed the pitch and Devpost
- Only real numbers from the tables below, never rounded up, never invented. If we tested 4 people, it's "of 4".
- Lines we can use, once they're true:
  - "After the birthday session, N of 5 could explain why it's 23 in their own words."
  - "Round 1: N of 5 scored 2 on the positive-test check. We fixed <the 3 things>. Round 2: M of 5."
  - Median time per session (vs the 2-3 min target), median fun and come-back ratings.
  - One verbatim tester quote (no names).
- Always say "hallway test, 5 + 5 people at SwampHacks, anonymous". Not a study, and not proof that people learn faster (docs/demo-script.md, never-say list).
- Where they go: the "Does it actually help people learn?" answer in docs/demo-script.md, docs/pitch.md, and a "Testing with real people" part in docs/devpost-draft.md. The scorecard (docs/scorecard.md) lists the user-test fixes as the step to 5 on Design & Usability and Purpose & Audience.

## Results

### Round 1 (Sat 1:30 PM)
| Tester | Device | Stats class | Birthday time | Bday check 0-2 | Coin time | Coin check 0-2 | Positive time | Positive check 0-2 | Fun (B/C/P) | Come back (B/C/P) | Any-topic: typed / time |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | | | | |
| P2 | | | | | | | | | | | |
| P3 | | | | | | | | | | | |
| P4 | | | | | | | | | | | |
| P5 | | | | | | | | | | | |
| **Summary** | | | median: | scored 2: _/5 | median: | scored 2: _/5 | median: | scored 2: _/5 | medians: | medians: | |

Top problems (count, severity, issue):
1.
2.
3.

Quotes:

### Round 2 (Sat dinner, 8-9 PM)
| Tester | Device | Stats class | Birthday time | Bday check 0-2 | Coin time | Coin check 0-2 | Positive time | Positive check 0-2 | Fun (B/C/P) | Come back (B/C/P) | Any-topic: typed / time |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P6 | | | | | | | | | | | |
| P7 | | | | | | | | | | | |
| P8 | | | | | | | | | | | |
| P9 | | | | | | | | | | | |
| P10 | | | | | | | | | | | |
| **Summary** | | | median: | scored 2: _/5 | median: | scored 2: _/5 | median: | scored 2: _/5 | medians: | medians: | |

What changed since round 1 (fixes merged):

Quotes:
