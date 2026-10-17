# DeepSpace reality check

Only matters if a stack uses DeepSpace. Nothing is picked.

**Bottom line:**
- It does everything we'd need: Google/GitHub login, live rooms, presence, photo upload, a daily 6 PM job, and calls to our backend.
- A crew app is **12-15h**, and a live classroom is **9-12h**, much more than the 4-8h we'd assumed.
- **Needs Node ≥22.15 / npm ≥11.6.** Our server has 18.19, so fix that before building.
- Judges can't sign up by email, so use test accounts or make views public.
- Pin `0.42.3` and don't update during the event.
- Delete the assistant instruction files the starter adds before the first commit.

# DeepSpace check (SwampHacks XII sponsor challenge)

Checked 2026-10-16 against the published npm tarballs (deepspace 0.42.3, create-deepspace 0.42.3, unpacked with npm pack + tar, nothing installed or run), docs.deep.space (.md versions of pages), the GitHub repo, and our event files (/home/bot/hack/event/hacker-guide.md, devpost.txt).

## Challenge rules and credits (event guide)
- Must do real work with the SDK (auth, data, realtime or integrations, not just hosting), have a live demo or testable build with access steps, and say which features we used and where judges can see them.
- Referral link https://dashboard.deep.space/join/SWAMPHACKS2026 BEFORE making the account gives 5,000 credits ($50). Existing accounts: DM DeepSpace the account email privately. Credits must be claimed AND used by **Oct 28, 11:59 PM ET**.
- Prizes: 1st 100,000 credits ($1,000) per team + CEO call (devpost.txt also says +$250 cash split among 1st place); 2nd 50,000 credits ($500). Credits, not cash.
- A human has to make the account (OAuth-only: GitHub or Google, no password) and run `npx deepspace auth login`. We can't do that part.

## Version and release cadence
- Latest: **0.42.3** (2026-10-13). First publish 2026-04-02. 110 versions in ~6.5 months, about 4 a week; 9 releases between Oct 4 and Oct 13. The README calls it **Alpha: APIs may change between 0.x minor versions**.
- create-deepspace ships the same version numbers.
- GitHub repo deepdotspace/deepspace: 3 stars, **0 issues filed (open or closed)**, last push 2026-10-13. So there's no public bug tracker to go on. The CHANGELOG is the only record of bugs. Recent fixes: requests to deployed apps hanging when the platform route lookup stalled (0.42.1), confirmed writes failing on dropped sockets (0.41.0), native Google sign-in failures (0.39.3), sign-out on custom domains (0.39.2).
- What this means for us: pin `deepspace@0.42.3` exactly and don't run `npx deepspace@latest app update` during the hackathon.

## Stack
Cloudflare Workers for Platforms plus Durable Objects (SQLite). React 19, Vite 8, Tailwind 4, Hono, react-router with generouted file routes, Better Auth, Yjs, Vercel AI SDK 7. The scaffold's `wrangler.toml` binds RecordRoom, YjsRoom, CanvasRoom, PresenceRoom, CronRoom and JobRoom.

## APIs (verified in dist/*.d.ts and the docs)

### Auth
- `DeepSpaceAuthProvider`, `useAuth()`, `useUser()`, `<AuthGate>`, `<SignedIn>`/`<SignedOut>`, and `<AuthOverlay providers={['google','github']} title=… logo=… />`.
- **Google OAuth: yes**, built in. So are GitHub OAuth and an email/password box. The email box only signs in existing accounts. Public email signup is closed platform-wide, so in practice it's for `@deepspace.test` test accounts made with `deepspace test accounts`.
- End users sign in through the platform auth worker. JWTs are ES256 and last 5 minutes (auto-refresh). The overlay's default title is "Sign in to DeepSpace" and we can override it.
- `<RecordProvider allowAnonymous>` lets signed-out visitors read whatever the `'*'` role grants. Without it, a signed-out visitor to a deployed app sees a **blank page**.
- In the worker: `verifyJwt`. Roles are viewer, member and admin. Per-collection RBAC levels: `true | 'own' | 'unclaimed-or-own' | 'collaborator' | 'team' | 'published' | 'shared'`. `create` only accepts a boolean.

