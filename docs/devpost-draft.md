# Devpost draft ([NAME])

**Status:** draft. `[NAME]` is a placeholder until @luanamaldaner picks the name (options in docs/story.md). Every stat links to the source we already cite in the repo docs; nothing new was added here. Before submitting, re-check the "Confirm before submit" list at the bottom.

**Tagline (pick one when the name is set):** "Guess in pencil. Truth in ink." / "Bet first. Then reality grades you."

---

## Inspiration
Every AI tutor now has a "Socratic" mode, and every one of them still lets you skip straight to the answer ([competitors.md](research/competitors.md)). We kept coming back to one classroom finding: students who only *watched* a physics demo understood it no better than students who never saw it, while students who *predicted* the outcome first did significantly better ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). We wanted that "wait, really?" moment for any topic, not just the ones a course author already built.

## What it does
You type any topic, or tap one of our showcase rounds. Then:

1. **Predict.** Drag a slider or pick an option, and tell us how sure you are.
2. **Lock it in.** No take-backs. The truth isn't even shown until you lock.
3. **Reveal.** The real answer is drawn in ink over your pencil guess, and the gap between them is shaded. A stamp lands: *Called it*, *Close* or *Way off*.
4. **Your wrong idea gets a name** ("Random means evenly mixed"), with why it's tempting, the right model in two sentences, and a source.
5. **Bust it later.** Wrong ideas go into your collection and come back as new questions until you've beaten them.

Example: "Flip a fair coin 100 times. What's the longest run of the same side?" Make your guess. The computed mean is 6.98, and a run of 5 or more shows up 97.2% of the time ([showcase-facts.md](research/showcase-facts.md)).

**Why there are no points.** Everyone gamifies learning with points. The research says points can backfire: in a semester-long class, badges and a leaderboard lowered motivation and final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)), and across 128 experiments, expected rewards undermined people's own motivation ([Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf)). So we made the feedback the reward. You bet first, reality plays out over your guess, and your exact wrong idea gets a name. Then you bust it.

## How we built it
- **The model writes the question, our code computes the truth.** Gemini 3.5 Flash-Lite turns a topic into a compact round with structured JSON output: the misconceptions first, then the questions, with every wrong option or slider range mapped to one misconception. The truth comes back as a *spec* (an expression or a named simulation plus parameters), never as a number we trust blindly.
- **Checks before anyone sees a round.** Our backend computes every truth, drops items where the model's claimed answer disagrees, lints the rest (sliders fully covered, no answer in the prompt). When code can't compute the answer, a second model, Gemma, answers it blind without the key, and anything they disagree on gets dropped; everything else is computed by code.
- **Showcase rounds are hand-checked** (coin streaks, a positive medical test, the birthday problem) and work offline.
- **Free tier, on purpose.** Flash-Lite falls back to Gemini 3.1 Flash-Lite and then Gemma if we hit a quota; every generated round is cached by topic; the public endpoint has a per-IP rate limit and a daily cap.
- **Stack:** FastAPI + Pydantic backend, React + TypeScript + Vite frontend, deployed as a static site on GitHub Pages.

## Challenges we ran into
- **Making "any topic" honest.** Models invent confident wrong numbers. Moving the truth into code plus the blind check fixed that, at the cost of fewer questions on some topics. We'd rather say "we can't check this one" than guess.
- **Our full round schema was too complex** for the API's structured output, so the model fills a compact schema and our code expands it.
- **Speed.** A new topic takes roughly 8-12 seconds to build (our estimate, [gemini.md](research/gemini.md#4-latency)), so we run the blind check in parallel with a time limit, and you start on a showcase round while yours builds.

## Accomplishments that we're proud of
- The reveal: your pencil guess frozen on screen while the real answer inks in over it.
- No number in a round comes straight from the model. The truth is always computed or sourced.

## What we learned
- Confident mistakes are the best teaching moment: people fix high-confidence errors best ([hypercorrection review](https://pmc.ncbi.nlm.nih.gov/articles/PMC3604148)), which is why we ask how sure you are.
- Learning that works often *feels* harder; in one study, students in active learning learned more but felt they learned less ([Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116)). So we tell players that up front.
- A second, blind model catches a lot, but not everything. Checking is the product.

## What's next
- Spaced review that brings each unbusted idea back on growing gaps.
- More truth widgets (motion, ordering) so more topics can be fully checked.
- Optional sign-in to keep your collection across devices.

## How we used AI tools
> **PLACEHOLDER: wording decided by me at submission.** Do not finalize here. The final text must honestly state which AI tools were used in building the project and how (SwampHacks XII requires AI/LLM tool use to be disclosed), separately from the Gemini/Gemma models the product itself calls at runtime.

## Built with
- Python, FastAPI, Pydantic, Uvicorn
- Google Gen AI SDK (`google-genai`): Gemini API (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`), Gemma 4 (`gemma-4-31b-it` blind check, `gemma-4-26b-a4b-it` fallback)
- React, TypeScript, Vite
- GitHub Pages
- uv, pytest, Ruff, oxlint

---

### Confirm before submit (not part of the Devpost text)
- **SQLite:** in the plan (NOTES.md "local SQLite until the Tiger URL arrives") but not in the code as of this draft; the cache is files on disk. Add SQLite (or Tiger Data) to "Built with" only if it ships.
- **Hosting:** add Vultr or Render only if the backend is deployed there.
- **8-12 s build time** is an estimate from gemini.md, not a measurement on our key. Replace with a measured number if we time it, or keep "roughly".
- **The collection / spaced review / confidence step:** keep in "What it does" only if they're in the demo build; otherwise move them to "What's next".
- Word count of the body (Inspiration through Built with, excluding this list): ~860.
