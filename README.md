# Onionskin

**See your thinking in layers.**

**Live: https://onionskin.study**

Type any topic and Onionskin builds you a short lesson that takes you from a first guess to a model you can actually run in your head. You guess before you're taught, predict from one true fact, compare look-alike cases, push your own rule to the extremes, draw it from memory, tell it apart from its look-alike, and carry it to a new field. At the end it names the wrong idea you started with and shows the fix.

Every step comes from published learning-science research, and the app says so as you go: a rail beside each lesson explains why the step works and cites the paper, and the **Research: why it works** page lists all 24 sources with links you can check.

Built at SwampHacks XII (Oct 16-18, 2026) by Alex Freedman and Luana Maldaner. Track: Entertainment & Creative Technology.

## What you can do

| | |
|---|---|
| **Try any topic** | Type anything. Ten reviewed topics open instantly (seasons, compound interest, natural selection, Ohm's law, base rates, supply and demand, opportunity cost, recursion, derivatives, SN2 reactions). A new topic is built live in 1 to 2 minutes, with a graph when one honestly fits. |
| **Guided demos** | Organic chemistry and Calculus walk the same Learn steps, but with their own tools inside: build ethanol atom by atom, push SN2 arrows, sketch a slope and drag the tangent, fill the area under a curve. |
| **Ask Onion** | A tutor beside every step. It knows the topic and the step you're on, gives hints instead of answers, and on the research page answers only from the research we cite. |
| **Notebook** | Every wrong idea a lesson caught, with the fix. Learn the topic again and get it right twice to cross it off. |

## How a lesson works

| Step | What you do | Why it works |
|---|---|---|
| 1. Guess first | Write your best guess before being taught | A committed guess, even a wrong one, makes the real answer stick (Richland, Kornell & Kao 2009) |
| 2. One true fact | Predict from a single fact, often on a live graph | Concrete first, then abstract (Fyfe et al. 2014) |
| 3. Compare two cases | Two look-alikes, one difference; write your rule as *When ___, then ___, because ___* | Comparing cases surfaces the shared structure (Gentner et al. 2003; Schwartz & Martin 2004) |
| 4. Stress test | Predict what happens at three extremes; see if your rule saw it coming, and add the missing piece | Experts test models on extreme cases (Clement 2009) |
| 5. Draw it | Sketch the model from memory; each part is checked | Drawing to learn (Schmeck et al. 2014) |
| 6. Tell it apart | Pick this idea against its look-alike | Practicing the choice sharpens it (Brunmair & Richter 2019) |
| 7. Carry it over | The same idea in a totally different field | Far transfer is rare unless you practice it (Barnett & Ceci 2002) |
| 8. What you caught | The wrong idea you started with, and its fix, saved to the Notebook | Misconceptions change when they're named and replaced (Chi 2005) |

No points, XP, streaks or leaderboards: expected rewards can crowd out interest in the learning itself (Deci, Koestner & Ryan 1999). The full reasoning and every source are on the research page.

## How it's built

- **Web** (`web/`): React + TypeScript + Vite, deployed to GitHub Pages at onionskin.study. Ready-made topics ship as static JSON, so they open even without the backend.
- **API** (`api/`): FastAPI on a Vultr VM behind Caddy (HTTPS). Lessons are authored and answers graded by OpenAI's Codex CLI running on the server, with a fixed grading contract: judge piece by piece, never give the answer mid-attempt, one targeted follow-up, quote the learner's own words, hold the verdict under pushback.
- **Truth is computed in code, never by a model.** Every graph is a formula the app evaluates itself; a model-proposed graph is only shown if the app's checker recomputes its answer and every number in its captions. A bad graph never ships; a missing one is fine.
- **Data**: no accounts and no server-side learner data. The Notebook lives in your browser. (The API has a Tiger Data store wired up from an earlier version, but the current lessons don't send it anything.)
- **Topics** (`data/learn/`): the ten reviewed lessons, each with its cases, extreme tests, three-choice prediction cards, common misconceptions and, where one fits, a graph.

## How we used AI

We built Onionskin with AI coding agents, and we want to be clear about the split. We made the decisions. The agents wrote most of the code.

**What we did.** We designed the learning experience: the eight-step path from a first guess to a model you can run, based on learning-science research Alex had been doing since September (contrasting cases, guessing before learning, drawing from memory, transfer). We chose what to build and what to cut, set the visual design, and wrote the acceptance criteria for each feature. The agents reviewed each other's pull requests under rules we set: tests had to pass, and each agent reviewed the other's work. We approved every change of direction, tested the live site on desktop and phone, and reviewed every prebuilt topic before it shipped.

**How we built it.** Each of us ran a Claude Code agent, first on our own cloud servers and later on our own laptops. The two agents worked in one GitHub repo through issues and pull requests, and a shared Discord server let each of us steer our own agent and see status. We built the tooling around them ourselves: watchdogs that restart stalled sessions, usage caps, and a rule that the agents coordinate only through GitHub so every change is reviewable.

**AI inside the product.** When you type a topic, OpenAI's Codex writes the lesson structure (the cases, extreme tests, prediction cards and common misconceptions), proposes a graph when one fits, and grades your answers against the lesson. Codex also powers the "Ask Onion" help chat, with Google's Gemini as a backup. The ten showcase topics were written by Codex and reviewed by us. The illustrations on the Home cards were generated with an Azure OpenAI image model and picked by us. Numbers you see in the visuals are computed in code, not generated by a model.

## Run it locally

```bash
# web (http://localhost:5173)
cd web && npm ci && npm run dev

# api (http://localhost:8000); MM_CODEX_FAKE=1 uses canned grading, no Codex needed
cd api && uv sync && MM_CODEX_FAKE=1 uv run uvicorn app.main:app --reload
```

Point the web app at a running API with `VITE_API_BASE=http://localhost:8000`. Tests: `npm test` in `web/`, `uv run pytest` in `api/`.

Deploying: `scripts/deploy-pages.sh` (Pages, with `PAGES_CNAME=onionskin.study` and `VITE_API_BASE`) and `deploy/vultr/update.sh` (API). Details in `deploy/README.md`.

## Repo map

| Path | What's there |
|---|---|
| `web/src/learn/` | The Learn session: the eight steps, the why rail, the stress cards, topic-specific tools (`custom/`) |
| `web/src/research/` | The research page and its 24 sources |
| `web/src/sessions/` | The orgo and calculus tools |
| `api/app/learn/` | Authoring, grading and live-graph checks (Codex wrapper, prompts, schemas) |
| `api/app/spec.py`, `api/app/truth.py` | The code that computes every graph's truth |
| `data/learn/` | The ten reviewed topics |
| `docs/` | The plan, the API contract, the research notes behind the why rail |
