# Deploy in H0-2 + showing where every number comes from

General, works for any idea.

**Bottom line:**
- **Deploy:** a Vultr VM with Caddy + docker compose, using HTTPS on `<ip>.sslip.io` until the domain resolves. Fallback: Render free (API) + a static frontend.
- **Provenance:** a source footer on every card, a popover on the headline numbers, and a "why this number" drawer for the core score. ~5-8h total.

# Q11 deploy + HTTPS in H0-2, and Q13 provenance UI

Research only, checked 2026-10-16. Context: FastAPI (Py 3.12) + React/Vite, maybe Postgres. feasibility.md already leans Vultr + Caddy, and the 48h plan budgets 1-3h for deploy in H0-2.

---

## Q11. Getting live with HTTPS on a custom domain fast

### TL;DR
- **Primary: a Vultr VM (MLH credits) running docker compose with Caddy in front.** First get HTTPS on a `<ip-with-dashes>.sslip.io` hostname, which needs no DNS wait. Add the .tech/GoDaddy name once it resolves. Caddy is the only option here that gives always-on, real cron/pollers, websockets and the Vultr prize together, with no sleep.
- **Run the fallback in parallel in the same hour: Render free web service (API) + Render static site or Vercel Hobby (frontend), deployed from the same repo.** Neither needs a card. It sleeps after 15 min, so it's only for the demo window.
- **Emergency fallback:** `cloudflared tunnel --url http://localhost:8000` from a laptop. You get an HTTPS `trycloudflare.com` URL in about 30 s with no account. It has no uptime guarantee, a 200 in-flight request cap, and no SSE.

### Comparison

