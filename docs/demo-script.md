# Demo script: the table demo (Learn flow, seasons + 20 s of orgo)

What the judge sees and hears, click by click, for the **current** flow: Home → a Learn topic → 8 steps (guess, one true fact, compare, stress, draw, tell it apart, carry it over, what you caught) with the why rail. Matched to main @ 480310b and the live API, walked Sun Oct 18 ~2-3 AM at 1440 px and 390 px.

**Time budget:** judges spend ~3 min at the table, so **1:45 of demo, ~1:15 of questions**. Keep a 60-second cut for rushed judges.

Live: https://onionskin.study (old link https://alexander-freedman.github.io/Swamphacks26-DSI/ redirects there). API: https://45-77-118-201.sslip.io.

## Why not run it all live (measured)

| Call | Live time |
|---|---|
| Guess (`POST /api/learn/why-we-have-seasons/guess`) | 4.3 s |
| Anchor | 4.9 s |
| Stress, per card | 4.5 s |
| Transfer | 6.1 s |
| A new typed topic (Bernoulli, Doppler) | 1 to 2.5 min |

Measured Sun Oct 18 ~2:45 AM, one run each. A full live session spends ~40 s waiting on the model, so **only the guess runs live**. Everything else is pre-run.

## Demo mode = pre-staged tabs (no code)

There is no `?demo` mode. These tabs do the same job:

| Tab | URL | State | Between judges |
|---|---|---|---|
| 1 Live | `?learn=why-we-have-seasons` | Fresh guess screen ("Why we have seasons? Say it in your own words.") | Reload (state is in memory, so a reload is fresh) |
| 2 Played | `?learn=why-we-have-seasons` | Played start to finish beforehand with good answers. All 8 steps stay stacked on the page, including one stress card that BREAKS and the done card | **Never reload.** Keep a spare copy (2b) |
| 3 Orgo | Home → Organic chemistry card (`?learn=sn2-reaction`) | Guess submitted; sitting on *Build ethanol* | Press *Clear* |
| 4 Research | `?research=1` | Scrolled to "Why no points, XP, streaks…" | — |
| Phone | Backup video, downloaded | For a dead laptop or dead wifi | — |

If asked why it isn't all live: "Live, each step takes about five seconds because a model reads your free-text answer. We ran this one earlier so you can see the whole arc. Tab one is live."

## The 1:45 script

**Roles:** narrator talks and keeps time; driver clicks and takes technical questions. Both learn both.

