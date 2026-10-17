# What makes study apps addictive, and which parts build understanding (#22)

For the Mental Models loop: predict first → see the truth → misconception named → come back. Context I'm not redoing: the predict-first lane and the winner teardowns are in [deep-mental-models.md](../deep-mental-models.md), and the AI-era judging notes are in [ai-era.md](../ai-era.md).

## TL;DR
- The hook mechanics (streaks, XP, leagues) drive **coming back**. They don't drive **understanding**. Every app below separates the two, and the learning comes from the retrieval/feedback core, not the badges.
- The strongest evidence for our core: **predicting before a demo beats watching it** ([Crouch et al. 2004](https://www.compadre.org/IntroPhys/items/detail.cfm?ID=2329)), and **confident errors get corrected best** ([hypercorrection](https://dukespace.lib.duke.edu/items/d6ab09ca-f55c-4efb-9d32-2788bc5838b2)). Surprise is the learning signal, so we make surprise the game.
- Gamification helps on average, but the effect is small and fragile: g = 0.49 on cognitive outcomes, k = 19 ([Sailer & Homner 2020](https://link.springer.com/article/10.1007/s10648-019-09498-w)), and the motivation/behavior effects are less stable.
- Streaks work through loss aversion, and a broken streak makes people quit ([Silverman & Barasch, JCR 2023](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions)). If we build a streak, it needs a repair path.

## 1. App by app: the hook vs. what actually teaches

| App | Hook mechanics | Learning core | Helps understanding? |
|---|---|---|---|
| Duolingo | streak, streak freeze, XP, weekly leagues, hearts, chests, push notifications | short retrieval drills + spaced review | Retention yes. Depth weak: drills translation, not models |
| Quizlet | set creation, Learn/Test modes, Match timer, Plus paywall | flashcards. Learn mode re-shows the terms you miss ([2026 review](https://atomisystems.com/elearning/quizlet-review-2026-pros-cons-and-comparison)) | Memorization by design |
| Anki | none really; the daily review queue *is* the hook (due count) | spaced repetition, SM-2 or FSRS ([Anki FAQ](https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm)) | Best-in-class retention, zero conceptual feedback |
| Kahoot | live competition, timer, podium, music | quick in-class retrieval | Mixed. 93-study review: often positive, sometimes no effect; students cite time pressure and fear of losing ([Wang & Tahir 2020](https://research.gold.ac.uk/id/eprint/39435)) |
| Blooket | game modes, random rewards ("Blooks"), steal-points | the same MCQ retrieval as Kahoot | No peer-reviewed evidence found [unverified] |
| Brilliant | streaks, XP, leagues, short interactive lessons | **pretest first**, interactive manipulation, says it targets "exactly where a learner's misconception lies" ([about](https://brilliant.org/about/)) | Closest to us. Hand-authored courses only |

### Duolingo numbers (the hook works)
- Q2 2026: 58.7M DAU (+23% YoY), retention at a record 84%. A June "Streak Revival" campaign (restore your longest streak by doing 3 lessons) pulled in 15.4M learners, ~8M of them without an active streak ([8-K](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm), [summary](https://pulse2.com/duolingo-daily-active-users-reach-58-7-million-as-retention-hits-record-84-and-social-accounts-top-1-billion-organic-impressions/)).
- Company blog: users with a 7-day streak are 3.6x more likely to finish a course (correlational). Equipping 2 freezes gave +0.38% DAU, and a milestone animation gave +1.7% day-7 retention ([Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). These are self-reported, with no methods given.
- Takeaway: the streak is a retention lever measured in DAU, not in learning.

## 2. The learning science: what actually builds understanding

| Mechanism | Evidence | Why it matters for us |
|---|---|---|
| Prediction before observation | Passive demo watchers understood no better than students who never saw the demo. Predict-first students did significantly better ([Crouch, Fagen, Callan, Mazur 2004](https://www.compadre.org/IntroPhys/items/detail.cfm?ID=2329)) | **Our whole thesis.** The commit-before-reveal step is the active ingredient |
| Prediction as a learning strategy | Prediction works through prediction error and surprise/curiosity ([Brod 2021 review](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8642250/)). Generating a prediction helps most when the outcome is surprising (Brod, Hasselhorn & Bunge 2018, cited in that review) | Pick items where the intuitive answer is wrong |
| Hypercorrection | High-confidence errors are corrected *more* after feedback. Replicated many times, likely via attention/arousal at the mismatch ([Duke review](https://dukespace.lib.duke.edu/items/d6ab09ca-f55c-4efb-9d32-2788bc5838b2), [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3604148)) | Ask for confidence. "Sure and wrong" is the best teachable moment |
| Retrieval practice | Practice tests beat restudy. Meta-analytic effects are around d/g 0.50-0.61, with bigger effects when feedback is given ([Adesope et al. 2017](https://journals.sagepub.com/doi/10.3102/0034654316689306)) | Re-test the same misconception later, with feedback |
| Generation effect | Producing an answer beats reading it ([Bertsch et al. 2007 meta](https://doi.org/10.3758/BF03193441), d ≈ 0.40 [unverified exact value]) | Typed/drawn predictions > multiple choice when feasible |
| Productive failure | Problem solving before instruction beats instruction-first on conceptual knowledge. 53 studies, 166 comparisons, mostly STEM ([Sinha & Kapur 2021, RER](https://doi.org/10.3102/00346543211019105)) | Failing first and then being shown is the designed path, not a bug |
| Desirable difficulties | Spacing, interleaving and testing slow down practice performance but improve long-term learning. Practice performance ≠ learning ([Soderstrom & Bjork 2015](https://doi.org/10.1177/1745691615569000)) | Don't optimize for % correct in-session |
| Unguarded AI hurts | GPT Base raised practice scores 48% but cut exam scores 17% vs control. A guarded tutor version came out neutral ([Bastani et al., PNAS 2025](https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html)) | Never show the answer before the learner commits |

## 3. Which hook mechanics help depth, and which only game the metric

| Mechanic | Helps deep understanding? | Evidence / risk |
|---|---|---|
| Spaced repetition | Helps durable retention. Depth only if the item is conceptual | Strong for memory (Anki/FSRS). It reschedules facts, not models |
| Immediate, specific feedback | **Yes**, it is where learning happens | It drives the testing-effect gains (Adesope) |
| Short sessions | Neutral to positive (lowers start friction, allows spacing) | Fine if each session has a real prediction in it |
| Streaks | Retention only, plus a quit cliff | Breaks cause dropout even when the break is external. Repair softens it ([Silverman & Barasch](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions)) |
| XP / leagues | Mostly metric-gaming | Users farm XP on easy lessons ([qualitative case study](https://arxiv.org/pdf/2203.16175)). Leaderboard anxiety is reported. No causal learning evidence found |
| Variable rewards (chests, random Blooks) | No | Slot-machine loop. Expected tangible rewards undermine intrinsic motivation ([Deci, Koestner & Ryan 1999](https://doi.org/10.1037/0033-2909.125.6.627)) |
| Speed competition (Kahoot timer) | Mixed: rewards fast recall, punishes thinking | Time pressure and fear of losing are top complaints (Wang & Tahir) |
| Loss aversion (hearts, lives) | Negative for exploration | It punishes the wrong predictions we *want* people to make |

### Known downsides, from credible sources
- Gamification meta-analyses: positive but small. Sailer & Homner found cognitive g = 0.49 (stable in rigorous studies), motivational g = 0.36 and behavioral g = 0.25 (less stable) ([link](https://link.springer.com/article/10.1007/s10648-019-09498-w)). Huang et al. 2020 found g = 0.46. A 2026 meta reports d = 1.12 but with I² ≈ 99%, which I don't trust ([SAGE](https://journals.sagepub.com/doi/10.1177/21582440261421375)).
- Streak criticism: people protect the streak instead of doing the activity, and "streak creep" adds pressure and notification fatigue ([Decision Lab](https://thedecisionlab.com/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)). There are lots of user complaints about guilt-trip notifications and paid freezes (anecdotal).
- The big one for us: no evidence I found shows XP or leagues improve proficiency. They move DAU.

## 4. Design rule I'm taking from this
**Reward being wrong in an interesting way, not being right fast.** Everything that pays out should key off the prediction → surprise → correction step (the evidence-backed part). Nothing should pay out for volume or speed (the metric-gaming part).

## What we steal (ranked for our loop, each buildable in ~24h)

| # | Mechanic | How it ties to predict-first | Build cost |
|---|---|---|---|
| 1 | **Confidence slider on every prediction** | 1 tap before reveal. It powers hypercorrection and every mechanic below | ~1h |
| 2 | **Surprise meter** | After the reveal, a gauge shows the gap between prediction and truth × confidence. "You were 90% sure and off by 3x." This is the dopamine hit, and it's the learning signal | ~2-3h (needs a numeric/visual distance per item) |
| 3 | **Misconception collection ("field guide")** | Each named misconception becomes a card in your collection, with *busted* status once you predict right on a transfer item. Collecting the wrong ideas is the Pokédex | ~3-4h |
| 4 | **Prediction streak (in-session) + daily streak with repair** | The in-session streak counts *calibrated* predictions (right, or wrong and honest about it). The daily streak gets a one-tap repair: "fix it by busting 1 misconception" | ~2h |
| 5 | **Comeback queue (spaced re-test of misconceptions)** | Busted misconceptions return in 1/3/7 days on a *new* item that discriminates the same idea. Spaced retrieval targeted at the misconception, not the fact | ~2h with a simple fixed schedule (no FSRS) |
| 6 | **"Most people guess…" reveal** | Show the share of others who made the same wrong prediction (seeded with event data, see deep-mental-models §2). Social proof without a leaderboard, and it makes being wrong feel normal | ~1-2h |
| 7 | **2-minute sessions: 3 predictions and done** | A short loop with a clean exit card ("2 busted, 1 still alive"). Duolingo-length sessions, Brilliant-style content | ~1h |
| 8 | **Shareable surprise card** | "I thought X. It's Y." Image to share, viral loop. Optional, after 1-7 | ~2h |

**Avoid:**
- **XP leagues / leaderboards on correctness or speed.** These reward farming easy items and discourage honest wrong predictions. Not evidence-backed for learning.
- **Hearts/lives that punish wrong answers.** Being wrong is the product. Loss aversion here kills the prediction.
- **Random loot (chests, random avatars).** Variable-ratio rewards unrelated to learning. Cheap to build, but it cheapens the pitch for judges.
