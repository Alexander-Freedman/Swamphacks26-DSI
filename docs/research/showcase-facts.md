# Showcase facts: numbers we can quote, with sources

For the reveal screens and the pitch on the three showcase topics in docs/research/demo.md (coin streak, positive test / Wason 2-4-6, Off the Edge), plus the hypercorrection claim behind the confidence slider.

Rules I used: every number has a link next to it. "Read in source" means I read the passage in the paper itself. Anything I only saw quoted by someone else is marked **unverified**. The "Safe on a slide" lines are wording I'd stand behind if a judge asks "where's that from?".

## TL;DR
- **Coin streak is rock solid.** I computed it exactly: in 100 fair flips the expected longest run (either side) is **6.98**, P(run of 6+) = **80.7%**, P(run of 5+) = **97.2%**, P(longest run 4 or less) = **2.8%**. Most common longest run: 6.
- **Fake sequences alternate ~60% of the time instead of 50%** (Falk & Konold 1997, Table 1, read in source). With 60% switching, a 6+ run shows up only 46% of the time, vs 81% for a real coin.
- **Wason 2-4-6:** 22 of 29 people (76%) announced a wrong rule first; only 6 (21%) got it right first time. People who announced a wrong rule first chose only 4% of their test triples to break their own rule (read in source).
- **Off the Edge is the weak one.** The famous McCloskey numbers are about curved tubes and objects *dropped from a moving carrier*, not a ball rolling off a table. For a ball rolling off a table, the 1985 study I found says older children already mostly get it right. I couldn't find an adult error rate for the table version, and I couldn't source the "Road Runner path" claim. Don't quote a rate for our exact task.
- **Hypercorrection is real but modest.** High-confidence errors got corrected **87%** of the time vs **61%** for low-confidence errors (Butterfield & Metcalfe data, Table 1 of their 2006 paper, read in source). Within-person gamma correlations are about **.13 to .23** in replications. Say "more likely to stick", not "dramatically better".

---

## 1. Coin streak

### 1a. The exact numbers (computed, not simulated)
I computed the exact distribution of the longest run with a DP over "length of the current run" (exact fractions, no sampling). This matches the 200k-sequence simulation in demo.md (mean 7.0, P(≥5) 97%, P(≥6) 81%).

```python
from fractions import Fraction
def p_max_run_lt(n, k):
    # P(longest run of same side < k) in n fair flips; state = current run length
    dist = [Fraction(0)] * k; dist[1] = Fraction(1)   # after the first flip
    for _ in range(n - 1):
        new = [Fraction(0)] * k
        for r in range(1, k):
            new[1] += dist[r] / 2                    # switch side
            if r + 1 < k: new[r + 1] += dist[r] / 2  # same side again
        dist = new
    return sum(dist)
```

Output for n = 100 (longest run of either heads or tails):

| | value |
|---|---|
| Expected longest run | **6.977** |
| Most likely longest run (mode) | **6** (26.5%) |
| P(longest = 4) | 2.8% |
| P(longest = 5) | 16.5% |
| P(longest = 6) | 26.5% |
| P(longest = 7) | 22.8% |
| P(longest = 8) | 14.6% |
| P(run of **5+**) | **97.2%** |
| P(run of **6+**) | **80.7%** |
| P(run of 7+) | 54.2% |
| P(run of 8+) | 31.5% |
| P(longest run **4 or less**) | **2.8%** |

Heads-only, if we ever ask "longest run of heads": expected 5.99, P(6+ heads in a row) = 54.6%. The question in demo.md is "same side", so use the first table.

**Safe on a slide:**
- "In 100 fair flips, the longest streak is usually 6 or 7. There's a 97% chance of a streak of 5 or more." (exact calculation; link to our code/notes)
- "If you guessed 4 or less, a real coin beats your guess about 97 times out of 100."

