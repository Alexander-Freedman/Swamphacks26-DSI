# Data check for the Sperry brief (Oct 16)

I checked from a plain server with curl, no accounts, no keys. This only checks that we can *get* the data. Nothing is built.

| Dataset | Used for | Result | Notes |
|---|---|---|---|
| EIA-860M monthly generator inventory | 50+ real plant sites (brief requirement) | ✅ 200, xlsx links on [eia.gov/electricity/data/eia860m](https://www.eia.gov/electricity/data/eia860m/) | Excel file with lat/lon per plant. Filter to FL. |
| NOAA Storm Events details | Historical hazard events (training) | ✅ `StormEvents_details-ftp_v1.0_d2025_c20260819.csv.gz` on [NCEI](https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/) | One gz CSV per year. Has lightning, flood, heat, wildfire and wind events with lat/lon. |
| IEM NWS warning archive | Historical warnings (training + backtest) | ✅ 200 for a JAX office CSV query | Iowa Environmental Mesonet `watchwarn.py`, filterable by office and date. |
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
