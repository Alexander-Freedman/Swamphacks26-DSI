# Pitch outlines + demo scripts (drafts)

Nothing is picked yet. These are drafts for the current candidates, so whichever one I pick already has a script. All of them use the shape from docs/strategy.md Part 3:
- the problem for one person
- "we built X"
- the wow moment by ~0:45
- the hidden work and the sponsor tools named
- one honest limit
- stop

Slot: 3:00 live + 1:00 Q&A at our table. Video: 2:00 max.

Roles: **narrator** (talks, keeps time) and **driver** (runs the laptop, takes technical questions). Neither is picked yet.

---

## Candidate A: field-crew hazard radar (Sperry Tech PlanIT Control)

### One-liner
"A live risk map for utility crews: every job site gets a hazard score, the reason behind it, and the safest hours to work today."

### 3:00 table script
| Time | Narrator says | Driver shows |
|---|---|---|
| 0:00 | "Florida line crews work outside through lightning season, 100-degree heat index and flash floods. Today their foreman checks four different apps before 7am." | Map already open, all sites green. |
| 0:12 | "We built PlanIT Radar: one screen that scores every job site, tells you why, and when it's safe." | Zoom to the Ocala site. |
| 0:22 | "Here's a crew about to start a pole job. Watch what happens when this storm comes through." | **Replay a real storm day.** A lightning-potential band and an NWS warning polygon sweep in, the site goes red, and an alert toast appears. |
| 0:45 | "It's not just red. It says why: heat index 108, lightning potential spiking 2 to 5pm, flood warning 3 miles out. And it says when: 7 to 11am is the safe window." | Click the site: factor breakdown and hourly window bars. |
| 1:15 | "The foreman gets this as a 3-line briefing each morning." | Briefing card (Gemini), grounded on the numbers on screen. |
| 1:35 | "Under the hood: live NWS alerts, Open-Meteo forecasts, USGS river gauges and the national wildfire feed, stored as time series in Tiger Data. The score uses OSHA heat bands and the NWS 30/30 lightning rule, so every number is explainable." | Quick architecture view, or the README eval table. |
| 2:05 | "We back-tested it on past days against the warnings NWS actually issued: [precision/recall]." | Eval numbers. |
| 2:25 | "What's missing: we use forecast lightning potential, not live strikes. Real strike data is paid; that's the first integration a utility would plug in." | (honest limit) |
| 2:40 | "Every crew, every site, one screen. Questions?" | Back to the map. Stop. |

### Likely Q&A
- **"Doesn't DTN/Tomorrow.io do this?"** "They sell weather feeds to utilities. We turn those feeds into a per-job decision with the reason attached. Any of those feeds plugs in as another data source." (Confirm against the stress test before using.)
- **"How do you know the score is right?"** The back-test numbers, plus every factor traced to a published rule.
- **"What's real vs mocked?"** Data sources are live. Job sites and crews are seeded. Replay uses recorded real data.
- **"Why not a mobile app?"** The page is responsive and runs on a phone. Native app is a choice for later.

---

## Candidate B: Mental Models Tool ("predict, then reality grades you")

### One-liner
"A study tool that won't tell you the answer: you predict, the simulation shows the truth, and it figures out which wrong idea you have."

### 3:00 table script (judge participation)
| Time | Narrator says | Driver shows |
|---|---|---|
| 0:00 | "Quick question. A ball is thrown straight up. At the very top, which way is the force on it?" | A question card on screen, with the simulation hidden. **Let the judge answer.** |
| 0:10 | (Either answer works.) "Most people, and a lot of physics students, say 'zero' or 'up'. That's one of the most common wrong mental models in physics." | — |
| 0:20 | "We built [name]. You don't memorize; you predict. Then reality grades you." | — |
| 0:30 | "Let's run it." | **Reveal:** the simulation plays with the judge's guess as a ghost arrow next to the real force. |
| 0:45 | "Now tell it why you thought that." | Type the judge's reason, or a canned one. The tool names the misconception ("motion implies force") without giving the answer. |
| 1:05 | "It picks the next question to test exactly that idea." | Next item, same misconception, different situation. |
| 1:25 | "This is your mental model: red is a wrong idea you hold, green is fixed." | Graph view, with a node going red to green after the right prediction. |
| 1:45 | "Why it works: interactive physics roughly doubles learning gains over lecture (Hake, 6,000 students). And in a 1,000-student math study, an unrestricted AI tutor left students 17% worse once it was taken away, while a guarded one didn't (PNAS 2025). So ours never gives you the answer first." | — |
| 2:10 | "Under the hood: hand-checked simulations, so the physics is always right. The language model only picks and parameterizes them. Misconceptions follow the Force Concept Inventory taxonomy (our own items, since the FCI itself is restricted), and we eval'd the classifier on [N] labeled explanations: [accuracy]." | Eval table. |
| 2:35 | "Mechanics today. Every subject with a simulation and a list of common wrong ideas next." | Back to the start. Stop. |

