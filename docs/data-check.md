# Data check for the Sperry brief (Oct 16)

I checked from a plain server with curl, no accounts, no keys. This only checks that we can *get* the data. Nothing is built.

| Dataset | Used for | Result | Notes |
|---|---|---|---|
| EIA-860M monthly generator inventory | 50+ real plant sites (brief requirement) | ✅ 346 FL plants, all with lat/lon | The header is on row 3, there's a notes footer, and it's one row per generator, so dedupe by Plant ID. Parsing takes ~38 s, so commit a CSV. Some month links redirect; `xls/august_generator2026.xlsx` works. |
| NOAA Storm Events details | Historical hazard events (training) | ✅ reachable, ⚠️ sparse | Only 948 FL events in 2025: 23 lightning, 47 flood, 0 heat. Drought, wildfire and coastal flood rows have no coordinates. Use it as context, not as the main label. |
| IEM NWS warning archive | Historical warnings (training + backtest) | ✅ dense: `accept=csv&sts=...&ets=...&location_group=states&states=FL` returned 14,476 rows for 2025 | The `wfo[]/year1` form returns almost nothing. The CSV has county codes (UGC), so polygons need the shapefile output. **This is the main label source.** |
| OSHA Severe Injury Reports | Outcome labels | ⚠️ osha.gov returns 403 to scripts | Florida is federal OSHA (no state plan), so FL incidents are in the data. The full download is a button on the [SIR dashboard](https://osha.gov/severe-injury-reports), so grab it in a browser at the event. There's a mirror entry on [data.gov](https://catalog-old.data.gov/dataset/severe-injury-report-sir-data-68a35). Geocodes are approximate. |
| NOAA GOES-19 GLM L2 (satellite lightning) | Live + replay lightning, 10 mi stop-work | ✅ listed today's 20-second files in the public `noaa-goes19` S3 bucket | NetCDF, no account. This replaces paid strike feeds (Blitzortung is off-limits). |
| Open-Meteo historical archive | Past heat/humidity/radiation/wind (training features, WBGT) | ✅ returns hourly data | Free for non-commercial use. |
| NWS active alerts | Live alerts | ✅ (checked earlier) | Needs a User-Agent. |
| USGS NWIS gauges | Flooding | ✅ (checked earlier) | |
| NIFC WFIGS incidents | Wildfire | ✅ (checked earlier) | |

## What this means
- Every data source the Sperry brief asks for can be fetched with no account. The only one needing a browser click is the OSHA file.
- The **ML hazard index** looks feasible inside the event:
  - Join Storm Events, IEM warnings and Open-Meteo history to plant locations by day.
  - Label with OSHA severe injuries plus storm events near the site.
  - Train a gradient-boosted model.
  - Evaluate on a later time period than the training data.
- The OSHA labels will be sparse per site. The fallback label is "a significant storm event within X mi", with OSHA used as a secondary check. Ask the Sperry reps which they'd rather see.

## Replay day for the hazard radar demo
I ranked 2025 FL warnings from the IEM archive (May-Sep) for the Jacksonville office, which covers Gainesville/Ocala:

| Day (UTC) | Heat advisory counties | Severe t-storm | Flood adv. | Flash flood |
|---|---|---|---|---|
| **2025-07-21** | 32 | 17 | 5 | 0 |
| 2025-08-16 | 32 | 4 | 18 | 3 |
| 2025-07-22 | 32 | 0 | 21 | 4 |
| 2025-07-14 | 0 | 18 | 7 | 0 |
| 2025-05-10 | 0 | 24 | 0 | 0 |

- **Jul 21 2025** has heat in the morning, then severe storms in the afternoon. That's the exact "safest window is 7-11am" story.
- GOES-19 GLM files exist for that day: 180 files in the 20:00 UTC hour alone, prefix `GLM-L2-LCFA/2025/202/`.
- Backup: **Aug 16** (heat + flooding).
- If the hazard radar gets picked, we pull this day at the start, so the demo never depends on tonight's weather.
