# Hazard radar: go/no-go board layout + replay-day data plan

Only if the hazard radar is picked. Nothing is picked. **Nothing gets downloaded or built before 8:30 PM**; this is the plan for H0-2.

# L1 hazard radar: go/no-go board layout + replay-day data plan

Checked Oct 16 2026 from the bot server with curl. S3 listings and HEADs only, except two tiny fetches noted at the bottom. Tags: **[checked]** means I hit it today. **[memory]** means I didn't re-verify it today. **[inference]** is my own call.

---

## Part 1: Go/no-go board for a 1080p projector

### 1.1 Reference patterns (copy the system, not the logo)

| # | Reference | URL | What it looks like | What we take |
|---|---|---|---|---|
| 1 | **NWS HeatRisk** | https://www.wpc.ncep.noaa.gov/heatrisk/ [checked 200] | National map, 7-day. Five levels 0-4: Green "little/none", Yellow "minor", Orange "moderate", Red "major", **Magenta "extreme"**. Each map has a "Valid" and an "Updated" stamp. The legend puts the official Heat Watch/Advisory/Warning products next to the HeatRisk categories, and the page says HeatRisk "does not replace" official products. No hex codes are published. | Use the **5-band, magenta-on-top ramp** for our 0-10 index (2 index points per band). Put a Valid/Updated stamp on every view. Keep model output visually separate from official alerts, the same way HeatRisk separates itself from warnings. |
| 2 | **SPC Convective Outlooks** (Day 1/2/3) | https://www.spc.noaa.gov/products/outlook/ [checked] | One tab per day. Categorical risk fills, verified today from SPC's GeoJSON: TSTM `#C1E9C1`, MRGL `#66A366`, SLGT `#FFE066`. ENH `#FFA366`, MDT `#E06666` and HIGH `#EE99EE` are [memory]. Each category shows its name plus a number ("Slight, 2 of 5"). Issue and valid times are in the GeoJSON properties. | Show a **number plus a band name** ("7.4 · High"), never color alone. **Today / Tomorrow tabs** work like Day 1 / Day 2. Every value carries its issue time. |
| 3 | **NWS watch/warning map key + priority rule** | https://www.weather.gov/help-map [checked, parsed the HTML table] | Hex codes and priorities: Tornado Warning `#FF0000` (2), Severe T-storm Warning `#FFA500` (4), Flash Flood Warning `#8B0000` (5), Flood Warning `#00FF00` (39), Extreme Heat Warning `#C71585` (44), Heat Advisory `#FF7F50` (63), Flood Advisory `#00FF7F` (64), Special Weather Statement `#FFE4B5` (101). Rule: "only the most significant threat to life or property is displayed" per zone. | On the **map**, draw official warning polygons in their exact NWS colors, outline only, so they don't fight the index dots. In each board row, the alert chip shows only the **highest-priority** active product, plus a "+2" count. The "NWS does it this way" answer works for judges. |
| 4 | **Perry Weather lightning** (school/park ops) | https://perryweather.com/features/lightning-detection-system (301 redirect) [checked via search] | A bullseye of radius rings around each site. When a strike lands inside the ring, the site's **green check is replaced by a countdown timer and a red bolt**. The timer resets on each new strike, and an all-clear fires when it reaches 0. Sirens sound where installed. WBGT sits in the same dashboard. | This is the closest real product to the brief's 10 mi / 30 min rule. Copy it: **green check becomes red bolt + mm:ss**, a 10-mi ring on the map, and a visible reset. Saying so in Q&A shows the rule matches what fields and schools actually run. |
| 5 | **Tomorrow.io Insights + Timeline** | https://support.tomorrow.io/hc/en-us/articles/12134465881236-A-Guide-to-Insights-Timeline-and-Monitoring and https://support.tomorrow.io/hc/en-us/articles/10770929441300-Industry-Templates-Quick-Start-With-Ready-Made-Insight-Dashboards [checked via search] | Users set threshold rules ("Insights") with a severity (Moderate/Severe/Extreme) and a minimum duration. A per-location timeline (hourly, or minutely out to 6 h) shades the hours that breach a threshold. There's a **Construction** quick-start template. I found no explicit go/no-go column. | Build the **hourly "likely window" strip** as threshold-shaded hours, with the longest clear run bracketed. Show the rule behind each shaded hour on hover ("CAPE > 2000 and precip prob > 40%"). |
| 6 | **Ops boards: FAA NAS Status / airport departure board (FIDS)** | https://nasstatus.faa.gov/ (503 to curl today; [memory]) | NAS Status lists only the airports with active programs (ground stop, ground delay, closure), each with a reason and an end time. A FIDS board has one row per flight and a single status word ("DELAYED", "CANCELLED") in a color block. | **Exceptions first.** Only the top ~15 sites get full rows, and everything below the threshold collapses to "+38 sites below 3". Each row gets one status word (GO / HOLD / STOP) in a block, readable from across a room. |
| 7 | Utility outage dashboards (PowerOutage.us, FPL outage map) | https://poweroutage.us/ (403 to curl, [memory]), https://www.fplmaps.com/ [checked 200] | A ranked table (customers out, by state/county) next to a map, with a prominent "last updated" stamp. | Ranked table + map, and **freshness stamps per source** (our coverage strip). |
| 8 | Windy / Ventusky | https://www.windy.com/ [checked 200] | A full map with a **time scrubber/timeline along the bottom** and play/pause. | The **replay scrubber** (6 AM to 9 PM, 1x/30x/120x). |

