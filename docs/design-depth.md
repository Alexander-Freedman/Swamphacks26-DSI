# Design in 2-4h + one depth feature per candidate

General design method, plus the one depth feature per candidate. Nothing is picked.

# Design in 2-4h + the one depth feature per candidate (Q20, Q21)

Tags: [primary] = official doc or first-hand page I read the content of (via search summaries); [secondary] = blog/agency commentary; [est] = my call.

## What this means for us (short)
- Pick ONE real reference product per idea and copy its *system* (type scale, color roles, density), not its logo. A real reference is the fastest cure for the default look, because every choice gets a "because NWS does it" answer.
- Spend the first 30 min on tokens (CSS variables or a Tailwind v4 `@theme` block) and **delete the defaults** (`--color-*: initial`) so no agent or teammate can drift back to `indigo-500`.
- Color carries meaning, not decoration: one accent, semantic colors for state, grays for everything else. Check contrast once with a checker (4.5:1 text, 3:1 UI/graphics).
- Build a "demo mode": bigger type (the 2-3 numbers a judge must read at 48-72px), no hover-only info, works with sound off, tested on a real external monitor in a lit room.
- Depth features (Q21): A = held-out backtest of the hazard index vs a baseline, shown on a replay day; B = shape-feature diagnosis drawn on the judge's own path, with a measured accuracy; C = pitch/tempo-invariant hash that *reports back* the speed/pitch the judge set. Each is 15 s at the table.

---

## Q20. Distinctive, credible visual design in ~2-4 hours

