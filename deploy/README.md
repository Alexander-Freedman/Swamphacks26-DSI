# Deploying the API

The site on GitHub Pages works with no backend (bundled rounds). The help chat, the room %, saved answers and typed topics need the API on a public HTTPS host. Two ways, same app:

- **Vultr VM** (primary, once the MLH code is redeemed): Caddy (automatic HTTPS) + systemd. ~15 min.
- **Render free** (fallback if there's no Vultr code by Sat 2 PM): `render.yaml` at the repo root. ~10 min, sleeps after 15 min idle.

Rules: no keys in the repo, in the frontend or in logs. Keys go in `/etc/mm/env` on the VM or the Render dashboard. Spending stays $0: the Gemini key is the free tier, and the API enforces a per-IP limit plus daily caps (`HELP_DAILY_CAP`, generator soft cap).

## Vultr (Caddy + systemd)

Files: `deploy/vultr/` (`setup.sh`, `update.sh`, `mm-api.service`, `Caddyfile`, `env.example`).

1. Create an Ubuntu 24.04 instance (smallest regular plan, Atlanta or Miami), add your SSH key, note the IP. If a Vultr firewall group is attached, allow 22, 80, 443.
2. On the VM, as root:
   ```sh
   curl -fsSL https://raw.githubusercontent.com/Alexander-Freedman/Swamphacks26-DSI/main/deploy/vultr/setup.sh -o setup.sh
   sudo bash setup.sh
   ```
   It installs git, Caddy and uv, creates the `mm` user, clones to `/opt/mm`, runs `uv sync --locked --no-dev`, writes `/etc/mm/env` from `env.example` (empty values, `mm:mm`, mode 600), installs and starts `mm-api.service` (uvicorn on 127.0.0.1:8000), writes `/etc/caddy/Caddyfile` for `<ip-with-dashes>.sslip.io`, and opens 22/80/443 in ufw.
   For a domain: `sudo MM_HOST="api.example.tech, 203-0-113-7.sslip.io" bash setup.sh` (create the A record first, TTL 600, and don't look it up before it exists).
3. Put the key in: `sudo nano /etc/mm/env` (set `GEMINI_API_KEY=...`), then `sudo systemctl restart mm-api`. Never paste the key in Discord, GitHub or a screenshot.
4. Smoke test (below) against `https://<ip-with-dashes>.sslip.io`.
5. Write the URL in NOTES.md and point the site at it (see "Frontend").

Updates after a merge to main: `sudo bash /opt/mm/deploy/vultr/update.sh` (pull, sync, restart, health check).

Logs: `journalctl -u mm-api -f` and `journalctl -u caddy -f`. If the certificate fails, check that 80/443 are open and DNS points at the VM, then `systemctl restart caddy` (don't loop restarts: Let's Encrypt rate-limits).

How the service runs (same line as the dry run):
```
uv run --no-sync uvicorn app.main:app --host 127.0.0.1 --port 8000 --env-file /etc/mm/env --proxy-headers --forwarded-allow-ips 127.0.0.1
```
Only Caddy can reach port 8000, and uvicorn trusts `X-Forwarded-For` only from 127.0.0.1. Caddy drops any `X-Forwarded-For` a client sends and sets the real client IP, so the per-IP limits count real clients and can't be dodged by sending a fake header (tested in `api/tests/test_proxy_ip.py`).

## Render (fallback)

1. Render dashboard → New → Blueprint → pick this repo. It reads `render.yaml` (free web service `mm-api`, no rootDir because the API reads `data/rounds/` from the repo root).
2. Fill in the `sync: false` values when asked: `GEMINI_API_KEY`, `MM_CORS_ORIGINS=https://alexander-freedman.github.io`, `HELP_DAILY_CAP=150`; leave `TIGER_DATABASE_URL` empty until #100 lands.
3. Deploy, then smoke test against `https://mm-api.onrender.com` (or the name Render gives).
4. `autoDeploy` is off to save free build minutes: use "Manual Deploy" after merges.
5. The free service sleeps after 15 min idle and takes ~1 min to wake ([Render free](https://render.com/docs/free)). Open `/api/health` a couple of minutes before judging.

Known gap on Render: uvicorn runs with `--forwarded-allow-ips '*'` there, so it takes the left-most `X-Forwarded-For` entry. Whether Render's proxy strips a client-sent header is unverified, so per-IP limits could be dodged there. The daily caps still bound spending, and the key is free tier.

SQLite (`data/local.db`) on Render is wiped on every deploy and restart; fine for the demo, and Tiger replaces it later.

## Smoke test

```sh
B=https://203-0-113-7.sslip.io   # or the Render URL
curl -fsS $B/api/health                 # {"status":"ok"}
curl -fsS $B/api/rounds                 # the 3 showcase rounds
curl -fsS -X POST $B/api/help -H 'Content-Type: application/json' \
  -d '{"session_slug":"birthday","screen_id":"B1","question":"what is this asking?"}'
# CORS: must echo the Pages origin
curl -s -o /dev/null -D - -X OPTIONS $B/api/help \
  -H 'Origin: https://alexander-freedman.github.io' \
  -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' \
  | grep -i access-control-allow-origin
```
With no key, `/api/help` answers with the screen's static hint (`"hint_only": true`); with a key it's a model answer.

## Frontend: pointing the site at the API

Today the web app only calls the API with relative URLs (`fetch('/api/rounds/...')` in `web/src/rounds.ts`). On Pages that goes to `alexander-freedman.github.io/api/...`, which doesn't exist, so the site silently stays on bundled rounds. To use the public API, the web app needs (web/ change, frontend side):

1. One helper, e.g. `web/src/api.ts`:
   ```ts
   export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')
   export const api = (path: string) => `${API_BASE}${path}`   // api('/api/help')
   ```
   and every `fetch('/api/...')` goes through it. Empty `VITE_API_BASE` keeps today's behavior (dev proxy to localhost:8000).
2. Add `VITE_API_BASE?: string` to `ImportMetaEnv` in `web/src/vite-env.d.ts` (or wherever the env types live).
3. Every API call keeps its offline fallback (bundled rounds, static hint), so a sleeping or down API never breaks the demo.

Then publish with the base baked in (Vite reads `VITE_*` at build time, so changing it means a rebuild):
```sh
VITE_API_BASE=https://203-0-113-7.sslip.io scripts/deploy-pages.sh
```
`scripts/deploy-pages.sh` passes `VITE_API_BASE` through (https only, trailing slash trimmed). The API URL is not a secret; keys never go in the frontend.

CORS: `MM_CORS_ORIGINS` (default `https://alexander-freedman.github.io,http://localhost:5173`) must list the exact site origin. Add the custom domain there when it exists.