### 1.2 The one layout (1920 x 1080, light theme)

Why light: expo halls are bright, and projectors wash out dark themes. If we test on the real screen and it washes out, switch to the dark tokens (same layout) [inference; design-depth.md says test on the device].

```
y=0    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
       │ PlanIT · REPLAY of Mon Jul 21 2025 · 3:42:10 PM EDT  [Replay|Live|Tomorrow]   ▶ 30x  ───●──── │ 56px top bar
y=56   ├──────────────────────────────────────────────────────────────────────────────────────────────┤
       │ ⚡ STOP WORK  Deerhaven GS (Gainesville) · flash 6.2 mi 3:31:10 PM · ALL-CLEAR IN  18:42   [why]│ 88px banner, red
       │ ⚡ STOP WORK  Putnam (Palatka) · 8.9 mi · 24:05            + 2 more sites stopped               │ 2nd line 40px
y=184  ├───────────────────────────────────────────────────────────┬──────────────────────────────────┤
       │ #  SITE              TODAY  6a 7 8 9 10 11 12 1 2 3 4 5 6 7 8  NOW     │                                  │
       │                      index │ likely window (forecast, not model) │  │  MAP (Leaflet, gray basemap)      │
       │ 1  Deerhaven GS  ALA  7.4  ░░[███████]▒▒▓▓▓▓▓▒▒░  ⚡18:42  │  plant dots = index band color   │
       │ 2  Putnam        PUT  7.1  ░[██████]▒▓▓▓▓▓▓▒░░░  ⚡24:05  │  10-mi ring on stopped sites     │
       │ 3  Crystal River CIT  6.8  [████████]▒▒▓▓▓▓▒▒░░  HEAT     │  GLM flashes (last 30 min) as +  │
       │ ...15 rows, 44px each = 660px                              │  NWS polygons, outline in NWS hex│
       │ + 38 sites below 3.0 (all GO)                              │  legend: 5 bands + "model"       │
       ├───────────────────────────────────────────────────────────┤                                  │
       │ 52 sites · 52 forecast · 31 gauge ≤15 mi · GLM 20 s ago · model v3 (test 2025) · numbers ✓ │ │ 40px coverage strip
y=1080 └───────────────────────────────────────────────────────────┴──────────────────────────────────┘
        left = 1150px                                                right = 770px (drawer slides over it)
```

