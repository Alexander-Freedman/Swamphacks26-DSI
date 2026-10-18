# Learn API contract

Base: the same backend as `/api/rounds` (`VITE_API_BASE`). All responses are JSON. Errors: `{ "detail": string }` with 4xx/5xx; 503 `codex_unavailable` when the model backend is down (frontend: show "thinking is offline, prebuilt topics still work").

## Topic JSON (authored once, served static and via API)

```jsonc
{
  "slug": "compound-interest",
  "topic": "compound interest",
  "checked": true,                 // true = hand-reviewed prebuilt; false = authored live, label "auto-checked"
  "rubric": {
    "entities": ["..."],
    "causalLinks": ["..."],
    "coreRule": "...",
    "whyRuleMatters": "...",
    "whyRuleQuestion": "...",
    "anchorDescription": "...",    // ONE true fact, not the rule
    "anchorPrompt": "...",         // the prediction question
    "contrastingCases": [ { "label": "...", "detail": "...", "oneLine": "..." } ],   // 2 used on screen 3
    "extremeCaseDimensions": [ { "key": "kebab", "description": "..." } ],
    "confusableNeighbors": [ { "key": "...", "label": "...", "question": "...", "correctDistinction": "..." } ],
    "transferStructuralRequirements": ["..."],
    "referenceTransferExample": "..."
  },
  "misconceptions": [ { "id": "kebab", "label": "...", "tell": "...", "fix": "..." } ],   // 2-3 pre-authored wrong models
  "extremeCases": [ { "dimension": "key", "scenario": "...", "correctBehavior": "..." } ], // 3 pre-authored, screen 4
  "visual": null
}
```

`visual` is `null` or `{ "widget": "curve" | "distribution" | "estimate" | "stepper", "spec": <an existing v4 spec case> }` when the topic has a runnable widget; then screen 2 makes the prediction on the widget.

## Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/learn/topics` | | `[ { "slug", "topic", "checked" } ]` |
| GET | `/api/learn/topics/{slug}` | | Topic JSON |
| POST | `/api/learn/topics` | `{ "topic": string }` | Topic JSON (authored live, cached on disk; 30-90 s; rate-limited per IP) |
| POST | `/api/learn/{slug}/guess` | `{ "text": string }` | `{ "classification": "concrete" / "vague" / "tangled", "misconceptionId": string or null, "message": string }` |
| POST | `/api/learn/{slug}/anchor` | `{ "answer": string }` | `{ "verdict": "demonstrated" / "unresolved", "feedback": string, "followUpQuestion": string or null }` |
| POST | `/api/learn/{slug}/stress` | `{ "fix": string, "caseIndex": 0-2, "history": [ { "caseIndex", "fix", "verdict" } ] }` | `{ "verdict": "survives" / "breaks", "critique": string }` (one sentence) |
| POST | `/api/learn/{slug}/why` | `{ "answer": string }` | `{ "verdict": "demonstrated" / "unresolved", "feedback": string, "followUpQuestion": string or null }` |
| POST | `/api/learn/{slug}/reveal` | `{ "history": [ { "caseIndex", "fix", "verdict" } ] }` | `{ "explanation": string, "revealedRule": string, "confirmCase": string }` |
| POST | `/api/learn/{slug}/draw` | `{ "rule": string, "notes": string, "image": string or null }` (image = PNG data URL, optional) | `{ "criteria": [ { "id": "entities" / "links" / "rule" / "why-rule", "verdict": "demonstrated" / "contradicted" / "unresolved", "note": string } ], "followUpQuestion": string or null }` |
| POST | `/api/learn/{slug}/neighbor` | `{ "key": string, "answer": string, "priorAnswer": string or null }` | `{ "verdict": "correct" / "partial" / "incorrect", "feedback": string, "followUpQuestion": string or null }` |
| POST | `/api/learn/{slug}/transfer` | `{ "analogy": string, "wasPushed": boolean }` | `{ "verdict": "maps" / "partial" / "too-abstract" / "fails", "critique": string, "missingPiece": string or null }` |
| GET | `/api/learn/status` | | `{ "codex": "ok" / "missing" / "unauthenticated", "inFlight": number, "topics": number }` |

Rules every call follows (from the prototype's contract): grade criterion by criterion; never reveal the rule mid-attempt; one targeted follow-up on an unresolved answer; critique quotes the learner's own words; hold the verdict under pushback; 1-4 sentences; define every symbol the moment it appears.

## Static files on Pages

`web/public/learn/index.json` = `[ { "slug", "topic", "checked" } ]` and `web/public/learn/<slug>.json` = Topic JSON, copied from `api/data/learn/` at build time (same mechanism as `rounds/extra`). With no backend the six screens still open; the model-graded steps show the pre-authored fallback (misconception card by keyword, extreme cases with their correct behavior) and are labelled "offline check".

## Frontend state (for `web/src/learn/`)

`?learn=<slug>` opens a Learn session. Stage keys for the why-pane: `guess`, `anchor`, `contrast`, `stress`, `draw`, `neighbor`, `transfer`, `done`. The Notebook entry: `{ session: "learn", slug, at, guess, misconception, stressRounds, drawVerdicts, transferVerdict }`.