### Realtime data, rooms and presence
- Data: `<RecordScope roomId=… schemas=…>` plus `useQuery(collection, {where, orderBy, orderDir})` and `useMutations(collection)` (create, put, remove, and the "confirmed" variants). One RecordRoom DO per scope id. We can use one scope for the whole app (`app:${APP_ID}`) or one per site/class (custom roomId; `isolated` and `sharedScopes` props exist). Writes go out over a WebSocket and broadcast to every subscriber right away.
- Presence:
  - `usePresence()`: online/offline from a 60 s heartbeat on the users collection. Timeout defaults to 5 min, and the docs say about 60 s granularity, so it's slow.
  - `usePresenceRoom(scopeId)` returns `{peers, connected, updateState}`. It's in-memory, sub-second, and a peer drops within about 1 s of disconnecting. Use this one for "who's in the room", cursors and typing.
- Collaborative text: `useYjsText`, `useYjsField`, `useYjsRoom`. Whiteboard: `useCanvas`. Chat: `useMessages`, `useChannels`, `useReactions`, `useReadReceipts`. Leaderboard and kanban are installable features.
- Server-side logic (needed to enforce things like a prediction lock): server actions in `src/actions/` (`ActionHandler` with `tools.*`).

### File storage (photos)
- `useR2Files({scope:'self'|'app'})` gives `upload`, `uploadBase64`, `list`, `readFile`, `downloadFile`, `getUrl` and `isUploading`. `'app'` scope is public-read, so the URL works straight in `<img>`, but upload still needs a signed-in user. `'self'` is private to the uploader.
- Limits from the source (`MAX_APP_FILE_BYTES`): **1 GiB per file**, **25 MiB per request**, anything over 20 MiB auto-uploads in parts.
- Account storage cap: the docs say **128 MiB on the free plan**, but the code constant `ACCOUNT_STORAGE_LIMIT_BYTES.free` = 1 GiB (starter 10 GiB, premium 30 GiB). The cap is per owner account across all their apps. Going over returns `storage_quota_exceeded` (409). Plan for the lower 128 MiB number: resize photos on the client to about 200-400 KB, which gives roughly 300-600 photos.
- `R2FileInfo` has no mimeType or metadata. Store a sidecar record (lat/lng, siteId, caption, key) in a collection. `list()` isn't reactive, so drive the UI off the records collection.
- Worker side: `appFiles(env, {scope, userId})`.

### Scheduled jobs (daily 6 PM)
- **Yes.** In `src/cron.ts`: `{ name: 'daily-6pm', schedule: '0 18 * * *', timezone: 'America/New_York' }`. It's a 5-field cron, DST-aware. `runTask(name, env)` gets `buildCronContext(env, env.OWNER_USER_ID, 'app:'+env.DEEPSPACE_APP_ID)` with `ctx.records.query/create/update/delete` (runs as owner, skips RBAC) and `ctx.integrations.call`.
- It runs on a Durable Object alarm. The alarm only gets armed when the DO first receives a request, and the scaffold arms it on every incoming request. **After a deploy, hit the app once** or the schedule waits for a visitor.
- `useCronMonitor(SCOPE_ID)` returns `{tasks, history, trigger, pause, resume}`. `trigger(name)` runs the task right away. **Use a "Run 6 PM job now" button in the demo** instead of waiting for 6 PM. By default members can trigger owner-billed tasks, so restrict the button to admins. `npx deepspace add cron` adds a live /cron-log page.
- Background jobs (`useJobs`, JobRoom) handle longer durable work.