### Likely Q&A
- **"Gemini already makes simulations."** "It shows you the answer. We make you commit first, then diagnose why you were wrong and track it. The research says that's the part that sticks."
- **"How is the sim correct?"** Hand-written engines, not generated code.
- **"Does it work?"** "We can't run a learning study in 36 hours. Here's the evidence for the method, and here's the classifier accuracy we can measure."
- **"Who's it for?"** Intro physics students. UF's PHY 2048 is a concrete example.

---

## Candidate C: transfer-fraud interceptor (Capital One)

### One-liner
"When money is about to leave an account the way stolen money does, the bank holds it and tells you why in one sentence, before it's gone."

### 3:00 table script
| Time | Narrator says | Driver shows |
|---|---|---|
| 0:00 | "A takeover drains an account in two hops: into a mule account, then cashed out. By the time anyone notices, it's gone." | The customer screen with a normal balance. |
| 0:12 | "We built [name]: a model that scores every outgoing transfer and puts the risky ones on hold, live, on Capital One's Nessie." | — |
| 0:22 | "Watch this one." | **Send the seeded risky transfer.** The card flips to **HELD, score 0.94**, with the top 3 reasons in plain words. |
| 0:45 | "Normal transfers go straight through. That matters: a fraud model that blocks everyone is useless." | Send a normal transfer; it goes through. Show the false-hold rate. |
| 1:05 | "The bank side sees the queue. Releasing a hold needs a second login step." | The holds queue; release with Auth0 (if built). |
| 1:30 | "Under the hood: trained on 6.3 million PaySim transactions, split by time. We report the version without the leaky balance features, against the built-in rule and logistic regression: PR-AUC [x], [y] false holds per 1,000 legit transfers. Nessie is only the live money rail; we never train or evaluate on its mock data." | Eval table. |
| 2:15 | "Gemini only writes the hold message from our reason codes; it never decides." | The hold notice text. |
| 2:35 | "What's next: plug in real transaction history and tune the operating point per customer." | Stop. |

### Likely Q&A
- **"Isn't this just a fraud classifier?"** "The classifier is half of it. The other half is the bank-side hold on a real pending transfer, with an operating point we chose and a measured false-hold cost."
- **"PaySim is synthetic."** "Yes, and we say so. It's the standard public benchmark. Nessie data is shared mock data, so we never claim results on it."
- **"What about false positives?"** Show holds per 1,000 legit transfers, and how the operating point moves it.

## 2:00 video outline (both)
1. 0:00-0:10: the hook (the storm replay, or the ball question).
2. 0:10-1:20: the screen recording of the happy path with voiceover. Wow moment by 0:30.
3. 1:20-1:45: the architecture diagram and the sponsor tools named.
4. 1:45-2:00: the eval number and the close.

Record Saturday night, edit it to 1:55, and upload unlisted.

## 90-second version (rushed judge)
The hook, then "we built X", then the wow moment, then one sentence on the tech and sponsors, then stop.

---

## "Technical Understanding" drill (both of us, Sat night)
XII's first criterion is "could the team explain how and why they built it?" Each of us should be able to answer these without looking:
1. Draw the architecture on paper in 30 seconds: what calls what, and where the data lives.
2. Why this model or algorithm over the obvious alternative? What did we try that didn't work?
3. How did we check it's right? Give the eval number, how the split was done, and what the baseline was.
4. What's live and what's replayed, seeded or mocked?
5. What breaks first at 10x the data or users?
6. Which part did each of us build, and what was the hardest bug?
7. Which libraries and tools did we use, and for what? (Same list as the Devpost "Built with".)

## Devpost write-up skeleton
These are Devpost's default headings. Winners ran 450-1,100 words, with numbers bolded and 6+ captioned screenshots (docs/teardowns.md).
- **Inspiration:** one real person and one real number. The Florida lightning-death stat, or the FCI misconception stat.
- **What it does:** 3 bullets, each matching a demo beat.
- **How we built it:** a pipeline diagram in a code block, every sponsor tool named with what it does here, and the eval table.
- **Challenges we ran into:** 2 honest ones, e.g. sparse labels, or camera lighting.
- **Accomplishments we're proud of:** the eval number and the replay.
- **What we learned.**
- **What's next:** the cut features, written as the roadmap.
- **Built with:** the full list, plus the tools-used disclosure the rules require (wording is my call before submit).