**Board columns (left 1150px):**
- `#` rank (40px). Rows are sorted by today's index, and **any site in an active stop-work floats to the top** regardless of index (the model never overrides a live alert).
- `SITE` (300px): plant name at 24px semibold, county code and fuel type in 16px muted. These are real EIA-860M names.
- `TODAY index` (110px): a filled block with the number at **36px bold mono** ("7.4") and the band word under it at 14px ("HIGH"). This is the **ML output**, a daily value issued 6 PM the evening before. Header tooltip: "Model · daily · issued Jul 20 6:00 PM".
- `likely window` strip (15 cells × 34px = 510px, 6 AM-8 PM): a **different hue family** (neutral gray to slate-blue), so nobody reads it as the 0-10 model. Cell lightness = how many hourly threshold rules fire (heat index ≥ 103°F, CAPE ≥ 1500 with precip prob ≥ 40%, gust ≥ 30 mph). A 1-letter glyph names the cause (H, T, R). A **bracket** marks the longest run of clean hours ≥ 3 h, labeled "WORK 7-11a". The column header says, word for word, **"Likely window · forecast guidance (Open-Meteo hourly) · not model"**. In Replay mode a thin vertical "now" line moves across the strip.
- `NOW` (150px): a live-alert chip showing the highest NWS-priority item only. Lightning shows `⚡ mm:ss` (the countdown, red block, white text). Otherwise a flood chip (USGS gauge over flood stage, or an NWS FL.W polygon) or HEAT (HT.Y / EH.W for the county). A green ✓ means no active alert, Perry-style.
- Unknown inputs get hatched gray cells, **never 0**.

**Stop-work banner (full width, 88px + 40px overflow line):**
- Red block `#B3261E` with white text (6.5:1, computed). Site name, the triggering flash's distance and time, and **ALL-CLEAR IN mm:ss** at 56px tabular mono.
- When a new flash lands within 10 mi, the countdown snaps back to 30:00 with a 300 ms flash of the row (reduced-motion: no flash, just the "RESET 3:44:02 PM" text). The second line lists up to 2 more sites, then "+N more".
- When it clears, the banner turns green with "ALL CLEAR 4:12 PM", stays 60 s, then collapses.

**Map panel (right 770px):** Leaflet with CARTO Positron (gray) tiles, so hazard colors are the only color on screen.
- Plant dots: filled by index band, 10-20px radius by rank, with a 1.5px `#111` outline (this is what makes yellow pass non-text contrast on white).
- Stopped sites: a dashed 10-mi ring plus a red bolt icon.
- GLM flashes from the last 30 min: small `+` marks fading by age, flash ≤ 10 mi from any site drawn darker.
- NWS warning polygons: 2px outlines in their exact help-map hex, no fill.
- Crew reports: a camera pin.
- Legend: "Index (model, daily)" with 5 swatches, "NWS warning (official)" with outline swatches.