### 1b. Rule of thumb (Schilling)
- Schilling's rule: the typical longest run of heads **or** tails in n fair tosses is about **log₂(n)**, so ~6.6 for n = 100. He also says the 95% range doesn't depend on n, so the prediction is as good for 100 flips as for a million. Read in source: [Schilling 1994, "Long Run Predictions", Math Horizons 1(2):10-12](https://www.csun.edu/%7Ehcmth031/LongRunPredictions.pdf).
- Same article, on fakes: "most people are quite reluctant to include strings of more than four or five heads (or tails) in a row", so it's "rather easy to distinguish a sequence simulated by a human from an actual random sequence". Read in source (same link). This is Schilling's claim as a mathematician, not a measured rate.
- The original paper: Schilling (1990), "The Longest Run of Heads", College Mathematics Journal 21:196-207 ([MAA listing](https://maa.org/node/113688)). I didn't read the 1990 paper itself; I'm quoting the 1994 one, which repeats the rule.
- Classroom version: a teacher had half the class toss a real coin 100 times and half invent a sequence, then picked out all but one by the longest run; "only one of the mental sequences contained a run of length at least 5". Read in source: [Dartmouth Chance, Streaks notes](https://chance.dartmouth.edu/teaching_aids/Profiles/streaks/section3_3.html). One class, anecdote, not a study.

**Safe on a slide:** "Rule of thumb: longest streak ≈ log₂(flips). For 100 flips, that's about 7." (Schilling)

### 1c. Human "random" sequences alternate too much
- **Falk & Konold (1997), Psychological Review 104(2):301-318.** Read in source ([PDF from UMass SRRI](https://srri.umass.edu/sites/srri/files/FalkKonold1997/index.pdf)).
  - Abstract, first line: "People attempting to generate random sequences usually produce more alternations than expected by chance. They also judge overalternating sequences as maximally random."
  - P(A) = probability of alternation = (runs − 1)/(n − 1). A fair coin has P(A) = **.5**.
  - Table 1 (p. 304): mean P(A) when people **generate** random sequences ranges **.56-.63** across 8 studies (e.g. Bakan 1960: .59; Rapoport & Budescu 1992: .59). For sequences people **pick as most random**: .57-.65, and .7-.8 in Gilovich et al. 1985.
  - p. 303: "the preferred subjective P(A) of about .6 is stable over many studies and experimental variations."
  - Their own rating data peak at P(A) = .60 "instead of at .50".
- **Bar-Hillel & Wagenaar (1991), "The perception of randomness", Advances in Applied Mathematics 12(4):428-454.** Abstract only ([Hebrew University record](https://cris.huji.ac.il/en/publications/the-perception-of-randomness/)): people "see clumps or streaks in truly random series" and expect more alternation than there is; when asked to produce random series they alternate too much. I read the abstract, not the full paper, so no numbers from it.
- **Nickerson (2002), "The production and perception of randomness", Psychological Review 109(2):330-357** ([DOI](https://doi.org/10.1037/0033-295X.109.2.330)). Big review of this literature. I couldn't get the text or the abstract. My memory is that it argues the "people are bad randomizers" conclusion depends a lot on how the task is set up: **unverified**, so don't quote it; useful as Q&A caution only.

What 60% switching does to streaks (my calculation, same DP with a switch probability of 0.6 instead of 0.5, 100 flips):

| | real coin (P(A) = .5) | typical fake (P(A) = .6) |
|---|---|---|
| Expected longest run | 6.98 | 5.60 |
| P(run of 6+) | 80.7% | 45.6% |
| P(longest run 4 or less) | 2.8% | 20.3% |

This is a model, not data: real fakes aren't a clean Markov chain, and Schilling and the Dartmouth class suggest people avoid long runs even harder than this. Fine for our explainer, but label it "if you switch 60% of the time".

**Safe on a slide:**
- "When people try to fake randomness, they switch sides about 60% of the time. A real coin switches 50%." (Falk & Konold 1997)
- "That's why fake sequences are missing the long streaks."

**Don't say:** "people always guess 3-4". demo.md says "most people guess 3-4"; I found no study that measured guesses for this exact question. That's our expectation, so call it "most people we asked" once we've actually asked people on Saturday, or drop it.

---

## 2. Positive test / Wason 2-4-6

Naming note: in demo.md "positive test" is the base-rate medical-test card (Gigerenzer's ~90% vs ~10%). Wason's 2-4-6 is the "positive test strategy" in the Klayman & Ha sense. They're different cards. The Gigerenzer number is sourced in demo.md; I didn't re-check it here.

### 2a. Wason (1960)
Read in source: [Wason 1960, "On the failure to eliminate hypotheses in a conceptual task", QJEP 12(3):129-140](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/wason-qjep1960.pdf) ([DOI](https://doi.org/10.1080/17470216008416717)).
- Setup: 29 psychology undergrads were told 2, 4, 6 fits a rule; they wrote triples, got yes/no, and announced a rule when "highly confident". The rule was any three numbers "in increasing order of magnitude".
- Abstract: "Six out of 29 subjects reached the correct conclusion without previous incorrect ones, 13 reached one incorrect conclusion, nine reached two or more incorrect conclusions, and one reached no conclusion."
  - So **22 of 29 (76%)** announced a wrong rule first. **6 of 29 (21%)** got it right on the first try.
  - The 22 is 13 + 9 and matches the paper's own n = 22 for "first incorrect announcement".
- Wrong rules were almost always narrower versions of the real one: "In nearly all cases incorrect rules were sufficient ones, e.g. 'increasing intervals of two.'"
- Negative instances (triples that don't fit the real rule) as a share of all triples tested before the first announcement: mean **0.21** for the 6 who got it right, **0.04** for the 22 who got it wrong (p. 133).
- People who announced a wrong rule first had tested only **3.68** triples on average before announcing (range 1-7), vs **8.0** for those who got it right.

**Safe on a slide:**
- "In Wason's 1960 study, only 6 of 29 students found the rule on their first try."
- "Most only tested triples that fit their own guess, so they never got a 'no'."
- Avoid "tested *only* positive cases" as a blanket claim: the paper gives a group mean of 4% negative tests, not "zero for everyone". "Almost never tested a triple that broke their guess" is accurate for the wrong-first group.

### 2b. Klayman & Ha (1987)
Read in source: [Klayman & Ha 1987, "Confirmation, disconfirmation, and information in hypothesis testing", Psychological Review 94(2):211-228](https://pages.ucsd.edu/~mckenzie/KlaymanHaPsychReview1987.pdf).
- No new participant numbers here: it's a theory paper. What it gives us is the name and the explanation.
- Abstract: many effects called "confirmation bias" are "better understood in terms of a general positive test strategy", "a tendency to test cases that are expected (or known) to have the property of interest". It "can be a very good heuristic" but "can, however, lead to systematic errors or inefficiencies."
- p. 212-213: "Wason found that people made much more use of +Htests than -Htests." In 2-4-6, the guessed rule ("increasing by 2") sits inside the real one ("increasing"), so "+Htests will never produce falsification." Only a triple you expect to fail (like 2, 4, 7) can show you're wrong.

**Safe on a slide:**
- Misconception name: **"Only testing what you expect to be true"** (positive test strategy, Klayman & Ha 1987).
- "If your guess is narrower than the real rule, every 'yes' feels like proof, and none of it is."

---

## 3. Off the Edge (ball rolling off a table)

This is where I'd be careful. The big McCloskey numbers people repeat are for different tasks.

### 3a. McCloskey, Caramazza & Green (1980), "Curvilinear motion in the absence of external forces", Science 210:1139-1141
- 47 university students (15 no physics, 22 high-school physics, 10 college physics) drew paths for things like a ball shot out of a curved tube.
- Numbers, from the [Christian Science Monitor writeup, Dec 1980](https://www.csmonitor.com/1980/1217/121733.html) (press summary, not the paper): **33%** drew the ball leaving a C-shaped tube and keeping on curving; **51%** for a spiral tube; **30%** thought a ball whirled on a string would keep curving after release.
- I couldn't open the Science paper itself, so the percentages are **unverified against the source**. The task is a curved tube, not a table edge.

### 3b. McCloskey, Washburn & Felch (1983), "Intuitive physics: The straight-down belief and its origin", JEP:LMC 9(4):636-649
- Abstract, read ([PER Central record](https://www.per-central.org/items/detail.cfm?ID=2667)): "many people erroneously believe that an object that is carried by another moving object (e.g., a ball carried by a walking person) will, if dropped, fall to the ground in a straight vertical line. (In fact, such an object will fall forward in a parabolic arc.)" They suggest it comes from a perceptual illusion: dropped objects can *look* like they fall straight down. 177 undergrads did the paper problems ([JHU record](https://pure.johnshopkins.edu/en/publications/intuitive-physics-the-straight-down-belief-and-its-origin-3/)).
- A search snippet attributes to this paper: walker problem, 53% forward, 36% straight down, 11% backward. I didn't see the full text: **unverified**.
- The task is "dropped while moving", not "rolls off a table".

### 3c. McCloskey (1983), "Intuitive Physics", Scientific American 248(4):122-130
- Abstract, read ([ERIC record](https://eric.ed.gov/?id=EJ277094)): many people have misconceptions about motion, and they "tend to follow a theory held in the three centuries before Newton (impetus theory)."
- A York University lecture summarizing it mentions "an object falling from a table" as one of the article's pictures ([York NATS 1800 notes](https://www.yorku.ca/lbianchi/nats1800/lecture16a.html)), but gives no rate.
- **"Road Runner" / cartoon path (goes straight out, then drops straight down): unverified.** I couldn't find it in any source I could read. Don't attribute it to McCloskey on a slide.

### 3d. The study that's actually about a ball rolling off a table
- Kaiser, Proffitt & McCloskey (1985), "The development of beliefs about falling objects", Perception & Psychophysics 38(6):533-539. Abstract, read ([Proffitt lab record](https://uva.theopenscholar.com/dennis-proffitt/publications/development-beliefs-about-falling-objects)): "Younger children (preschool and kindergarten) generally thought that the ball would fall straight down in both situations." Older children knew a ball rolling off a table keeps moving forward, but were no better than young kids on a ball dropped from a moving toy train.
- So for the table edge specifically, the evidence says **older kids mostly get it right**. I found no adult error rate for this exact task.

### 3e. Review to cite for the general claim
- Kubricht, Holyoak & Lu (2017), "Intuitive Physics: Current Research and Controversies", Trends in Cognitive Sciences. Read in source ([PDF](https://cvl.psych.ucla.edu/wp-content/uploads/sites/162/2021/03/A80.Kubricht-et-al.-TICS.pdf)): "adults often predict that an object dropped from a moving body will follow a linear path downwards (i.e., the straight-down belief)", and adults "appear to exhibit medieval impetus beliefs, for example, that an object exiting a curved tube will follow a curvilinear trajectory".

**Safe on a slide:**
- "Even college students who took physics often draw motion that breaks Newton's laws." (McCloskey et al. 1980; Kubricht et al. 2017)
- "Many people think a ball dropped while walking falls straight down. It actually keeps moving forward." (McCloskey, Washburn & Felch 1983)
- **Don't say** "X% of people get the table-edge question wrong." We have no number for it.

**What this means for the demo:** if we want a physics card that reliably fools adults, the evidence supports **"drop a ball while walking / from a moving train"** (straight-down belief) better than "ball rolls off a table". Same reveal component (draw the path, ghost replay), different setup. I'd raise this as a question rather than just switch.

---

## 4. Hypercorrection (why the confidence slider)

### 4a. The original finding
- Butterfield & Metcalfe (2001), "Errors committed with high confidence are hypercorrected", JEP:LMC 27(6):1491-1494 ([DOI](https://doi.org/10.1037/0278-7393.27.6.1491)). I couldn't open the 2001 paper itself.
- Their 2006 follow-up re-tabulates that data, and I did read it: Butterfield & Metcalfe (2006), "The correction of errors committed with high confidence", Metacognition and Learning 1:69-84 ([PDF, Columbia](http://www.columbia.edu/cu/psychology/metcalfe/PDFs/Butterfield_Metcalfe_2006.pdf)).
  - Method: general-knowledge questions, confidence rating, the correct answer shown after errors, then a retest.
  - Table 1 (p. 71), P(correct at retest) given the first answer was wrong: **low confidence .61, medium .81, high .87**. Small sample: means from the 23 participants who had data in all three cells. The table cites the 2001b conference poster data, which I believe is the same dataset as the 2001 paper, but I haven't confirmed that.
  - "Questions on which people had made high confidence errors were more (not less) likely to be answered correctly at retest than were low-confidence errors."

### 4b. How big is it, honestly
Effect sizes are reported as within-person gamma correlations between confidence in the error and getting it right later. All read in source:
- Butterfield & Metcalfe 2006: γ = **.13** (Exp 1), **.16** (Exp 2); reanalysis of the 2001 data: γ = .33.
- Metcalfe, Butterfield, Habeck & Stern 2012 (fMRI): γ = **.14**, retest accuracy 69% ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3970786)).
- Fazio & Marsh 2009: γ = **.23** ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4036076)); Fazio & Marsh 2010: γ = **.13** ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4084803)).
- The effect lasts a week, but high-confidence errors can come back once the correct answer is forgotten ([Butler, Fazio & Marsh 2011](https://pubmed.ncbi.nlm.nih.gov/21989771/), abstract only).
- I found no meta-analysis with a pooled effect size. So the honest range is: reliable, but a small-to-moderate correlation (γ ≈ .13-.33).

**Safe on a slide / in the pitch:**
- "Mistakes you were sure about are the ones you're most likely to fix after seeing the answer." (Butterfield & Metcalfe 2001)
- With the number: "In one study, people fixed 87% of their confident mistakes vs 61% of their unsure ones." (Butterfield & Metcalfe 2006, Table 1)
- **Don't say** "confident mistakes are corrected 3x better" or anything implying a big effect. It's real and replicated, but modest.

---

## 5. Base-rate medical card (positive test)

The card: a rare disease, a decent test, you test positive. What are the odds you actually have it? People (doctors too) answer close to the test's accuracy; the real answer is far lower because the disease is rare.

### 5a. Casscells, Schoenberger & Graboys (1978)
- "Interpretation by physicians of clinical laboratory results", NEJM 299(18):999-1001 ([DOI](https://doi.org/10.1056/NEJM197811022991808)). I couldn't open the 1978 paper itself. The numbers below are as the 2014 replication reports them (5b), which I did read.
- Question: a disease with prevalence 1/1000, a test with a 5% false positive rate. Someone tests positive: what's the chance they have it? Correct answer is about **2%** (1.96% if the test catches every real case).
- Results as reported by Manrai et al.: **11 of 60 (18%)** answered correctly; the most common answer was **95%**, given by **27 of 60 (45%)**.
- Sample: staff and students at Harvard teaching hospitals. The exact split (attendings / residents / students) I only saw in secondary sources: **unverified**.

### 5b. Manrai et al. (2014), the replication
Read in source: [Manrai, Bhatia, Strymish, Kohane & Jain 2014, "Medicine's uncomfortable relationship with math: calculating positive predictive value", JAMA Intern Med 174(6):991-993](https://pmc.ncbi.nlm.nih.gov/articles/PMC4955674) ([DOI](https://doi.org/10.1001/jamainternmed.2014.1059)).
- Same question as Casscells, asked in July 2013 at a Boston-area hospital. 61 respondents: 24 attendings, 26 house officers, 10 medical students, 1 retired physician.
- "Of 61 respondents, 14 provided the correct answer of 2%." That's **23%** (my division).
- "The most common answer was 95%, provided by 27 of 61 respondents" (**44%**, my division).
- Median answer: **66%**, which they note is 33 times the true answer.
- So 35 years later, basically the same result.

### 5c. Eddy (1982), mammography
- Eddy, "Probabilistic reasoning in clinical medicine: problems and opportunities", in Kahneman, Slovic & Tversky (eds), *Judgment under Uncertainty*, pp. 249-267 ([Cambridge listing](https://www.cambridge.org/core/books/abs/judgment-under-uncertainty/probabilistic-reasoning-in-clinical-medicine-problems-and-opportunities/661E12D1ECD669EDB5B410407A4BB570)). I couldn't read the chapter.
- The problem: breast cancer base rate 1%, a positive mammogram 80% of the time if cancer, 9.6% if not. Correct answer: **7.8%**.
- The famous number is how Gigerenzer & Hoffrage (1995, p. 685, read in source, link in 5d) report it: "Eddy (1982) reported that 95 out of 100 physicians estimated the posterior probability p(cancer|positive) to be between 70% and 80%, rather than 7.8%."
- Gigerenzer himself elsewhere calls Eddy's sample informal. I haven't seen Eddy's own wording, so "95 out of 100" is **unverified against Eddy's chapter**: always cite it as "as reported by Gigerenzer & Hoffrage".

### 5d. Gigerenzer & Hoffrage (1995), natural frequencies
Read in source: [Gigerenzer & Hoffrage 1995, "How to improve Bayesian reasoning without instruction: frequency formats", Psychological Review 102(4):684-704](https://pages.ucsd.edu/~scoulson/203/GG_How_1995.pdf) ([DOI](https://doi.org/10.1037/0033-295X.102.4.684)).
- Study 1: **60 students** at the University of Salzburg, **15 problems** (mammography, cab problem, and others), each in different formats.
- Same numbers, two ways of writing them. Probability format: "The probability of breast cancer is 1%... 80%... 9.6%". Frequency format: "10 out of every 1,000 women... 8 of every 10 women with breast cancer will get a positive mammography. 95 out of every 990 women without breast cancer will also get a positive mammography."
- Summary of Study 1, quoted: "The standard probability format ... elicited **16%** Bayesian algorithms. When information was presented in a frequency format, this proportion jumped to **46%** in the standard menu and **50%** in the short menu."
- Also: "the largest percentage of Bayesian algorithms in the two probability menus (28%) was considerably smaller than the smallest in the two frequency menus (46%)."
- Careful: these are shares of answers solved with a correct Bayesian method, across all 15 problems, not "share of people who got the mammography question right".

### 5e. Gigerenzer et al. (2007), gynecologists
Read in source: [Gigerenzer, Gaissmaier, Kurz-Milcke, Schwartz & Woloshin 2007, "Helping doctors and patients make sense of health statistics", Psychological Science in the Public Interest 8(2):53-96](https://kops.uni-konstanz.de/bitstreams/faa74b7c-5f6e-4abe-b6f9-d980100c9c1f/download) ([DOI](https://doi.org/10.1111/j.1539-6053.2008.00033.x)), section "Few Gynecologists Understand Positive Mammograms".
- **160 gynecologists** at the start of a 2007 continuing-education session.
- Given: prevalence 1%, sensitivity 90%, false-positive rate 9%. Four choices: (A) about 81%, (B) about 9 in 10, (C) about 1 in 10, (D) about 1%. Best answer: **C, about 1 in 10**.
- "the majority of them grossly overestimated the probability of cancer, answering '90%' or '81%.'" Answers ranged from 1% to 90%.
- "The number of physicians who found the best answer ... was slightly less than chance (**21%**)." (Chance with 4 choices = 25%.)
- After training on natural frequencies ("Ten out of every 1,000 women have breast cancer. Of these 10 women with breast cancer, 9 test positive. Of the 990 women without cancer, about 89 nevertheless test positive"): "**87%** of them now understood that 1 in 10 is the best answer."
- The per-choice split is in their Fig. 2, which I couldn't read (image). I don't have the exact share who picked "9 in 10".

**Safe on a slide:**
- "Asked this exact question, 27 of 61 doctors and students at a Boston hospital said 95%. The answer is about 2%." (Manrai et al. 2014)
- "Only 14 of 61 got it right, about the same as in 1978." (Manrai et al. 2014; Casscells et al. 1978)
- "Of 160 gynecologists, only 21% picked the right answer for a positive mammogram. After learning to think in 'out of 1,000', 87% did." (Gigerenzer et al. 2007)
- "Write the same numbers as counts instead of percentages and correct answers roughly triple: 16% to 46%." (Gigerenzer & Hoffrage 1995)
- This is also our design argument: the reveal should show the 1,000-people picture, not just the percentage.

**Don't say:**
- "95% of doctors get it wrong." No study here says that. The Eddy "95 out of 100" is about the answer range (70-80%), and it's second-hand.
- "Most Harvard doctors said 95%." It was 45% (27 of 60), the most common answer but not most people.
- "Natural frequencies make people get it right." Even with frequencies, about half didn't in the 1995 study.

---

## 6. What people guess for the longest streak in 100 flips

Short version: **I found no study that asked people to guess the longest run in 100 flips and reported the answers.** So demo.md's "Most people guess 3-4" is **unverified**.

What I checked:
- **Scholl & Greifeneder (2011)**, "Disentangling the effects of alternation rate and maximum run length on judgments of randomness", JDM 6(6):531-541. Read in source ([JDM](https://dlab.sauder.ubc.ca/sjdm/journal/11/101105/jdm101105.html)). People rated how random a sequence looked. Longest runs were set by the researchers (3-5 in 21 flips; 4-6 in 39 flips). Nobody guessed a longest run. Main finding: alternation rate drives randomness judgments, and the longest run had a small, less consistent effect.
- **Schilling (1990, 1994)**: says people are "quite reluctant to include strings of more than four or five heads (or tails) in a row" when faking (1994, read in source, link in 1b). That's about what people *write*, not what they *guess*, and it's an observation, not a measured rate.
- **Dartmouth classroom demo** (link in 1b): one class, "only one of the mental sequences contained a run of length at least 5". Also about fake sequences, not guesses.
- **Wagenaar (1972)**, "Generation of random sequences by human subjects: a critical survey of literature", Psychological Bulletin 77:65-72 ([DOI](https://doi.org/10.1037/h0032060)). Not read; secondary sources say fake sequences have too many short runs. Not a guess study.
- **Kareev (1992)**, "Not that bad after all: generation of random sequences", JEP:HPP 18(4):1189-1194 ([HUJI record](https://cris.huji.ac.il/en/publications/not-that-bad-after-all-generation-of-random-sequences/)). Abstract only: blames over-alternation on short-term memory limits. Not a guess study.
- A Bowie State teaching paper says students "generally underestimate" the longest run ([ICTCM proceedings](https://www.math.odu.edu/~bogacki/epictcm/i/13/P002.html)). Teaching note, no numbers. I didn't read it fully.
- An IMS puzzle column reportedly says few people would write "more than three or four consecutive heads" in 100 imaginary tosses ([IMS](https://imstat.org/2018/10/student-puzzle-corner-22/)); the page was blocked for me, so **unverified**, and it's an opinion anyway.

What we can say instead:
- "When people fake 100 flips, they rarely include a streak of 5 or more. Real coins almost always have one (97%)." (Schilling 1994; Dartmouth demo; our exact calculation in 1a)
- Once the app is live, our own guess data is the real source. Log the guesses at the event and say "people we asked guessed X on average", with the count.

**Don't say:** "Studies show people guess 3-4." No study found.

---

## Unverified list (don't put these on slides)
- "Most people guess 3-4" for the 100-flip question: our expectation, no study found.
- Nickerson 2002's conclusions: abstract not read.
- McCloskey 1980 percentages (33% / 51% / 30%): from a press article, not the paper.
- Straight-down walker split (53% / 36% / 11%): from a search snippet.
- "Road Runner" / cartoon path belief: no source found.
- Any adult error rate for "ball rolls off a table".
- Whether the 2001b poster data in Butterfield & Metcalfe's 2006 Table 1 is the same dataset as the 2001 JEP:LMC paper.
- Casscells 1978 numbers (11 of 60 correct, 27 of 60 said 95%): read in Manrai 2014, not in the 1978 paper. Sample split by role: secondary sources only.
- Eddy 1982 "95 out of 100 physicians said 70-80%": as reported by Gigerenzer & Hoffrage 1995; Eddy's own wording not read, and his sample was informal.
- Per-choice split for the 160 gynecologists (e.g. how many picked "9 in 10"): in Fig. 2 of Gigerenzer et al. 2007, which I couldn't read.
- Any number for what people guess as the longest streak in 100 flips: no study found (section 6). demo.md's "3-4" stays unverified.
- IMS puzzle column "three or four consecutive heads" line: page blocked, not read.
