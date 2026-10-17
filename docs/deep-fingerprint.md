# Deep dive: Beat the Fingerprint

Candidate idea, not picked. ~6.5/10: below the Sperry hazard radar, about tied with Mental Models. Strong on Technical Understanding, weak on Purpose.

# Beat the Fingerprint: feasibility and stress test

Research only, no code. Context: SwampHacks XII, 2 people, ~28 build hours, expo table, Entertainment & Creative track, Best Overall sponsored by Vobile. Today is day 1 (Oct 16), so anything that needs a big download has to start tonight.

## TL;DR
- **Feasible in Python in ~10-15h of core work, if we keep it small.** Wang-style pair hashing takes about 3-4h; a Panako-style triplet hash with tempo and pitch estimates takes about 6-8h more. Everything we need is permissive pip packages: numpy, scipy, librosa (ISC), soundfile. We don't need Panako's Java (AGPL) or a neural model.
- **The demo has a real, citable money shot.** In Panako's own FMA eval, Wang 2003 drops to ~0% top-1 at ±4% speed change, while Panako 2021 holds roughly 75-95% from 84% to 116% (Six 2021, Fig. 2). A live side-by-side ("classic hashing dies at 4%, ours survives 15%") is the thing that stops it reading as "just Shazam".
- **Real-world hook:** Audible Magic estimates up to 50% of music on UGC platforms is pitch- or tempo-altered, and sped-up versions outnumber slowed ones about 4:1 on TikTok. YouTube Content ID only admits owners with *exclusive* rights. Indie and CC artists get nothing.
- **Biggest risks:** mic capture in the expo hall, a weak Purpose & Audience score, and tuning the triplet hash eating the whole night. All three can be mitigated; see the risks section.
- **Win odds on our scale: ~6.5/10.** That's under the Sperry hazard radar (~8) and about level with the physics tool (6-7). It scores better than the physics tool on Technical Understanding and wow, and worse on Purpose. It's our strongest Least Vibe Coded and Entertainment candidate.

---

## 1. Algorithms: what to build, what to borrow

| Approach | Robust to | Fails on | Python, ~10-15h? | Libraries / license |
|---|---|---|---|---|
| **Wang 2003 landmark pairs** (Shazam) | Noise, EQ, GSM, dropouts, mixing | Speed, tempo or pitch change beyond a few % (hash uses absolute f1, f2, Δt) | **Yes, 3-4h** | Our own code on numpy/scipy. Reference implementations: `audfprint` (dpwe, MIT, GitHub only, not on PyPI) and `PyDejavu` 0.1.3 (MIT) |
| **Panako triplets** (Six & Leman 2014; Panako 2.0, 2021) | Same as above, plus time-stretch, pitch-shift and speed-up, with estimates of the factors | Heavier edits (>~15-20%), covers, re-performances | **Yes, ~6-8h on top of Wang** if we reimplement the idea in Python | Reference code is Java (JDK 11+/17), **AGPL-3.0**. Don't vendor it. Read the paper and write our own |
| **Olaf** (Six) | Shazam-classic, tiny, compiles to WASM (~75KB) for the browser | No pitch/tempo claim | Not needed | C/Zig, AGPL-3.0 |
| **Chromaprint / AcoustID** | Whole-file duplicate ID, transcodes | Short segments; its README says it trades robustness for speed | Baseline at most | MIT core, LGPL resampler; `pyacoustid` 1.3.1 MIT |
| **Neural Audio Fingerprint** (Chang et al., ICASSP 2021) | Noise, room IR, short segments | Pitch/tempo not addressed; needs training | **No.** TF 2.4, needs an 11GB+ GPU, no pretrained checkpoint, 11GB "mini" dataset | MIT |

### How Wang 2003 works
Spectrogram peaks become a "constellation". Each anchor peak pairs with up to F≈10 peaks in a target zone, giving a hash of (f1, f2, Δt) packed into 32 bits with the anchor time stored alongside. To match, look up the query hashes, then for each candidate track take a histogram of t_ref − t_query and score the peak. A diagonal in the scatter plot means a match (Wang 2003, Figs 2-3). Noise robustness from the paper (10k-track DB, pub noise): recognition falls to 50% at about −9 / −6 / −3 dB SNR for 15 / 10 / 5 s clips. With GSM compression on top, the same points are about −3 / 0 / +4 dB. Only about 1-2% of hashes need to survive.

