# New ideas + stress tests of the candidates

Nothing is picked yet. This adds 10 new ideas and red-teams the two current candidates (hazard radar, Mental Models Tool).

Team of 2, 36h (about 28h of real build time), expo table, 3-minute demo plus 1 minute of Q&A. Judges: about 50 from industry and UF DSI. Prize names and judge mix are in docs/strategy.md.

Scoring lens used throughout:
- (a) a wow moment in 30 seconds
- (b) a real technical core
- (c) a clear human benefit
- (d) a natural fit for General + 1 track + 2 or more sponsor/MLH prizes
- (e) buildable by 2 people in about 28h
- (f) demoable at a table

Win odds are a rough 1-10 gut score against a typical SwampHacks field. They are not a probability.

Account note: Tiger Data, Auth0, Gemini, Vultr and FIRMS keys all need a sign-up at the event.

---

## Part A: 10 new ideas

### Ranked summary

| # | Idea | Track | Prize stack | Odds |
|---|------|-------|-------------|------|
| 1 | Heat Badge: $20 measured-WBGT clip-on vs. forecast | Hardware | Sperry, Tiger Data, Gemini, domain | 8 (if the hardware desk has a temp/humidity sensor + ESP32/Pi) |
| 2 | Sketch-to-Sim: draw physics on paper, it runs on your drawing | AI/ML (or Entertainment) | Gemini, domain, (Auth0) | 7 |
| 3 | Bridge Oracle: photo of a stick bridge -> FEM -> predict which member snaps, then snap it | Hardware or AI/ML | Gemini, domain, Tiger Data (load-cell series) | 6.5 |
| 4 | Coral or King: calibrated Florida venomous-wildlife ID for field crews | AI/ML | Sperry (wildlife), Gemini, domain | 6.5 |
| 5 | Strike Sentinel: $25 lightning sensor fused with free GOES GLM satellite flashes | Hardware | Sperry, Tiger Data, domain | 6 |
| 6 | Get Up & Go: phone-camera Timed-Up-and-Go fall-risk test | AI/ML | Gemini, Auth0, domain | 6 |
| 7 | Depth Check: flood depth from one street photo + USGS gauges | AI/ML | Sperry (flooding), Gemini, domain | 5.5 |
| 8 | Bloom Watch: 7-day cyanobacteria forecast for Florida lakes | AI/ML | Tiger Data, Gemini, domain | 5.5 |
| 9 | Hold the Wire: scam-call detector that freezes the pending bank transfer | AI/ML | Capital One Nessie, Gemini, Auth0, domain | 5 |
| 10 | Storm Shift: Roblox lineworker-safety sim driven by today's real weather | Entertainment | Roblox, Sperry (stretch), domain | 4.5 |

