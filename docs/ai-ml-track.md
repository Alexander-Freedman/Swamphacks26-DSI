# What the AI/ML track judges (UF DSI) will look for

Matters only if we pick the AI/ML track. Nothing is picked.

**Bottom line:**
- Lead the README with the result *and* its baseline.
- Show a results table you can reproduce with one command, an honest split, CIs, and error analysis.
- Logic lives in `src/` modules, not one giant notebook; deps pinned; no secrets; no template leftovers; no assistant scaffolding files committed.
- A design-decisions table (decision, options, why, cost).
- Small, real commits through the 36h.

# DSI AI/ML track: what they value, what code readers check, README + repo template

Research notes for the "Most Creative Use of AI" track, which UF DSI runs. Their own text says AI has to be central, depth beats polish, they read GitHub and code, clean documented code counts, and teams have to explain design choices and tradeoffs.

## TL;DR for us

1. DSI is a student data-science/ML club (founded 2015, 1,000+ members, sponsored by UF's AI institute). It's mostly a teaching org: 20+ workshops a year, kept as notebooks in a public GitHub archive. Its leaders' interests lean toward **evals, explainability and agents**. Judges with that background will open the repo and look for a real model, a real eval with a baseline, and code they can follow.
2. A code-reading judge gets 2-3 minutes and goes in this order: **README top screen, then the results table, then the file tree, then the commit log, then one core module**. Optimize those five things.
3. Have one headline number in the README, next to a baseline, on a held-out split we name, with a CI or ± range, followed by 3 failure cases. That one block is worth more than any UI polish for this track.
4. Logic goes in `src/` modules and notebooks are only for exploration and figures. Pin requirements, `.env.example` not `.env`, a few real tests, many small commits, no dead code or template leftovers.

---

## 1. What UF DSI is and values

**Facts**
- DSI is UF's Data Science and Informatics student org. It was founded in 2015 under the motto "Making Knowledge Accessible to All" and is open to all majors. The site lists ~2.2k Discord members ([ufdsi.com](https://ufdsi.com), [about](https://ufdsi.com/about)).
- Its official sponsor is the UF AI & Informatics Research Institute (AIIRI). Partners include UFIT (HiPerGator access), Statistics, CISE, Smathers Libraries and the AI2 Center ([about](https://ufdsi.com/about), [AIIRI for students](https://ai.research.ufl.edu/for-students)).
- It was UF Student Organization of the Year (Spring 2025) and has run 20+ technical workshops in the past year ([AIIRI](https://ai.research.ufl.edu/dsi-wins-uf-organization-of-the-year/), [UF Stats](https://stat.ufl.edu/featured/2026/uf-data-science-informatics-competed-at-hacklytics)).
- **Hacklytics 2026 (Georgia Tech):** DSI funded 56 students. Wins: Entertainment 1st and 3rd, Actian Vector AI DB challenge 1st, Sports 1st plus Figma 2nd, Best Use of Sphinx API, and Best Use of Vultr. Officers quoted on the values: accessibility ("make knowledge and opportunity accessible to all") and "collaboration, creativity" ([UF Stats](https://stat.ufl.edu/featured/2026/uf-data-science-informatics-competed-at-hacklytics)). No project write-ups were published.
- The spring symposium is full-day talks and panels (2026 included Google Cloud, NLP Logix, and UF CV/ML PhD students). It has no project-judging rubric ([symposium 2026](https://ufdsi.com/symposium/2026)).
- **GitHub org [`dsiufl`](https://github.com/dsiufl)** has 34 repos, nearly all workshop notebooks. The active one is [`WorkshopArchive`](https://github.com/dsiufl/WorkshopArchive) (2023-26, 32 stars). Topics: PyTorch, CNNs, Applied ML, Sentence Transformers/semantic search, Intro to AI Agents (NaviGator API), Naive Bayes, Markowitz MVO, and **Language Models Part 1: Evaluations** (n-gram/BLEU/ROUGE, MMLU, HellaSwag, LLM-as-judge agreement from the MT-Bench paper). Each workshop folder has its own README (about, dependencies, install, Colab link, contents, authors). There was even a 2019 `DSI-SwampHacks` repo ("Data Science with Pokemon").
- A former DSI leader's public READMEs list interests in neurosymbolic/explainable AI, agents and benchmarking agentic systems, and lead with a number (e.g. validation accuracy).

**No public DSI rubric or blog post on "what a good ML project looks like" exists that I could find.** The site, GitHub, symposium page and UF news all came up empty. The track text is the rubric.

**Inference: what the three DSI judges will reward**
- They teach eval methods themselves (BLEU/MMLU/LLM-judge agreement), so they'll know when "accuracy 94%" has no baseline or split behind it. An honest eval with a baseline counts for more than a bigger number.
- Their workshop culture is notebook-first. A notebook is fine for EDA and figures. What reads as "well-engineered" next to their own material is logic in modules with a CLI entry point.
- With interests in explainability and agent benchmarking, saliency, feature importance, an error analysis table or an agent-trajectory eval will land. A bare LLM API wrapper won't ("AI must be central": fine-tuning, RAG, agents, custom models, evals).
- They value accessibility. Explain the model so a sophomore member could follow it, and make it runnable in 3 commands or a Colab link (which is exactly how their own workshops ship).

## 2. What a code-reading judge looks at in 2-3 minutes

The order comes from judge accounts and checklists:
1. **README above the fold.** One-line problem, a GIF or screenshot, the headline result. Hackathon rubrics explicitly score "how well your README explains your project, its setup instructions and its features" ([codejam rules](https://github.com/codelif/codejam-v5), [DEV guide](https://dev.to/arindam_1729/how-to-use-github-effectively-at-hackathons-4emh)).
2. **Results table plus the exact commands that produce it.** That's item 5 of Papers with Code's ML Code Completeness Checklist: (1) dependencies, (2) training code, (3) evaluation code, (4) pretrained models, (5) a README with a results table and precise commands. NeurIPS 2019 repos with all 5 had the most stars (median 196) ([paperswithcode/releasing-research-code](https://github.com/paperswithcode/releasing-research-code)).
3. **`git log --oneline`.** A hackathon judge's first move: "The first thing I check is `git log --oneline`." He then reads the manifest (pinned versions, no unused dependencies) and the file tree. Red flags he called out: ~6,000 lines in one commit, template leftovers ("react-example" package name), ghost dependencies, scaffolding files like `assistant instruction files`/`AGENTS.md`, tests with no assertions, and "AI-powered" claims with no AI in the code ([Durai, "The git log never lies"](https://hackernoon.com/the-git-log-never-lies)). Many hackathons check commit timestamps against the event window and reject single-commit dumps ([ETHRome rules](https://ethrome25.notion.site/Hackathon-Rules-160d00c099af8156b330c0bac363c3ed)). SwampHacks: an idea from before is OK, code from before isn't (NOTES.md).
4. **File tree.** Is there a recognizable shape (`src/`, `data/`, `notebooks/`, `tests/`), or is it 40 files at the root? ([cookiecutter-data-science](https://cookiecutter-data-science.drivendata.org/)). Rubrics ask "Is the project well-structured and organised?" ([SSI hackday criteria](https://software.ac.uk/cw19-hackday-judging-criteria)).
5. **One core module.** Readable names, small functions, a docstring at the top of each file. "Decompose programs into functions… meaningful names… make dependencies explicit… provide a simple example or test dataset" ([Wilson et al. 2017, Good enough practices](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005510)).
6. **Tests and reproducibility signals** (only if time allows): `tests/`, a seed, pinned `requirements.txt`, `.env.example`.

Supporting guides:
- **Cookiecutter Data Science opinions:** raw data is immutable; data stays out of git; "notebooks for exploration, source files for repetition"; refactor shared notebook code into the package; record each experiment's data, code version and metrics; build from the environment up; keep secrets in a git-ignored `.env` ([opinions](https://cookiecutter-data-science.drivendata.org/opinions/)).
- **Sandve et al. 2013, Ten Simple Rules for Reproducible Computational Research:** track how every result was produced, avoid manual data edits, archive exact tool versions, version-control scripts, record random seeds, keep the raw data behind plots, link text claims to results ([PLOS CB](https://pmc.ncbi.nlm.nih.gov/articles/PMC3812051/)).
- **Model cards (Mitchell et al., FAT* 2019):** sections are Model details, Intended use, Factors, Metrics, Evaluation data, Training data, Quantitative analyses (disaggregated by group), Ethical considerations, Caveats and recommendations ([arXiv 1810.03993](https://arxiv.org/abs/1810.03993)). A 10-line version in the README reads as maturity to a DS judge.
- **Notebooks don't reproduce.** Of 1.4M GitHub notebooks, ~24% ran without error and ~4% gave the same results. The causes were missing deps, hidden state and out-of-order cells ([Pimentel et al., MSR 2019](https://2019.msrconf.org/details/msr-2019-papers/36/A-Large-scale-Study-about-Quality-and-Reproducibility-of-Jupyter-Notebooks); figures via [koaning.io summary](https://koaning.io/posts/many-notebooks)).
- **ML Test Score (Breck, Cai, Nielsen, Salib, Sculley 2017):** 28 tests across data, model, infrastructure and monitoring. ML testing is hard because behavior depends on data that "cannot be strongly specified a priori" ([Google Research](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)). We borrow 3-4 cheap ones (see the tests below).

## 3. Template

### README outline (in this order; the top screen is all most judges read)

```
# <Name>: <one line: who it helps and what it does>
<GIF or screenshot>   <live demo link>   <2-min video link>

**Result:** <model> gets <metric> = X (95% CI a-b) on <held-out split, n=N>,
vs <baseline> at Y. [Table below]

## Problem          (3-4 sentences; who has it, why the current way fails)
## Approach         (diagram or 5-line pipeline: data -> features/retrieval -> model -> output;
                     say exactly where the ML is and what the LLM does, if anything)
## Data             (source + license, size, collection date, labeling process, how we
                     split it, what we dropped and why; link data/README.md)
## Model            (architecture/base model, what we trained or tuned, hyperparams,
                     compute: "fine-tuned X for N min on HiPerGator/Colab T4")
## Evaluation
   - Split: train/val/test counts; split by <time/user/source> to avoid leakage
   - Metric(s) and why these fit the problem
   - Baselines: majority/rule-based, plain LLM prompt, ours
   | Model | Metric 1 | Metric 2 | n | notes |   <- results table
   - CIs: bootstrap 1,000x over test set / mean ± sd over 3 seeds
   - Error analysis: confusion matrix or a table of 3-5 real failures, with why each failed
   - Reproduce: `python -m src.evaluate --split test` -> writes reports/metrics.json
## Limitations      (small n, distribution shift, who it might fail for, what we'd do next)
## Design decisions and tradeoffs
   | Decision | Options considered | Why we chose it | Cost |
   (e.g. "logistic regression over BERT: 2 pts worse F1, 50x faster, explainable")
## Run it (3 commands)
   git clone ... && cd ...
   pip install -r requirements.txt        (Python 3.11; cp .env.example .env)
   make demo   (or: python -m src.app)    -- uses data/sample/ + models/ checkpoint
## Repo layout      (the tree below, 1 line per folder)
## Tools, libraries and AI-assistance disclosure
   - Libraries/APIs/models used, with links and licenses
   - AI tools used during development and what for (wording decided at the end; see NOTES.md)
## Team
```

Notes:
- Lead with the number and the baseline. The Papers with Code template and a former DSI leader's READMEs both put the result on the first screen.
- The "Design decisions and tradeoffs" table answers the track's explicit ask. It also doubles as Q&A prep.
- A small mini model card (intended use, out of scope, eval data, caveats) can live inside Limitations.

### Repo layout (cookiecutter-data-science, trimmed for 36 hours)

```
README.md
requirements.txt          # pinned (pip freeze or pip-compile), Python version stated
.env.example              # keys named, no values; .env in .gitignore
Makefile                  # make data / make train / make eval / make demo
data/
  README.md               # source, license, how to fetch, schema
  sample/                 # tiny committed sample so the demo runs offline
  raw/ processed/         # git-ignored; fetched by `make data`
models/                   # small checkpoint or download script; model card notes
notebooks/
  01-eda.ipynb            # exploration + figures only, outputs cleared or small
  02-error-analysis.ipynb
src/<pkg>/
  config.py  data.py  features.py  train.py  evaluate.py  predict.py  app.py
tests/
  test_data.py            # schema, no train/test overlap
  test_model.py           # loads, predicts right shape, beats baseline on sample
  test_eval.py            # metric function on a hand-checked case
reports/
  metrics.json            # written by evaluate.py; the README table comes from this
  figures/
```

## 4. Presenting evals honestly (what a student DS judge respects)

Built on Lones' "How to avoid ML pitfalls" ([arXiv 2108.02497](https://arxiv.org/html/2108.02497v5)), Kapoor & Narayanan on leakage ([Patterns 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10499856)), Dodge et al. "Show Your Work" ([EMNLP 2019](https://arxiv.org/abs/1909.03004v1)) and Husain on LLM evals ([hamel.dev](https://hamel.dev/blog/posts/evals/)).

- **Always have a baseline** ("Do use meaningful baselines"; "Don't assume a bigger number means a better model", Lones 5.1-5.2). Show three rows: a dumb baseline (majority class, persistence, keyword rule), a plain LLM zero-shot prompt, and ours. If the plain prompt is close to ours, say so and explain what ours adds (cost, latency, calibration, explainability).
- **Split so it can't leak.** Split before any augmentation or feature selection (Lones 3.1, 3.6, 4.2). Use a **time split** for anything temporal (Lones 4.8). Use a group split (by user, student, document or station) when one entity has many rows. Leakage is common: Kapoor & Narayanan found it in 294 papers across 17 fields, and when corrected, complex models' edge over simple ones disappeared in their civil-war case study. Say in one line why our split prevents it.
- **Lock a test set and touch it once** (Lones 4.5, "Don't look at all your data"). Tune on validation. If we peeked, say so.
- **Uncertainty.** At hackathon n (50-500), report a 95% bootstrap CI or a Wilson interval, or mean ± sd over 3 seeds (Lones 4.4, 6.4). "F1 0.81 (0.74-0.87), n=212" is credible. "F1 0.81" is not. Don't claim significance with tiny n.
- **Several metrics, chosen for the problem** (Lones 4.6, 6.2): per-class precision/recall when classes are imbalanced, calibration (Brier/reliability plot) when we output a probability or index, and latency/cost when that's the selling point.
- **Error analysis is what impresses this audience.** Include a confusion matrix and a table of 3-5 real failures with a one-line cause each ("Do look at your models", Lones 6.5; "You can never stop looking at data", Husain). Turn the failures into tests or next steps.
- **LLM-as-judge:** if we use one, hand-label 30-50 items, report judge-human agreement (or precision/recall vs the human labels, since raw agreement misleads on imbalanced data), and keep a human spot check (Husain; DSI's own eval workshop covers LLM-judge agreement).
- **Report what it cost to get there** (Dodge et al.): number of configs tried, total train time. "We tried 6 configs; the best on val is reported on test once."
- **Don't generalize beyond the data** (Lones 6.3). A Limitations line should say who and what the eval doesn't cover.
- **Make it reproducible:** `evaluate.py` writes `reports/metrics.json`, and the README table matches it exactly (Sandve rule 9: link text claims to results). Fix the seeds.

A one-screen eval block for the README/pitch:
```
Test set: 212 answers from 31 students collected Sat at SwampHacks, split by student (no student in both).
| Model                  | Macro-F1 (95% CI)  | Acc  | ms/item |
| Majority class         | 0.21               | 0.48 | 0       |
| Zero-shot LLM prompt   | 0.63 (0.55-0.70)   | 0.71 | 900     |
| Ours (fine-tuned X)    | 0.78 (0.71-0.84)   | 0.82 | 40      |
Worst confusion: "sign error" vs "unit error" (14 cases) - see notebooks/02-error-analysis.ipynb
```
(The numbers above are placeholders for format only.)

## 5. Pitfalls that get marked down by code-reading judges

| Pitfall | Why it hurts | Fix |
|---|---|---|
| One giant notebook holds the whole project | It won't rerun (only ~24% of GitHub notebooks do; Pimentel), it has hidden state, and it reads as "not engineered" | Logic in `src/`, notebooks only for EDA/figures, "Restart & Run All" before pushing |
| Secrets committed | 23.8M secrets leaked to public GitHub in 2024; 70% of those leaked in 2022 were still active ([GitGuardian 2025](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2025/)). A judge who sees a key in history assumes carelessness | `.env` in `.gitignore` from commit 1, `.env.example`, and run a secret scan (gitleaks/trufflehog) before going public. If one leaks, rotate it: it stays in history |
| No or unpinned requirements | Can't run; fails PwC checklist item 1 | Pinned `requirements.txt` + Python version |
| Results only in the slides, no eval code | Fails PwC items 3 and 5; the claim can't be checked | `evaluate.py` + `metrics.json` + table |
| No baseline / test on train / random split on temporal or grouped data | DS judges spot it in seconds | See section 4 |
| Dead code, commented-out blocks, `old_v2.py`, `test2.ipynb` | Reads as messy ("avoid commenting/uncommenting code to control behavior", Wilson et al.) | Delete it; git keeps history |
| Generated boilerplate and template leftovers (default package names, unused deps, scaffolding files, generic README filler) | Durai calls these "assembled, not engineered" signals | Prune deps, rename everything, write the README by hand with real numbers |
| Fake tests (no assertions, broken imports) | Worse than no tests | 3-6 real tests: data schema, no split overlap, model loads and predicts, metric on a hand case, beats baseline on sample |
| One giant commit / commits outside the event window | Looks like pre-existing code; can disqualify | Small commits all through the event, descriptive messages |
| README overclaims ("AI-powered", "accurate") with no evidence | Durai's top red flag; the track says "explain design choices, not just results" | Every claim links to a number or a file |
| AI wrapper with no ML of our own | Fails "AI must be central... non-trivial" | Train/tune/evaluate something ourselves; the LLM only explains |
| Huge data/model files in git, or the demo depends on a live API key | Clone fails; the demo breaks for the judge | Git-ignore data, commit a tiny sample, fetch script, cached fallback |
| No license, no data source/license | Basic hygiene ("make the license explicit", Wilson et al.) | MIT LICENSE + data/README.md |

## Sources
- DSI: [ufdsi.com](https://ufdsi.com), [about](https://ufdsi.com/about), [symposium 2026](https://ufdsi.com/symposium/2026), [GitHub dsiufl](https://github.com/dsiufl), [WorkshopArchive](https://github.com/dsiufl/WorkshopArchive), [UF Stats Hacklytics](https://stat.ufl.edu/featured/2026/uf-data-science-informatics-competed-at-hacklytics), [AIIRI Org of Year](https://ai.research.ufl.edu/dsi-wins-uf-organization-of-the-year/), [Eng student orgs](https://www.eng.ufl.edu/undergraduate/programs-and-partnerships/center-for-experiential-learning/student-organizations/list-of-student-organizations/name/data-science-and-informatics), [matheusmaldaner](https://github.com/matheusmaldaner)
- Repo/code guidance: [Papers with Code checklist](https://github.com/paperswithcode/releasing-research-code), [cookiecutter-data-science](https://cookiecutter-data-science.drivendata.org/) + [opinions](https://cookiecutter-data-science.drivendata.org/opinions/), [Wilson et al. 2017](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005510), [Sandve et al. 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3812051/), [Mitchell et al. model cards](https://arxiv.org/abs/1810.03993), [Breck et al. ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/), [Pimentel et al. 2019](https://2019.msrconf.org/details/msr-2019-papers/36/A-Large-scale-Study-about-Quality-and-Reproducibility-of-Jupyter-Notebooks)
- Judges: [Durai, The git log never lies](https://hackernoon.com/the-git-log-never-lies), [DEV: GitHub at hackathons](https://dev.to/arindam_1729/how-to-use-github-effectively-at-hackathons-4emh), [SSI hackday criteria](https://software.ac.uk/cw19-hackday-judging-criteria), [codejam-v5 rules](https://github.com/codelif/codejam-v5), [ETHRome rules](https://ethrome25.notion.site/Hackathon-Rules-160d00c099af8156b330c0bac363c3ed)
- Evals: [Lones](https://arxiv.org/html/2108.02497v5), [Kapoor & Narayanan](https://pmc.ncbi.nlm.nih.gov/articles/PMC10499856), [REFORMS](https://reforms.cs.princeton.edu/appendices.pdf), [Dodge et al.](https://arxiv.org/abs/1909.03004v1), [Husain evals](https://hamel.dev/blog/posts/evals/)
- Secrets: [GitGuardian 2025](https://blog.gitguardian.com/the-state-of-secrets-sprawl-2025/)