Why it breaks: a speed change scales Δt and shifts every frequency, so every hash value changes.

### What makes Panako-style invariant
Each hash combines three peaks. It uses **frequency differences on a log (constant-Q) axis**, which are unchanged by pitch shift, and the **time ratio (t2−t1)/(t3−t1)**, which is unchanged by tempo change. Speed-up (resampling) does both at once, so it's covered too. Panako 2.0 adds near-exact hash matching (range queries that ignore the low bits) and accepts matches along a fitted line rather than a constant offset, so a time-stretched query still lines up (Six 2021).

The factors come for free:
- **tempo** = slope of t_ref vs t_query, or the median of Δt_ref/Δt_query
- **pitch** = median log-frequency offset of the anchor peaks, converted to semitones

That's where the on-screen "1.08x, +1.3 st" comes from.

Python plan:
- `librosa.cqt`, or STFT peaks mapped to log-frequency bins
- `scipy.ndimage.maximum_filter` for peak picking
- triplets from anchor + 2 targets
- hashes in a sorted `numpy` int64 array, queried with `np.searchsorted`

The catch: invariant hashes carry less entropy, so they produce more random collisions. A verification step is required: linear fit plus inlier count, plus a threshold set from a no-match histogram, as Wang 2003 §2.3.1 does.

**Cheap fallback if triplets aren't working by hour ~14: "speed search".** Keep Wang hashing and re-query with the clip resampled at 31 factors (0.85-1.15 in 1% steps), then take the best. That covers speed-up (the TikTok/nightcore case), which is resample-style and changes pitch and tempo together. It doesn't cover independent pitch-only or tempo-only edits. It costs 31x per query, which is fine at 1k tracks. It's honest to describe as "brute-force search over the speed factor", and it's still a story we can explain.

**Patents (Q&A ammo):** Shazam's US7627477 (priority 2002) shows "Expired – Lifetime" with an adjusted expiration of 2025-03-31 on Google Patents. US6990453 claims a July 2000 priority (Wang 2003 ref [1]), so its 20-year term is long past. I didn't verify the second one directly because the page timed out. Panako's and Olaf's READMEs still carry the patent warning.

Package versions checked on PyPI today:

| Package | Version | License | Note |
|---|---|---|---|
| librosa | 1.0.0 | ISC | Released Aug 2026, needs Python ≥3.12. Pin 0.11.x if 1.0 breaks something |
| numpy | 2.5.4 | BSD-3 | |
| scipy | 1.18.1 | BSD | |
| soundfile | 0.14.0 | BSD-3 | |
| sounddevice | 0.5.6 | MIT | |
| pyrubberband | 0.4.0 | ISC | Needs the `rubberband` CLI, which is GPL; we only shell out to it |
| audiomentations | 0.43.1 | MIT | Noise and reverb attacks |
| fastapi | 0.143.3 | MIT | |
| remotezip | 0.12.6 | MIT | |
| PyDejavu | 0.1.3 | MIT | |
| pyacoustid | 1.3.1 | MIT | |

## 2. Dataset: FMA
- **fma_small:** 8,000 clips × 30 s, 8 balanced genres, 7.2 GiB (Content-Length 7,679,594,875 confirmed today).
- **fma_medium:** 25,000 clips, 22 GiB. **fma_large:** 106,574 clips, 93 GiB. **fma_full:** 879 GiB of untrimmed tracks.
- **fma_metadata.zip:** 342 MiB. It has `tracks.csv` with title, artist and **per-track license**.
- **No account needed.** Plain HTTPS from `os.unil.cloud.switch.ch/fma/…` returned 200 and `Accept-Ranges: bytes` today.
- **Licenses:**
  - Metadata is CC BY 4.0 and the code is MIT.
  - The audio carries each artist's own CC license. FMA says "we do not hold the copyright… distribute it under the license chosen by the artist" and that the dataset is "meant for research purposes".
  - Some tracks are NC and/or **ND**. Playing a pitched copy of an ND track at a public table is arguably a derivative, so **filter the showcase set to CC BY / BY-SA / CC0** using the license column.
