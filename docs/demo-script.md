# Demo script: the table demo (Learn flow, seasons + orgo)

What the judge sees and hears, click by click, for the current flow: Home → a Learn topic → 8 steps with the why rail. Follows [SOURCE_OF_TRUTH.md](SOURCE_OF_TRUTH.md) (it wins if anything here disagrees). The demo-link path was walked end to end in a browser on a production build of #318 (main @ 72e011b + #318), Sun Oct 18 ~4 AM.

**Format:** at most 3:00 of demo plus 1 minute of judges' questions. Plan **1:45 of talk and demo** for slack, and keep a 60-second cut for rushed judges.

## The demo link

**https://onionskin.study/?learn=why-we-have-seasons&demo=1**

- With `?demo=1` (#318), the scripted answers below get the **real** model replies recorded from the live API (Sun ~3:40 AM), back in about 0.6 s instead of 4-6 s. Anything else, such as a judge's own guess, goes to the live API as normal. Draw always goes live.
- It latches for the browser tab, including when opened on Home: `https://onionskin.study/?demo=1`. `?demo=0` turns it off.
- **Check before each block:** open the link, paste guess 1, Submit. If the reply takes more than about a second, #318 isn't deployed yet: say the line below and keep talking over the waits.
- If asked whether it's live, or say it once to a technical judge: "To fit two minutes, the AI's replies on this path were recorded from the live system tonight. Type your own answer and it goes live, about five seconds a step."

## Paste sheet (exact text; a different word loses the replay)

| Step | Do | Paste | Expect |
|---|---|---|---|
| 1 Guess first | Guess box → **Submit** → Next | `summer is when Earth is closer to the Sun` | *sounds like: Summer is when Earth is closer* |
| 2 One true fact | Drag the pencil near the top of the curve (truth: 73.5° on June 21), answer box → **Submit** → Next | `In June the northern half is tilted toward the Sun, so the noon Sun is high and the days are long.` | **SPOT ON**. The reply also says the fact alone doesn't establish "74°" (a grader quirk); point at the ink curve instead. |
| 3 Compare two cases | Three blanks → Next. Don't tap the chips (they add words). | When: `a hemisphere is tilted toward the Sun` · then: `it has summer` · because: `the noon Sun is higher in the sky` | Preview: *"When a hemisphere is tilted toward the Sun, it has summer, because the noon Sun is higher in the sky."* |
| 4 Stress test | Tap the **right** prediction on each card: (1) *It would mostly vanish…* (2) *June brings the longest days…* (3) *In June, the Sun stays up about 24 hours…*. Don't add the suggested piece. Then Next. | (no typing) | Cards 1-2: **✓ Your rule covered this.** Card 3 (Utqiagvik, 71° N): **Your rule didn't cover this**, "leaves out what controls daylight length", with **+ add to your rule: near a pole, tilt can keep the Sun above or below the horizon** |
| 5-7 Draw, Tell it apart, Carry it over | **Next** on each (skip) | (optional, recorded) Tell it apart: `Distance barely changes; in January the north is tilted away from the Sun, so it is winter there and summer in the south.` Carry it over: `A flashlight aimed straight down makes a small bright spot; tilt it and the same light spreads over a bigger, dimmer patch.` | — |
| 8 What you caught | Leave it on screen | — | *Summer is when Earth is closer* + the fix; "Stress test: 2 of 3 cases survived"; "Sketch: skipped" (honest) |

**Orgo tab:** `https://onionskin.study/?learn=sn2-reaction&demo=1`, guess `the nucleophile hits the carbon from the back and kicks the leaving group out in one step` (recorded). Then *Build ethanol*: *add carbon*, *add hydrogen* ×5. The 5th H has no room and lands loose; **drag it onto the carbon** (keyboard: Enter on the H, then Enter on the C) → **"A carbon with 5 bonds"** → Undo.

## The 1:45 talk

**A** speaks, **B** drives. Both learn both roles.

| Time | Who | Say / do |
|---|---|---|
| 0:00 | A | "Quick question before we show you anything: **why is it hotter in summer?**" Let them answer. Most say "Earth is closer to the Sun." |
| 0:10 | A | "That wrong idea survives school because nobody made you **test it**. Now an AI hands you the right answer in a second, and a week later you'd still guess wrong. In a PNAS study, students who leaned on a chatbot scored **17% worse** once it was gone." |
| 0:25 | A | "Onionskin works the other way around: **you do the thinking**, the AI checks it. Type any topic and it builds a short lesson where your guess gets tested against reality." |
| 0:30 | B | Step 1 (paste, or type the judge's own answer: live, ~4 s). "It starts with your guess, and it recognizes the classic wrong idea: **'summer is when Earth is closer.'**" |
| 0:40 | B | Step 2. "You place your guess in **pencil**, reality draws on top in **ink**, and the gap is the lesson. That curve is **computed in code**, not written by the AI." |
| 0:52 | B | Step 3. "Two cases side by side: **same distance from the Sun, opposite seasons**. So you write a rule." |
| 1:00 | B | Step 4. "Then we push your rule to **extremes**. No tilt: covered. Chicago: covered. Alaska, 71° north: **it misses**. The Sun there is low in June but never sets. It tells you **the one piece your rule is missing**." Then Next ×3. |
| 1:15 | A | Point at the why rail. "Every step you just saw is a **published learning-science result**, and the reason is beside every screen." |
| 1:25 | A | "Some choices are about what we **left out**: no points, no streaks, no leaderboard. Across 128 studies, expected rewards **lowered** people's interest in the task itself. Points change your goal from **understanding** to **scoring**." |
| 1:38 | A | Done card. "It ends by **naming the wrong idea you started with**, and keeps it in your notebook. The AI checks, code keeps the numbers true, and you do the thinking." |
| 1:45 | A | "What would you like to try?" **Stop talking.** Offer the Orgo tab, or typing their own topic ("it takes one to two minutes to build"). |

## 60-second cut

1. **0:00 A:** "Why is it hotter in summer? Most people say we're closer to the Sun."
2. **0:08 B:** Step 1 → names the misconception.
3. **0:18 B:** Step 2 → "Pencil is you, ink is reality, computed in code."
4. **0:30 B:** Steps 3-4 → card 3 misses at 71° north.
5. **0:45 A:** "Every step is a learning-science result, and there are no points, on purpose. The AI checks, code keeps the numbers true, you do the thinking." Stop.

## Short answers to likely questions

1. **"I could ask ChatGPT to quiz me."** "You could, if you already know how to teach yourself and don't skip ahead when it gets hard. Onionskin is the lesson a learning scientist would design, built so you can't fudge it. The numbers can't be talked out of it: they come from code, and the grader keeps its verdict under pushback. It goes after your specific wrong idea, with the misconceptions and extreme cases already chosen. And you work it with your hands: draw, build, drag."
2. **vs Khan Academy / Brilliant:** "Those are hand-authored. Type any topic and you get the same eight research-backed steps, starting from your wrong idea, with no streaks."
3. **Does it work?** "No recorded user tests yet. Every step is a published effect, and the app cites it. A pre/post test is next."
4. **How it's built:** the paragraph in SOURCE_OF_TRUTH §5: Codex CLI on our server writes lessons and grades under a fixed contract; graphs only ship if code recomputes every number.
5. **Did you use AI to build it?** "We made the decisions; the agents wrote most of the code. They reviewed each other's PRs under rules we set, and we tested the live site."
6. **Wrong grading?** "It can happen. That's why every number in a graph is computed by code, never by the model."
7. **No points, won't people quit?** "Rewards change what people come back for. Spaced review brings them back, and the notebook is built for it."
8. **Who's it for?** "A college STEM student the week before an exam." One person, not "everyone".

**Say this, not this:** see SOURCE_OF_TRUTH §7. In particular: "Codex CLI on our server" (not "the OpenAI API"), "every number in a graph is computed by code" (not "every answer is checked by code"), and "No recorded user tests yet".

## Fallbacks

| Breaks | Do | Say |
|---|---|---|
| Replies take ~5 s (#318 not deployed, or a typed answer) | Keep talking over the wait | "This one's live." |
| API down | The 10 reviewed topics still open; graded steps show an offline check | "The server's down, but the lesson still runs." |
| 5th-bond drag fails | Keyboard: Enter on the loose H, Enter on the C; or skip orgo | — |
| Site down | Backup video on a phone | "Here's the two-minute cut." |

Don't type a brand-new topic during the 3 minutes (1 to 2.5 minutes to build). If a judge asks, start it, keep demoing, and come back.