**"Why 7.4?" drawer (slides over the map, 770px wide, click any row or the banner's [why]):**
1. Header: site, county, tz, "Index 7.4 HIGH · issued Sun Jul 20 6:00 PM EDT · model v3".
2. What 7.4 means, in one line from the eval: "In the 2025 test set, days scored 7-8 had a stop-work event on X% of site-days (n=…)". This is the calibration sentence. X comes from the real eval table. **Don't invent it.**
3. Per-hazard heads as 3 bars: P(lightning ≤10 mi), P(heat), P(flood/severe), each with its own band.
4. Top 5 feature contributions (SHAP), with signed bars: "CAPE fcst 3,200 J/kg +1.6", "climatology week 29 +1.1", "yesterday CG ≤10 mi +0.7"...
5. Source chips, one per input value, in the provenance format from sperry-deep.md 4.2: value · source · grid/station · distance · valid time · fetched time. Each chip opens the raw response (the archived JSON in the replay bundle).
6. Live rules section, **visibly separate**: the lightning rule text ("any flash ≤10 mi starts/resets a 30-min clock · brief requirement"), the flash list that set the current clock (time, lat/lon, distance), active NWS products with VTEC id, USGS gauge stage vs flood stage.
7. Likely-window rules: which thresholds shaded which hours, labeled "forecast guidance, not model".
8. Crew reports at this site, last 7 days, with photos.
9. Footer: "The model ranks the day. Live rules stop the work. The model never cancels an alert."

### 1.3 Color scale and contrast (computed today, WCAG 2.x formula)

Index bands borrow HeatRisk's order and NWS meaning:

| Band | Index | Fill | Text on fill | Fill vs white bg | Notes |
|---|---|---|---|---|---|
| Low | 0-1.9 | `#2E9E44` green | black 5.5:1 | 3.45:1 ✓ | |
| Guarded | 2-3.9 | `#F2D024` yellow | black 12.4:1 | 1.52:1 ✗ | Needs the `#111` 1.5px outline; text carries the meaning |
| Elevated | 4-5.9 | `#FF8C1A` orange | black 8.1:1 | 2.33:1 ✗ | Same outline |
| High | 6-7.9 | `#E0201B` red | **white 4.8:1** (black only 3.95) | 4.78:1 ✓ | Projectors make red bleed: test it; fall back to `#C62828` (white text 5.6:1) |
| Extreme | 8-10 | `#C71585` magenta (= NWS Extreme Heat Warning hex) | white 5.4:1 | 5.42:1 ✓ | |
| Unknown | n/a | hatched `#6B7280` | white 4.8:1 | 4.83:1 | Never shown as 0 |

- Raw NWS hexes are **too light for fills on white**: `#FFA500` is 1.97:1, `#00FF00` 1.37:1, `#00FF7F` 1.35:1. Use them only as **2px polygon outlines on the gray basemap**, plus a dark text label, and show the hex in the legend so the "NWS colors" claim still holds. `#8B0000` (FFW) is fine on white at 10:1.
- Never color alone (WCAG 1.4.1): each index cell shows the number plus the band word, each strip cell shows a glyph, and the alert chip shows an icon plus text.
- The red/green pair is hard for deuteranopes, but the lightness differs and the number is always printed. Run a quick simulator check (Chrome DevTools > Rendering > Emulate vision deficiencies).
- Type: Public Sans (UI) + Roboto Mono or IBM Plex Mono (numbers, countdown), with tabular numerals so the countdown doesn't jitter. Minimum on the projector is 16px. Row text 24px, index 36px, countdown 56px. At ~2.5 m viewing distance, 10 mm per metre ≈ 25 mm letters, which is roughly 40px on a 55" 1080p screen. So only the index, the banner and the top rows are "across-the-room" sized, and the rest is for the person at the table [inference from the design-depth.md rule of thumb].

### 1.4 What a judge reads in 5 seconds (design for exactly these three)
1. **Red banner + ticking clock** means a real site is stopped right now, and why (flash 6.2 mi). It's the most concrete brief requirement, shown live.
2. **Top row**: the site with the highest risk today and its number. That's the "ranked supervisor map" requirement, answered without a click.
3. **The bracket**, "WORK 7-11a": the brief's "plan ahead instead of reacting" story, the Everglades 6:45 AM scene, answered.
Everything else (drawer, map details, coverage strip) is for the 2-minute conversation, not the 5-second glance. The top bar's "REPLAY of Mon Jul 21 2025" stays visible at all times (honesty, like CG's fixture labels).

---

## Part 2: Replay-day data plan

Day numbers: 2025 isn't a leap year, so **Jul 21 = DOY 202** and **Aug 16 = DOY 228**. Window: 6 AM-9 PM EDT = **10:00-01:00 UTC**, which is hours 10-23 of the day plus hour 00 of the next DOY. The Panhandle is CDT. For those sites, 6 AM CDT = 11Z and 9 PM CDT = 02Z, so pull through 02Z if Panhandle sites are in the top 15 [inference].

### 2.1 GOES-19 GLM L2 LCFA (S3 list requests only) [checked]
Prefix pattern: `https://noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=GLM-L2-LCFA/2025/<DOY>/<HH>/`. Files look like `GLM-L2-LCFA/2025/202/20/OR_GLM-L2-LCFA_G19_s20252022000000_e20252022000200_c20252022000218.nc` (20-s files, 180/hour, every hour complete, no truncated listings).

| Day | Hours (UTC) | Files | Total bytes |
|---|---|---|---|
| **Jul 21 2025** | 202/10-23 + 203/00 | **2,700** | **1,137.8 MB** (smallest hour 16Z 40.3 MB, largest 00Z 123.8 MB) |
| Aug 16 2025 (backup) | 228/10-23 + 229/00 | **2,700** | **1,286.2 MB** (22Z-00Z ~150 MB/h, so a much stormier evening) |

