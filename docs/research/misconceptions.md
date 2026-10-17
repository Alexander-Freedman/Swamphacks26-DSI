# Misconceptions + detecting the exact one (#19)

**Bottom line:**
- **The wrong option is the main signal.** Each wrong option maps to exactly one documented misconception, so the diagnosis is a lookup.
- **For any topic, recall documented, named misconceptions with a source;** don't invent them. LLM-invented distractors rarely match real student errors.
- **A typed reason only gets classified against a short per-item list** (≤6 + "other"; ~80-92% top-1 *estimated*, falling to ~40% at 100 options).
- **"Right answer, wrong reason" triggers a follow-up item, not a verdict.**
- **Only name a misconception after 2+ consistent signals.**

# Misconception diagnosis for an any-topic predict-then-reveal app

Research notes, Oct 16 2026. Builds on docs/deep-mental-models.md. Tags: [verified] = checked against the source this session. [known; not re-fetched this session] = standard, well-known field fact that I didn't re-fetch this session (cite the original paper if we put it in the write-up).

## TL;DR for us

1. **The reliable signal is the wrong option they pick, not their free text.** Concept inventories (FCI, CINS, CAOS) work because each distractor is written to match one documented misconception. If every wrong option maps to exactly one misconception, then "which misconception" reduces to a table lookup and is 100% consistent. The real question is whether the mapping itself is valid.
2. **LLMs are weak at inventing the misconceptions real students hold.** They are good at writing clean stems and math-valid distractors. They are much worse at predicting which wrong answers students actually choose (Feng et al. 2024; Scarlatos et al. 2024; EDM 2024 poster). ChatGPT-written FCI-style items had decent psychometrics, but the authors said they had *no diagnostic capacity* because the distractors didn't line up with misconceptions (Küchemann et al. 2024). So for any-topic mode, ask the model to recall *documented* misconceptions (named, with a source) rather than invent them. Hand-curate our showcase topics.
3. **Free-text reason to fixed-list classification works when the list is short.** GPT-4 got 91.9% accuracy choosing among 4 candidate misconceptions, but only 39.8% among 100 (Liu et al. 2023). Fine-tuned systems on 15 fixed questions reach MAP@3 ≈ 0.95 (Kaggle MAP 2025). Open-catalog retrieval over about 2.6k misconceptions only reaches MAP@25 around 0.56 (13th place, Eedi Kaggle 2024). Design rule: classify against the **3-6 misconceptions for this item**, plus "other/unknown" and "correct reasoning". Never classify against a global list.
4. **"Right answer, wrong reason" is the hard case, and it's where we can stand out.** Two-tier test studies typically find around 7-10% false positives (right answer, wrong reason) [verified, regional journals]. LLMs are bad at spotting these: in Imran & Bulathwela (AIED 2026), a frontier LLM got 57% vs 84% for fine-tuned T5, with about 4 false alarms per real detection. Only flag it when the reason clearly matches a listed misconception, and phrase it softly.
5. **Expected accuracy for our app (my estimate from the numbers above):** MC distractor lookup gives about 100% consistency. Its validity is about 70-90% on curated topics, unknown on generated ones. Short-reason classification into an item's 3-6 options plus "other" should land around 75-90% top-1 with a strong LLM, and around 60-75% when the student's real misconception isn't in the list. Slider/drag answers need region-to-misconception rules: deterministic where the topic has a computable answer.

---

## 1. Misconception research across subjects