- **Don't pull 7.7GB on venue wifi.** Two options:
  - Run `remotezip`, which uses range requests (confirmed supported), to extract just 1,000-2,000 clips (~1 MB each, so 1-2 GB).
  - Start the fma_small download on a home connection tonight.
- **How many tracks:**
  - The live index needs **1,000-2,000** to be convincing ("1,000 songs, we find yours in under a second"), and it fits in RAM: 2k × 30 s × ~300 hashes/s ≈ 18M int64s ≈ 300 MB.
  - The eval needs **index 80%, hold out 20%** as true negatives, with **300-500 queries** per modification. That mirrors Panako's own eval script.
  - All FMA clips are 30 s, so queries are 5-10 s cut from the middle. That's fine.

## 3. Live demo engineering
- **Expo noise vs SNR:**
  - Wang's curves say 10-15 s clips survive negative SNR on clean digital noise.
  - A real room adds reverb, plus a laptop mic with AGC and noise suppression, so expect it to be much worse.
  - **Put a small speaker 20-30 cm from a USB or lapel mic and play loud.** That keeps SNR clearly positive whatever the hall is doing.
  - Keep the "over the air" path as a **bonus mode**, not the only one.
- **Always have a digital path.** The attack console renders the modified clip and feeds it straight to the matcher with no mic. This is the version that can't fail, so open with it, then do "now let's try it over the air".
- **Browser mic gotcha:** WebRTC defaults are tuned for speech. Set `echoCancellation:false, noiseSuppression:false, autoGainControl:false` explicitly (Mozilla WebRTC blog, addpipe). Chrome may still high-pass, and Safari has historically ignored the settings. **Use Chrome, or capture with Python `sounddevice` on the laptop.**
- **Latency:**
  - Fingerprinting a 10 s query in numpy takes about 0.1-0.3 s. Lookup over ~20M sorted hashes with `searchsorted` takes milliseconds.
  - Wang's PC numbers are 5-500 ms for 20k tracks, and Panako runs at ~40x real time single-threaded.
  - Target: answer within 1.5 s of the window closing, re-matching on a sliding 8 s window every 2 s so the confidence meter climbs live.
- **Browser vs laptop app:** both are on the laptop. A FastAPI backend handles fingerprinting, the index and attack rendering. A plain JS + Canvas page on localhost has:
  - an **attack console** with sliders for speed, tempo-only, pitch-only (semitones), noise SNR, reverb, low-pass and crop
  - a **constellation view**
  - a **match scatter plot** whose diagonal *tilts* as tempo changes
  - a result card showing "Track • 1.08x • +1.3 st • confidence"
  - a **"breaking point" leaderboard**

  Attacks render server-side: resample for speed, `librosa.effects` or `pyrubberband` for pitch and tempo, `audiomentations` for noise and reverb. No internet is needed at the table.
- **Feedback and echo:** play out of the external speaker only and mute the laptop speakers. Mic-to-speaker loops wreck peaks.

## 4. Novelty: "that's just Shazam" vs "wow"
**What already exists:**
- **Products:** Shazam (Wang 2003); AcoustID/Chromaprint (whole-file); YouTube Content ID, which matches uploads against reference files from rights owners who hold **exclusive** rights (support.google.com/youtube/answer/1311402); Audible Magic, whose **"Broad Spectrum"** product exists precisely because standard audio ID only handles "a few percent" of pitch or tempo change; Pex audio ID, **bought by Vobile in April 2025**.
- **Hackathon and hobby projects:** dozens of Shazam clones on GitHub (Dejavu forks, "Shazzam-Clone", Sezame, mnemophonix); Devpost "beatfinder", which calls the AcoustID API; "Song Identifier"; TreeHacks 2024 "PirateShield" (copyright detection for video). I found **no Devpost project built around adversarial evasion of a fingerprinter with pitch/tempo estimation and an eval**. The search wasn't exhaustive.