Per-hour bytes for Jul 21 (MB): 10Z 104.0, 11Z 78.9, 12Z 70.3, 13Z 64.1, 14Z 56.7, 15Z 43.3, 16Z 40.3, 17Z 46.2, 18Z 55.3, 19Z 69.0, 20Z 89.7, 21Z 91.5, 22Z 95.8, 23Z 108.7, 00Z 123.8. A file is ~0.44-0.61 MB at 20Z. Note: these are full-disk files (whole hemisphere), so most bytes are lightning far from FL.

**Time to pull 1.14 GB** [inference]:
- 32 parallel GETs from a cloud VM (us-east S3, egress free): ~1-2 min.
- 50 Mbps venue Wi-Fi: ~3 min.
- A single serial stream from this server measured 0.64 MB/s on one 466 KB file, which works out to ~30 min. **Parallelize, and do it before the event or on the Vultr box, not on venue Wi-Fi.**

**Processing:** stream each file (download → read with netCDF4/xarray → drop → delete). Keep `flash_time_offset_of_first_event` + `product_time`, `flash_lat`, `flash_lon`, `flash_energy`, `flash_area`, `flash_quality_flag` (keep `==0`) [memory: GLM L2 variable names]. Clip to a bbox of **24.0-31.5°N, -88.5 to -79.5°W** (FL + 150 km). Never store the raw `.nc` files. If time is short, take only the storm hours 16Z-01Z (~0.7 GB).

### 2.2 IEM NWS warnings for the day [checked 200 + filenames; parameters from the live `?help` page]
- CSV (county/zone + polygon rows):
  `https://mesonet.agron.iastate.edu/cgi-bin/request/gis/watchwarn.py?accept=csv&sts=2025-07-21T10:00Z&ets=2025-07-22T05:00Z&location_group=states&states=FL,AL,GA` → `wwa_202507211000_202507220500.csv`
- Shapefile zip (polygons for the map; storm-based polygons only with `limitps=1` + phenomena):
  `https://mesonet.agron.iastate.edu/cgi-bin/request/gis/watchwarn.py?accept=shapefile&sts=2025-07-21T10:00Z&ets=2025-07-22T05:00Z&location_group=states&states=FL,AL,GA` → `wwa_..._.zip`
  Optional filter: `&limitps=1&phenomena=SV,TO,FF,FA,FL,HT,EH&significance=W,W,W,Y,W,Y,W` (lists must align pairwise). `accept=kml` also exists (added 2026-04-24).
- "What was valid at 3:42 PM" snapshot: `...&at=2025-07-21T19:42Z&timeopt=2`.
- Local storm reports (ground truth for the drawer): `https://mesonet.agron.iastate.edu/cgi-bin/request/gis/lsr.py?sts=2025-07-21T10:00Z&ets=2025-07-22T05:00Z&states=FL&fmt=csv` → `lsr_..._.csv` [checked 200].
- SPC outlooks for context ("what the evening-before forecast said"): Day 2 issued Jul 20 17:30 `https://www.spc.noaa.gov/products/outlook/archive/2025/day2otlk_20250720_1730-shp.zip` (11.9 KB), and Day 1 13Z `.../day1otlk_20250721_1300_cat.lyr.geojson` (5.6 KB) [both checked]. Aug 16: replace dates with `20250815_1730` / `20250816_1300`.
- Aug 16 backup: same URLs with `sts=2025-08-16T10:00Z&ets=2025-08-17T05:00Z`.

