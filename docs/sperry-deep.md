# Deep dive: Sperry's last challenge + spec for a PlanIT entry

Only matters if the hazard radar is picked. Nothing is picked.

**Bottom line:**
- **What won last time:** 1st place (Common Ground) won with one picture that *was* the brief, every number traceable to its source, a test against Sperry's answer key, and changes made after hearing from Sperry's reviewers. It had no predictive model.
- **Our one visual would be "Tomorrow's go/no-go board":** plants ranked by tomorrow's 0-10 index, with hourly cells, a best-window bracket, and a "Why 7.4?" drawer that opens the raw source.
- **The strongest piece:** the exact lightning stop-work rule, with a CI test on a recorded day.
- **Cut:** voice, chat, agents, 3D, and any LLM in a numeric path.

# Sperry Tech deep dive: ShellHacks GridLock winners → SwampHacks PlanIT Control spec

Pulled Oct 16, 2026. Sources: Devpost pages via curl, the Common Ground GitHub repo (which commits Sperry's original
challenge docs, an intern listing, a sponsor voice-memo transcript, and the team's notes from the Sperry sponsor panel
and demo feedback), and the sperrytech.ai JS bundle. **[inference]** marks my own reasoning.

---

## TL;DR for us

1. **Sperry rewards provenance over cleverness.** Three of the four winners checked themselves against Sperry's answer
   key (6 known overlaps). All four say "every number links to its source". Common Ground won 1st with *no predictive
   model at all*. Mr.Gridy, the ML-heavy entry (GPU Monte Carlo hurricane sim, voice agent), tied for last place.
2. **One picture that encodes the brief's two axes.** Common Ground's whole product is one visual: a map where pillar
   height = filed in-service date, so "where" and "when" read together. Sperry's own site describes the winner in
   exactly those words: "A 3D map that raises each planned line to its in-service date, so where and when read together."
3. **Sperry's own framing of PlanIT** (sperrytech.ai): "pull a job site's weather, flood and wildlife hazards into one
   score, so the go/no-go call stops being a guess", and "A supervisor who can see tomorrow's hazards the evening before
   can move a crew or reschedule the work, instead of deciding at 6:45 in the morning." So our one visual is
   **tomorrow's go/no-go board: sites × hours of the workday, each cell a 0-10 index you can click through to its sources.**
4. **Make strongest:** the lightning stop-work countdown (most concrete and testable), the board (it is the ranked supervisor
   map and the 6 PM briefing in one artifact), and an honestly evaluated 0-10 index. Crew reports: small but real, shown
   live from a phone. Cut voice/chat/agents/3D/hurricane sims and any invented dollar figures.
5. **Judge fit:** at least one judge (Eric Zhang) is very likely Common Ground's own team member (a Devpost user
   `ericzhangdeveloper` is on the CG team). Janet Sperry's Devpost account liked CG, UtiliTies and Mr.Gridy. Humza Naeem
   (AI eng) is "focused on tools that hold up in the field, not in a demo". Mateo Lauzardo (SWE) does "interfaces and plumbing".

Also: our draft in docs/build-plans.md shows a 0-100 risk score. The brief says **0-10**, so use 0-10 everywhere.

---

## 1. The ShellHacks 2026 "GridLock" brief (exact)

