# Winner teardowns + judge quotes (SwampHacks XII prep)

Research date 2026-10-16. Devpost blocks direct fetches (Cloudflare 403), so project pages were read through a reader proxy. Every claim has its URL. "(snippet)" means only a search-result summary was available, not the page itself. YouTube blocked fetches too, so video lengths weren't measured. "Team" means the members listed under "Created by".

---

## 0. The most important finding: SwampHacks XII changed its rubric

Source: https://swamphacks-xii.devpost.com/ (compared with https://swamphacks-xi.devpost.com/)

| # | XI (Jan 2026) | XII (Oct 2026, this weekend) |
|---|---|---|
| 1 | **Technical Execution**: difficulty, stability, how much was built | **Technical Understanding**: "Could the team explain how and why they built it?" |
| 2 | Innovation & Creativity | Innovation & Creativity ("thoughtful combinations of existing technologies") |
| 3 | Impact & Purpose | **Functionality**: "Did the project actually work as demonstrated?" |
| 4 | Clarity & Communication | **Design & Usability** |
| 5 | Completion & Scope | **Purpose & Audience**: "usefulness, enjoyment, or meaningful value to its audience" |
| 6 | Track & Challenge Relevance | same |
| 7 | Sponsor criteria (sponsor-assigned judges only) | same |

