# First 6 hours: ready-to-open issues

Nothing is picked. Whichever direction I pick at ~8:30pm, these become GitHub issues as-is (one issue per bullet, assigned per the split). Each issue has a "done when", so it's clear when to close it.

Split for both: **me = backend/data/model**, **@luanamaldaner = frontend/demo**. Times are hours after hacking opens.

---

## Hazard radar (Sperry PlanIT)

### H0-1 (both)
- **Repo skeleton:** `api/` (FastAPI, Python 3.12) + `web/` (React + Vite), each with a README, plus one `make dev` that runs both. *Done when:* `make dev` serves "hello" from both.
- **Accounts + deploy target:** Vultr box (MLH code), domain, Tiger Cloud, Auth0. *Done when:* `https://<domain>/api/health` returns ok.

### Me
1. **Plants:** EIA-860M → `data/plants.csv` (dedupe by Plant ID; ~346 FL plus whatever national set Sperry wants). *Done when:* `GET /api/sites` returns 50+ real plants with lat/lon.
2. **Replay day:** pull Jul 21 2025 GLM flashes (FL bbox), NWS/IEM warnings and Open-Meteo hourly for every site into `data/replay/2025-07-21/`. *Done when:* the files are committed (or downloaded by a script) and are under 50 MB.
3. **Stop-work engine:** a flash within 10 mi starts a 30-min countdown that resets on each new flash; deterministic, with unit tests. *Done when:* the tests pass on synthetic and replay data.
4. **Clock abstraction:** "now" is real time or replay time at Nx. *Done when:* `GET /api/sites/:id/risk?at=...` works in both modes.
5. **Label + split frozen (H4):** IEM warnings → site-day labels, train ≤2023, validate 2024, test 2025, positive rate checked. *Done when:* the numbers are in NOTES.md.
6. **Baseline (H6):** logistic regression hazard index (0-10) with PR-AUC on 2025. *Done when:* the eval table is in the README. LightGBM comes after H6.

### @luanamaldaner
1. **API mock:** a JSON fixture per the contract in docs/build-plans.md. *Done when:* the web app runs fully on the mock.
2. **Map:** Leaflet with the plants colored by risk, plus a click-through panel. *Done when:* clicking a site shows the factors and the "why".
3. **Stop-work UI:** a banner with the countdown that resets visibly. *Done when:* it's driven by the replay clock.
4. **Supervisor ranking:** a sorted list of sites by risk. *Done when:* it updates live in replay.
5. **Crew phone view:** a mobile layout of one site with a big STOP/GO. *Done when:* it works on a phone over the hotspot.
6. **Source links:** every number shows where it came from (NWS id, GLM file, Open-Meteo hour). *Done when:* hovering or tapping any number shows its source. Sperry's last winner won on this.

---

## Mental Models Tool

### H0-1 (both)
- The same repo skeleton and deploy as above. Accounts: the domain, a Gemini key, and a host.

### Me
1. **Misconception list:** 6-8 FCI-taxonomy codes for mechanics, each with a description. **Our own items only, no FCI questions.** *Done when:* `data/misconceptions.json` is reviewed by both of us.
2. **Items:** 9-12 scenarios (3 templates × 3-4), each listing which misconceptions its wrong answers reveal. *Done when:* `GET /api/item` returns one.
3. **Classifier:** a Gemini structured-output call (enum of codes + "unclear") plus a fast keyword/local fallback. *Done when:* `POST /api/predict` returns the codes in under 2 s.
4. **Eval set v0 (H6):** 100 hand-written explanations, both of us labeling blind, with Cohen's kappa. *Done when:* the accuracy and confusion matrix are in the README. Real hacker answers get added Saturday.
5. **Item selection:** the next item targets the top suspected misconception. *Done when:* a unit test shows the targeting.

### @luanamaldaner
1. **Sim renderer:** canvas with 3 hand-written templates (projectile, forces on a moving object, falling with/without drag). Physics comes from formulas, not Matter.js. *Done when:* the sims match the formulas on 3 checked cases each.
2. **Predict input:** drag an arrow or point plus a slider, with the sim hidden until they commit. *Done when:* the prediction is captured as numbers.
3. **Ghost reveal:** the prediction overlaid on the true outcome. *Done when:* it looks clear on a projector.
4. **Misconception graph:** red → green nodes. *Done when:* it's driven by the API.
5. **Printed cards (stretch):** scenario cards with corner markers, if we go for the camera input.

---

## Checkpoint at H6 (both)
- The deployed URL works end to end on the happy path.
- Answer "can we demo right now?" honestly in the Plan issue.
- Cut anything that isn't on the demo path (docs/feasibility.md lists the cut lines).