Public Devpost text ([shellhacks-2026.devpost.com](https://shellhacks-2026.devpost.com/)), Sperry Tech, $5,000, 4 winners:
> Power grid companies ("utilities") each plan future construction projects years in advance. The problem: neighboring
> utilities in different states often plan this work without much visibility into what the other one is doing nearby.
> The challenge: Build a tool that compares at least two utilities' public future construction plans and flags where
> their planned work overlaps — either because the projects are physically close to each other, or because they're
> scheduled around the same time. [...] federal regulators (FERC) issued a rule in 2024 [...]
> 1st place - Guaranteed internships and Macbook Airs; 2nd - Interviews and IPads; 3rd - Interviews

The full challenge doc handed out at the event (`ShellHacks_Challenge_Gridlock.docx`, committed at
[github.com/fradicus/Shellhacks-2026/tree/main/docs/Sperry-Tech-Challenge](https://github.com/fradicus/Shellhacks-2026/tree/main/docs/Sperry-Tech-Challenge))
adds the details that mattered:
- The example utilities were Dominion Energy SC and Georgia Power. It included a vocab table (transmission line, substation,
  right-of-way, IRP, PSC, FERC 1920, SERTP, SCRTP, CEII).
- **Geographic overlap** = within 25 mi (primary signal). **Timeline overlap** = same build window (strong secondary).
- **"Teams should expect most of the dataset to NOT overlap — finding the real matches is the point of the exercise."**
- Required: an interactive UI showing both utilities and highlighting overlaps, plus a ranked list of top opportunities.
  Bonus: a rough cost/impact estimate for at least one pair. "We're not prescribing the tech stack [...] The goal is to be creative!"
- They also handed out `Projects_Overlaps.xlsx`, a worked example of 10 starter projects with **6 known overlaps** (an
  answer key), plus `Finding_Real_Locations_Guide.docx` and an intern listing.
- ShellHacks general criteria were Completion, Originality, Design, Technology, Practicality. The video limit was 1-2 min.
- Sperry showed a 1:21 brief clip at kickoff (sperrytech.ai events data: "The brief as teams first saw it, played when the
  challenge was announced"). Expect the same at SwampHacks.

---

## 2. Winner teardowns

Placings confirmed from the sperrytech.ai bundle (`winners:[{place:1,project:"Common Ground"},{place:2,"UtiliTies"},{place:3,"ContractMap"},{place:3,"Mr.Gridy"}]`).
All four were photographed "with the Sperry Tech team on stage". Sperry's site gives a one-line caption to each winner,
and those captions are a good read of what Sperry itself thought the idea was:

| | Sperry's one-liner for it (sperrytech.ai) |
|---|---|
| Common Ground | "A 3D map that raises each planned line to its in-service date, so where and when read together." |
| UtiliTies | "A team of AI agents reads the filings, and every number links back to the page it came from." |
| ContractMap | "Built for contractors: spot nearby work, share equipment and coordinate road closures." |
| Mr.Gridy | "Simulates hurricanes across both grids to predict which lines break and who should lend crews." |

### 2.1 Common Ground (1st) — [devpost](https://devpost.com/software/common-ground-a6rfoc) · [repo](https://github.com/fradicus/Shellhacks-2026) · [video](https://www.youtube.com/watch?v=Y5_c-f20ky4)
- **Team:** 4 (Eric Zhang, Kirolos Abdelmassih, Daniel Fraga, Sharan Santharam). FIU.
- **What it built:** a coordination *discovery* tool for transmission planners/PMs. Views: Overlaps `/time` (main), History,
  National explorer, Field planning, Filing changes (58 fields changed across 31 projects), Coverage (with denominators),
  a Gemini workbench, and Impact. It went well past two utilities: **3,366 projects from 142 public sources**, plus 5,419
  historical projects ([README](https://github.com/fradicus/Shellhacks-2026#by-the-numbers)).
- **The one visual idea:** MapLibre + Three.js custom layer. Every planned project is a pillar, and **height = filed
  in-service date**. Scope the map to a region or a 25-mile pin and everything outside "lies down as a grey trace". The
  "story" mode (`/time?story`) is a **35-second self-playing film**: a dawn line sweeps east to west and the pillars rise.
  The arc is nation → region → state → one good pair → one bad pair → back out, and every caption is computed from data
  with no hard-coded numbers ([C58 decision](https://github.com/fradicus/Shellhacks-2026/blob/main/specs/decisions/C58-overlaps-story.md)).
  The argument it makes: a Williston ND pair 23.86 mi apart entering service **1 day** apart, versus a closer pair 6.47 mi
  apart but **1,157 days** apart. "Distance isn't timing."
- **Evidence:** an evidence drawer traces every value to its source document and page. Unknowns stay visible: unreviewed
  locations are hollow beads, and missing dates show as "missing", never dropped. A Gemini field is accepted only if its
  quote appears on the cited page. Briefs may cite only stored facts (15/15 passed). Rules from the spec: "Never invent
  coordinates, dates, costs or owners", "No composite score, no invented probability", "Impact dollars only from cited or
  user-entered inputs". **Golden test in CI:** Sperry's xlsx must yield exactly OVL_1..OVL_6, distances to 2 dp.
  A "What's not done yet" section is upfront about weak spots: "2,971 [locations] are tentative matches", "Candidates are
  leads, not findings" ([README](https://github.com/fradicus/Shellhacks-2026)).
- **Stack:** Next.js 16 / React 19 / TypeScript, MapLibre GL + Three.js, Python 3.12 (uv), MongoDB Atlas (2dsphere,
  `$geoWithin`, versioned datasets), Gemini, Vercel. Domain www.commonground.miami (MLH GoDaddy track).
- **Sponsor engagement (the real edge, [inference] backed by their notes):** they went to the Sperry sponsor panel and
  wrote it up ([panel notes](https://github.com/fradicus/Shellhacks-2026/blob/main/specs/context/2026-09-26-sponsor-panel.md)).
  They demoed to reviewers mid-hack and changed direction based on that feedback
  ([demo feedback](https://github.com/fradicus/Shellhacks-2026/blob/main/specs/context/2026-09-26-demo-feedback.md)):
  "One reviewer asked whether the records were real. We opened the evidence view and the source PDF." Reviewers "responded
  positively to [...] the way the vertical axis makes differences in filed dates visible." The first demo hit a
  visualization bug, so they invested in demo reliability. They built a field-planning/weather "Impact" view after hearing
  Sperry talk about site access and weather.
- **Process:** per the README, the repo was built in ~31 h from written specs by parallel coding agents.
  Codex): 46 features, 135 decision records, 259 merged PRs, with "humans set the direction, reviewed the output and made
  the calls". Sperry gave it 1st anyway. The sponsor clearly didn't penalize that, and the spec discipline shows in the result.
- **Devpost write-up:** short, about **555 words**, with the standard Devpost headings (Inspiration / What it does / How we
  built it / Challenges / Accomplishments / Learned / What's next). 6 gallery images, one captioned "Network". No numbers
  in the Devpost text. The README carries the numbers, captioned images, a GIF and an architecture diagram. Tagline:
  "The cross-utility intelligence platform that aggressively optimizes overlapping construction plans and fleet routes to
  slash millions in wasted time and capital." That is oddly salesy against the README's careful voice, and it didn't hurt.
- **Video:** "Common Ground - ShellHacks 2026" (≤2 min per rules). Content wasn't retrievable (YouTube blocked), but
  C58 says the story mode was designed as "the main live demo and the source footage for the submission video".

### 2.2 UtiliTies (2nd) — [devpost](https://devpost.com/software/utilities-utility-coordination) · [video](https://www.youtube.com/watch?v=Supupux7vtA)
- **Team:** 4 (Eduardo Goncalvez, Alex Waisman, Jonathan Serrano, Paul Piotrowski).
- **What:** a multi-agent DAG pipeline (Python/FastAPI) streams progress over SSE. Readers parse 252 projects from PDFs,
  then a Geocoder (OSM/GeoNames/Census/Nominatim, 224 of 252 placed), a Validator, an Overlap engine (closest-point
  distance, tiers: touching / <1 mi / <5 mi / <25 mi, plus window overlap), cost and savings agents, research scouts for
  other owners' projects, and Analyst + two utility Advocates + a Mediator who draft the coordination meeting. Result:
  72 opportunities, 29 concurrent.
- **One visual idea:** "You can watch all of this happen: each agent lights up on the map and in a live pipeline graph."
- **Evidence:** "every number links back to a page in a filing or a cited source"; "code checks that each snippet really
  appears on its cited page"; savings percentages are "labeled in the app as a team assumption"; "Any number in the
  Writer's summary that the pipeline didn't compute is flagged". The rule they state: "code does the math and models do the reading and judgment."
- **Benchmark:** "reproduces all 6 of Sperry's known overlaps, to 0.01 miles and to the day", plus a snapshot test.
  "A benchmark early changes everything."
- **Honest failure story:** a "St. George" mismatch drew a 253-mile line and created 12 phantom overlaps, "including our
  #1-ranked pair". They added span checks. Writing up a caught failure reads as engineering maturity.
- **Robustness:** a model registry with retries, fallbacks and a circuit breaker so the live demo survives API outages.
- **Stack:** Next.js, MapLibre, FastAPI, Postgres/**Tiger Data (TimescaleDB)**, Gemini (+ other LLM fallbacks), Docker, DigitalOcean.
- **Write-up:** ~1,560 words, standard headings, bullets, two LaTeX formulas, 4 captioned images ("Welcome Screen",
  "Results", "Model Setup", "Research Agents...").

### 2.3 ContractMap (3rd, tie) — [devpost](https://devpost.com/software/contractmap) · [live](https://contractmap.onrender.com) · [video](https://www.youtube.com/watch?v=ovVV4Ca8QVs)
- **Team:** 4 (Devanshi Pande, Jasmine Kohli, Lavanya Pande, Aarav Jain).
- **What:** 182 projects, 55 ranked overlaps on a 100-pt score (proximity 40 + savings 40 + timing 20). #1 pair:
  Jasper-Okatie ↔ McIntosh-Purrysburg, 4.89 km, 24 months overlap, ~$127K (range $35K-$374K). Extended toward
  **contractors**: contract PDF upload → project, equipment marketplace, a work-zone traffic queue model on real
  SCDOT/GDOT counts (best closure hours), a worker job board, messaging.
- **One visual idea:** a full-screen Google Map with overlap link lines between projects of the two utilities.
- **Evidence:** a **"challenge, requirement by requirement" table** at the top of the write-up. Every savings constant
  cites a source (MoDOT, ATRI $2.336/mi, BLS, MISO, USDA, USDOT $29.15/veh-h). "numbers come from code, words come from
  Gemini" with guards. Reproduces Sperry's 6 overlaps.
- **ML, used carefully:** a random forest for duration (205 projects, ~8.5-month error, beats a median baseline,
  5-fold CV ×10) and ridge regression for redacted costs (~47% error). Every prediction is labeled "predicted" with a range
  and never overrides filed values. "We deliberately did not train a ranking model, because no data yet exists on which
  coordinations actually happened." This is the most direct precedent for how to present our 0-10 model.
- **Stack:** FastAPI, Shapely/PyProj (UTM 17N), scikit-learn, MongoDB Atlas, Gemini, Google Maps, PDF.js, Render. 171 tests.
- **Write-up:** the longest, ~1,980 words, 14 headings, full math, 5 images (uncaptioned). Most-liked (36).

### 2.4 Mr.Gridy (3rd, tie) — [devpost](https://devpost.com/software/mr-gridy) · [site](http://mrgridy.miami) · [video](https://www.youtube.com/watch?v=sr1lKaowknU)
- **Team:** 3 (Prastab Ghimire, Bipul Adhikari, Suwan Aryal).
- **What:** two products. (1) Overlaps: 114 projects, "found 50 overlaps, including 2 power lines that actually cross",
  "roughly how much that saves", and type any utility name to have an agent find and parse its plan. (2) A hurricane
  module: 10,000 GPU simulations (PyTorch) with fragility curves for poles, towers and trees, repair zones, crew lending,
  replays of 14 hurricanes ("Hurricane Matthew [...] ~50 hours sooner"), beating a wind-only model on 9 of 14, and a live
  NHC watch. Plus an ElevenLabs voice agent with 28 tools, English/Spanish crew briefings, Tiger Data outage history,
  Excel export.
- **Evidence:** claims "Every number in the app links back to its public source". It does not mention Sperry's answer key.
- **Stack:** Python, PyTorch, Next.js, Gemini, ElevenLabs, Tiger Data, DigitalOcean.
- **Write-up:** ~1,050 words, standard headings plus "Why it matters for the next storm".

### 2.5 Why Common Ground beat Mr.Gridy
Mostly **[inference]**, grounded in Sperry's own text and CG's notes:
1. **It answered the brief, and the picture *is* the brief.** The doc says geography is primary and time is secondary.
   CG's pillars (map = where, height = when) are that sentence drawn. Half of Mr.Gridy's effort (and its best numbers)
   went to a hurricane-restoration problem Sperry didn't ask about.
2. **Restraint on the dataset, which the brief tested for.** The brief warns "expect most of the dataset to NOT overlap —
   finding the real matches is the point." Mr.Gridy reports 50 overlaps out of 114 projects. CG reports **5 overlaps out of
   7,452 cross-utility combinations** under a stricter driving-distance rule, and labels national pairs "provisional
   candidates". To a team that writes "we build for conditions where being approximately right is not good enough", CG's
   number reads as found and Mr.Gridy's reads as loose.
3. **Checkable vs uncheckable headline numbers.** Mr.Gridy's showcase claims ("~50 hours sooner", "10,000 simulations")
   are modeled counterfactuals a judge can't verify in 4 minutes. CG's claims (1 day vs 1,157 days apart) open to a filing
   page. Sperry's intern listing literally asks for someone who can "trace a number back through the system and explain why
   it looks the way it does".
4. **No golden test.** CG, UtiliTies and ContractMap all prove they reproduce Sperry's 6 known overlaps. Mr.Gridy doesn't
   mention it. That's the cheapest, most persuasive proof of correctness available, and it went unused.
5. **Feature sprawl vs the panel's advice.** Sperry's panel: "Prioritize a small useful task over a large collection of
   loosely connected features"; field software must "solve an immediate problem with minimal friction"; a previous
   internal system failed adoption because it was built without users. A voice agent with 28 tools plus a GPU sim is the
   opposite. (CG also had many views, but they all hang off one map and one rule set, and they cut a whole view, `/map`,
   late to keep focus.)
6. **They listened to Sperry in the room.** CG went to the sponsor panel, demoed to reviewers mid-event, and changed course.
   The vocabulary they adopted is exactly what Sperry values: "filed in-service date", "candidates to investigate",
   "possible shared activity, never savings".
7. **Polish and story.** A self-playing 35-second film built from live data, a custom domain, and 3D that looks unlike every
   other Leaflet entry. Sperry's site singles out the visual.

Note: Mr.Gridy still placed, so the ML wasn't penalized as such. What it lacked was evidence of correctness on the actual
ask. ContractMap shows the accepted way to do ML for Sperry: small models, baselines, CV, labeled as "predicted", and never
overriding real data.

### Common patterns across all 4
- Real public data at scale, and numbers with denominators (182/252/3,366 projects; 224 of 252 placed).
- A map at the center. Every winner had a live URL or a deployed app (3 of 4 on custom or hosted domains).
- "Code computes numbers, the LLM only reads and writes words, and LLM text is checked for numbers that aren't in the facts" (UtiliTies, ContractMap, CG).
- Assumptions labeled as assumptions. Uncertainty shown, not hidden.
- 3-4 person teams. All four used Gemini (MLH track stacking). Two used Tiger Data, two used MongoDB Atlas.
- Non-winners (e.g. solo Streamlit [Gridlock](https://devpost.com/software/gridlock-mhjfuv), [Seams](https://devpost.com/software/seams))
  often met the spec too. The difference was scale of real data, the visual, and provable correctness.

---

## 3. What Sperry Tech says it values

From [sperrytech.ai](https://sperrytech.ai/) (text in the JS bundle, pulled today):
- Principles: **"Shipped beats clever — A working system in someone's hands is worth more than an elegant one in a
  repository. We optimize for what runs."** **"Built for field conditions — Weather, terrain, messy data, and a crew standing
  idle while the software catches up."** "Small team, senior only." "Whoever builds it, runs it." "If an idea will not
  work, the useful moment to say so is week one."
- "We measure ourselves on what runs in production, not on what demos well." "Most AI projects die between the demo and
  the deployment." "We build for conditions where being approximately right is not good enough." "Tested against live
  projects, not benchmarks." "We test them on job sites with the crews who use them."
- "[Energy and construction] still run on decisions made by instinct. [...] The data [...] is just scattered across
  spreadsheets, PDFs, and the heads of the people on site."
- Judges' bios: Humza Naeem, "Model selection, evaluation, and the production services that run them. Focused on tools
  that hold up in the field, not in a demo." Mateo Lauzardo, "The services, interfaces, and plumbing that turn a model or
  an idea into something people can actually use." (Theodor Owchariw, ML: "training, evaluation, and the monitoring that
  keeps them accurate once real data starts moving".)
- Intern listing (site + [docx](https://github.com/fradicus/Shellhacks-2026/tree/main/docs/Sperry-Tech-Challenge/Opportunities)):
  data pipelines, "validation and data quality checks that catch problems early", "avoiding the common pitfalls that quietly
  corrupt a training set" (= leakage, so use a time-based holdout), "trace a number back through the system". Preferred:
  PostgreSQL, Azure/AWS, pandas. Application questions: "Show us something you made that nobody asked you to make", "What are
  you bad at", "What do people in your field believe that you think is wrong?", "best thing you built that nobody used".
  Traits: "You turn up with an attempt, not just a question", "You say 'I do not know' early, and you say when you got it wrong."
- PlanIT page on their site: headline **"Know which job sites are dangerous before the crew gets there."** Summary:
  "pull a job site's weather, flood and wildlife hazards into one score, so the go/no-go call stops being a guess." Why:
  "A supervisor who can see tomorrow's hazards the evening before can move a crew or reschedule the work, instead of deciding
  at 6:45 in the morning." Scene timeline: the day before (gator text) → 6:45 AM (temporary road into the Everglades) →
  noon (HI 110°F) → afternoon (storms, muck).

Sperry in person (Common Ground's notes from the ShellHacks sponsor panel, headed **"Sperrytech / Dakota Matting"**,
[link](https://github.com/fradicus/Shellhacks-2026/blob/main/specs/context/2026-09-26-sponsor-panel.md)):
- "Clean, well-understood data is a prerequisite for useful automation." "~9-10 years of internal data [...] about five
  years in Microsoft Dataverse." Stack: Power Apps, Power Automate, Dataverse.
- Their work involves "assessing vegetation, water, soil conditions, and access routes"; "Getting trucks and equipment into
  and out of a site is an important part of the planning problem."
- "A previous estimating system struggled with adoption after being designed without enough involvement from its users."
  "Field crews work in difficult conditions. Software needs to solve an immediate problem with minimal friction." "Focus on
  one customer's problem."
- Sponsor voice memo ([transcript](https://github.com/fradicus/Shellhacks-2026/blob/main/docs/context/transcript.txt)): a
  Dakota Matting job "$5 million project [...] 1 and 1/2 million is freight"; FPL is "really siloed"; line workers are a
  "closed market" per state.
- **[inference]** The parent "construction business" is very likely **Dakota Matting** (temporary access matting for
  utility jobs). That fits the PlanIT scene exactly: "laying a temporary road into the Everglades". I couldn't confirm it via
  web search. The users in their heads are matting/access-road crews and their supervisors on FPL-type jobs in South Florida.

Judge feedback quoted publicly: none from Sperry judges on Devpost (no comments). The closest is CG's demo-feedback notes:
reviewers liked the time axis and evidence links, asked "are the records real?", said the desktop PM is the first user but
foremen need "simple, readable mobile interactions", and explicitly "did not expect the team to build [subleasing] during the hackathon".

Activity signals: Devpost user `janet-sperry` liked Common Ground, UtiliTies and Mr.Gridy (ContractMap's like list is
truncated). `ericzhangdeveloper` is a Common Ground member, which supports Eric Zhang = SwampHacks judge (still an inference).

---

## 4. Spec for a winning SwampHacks PlanIT entry

### 4.1 The single visual idea: "Tomorrow's go/no-go board"
CG drew "where + when" for planning. We draw **"which site + which hour tomorrow"** for the go/no-go call.
- **Left: the map** of 50+ real EIA-860M plants (FL/Gulf, maybe ~80-120). Each dot is sized and colored by tomorrow's peak
  index (0-10). Live alert badges (⚡ countdown, flood) sit on top.
- **Right: the board.** One row per site, ranked by tomorrow's peak index (this *is* the supervisor dashboard). Columns are
  the hours 5 AM-8 PM local, each cell the 0-10 index for that hour. A "best window" bracket marks the longest run of
  cells ≤ threshold ("Work 6-11 AM, hold 1-5 PM"). Unknown inputs show as hatched cells, never as 0.
- **The same board, frozen at 6 PM, is the briefing.** The 6 PM report is a snapshot of this board plus a few plain-language
  lines per site. That way requirements 1, 3 and 5 are one artifact, not three features.
- **Tonight → tomorrow → now.** A toggle between "Tomorrow" (forecast) and "Now" (live) makes the scene from Sperry's brief
  literal: decided the evening before, not at 6:45 AM.
- Use a 2D board, not 3D pillars. It reads faster, works on a phone, and doesn't look like a copy of CG to a CG judge
  **[inference]**.

### 4.2 Every number traces to its source
- **Provenance record on every value** (the backend's one rule): `{value, unit, source, endpoint_url, station_or_grid_id,
  distance_mi_from_site, observed_or_valid_at, fetched_at, transform}`. The UI never shows a number without one.
- **Click any cell → "Why 7.4?" drawer:**
  - Index breakdown: each hazard's contribution, from a linear/GBM model plus per-feature attribution (SHAP for trees).
    Model version, training window and the eval link.
  - Raw inputs as "source chips", e.g. "Heat index 108°F · Open-Meteo hourly · grid 26.12N 80.41W · 1.8 mi · valid 14:00
    EDT · fetched 17:04", "NWS Flood Warning · api.weather.gov alert id … · polygon 3.1 mi", "USGS 02296750 gauge 14.2 ft
    (flood stage 13.0)", "GLM flashes: 3 within 10 mi, last 15:42:10 at 6.2 mi".
  - The source link opens the raw API response or the alert page. Answer "are the records real?" in one click, like CG did.
- **Lightning panel:** the flash list that started or reset the 30-min clock (time, lat/lon, distance). The countdown
  visibly restarts when a new flash lands.
- **Briefing text:** an LLM may write words only. A validator rejects any number not in the facts JSON, and a template
  takes over on failure. Show "numbers verified ✓" on the briefing (the UtiliTies/ContractMap pattern).
- **Coverage strip with denominators** (CG's /coverage): "87 sites · 87 with forecast · 52 with a USGS gauge ≤15 mi · 87
  in GLM coverage · 14 crew reports · last refresh 2 min ago". A stale source turns amber with its age shown.
- **Assumptions labeled as ours:** thresholds (OSHA heat-index bands, NWS 30/30, 10-mi rule from the brief) get an
  "assumption / source" tag.
- **Honesty lines we say out loud:** GLM measures total lightning *flashes* (incl. cloud-to-cloud, ~4 km accuracy), not
  ground strikes, so it alerts more conservatively. Our labels are NWS warnings/OSHA reports, a proxy for "hazards workers
  face". The wildlife layer is observations, not risk.

### 4.3 Which of the six requirements to make strongest
| # | Requirement | Weight | What "strong" means |
|---|---|---|---|
| 2 | Instant alerts (lightning 10 mi / 30-min reset; river flood) | **Strongest** | Exact rule, unit-tested. A **golden test** replays a real recorded GLM sequence for one FL site with the hand-computed stop-work intervals, in CI. Demo a replay where the clock resets on a new flash. Flood: USGS gauge vs flood stage plus NWS flood-warning polygons, on a river site. This is our equivalent of reproducing Sperry's 6 overlaps. |
| 5+1 | Ranked supervisor map + one risk picture per site | **Strong (it's the board)** | 50+ real EIA-860M sites, all 7 hazard types present as columns in the drawer (wildfire = NIFC/FIRMS, soil saturation = recent rain or soil moisture, wildlife = iNaturalist/FWC observations). |
| 6 | 0-10 ML hazard index | **Strong, honest** | Train on historical per-site-day features. Labels: NWS warnings at the site (IEM archive), weighted by hazard, plus OSHA severe-injury weather-related events as a secondary check. **Time-based holdout** (train ≤2023, test 2024-25), compared against a naive baseline (persistence or "max raw threshold"). Report precision@top-10 sites/day and calibration in one small table in the app's "Model" tab. Label it "predicted", show the range, and never let it override a live alert (ContractMap's rule). This is the part Humza will probe. |
| 3 | 6 PM next-day briefing | Medium (cheap given the board) | A scheduler keyed to each site's local tz (FL has 2 zones, Central in the Panhandle, which shows we thought about "local"). A "Send now" button for the demo. In-app inbox/email/web push. Show the board snapshot plus verified text. |
| 4 | Crew hazard reports (Waze-style) | Medium, but **live on a phone** | Phone web: one-tap categories (gator, mud/stuck, downed line, heat illness, other), camera photo, auto GPS pin, persisted to the DB, shown on the map, the board and future briefings ("2 reports in last 7 days"). Hazard history per site persists across projects, as the brief asks. Let a judge file one during Q&A. |

### 4.4 What to cut
- Voice agents, chatbots, multi-agent pipelines, "ask the map". Sperry's panel wants minimal-friction field tools, and the
  ShellHacks lesson is that sprawl isn't rewarded.
- 3D, hurricane/Monte Carlo simulations, any nationwide 11k-plant scale beyond what we can verify. FL + a couple of
  Mississippi-river sites (the brief's flood example) is enough; 50-120 sites, each with complete data.
- Any dollar figures ("$X saved") unless sourced. At most one line: idle-crew-hours avoided, computed from our own windows.
- Auth beyond a role toggle (supervisor vs crew), SMS (use in-app/web push), and fancy animations that risk the live demo.
- An LLM in any numeric path.

### 4.5 Build-for-the-demo checklist
- **Replay mode** recorded from a real past FL storm day (GLM + NWS + gauges), so the demo never depends on today's weather.
  Label it "Replay of <date>" on screen (CG labeled fixture data on every page).
- A deployed live URL (judges try it on their phones). Graceful source failure: last-known value plus its age, never a blank.
- A "Model" tab with the eval table and the baseline. A "Coverage" tab. A "Rules" tab listing the exact alert rules and the
  golden test status.
- Devpost: ~800-1,200 words, standard headings, **a "Brief, requirement by requirement" table** (ContractMap), a "By the
  numbers" block with denominators, and a "What's not done yet" section (CG). 5-7 *captioned* screenshots. A ≤2-min video
  cut from a self-playing ~40-s "story" plus narration (CG approach).

### 4.6 3-minute demo outline (live, science-fair, + 1 min Q&A; 4 Sperry judges)
| Time | Say | Screen |
|---|---|---|
| 0:00-0:15 | "It's 6 PM the night before. A supervisor has 87 sites and one question for each: go or no-go tomorrow? Today that's decided on instinct at 6:45 AM. This is the decision the evening before." (Their own words back to them.) | The board, Tomorrow mode. |
| 0:15-0:45 | "Every row is a real EIA-860M plant, ranked by tomorrow's peak hazard index, 0 to 10. Each cell is an hour. This site: work 6-11, hold after 1." Click a red cell → "Why 7.6": heat index 108 from Open-Meteo at 1.8 mi, CAPE high, a flood watch polygon. Open one source. | Drawer with source chips; raw API opens. |
| 0:45-1:25 | "Now live. Replay of <real storm date>." A GLM flash lands 6.2 mi away → **stop-work**, 30:00 countdown. Another flash → **countdown resets**. "That's the exact rule from your brief, and it's a test in CI against this recorded day." Show the flash list. Flood: a river site flips amber as the gauge crosses flood stage. | Map + alert badge + countdown; Rules tab green. |
| 1:25-1:55 | Hand a judge (or a teammate) the phone: snap a "gator" report → the pin appears on the supervisor map in real time and goes into the site's hazard history for the next crew. | Phone + big screen. |
| 1:55-2:30 | "The index is a model, so here's how much to trust it": trained to 2023, tested on 2024-25 days it never saw, precision@10 vs a naive baseline, calibration. "It ranks; it never silences a live alert." (For Humza.) | Model tab, small table. |
| 2:30-2:50 | "At 6 PM local, which is 5 PM in Pensacola, this board becomes the briefing. The words are generated, but every number is checked against the data." Show the briefing with "numbers verified". | Briefing view. |
| 2:50-3:00 | "Real sites, real feeds, every number one click from its source. Built for the crew laying mats in the Everglades." Stop. | Board. |

Q&A prep (likely questions): Is it real data? (open a source). How does the model avoid leakage? (time split, features
only from before the valid time). What if a feed is down? (stale-age indicator, last-known). GLM vs ground strikes?
What would you do with our Dataverse history? (swap the labels for their real incident/stand-down records, which is the
honest next step and plays to the intern-pipeline role). Who's the user? (supervisor at a desk the evening before; crew on
a phone in the morning, the split CG's reviewers described).

Judge-by-judge **[inference]**: Eric Zhang will look for traceability, a golden test and one strong visual (his own
playbook). Humza will look at the eval and what happens on bad data. Mateo will judge the interface, latency, the deployed
URL and the plumbing (scheduler, persistence). Janet Sperry, who is likely closest to the business/field side, will judge
whether a supervisor would actually use it at 6 PM and whether crews could use the phone flow with gloves on (big buttons, one tap).

---

## Sources
- ShellHacks 2026 Devpost (Sperry prize text, criteria, video limit): https://shellhacks-2026.devpost.com/
- Common Ground: https://devpost.com/software/common-ground-a6rfoc · https://github.com/fradicus/Shellhacks-2026 (README,
  `specs/mission.md`, `specs/context/2026-09-26-sponsor-panel.md`, `specs/context/2026-09-26-demo-feedback.md`,
  `specs/decisions/C58-overlaps-story.md`, `docs/Sperry-Tech-Challenge/ShellHacks_Challenge_Gridlock.docx`,
  `docs/Sperry-Tech-Challenge/Opportunities/Software_Engineer_Intern_Listing.docx`, `docs/context/transcript.txt`) ·
  video https://www.youtube.com/watch?v=Y5_c-f20ky4
- UtiliTies: https://devpost.com/software/utilities-utility-coordination · https://www.youtube.com/watch?v=Supupux7vtA
- ContractMap: https://devpost.com/software/contractmap · https://contractmap.onrender.com · https://www.youtube.com/watch?v=ovVV4Ca8QVs
- Mr.Gridy: https://devpost.com/software/mr-gridy · http://mrgridy.miami · https://github.com/VelvetDragon/gridsight · https://www.youtube.com/watch?v=sr1lKaowknU
- Non-winner comparisons: https://devpost.com/software/gridlock-mhjfuv · https://devpost.com/software/seams
- Sperry Tech site (values, team, PlanIT page, ShellHacks winners + placings, intern listing): https://sperrytech.ai/
- SwampHacks XII rules/criteria (3-min live demo + 1 min Q&A, ≤2-min video, 7 criteria): https://swamphacks-xii.devpost.com/ · https://swamphacks-xii.devpost.com/rules
- PlanIT brief: repo docs/prizes.md (Sperry challenge Google Doc)
