# Strategy: how we win SwampHacks XII

Research notes, Oct 16 2026. Sources are linked inline. Anything marked *(snippet)* came from a search excerpt rather than a full page read, so weigh it lower.

> **Updates (Oct 16):**
> 1. Scope is all hackathons (MLH, Devpost, university, corporate), not just SwampHacks. Broad research first, applied to SwampHacks at the end.
> 2. Rough direction, not locked: my Mental Models Tool, a study tool that helps students build deep, runnable mental models of hard concepts (understanding you can simulate and apply), not flashcards. It's ranked below against the alternatives.

---

## Official event facts (Oct 16, 7 PM; these override anything below)
From the official hacker guide, hacker rules and Devpost page, in my own words. Full plan in docs/36-hour-plan.md.

**Time:**
- Code from **8:30 PM Fri** to **8:30 AM Sun**. Devpost closes 8:30 AM, and we submit by **7:30 AM**.
- After the deadline, only demo-breaking fixes are allowed.
- An idea from before is fine; no code from before.

**Judging:**
- Expo **Sun 10 AM-12 PM**, science-fair style. Each judge spends ~2-3 min at our table.
- We get at least 3 judges, plus sponsor judges for each challenge we opt into.
- Demo ≤3 min + 1 min Q&A.
- **Closing 2:30 PM**: at least one of us must be at judging and at closing.

**The 7 official criteria (Devpost):**
1. **Technical Understanding:** can we explain how and why we built it?
2. Innovation & Creativity.
3. **Functionality:** did it work as demonstrated?
4. Design & Usability.
5. Purpose & Audience.
6. Track & Challenge Relevance.
7. Sponsor criteria, judged by sponsor judges.

The rules page still lists an older 5-criteria version ("Technical Execution", "Clarity & Communication", equal weights, gut feeling allowed). Both reward the same thing: it works live, and we can explain it.

**Tracks (pick at most ONE, plus General/Overall automatically):**
- **Overall** (sponsored by Vobile): $1,000 / $750 / $500. Judged on innovation, technical achievement, impact, execution.
- **AI/ML ("Most Creative Use of AI"), run by UF DSI:**
  - AI must be central: fine-tuning, RAG, agents, custom models, evals.
  - A public repo with a README is required.
  - **"Depth over polish… we will be reading GitHubs and code"**: clean, documented code counts, and they want design choices and tradeoffs explained.
  - Prize TBD.
- **Hardware & Physical Computing:** Raspberry Pi 4 kits. The CpE lab in Wertheim lends ESP32-S3 / XIAO ESP32 / Pico W / Arduino Uno boards and battery packs, with sensors available on request.
- **Entertainment & Creative Tech:** AirPods 4.
- **First Timers:** only if half the team is at a first hackathon.

**Challenges (any number we genuinely meet):**
- **Sperry PlanIT Control:** iPad Air / AirPods / $100, and **internship interviews for all 3 places**.
- **Capital One Nessie:** $250 per member.
- **DeepSpace:** credits + $250 split + a call with the CEO; the SDK must do real work.
- **Roblox:** Luau.
- **Easy On The Eyes (UI/UX):** 27" monitors.
- **Least Vibe Coded:** we won't claim it.
- **MLH:** GoDaddy domain, Gemini, Vultr, Solana, Auth0, Tiger Data, DEV post.

**Money:** the guide says Overall cash is split among team members, but the rules page says cash is split four ways regardless of team size. Still unconfirmed with organizers.

**Other:**
- **Video:** the guide says a recorded video isn't required; Devpost caps it at 2 min if we add one. We'll record one as a backup anyway.
- **Disclosure:** AI tools must be credited on Devpost and in the README. Draft in #questions for me to approve.
- **Sponsor face time:**
  - **Company Connect Sat 10:30 AM-12:30 PM:** Sperry, Vobile, Capital One, BNY and Roblox reps.
  - **Sperry workshop Sat 3:30-4:15 PM.**

## Re-ranked directions vs the official tracks (nothing is picked; I decide)

