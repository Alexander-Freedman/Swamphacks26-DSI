# Product spec: Mental Models (working name)

**Status:** draft for my approval. Nothing gets built until it's approved, or auto-approved 30 min after posting (see NOTES.md).

**Track:** Entertainment & Creative Technology. **Engine:** Gemini API (MLH Best Use of Gemini).

Sources live in docs/research/: learning-science, misconceptions, any-topic-engine, engagement, competitors, reveal-patterns, demo, visual, track-entertainment, prizes-mm, gemini. Anything without a source here is marked *(unverified)* or *(our call)*.

## 1. One line
**"Every AI tutor explains. Ours makes you bet first, then shows you the truth and names the exact wrong idea you just bet on."** (competitors.md)

Any topic you type turns into a short game: **predict → lock in → watch reality play out over your guess → your wrong idea gets a name → it comes back until you've busted it.**

## 2. Why this wins (short)
- **Predicting first is the learning mechanism, not decoration.** Watching a demo taught no more than not seeing it; predicting first did ([Crouch et al. 2004](https://www.compadre.org/IntroPhys/items/detail.cfm?ID=2329)). Seeing your own prediction next to the data beat a plain chart on recall and comprehension ([Kim, Reinecke & Hullman, CHI 2017](https://idl.uw.edu/papers/explaining-the-gap)).
- **Confident mistakes are the best teachable moment** (hypercorrection; [review](https://pmc.ncbi.nlm.nih.gov/articles/PMC3604148)), so we ask for confidence and make "sure and wrong" the big moment.
- **The gap in the market:**
  - Every big tool now has a Socratic mode.
  - None *forces* a locked prediction, shows the truth as something you can play with, and names and tracks your wrong idea.
  - Brilliant is closest, but its courses are hand-authored and fixed (competitors.md).
- **Entertainment-track fit:** the track rewards a game loop with "juice" and a purpose (SignHero) or art plus story (StudyVerse), not "AI tutor" (track-entertainment.md).

## 3. The core loop (one round ≈ 2-4 min)
1. **Pick a topic.** Type anything, or tap a showcase chip.
2. **Predict.** One question per screen.
   - **Input type depends on the item:** a slider (a number), drawing a curve or path, choosing among 3-4 options, or ordering cards.
3. **Confidence.** A 3-step tap: *guessing / pretty sure / certain*.
4. **Lock it in.** After that the guess can't change, and it gets a pencil stamp. The truth isn't computed until you lock (no peeking).
5. **Reveal.**
   - ~400 ms beat, then the truth draws *over* your frozen pencil guess.
   - The gap between them is shaded, with one callout at the biggest gap.
   - The truth is **computed by code** (simulation, formula, or a cited number), never written by the model.
6. **Verdict stamp:** *Called it / Close / Way off*, scored as closeness, not right/wrong.
7. **Misconception card.** If your answer maps to a known wrong idea, it gets named:
   - the label (e.g. "Random means evenly mixed")
   - why it's tempting
   - the right model, in two sentences, and a source
   - It only says "this looks like…" until 2+ signals agree (misconceptions.md).
8. **Play with it.** One slider on the key parameter, so you can see *why*.
9. **Next item.** It targets the suspected wrong idea in a new setting (transfer). 3-5 items per round.
10. **Round summary.**
    - which wrong ideas were caught and which were busted
    - how well your confidence matched reality
    - a share card ("my guess vs reality")

## 4. What makes it Quizlet-like and coming-back-able (without gaming learning)
From engagement.md and learning-science.md:

**The hook mechanics:**
- **A collection of misconceptions ("the cast").** Every wrong idea you've had becomes a card with a name, an icon and a one-line origin story. You **bust** it by beating 2-3 transfer items, and busted cards flip. This is the Quizlet "set" idea, aimed at understanding.
- **A streak of honest predictions**, not of showing up, with a repair path. Broken streaks make people quit ([Silverman & Barasch 2023](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions)).
- **A review queue.** Unbusted wrong ideas come back as *new* prediction items on growing gaps (about 1, 3, 7 days). Spacing plus retrieval have the strongest evidence (learning-science.md).
- **A surprise meter and "sure and wrong" moments** get the biggest reveal (hypercorrection).
- **"The room":** after your own reveal, see what % of SwampHacks players picked the same thing.

**We deliberately leave out:**
- speed timers, hearts or lives, and XP leaderboards. They punish wrong predictions, and wrong predictions are the product (engagement.md).

**Claims we will NOT make** (learning-science.md):
- "proven to make you learn faster"
- "permanently fixes misconceptions"
- "addictive = more learning"

## 5. Screens
| # | Screen | What's on it | Notes |
|---|---|---|---|
| 1 | **Home** | Topic box ("What confuses you?"); 3 showcase chips; "N wrong ideas due for review"; streak | Guest by default |
| 2 | **Building** | "Building your round…" chip; offers a showcase round while it builds | Hides generation time (demo.md). Real build time measured on our key in docs/research/gemini.md |
| 3 | **Predict** | One question; the input (slider / draw / choose / order); confidence tap; **Lock it in** | One idea per screen |
| 4 | **Reveal** | Your pencil guess, the ink truth drawing over it, the shaded gap, the verdict stamp | Shared reveal sequence for all widgets |
| 5 | **Misconception card** | Name, why tempting, right model, source, "seen in N% of players" | Slides up over the reveal |
| 6 | **Play** | One slider on the key parameter | PhET-style: no paragraphs |
| 7 | **Round summary** | Caught / busted, confidence calibration, share card | |
| 8 | **Collection** | Your cast of wrong ideas: busted / still active / due | The come-back screen |
| 9 | **Sign in** | "Keep your streak and collection" (Auth0, Google) | Optional; cut line 2 |
| 10 | **How it works** (drawer) | The generated JSON + the computed truth side by side | For judges; answers "how do you know it's right?" |

## 6. How "any topic" works
From any-topic-engine.md, reveal-patterns.md and misconceptions.md.

**Gemini writes a spec, the browser computes the truth.**
1. Normalize the topic; check the cache.
2. **Generate.** One structured-output call (JSON schema) returns:
   - the concept
   - **a misconception list first:** 3-6 documented, named wrong ideas with a source, why each is tempting, and the refutation
   - **3-5 items:** prompt, input type, each wrong option or numeric band mapped to one misconception id, and the truth as a *spec* (an expression, a sampler, preset + params, or a sourced number)
   - which **truth widget** to use
3. **Validate.** We:
   - check the JSON against the schema
   - run the truth spec in code (evaluate the expression, run the simulation)
   - lint the items (one right answer, no giveaway wording, every distractor mapped)
   - run a **blind second call** that answers each item, with disagreement dropping the item
4. **Fall back if unsure:**
   - Fewer than 3 items survive → a worked-example stepper or claim cards (honest, non-numeric).
   - The topic can't be checked → say so.
5. **Cache** the round by topic. Showcase topics are hand-checked and labeled **"reviewed"**; generated ones are labeled **"auto-checked"**.

**Truth widgets** (the model only picks one and fills its parameters; it never writes code):

| Widget | For | Truth computed by |
|---|---|---|
| **Distribution** | chance, statistics, streaks, sampling | a seeded simulation running N trials in the browser |
| **Curve** | functions, rates, growth, calculus | mathjs evaluating an expression |
| **Trajectory** | motion, physics | analytic formulas (tested) |
| **Estimate** | "how big / how many" facts | a sourced number with a link |
| **Order** | sequences, rankings, causes | a sourced order |
| *Fallback:* Stepper / Claim cards | anything not checkable | text with sources |

**Build order:** Distribution + Curve first, then Trajectory, then Estimate/Order (reveal-patterns.md).

**Reading your answer:**
- Choices and bands are a lookup to a misconception id.
- An optional typed "why" is classified only against that item's short list + "other" (accurate on short lists, poor on long ones; misconceptions.md).
- "Right answer, wrong reason" triggers a follow-up item, not a verdict.

## 7. What Gemini does (MLH Best Use of Gemini)
**Free tier, verified** (AI Studio rate-limit page, our project, Fri Oct 16 10:15 PM):

| Model | RPM | TPM | Requests/day |
|---|---|---|---|
| Pro (2.5, 3.1) | 0 | | 0, **not available** |
| Flash (3.8 / 3.7 / 3.6 / 3 / 2.5) | 5 | 250K | **20** |
| **Flash Lite (3.5 / 3.1)** | **15** | 250K | **500** |
| **Gemma 4 31B / 26B** | 30 | **16K** | 14.4K |
| Embeddings | 100 | | 1K |

A consumer Gemini Pro subscription doesn't change API limits.

**Plan (free tier by default; billing is my call, prices in docs/research/gemini.md):**
- **`gemini-3.5-flash-lite` (minimal thinking) does all live generation**, with `gemini-3.1-flash-lite` → Gemma 26B as the overflow chain (docs/research/gemini.md). One call returns a topic's *full package* (misconceptions, 3-5 items, widget spec, card text, cast origin story), stored forever by normalized topic.
- **`gemma-4-31b-it` blind-checks the items** (separate quota, 14.4K/day). One worker under its 16K TPM cap fits ~5 checks a minute.
- **Gemma is also the fallback generator** if Flash Lite returns 429.
- **Showcase rounds are hand-made JSON on disk**, with no API call. ~30 safety-net topics are pre-generated once and cached.
- **Typed-"why" classification is off by default** (it would cost a call per answer); choices and bands are a lookup.

**Flash Lite request budget** (≤500/day; the day resets at midnight Pacific = **3 AM ET**):

| Use | Calls | When |
|---|---|---|
| Dev/testing | ~10/h × ~16h ≈ 160 | Sat (quota day Sat 3 AM → Sun 3 AM) |
| Pre-generate 30 safety topics | 30 | Sat |
| User tests (2 rounds × 5 users, 1 new topic each) | 10 | Sat |
| **Sat total** | **≈200 / 500** | |
| Final checks + video | ~30 | Sun before 7:30 AM (new quota day from 3 AM) |
| Expo: judges' live topics (~15-25, many hit the cache) | ≤25 | Sun 10-12 |
| **Sun total** | **≈55 / 500** | |

Every live call is logged with a counter on the dev drawer. **At 480/day it switches to the next model; daily 429s are never retried.** Before judging, after the 3 AM reset: pre-warm 15-25 likely judge topics, and keep ≥400 calls for the demo. `DEMO_OFFLINE=1` serves only cache + showcase if the venue wifi dies.

**Gemini's jobs:**
- **Generates every round** with structured JSON output.
- **Gemma blind-checks** each round.
- **Writes** the misconception card text and the cast origin stories, inside the same package.
- **It never produces the truth numbers**; code computes them.

## 8. Showcase topics (hand-checked, cached, offline)
From demo.md; the numbers were rechecked by me.

1. **The coin streak.** "In 100 fair flips, what's the longest run of one side?"
   - Most people say 3-4. Our rerun of 200k simulations: mean longest run **6.98**, ≥5 in **97.2%** of runs.
   - **Misconception:** "random means evenly mixed".
   - **Widget:** Distribution.
2. **The positive test (base rates).** 1% base rate, 90% sensitivity, 9% false positives → **9.2%** chance you have it (0.009 / (0.009 + 0.0891), our arithmetic).
   - On a similar mammography case (correct answer 7.7%), doctors' most frequent estimate was **90%**. The source reports 90% for an earlier German doctors' study and says the 160 gynecologists tested in 2007 gave "the same exact result" ([APS Observer](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care)).
   - **Widget:** Distribution (1,000 dots sorting).
3. **One for engineers: Off the Edge** (a marble's path off a desk, Trajectory) **or** a derivative-vs-function item (Curve). Use whichever is solid first.

**Also:** ~30-40 cached generated topics as a safety net for live requests (demo.md fallback ladder).

## 9. Demo (3:00, full script in docs/research/demo.md)
| Time | What happens |
|---|---|
| 0:00 | The judge names a topic, and it builds in the background. |
| 0:08 | Coin streak: they predict, lock, the 100 tiles stream in, the longest run lights up, the misconception card appears. |
| 0:50 | The positive test, in the same "intuitions about chance" family. |
| 1:20 | Their collection. |
| 1:40 | **Their topic, live:** one round. |
| 2:15 | "How it works" drawer: the model writes the question, code computes the truth. |
| 2:40 | Close. |

**90-second version:** topic → coin streak → card → their topic.

## 10. Add-on prizes (prizes-mm.md)
- **Core:** Gemini (the engine), Easy On The Eyes, the GoDaddy domain plus a QR code on the table.
- **Vultr:** hosting, if its code needs no card; otherwise Render.
- **Tiger Data:** every answer is an event, which feeds "the room" percentages and the streak/review queue (continuous aggregates). If signup needs a card, it's a stretch.
- **Auth0:** sign in to keep your streak (cut line 2).
- **Out:** DeepSpace, Roblox, Solana, Nessie, Least Vibe Coded.
- **After the event:** the DEV post.

## 11. Look (visual.md; needs my sign-off)
- **"Notebook Arcade":** paper + ink = truth, pencil = your guess, marker = the gap, green = called it. A chunky display face, a verdict stamp, a springy lock-in.
- **Fonts:** Atkinson Hyperlegible Next for the body, Shantell Sans for hand labels.
- **Contrast:** the ghost gets a solid `#85827a` (3.6:1).
- **Sound:** optional, with a visual twin for every sound; the hall is loud.

## 12. Name (open, issue #29)
"Mental Models" is the working name. Recommendation in docs/story.md: **Hunch & Ink** (pencil hunch, ink truth), with "your Wrongdex" for the collection and the tagline "Guess in pencil. Truth in ink." **The name is @luanamaldaner's call**; the code uses the neutral working name `mm` until then.

## 13. Open questions for me
1. The visual direction: Notebook Arcade, OK?
2. Showcase #3: physics (Off the Edge) or calculus (derivative)?
3. Do we show the "reviewed / auto-checked" label in the UI? *(I recommend yes; it's our accuracy story.)*
4. The default audience level for generated rounds (intro college?).
