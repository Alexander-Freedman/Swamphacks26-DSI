# 48-hour plan (general, works for any idea)

Nothing is picked. This plan works for whatever we build. Hacking opens **~8:30pm Fri**, Devpost closes **8:00am Sun** (35.5h), and judging is Sunday morning. "My side" = me; "Luana's side" = @luanamaldaner.

## The real goal
A working first version is cheap now. Judges at 2026 events saw almost no broken demos and had to pick on something else ([Semgrep](https://semgrep.dev/blog/2026/the-ai-hackathon-effect)). XII's first criterion is **"could the team explain how and why they built it?"** (docs/teardowns.md). So the 35 hours are for the things the first version doesn't give us:
1. **One demo moment** a judge remembers, which works every time.
2. **One real technical core** we can explain and measure (a model or algorithm plus an eval number).
3. **Proof it matters to a real person**: real data, plus 5-10 real students or users trying it at the event.
4. **Polish and reliability**: design, seeded data, a backup video, the obvious detours hardened.
5. **The pitch**: rehearsed, with every number traceable to its source, and both of us able to defend every choice.
6. **Prize fit**: every honest sponsor or MLH prize stacked and named.

**Proof that AI-heavy teams can win this exact sponsor:** Sperry's last 1st place (Common Ground) says in its README it was built in ~31h by coding agents working from written specs. It won on one clear picture, sources behind every number, a test against the answer key, and changes made after asking Sperry's reviewers (docs/sperry-deep.md). The speed went into checking and feedback, not into more features.

## How long things actually take (evidence from this session, Oct 16)
These come from git timestamps and run times in this repo today, not guesses.

| Task | What happened today | Range to budget |
|---|---|---|
| Research pass (one question, cited) | 15 passes ran 3 to 27 min each, median ~8 min | 5-30 min |
| Turn findings into a committed doc | Most docs landed 2-10 min after their research | 5-15 min |
| First big deliverable from zero (strategy doc + issue + PR) | Kickoff 13:37 to PR 14:04 = 27 min, with 5 passes in parallel | 30-60 min |
| Tiny script that "should just work" (docs → PDF, ~40 lines) | 2 bugs (variable clash, list rendering), ~8 min to working | 10-30 min, never 2 |
| Third-party data source | 3 of ~8 sources surprised us: OSHA blocks scripts (403), Open-Meteo lightning is null for FL, the first IEM query form returned ~nothing | +30-60 min per source; expect 1 in 3 to misbehave |
| Tooling friction | `gh pr edit` failed silently and needed an API fallback; a restart killed 5 running passes | 5-15 min, a few times a night |
| Facts from generated research | Fact-check found 3 of 24 key claims wrong (~12%) | Verify anything that goes on a slide |
| Human setup (machines, accounts, access) | @luanamaldaner's side took ~3h ("spent all my time figuring ts out") | 1-3h; do it once, early |
| Waiting on a review | PR #4 has been open 4h+ with no review | Never block on a review for non-risky work |

## What judges reward once everyone ships fast (docs/ai-era.md)
- **A working demo is table stakes.** A Semgrep judge at two 2026 events saw *every* team with working code, a polished UI and real data, and no crashes. Winners stood out on product sense: problem, why existing fixes fail, and the fix in one sentence, with tight scope ([Semgrep](https://semgrep.dev/blog/2026/the-ai-hackathon-effect/)).
- **Judges now mark down:**
  - the default generated look (purple gradients, Inter, three icon cards)
  - 8-10 features that don't connect
  - a chatbot where a form would do
  - AI voiceovers
  - **a team that can't explain its own code** (a 24h event in Mar 2026 was lost for exactly that)
- **Real problems + real users win.** An AI lab's 2026 hackathon had 4 of 5 winners who weren't professional devs, working on problems they knew firsthand. An ElevenLabs hackathon winner tested on real call recipients and reworked the product after people hung up.
- **Evidence over claims.** Some organizers now check the repo against the pitch automatically. MLH requires AI use to be disclosed and credited in the README.

## Where AI is slow or unreliable, so we budget extra
**Outside evidence (docs/ai-era.md):**

| Study | Finding |
|---|---|
| METR RCT 2025 (experienced devs, own repos) | **19% slower**, while believing they were 20% faster |
| Greenfield Copilot RCT | 55.8% faster |
| Stack Overflow 2025 | 66% get "almost right" code; 45% say debugging AI code takes longer; 76% won't use AI for deployment |
| Package and API errors | 5-20% of samples invent packages; 25-38% use deprecated APIs; accuracy drops sharply on APIs newer than the model |
| Embedded | best 56% pass@1, ESP-IDF 29% |
| Long tasks | agents finish ~1-2 human-hour chunks at ~50% reliability |

So AI is fast at greenfield scaffolding and slow at the last 30%: integration, deploy, debugging, new APIs and hardware.

**Realistic ranges with AI** (no source measures these directly; these are estimates anchored on the evidence above):

| Task | Range |
|---|---|
| Scaffold + first deploy | 0.5-1.5h |
| Managed auth (Auth0) | 0.5-1.5h |
| Hand-rolled OAuth | 2-5h (avoid) |
| DB setup | 0.5-2h |
| Map UI | 1-3h, +2-4h for custom layers |
| ML baseline + eval | 3-6h, including 1-3h of labeling |
| LLM feature with caching | 1-3h |
| Hardware sensor → app | 3-8h |
| Design pass | 2-4h |
| Demo/replay mode | ~1h |
| Demo video | 2-3h |
| Devpost write-up | 1-1.5h |
| **Integration-surprise buffer** | **3-4h** |

All of that fits 2 people × ~28 awake hours with ~15% slack, *if* we skip hand-rolled auth and do at most one hardware sensor.

**Where to budget extra, from today plus the evidence:**
- **Deploy + HTTPS + domain + env vars:** 1-3h the first time, so do it in H0-2, not H30.
- **Auth (Auth0 roles, callbacks):** 1-3h, and roles aren't in the token by default (docs/feasibility.md). Only add it if it's a prize we're going for.
- **Integration between our two halves:** each contract mismatch costs 30-90 min. Agree the API first and build against a mock.
- **Data plumbing:** see the 1-in-3 surprise rate above.
- **Rate limits and API keys** (Gemini etc.): cache responses, and keep an offline or fixture path for the demo.
- **Hardware:** the standard MLH lab lacks most of what we'd want. Double every estimate, or skip it.
- **Design taste:** generated UI is generic. A human eye plus 2-4h of polish is needed.
- **Flaky live demos:** network, camera, mic, projector. A replay or fixture mode plus a recorded video are mandatory.
- **Understanding generated code** (Technical Understanding is criterion 1): budget 1-2h for both of us to read and explain the core.

## Blocks
Each block has a goal, who does what, and **done when**. "H" = hours after 8:30pm Fri. Ranges are for the work itself, not including sleep.

| Block | When | Goal | My side | Luana's side | Done when |
|---|---|---|---|---|---|
| **B0 Decide + set up** | H0-1.5 (8:30-10pm) | Pick the idea, lock the prizes, get accounts | Ask sponsors and the hardware desk (docs/friday-checklist.md); accounts | Repo skeleton, empty deploy | One-liner in TASKS.md; issues opened from docs/first-6h.md; `/api/health` live on a URL (1-3h, so it may run into B1) |
| **B1 Two timeboxed prototypes** | H1.5-4 (10pm-12:30am) | Find the demo moment fast | Ugly prototype A, end to end, **hard 90 min** | Ugly prototype B (a different interaction), **hard 90 min**; 3 static mockups of the demo screen generated in the background | 20-min pick at ~12:30am, scoring 1-3 each on: passersby react in 30 s / real, explainable core / data path works / known risk left / prize fit. Steal the loser's best bit, delete its branch, never start a third. (Parallel prototyping beat serial in Dow et al. 2010; no hackathon-specific evidence, so this is our call.) |
| **B2 Core depth** | H5-9 (1:30-5:30am) | The technical core works on real data | Model/algorithm + eval v0 + label/split frozen | The real UI on the real API, the demo path | Eval number in the README; demo path runs on the deployed URL. Sleep in shifts: 3-4h each, staggered |
| **B3 Checkpoint + harden** | H9-14 (5:30-10:30am Sat) | Demo-able from main at any moment | Fix integration bugs; replay/fixture mode | Loading, empty and error states; phone layout | At H12 we can honestly answer yes to "can we demo right now?", posted in the Plan issue |
| **B4 Real users, round 1** | H14-19 (10:30am-3:30pm) | Evidence it matters | Test flow + logging; fix the top 3 (each ≤45 min) | Run **5 users at lunch** (~11:30-12:30) with a 5-min script: consent line, one task card, think-aloud, success/time/1-7 ease, one quote. No names/photos, 18+, IDs P1-P5 | `docs/user-testing.md` has the findings; top 3 fixed. 5 users find ~85% of usability issues (NN/g). This is product feedback, not a study, so don't call it research |
| **B5 Depth + design + users round 2** | H19-24 (3:30-8:30pm) | Earn top marks on Tech and Design | One depth feature from the scorecard gap; eval on real data | Design polish pass; **round 2: 5 users at dinner (~6-7pm), same task card** | Scorecard re-graded; a before/after line for the pitch (e.g. "2/5 → 5/5, 74s → 31s"); Devpost draft started |
| **B6 Freeze + backup** | H24-28 (8:30pm-12:30am) | Lock it, protect the demo | Feature freeze at H28; README, architecture diagram | **Record the backup demo video** (1.5-2.5h with edits) | Video uploaded unlisted **and its URL already in the Devpost draft** (YouTube processing can take hours; the video can't change after 8:00am); main tagged |
| **B7 Polish + write** | H28-32 (12:30-4:30am Sun) | Submission-ready | Bug fixes only; final eval table | Devpost write-up (450-1,100 words, screenshots) | Draft complete; every sponsor tool named |
| **B8 Submit + rehearse** | H32-35.5 (4:30-8:00am) | Ship early, then practice | **Submit by ~6:00am**, then edit until 8:00 | Rehearse the 3:00 and 1:30 pitches 3× each; "why did we do X" drill | Submitted; final edits done early (editing a live gallery entry unpublishes it until re-review); both of us can explain every part and give both pitches solo |
| **Judging** | Sun morning | Win the table | Driver + technical Q&A | Narrator | — |

## Sleep (docs/plan-extras.md)
The old plan had **no Saturday-night sleep**, and the sleep-deprived low hits Sunday ~6-10am, which is our submit and judging window. For reference: 17h awake ≈ 0.05% BAC, 24h ≈ 0.10% (Dawson & Reid 1997). This assumes we both woke ~8am Fri:

| Time | My side | Luana's side |
|---|---|---|
| Sat 1:30-4:45am | awake | sleep ~3h |
| Sat 4:45-8:00am | sleep ~3h | awake |
| Sat ~2-3pm | 26-min nap (staggered) | 26-min nap (staggered) |
| Sun 12:45-3:45am | sleep 3h | awake: write-up, no merges |
| Sun 3:45-6:45am | awake: submit by ~6:00 | sleep 3h |
| Sun 6:45am → judging | both up, rehearse | both up |

**Rules:**
- Never both asleep at once.
- Nobody sleeps during B0/B1, the H12 checkpoint, freeze + video, or the 90 min before judging.
- Stop big caffeine ~6h before your sleep block.
- After ~17h awake, no deploy, migration, contract change or git surgery without the other person.

## Repo rules for two people + two assistants (docs/plan-extras.md)
One preprint on ~34k AI-written PRs found a **41.7% conflict rate** when two different assistants worked in parallel vs 19.8% for one (not peer reviewed). So:
- **Folder ownership**, written in NOTES.md and in each side's assistant instructions.
- **Contract first**, frontend against a mock.
- **One task = one branch = one worktree.**
- **PRs under ~200 lines**, branches under 2-3h.
- **CI and a formatter in hour 1.**
- **One owner per lockfile.**
- **Demo flag `?demo=1`.**

## Deploy (docs/deploy-provenance.md)
- **Vultr + Caddy + docker compose:** HTTPS first on `<ip>.sslip.io`, then switch to the domain once DNS resolves. Ask at the MLH desk whether the Vultr credit needs a card; if it does, use the fallback (no-spend rule).
- **Fallback:** Render free (API) + a static frontend.
- **Emergency:** a Cloudflare quick tunnel from a laptop.

## Rules for the whole 35h
- **The demo script is the spec.** Build only what judges will see (docs/pitch.md for now; docs/demo-script.md once we pick).
- **main always runs end to end**, so we're demo-able every hour.
- **Cut early.** If a block runs past its upper range, cut the feature, not the sleep or the video.
- **Don't block on reviews** for low-risk PRs. Merge and keep going, and review after.
- **Verify any number that goes on a slide** (12% of generated claims were wrong today).
