# Truth-reveal patterns (#24)

How the "see the truth" step works for any topic, and the small set of components the engine needs. Builds on docs/deep-mental-models.md (the ghost) and the paused pen-input branch (`web/src/mm/`). Checked Oct 16 2026.

## TL;DR
- **The reveal lands when the user's own mark is frozen on screen and the truth is drawn *over* it, slowly, with the gap shaded.** That's the NYT "You Draw It" pattern, and there's a CHI 2017 Best Paper behind it: predicting + seeing your prediction against the data beat a plain-chart control on recall and comprehension ([Kim, Reinecke, Hullman 2017](https://idl.uw.edu/papers/explaining-the-gap)).
- **Truth comes from code, never from model text.** The generator writes a *spec* (expression, sampler, preset + params, sourced number). The browser computes the truth (mathjs, seeded sampler, analytic sim). That's our accuracy answer at the table.
- **5 components cover most topics:** Curve, Distribution, Trajectory, Estimate, Order. Build **Curve + Distribution first**. Trajectory already half-exists as OffTheEdge.
- All 5 share one reveal grammar (lock, beat, wipe, shade the gap, name the misconception, then free play), so the 2nd-5th components are cheaper than the 1st.

## What the best products do

| Product | Reveal mechanic | What we take |
|---|---|---|
| NYT Upshot "You Draw It" (2015, Aisch/Cox/Quealy) | Reader draws the curve on empty axes (college attendance vs parent income percentile), then the real line appears, plus other readers' guesses in red ([FlowingData](https://flowingdata.com/2015/05/28/compare-your-curve-to-reality-for-income-percentile-versus-college-attendance/), [R-bloggers](https://www.r-bloggers.com/2015/05/chances-of-going-to-college-based-on-parents-income/)). ~78k completions by one teacher-site count ([NGPF](https://dev5.ngpf.org/blog/interactive/interactive-what-impact-does-family-income-have-on-a-childs-chance-of-going-to-college/)) [secondary] | Draw on axes. Part of the line is given, and you draw the rest. Truth wipes in. The crowd shows up after. |
| ONS rebuild of You Draw It | Truth line already drawn but masked by a clip rect, and the rect width animates to reveal it. Based on Adam Pearce's simplified code ([ONS digital blog](https://digitalblog.ons.gov.uk/2018/01/16/reusable-visualisation)) | The exact implementation: `clipPath` width tween, ~20 lines. |
| Seeing Theory (Brown) | Flip once or 100 times. Bars of observed vs theoretical 50% fill in, and you watch convergence ([Brown Alumni Mag](https://www.brownalumnimagazine.com/articles/2017-05-01/the-visualizer), [GIGAZINE](https://gigazine.net/gsc_news/en/20190125-seeing-theory/)) | Sampling *animates* in at increasing speed. "x1 / x100" buttons. Our addition: you predict the histogram first. |
| PhET | Implicit scaffolding: affordances, constraints and feedback built into the sim, minimal text, linked representations ([Podolefsky et al., arXiv 1306.6544](https://arxiv.org/pdf/1306.6544)) | After the reveal, give one slider and no paragraphs. Use the same color for an object everywhere it shows up. |
| Bret Victor, Explorable Explanations (2011) | Reactive documents: drag a number in the text and the model updates. Explorable examples ([worrydream](https://worrydream.com/ExplorableExplanations/)) | The "why" step is a parameter you drag, not a paragraph you read. |
| Nicky Case (Parable of the Polygons, Evolution of Trust) | One message per screen, simple art, sandbox at the end ([Vice review](https://www.vice.com/en/article/its-time-for-some-real-game-theory), [Wikipedia](https://en.wikipedia.org/wiki/Parable_of_the_Polygons)) | One idea per item. Sandbox after the reveal. |
| Brilliant | Lessons are "interactive games, no videos", with "visual systems for feedback" ([job post](https://jobs.lever.co/brilliant/9f63e8ed-2f9d-4e28-8a68-6262a0f8f68d)) | Feedback lives in the visual, not a toast. |
| Desmos Activity Builder | Sketch component on a graph background, plus "sketch and check" regression on sketched points ([Amplify help](https://my.amplify.com/help/en/articles/6797997-getting-started-activity-builder), [CL forum](https://cl.desmos.com/t/can-i-use-something-a-student-did-as-a-background-to-a-sketch/47)) | Teachers already accept "sketch the graph" as an assessment. Grade a sketch by sampling it at fixed x. |
| 3Blue1Brown / Manim | Continuous transforms: one shape morphs into another, so the change *is* the explanation [my read] | Morph the ghost into the truth (same x-bins, so it's a linear lerp of y-arrays; no flubber needed). |
| The Pudding | Asks the reader to predict before showing evidence. A sequence of static graphics is often enough ([webiano essay](https://webiano.digital/the-pudding-proves-that-a-website-can-still-be-journalism/)) [secondary] | Not everything needs a sim. Estimate and Order are fine as static plus one tween. |

## What makes a reveal land (rules for all components)
1. **Commit first.** A "Lock it in" button. After that the guess can't be edited, and it gets a pencil-stamp. No peeking: the truth isn't in the DOM before the lock (it's computed on lock).
2. **Guess stays visible, in its own style.** Pencil/dashed ghost under the ink truth. Never replace the guess. Kim et al. found the benefit came from seeing *your* prediction next to the data.
3. **Suspense beat, then progressive truth.** ~400 ms pause, then the truth draws in over 1.2-2 s, left to right or sample by sample, so the eye tracks the gap at the frontier. Stagger discrete things (bars, cards) 60-120 ms apart, Wordle-tile style [est; timings are mine, not sourced].
4. **Highlight the delta, once.** Shade the area between guess and truth, and put ONE callout at the biggest gap ("you dropped here, reality keeps going"). That callout is the misconception card's anchor.
5. **Name it.** The card names the wrong idea from the item's closed list (see #19), with the shape evidence that triggered it.
6. **Then free play.** One slider on the item's key parameter (p, n, launch speed, the function's coefficient). Victor/PhET style.
7. **Social proof after, not before.** Crowd ghosts (other players' guesses, faint) only after your own reveal. That's NYT's red cloud and our instructor "ghost cloud".
8. **Score as closeness.** A % match from the area between curves, or bins off, or orders of magnitude. That feeds the streak/XP loop (#22).
9. Respect `prefers-reduced-motion`: skip the wipe and show the final state plus the shaded gap.

## The component set (one engine, 5 types)

Every spec shares: `{ id, topic, type, prompt, givenHint?, misconceptions: [{ id, label, explain, rule }], explore?: { param, min, max, step } }`. A `rule` is a deterministic shape check (e.g. `{ kind: "sign_at", x: 2, expect: "+" }`). The model only picks among labels when the rules tie (see deep-mental-models.md).

### 1. Curve: "draw the graph" ★ build first
- **Covers:** calculus (sketch f' from f, integrals as area), any trend vs time, rates, population growth, cooling, supply/demand, "what does the graph of X look like".
- **Input:** freehand stroke on fixed axes ([perfect-freehand](https://github.com/steveruizok/perfect-freehand) for the pencil look). Resample to N=50-100 x-bins, last-write-wins per bin so the stroke is a function. Optionally the left part is given (NYT).
- **Reveal:** truth path behind a `clipPath` whose width tweens 0 to full. Then the area between is shaded and the max-|Δ| bin gets the callout. Optional: the ghost morphs into the truth.
- **Generator outputs:**
```json
{"type":"curve","x":{"min":-3,"max":3,"label":"x"},"y":{"min":-5,"max":5,"label":"f'(x)"},
 "context":{"expr":"x^3-3x","label":"f(x)"},"truth":{"expr":"3x^2-3"},"givenUntil":null,
 "misconceptions":[{"id":"copies_f","label":"Drew f, not its slope","rule":{"kind":"corr_with_context","gt":0.9}}]}
```
- **Truth:** `mathjs` (15.2.0) compiles `expr` and samples it. Reject the spec if it doesn't compile or leaves the y-range.
- **Libs:** SVG + `d3-scale`/`d3-shape` (no full d3), perfect-freehand, `motion` (14.3.0) for the tween. [Mafs](https://github.com/stevenpetryk/mafs) (0.21.0) is nice for axes but its last release is ~a year old [unverified], so skip it.
- **Hours:** 4-5 (canvas pen code from OffTheEdge transfers).

### 2. Distribution: "predict the histogram" ★ build first
- **Covers:** coin flips, dice sums, the birthday problem, CLT, streaks ("longest run of heads in 100 flips"), polling error, Monty Hall over 1000 games, any "what usually happens" question.
- **Input:** drag bar heights (snap to integers or %), or "drag your 90% range" for one quantity.
- **Reveal:** seeded sampling runs live. Bars fill trial by trial, slow at first (x1, x10, then x1000), and the user's bars stay as pencil outlines. Seeing Theory's convergence plus our prediction layer.
- **Generator outputs:**
```json
{"type":"distribution","question":"Longest run of heads in 100 flips?","sampler":{"kind":"longest_run","n":100,"p":0.5},
 "bins":{"min":1,"max":15},"trials":2000,"seed":42,
 "misconceptions":[{"id":"runs_rare","label":"Thinks long streaks are rare","rule":{"kind":"mode_below","x":5}}]}
```
- **Truth:** a whitelist of ~8 samplers we write and test (binomial, sum_of_dice, longest_run, birthday, normal_mean, geometric, monty_hall, custom_discrete) with `seedrandom` (3.0.5). The generator can't invent new math; it picks a sampler and params.
- **Libs:** SVG bars + motion, or canvas if trials are over 5k.
- **Hours:** 3-4.

### 3. Trajectory: "draw where it goes" (the ghost race)
- **Covers:** projectiles, circular release, pendulum cut, falling objects, light rays, orbits.
- **Input:** a path on a scene (already built: `OffTheEdge.tsx`, `geometry.ts`).
- **Reveal:** the ghost replays the drawn path at the sim's timing, racing the real object. The moment they diverge, we freeze and call it out.
- **Generator outputs:** `{"type":"trajectory","preset":"projectile|circle_release|pendulum_cut|incline","params":{...}}`. Presets are hand-built analytic sims (not matter.js, so they're deterministic and testable).
- **Hours:** ~2 to finish OffTheEdge, 3-5 per extra preset. The generator *can't* go beyond presets, so this is the least "any topic" of the five.

### 4. Estimate: "place it on the line"
- **Covers:** Fermi questions, base rates (Bayes: "positive test, chance you're sick?"), percentages, dates, sizes, "how many".
- **Input:** drag a point and a range on a linear or log axis.
- **Reveal:** the truth pin drops from the top, then a bracket shows the distance in units or orders of magnitude, then the crowd dots fade in.
- **Generator outputs:** `{"type":"estimate","scale":"log","min":1,"max":1e9,"unit":"people","truth":{"value":8.1e9,"source":"url"} | {"expr":"..."}}`. If there's no `expr`, a `source` URL is required and the item is shown with "source: ..." (the accuracy risk lives here).
- **Hours:** 2. The cheapest way to say "works on anything".

### 5. Order: "put it in order"
- **Covers:** timelines, process steps (mitosis, the TCP handshake), algorithm traces, ranking (which falls first, which is biggest).
- **Input:** drag cards into a list or onto a time axis.
- **Reveal:** cards move one at a time to their true slot (motion `layout` FLIP), with lines between the guessed and true positions. Crossings show the swaps.
- **Generator outputs:** `{"type":"order","items":[{"id":"a","label":"Prophase","truth":1}],"axis":null | {"min":1900,"max":2000}}`
- **Hours:** 3. Truth is facts, so it has the same source rule as Estimate.

### Not a separate type: Explore slider
A post-reveal layer for every type: `explore: {param:"p", min:0, max:1}` re-runs the truth live (re-sample, re-evaluate the expr, re-run the sim). It's ~1h once the truth functions are pure.

## Why Curve + Distribution first
- They're the two demo examples in our own direction text (calculus, coin flips), and together they cover math, stats, probability and most "trend" questions.
- Both have **computable truth**, so there's zero hallucinated truth on the demo path, and that's the answer to the "is the model right?" judge question.
- Both reuse the pen and ghost code. Trajectory stays as the physics hero item via the existing OffTheEdge.
- Estimate is the 3rd build (2h, big topic coverage). Order is the 4th.

## Open questions
- Freehand vs drag-points on mobile for Curve: freehand is the hook, but should drag-points be the fallback for touch? [test at the kiosk]
- How long can the wipe be before judges get impatient? I'm guessing 1.2-2 s; tune this in the hallway test.

## Icon arrays for probability reveals (queue 2b)

Question: should every probability reveal show "X out of 100" plus an icon array by default? Checked Oct 16 2026.

**Short answer: yes for any single proportion or base-rate (Bayes) item, as a static, grouped 10x10 grid that builds in. Not for distributions (the histogram already does that job), and no random-shuffle animation by default.**

### What the evidence says
- **Natural frequencies beat probabilities for Bayes-type questions.** In Hoffrage, Lindsey, Hertwig & Gigerenzer (Science 2000, 290:2261), 1 of 24 physicians got a colorectal-screening PPV right with probabilities vs 16 of 24 with natural frequencies. Law professionals went from 13% to 68% ([course copy of the article](https://jhanley.biostat.mcgill.ca/c607/ch04/Communicating_stat_info.html), [PubMed 11188724](https://pubmed.ncbi.nlm.nih.gov/11188724/)). The reason is that the counts carry the base rate, so fewer steps are needed. A 2016 MDM paper urges caution about making them the universal default for patients ([SAGE abstract](https://journals.sagepub.com/doi/abs/10.1177/0272989X16640785)). I only read its abstract.
- **Icon arrays help low-numeracy people most.** Galesic, Garcia-Retamero & Gigerenzer (Health Psychology 2009, 28(2):210-216) ran two experiments with older adults. Citing papers describe the result as icon arrays improving risk understanding, especially for low numeracy ([poster citing it](https://dlab.sauder.ubc.ca/sjdm/presentations/2017-Poster-Price-Paul-Risk-Icons-Numeracy.pdf)). I couldn't get its abstract numbers, so the effect size is **unverified**. Garcia-Retamero & Galesic (AJPH 2009) found icon arrays largely removed denominator neglect: low-numeracy wrong answers fell from 74% to 42% when group sizes differed, and high-numeracy from 26% to 15% (n=1047, US+DE) ([PMC2775772](https://pmc.ncbi.nlm.nih.gov/articles/PMC2775772)).
- **A review says well-designed visual aids work if their elements are clearly defined** (Garcia-Retamero & Cokely, Curr Dir Psych Sci 2013, 22(5):392-399, [SAGE](https://journals.sagepub.com/doi/10.1177/0963721413491570), [APS summary](https://www.psychologicalscience.org/publications/observer/obsonline/visual-aids-can-help-people-better-understand-health-risks.html)). The "~60% accuracy gain" quoted in the summary is **unverified** (secondary only).
- **Show the part and the whole, grouped, not scattered.** Ancker et al. (JAMIA 2006 systematic review, [PMC1656964](https://pmc.ncbi.nlm.nih.gov/articles/PMC1656964)) found that showing only the affected count inflates perceived risk, and that accuracy is best when both numerator and denominator are visible. Sequential/block arrangements support proportion judgments. Random arrays are harder to read, though some viewers felt they convey chance better. People often *prefer* graphics that don't make them more accurate.
- **Random arrangement biases estimates upward.** In Ancker, Weber & Kukafka (MDM 2011, 31(1):143-150) random stick-figure arrays were hard to read, and proportions (especially large ones) looked bigger than they were ([Princeton record](https://collaborate.princeton.edu/en/publications/effect-of-arrangement-of-stick-figures-on-estimates-of-proportion/)). Price et al. (JDM 2022) found random arrays were perceived as higher loss probabilities and led to less risk taking ([JDM](https://dlab.sauder.ubc.ca/sjdm/journal/21/210615/jdm210615.html)).
- **Animation is a cautionary tale.** Zikmund-Fisher et al. (JMIR 2012, n=4198, 10 formats, comparing two risks) found static grouped arrays were the best overall: 84.8% picked the lower-risk option (higher numeracy). Building grouped icons one at a time was the only animation that matched it (86.3%, n.s.). Random user-controlled shuffling was worst (67.6%, OR 0.37, p<.001). Scattered icons that settled into groups were close to baseline (80-83%). Low-numeracy users showed no significant differences across formats (~68-77%) ([PMC3409597](https://pmc.ncbi.nlm.nih.gov/articles/PMC3409597/)).
- **Animated randomness has one use.** Witteman et al. (JMIR 2014, n=3630) found it aligned risk perceptions with the actual estimates a bit better (small effect, p=.01), but it lowered healthy-lifestyle intentions. A moving avatar confused most people ([PMC3978557](https://pmc.ncbi.nlm.nih.gov/articles/PMC3978557/)).
- **Where icon arrays don't help much:**
  - **Low graph literacy.** Gains were larger for high-graph-literacy people (Okan et al., JBDM 2012, 25(4):390-401, [MTU record](https://digitalcommons.mtu.edu/michigantech-p/3546)).
  - **Fixing that gap.** Explanatory labels helped low-graph-literacy users, and a reflective question plus accuracy feedback helped everyone a lot (Okan et al., JEP: Applied 2015, 21(2):178-194, "dynamic icon arrays", [MTU record](https://digitalcommons.mtu.edu/michigantech-p/8393)). That is basically our predict-then-reveal loop, which is good news for us.
  - **Blank arrays.** Ancker 2006 notes people were less accurate *marking* probabilities on blank arrays than matching them. So a guess painted on the grid needs a number readout next to it.
  - **Very small probabilities.** For 1 in 1000 on a 100 grid I'd use a 1000 grid. The literature I read doesn't size this, so it's my call, **unverified**.

### Design recommendation
1. **When to use it:** Estimate items whose answer is one proportion, and every base-rate/Bayes item. Distribution items keep the histogram. I won't wrap everything in icons, because Ancker 2006 says graphics aren't automatically more intuitive.
2. **Grid:** 10x10 = 100 by default, with the label "X out of 100" above it, never just "%". If the truth is under 2%, switch to 1000 (ten 10x10 blocks, 2x5) and say "X out of 1,000". The 2% cutoff is my rule, not sourced. For Bayes, 1000 people, split into two colors (has it / doesn't) times solid/hatched (tests positive / not), with the natural-frequency sentence under it: "Of 1,000 people, 10 have it. 8 of them test positive. Of the 990 who don't, ~95 also test positive." Those numbers are the textbook mammography example (Gigerenzer), shown for format only. Each item computes its own.
3. **Ordering:** grouped and filled row by row from the top-left, the same every time (Ancker 2006/2011, Zikmund-Fisher 2012). Never scattered by default.
4. **Animation:** on reveal the truth icons build in sequentially, 2 rows at a time. The whole grid fills in ~1.2 s, which fits our 1.2-2 s wipe rule. That's the one animated format that matched static in Zikmund-Fisher 2012. With `prefers-reduced-motion` the final state shows at once. A post-reveal **"Shuffle"** toggle shows randomness: icons scatter, and the count stays visible. It's opt-in, after the answer is read, since shuffling hurt accuracy (Zikmund-Fisher 2012) but helps the "it's random" feel (Witteman 2014). It's a good bridge to the coin/streak items.
5. **Guess vs truth on the same grid:**
   - **Input.** Before the lock, the user drags a fill handle (or taps a cell), and icons fill in row order. The live readout says "you: 30 out of 100". Snap to whole icons.
   - **After lock.** The guess becomes pencil outlines (the same pencil/dashed style as the other components), and the truth fills in solid ink in the same order.
   - **Three cell states.** In both = solid ink with a pencil outline. Truth only = solid accent. Guess only = an empty pencil outline with a light hatch. Because both fill in the same row order, the gap is one contiguous band at the frontier, which is our "shade the delta" rule for free.
   - **One callout on the band.** For example, "you overcounted by 21 people out of 100". Closeness score = 100 - |guess - truth|.
6. **Labels on every array** (icon meaning, the denominator) per Okan 2015. The misconception card plays the reflective-question role.
7. **Icons:** plain circles or squares for the 1000 grid. Person glyphs only on the 100 grid when the topic is about people. Ancker 2006 found asterisks vs figures made no difference to decisions, so I'm not spending time on art.

Open follow-ups: does a dragged fill handle or tapping cells feel better on touch (hallway test)? And should the Bayes grid show the user's guess as a count of positives or as the final "chance you're sick"? I'll pick the second, since it's what people actually guess.
