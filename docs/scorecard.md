# Scorecard: candidates vs the XII rubric

Nothing is picked. This scores the strongest candidates from docs/strategy.md and docs/ideas.md against the 7 XII Devpost criteria, plus prize odds and build risk.

Scores are 1-5 gut calls based on the research docs. They are not data.

**What the criteria ask**
- **Tech Und.:** could we explain how and why we built it?
- **Innov.:** innovation and creativity.
- **Func.:** does it work as demonstrated? This mostly comes down to demo reliability.
- **Design:** design and usability.
- **Purpose:** purpose and audience.
- **Track fit:** how well it fits the one track we'd enter.
- **Sponsor:** which sponsor challenge it could also win, if any.

| Candidate | Tech Und. | Innov. | Func. | Design | Purpose | Track fit | Sponsor | Prize slots in reach | Build risk (2 people, ~28h) |
|---|---|---|---|---|---|---|---|---|---|
| **A. Hazard radar** (Sperry brief, ML hazard index, replay) | 4 (we own the model and the rules) | 3 (FL judges have seen hazard maps; the edge is the crew decision + backtest) | 4 (replay mode means no live-weather luck) | 3 (a map is easy to make look good) | 5 (named user: crews, plus FL lightning/heat facts) | AI/ML 4 | **Sperry 5** (built to the brief) | Overall, AI/ML, Sperry ×3, Tiger Data, Auth0, Vultr, domain | Medium: lots of data plumbing, but every source is checked and free (docs/data-check.md) |
| **A+. Hazard radar + Heat Badge** | 4 | 4 (measured vs forecast is new) | 3 (hardware can flake; keep a recorded run) | 4 (something to touch) | 5 | Hardware 5 *instead of* AI/ML | Sperry 5 | Same, with Hardware instead of AI/ML | Medium-high: depends on the hardware desk having the parts |
| **B. Mental Models Tool** (predict → sim → misconception) | 4 (hand-written sims + eval) | 3 (predict-first is known, the diagnosis isn't) | 4 | 4 | 4 (intro physics students, with a UF faculty hook) | AI/ML 3 (needs a real eval) | none | Overall, AI/ML, Gemini, domain, Auth0 | Low-medium: the sims are small |
| **B+. Sketch-to-Sim** (B with a paper-drawing input) | 4 | **5** (no app does this) | 2-3 (camera under expo lighting is the risk) | 5 | 4 | AI/ML 4 or Entertainment 4 | DeepSpace (live classroom), maybe | Overall, AI/ML or Entertainment, Gemini, domain | High: computer-vision reliability |
| **C. Bridge Oracle** (photo → truss solve → snap it) | 5 (a real solver) | 4 | 3 (glue joints make the load guess noisy) | 3 | 3 (education) | Hardware 4 | none | Overall, Hardware, Tiger Data, domain | Medium-high: needs craft supplies and a load cell |
| **D. Hold the Wire** (scam call → Nessie hold) | 3 | 2 (crowded) | 4 | 3 | 4 (elders) | AI/ML 3 | Capital One 4 | Overall, AI/ML, Capital One ×1, Auth0, domain | Low-medium |

## Reading it
- **Best expected prize count:** A or A+. Sperry has 3 slots plus interviews and an estimated 5-12 entries, and those stack with AI/ML or Hardware plus the near-empty MLH prizes.
- **Best shot at a memorable Overall:** B+ or A+. Both put something physical in front of the judge (paper drawing, or the sensor).
- **Lowest risk:** B, then D.
- **What the new rubric rewards:** Technical Understanding favors whichever one we can explain end to end. That argues for a small stack and one model we train and evaluate ourselves, whichever idea it is.

## Open questions only the event can answer (ask Friday night)
1. Hardware desk: is there a temp/humidity sensor and an ESP32/Pi? A load cell? (Decides A+ and C.)
2. Sperry reps:
   - Is GOES satellite lightning OK?
   - Is 50 plants a hard minimum?
   - Which label do they prefer for the hazard index?
3. Our own team: is at least half of us at a first hackathon? (Decides First Timers.)
