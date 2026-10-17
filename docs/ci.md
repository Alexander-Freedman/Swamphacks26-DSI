# CI in under 15 minutes (FastAPI + React/Vite)

Add this in H0-1, before any feature code. It's general and works for any idea.

## Fastest CI for FastAPI (Py 3.12, pytest, ruff) + React/Vite

### Current action versions (checked via GitHub API today)
| Action | Latest | Use |
|---|---|---|
| actions/checkout | v7.0.1 (Jul 2026) | `@v7` |
| actions/setup-node | v7.1.0 (Oct 2026) | `@v7` |
| actions/setup-python | v7.0.0 (Jul 2026) | `@v7` |
| astral-sh/setup-uv | v10.3.0 (Oct 2026) | **must pin full `@v10.3.0`**: since v8 they publish no major/minor tags (`@v10` is a 404) |
| actions/cache | v6.1.0 | usually not needed, setup-* cache built in |
| dorny/paths-filter | v4.0.3 | optional |

Version notes that bite: setup-node v5 turned on auto-caching when package.json has `packageManager`, and v6 limited auto-cache to npm. Setting `cache: npm` explicitly removes the guesswork. setup-python v7 removed the `pip-install` input. setup-uv v10 turns caching off for `pull_request_target`/`workflow_run`/`release` events. Those don't matter for plain push/PR. Node24-based actions need runner >= 2.327.1, which hosted runners already have.
Release pages: https://github.com/actions/setup-node/releases , https://github.com/actions/setup-python/releases , https://github.com/astral-sh/setup-uv/releases , https://github.com/actions/checkout/releases

### Minimal workflow (text only, not committed)
This assumes `backend/` (pyproject + uv.lock, or requirements.txt) and `frontend/` (package-lock.json). Two parallel jobs, so wall time is the slower of the two.

```yaml
# .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [main]

concurrency:                      # cancel superseded runs on the same branch/PR
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  backend:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v7
      - uses: astral-sh/setup-uv@v10.3.0
        with:
          python-version: "3.12"
          enable-cache: true
          cache-dependency-glob: backend/uv.lock
      - run: uv sync --locked          # installs app + dev deps (pytest, ruff)
      - run: uv run ruff check .
      - run: uv run ruff format --check .
      - run: uv run pytest -q

  frontend:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint --if-present
      - run: npx vitest run --passWithNoTests   # drop if no tests
      - run: npm run build
```

Plain-pip variant for the backend, if we skip uv:
```yaml
      - uses: actions/setup-python@v7
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: backend/requirements*.txt
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: ruff check . && ruff format --check . && pytest -q
```
Even quicker lint-only option: `astral-sh/ruff-action` (v4.1.0) runs ruff without installing project deps (https://docs.astral.sh/ruff/integrations/).

### Caching tips
- Use the built-in cache on setup-node (`cache: npm`) / setup-python (`cache: pip`) / setup-uv (`enable-cache`) instead of hand-rolled actions/cache. In a monorepo **you must set `cache-dependency-path`** (or `cache-dependency-glob` for uv). Without it the action looks for the lockfile at the repo root and errors or misses. https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs , https://docs.github.com/en/actions/tutorials/build-and-test-code/python
- `npm ci` rather than `npm install`. GitHub docs: it's "generally faster" and respects the lockfile. The npm cache stores ~/.npm, not node_modules, so `npm ci` still runs but stays offline-fast.
- uv is much faster than pip for cold installs (https://docs.astral.sh/uv/guides/integration/github/).
- Cache limits: entries not accessed in 7 days are evicted. 10 GB per repo by default, and per the current docs usage beyond that is billed, so keep caches to lockfile-keyed deps only. https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching
- `concurrency` with `cancel-in-progress` avoids queues when we push often. https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency

### Typical run time
Measured on real SwampHacks XI winner repos via the Actions API:
- KoalaKite (won GitHub "Ship It"): Node 20 + npm cache, eslint + prettier check: **26-34 s** per run. https://github.com/RJ-Tabelon/SwamphacksXI/blob/main/.github/workflows/ci.yml
- CaseForwardAI: Next.js lint + build in a subdirectory with `working-directory` and `cache-dependency-path`: **48-49 s**. https://github.com/kofki/CaseForwardAI/blob/main/.github/workflows/ci.yml
- MealCraft: vitest + Playwright chromium install + e2e: **63-73 s**. Most of that is Playwright's browser install. https://github.com/Eric-Zhang-Developer/mealcraft/blob/main/.github/workflows/test.yml

Expect about 30-60 s per job for the workflow above with a warm cache. Jobs run in parallel, so total time is about 1 minute. A cold first run adds roughly 20-40 s for installs. Runner startup is about 5-10 s of each.
Side note: KoalaKite won the GitHub "Ship It" prize, and its repo shows CI, PR flow and lint config, so CI evidence may matter for that sponsor prize if it comes back.

### Pitfalls
- **working-directory**: `defaults.run.working-directory` applies only to `run:` steps, not to `uses:` actions. That's why the cache-dependency-path must include the subfolder. https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- **paths filters + required checks**: if you add `on.pull_request.paths: [backend/**]` and make the check required, PRs that only touch frontend get stuck. Per the docs, a workflow skipped by path filtering leaves its checks "Pending" and blocks merging. Either don't use paths filters (the whole run is about 1 min anyway) or use job-level `dorny/paths-filter` plus a final always-run gate job. https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- **Secrets in PR CI**: CaseForwardAI passes Auth0/Mongo secrets into lint/build. Secrets aren't available to fork PRs, and they're best kept out of CI entirely. Tests should mock external APIs (Gemini, Nessie, etc.) so CI needs no keys.
- **pytest with no tests exits 5** (fails the job). Add one smoke test (e.g. TestClient GET /health) on hour 1. Vitest's equivalent is `--passWithNoTests`.
- **Lockfile drift**: `npm ci` fails if package-lock.json is out of sync, and `uv sync --locked` fails if uv.lock is stale. That's good, but it's the most common red X. Commit lockfiles together with dependency changes.
- **`continue-on-error: true` on lint** (CaseForwardAI does this) hides failures and makes the badge meaningless.
- **Pin uv's action to a full version.** `astral-sh/setup-uv@v10` doesn't exist and the workflow fails at setup.
- Python version: pin `"3.12"` in setup and `requires-python` in pyproject so local and CI match. ruff's `target-version` should be py312.