What this means for us:
- Criterion 1 now rewards being able to explain the build, not raw difficulty. Combined with the "Least Vibe Coded Award" (new in XII) and the XI "Hidden Challenge: Least Vibecoded Project - By CISE Professor" prize (won by Pocket Money, https://devpost.com/software/pocket-money-bhrtio), the organizers are clearly signaling against projects the team cannot explain. Every member should be able to answer "why X and not Y" for every piece.
- "Impact" was replaced by "Purpose & Audience", and "enjoyment" counts. That opens the door to games and creative projects, which matters for the Entertainment & Creative Tech track and Roblox.
- "Functionality" as a separate criterion means a live demo that breaks costs a whole category.
- The XII AI/ML track says "AI/ML must be central … fine-tuning, RAG pipelines, agents, custom models, **evals**", and requires "a public repo … with a README" and "non-trivial implementations and good coding conventions". An eval number in the README is directly on-rubric.
- DeepSpace requires that judges can see the SDK working: "Explain which DeepSpace features you used and where judges can see them", plus a testable build "that don't expose secrets".
- Judging is expo format: "you will demo your project to the judges who visit your table". Prototypes are allowed: "your project does not have to be fully developed".
- The XII judge panel is mostly industry engineers and managers (Meta, Goldman Sachs, Apple, Microsoft, Oracle, Walmart, Lockheed, NextEra, SiriusXM, Labcorp, McKesson…) plus many UF faculty and staff (CISE, CpE, Data Science & Informatics, Engineering Education, College of Medicine, CTSI). Sponsor judges are listed too: Eric Zhang (Sperry Tech), Blake Crawford and Nicolas Slenko (Roblox), Britt Woodall (Vobile). Source: https://swamphacks-xii.devpost.com/
- Prize pool is $9,500+. Best Overall (Vobile) has $2,500 cash over 3 winners; in XI the split was $1,250 / $750 / $500 (https://swamphacks-xi.devpost.com/). Sperry PlanIT Control has 3 places, with internship interviews for all three (iPad Air, AirPods, $100 gift cards). Capital One Nessie pays $1,000 cash. Roblox pays $400 cash plus Robux. DeepSpace pays $250 cash plus credits, with 2 winners.

### Scale and odds
- SwampHacks XI had **112 submissions and about 23 winner badges** (gallery "1–24 of 112", nearly every card on page 1 marked Winner). https://swamphacks-xi.devpost.com/project-gallery
- SwampHacks X had 13 winner-badged projects. https://swamphacksx.devpost.com/project-gallery
- A rough 1-in-5 projects wins something. Best Overall is 3 of about 110, under 3%.
- MLH's planning average for the 2026 season is "1 submission per 4 checked-in hackers". https://guide.mlh.com/general-information/judging-and-submissions/judging-plan

---

## 1. SwampHacks XI (Jan 2026) teardowns

Prize list for reference: Best Overall (Vobile) x3; Education/Accessibility/Social Impact; Sustainability; Game Design; Everyday Life & Wellbeing; Capital One Finance; Morgan & Morgan "Tender for Lawyers" x3; Beginner; Hardware; Creative Media; User Design; Gemini; Solana; DigitalOcean; ElevenLabs; Snowflake; MongoDB; GitHub "Ship It"; plus the hidden Least Vibecoded prize. https://swamphacks-xi.devpost.com/

### ReStory: Best Overall (XI)
https://devpost.com/software/restory · video https://www.youtube.com/watch?v=en1dfKUXFkk
- **Pitch:** "Wearable face/audio identity linker for people with Alzheimer's."
- **Wow moment:** A Raspberry Pi 5 wearable recognizes the person you are talking to. The phone dashboard surfaces their face and an LLM-built "lore" of past conversations. Per the write-up, the team role-played a "new coworker, to lunch buddy, to family friend" to show the memory map updating live.
- **Technical core:** 512-d ArcFace face embeddings plus 192-d ECAPA-TDNN voice embeddings fused per contact. The write-up says "Wearer Anchor" isolates the wearer's own voice. Also neural diarization (WhisperX/SpeechBrain), ChromaDB vectors, Gemini 3 Flash to merge transcripts into JSON "lore", a FastAPI backend on a desktop RTX 5090, and a React mobile UI. Edge-to-GPU over a binary WebSocket.
- **Write-up:** Standard Devpost template headings (Inspiration / What it does / How we built it / Challenges / Accomplishments / Learned / Next). About 660 words. 9 gallery images with captions, including the hardware from the rear and 3/4 rear, "One-Shot Face Identification", "Speech Diarization Logs (and Optimism)" and "Gemini Speech Transcript". **Specific numbers and named techniques are bolded** throughout. The challenges section is very technical: "Identity Drift → Centroid Evolution", "Blackwell 5090… patch Torch weights_only".
- **Team:** 4 (Lewin Bobda, Dylan Vidal, Luke Cullen, Leonard Gofman). Vidal and Gofman are UCF Knight Hacks regulars profiled by UCF CS. https://www.cs.ucf.edu/tag/dylan-vidal/
- **Why it likely won:** It covers emotional purpose, physical hardware and a multi-modal ML pipeline at once, with a demo you can perform live at a table. The team was experienced on the circuit.

### SignHero: Best Overall + Best Game Design (XI), a stacked win
https://devpost.com/software/signhero · video https://www.youtube.com/watch?v=ZX6OOWAt5-U
- **Pitch:** "Compete, have fun, and master ASL, one beat at a time." A Guitar-Hero-style rhythm game where you fingerspell ASL letters into a webcam.
- **Wow moment:** Judges sign letters themselves and get scored live with combos and screen shake. The write-up claims about 30–50 ms detection latency.
- **Technical core:** MediaPipe 21-landmark hand tracking. Landmarks are drawn as a feature mask, then a custom MobileNetV2 with 5 attention layers classifies A–Z. Original and mirrored frames are both run and the max taken. A FastAPI/PyTorch ML server talks over binary WebSocket to a Next.js 15 / tRPC / Prisma / MongoDB front end, with a synthwave look via Framer Motion.
- **Write-up:** About 770 words, heavy markdown. Includes **tables** (game modes, stack layers), an ASCII **pipeline diagram** in a code block, the timing-window spec in a code block, emoji section icons, and a link to separate training docs in the repo. Gallery has 8+ captioned screenshots plus 2 extra videos. Opens with a stat hook: "Over **48 million Americans** are deaf or hard of hearing".
- **Team:** 4 (Jerry He, Eric George, Kai Sprunger, Dawn Balaschak). Sprunger and Balaschak went on to win **HackUSF 2026 Best Overall 1st** with A.N.R. (below), so they are repeat winners.
- **Why it likely won:** It is fun and interactive, so judges play it. It has a custom-trained model rather than an API call, a clear accessibility purpose, and visible polish. One project collected two prizes.

### OffTrails: Best Overall (XI)
https://devpost.com/software/offtrails · video https://www.youtube.com/watch?v=tSBi2MmT3mo
- **Pitch:** Off-trail route planner that fuses USGS elevation with Sentinel-2 water and vegetation data to pick the safest and fastest cross-country path.
- **Wow moment:** Pick two points on a Leaflet map and get a route through real terrain, exportable as GPX to your map app.
- **Technical core:** Modified A* whose cost function was upgraded from Tobler's hiking formula to **Minetti et al. (2002)**, a published energy-cost model, using rasterio and gpxpy.
- **Write-up:** Plain template, about 500 words, 1 image, no tables. **Cites a real paper.**
- **Team:** 2 (Justin Hart, Ben Lohse).
- **Why it likely won:** It is a deep, explainable algorithm on real data with a clear user (hikers). A 2-person team can win Best Overall with a small, well-understood build. That matters even more under XII's "Technical Understanding" criterion.

### Aegis: winner, prize label not captured (likely Hardware or Social Impact) (XI)
https://devpost.com/software/aegis-axf8et
- **Pitch:** "AI-powered safety system that blocks non-compliant workers at entry", using PPE checks at the door with OSHA audit trails.
- **Wow moment:** Tap an RFID badge, step in front of the camera, and the system refuses entry. Gemini then tells you in natural language exactly which PPE is missing and why it matters, and ElevenLabs speaks it.
- **Technical core:** Custom-trained YOLO PPE model in a Flask microservice. Gemini reasons over an annotated frame. Node/Socket.io admin dashboard, MongoDB Atlas rules and logs ("Compliance Rates", "Top Missing Items"), and an RFID reader plus numpad over serial.
- **Write-up:** Template headings in bold. Long narrative "Inspiration" that opens with a cyclist-helmet analogy before moving to labs and construction sites. About 1,000 words.
- **Relevance:** This is the closest prior art to **Sperry PlanIT Control** (field-crew safety). The pattern is hardware entry point, AI explanation, and an audit dashboard for managers.

### gatorlator: winner, prize label not captured (XI)
https://devpost.com/software/live-translation-extension
- **Pitch:** Chrome extension that live-translates lecture audio for ESL students (Deepgram → DeepL → ElevenLabs), with subtitles plus a dubbed voice.
- **Write-up:** Unusual "phase 1…phase 7" build log with hour stamps ("Hours 4-8"). Quantified latency: "under 8 seconds from audio capture to translated output".
- **Takeaway:** Chaining three sponsor-style APIs around a campus-relevant pain point wins prizes even without custom ML.

### SwampRise (Bus Alarm): winner, prize label not captured (likely Hardware) (XI)
https://devpost.com/software/swamp-rise
- **Pitch:** An alarm clock that syncs with live Gainesville RTS bus tracking and wakes you exactly in time.
- **Technical core:** ESP32 on ESP-IDF/FreeRTOS (both cores in use, "without the training wheels of Arduino IDE"), LCD plus 7-segment displays, an RTC, and a **reverse-engineered riderts.app API**.
- **Takeaway:** A hyper-local UF/Gainesville problem works well with local judges. Write-ups that say "we went low-level on purpose" impress.

### NeuroView: Best User Design (XI)
https://devpost.com/software/neuroview · video https://www.youtube.com/watch?v=4fMkUkWLkVI
- **Pitch:** "Google Docs for brain MRIs". A free web 3D NIfTI viewer with synced multi-user annotations.
- **Technical core:** Marching cubes over a 256×178×256 volume, Three.js raycast annotations, FastAPI WebSocket sync, and a **live deployed link** (neuroview.onrender.com).
- **Team:** 4. Roles were split clearly: 3 people on UI, art and landing page, 1 on backend.

### Pay Pals: Best Finance Hack, Capital One (XI)
https://devpost.com/software/project-c1nomzfei7a0 · video https://www.youtube.com/watch?v=W3TqMvbcWA0
- Social savings with friends. Plain template, about 485 words, but **24 captioned images and 2 GIFs**, the most visual write-up in the set.

### Others in XI, for pattern-matching
- **ATC-Trainer** (Best Use of ElevenLabs): an air-traffic-control voice trainer whose tagline is just "Proceed To Runway". https://devpost.com/software/atc-trainer
- **TenderYes / ADJOURNED** (Morgan & Morgan x3): built exactly to the sponsor's detailed spec, including "swipe right" UX. https://devpost.com/software/tenderyes , https://devpost.com/software/adjourned
- **MEALCRAFT** (Everyday Life & Wellbeing): https://devpost.com/software/mealcraft
- **StudyVerse** (Best Creative Media): https://devpost.com/software/studyverse-mxbws8
- **Talkio** (Best Use of DigitalOcean): https://devpost.com/software/talkio
- **Pocket Money** (Least Vibecoded, judged by a CISE professor): https://devpost.com/software/pocket-money-bhrtio
- **FortBox** ("Fortnite Duels in Roblox!"): a winner with **35 likes and 11 comments**, the most-liked project in XI. Its prize label was not captured. https://devpost.com/software/fortbox (gallery: https://swamphacks-xi.devpost.com/project-gallery)
- **9Lives**: one-click thrift alternatives, using Gemini to turn messy product HTML into search queries across eBay, Facebook Marketplace and OfferUp, plus a CO2-savings estimate. https://devpost.com/software/9lives-5kpg7h

---

## 2. SwampHacks X (Jan 2025) teardowns

Prizes: 1st/2nd/3rd Overall (MLH pins), track 1sts for AI, Environmental, Health, Education and Social Good, plus Beginner, Auth0, Cloudflare AI, Terraform, GoDaddy and Gen AI. $5,000 total. https://swamphacksx.devpost.com/

### Rubbish: 1st Overall (X)
https://devpost.com/software/rubbish-bx5tai · video https://www.youtube.com/watch?v=nokVP1KtbKk
- **Pitch:** A smart recycling-bin lid. Put an item on top and it either drops in or gets ejected.
- **Wow moment:** A **physical servo flips your trash** at the table. There is also a Flutter app with collectible "rubbish characters" (gamification).
- **Technical core:** A self-labeled dataset ("hundreds of images", Label Studio), a YOLOv11 model on its third iteration, then Flask → pyserial → Arduino Uno → I2C PWM board → servo, all running locally with no cloud dependency. The build chain is written as one arrow line: "Flutter app --> Flask API --> … --> Servo --> Zip ties".
- **Write-up:** Template, about 820 words, 6 captioned app screenshots with jokey captions ("That's a load of rubbish!").
- **Team:** 2 (one person on ML and UI, one on hardware and API).
- **Why it won:** A tangible physical demo, a self-trained model, a relatable problem (contaminated recycling at their apartment), and humor. Again, two people were enough.

### Atmosphere: winner (likely an Overall place; label not captured) (X)
https://devpost.com/software/atmosphere-jd583o · video https://www.youtube.com/watch?v=y0euK0DiBVE
- **Pitch:** An AI environmental-health dashboard (AQI, UV, pollen) with a Gemini wildfire-spread simulation on a map.
- **Write-up:** Long. It claims a "custom spatiotemporal" TF.js model "trained on over 20 years of EPA data", "600,000 parameters", "98% accuracy". The word "AI" is attached to nearly every bullet, including "AI-enhanced SSL/TLS". It won anyway, but this buzzword density is exactly what the XII "Technical Understanding" and Least Vibe Coded criteria now punish. **Don't copy this style.** It has a live domain (atmosphere.wiki).

### Neural Network Visualizer: 1st AI Track (X)
https://devpost.com/software/neural-network-visualizer
- **Pitch:** "The first visualizer for Differentiable Logic Gate Networks." A niche research-adjacent topic made visual.
- **Signals:** **45 likes and 6 comments**, the most-liked project in X. Team of 4 with roles written per person.
- **Takeaway:** For the AI track, making an obscure ML idea visible and "first" (novelty claim) beat generic LLM apps.

### Other X track winners
- **Debug Demolition** (1st Education): ELO-rated multiplayer rooms where you fix AI-generated buggy code. https://devpost.com/software/tempdebugbattle
- **WasteWise** (1st Environmental): https://devpost.com/software/wastewise-d3qivz
- **Better Gator** (1st Health): a UF-student mental health iOS app. https://devpost.com/software/better-gator-7angv3
- **Ask a Duck!** (1st Social Good + Best Beginner, stacked): health insurance explained simply. https://devpost.com/software/ask-a-duck
- **WAYE - What Are You Eating?** (Best Use of Gen AI): https://devpost.com/software/waye-what-are-you-eating
- **Prometheus** (Environmental track entry, winner badge): fire and smoke detection. It reads like a full README, with a table of contents, Architecture, and **Model Performance Analysis** comparing VGG16 and InceptionV3. About 1,975 words. https://devpost.com/software/prometheus-rh7oxz
- **WatchDog.AI** (winner badge): violence detection with a fine-tuned ResNet-50 at "~99.7% accuracy" that saves only 5 s before and 10 s after an event (privacy angle). https://devpost.com/software/watchdog-umt3en

### Older SwampHacks winners (history)
- SwampHacks IV 1st place: **Wi-Fido**, an Embry-Riddle team of 4 that detects home-network data exfiltration and blocks the device. "Every now and then you build a hackathon project that just feels really good." https://www.alligator.org/r/a1763e2f92
- An early SwampHacks 2nd place went to a face recognition app that plays your favorite song. The prior winner was "Schedule Chomper", a course schedule builder. https://www.alligator.org/r/b551443968
- SwampHacks 2016 winners included "Honey, I'm Home" (face recognition to notify residents) and a phone-scan room describer for the visually impaired. "Representatives from the event's sponsors mentored, recruited and served as judges." https://archive.news.ufl.edu/articles/2016/01/college-hackers-unite.html

---

## 3. Other big and Southeast MLH events (2025–2026)

### HackUSF 2026: Best Overall 1st, A.N.R. (Agentic Nuclear Reactor), also won Google Cloud ADK
https://devpost.com/software/regenerative-agentic-nuclear-reactor (gallery https://hackusf-2026.devpost.com/project-gallery)
- **Pitch:** "Can a Large Language Model autonomously steer a high-voltage particle beam in the physical world?"
- **Wow moment:** A real vacuum chamber with a 3 kV electron beam aimed at a Faraday cup. Four agents read collision counts and adjust the 12 V steering rings with no human on the knobs.
- **Technical core:** Arduino for micro-current reading and DAC control. Google ADK agents: AnalyzeAgent (deterministic EWMA and settling detection) then DecisionAgent (Gemini reasoning about physics). FastAPI middle layer with a real-time dashboard.
- **Write-up:** Gallery captions include "ADK Agents Pipeline", "Hardware side of the Reactor" and "Dash Board with real time data". The agent pipeline is shown in a code block.
- **Team:** 4 (Kai Sprunger, Bryan Taylan, Dawn Balaschak, Patrick Corzo). Sprunger and Balaschak also built SignHero. Serial Florida winners.
- **Pattern:** Agentic AI paired with a physical, slightly dangerous-looking object. It also stacked an Overall win with a sponsor prize.

### HackUSF 2026: other winners (Tampa; heavy on hazards and safety)
- **Recall**: ESP32-S3 camera and mic glasses build searchable memories (YOLOv8n batch → Gemini 2.5 Flash Vision → ChromaDB → ElevenLabs voice answers) for cognitive impairment. It is ReStory-like. The write-up says "zero embedded systems experience" before this. https://devpost.com/software/recall-oswlh3
- **VigilEyes**: trucker fatigue detection with two custom YOLO models (eye closure, yawning) plus phone gyro and accelerometer. Fusion is weighted 60% vision / 40% motion into a 0–100 risk score with **explicit bands (0–59 safe, 60+ at risk, 80–100 critical)** and a dispatch dashboard. https://devpost.com/software/truck-driving
- **T.I.T.A.N.**: multi-agent hurricane operations (Google ADK + A2A). Flood, vulnerability and wind/road analysts feed a priority ranker, then logistics, then QA self-correction loops, then outreach, with a human override portal. The framing is "an autonomous workforce for good, not a demo assistant", anchored to Hurricane Milton 2024. https://devpost.com/software/t-i-t-a-n-tampa-intelligent-threat-analysis-network
- **NovaBay**: Tampa Bay parcel flood-risk GIS with an LLM assistant plus a home design sandbox. https://devpost.com/software/novabay
- **DontCollapse** and **Crisis-Net** (Crisis-Net won MLH Best Use of .Tech): disaster dashboards. https://devpost.com/software/dontcollapse , https://devpost.com/software/crisis-net
- **Implication for Sperry PlanIT:** Florida judges have seen many hazard dashboards. To stand out, a PlanIT entry needs a crew-level decision ("stop work: lightning 6 mi, gusts 40 mph"), not just another map of layers. VigilEyes-style explicit risk bands and T.I.T.A.N.-style agent explanations are the bar.

### HackGT 12 (Georgia Tech, 2025): Best Overall 1st, Dose
https://devpost.com/software/dose-ebmo9z · video https://www.youtube.com/watch?v=j7cSnyq9Vn8 (gallery https://hackgt-12.devpost.com/project-gallery)
- **Pitch:** "Modern care in a bottle". A load-cell pill bottle plus an adherence web dashboard.
- **Technical core:** Xiao ESP32-C3, TAL220 load cell, HX711, 3D-printed PLA enclosure, Supabase real-time, Radix UI dashboard with adherence scores and anomaly detection.
- **Write-up:** Opens with hard stats ("30–50% of patients… $100–$300 billion annually"). Short bullet lists, about 1,100 words. Team of 4.
- **Pattern:** A simple, tangible hardware object plus a clean dashboard plus a big-number problem. Not technically extreme.
- Also at HackGT 12, **Dispatch** won its track 1st ("Hall of Illusions"). It is VR first-responder training where "your body becomes the joystick" through IMU trackers and a custom SteamVR driver. The write-up **cites arXiv papers and a firefighter study** in the Inspiration. https://devpost.com/software/dispatch-u7fwrv

### Hacklytics 2026 (Georgia Tech, data science): Best Overall 1st, Alleaf
https://devpost.com/software/alleaf · video https://www.youtube.com/watch?v=N70LVYrQs0g (gallery https://hacklytics-2026.devpost.com/project-gallery)
- **Pitch:** Real-time stress detection from HRV that triggers haptic bilateral stimulation plus RAG meditation guidance.
- **Technical core:** ESP32 BLE with a red-LED sensor for RR intervals. A deliberately **simple linear regression trained on the WESAD dataset**, chosen for interpretability. LangChain RAG over an Actian vector DB, Flask, Next.js.
- **Write-up:** Renamed headings ("Technical Implementation", "Development Challenges", "Key Learnings"). About 990 words. Team of 4.
- **Pattern:** Hardware on the judge's body plus a closed loop (sense → infer → act). They chose an interpretable model over a fancy one and said why.
- **Conduit** (Second in Healthcare, 23 likes): "Disabilities do not come in one form, neither should technology." https://devpost.com/software/conduit-y8gqoj

### Knight Hacks VIII (UCF, Oct 2025, 1,000+ hackers) and ShellHacks 2025 (FIU)
- Winners named by Google Cloud: Knight Hacks had **Hermes** (an AI travel companion that interprets landmarks), **Emergent** (an AI crisis simulation platform for emergency managers to test disaster plans) and **KnightSource** (a student financial advisor). ShellHacks had **BrainSafe** (a kids' safety browser extension), **Imposture** (real-time posture monitoring) and an **A11y** tools suite. Google framed Knight Hacks projects as moving "beyond prototypes" to "production-ready" agent solutions. https://discuss.google.dev/t/google-cloud-ignites-agentic-ai-innovation-at-florida-s-premier-hackathons/325840
- Knight Hacks members took 5 awards at Bitcamp XI, including the "Best Razzle Dazzle" 1st and 2nd places. https://www.cs.ucf.edu/knight-hacks-wins-multiple-awards-from-bitcamp-xi/ (snippet)

### TreeHacks (Stanford): grand prizes
- **2026: Shepherd**, "a motorized smart cane for the visually impaired" using computer vision to detect obstacles and **steer** the user. Team of 4. Judging was on "creativity, technological complexity, and social impact". More than 15,000 applied, about 1,000 attended, $500k+ in prizes. Organizer Thijs Simonian said they want projects that "have an impact on the world". https://stanforddaily.com/2026/02/15/12th-annual-treehacks/
- **2025: Hawkwatch** ($11,000), an AI multi-stream surveillance system that alerts on crimes or medical emergencies with a dismiss/report UI. It was motivated by cases where "crucial moments were missed despite having camera coverage". Also: BlinkAI (Best Beginner, blink Morse code to text) and OmNom (Most Creative, a late-night food delivery robot inspired by Cut the Rope). https://stanforddaily.com/2025/02/18/treehacks-awards-200000-in-prizes-to-students-from-around-the-world/
- **2024: Baymax** (Moonshot Grand Prize, $10k plus flights to Japan), a CV robotic arm that feeds people with paralysis or Parkinson's. The article says winners "stood out to judges for products that showcased the intersection of innovation and empathy." https://stanforddaily.com/2024/02/27/treehacks-2024/

### HackMIT 2025
- Northeastern teams won the Entertainment track, the Sustainability track and the EigenCloud challenge. One was an AI insurance-claim filer for people after major loss; another was an energy-saving micro-grid. https://www.khoury.northeastern.edu/khoury-undergrads-win-three-categories-at-prestigious-mit-hackathon (snippet). I did not find the overall grand prize.

### Patterns across all winners above
1. **Hardware or a physical object in roughly 60% of top-prize winners**: ReStory, Rubbish, A.N.R., Dose, Alleaf, Shepherd, Baymax, Recall, SwampRise, Aegis. Judges at an expo can touch it.
2. **A specific human beneficiary named in the first sentence**: Alzheimer's patients, deaf people, hikers, truckers, patients on chronic meds, the visually impaired.
3. **A custom-trained or custom-tuned model**, not just an API call: SignHero MobileNetV2, Rubbish YOLOv11, Aegis PPE YOLO, VigilEyes 2x YOLO, WatchDog ResNet-50, Alleaf WESAD regression. Usually paired with an LLM for explanation.
4. **Small teams win**: OffTrails (2) and Rubbish (2) took Best Overall and 1st Overall. Most others had 4.
5. **Repeat winners dominate**: the SignHero/A.N.R. people, the Knight Hacks crew on ReStory, and Nathan (22-time winner, started at SwampHacks VI, see below).
6. **Stacking is common**: SignHero (Overall + Game Design), Ask a Duck (Social Good + Beginner), A.N.R. (Overall + Google ADK).
7. **Write-ups keep the Devpost template**, run 450–1,100 words, use bold key numbers, have 6–24 captioned screenshots, often a code-block pipeline diagram or table, and a quantified claim (latency, accuracy, dataset size). Several cite real research: Minetti 2002, WESAD, arXiv.

---

## 4. Judge and organizer quotes

### Devpost: "How to win a hackathon: Advice from 5 seasoned judges" (Square, Databricks, Google, NEAR, Atlassian)
https://info.devpost.com/blog/hackathon-judging-tips
- Richard Moot (Square): "A project that really stands out is one that was clearly considering the judging criteria… sometimes people pick only one of the judging criteria but miss everything else." On what lowers scores: "over-indexed on one particular criteria… extremely back-end heavy and has almost no front end, there's no UI." Also: "If you're just doing this because you want to win the prize money but don't really care… it usually comes through."
- Karen Bajza-Terlouw (Databricks): "it was surprising to see how many submissions did not fulfill the basic requirements." "Ambiguity is a red flag… the video intro looked really cool… but when you dug into the project or their GitHub, it was a lot lighter on code." "The storytelling component is huge, don't underestimate this." She liked videos that "demo their code" with voiceover.
- Kelvin Boateng (Google): "The first thing we're gonna do is just play the game." The projects that stand out "depart the most from that template". "Adding elements of sound and storytelling makes it really fun." Use the resources the sponsor provides.
- Maria Yarotska (NEAR): "Do they see the problem behind the solution, or are they just trying to fit their solution to this particular hackathon?" "if I see the fire in their eyes—that's what I'm looking for in a winner." She treats a big team as "pinkish" (a mild red flag) and a recycled project as a red flag.
- Warren Marusiak (Atlassian): "It's all about that finished product. Is that finished product something that I would want to use?" "if it doesn't really nail the prompt, it's going to be hard to give it full points." He dislikes "Rehashed ideas… something that's already been done."

### Devpost user story: Nathan, 22-time winner whose first hackathon was SwampHacks VI (built Solace, a disaster-relief SMS assistant)
https://info.devpost.com/blog/user-story-nathan
- "how the project is presented often carries more weight in terms of winning… 'selling your fish'."
- He anticipates what others will build: "if you're focusing on Generative AI and aware of the trend toward chatbots, push the boundaries by considering alternative interfaces like voice or graphical interactions."
- He adds "GIFs and embedding images within the text", uses markdown to bold keywords, and keeps backup videos. His video rule: "spend 60% of the time explaining and 40% actually demoing." He says "dedicating at least 15% of the hackathon's timeframe to polishing up the submission" (about 5 hours of 36).
- "it's perfectly fine to start simple. Using 'sample' or 'hardcoded' data… can still make a strong impact."

### Devpost: demo video and presentation guidance
- Judges often watch the video first, so open with a quick problem and solution overview. Write your own script: "Try to avoid ChatGPT here… its output is often too generic." Leave "at least two or three hours before the end" for the video and submission. Write the Devpost elevator pitch "before you start hacking". https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video
- "Skip mundane flows such as creating user credentials, and have any needed text copied to your clipboard." Show resolution of the problem you opened with. "The best presentations we see on our platform include screenshots and a video demo." https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
- Common criteria are technological implementation, ease of use, demonstration, potential impact, quality of idea and design. "If you can't explain how to use your project in a sentence or two, it might be too complicated." https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria
- Private videos can't be watched by judges. Devpost judges score 1–5 stars per criterion. https://help.devpost.com/article/84-video-making-best-practices , https://help.devpost.com/article/103-how-to-judge-an-online-hackathon (snippet)

### MLH organizer guide (how SwampHacks-style expo judging is likely run)
https://guide.mlh.com/general-information/judging-and-submissions/judging-plan
- Science fair format. MLH budgets **4 minutes per project: 2 for presentation and demo, 1 for questions and scoring, 1 for travel**. The judge debrief says 3 minutes. SwampHacks XII says 3 min demo + 1 min Q&A.
- Each project is seen by **3 different judges**. Scoring is **stack ranking**: each judge names a top 3 (3/2/1 points), and projects that show up in several judges' top 3s rise. Then organizers do a "cheating check on all winners".
- Implication: you don't need a perfect score from every judge. You need to be **someone's #1–3 of the batch they saw**, which rewards memorability over breadth.
- The 2-minute video should be "a demo, not a presentation".

### Judge field notes: "What judges actually score" (judged 3 events in July: MLH x DigitalOcean AI for Social Good, a sports hackathon, Aethera Hacks)
https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l
- A live end-to-end demo beat a more ambitious slides-only project "almost every time".
- "by the middle of the block the demos start blurring together." Judges rank against the teams they just saw.
- Strong teams open with a plain statement of what it does and for whom. Teams that led with market size or a backstory lost "a third of the slot".
- A platform built in 36 hours reads as poor judgment. A narrow scope done well wins.
- A one-line identity survives panel discussion. Naming a specific weakness raised scores.
- Things that **didn't** move scores: polish beyond readability, stack choice, team size, slide decks.
- His questions: who exactly is this for, what did you build *this weekend*, and what breaks first at scale.

### Jacklyn Biggin (MLH Coach, about 20 hackathons judged): "How to make your Devpost submissions not suck"
https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0
- Keep Devpost's template headings, because deleting them makes teams "miss out key details". Write the draft by Saturday evening. For sponsor prizes, state which product you used, why, and what it does in the project. Judges may have "five minutes to judge each project" and search for keywords such as the domain name for the domain prize. If they can't find it, you lose it.

### JetBrains x Codex hackathon judges (June 2026)
https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/ (snippet; the page returned 403)
- Every judge said to put the problem first. Jono Bacon (Stateshift) wants judges to *feel* the frustration. Avi Press (Scarf): state the problem and what the submission does about it. Bonnie Xu (OpenAI): start from something specific you can now build, not from the newest tool.
- "A strong project with a confusing demo loses to a simpler project that the judges understand." Do one thing well rather than five halfway. A demo that runs long is a scope problem.
- The first JetBrains Codex Hackathon top prize went to a solo project. https://blog.jetbrains.com/ai/2026/04/building-the-future-of-ides-inside-the-first-jetbrains-codex-hackathon/ (snippet)

### Ray Deck: "Lessons from winning five hackathons" (sponsor-run online hackathons)
https://sustained.substack.com/p/lessons-from-winning-five-hackathons
- The question sponsor judges ask is "If I reward this project, will my company look good?" "The sponsor is like a customer or a market." The video is paramount and gets reused in winner announcements. "Cut bone to ship."

### AI hackathon winner traits (OpenAI Open Model Hackathon 2025 analysis)
https://dev.to/jsb-securedme/what-ai-hackathon-winners-actually-have-in-common-1kla
- Winners had a problem graspable in one sentence, a demo that shows behavior, AI that is *necessary* to the result, a clear user, and limits named honestly. RoboChef (Best Overall) turned natural language into robot actions, so the physical result again stood out.

### Anti-patterns (from a multi-hackathon participant becoming a judge)
https://hackernoon.com/how-not-to-hackathon-the-hackathon-anti-pattern-guide
- Huge concepts that can't ship. Clinging to a dying idea. A new stack learned during the event. Testing only at the end. No captain or coordinator. Ignoring the rules page and stop-code time.

### Smaller sources (snippet)
- HackerEarth: teams that lose "ask the AI to build the differentiated part" and then can't explain it in Q&A. https://www.hackerearth.com/blog/10-tips-win-hackathon (snippet)
- Bird: judges care "less about the potential future… more about what you built and why you built it in that way". https://bird.com/blog/present-project-hackathon-judges (snippet)
- Reskilll: low scores go to mockups, hardcoded-only data and demo crashes. https://blogs.reskilll.com/what-hackathon-judges-look-for-complete-judging-criteria-breakdown-2026/ (snippet; vendor blog)
- TRON forum: judges see the video first, so "no one will watch a 30-minute video". Link a live demo for non-technical judges. https://forum.trondao.org/t/tron-grand-hackathon-improving-your-devpost-judge-score/9393 (snippet)

### SwampHacks organizer quotes found (thin; none about judging)
- Co-organizer Chandler Griffin (SwampHacks IV): "Each year we're just trying to create more of an environment for not only computer science students but also non-computer science students." https://www.alligator.org/r/a1763e2f92
- Co-founder Bernard Marger: "Some people build pieces of hardware… They might hack together a robot." https://www.alligator.org/r/b551443968
- I found no published SwampHacks XI or XII judge interview. The rubric text and prize descriptions on Devpost are the best organizer signal (section 0).

---

## 5. Source list (distinct)
1. https://swamphacks-xii.devpost.com/
2. https://swamphacks-xi.devpost.com/ (+ /project-gallery)
3. https://swamphacksx.devpost.com/ (+ /project-gallery)
4. Devpost project pages: restory, signhero, offtrails, aegis-axf8et, live-translation-extension, swamp-rise, neuroview, project-c1nomzfei7a0, atc-trainer, pocket-money-bhrtio, 9lives-5kpg7h, fortbox, tenderyes, adjourned, rubbish-bx5tai, atmosphere-jd583o, mathwhiz, neural-network-visualizer, prometheus-rh7oxz, watchdog-umt3en, tempdebugbattle, ask-a-duck, regenerative-agentic-nuclear-reactor, recall-oswlh3, truck-driving, t-i-t-a-n-…, novabay, dose-ebmo9z, dispatch-u7fwrv, alleaf, conduit-y8gqoj (all at devpost.com/software/<slug>)
5. https://hackusf-2026.devpost.com/project-gallery
6. https://hackgt-12.devpost.com/project-gallery
7. https://hacklytics-2026.devpost.com/project-gallery
8. https://discuss.google.dev/t/google-cloud-ignites-agentic-ai-innovation-at-florida-s-premier-hackathons/325840
9. https://stanforddaily.com/2026/02/15/12th-annual-treehacks/
10. https://stanforddaily.com/2025/02/18/treehacks-awards-200000-in-prizes-to-students-from-around-the-world/
11. https://stanforddaily.com/2024/02/27/treehacks-2024/
12. https://info.devpost.com/blog/hackathon-judging-tips
13. https://info.devpost.com/blog/user-story-nathan
14. https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video
15. https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
16. https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria
17. https://guide.mlh.com/general-information/judging-and-submissions/judging-plan
18. https://dev.to/kurbaitaev/what-judges-actually-score-notes-from-a-year-of-hackathon-judging-3p4l
19. https://dev.to/jacklyn/how-to-make-your-devpost-submissions-not-suck-37i0
20. https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/ (snippet)
21. https://sustained.substack.com/p/lessons-from-winning-five-hackathons
22. https://dev.to/jsb-securedme/what-ai-hackathon-winners-actually-have-in-common-1kla
23. https://hackernoon.com/how-not-to-hackathon-the-hackathon-anti-pattern-guide
24. https://www.alligator.org/r/a1763e2f92
25. https://www.alligator.org/r/b551443968
26. https://archive.news.ufl.edu/articles/2016/01/college-hackers-unite.html
27. https://www.cs.ucf.edu/tag/dylan-vidal/
28. https://www.khoury.northeastern.edu/khoury-undergrads-win-three-categories-at-prestigious-mit-hackathon (snippet)
29. https://www.hackerearth.com/blog/10-tips-win-hackathon (snippet), https://bird.com/blog/present-project-hackathon-judges (snippet), https://blogs.reskilll.com/what-hackathon-judges-look-for-complete-judging-criteria-breakdown-2026/ (snippet), https://forum.trondao.org/t/tron-grand-hackathon-improving-your-devpost-judge-score/9393 (snippet)

Gaps: video lengths (YouTube blocked); exact prize labels for Aegis, gatorlator, SwampRise, FortBox, Atmosphere and several HackUSF winners (pages truncated); the HackMIT and Cal Hacks 2025 grand prizes (not found); no SwampHacks judge interviews exist that I could find.