| | Vultr VM + Caddy + compose | Render free | Railway | Fly.io | Vercel (FE) + separate API | Cloudflare Tunnel (laptop) |
|---|---|---|---|---|---|---|
| Card needed | Normal signup asks for a payment method ([Vultr docs](https://docs.vultr.com/platform/create-an-account.md)). The MLH page gives $100 credit via promo code but **doesn't say "no card"** ([MLH/Vultr](https://www.mlh.com/partners/vultr)). Treat it as unconfirmed and ask at the MLH desk | No; a card only affects overage ([Render free](https://render.com/docs/free)) | Trial is $5 one-time, 30 days, then $1/mo free credit. Card not stated for the trial ([Railway trial](https://docs.railway.com/reference/pricing/free-trial)) | **No free tier for new orgs.** Trial is 2h of machine runtime or 7 days, then a card is required ([Fly pricing](https://docs.fly.io/about/pricing)) | Hobby: no card | Quick tunnel: no account at all ([CF quick tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)) |
| Sleep / cold start | Never sleeps | Spins down after 15 min idle, ~1 min to wake ([Render free](https://render.com/docs/free)) | Only if "serverless" is enabled: sleeps 5-10 min after the last outbound packet, and the first request may 502 ([Railway sleeping](https://docs.railway.com/reference/app-sleeping)) | Auto-stop optional; you pay while running ([Fly pricing](https://docs.fly.io/about/pricing)) | Static FE never sleeps. Functions max 300 s on Hobby ([Vercel limits](https://vercel.com/docs/limits)) | Up while the laptop and `cloudflared` run |
| Build minutes / hours | Unlimited (your box) | 750 instance-hours/mo. Build minutes come from the workspace pool, and without a card builds stop when it's used up ([Render free](https://render.com/docs/free)) | Within $5 credit; 1 GB RAM, shared vCPU, 5 services/project on trial | Paid after the trial | 45 min per build ([Vercel limits](https://vercel.com/docs/limits)) | n/a |
| WebSockets | Yes; Caddy proxies upgrades automatically | Yes. Messages count as activity, and a new WS wakes the service ([Render free](https://render.com/docs/free)) | Docs list "HTTP and HTTP2" only; WS isn't documented (unverified) ([Railway networking](https://docs.railway.com/reference/public-networking)) | Yes | **Not on Vercel functions.** Host WS on the API box | Supported on all CF plans; add a ping heartbeat ([CF websockets](https://developers.cloudflare.com/network/websockets/)). Quick tunnels: **no SSE** |
| Cron / background jobs | Real cron, systemd, or a loop in a compose service | Free covers only web services, Postgres and Key Value. **No free cron or background workers** ([Render free](https://render.com/docs/free)) | Yes (paid by usage) | Yes (paid) | Hobby cron runs **once/day only**, ±59 min ([Vercel cron](https://vercel.com/docs/cron-jobs/usage-and-pricing)) | Whatever runs on the laptop |
| Postgres | Docker Postgres/Timescale on the same box | 1 free DB, 1 GB, **expires after 30 days**, no backups (fine for a weekend) | Yes, within credit | Paid | Use an external DB | Local |
| Custom domain | Any; Caddy auto-TLS ([Caddy HTTPS](https://caddyserver.com/docs/automatic-https)) | Domain allowances listed for Hobby (2) and up. The free tier isn't spelled out ([Render domains](https://render.com/docs/custom-domains)) | Trial: **1 custom domain** (apex and www count as 2). Hobby: 2/service ([Railway domains](https://docs.railway.com/networking/domains/working-with-domains)) | First 10 certs free ([Fly pricing](https://docs.fly.io/about/pricing)) | Yes on Hobby | Named tunnel needs the domain **added to Cloudflare** ([CF remote tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)), i.e. a nameserver change, so it's slow for a fresh .tech |
| Provider subdomain (no DNS wait) | `1-2-3-4.sslip.io` → real LE cert via HTTP-01 ([sslip.io](https://www-78-46-204-247.sslip.io/), [FAQ](https://52-0-56-137.sslip.io/faq.html)) | `*.onrender.com` | `*.railway.app` ("Generate Domain") | `*.fly.dev` | `*.vercel.app` | `*.trycloudflare.com` (random each run) |
| Prize angle | Qualifies for the MLH Vultr prize | None | None | None | None | None |

**Verdict:** Fly is out (no free tier, card after the trial). Railway's $5 trial would work but adds nothing over Render, and WS isn't documented. Vercel is fine for the static frontend only. Its once-a-day cron and lack of WS make it wrong for our API.

### DNS for a new .tech / GoDaddy domain: how not to wait
- New registrations typically take 2-48 h, and A-record changes 30 min-24 h, depending mostly on TTL. One 2026 benchmark measured GoDaddy A-record changes at ~42 min average with TTL 3600 ([captaindns](https://www.captaindns.com/en/blog/dns-propagation-time), [ipfyi](https://ipfyi.com/guides/dns-deep-dive/dns-propagation-ttl/), [enterno benchmark](https://enterno.io/en/s/research-dns-propagation-benchmark-2026)). For a record created on a domain that already has working nameservers, it's often minutes.
- **Don't wait on it.** Demo on `https://<ip-dashes>.sslip.io` (Vultr) or `*.onrender.com` from H1. The domain is cosmetic. Switch over when `dig +short app.ourname.tech @8.8.8.8` returns the IP.
- **Avoid negative caching.** Don't look the hostname up (no browser, no dig) before the A record exists. Resolvers cache NXDOMAIN for the zone's SOA negative TTL, which can be an hour or more. Create the record first with TTL 600, then check it.
- Check against the authoritative server first (`dig app.ourname.tech @<ns from whois>`), then 8.8.8.8 / 1.1.1.1, or use whatsmydns.net.
- Use an A record for a subdomain like `app.` or `api.` rather than fiddling with apex/www. On Railway's trial, apex + www would use up 2 domains when only 1 is allowed.
- **Start Caddy only after the record resolves.** Caddy needs DNS pointing at the box and ports 80/443 open *before* it starts. On failure it retries, falls back to ZeroSSL, and then backs off exponentially, up to 1 day between attempts. Hammering Let's Encrypt can lock HTTPS out "for up to a week", so use the staging CA (`acme_ca https://acme-staging-v02.api.letsencrypt.org/directory`) while testing ([Caddy HTTPS](https://caddyserver.com/docs/automatic-https)). If it gets stuck: `docker compose restart caddy` after DNS is fixed, and check the logs.
- On Render, remove any AAAA records and add CAA entries if the domain has CAA ([Render domains](https://render.com/docs/custom-domains)).

### Common failure points and fixes
1. **CORS.** The simplest fix is to avoid it: serve the built React app and `/api` from **one origin** (Caddy `handle /api/*` → FastAPI, everything else → `dist/`). In dev, use Vite's `server.proxy` for `/api`. With split origins (Vercel FE + Render API), FastAPI `CORSMiddleware(allow_origins=[exact https origins incl. localhost:5173])` is needed. `allow_origins=["*"]` doesn't work with `allow_credentials=True`.
2. **Env vars.** `VITE_*` vars are baked in at **build** time, so changing them on the host means a rebuild, not a restart. Keep one `.env.example` in the repo, with the real `.env` on the box only and in `.gitignore`. On Render/Railway, set the vars in the dashboard *before* the first deploy. Bind the API to `0.0.0.0:$PORT` on PaaS.
3. **Mixed content and http redirects behind the proxy.** FastAPI's trailing-slash redirects come out as `http://...` unless uvicorn trusts the forwarded headers. Run `fastapi run --forwarded-allow-ips="*"` (or `uvicorn --proxy-headers --forwarded-allow-ips="*"`) when only the proxy can reach the app ([FastAPI behind a proxy](https://fastapi.tiangolo.com/advanced/behind-a-proxy/)). In the frontend, use relative URLs (`/api/...`), never `http://host:8000`.
4. **HTTPS for camera/mic/geolocation.** `getUserMedia` only works in a secure context: https, `localhost` or `127.0.0.1`. **`http://192.168.x.x` is not secure** ([MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)). Phones testing a laptop dev server need the HTTPS deploy, a tunnel URL, or `vite --host` with `@vitejs/plugin-basic-ssl` (and accepting the self-signed warning). Guard the call with `window.isSecureContext`.
5. **Websockets behind proxies.** Caddy `reverse_proxy` upgrades WS automatically. Use `wss://` + same-origin path (`new WebSocket(location.origin.replace('http','ws') + '/ws')`). Send a ping every 20-30 s, because Cloudflare and other proxies close idle connections ([CF websockets](https://developers.cloudflare.com/network/websockets/)). Reconnect with backoff on the client. On Render free, an open WS with traffic keeps the service awake.
6. **Venue wifi.** Building on the VM (`docker compose build` there) avoids pushing images over hotel-grade uplinks. SSH on port 22 may be blocked on guest wifi, so fall back to a phone hotspot or Vultr's web console.
7. **Render free sleep during judging.** Open the URL 2 min before each judge, or ping `/api/health` every 10 min from a laptop, during the demo window only.
8. **Build-minute exhaustion (Render without a card).** Builds stop for the month, but the service keeps running. Don't auto-deploy every push; deploy from a `deploy` branch.

### Recommended path: 30-60 min checklist (Vultr primary)
Prereq (H0, at the desk): Vultr account + MLH code redeemed. If it asks for a card and nobody can supply one, **skip straight to the fallback** (no-spend rule).

1. (5 min) Create an Ubuntu 24.04 instance, the smallest regular plan, in Atlanta or Miami, with an SSH key added. Note the IP.
2. (5 min) `apt install docker.io docker-compose-v2 git`, then `ufw allow 22,80,443/tcp` (also allow 80/443 in the Vultr firewall group if one is used).
3. (10 min) Repo layout: `api/Dockerfile` (python:3.12-slim, `fastapi run main.py --port 8000 --forwarded-allow-ips="*"`), `web/` built to `dist/`, `compose.yaml` with `api`, `caddy` (ports 80/443, volumes `caddy_data:/data`, `./web/dist:/srv`), and optional `db` (postgres:16 or timescale/timescaledb-ha, with a named volume).
4. (5 min) Caddyfile:
   ```
   {$SITE_HOST} {
     encode gzip
     handle /api/* { reverse_proxy api:8000 }
     handle /ws*   { reverse_proxy api:8000 }
     handle { root * /srv; try_files {path} /index.html; file_server }
   }
   ```
   Set `SITE_HOST=1-2-3-4.sslip.io` first (dashes, our IP).
5. (5 min) `git clone`, `npm ci && npm run build` (or build locally and rsync `dist/`), `.env` on the box, `docker compose up -d --build`.
6. (2 min) `curl -I https://1-2-3-4.sslip.io/api/health` should return 200 with a valid cert. Put the URL in NOTES.md.
7. (5 min, in parallel) In the domain DNS panel, add an A record `app` → IP with TTL 600. **Don't query it before saving.**
8. (later) When `dig +short app.<domain> @8.8.8.8` returns the IP, change `SITE_HOST` to `app.<domain>, 1-2-3-4.sslip.io` (keep both), then `docker compose up -d caddy`.
9. (5 min) Redeploy script `deploy.sh`: `git pull && (cd web && npm run build) && docker compose up -d --build`. Cron/pollers run as their own compose service with `restart: unless-stopped`.

**Fallback (start at the same time if the Vultr signup isn't done by ~H0:45):**
- Render: New Web Service from the repo, root `api/`, start command `fastapi run main.py --host 0.0.0.0 --port $PORT --forwarded-allow-ips="*"`, env vars set, then hit `https://<name>.onrender.com/api/health`. Frontend as a Render static site (or Vercel) with `VITE_API_BASE=https://<name>.onrender.com` and CORS set to that exact origin. Pollers can't run as free cron; run them in-process (an asyncio task at startup), which only works while the service is awake. Fine for a demo.
- Demo-day emergency: `cloudflared tunnel --url http://localhost:8000` on a laptop, with FastAPI serving the built `dist/` as static files so it's one origin. Avoid SSE through it, use WS or polling instead, and keep the laptop on the charger.

---

## Q13. Showing where every number comes from

### What the references do
- **Our World in Data (grapher pages).** There's a source line under every chart ("Data source: X – with major processing by OWID"), plus "Last updated" and "Next expected update". Below that is an expandable **"About this data" / "Sources and processing"** panel with one collapsible entry per provider: description, *retrieved on* date and URL, and the original citation. A **processing** note lists the steps (unit conversion, per-capita, renaming). Caveats ("what you should know") are expandable notes. Each chart also has a **Download** with CSV + JSON metadata + README and a "How to cite" block ([OWID life expectancy](https://ourworldindata.org/grapher/life-expectancy), [OWID WHO regions](https://ourworldindata.org/grapher/who-regions)). *Lesson:* split provenance into **source → retrieval → processing → caveats**, and attach it per chart, not per page.
- **NWS.** Products carry an issuing office plus an "issued"/"last update" timestamp. Indexes like HeatRisk ship a separate methodology/overview page that names the inputs: NDFD gridded forecast, gridded climatology (top 5% for the date), and CDC heat-health thresholds ([WPC HeatRisk overview](https://www.wpc.ncep.noaa.gov/heatrisk/overview.html), [NWS HeatRisk fact sheet](https://www.weather.gov/media/mlb/pdfs/NWS%20HeatRisk%20Fact%20Sheet.pdf)). *Lesson:* every risk number needs **issued-at time + inputs + a link to how it's computed**. Freshness is part of provenance.
- **FiveThirtyEight.** Each forecast linked a long-form "How our forecast works" methodology piece explaining the pipeline: polls → adjustments → simulation. It also separated the polling average (input) from the forecast (output) ([2020 methodology](https://fivethirtyeight.com/features/how-fivethirtyeights-2020-presidential-forecast-works-and-whats-different-because-of-covid-19), [2018 House](https://fivethirtyeight.com/features/2018-house-forecast-methodology)). *Lesson:* show the **chain** from raw input to adjusted input to model output, and say in words what each step does. Show probabilities, not certainties.
- **Bloomberg Terminal.** Every value is a named **field mnemonic**. `FLDS` shows the field's definition, whether it's live or static, and whether it's overridable, and `DES` shows the security's description and docs ([Excel formula guide](https://www.emich.edu/cob/programs/finance-programs/documents/bloomberg-lab/formula-method-excel.pdf), [Princeton FAQ](https://faq.library.princeton.edu/econ/faq/11474)). *Lesson:* give each metric a **stable ID** that a "what is this field" lookup resolves to: definition, type, source, update cadence.
- **Observable.** The **Minimap** shows a notebook's dataflow: click a cell to see what it depends on and what depends on it, with transitive deps offset ([Observable minimap docs](https://observablehq.com/documentation/debugging/minimap)). Users said bare edges without context were hard to read ([forum](https://talk.observablehq.com/t/visual-dataflow/2976)). *Lesson:* a lineage graph impresses judges, but label the edges ("joined on county FIPS", "hourly mean").
- **Data journalism (Datawrapper, ProPublica-style "nerd box").** The standard is a chart footer with a **source name + source link + "Get the data" CSV** ([Datawrapper annotate](https://www.datawrapper.de/academy/annotate-tab), [footer options](https://www.datawrapper.de/blog/footer-options-let-readers-download-and-embed-your-datavis)). Longer stories add a methodology box. Researchers call it the "nerd box" ([Nieman Lab](https://www.niemanlab.org/2016/08/how-does-your-newsroom-share-the-data-behind-your-data-journalism-with-the-public-fill-out-this-survey/)).

### Accessibility rules that apply
- **Hover content must be dismissible (Esc), hoverable (you can move the pointer onto it), and persistent** (WCAG 2.1 SC 1.4.13, AA) ([W3C Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus)).
- **Never put links or buttons in a tooltip.** ARIA tooltips are non-interactive. If the card has a "view source" link, it's a **popover/disclosure** triggered by a real `<button>` (click/Enter/Space), with `aria-expanded` and focus management. Hover can open it too, but must not be the only way. That also covers touch, since phones have no hover.
- The provenance trigger must be keyboard-focusable with a visible focus ring, and its accessible name should say what it is ("Source for heat index 7.2"), not just "ⓘ".
- Footnote markers: use `<sup><a href="#src-3" id="ref-3">3</a></sup>` with a back-link. Screen readers announce them, and they also work in print and PDF exports for judges.
- Don't encode freshness or confidence by color alone. Add text ("updated 4 min ago", "estimated").
- A drawer is a dialog: `role="dialog"`, `aria-labelledby`, focus moves in on open and returns to the trigger on close, and Esc closes it.

### Three patterns to build

Data model for all three: each number the API returns carries `{value, unit, metric_id, sources:[{name,url,retrieved_at}], computed_at, method, inputs:[{metric_id,value}], caveats[]}`. Build this in FastAPI once (a Pydantic `Sourced[T]`) and every UI pattern reads from it. That's ~1-1.5 h of backend work.

**1. Source footer + numbered footnotes (OWID / Datawrapper style)**
- *What:* under each card or chart, a "Source: NWS NDFD, IEM · updated 14:20 · Get the data (CSV)" line. Numbers in text get superscript refs to a sources list at the bottom.
- *When:* always, as the baseline. It's the cheapest, prints and screenshots well (slides, Devpost images), and works with zero interaction, so a judge glancing at the screen sees sources.
- *React build:* **0.5-1 h** for a `<SourceLine sources computedAt csvHref/>` component plus a `<Ref n/>` / `<References/>` pair using context to number refs.

**2. "Where does this come from" popover card (hover + click)**
- *What:* each headline number has a small focusable ⓘ, or the number itself is a button. It opens a card with the definition, the inputs and their values ("WBGT 31.2 °C = f(temp 34.1, dewpoint 24.0, wind 2.1 m/s, solar 820 W/m²)"), the source + retrieval time, freshness, and a link to open the full drawer.
- *When:* dashboards with 5-30 numbers, where people need the answer without leaving the screen. Best for the live demo: a judge asks "where's that from?" and you click once.
- *React build:* **1.5-2.5 h** with a headless primitive (Radix Popover / Floating UI) that handles focus, Esc, collision and hoverable-gap for you. Add ~1 h if built from scratch (don't). Remember the WCAG 1.4.13 rules and click-to-open for touch.

**3. "Why this number" drawer with a lineage trail (FiveThirtyEight / Observable / Bloomberg FLDS style)**
- *What:* a side drawer for one metric. It shows a breadcrumb or small DAG from raw sources to transforms to the model to the displayed value, with each step labeled (what it did, row counts, timestamp). It includes the model's eval stats (e.g. "PR-AUC 0.41 on 2025 holdout"), the caveats, and links to the raw query and the code file.
- *When:* the one or two numbers the pitch hinges on (the risk score, the model output), and when judges ask "how do you know?". It answers the XII criterion "could the team explain how and why they built it?" on screen. Overkill for every number.
- *React build:* **3-5 h** for a vertical step list (no graph library), accessible dialog, and deep-linkable `?why=metric_id`. **6-8 h** with a real DAG (React Flow or d3-dag + layout, labeled edges, keyboard nav). Do the step list first and only add a graph if time is left in B4.

**Suggested combo for us:** pattern 1 everywhere from the first UI (H5-9), pattern 2 on the 3-6 headline numbers, and pattern 3 for the single score the demo is built on. Total ~5-8 h including the backend `Sourced` model. It lines up with the 48h plan item "every number traceable to its source".
