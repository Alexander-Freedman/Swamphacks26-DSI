# Learning science for prediction-first learning (#18)

Every claim links to its paper. Citations and numbers were checked against PubMed/Crossref/PMC/publisher pages on Oct 16; anything not confirmed is marked **unverified** with its number removed.

# Mental Models: the learning science behind the loop

Loop: **predict -> commit confidence -> see truth interactively -> misconception named + refuted -> explain -> come back later (spaced, interleaved)**.

How sure we are about the numbers: every effect size below was checked against the paper's abstract or full text (PubMed, publisher page, PMC, or an author PDF), or, where noted, a secondary source that quotes it. Each claim has a link. Anything we couldn't confirm is marked **unverified** and has no number. Lab effects still shrink in classrooms, so read these as "about this big".

Effect-size scale (Cohen): d/g 0.2 small, 0.5 medium, 0.8 large.

---

## 1. Generation effect
- **Primary sources:** Slamecka & Graf ([1978, *JEP:HLM* 4(6)](https://doi.org/10.1037/0278-7393.4.6.592)); Bertsch, Pesta, Wiscott & McDaniel ([2007, *Memory & Cognition* 35(2)](https://pubmed.ncbi.nlm.nih.gov/17645161/)), a meta-analysis of 445 effect sizes from 86 studies.
- **Finding:** people remember information they produce themselves better than information they just read ([Bertsch et al. 2007](https://pubmed.ncbi.nlm.nih.gov/17645161/)).
- **Effect size:** d = 0.40 overall, "almost half a standard deviation", with large variability across moderators ([Bertsch et al. 2007 abstract](https://pubmed.ncbi.nlm.nih.gov/17645161/)). Whether it is larger on delayed tests or for cued recall than recognition: **unverified** (not in the abstract; we couldn't get the full text).
- **Boundaries:** it mostly helps the specific generated item, and the learner has to be able to generate it, so trivially easy or impossible prompts give little. Most of the evidence uses word lists and word pairs, so it doesn't speak directly to concepts ([Bertsch et al. 2007](https://pubmed.ncbi.nlm.nih.gov/17645161/); the item-specificity and difficulty points are **unverified** against the full text).
- **Design rule:** **the learner always produces something before seeing the answer** (a prediction, a sketch, a number, a choice plus a one-line "because"). Never open with exposition.

## 2. Pretesting / errorful generation / prequestions
- **Primary sources:**
  - Kornell, Hays & Bjork ([2009, *JEP:LMC* 35(4)](https://doi.org/10.1037/a0015729)): unsuccessful retrieval attempts helped later learning. They used fictional trivia questions and weak-associate guesses, and dropped the rare correct guesses from the analysis.
  - Richland, Kornell & Kao ([2009, *JEP:Applied* 15(3)](https://doi.org/10.1037/a0016496)): pretest questions on an essay improved posttest performance over extra study time, even when the analysis used only items learners got wrong on the pretest.
  - Pan & Carpenter ([2023, *Educational Psychology Review*](https://doi.org/10.1007/s10648-023-09814-5)), a review of prequestioning and pretesting: benefits show up "if there is an opportunity to study the correct answers afterwards", but how big they are depends on procedure and on how learning is measured.
  - St. Hilaire, Chan & Ahn ([2023 online / 2024, *Psychonomic Bulletin & Review* 31(2)](https://pubmed.ncbi.nlm.nih.gov/37640836/)), a preregistered meta-analysis of the prequestion effect: **g = 0.54 (k = 97) for prequestioned content** and **g = 0.04 (k = 91) for content that wasn't prequestioned**.
- **Finding:** guessing wrong before you're taught beats studying for the same time, as long as you get the answer afterwards ([Kornell et al. 2009](https://doi.org/10.1037/a0015729); [Richland et al. 2009](https://doi.org/10.1037/a0016496)).
- **Effect size:** at meta level the effect is medium for prequestioned items (g = 0.54) and about zero for anything else (g = 0.04) ([St. Hilaire et al.](https://pubmed.ncbi.nlm.nih.gov/37640836/)).
- **Boundaries:**
  - The correct answer or feedback must follow ([Pan & Carpenter 2023](https://doi.org/10.1007/s10648-023-09814-5)).
  - The benefit is specific to the item. Prequestions do not make people learn the whole lesson better ([St. Hilaire et al.](https://pubmed.ncbi.nlm.nih.gov/37640836/)).
  - The guess has to be semantically related to the answer, and random guessing gives little: **unverified** (it fits the weak-associate design in [Kornell et al. 2009](https://doi.org/10.1037/a0015729), but we didn't confirm a direct test).
  - Weaker effects on long-delay tests or with very hard pretests: **unverified**. [Pan & Carpenter](https://doi.org/10.1007/s10648-023-09814-5) only say the size varies with procedure and how learning is measured.
- **Design rule:** **make the prediction about the exact idea that is about to be revealed**, and always resolve it within the same screen or session. Don't ask throwaway warm-up questions on unrelated content.

## 3. Hypercorrection effect
- **Primary sources:**
  - Butterfield & Metcalfe ([2001, *JEP:LMC* 27(6)](https://doi.org/10.1037/0278-7393.27.6.1491)): errors made with high confidence were the most likely to be corrected on a retest after feedback.
  - Metcalfe ([2017, *Annual Review of Psychology* 68](https://doi.org/10.1146/annurev-psych-010416-044022), "Learning from errors"), which reviews the area. Errorful learning followed by corrective feedback helps, and feedback that includes analysis of the reasoning behind the mistake is crucial.
  - Butler, Fazio & Marsh ([2011, *Psychonomic Bulletin & Review* 18(6)](https://doi.org/10.3758/s13423-011-0173-y)): the effect persists at one week, but correction rates drop, and high-confidence errors were the most likely to come back ([abstract](https://profiles.wustl.edu/en/publications/the-hypercorrection-effect-persists-over-a-week-but-high-confiden/)).
- **Finding:** "I was sure and I was wrong" produces surprise and attention, so the correction sticks better ([Metcalfe 2017](https://doi.org/10.1146/annurev-psych-010416-044022)).
- **Effect size:** this is a probability-of-correction pattern, not a pooled d. Correction rises with original confidence ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)). It has been replicated with children ([Metcalfe & Finn 2012, *Learning and Instruction* 22(4)](https://doi.org/10.1016/j.learninstruc.2011.10.004)). The earlier note said "middle-schoolers": the grade range is **unverified**.
- **Boundaries:**
  - It depends on the person actually committing confidence.
  - Corrected high-confidence errors can resurface after a delay, so the item has to be revisited ([Butler et al. 2011](https://doi.org/10.3758/s13423-011-0173-y)).
  - The research mostly uses general-knowledge items. Evidence for deep conceptual misconceptions is thinner (our read of [Metcalfe 2017](https://doi.org/10.1146/annurev-psych-010416-044022), not a stated finding).
- **Design rule:** **ask for confidence before the reveal**, and when someone is confidently wrong, make the surprise moment explicit ("You were 90% sure"). **Schedule high-confidence errors for an early re-check** (a day or so later), because they are the ones most likely to come back.

## 4. Retrieval practice (testing effect) and transfer
- **Primary sources:**
  - Roediger & Karpicke ([2006, *Psychological Science* 17(3)](https://doi.org/10.1111/j.1467-9280.2006.01693.x)): testing beat restudy at 2 days and 1 week, even though restudy won at 5 minutes. Restudy also made students *more confident*.
  - Rowland ([2014, *Psychological Bulletin* 140(6)](https://doi.org/10.1037/a0037559)), meta-analysis: **g = 0.50, 95% CI [0.42, 0.58]** for testing versus restudy (random effects; [full text](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf)). Initial recall tests gave bigger benefits than recognition tests ([abstract](https://pubmed.ncbi.nlm.nih.gov/25150680/)).
  - Adesope, Trevisan & Sundararajan ([2017, *Review of Educational Research* 87(3)](https://doi.org/10.3102/0034654316689306)), meta-analysis of 272 effect sizes: **g = 0.51 versus restudy** and **0.93 versus filler or no activity** ([Wing Institute summary](https://www.winginstitute.org/news/effective-practice-tests/)). The overall pooled figure (we had ~0.61) is **unverified**. Multiple-choice and mixed formats gave larger effects than recall or short-answer formats ([TIE summary](https://www.tieonline.com/article/2232/the-benefits-of-practice-testing)).
  - Yang et al. ([2021, *Psychological Bulletin* 147(4)](https://doi.org/10.1037/bul0000309)), classroom meta-analysis of 222 studies and 48,478 students: **g = 0.499**.
  - Transfer: Pan & Rickard ([2018, *Psychological Bulletin* 144(7)](https://doi.org/10.1037/bul0000151)), meta-analysis of 192 effect sizes: **d = 0.40, 95% CI [0.31, 0.50]**. Transfer was *greatest* across test formats, **to application and inference questions**, and to medical-diagnosis problems. It was weakest to rearranged stimulus-response items, to untested material from the study phase, and to worked-example problems. Response congruency (the same response needed at practice and on the final test), elaborated retrieval practice and initial test performance all strongly shaped transfer. With publication bias corrected, there was often **no positive transfer** when none of those moderators were present.
- **Finding:** pulling the idea out of memory strengthens it more than re-reading it. Transfer to new problems happens, but it isn't automatic ([Rowland 2014](https://doi.org/10.1037/a0037559); [Pan & Rickard 2018](https://doi.org/10.1037/bul0000151)).
- **Boundaries:**
  - The benefit shows up on delayed tests, not immediate ones, and the immediate result can even reverse ([Roediger & Karpicke 2006](https://doi.org/10.1111/j.1467-9280.2006.01693.x)).
  - It needs a reasonable retrieval success rate or feedback. Initial test performance moderates transfer ([Pan & Rickard 2018](https://doi.org/10.1037/bul0000151)), and Rowland found no testing effect in lab studies without corrective feedback (as reported in [Frontiers 2018](https://www.frontiersin.org/articles/10.3389/fpsyg.2018.02412/full)).
  - For transfer, practice has to include *why* (elaboration) ([Pan & Rickard 2018](https://doi.org/10.1037/bul0000151)). The claim that varied surface forms help is **unverified** as a Pan & Rickard finding.
- **Design rule:** **the return visit is a retrieval test, not a re-read**. To get transfer, **re-test the same model in a new surface context** (different numbers, story or domain), and **ask "why" after the answer** (elaborative retrieval).

## 5. Refutation texts
- **Primary sources:**
  - Tippett ([2010, *International Journal of Science and Mathematics Education* 8(6)](https://doi.org/10.1007/s10763-010-9203-x)), "Refutation text in science education: a review of two decades of research": generally positive for conceptual change.
  - **Schroeder & Kucera ([2022, *Educational Psychology Review* 34(2), 957–987](https://pubmed.ncbi.nlm.nih.gov/35095236/)), "Refutation Text Facilitates Learning: a Meta-Analysis of Between-Subjects Experiments".** The paper exists and the citation was right. 44 comparisons (n = 3,869): **g = 0.41 versus other learning conditions**. The comparison against expository or scientific text specifically, which is the most common control (k = 30), is **g = 0.36**. Differences between comparison types were not significant. The authors could not test whether learners actually held the misconception, because few studies reported it ([full text, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8784251/)).
  - Guzzetti, Snyder, Glass & Gamas ([1993, *Reading Research Quarterly* 28(2)](https://doi.org/10.2307/747886)), an older comparative meta-analysis of conceptual-change interventions from reading and science education: refutation text was among the more effective approaches.
  - The process work by van den Broek & Kendeou ([2008, *Applied Cognitive Psychology* 22(3)](https://doi.org/10.1002/acp.1418)) explains why: refutation texts make the wrong and right conceptions active at the same time ("co-activation"), and that goes with noticing the conflict and revising.
- **Finding:** text that (1) states the misconception, (2) explicitly says it is wrong, and (3) gives the correct explanation changes misconceptions better than text that only teaches the right idea ([Schroeder & Kucera 2022](https://pubmed.ncbi.nlm.nih.gov/35095236/); [Tippett 2010](https://doi.org/10.1007/s10763-010-9203-x)).
- **Boundaries:**
  - Smaller effects when readers don't actually hold the misconception: **unverified**. Schroeder & Kucera could not test this ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8784251/)). Co-activation theory predicts it ([van den Broek & Kendeou 2008](https://doi.org/10.1002/acp.1418)).
  - The explanation has to be causal, not just "No, actually X": this is our design inference from [van den Broek & Kendeou 2008](https://doi.org/10.1002/acp.1418), not a measured moderator.
  - The "familiarity backfire" worry (repeating the myth strengthens it) has little support. [Ecker et al. 2020](https://doi.org/10.1186/s41235-020-00241-6) found "substantial evidence against familiarity backfire", even for novel myths after a week. [Swire-Thompson et al. 2020](https://doi.org/10.1016/j.jarmac.2020.06.006) concluded backfire effects "are not a robust empirical phenomenon". Keep the myth short anyway.
- **Design rule:** **refutation format, every time**:
  1. Name the wrong idea in the learner's own words ("You predicted the heavier ball lands first").
  2. Say why it's tempting (what everyday experience supports it).
  3. State plainly that it's wrong.
  4. Give the causal explanation of the right model.
  5. Show a case where the wrong model fails visibly.

## 6. Conceptual change (Posner; Vosniadou; Chi)
- **Primary sources:**
  - Posner, Strike, Hewson & Gertzog ([1982, *Science Education* 66(2)](https://doi.org/10.1002/sce.3730660207)): learners change concepts when they are dissatisfied with the current one and the new one is intelligible, plausible and fruitful.
  - Vosniadou & Brewer ([1992, *Cognitive Psychology* 24](https://doi.org/10.1016/0010-0285(92)90018-w)), the earth-shape study: children form "synthetic models" that blend new information into an old framework.
  - Vosniadou's framework-theory view ([Vosniadou 1994, *Learning and Instruction* 4(1)](https://doi.org/10.1016/0959-4752(94)90018-3)): misconceptions are coherent, so fixing one fact can produce a hybrid.
  - Chi ([2005, *Journal of the Learning Sciences* 14(2)](https://doi.org/10.1207/s15327809jls1402_1); [2008, "Three types of conceptual change", in Vosniadou (Ed.), *International Handbook of Research on Conceptual Change*](https://scholar.google.com/scholar?q=%22Three+types+of+conceptual+change%22+Chi+2008)): misconceptions about emergent processes (diffusion is her example) are robust because learners read them as direct, commonsense processes. Fixing them needs a shift across ontological categories, not a fact swap. (Heat and natural selection are our extensions of her examples.)
  - Shtulman & Valcarcel ([2012, *Cognition* 124(2)](https://pubmed.ncbi.nlm.nih.gov/22595144/)): naive theories are suppressed, not erased. Adults with years of science education were slower and less accurate on statements where intuition and science disagree, across 10 domains.
- **Effect size:** these are frameworks, not single effects. The evidence comes from interventions built on them (refutation, POE, bridging analogies).
- **Boundaries:** expect hybrids and relapse. One correction is not a cure ([Vosniadou & Brewer 1992](https://doi.org/10.1016/0010-0285(92)90018-w); [Shtulman & Valcarcel 2012](https://pubmed.ncbi.nlm.nih.gov/22595144/)).
- **Design rule:**
  - **Diagnose which model the person holds, not just right or wrong.** Each wrong answer choice maps to a specific named model.
  - **For process concepts, name the category error** ("You're treating heat like a substance that flows; it's a process of molecular motion").
  - Expect hybrid answers and **re-probe with a question the hybrid would also get wrong**.

## 7. Predict-Observe-Explain (POE)
- **Primary sources:**
  - White & Gunstone ([1992, *Probing Understanding*](https://scholar.google.com/scholar?q=White+Gunstone+1992+%22Probing+Understanding%22)): describes the POE method.
  - Crouch, Fagen, Callan & Mazur ([2004, *American Journal of Physics* 72(6)](https://doi.org/10.1119/1.1707018)), "Classroom demonstrations: learning tools or entertainment?": students who predicted the outcome before a demo understood it significantly better. Students who only watched understood it **no better than students who never saw the demo**.
  - Miller, Lasry, Chu & Mazur ([2013, *Physical Review ST-PER* 9, 020113](https://doi.org/10.1103/physrevstper.9.020113)), "Role of physics lecture demonstrations in conceptual learning": about **1 in 5 observations of a demo didn't match what actually happened**. Prior knowledge shaped what students saw and remembered. Students were **about 20% more likely to observe the demo correctly if they predicted first**, whether or not the prediction was right. Conceptual learning depended on observing correctly.
- **Finding:** a demo without a prediction is mostly entertainment. The prediction is what makes it teach ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)).
- **Boundaries:** the observation itself can be misperceived or misremembered through the misconception ([Miller et al. 2013](https://doi.org/10.1103/physrevstper.9.020113)), so explanation after the reveal matters.
- **Design rule:**
  - **Never show the simulation or answer before the prediction is locked.**
  - After the reveal, **show the learner's prediction next to the actual outcome** so they can't misremember it.
  - **Require a one-line "explain" step**: why did it happen?

## 8. Productive failure / problem solving before instruction
- **Primary sources:**
  - Kapur ([2008, *Cognition and Instruction* 26(3)](https://doi.org/10.1080/07370000802212669); [2014, *Cognitive Science* 38(5)](https://doi.org/10.1111/cogs.12107)). The 2014 study found procedural knowledge was similar under both orders, and problem-solving-first gave better conceptual understanding and transfer.
  - Sinha & Kapur ([2021, *Review of Educational Research* 91(5)](https://doi.org/10.3102/00346543211019105)), meta-analysis of 53 studies and 166 comparisons ([full text](https://janfasen.nl/wp-content/uploads/2023/05/Sinha-and-Kapur-PS-I.pdf)):
    - **g = 0.36, 95% CI [0.20, 0.51]** for problem solving before instruction (PS-I) over instruction first, **for conceptual knowledge and/or transfer**.
    - By outcome: conceptual knowledge **g = 0.33**, transfer **g = 0.40**, combined assessments **g = 0.31**. The subgroup differences were not significant.
    - **Procedural knowledge: g = -0.03, 95% CI [-0.20, 0.15]** (51 comparisons), so no difference.
    - With high fidelity to productive-failure design principles, **g = 0.37 to 0.58**.
    - After a publication-bias correction the estimate rose to g = 0.87. Treat that as an upper bound.
    - Second to fifth graders and domain-general skills went the other way: instruction first came out ahead.
  - Loibl, Roll & Rummel ([2017, *Educational Psychology Review* 29(4)](https://doi.org/10.1007/s10648-016-9379-x)): PS-I works when the instruction afterwards builds on the students' own failed solutions, and when contrasting cases are used.
- **Finding:** struggling first on a problem slightly beyond you, then being taught, helps conceptual understanding and transfer ([Sinha & Kapur 2021](https://doi.org/10.3102/00346543211019105)).
- **Boundaries:**
  - The benefit is for conceptual knowledge and transfer. There is no procedural advantage, but no procedural cost either ([Sinha & Kapur 2021](https://janfasen.nl/wp-content/uploads/2023/05/Sinha-and-Kapur-PS-I.pdf)).
  - The learner must have enough prior knowledge to attempt the problem, and young children did better with instruction first ([Sinha & Kapur 2021](https://doi.org/10.3102/00346543211019105)).
  - The instruction that follows must reference the learner's attempts. That is one of Sinha & Kapur's fidelity criteria ("instruction building on student solutions"), and see [Loibl et al. 2017](https://doi.org/10.1007/s10648-016-9379-x).
  - Scaffolding the struggle toward success adds nothing: **unverified**. A secondary summary quotes Sinha & Kapur at g = -0.08 for scaffolded PS-I, but we didn't find that figure in the RER paper's text.
  - The approach is debated. See Kirschner, Sweller & Clark ([2006, *Educational Psychologist* 41(2)](https://doi.org/10.1207/s15326985ep4102_1)) for the explicit-instruction side: guidance matters most for novices and "begins to recede only when learners have sufficiently high prior knowledge".
- **Design rule:**
  - **Let the learner be wrong without hints during the prediction.**
  - **The explanation must start from their attempt** ("Your answer would be right if X; here's what it misses").
  - **Use contrasting cases**: two near-identical setups with different outcomes.

## 9. Interleaving
- **Primary sources:**
  - Rohrer & Taylor ([2007, *Instructional Science* 35(6)](https://doi.org/10.1007/s11251-007-9015-8)).
  - **Fix:** the "72% vs 38%, d = 1.05" result is from Rohrer, Dedrick & Burgess ([2014, *Psychonomic Bulletin & Review* 21(5)](https://doi.org/10.3758/s13423-014-0588-3)), not the 2015 paper. That study had 140 seventh graders, nine weeks of practice and an unannounced test two weeks later ([PDF copy](https://www.gwern.net/doc/psychology/spaced-repetition/2014-rohrer.pdf)).
  - Rohrer, Dedrick & Stershic ([2015, *Journal of Educational Psychology* 107(3)](https://doi.org/10.1037/edu0000001)): 126 seventh graders over 3 months. Interleaved practice beat blocked practice at **1 day (d = 0.42)** and at **30 days (d = 0.79)**.
  - Rohrer, Dedrick, Hartwig & Cheung ([2020, *Journal of Educational Psychology* 112(1)](https://doi.org/10.1037/edu0000367)), a preregistered cluster RCT in 54 classes: **61% vs 38% one month later, d = 0.83**.
  - Brunmair & Richter ([2019, *Psychological Bulletin* 145(11)](https://pubmed.ncbi.nlm.nih.gov/31556629/)), meta-analysis of 59 studies and 238 effect sizes: **g = 0.42 overall**, **paintings g = 0.67**, **math g = 0.34**, and **words g = -0.39** (blocking won). Expository texts were nonsignificant. Interleaving works better when the categories are more similar to each other and when the material is more complex.
  - Kornell & Bjork ([2008, *Psychological Science* 19(6)](https://doi.org/10.1111/j.1467-9280.2008.02127.x)): learners rated massing as more effective than interleaving, even after their own test results showed the opposite.
- **Finding:** mixing problem types forces you to work out *which model applies*, and that is the skill being tested ([Rohrer et al. 2015](https://doi.org/10.1037/edu0000001)).
- **Boundaries:** it helps for discriminating similar concepts and can hurt for word lists ([Brunmair & Richter 2019](https://pubmed.ncbi.nlm.nih.gov/31556629/)). Learners will rate it as less effective ([Kornell & Bjork 2008](https://doi.org/10.1111/j.1467-9280.2008.02127.x)).
- **Design rule:** **the review queue mixes concepts that get confused with each other**, for example "is this a base-rate problem or a regression-to-the-mean problem?". Don't show five of the same type in a row.

## 10. Spacing
- **Primary sources:**
  - Cepeda, Pashler, Vul, Wixted & Rohrer ([2006, *Psychological Bulletin* 132(3)](https://doi.org/10.1037/0033-2909.132.3.354); [PDF](https://www.evullab.org/pdf/CepedaPashlerVulWixtedRohrer-PB-2006.pdf)), meta-analysis of 839 assessments from 317 experiments: spaced study beat massed study, and the best gap grows as the retention interval grows.
  - **Fix:** Cepeda, Vul, Rohrer, Wixted & Pashler ([2008, *Psychological Science* 19(11)](https://pubmed.ncbi.nlm.nih.gov/19076480/)), with more than 1,350 people. As a share of the test delay, the optimal gap went from **about 20-40% for a 1-week test to about 5-10% for a 1-year test**. It was not a flat "10-20%".
  - Donovan & Radosevich ([1999, *Journal of Applied Psychology* 84(5)](https://doi.org/10.1037/0021-9010.84.5.795)), meta-analysis of 63 studies: **mean weighted effect 0.46**, moderated by task type. Less rigorous studies showed bigger effects.
- **Finding:** reviewing over spread-out sessions beats cramming, often by a lot at long delays ([Cepeda et al. 2006](https://doi.org/10.1037/0033-2909.132.3.354)).
- **Boundaries:**
  - The gap depends on how long you want to remember ([Cepeda et al. 2008](https://pubmed.ncbi.nlm.nih.gov/19076480/)).
  - Most of the data is verbal recall ([Cepeda et al. 2006](https://doi.org/10.1037/0033-2909.132.3.354) is titled "...in verbal recall tasks"). Effects vary by task type ([Donovan & Radosevich 1999](https://doi.org/10.1037/0021-9010.84.5.795)).
- **Design rule:** **schedule returns with expanding gaps (roughly 1 day, then 3, 7 and 21)**. Wrong and high-confidence-wrong items come back sooner, and correct high-confidence items later. Using the 2008 ridgeline, a 1-day first gap suits remembering for about a week. For month-long retention, later gaps of about a week are in range.

## 11. Feedback: timing and elaboration
- **Primary sources:**
  - Shute ([2008, *Review of Educational Research* 78(1)](https://doi.org/10.3102/0034654307313795)), "Focus on formative feedback", a review. Formative feedback should be "nonevaluative, supportive, timely, and specific", and its effect interacts with learner and task characteristics. The review ends with guidelines:
    - Use elaborated feedback that explains why, beyond plain right/wrong.
    - Keep it specific and short enough to process.
    - Focus on the task, not the person.
    - Use praise sparingly and avoid normative comparison.
    - Give immediate feedback for hard tasks or novices; delayed feedback can help stronger learners.
    - The detailed guideline wording above is our paraphrase and **unverified** against the full text.
  - Wisniewski, Zierer & Hattie ([2020, *Frontiers in Psychology* 10:3087](https://doi.org/10.3389/fpsyg.2019.03087)), meta-analysis of 435 studies (k = 994, N > 61,000): **d = 0.48 overall**, highly heterogeneous. By information content: **reinforcement/punishment d = 0.24**, **corrective feedback d = 0.46**, **high-information feedback d = 0.99** ("feedback is more effective the more information it contains"). The earlier claim that task, process and self-regulation feedback beat praise *as a moderator in this paper* is **unverified**: the paper describes those levels but we didn't find moderator numbers for them.
  - Kluger & DeNisi ([1996, *Psychological Bulletin* 119(2)](https://doi.org/10.1037/0033-2909.119.2.254)), 607 effect sizes: **d = 0.41**, but **over a third** of feedback interventions *reduced* performance. Effectiveness dropped as feedback pulled attention toward the self and away from the task.
  - On timing:
    - [Butler, Karpicke & Roediger 2007](https://doi.org/10.1037/1076-898x.13.4.273) found delayed feedback better in the lab.
    - [Mullet et al. 2014](https://doi.org/10.1016/j.jarmac.2014.05.001) found the same in a college engineering course (better transfer), although students preferred immediate feedback.
    - [Kulik & Kulik 1988](https://doi.org/10.3102/00346543058001079) found immediate feedback usually better in applied classroom studies.
    - The evidence is mixed.
- **Design rule:**
  - **Feedback = what was wrong + why it's tempting + the right model + one example.** Never just a red X.
  - **No praise or comparison to other users as the main feedback**, and no "you're smart".
  - Give immediate feedback in the session, then use the spaced return as a delayed second exposure. That combination covers both sides of the timing debate.

## 12. Confidence-weighted answers / metacognition
- **Primary sources:**
  - Gardner-Medwin's confidence-based (certainty-based) marking in medical and science education rewards calibrated confidence and penalizes confident errors ([Gardner-Medwin 1995, *ALT-J* 3(1)](https://doi.org/10.3402/rlt.v3i1.9597)).
  - **Fix:** Sparck, Bjork & Bjork (2016) is in *Cognitive Research: Principles and Implications* 1:3 ([link](https://doi.org/10.1186/s41235-016-0003-x)), **not *Memory***. Across two experiments, confidence-weighted multiple-choice practice tests improved answers to **new but related questions** more than standard multiple choice did.
  - Dunlosky & Rawson ([2012, *Learning and Instruction* 22(4)](https://doi.org/10.1016/j.learninstruc.2011.08.003)), "Overconfidence produces underachievement": overconfident learners stop studying too early and retain less ([as summarized by Koriat 2012](https://newiipdm.haifa.ac.il/wp-content/uploads/2015/05/2012-Koriat-LI.pdf)).
  - Confidence is also the input that hypercorrection (section 3) depends on.
- **Boundaries:** collecting confidence costs a click. Scoring schemes that penalize confident errors can make anxious learners hedge (our judgment, **unverified**).
- **Design rule:**
  - **Collect 1-tap confidence on every prediction.**
  - **Show calibration over time** ("when you say 90%, you're right 60% of the time"). That makes overconfidence visible and gives a progress metric that isn't just a streak.

## 13. Desirable difficulties
- **Primary sources:** Bjork ([1994](https://doi.org/10.7551/mitpress/4561.003.0011)); Bjork & Bjork ([2011, "Making things hard on yourself, but in a good way"](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)). This is an umbrella term for spacing, interleaving, testing, generation and variation. They slow down acquisition and improve long-term retention and transfer.
- **Boundaries:**
  - A difficulty is "desirable" only if the learner can eventually respond successfully. Too hard turns into plain failure and dropout ([Bjork & Bjork 2011](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)).
  - Whether a difficulty helps depends on the learner and the material ([McDaniel & Butler 2011](https://doi.org/10.4324/9780203842539-14)).
  - **Fix:** de Bruin et al. ([2023, *Educational Psychology Review* 35](https://doi.org/10.1007/s10648-023-09766-w), the S2D2 framework) is about *perceived effort*. High effort and the feeling of learning little make learners disengage from desirable difficulties. It is not a cognitive-load finding that difficulties hurt low-prior-knowledge learners, so we no longer cite it for that.
- **Design rule:**
  - **Adapt the difficulty**: aim for prediction accuracy around 60-80%. That target is a common heuristic, not a hard law (**unverified**, no source).
  - **Offer a worked example or easier variant after two misses** on the same concept.

## 14. The "feels like learning" trap
- **Primary sources:**
  - Deslauriers, McCarty, Miller, Callaghan & Kestin ([2019, *PNAS* 116(39)](https://doi.org/10.1073/pnas.1821936116)): in intro physics, students randomly assigned to active learning learned more but *felt* they learned less than students in lectures by highly rated instructors. Students "take that effort to signify poorer learning."
  - Kornell & Bjork ([2008](https://doi.org/10.1111/j.1467-9280.2008.02127.x)): learners rated interleaving as less effective even after it won.
  - Bjork, Dunlosky & Kornell ([2013, *Annual Review of Psychology* 64](https://doi.org/10.1146/annurev-psych-113011-143823)): people's judgments of their own learning are swayed by current performance and fluency, so their mental model of how they learn is often wrong.
  - de Bruin et al. ([2023](https://doi.org/10.1007/s10648-023-09766-w)): perceived effort drives disengagement from effective strategies.
- **Finding:** the methods that work feel worse, so learners will rate the app lower in the moment and may churn ([Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116)).
- **Design rule:**
  - **Say this out loud in the product**: "Getting it wrong first is the point, and here's why."
  - **Prove progress with evidence, not feelings**: show "a week ago you predicted X at 90%, now you get the transfer version right".
  - **Don't optimize the loop purely for session satisfaction or time-in-app.**

## 15. A note on the "addictive" framing (gamification)
- **Primary source:** Sailer & Homner ([2020, *Educational Psychology Review* 32](https://doi.org/10.1007/s10648-019-09498-w)), meta-analysis. The authors call all three effects **small**:
  - **cognitive g = 0.49** (k = 19), which **held up** in the high-rigor subsplit
  - **motivational g = 0.36** (k = 16) and **behavioral g = 0.25** (k = 9), which were **less stable**
  - **Fix:** our earlier note had the stability backwards. Effects depend on the game elements: game fiction, social interaction, and competition combined with collaboration.
- **Boundaries:** streaks and points drive *return visits*. They don't drive *learning* by themselves (our design position; Sailer & Homner say what makes gamification work for cognitive outcomes is "still somewhat unresolved"). The return visit only matters because the spaced retrieval happens on it.
- **Design rule:** **hook on curiosity and the surprise of a wrong prediction**, and use the streak only to deliver the spaced review. The "addictive" part should be the "wait, really?" moment, not points.

---

## Top 8 design rules, ranked by strength of evidence

1. **Return visits are retrieval tests on a spaced, expanding schedule** (roughly 1 day, 3, 7, 21). Retrieval practice: g = 0.50 vs restudy ([Rowland 2014](https://doi.org/10.1037/a0037559)), g = 0.51 vs restudy ([Adesope 2017](https://doi.org/10.3102/0034654316689306)), and g = 0.50 in classrooms ([Yang 2021](https://doi.org/10.1037/bul0000309)). Spacing: [Cepeda 2006](https://doi.org/10.1037/0033-2909.132.3.354) covers 839 assessments. This is the best-established pair in the field.
2. **Learner commits a prediction before any reveal, with the correct answer always shown right after.** Generation effect, meta d = 0.40 ([Bertsch 2007](https://pubmed.ncbi.nlm.nih.gov/17645161/)). Prequestion effect, g = 0.54 for the prequestioned item ([St. Hilaire et al.](https://pubmed.ncbi.nlm.nih.gov/37640836/)). POE: passive viewing is no better than no demo ([Crouch 2004](https://doi.org/10.1119/1.1707018)).
3. **Feedback is elaborated, task-focused and causal**: wrong idea, why, right model, example. No praise or ranking as the main feedback.
   - [Wisniewski 2020](https://doi.org/10.3389/fpsyg.2019.03087): d = 0.48 overall, d = 0.99 for high-information feedback vs 0.24 for reinforcement/punishment.
   - [Shute 2008](https://doi.org/10.3102/0034654307313795).
   - [Kluger & DeNisi 1996](https://doi.org/10.1037/0033-2909.119.2.254): over a third of feedback interventions hurt, especially self-focused ones.
4. **Refutation structure for misconceptions**: name the learner's wrong idea, explain why it's tempting, say clearly it's wrong, then give the causal explanation. [Schroeder & Kucera 2022](https://pubmed.ncbi.nlm.nih.gov/35095236/) (g = 0.41 vs other conditions, 0.36 vs expository text), [Tippett 2010](https://doi.org/10.1007/s10763-010-9203-x), and co-activation ([van den Broek & Kendeou 2008](https://doi.org/10.1002/acp.1418)).
5. **Mix confusable concepts in review (interleaving).** [Brunmair & Richter 2019](https://pubmed.ncbi.nlm.nih.gov/31556629/) (g = 0.42, larger for similar categories, negative for word lists). In classrooms: d = 0.79 at 30 days ([Rohrer 2015](https://doi.org/10.1037/edu0000001)) and d = 0.83 in a 54-class RCT ([Rohrer 2020](https://doi.org/10.1037/edu0000367)).
6. **Collect confidence before the reveal, flag confident errors, and re-check them early.** Hypercorrection is robust ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491); [Metcalfe 2017](https://doi.org/10.1146/annurev-psych-010416-044022)), and [Butler et al. 2011](https://doi.org/10.3758/s13423-011-0173-y) show confident errors are the most likely to return. Ranked below 1-5 because most of the evidence uses factual items.
7. **Test transfer: re-probe the same model in a new surface form and ask "why".** [Pan & Rickard 2018](https://doi.org/10.1037/bul0000151): transfer d = 0.40. It depends on elaborated retrieval, response congruency and initial success, and disappears after bias correction when those are missing.
8. **Let them struggle first, build the explanation on their attempt, and use contrasting cases**, with fallback scaffolding after repeated misses. [Sinha & Kapur 2021](https://doi.org/10.3102/00346543211019105) (g = 0.36 for conceptual knowledge/transfer, -0.03 for procedural) and [Loibl et al. 2017](https://doi.org/10.1007/s10648-016-9379-x). Ranked last because the effect is moderate, it is contested by explicit-instruction researchers ([Kirschner et al. 2006](https://doi.org/10.1207/s15326985ep4102_1)), and it is sensitive to fidelity, age and prior knowledge.

Product-honesty rule (not ranked, but needed): **tell users it will feel harder, and show evidence of progress** (calibration, transfer wins). Sources: [Deslauriers 2019](https://doi.org/10.1073/pnas.1821936116); [de Bruin 2023](https://doi.org/10.1007/s10648-023-09766-w).

## Three claims we must NOT make

1. **"Proven to make you learn X times faster" or "scientifically proven app".** The effects come from studies of the *techniques*, not of our app. They are medium-sized (d about 0.4-0.5; see [Rowland 2014](https://doi.org/10.1037/a0037559) and [Pan & Rickard 2018](https://doi.org/10.1037/bul0000151)) and measured at delays. Say instead: "built on retrieval practice, spacing and refutation, some of the best-replicated findings in learning science".
2. **"It diagnoses and permanently fixes your misconceptions."**
   - Naive theories are suppressed, not erased ([Shtulman & Valcarcel 2012](https://pubmed.ncbi.nlm.nih.gov/22595144/)).
   - Corrected confident errors can come back ([Butler et al. 2011](https://doi.org/10.3758/s13423-011-0173-y)).
   - Generated misconception labels can be wrong.
   Say instead: "it names the most likely wrong model behind your answer and keeps checking it".
3. **"Addictive learning: the more you play, the more you learn" (or "it feels effortless").** Gamification effects are small and depend on the design ([Sailer & Homner 2020](https://doi.org/10.1007/s10648-019-09498-w)). Effective learning feels *harder* ([Deslauriers 2019](https://doi.org/10.1073/pnas.1821936116); [Bjork & Bjork 2011](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)). Also avoid learning-styles or "for your brain type" language: there is no credible evidence for matching instruction to learning styles ([Pashler, McDaniel, Rohrer & Bjork 2008](https://doi.org/10.1111/j.1539-6053.2009.01038.x)).

## Key citations (for the pitch or write-up)
- Adesope, Trevisan & Sundararajan (2017). *Review of Educational Research*, 87(3), 659–701. [doi:10.3102/0034654316689306](https://doi.org/10.3102/0034654316689306)
- Bertsch, Pesta, Wiscott & McDaniel (2007). *Memory & Cognition*, 35(2), 201–210. [doi:10.3758/BF03193441](https://doi.org/10.3758/bf03193441)
- Bjork (1994). In Metcalfe & Shimamura (Eds.), *Metacognition*. [doi:10.7551/mitpress/4561.003.0011](https://doi.org/10.7551/mitpress/4561.003.0011)
- Bjork & Bjork (2011). "Making things hard on yourself, but in a good way." [author PDF](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)
- Bjork, Dunlosky & Kornell (2013). *Annual Review of Psychology*, 64, 417–444. [doi](https://doi.org/10.1146/annurev-psych-113011-143823)
- Brunmair & Richter (2019). *Psychological Bulletin*, 145(11), 1029–1052. [doi:10.1037/bul0000209](https://doi.org/10.1037/bul0000209)
- Butler, Fazio & Marsh (2011). *Psychonomic Bulletin & Review*, 18(6), 1238–1244. [doi](https://doi.org/10.3758/s13423-011-0173-y)
- Butler, Karpicke & Roediger (2007). *JEP: Applied*, 13(4), 273–281. [doi](https://doi.org/10.1037/1076-898x.13.4.273)
- Butterfield & Metcalfe (2001). *JEP:LMC*, 27(6), 1491–1494. [doi](https://doi.org/10.1037/0278-7393.27.6.1491)
- Cepeda, Pashler, Vul, Wixted & Rohrer (2006). *Psychological Bulletin*, 132(3), 354–380. [doi](https://doi.org/10.1037/0033-2909.132.3.354)
- Cepeda, Vul, Rohrer, Wixted & Pashler (2008). *Psychological Science*, 19(11), 1095–1102. [doi](https://doi.org/10.1111/j.1467-9280.2008.02209.x)
- Chi (2005). *Journal of the Learning Sciences*, 14(2), 161–199. [doi](https://doi.org/10.1207/s15327809jls1402_1)
- Chi (2008). "Three types of conceptual change." In Vosniadou (Ed.), *International Handbook of Research on Conceptual Change*. [Google Scholar](https://scholar.google.com/scholar?q=%22Three+types+of+conceptual+change%22+Chi+2008)
- Crouch, Fagen, Callan & Mazur (2004). *American Journal of Physics*, 72(6), 835–838. [doi](https://doi.org/10.1119/1.1707018)
- de Bruin et al. (2023). *Educational Psychology Review*, 35. [doi](https://doi.org/10.1007/s10648-023-09766-w)
- Deslauriers, McCarty, Miller, Callaghan & Kestin (2019). *PNAS*, 116(39), 19251–19257. [doi](https://doi.org/10.1073/pnas.1821936116)
- Donovan & Radosevich (1999). *Journal of Applied Psychology*, 84(5), 795–805. [doi](https://doi.org/10.1037/0021-9010.84.5.795)
- Dunlosky & Rawson (2012). *Learning and Instruction*, 22(4), 271–280. [doi](https://doi.org/10.1016/j.learninstruc.2011.08.003)
- Ecker, Lewandowsky & Chadwick (2020). *Cognitive Research: Principles and Implications*, 5, 41. [doi](https://doi.org/10.1186/s41235-020-00241-6)
- Gardner-Medwin (1995). *ALT-J*, 3(1). [doi](https://doi.org/10.3402/rlt.v3i1.9597)
- Guzzetti, Snyder, Glass & Gamas (1993). *Reading Research Quarterly*, 28(2), 116–159. [doi](https://doi.org/10.2307/747886)
- Kapur (2008). *Cognition and Instruction*, 26(3), 379–424. [doi](https://doi.org/10.1080/07370000802212669)
- Kapur (2014). *Cognitive Science*, 38(5), 1008–1022. [doi](https://doi.org/10.1111/cogs.12107)
- Kirschner, Sweller & Clark (2006). *Educational Psychologist*, 41(2), 75–86. [doi](https://doi.org/10.1207/s15326985ep4102_1)
- Kluger & DeNisi (1996). *Psychological Bulletin*, 119(2), 254–284. [doi](https://doi.org/10.1037/0033-2909.119.2.254)
- Kornell & Bjork (2008). *Psychological Science*, 19(6), 585–592. [doi](https://doi.org/10.1111/j.1467-9280.2008.02127.x)
- Kornell, Hays & Bjork (2009). *JEP:LMC*, 35(4), 989–998. [doi](https://doi.org/10.1037/a0015729)
- Kulik & Kulik (1988). *Review of Educational Research*, 58(1), 79–97. [doi](https://doi.org/10.3102/00346543058001079)
- Loibl, Roll & Rummel (2017). *Educational Psychology Review*, 29(4), 693–715. [doi](https://doi.org/10.1007/s10648-016-9379-x)
- McDaniel & Butler (2011). In Benjamin (Ed.), *Successful Remembering and Successful Forgetting*. [doi](https://doi.org/10.4324/9780203842539-14)
- Metcalfe (2017). *Annual Review of Psychology*, 68, 465–489. [doi](https://doi.org/10.1146/annurev-psych-010416-044022)
- Metcalfe & Finn (2012). *Learning and Instruction*, 22(4), 253–261. [doi](https://doi.org/10.1016/j.learninstruc.2011.10.004)
- Miller, Lasry, Chu & Mazur (2013). "Role of physics lecture demonstrations in conceptual learning." *Physical Review ST-PER*, 9, 020113. [doi](https://doi.org/10.1103/physrevstper.9.020113)
- Mullet, Butler, Verdin, von Borries & Marsh (2014). *Journal of Applied Research in Memory and Cognition*, 3(3), 222–229. [doi](https://doi.org/10.1016/j.jarmac.2014.05.001)
- Pan & Carpenter (2023). "Prequestioning and pretesting effects: a review...", *Educational Psychology Review*. [doi:10.1007/s10648-023-09814-5](https://doi.org/10.1007/s10648-023-09814-5)
- Pan & Rickard (2018). *Psychological Bulletin*, 144(7), 710–756. [doi:10.1037/bul0000151](https://doi.org/10.1037/bul0000151)
- Pashler, McDaniel, Rohrer & Bjork (2008). *Psychological Science in the Public Interest*, 9(3), 105–119. [doi](https://doi.org/10.1111/j.1539-6053.2009.01038.x)
- Posner, Strike, Hewson & Gertzog (1982). *Science Education*, 66(2), 211–227. [doi](https://doi.org/10.1002/sce.3730660207)
- Richland, Kornell & Kao (2009). *JEP: Applied*, 15(3), 243–257. [doi](https://doi.org/10.1037/a0016496)
- Roediger & Karpicke (2006). *Psychological Science*, 17(3), 249–255. [doi](https://doi.org/10.1111/j.1467-9280.2006.01693.x)
- Rohrer, Dedrick & Burgess (2014). *Psychonomic Bulletin & Review*, 21(5), 1323–1330. [doi](https://doi.org/10.3758/s13423-014-0588-3)
- Rohrer, Dedrick & Stershic (2015). *Journal of Educational Psychology*, 107(3), 900–908. [doi](https://doi.org/10.1037/edu0000001)
- Rohrer, Dedrick, Hartwig & Cheung (2020). *Journal of Educational Psychology*, 112(1), 40–52. [doi](https://doi.org/10.1037/edu0000367)
- Rohrer & Taylor (2007). *Instructional Science*, 35(6), 481–498. [doi](https://doi.org/10.1007/s11251-007-9015-8)
- Rowland (2014). *Psychological Bulletin*, 140(6), 1432–1463. [doi:10.1037/a0037559](https://doi.org/10.1037/a0037559)
- Sailer & Homner (2020). *Educational Psychology Review*, 32, 77–112. [doi](https://doi.org/10.1007/s10648-019-09498-w)
- Schroeder & Kucera (2022). "Refutation Text Facilitates Learning: a Meta-Analysis of Between-Subjects Experiments." *Educational Psychology Review*, 34(2), 957–987. [doi:10.1007/s10648-021-09656-z](https://doi.org/10.1007/s10648-021-09656-z)
- Shtulman & Valcarcel (2012). *Cognition*, 124(2), 209–215. [doi](https://doi.org/10.1016/j.cognition.2012.04.005)
- Shute (2008). *Review of Educational Research*, 78(1), 153–189. [doi](https://doi.org/10.3102/0034654307313795)
- Sinha & Kapur (2021). *Review of Educational Research*, 91(5), 761–798. [doi:10.3102/00346543211019105](https://doi.org/10.3102/00346543211019105)
- Slamecka & Graf (1978). *JEP:HLM*, 4(6), 592–604. [doi](https://doi.org/10.1037/0278-7393.4.6.592)
- Sparck, Bjork & Bjork (2016). *Cognitive Research: Principles and Implications*, 1, 3. [doi](https://doi.org/10.1186/s41235-016-0003-x)
- St. Hilaire, Chan & Ahn (2023 online; 2024). *Psychonomic Bulletin & Review*, 31(2), 411–441. [doi](https://doi.org/10.3758/s13423-023-02353-8)
- Swire-Thompson, DeGutis & Lazer (2020). *Journal of Applied Research in Memory and Cognition*, 9(3), 286–299. [doi](https://doi.org/10.1016/j.jarmac.2020.06.006)
- Tippett (2010). *International Journal of Science and Mathematics Education*, 8(6), 951–970. [doi](https://doi.org/10.1007/s10763-010-9203-x)
- van den Broek & Kendeou (2008). *Applied Cognitive Psychology*, 22(3), 335–351. [doi](https://doi.org/10.1002/acp.1418)
- Vosniadou (1994). *Learning and Instruction*, 4(1), 45–69. [doi](https://doi.org/10.1016/0959-4752(94)90018-3)
- Vosniadou & Brewer (1992). *Cognitive Psychology*, 24(4), 535–585. [doi](https://doi.org/10.1016/0010-0285(92)90018-w)
- White & Gunstone (1992). *Probing Understanding*. Falmer Press. [Google Scholar](https://scholar.google.com/scholar?q=White+Gunstone+1992+%22Probing+Understanding%22)
- Wisniewski, Zierer & Hattie (2020). *Frontiers in Psychology*, 10, 3087. [doi:10.3389/fpsyg.2019.03087](https://doi.org/10.3389/fpsyg.2019.03087)
- Yang, Luo, Vadillo, Yu & Shanks (2021). *Psychological Bulletin*, 147(4), 399–435. [doi:10.1037/bul0000309](https://doi.org/10.1037/bul0000309)