| Time | Screen / driver | Narrator says |
|---|---|---|
| 0:00 | Tab 1, seasons guess screen | "Before we show you anything: why is it hotter in summer?" Let the judge answer. (Most say "Earth is closer". Harvard graduates said the same in the documentary *A Private Universe*.) |
| 0:12 | Type the judge's answer, or "summer is when Earth is closer to the Sun" → Submit. ~4 s wait | "It starts with your guess, not a lecture. It's checking your answer against the misconceptions documented for this topic." Lands on **sounds like: Summer is when Earth is closer**. |
| 0:25 | Tab 2 → *One true fact*: the noon-Sun curve over the year at 40° N | "Pencil is your guess, ink is reality, the gap is the lesson. June 21: 73.5°. Computed in code, never by the AI." |
| 0:40 | Scroll to *Compare two cases* | "Same distance from the Sun, opposite seasons: New York summer, Buenos Aires winter. Distance can't explain it." |
| 0:50 | Scroll to *Stress test*; point at the card that BREAKS | "Then we push your rule to extremes. No tilt: the curve goes flat, no seasons. A rule that only works in easy cases breaks here." |
| 1:05 | Point at the why rail (*What you're doing / Why it works* + citation) | "Every step has a reason and the paper behind it. And there are no points or streaks, on purpose: rewards change your goal from understanding to scoring." |
| 1:20 | Tab 3: *add carbon*, then *add hydrogen* ×5. The 5th H lands loose: **drag it onto the carbon** (keyboard: Enter on the H, Enter on the C) | "Same engine for organic chemistry. Give carbon a fifth bond and it names the mistake as you make it." **"A carbon with 5 bonds"** → Undo. |
| 1:35 | Tab 2, done card (*What you caught*) | "It ends by naming the wrong idea you started with and saves it to your notebook. Type any topic and it builds all this in about a minute. The AI grades, code keeps the facts true, you do the thinking." |
| 1:45 | Hands off | Stop. "What would you like to see?" |

**Save for questions:** Ask Onion (hints not answers; doesn't cave when you push), the Calculus card, the Research page (Tab 4), typing a new topic (only if they can wait 1-2 min).

**Never say:** "proven to make you learn faster", "revolutionizes learning", "personalized AI tutor", "gamified", or that a typed topic is instant.

## 60-second cut (rushed judge, or API down)

1. **0:00** "Why is it hotter in summer?" Skip Tab 1 and go straight to Tab 2.
2. **0:10** The guess, its named misconception, the pencil-vs-ink curve.
3. **0:25** The stress card that breaks: "No tilt, no seasons."
4. **0:40** The why rail: "Every step is a learning-science result, and there are no points on purpose."
5. **0:50** The done card: "The AI grades, code keeps it true, you do the thinking." Stop.

## Research lines (decision first, paper second; all on the Research page)

| Decision | Paper | Line |
|---|---|---|
| No points / XP / streaks / leaderboards | Deci, Koestner & Ryan 1999 (128 experiments); Hanus & Fox 2015 | "Expected rewards lowered people's own interest across 128 experiments. In a semester class, badges and a leaderboard lowered motivation and final-exam scores." |
| The AI never just hands over the answer | Bastani et al. 2025, PNAS | "Students with a plain chatbot scored 17% worse once it was taken away; hint-only tutoring removed most of that." |
| Guess first | Richland, Kornell & Kao 2009; Sinha & Kapur 2021 | "Trying first, even wrong, makes the answer stick, as long as the answer follows." |
| Compare two cases | Gentner, Loewenstein & Thompson 2003 | "Comparing two cases side by side carries over to new problems far better." |
| Extremes | Clement 2009 | "Experts test a model at the extremes." |
| Holds its ground when you push back | Kasneci & Kasneci 2026 (**preprint**) | "AI tutors tend to cave under pushback; ours keeps its verdict." |
| Feels harder | Deslauriers et al. 2019, PNAS | "Active learners learned more but felt they learned less." |

Say this before they ask: "These are effects from the literature; we haven't run our own study yet. A pre/post test is first."

## Short answers to likely questions

1. **vs ChatGPT:** "It tells you the answer. Onionskin makes you guess first, runs reality on top, and the model can't write the facts."
2. **vs Khan Academy / Brilliant:** "Those are hand-authored. Type any topic and you get the same eight research-backed steps, starting from *your* wrong idea, with no streaks."
3. **Does it work?** "No data of our own yet; each step is a published effect. A pre/post test is next."
4. **AI vs code:** "For a new topic the model writes the cases and misconceptions as schema-checked JSON; curves and numbers come from mathjs. In a session the model only grades free text."
5. **Model / speed:** "Grading runs on an OpenAI model via the Codex CLI with JSON schemas (Ask Onion falls back to Gemini). ~5 s per graded step, 1-2.5 min per new topic; prebuilt topics are instant."
6. **Wrong grading?** "It happens; we've seen it. That's why the truth on the curve never comes from the model."
7. **No points, won't people quit?** "Rewards change what people come back for. Spaced review is the research-backed way to bring them back."
8. **Who's it for?** "A college STEM student the week before an exam." One person, not "everyone".

## Fallbacks (driver decides, no discussion)

| Breaks | Do | Say |
|---|---|---|
| Live guess slow or API down | Skip Tab 1; start on Tab 2 | "Here's one we ran earlier." |
| Tab 2 lost (reloaded) | Tab 2b | — |
| The 5th-bond drag fails | Keyboard: Enter on the loose H, Enter on the C; or skip orgo | — |
| Site down | Local `vite preview` build opened before the expo, then the phone video | "Here's the two-minute cut." |

Never show a raw error or a spinner.

## Before each judging block

- [ ] https://onionskin.study loads (not blank) and the header says *backend online*.
- [ ] Tabs 1-4 staged as above; Tab 2 shows all 8 steps and one BREAKS card.
- [ ] One full run of the 1:45 with a stopwatch, both roles.