---

## Table demo moments (ranked)
What made past expo winners memorable (SignHero, Rubbish, A.N.R., Shepherd, Duet, Common Ground):
- the judge's own body or input drives it
- the outcome is visible and binary
- something keeps running on its own
- there's one comparison number
- the judge leaves holding something

### Hazard radar (Jul 21 2025 replay)
1. **"You're the foreman."**
   - The judge circles a work window on a printed card for that day, then holds the crew phone while we replay the day at 120x.
   - STOP WORK buzzes in their hand, and the 30-min countdown visibly resets on each flash.
   - We show their exposed minutes vs our safest window. Every number links to its NWS/GLM source (Sperry's last winner won on traceability).
2. **Photo hazard pin.** The judge snaps a printed gator photo on the crew phone. It lands on the supervisor map and re-ranks the sites in ~2 s.
3. **"Pick any plant."** The judge picks one and gets the 0-10 index, the why, and a printed 6 PM briefing card to keep.

**Props:**
- a laptop dashboard
- a second screen looping the replay to pull judges in
- a crew phone, plus a hotspot phone
- printed briefing cards

All replay data is pre-pulled and served locally.

**Fallbacks:**
- The crew view polls instead of using push.
- A second browser window can stand in for the phone.
- Pre-loaded photos and cached briefings.
- A recorded replay.

### Mental Models
1. **Prediction cards.** Pre-printed scenario cards with corner markers. The judge draws only their predicted arrow, so the camera finds one stroke on a known layout.
   - Their arrow appears as a ghost next to the real force. They give a one-line reason and it names the misconception.
   - A second card then catches "right answer, wrong reason".
2. **Free-form Sketch-to-Sim** (the ball rolls down the ramp they drew). Only open with this if it passes 20/20 sheets in bright and dim light by Sat noon.
3. **Aisle-wide phone poll.** Everyone nearby votes via QR, and a live histogram fills before the sim settles it.

**Fallbacks:**
- Tablet + stylus input.
- A fast local classifier, so the language model isn't on the critical path.
- A harder card for judges who answer right.
- A recorded run.


---

## Headline talking point: the feedback is the reward
**Use in the pitch (one line, ~0:50 or in Q&A):**
> "Everyone gamifies learning with points. The research says points backfire: in a semester-long class, badges and a leaderboard *lowered* motivation and final-exam scores. So we made the feedback the reward: you see your own wrong idea get named, and then you bust it."

**Why this exact wording** (honest version of the claim):
- The fair claim is **"points can backfire"**, not "points always make people learn worse."
  - Sailer & Homner 2020 found a small *positive* average learning effect for gamification overall ([Springer](https://link.springer.com/article/10.1007/s10648-020-09517-1)). What collapsed in rigorous studies was the *motivation* effect.
  - So we cite the specific semester study (Hanus & Fox) and the reward meta-analysis (Deci et al.), and avoid a blanket claim a judge could poke.

**Sources** (checked Oct 16):
- [Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019): 16 weeks, badges + leaderboard → lower intrinsic motivation, satisfaction and final-exam scores. *(Secondary summaries; full text not read.)*
- [Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf): 128 experiments. Expected tangible rewards undermine intrinsic motivation; positive feedback enhances it.
- [Deslauriers et al. 2019](https://www.pnas.org/doi/10.1073/pnas.1821936116): effortful learning feels worse but works better, and explaining that up front closes the gap.

### Judge Q&A: "Why no streaks or points? Isn't that how Duolingo keeps people?"
> "Duolingo keeps people coming *back*. Its own numbers are about daily users, not understanding. We want both, so we kept the parts that are about you:
> - a collection of the wrong ideas you've caught and busted
> - a review queue that brings them back
> - a quiet '4 of the last 7 days' line with nothing to lose
>
> We dropped XP, badges and leaderboards. A 16-week study found badges and a leaderboard lowered motivation *and* exam scores, and a meta-analysis of 128 experiments found expected rewards undermine the motivation you started with. The reward here is the moment reality proves your hunch wrong and tells you exactly why."

**Follow-up: "Then why is it Entertainment?"**
> "The fun is the reveal: you bet, it plays out over your guess, and a stamp lands. That's the game. No scoreboard needed."
