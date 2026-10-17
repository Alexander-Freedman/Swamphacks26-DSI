# Contributing

How we work on this repo. Both of us follow it on every task.

## 1. The goal
We help people understand concepts faster through **short, inherently visual sessions** that take them from not understanding to understanding: you manipulate things, watch them move, draw, and see your own model next to reality.

The 10-stage concept-to-model pipeline is our inspiration, not a checklist. **Every change must serve this goal.** The session design is in [docs/experience.md](docs/experience.md).

**Product rules (Sat ~1:05 PM, NOTES.md):**
- Anyone types any topic (incl. orgo, calculus) and learns it **visually**. Every step is a visual you interact with (drag, draw, slide, build, watch it move); text is only short labels and captions. No step is a question plus a number box.
- Typed topics always come back as an interactive visual; if the engine can't build one for a topic, show a visual it can make, never plain text.
- No betting language (bet, "lock it in", "called it", confidence pickers) and no XP or points. At most a quiet "mastered" check per topic; keep the notebook of mistakes.
- Truth is computed in code, never by a model.
- Headline "See your thinking in layers.", subline "Type any topic. Watch it come alive."

## UI
- **No pill shapes:** buttons, chips, tags, toggles, pickers and toasts use a small 4px corner so they read as cards/stamps. Circles are fine for dots, coins and slider thumbs.

## 2. Plan every task before starting
In the issue or PR, write:
- **How it serves the goal:** how it helps someone understand a concept faster, visually. If you can't say how, skip the task.
- **Steps.**
- **Done looks like:** what done means and how it's verified: tests plus a screenshot of the changed screen.

Build to the plan, and check against it before merging.

## 3. Tracking work
- Every task is an issue.
- Before starting, assign yourself and comment "on it".
- Never take an issue assigned to the other person.
- Keep PRs small (aim for under ~200 lines).
- main always runs.
- Review each other's PRs.

## 4. QA
Issues labeled `qa` come first, in this order:
1. breaks the demo
2. wrong facts
3. the core reveal feeling
4. polish

## 5. Deploys
After any merge to main that touches `web/`, the site redeploys to GitHub Pages (`scripts/deploy-pages.sh`).

## 6. Secrets
- Keys live only in the git-ignored `.env`. They never go in the frontend, logs or commits.
- The site is public, so nothing a stranger can trigger on it may spend paid usage.

## 7. Facts
Every number or claim that could reach the UI, the pitch or Devpost needs a source link next to it. Mark guesses as **unverified**.

## 8. Where decisions live
- [NOTES.md](NOTES.md): the current Mode and every decision.
- [TASKS.md](TASKS.md): who's on what, and what's next.
