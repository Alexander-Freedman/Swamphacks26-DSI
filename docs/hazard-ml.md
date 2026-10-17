# Hazard index ML design (Sperry brief)

Only matters if the hazard radar is picked. Nothing is picked.

**Bottom line:**
- **Label:** a next-day "stop-work day" per plant: a cloud-to-ground strike within 10 mi, or a warning polygon over the site, or a heat advisory / WBGT ≥ 90°F.
- **Model:** a logistic baseline, then LightGBM per hazard, calibrated. Index = round(10 × calibrated probability).
- **Training lightning:** the free NCEI daily strike tiles (1986-now), not GLM.
- **Split:** train ≤2023, validate 2024, test 2025 on real day-ahead forecasts.
- **The one chart:** "does a 7 mean 7?"
- **Time:** ~10-14h for one person.

# Hazard index (0-10) for PlanIT Control: ML design notes

Research only. Nothing here touches the repo. Items marked **[checked]** I ran myself on 2026-10-16. **[inference]** means my own reasoning.

## TL;DR

- **Grain: site-day.** It's a next-day forecast for each plant, issued with the 6 PM briefing. Hourly isn't practical: the only multi-year lightning source cheap enough to pull is daily, and GLM is too slow to download at scale (see section 8).
- **Label: "stop-work day".** Per site per day it's 1 if any of these happened:
  - (a) a cloud-to-ground strike within 10 mi, from NCEI's NLDN daily 0.1° tiles. This is a new find: free, 1986 to now, 12 MB/yr.
  - (b) an NWS SV/TO/FF/FA/FL warning polygon contains the site (IEM).
  - (c) a Heat Advisory or Excessive Heat Warning for the site's county, or Open-Meteo-derived WBGT ≥ 90°F during work hours.
  Train one head per hazard plus the combined label. OSHA severe-injury reports are used **only as an external validity check**, never as the label.
