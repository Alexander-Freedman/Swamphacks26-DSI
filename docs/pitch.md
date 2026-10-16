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
| 1:45 | "Why it works: interactive physics roughly doubles learning gains over lecture (Hake, 6,000 students). And unrestricted AI tutors made students 17% worse once the AI was taken away (PNAS 2025). So ours never gives you the answer first." | — |
| 2:10 | "Under the hood: hand-checked simulations, so the physics is always right. The language model only picks and parameterizes them. Misconceptions come from the Force Concept Inventory, and we eval'd the classifier on [N] labeled explanations: [accuracy]." | Eval table. |
| 2:35 | "Mechanics today. Every subject with a simulation and a list of common wrong ideas next." | Back to the start. Stop. |

### Likely Q&A
- **"Gemini already makes simulations."** "It shows you the answer. We make you commit first, then diagnose why you were wrong and track it. The research says that's the part that sticks."
- **"How is the sim correct?"** Hand-written engines, not generated code.
- **"Does it work?"** "We can't run a learning study in 36 hours. Here's the evidence for the method, and here's the classifier accuracy we can measure."
- **"Who's it for?"** Intro physics students. UF's PHY 2048 is a concrete example.

---

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
