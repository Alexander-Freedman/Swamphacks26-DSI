# Pitch: the live 3:00, the 1:30, and judge Q&A

**Status:** rewritten Sat Oct 17 ~1 PM for the direction update (NOTES.md, Sat ~12:15 PM, #185). Replaces the old candidate drafts (hazard radar etc., dropped Fri ~9:50 PM) and supersedes the open pitch PR #123 (its Q&A and sourced talking points are carried over here). The screens and clicks come from [docs/demo-script.md](demo-script.md): where they differ, demo-script.md wins for what's on screen and this file wins for the words.

**Headline (say it word for word):**
> **"ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why."**

**The AI story, one breath (use it everywhere):** **the AI builds the simulation; code guarantees the truth; you do the thinking.**
- Honest scope: the three showcase sessions (birthday, coin streak, positive test) are hand-built. The AI builds the simulation for *a topic you type*, through the any-topic engine. Never say the AI built the birthday session.

**Slot:** 3:00 live demo + 1:00 Q&A at our table, expo style ([Devpost rules](https://swamphacks-xii.devpost.com/rules), docs/strategy.md). Judges rank the handful of tables they saw, so the goal is to be the one they remember ([MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)).

**Roles:** **narrator** says the words below and keeps time. **Driver** runs the laptop or hands the judge the trackpad/phone, and takes the technical questions.

**What a judge should get in 30 seconds:** this isn't a chatbot. You guess first, you watch a simulation play out over your own guess, and it names the exact wrong idea you had.

**Voice:** "I" for things I did, "we" for the team. Plain words. No "AI tutor", "platform" or "dashboard" in the opener ([track-entertainment.md](research/track-entertainment.md) §3).

---

## Landing today: confirm before saying
Two beats in this pitch depend on work that is **not merged yet** (Sat ~1 PM). Until each box is ticked on the deployed site, use the fallback line.

- [ ] **Compare screen, birthday** (#181): after the stamp, a second case (shared 4-digit PINs) with the same pair picture; "What's the same about how these work?"; the shared principle in ink. **Fallback:** say the compare line over the B6 card without a screen: "Same thing with 4-digit PINs: about 119 people before two share one. Pairs grow faster than people."
- [ ] **Compare screens, coin + positive** (#182, #183). Only needed for the "every session has one" claim. **Fallback:** "the birthday session has one; the others are landing."
- [ ] **Engine v4: a typed topic becomes a runnable model** (#179 API, #184 round player): widget + parameters + extremes + named misconception, truth computed in code, honest "no runnable model" when nothing fits. **Fallback:** the any-topic beat plays a **reviewed** chip and the narrator says "for a typed topic the AI builds this as a spec; here's one we've hand-checked."
- [ ] **Pre-built engine-v4 set** (#180, 20-30 hand-checked topics served cached). **Fallback:** the 10 reviewed extras already live (`data/rounds/extra/`, PR #108).
- [ ] **v4 latency on Vultr re-measured** (#179 trial). Until then, say no number for v4 speed. The only measured live number is the old engine's 5.5 s smoke test (below).

Already live on main / the deployed site (checked Sat ~1 PM): the three sessions (`web/src/sessions/birthday|coin|positive`), the notebook, the "Try any topic" box with hand-checked chips (`web/src/components/AnyTopic.tsx`), the "How it works" drawer + backend dot (#156), and the API on Vultr (`/api/health` → ok). The help chat is **API only** (no panel in `web/src` yet): don't demo it.

---

## Numbers we say out loud (only these)
Same table as docs/demo-script.md. Anything not here doesn't get said.

| Claim | Value | Source |
|---|---|---|
| People for a 50% chance two share a birthday | **23 → 50.7%** | computed: 1 − ∏(365−i)/365, i = 0..22 = 0.5073 |
| Pairs among 23 people | **253** | computed: C(23,2) |
| 57 people | **99.0%** | computed: same formula, n = 57 → 0.9901 |
| Someone in a room of 23 shares *my* birthday | **5.9%** | computed: 1 − (364/365)^22 = 0.0586 |
| Compare case: 4-digit PINs, people for a 50% chance two share one | **119** (50.6%) | computed: 1 − ∏(10000−i)/10000, i = 0..118 = 0.5058 (matches #181's plan). **Say it only if #181's screen shows this number.** |
| What people tend to guess | "about half of 365" | [Live Science](https://www.livescience.com/what-is-birthday-paradox); a teaching observation, **not a survey** |
| 100 fair coin flips | longest run averages **6.98**; a run of 5+ in **97%** | exact DP, [showcase-facts.md](research/showcase-facts.md) |
| Positive test (1% have it, 90% caught, 9% false alarms) | **9.2%** | computed: 0.009 / (0.009 + 0.99 × 0.09) = 0.0917 |
| Doctors on a similar case | about 95 of 100 guessed ~75%; answer 7.7% | [APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care); secondary source, primary **unverified** |
| Watching a demo vs predicting first | watchers understood it no better than people who never saw it; predictors did significantly better | [Crouch et al. 2004](https://doi.org/10.1119/1.1707018), [learning-science.md](research/learning-science.md) §7 |
| Comparing two cases | comparing two cases gave "a marked advantage" in transfer over studying the same two cases separately (novice negotiators, 3 studies) | [Gentner, Loewenstein & Thompson 2003](https://doi.org/10.1037/0022-0663.95.2.393), abstract ([Kellogg summary](https://www.kellogg.northwestern.edu/academics-research/research/detail/2003/learning-and-transfer-a-general-role-for-analogical-encoding)). The 2003 abstract gives **no multiplier** |
| "Nearly three times" | students who compared two cases were "nearly three times more likely" to use the strategy in a later negotiation than students who got the cases separately | [Loewenstein, Thompson & Gentner 1999](https://kellogg.northwestern.edu/faculty/research/detail/1999/analogical-encoding-facilitates-knowledge-transfer-in-negotiation?p=1), *Psychonomic Bulletin & Review* (abstract). **Only say "three times" with this 1999 citation, never as the 2003 paper.** One study, business students, negotiation: say it as that |
| Live generation on the Vultr API (old engine) | **5.5 s** for one topic (2 curve items, 1 dropped by checks) | our own smoke test, NOTES.md Sat ~12:10 PM. **One run.** Not a v4 number |
| Typed-topic generation (old engine, before Vultr) | 24 of 25 topics delivered, median 27 s, p90 51 s | our own 25-topic trial, NOTES.md Sat ~12:10 AM. **Small sample.** Use only to explain why the demo uses the pre-built set |
| Reviewed extra topics | **10** hand-checked rounds, served with no model call | `data/rounds/extra/`, PR #108 |
| First blind-check trial | of 60 calls, 29 were server errors and about 4 usable, while every report said "checked" | our own trial, PR #96 |
| Free-tier budget | Flash-Lite: 500 requests/day, 15/min | [gemini.md](research/gemini.md) TL;DR |
| Points can backfire (one study) | 16-week course, badges + leaderboard → lower motivation and final-exam scores | [Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019) (full text not read; secondary summaries) |
| Session length | 2-3 min | **design target** (docs/experience.md), **unverified** until user tests time it |

Never say: "proven to make you learn faster", "permanently fixes misconceptions", "the more you play the more you learn", "3x better learning" (no source for that), or that a typed topic is "built live in seconds" until v4 latency is measured ([learning-science.md](research/learning-science.md) "Three claims we must NOT make").

---

## 1. The live 3:00

About 400 spoken words with room for the judge's hands. Times are targets; rehearse with a stopwatch (demo-script.md, rehearsal checklist).

| Time | On screen (driver) | Narrator says |
|---|---|---|
| **0:00-0:15**<br>**Hook** | Birthday session open on **B1 Guess** (`?session=birthday`). Driver hands over the trackpad/phone. **Judge drags and locks.** | "Quick one before I explain anything. How many people do you need in a room before it's a coin flip that two of them share a birthday? Drag it, pick how sure you are, lock it in. No changing it." |
| **0:15-0:35**<br>**Headline, while the room fills** | **B2 Fill the room.** Driver holds **Add a person** (seeded run). Pair lines web up; counter **people · pairs**. At 23: **23 · 253**. A match circles; the room shakes. | "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why. So watch the lines, not the people. Every line is a pair that could match. 23 people already make 253 pairs." |
| **0:35-0:50**<br>**Your model** | **B4 Draw your curve.** **Judge draws** in pencil. | "Now draw how you think the chance grows as the room fills. There's no wrong drawing. It's your model." |
| **0:50-1:05**<br>**Ink over pencil** | **B5 Reveal.** The ink S-curve draws in over the judge's pencil; highlighter shades the gap. Driver drags 2 → 23 → 57. | "Pencil is you. Ink is reality. The yellow is where your model broke. 23 people, 50.7%. 57, 99%." |
| **1:05-1:15**<br>**Mistake named** | **B6 Stamp + card**, quoting the judge's number: *you* get matched 5.9%, *any two* 50.7%. | "And it names the wrong idea. Most people picture someone matching *them*. That's 5.9%. Any two people: 50.7%." |
| **1:15-1:40**<br>**Pull out the structure** *(landing today, #181)* | **Compare screen:** shared 4-digit PINs next to the birthday room, same pair picture. "What's the same about how these work?" **Judge says or picks it.** The shared principle inks in. | "Now a case that looks nothing like it: 4-digit PINs. How many people before two share one? About 119, out of ten thousand PINs. What's the same? … Pairs grow way faster than people. Putting two cases side by side is how you pull out the structure: in a negotiation study, people who compared two cases transferred the idea markedly better than people who studied the same cases one at a time." *(Fallback if the screen isn't live: say the PIN line over the B6 card.)* |
| **1:40-2:15**<br>**Any topic → a runnable model** *(engine v4 landing today, #179/#184)* | Home → **Try any topic** → **judge types a topic**, or taps a chip from the pre-built set. A runnable model opens: a widget with a knob, a guess prompt, extremes to try, a named misconception. | "That was hand-built. Now type anything. The AI picks one of our simulations and fills it in: the knobs, the extremes to try, the mistake people make. It never writes the answer: our code computes it from the model. If nothing fits, it says so instead of faking a chart." *(Before v4 is live: tap a **reviewed** chip and say "the AI builds these as a spec; this one we've hand-checked.")* |
| **2:15-2:40**<br>**How it works, one breath** | Open the **How it works** drawer; point at the backend dot. | "So: the AI builds the simulation, code guarantees the truth, you do the thinking. Every number you saw was computed by formula or exact count, never by a model. The backend runs on one Vultr server; Gemini on the free tier, rate-limited, with a daily cap." |
| **2:40-3:00**<br>**Close** | Session end: **"Saved to your notebook. Come back tomorrow for a remix."** Notebook shows the judge's mistake as *caught*. | "No points, no streak to lose: one semester-long study found badges and a leaderboard lowered motivation and exam scores. The reward is the moment your guess meets reality. Tomorrow it comes back with new numbers until you've busted it. ChatGPT tells you the answer. Onionskin shows you why you were wrong. Questions?" **Stop talking.** |

**Branches:**
- **Judge nails the birthday guess:** "You're one of the few. Draw the curve anyway, that's where people miss."
- **Judge is fast (at 1:40 early):** coin streak C1-C2 before any-topic: "Fake 20 coin flips. … Yours switches back and forth. Real coins clump: in 100 real flips you get a run of five or more 97% of the time."
- **Judge is slow:** skip the judge typing; tap a pre-built chip. Never cut the compare beat or the headline.
- **Live generation slow (>10 s) or errors:** tap a pre-built chip (#180 set, else the 10 reviewed extras) and say "this one's from our checked set." Never wait on a spinner at the table.

---

## 2. The 1:30 version
For a judge queue or a rushed judge. Birthday, one compare line, one any-topic line.

| Time | On screen | Narrator says |
|---|---|---|
| **0:00** | B1 Guess; hand over the trackpad. Judge locks. | "Before I explain anything: how many people for a coin-flip chance two share a birthday? Lock it in." |
| **0:10** | B2: hold **Add a person** to 23. | "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why. 23 people, 253 pairs." |
| **0:25** | B4 → B5: judge draws; ink over pencil, gap shaded; slider 23 → 57. | "Pencil is you, ink is reality, yellow is where your model broke. 23 people, 50.7%. 57, 99%." |
| **0:45** | B6: stamp + "It's about MY birthday" card. | "It names the wrong idea: matching *you* is 5.9%, any two is 50.7%." |
| **0:55** | Compare screen *(if live; else say it over the card)*. | "Same structure, different world: 4-digit PINs, about 119 people. Pairs grow faster than people." |
| **1:05** | Home: "Try any topic". | "Type any topic and the AI builds the simulation, code computes the truth, and you do the thinking. No points: it comes back tomorrow with new numbers." |
| **1:30** | | Stop. |

---

## 3. Judge Q&A prep (16)
Each answer is ≤ 3 sentences. Driver takes the technical ones (2, 4, 6, 7, 9, 12), narrator the rest. If a question isn't here: one sentence, say what we don't know, stop.

1. **"How is this different from a chatbot? Why not just ask ChatGPT?"**
   "A chatbot explains, and explaining is the part that doesn't stick: in a physics classroom study, students who only watched a demo understood it no better than students who never saw it, and students who predicted first did significantly better ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). Here you commit a guess, a simulation runs on top of it, and your wrong idea gets named. The AI builds the simulation, code guarantees the truth, and you do the thinking."

2. **"So where is the AI, exactly?"**
   "For a typed topic, Gemini picks one of our simulation widgets and fills in a spec: the knobs, the extremes to try, the guess prompt and the named misconception, validated against a schema. The true answer is computed in code from that spec, never written by the model, and if no widget fits it says so and offers the nearest checked topic. The three showcase sessions are hand-built; the help chat is on the API but not in the app yet." **[Engine v4 landing today (#179): until it's live, say "it fills a round spec" and show a reviewed chip.]**

3. **"Why not just watch a video?"**
   "Same reason as the chatbot: watching doesn't change the model in your head ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). A video can't keep your guess on screen next to the truth. Here your own pencil line is what reality draws over."

4. **"What about wrong AI answers?"**
   "In the three sessions there's no model at all: every number is a formula or an exact count computed in your browser. For typed topics the model writes a spec and our code computes the truth, so the model never gets to state the answer. In our first trial a blind second-model check mostly failed while still saying 'checked' (about 4 usable calls out of 60, PR #96), so I fixed it to report honestly, and nothing gets labelled *reviewed* unless a person checked it."

5. **"What's the compare screen for?"** *(only if live)*
   "After the reveal you get a second case that looks different but works the same, like birthdays and 4-digit PINs, and you name what they share. Comparing two cases side by side helps people pull out the principle: novice negotiators who compared two cases transferred it markedly better than those who studied the same cases separately ([Gentner, Loewenstein & Thompson 2003](https://doi.org/10.1037/0022-0663.95.2.393)). In an earlier study by the same group, comparers were nearly three times more likely to use the strategy ([Loewenstein, Thompson & Gentner 1999](https://kellogg.northwestern.edu/faculty/research/detail/1999/analogical-encoding-facilitates-knowledge-transfer-in-negotiation?p=1))."

6. **"How fast is any topic?"**
   "A topic we've already checked comes back instantly with no model call. A fresh one on our Vultr server took 5.5 seconds in one smoke test Saturday, on the previous engine (NOTES.md); I haven't measured the new engine yet, so for the table I use the pre-built set." **[Replace with the #179 trial numbers once they're in docs/research/gemini.md.]**

7. **"What if a topic can't be simulated, like history?"**
   "Then it doesn't pretend: if no widget fits or the spec fails validation, it tells you there's no runnable model for that and offers the nearest checked topic. An honest 'no' beats a fake chart." **[Engine v4 behavior: confirm live. Before v4, typed topics fall back to a plain labelled round.]**

8. **"How do you know it actually teaches?"**
   "We don't have a learning study, and we won't claim one from a weekend. The loop is built on well-replicated findings: predicting first ([Crouch 2004](https://doi.org/10.1119/1.1707018)), confident mistakes being the ones people correct best ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)), and comparing cases ([Gentner et al. 2003](https://doi.org/10.1037/0022-0663.95.2.393)). From our user tests Saturday: **[TBD from docs/user-testing.md. Real results only.]**"

9. **"Where's Gemini, and what does it cost to run?"**
   "Gemini fills typed-topic specs and powers a hint-only help endpoint, on the free tier, $0: Flash-Lite allows 500 requests a day ([gemini.md](research/gemini.md)). The key lives only on our one Vultr server, and every public endpoint has a per-IP limit and a hard daily cap. When a cap is hit the sessions keep working, because they compute in the browser and don't need the backend."

10. **"Why no points or streaks? Isn't that how Duolingo keeps people?"**
    "Points bring people back, but one 16-week study found badges and a leaderboard lowered motivation and final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)), and a meta-analysis of 128 experiments found expected rewards undermine the motivation you started with ([Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf)). So the reward is the feedback: the reveal, your wrong idea named, then busted. You still get a reason to come back: a notebook of caught and busted ideas and a remix tomorrow, with nothing to lose."

11. **"What's creative or entertaining about a probability lesson?"**
    "It's a toy before it's a lesson: you bet, you fill a room and watch the pair lines web up, you draw your own curve, the truth inks in over it and a stamp lands. The paper we built on is literally titled 'Classroom demonstrations: learning tools or entertainment?' ([Crouch 2004](https://doi.org/10.1119/1.1707018)), and the answer was entertainment, unless you predict first. So we made the prediction the game."

12. **"What did you build this weekend vs before?"**
    "The idea and the learning-science reading are from before, which the rules allow; every line of code was written after hacking opened Friday 8:30 PM ([rules](https://swamphacks-xii.devpost.com/rules)). This weekend: the three sessions end to end, the notebook, the any-topic engine and its checks, the reviewed topics, the help API, the answer store and the Vultr deploy. The commit history shows it."

13. **"What about privacy and data?"**
    "You play as a guest with no account; your notebook lives in your browser, and the answers we store are keyed to a random session id, with no name or email. Typed topics go to Gemini's free tier, and Google's terms say free-tier content may be used to improve their products and read by human reviewers ([Gemini API terms](https://ai.google.dev/gemini-api/terms), checked Oct 17), so don't type personal info into the topic box."

14. **"Is it accessible?"**
    "Pencil and ink are never told apart by color alone: pencil is dashed, ink is solid, and both carry a hand label (docs/experience-look.md). Reduced-motion users get end states instead of animations, and we screenshot every screen at desktop and phone widths. Honest gap: drawing your curve isn't screen-reader friendly yet, and we haven't done a real accessibility audit."

15. **"Who is this for?"**
    "Anyone who 'knows' a fact but would still guess wrong when the numbers change, starting with students in stats, physics and intro econ. The sharp version is doctors: about 95 of 100 guessed around 75% for a positive screening test where the answer was 7.7% ([APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care), secondary source). Two or three minutes at a time, on a phone."

16. **"What's next? Is there a business?"**
    "More widgets so more typed topics become runnable models, and a remix schedule that brings each unbusted mistake back on growing gaps, since spaced retrieval is about the best-established finding in learning science ([learning-science.md](research/learning-science.md)). We haven't validated a business, so I won't pretend; the obvious paths are a free app for students and a classroom mode where a room guesses together."

**If asked something we can't answer:** "I don't know yet. Here's how I'd find out: …" One sentence, then stop.

---

## Feedback is the reward (the talking point, kept sourced)
**One line, used at the 3:00 close and in Q&A 10:**
> "Everyone gamifies learning with points. The research says points can backfire: in a semester-long class, badges and a leaderboard *lowered* motivation and final-exam scores. So we made the feedback the reward: you see your own wrong idea get named, and then you bust it."

**Why this exact wording:** the fair claim is **"points can backfire"**, not "points always make people learn worse". Gamification's average effects are small and depend on the design ([Sailer & Homner 2020](https://doi.org/10.1007/s10648-019-09498-w), [learning-science.md](research/learning-science.md) §15), so we cite one specific semester study and the reward meta-analysis instead of a blanket claim a judge could poke.

**Sources:**
- [Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019): 16 weeks, badges + leaderboard vs the same course without → lower intrinsic motivation, satisfaction and final-exam scores. *(Full text not read; from secondary summaries, e.g. this [critical review table](https://educationaltechnologyjournal.springeropen.com/articles/10.1186/s41239-017-0042-5/tables/13).)*
- [Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf): 128 experiments. Expected tangible rewards undermine intrinsic motivation; positive, informational feedback enhances it.
- [Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116): effortful learning feels worse but works better. Useful if a judge says "it felt hard".

## Compare beat: what the source actually says (checked Oct 17)
- **Gentner, Loewenstein & Thompson 2003**, "Learning and transfer: A general role for analogical encoding", *Journal of Educational Psychology* 95(2), 393-408 ([DOI](https://doi.org/10.1037/0022-0663.95.2.393), [Kellogg abstract page](https://www.kellogg.northwestern.edu/academics-research/research/detail/2003/learning-and-transfer-a-general-role-for-analogical-encoding)). Three studies with novices learning negotiation strategies: comparing two cases showed "a marked advantage" over studying the same two cases separately, and more comparison support meant more transfer in a face-to-face negotiation. **The abstract gives no "3x" figure.** Full text not read: effect sizes **unverified**.
- **Loewenstein, Thompson & Gentner 1999**, "Analogical encoding facilitates knowledge transfer in negotiation", *Psychonomic Bulletin & Review* 6(4), 586-597 ([Kellogg abstract page](https://kellogg.northwestern.edu/faculty/research/detail/1999/analogical-encoding-facilitates-knowledge-transfer-in-negotiation?p=1)): business students who compared two cases were "nearly three times more likely" to use the strategy in their own negotiations. **This is where "3x" comes from.**
- So: NOTES.md and #181 say "≈3× transfer, Gentner, Loewenstein & Thompson 2003". On anything public, cite the 2003 paper as "a marked advantage" and, if we want the number, say "nearly three times" with the 1999 citation. Both are negotiation studies with business students, not probability; say "in a negotiation study".

---

## AI-tools disclosure
> **PLACEHOLDER, worded by me before submit.** SwampHacks XII requires disclosing AI/LLM tool use ([rules](https://swamphacks-xii.devpost.com/rules)). If a judge asks, use the same wording as the Devpost section. Keep it separate from the Gemini/Gemma models the app calls at runtime.
