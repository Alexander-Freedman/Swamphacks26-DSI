# Sponsor tech: hands-on setup check (#3)

Builds on docs/prize-strategy.md (prize rules, crowding, stacks) and docs/feasibility.md (packages, Auth0 roles claim, Tiger autocommit gotcha, Gemini structured output). This file adds only what I checked live from the build box on Fri Oct 16 ~9:30 PM, plus the open unknowns. Nothing below needed an account.

## TL;DR

| Tech | Setup to first working call | Worth it? | New from live checks |
|---|---|---|---|
| Nessie | 15 min (key via GitHub login) | only if the core is money | bad key on GET returns `200 []`, not an error; `/enterprise/*` shows every team's data; ATM/branch endpoints 502 right now |
| Vultr | 20-30 min (signup + gift code + VM) | yes, it's our host anyway | a $0 512 MB plan exists (sea, fra, mia); $5/mo 1 GB in ~30 regions incl. atl and mia; card question still open |
| Gemini | 5 min (AI Studio key) | yes if it does a real job; cheap | free-tier limits are per project and only shown in AI Studio; third-party numbers conflict (250 vs 1,500 RPD) |
| Tiger Data | 15-20 min (signup + service) | yes if we have time-series (hazard radar) | pricing page only shows the 30-day no-card trial; free plan (2 x 750 MiB) is in the changelog only |
| Auth0 | 30-60 min incl. roles Action | yes if 2 real roles | MLH page confirms: no card, 7,000 MAU |
| GoDaddy domain | 20 min | yes, nearly free | which endings the MLH code covers is not published anywhere I could find |
| DeepSpace | 9-15 h (docs/deepspace.md) | only for realtime multi-user | still 0.42.3 (Oct 13), no newer release |

## Nessie (Capital One)

Probed `https://api.nessieisreal.com` with a fake key:

| Call | Result |
|---|---|
| `GET /accounts?key=bad`, `GET /merchants?key=bad`, `GET /customers?key=bad` | `200 []` |
| `POST /customers?key=bad` | `Invalid API key.` |
| `GET /enterprise/customers?key=bad` | `200` with real-looking customers from other teams (e.g. "Pixel Palace Arcade") |
| `GET /atms`, `GET /branches` (no key) | `502 Internal server error` |
| `GET /atms?lat=29.65&lng=-82.34&rad=5` (no key) | `401 unauthorized` |
| `http://` | connection refused (https only, as already noted) |

What that means for the build:
- **A wrong or missing key fails silently** on reads: empty lists look like "no data". At startup, validate the key with a POST (create a throwaway customer) and fail loudly. Log the HTTP body, not just the status.
- **The sandbox is shared and public.** Use fake names only, and always filter by the customer/account IDs we created (store them in our DB). Don't build on `/enterprise/*` lists; anyone's junk shows up there.
- **ATM/branch lookups may be flaky.** If the idea uses them, fetch once and cache to a JSON file in the first hour.
- Seed our demo customers + accounts + a few days of transactions with one script, so we can re-seed if someone else's data or a reset breaks it.

## Vultr (MLH)

Claim steps (MLH partner page): register at mlh.link/vultr-discover (Company = school, Job title = Student) → verify email → sign up at mlh.link/vultr-signup → Billing → Gift Code → $100. An older MLH page also says "no credit card required"; Vultr's own docs say new accounts add a payment method to verify. **If the Billing page asks for a card, stop** (no-spend rule) and use Render's free tier (docs/deploy-provenance.md).

Plans (public API `GET /v2/plans`, no key):
- `vc2-1c-0.5gb-free`: $0, 512 MB, **sea, fra, mia only** (rechecked Oct 16 10 PM via `GET /v2/plans`). Fine for FastAPI + static frontend, too small for any model training or Postgres + app together.
- `vc2-1c-1gb`: $5/mo, ~30 regions incl. atl + mia. $100 covers it for the whole event many times over. **Pick this one.**
- GPU (`vcg-l40s-*`): from $1,123/mo (~$1.54/h). $100 is ~60 h on paper, but don't: training stays small on CPU (hazard-ml.md), and a GPU VM left running is the only way we'd burn real money.
- Delete VMs after the event (credits expire, ~30 days per Vultr docs).

## Gemini (MLH)

- Key from AI Studio, ~5 min. No card for the free tier.
- Google's rate-limit page no longer lists free-tier numbers; it says to look in AI Studio. Third-party guides give 250 or 1,500 requests/day for Flash depending on date. **Read the real number off AI Studio when the key is made and write it in NOTES.md.**
- Limits are per Google Cloud project, reset midnight Pacific (= 3 AM our time, mid-crunch). Cache every response keyed by input hash, and make every Gemini feature degrade to template text from our numbers (feasibility.md already plans this).
- Model names change often; call `models.list` once with the key and pin what's actually there (feasibility.md uses `gemini-3.8-flash`).

## Tiger Data (MLH)

- Pricing page: only Performance/Scale/Enterprise + "free, 30-day trial (no credit card required)". The free plan (2 services, shared compute, 750 MiB each, beta) appears in the changelog, per feasibility.md. Either works for 36 hours; the trial is the safer pick for compute.
- After 7 days with no queries a trial service pauses, and trial data may be removed later. Irrelevant for the event, but export the demo dataset to a CSV/SQL dump in the repo so the demo never depends on it.
- If signup asks for a card: plain Postgres + `timescaledb` apt package on the Vultr VM (1 GB is tight; use the $10 2 GB plan). We lose the "Tiger Cloud" story but keep hypertables + caggs; check with the MLH coach whether self-hosted TimescaleDB counts.
- Only worth it with real time-series. The hazard radar has it; Nessie transactions are borderline; Mental Models doesn't.

## Auth0 (MLH)

- MLH page: free, no card, 7,000 active users, unlimited logins. Packages + the roles-claim Action are in feasibility.md.
- Extra setup items people forget: add both `http://localhost:5173` and the deployed URL to Allowed Callback / Logout / Web Origins; create an API (audience) so the SPA gets an access token the FastAPI side can verify via JWKS; make a judge demo login per role and put it on the table card.

## GoDaddy Registry domain (MLH)

- Claim code via "Log In To Claim Code" on the MLH prizes page. Which endings it covers isn't published (older MLH posts mention .tech/.space/.online, unofficial). **Ask the MLH coach**; stop if checkout asks for payment.
- Point it at the Vultr VM with an A record; Caddy gets the cert. Do it Saturday morning, after the first deploy works on the sslip.io name.

## Still unknown (ask the MLH coach in person)

1. Vultr gift code: does Billing ask for a card?
2. GoDaddy code: which endings, and is it one per team?
3. Does self-hosted TimescaleDB count for Best Use of Tiger Data, or must it be Tiger Cloud?
4. Gemini: our project's actual RPD (read in AI Studio once the key exists).