**Superseded by docs/prize-strategy.md (7:40 PM).** After the prize-by-prize research and a red team, the ranking is: 1) lean hazard radar for Sperry, 2) lean transfer-fraud interceptor (Capital One), 3) lean Mental Models. The track is chosen per stack, not defaulted to AI/ML. The table below is kept for history.
| Rank | Direction | Best single track | Challenges it honestly meets | Why this rank | Main risk |
|---|---|---|---|---|---|
| 1 | **Hazard radar for Sperry** (go/no-go board, provenance drawer, exact lightning rule, calibrated 0-10 index) | **AI/ML** (calibrated index + backtest; DSI reads code) or Hardware if we add a lab sensor | Sperry, Tiger Data, Auth0, Vultr, Gemini (briefing), domain, Easy On The Eyes | Most prize slots, interviews for all 3 Sperry places, 4 Sperry judges, and Company Connect + the Sperry workshop to get feedback mid-event | Big data plumbing (~42h estimate before cuts); FL judges have seen hazard maps, so the board has to give a decision |
| 2 | **Mental Models Tool** (draw a prediction, the ghost replays it against the truth, measured misconception diagnosis) | **AI/ML** (a real eval on answers collected at the event fits DSI's "depth over polish" exactly) | Gemini, domain, Auth0, Easy On The Eyes; DeepSpace only with live classroom | Best fit for the AI/ML track's stated values and the UF teaching judges; lowest build risk (~28h) | Few challenges; "AI tutor" fatigue; needs real collected data by Sat evening |
| 3 | **Beat the Fingerprint** (judge tries to evade our audio matcher; tempo/pitch read back) | Entertainment & Creative | domain, Easy On The Eyes, Vultr | Strong wow + Technical Understanding; Vobile (the Overall sponsor) gave the keynote and lives this problem | Weak Purpose; loud expo floor |
| 4 | **Hazard radar + field sensor** | Hardware (lab ESP32 + a temp/humidity sensor if the lab has one on request) | same as #1 | Physical wins at SwampHacks; the CpE lab makes it possible | Sensor availability unknown until we ask; hardware time doubles |
| 5 | **Nessie idea** | AI/ML | Capital One ($250/member), Auth0, domain | | Crowded, small prize |

**To ask at 8:30 PM:** which judging sheet is used, the cash split, and what sensors the CpE lab actually has.

---

## What this means for us (read this first)

**The clock.** SwampHacks XII is *this weekend*: Oct 16-18 at Reitz Union, 36 hours, starting Friday evening. Devpost submissions open **Fri Oct 16 8:00pm** and close **Sun Oct 18 8:00am** (the Notion rules say 8:30, so we treat 8:00 as the deadline) ([dates](https://swamphacks-xii.devpost.com/details/dates), [rules](https://swamphack.notion.site/SwampHacks-XI-Hacker-Rules-2eb3b41de22f80e7a09bf2cf77a3980d)). **All code must be written during the hackathon**, so we can plan and pick an idea now, but we can't write project code until hacking opens.

**How we get judged.** It's a science-fair expo: judges come to our table, and we get a **live demo of 3 minutes or less plus 1 minute of Q&A**. The Devpost video must be **2 minutes or less**. There's no finals stage ([rules](https://swamphacks-xii.devpost.com/rules)). There are about 50 judges, from Meta, Goldman, Apple, Microsoft, NextEra, Lockheed, Sperry Tech (4 of them), Roblox and UF, including three from DSI, UF's data science student org (see docs/judges.md) ([overview](https://swamphacks-xii.devpost.com/)). Judges rank the teams they saw, so we only need to be the most memorable table out of the ~10 a judge visits ([MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)).

**Devpost criteria:** Technical Understanding ("could the team explain how and why"), Innovation & Creativity, Functionality ("did it actually work as demonstrated"), Design & Usability, Purpose & Audience, Track & Challenge Relevance, and Sponsor Criteria.

**Prizes we can stack.** Every team is in General (Best Overall, $2,500 across 3 winners). We can add **at most one** of these tracks: AI/ML, First Timers, Hardware, or Entertainment & Creative Tech. We can enter **any number** of sponsor challenges and MLH prizes.

**What wins here.** These are the patterns across 118 past SwampHacks winners and the big events:
1. **One concrete thing that visibly works, with a real technical core.** Recent SwampHacks Overall winners had a custom model, a real algorithm, or hardware: ReStory, SignHero, OffTrails, Rubbish, Atmosphere. Plain LLM-wrapper projects mostly win the small sponsor prizes, not Overall.
2. **A clear human benefit:** accessibility, safety, health, or something UF/Gainesville-local.
3. **A demo that hits a wow moment within ~30 seconds.** Show the product first, then explain the tech, and stop on time.
4. **Narrow scope, finished.** Nobody wins with a half-built platform.

**Our plan in one paragraph.** Pick an idea that fits General, one track and 2-4 sponsor/MLH prizes *naturally*. Lock the idea before hacking opens. Have a deployed URL by hour 6. Freeze features around hour 28. Record a backup demo video Saturday night. Submit early Sunday (~6am), then rehearse the 3-minute table pitch. Both of us talk to the Sperry Tech, Capital One and MLH reps Friday night before committing.

**Two rules we must not trip on:**
- **AI tool disclosure.** SwampHacks rules: "AI/LLM tools may be used but must be disclosed" on Devpost, and the Notion hacker rules say they monitor for cheating "manually and using automated tools." MLH guidance says uncredited AI use gets a team disqualified and reported ([Devpost rules](https://swamphacks-xii.devpost.com/rules), [Notion rules](https://swamphack.notion.site/SwampHacks-XI-Hacker-Rules-2eb3b41de22f80e7a09bf2cf77a3980d), [MLH rules](https://guide.mlh.com/general-information/judging-and-submissions/rules-for-your-hackathon)). The XI submission form had an explicit "which AI tools did you use" question. I decide the disclosure wording before submitting. We're not going for the "Least Vibe Coded" award.
- **At least one of us must be at judging *and* at closing,** or we forfeit prizes (Notion rules).

---

## Round 2 findings (Oct 16 afternoon)

More detail in docs/teardowns.md, docs/ideas.md, docs/pitch.md. Nothing is picked yet.

- **XII changed the rubric.** The first criterion is now **Technical Understanding: "could the team explain how and why they built it?"** (in XI it was Technical Execution). Functionality ("did it work as demonstrated") and Design & Usability are separate criteria now. That, plus the Least Vibe Coded award, means **both of us have to be able to defend every design choice at the table.** We pick a stack we can explain, keep the architecture small, and do a "why did we do X" drill before judging.
- **Physical or hands-on wins the top spot.** About 60% of recent top winners had hardware or a hands-on interaction: ReStory, SignHero, Rubbish, A.N.R. (HackUSF 2026 1st), Dose (HackGT 12 1st), Alleaf (Hacklytics 2026 1st), Shepherd.
- **Train or tune one model ourselves, and use the LLM only for explanation.** That was the pattern in SignHero, Rubbish, Aegis and VigilEyes. An eval number goes in the README.
- **Florida judges have seen a lot of hazard dashboards.** HackUSF 2026 had T.I.T.A.N., Crisis-Net and others. A Sperry entry has to give a **crew decision** (go/no-go, safest window, reason), not another map of layers.
- **Hazard radar stress test:** DTN, Tomorrow.io and Earth Networks already do paid, single-hazard crew alerting. Our gap is free data, every hazard on one screen, and plan-oriented output. Don't use Blitzortung, whose terms ban warning systems. Use NOAA GOES GLM satellite lightning plus Open-Meteo lightning potential.
- **Mental Models stress test:** predict-first is standard teaching practice (PhET's teacher guide recommends it), and Gemini generates simulations. Our real edge is the misconception diagnosis with a measured eval. The strongest version is **Sketch-to-Sim** (draw on paper and the physics runs on your drawing).
- **The Sperry brief is detailed** (full breakdown in docs/prizes.md).
  - **Who they are:** Sperry Tech (sperrytech.ai) is a 5-person AI/ML team inside a Florida construction business. Their stated values: "shipped beats clever" and "what runs in production". They have no hazard product of their own.
  - **What the brief asks for:**
    - at least 50 real power plants (EIA-860M)
    - a lightning stop-work alert within 10 mi, with a 30-minute countdown that resets on each strike
    - a 6 PM next-day safety briefing
    - crew photo hazard pins
    - a supervisor dashboard ranking sites by risk
    - an **ML hazard index (0-10) trained on historical data** (NOAA Storm Events, NWS warning archive, OSHA severe injury reports)
  - **What won their last run:** they ran a $5,000 challenge at ShellHacks 2026. **1st was Common Ground**: no predictive model, no replay. It won on one visual idea (a 3D map that raises each planned line to its in-service date) and on tracing every fact back to its source filing. 2nd was UtiliTies; Mr.Gridy (hurricane replay) and ContractMap tied for 3rd. **Lesson: show the source behind every number.** ML depth and replays come second. One of the 4 Sperry judges appears to be on that 1st-place team.
  - **Odds:** an estimated 5-12 entries for 3 prize slots, all with interviews. That's the best odds per entry at the event.
  - **Questions for the Sperry reps Friday night:** what hazard-index granularity they want, whether GOES satellite lightning is OK, and whether 50 plants is a hard minimum.
- **Crowding at XI (111 projects):** Gemini was used by 48%, so its prize is crowded. Auth0 had 1 project, and Tiger Data and Vultr had none, so those are nearly uncontested. Nessie is *required* for the Capital One prize this year (it was optional at XI). Past Nessie winners use it as the money step inside a real flow, not as a budgeting dashboard.
- **DeepSpace** is an alpha real-time SDK (auth, live sync, presence, AI chat). It fits a live-classroom version of the Mental Models Tool (Entertainment track instead of AI/ML).
- **New ideas worth a look:** Heat Badge (measured heat stress at the job site vs forecast; bolts onto the hazard radar for the Hardware track), Sketch-to-Sim, and Bridge Oracle (predict which member snaps, then snap it). The full list of 10 is in docs/ideas.md.

---

## Ranked project directions

**Current ranking after round 2** (details in docs/scorecard.md; nothing is picked):

| Rank | Direction | Why | Biggest risk |
|---|---|---|---|
| 1 | Hazard radar built to the Sperry brief, replaying Jul 21 2025 | Best prize count: Sperry ×3 + interviews, AI/ML, near-empty MLH prizes. Every data source is checked. | Florida judges have seen hazard maps, so it has to output a crew decision; ~42h of work |
| 2 | Mental Models Tool (core: predict → sim → misconception eval) | Lowest risk (~28h), strong research story, UF faculty judges | Thin prize stack; "Gemini already does sims" |
| 3 | Mental Models with Sketch-to-Sim input | Most memorable at a table, and no app does it | Camera reliability under expo lighting |
| 4 | Hazard radar + Heat Badge | Hardware wins at SwampHacks | The standard MLH lab has no humidity sensor/ESP32; only works with our own parts |
| 5 | Bridge Oracle / Nessie scam hold / Roblox | See docs/ideas.md | Weaker sponsor fit or crowded |

The original write-ups follow.

The rankings use what we know about SwampHacks XII's tracks, its judges and past winners. "Stack" means the prizes a direction can honestly enter.

### 1. Field-crew hazard radar (Sperry Tech "PlanIT Control" challenge)

**The idea.** A real-time web/mobile view that pulls together live heat, lightning, flood, wildfire and wildlife data for utility field crews. It flags risk per job site, sends alerts, and suggests safer time windows. This is literally Sperry's posted brief.

**Why it ranks first:**
- It's a specific sponsor brief with **3 prize tiers plus internship interviews**, and 4 Sperry judges at the event.
- Specific-brief sponsor challenges at SwampHacks draw few teams. Last year Morgan & Morgan's brief had exactly 3 winners. Bounties with specific requirements are consistently the least crowded prizes ([Ray Deck](https://sustained.substack.com/p/lessons-from-winning-five-hackathons), [freeCodeCamp](https://www.freecodecamp.org/news/a-simple-checklist-to-help-you-win-or-have-fun-at-hackathons-98030be1a6c8)).
- It also reads as safety and social good for Overall, the same shape as past winners like resQ (campus safety) and Atmosphere (air quality).
- The data is free and public: NWS alerts API, NASA FIRMS fires, USGS water gauges, and heat index from NWS/Open-Meteo.

**Stack:**
- General.
- AI/ML track: a heat-stress or risk model, plus an eval of the risk scoring.
- Sperry Tech.
- MLH Tiger Data: hazard readings are time-series, which is a genuine fit.
- MLH Gemini: a plain-language crew briefing.
- MLH Auth0: crew/supervisor login.
- GoDaddy domain.

**2-day scope.** A map of job sites for one Florida utility region. Live hazard layers, a per-site risk score with "why", an alert feed, and a "safest window today" timeline. Skip the native app; make it a responsive web page.

**Demo.** "This crew is about to start a pole job in Ocala. Here's what they don't know." Trigger a live NWS alert or replay one, and the site turns red with a reason and a safer window.

**Risks:**
- It's less exciting to general judges than hardware or a game.
- Mitigation: make the map gorgeous and use one real recent storm as the replay.

### 2. Mental Models Tool: "predict, then reality grades you"

**The idea.** It's for students learning hard causal concepts, starting with intro physics. The loop:
1. The student commits to a prediction while the simulation is hidden (a slider, a drag-the-point, or multiple choice).
2. The simulation runs with their guess drawn as a ghost over what really happens.
3. They write one sentence explaining the miss.
4. The tool matches that explanation to a known misconception without giving away the answer.
5. The next question targets that misconception. A "your mental model" graph shows misconceptions going red to green.

**Why it's a real contender:**
- The learning science is strong and on our side. Mental models are things you "run" to predict ([Forbus](https://www.qrg.northwestern.edu/papers/Files/qr-workshops/QR97/Forbus_1997_Qualitative_Mental_Models.pdf)). People overrate their causal understanding until forced to explain it ([illusion of explanatory depth](https://en.wikipedia.org/wiki/Illusion_of_explanatory_depth)). Interactive-engagement physics roughly doubles learning gains ([Hake 1998](https://web.mit.edu/jrankin/www/Active_Learning/hake_active_phys.pdf)). An unrestricted GPT-4 tutor left ~1,000 high-school *math* students 17% *worse* on exams once it was taken away, while a guarded tutor mostly avoided the harm ([Bastani et al., PNAS 2025](https://papers.ssrn.com/abstract=4895486)). That last one is our pitch line: we never hand you the answer.
- The judge-participation hook is great. "Quick: ball at the top of its arc. Which way is the force?" Most people get some Force Concept Inventory-style item wrong ([FCI](https://physport.org/assessments/FCI); the real FCI is restricted to faculty, so we write our own items aimed at the same misconceptions and never publish FCI questions), so the judge feels the gap personally.
- UF DSI and faculty judges are the audience most likely to care.

**Why it's #2, not #1 (honest version):**
- **There's no Education track this year.** XI had one; XII has AI/ML, First Timers, Hardware and Entertainment ([overview](https://swamphacks-xii.devpost.com/)). So it competes in General plus AI/ML against every other AI project.
- **"Concept to simulation" is no longer novel:**
  - Gemini has generated interactive sims from a prompt since Apr 2026 ([Google](https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/)).
  - Loomin won 1st of ~300 at NVIDIA's GTC 2026 hackathon doing physics concept to adjustable 3D sim ([UCSC](https://news.ucsc.edu/2026/04/engineering-student-wins-nvidia-agents-for-impact-hackathon/)).
  - The edge has to be **predict-first plus misconception diagnosis**, and we have to say that out loud.
- **The study-tool space on Devpost is crowded.** "AI flashcards from your PDF" projects are everywhere and none we found placed. We need to look clearly unlike those within 10 seconds.

**Stack:**
- General.
- AI/ML track. To meet the bar of "fine-tuning, RAG, agents, custom models, evals... non-trivial", we classify explanations into a fixed misconception list with structured output, and ship a small **labeled eval set** with accuracy numbers.
- MLH Gemini.
- GoDaddy domain.
- Possibly Auth0 for student accounts.
- No sponsor challenge fits.

**2-day scope:**
- One domain (mechanics).
- **3-4 hand-checked simulation templates:** projectile, forces on a moving object, falling objects, and maybe circuits. The model only picks and parameterizes a template; it never writes physics code, so the simulation is always right.
- 5-8 FCI-based misconceptions per template.
- A misconception graph and a prediction-accuracy chart.

**Demo:**
- Make the judge predict.
- Show the ghost-vs-real moment and the misconception node flipping green.
- Show one line of research and one line of eval accuracy.
- Done in 2 minutes.

**Risks:**
- Prediction input UX: keep it to sliders and multiple choice.
- The model mislabeling an explanation: use a fixed list and show its reasoning.
- We can't show learning gains in 2 days. Cite the research and don't claim a study.

### 3. Hazard radar plus a hardware sensor (Hardware track)

**The idea.** Direction 1, plus a small wearable or clip-on sensor: temperature and humidity, so heat index at the actual job site, maybe light or lightning detection. It's built on a hardware-desk Pi/ESP32 and feeds the dashboard live.

**Why:**
- Hardware is rare at SwampHacks but wins out of proportion at the top: Rubbish (1st 2025), ReStory (Overall 2026), Wi-Fido (1st 2018).
- Judges can touch it. Breathing on the sensor and watching the site's risk jump is a perfect expo moment.

**Stack.** General, Hardware track (instead of AI/ML), Sperry, Tiger Data, Gemini, domain.

**Why it's #3:**
- It depends on what the hardware desk has.
- Hardware eats debugging time and is the classic demo-breaker for a team of two.
- **Only take this if direction 1 is picked and a sensor kit is confirmed on Friday night.** Otherwise it's a stretch goal.

### 4. Capital One Nessie challenge ($1,000 cash)

**The idea.** A finance app on Capital One's Nessie mock banking API. One fit with my idea: a "runnable money model", where you predict where your balance lands after a decision and then the simulation of your real transactions shows you.

**Why it's #4:**
- The cash is good.
- But Capital One sponsors every year and finance hacks are common at SwampHacks (Pay Pals, RetroFi and get UFinanced all won in past years), so expect a crowd.
- Nessie is mock data, which caps the wow.

**Stack.** General, AI/ML or none, Capital One, Gemini, Auth0, domain.

### 5. Entertainment & Creative Tech / Roblox

**The idea.** A game: SignHero, a game, won Overall last year, and games win SwampHacks regularly.

**Why it's last for us:**
- The Roblox prize requires core logic in Luau in Roblox Studio. That's a niche stack (so uncrowded), but it's slow to iterate and hard to test outside Studio.
- A non-Roblox game only has the Entertainment track (AirPods).

**Recommendation:** directions 1 and 2 are the real choices. Number 1 has the better odds; number 2 is the better story. Number 3 is an upgrade to number 1 if hardware is available. I'll pick before hacking starts.

---

## Part 1: how hackathons are judged (all events)

### Published rubrics
- **MLH standard rules:** Technology, Design, Completion and Learning, equally weighted. Judges can use "gut feeling". Pitch and idea are officially *not* judged ([MLH rules fork](https://github.com/UHCodeRED/rules)). In practice the pitch is how judges see every other criterion.
- **Devpost's common six:** technical implementation, ease of use ("can you explain how to use it in a sentence or two?"), demonstration, potential impact, quality of idea, and design. "You'd be surprised how many submissions are disqualified simply because they didn't meet the baseline criteria" ([Devpost](https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria)).
- **HackMIT:** originality/impact, technology, and learning, ~33% each *(snippet)*.
- **TreeHacks 2026:** creativity, technical complexity, social impact ([Stanford Daily](https://stanforddaily.com/2026/02/15/12th-annual-treehacks/)).
- **Hack the North 2025:** wow factor, practicality, technical ability, visual appeal, originality. Commercial viability isn't required *(snippet)*.
- **Sponsor rubrics** weight use case and their own API heavily. SailPoint: use-case clarity 25%, execution 25%, creativity 20%, fun 20%, API usage 10% *(snippet)*.

### How judging actually runs (MLH expo)
- About 4 minutes per project: 2 for demo, 1 for questions and scoring, 1 for walking to the next table.
- About 3 judges see each project. Each judge stack-ranks a top 3 (3/2/1 points), and organizers pick from the top 3-5.
- Category prizes are often judged by 1-2 subject experts.
- Source: [MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan).
- Implication: we're compared against the handful of tables the same judge just saw. Being memorable beats absolute polish.

### What they say they reward vs what actually wins
**What judges say:**
- Balance across the criteria; don't over-index on one ([Square judge via Devpost](https://info.devpost.com/blog/hackathon-judging-tips)).
- Depart from the starter template ([Google judge](https://info.devpost.com/blog/hackathon-judging-tips)).
- No "solution looking for a problem" ([NEAR judge](https://info.devpost.com/blog/hackathon-judging-tips)).
- Ambiguity and thin code behind a polished demo are red flags ([Databricks judge](https://info.devpost.com/blog/hackathon-judging-tips)).

**What actually decides it:**
- Rubric scores bunch in the middle, and the winner is decided by what the rubric doesn't name.
- A live working demo is the biggest differentiator, because it removes doubt.
- Narrow and well built beats ambitious.
- Openings full of context lose a third of the slot.
- Naming a known weakness when asked "what breaks first?" *raised* scores; claiming nothing breaks cost credibility.
- UI polish past legibility and framework choice moved nothing.
- Source: [a judge's year of notes](https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l).

**Fatigue:**
- "After judging several entries, they all start to blur together," and at HackMIT the average judge saw ~5% of projects ([Anish Athalye](https://www.anishathalye.com/designing-a-better-judging-system/)).
- So give the project a one-line identity a judge can repeat later.

**In 2026 almost everyone ships a working demo:**
- Judges at two 2026 events saw no slide-only decks and no major crashes.
- The differentiator became product sense: a clear problem, why existing tools fail, and a one-sentence solution ([Semgrep](https://semgrep.dev/blog/2026/the-ai-hackathon-effect)).

**Wrappers:**
- "A generic wrapper around OpenAI is no longer impressive" *(snippet, lablab.ai)*, and "AI chatbot for X" is on judges' tired list *(snippet, Reskilll)*.
- But polished wrappers still win in front of non-technical, pitch-focused panels ([HackEurope 2026 writeup](https://duti.dev/blog/2026/spr/), [HN](https://news.ycombinator.com/item?id=47077312)).
- SwampHacks has technical judges and an AI/ML prize that explicitly wants "non-trivial", so we should not count on a wrapper.

**Technical depth only counts if you narrate it:**
- Name the model, say why you picked it over the obvious alternative, and say how you checked output quality.
- "We used an LLM" gives judges nothing to score ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/)).

**Sponsors:**
- Sponsor judges ask "if I reward this project, will my company look good?" ([Ray Deck](https://sustained.substack.com/p/lessons-from-winning-five-hackathons)).
- "The team with the best code almost never wins. The team with the best demo does." ([John Kim, 7-8 wins](https://getpushtoprod.substack.com/p/how-to-win-hackathons)).

### Patterns in recent winners (big events)
- **TreeHacks 2026 grand prize:** Shepherd, a computer-vision smart cane that steers blind users ([Stanford Daily](https://stanforddaily.com/2026/02/15/12th-annual-treehacks/)).
- **Cal Hacks 11.0 1st:** Duet, EEG brainwaves to adaptive music ([Stanford Daily](https://stanforddaily.com/2024/11/20/stanford-students-win-cal-hacks/)).
- **HackMIT 2025 track winners:** EyeCraft (a face-gesture Minecraft mod for players with limited hand mobility), Kava (wildfire insurance claims), and Griddy (homemade iron-air batteries) ([Northeastern](https://www.khoury.northeastern.edu/khoury-undergrads-win-three-categories-at-prestigious-mit-hackathon)).
- **The shape that repeats:** a physical or visceral demo, an accessibility/safety/social story, and AI as one component rather than the whole thing.
- Hardware is over-represented among winners in Devpost's own student data ([i-programmer](https://www.i-programmer.info/news/204-challenges/8833-devpost-reveals-student-hacker-preferences.html)).
- **Real users:** no rubric requires them. But "who is this for, specifically?" gets asked every time, and a vague answer costs points.

### How event types differ
- **Student MLH/university:** expo tables, mixed judges, lots of side prizes. Grand prizes go to visible, physical or social-impact hacks.
- **Corporate/startup (TechCrunch Disrupt-style):** sponsors judge, so make their product central and say its name ([Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons)).
- **Web3 (ETHGlobal, ETHIndia):** bounty stacking is the whole game, and some bounties go unclaimed *(snippet, bitcoin.com, mudit.blog)*.
- **AI hackathons:** judges mark down thin wrappers and reward a visible jump from what the user asks for to a working result *(snippets)*.
- **Online Devpost:** the video and write-up are everything, at ~5 minutes per entry ([dev.to](https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0)).
- **Company internal:** execs judge, so tie it to company priorities.

---

## Part 2: what repeat winners do differently

- **They work backwards from the judges.** Sponsors want their tools shown off, judges want a compelling demo, organizers want a story. "The sponsors are the judges. They're in the room. Use them." ([Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons)).
- **They test the idea on sponsor reps early and pivot on a lukewarm reaction.** Kim scrapped 6 hours of work after an Esri rep confirmed a prize angle, and won it.
- **They find out the logistics before building:** how many judges, a panel or one at a time, slot length, whether slides are allowed, whether judges are technical ([Kintana](https://jeremykintana.substack.com/p/how-to-win-at-hackathons)).
- **They build a demo, not a product.** One happy path, one real wow moment, and everything else can be mocked (but never the core) ([Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons), [Temboo](https://blog.temboo.com/how-to-win-a-hackathon/)). Aim for a "minimum presentable product" ([Kintana](https://jeremykintana.substack.com/p/how-to-win-at-hackathons)).
- **They always ship.** Late or unfinished entries never win, so cut scope early so the last stretch is guaranteed polish ([Ray Deck](https://sustained.substack.com/p/lessons-from-winning-five-hackathons)).
- **They flip the time ratio.** Most teams spend ~95% coding and 5% on the pitch, and Kim says reverse it ([Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons)).
- **They stack prizes and hunt the uncrowded ones.** Kim's "Alfred" robot butler qualified for 4 sponsor categories. Odds of a "Best Use of" prize are "much greater than winning First Prize" ([Temboo](https://blog.temboo.com/how-to-win-a-hackathon/)).
- **They frame missing features as choices.** "Missing features become roadmap items. Limitations become deliberate tradeoffs." ([Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons)).
- **They keep stable teams.** Kim and his usual teammate have a 100% win rate together, and strangers burn the early hours ([Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons)).
- **They treat the Devpost page and video as main deliverables:** Devpost's template headings, the public criteria mapped to sections, and every sponsor tool named with what it does ([dev.to](https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0)).
- **They know humor sticks.** One 7x first-place winner credits two wins to smiling, projecting and making the room laugh *(snippet, Medium)*.

### How winners pick ideas (checklist)
Before committing, check each of these:
1. Does it have a wow moment a judge sees in 30 seconds?
2. Does it fit a track and 2+ sponsor/MLH prizes *naturally*?
3. Does it solve a problem we can name in one sentence, for a specific user?
4. Can two people build the happy path in ~20 hours?
5. Is it visually demoable?
6. Does it avoid the obvious build everyone else will do?

That last point is from a 22-time winner, who says anticipate what everyone will build and skip the obvious chatbot ([Devpost](https://info.devpost.com/blog/user-story-nathan)). Cap the idea debate at 1-2 hours ([e27](https://e27.co/how-to-do-well-in-a-hackathon-a-mentor-and-judges-perspective-20190901/)). Our version: we pick before hacking opens.

---

## Part 3: demo and pitch playbook

### Pitch structure for our 3-minute table slot
| Time | What |
|---|---|
| 0:00-0:15 | The problem in one sentence, for a specific person ("Utility crews in Florida work outside in lightning season with no..."). |
| 0:15-0:25 | "We built X. It does Y." One sentence, no tech. |
| 0:25-1:45 | Live demo of the happy path. Hit the wow moment by about 0:45. Narrate the hidden work (the model, the data, the eval), not the obvious UI. |
| 1:45-2:30 | How it works in 3 sentences, naming every sponsor tool. One honest limitation, framed as the next step. |
| 2:30-3:00 | Impact and close. Stop. No "yeah, so that's it." |

This is a blend of the [AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/) and [Reskilll](https://blogs.reskilll.com/hackathon-demo-presentation-tips-pitch-3-minutes-win-2026/) splits and [Terence Eden](https://shkspr.mobi/blog/2019/11/how-to-present-at-a-hack-day/). Also keep a **90-second version** for rushed judges.

### Tactics
- **Show the product before explaining it.** Tech lands "after the audience already cares" ([Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons)).
- **No slides,** or one slide at most. Close the code editor and terminal. Have the app open on the right screen before the judge walks up.
- **Let the judge touch it.** One team translated a judge's own YouTube video live, which turned into a backstage conversation ([freeCodeCamp](https://www.freecodecamp.org/news/a-simple-checklist-to-help-you-win-or-have-fun-at-hackathons-98030be1a6c8)).
- **Happy path only, but harden what a judge might poke at,** like cancel buttons and empty input. Sources disagree on showing an error case. We won't show one, but the obvious detours must not crash.
- **Who talks.** One narrates and the other drives the laptop. Whoever built the hardest part answers technical questions. Pick the narrator now.

### Q&A prep
Agree the answers to these in advance ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/), [e27](https://e27.co/how-to-do-well-in-a-hackathon-a-mentor-and-judges-perspective-20190901/)):
- Who exactly is the user?
- What's real and what's mocked?
- Why this model/approach?
- Who already does this?
- What breaks first?

### Live demo vs video
- The expo is live, so the live demo is primary.
- The video is still required (2 minutes or less, viewable via link, unlisted is fine on YouTube). Sponsor judges and deliberations may use it. Aim for roughly 60% demo and 40% explanation, and don't speed up the audio ([Devpost](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)).
- **Backup.** Record a clean run Saturday night and keep it on the laptop. Use local fixtures for anything network-dependent. If live breaks: "let me show you the recorded run while that reloads."

### Final-hour checklist
([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/))
- Demo data seeded
- Tabs closed
- Notifications off
- Charger in
- Sleep disabled
- Font size up
- Demo URL bookmarked
- Phone hotspot as Wi-Fi backup

---

## Part 4: prize-track strategy

**Rules here:**
- General plus one specialized track, any number of sponsor challenges and MLH prizes.
- On Devpost, prize opt-in is a list we can edit until close. Opt into everything we genuinely qualify for ([UNIHACK guide](https://unihack.notion.site/How-to-submit-your-project-2e05dc7357fb4d3ba3e23f51207f996a)).

**XII prize board:**

| Prize | What it needs | Crowding guess | Fit for us |
|---|---|---|---|
| Best Overall ($2,500 / 3) | Everything | Everyone | Always in |
| AI/ML track (prize: a Brick) | AI central and non-trivial (RAG, agents, evals, custom models), good conventions, public repo + README | High | Yes, if we ship a real eval |
| Hardware track (Pi 4 kit) | Physical computing | Low | Direction 3 only |
| Entertainment & Creative (AirPods 4) | A game or creative media | Medium | Direction 5 |
| First Timers | 50%+ of the team at their first hackathon | ? | Only if that's true for us |
| **Sperry Tech PlanIT Control** (iPad Air + internship interviews; 3 winners) | Real-time hazard platform for field crews | **Low** | Direction 1 |
| Capital One Nessie ($1,000) | Use the Nessie API | Medium-high | Direction 4 |
| DeepSpace ($250 + credits) | DeepSpace SDK in the working build | Low | Only if it fits |
| Roblox ($400) | Roblox Studio, logic in Luau | Low | No |
| UI/UX "Easy On the Eyes" (monitor) | Great design | Medium | Free entry, polish counts |
| MLH: GoDaddy domain | Register a domain | Anyone, ~10 min | Always |
| MLH: Gemini API | Gemini in the app | High | If we use Gemini anyway |
| MLH: Auth0 | Auth0 login | Medium | Cheap if the app has accounts |
| MLH: Tiger Data | Their Postgres/time-series DB | Low | Direction 1 |
| MLH: Vultr, Solana | Host on Vultr / use Solana | Low / medium | Only if natural |
| MLH: DEV writing ($100) | Publish a post on DEV | Low | Sunday, if time |

**Rules of thumb:**
- Stack only integrations that fit the story and show up in the demo. Judges penalize ideas "shoehorned" into a contest ([Devpost](https://info.devpost.com/blog/hackathon-judging-tips)).
- Cheap prizes like the domain take ~10 minutes, so grab them.
- Smaller API prizes get less attention, so there's less competition ([freeCodeCamp](https://www.freecodecamp.org/news/a-simple-checklist-to-help-you-win-or-have-fun-at-hackathons-98030be1a6c8)).
- **Talk to reps Friday night:** Sperry Tech, Capital One, MLH. Pitch the idea in one line and watch their face.

---

## Part 5: our 36-hour plan (2 people, Fri evening to Sun 8am)

This is adapted from [Reskilll](https://blogs.reskilll.com/hackathon-preparation-checklist-2026-before-during-after/), [Kim](https://getpushtoprod.substack.com/p/how-to-win-hackathons), [Eden](https://shkspr.mobi/blog/2019/11/how-to-present-at-a-hack-day/) and [dev.to](https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0). "H" is hours after hacking opens (~8:30pm Fri). Submit by 8:00am Sun, so it's really ~35.5h.

| When | Builder A (core + wow) | Builder B (integrations + pitch) |
|---|---|---|
| **Before start (now)** | Pick the direction. Agree the API contract and data sources. Pick the stack. No project code yet (rules). | Read the sponsor briefs. Draft the one-line pitch. Plan rep conversations. |
| H0-1.5 (Fri 8-9:30pm) | Scaffold, empty deploy live | Talk to 2-3 sponsor reps. Lock the target prizes. |
| H1.5-6 (to ~2am) | Ugly happy path end to end | Data/API layer, auth, DB. **Deployed URL by H6.** |
| H6-12 (to ~8am Sat) | Make the wow moment real. Sleep in shifts (3-4h each). | Sponsor integrations wired into the happy path. Buy the domain. |
| H12 (Sat ~8am) | **Checkpoint: "can we demo right now?"** Cut anything not on the path. | Same |
| H12-20 (Sat day) | Polish the core, realistic demo data | Start the Devpost draft from the template headings. Pitch-notes doc. |
| H20-28 (Sat evening) | Loading, empty and error states. Top 3 bugs only. **Feature freeze ~H28 (midnight).** | **Record the backup demo video.** Screenshots. |
| H28-32 (Sun 0-4am) | Bug fixes only. README. Tag a release. | Edit the video (2:00 max), finish the write-up, name every sponsor tool. |
| H32-34 (Sun 4-6am) | Code freeze. **Submit on Devpost by ~6am** (we can still edit until 8). | Rehearse the 3:00 and 0:90 pitches out loud, timed, 3 times. Once to a neighbor team. |
| Expo | Drive the laptop, answer technical questions | Narrate |

Short naps beat none: a 26-minute nap gave NASA pilots up to 54% better alertness ([Sleep Foundation](https://www.sleepfoundation.org/sleep-hygiene/nasa-nap)).

### Team workflow (us)
- Two people, two halves that don't overlap, one branch each, merge to main often, main always deployable ([Kintana](https://jeremykintana.substack.com/p/how-to-win-at-hackathons), [lpan.io](https://lpan.io/git-for-hackathon-hackers/) *(snippet)*).
- Agree the API contract first so frontend and backend build in parallel against a mock.
- Check in every few hours on the Plan issue: what's done, what's next, what's cut.

---

## Part 6: common mistakes that lose

1. **No working demo, or slides instead of the product** ([judge notes](https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l)).
2. **Building a platform in a weekend.** Big claims, nothing delivered ([Ray Deck](https://sustained.substack.com/p/lessons-from-winning-five-hackathons)).
3. **A slow opening** that eats the slot, or demo time spent on the stack and our struggles ([HN](https://news.ycombinator.com/item?id=4345295)).
4. **A broken submission:** private video, missing repo, required item missing. Some teams are disqualified on baseline criteria alone ([Devpost](https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria)).
5. **Submitting late.** Leave 2-3 hours for the video. Cal Hacks' winners nearly missed their deadline ([Devpost](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video), [Stanford Daily](https://stanforddaily.com/2024/11/20/stanford-students-win-cal-hacks/)).
6. **Ignoring sponsor criteria, or forcing a sponsor API in** ([Devpost judges](https://info.devpost.com/blog/hackathon-judging-tips)).
7. **Reusing old code or the starter template unchanged.** It's against SwampHacks rules, and MLH runs a cheating check ([MLH](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)).
8. **Not crediting tools, AI included.** It's grounds for disqualification here (see the rules above).
9. **No backup when the live demo dies** ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/)).
10. **A video crammed with too much** or sped up ([Devpost](https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video)).
11. **"Nothing breaks"** or a vague answer about the user ([judge notes](https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l)).
12. **Nobody at closing,** which forfeits prizes (SwampHacks rule).

---

## Appendix: SwampHacks history

- **Editions:** SwampHacks moved from January to October. X was Jan 2025, XI was Jan 2026, and XII is Oct 16-18 2026. No 2024 edition turned up.
- **XI (Jan 2026):** 411 participants, 112 submissions, $11,500.
  - Best Overall went to ReStory, SignHero and OffTrails; Devpost doesn't give their order:
    - **ReStory:** a Pi 5 wearable that recognizes faces and voices for Alzheimer's patients.
    - **SignHero:** a Guitar-Hero-style ASL game on a custom CNN.
    - **OffTrails:** off-trail routing with A* over USGS and Sentinel-2 data.
  - Other XI winners:
    - gatorlator (education/accessibility, live lecture translation)
    - SwampRise (hardware, an ESP32 alarm synced to Gainesville buses)
    - Neuroview (UI, 3D brain anatomy)
    - Explainable (Gemini)
    - ATC-Trainer (ElevenLabs)
    - Pocket Money (Least Vibecoded)
    - three Morgan & Morgan legal-AI winners
  - 16 of 22 winners used an LLM API, mostly Gemini.
  - Gallery: [swamphacks-xi.devpost.com/project-gallery](https://swamphacks-xi.devpost.com/project-gallery).
- **X (Jan 2025):**
  - Top three: 1st Rubbish (a YOLOv11 + Arduino recycling-bin lid), 2nd Atmosphere (air-quality forecasting with a custom TensorFlow model), 3rd MathWhiz (AI-generated Manim math videos).
  - Track 1sts: Neural Network Visualizer (AI), WasteWize (Environment), Better Gator (Health), Debug Demolition (Education), Ask a Duck (Social Good). MLH prizes went to Horus (Terraform, a Pi + YOLO aid for blind users) and Prometheus (Auth0, a wildfire CNN).
  - Source: [x.swamphacks.com/recap](https://x.swamphacks.com/recap).
- **IX (2023) and earlier:** winners included Blue Note (lecture summaries), GatorGuesser (GeoGuessr for UF), resQ (UF Blue Phone safety), Get The Buggies (a retro game), vaporizer, ComicFi, and Wi-Fido (a Pi network-breach detector).
- **Recurring MLH prizes:** domain name (every year), Gemini/Google Cloud, Solana, Auth0.
- **Not found:**
  - the XI Overall placement order
  - an official XII theme (the site shows "Descend" and pixel swamp art)
  - the XII expo time and room