### 2.3 Open-Meteo hourly for 50+ plant points
- **Multi-point works in one GET**: `latitude=a,b,c&longitude=x,y,z`, and the response becomes a JSON list [checked docs + 2-point HEAD 200]. 50 points ≈ 1 KB of URL. Use 2 chunks of 25-30 to keep URLs short and failures small. Use `timezone=auto` so the Panhandle gets CDT.
- **Limits** (free, non-commercial, from the pricing page [checked]): 600 calls/min, 5,000/hour, 10,000/day, 300,000/month. Weight rises past 10 variables or 2 weeks (15 vars × 2 weeks = 1.5 calls). Multi-location weighting isn't documented, so **assume each location counts**. 50 sites × 3 endpoints × ~1.5 ≈ 225 calls for the whole replay pull, nowhere near a limit. Training pulls across years are where limits bite (see hazard-ml.md).
- Three pulls, each answering a different question:
  1. **What the evening-before forecast said** (drives the replay's likely-window strip and the model's features, honest day-ahead):
     `https://previous-runs-api.open-meteo.com/v1/forecast?latitude=..&longitude=..&start_date=2025-07-21&end_date=2025-07-21&timezone=auto&hourly=temperature_2m_previous_day1,relative_humidity_2m_previous_day1,apparent_temperature_previous_day1,precipitation_probability_previous_day1,precipitation_previous_day1,cape_previous_day1,wind_gusts_10m_previous_day1,shortwave_radiation_previous_day1` [endpoint checked 200; check each var has `_previous_day1` data, since prob/CAPE may be null for some models]
  2. **What actually happened** (heat index/WBGT "observed" in the drawer):
     `https://archive-api.open-meteo.com/v1/archive?latitude=..&longitude=..&start_date=2025-07-21&end_date=2025-07-21&timezone=auto&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,wind_speed_10m,wind_gusts_10m,shortwave_radiation,soil_moisture_0_to_7cm,cloud_cover`
  3. Optional: the HRRR-ish near-analysis with CAPE, `https://historical-forecast-api.open-meteo.com/v1/forecast?...&hourly=cape,lifted_index,precipitation` [checked 200].
- Plus a 7-day lead-in (`start_date=2025-07-14`) of precip and soil moisture for the "ground has been soaking up rain for a week" soil-saturation feature.

