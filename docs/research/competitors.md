# Competitors and the "isn't this just ChatGPT?" answer (#23)

What each one does for understanding, whether it makes you **commit to a prediction before showing anything**, and whether it **names the misconception**. Hackathon edtech winners are already torn down in [deep-mental-models.md §1](../deep-mental-models.md) (Loomin, Minerva, MathWhiz, Explainable, Mimir, Untangled). I only add the cross-cut here.

## TL;DR
- Every big player now ships a Socratic "don't just give the answer" mode: ChatGPT Study Mode (Jul 2025), Gemini Guided Learning (Aug 2025), NotebookLM Learning Guide (Sep 2025), Khanmigo, Brilliant's Koji. **So "a tutor that asks questions" is not a differentiator.**
- None of the chat tools *forces* a committed prediction and then *shows* the truth as a simulation. You can type a guess, but nothing stops you skipping it, and the "truth" is more text.
- **Brilliant is the real competitor**: it pretests and claims misconception targeting ([about](https://brilliant.org/about/)). But its courses are hand-authored and fixed. We do any topic you type.
- Quizlet's Q-Chat tutor was shut down around June 2025 ([Quizgecko, competitor blog](https://quizgecko.com/es/blog/best-q-chat-alternative), [unverified on quizlet.com]). Quizlet is back to flashcards + Study Guides. The "Quizlet for understanding" slot is empty.

## Comparison

| Product | What it does for "understanding" | Commits a prediction before reveal? | Names the misconception? | Where it's weak |
|---|---|---|---|---|
| **Brilliant** | Interactive, hand-built lessons. Pretests before teaching. AI tutor Koji watches your screen and asks questions ([about](https://brilliant.org/about/), [Koji coverage](https://feedbagel.com/post/brilliants-personal-tutor-koji)) | **Partly**: lessons often ask you to try first, but as MCQ steps, not a free prediction | Claims to "identify exactly where a learner's misconception lies". No named-misconception collection visible to the user [unverified] | Fixed catalog (math/CS/AI). You can't type "coin flips" or "why ice floats". Subscription (~$150/yr [unverified]) |
| **Khanmigo** (Khan Academy) | A Socratic tutor over Khan content that won't give answers. Free for US teachers ([Khan blog](https://blog.khanacademy.org/?p=15159)). Students pay ~$4/mo or get it via districts ([review](https://skillscouter.com/khan-academy-review/)) | No. It asks guiding questions mid-problem | Implicitly, in chat. No structured label | Chat-first. Reports of low student engagement and a 2026-27 redesign, from SEO sites only [unverified] |
| **Quizlet Learn / Study Guides** | Adaptive flashcards: missed terms come back more. Study Guides generated from your notes, on Plus ([help](https://help.quizlet.com/hc/articles/360030841732)) | No (recall, not prediction) | No | Memorization by design. Q-Chat dead since ~Jun 2025 |
| **NotebookLM** | Grounded in *your* sources. Flashcards + quizzes with mastery tracking (spring 2026). "Learning Guide" chat style asks open, probing questions ([Neowin](https://www.neowin.net/news/google-rolls-out-new-learning-guide-feature-to-notebooklm/), [help](https://support.google.com/notebooklm/answer/16179559?hl=en), [flashcard update](https://pasqualepillitteri.it/en/news/1391/notebooklm-april-2026-update-auto-label-flashcards)) | No | No | Only as good as what you upload. Text/audio, no interactive truth |
| **ChatGPT Study Mode** | Socratic, step-by-step, knowledge checks. Free on all plans. Launched Jul 29 2025, with a Stanford SCALE outcomes study announced and no results found ([coverage](https://www.storyboard18.com/how-it-works/chatgpt-gets-study-mode-to-tutor-students-with-socratic-prompts-77777.htm), [datanorth](https://datanorth.ai/news/openai-launches-study-mode)) | No. You can ask it to, but you can toggle it off and get the answer | Sometimes, in prose | One toggle away from answer-giving. Pure text. No memory of *which* wrong idea you hold across sessions |
| **Gemini Guided Learning** | LearnLM-based step-by-step mode with images, diagrams, YouTube, quizzes, flashcards ([TechCrunch](https://techcrunch.com/2025/08/06/google-takes-on-chatgpts-study-mode-with-new-guided-learning-tool-in-gemini/), [9to5Google](https://9to5google.com/2025/08/06/gemini-guided-learning/)). Gemini also renders interactive sims/3D ([Google](https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/)) | No | No | Shows the sim *after* explaining. No commit step, no misconception tracking |
| Hackathon winners (Mimir, Untangled, Loomin, …) | Detailed in deep-mental-models §1 | **None** commit-before-reveal | Mimir and Untangled highlight the wrong step (math only) | Explain/visualize is saturated. Nobody measured anything |

### Hackathon search, 2025-2026
- My Devpost/web searches for "predict first" or "misconception" winners found **nothing new** beyond the teardown set. Closest: [Rigged](https://devpost.com/software/rigged), a Reddit-hackathon physics game whose hook is "prediction + deception" (prize not confirmed [unverified]).
- Adjacent, not a product: Eedi's Kaggle "Mining Misconceptions in Mathematics" (2024, $55k) mapped MCQ distractors to misconception labels. That shows misconception labeling is a recognized hard problem ([Eedi](https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions)). A follow-up paper found fine-tuned classifiers catch only 57% of hidden misconceptions ([CEUR](https://ceur-ws.org/Vol-4282/short7.pdf)). Good for "why this is hard" in Q&A.
- Build With AI: Basics 2026 (an edtech Devpost) announces winners ~Nov 4, after our event ([listing](https://internshala.com/competitions/?p=11290)).

## The gap, in one table

| | Any topic | Forces commit first | Shows truth interactively | Names *your* misconception | Brings it back later |
|---|---|---|---|---|---|
| Brilliant | no | partly | yes | claimed | streak/review |
| Khanmigo / ChatGPT / Gemini | yes | no | Gemini sometimes | in prose | no |
| NotebookLM / Quizlet | your docs | no | no | no | yes (cards) |
| **Us** | **yes** | **yes (locked)** | **yes** | **yes, labeled + collected** | **yes, re-test that misconception** |

## What we say to judges

**One-liner (main):**
> "Every AI tutor explains. Ours makes you bet first, then shows you the truth and names the exact wrong idea you just bet on."

**Alternates:**
1. "Quizlet for intuition: you don't memorize answers, you collect and bust your own misconceptions, on any topic."
2. "Watching a demo teaches nothing. Predicting first does (Harvard physics, Crouch & Mazur 2004). We turned that into an app for any topic."
3. "Brilliant, but for whatever you type in, and it remembers which wrong idea you hold."

## Likely judge Q&A

| Q | Answer (≤ 15 s) |
|---|---|
| **Isn't this just ChatGPT?** | "ChatGPT will answer before you think. Here you can't see anything until you lock a prediction and a confidence. Then you get a simulation, not paragraphs, and a named misconception that comes back in 3 days. Unguarded chat tutors raised practice scores but cut exam scores 17% in a 1,000-student study ([Bastani, PNAS 2025](https://ideas.repec.org/a/nas/journl/v122y2025pe2422633122.html))." |
| ChatGPT/Gemini have study modes now. | "They're Socratic chats. You can toggle them off. Neither locks a prediction, shows the truth interactively, or tracks *which* misconception you hold across sessions. That loop is the product." |
| How is this different from Brilliant? | "Brilliant is a great fixed catalog someone hand-built. We generate the predict → reveal → diagnose loop for any topic you type, and the misconceptions are a collection you come back to." |
| How do you know the misconception label is right? | Point to the deterministic check + closed label list + abstain, and our eval numbers (deep-mental-models §2). If there are no numbers yet: "When it isn't sure, it says so instead of guessing." |
| Why would anyone come back? | "Being wrong is the fun part: a surprise meter, a misconception collection, spaced re-tests of the exact idea you got wrong. We reward surprise, not speed." (see [engagement.md](engagement.md)) |
| Does it work on anything? Calculus? History? | Be honest: "Best on topics with a checkable outcome: physics, probability, math, econ. For fuzzy topics it falls back to a predict-then-compare with sources." Demo a strong one and a surprising one (coin flips). |
| Is predicting first actually proven? | "Yes. Students who only watched demos learned no more than students who never saw them, and predict-first students did significantly better ([Crouch et al. 2004](https://www.compadre.org/IntroPhys/items/detail.cfm?ID=2329)). Confident errors are the ones people fix best (hypercorrection)." |
| What's the Entertainment angle? | "It's a game about being surprised by reality: bet, reveal, collect. Same loop as a trivia game, but the payoff is an insight." |

## Notes / unverified
- Q-Chat shutdown date comes from competitor blogs. I didn't load Quizlet's own notice.
- Khanmigo engagement/redesign claims come only from SEO review sites.
- Brilliant pricing and the extent of Koji's rollout are from aggregators.
- Gemini Guided Learning's 2026 availability wasn't rechecked (launched Aug 2025, free toggle per coverage).