### Concept inventories (the gold standard for "distractor = misconception")
| Inventory | Subject | Size | Notes |
|---|---|---|---|
| Force Concept Inventory (Hestenes, Wells, Swackhamer 1992) [known; not re-fetched this session] | Newtonian mechanics | 30 MC | Distractors come from a taxonomy of about 30 "common-sense" beliefs: impetus, active force, "motion implies force", heavier falls faster, the largest object exerts the larger force (Newton's 3rd), and so on. The canonical example. |
| Bao & Redish model analysis (AJP 2001; PRST-PER 2006) [verified] | FCI/FMCE data | n/a | Maps answer choices to student *models*, then builds per-student model vectors and a class density matrix. Students hold several models at once and switch by context. This is the theory behind "answer patterns across items" ([arXiv physics/0207069](https://arxiv.org/abs/physics/0207069)). |
| Bayesian IRT on FCI distractors (MIT thesis) [verified, snippet] | FCI, about 17k students | n/a | Pulls interpretable misconceptions out of distractor choices ([MIT DSpace](https://dspace.mit.edu/entities/publication/26cb6ba4-e8af-4a5a-ab2d-4a070a9952e4)). |
| CINS, Conceptual Inventory of Natural Selection (Anderson, Fisher, Norman 2002) [verified] | Evolution | 20 MC | "Employs common alternative conceptions as distractors". Examples: need-driven change (Lamarckian), individuals evolve, acquired traits are inherited, all variation is equal ([Anderson 2002 PDF](https://eclass-b.uoa.gr/modules/document/file.php/ECD129/Anderson.pdf); CANS covers more misconceptions, [Evo Edu Outreach 2024](https://link.springer.com/article/10.1186/s12052-024-00210-3)). |
| CAOS (delMas, Garfield, Ooms, Chance 2007) [verified, abstract] | Intro statistics | 40 MC | Pre/post conceptual items ([CAUSE](https://www.causeweb.org/cause/node/7089)). |
| SRA, Statistical Reasoning Assessment (Garfield 2003) [known; not re-fetched this session] | Probability/stats | 20 MC | Scores 8 correct-reasoning scales and 8 misconception scales. Examples: outcome orientation, good samples must be representative of the population, law of small numbers, equiprobability bias, correlation implies causation. **The best model for us: the scoring is literally answer-to-misconception.** |
| Calculus Concept Inventory (Epstein 2007/2013) [verified, size] | Differential calculus | 22 MC | Conceptual, not computational ([UMich](https://crlt.umich.edu/sites/default/files/resource_files/CalculusConceptInventory.pdf)). Its validity is disputed ([AMS blog 2016](https://blogs.ams.org/matheducation/2016/07/25/does-the-calculus-concept-inventory-really-measure-conceptual-understanding-of-calculus/)). |
| Chemistry Concepts Inventory (Mulford & Robinson 2002); Genetics Concept Assessment (Smith et al. 2008); Thermo/Circuits inventories (DIRECT) [known; not re-fetched this session] | Chem, bio, EE | 20-30 MC | All use the same design. |

### Common misconception catalogs (seed lists for showcase topics) [known; textbook-level]
- **Probability:** gambler's fallacy (a "hot hand" is the mirror image), representativeness (HHTHT "more random" than HHHHH), base-rate neglect (medical test), conjunction fallacy (Linda), equiprobability bias (sum of two dice), outcome orientation, law of small numbers (small samples should look like the population), Monty Hall "it's 50/50 now". Sources: Tversky & Kahneman 1974 and 1983; Konold 1989 (outcome approach); Lecoutre 1992 (equiprobability).
- **Mechanics:** motion implies force or impetus, heavier falls faster, force in the direction of motion at the top of a throw, Newton's 3rd pairs unequal for unequal masses, curved-path memory (ball leaving a spiral tube keeps curving), acceleration is zero at the top.
- **Calculus:** derivative as "a slope" with no rate meaning, confusing f with f', limit as an unreachable bound, steeper means bigger value, integral is only area so it can't be negative, the tangent line touches at exactly one point.
- **Biology:** need-driven evolution, individuals adapt, plants get mass from soil (actually CO2), energy is recycled in ecosystems, diffusion stops at equilibrium.
- **Economics:** zero-sum trade, lump of labor, fixed pie, sunk-cost reasoning, price controls have no side effects, nominal vs real confusion.
- **History:** presentism, single-cause explanations, "people back then thought the earth was flat" (myth of the flat earth), great-man narratives. These are fuzzier: history "misconceptions" are often factual myths rather than models. The predict format suits quantities and dates on a timeline (slider).

### How distractors are designed to map to misconceptions
- **Sequence for building an inventory:** interviews and open-ended answers first, then wrong answers taken from real student wording become distractors, then validate with think-alouds and psychometrics (FCI, CINS, Treagust). Distractors come from data, not imagination.
- **Two-tier tests (Treagust 1988/1995)** [verified, secondary]: tier 1 is the answer and tier 2 is the reason, picked from options that encode misconceptions. **Three-tier** adds "how sure are you?", which separates a misconception (wrong + confident) from a knowledge gap (wrong + unsure). **Four-tier** asks confidence on both tiers. Hestenes & Halloun 1995 framed the core problem as false positives (right answer, wrong reason) and false negatives (wrong answer, right reason). Reported rates: FP 9.07%, FN 6.47% (three-tier, human reproduction, [Hasyim et al. 2018](https://journal.um.ac.id/index.php/jps/article/view/11684)); FP 10.0%, FN 7.4% (two-tier, geometry, [Agustyarini & Ningrum 2023](https://journal.ikipsiliwangi.ac.id/jpp/article/view/27341)).
- **Eedi diagnostic questions** [verified]: 4-option math MCQs, with each wrong option tagged with one misconception from Eedi's catalog. The Kaggle catalog had **2,587 misconceptions** and **1,869 training questions**. It's the largest public distractor-to-misconception dataset ([Kaggle](https://kaggle.com/c/eedi-mining-misconceptions-in-mathematics), [labelbank/silver repo](https://github.com/DaoyuanLi2816/Kaggle-Eedi-Mining-Misconceptions-in-Mathematics-Silver-Medal)).

### Eedi "Mining Misconceptions in Mathematics" (Kaggle, late 2024) [verified]
- **Task:** given a question and one wrong option, rank the catalog misconceptions. Scored by MAP@25. Many test misconceptions were unseen in training.
- **1st, MTH 101 (Raja Biswas):** two-stage retrieve then rerank on Qwen. Stage 1 is two LoRA, contrastive Qwen retrievers trained on 10k synthetic + 1.8k real examples. Stage 2 uses LLM-generated short student rationales to help the reranker ([Eedi blog](https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions)).
- **2nd:** CoT with Qwen2.5, synthetic augmentation, and listwise rerank of the top 25. **3rd:** Qwen2.5-14B embeddings plus a Qwen2.5-32B reranker, with a scaling factor that boosts unseen misconceptions.
- **Efficiency 2nd:** all-MiniLM-L6-v2 with no fine-tuning. Adding LLM-written *explanations* of each misconception to the catalog boosted retrieval a lot. **Cheap trick we can use:** embed "misconception name + 1-line explanation", not just the name.
- **Score level:** a top-15 solution (fine-tuned Qwen2.5-14B retriever with 32B/72B listwise rerankers) got **private MAP@25 0.561** ([Kaggle discussion](https://kaggle.com/c/eedi-mining-misconceptions-in-mathematics/discussion/551651)). I couldn't verify the winner's exact score. Lesson: **open-catalog misconception identification is hard even with 72B rerankers**. Generic LLMs "don't handle this out of the box" (Eedi).

### MAP: "Charting Student Math Misunderstandings" (Kaggle, 2025) [verified]
- **Data:** 52k+ student *explanations* of their MC answers on 15 questions. Labels say whether the explanation is correct, whether it shows a misconception (or neither), and which type ([Crossley et al., AIME-Con 2026](https://aclanthology.org/2026.aimecon-main.33/)).
- **Results:** 1,850+ teams. Top **MAP@3 above 0.948**, and the top 1,000 were all above 0.941. Winners used shared-prefix classification, soft labels plus 80k synthetic examples, and 72B models run only on low-confidence cases ([Learning Agency case study](https://the-learning-agency.com/the-cutting-ed/article/case-study-math-misconceptions-competition)).
- **Caveat:** train and test used the **same 15 questions**, so this is closed-set, per-item classification with lots of labels. That is our "per-item short list" setting, but with training data we won't have. MiRAGE (retrieval + CoT + rerank) reports MAP@1/3/5 = 0.82/0.92/0.93 on the same kind of data ([arXiv 2511.01182](https://arxiv.org/abs/2511.01182)).

## 2. Methods to detect a specific misconception from an answer

| Method | Reliability | Evidence | Fit for us |
|---|---|---|---|
| **Distractor-to-misconception lookup** | Deterministic. Validity depends on the distractor design: curated inventories are strong, LLM-invented ones are weak. | FCI, CINS, SRA. Küchemann 2024: GPT-written distractors were "not aligned with student misconceptions" | **Primary signal.** |
| **Slider/drag region rules** | Deterministic if the truth is computable. Each misconception predicts a value or shape, so the nearest predicted value wins. | Our ghost idea (deep-mental-models.md) | Good where a topic has numbers (probability, physics, econ). The engine must emit "misconception X predicts value v". |
| **Two-tier: answer + picked reason** | High. Separates FP from FN. | Treagust. FP/FN about 7-10% | Cheap, with no free text. Use as the default second tier. |
| **LLM classifies a free-text reason into the item's short list** | GPT-4 picking 1 of 4 candidates: **91.9%**. 1 of 100: **39.8%** (Liu et al. 2023, Eedi data, [ar5iv](https://ar5iv.labs.arxiv.org/html/2310.02439)). GPT-4o grading physics explanations: 0-3% discrepancy vs humans ([Savage & Rebello 2025](https://arxiv.org/abs/2508.14823)). Our prior notes cite mean κ≈0.77; I couldn't re-verify that this session. | Prompted LLMs lost to a ModernBERT classifier on one physics misconception ([FLAIRS 2026](https://journals.flvc.org/FLAIRS/article/view/141769)). In Eedi tutor dialogue with 546 labels, zero-shot LLM classification "scores poorly" and TF-IDF beats it at top-1 ([arXiv 2602.02414](https://arxiv.org/html/2602.02414v1)). | Use it, but **only with ≤6 candidates + "other" + "correct reasoning"**. |
| **Retrieve then rerank over a big catalog** | MAP@25 about 0.56 open-set (Eedi Kaggle) | See above | Only needed for "unknown misconception" fallback search. Not core. |
| **Generate → retrieve → rerank** (LLM writes a free misconception, then we match it to the catalog) | Beats baselines on Eedi dialogue. Fine-tuned 7B beats a zero-shot frontier model on some metrics. | [Mitton et al. 2026](https://arxiv.org/abs/2602.02414) | Our "unknown misconception" path: generate a description, embed it, match against the list, and if similarity is low, show it as new. |
| **Patterns across items + confidence** (Bayesian / model analysis / knowledge tracing) | Stronger than any single item. Students hold mixed models (Bao & Redish). | Model analysis; Bayesian IRT on FCI; three-tier confidence | Keep a per-misconception posterior across 3-5 items. "We think you hold X (3 of 4 answers fit)" is far more defensible than one-shot labels. |

Other numbers worth knowing:
- **Code explanations** ([Oli et al. 2025, arXiv 2501.10365](https://arxiv.org/abs/2501.10365)): zero-shot GPT-4 beat LLaMA3 and Mistral. Its "diagnostic" rubric scores were only about 0.38-0.59. Fine-tuning helped.
- **LLM feedback validity** ([arXiv 2403.01304](https://arxiv.org/abs/2403.01304)): GPT-4 rubric labels agreed with humans about 76% of the time. Human-human κ was only 0.29-0.53, so the ceiling is low when labels are fuzzy.
- **Correct-answer trap** ([Imran & Bulathwela, AIED 2026](https://arxiv.org/abs/2605.23925)): 84% for fine-tuned T5 vs 57% for a frontier LLM. 71% of failures fall on item types where flawed reasoning still produces the right answer. The best model had about 4 false alarms per real catch.
- **LLMs simulating a student with a given misconception** (Liu et al. 2023): GPT-4 produced the matching wrong answer only 53-68% of the time. That's relevant if we have the engine "self-check" distractors by role-playing the misconception.

## 3. Design recommendation for ANY topic

### Per-topic generation contract (one LLM call, structured JSON)
For a typed topic, the engine returns 3-5 items. Each item has:
- `stem`, `answer_type` (mc | slider | order | short_reason), and `truth` (the value or option, plus a computation if one exists).
- `misconceptions`: 3-6 entries, each `{id, name, one_line, refutation (≤2 sentences), predicted_answer (option or value/range), source (named effect/inventory/paper or "none"), confidence}`.
- Every wrong MC option has `maps_to` = exactly one misconception id. No option maps to two misconceptions, and no "filler" options. (Eedi's preprocessing even dropped questions whose choices shared a misconception, Liu 2023.)
- `reason_options`: a second tier of 4-5 short reasons, one correct and the rest each tied to a misconception.

### Verification (cheap, can run at request time)
1. **Truth check:** where computable (probability, kinematics, compound interest), compute it in code or simulation and reject the item if the LLM's truth disagrees. Otherwise ask a second model call to solve the item blind, and drop the item if it disagrees.
2. **Self-consistency of the mapping:** for each misconception, a separate call role-plays "a student who believes {one_line}" and answers. Keep the distractor only if the role-play picks the mapped option (majority of 3). GPT-4-class models hit only about 55-68% on this for math (Liu 2023), so expect to drop or regenerate about a third. That is the point of the check.
3. **Source grounding:** require `source` to be a named, checkable thing (e.g. "gambler's fallacy, Tversky & Kahneman 1971", "FCI item cluster: impetus"). Show it in the UI as "known misconception". Misconceptions with no source get labeled "possible misconception" and lower confidence. LLMs are better at *recalling* documented misconceptions than predicting novel student errors (Feng 2024, Küchemann 2024).
4. **Human-curated seeds for demo topics:** hand-write 3-4 showcase topics (probability: Monty Hall/base rates; mechanics: dropped ball/projectile; evolution: CINS-style; calculus: f vs f'). Each is checked against the inventory or catalog above. Use them as few-shot examples in the generator, which also improves any-topic output.
5. **Cache and freeze:** once a topic's set passes checks, store it so the demo is reproducible and the misconception stats aggregate across users.

### Diagnosis flow at answer time
1. MC: look up `maps_to`. Slider: pick the nearest `predicted_answer` within tolerance, and say "no known pattern" if it's far from all of them.
2. Second tier (reason picked, or 1-line free text): LLM classifies into the item's own list plus `CORRECT_REASONING` plus `OTHER`, returns a confidence, and is allowed to abstain.
3. Combine answer and reason:
   - Wrong answer + matching reason: **confident diagnosis**. Name it and show the refutation.
   - Wrong answer + correct reason (false negative): "slip, not a misconception". Show the step that went wrong.
   - **Right answer + misconception reason (false positive):** "Right answer, shaky reason". Show the item where that belief would fail. Only fire this when the classifier confidence is high, because LLMs give about 4 false alarms per real catch here (Imran 2026). Better still, confirm with a follow-up item designed so that belief yields a wrong answer.
   - Wrong answer + reason = OTHER: **unknown misconception**. Run generate → match: the LLM writes a 1-line description of their belief, and we embed it and compare it to the topic list. If it's close, merge. If not, show "new pattern: {description}" marked unverified, and log it to grow the list.
4. Across items: keep a per-misconception score (simple Bayesian update with P(pick option | holds misconception) ≈ 0.7, P(pick | not) ≈ 0.1). Only call it "your misconception" after 2+ consistent signals. Add a 1-tap confidence slider (three-tier) to separate "guessing" from "believes it".

### Expected accuracy (to quote honestly)
- MC distractor lookup: deterministic. Validity is high on curated/inventory topics. On generated topics it's unknown until checked, and Küchemann-style evidence suggests raw LLM distractors are often not diagnostic. The self-consistency and source checks are what make it defensible.
- Reason classification into ≤6 + other: **about 80-92% top-1** (anchored on GPT-4 at 91.9% with 4 candidates and MAP@1 ≈ 0.82 for MiRAGE). It **drops toward about 40%** if we let the list grow to around 100.
- Right-answer-wrong-reason detection: **unreliable (about 57% LLM accuracy, high false-alarm rate)**. Treat it as a prompt for a follow-up item, not a verdict.
- Human agreement ceiling: when categories are fuzzy, human-human κ is only 0.3-0.5 (2403.01304). With crisp categories, inventories reach high agreement. So keep the misconception definitions crisp and mutually exclusive.

### Demo/pitch angle
"Every wrong option is a known misconception, checked three ways: computed truth, a simulated student who holds that belief, and a named source." Cite Eedi's Kaggle work (1,850+ teams, MAP@3 0.948 on fixed items vs about 0.56 MAP@25 open-catalog) to explain *why* we classify against a short per-item list, not a giant catalog.

## Sources
- Eedi Kaggle recap: https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions
- Eedi Kaggle 13th-place-style write-up: https://kaggle.com/c/eedi-mining-misconceptions-in-mathematics/discussion/551651 ; silver repo: https://github.com/DaoyuanLi2816/Kaggle-Eedi-Mining-Misconceptions-in-Mathematics-Silver-Medal ; 5th: https://github.com/ebinan92/Eedi-5th-solution
- MAP 2025 case study: https://the-learning-agency.com/the-cutting-ed/article/case-study-math-misconceptions-competition ; Crossley et al. AIME-Con 2026: https://aclanthology.org/2026.aimecon-main.33/ ; MiRAGE: https://arxiv.org/abs/2511.01182
- Liu et al. 2023, Novice Learner and Expert Tutor: https://arxiv.org/abs/2310.02439
- Mitton et al. 2026, Generate-Retrieve-Rerank: https://arxiv.org/abs/2602.02414
- Imran & Bulathwela 2026, Correct Answer Trap: https://arxiv.org/abs/2605.23925
- Feng et al. 2024 distractor generation: https://arxiv.org/abs/2404.02124 ; Scarlatos et al. 2024 (BEA): https://aclanthology.org/2024.bea-1.19.pdf ; EDM 2024 poster: https://educationaldatamining.org/EDM2024/proceedings/2024.EDM-posters.113/index.html
- Küchemann et al. 2024, ChatGPT concept inventory items: https://pmc.ncbi.nlm.nih.gov/articles/PMC11493723/
- Savage & Rebello 2025: https://arxiv.org/abs/2508.14823 ; FLAIRS 2026 RAMP: https://journals.flvc.org/FLAIRS/article/view/141769
- Oli et al. 2025 code explanations: https://arxiv.org/abs/2501.10365 ; Feedback validity: https://arxiv.org/abs/2403.01304
- Bao & Redish model analysis: https://arxiv.org/abs/physics/0207069 ; Bayesian IRT FCI: https://dspace.mit.edu/entities/publication/26cb6ba4-e8af-4a5a-ab2d-4a070a9952e4
- CINS: https://eclass-b.uoa.gr/modules/document/file.php/ECD129/Anderson.pdf ; CANS review: https://link.springer.com/article/10.1186/s12052-024-00210-3 ; CAOS: https://www.causeweb.org/cause/node/7089 ; CCI: https://crlt.umich.edu/sites/default/files/resource_files/CalculusConceptInventory.pdf , https://blogs.ams.org/matheducation/2016/07/25/does-the-calculus-concept-inventory-really-measure-conceptual-understanding-of-calculus/
- Two-tier FP/FN rates: https://journal.um.ac.id/index.php/jps/article/view/11684 ; https://journal.ikipsiliwangi.ac.id/jpp/article/view/27341