- **Index = round(10 × calibrated P(stop-work day)).** The index *is* a probability, so a reliability diagram checks it directly: "when we said 7, crews actually lost the day ~70% of the time."
- **Model:** start with logistic regression, then LightGBM, with isotonic calibration fit on 2024 and the test set frozen at 2025. Show per-hazard probabilities and SHAP/`pred_contrib` top factors in the UI.
- **Baselines to beat:** climatology (site × day-of-year), persistence (today's outcome), and SPC Day-2 outlook only. NWS-warning-only can't serve as a baseline here because warnings are part of the label.
- **The one chart:** a reliability-by-index-band chart on the untouched 2025 holdout with n per band and 95% CIs. Next to it, a 4-row table of Brier skill score and PR-AUC against the baselines.
- **Biggest leakage trap:** Open-Meteo's *Historical Forecast API* stitches together the first hours of each model run, so it's close to an analysis, not a day-ahead forecast. For an honest day-ahead test, use the *Previous Runs API* (`_previous_day1`, archived from Jan 2024), or SPC Day-2 outlooks.
- **Time:** a solo build is about 12-14 h to a defensible version (section 6).

---

## 1. Label definition

### What's available and how dense it is
| Source | Fits as | Density (FL) | Verdict |
|---|---|---|---|
| **NCEI SWDI NLDN tiles** `nldn-tiles-YYYY.csv.gz`: daily CG strike count per 0.1° cell, UTC day | Lightning label + lagged features | 2023 file is 12 MB, 3.1M US rows, **208k rows inside an FL bbox** **[checked]**. Columns `ZDAY,CENTERLON,CENTERLAT,TOTAL_COUNT`. Years 1986 to 2026-10 (monthly files for recent months) ([index](https://www.ncei.noaa.gov/pub/data/swdi/database-csv/v2/)) | **Primary.** It's exactly the brief's 10 mi stop-work trigger, and it's CG (ground strikes), which is what lightning-safety rules key on. |
| IEM NWS warning archive | Severe/flood/heat label | ~14.5k FL rows/yr (feasibility.md) | **Primary.** Use the polygon (P) rows for SV/TO/FF and county rows for Heat Advisory/EHW. |
| Open-Meteo archive (ERA5) | Observed heat label (WBGT) | Hourly, 1940+ | Good for a heat label that doesn't depend on whether a forecaster issued an advisory. ERA5 `cape` came back **null** for a Gainesville point in 2019 **[checked]**. Don't count on reanalysis CAPE from this endpoint. |
| NOAA Storm Events | Context | 948 FL events in 2025, 23 lightning | Too sparse to use as a label. |
| OSHA SIR | Validation | Sparse, approximate geocodes | External check only (section 4). |

**Base rate check [checked, NLDN 2023, cells within 16.1 km of the site]:**

| Site | Days with a CG strike ≤10 mi (of 365) | Jun-Aug (of 92) |
|---|---|---|
| Gainesville | 74 | 46 |
| Port St. Lucie | 103 | 60 |
| Turkey Point | 109 | 59 |
| Pensacola | 77 | 42 |

That works out to ~20-30% of all days and 45-65% of summer days. So the lightning label is **not rare**. It's learnable, and plain accuracy and ROC will look fine whatever the model does, which is why calibration matters more than AUC here. (The 0.1° cell-center distance is approximate, about ±5 km. Say so.)

### Recommended label (freeze this in hour 0)
`stop_work[site, day] = lightning10 OR warned OR heat`
- `lightning10`: any NLDN CG count > 0 in a 0.1° cell whose center is ≤16.1 km from the plant, on that UTC day. A UTC day runs 8 PM to 8 PM EDT, so it covers the whole 7 AM-7 PM work window. The briefing goes out at 6 PM for the next local day. Align on the UTC day starting at 00Z of the target date and note the 4-5 h offset in the README.
- `warned`: an IEM SV/TO/FF/FA/FL/EW polygon (the `P` rows) contains the plant point and overlaps 11-23 UTC (≈ 7 AM-7 PM EDT).
- `heat`: an HT/EH advisory/warning for the plant's county UGC, **or** hourly WBGT ≥ 90°F (≈ red/black flag, Marine Corps red = 88-89.9°F) in ≥ 2 work hours. Compute WBGT from Open-Meteo archive T/RH/wind/radiation with `thermofeel.calculate_wbgt_liljegren` or `pywbgt`.

Keep **three per-hazard heads plus the combined label**. The per-hazard probabilities are the "why" in the UI, and they keep the summer lightning base rate from hiding heat and flood.

**Why not "GLM flash within 10 mi"?** GLM sees total lightning (IC + CG) at ~8-10 km pixels with ~74% FL detection efficiency (feasibility.md), and 2019-2024 pulls are bandwidth-bound (section 8). Use GLM **live** for the 30-min countdown and NLDN **historically** for training. The stop-work rule in the brief is about strikes, and NLDN is the CG network. **[inference]**

**Why not OSHA as the label?** Severe injuries near 346 plants on a given day are close to zero events. The labels would be noise, and a judge would ask what the base rate is.

### How others frame similar indices
- **NWS HeatRisk (0-4):** compares forecast highs/lows to the **site's own climatology** (top-5% days for that date, about a 20-yr history), with color levels and health guidance. Takeaway: relative-to-local-normal matters (a 95°F day in Pensacola in May ≠ in August) ([NWS fact sheet](https://www.weather.gov/media/mlb/pdfs/NWS%20HeatRisk%20Fact%20Sheet.pdf), [Understanding HeatRisk](https://www.weather.gov/media/aly/FactSheets/Understanding-HeatRisk.pdf)). Use day-of-year climatology as both a feature and a baseline.
- **WBGT flag conditions:** fixed absolute thresholds tied to work/rest. Marine Corps green 80-84.9, yellow 85-87.9, red 88-89.9, black ≥90°F ([MCLB Albany](https://www.albany.marines.mil/Resources/Heat-Condition-Flag-Warning-System), [HPRC](https://hprc-online.org/physical-fitness/environmental-extremes/military-heat-flag-conditions-explained)). Takeaway: crews understand discrete bands with an action attached to each, so give every index band an action ("hydration breaks", "stop-work likely").
- **OSHA heat NEP (2022):** inspection focus when the heat index is ≥ 80°F and NWS heat advisories are in effect ([Foley summary](https://www.foley.com/insights/publications/2022/04/the-heat-is-on-osha-natl-emphasis-program-hazards/), [Ogletree](https://ogletree.com/insights/osha-launches-national-emphasis-program-to-expand-on-heat-illness-prevention-campaign/)). That justifies NWS heat products as a "real worker hazard" label. The NEP was set for 3 years from April 2022, and I didn't confirm its current status.
- **UConn/Eversource Outage Prediction Model:** tree ensembles (decision tree, RF, boosted trees, ensemble) on weather plus infrastructure plus land cover. Run up to 3 days ahead and updated every 6 h. The ensemble won ([Wanik et al. 2015, Natural Hazards](https://hartman.byu.edu/docs/files/WanikAnagnostouHartmanFredianiAstitha_StormDamage.pdf), [UConn-Eversource](https://www.eversource.uconn.edu/storm-outage-forecasting/predicting-outages-old/), [WNPR](https://www.wnpr.org/post/creating-more-perfect-storm-outage-prediction-system)). Anagnostou has noted that plain ML under-predicts the extremes. Takeaway: trees on weather plus static site features is the standard industry framing, and you should report how the model does on the worst days separately.
- **Gradient boosting on non-proprietary data:** 15,872 events across 17 eastern states, r² = 0.61 ([Energy Reports 2023](https://doaj.org/article/4d8df144a8284a54bf2fa87aa80a6959)). Outage models can predict more customers out than exist in some cities, so check them against reality ([Arora et al. NHESS 2023](https://doaj.org/article/b0ed5e120e7e4656a29980749d1cf80d)). Review: [Fatima et al.](https://digitalcommons.mtu.edu/michigantech-p2/562).
- **Lightning nowcasting ML:** GLM+ABI+GFS nets report ECE < 10% and F1 0.65 at 5 min falling to 0.5 at 30 min ([NHESS 2026](https://nhess.copernicus.org/articles/26/1603/2026/nhess-26-1603-2026-discussion.html)). Swiss CSI goes from 0.75 at 5 min to 0.32 at 60 min within 8 km ([arXiv 2203.10114](https://ar5iv.labs.arxiv.org/html/2203.10114)). The CIMSS CNN gives P(lightning in next 60 min) from ABI ([CIMSS](https://cimss.ssec.wisc.edu/satellite-blog/archives/38136)). Takeaway: minute-scale lightning prediction is a research problem, so don't promise it. Day-ahead "will there be a stop-work day" is honest and learnable. The 30-min countdown is a rule, not a model.

## 2. Features: available at 6 PM the day before vs leakage traps

### Safe (issued before the briefing)
| Feature | Source | Notes |
|---|---|---|
| Next-day max T, min RH, max apparent temp, forecast WBGT max, max CAPE, min lifted index, precip sum, max gust, shortwave sum | Open-Meteo **Previous Runs API** `*_previous_day1` (value predicted 24 h before valid time, archived from **Jan 2024** for most models) ([docs](https://open-meteo.com/en/docs/previous-runs-api)) | True day-ahead lead time. Use it for the **2025 test set** at minimum. |
| Same variables, longer history | Open-Meteo **Historical Forecast API**: GFS since 2021-03-23, HRRR since 2018 ([docs](https://open-meteo.com/en/docs/historical-forecast-api)). CAPE returned real values for Gainesville 2021-2022 **[checked]**. `lightning_potential` is null in FL **[checked]** | **Trap:** "each run's first few hours are stitched into a continuous hourly timeseries", so this is near-analysis skill. It's fine for *training* (more data), but **test only on Previous Runs day-1 values**, or the holdout overstates skill. Report both numbers; the gap is a good talking point. |
| SPC Day-2 convective outlook category at the site (TSTM/MRGL/SLGT/ENH/MDT/HIGH) | IEM SPC outlook archive: point JSON `mesonet.agron.iastate.edu/json/spcoutlook.py?lat=&lon=&last=&day=&cat=categorical` and bulk shapefile `cgi-bin/request/gis/spc_outlooks.py?d=&type=C&sts=&ets=` **[checked both]** | Day 2 is issued ~17-18Z, before 6 PM EDT. Filter on `utc_product_issue` < briefing time. Strong prior for thunder; it's also baseline #3. |
| Persistence: today's NLDN count ≤10 mi, warnings in last 24 h, last-3/7-day lightning days | NLDN, IEM | Today's NLDN tile is a UTC day that ends 8 PM EDT, *after* the 6 PM briefing. **Use yesterday's tile** in training, or in live mode use GLM counts up to 6 PM. Otherwise it leaks [inference]. |
| Climatology: site × week-of-year lightning-day rate (NLDN 2005-2020), heat-day rate | NLDN, Open-Meteo archive | Computed only from years before the train window. |
| Static: lat, lon, distance to coast, elevation, county, plant type/capacity, FEMA flood zone flag | EIA-860M, FEMA | Low-variance. Static site features alone let trees memorize the site. Fine, but check that the model beats climatology on the holdout. |
| Antecedent precip (3/7-day), soil moisture | Open-Meteo archive (`soil_moisture_0_to_7cm` returned values for 2019 **[checked]**) | For the flood head. Data must be available through yesterday. |
| Day-of-year (sin/cos), weekday | n/a | n/a |

### Leakage traps (put this list in the README; Sperry's AI engineer judge will look for it)
1. **Observed weather from the target day** (ERA5 T/RH/precip on day D). That's nowcasting the answer. ERA5 is also a reanalysis built with later data.
2. **Historical Forecast API values used as "the forecast"** at test time (see above).
3. **NWS warnings on day D as a feature.** They're part of the label. Watches issued before 6 PM the day before are OK.
4. **Same-day NLDN tile** (UTC day overruns the briefing time).
5. **Random K-fold split.** Weather is spatially and temporally correlated: on a stormy day all 346 sites light up together. Split **by time** and report bootstrap CIs **by day**, not by site-day.
6. **Climatology computed over the test years.**
7. **Thresholds or calibration tuned on test.** Fit isotonic on the validation year only.
8. **Storm Events or OSHA outcomes recorded later** used as features.

## 3. Model, calibration, 0-10 mapping

- **Baseline model:** L2 logistic regression on ~15 standardized features. It's quick, interpretable, and gives you something to beat by H6 (feasibility.md).
- **Main model:** LightGBM binary, one model per head (`lightning10`, `warned`, `heat`) plus one on `stop_work`. Settings: ~300 trees, `num_leaves` 15-31, `min_data_in_leaf` ≥ 200, early stopping on the 2024 val year. Use `monotone_constraints` (+1 for CAPE, forecast WBGT, SPC category, climatology) so it can't learn silly inversions; that's a field-robustness point Sperry's AI engineer judge will like **[inference]**. Data size: 346 sites × ~1,800 days ≈ 620k rows, which trains in seconds on a laptop. If time is short, use ~60 sites.
- **Calibration:** trees and focal/weighted losses distort probabilities, so fit **isotonic** on the 2024 val predictions (or Platt if val is small) ([scikit-learn calibration guide](https://scikit-learn.org/stable/modules/calibration.html); [Niculescu-Mizil & Caruana 2005](https://www.cs.cornell.edu/~alexn/papers/calibration.icml05.crc.rev3.pdf)). Don't use class weights. Base rates aren't rare, and reweighting breaks calibration.
- **Combining heads:** use the `stop_work` model directly, and check the heads are consistent (p_any ≥ max head). The UI shows the heads as the breakdown.
- **Mapping to 0-10:** `index = clip(round(10 × p_cal), 0, 10)`. Give each band a crew action:
  - 0-2 "normal"
  - 3-4 "watch the sky, plan a shelter"
  - 5-6 "expect delays"
  - 7-8 "plan for stop-work, move critical lifts to morning"
  - 9-10 "likely lost day / warning-level"
  - Add a **severity tag** when P(warned) > 0.3 or SPC ≥ SLGT. A day that's "7 from routine sea-breeze lightning" shouldn't look the same as "7 from a tornado-warned squall line".
  - Alternative: HeatRisk-style relative bands (percentile vs the site's own climatology). It's less honest as a probability, so keep the absolute version as the headline.
- **Summer saturation:** FL summer lightning-day rates of 45-65% mean summer indices will cluster around 5-7. That's correct and honest. To help planners, also show **hours of risk** from the hourly Open-Meteo forecast (CAPE/precip timing) as a non-ML "likely window" strip ("storms likely 2-6 PM, work the morning"). Label it as forecast guidance, not model output **[inference]**.

## 4. Evaluation

- **Split:**
  - Train 2021-03 → 2023, matching Historical Forecast GFS/CAPE availability. Optionally extend back to 2018 with HRRR, or 2005+ with climatology-only features.
  - Validate on 2024 (early stopping + isotonic).
  - **Test on 2025**, touched once, with Previous Runs day-1 features. 2025 also has GOES-19 GLM for the live-mode sanity check.
  - Optional: rolling-origin by year if time allows.
- **Metrics (per head and combined):**
  - **Brier score** and **Brier skill score vs climatology**, with the Murphy decomposition (reliability/resolution) if time allows. Wilks is the standard reference for this.
  - **PR-AUC** (it's better than ROC when classes are imbalanced, which matters for the `warned` head; [Saito & Rehmsmeier 2015](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0118432)) and ROC-AUC for completeness.
  - **Reliability diagram** with 10 bins = the 10 index bands, n per bin, Wilson CIs.
  - **Bootstrap CIs by day** (resample days, not rows).
  - **Precision/recall at the action threshold** (index ≥ 7): "of days we said plan for stop-work, X% had one; we caught Y% of stop-work days".
  - **Worst-days slice:** recall on days with ≥1 TO/SV polygon or ≥100 CG strikes within 10 mi, following UConn's lesson that ML under-predicts extremes.
- **Baselines (same test set, same metrics):**
  1. **Climatology:** site × week-of-year rate from prior years.
  2. **Persistence:** yesterday's outcome at the site.
  3. **SPC Day-2 only:** map category → probability fitted on train.
  4. **Logistic regression.**
  - "NWS-warning-only" can't be a baseline for a label that contains warnings. It can be a **baseline on the lightning head** (did an SV warning for the site's county predict CG ≤ 10 mi?), which mostly shows warnings are rare and lightning isn't.
  - Note on NWS warnings: storm-based polygons since 2007, POD/FAR tradeoff, rural FAR higher ([NWS Peachtree City study](https://www.weather.gov/media/ffc/SEconf.pdf), [Ruskin 2007 stats](https://www.weather.gov/media/tbw/2007/TBW2007SevereStatistics.pdf)). Say in Q&A that the warning label inherits forecaster FAR, which is why lightning is labeled from observed strikes.
- **Lead-time metric:** the product is day-ahead, so report skill at **lead 1 (6 PM briefing)** vs **lead 0 (6 AM update)** by swapping `previous_day1` for `previous_day0` features. A skill gain at lead 0 is evidence the model uses the forecast and isn't just memorizing sites. For the live alert engine (not the ML), replay a 2025 storm day and report **minutes of warning**: first GLM flash within 20 mi → first within 10 mi, and how long the countdown held.
- **External validity (OSHA SIR):**
  - Pull FL rows (browser download).
  - Keep heat/lightning/weather narratives (keyword filter: "heat", "lightning", "struck", "exhaustion").
  - Score each incident's county-day with the model's heat/lightning head.
  - Report the **mean index on incident days vs all workdays in the same county and month**.
  - With a small n, present it as "directionally supports", not a metric.

## 5. Explanations in the UI

- LightGBM gives exact TreeSHAP contributions for free: `model.predict(X, pred_contrib=True)` returns per-feature log-odds contributions + bias. No `shap` install needed. The `shap` lib (`TreeExplainer`) adds plots ([Lundberg et al. 2020, Nature MI](https://www.nature.com/articles/s42256-019-0138-9); [LightGBM predict docs](https://lightgbm.readthedocs.io/en/latest/pythonapi/lightgbm.Booster.html#lightgbm.Booster.predict)).
- **UI pattern ("Why 7?"):**
  - Per-hazard bars: lightning 68%, heat 40%, severe/flood 12%.
  - Then the top 3 signed factors in plain words, grouping one-hot or derived features into human factors:
    - "+ CAPE tomorrow 2,600 J/kg (high for this site in June)"
    - "+ SPC: general thunder"
    - "− dry air aloft (LI −2)"
  - Each factor links to its source (Open-Meteo run time, SPC outlook issue time). This matches Sperry's "show the source behind every number" lesson from ShellHacks (prizes.md).
- **Global view:** a SHAP summary on the test set in the README/eval page.
- For the logistic baseline, coef × standardized value gives the same kind of view, which makes comparing the two easy.
- Contributions are in log-odds and the index is after isotonic. Show the factors as "pushes up/down", not as points of index, or the numbers won't add up **[inference]**.

## 6. Time per step (one person, Python/pandas, with what's already checked)

| Step | Hours |
|---|---|
| Freeze label/split; pick 50-100 FL plants from EIA-860M | 0.5 |
| NLDN tiles 2018-2025 download (8 × ~12 MB) + site × day lightning10 table (KD-tree on cell centers) | 1 |
| IEM warnings 2018-2025 polygons (shapefile output, per-year requests) + point-in-polygon + heat county join | 2-2.5 (UGC/timezone joins are the risk) |
| Open-Meteo: historical-forecast (train) + previous-runs day-1 (test) daily aggregates for N sites, WBGT via thermofeel | 1.5-2 (rate limits: batch multi-location requests, cache to parquet) |
| SPC Day-2 outlooks per site-day (bulk shapefile per year + point-in-polygon) | 1 |
| Feature table + leakage audit checklist | 1 |
| Logistic baseline + climatology/persistence/SPC baselines + metric script | 1.5 |
| LightGBM per head + isotonic + 0-10 mapping | 1 |
| Eval chart + table + bootstrap CIs | 1.5 |
| `pred_contrib` → factor JSON for the API (`/api/sites/:id/risk` already has `factors[]` in build-plans.md) | 1 |
| OSHA SIR check (manual download, keyword filter, county-day join) | 1-1.5, optional |
| **Total** | **~12-14 h** (cut OSHA and SPC → ~10 h) |

## 7. The one chart for Sperry's AI engineer judge ("tools that hold up in the field, not in a demo")

**"Does a 7 mean 7?": a reliability-by-index-band chart on the untouched 2025 holdout, with true day-ahead forecasts.**
- **x:** index band 0-10 (the number crews actually see).
- **y:** observed share of site-days that turned into stop-work days.
- **Diagonal:** perfect calibration.
- **Bars:** count of site-days per band (shows the model uses its whole range).
- **Error bars:** day-level bootstrap 95% CI.
- **Overlay:** climatology's points, which collapse to a few bands. That's the visible sign that the model has resolution.
- **Side table, 4 rows:** model, LR, SPC-Day-2-only, climatology, persistence. Columns: Brier skill score vs climatology, PR-AUC, recall on worst days.
- **Footnote:** "Test features = 24-h-old forecasts (Open-Meteo Previous Runs day-1), not reanalysis. Train ≤2023, val 2024, test 2025. Split by time; CIs resample days."

Why this chart:
- It tests the exact number the product shows, in the exact situation it's used (a day ahead, unseen year).
- It shows calibration, not just ranking.
- The footnote preempts the three questions an AI engineer asks first: leakage, split, and baselines.
- If there's room for a second panel, show skill at lead 1 vs lead 0. If skill goes up as the forecast gets fresher, the model is using the weather and not just memorizing sites.

## 8. GOES-16 GLM archive check (2019-2024) [all checked 2026-10-16]

- `noaa-goes16` bucket, prefix `GLM-L2-LCFA/`: year folders **2018-2025** exist. The first day is **2018/044** (Feb 13 2018), the last day is **2025/097** (Apr 7 2025). The 2025/120 and 2025/200 folders are empty because GOES-16 was retired as GOES-East.
- Sampled 2019/150, 2022/150, 2024/150 hour 18: files present (`OR_GLM-L2-LCFA_G16_s...nc`), anonymous HTTPS listing works.
- `noaa-goes19` GLM starts **2025/015** (Jan 15 2025) and runs through 2026. That gives a Jan-Apr 2025 overlap with G16.
- **Size/speed:**
  - Summer files are ~380 KB (23 MB for 60 files, 2024/200 19Z).
  - 60 files took **10.8 s with 16 parallel curls (~2 MB/s effective)** from this box.
  - One summer day ≈ 4,320 files ≈ 1.5 GB ≈ **~12 min**. One summer (153 d) ≈ 230 GB ≈ 30 h. **Not feasible for multi-year training at the event.**
- **Use instead:**
  - NLDN daily tiles for training: 12 MB/yr, CG, 1986+.
  - GLM only for (a) the live 10-mi countdown, (b) the replay day (6 h ≈ 270 MB, already planned), and (c) optionally a ~10-day spot check that NLDN and GLM agree on lightning10 at the sites in summer 2024. Report the agreement rate; GLM will over-alert because it includes intra-cloud flashes.

## Open questions for the Sperry reps Friday night
1. Per-day vs per-hour index? (Recommend per-day for the briefing plus a non-ML hourly window strip.)
2. Is NLDN (Vaisala, via NOAA) OK for historical labels, with GLM live?
3. Is "stop-work day" the hazard they mean by "tied to real worker hazards", or do they want injury outcomes (OSHA) even if they're sparse?
