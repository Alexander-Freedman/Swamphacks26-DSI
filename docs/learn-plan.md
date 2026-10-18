# Learn: any topic, start to finish (Sat 9:45 PM plan)

**Decision (Alex, Sat ~9:30 PM):** the product is **Try any topic** at the top of Home. Orgo and calculus stay as short hand-built demos (one guided path each, no course menus). Typing a topic opens a **Learn session**: six visual screens that take someone from a guess to a model they can run, with a **why-pane** that says in one line why each step exists.

Pitch line stays: **See your thinking in layers.** Deadline: Devpost Sun 8:30 AM (submit by 7:30). Feature freeze 5:30 AM.

## The six screens (one idea per screen, no walls of text)

| # | Screen | What the learner does | Model call |
|---|---|---|---|
| 1 | **Guess** | Writes a one-line guess in pencil, slides how sure they are. | `guess` classifies it (concrete / vague / tangled) and matches a pre-authored misconception. |
| 2 | **Anchor** | Gets ONE true fact and predicts from it. If the topic has a widget (curve / distribution / icon array / stepper), the prediction is made on the widget. | `anchor` grades the prediction. |
| 3 | **Contrast** | Two cards side by side, the one difference highlighted. Learner writes a one-line "fix" for why they differ. | none (cases are pre-authored). |
| 4 | **Stress test** | Three extreme-case cards. Each one applies the learner's fix and stamps SURVIVES or BREAKS with one sentence. Two survives unlock the **why** question; three breaks trigger a **reveal** tied to their wrong turns. | `stress` per card, then `why` or `reveal`. |
| 5 | **Draw it** | Blank canvas: sketch the model from memory, then write the rule in one line. Graded per criterion (entities, links, rule, why). | `draw`. |
| 6 | **Tell it apart + carry it** | Two-card "which one is this?" against the confusable neighbor, then one line: the same idea in a different domain. Ends with the mistake card and a Notebook save. | `neighbor`, `transfer`. |

Every screen has a **why-pane** (desktop: right rail; phone: collapsible strip) with three lines: what you're doing, why it works, one source. Copy in `web/src/learn/why.json`.

## Where the model runs

- **Build time, strongest model:** demo topics are authored on Alex's laptop with Codex (`api/scripts/author_learn_topic.py`) and committed as JSON in `api/data/learn/`. The demo never waits on a model.
- **Run time, Vultr:** the FastAPI backend shells out to `codex exec` (Codex CLI signed in on the box) for the bounded calls above and for live authoring when a judge types a new topic. Concurrency capped at 2, 60 s timeout, read-only sandbox, scratch dir. Gemini stays as the fallback chain for `/api/rounds` and the help chat (unchanged).
- **Pages build:** prebuilt Learn topics are published as static files like the extras, so the site works with no backend.

## Split (three workers, no shared files)

| Who | Owns | Done when |
|---|---|---|
| **Alex (this machine)** | `api/app/learn/*`, `api/scripts/author_learn_topic.py`, `api/data/learn/*.json`, `web/src/learn/why.json`, Vultr Codex install | All endpoints in `docs/learn-api.md` answer on Vultr; 3 demo topics + 10 chip topics authored and reviewed. |
| **Alex's bot** | `web/src/learn/*` (except `why.json` and `WhyPane.*`), Home changes, `web/src/learnApi.ts` | Typing a topic on Home opens the six screens against the API; prebuilt topics open with no backend; mistake card saves to the Notebook. |
| **Luana's bot** | `web/src/sessions/orgo/*`, `web/src/sessions/calculus/*`, `web/src/learn/WhyPane.tsx` + `WhyPane.css`, COMING NEXT removal | Orgo and calculus each open as one guided path (no course menu, no dashed cards); WhyPane renders `why.json` for a given stage key on desktop and phone. |

Small PRs, one per piece. Merge green PRs every 45 minutes. API contract: `docs/learn-api.md`.