**"That's just Shazam" happens if:**
- we show one song being identified
- we wrap someone else's API
- we can't explain the hash

**"Wow" happens if:**
1. **The judge attacks it.** They drag sliders, hit play, and it still names the track, showing "1.08x, +1.3 st" and matching what they set.
2. **Side-by-side meters.** Classic pair-hash (Shazam-style) next to ours. Classic dies at about 3-4%; ours keeps going. This visibly shows the problem Audible Magic sells a product for.
3. **The tilting diagonal.** The judge sees *why* it works.
4. **The breaking point is a game.** "Smallest edit that beat it" goes on a leaderboard. The honest failure *is* the demo.
5. **The README eval table:** top-1 accuracy × {speed ±2/5/10/15%, pitch ±1/2/3 st, tempo ±10%, SNR 0/−5 dB, reverb, over-the-air} × {classic, ours}, with false-positive rate on held-out tracks.

## 5. Judges and human benefit
- **Vobile's judge (1 of ~50).**
  - Vobile's business is fingerprinting (VDNA, which won a 2018 Tech & Engineering Emmy) and it now owns Pex audio ID. A Gainesville R&D center opened in 2022 and the CEO is a UF alum.
  - This is the only idea where that judge instantly gets it. The Panako/Broad Spectrum framing ("altered content is the hard case") is literally their problem.
  - But Overall is decided by the general pool against the 7 criteria (see docs/judges.md). Don't overweight one judge. Also expect a pro to poke at scale and false positives (Q&A below).
- **General judges** (industry engineers plus UF faculty) will reward it on:
  - Technical Understanding ("explain how and why"): it's very explainable, there's a diagram, and it's our own algorithm
  - Functionality: works live
  - Innovation: the evasion game

  They'll ask "who is this for?" (Purpose & Audience) and rate it lower there than a safety or education tool.
- **Honest framing:**
  > "Content ID is only for owners with exclusive rights at scale. Indie and Creative Commons artists, who make up most of FMA, get reuploaded sped-up and pitch-shifted with no credit. Up to half of UGC music is altered this way (Audible Magic). We built an open, explainable matcher that survives those edits and tells you exactly how the copy was altered. That's attribution for small creators, not a takedown machine."

  Don't claim it beats Content ID or Vobile. Claim that it's open, explainable and measured.

  Fair-use angle: it reports a match and the transform, and a human decides. Remixes can be legitimate.