### Calling external HTTP (our Vultr / Tiger Data backend)
- The worker is plain Cloudflare Workers plus Hono, so a normal `fetch('https://…')` works from Hono routes, server actions, cron `runTask` and job handlers. The docs show `fetch('https://api.example.com/…')` in job and AI-tool handlers. Store the backend key with `npx deepspace secrets set NAME` (it shows up on `env`).
- `integration.post('<vendor>/<endpoint>')` is the platform proxy for 215+ third-party APIs (LLMs, weather/OpenWeatherMap, Resend email, Exa, Finnhub, Google Workspace and more). It's billed in credits. Don't use it for our own backend; that should be direct fetch.
- Hyperdrive (direct Postgres to Tiger Data) is an allowed binding, but it **can't be auto-provisioned**. It needs a config id from a Cloudflare dashboard we don't have, so skip it and put an HTTPS API in front of Postgres.
- Cautions: give the backend a **hostname with TLS on 443** (for example `api.<something>` or a sslip.io/nip.io name for the Vultr IP). Don't call a raw IP on an odd port; Cloudflare gives error 1003 for raw Cloudflare IPs, and I couldn't confirm non-Cloudflare IP or port behavior, so test the call on day 1. Add CORS only if the browser calls the backend directly; better to proxy through the worker.

### Custom domains
- Default is `https://<name>.app.space` with SSL, live a few seconds after deploy. Renaming keeps data.
- `npx deepspace app domain attach <domain> --external` and `… domain verify` connect a domain we already own through DNS. Buying a domain through DeepSpace costs registrar price x1.3 + $1, and **we can't spend money**, so stay on `*.app.space` unless the team already owns a domain.

### AI chat
- The scaffold ships `/api/ai/chat` (streamed, multi-turn, tool use over our records, persisted in `ai-chats`/`ai-messages`) plus a ChatPanel. The worker side uses `streamDeepSpaceAgent`, `createDeepSpaceAI(env,'anthropic'|'openai')` and `generateText`.
- Models come from `listDeepSpaceAgentModels('application')`; the docs list several hosted LLM models. `useVoiceAgent()` gives realtime voice. All of it bills credits; AI from cron or actions bills the owner.

### Local dev, deploy, cost
- Scaffold: `npm create deepspace my-app`, then `npm run dev` (= `deepspace dev start`, local Cloudflare runtime on port 8780). Deploy is `npx deepspace deploy` (= `npm run deploy`) and takes "a few seconds" per the quickstart. The CLI then polls `/.well-known/deepspace/release.json` until the new release is `confirmed`; other regions can lag. `deepspace rollback` exists.
- Deploy refuses a dirty worktree (`dirty_worktree`), so commit first. The first deploy from a checkout with a GitHub remote permanently records GitHub as the app's source. That's fine for us; run it from main.
- **Node requirement: >=22.15 <23, or 24.x/26.x, with npm >=11.6.** This machine has **node 18.19.1 / npm 9.2.0**, which won't run the scaffold. We need a newer Node, through nvm or similar, in a user dir, not a project install.
- Credits: 5,000 from the referral. Pricing pages are client-rendered and I couldn't read them, so I have no per-call credit costs. Storage, hosting and DOs seem to be plan-based, while integrations and AI cost credits. `npx deepspace integrations list/info` shows per-endpoint cost without logging in.

### Examples and templates
- create-deepspace templates: `base` (full scaffold), `starter`, `copilot`.
- SDK feature packs you install with `npx deepspace add <name>`: ai-chat, cron, file-manager, file-attachments, messaging, canvas, kanban, leaderboard, items, tasks, tree, documents, admin-page, search-bar, topbar, landing, mobile, testing.
- Testing: `deepspace/testing` Playwright fixture with N signed-in users. That's handy for showing multi-user realtime.

## Repo-rule gotcha
The scaffold drops **assistant instruction file** (base) and **assistant instruction file** (starter/copilot) into the app, and the docs have agent-oriented sections. Delete those files before the first commit so nothing tool-attributed lands in our repo.

## Hour estimates (one dev, SDK new to us; add ~25% if split across two people)

### (a) Crew app: login + live site rooms + photo pins + 6 PM job, total about 12-15 h
| Piece | Hours |
|---|---|
| Node upgrade, account/login (human), scaffold, first deploy, delete agent files | 1.5 |
| Schemas: sites, pins, reports; RBAC; Google login via AuthOverlay; site list | 1.5 |
| Live site room: RecordScope per site or siteId filter + `usePresenceRoom('site:'+id)` crew-on-site list | 1.5-2 |
| Photo pins: camera input, client resize, `useR2Files({scope:'app'})` upload, pin record with lat/lng, map (Leaflet) with live markers | 3-4 |
| 6 PM job: `schedule:'0 18 * * *'` + `runTask` fetch from Vultr/Tiger API (secret), write summary records, "run now" admin button, cron-log page | 2 |
| Worker proxy route to our backend for on-demand reads | 1 |
| Polish, empty/error states, judge test account, demo script, README "DeepSpace features used" | 2-3 |

