# Technical feasibility: hazard radar, Heat Badge, Mental Models / Sketch-to-Sim

Research only. Checked Oct 16 2026. Budget: 2 people x ~28 build hours = ~56 person-hours, minus about 8 for pitch, video, Devpost and sleep slack, so **~48 usable**.
Versions are the current stable releases on PyPI/npm as of Oct 16. Re-check model names (Gemini) at the event. "Checked" means I actually fetched or parsed the thing from this server, not just read about it.

---

## Things I found that change the plan

1. **Open-Meteo `lightning_potential` is null for Florida.** I got 0 non-null values out of 72 forecast hours from the default endpoint, and 0 of 48 from `/v1/gfs`. It only comes from European ICON models. build-plans.md lists it as a feature, so drop it. Use `cape` + `weather_code` 95-99 + GLM flashes instead.
2. **Storm Events is too sparse in Florida to be the label.** In the 2025 file there are 948 FL events in total. Of those, 23 are Lightning, 47 Flood and 268 Thunderstorm Wind, with no Heat or Excessive Heat events at all. Drought, Wildfire, Rip Current and Coastal Flood are zone-based with **no lat/lon** (0% coverage). Only point events have coordinates.
3. **The IEM warning archive is the dense label source.** One call (`accept=csv&sts=2025-01-01T00:00Z&ets=2026-01-01T00:00Z&location_group=states&states=FL`) returned 14,476 rows in 3.6 s. That includes 1,491 Heat Advisory county rows, 1,112 + 586 Severe Thunderstorm Warning rows (county + polygon) and 2,150 Flood Advisory rows. The `wfo[]=...&year1=` form I tried first returned only 3 rows. Use `sts/ets` + `location_group=states`.
4. **The MLH hardware lab has no humidity sensor and no ESP32.** The list has a Grove "Temperature and Barometer Sensor" (x3), which is a BMP280-class temp+pressure part, an air-quality sensor, Pi 4B kits (x9) and Arduinos with base shields (x12). It has no DHT/SHT/BME280 and no waterproof temp probe ([MLH hardware lab contents](https://guide.mlh.com/organizer-resources/hardware-lab-contents)). The humidity-capable Grove part is the **BME280**, not the BMP280 ([Seeed BME280 wiki](https://wiki.seeedstudio.com/Grove-Barometer_Sensor-BME280/)). Heat Badge needs parts we already own. We can't buy them (no-spend rule).
5. **The GLM feed is fast and small.** Each 20 s file is ~250 KB, 171-180 files/hour, so ~45 MB/h and ~1 GB/day. One file I checked had its S3 LastModified ~6 s after the end of its 20 s window, so lag from flash to data is about 30-45 s. One file over the full disk had 273 flashes.
6. **EIA-860M:** 346 unique FL plants (751 generator rows), and every one has lat/lon. Gotchas: the header is on row 3 (`header=2`), there's a NOTES footer row, there's one row per generator (dedupe on `Plant ID`), and parsing the 14 MB file takes ~38 s, so cache it to CSV. Several links on the EIA page 301 to the homepage: `october_generator2026.xlsx` fails and `xls/august_generator2026.xlsx` works.
7. **DeepSpace churns fast.** npm `deepspace` is at 0.42.3 with 110 published versions since the repo was created on Jul 13 2026, and the docs footer still says "Built with deepspace 0.30.1". The GitHub repo has 3 stars and 0 open issues ([docs](https://docs.deep.space/), [repo](https://github.com/deepdotspace/deepspace)).

---

## A) Hazard radar (Sperry brief)

### Libraries and gotchas

**GLM L2 LCFA from `noaa-goes19`**
- Packages: `s3fs` 2026.9.0, `xarray` 2026.9.0, `h5netcdf` 1.8.1 or `netCDF4` 1.7.5. Or skip S3 SDKs and use plain HTTPS: `https://noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=GLM-L2-LCFA/YYYY/DDD/HH/` (checked, no credentials).
- Use `s3fs.S3FileSystem(anon=True)`.
- `xr.open_dataset` on an s3fs file object needs `engine="h5netcdf"`. The `netCDF4` engine wants a path, or bytes via `memory=`. To keep it simple, download to a temp file, then open it.
- Variables (checked): `flash_lat`, `flash_lon`, `flash_time_offset_of_first_event` (xarray decodes it to datetime64), `flash_area`, `flash_energy`, `flash_quality_flag`. Dimensions: `number_of_flashes`, `number_of_groups`, `number_of_events`. Filter `flash_quality_flag == 0`.
- Path day is the day of year (`2026/289/18/`), in UTC.
- **Physics gotchas:**
  - GLM sees total lightning (IC + CG) and can't tell them apart, so a GLM-based 10 mi stop-work will alert more often than a CG-only network.
  - Location accuracy is about 4 km, with parallax offsets.
  - Florida daily flash detection efficiency is ~74% against the KSC LMA. Missed flashes are mostly small, short ones ([CIRA quick guide](https://ramsdis.cira.colostate.edu/rammb/training/visit/quick_guides/Quick_Guide_GLM_and_Ground_Networks.pdf), [Rudlosky/NASA](https://ntrs.nasa.gov/api/citations/20180007608/downloads/20180007608.pdf)).
  - Say this in the pitch as a known limit: "satellite total lightning, ~4 km accuracy".
- `glmtools` 0.3.0 exists for gridding, but we don't need it.

**Clustering and distance**
- Packages: `scikit-learn` 1.9.1 (`DBSCAN(metric="haversine")` on radians, eps = 10 km / 6371; `BallTree` haversine for flash-to-site queries). Or plain numpy haversine: 50 sites x a few thousand flashes is trivial.
- The 10 mi stop-work rule doesn't need clustering. It's "any flash within 16.09 km in the last 30 min", and the countdown restarts at each new flash. Clustering into cells is only for the "storm approaching, ETA" line: compute cell centroids per 5 min and fit a track. Treat that as a stretch.

**EIA-860M xlsx**
- Packages: `pandas` 3.0.6 + `openpyxl` 3.1.5.
- Gotchas: see above (`header=2`, footer, dedupe, 38 s parse, link rot). Run it once and commit `sites.csv`.

**NOAA Storm Events**
- Package: `pandas`, reading the `.csv.gz` directly (~12.6 MB/yr).
- Gotchas:
  - `BEGIN_DATE_TIME` is formatted like `01-DEC-25 00:00:00`, a 2-digit year in local time, and `CZ_TIMEZONE` is mixed (`EST-5`, `EDT-4`, `CST-6`). Convert with the offset in the string.
  - Zone events have no coordinates.
  - FL counts are small (above), so pool 2015-2025 for the model. Lightning is still about 20-40/yr.

**IEM watch/warning archive**
- Packages: `pandas` for CSV. `geopandas` 1.2.0 + `pyogrio` 0.13.0 + `shapely` 2.2.0 for `accept=shapefile` polygons.
- CSV has no geometry. It has `ugc` (county/zone codes) and `gtype` P/C.
- To map UGC rows to sites you need NWS county/zone shapefiles, or use the shapefile output with `limitps=yes` (storm-based polygons only).
- The service caps a request at one year unless it's filtered by state/phenomena/WFO ([IEM help](https://mesonet.agron.iastate.edu/cgi-bin/request/gis/watchwarn.py?help)).
- Times are UTC.

**ML hazard index**
- Packages: `lightgbm` 4.7.0, `scikit-learn` 1.9.1 for metrics and `TimeSeriesSplit`.
- Unit of prediction: site x day (or site x 3 h).
- Label: an IEM SV/TO/FF/HT warning covering the site's county or polygon, OR a Storm Events point event within 10 mi.
- Features: Open-Meteo archive (T, RH, CAPE, wind, radiation, WBGT), month, hour, prior-day warnings.
- Split by date: train 2018-2023, validate 2024, test 2025. Never split randomly. Rows from the same storm day sit at several sites, so a random split leaks.
- Positives will be rare. Use `scale_pos_weight` and report PR-AUC plus precision at k. The LightGBM docs say `is_unbalance` and `scale_pos_weight` distort probabilities, so calibrate (isotonic) before mapping to 0-10 ([LightGBM docs](https://lightgbm.readthedocs.io/en/v4.6.0/pythonapi/lightgbm.LGBMModel.html)).
- The 0-10 index is calibrated probability times 10, binned.
- Data pull is the real cost: Open-Meteo archive for 50 sites x 8 years hourly is 50 calls, fine. The free API is non-commercial with daily call limits, so cache everything.
- OSHA SIR stays a secondary check only. It's too sparse and the geocodes are approximate (data-check.md).

**Tiger Data (Timescale)**
- Packages: `psycopg[binary]` 3.3.6 (or `psycopg2-binary` 2.9.13). Plain SQL, no ORM needed.
- Hypertable: `CREATE TABLE readings(...); SELECT create_hypertable('readings', by_range('ts'));`.
- Continuous aggregate: `CREATE MATERIALIZED VIEW site_hourly WITH (timescaledb.continuous) AS SELECT time_bucket('1 hour', ts), site_id, max(...) ... WITH NO DATA;` then `add_continuous_aggregate_policy(...)`.
- **Gotchas:**
  - `CALL refresh_continuous_aggregate(...)` can't run inside a transaction, and psycopg opens one by default, so use `autocommit=True` for DDL and refresh. A cagg built WITH DATA also can't be created in a transaction ([Tiger docs](https://www.tigerdata.com/docs/use-timescale/latest/continuous-aggregates/create-a-continuous-aggregate)).
  - Recent data in a cagg only shows up after refresh, unless real-time aggregation is on. Check `materialized_only = false` for the live dashboard.
  - **Free plan limits: 2 services, shared compute, 750 MiB storage each, and still beta** ([Tiger changelog](https://docs.tigerdata.com/about/latest/changelog)). A full day of raw GLM flashes for the whole disk would blow that. Store only flashes inside a Florida bounding box (a few thousand rows a day) and per-site rollups. The 30-day Performance trial needs no card, but the data may be removed after.
  - If the cloud signup fails, `timescale/timescaledb-ha` in Docker on the Vultr box is the same SQL.

**Map (React)**
- Leaflet path: `leaflet` 1.9.4 + `react-leaflet` 5.0.0 (needs React 19; `leaflet` 2.0 is still alpha, don't use it) + `react-leaflet-cluster` 4.1.3 if we need clustering.
- MapLibre path: `maplibre-gl` 6.14.0 + `@vis.gl/react-maplibre` 8.1.3. It's GPU-based and better for warning polygons, a GLM flash heat layer and a time slider.
- 50-350 markers is easy for either. For hundreds of flashes animating, MapLibre GeoJSON sources beat DOM markers.
- Gotchas:
  - Leaflet CSS must be imported or tiles render broken.
  - The default marker icons break under Vite, so use `CircleMarker`.
  - MapLibre needs a style URL. Use free OpenFreeMap or demotiles; we don't want a key.
- Pick Leaflet unless @luanamaldaner knows MapLibre. Leaflet takes ~1 h less to get running.

**WBGT (Liljegren)**
- `thermofeel` 2.3.0 (ECMWF, pure numpy, "graduated" maturity):
  - Signature: `calculate_wbgt_liljegren(t2_k, rh, pressure_hPa, va_10m, ssrd, fdir, cossza)`.
  - It also has `calculate_mrt_from_bgt(t2_k, bgt_k, va)` for the badge. That assumes a 150 mm globe, so for a 40 mm ball use the ISO 7726 formula with D=0.04.
- `pywbgt` 3.0.7: Liljegren / Dimiceli / Bernard, with manylinux wheels for cp310-312 only. **There's no cp313 wheel, so it compiles C/OpenMP from source on Python 3.13.** Inputs are `pint` quantities via metpy: `wbgt(dates, lat, lon, solar, pres, temp_air, temp_dew, speed, method='liljegren', zspeed=...)`. The bundled NREL SPA handles the sun angle.
- `PyWBGT` (QINQINKONG): GitHub-only Cython, built for gridded climate data. Skip it.
- **Pick thermofeel.**
- **Open-Meteo inputs** (checked, all return for Gainesville):
  - `temperature_2m`, `relative_humidity_2m`, `dew_point_2m`, `surface_pressure` (hPa)
  - `wind_speed_10m` with `&wind_speed_unit=ms` (the default is km/h, an easy 3.6x bug)
  - `shortwave_radiation_instant` (use instant, not the hourly mean, for ssrd)
  - `direct_radiation` / `shortwave_radiation` → fdir
  - cos zenith from `pvlib` 0.16.1 `solarposition.get_solarposition`
- `wet_bulb_temperature_2m` is also available as a sanity check.
- Validate against a published number. The Liljegren paper's tables or a NWS WBGT forecast point both work.

**Auth0 roles**
- Package: `@auth0/auth0-react` 2.28.2. Backend: verify the JWT with `python-jose` or `pyjwt` against JWKS.
- **Gotcha:** roles are not in the ID token by default. Add a Post-Login Action that does `api.idToken.setCustomClaim('https://<ns>/roles', event.authorization.roles)`. The namespace must be URI-style, since a bare "roles" is restricted. The Action must be attached to the Login flow. Assign the user's role *before* their login, or it won't show until they log in again ([Auth0 support article](https://support.auth0.com/center/s/article/add-roles-and-permissions-to-the-id-token-using-actions), [community thread](https://community.auth0.com/t/how-to-add-roles-and-permissions-to-the-id-token-using-actions/84506)).
- Make two demo users, crew and supervisor, so judges can log in.
- Allowed Callback/Logout/Web Origins must list the deployed domain *and* localhost.

**Hosting FastAPI**
- Packages: `fastapi` 0.143.3 + `uvicorn` 0.54.0.
- **Vultr:**
  - $100 credits via the MLH coach code with no card, per [MLH](https://www.mlh.com/partners/vultr). Vultr's normal signup asks for a payment method ([Vultr docs](https://docs.vultr.com/platform/create-an-account.md)), so a human has to do this signup at the desk.
  - It's a plain VPS: ~1 h for Docker/Caddy (auto-TLS for the GoDaddy domain) plus systemd.
  - It's always on, so background pollers (GLM every 20 s, the 6 PM briefing cron) just work. It also qualifies for the Vultr prize.
- **Render free:**
  - Spins down after 15 min idle, with a 30-60 s cold start ([Render community](https://community.render.com/t/cold-boot-start-of-the-server-for-first-request/15911/2)).
  - Local disk is ephemeral, and a sleeping service kills the GLM poller and the scheduled briefing.
  - That's bad for a lightning countdown.
- **Pick Vultr.** Frontend static on the same box behind Caddy, or on Vercel.

### Table A

| Component | Tool (version) | Hours | Risk | Fallback |
|---|---|---|---|---|
| Site list (50+ FL plants) | pandas 3.0.6 + openpyxl 3.1.5 | 1 | Low (checked: 346 FL plants with coords) | Commit a prebuilt sites.csv |
| GLM ingest + poller (live) | HTTPS listing or s3fs 2026.9.0 anon + xarray/h5netcdf | 3 | Med: file-object engine quirks, poll timing | Download to a temp file and open with netCDF4 |
| 10 mi stop-work + 30 min reset countdown | numpy haversine or sklearn BallTree | 2 | Low | Same logic, frontend-only, on a replay JSON |
| Storm cell clustering + ETA | sklearn DBSCAN haversine | 3 | Med (noisy, looks wrong easily) | Cut it; show raw flashes + nearest-flash distance |
| Replay day (recorded GLM + alerts) | Pre-downloaded day → Parquet/JSON | 2 | Low | Required anyway for a weather-proof demo |
| NWS live alerts + polygon intersect | requests + shapely 2.2.0 | 2 | Low (needs User-Agent) | County-level match via UGC |
| Historical labels | IEM watchwarn CSV/shp + Storm Events gz | 3 | Med: UGC→geometry join, timezones | Use polygon-type (P) warnings only, point-in-polygon |
| Features (weather history) | Open-Meteo archive, cached | 2 | Low-Med (rate limits) | Fewer years or sites |
| LightGBM model + time split + eval table | lightgbm 4.7.0, sklearn 1.9.1 | 4 | Med: rare positives, leakage | Logistic regression on the same features; transparent rules score as baseline |
| Tiger Data hypertables + cagg + query-speed panel | psycopg 3.3.6, Tiger Cloud free | 3 | Med: signup, 750 MiB cap, autocommit | Docker timescaledb-ha on Vultr |
| WBGT per site/hour | thermofeel 2.3.0 + pvlib 0.16.1 | 2 | Low-Med (units, instant radiation) | thermofeel `calculate_wbgt_simple` or heat index (say so) |
| 6 PM next-day briefing | APScheduler/cron + google-genai 2.31.0 (`gemini-3.8-flash`) | 2 | Low | Template text from the numbers |
| Crew photo hazard pins | FastAPI upload + Leaflet marker; optional Gemini vision tag | 2 | Low | Manual hazard type picker |
| Map + site panel + ranking dashboard | react-leaflet 5.0.0 / leaflet 1.9.4, recharts 3.10.1, Vite 8 | 7 | Low-Med | Fewer panels; table view |
| Auth0 crew vs supervisor | @auth0/auth0-react 2.28.2 + Post-Login Action | 2 | Med (claims config) | Single role + hidden supervisor URL (loses Auth0 depth) |
| Deploy (Vultr + Caddy + GoDaddy domain) | Docker, Caddy | 2 | Med (account at desk) | Render paid-free trial is off-limits; use Render free + a pinger for the demo only |
| **Total** | | **~42** | | Fits 48 if clustering is cut |

---

## A+) Heat Badge (add-on to A)

- **Lab reality:** no humidity sensor, no ESP32, no probe ([MLH list](https://guide.mlh.com/organizer-resources/hardware-lab-contents)). The Grove Temp and Barometer is BMP280-class (temp + pressure, no RH). A globe also needs a sensor *inside* a black ball. The BMP280 Grove board won't fit inside a 40 mm ball well, so you need an inline thermistor or a DS18B20 probe.
- **Minimum BOM** if one of us owns it: ESP32 dev board (~$6), SHT31/BME280 (~$5), DS18B20 waterproof probe (~$2), and a ping-pong ball sprayed matte black. A Pi 4B from the lab can stand in for the ESP32, but its sensors still have to come from home. Confirm at the desk Friday night. If it isn't there and nobody owns parts, drop A+.
- **ESP32 vs Pi:**
  - ESP32 (Arduino core, `HTTPClient` POST JSON every 10-30 s) is badge-sized and runs off a USB power bank.
  - Pi 4B (Python `requests`) is faster to write, but it's not a wearable and Grove on Pi needs a Grove Base Hat. The lab list says "Pi 4B kits" without saying whether a hat is included.
- **Wi-Fi:** ESP32 supports WPA2-Enterprise (eduroam) but it's finicky across core versions ([Elektor](https://www.elektormagazine.com/labs/how-connect-esp32-to-wpawpa2-enterprise-network)). Venue guest Wi-Fi with a captive portal won't work at all. **Plan on a phone hotspot.** Buffer readings on the device and POST in batches so a dropout doesn't lose data.
- **Globe time constant:** table-tennis globes respond in ~3-4 min vs 6-9 min for larger globes, but with mean radiant temperature (MRT) errors up to 6 °C. A standard 150 mm globe takes 12-48 min ([d'Ambrosio Alfano et al. / PMC4580856](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4580856/), [UC eScholarship](https://escholarship.org/uc/item/1qx8c7sm)).
  - Demo plan: a heat lamp step test on stage shows the curve in ~4 min.
  - Show a pre-recorded outdoor run next to the forecast WBGT from thermofeel.
  - Natural wet bulb isn't measured. Compute it from T/RH/wind with Liljegren and say "globe measured, wet bulb modeled".

| Component | Tool | Hours | Risk | Fallback |
|---|---|---|---|---|
| Parts sourcing | Own parts (lab has no RH or probe) | 0.5 to confirm | **High** | Drop A+ entirely |
| Firmware: read sensors, POST JSON | Arduino-ESP32 core, OneWire/DallasTemperature, Adafruit SHT31/BME280 libs | 3 | Med | Pi + Python script |
| Wi-Fi to API | Phone hotspot | 0.5 | Med (venue Wi-Fi) | USB serial → laptop → API |
| Ingest endpoint → Tiger hypertable | FastAPI | 1 | Low | Same table as site readings |
| Globe build + 40 mm correction + step test | Black-painted ping-pong ball, ISO 7726 formula | 2 | Med (accuracy) | Present as "relative" exposure, not certified |
| Measured vs forecast chart | recharts | 1.5 | Low | Static chart from the recorded run |
| **Total** | | **~8.5** | Comes out of A's slack; can't fit with full A + clustering | |

---

## B) Mental Models Tool / Sketch-to-Sim

### Libraries and gotchas

**Sims**
- Matter.js `matter-js` 0.20.0 (last release Jun 2024) or `planck` 1.5.1 (Box2D port, active).
- **Neither does real air drag.** In Matter.js, `frictionAir` is a per-step linear velocity damping (`velocity * (1 - frictionAir * dt/baseDelta)`, checked in `src/body/Body.js`), not quadratic drag. Velocities are per step and depend on the timestep.
- For a tool whose whole point is "reality grades you", the ground truth must be **analytic or a hand-written RK4** (projectile range/apex in closed form; drag fall with F = -½ρC_dA v² integrated at a fixed dt). Use the engine only for rendering and collisions, or skip it and draw on a `<canvas>`.
- Hand-written is ~1.5 h per template and you can check it against textbook numbers.

**Markers / sketch recognition**
- `js-aruco2` 2.0.0 (pure JS, supports ARUCO_MIP_36h12 and custom dictionaries, has webcam demos) ([README](https://cdn.jsdelivr.net/npm/js-aruco2@2.0.0/README.md)).
- `@techstark/opencv-js` 5.0.0-release.1 is a 13 MB `opencv.js` with types for `findContours` and `approxPolyDP` in imgproc. I couldn't confirm `ArucoDetector` is in the build, since only `QRCodeDetectorAruco` types ship ([OpenCV forum](https://forum.opencv.org/t/using-aruco-from-opencv-js/13277)).
- Python: `opencv-contrib-python` 5.0.0.93 has `cv2.aruco.ArucoDetector`.
- Pick js-aruco2 for markers and Python OpenCV server-side if we need contours.
- **Reliability:**
  - Classical ArUco fails under uneven lighting, blur and small marker size. One study got a 0.72 detection rate at 15 lux dropping to 0.06 at ≤5 lux for 6 cm markers at 1 m ([iMarkers arXiv 2501.15505](https://arxiv.org/pdf/2501.15505), [DeepArUco arXiv 2411.05552](https://arxiv.org/html/2411.05552v1)).
  - Hand-drawn shapes are worse than markers. Thresholding pencil lines on paper under hall lighting with glare and shadows is the classic hackathon failure.
  - Design around it: printed markers for objects (ball, ramp start, wall), a thick black marker pen for lines only, a phone or webcam held overhead, and a "confirm what I saw" screen that lets the user fix a misread before simulating.
  - Gemini vision with a JSON schema (`{objects:[{type, x, y, w, h}], lines:[...]}`) is the fallback for freehand. It's slower (~2-5 s) and the coordinates are approximate, so still put it behind the confirm screen.

**Misconception classifier**
- Packages: `google-genai` 2.31.0 (Python) or `@google/genai` 2.30.0. Model: `gemini-3.8-flash` or `gemini-3.5-flash-lite` are the current stable ones. 2.0 Flash is shut down ([models page](https://ai.google.dev/gemini-api/docs/models)).
- Structured output: `response_mime_type="application/json"` + `response_json_schema` (a dict or Pydantic `model_json_schema()`), with an `enum` over our misconception codes. JSON Schema, including anyOf/$ref, is supported on all current models, and key order follows the schema ([Gemini structured output](https://ai.google.dev/gemini-api/docs/json-mode), [Google blog Nov 2025](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)).
- Output shape: `{codes:[{code, confidence, evidence_quote}], none_of_these: bool}`. Set temperature 0 and add few-shot examples per code. An enum constraint guarantees valid codes, not correct ones, which is what the eval is for.

**FCI taxonomy**
- **Public.** Table II of Hestenes, Wells & Swackhamer, *The Physics Teacher* 30:141 (1992) lists 28 misconceptions with codes ([PDF](https://gwern.net/doc/science/physics/1992-hestenes.pdf), DOI 10.1119/1.2343497). I extracted the codes:
  - **Kinematics:** K1 position-velocity undiscriminated, K2 velocity-acceleration undiscriminated, K3 nonvectorial velocity composition.
  - **Impetus:** I1 impetus supplied by "hit", I2 loss/recovery of original impetus, I3 impetus dissipation, I4 gradual/delayed impetus build-up, I5 circular impetus.
  - **Active force:** AF1 only active agents exert forces, AF2 motion implies active force, AF3 no motion implies no force, AF4 velocity proportional to applied force, AF5 acceleration implies increasing force, AF6 force causes acceleration to terminal velocity, AF7 active force wears out.
  - **Action/reaction:** AR1 greater mass implies greater force, AR2 most active agent produces greatest force.
  - **Concatenation of influences:** CI1 largest force determines motion, CI2 force compromise determines motion, CI3 last force to act determines motion.
  - **Other influences on motion:** CF centrifugal force, Ob obstacles exert no force.
  - **Resistance:** R1 mass makes things stop, R2 motion when force overcomes resistance, R3 resistance opposes force/impetus.
  - **Gravity:** G1 air pressure-assisted gravity, G2 gravity intrinsic to mass, G3 heavier objects fall faster, G4 gravity increases as objects fall, G5 gravity acts after impetus wears down.
- The current FCI test itself is gated on PhysPort for teachers. We only need the taxonomy, not the items.
- For a 3-sim demo, use about 8-10 codes: AF2, AF4, I3, I1, G3, G5, CI1, R1, plus "correct" and "other".

**Eval set (150-300 items)**
- I found no public labeled dataset of force/motion student explanations. The closest is the RAMP/UNF FLAIRS 2026 paper, with unclear data release ([FLAIRS](https://journals.flvc.org/FLAIRS/article/view/141769), [arXiv 2508.14823](https://arxiv.org/pdf/2508.14823)).
- Fast path, ~4-5 h for two people:
  1. Write 10-15 seed explanations per code ourselves, using the paper's descriptions and the FCI distractor wording as prompts.
  2. Paraphrase-augment with a *different* model or prompt to 200-250 items, with typos and slang.
  3. **Both of us label blind** a 100-item subset and report Cohen's kappa.
  4. Keep a 60-80 item held-out set written only by hand, and if possible by real students. Ask 10-20 hackers at the event "why does the ball keep moving?", since that's real-user data judges like.
  5. Report per-code precision/recall + a confusion matrix, and compare against a keyword baseline.
- Be upfront in the README that most of the set is synthetic.

**DeepSpace for live classroom**
- Packages: `create-deepspace` / `deepspace` 0.42.3. It's on Cloudflare Workers + Durable Objects, with presence, rooms (`RecordRoom`), real-time sync, auth and deploy to `*.app.space` ([docs](https://docs.deep.space/)).
- Maturity: 0.x, 110 releases in ~3 months, docs one minor series behind npm, 3 GitHub stars, and few public projects (14 on Devpost per prizes.md).
- It's feasible for a "class locks in predictions, then reveal" room, but expect undocumented breakage. **Pin the exact version on day one**, and timebox it to 4 h before falling back to a FastAPI WebSocket room.
- If we use DeepSpace auth, skip Auth0.

### Table B

| Component | Tool (version) | Hours | Risk | Fallback |
|---|---|---|---|---|
| 3 sim templates (projectile, forces on moving object, fall with drag) with ghost overlay | Canvas + hand-written analytic/RK4; optional planck 1.5.1 for rendering | 6 | Low-Med | 2 templates |
| Prediction inputs (slider, drag landing point, MC + "why") | React 19 + Vite 8 | 3 | Low | MC + text only |
| Taxonomy + item bank (~30 items) | FCI Table II codes | 3 | Low | 15 items |
| Classifier endpoint | google-genai 2.31.0, `response_json_schema` enum, gemini-3.8-flash | 2 | Low | gemini-3.5-flash-lite; keyword rules |
| Eval set 150-300 + labeling + kappa + metrics | Hand + paraphrase; sklearn metrics | 5 | Med (synthetic-data criticism) | 80 hand items only |
| Next-item selection | Simple discriminating-item table | 2 | Low | Fixed sequence per code |
| Mental-model graph + accuracy chart | recharts / react-flow | 3 | Low | Colored list |
| Sketch-to-Sim capture (markers) | js-aruco2 2.0.0 + getUserMedia | 4 | **High** (lighting, glare, scale) | Upload photo + Gemini vision JSON + confirm screen |
| Freehand line/shape recognition | opencv-js / Python OpenCV contours | 4 | **High** | Drop it; markers only |
| Live classroom room | deepspace 0.42.3 (or FastAPI WebSocket) | 4-6 | **High** (alpha SDK) | FastAPI WS room, ~3 h |
| Deploy + domain | app.space or Vultr | 1.5 | Low-Med | Vercel static + Render API |
| **Total (core + eval, no sketch, no DeepSpace)** | | **~28** | | Lots of polish time |
| **Total with sketch + DeepSpace** | | **~42-46** | | Tight; sketch is the item to cut |

---

## Top 5 technical risks overall and how to de-risk them in hours 0-6

1. **Live weather does nothing during judging (A).**
   - Hour 0-2: build the **replay day first**. Pull one real FL storm day: GLM files for a 6 h window, filtered to the FL bbox (~270 MB raw, a few MB filtered), plus IEM warnings for that day.
   - Make the stop-work countdown run off replay. Live mode is a toggle, not the demo.
   - Pick the day from IEM SV warnings near a plant (2025 has 1,698 SV rows).
2. **The ML index has no credible label or leaks (A).**
   - Hour 0-4: freeze the label definition (IEM polygon warning or Storm Events point event ≤10 mi, per site-day) and the split (train ≤2023 / val 2024 / test 2025).
   - Build the join on 10 sites first and print the positive rate. If it's under ~1%, go to site x 3 h windows or widen the radius.
   - Have a logistic-regression baseline number by H6, so the LightGBM result has something to beat. Ask the Sperry reps Friday night which label they prefer.
3. **Account and infra signups stall (Vultr, Tiger Cloud, Auth0, GoDaddy, Gemini key).**
   - Hour 0-1: I do every signup at the desk in one sitting. The Vultr MLH code supposedly needs no card.
   - Deploy a hello-world FastAPI + empty React to Vultr with Caddy TLS on the domain by H2.
   - Create the hypertable + cagg with `autocommit=True` by H3, and confirm the 750 MiB free cap is fine (store only FL-bbox flashes).
   - Fallback at each step: Docker Timescale on Vultr; Render free for the API, with a pinger only for the demo window.
4. **Camera/marker recognition is unreliable at the venue (B, Sketch-to-Sim).**
   - Hour 0-2: print 4 ARUCO_MIP_36h12 markers at ≥5 cm. Run the js-aruco2 webcam demo in the actual hacking room and at the judging table lighting, and log the detection rate over 50 frames.
   - If it's under 90%, drop freehand and go marker-only + photo upload + Gemini vision with a mandatory confirm screen.
   - Pre-record a clean capture for the video either way.
5. **Alpha SDK or hardware eats the schedule (DeepSpace for B, Heat Badge for A+).**
   - DeepSpace: hour 0-3 spike, `npm create deepspace@0.42.3`, two browsers in one room with presence and a shared prediction list, deployed to app.space. If it's not working by H4, switch to a FastAPI WebSocket room and drop that prize.
   - Heat Badge: Friday night, confirm we physically have RH + probe parts (the lab doesn't stock them). Get one reading POSTed over a phone hotspot by H4, or cut A+.

Also watch: the Open-Meteo km/h default for wind (`&wind_speed_unit=ms`), the `lightning_potential` null in FL, Storm Events 2-digit years with mixed time zones, and the Auth0 role claim namespace.