## 6. The toughest 8 questions
1. **"Isn't this just Shazam?"** Shazam's hash uses absolute frequencies and time gaps, so a 4% speed-up changes every hash. That's in Panako's FMA eval, where Wang 2003 falls to about 0%. Ours hashes frequency *differences* on a log scale plus a time *ratio*, which don't change under pitch or tempo edits. Then show the side-by-side.
2. **"How do you get 1.08x and +1.3 st?"** Tempo is the slope of the matched time pairs, which is the tilt you see on screen. Pitch is the median log-frequency offset of the matched anchors, converted to semitones. A pure speed-up of r gives tempo r and pitch 12·log2(r) st, so 1.08 gives about +1.33.
3. **"False positives? How do you know it isn't guessing?"** We hold out 20% of tracks that were never indexed. The threshold is set from the score distribution on those so the FP rate is ≤X%, the same way Wang sets significance. The rate is in the README table.
4. **"Does it scale?"** Lookup is a sorted-array search, so it's O(log N) per hash. Shazam ran about 2M tracks with this structure and Panako handles 100k on a laptop. We run 1-2k because that's what we could fingerprint this weekend. Scaling to millions needs a key-value store (Panako uses LMDB) and sharding.
5. **"Did you write it or call a library?"** We wrote the peak picking, hashing, index and matcher on numpy and scipy, and can walk the code. We used libraries for audio I/O and for *rendering* attacks. We read Panako's paper but its AGPL Java isn't in our repo. (This is aimed at the Least Vibe Coded prize.)
6. **"Who would use this?"** Small artists and labels checking for altered reuploads, a pre-step for creator-side claims, and DJ-set or sample tracking (Panako's own use cases). See section 5. Don't oversell.
7. **"What beats it?"**
   - Covers and re-performances, since a fingerprint matches *a recording*, not a song
   - Heavy non-linear time edits
   - Extreme stretch (beyond ~20%)
   - Very short clips in loud rooms

   Those are cover-song ID and neural-embedding territory. We show the breaking points on purpose.
8. **"Patents? Copyright on your demo audio?"** The core Shazam patents have expired (US7627477 is listed as expired, adjusted expiration 2025-03-31). The audio is FMA Creative Commons, filtered to licenses that allow derivatives for the showcase clips, with credit shown on screen.

## 7. Top risks and mitigations
| Risk | Likelihood | Mitigation |
|---|---|---|
| Over-the-air match fails in the hall | High | Digital path first. Speaker 20-30 cm from a USB mic. Browser processing off. 10 s windows |
| Triplet hash tuning eats the night | Medium-high | Hard checkpoint at h14, then fall back to speed search on Wang |
| Too many false matches with invariant hashes | Medium | Linear-fit verification, inlier threshold from held-out tracks, keep coarse f1 band |
| "Just Shazam" read in the first 10 s | Medium | Open with the attack and side-by-side meters, not "it identifies songs" |
| Weak Purpose score | High | Indie-creator framing with the Audible Magic stat and the Content ID eligibility limit |
| Data download on venue wifi | Medium | remotezip a subset tonight, or download at home |
| Python 3.12 / librosa 1.0 surprises | Low-medium | Pin versions h0. scipy-only STFT is a fallback |
| ND-licensed clip used in a modified demo | Low | Filter by the license column |

## 8. 28h build order with cut lines
A = me (algorithm and eval), L = @luanamaldaner (UI and integration).

| Hours | A | L | Milestone |
|---|---|---|---|
| 0-2 | Env and pins; remotezip 1-2k fma_small clips + metadata; license filter | FastAPI skeleton, page layout, attack-render endpoints (speed, pitch, tempo, noise) | Data on disk |
| 2-6 | Wang pair hashing: peaks, hashes, sorted index, offset histogram, threshold | Attack console UI, audio playback, result card | **M1:** clean and noisy clips identified offline |
| 6-12 | Triplet hashing on log-freq, time-ratio, verification fit, tempo/pitch estimates | Constellation and scatter canvas views; mic capture (Chrome, processing off) | **M2:** 1.08x speed and ±2 st identified offline |
| 12-15 | Eval harness: 80/20 split, ~300 queries × attack grid × {classic, ours}, CSV + plot | Hook UI to the live matcher; side-by-side meters | **M3:** README table exists. **CUT LINE A (h14):** triplets not ≥70% at 8% speed → switch to speed search |
| 15-19 | Tune thresholds; over-the-air tests in a noisy room with the real speaker and mic | Breaking-point leaderboard; polish | **M4:** live mic demo works 8/10 at the table distance |
| 19-22 | Sleep in shifts / buffer | Sleep in shifts / buffer | |
| 22-25 | README (diagram, eval table, limits, credits); backup video of a good run | Devpost text and screenshots; UI polish | **CUT LINE B:** drop the reverb and low-pass attacks |
| 25-28 | Q&A drill (section 6); freeze at h26 | Pitch drill; table setup checklist (speaker, mic, cables) | **CUT LINE C:** drop the leaderboard. **CUT LINE D:** drop live mic and demo digital only |

Never cut the side-by-side meters, the tempo/pitch readout or the eval table. Those are the project.

## 9. Win-odds estimate vs the alternatives
Scored against the 7 XII criteria, judgment calls:

| | Beat the Fingerprint | Sperry hazard radar | Physics tool |
|---|---|---|---|
| Technical Understanding | **Strong** (own algorithm, diagram, math) | Good | Good |
| Innovation | Good (the evasion game is new; the core is known) | Good | Medium |
| Functionality | Medium-risk (live mic) | Good | Good |
| Design & Usability | Good if the visuals land | Good | Good |
| Purpose & Audience | **Weakest** (rights and attribution) | **Strongest** (crew safety, real brief) | Strong (education) |
| Track fit | Entertainment / music: good | Sperry brief: exact | Entertainment/Education: OK |
| Prize slots | Entertainment (1, AirPods), Overall (3), Least Vibe Coded | Sperry (3 places + interviews), Overall | Entertainment, Overall, maybe DeepSpace/Roblox |

**Overall: ~6.5/10.** A rough guess: ~20-25% to win the Entertainment track, ~8-12% to place in Overall, and among the best shots at Least Vibe Coded. It beats the physics tool on the 30-second wow and Technical Understanding, and loses on purpose and demo risk, so call it a tie with physics. It stays below Sperry, which has 3 placements, internship interviews, a narrower field and an obvious human benefit. **Pick it if we want the most technically distinctive, Vobile-adjacent entry and accept a thinner purpose story. Otherwise Sperry is still the higher-EV play.**

## Sources
- Wang 2003, An Industrial-Strength Audio Search Algorithm: https://www.ee.columbia.edu/~dpwe/papers/Wang03-shazam.pdf
- Six & Leman 2014, Panako (ISMIR): https://archives.ismir.net/ismir2014/paper/000122.pdf
- Six 2021, Panako 2.0 (ISMIR LBD, Fig. 2 robustness vs W2003): https://archives.ismir.net/ismir2021/latebreaking/000039.pdf
- Panako JOSS 2022: https://joss.theoj.org/papers/10.21105/joss.04554.pdf
- Panako repo (AGPL, Java, patent note): https://github.com/JorenSix/Panako
- Olaf repo (AGPL, WASM): https://github.com/JorenSix/Olaf
- audfprint (MIT): https://github.com/dpwe/audfprint
- Dejavu: https://github.com/worldveil/dejavu, https://pypi.org/project/PyDejavu
- Chromaprint licensing: https://archlinux.org/packages/extra/x86_64/chromaprint/, https://github.com/wo80/AcoustID.NET
- Neural Audio Fingerprint: https://github.com/mimbres/neural-audio-fp, https://ar5iv.arxiv.org/html/2010.11910
- FMA: https://github.com/mdeff/fma, https://ar5iv.arxiv.org/html/1612.01840
- US7627477 status: https://patents.google.com/patent/US7627477B2/en
- Audible Magic Broad Spectrum (50% altered, 4:1 sped up): https://www.audiblemagic.com/2024/06/06/audible-magics-broad-spectrum-detecting-transformed-audio/
- Sped/slowed remix policy: https://support.fuga.com/hc/en-us/articles/36690013408916-Copyright-Compliance-Issues-with-Delivery-of-Unlicensed-Sped-Slowed-Track-Remixes
- Content ID eligibility: https://support.google.com/youtube/answer/1311402
- Vobile acquires Pex: https://prod-ss.aap.com.au/aapreleases/cision20250414ae63730, https://www.digitalmusicnews.com/?p=318775
- Vobile VDNA: https://vobileinc.com/vdna?lang=en-us
- Browser audio constraints: https://blog.mozilla.org/webrtc/fiddle-of-the-week-audio-constraints/, https://blog.addpipe.com/audio-constraints-getusermedia/, https://lists.w3.org/Archives/Public/public-media-capture-logs/2017Jun/0118.html
- Existing projects: https://devpost.com/software/beatfinder, https://devpost.com/software/song-identifier, https://treehacks-2024.devpost.com/submissions/481121-pirateshield-automated-copyright-infringement-detection, https://github.com/akgupta1337/Shazzam-Clone, https://github.com/Nohossat/sezame
- PyPI version and license checks (librosa, numpy, scipy, soundfile, sounddevice, pyrubberband, audiomentations, fastapi, remotezip, pyacoustid): pypi.org JSON API, checked 2026-10-16
- Repo context: docs/judges.md, docs/prizes.md, docs/scorecard.md