### (b) Live classroom: rooms + presence + lock-in predictions, total about 9-12 h
| Piece | Hours |
|---|---|
| Setup, scaffold, deploy, Google login | 1.5 |
| Class rooms: create/join by code, RecordScope per class | 1.5 |
| Presence: `usePresenceRoom('class:'+code)` roster, live "answered" indicators via updateState | 1 |
| Predictions: question records, student prediction records (`update:'own'`), **lock enforced in a server action** (RBAC can't express "until locked"), teacher lock/reveal, live tally | 3-4 |
| Teacher dashboard, reveal animation | 1.5-2 |
| Polish, multi-user demo (2-3 devices or Playwright fixture), README | 1.5-2 |

(b) is smaller and more natural to demo live, since realtime is the whole point. (a) uses more SDK surface (auth + data + realtime + files + cron + external fetch), which fits "explain which features you used", but it has more moving parts.

## Things that could break a live demo
1. **Judges can't sign up with email.** Sign-in is Google or GitHub only, and email/password works only for pre-made `@deepspace.test` accounts. Either make test accounts and hand judges the credentials, or keep the main views `allowAnonymous`-readable. A page without `allowAnonymous` shows a **blank page** to signed-out visitors.
2. **Cron alarm is only armed by a request.** Open the app once after every deploy. Demo with `trigger()`, not the real 6 PM.
3. **Deploy propagation.** Some edges can serve the old release for a while ("unconfirmed"). Freeze deploys about 30 min before judging; `deepspace rollback` is the escape hatch.
4. **Alpha churn.** Pin 0.42.3. A release during the event could change APIs, and the platform side (auth worker, proxy) can change under us with no redeploy. 0.42.1 fixed requests hanging on route lookup, so the platform has had availability bugs very recently. Record a backup video.
5. **Cold starts are minor.** Workers start in milliseconds. DOs wake on first request and run additive schema migrations at that point, so warm the app (open every room) before judging.
6. **Venue Wi-Fi and WebSockets.** Realtime needs WS (`/ws/*`). Have a phone hotspot ready.
7. **Rate limits.** The platform only rate-limits `google/*` integrations, and nothing else limits us. Paid integrations or AI on a public button can burn the 5,000 credits, so gate behind sign-in, debounce, and add per-user caps. Credits expire Oct 28.
8. **Region.** Global Cloudflare edge. A DO lives near where it was first created, which will be Gainesville, so latency is fine. The Vultr/Tiger backend region matters more for the 6 PM job and proxy reads.
9. **Storage cap.** The docs say 128 MiB on the free plan. Resize photos on the client or the demo account may hit 409 mid-demo.
10. **Local Node 18** won't run the scaffold. Upgrade before the build starts.
11. **Backend reachability from Workers.** Use an HTTPS hostname on 443 and test the fetch from a deployed worker on day 1.

## Sources
- npm: `npm view deepspace`, `npm view create-deepspace`; tarball README.md, CHANGELOG.md, dist/index.d.ts, dist/worker.d.ts, dist/index.js (`src/shared/app-files.ts`), templates/base (package.json, wrangler.toml, worker.ts, src/cron.ts, src/integrations.ts, src/ai/chat-routes.ts), features/cron/feature.json
- https://docs.deep.space (index), /get-started/quickstart, /guides/authentication, /guides/scheduled-jobs, /sdk-reference/worker/cron, /guides/external-apis, /guides/background-jobs, /guides/file-uploads, /guides/presence-and-cursors, /guides/custom-domains, /guides/ai-chat, /concepts/deployment, /concepts/architecture, /concepts/permissions, /guides/custom-bindings, /guides/dev-workflow
- https://github.com/deepdotspace/deepspace (`gh issue list --state all`: none)
- /home/bot/hack/event/hacker-guide.md lines 349-360; /home/bot/hack/event/devpost.txt line 18
- Cloudflare Error 1003: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1003
