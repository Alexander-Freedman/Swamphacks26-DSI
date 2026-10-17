# Pitch: the live 3:00, the 1:30, and judge Q&A

**Status:** rewritten Sat Oct 17 for the visual sessions. Replaces the old candidate drafts (hazard radar etc., dropped Fri ~9:50 PM, NOTES.md). The screens and clicks come from [docs/demo-script.md](demo-script.md); where they differ, demo-script.md wins for what's on screen and this file wins for the words. Working name **mm** until @luanamaldaner picks one (docs/story.md); swap it in everywhere once it's in NOTES.md.

**Slot:** 3:00 live demo + 1:00 Q&A at our table, expo style ([Devpost rules](https://swamphacks-xii.devpost.com/rules), docs/strategy.md). Judges rank the handful of tables they saw, so the goal is to be the one they remember ([MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)).

**Roles:** **narrator** says the words below and keeps time. **Driver** runs the laptop or hands the judge the trackpad/phone, and takes the technical questions.

**What a judge should get in 30 seconds:** you guess first, you watch reality play out over your own guess, and it names the exact wrong idea you had.

**Voice:** "I" for things I did, "we" for the team. Plain words. No "AI tutor", "platform" or "dashboard" in the opener ([track-entertainment.md](research/track-entertainment.md) §3).

---

## Numbers we say out loud (only these)
Same table as docs/demo-script.md. Anything not here doesn't get said.

| Claim | Value | Source |
|---|---|---|
| People for a 50% chance two share a birthday | **23 → 50.7%** | computed: 1 − ∏(365−i)/365, i = 0..22 = 0.5073 (re-run for this doc) |
| Pairs among 23 people | **253** | computed: C(23,2) |
| 57 people | **99.0%** | computed: same formula, n = 57 → 0.9901 |
| Someone in a room of 23 shares *my* birthday | **5.9%** | computed: 1 − (364/365)^22 = 0.0586 |
| What people tend to guess | "about half of 365" | [Live Science](https://www.livescience.com/what-is-birthday-paradox); a teaching observation, **not a survey** |
| 100 fair coin flips | longest run averages **6.98**; a run of 5+ in **97%** | exact DP, [showcase-facts.md](research/showcase-facts.md) |
| Positive test (1% have it, 90% caught, 9% false alarms) | **9.2%** | computed: 0.009 / (0.009 + 0.99 × 0.09) = 0.0917 |
| Doctors on a similar case | about 95 of 100 guessed ~75%; answer 7.7% | [APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care); secondary source, primary **unverified** |
| Watching a demo vs predicting first | watchers understood it no better than people who never saw it; predictors did significantly better | [Crouch et al. 2004](https://doi.org/10.1119/1.1707018), [learning-science.md](research/learning-science.md) §7 |
| Points can backfire (one study) | 16-week course, badges + leaderboard → lower motivation and final-exam scores | [Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019) (full text not read; from secondary summaries; see "Feedback is the reward" below) |
| Typed-topic generation | 24 of 25 topics delivered, median **27 s**, p90 51 s | our own 25-topic trial, NOTES.md Sat ~12:10 AM. **Small sample.** |
| Reviewed extra topics | **10** hand-checked rounds, served with no model call | `data/rounds/extra/`, PR #108 |
| First blind-check trial | of 60 calls, 29 were server errors and about 4 usable, while every report said "checked" | our own trial, PR #96 |
| Free-tier budget | Flash-Lite: 500 requests/day, 15/min | [gemini.md](research/gemini.md) TL;DR |
| Help chat limits | 150/day total, 10 per IP per 10 min (defaults) | computed from `api/app/help.py` (`HELP_DAILY_CAP`, `HELP_PER_IP`, `HELP_PER_IP_WINDOW_S`) |
| Session length | 2-3 min | **design target** (docs/experience.md), **unverified** until user tests time it |

Never say: "proven to make you learn faster", "permanently fixes misconceptions", "the more you play the more you learn", or that a typed topic is "built live in seconds" ([learning-science.md](research/learning-science.md) "Three claims we must NOT make"; demo-script.md).

---

## 1. The live 3:00

About 400 spoken words at a relaxed pace, with room for the judge's hands. Times are targets; rehearse with a stopwatch (demo-script.md, rehearsal checklist). One change from demo-script.md: the story line moves from 0:00 to 0:15 so the judge's guess is the first thing that happens.

| Time | On screen (driver) | Narrator says |
|---|---|---|
| **0:00-0:15**<br>**Hook** | Birthday session already open on **B1 Guess** (`?session=birthday`): "How many people for a 50% chance two share a birthday?" Big slider 2-366 + confidence. Driver hands over the trackpad/phone. **Judge drags and locks.** The pencil tick lands. | "Quick one before I explain anything. How many people do you need in a room before it's a coin flip that two of them share a birthday? Drag it, pick how sure you are, lock it in. No changing it." |
| **0:15-0:40**<br>**Problem, while the room fills** | **B2 Fill the room.** Driver holds **Add a person** (seeded run). People drop onto a 365-day strip, a thin line for every pair, counter **people · pairs**. At 23: **23 · 253**. A match circles in highlighter and the room shakes. | "Flashcards test whether you can *recall* an answer. They don't test whether you can *run* the idea in your head. Most of us have heard of this one and still guess wrong. So watch the lines, not the people. Every line is a pair that could match. 23 people already make 253 pairs." |
| **0:40-0:55**<br>**Your model** | **B4 Draw your curve.** Empty axes, people × chance. **Judge draws** in pencil. | "Now draw how you think the chance grows as the room fills. There's no wrong drawing. It's your model." |
| **0:55-1:15**<br>**The product moment: ink over pencil** | **B5 Reveal.** The ink S-curve draws in **over the judge's pencil line**; highlighter shades the gap. Driver drags group size 2 → 23 → 57. | "Pencil is you. Ink is reality. The yellow is the gap, the exact place your model broke. 23 people, 50.7%. 57 people, 99%. Your guess never disappears. Reality moves, your model stays put, and you see where they part." |
| **1:15-1:30**<br>**Mistake named** | **B6 Stamp + card.** The stamp drops. Card **"It's about MY birthday"**, quoting the judge's number: *you* get matched 5.9%, *any two* 50.7%. | "And it names the wrong idea, using your number. Most people are picturing someone matching *them*. That's 5.9%. Any two people: 50.7%." |
| **1:30-2:00**<br>**Why it's entertainment** | Home → **Coin streak** C1-C2. **Judge taps 20 made-up flips**; 20 real flips deal in under them, longest runs underlined. *(If coin streak isn't live: say the second half of the line over Home. Never show a mockup as the app.)* | "Second one, thirty seconds: fake 20 coin flips. … Yours switches back and forth. Real coins clump. In 100 real flips you get a run of five or more 97% of the time. That's the whole idea: it's a toy first. You bet, you poke it, you watch it move, a stamp lands. The fun *is* the lesson. Just watching a demo teaches surprisingly little; predicting first is what makes it teach." |
| **2:00-2:35**<br>**How it works, one breath** | Home → "Try any topic" → a **reviewed** chip (never a fresh live generation at the table). The round plays with its label visible. Driver points at the label. | "How it works. Every number in these sessions is computed in the browser, by formula or exact count, never by a model. You can also type any topic. Ten we've hand-checked come back instantly. For anything else, Gemini writes a spec, our code computes the answer, and where code can't, a second model answers blind and disagreements get dropped. Those say *auto-checked*, not *reviewed*. Tiger Data stores the answers so you can see how the room guessed. And there's a help chat on Gemini's free tier, rate-limited, that hints before you lock in and never gives the answer away." |
| **2:35-3:00**<br>**Close** | Session end: **"Saved to your notebook. Come back tomorrow for a remix."** The notebook shows the judge's mistake as *caught* (pencil). | "No points, no streak to lose. One semester-long study found badges and a leaderboard lowered motivation and exam scores. So the reward is the moment your guess meets reality. Tomorrow it comes back with new numbers, until you've busted it. Guess in pencil, truth in ink. Questions?" **Stop talking.** |

**Branches** (from demo-script.md):
- **Judge nails the birthday guess:** "You're one of the few. Draw the curve anyway, that's where people miss."
- **Judge is fast (reaching 1:30 early):** add positive test P1-P3 before "how it works": "You test positive for something 1% of people have. The test catches 90%. Chance you have it? … 9 of about 98 positives are real: 9.2%. On a case like this, about 95 of 100 doctors guessed around 75%."
- **Judge is slow:** cut the coin streak to one line ("coin streaks and medical tests work the same way") and go to "how it works".

**Say only what's live.** Before each judging block, check these on the deployed site and drop the clause if it isn't there:

| Clause | Depends on | Status (Sat morning) |
|---|---|---|
| Coin streak beat | coin streak session (#81) | in progress; only `web/src/sessions/birthday/` is on main |
| Positive test branch | positive test session (#82) | in progress |
| "Ten we've hand-checked come back instantly" | reviewed extras (PR #108) + the web "try any topic" box | API merged; check the web box |
| "a second model answers blind" | blind check (PR #96) | fixed to report honestly; pass rate on real topics **not re-measured** yet |
| "Tiger Data stores the answers… how the room guessed" | `TIGER_DATABASE_URL` set + the room view | SQLite until the URL arrives (NOTES.md Sat ~12:20 AM). If Tiger isn't live, say "we store the answers" |
| "help chat" | `POST /api/help` (PR #105) + the panel + a deployed backend | API merged; panel and backend deploy pending. Cut line: a static "stuck?" hint (build-plan.md) |
| Notebook end screen | collection (#67) | check |

---

## 2. The 1:30 version
For a judge queue or a rushed judge. Birthday only, plus one sentence for the rest.

| Time | On screen | Narrator says |
|---|---|---|
| **0:00** | B1 Guess; hand over the trackpad. Judge locks. | "Before I explain anything: how many people for a coin-flip chance two share a birthday? Lock it in." |
| **0:10** | B2: hold **Add a person** to 23. | "Flashcards check recall, not whether you can run the idea. Watch the lines: 23 people, 253 pairs." |
| **0:25** | B4: judge draws a curve. | "Draw how you think the chance grows." |
| **0:40** | B5: ink over pencil, gap shaded; slider 23 → 57. | "Pencil is you, ink is reality, yellow is where your model broke. 23 people, 50.7%. 57, 99%." |
| **0:55** | B6: stamp + "It's about MY birthday" card. | "And it names the wrong idea: matching *you* is 5.9%, any two is 50.7%." |
| **1:05** | Home: the session cards + "Try any topic". | "Same loop for coin streaks and medical tests. Every number is computed, typed topics are labelled auto-checked, and there are no points: the reward is your guess meeting reality, and it comes back tomorrow with new numbers. Guess in pencil, truth in ink." |
| **1:30** | | Stop. |

---

## 3. Judge Q&A prep (15)
Each answer is ≤ 3 sentences. Driver takes the technical ones (3, 5, 6, 8, 11), narrator the rest. If a question isn't here: one sentence, say what we don't know, stop.

1. **"Why not just watch a video?"**
   "Because watching doesn't change the model in your head: in a physics classroom study, students who only watched a demo understood it no better than students who never saw it, and students who predicted first did significantly better ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). A video can't keep your guess on screen next to the truth. Here your own pencil line is what reality draws over."

2. **"How do you know it actually teaches?"**
   "We don't have a learning study, and we won't claim one from a weekend. The loop is built on well-replicated findings: predicting first ([Crouch 2004](https://doi.org/10.1119/1.1707018)), and confident mistakes being the ones people correct best ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)). From our user tests Saturday: **[TBD from docs/user-testing.md: N of 5 got the rematch right; median session time. Real results only.]**"

3. **"What about wrong AI answers?"**
   "In the three sessions there's no model at all: every number is a formula or an exact count computed in your browser. For typed topics the model never writes the answer; it writes a spec, our code computes the truth, and items where the model's claim disagrees get dropped. Only where code can't compute it does a second model answer blind; in our first trial that check mostly failed while still saying 'checked' (about 4 usable calls out of 60, PR #96), so I fixed it to report honestly, and those rounds say *auto-checked*, not *reviewed*."

4. **"Why no points or streaks? Isn't that how Duolingo keeps people?"**
   "Points bring people back, but one 16-week study found badges and a leaderboard lowered motivation and final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)), and a meta-analysis of 128 experiments found expected rewards undermine the motivation you started with ([Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf)). So the reward is the feedback: the reveal, your wrong idea named, then busted. You still get a reason to come back: a notebook of caught and busted ideas and a remix tomorrow, with nothing to lose."

5. **"How does 'any topic' work, and how fast is it?"**
   "Ten topics we've hand-checked come back instantly with no model call. Anything else goes to Gemini Flash-Lite as structured JSON and then our checks; in our 25-topic trial it delivered 24 with a median of 27 seconds (p90 51 s), a small sample. That's too slow and too plain for the stage (every generated item came out as a number guess, not a visual), so typed topics are a labelled extra and the hand-built sessions are the product."

6. **"What did you build this weekend vs before?"**
   "The idea and the learning-science reading are from before, which the rules allow; every line of code was written after hacking opened Friday 8:30 PM (NOTES.md, Oct 16 7 PM; [rules](https://swamphacks-xii.devpost.com/rules)). This weekend: the birthday session end to end, the coin streak and positive test sessions **[confirm live]**, the generation engine and its checks, the 10 reviewed topics, the help chat API and the answer store. The commit history shows it."

7. **"What's creative or entertaining about a probability lesson?"**
   "It's a toy before it's a lesson: you bet, you fill a room and watch the pair lines web up, you draw your own curve, the truth inks in over it and a stamp lands. The paper we built on is literally titled 'Classroom demonstrations: learning tools or entertainment?' ([Crouch 2004](https://doi.org/10.1119/1.1707018)), and the answer was entertainment, unless you predict first. So we made the prediction the game."

8. **"What about privacy and data?"**
   "You play as a guest with no account; your notebook lives in your browser, and the answers we store are keyed to a random session id, with no name or email. The help chat sends your question and the screen you're on to Gemini's free tier, and Google's terms say free-tier content is used to improve their products and may be read by human reviewers ([Gemini API terms](https://ai.google.dev/gemini-api/terms), checked Oct 17). So the panel should tell you not to type personal info. **[Confirm the panel shows that line before saying this.]**"

9. **"Is it accessible?"**
   "Pencil and ink are never told apart by color alone: pencil is dashed, ink is solid, and both carry a hand label, 'you' and 'real' (docs/experience-look.md). Reduced-motion users get end states instead of animations, slider thumbs are at least 28 px, and we screenshot every screen at desktop and phone widths down to 360 px. Honest gap: drawing your curve isn't screen-reader friendly yet, and we haven't done a real accessibility audit."

10. **"Who is this for?"**
    "Anyone who 'knows' a fact but would still guess wrong when the numbers change, starting with students in stats, physics and intro econ. The sharp version is doctors: about 95 of 100 guessed around 75% for a positive screening test where the answer was 7.7% ([APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care), secondary source). Two or three minutes at a time, on a phone."

11. **"Where's Gemini, and what does it cost to run?"**
    "Gemini writes typed-topic rounds as structured JSON, never the answer, and powers the help chat. It all runs on the free tier, $0: Flash-Lite allows 500 requests a day ([gemini.md](research/gemini.md)), the key lives only on the server, and every public endpoint has a per-IP limit and a hard daily cap (help chat: 150 a day, 10 per IP per 10 minutes, `api/app/help.py`). When a cap is hit the sessions keep working, because they don't need the backend at all."

12. **"How is this different from Quizlet, Brilliant or a chat tutor?"**
    "Quizlet checks recall and chat tutors explain. Here you commit first, reality plays out on top of your guess, and your model stays on screen next to the truth, so you see where it broke. Brilliant is closest, but its courses are long and fixed; this is a few minutes per idea (our design target, not yet timed) and it comes back with new numbers."

13. **"What if a topic can't be visualised, like history?"**
    "Then it doesn't pretend: a typed topic gets a short round with a worked-example stepper or a guess with a sourced answer, labelled auto-checked. The visual sessions are hand-built for ideas where watching it run changes your mind. An honest plain round beats a fake chart."

14. **"What's next?"**
    "More hand-built sessions where a visual makes it click, and a remix schedule that brings each unbusted mistake back on growing gaps, since spaced retrieval is about the best-established finding in learning science ([learning-science.md](research/learning-science.md), design rule 1). The big one is typed topics that build a full visual session, not just a question."

15. **"Is there a business here?"**
    "We haven't validated one, so I won't pretend. The obvious paths are a free app for students and a classroom mode where a teacher's room guesses together and sees its answers next to the truth. Running cost stays low, since the sessions compute in the browser and need no server."

**If asked something we can't answer:** "I don't know yet. Here's how I'd find out: …" One sentence, then stop.

---

## Feedback is the reward (the talking point, kept sourced)
**One line, used at the 3:00 close and in Q&A 4:**
> "Everyone gamifies learning with points. The research says points can backfire: in a semester-long class, badges and a leaderboard *lowered* motivation and final-exam scores. So we made the feedback the reward: you see your own wrong idea get named, and then you bust it."

**Why this exact wording:**
- The fair claim is **"points can backfire"**, not "points always make people learn worse". Gamification's average effects are small and depend on the design ([Sailer & Homner 2020](https://doi.org/10.1007/s10648-019-09498-w), [learning-science.md](research/learning-science.md) §15), so we cite one specific semester study and the reward meta-analysis instead of a blanket claim a judge could poke.
- Where the sources live: learning-science.md §15 has the gamification meta-analysis and the "don't sell it as addictive learning" warning; Hanus & Fox and Deci et al. are in docs/product-spec.md (the "Why" under the no-points decision) and docs/story.md §2. learning-science.md itself doesn't cite Hanus & Fox.

**Sources:**
- [Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019): 16 weeks, badges + leaderboard vs the same course without → lower intrinsic motivation, satisfaction and final-exam scores. *(Full text not read; from secondary summaries, e.g. this [critical review table](https://educationaltechnologyjournal.springeropen.com/articles/10.1186/s41239-017-0042-5/tables/13).)*
- [Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf): 128 experiments. Expected tangible rewards undermine intrinsic motivation; positive, informational feedback enhances it.
- [Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116): effortful learning feels worse but works better (learning-science.md §14). Useful if a judge says "it felt hard".

---

## AI-tools disclosure
> **PLACEHOLDER, worded by me before submit.** SwampHacks XII requires disclosing AI/LLM tool use ([rules](https://swamphacks-xii.devpost.com/rules)). If a judge asks, use the same wording as the Devpost section. Keep it separate from the Gemini/Gemma models the app calls at runtime.
