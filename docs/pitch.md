# Pitch: the live 3:00, the 1:30, and judge Q&A

**Status:** rewritten Sat Oct 17 evening for the team decision of Sat ~6:05 PM: **the demo is the orgo showcase (PR #204) and the calculus level (PR #202, merged)**; typed topic → runnable visual, the three probability sessions and the notebook support it. The screens and clicks come from [docs/demo-script.md](demo-script.md): where they differ, demo-script.md wins for what's on screen and this file wins for the words. Every orgo line is **[if #204 merged]**; until it is, use the "calculus first" order in demo-script.md.

**Headline:** **"See your thinking in layers."** Subline: **"Type any topic. Watch it come alive."**
**Chatbot line (word for word):** **"ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why."**
**The AI story, one breath:** **the AI builds the simulation; code guarantees the truth; you do the thinking.** Honest scope: orgo, calculus and the probability sessions are hand-built; the AI builds the simulation for a topic you type. No betting language.

**Slot:** 3:00 live demo + 1:00 Q&A at our table, expo style ([Devpost rules](https://swamphacks-xii.devpost.com/rules)). Judges rank the handful of tables they saw, so the goal is to be the one they remember ([MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)).

**Roles:** **narrator** says the words below and keeps time. **Driver** runs the laptop or hands the judge the trackpad/phone, and takes the technical questions.

**What a judge should get in 30 seconds:** this isn't a chatbot. You build or draw what you think, the real thing runs on top of it, and it names the exact wrong idea you had.

**Voice:** "I" for things I did, "we" for the team. Plain words.

---

## Numbers we say out loud (only these)
Same table as docs/demo-script.md (sources there). Anything not here doesn't get said.

| Claim | Value | Source |
|---|---|---|
| Ethanol | **C₂H₆O**; dimethyl ether has the same formula | standard; isomer check in `chem.ts` (#204) |
| Oxygen with 3 bonds | **FC = 6 − 2 − 3 = +1** | formal charge = valence − nonbonding electrons − bonds ([Formal charge](https://en.wikipedia.org/wiki/Formal_charge)) |
| Cyanide | − charge on carbon: 4 − 2 − 3 = −1 | computed; [Kolbe nitrile synthesis](https://en.wikipedia.org/wiki/Kolbe_nitrile_synthesis) |
| SN2 | one step, backside attack, inversion | [SN2 reaction](https://en.wikipedia.org/wiki/SN2_reaction), [Walden inversion](https://en.wikipedia.org/wiki/Walden_inversion) |
| Calculus, one rectangle | **7.5** | computed: f(1) × 2.5 = 3 × 2.5 (`web/src/sessions/calculus/math.ts`) |
| Calculus, exact area 1 → 3.5 | **4.57** | computed: F(3.5) − F(1) = 585/128 = 4.5703 |
| Rectangles 10 / 50 / 200 | 4.78 / 4.61 / 4.58 | computed, left-edge Riemann sums |
| Derivative of x² at x = 3 | **6** | computed (2x); use the number on screen |
| "derivative of x squared" build | ~4 s on Vultr, one run (Sat ~4:10 PM); engine v4 local trial median 6.0 s, 10/15 built | video-script.md notes; PR #187. **Never "built live in seconds"** |
| Birthday (only as "more") | 23 → **50.7%** | computed: 1 − ∏(365−i)/365, i = 0..22 |
| Watching a demo vs predicting first | watchers understood it no better than people who never saw it; predictors did significantly better | [Crouch et al. 2004](https://doi.org/10.1119/1.1707018) |
| Points can backfire (one study) | 16-week course, badges + leaderboard → lower motivation and final-exam scores | [Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019) (full text not read) |
| Free-tier budget | Flash-Lite: 500 requests/day, 15/min | [gemini.md](research/gemini.md) |

Never say: "proven to make you learn faster", "permanently fixes misconceptions", "3x better learning", or that every typed topic builds live.

---

## 1. The live 3:00

| Time | On screen (driver) | Narrator says |
|---|---|---|
| **0:00-0:15**<br>**Hook** | Home, then the orgo card **Push the electrons**, step 1 "Build ethanol", target **C₂H₆O**. Trackpad/phone to the judge. | "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong, and why. Here's organic chemistry. Build me ethanol: two carbons, six hydrogens, one oxygen." |
| **0:15-0:40**<br>**Mistake named live** *[if #204 merged]* | Judge drags atoms and bonds. A 5th bond on a carbon: the ring turns red, **"A carbon with 5 bonds"** shows. | "Every atom has slots. Give a carbon one bond too many … and it names the mistake while I make it. Carbon has four slots; a fifth bond has no electrons to use." |
| **0:40-0:55**<br>**Check it** | **Check it**: ethanol ✓, or "Same formula, different molecule" (ether), or "Oxygen with 3 bonds, no charge" (FC = 6 − 2 − 3 = +1). | Clean: "And if you'd joined the same atoms differently, it would show you dimethyl ether next to ethanol." |
| **0:55-1:35**<br>**Push the electrons** | HO⁻ + CH₃Br. Judge draws two arrows; **Show me** inks the real ones over theirs; scrubber 0 → 50 → 100. Optional step 3: cyanide + CH₃I, **Run both**. | "This is the part everyone memorizes and nobody sees. Draw where the electrons go. … Pencil is you, ink is reality. The hydroxide comes in from the back, opposite the bromine. Halfway, one bond forming, one breaking. Bromide leaves with the bond's two electrons, and the carbon flips inside out like an umbrella." |
| **1:35-2:30**<br>**Calculus** | `?session=calculus`. Judge pencils the slope; drags the tangent while the true slope inks over the sketch; guesses the area; slider 1 → 200 rectangles; mistake card ("Slope = height of the curve") if named. | "Same idea in calculus. Draw how steep this curve is. Now drag the tangent: the real slope draws itself over your pencil. The top of the hill is high, but the slope there is zero. Now the area: one rectangle says 7.5. Thinner and thinner … it lands on exactly 4.57. Every number here is computed, never guessed by a model." |
| **2:30-2:45**<br>**Any topic** | Home → **Try any topic** → "derivative of x squared" → a draggable tangent. | "Type any topic. Watch it come alive. The AI builds the simulation; code guarantees the truth; you do the thinking. When nothing fits, it says so instead of faking a chart." *(Backend down: say it over Home.)* |
| **2:45-3:00**<br>**Close** | Notebook with the judge's caught mistakes. | "Every wrong idea you had lands in your notebook and comes back with new numbers. No points: the reward is the moment your guess meets reality. Onionskin. See your thinking in layers. Questions?" **Stop.** |

**Branches:**
- **#204 not merged:** calculus first (1:30), then any topic, then the birthday session as "more" (23 people → 50.7%), then the close.
- **Judge is fast:** add the birthday session as "more".
- **Judge is slow:** skip cyanide and the calculus compare. Never cut the named orgo mistake, the scrubber or the tangent.
- **Backend down or slow:** skip typing; one line over Home.

---

## 2. The 1:30 version

| Time | On screen | Narrator says |
|---|---|---|
| **0:00** | Orgo step 1; judge drags atoms; a 5th bond on a carbon. | "ChatGPT tells you the answer. Onionskin builds you a world where you find out you were wrong. Build ethanol … a carbon with five bonds, named while you make it." |
| **0:25** | Step 2: two arrows, **Show me**, scrub. | "Draw the electrons. Ink over pencil: backside attack, the bromide leaves, the carbon inverts." |
| **0:50** | Calculus: tangent over the sketch; rectangles 1 → 200. | "Drag the tangent; the real slope inks over your guess. Rectangles: 7.5 down to exactly 4.57." |
| **1:15** | Home: "Try any topic". | "Type any topic: the AI builds the simulation, code guarantees the truth, you do the thinking." |
| **1:30** | | Stop. |

---

## 3. Judge Q&A prep (18)

Each answer is ≤ 3 sentences. Driver takes the technical ones (2, 4, 6, 7, 9, 12, 17, 18), narrator the rest. If a question isn't here: one sentence, say what we don't know, stop.

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
   "A topic we've already checked loads instantly with no model call. 'Derivative of x squared' built in about 4 seconds on our Vultr server in one run Saturday; across a 15-topic local trial of the engine, the median was 6 seconds and about two thirds built (PR #187). So at the table, if it's slow, I tap a pre-built topic."

7. **"What if a topic can't be simulated, like history?"**
   "Then it doesn't pretend: if no widget fits or the spec fails validation, it tells you there's no runnable model for that and offers the nearest checked topic. An honest 'no' beats a fake chart." **[Engine v4 behavior: confirm live. Before v4, typed topics fall back to a plain labelled round.]**

8. **"How do you know it actually teaches?"**
   "We don't have a learning study, and we won't claim one from a weekend. The loop is built on well-replicated findings: predicting first ([Crouch 2004](https://doi.org/10.1119/1.1707018)), confident mistakes being the ones people correct best ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)), and comparing cases ([Gentner et al. 2003](https://doi.org/10.1037/0022-0663.95.2.393)). From our user tests Saturday: **[TBD from docs/user-testing.md. Real results only.]**"

9. **"Where's Gemini, and what does it cost to run?"**
   "Gemini fills typed-topic specs and powers a hint-only help endpoint, on the free tier, $0: Flash-Lite allows 500 requests a day ([gemini.md](research/gemini.md)). The key lives only on our one Vultr server, and every public endpoint has a per-IP limit and a hard daily cap. When a cap is hit the sessions keep working, because they compute in the browser and don't need the backend."

10. **"Why no points or streaks? Isn't that how Duolingo keeps people?"**
    "Points bring people back, but one 16-week study found badges and a leaderboard lowered motivation and final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)), and a meta-analysis of 128 experiments found expected rewards undermine the motivation you started with ([Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf)). So the reward is the feedback: the reveal, your wrong idea named, then busted. You still get a reason to come back: a notebook of caught and busted ideas and a remix tomorrow, with nothing to lose."

11. **"What's creative or entertaining about a probability lesson?"**
    "It's a toy before it's a lesson: you snap atoms together, drag a tangent, fill a room and watch the pair lines web up, you draw your own curve, the truth inks in over it and a stamp lands. The paper we built on is literally titled 'Classroom demonstrations: learning tools or entertainment?' ([Crouch 2004](https://doi.org/10.1119/1.1707018)), and the answer was entertainment, unless you predict first. So we made the prediction the game."

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

17. **"Is the chemistry right?"** *[if #204 merged]*
    "The rules are code, not a model. Formal charge is valence minus nonbonding electrons minus bonds, so an oxygen with three bonds and one lone pair is 6 − 2 − 3 = +1, and cyanide's minus sits on carbon (4 − 2 − 3 = −1), which is why carbon attacks ([Formal charge](https://en.wikipedia.org/wiki/Formal_charge), [Kolbe nitrile synthesis](https://en.wikipedia.org/wiki/Kolbe_nitrile_synthesis)). SN2 is one step with the nucleophile coming in opposite the leaving group, so the carbon inverts like an umbrella, and that's what the scrubber shows ([SN2](https://en.wikipedia.org/wiki/SN2_reaction), [Walden inversion](https://en.wikipedia.org/wiki/Walden_inversion)). Honest limit: it's a 2-D picture of one mechanism, not a quantum simulation."

18. **"How is the derivative checked?"**
    "The level's curve is f(x) = (x³ − 6x² + 9x)/2 + 1 with its derivative and antiderivative written in closed form, so the ink slope and the 4.57 area come from formulas; unit tests check them against a numeric derivative and Riemann sums (`web/src/sessions/calculus/math.test.ts`). For a typed topic like 'derivative of x squared', the model only picks the curve and the point; our code computes the slope and rejects a spec whose claimed number is off by more than 2% (PR #187)."

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