### 1. Heat Badge (measured WBGT vs. forecast)
- **One-liner:** A clip-on badge with a black-globe thermometer and a humidity sensor. It computes Wet Bulb Globe Temperature (WBGT) at the actual work spot and shows how far that sits from what the forecast says.
- **Wow (30s):** The judge holds a heat lamp or hand-warmer near the globe. The badge goes from "45 min work / 15 rest" to "STOP: move to shade". On the supervisor map, that crew's pin turns red and a "why" panel shows it: globe +9°F above air, so a sun-load problem the weather app can't see.
- **Tech core:**
  - A DIY globe thermometer: a black-painted ping-pong ball with a DS18B20 probe inside (the classic low-cost globe build), plus an SHT3x/DHT sensor and optional wind.
  - The Liljegren WBGT model, which has open Python implementations: [pywbgt](https://pypi.org/project/pywbgt/) and [PyWBGT](https://github.com/QINQINKONG/PyWBGT).
  - The same model run on the Open-Meteo forecast, so measured and forecast WBGT sit on one chart.
  - Work/rest from the NIOSH/ACGIH WBGT tables.
- **Benefit:**
  - Heat index assumes shade, and full sun can add up to 15°F. NIOSH recommends WBGT ([CDC/NIOSH app page](https://www.cdc.gov/niosh/heat-stress/communication-resources/app.html)).
  - Florida bars local heat rules for outdoor workers ([HB 433, WUSF](https://health.wusf.usf.edu/health-news-florida/2024-03-11/florida-legislature-passes-bill-preempting-local-governments-heat-protections)).
  - The federal OSHA heat rule is still stalled ([CRS, Aug 2026](https://www.everycrsreport.com/files/2026-08-18_IN11701_d3cdbb2d5b672a844d5089835e3471debfc6e7bc.html)).
  - So crews have to rely on voluntary tools.
- **Prize stack:** General, Hardware, Sperry PlanIT (the heat piece of the brief), Tiger Data (sensor time series), Gemini (crew briefing), domain.
- **Data:** [Open-Meteo](https://open-meteo.com/en/docs) hourly temperature, humidity, wind and radiation. It needs no key for non-commercial use, and it also has `wet_bulb_temperature_2m`.
- **Novelty:**
  - Commercial meters exist: Kestrel 4400 and a Sper wearable WBGT at about $139 ([instrumentchoice](https://www.instrumentchoice.com.au/products/800126-wearable-wbgt-heat-stress-meter-with-tripod-mount-800126)).
  - So does a 2025 Dyson Award patch, [TempAlertPatch](https://www.jamesdysonaward.org/en-IN/2025/project/tempalertpatch).
  - The free OSHA-NIOSH app uses heat index, not WBGT, and NIOSH says it isn't being updated ([CDC](https://www.cdc.gov/niosh/heat-stress/communication-resources/app.html)).
  - No Devpost match found. Our angle is "about $20 of parts plus the gap between forecast and reality, per crew, on one map".
- **Biggest risk:** The hardware desk may not have the parts, and a globe sensor reacts slowly (5-15 min to equilibrate). For the demo, use a small globe (ping-pong ball) and a heat lamp, and show a pre-recorded outdoor run next to it.
- **Odds 8:**
  - It's a physical, touchable thing.
  - It hits the Sperry brief head-on (4 Sperry judges).
  - Hardware is rare at SwampHacks and wins out of proportion.
  - It's essentially an upgraded version of strategy direction 3.

### 2. Sketch-to-Sim (paper physics that runs)
- **One-liner:** Draw a ramp, a ball and a spring on paper. The phone/laptop camera reads the drawing and runs real 2D physics overlaid on your sheet. You predict first, with a finger trace, and your ghost path races the real one.
- **Wow (30s):** The judge draws a ramp with a Sharpie, holds it up, and a ball rolls down their own drawing.
- **Tech core:**
  - Recognize strokes and shapes from the camera (OpenCV contours + a small classifier trained on our own about 300 drawn samples, or Gemini vision constrained to a JSON schema), then validate.
  - Map paper to screen with a homography (ArUco markers on the sheet corners).
  - Run a hand-checked engine (Matter.js / Box2D), never LLM-written physics.
  - Ship an eval of recognition accuracy on held-out drawings.
- **Benefit:** The "predict, then reality grades you" learning loop from the Mental Models direction, with a far more tactile front end.
- **Prize stack:** General, AI/ML (or Entertainment & Creative Tech), Gemini, domain, Auth0 optional.
- **Data:** None external. We make our own sketch set, which is itself a judge talking point.
- **Novelty:**
  - Research prototypes exist. AR Physics had users sketch on paper, capture it with a tablet and simulate, tested with 12 students ([UCF](https://stars.library.ucf.edu/etd/4585)). Augmented Physics turns textbook diagrams into sims ([arXiv 2405.18614](https://arxiv.org/html/2405.18614v1)). SketchyDynamics is a 2013 library ([IJIMAI](https://ijimai.org/journal/node/484)).
  - No Devpost or commercial app found.
  - Gemini sims ([Google](https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/)) start from text, not your drawing.
- **Biggest risk:** Camera recognition is flaky under expo lighting. Mitigations:
  - A fixed overhead phone stand.
  - A white sheet with corner markers.
  - Thick markers.
  - A small fixed vocabulary of symbols: line/ramp, circle/ball, zigzag/spring, box/block, arrow/initial velocity.
- **Odds 7:** The physical drawing gives the Mental Models direction the wow it lacked. It can absorb that direction's misconception engine if we want it.

### 3. Bridge Oracle (predict-then-break)
- **One-liner:** Photograph a popsicle-stick or paper truss bridge. We pull out the member graph, solve the truss with the direct stiffness method, and predict which member fails first and at what load. Then the judge loads it on a load cell until it snaps.
- **Wow (30s):** The predicted failing member glows red on screen, the judge adds weight, and that member breaks while the load-cell trace spikes. Physical destruction at a table is unforgettable.
- **Tech core:**
  - CV extraction of nodes and members (Hough lines + joint clustering, with a scale marker).
  - A 2D truss solver.
  - Buckling (Euler) and tension limits from measured stick properties.
  - Live HX711 load-cell readout.
  - Logging prediction vs. measured error across all bridges broken over the weekend, so the error is shown honestly.
- **Benefit:** STEM education and intuition for structures. Popsicle-bridge contests already score how well teams predict ultimate load ([VTSU spec](https://vermontstate.edu/wp-content/uploads/2025/02/Bridge-Competition-Specs_02_12_2025_VTSU.pdf)).
- **Prize stack:** General, Hardware, Tiger Data (load series), Gemini (failure explanation), domain.
- **Novelty:**
  - There's a research spaghetti-bridge PINN that uses image geometry ([arXiv 2510.23117](https://arxiv.org/pdf/2510.23117)).
  - The PopsicleBridge iOS app simulates designs but doesn't read photos ([listing](https://appshunter.io/ios/app/popsiclebridge/id6758178670)).
  - No hackathon match found.
- **Biggest risk:** Glue joints dominate real failures, so the predicted load can be far off. Pitch "which member" (classification) first and load second. We need 10-20 cheap bridges, so build them Friday night.
- **Odds 6.5:** Huge wow and engineering judges (Lockheed, NextEra) will love it. The weaknesses are a weak sponsor stack and needing craft supplies.

### 4. Coral or King (calibrated Florida wildlife hazard ID)
- **One-liner:** An offline-capable phone classifier for Florida's snakes (6 venomous species among roughly 45). It's tuned so it almost never calls a venomous snake "safe", and it shows the visual evidence (band order, head shape).
- **Wow (30s):** The judge holds up a coral snake photo next to a scarlet kingsnake photo. The app splits them correctly, highlights the band order with a heatmap, and shows the nearest hospital plus the crew protocol.
- **Tech core:**
  - Fine-tune a small backbone (MobileNet/EfficientNet) on iNaturalist research-grade images exported via GBIF.
  - Use a cost-sensitive loss plus temperature-scaled calibration, with an abstain option ("can't tell: treat as venomous").
  - Grad-CAM explanations.
  - An eval report with a per-species confusion matrix and the venomous-to-safe false rate.
- **Benefit:** Field crews and hikers. The wildlife item in the Sperry brief.
- **Prize stack:** General, AI/ML, Sperry (wildlife hazard), Gemini (protocol text), domain.
- **Data:**
  - The iNaturalist archive via GBIF is free and needs no account to download ([GBIF license post](https://data-blog.gbif.org/post/gbif-occurrence-license-processing/), [gbif-dl](https://pypi.org/project/gbif-dl)).
  - Filter to CC0/CC-BY, since many photos are CC-BY-NC.
- **Novelty:**
  - Many apps exist: Snake.name claims 78% top-1 across about 800 species ([Kindwise](https://www.kindwise.com/post/snake-name---identify-snakes-in-seconds)), plus SnakeSnap and Whatsnake ([ConservationX](https://conservationx.com/project/id/1576/whatsnake)).
  - Our angle is regional, calibrated and asymmetric-risk, with honest eval numbers.
- **Biggest risk:**
  - The "already exists" objection.
  - Image download time. Start the pull at minute 0 and cap it at about 300 images per species.
  - The ethics question "what if it's wrong?". Answer: it never says "safe", only "treat as venomous" or "likely non-venomous, keep distance".
- **Odds 6.5.**

### 5. Strike Sentinel (no-subscription lightning alerting)
- **One-liner:** A $25 AS3935 lightning sensor at the job site, fused with free NOAA GOES GLM satellite flash data. Together they give a crew a 30-30-rule alert and an all-clear timer without a paid lightning feed.
- **Wow (30s):**
  - Replay a real Florida storm. GLM flashes rain onto the map, the 10-mile ring around a crew turns red, and a 30-minute all-clear countdown starts.
  - The live sensor clicks when we fire a piezo spark nearby. Test this first: the chip is designed to reject man-made "disturbers" ([AS3935 datasheet](https://cdn.sparkfun.com/assets/4/0/5/3/7/AS3935_Datasheet_EN_v2.pdf)).
- **Tech core:**
  - A GLM L2 LCFA NetCDF ingest (about 20-second files on the public NOAA bucket on AWS, [NOAA catalog](https://catalog.data.gov/dataset/noaa-goes-r-series-geostationary-lightning-mapper-glm-level-2-lightning-detection-events-groups3)).
  - Flash clustering, storm-cell tracking, and extrapolating the motion vector to an ETA per site.
  - Fusing the local sensor's distance estimate (40 km range, 14 steps, [SparkFun](https://sparkfun.com/products/15276)).
- **Benefit:**
  - Florida leads the nation in lightning deaths, with 5 so far in 2026 ([WLRN](https://www.wlrn.org/2026-09-04/florida-takes-the-lead-in-lightning-fatalities-across-the-country-this-year)).
  - Commercial crew-alerting tools are paid enterprise SaaS (DTN, Earth Networks; see Part B).
- **Prize stack:** General, Hardware, Sperry, Tiger Data, domain.
- **Novelty:** Hobby AS3935 builds are common ([Hackster StormSafe](https://www.hackster.io/team-brainstorm/stormsafe-6ced49), [SparkFun trail detector](https://news.sparkfun.com/2968)). Satellite + ground fusion with storm ETA isn't, as far as we found.
- **Biggest risk:**
  - There's no lightning indoors, and the sensor may ignore sparks.
  - GLM detection efficiency and latency (tens of seconds) are fine for situational awareness but weaker than ground networks.
  - Ethics: don't claim it's a life-safety device.
- **Odds 6.**

### 6. Get Up & Go (fall-risk screening from a phone camera)
- **One-liner:** The CDC STEADI Timed Up and Go test, automated from video. The person stands up, walks 3 m, turns and sits. The app times each phase and flags gait asymmetry.
- **Wow (30s):** The judge does the test at the table. In 15 seconds they get "9.8 s, low risk, turn phase slow on the left".
- **Tech core:**
  - MediaPipe pose.
  - Phase segmentation (sit-to-stand, walk, turn, sit) with a small temporal model or an HMM.
  - Validation against hand-timed ground truth on about 30 of our own recorded trials.
- **Benefit:** Falls in older adults. TUG ≥ 12 s is the STEADI flag.
- **Prize stack:** General, AI/ML, Gemini (plain-language report), Auth0 (patient accounts), domain.
- **Novelty:** Inertial smartphone TUG apps exist ([JMIR Aging 2025](https://aging.jmir.org/2025/1/e67322), [sTUG](https://mhealth.uah.edu/index.php/applications/stug)), and so does a video research pipeline ([UNB](https://unbscholar.lib.unb.ca/items/8735d161-e881-44f1-b01f-164e71d45498)). No consumer video app found.
- **Biggest risk:**
  - Medical-claim questions.
  - Expo space for a 3 m walk.
  - A healthy-young-judge demo shows "low risk" every time. Have recorded clips of slower gaits.
- **Odds 6.**

### 7. Depth Check (flood depth from one photo)
- **One-liner:** Snap a flooded street and get an estimated water depth, using known-size references (stop-sign poles, car wheels). Fuse it with nearby USGS gauges and a DEM, then answer "can a bucket truck get through?"
- **Wow:** Upload a Hurricane Ian photo and get "~16 in at this corner: impassable for crew vehicles; reroute".
- **Tech core:** Detection of reference objects, pole-length/wheel-occlusion geometry and tilt correction, following Alizadeh & Behzadan, who got about 5-in MAE ([Computational Urban Science](https://doaj.org/article/692eb908dddf4110b726a367ecada16c), [Colorado](https://experts.colorado.edu/display/pubid_364537)). Plus a USGS gauge overlay.
- **Prize stack:** General, AI/ML, Sperry (flooding), Gemini, domain.
- **Data:** USGS Water Services needs no key. The research datasets may not be public, so we'd hand-label about 100 photos.
- **Novelty:** Published research, but no app found.
- **Risk:** Accuracy, and the method needs a pre-flood reference. Use the wheel-diameter prior instead.
- **Odds 5.5.**

### 8. Bloom Watch (Florida lake cyanobacteria forecast)
- **One-liner:** A 7-day toxic-algae forecast for Florida lakes (Okeechobee, Lake Alice on campus if covered), trained on the EPA/NASA CyAN Sentinel-3 cyanobacteria index plus weather.
- **Wow:** A timelapse of the Okeechobee bloom with forecast vs. actual side by side, plus "don't let your dog swim here Saturday".
- **Tech core:** A gradient-boosted or ConvLSTM forecast on lake pixels with weather lags, and a backtest against persistence.
- **Prize stack:** General, AI/ML, Tiger Data, Gemini, domain.
- **Data:**
  - CyAN covers more than 2,000 US lakes ([EPA](https://epa.gov/sites/default/files/2019-06/documents/cyan_app_fact_sheet_final_19jun19_508_compliant.pdf), [NASA endpoint](https://earthdata.nasa.gov/data/projects/cyan)). Note: NASA ocean-data file downloads may need an Earthdata login (an account), so check before relying on it.
  - Open-Meteo for the weather.
- **Novelty:** CyANWeb shows current values, but we didn't find a public forecast product. It's the same shape as SwampHacks' Atmosphere air-quality winner.
- **Risk:** The data plumbing eats the weekend, and it isn't table-wow.
- **Odds 5.5.**

### 9. Hold the Wire (scam call -> bank hold)
- **One-liner:** On speakerphone, it transcribes the call live, scores scam patterns (urgency, gift cards, "don't tell anyone"), and when the risk crosses a threshold it puts a hold on the pending Nessie transfer and texts a trusted contact.
- **Wow:** The judge reads a scammer script. At about 15 seconds, the grandma's $2,000 transfer flips to "held: call your grandson first".
- **Tech core:** Streaming ASR, a small fine-tuned classifier on public scam-script corpora with an eval, and the Nessie money flow.
- **Prize stack:** General, AI/ML, Capital One Nessie ($1,000), Gemini, Auth0, domain.
- **Novelty: crowded.**
  - Google ships on-device Gemini Nano scam detection ([MobileSyrup](https://mobilesyrup.com/2024/05/14/google-io-2024-real-time-scam-call-alerts/)).
  - OnGuardAI is a commercial app ([BetaKit](https://betakit.com/onguardai-launches-app-to-flag-scam-calls-in-real-time/)).
  - ScamShield is a Pi project on Devpost ([Devpost](https://devpost.com/software/scamshield-87rbxe)).
  - Guardian Angel won AI Tinkerers ([link](https://nyc.aitinkerers.org/hackathons/h_Xu4dbx3kfMs/entries/ht_59nCFqZrOQQ)).
  - Our only new angle is the bank-side hold.
- **Odds 5:** Its value is being the best Capital One fit, not an Overall contender.

### 10. Storm Shift (Roblox)
- **One-liner:** A Roblox lineworker-training experience where today's real NWS alerts and forecast for a Florida site set the scenario. The player decides when to halt work, and the game scores safety vs. productivity.
- **Tech:**
  - The game logic is Luau.
  - HttpService pulls from our proxy. It's off by default and must be enabled in Game Settings > Security, with a limit of 500 requests/min ([Roblox docs](https://create.roblox.com/docs/cloud-services/http-service)).
  - Publishing needs a Roblox account, which a human has to create.
- **Prize stack:** General, Entertainment, Roblox ($400), Sperry (stretch: training, not the platform they asked for), domain.
- **Odds 4.5:** It's an uncrowded prize, but it's a slow stack and splits focus.

---

## Part B: red-team of the two existing candidates

### B1. Field-crew hazard radar (Sperry PlanIT Control)

**What already exists (what a judge will say).** Expect a Sperry judge to know these products:
- **DTN WeatherSentry Utility Edition.**
  - It has lightning alerts and all-clear notifications pushed to crew phones ([DTN lightning safety](https://www.dtn.com/wp-content/uploads/2020/05/ss_LightningSafety_0620.pdf)).
  - It does WBGT ([Seminole County case](https://www.dtn.com/wp-content/uploads/2023/06/cs_seminole-county-school.pdf)).
  - It has GPS custom alerts on 50+ parameters and "when and where to safely dispatch line crews" ([DTN utility](https://www.dtn.com/weather/utilities/weathersentry-utility-edition)).
- **Earth Networks / AEM (Sferic).** A ground lightning network, "real-time alerts ... field crew operations" ([AEM](https://aem.eco/?p=837)), and outdoor sirens ([Sferic Siren](https://get.earthnetworks.com/sfericsiren)).
- **AccuWeather.** AccuLightning, marketed to utilities for crews ([AccuWeather blog](https://www.accuweather.com/en/blogs-webinars/how-utilities-use-real-time-lightning-data-to-protect-crews-cut-truck-rolls-and-restore-power-faster/1929453)).
- **Tomorrow.io.**
  - Real-time lightning alerts.
  - A 90-hour lightning flash-density forecast, plus 15-30 minute threat cones.
  - A crew-management dashboard ([Walbridge case](https://www.constructiondive.com/press-release/20230815-advanced-weather-technology-tomorrowio-allows-walbridge-to-adapt-to-hazard/)).
- **Others.** Baron, Pelmorex and WeatherBug (Earth Networks) offer similar enterprise alerting. We didn't pull specific pages for these, so treat that as "known category".
- **OSHA-NIOSH Heat Safety Tool.** Free, heat-index-based, and NIOSH says it isn't being updated ([CDC](https://www.cdc.gov/niosh/heat-stress/communication-resources/app.html), [App Store](https://apps.apple.com/app/id1239425102)).

The honest gap these leave:
- (a) They're expensive, sales-led enterprise products ([RFP comparison note on pricing](https://www.rfp.wiki/specialty-industries/energy-utilities-software/weather-data-solutions-for-energy-and-utilities/tomorrow-io/alternatives-and-competitors)).
- (b) Each is mostly single-hazard, or weather-only. Wildlife and wildfire smoke/perimeter sit outside them.
- (c) They mostly alert. DTN does advertise a "Daily Planner", so planning alone isn't a gap; the gap is the per-job plan with the reason attached, on free data. "Do the pole job 7-10am, then switch to indoor work" is a scheduling output, not an alert.
- (d) There's no crew-side ground truth, such as a measured WBGT at the site.

**Data-licensing traps:**
- **Real-time lightning strikes are the trap.**
  - Ground networks (Vaisala NLDN, Earth Networks ENTLN, AccuWeather) are paid.
  - Blitzortung is CC-BY-SA but non-commercial. It needs approval and explicitly forbids "storm warning systems" ([Blitzortung forum rules](https://forum.blitzortung.org/showthread.php?pid=17453)), so **don't use it**.
  - Free options:
    - NOAA GOES-East GLM satellite flashes on the public AWS bucket (about 20 s files, no account) ([NOAA catalog](https://catalog.data.gov/dataset/noaa-goes-r-series-geostationary-lightning-mapper-glm-level-2-lightning-detection-events-groups3)).
    - Forecast-side proxies from Open-Meteo: CAPE, lifted index, and a 15-minutely Lightning Potential Index from HRRR/ICON ([Open-Meteo docs](https://open-meteo.com/en/docs)).
  - Say "satellite-observed lightning (GLM) + model lightning potential", never "real-time strikes".
- **Open-Meteo:** free for non-commercial use, with a separate commercial license. Fine for a hackathon, but say it in Q&A if asked about production.
- **NASA FIRMS:** needs a free MAP_KEY (email registration, so a human signs up). The limit is 5,000 transactions per 10 minutes ([summary](https://community.home-assistant.io/t/wildfire-monitoring-with-nasa-firms-live-fire-map-proximity-alerts-zero-custom-components/1016485)). For no account at all, use NIFC WFIGS current perimeters (public ArcGIS, refreshed about every 5 min) ([WIFIRE mirror](https://wifire-data.sdsc.edu/dataset/wfigs-current-wildland-fire-perimeters)).
- **NWS api.weather.gov and USGS Water Services:** public, keyless, and just need a User-Agent.
- **Wildlife:** there's no real-time feed. Use static range layers (GBIF occurrences) plus a seasonal prior. Be upfront that this is risk context, not detection.

**What makes it stand out:**
1. **Explainable, plan-oriented output.** Not "alert: heat". Instead: "Site 14: stop at 1:40pm. WBGT hits 88°F (sun + humidity); a storm cell 22 mi SW is moving 18 mph toward you, ETA 2:55; best window tomorrow 7-10am." The judge sees a schedule change, not a red dot.
2. **Replay of a real Florida event,** a recent Ocala/Gainesville afternoon storm on GLM data, run at 60x speed with the alerts firing at the right times, plus a backtest number: "would have pulled crews N minutes before the first flash within 10 mi".
3. **One ground-truth sensor** (Heat Badge, idea 1) that shows the forecast-vs-measured gap.

**8 toughest questions and strong answers:**
1. **"DTN and Tomorrow.io already do this. Why would a utility use yours?"** They're paid, single-pane alerting. Ours fuses five hazards into one per-site *plan* with a reason, and it runs on free public data. That matters for small co-ops and contractors who can't buy a DTN seat. We aren't replacing their feeds; PlanIT could ingest them, and the scoring and scheduling layer is the product.
2. **"Where's your real-time lightning from? Those feeds cost money."** NOAA GOES GLM satellite flashes, which are free and public, plus the model lightning potential from HRRR. We deliberately avoided Blitzortung because its terms forbid warning systems. In production you'd plug in a licensed ground network through the same interface.
3. **"How did you validate the risk score?"** We back-tested on a replayed day: lead time between our "halt" and the first GLM flash within 10 mi, and how many false halts there were. We show the number. The heat thresholds come from NIOSH/ACGIH WBGT tables, not invented weights.
4. **"Heat index is the wrong metric."** Agreed, that's why we compute WBGT with the Liljegren model (forecast) and, with the badge, measure it. Heat index assumes shade and can be 15°F low in sun.
5. **"What happens when there's no cell signal in the field?"** The last plan is cached on the device, with deterministic local rules: 30-30 lightning and the WBGT table. The badge alerts on its own without the network.
6. **"Isn't 'wildlife' just hand-waving?"** It's honest risk context: seasonal and range priors (e.g. fire ants, rattlesnakes, alligators near water), plus a crew-reported-sighting pin. We don't claim detection.
7. **"Who's liable if it says safe and someone gets hurt?"** It never says "safe". It shows the reasons and the time to the next threshold, and it defaults to the stricter rule when data is stale. It's decision support for the supervisor, the same posture as the NIOSH app.
8. **"How does this scale to a 10,000-site utility?"** Per-site scoring is a cheap vectorized function of gridded fields. We fetch grids once per region per update, not per site. Readings go to a time-series DB (Tiger Data), so history and replay come for free.

**Top 3 changes that raise win odds:**
1. Add the physical Heat Badge (or the AS3935) so judges can touch it. This turns "another dashboard" into hardware, which SwampHacks rewards.
2. Lead with a replay of a real Florida storm and one backtest number. Drop live-weather luck from the demo path.
3. Make the core output a *schedule* ("safest window") with a one-sentence why per site, and show the "explain" panel within the first 30 seconds.

### B2. Mental Models Tool (predict-then-simulate + misconception diagnosis)

**Competitive reality:**
- **Gemini** has generated interactive sims from a prompt in the consumer app since April 2026, and in Workspace by default since August 2026 ([Google](https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/), [Workspace update](https://workspaceupdates.googleblog.com/2026/08/generate-interactive-simulations-and-models-in-the-Gemini-app.html)). Every judge from a big-tech company will have seen it.
- **Loomin** took 1st of about 300 at NVIDIA GTC 2026: physics concept -> notes + adjustable 3D sim ([UCSC](https://news.ucsc.edu/2026/04/engineering-student-wins-nvidia-agents-for-impact-hackathon/)).
- **PhET** gets tens of millions of sim runs a year, and its own teacher guide already recommends predicting before running a sim ([PhET TPT guide](https://rachel.core2learn.org/modules/en-phet-static/publications/Teaching_physics_using_PhET_TPT.pdf), [PhET impact report](https://phet.colorado.edu/publications/PhET_Impact_Report_2025.pdf)). So "predict first" by itself is standard pedagogy, not novel.
- **Brilliant** does interactive predict-style lessons. We found no public data on it.
- **LLM + FCI tutors:**
  - A GPT Socratic Moodle plugin targets FCI misconceptions ([i-JET 2025](https://online-journals.org/index.php/i-jet/article/view/57879)).
  - "Professor Newton" runs POE cycles for KS3 ([aiskill.market](https://aiskill.market/blog/best-ai-tutors-for-ks3-physics)).
- **What's left as ours:**
  - Free-text explanation -> a *fixed FCI taxonomy* label (Hestenes' codes, e.g. I1-I5 impetus, AF active force ([Hestenes et al. 1992](https://gwern.net/doc/science/physics/1992-hestenes.pdf))) with a measured eval.
  - A persistent per-student misconception graph.
  - The next item chosen to target that misconception.
  - Never giving the answer.

**Failure modes:**
- A judge sees "AI study tool" and mentally files it with the flashcard apps within 10 seconds.
- The misconception classifier mislabels the judge's own explanation live. That's the worst case, and it's likely, because judges type odd things.
- The sim templates feel like PhET clones, less pretty and less complete.
- No learning-gain evidence, so it's all citations.
- LLMs themselves hold impetus misconceptions on the FCI ([Aldazharova et al. via CEDTECH](https://www.cedtech.net/article/assessing-ais-problem-solving-in-physics-analyzing-reasoning-false-positives-and-negatives-through-15592)). A judge can ask why we trust one to diagnose them.
- No sponsor challenge fits, so the prize stack is thin (General, AI/ML, Gemini, domain).

**8 toughest questions and strong answers:**
1. **"Gemini already makes physics sims. Why does this exist?"** Gemini shows you the right answer. We make you commit to a wrong one first, then name *which* misconception produced it and come back to it later. Generating a sim is free now; diagnosing the misconception is the hard part. Unrestricted GPT-4 tutoring left ~1,000 high-school math students 17% worse once it was removed, while a guarded tutor mostly avoided it ([Bastani et al., PNAS 2025](https://papers.ssrn.com/abstract=4895486)); we never hand over the answer.
2. **"How's this different from PhET?"** PhET is the sim. A teacher has to supply the predict step and diagnose the misconception. We automate that: forced prediction, error scoring, and misconception labels mapped to FCI codes, so it works without a teacher.
3. **"How accurate is the misconception classifier?"** We hand-labeled N explanations across 6-8 FCI misconceptions. Macro-F1 is X and the confusion matrix is here. If confidence is low, it asks a follow-up instead of guessing. **(Needs a real eval set; it's the single most important artifact.)**
4. **"LLMs fail the FCI themselves. Why trust one to diagnose?"** It doesn't solve physics. The sim is hand-checked code, and the model only picks a label from a fixed list given the student's text, the prediction and the true outcome. That's a much easier classification task, and we measured it.
5. **"Did it actually make anyone learn?"** We can't run a study in 36 hours and don't claim one. Predict-observe-explain and interactive engagement have strong evidence (Hake 1998: about 2x gains). What we show is that the diagnosis works, with eval numbers, and the instrumented loop that would let a class measure gains, e.g. pre/post FCI.
6. **"What happens when I type nonsense or the right answer for the wrong reason?"** Nonsense gets "can you say why?". Right-for-wrong-reason is the interesting case: we flag it when a correct prediction comes with a misconception-coded explanation. That's something multiple-choice tests miss.
7. **"Why only mechanics? Does it generalize?"** On purpose. Mechanics has the best-validated misconception inventory. The architecture (template sim + fixed taxonomy + eval) carries to circuits (DIRECT inventory) or chemistry; you'd add templates and labels, not rewrite.
8. **"Who's the user, and would a professor actually use it?"** Intro-physics students before recitation. The instructor dashboard shows class-level misconception heat ("40% still impetus on item 13") to drive tomorrow's lecture. That's the hook for UF faculty judges.

**Top 3 changes that raise win odds:**
1. **Make the input physical: Sketch-to-Sim (idea 2).** The judge draws on paper, predicts with a finger, and watches their ghost lose. That's the 30-second wow it currently lacks, and it doesn't look like a Gemini/Loomin clone.
2. **Ship a real labeled eval** (about 150-300 explanations, collected from hackers at the event, which is also a story) with macro-F1 and a confusion matrix on screen. This is what earns the AI/ML track's "non-trivial" bar.
3. **Open with the judge failing an FCI item.** "Ball at the top of its arc: which way is the force?" Then show the class-level misconception dashboard for a teacher. Do a pre-emptive 1-line Gemini/PhET contrast in the pitch, before they ask.

---

## Bottom line
- The hazard radar is still the higher-odds pick because of the Sperry prize, 4 Sperry judges and internship interviews.
- The new idea that most raises odds is **Heat Badge** bolted onto it: physical, honest about WBGT, keyless data.
- If I go with the learning direction, **Sketch-to-Sim + misconception eval** is the version that can beat "Gemini already does that".
- Avoid paid or restricted lightning feeds. Blitzortung's terms ban warning systems; use GOES GLM + Open-Meteo LPI/CAPE.

---

## Round 2 ideas (Oct 16 evening)
None beats the Sperry hazard radar on prize count. The first three are at or above the Mental Models core for Best Overall.

| # | Idea | Odds | Wow | Core | Stack | Risk |
|---|---|---|---|---|---|---|
| 1 | **Beat the Fingerprint** | 7 | The judge speeds a clip up 8% and drops it 2 semitones, plays it aloud, and it's still identified with "1.08x, -2 st" on screen; then they push until it breaks | Wang 2003 landmark hashing vs Panako-style triplet hashing (robust to pitch and tempo), with a robustness eval on held-out FMA (Creative Commons) tracks | Entertainment & Creative, Overall. The only idea with a natural Vobile story (their core is fingerprinting) | Shazam clones exist; the "try to evade it" game is the new part |
| 2 | **Fake Flip** | 6.5 | The judge types 100 "random" coin flips and in ~2 s gets "human, 96%" with the reasons | A classifier trained on sequences collected from hackers at the event (held-out AUC), plus 4-5 predict-then-10,000-sims traps scored with a proper scoring rule | AI/ML or Entertainment | Cheap (~15-20h). Could be the second domain inside Mental Models |
| 3 | **Patient Zero** | 6.5 (8 if 150+ play, 4 if ~20) | A harmless QR "virus" spreads through the venue all weekend. Judges predict the curve, then see the real one plus a "30% masked" replay | A stochastic model on the real contact network, fitted to observed infection times | Entertainment, DeepSpace (genuinely central) | Needs launching Fri night and an organizer OK. Operation Outbreak exists |
| 4 | **Prairie Smoke** | 5.5 | A superfog risk forecast for I-75 at Paynes Prairie, replaying the Jan 29 2012 pileup | GNV visibility history (IEM, no key) + FFS burn authorizations | AI/ML | No ground truth for superfog; FDOT is adding sensors |
| 5 | **Hear the Graph** | 5.5 | Screenshot any chart and explore it by sound (blind STEM students) | DePlot chart-to-table + an extraction eval | AI/ML | Existing sonification tools need the raw data; ours doesn't |
| 6 | **Which Bus** | 5 | The camera reads an approaching RTS bus number for blind riders | OCR + GTFS (free) | AI/ML | No public realtime RTS feed; Oculis exists |
| 7 | **Say It Back** | 5 | Post-stroke speech practice game | wav2vec2 phoneme scoring | AI/ML | The Speakery exists; expo noise |
| 8 | **Chord Lock** | 4.5 | Phones sing a chord that "locks" when in tune | DeepSpace sync | Entertainment | Thin core, loud venue |

**Combos:**
- Mental Models + Fake Flip as its second domain. That gives a 10-second hook and answers "does it generalize?".
- Patient Zero + Fake Flip as one "chance & contagion" project (Entertainment + DeepSpace).