### 2.4 USGS instantaneous values (stage/discharge)
- Legacy, works today: `https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=fl&parameterCd=00065,00060&startDT=2025-07-21T06:00-04:00&endDT=2025-07-21T21:00-04:00&siteStatus=all`. This **301-redirects to `nwis.waterservices.usgs.gov`** (the archive host for older data), which returns 200 JSON [checked].
- **Retirement warning:** USGS says WaterServices is retired in Q1 2027, with intentional degradation possible from Nov 2026 ([usgs.gov Water Data APIs](https://www.usgs.gov/tools/usgs-water-data-apis), [bulletin](https://content.govdelivery.com/accounts/USDOIGS/bulletins/42b03d7), [blog](https://waterdata.usgs.gov/blog/api-observations-decom/)). **Pull the replay day now** and commit it.
- Replacement: OGC API `https://api.waterdata.usgs.gov/ogcapi/v0/collections/continuous/items?f=json&monitoring_location_id=USGS-02236000&parameter_code=00065&datetime=2025-07-21T10:00:00Z/2025-07-22T01:00:00Z` [checked 200; queryables include `monitoring_location_id`, `parameter_code`, `time`, `value`]. Its rate limit without an API key is low [memory], and we don't create accounts, so use it per gauge only for the ~30-60 gauges within 15 mi of sites.
- Flood stage thresholds: NWS NWPS `https://api.water.noaa.gov/nwps/v1/gauges/<LID>` (flood categories) [memory, not checked today].
- Size: a state-wide day of 15-min stage+flow is a few MB of JSON, and the filtered parquet is under 0.5 MB [inference].

### 2.5 Compact replay bundle (< 50 MB, realistic ~5-10 MB) [inference]
Commit to the repo as `data/replay/2025-07-21/` (and `2025-08-16/`):

| File | Contents | Est. size |
|---|---|---|
| `manifest.json` | Every source URL, fetched_at, sha256, row counts, bbox, time window, code version that built it | <10 KB |
| `sites.csv` | plant_id, name, lat, lon, tz, county UGC, fuel type, nearest USGS gauges + distances | <20 KB |
| `glm_flashes.parquet` | t (int32 deciseconds since 10Z), lat/lon float32, energy, area, qf uint8; bbox-clipped, qf==0. FL summer afternoons run maybe 50-300k flashes in the bbox [inference] | 1-5 MB zstd |
| `site_flashes.parquet` | (site_id, flash_row, dist_mi) for dist ≤ 30 mi, which drives the countdown and the "approaching" metric | <0.5 MB |
| `warnings.csv` + `warnings.geojson` | IEM rows + polygons simplified to ~0.001° | <1 MB |
| `lsr.csv`, `spc_day2_0720_1730.geojson`, `spc_day1_0721_1300.geojson` | Context | <100 KB |
| `om_prevday1.parquet`, `om_observed.parquet`, `om_leadin7d.parquet` | 50-120 sites × hours × ~10 vars | <1 MB |
| `usgs_iv.parquet` + `flood_stages.csv` | Filtered gauges | <0.5 MB |
| `index_2025-07-21.json` | Model output issued "Jul 20 6 PM", per site: index, heads, top-5 SHAP | <100 KB |
| `expected_stopwork.json` | Hand-checked stop-work intervals per site, the **golden test** fixture for CI | <20 KB |
| `raw/` | The exact JSON/CSV responses the drawer's source chips open (small ones only; GLM raw not kept, but referenced by S3 key in the manifest) | <5 MB |

The server replays by a virtual clock (`t_replay = 10Z + (wall - start) × speed`) and feeds the same alert engine as live mode. Same code path, different clock, which is what we tell judges.

### 2.6 Training lightning: NCEI NLDN daily 0.1° tiles [HEAD-checked today]
Index: https://www.ncei.noaa.gov/pub/data/swdi/database-csv/v2/ (yearly `nldn-tiles-1986.csv.gz` … `nldn-tiles-2025.csv.gz`, then monthly `nldn-tiles-202601.csv.gz` … `nldn-tiles-202610.csv.gz`). Columns `ZDAY,CENTERLON,CENTERLAT,TOTAL_COUNT` (per hazard-ml.md).

| Year | URL | Bytes |
|---|---|---|
| 2018 | https://www.ncei.noaa.gov/pub/data/swdi/database-csv/v2/nldn-tiles-2018.csv.gz | 12,717,539 |
| 2019 | …/nldn-tiles-2019.csv.gz | 11,239,261 |
| 2020 | …/nldn-tiles-2020.csv.gz | 7,419,202 (smaller; check for a coverage gap) |
| 2021 | …/nldn-tiles-2021.csv.gz | 10,900,111 |
| 2022 | …/nldn-tiles-2022.csv.gz | 11,068,270 |
| 2023 | …/nldn-tiles-2023.csv.gz | 12,331,354 |
| 2024 | …/nldn-tiles-2024.csv.gz | 9,835,449 |
| 2025 | …/nldn-tiles-2025.csv.gz | 10,473,397 |

2018-2025 totals ~86 MB gzipped. FL-clip it once into one parquet (a few MB) and commit that, not the raw files. The tile day is UTC (it ends 8 PM EDT), so use yesterday's tile as a feature (leak rule in hazard-ml.md). The 2025 tile on Jul 21 doubles as a CG cross-check of the GLM replay ("GLM says 14 flashes ≤10 mi at Deerhaven, NLDN cell says N CG strikes").

---

## Open questions / to verify at the event
- ENH/MDT/HIGH SPC hexes are from memory. The rest of the colors were verified today.
- Do the `_previous_day1` variables for precipitation_probability and CAPE come back non-null for FL in July 2025? (1 small GET to check.)
- Projector test of red `#E0201B` vs `#C62828`, and light vs dark theme.
- Which ~15 sites are actually hit on Jul 21? Answer once glm_flashes is built, then choose the top-15 cut so the banner is real, not staged.

## Fetch log (for honesty)
- S3: 30 list requests (`list-type=2`), no GLM data pulled except **one 466 KB GLM file GET** to time throughput (over the "list/HEAD only" line, sorry; it was discarded to /dev/null).
- Two tiny metadata GETs: SPC current Day 1 GeoJSON and the archived Jul 21 Day 1 GeoJSON (5.6 KB each), to read the official fill colors. Everything else was a HEAD or a docs page.
