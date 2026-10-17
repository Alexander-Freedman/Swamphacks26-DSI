# Build plans for the top two directions

Prep only. No project code until hacking opens (event rule). Whichever direction I pick, the split below turns straight into issues.

Split for both: **me = backend/data/model**, **@luanamaldaner = frontend/demo/pitch assets**. We agree the API contract (below) in the first 30 minutes, so the frontend can build against a mock right away.

Accounts we need (set up at the event): a hosting account (Vercel/Render or Vultr for the MLH prize), Auth0, Tiger Data (direction 1), a Gemini API key, and a GoDaddy domain via the MLH code.

---

## Direction 1: field-crew hazard radar (Sperry Tech PlanIT Control)

### Data sources (checked Oct 16; all free with no key)
| Hazard | Source | Notes |
|---|---|---|
| Watches/warnings (flood, wind, heat, tornado, severe storms) | NWS `https://api.weather.gov/alerts/active?area=FL` | Returned 4 live FL alerts today. Needs a User-Agent header. Polygons included. |
| Heat index, CAPE, thunderstorm codes, wind, rain (hourly forecast) | Open-Meteo `api.open-meteo.com/v1/forecast` (`apparent_temperature`, `cape`, `weather_code` 95-99) | No key. Gives us the per-site "safest window" timeline. `lightning_potential` is null for FL (European models only), so don't use it. |
| Observed lightning | NOAA GOES-19 GLM L2 on the public `noaa-goes19` S3 bucket | ~30-45 s latency, ~4 km accuracy, ~74% detection in FL. Total lightning, not just ground strikes, so the 10 mi rule alerts more than a ground network would. Say so in the pitch. |
| Flooding / river stage | USGS NWIS instantaneous values, `waterservices.usgs.gov/nwis/iv/?stateCd=fl&parameterCd=00065` | Gauge height. Compare against flood stage where known. |
| Wildfire incidents | NIFC WFIGS current incidents (ArcGIS FeatureServer, `POOState='US-FL'`) | No key, returns live FL incidents. NASA FIRMS hotspots need a free map key, which is optional. |
| Wildlife | Static layer: FWC bear/snake/gator notes per county, or iNaturalist observations near the site | Keep it light; it's the least important hazard. |

### Sperry brief requirements (from the challenge doc; see docs/prizes.md)
These have to be in or the entry is weak on Sperry's criteria:
- at least 50 real power plants from EIA-860M as sites
- a lightning stop-work alert within 10 mi, with a 30-minute countdown that resets on each new strike
- a 6 PM next-day safety briefing
- crew photo hazard pins
- a supervisor dashboard ranking sites by risk
- an ML hazard index (0-10) trained on historical data, evaluated on a held-out time period. Labels come mainly from the **IEM warning archive** (14k FL rows for 2025, including heat advisories). Storm Events is too sparse in FL: only 23 lightning events and no heat events in 2025. OSHA is a secondary check. See docs/feasibility.md.

### Features (demo path first)
1. A map of 50+ EIA-860M plants/job sites, each colored by risk. The brief's flood example is the Mississippi, so they may expect plants nationwide; ask. Satellite lightning is "flashes", not "strikes", so say so.
2. Click a site to see a hazard index (0-10, as the brief requires) with a **"why" breakdown**: heat index 108°F, lightning potential high 2-5pm, flood warning polygon 3 mi away.
3. A **safest window today** timeline per site (hourly risk bars), so crews can plan the job for 7-11am.
4. An alert feed: a new NWS alert intersects a site, the site flips red, and a toast/SMS-style alert appears.
5. A plain-language crew briefing for the morning (Gemini), grounded only on the numbers above.
6. **Replay mode:** play back a real past storm day so the demo never depends on live weather.

### Technical core (for the AI/ML track and "Technical Understanding")
- A risk model: a transparent scoring model (OSHA heat-index bands, NWS lightning 30/30 rule, alert severity, distance to polygons), plus a small learned component if there's time.
- An eval: score historical days against what NWS actually issued, and show precision/recall on a held-out set in the README.
- Time-series storage of readings per site (Tiger Data, Postgres + Timescale), giving hourly history and trends.

### API contract (draft)
```
GET  /api/sites                     -> [{id, name, lat, lon, crew, job}]
GET  /api/sites/:id/risk?at=ISO     -> {score, level, factors:[{hazard, value, weight, why}], window:[{hour, score}]}
GET  /api/alerts?since=ISO          -> [{id, site_ids, hazard, severity, headline, polygon}]
GET  /api/briefing/:id              -> {text, generated_at}
POST /api/replay {date}             -> switches the data source to a recorded day
```

### Issues to open on pick
- Me: data ingest (NWS, Open-Meteo, USGS, NIFC) → normalized hazard table · risk scoring + window · alerts intersect · replay recorder · eval script + numbers · briefing endpoint.
- @luanamaldaner: map UI (Leaflet) + site panel · risk timeline chart · alert feed + toast · auth screen · landing/Devpost assets · video.

---

## Direction 2: Mental Models Tool ("predict, then reality grades you")

### Features (demo path first)
1. Pick a concept (mechanics only for the demo).
2. **Predict** with the simulation hidden: a slider, drag-the-landing-point, or multiple choice, plus one sentence of "why".
3. **Reveal**: the simulation runs, with the student's guess drawn as a ghost over the true result.
4. **Explain the miss**: the student's sentence is classified against a fixed misconception list (FCI taxonomy, with our own items; the real FCI is faculty-restricted, so never publish it), with structured output and reasoning shown. It never gives the answer.
5. **Target**: the next question is the one that best separates the suspected misconception.
6. **Mental model graph**: misconception nodes go red, then green, with a prediction-accuracy chart.

### Sims (hand-written and checked, never generated)
- Projectile (launch angle/speed → range, apex, force-at-apex question).
- Forces on a moving object ("motion implies force").
- Falling objects of different mass, with and without air resistance.
- Stretch: series vs parallel circuits.

The model only picks a template and sets its parameters.

### Technical core (AI/ML track)
- Misconception classifier: Gemini structured output over a fixed taxonomy.
- **Eval set**: ~60 hand-written student explanations labeled with misconceptions; report accuracy and a confusion matrix in the README.
- Question selection: pick the next item whose answer differs most across the candidate misconceptions.

### API contract (draft)
```
GET  /api/concepts                       -> [{id, title, template}]
POST /api/item {concept_id, user_id}     -> {item_id, template, params, prompt, prediction_type}
POST /api/predict {item_id, prediction, why} -> {truth, sim_params, error, misconceptions:[{id, p, why}]}
GET  /api/model/:user_id                 -> {nodes:[{id, label, state}], accuracy:[...]}
```

### Issues to open on pick
- Me: misconception taxonomy + seed items · classifier endpoint · eval set + script · item selection · user model storage.
- @luanamaldaner: sim renderer (canvas) for 3 templates with ghost overlay · prediction inputs · graph view · landing/Devpost assets · video.

---

## Either way
- Stack: React + Vite frontend, Python FastAPI backend, Postgres. These are the defaults we'd move fastest in; change if Luana prefers.
- H0: scaffold both apps and get an empty deploy live. By H6, the happy path is live at a URL.
- Same pitch shape: the hook question/scenario, the wow moment at ~0:45, the eval number, the sponsor tools named, stop.
