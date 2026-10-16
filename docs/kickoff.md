# Kickoff: the first 30-60 minutes after 8:30 PM

Nothing is picked; this covers all three top stacks. No project code before **8:30 PM**. Accounts and desk questions can happen right at 8:30.

## 8:30-8:45: decide (both, in person)
1. I pick the stack (docs/prize-strategy.md) and write the one-liner at the top of TASKS.md.
2. **Desk questions**, split between us (5-10 min each):
   - **Help desk:** cash split (among members vs 4 ways); Overall $2,500 or $2,250; the AI/ML prize; which judging sheet is used.
   - **MLH desk:** does the Vultr code need a card? Which domain endings does the GoDaddy code cover? Who judges MLH prizes?
   - **CpE lab** (Wertheim): a temp/humidity sensor on request? *(only matters for a hardware add-on)*
   - **Sponsor table for the picked stack:**
     - **Sperry:** 50 plants a hard minimum? Satellite (GLM) flashes OK as "strikes"? A per-day index OK? Per-member iPad?
     - **Capital One:** judging in person? $250/member or $1,000? Can a Nessie transfer be "held" and released?
3. Write the answers into NOTES.md, and update the stack choice if an answer flips it (docs/prize-strategy.md says which answers matter).

## 8:45-9:15: accounts, in this order (one person, the other starts the skeleton)
Only for the picked stack. No paid steps (stop if checkout asks for a card).

| Order | Account | Stack | Why first |
|---|---|---|---|
| 1 | GitHub access for both of us to this repo | all | everything depends on it |
| 2 | Domain via the MLH GoDaddy link | all | DNS can take a while, so start it early. Use `<ip>.sslip.io` meanwhile |
| 3 | Vultr (MLH code), or Render if a card is needed | L1, L-F1 | first deploy target |
| 4 | Tiger Cloud (free) | L1, L-F1 | database |
| 5 | Gemini API key (AI Studio) | all | cache responses; plan for ~250 req/day |
| 6 | Auth0 (free, no card) | L-F1 core, L1 stretch | roles need a namespaced claim |
| 7 | Nessie key (GitHub login on nessieisreal.com, **https only**) | L-F1 | the live money rail |
| 8 | DeepSpace (via the referral link *before* signup) | M1 only if chosen | Node ≥22.15 needed |

Keys go in `.env` (never committed). `.env.example` lists the names.

## 8:45-9:30: skeleton + first deploy (the other person)
1. **Branches:** one per person per task (`alexander-freedman/<topic>`), a worktree each, folder ownership written in NOTES.md (docs/plan-extras.md).
2. **Repo layout** (docs/ai-ml-track.md):
   - `api/` (FastAPI, Python 3.12, pinned deps)
   - `web/` (React + Vite)
   - `src/` modules for data/model
   - `data/sample/`
   - `reports/metrics.json`
   - `Makefile`
3. **CI from minute one** (docs/ci.md): lint + a /health test + build. ~1 min runs.
4. **First deploy** (docs/deploy-provenance.md): Caddy + docker compose on Vultr, HTTPS on `sslip.io` first, then the domain when it resolves. **Done when `/api/health` answers over HTTPS.**
5. **No assistant instruction files in the repo**; DSI judges read repos and flag them.

## 9:30 onward
Open the first-6-hour issues from docs/first-6h.md for the picked stack, assign them (claim lock: assign + "on it"), and start B1 (docs/36-hour-plan.md).

**Dinner is 8:00-9:00 PM (grab + go).** One of us grabs food for both.