### Why it matters at XII
- Design & Usability is one of the 7 criteria (docs/scorecard.md), and judges now mark down the "barely prompted" look (docs/ai-era.md: Chainguard Vibelympics judge called out "a purple UI shade"; Daren Tan on look-alike vibe-coded projects).
- The tell list is consistent across sources: Inter, indigo/purple-to-blue gradient, three evenly spaced rounded icon cards under a hero, gradient text on headings/metrics, dark background with glowing accents (cyan-on-dark), the same oversized radius on every element ([925 Studios](https://www.925studios.co/blog/ai-slop-design-tells), [925 Studios guide](https://www.925studios.co/blog/ai-slop-web-design-guide), [Noqta 2026](https://noqta.tn/blog/ai-design-slop-overused-ui-patterns-fix-2026), [Kosta Canatselis](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c), [pixelslop pattern catalog](https://cdn.jsdelivr.net/npm/pixelslop@0.3.8/dist/skill/resources/ai-slop-patterns.md) [secondary]). The purple traces to Tailwind UI's `bg-indigo-500` default spreading through training data ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website) [secondary]). Caveat from the same catalogs: any one tell is fine on its own; it's the cluster that reads as generated.

### The method: one reference, copied as a system [est, grounded below]
1. **Pick the reference by user, not by taste.** Field crew → NWS/weather.gov, aviation/ops consoles. Learner → PhET, Brilliant, a good textbook. Game → hardware/instrument UIs. Say it in the pitch only if asked ("we based the alert colors on NWS's own map key").
2. **Copy 4 things from it:** type pairing (or a free near-match), color *roles* (what color means), density (how much per screen), and one signature component (NWS: the colored hazard banner; PhET: the play-area + control-panel split; hardware: the segmented readout).
3. **Don't copy:** logos, the NWS seal, or anything that makes it look official. Make it obviously ours.

### Color system that survives judges and projectors
- **Define shades up front; don't `lighten()`/`darken()` on the fly.** Grays start from the darkest text and lightest background and fill in between; tint grays slightly warm or cool ([Refactoring UI, "Building your color palette"](https://refactoringui.com/previews/building-your-color-palette) [primary]). Practical: 1 accent (5-9 steps), 1 neutral ramp (8-10 steps), 3-4 semantic colors (ok/watch/warn/danger).
- **Contrast targets:** text 4.5:1, large text (≥24px, or ≥18.66px bold) 3:1 (WCAG 2.x SC 1.4.3); UI components and chart marks 3:1 against neighbors (SC 1.4.11) ([W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html), [1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)). Don't use color alone to mean something (SC 1.4.1): add an icon, label or pattern ([W3C 1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)).
- **Fast contrast shortcut:** USWDS's "magic number": grades are a 0-100 lightness scale consistent across families; a grade difference of 50+ passes AA text, 40+ AA large text, 70+ AAA ([USWDS color tokens](https://designsystem.digital.gov/design-tokens/color/overview/) [primary]). If we build on USWDS colors we can pick pairs without a checker.
- **Semantic colors that already mean something:** NWS publishes its watch/warning/advisory map key with hex codes and priority (e.g. Tornado Warning #FF0000, Severe Thunderstorm Warning #FFA500, Flash Flood Warning #8B0000; only the top-priority hazard shows per zone) ([weather.gov/help-map](https://www.weather.gov/help-map) [primary]). Useful for the hazard idea: the colors are borrowed meaning, and the "one hazard per zone, highest priority wins" rule is a design decision we can cite.
- **Color-blind safety for categories:** Okabe-Ito 8-color set or ColorBrewer qualitative sets [est, standard practice]; for continuous data (spectrograms, heat) use a perceptually uniform map (viridis / inferno / magma from matplotlib), never rainbow/jet.
- **Dark mode, if any:** use dark gray (#121212-ish) not black, show elevation with lighter surfaces, and aim very high for body text on dark ([Material 2 dark theme](https://m2.material.io/design/color/dark-theme) [primary]). Desaturate accents on dark to avoid glow/halation [secondary].
- **Data viz in dashboards:** most important data gets the highest contrast and largest area; one consistent color per data series across the whole dashboard; strip what distracts ([Carbon v10 dashboards](https://v10.carbondesignsystem.com/data-visualization/dashboards) [primary]).

### Type
- Two families max: one text face + one mono (or a display face). Use a modular scale (e.g. 12/14/16/20/24/32/48) and only those sizes [est; Refactoring UI's "hand-picked scale" point].
- Avoid Inter *as the whole identity*. Also note the newer defaults generated UIs reach for: Geist, Space Grotesk, Poppins [secondary/est]. Good free choices with a story: **Public Sans** (USWDS's own face), **IBM Plex Sans/Mono** (made for IBM tools), **Source Serif 4 + Source Sans 3** (textbook feel), **Atkinson Hyperlegible** (Braille Institute, built for low-vision legibility: a credible usability story), **Barlow / Barlow Condensed** (signage and gauges), **JetBrains Mono** (tabular readouts).
- Use `font-variant-numeric: tabular-nums` for any number that updates (countdowns, scores, meters) so it doesn't jitter.

### Dense dashboard vs consumer-learning patterns
| | Dashboard (hazard) | Learning tool (physics) / game |
|---|---|---|
| Goal | Scan many items, spot the exception | Focus on one thing, one decision at a time |
| Density | Compact rows (32-36px), tables over cards, small multiples, status at left edge | One task per screen, big play area, minimal text (PhET: "minimal explicit guidance", controls + feedback do the teaching) |
| Color | Gray UI, color only for status | Color linked across representations (same color for the ball, its graph and its arrow) |
| Text | Labels, units, timestamps, source + age of each number | Short prompts, named outcomes, no paragraphs |
| Motion | Almost none; flash once on a state change | Motion *is* the content (sim, ghost); UI chrome stays still |
Sources: [Carbon dashboards](https://v10.carbondesignsystem.com/data-visualization/dashboards); PhET implicit scaffolding: affordances, constraints and feedback built into the tool, multiple linked representations, minimal text, tabs to sequence ideas ([Podolefsky, Moore & Perkins, arXiv 1306.6544](https://arxiv.org/pdf/1306.6544), [PERC 2013](https://www.per-central.org/perc/2013/Detail.cfm?id=5248) [primary]).

### Motion, sparingly
- ~100 ms for simple feedback (toggle, press), 200-300 ms for state changes (panel open), up to ~500 ms only for large moves; exits a bit faster than entries ([NN/g via W3C CSSWG thread](https://lists.w3.org/Archives/Public/public-css-archive/2025Apr/0702.html), [Val Head](https://valhead.com/?p=2978), [SAP Fiori](https://experience.sap.com/fiori-design-web/?p=90413) [secondary]). Polaris tokens step 0-250 ms+ in 50 ms steps, ease-in-out for system-triggered transitions ([Polaris motion tokens](https://polaris-react.shopify.com/tokens/motion) [primary]).
- Honor `prefers-reduced-motion` (WCAG 2.3.3, [W3C](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)). No parallax, no animated gradients, no fade-in-on-scroll everywhere (another tell).
- Rule [est]: one meaningful animation per screen, and it must carry information (countdown reset, ghost diverging, diagonal tilting).

### Projector / expo legibility
- Rules of thumb vary: ≥24 pt body on projected slides; ~10 mm letter height per metre of viewing distance; projectors wash colors out, so test on the real device; red bleeds ([SVC "Clear Projections"](https://www.svconline.com/news/clear-projections-365742), [UF IFAS presenter guide](https://conference.ifas.ufl.edu/nwwws/ppt.html) [secondary]). No single standard.
- What that means at a table [est]: judges stand 0.5-1.5 m from a laptop or a borrowed monitor. Build a `?demo=1` mode: root font 18-20px (or browser zoom 125-150%), the hero numbers 48-72px, minimum 14px anywhere, thick lines (2-3px) on charts, no thin light-gray text, no hover-only tooltips.
- **Light vs dark:** expo halls are bright and laptop screens glare, so a light theme with dark text usually reads better at a table; dark themes look great in screenshots and the video. Ship light as default for the hazard tool (crews in sun), and pick per idea for the others; make sure whichever mode we demo in has been checked on an external monitor [est].
- Must work with sound off (Minerva lost audio at the TreeHacks expo, docs/deep-mental-models.md).

### The 30-minute design-system checklist
| Min | Do | Done when |
|---|---|---|
| 0-5 | Pick the reference product; screenshot 3 screens into `docs/design-ref/`; write one line: "looks like X because user Y". | Both of us agree on it |
| 5-10 | Type: 1 text face + 1 mono from Google Fonts; scale 12/14/16/20/24/32/48; line-height 1.5 body / 1.2 headings; `tabular-nums` on numbers. | Tokens in CSS |
| 10-18 | Color: neutral ramp 8-10 steps (tinted), 1 accent ramp, semantic ok/watch/warn/danger (borrow NWS or Okabe-Ito). In Tailwind v4: `@theme { --color-*: initial; --font-*: initial; ... }` then only ours ([Tailwind v4 theme vars](https://tailwindcss.com/docs/theme) — clearing a namespace with `initial` per [Steve Kinney](https://stevekinney.com/courses/tailwind/theme-customization)). Plain CSS: `:root { --bg, --surface, --text, --text-muted, --border, --accent, --ok, --warn, --danger }` + a `[data-theme=dark]` block. | Defaults deleted |
| 18-22 | Contrast pass: run every text/surface pair through a checker (WebAIM) or use the USWDS 50+ rule; non-text marks 3:1. | Table of pairs in NOTES.md |
| 22-26 | Shape + space: one radius (2-6px for tools, maybe 0 for hardware-look; not 16px everywhere), a 4/8px spacing scale, 1px borders instead of big shadows, no glass/blur. | Tokens |
| 26-30 | Agent guardrail: add a short "design rules" block to NOTES.md (fonts, tokens, banned list: purple/indigo, gradients, gradient text, glow, glassmorphism, 3-icon-card rows, emoji icons, "Unlock/Empower/Seamless" copy) so every generated component follows it. | Committed |

### Removing the tells (sweep at ~H20 and again before freeze)
- [ ] No indigo/violet/purple anywhere unless it's a data role; no gradients on backgrounds, buttons or text.
- [ ] Not Inter/Geist/Poppins as the only face; real type scale used.
- [ ] No hero + 3 icon cards; no "features" grid. The first screen is the product doing its job.
- [ ] No glassmorphism/backdrop-blur, no glow shadows, no cyan-on-black.
- [ ] Radius not maxed on everything; shadows small or none.
- [ ] Real data and real copy (no lorem, no "John Doe", no emoji icons, no marketing verbs). Units and sources shown.
- [ ] Empty, loading and error states designed (stale data shows "last value, 12 min old", never blank).
- [ ] Icons from one set (Lucide/Phosphor/Material Symbols) at one stroke weight.
- [ ] Keyboard focus visible; works at 375px wide; reduced-motion respected.

### Two reference directions per idea
**(a) Field-crew hazard dashboard (Sperry)**
1. **"NWS operations" (weather.gov + USWDS).** Public Sans + Roboto Mono or IBM Plex Mono; white/very light gray surfaces, near-black text, NWS map-key colors for hazards (only the top-priority hazard per site shown, like the WWA map). Signature component: full-width colored alert banner with plain-language action ("STOP WORK: lightning 6.2 mi, resume 14:32"). Dense table of sites with a status chip at left, small multiples of the 0-10 index. Why it's credible: crews and Sperry already read NWS colors; USWDS gives accessible pairs for free.
2. **"Ops console / aviation EFB" (Linear-like restraint, dispatch-board density).** IBM Plex Sans + Plex Mono; neutral warm grays, one safety-orange accent, monochrome map basemap (gray, so hazard colors pop), keyboard-first list on the left, map right, 6 PM briefing as a printable page. Dark variant for the supervisor screen, light for the phone in sun. Why: it reads "tool people use for 8 hours", not "landing page".

**(b) Physics learning tool (Mental Models)**
1. **"PhET lab bench."** Big play area + a narrow control panel at right; Atkinson Hyperlegible or Source Sans 3; light background, saturated but few object colors linked across representations (ball = path = velocity arrow same hue), the judge's ghost in a distinct dashed stroke; minimal text, named misconception card in a quiet panel. Why: PhET's research-backed design (implicit scaffolding) is the field standard, and the UF EEd judge will recognize it.
2. **"Textbook / notebook page" (Brilliant-ish, but paper).** Source Serif 4 headings + Source Sans 3 body + a mono for numbers; warm off-white "paper", ink-black strokes, one red-pencil accent for "where your path left reality"; graph-paper grid behind the canvas. Instructor dashboard switches to the dense table style. Why: hand-drawn prediction on paper is the hook, and the paper look matches it (and B+'s sketch input).

**(c) Audio-fingerprint game (Beat the Fingerprint)**
1. **"Hardware instrument" (Teenage Engineering / Braun / lab gear).** Light gray chassis, black text, one signal orange; Barlow Condensed labels + JetBrains Mono readouts; sliders styled as fader strips with tick marks, segmented readout "1.08x  +1.3 st", two VU-style meters (classic vs ours). Zero radius or 2px. Why: makes the attack console feel physical and gamey without neon.
2. **"Spectrogram lab" (Sonic Visualiser / iZotope RX / oscilloscope).** Near-black background (#121212-ish, not pure black), spectrogram in inferno/magma colormap, constellation peaks as white dots, matched hash lines in one accent, the offset scatter with the fitted line; IBM Plex Mono throughout with Plex Sans for labels. Why: it shows the algorithm itself, which is the Technical Understanding pitch. Watch the dark + glow tell: no glow, flat marks, test on the expo monitor.

### Time budget [est]
30 min tokens + references; 1-1.5h applying them to the 2-3 real screens; 30-45 min states (empty/loading/stale/error) and demo mode; 30 min tell sweep + monitor test. Total 2.5-3.5h, split across the two of us, matching docs/ai-era.md's 2-4h line.

---

## Q21. The one depth feature per candidate

The test for "depth feature": something a technical judge can poke with their own input, that only works if we understand the hard part, and that we can defend line by line (Technical Understanding) while being something they haven't seen at a hackathon (Innovation). Hours are on top of the minimal app unless noted.

### A. Hazard radar (Sperry brief)
- **Feature: held-out backtest of the 0-10 hazard index on a replay day.** Train ≤2023, test 2024-25; on the Model tab, pick a held-out storm day and the board shows our top-10 sites next to what NWS actually warned (IEM archive), plus precision@10 vs a naive baseline (persistence or max-raw-threshold) and a small calibration plot. Clicking a site's score shows its top feature contributions.
- **Why this one:** Sperry's ML judges' bios are "model selection, evaluation, monitoring" (docs/sperry-deep.md §3); the scorecard puts A's Innovation at 3 because hazard maps are familiar, and "the edge is the crew decision + backtest". An honest time-split eval with a baseline is what most hackathon "AI risk scores" lack, and Devfolio-style judging checks whether the "model" is real (docs/ai-era.md). The lightning 30-min reset golden test is the other candidate, but it's a rule, not a model; it scores Functionality more than Innovation. Keep it, but it's not the depth pick.
- **Time:** 5-9 person-hours (labels from IEM + per-site-day features 2-4h, model + baseline + metrics 2-3h, Model tab UI 1-2h). Risk: label joins eat time; fallback is fewer sites and one hazard type.
- **15 s at the table:** "This day is from 2024; the model never saw it." Click the date: top-10 lights up, NWS warnings overlay, two numbers big: "precision@10: ours X, baseline Y." Click one site: "heat index 41% of this score, lightning density 30%." Then: "It ranks; it never overrides a live alert."

### B. Mental Models (predict-then-simulate)
- **Feature: a measured misconception diagnosis drawn on the judge's own path.** After the ghost diverges, overlay the shape features we computed on their drawing (e.g. "horizontal speed drops 58% before the peak" → impetus/"push runs out"; "path bends to vertical" → force-follows-velocity), the diagnosis with confidence or "not sure" (abstain), and one line from the eval: macro-F1 / kappa on real explanations collected at the event vs keyword and text-only baselines.
- **Why this one:** the ghost is the hook (Innovation), but "AI tutor explains" is saturated and nobody in the teardowns measured their diagnosis (docs/deep-mental-models.md §1 takeaway). Deterministic shape features are explainable code, not an LLM guess; the judge can draw a deliberately weird path to try to break it, and the abstain shows we know the limits. The UF EEd judge works on learning analytics and assessment, and the DSI judges want a real eval.
- **Time:** 8-12 person-hours total: shape features + rules 3-5h, overlay UI 1-2h, eval harness + baselines 2-3h, blind labeling + kappa 2-3h across both of us (most of this is already in the core plan; the overlay is the only extra, ~1-2h).
- **15 s at the table:** judge draws, ghost falls off, then the card: their path with the slowdown segment highlighted, "Push runs out (78%)". Point to the strip under it: "On 1xx real explanations from people here today: F1 0.xx vs 0.xx keyword baseline; it says 'not sure' when it can't tell." (Fill real numbers; say N.)

### C. Beat the Fingerprint
- **Feature: pitch/tempo-invariant triplet hashing that reports back what the judge did.** The judge sets speed, pitch and tempo; the classic Wang pair-hash meter collapses past ~4% while ours still names the track and reads back the estimated "1.08x, +1.3 st", taken from the slope of the fitted line in the offset scatter (the "tilting diagonal").
- **Why this one:** it answers "isn't this just Shazam?" in one move (Panako's eval: Wang 2003 near 0% top-1 at ±4% speed; Panako 2021 holds ~75-95% across 84-116%, Six 2021, per docs/deep-fingerprint.md). Recovering the transform, not just the ID, is the part a technical judge can't fake their way past: it proves we understand *why* the hash is invariant (log-frequency differences, time ratios) and how the verification line fit works. Audible Magic sells "Broad Spectrum" for exactly this case, which helps Innovation and the Vobile judge.
- **Time:** 6-8h on top of Wang (3-4h), plus 2-3h for the eval grid. Cut line at H14: if triplets aren't ≥70% at 8% speed, fall back to brute-force speed search (1-2h), which still reads back the speed but not independent pitch/tempo; say so honestly.
- **15 s at the table:** hand the judge the speed fader, they set something like 1.10x and +2 st, hit Match. Left meter (classic) drops to nothing, right meter matches, readout shows "1.10x, +2.0 st" against what they set, and the scatter's diagonal visibly tilts. One line: "Shazam's hash uses absolute pitch and time gaps; ours uses ratios, so stretching doesn't change it."

### Common rule for all three
Put the depth feature in the first minute of the demo, keep an offline version (recorded replay day / static eval table / digital attack path with no mic), and both of us must be able to explain it without the laptop (the "why did we do X" drill).

## Sources
- Refactoring UI, building a palette: https://refactoringui.com/previews/building-your-color-palette
- W3C WCAG 2.1 Understanding 1.4.3, 1.4.11, 1.4.1, 2.3.3: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html , https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html , https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html , https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html (cited from the standard; pages not re-fetched today)
- USWDS color tokens and magic number: https://designsystem.digital.gov/design-tokens/color/overview/
- NWS map hazard colors/priority: https://www.weather.gov/help-map
- Material 2 dark theme: https://m2.material.io/design/color/dark-theme
- IBM Carbon v10 dashboards: https://v10.carbondesignsystem.com/data-visualization/dashboards ; IBM data viz: https://ibm.com/design/language/data-visualization/overview
- Shopify Polaris motion tokens: https://polaris-react.shopify.com/tokens/motion
- Animation duration ranges: https://lists.w3.org/Archives/Public/public-css-archive/2025Apr/0702.html , https://valhead.com/?p=2978 , https://experience.sap.com/fiori-design-web/?p=90413 , https://uxdesign.cc/the-ultimate-guide-to-proper-use-of-animation-in-ux-10bd98614fa9
- PhET implicit scaffolding: https://arxiv.org/pdf/1306.6544 , https://www.per-central.org/perc/2013/Detail.cfm?id=5248
- Projection legibility: https://www.svconline.com/news/clear-projections-365742 , https://conference.ifas.ufl.edu/nwwws/ppt.html
- Tailwind v4 theme tokens: https://tailwindcss.com/docs/theme , https://stevekinney.com/courses/tailwind/theme-customization
- AI-design tells: https://www.925studios.co/blog/ai-slop-design-tells , https://www.925studios.co/blog/ai-slop-web-design-guide , https://noqta.tn/blog/ai-design-slop-overused-ui-patterns-fix-2026 , https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c , https://cdn.jsdelivr.net/npm/pixelslop@0.3.8/dist/skill/resources/ai-slop-patterns.md , https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website
- Repo docs used: docs/ai-era.md, docs/scorecard.md, docs/sperry-deep.md, docs/deep-mental-models.md, docs/deep-fingerprint.md
