# SwampHacks XII prize research (Oct 16-18 2026)

Sourcing: the Devpost overview and rules pages were pulled directly (curl, full HTML), along with the Sperry challenge Google Doc (export), sperrytech.ai (the text is in its JS bundle), the MLH event prize page, about 200 past Devpost winner pages, and all 111 SwampHacks XI project pages (for tech-usage counts). Claims tagged **[snippet]** come only from search-engine summaries and were not read in full. Claims tagged **[inference]** are my own reasoning.

---

## 0. Ground rules that shape prize strategy

- **One specialized track max**, plus everyone is automatically in General. Teams can enter **as many sponsor challenges as they qualify for** ([rules](https://swamphacks-xii.devpost.com/rules)). So the stack is General + 1 track + N challenges + N MLH prizes.
- Teams of 2-4 (we qualify). The demo is live, at most 3 min plus 1 min Q&A, science-fair expo. The Devpost video must be 2 min or less. The submission needs a description, a demo, and a repo or build ([rules](https://swamphacks-xii.devpost.com/rules)).
- "AI/LLM tools may be used but must be disclosed. Projects should not be simple reskins of existing AI tools." ([rules](https://swamphacks-xii.devpost.com/rules)). I decide the disclosure wording before submitting; it matters most for the Least Vibe Coded award.
- **Sponsor challenges are judged only by sponsor-assigned judges.** The 7 general criteria are: Technical Understanding, Innovation & Creativity, Functionality, Design & Usability, Purpose & Audience, Track & Challenge Relevance, and Sponsor Challenge Criteria ([overview](https://swamphacks-xii.devpost.com/)).
- Size: "300+ students each year" ([overview](https://swamphacks-xii.devpost.com/)). SwampHacks XI had **111 projects** in its gallery ([XI gallery](https://swamphacks-xi.devpost.com/project-gallery)). Expect ~90-120 projects this year **[inference]**. Devpost showed 18 registered participants on Oct 16 with submissions "open soon" ([overview](https://swamphacks-xii.devpost.com/)).
- Cash is $9,500 total. Best Overall is $2,500 across 3 winners. XI split it $1,250 / $750 / $500 ([XI overview](https://swamphacks-xi.devpost.com/)).

---

## 1. Prize by prize

### Best Overall, sponsored by Vobile ($2,500, 3 winners)
- **Who Vobile is.** A Hong Kong-listed SaaS company for digital content protection and monetization, "the worldwide leading Software-as-a-Service provider in digital content protection and monetization" ([UF News 2022](https://news.ufl.edu/2022/04/vobile-locates-in-gainesville-innovation-district-/)). Its core is VDNA fingerprinting and watermarking ([Dealroom, snippet](https://app.dealroom.co/companies/vobile)). In 2025 it launched **DreamMaker**, an AI creative platform with rights identification and watermarking, and acquired Pex's music-recognition business ([2025 annual report](https://www.otcmarkets.com/file/company/financial-report/558933/content), [snippet]). 2025 revenue was HK$2.87B ([HKEX filing, snippet](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0327/2026032700207.pdf)).
- **UF tie.** Founder and CEO Yangbin Wang holds a UF ECE MS (1993), was named a 2024 UF Distinguished Alumnus, and sits on the engineering Dean's Advisory Board ([UF Eng](https://www.eng.ufl.edu/news/alumni-spotlight/vobile-founder-chairman-and-ceo-yangbin-wang-honored-as-uf-distinguished-alumnus-at-spring-commencement/)). Vobile opened a Gainesville R&D and Operations Center in 2022 with a plan for "hundreds of jobs" ([UF News](https://news.ufl.edu/2022/04/vobile-locates-in-gainesville-innovation-district-/)). Vobile was the SwampHacks XI "Co-Host" ([XI overview](https://swamphacks-xi.devpost.com/)).
- **Vobile judge.** Britt Woodall is listed under Vobile for XII ([overview](https://swamphacks-xii.devpost.com/)). XI listed the same person as "Director Special Projects at Vobile", alongside Ally Woodall (HR Business Partner) and Iris Zhang (VP, Head of Florida Operations) ([XI overview](https://swamphacks-xi.devpost.com/)). I couldn't find anything else on Britt Woodall online.
- **What wins.** The Overall prize is decided by the general judging pool (about 50 judges from Meta, Goldman, Apple, Microsoft, NextEra, Lockheed, Roblox, UF faculty and others) against the 7 criteria. It is not a Vobile-specific brief. Past Overall winners:
  - **XI:** [OffTrails](https://devpost.com/software/offtrails) (wilderness route safety from USGS elevation and Sentinel-2 vegetation/water data, modified A*); [ReStory](https://devpost.com/software/restory) (Raspberry Pi 5 face and voice wearable for Alzheimer's: ArcFace, WhisperX, Gemini); [SignHero](https://devpost.com/software/signhero) (ASL rhythm game with MediaPipe; also won Best Game Design).
  - **X:** [Rubbish](https://devpost.com/software/rubbish-bx5tai) 1st (Arduino and YOLO recycling bin); [Atmosphere](https://devpost.com/software/atmosphere-jd583o) 2nd (AI environmental-health dashboard covering UV, air quality and wildfire); [MathWhiz](https://devpost.com/software/mathwhiz) 3rd (Manim math and physics explainer videos).
- **Pattern [inference].** Real public data, a physical or visual "wow", and a clear human user. **Geo-safety dashboards (OffTrails, Atmosphere) and education visualizers (MathWhiz) have both placed.** A hazard platform and a physics tool both fit the winning profile.

### Best Use of AI/ML (track; prize: "Brick")
- Requirement: "AI/ML must be central ... fine-tuning, RAG pipelines, agents, custom models, evals, etc." Also a public repo linked on Devpost with a README. Emphasis on "non-trivial implementations and good coding conventions" ([overview](https://swamphacks-xii.devpost.com/)).
- Precedent: the SwampHacks X AI Track winner was [Neural Network Visualizer](https://devpost.com/software/neural-network-visualizer) (an interactive visualizer for differentiable logic-gate networks, built on PyTorch). It is technical and visual, not a chatbot.
- Crowding: **high.** 53 of 111 XI projects (48%) tagged Gemini (my count over the XI gallery pages). Most AI/ML entries will be thin LLM wrappers **[inference]**, so a trained model with a held-out eval table stands out.
- The track is only "1 winner" with an unnamed prize, but it costs nothing extra if the project already has a real ML component.

### Best Hardware and Physical Computing Hack (track; Raspberry Pi 4 kit)
- Brief: hardware projects, or software that controls or enhances devices ([overview](https://swamphacks-xii.devpost.com/)).
- **What's lendable.** The standard MLH US hardware lab holds 9 Raspberry Pi 4B kits, 12 Arduinos with base shields, 8 Logitech webcams, 4 Google Nest Minis, 2 JBL speakers, and Grove sensors: temperature/barometer, moisture, air quality, UV, light, sound, accelerometer, ultrasonic, LCD, servos, steppers, NFC and more. It also includes breadboards, jumpers and a multimeter ([MLH guide](https://guide.mlh.com/organizer-resources/hardware-lab-contents)). MLH ships only "a limited number" of labs to US events, so availability is per event ([MLH guide, snippet](https://guide.mlh.io/general-information/event-logistics/hardware)). I found no SwampHacks XII hardware page on MLH (the per-event /hardware URL returns 404), so **confirm at the desk Friday night**.
- Past winners: [SwampRise](https://devpost.com/software/swamp-rise) (XI, ESP32 bus-alarm clock synced to Gainesville RTS) and Rubbish (X, 1st overall). At XI, 11 of 111 projects used Arduino/ESP32/RPi. **Medium-low crowding.**
- Track conflict: choosing Hardware means giving up AI/ML (one track max).

### Best Entertainment & Creative Technology Hack (track; AirPods 4)
- Brief: games, interactive media, digital art, storytelling, music ([overview](https://swamphacks-xii.devpost.com/)).
- XI equivalents: Best Game Design went to SignHero; Best Creative Media went to [StudyVerse](https://devpost.com/software/studyverse-mxbws8) (hand-drawn multiplayer virtual campus). Games are common at hackathons, so **medium crowding [inference]**. A physics "predict, then watch" sandbox fits "interactive media".

### Best First Timers (Logitech bundle)
- At least 50% of members must be at their first hackathon ([overview](https://swamphacks-xii.devpost.com/)). **Probably not eligible; @luanamaldaner confirm.**

### PlanIT Control, Sperry Tech (3 winners: iPad Air 15" / AirPods / $100 gift cards, **all three get internship interviews**)
- **Exact company:** Sperry Tech, **sperrytech.ai**. It is not Sperry Rail or the old Sperry Corp. Its self-description: "Sperry Tech builds AI and machine learning systems for heavy industry: energy infrastructure, construction, and the field operations that keep both moving." Also: "Sperry Tech is the technology company inside a construction business. Five people building AI systems with the unusual advantage of a real operation to test them against." Founded 2026, 100% privately owned. Internship listed as "Hybrid in Coral Springs, FL" ([sperrytech.ai](https://sperrytech.ai/), text from the site's JS bundle). I could not identify the parent construction business by name. The brief's scenario (temporary access road in the Everglades for a new transmission line) suggests utility site-access and matting work, but that's **[inference]**.
- **Products:** "Product details announced as they launch." Listed areas are operational intelligence tooling, document and workflow automation, forecasting and optimization engines, and purpose-built industry AI platforms. Their R&D covers route, fleet and heavy-equipment logistics; demand forecasting; computer vision for site and inventory tracking; and environmental impact and permitting analysis ([sperrytech.ai](https://sperrytech.ai/)). **I found no evidence that they already sell a hazard or situational-awareness product.** PlanIT reads like a product they'd like to have, not one they already ship **[inference]**.
- **Judges** ([overview](https://swamphacks-xii.devpost.com/); roles from [sperrytech.ai](https://sperrytech.ai/) team page):
  - **Humza Naeem**, AI Engineer: "Model selection, evaluation, and the production services that run them. Focused on tools that hold up in the field, not in a demo."
  - **Mateo Lauzardo**, Software Engineer: "The services, interfaces, and plumbing that turn a model or an idea into something people can actually use."
  - **Janet Sperry**: not on the team page. Role unknown. The surname matches COO Stephen Sperry, so she may be family or from the parent business **[inference]**.
  - **Eric Zhang**: very likely the first-named member of Common Ground, which won 1st in Sperry's ShellHacks 2026 challenge. That's an inference, not confirmed.
  - Others on the team page who aren't judging: Stephen Sperry (COO, "the reason Sperry Tech exists"), Theodor Owchariw (ML Engineer), Ryan Bumstead (Sr. Director of HR).
- **Their stated values** ([sperrytech.ai](https://sperrytech.ai/)): "Shipped beats clever." "Built for field conditions ... real constraints, messy data, and consequences that show up on a job site." "We measure ourselves on what runs in production, not on what demos well." "Energy and construction still run on decisions made by instinct ... The data ... is just scattered across spreadsheets, PDFs..." Their internship application asks four questions, starting with "Show us something you made that nobody asked you to make."
- **Full brief** ([Sperry challenge doc](https://docs.google.com/document/d/1lSneAISdt1fvl3DUAJB92kY8xbxe0MOy/edit)). Required features:
  1. One combined risk picture per site for **at least 50 real power plant locations**: weather, heat, lightning, flooding, wildfire, soil saturation, wildlife sightings.
  2. Instant alerts. Lightning: **any strike within 10 mi triggers stop-work with a 30-min all-clear countdown that restarts on each new strike.** Flood warnings for river sites (e.g. the Mississippi) after heavy overnight rain.
  3. A **daily next-day safety briefing at 6 PM local time.**
  4. **Crew hazard reporting**, Waze-style: photo, map pin, shared to the team and saved to a persistent hazard database.
  5. A **supervisor dashboard** that ranks sites by risk.
  6. A **0-10 hazard index from an ML model trained on historical data** tied to real worker hazards.

  Suggested data: EIA-860M (plant coordinates), NOAA Storm Events, Iowa Environmental Mesonet (NWS warning archive), OSHA Severe Injury Reports (outcome labels), the National Levee Database, NOAA Tides & Currents, FEMA flood maps. One note: the copy of the doc I pulled says its EIA link "points to an FPL project page, not the EIA dataset". The docx hyperlink itself points to https://www.eia.gov/electricity/data/eia860m/.
- **Sperry's previous hackathon: ShellHacks 2026 (FIU, Sep 25-27, 879 participants).** The "GridLock" challenge was $5,000, 4 winners, with guaranteed internships and MacBook Airs for 1st. The task was to compare two utilities' public construction plans and flag overlaps ([ShellHacks 2026](https://shellhacks-2026.devpost.com/)). Winners:
  - **Sperry's placings:** 1st Common Ground (3D map of planned lines by in-service date, every fact traced to its filing, no ML), 2nd UtiliTies, 3rd tie ContractMap + Mr.Gridy. The lesson is to show the source behind every number.
  - [Mr.Gridy](https://devpost.com/software/mr-gridy): parsed 114 real projects and found 50 overlaps, ran a GPU Monte Carlo storm-damage sim, replayed 14 real hurricanes ("Hurricane Matthew ... ~50 hours sooner"), added a voice agent, and watched the NHC feed live. Stack: Python, PyTorch, Next.js, **Tiger Data**, Gemini, ElevenLabs, DigitalOcean.
  - [UtiliTies](https://devpost.com/software/utilities-utility-coordination): AI agents read the filings and "show[s] its evidence for everything it claims", covering 252 projects. Stack: **Tiger Data / TimescaleDB**, Postgres, MapLibre, FastAPI.
  - [ContractMap](https://devpost.com/software/contractmap): a live deployed URL, scikit-learn, Shapely, cited FERC Order 1920.
  - [Common Ground](https://devpost.com/software/common-ground-a6rfoc): emphasized "trace important information back to the original filing" and timing plus distance, not just proximity.

  **Common thread:** real public data at real scale, numbers quoted in the pitch, provenance and evidence shown, backtesting against real historical events, a map at the center. Two of the four used Tiger Data.
- **What would impress them [inference from the above]:** hit every one of the six bullets literally (the lightning countdown restart, the 6 PM briefing, ≥50 EIA plants). Present the hazard index with an honest eval: train on NOAA Storm Events plus IEM warnings, label with OSHA severe-injury reports, use a time-based holdout, and show a calibration or precision-at-top-k table against a naive baseline. Show "why this score" feature attributions. Replay a real day, such as a past Florida August storm, through the alert engine. Show it working on a phone, because the users are field crews. Don't fake data.
- **Data sources utilities actually use** (for credibility in Q&A):
  - **DTN WeatherSentry Utility Edition:** a Lightning Manager showing the past hour of strikes, GPS/location alerts on 50+ parameters, and a lightning-safety add-on that pushes alerts and all-clears to crew phones ([DTN](https://www.dtn.com/weather/utilities/weathersentry-utility-edition), [DTN lightning sheet, snippet](https://www.dtn.com/wp-content/uploads/2020/05/ss_LightningSafety_0620.pdf)).
  - **Vaisala Xweather** lightning API (strikes in the past 5 min, 100 km radius, free trial) ([Xweather, snippet](https://www.xweather.com/weather-api/lightning-api)).
  - **The Weather Company** recent-strikes API ([TWC, snippet](https://developer.weather.com/docs/recent-lightning-strikes-for-us)).
  - **OpenWeather LightningTracker** websocket ([OpenWeather, snippet](https://openweathermap.org/api/lightning-real-time)).
  - **AccuWeather** lightning (preview; own network plus GOES GLM) ([AccuWeather, snippet](https://apidev.accuweather.com/developers/lightning/general)).
  - Earth Networks / Sferic and Vaisala NLDN are the other big names in the field, from my general knowledge; **not verified in this pass**.
- **Free sources we can actually use this weekend:**
  - GOES-19 GLM L2 lightning on AWS via NOAA Open Data Dissemination, ~20 s files ([data.gov](https://catalog.data.gov/dataset/noaa-goes-r-series-geostationary-lightning-mapper-glm-level-2-lightning-detection-events-g), cadence per [Earth2Studio, snippet](https://nvidia.github.io/earth2studio/main/modules/generated/data/dataframe/data_GOESGLM/)). Caveat: GLM detects total lightning from space, not exact ground strikes, so it's fine for a 10 mi radius **[inference]**.
  - NASA FIRMS active fires (free MAP_KEY, ~3 h latency, bbox CSV endpoint) ([MS connector doc, snippet](https://learn.microsoft.com/en-us/connectors/nasafirms)).
  - NWS api.weather.gov, USGS water services, and iNaturalist for wildlife are standard free APIs from my general knowledge; check their docs.
- **Heat thresholds:** use OSHA's bands on the heat index: <91 °F lower, 91-103 moderate, 103-115 high, >115 very high/extreme ([OSHA heat index guide via Northwestern](https://www.northwestern.edu/risk/environmental-health-safety/docs/health-docs/osha-heat-index-guidelines.pdf)). Lightning convention is the 30-30 rule: shelter if thunder comes within 30 s, wait 30 min after the last thunder ([HSE blog, snippet](https://www.hseblog.com/lightning-safety-at-work/)). A Southern Company fleet manual says only enclosed buildings or hard-top vehicles count as shelter ([Southern Co, snippet](https://mobi.southernco.com/SNC-Fleet-Safety-Manual/212-Lightning)).
- **Crowding: low-medium.** The brief is long and specific and needs real data engineering. Expect ~5-12 entries at a ~100-project event **[inference]**. **3 winners plus interviews for all three** gives the best odds-per-entry at the event.

### Capital One, Best Use of Nessie ($1,000 cash, 1 winner)
- **What Nessie is.** A Capital One hackathon sandbox API at api.nessieisreal.com: mock customers, accounts, merchants, bills, deposits, withdrawals, transfers, purchases and loans, plus real ATM and branch locations. It supports POST, so you can create customers, accounts and transactions. Auth is a `?key=` query parameter ([overview](https://swamphacks-xii.devpost.com/); [Data Collaboratives](https://datacollaboratives.org/cases/capital-one-hackathons.html), [snippet]; [Drift docs, snippet](https://deepwiki.com/aadit2805/drift/4.1-nessie-api-integration); [Nessie Android SDK](https://github.com/nessieisreal/nessie-android-sdk), [snippet]). Teams report parts of it are thinly documented ([snippet](https://devpost.com/software/nessie-bank)). I couldn't reach the site from here (blocked), so endpoint names are secondhand.
- **This year Nessie is required.** At XI the $1,000 Capital One prize was a general "Best Finance Hack" where Nessie was optional. Five Capital One judges came to XI ([XI overview](https://swamphacks-xi.devpost.com/)). The XI winner was [Pay Pals](https://devpost.com/software/project-c1nomzfei7a0), a gamified saving-goal accountability app with friends and favors-as-currency, built on Nessie + Solana + Gemini + MongoDB.
- **2026 Nessie winners elsewhere:**
  - [Guardian](https://devpost.com/software/guardian-mbuwlp) (MHacks: an agent reviews medical bills, Nessie sends the refund).
  - [Tend](https://devpost.com/software/tend-ua9rm8) (MHacks: finds state money owed to crime survivors, pays only the amount actually owed, behind a 6-digit code).
  - [unsaid](https://devpost.com/software/unsaid-zm8w5v) (DivHacks: an iMessage agent negotiates group-hangout budgets from Nessie spend history).
  - [RentEscrow](https://devpost.com/software/rentescrow-nthfwb) (DivHacks).
  - [Purrse](https://devpost.com/software/purrse-w1sifk) (WEHack: finance game with Nessie personas).

  Pattern: Nessie as the money rail inside a real-world, often agentic, flow with safety guards. Not "a budgeting dashboard".
- **Crowding: medium.** 5 of 111 XI projects tagged Nessie even when it was optional. With it required and $1,000 cash on the line, expect ~8-15 **[inference]**.

### DeepSpace, Best Use of DeepSpace (1st: 100k credits ($1,000 value) + $250 cash split; 2nd: 50k credits)
- The Devpost headline says "DeepSeek", which looks like a typo. The sponsor is **DeepSpace (deep.space)**, not DeepSeek ([overview](https://swamphacks-xii.devpost.com/)).
- **What it is.** An alpha (0.x, Apache-2.0) full-stack SDK on Cloudflare Workers and Durable Objects with a React client. It covers auth (including Google OAuth), SQLite-backed real-time data sync, RBAC, presence, Yjs collaborative editing, messaging channels, file storage, scheduled jobs, Stripe payments, streamed AI chat (Claude/GPT/Cerebras), and LiveKit rooms. `npm create deepspace@latest`, then `npx deepspace deploy` to `*.app.space` ([docs](https://docs.deep.space/), [GitHub](https://github.com/deepdotspace/deepspace)). The repo had 3 stars, so it's very new.
- Requirements: it must be part of the working functionality, you must explain which features are used and where, and judges need a live or testable build with access instructions ([overview](https://swamphacks-xii.devpost.com/)).
- Past winner: [bubl](https://devpost.com/software/bubl-1nvjz3) (DivHacks 2026). DeepSpace "runs the whole backend": auth (with a demo sign-in for judges), data store, file storage, secrets, ElevenLabs via DeepSpace's integration. A Devpost search for "deepspace" returned only 14 projects total.
- **Fit:** good for a **multiplayer classroom physics tool** (teacher session, presence, live predictions from 30 students) and fine for crew hazard reports (real-time sync, photo storage, scheduled 6 PM job). Risk: alpha APIs, and it takes over your backend, which clashes with a Python ML stack **[inference]**.
- **Crowding: low** (new SDK, 2 winners) **[inference]**.

### Roblox, Best Use of Roblox Studio ($400 = $100 Robux per member + swag)
- Must be built in Roblox Studio with core logic in **Luau**. Brief: "social, educational, or entertainment experience" ([overview](https://swamphacks-xii.devpost.com/)). Two Roblox judges: Nicolas Slenko and Blake Crawford (roles not found).
- At XI, only 2 of 111 projects were Roblox/Lua. [FortBox](https://devpost.com/software/fortbox) (Fortnite-style duels in Roblox) won MongoDB Atlas there. Elsewhere, education and civility games win: [Debt Escape](https://devpost.com/software/debt-escape) (financial literacy, SASEHacks); [Inbox Invaders](https://devpost.com/software/inbox-invaders) (anti-scam tower defense, LA Hacks).
- **Crowding: low.** Roblox's built-in physics engine makes a **physics-prediction game** a natural fit.

### Least Vibe Coded Award (Anker dock)
- "Intentional design and thoughtful implementation with minimal reliance on AI-generated code" ([overview](https://swamphacks-xii.devpost.com/)). At XI it was a "Hidden Challenge ... By CISE Professor", judged on "strong engineering fundamentals ... clean, maintainable code" ([XI overview](https://swamphacks-xi.devpost.com/)). The XI winner was [Pocket Money](https://devpost.com/software/pocket-money-bhrtio) (React Native budgeting app). The likely judge is **Blake Anderson (UF CISE)**, who judged both years **[inference]**. **Low EV for us**; skip it.

### Easy On the Eyes, Best UI/UX (Acer monitor)
- "Outstanding user experience, interface design, and overall polish" ([overview](https://swamphacks-xii.devpost.com/)). XI's equivalent ("Best User Design") went to [Neuroview](https://devpost.com/software/neuroview) (3D brain-MRI viewer for med students; FastAPI + three.js). XI's criteria mentioned accessibility.
- Crowding is high, since everyone enters implicitly, but polish is a side effect of good work. Free to target **[inference]**.

### MLH prizes (exact text from the [MLH SwampHacks XII prizes page](https://www.mlh.com/events/swamphacks-xii/prizes))

| Prize | Requirement | Est. effort | XI usage (of 111) | What wins (past MLH winners) |
|---|---|---|---|---|
| **GoDaddy Registry domain** (digital gift card) | Register a domain through GoDaddy Registry (MLH claim code) | 0.25-0.5 h | 0 tagged at XI, though many register without tagging | A clever, on-theme name that's actually live: [shaadiest.work](https://www.shaadiest.work/) (shady walking routes, [ShellHacks](https://devpost.com/software/shaadiest)), getspotlight.select ([Spotlight](https://devpost.com/software/spotlight-fxqamj)). SwampHacks X winner: [Swamped](https://devpost.com/software/swamped) (safe-night-out app, also used Auth0). |
| **Gemini API** (MLH swag kits) | Use the Gemini API | 1-2 h | **53 (48%)** | Gemini central to the experience: [Explainable](https://devpost.com/software/explainable) (XI voice tutor that explains at the student's grade level), [CrimePath](https://devpost.com/software/crimepath), [Clarity](https://devpost.com/software/clarity-smartglasses) (ESP32-CAM + Gemini Live). Most crowded prize; low value. |
| **Vultr** (M5Stack Tab5) | Host or compute on Vultr; free credits via MLH claim (account required) | 1-3 h | 0 | Many winners just host on it ([Temple Twin](https://devpost.com/software/temple-twin), [aftercare.](https://devpost.com/software/aftercare-b9di1l), [Spotlight](https://devpost.com/software/spotlight-fxqamj)). GPU or ML use is stronger, e.g. [Triviality](https://devpost.com/software/rbc-buddies). Low crowding at SwampHacks. |
| **Solana** (Unruggable hardware wallets per MLH; Devpost says "Assorted") | Build on Solana | 4-8 h unless natural | 5 | Payments or escrow that matter to the story: [ReliefPool](https://devpost.com/software/reliefpool) (earthquake ML → automatic Solana relief payouts), [Bountini](https://devpost.com/software/bountini) (devnet escrow), [Nova](https://devpost.com/software/nova-ody7lm) (XI crypto invoicing). Forced fit for us. |
| **Auth0** (wireless headphones each) | Use any Auth0 API; free up to 7,000 MAU; also Auth0 for AI Agents | 1-2 h | **1** | Login with role separation: [Follow the Bill](https://devpost.com/software/follow-the-bill), [Her Buddy](https://devpost.com/software/her-buddy), SwampHacks X [Prometheus](https://devpost.com/software/prometheus-rh7oxz) (fire/smoke CNN detection with alerts). Nearly uncontested at SwampHacks. Crew vs supervisor roles are a natural fit. |
| **Tiger Data** (Stream Deck Mini) | "Most innovative, impactful, and performance-driven use of Tiger Data" | 2-4 h | 0 | **Tiger Data = Timescale, renamed in 2025** ([Tiger Data blog](https://www.tigerdata.com/blog/timescale-becomes-tigerdata)). Managed Postgres (Tiger Cloud) plus the open-source TimescaleDB extension: hypertables, Hypercore compression (claims up to 98% reduction), continuous aggregates, tiered storage ([docs](https://www.tigerdata.com/docs/about/latest)). Free tier with no credit card per third-party guides ([snippet](https://www.modern-datatools.com/tools/tiger-data/pricing)); MLH says "free-tier cloud instances". "Best use" means real time-series: hypertables plus continuous aggregates powering live charts, with the performance shown. Winners: [Scoop](https://devpost.com/software/scoop-smdxjl) (DivHacks: snow reports, TimescaleDB + PostGIS on Tiger Data), [transPEAKtation](https://devpost.com/software/transpeaktation) (ShellHacks: transport event streams). Two of four Sperry ShellHacks winners also used it. |
| **DEV Writing Challenge** ($100) | Publish a DEV post during the calendar-month window, tagged #mlhacks; at least one pick a month | 1-2 h, after the event | n/a | Judged on "technical substance, originality, clear storytelling, and community popularity" ([DEV](https://dev.to/mlh-hackathon)). Open to every MLH event that month, so the field is big, but it's cheap. Post in October. |

Notes: Vultr, Auth0, Tiger Cloud, GoDaddy and Nessie all need a sign-up at the event. How many projects use each sponsor tech across all of Devpost (search hits, noisy): "tigerdata" ~204, "nessie" ~613, "deepspace" 14 (via the devpost.com/software/search JSON endpoint).

---

## 2. Crowding / EV table (expected ~100 projects; all counts are **[inference]** unless cited)

| Prize | Value to us | Likely entrants | Win odds if we build for it | Extra hours | EV rank |
|---|---|---|---|---|---|
| Sperry PlanIT (3 winners + interviews) | High (iPad + internship path) | 5-12 | **High (25-45%)** | Core project | **1** |
| Best Overall (3 x $2,500 total) | Highest cash | ~100 (everyone) | 5-10% | Core | 2 |
| Auth0 | Headphones each | 1-5 | High if real roles | 1-2 | 3 |
| Tiger Data | Stream Deck | 2-6 | High if time-series is real | 2-4 | 4 |
| GoDaddy domain | Gift card | 5-15 register | ~10% | 0.3 | 5 (nearly free) |
| AI/ML track | 1 prize | 30-50 | 10-20% with a real eval | 0 (if ML is core) | 6 |
| Vultr | Tab5 | 2-6 | Medium | 1-3 | 7 |
| DeepSpace (2 winners) | Credits + $250 | 2-5 | Medium-high if it fits | 4-8 (backend switch) | Idea-dependent |
| Roblox | $400 | 2-5 | High for a good Roblox game | Whole project in Luau | Idea-dependent |
| Nessie ($1,000) | High cash | 8-15 | 10-15% | Whole fintech idea | Idea-dependent |
| UI/UX | Monitor | All | 3-8% | Polish | Side effect |
| Entertainment track | AirPods | 15-30 | 5-10% | Core | Idea-dependent |
| Hardware track | RPi kit | 8-12 | 10-20% | Hardware time | Conflicts with AI/ML |
| Gemini | Swag | ~50 | ~2% | 1 | Low (still cheap) |
| DEV post | $100 | Big pool | Low | 1-2 after | Low, cheap |
| Solana | Wallets | 3-6 | Medium if natural | 4-8 | Low (forced fit) |
| Least Vibe Coded | Dock | ~5-10 | Low for us | n/a | Skip |
| First Timers | Bundle | n/a | Not eligible (likely) | n/a | Skip |

---

## 3. Recommended stacks

### (a) Field-crew hazard platform (PlanIT Control)
- **Submit to:** General + **AI/ML track** + **Sperry PlanIT** + MLH **Tiger Data, Auth0, Vultr, GoDaddy, Gemini** + DEV post afterwards. UI/UX is implicit. This makes it eligible for 9+ prizes from one build.
- **Build:**
  - Ingest the **EIA-860M** sites (pick 50-100 FL/Gulf plants).
  - Poll NWS, GLM lightning, FIRMS, USGS gauges and iNaturalist into **Tiger Data hypertables**. Use continuous aggregates for hourly per-site rollups that drive the live dashboard, and show the query speed in the demo.
  - A **LightGBM/XGBoost 0-10 hazard index** trained on NOAA Storm Events plus IEM warnings, labeled with OSHA severe-injury reports. Evaluate on a time-split holdout against a heuristic baseline; put the eval table in the README (this satisfies AI/ML "evals" and Humza's "model selection, evaluation").
  - The lightning engine: 10 mi radius, 30 min countdown that resets on each strike.
  - A 6 PM local briefing via a scheduled job, with Gemini writing the text from structured risk numbers only, so the numbers stay grounded.
  - Crew photo hazard pins.
  - **Auth0** roles (crew vs supervisor).
  - Host on **Vultr**, on a **GoDaddy** domain.
- **Demo hook:** replay a real past Florida storm day and watch the stop-work alerts fire and the countdown reset.
- Hardware alternative: put a Grove temp/moisture node on a "job site" with the Hardware track instead of AI/ML. Only do this if the desk actually has the kit; I'd keep AI/ML.

### (b) Predict-then-simulate physics learning tool
- **Option b1 (web):** General + **Entertainment & Creative** track (interactive media) + **DeepSpace** (live classroom session: teacher creates a room, students lock in predictions with presence, then the sim plays and the class distribution is revealed) + Gemini (a misconception explainer that compares the prediction to the outcome) + Auth0 *or* DeepSpace auth (not both) + GoDaddy + Vultr if not hosted on app.space. The UI/UX and Overall precedent is strong: MathWhiz and Neuroview placed. For AI/ML instead of Entertainment, you'd need a non-trivial model plus evals, e.g. classifying free-text predictions into known misconceptions and evaluating against a labeled set. Doable but riskier.
- **Option b2 (Roblox):** General + Entertainment track + **Roblox Studio** (Luau; Roblox's physics engine runs the sims; "educational" is explicitly in the brief; 2 Roblox judges; only 2 of 111 XI projects used Roblox) + Gemini via HttpService for hints (feasible, not verified here) + GoDaddy domain pointing to the experience page. DeepSpace and Tiger Data don't fit this one.

### (c) Max-stack idea
- **The hazard platform (a) is already the max-stack idea:** Sperry + AI/ML + Tiger Data + Auth0 + Vultr + GoDaddy + Gemini + DEV, with every integration doing real work.
- **Optional add: a Nessie layer.** "Crew hazard pay and per-diem": when a stop-work alert fires, log the idle-crew cost or auto-trigger a hazard stipend through Nessie transfers. That's honest but weak. Capital One judges want consumer banking, and a forced fit can hurt relevance scores (criterion 6). I wouldn't add it unless the Capital One rep likes it Friday night **[inference]**.
- **Alternative max-stack (fintech, no Sperry):** a Nessie-based agent with Auth0 + Tiger Data (transaction time series, continuous aggregates) + Gemini + Vultr + GoDaddy + AI/ML track. Similar count, but it swaps Sperry's 3 slots plus interviews for Capital One's 1 slot of $1,000 cash, so it's worse odds **[inference]**.

## 4. Open items to check in person Friday night
1. Ask the Sperry reps: do they want the 0-10 index per site per hour or per day? Do they accept GLM as the lightning source? Is "≥50 plants" a hard minimum?
2. Hardware desk: is there an MLH lab, and what's actually in it?
3. Is Nessie up and stable (key provisioning)?
4. Ask organizers: is AI-use disclosure checked, and does it affect General scoring?
