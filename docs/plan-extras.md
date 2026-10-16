# User testing, prototypes, two-person workflow, sleep

General, works for any idea. Feeds docs/36-hour-plan.md.

# Plan extras: user testing, prototypes, repo hygiene, sleep (Q5, Q6, Q14, Q18)

These are for docs/36-hour-plan.md and stay general because no idea is picked. Times are H = hours after 8:30pm Fri. "Me" = my side, "L" = @luanamaldaner's side.
Confidence tags: **[primary]** means I read the source itself. **[secondary]** means the number comes from a page that cites the original. **[reasoning]** means it's our own call with no source behind it.

---

## Q5. Real-user tests in about an hour (B4)

### Why 5, and why two rounds of 5 beats one round of 10
- NN/g: one user finds about L = 31% of usability problems. Problems found = N(1-(1-L)^n), so 5 users find about **85%**. NN/g says to split 15 users into **three rounds of 5** with fixes in between rather than running one big test ([NN/g, Nielsen](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)) **[primary]**.
- From that formula: 1 user finds 31%, 3 users 67%, 5 users 84%, 10 users 98% **[computed]**. Krug's DIY method uses 3 users per round and says 3 already show most of the serious problems ([Krug via gov.scot](https://blogs.gov.scot/digital/2015/06/18/5-tips-usability-testing-steve-krug/), [creativebloq](https://www.creativebloq.com/netmag/steve-krug-diy-usability-testing-6116958)) **[secondary]**.
- Caveat: this applies to usability problems on a focused task. It is not evidence of demand, and 5-10 people are not a statistic. In the pitch it's a "hallway test", not a "study".
- **For us:** do **round 1 (5 users) at lunch Sat, fix 3 things, then round 2 (5 users) at dinner Sat**. That gives a before/after number, which beats one round of 10 as pitch material.

### Time budget (fits in ~1h of people time per round)
| Step | Time |
|---|---|
| Prep: one task card, stopwatch, notes sheet (a shared doc or a `docs/user-testing.md` table), demo on a phone or laptop with seeded data | 10 min (do it once, before round 1) |
| 5 sessions × (5 min test + 1 min notes). Both of us test in parallel, so ~3 each | 20-25 min |
| Synthesis: tally, pick 3 fixes, open 3 issues | 10-15 min |
| **Total per round** | **~45-60 min** |

Hallway or guerrilla sessions usually run ~10 min ([Glasgow UX guide](https://www.gla.ac.uk/myglasgow/ux/deliver/guerrillatesting), [Adobe](https://xd.adobe.com/ideas/process/user-testing/hallway-usability-test-guerrilla-testing)) **[secondary]**. Keeping ours to 5 min means **one task only** **[reasoning]**.

### Recruiting at the venue
- **Where:** the meal lines (lunch Sat ~12pm, dinner ~6pm) and the sponsor-table and hardware-desk queues. People already standing in line are the easiest asks. Also: the hacker area, mentors, and volunteers. Volunteers are UF students and often the closest match to "real users" **[reasoning]**.
- **Ask:** "Got 5 minutes to try a thing we built and tell us where it's confusing? It's anonymous." Offer something small that we already have, like spare swag or a snack from the venue. **Don't spend money** (repo rule).
- **Screen in one question:** "Are you 18 or older?" If they say no, thank them and skip them. Optionally add one more question that fits the idea, such as "Do you ever do X?". Note their answer, not their name.
- **Expect** ~1 in 2 people asked to say yes, so ask ~10 to get 5 **[reasoning, no source]**.
- Guerrilla guides warn that convenient participants may not match the target user ([Glasgow](https://www.gla.ac.uk/myglasgow/ux/deliver/guerrillatesting)). Tag each person as "target user" or "not", and report the two groups separately.

### 5-minute hallway script (read it verbatim)
1. **(20 s) Intro + consent:** "We're two students building ___ for SwampHacks. We're testing the app, not you. No wrong answers. We don't take your name, photo or voice, only what happens on screen and how long it takes. You can stop any time. Are you 18+? OK to start?"
2. **(10 s) Think aloud:** "Please say what you're thinking as you go. I can't help you once you start, but I'll answer everything after." (No hints during the task. That's Krug's rule: [Wooster CS320 slides on RSME](https://csweb.wooster.edu/dguarnera/cs320/presentations/CS320-RSME.pdf) **[secondary]**.)
3. **(2-3 min) One task, written as a scenario on a card:** "You're ___ and want to ___. Starting from this screen, do it." Start the stopwatch on "go".
4. **(1 min) Measure:**
   - **Success:** finished unaided / finished with a hint / gave up.
   - **Time on task:** in seconds.
   - **Stumbles:** where they paused for more than 5 s, clicked the wrong thing, or said "huh".
   - **One rating:** Single Ease Question, "How easy was that, 1 (very hard) to 7 (very easy)?" (NN/g/MeasuringU standard post-task question. I recall the industry average is ~5.5, but that's **unverified**.)
5. **(30 s) One open question:** "What was the most confusing part?" or "Would you use this? For what?" Write down **one verbatim quote** per person.
6. Thank them. Don't argue, and don't demo the features they missed.

### Consent and privacy basics
- **Collect nothing identifiable:** no names, emails, photos, faces or voice recordings. Use participant IDs P1-P10. If we screen-record, record only the screen, with no mic and no camera. Skip anyone under 18.
- Verbal consent using the script line above is enough for anonymous product feedback **[reasoning]**. Stopping when someone asks to stop is the hard rule.
- **When IRB applies (US, Common Rule):** IRB applies only if the activity is both **research** ("a systematic investigation ... designed to develop or contribute to generalizable knowledge", 45 CFR 46.102(l)) **and** involves a **human subject** (interaction with a living person, or identifiable private info, 46.102(e)) ([OHRP-based summary](https://casrai.org/guides/human-subjects-research-definition), [Brown copy of 46.102](https://www.brown.edu/Administration/Research_Administration/OPRR/46-102.txt)) **[secondary]**.
  - A hallway test whose only purpose is improving our own prototype is QI/product feedback, not generalizable research. Several universities explicitly list QA/QI as not needing IRB review ([USF flyer](https://irb.research.usf.edu/IRB/sd/Doc/0/A00JLN8T548UM9T88EJ1CEGD00/Class%20Project%20vs%20Research%20Flyer_FINAL.pdf), [EWU](https://inside.ewu.edu/ogrd/?p=1423)) **[secondary]**.
  - Presenting results alone doesn't make it research ([QI vs research guidance](https://casrai.org/guides/quality-improvement-vs-human-subjects-research-irb-determination)) **[secondary]**.
  - **It becomes IRB territory if** we plan to publish a paper or poster that claims general findings about students, or if we collect identifiable or sensitive data (health, grades, location tied to a person). In that case, get a UF IRB determination **before** collecting. Institutions want a formal determination, not self-certification. I didn't find UF-specific guidance, so ask UF IRB if this ever comes up.
  - **So:** don't call it a "study" or "research" anywhere, and don't ask sensitive questions.
- The MLH Code of Conduct applies at the event, so don't photograph people without asking **[reasoning, standard MLH event rule]**.

### Turning findings into 3 fixes (15 min)
1. List every stumble. Next to each, count how many of the 5 people hit it.
2. Score each one **count × severity**, where severity is 3 = blocked or gave up, 2 = slowed more than 10 s or needed a hint, 1 = cosmetic or a comment.
3. Pick the **top 3 by score that each take ≤45 min to fix**. Anything bigger gets cut or goes on the "next steps" slide.
4. Open 3 issues titled `UT1: ...`, each with the count ("3/5 couldn't find the start button") and the fix.
5. Round 2 runs the **same task card**, so the numbers are comparable.

### How to cite it in the pitch and on Devpost
- **Pitch (one line, ~10 s):** "We put it in front of 10 UF students on Saturday. In round one only 2 of 5 finished without help. We fixed the three things that tripped them up, and in round two 5 of 5 did, median time 74 s down to 31 s." Then one real quote.
- **Devpost:** add a "Testing with real people" subsection to "Challenges"/"What we learned", with a small table (round, n, success, median time, mean SEQ) and the 3 fixes. Say "hallway test, n=5+5, anonymous, 18+".
- Judges' rubrics ask about impact ("Would real people use this?") ([Reskilll judging breakdown](https://blogs.reskilll.com/what-hackathon-judges-look-for-complete-judging-criteria-breakdown-2026/)) **[secondary]**. I couldn't find a Devpost winner write-up that quantifies hallway testing, which suggests few teams do it, so it's a differentiator **[reasoning]**.
- Keep the raw tally in `docs/user-testing.md` so every number on the slide traces back to it (matches the plan rule).

**Drop-in for B4:** "Round 1 at lunch (~11:30am-12:30pm, H15-16): 5 users, one task, success/time/SEQ/quote → 3 `UT` issues fixed by ~3pm. Round 2 at dinner (~6-7pm, H21.5-22.5): same task, 5 new users. Done when docs/user-testing.md has both rounds and the before/after line is on the pitch slide."

---

## Q6. Two or three throwaway prototypes vs one

### Evidence
- **Dow et al. 2010 (ACM TOCHI 17(4), DOI 10.1145/1879831.1879836):** novice designers made web ads either **in parallel** (3 prototypes → feedback → 2 more → feedback → final) or **in series** (feedback after each one). Both groups made 5 prototypes plus a final in the same time. The parallel group's final ads did **significantly better on click-through and expert ratings**, were rated **more diverse**, and the designers gained **more self-confidence**. The authors explain it as serial work causing fixation on one idea ([UCSD ProtoLab summary](https://protolab.ucsd.edu/?p=3561), [HFI summary](https://www.humanfactors.com/newsletters/parallel_prototyping.asp), [Stanford PDF](https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-submitted.pdf)) **[secondary]**.
  - One third-party page gives ~445 vs 397 clicks per million impressions over a 15-day campaign. That's **unverified** (I couldn't extract the PDF), so it stays off slides.
- **Dow et al. CHI 2011, "Prototyping Dynamics":** groups that **made and shared multiple prototypes** explored more, built more rapport, shared more features and reached better consensus ([Stanford HCI](https://hci.stanford.edu/publications/paper.php?id=157), [GA Tech talk summary](https://www.tlwarc.hg.gatech.edu/node/63804)) **[secondary]**. This matters for a 2-person team that has to agree fast.
- **Caveats:** these studies used cheap artifacts (ads) and novices. A hackathon prototype costs hours, not minutes. I found **no solid hackathon or AI-era source** on "build 3 versions then pick". The posts I found are tool roundups. So the shape below is our own call.

### Recommendation
- **How many:** **2 real prototypes** (one per person, both end to end and ugly), plus **3 cheap static mockups of the single demo screen**. The assistants can generate those in ~10-15 min each, in the background, while the prototypes get built. Three full prototypes would cost too much of the 35h. Mockups get us the Dow divergence on the visual for nearly free **[reasoning]**.
- **How long:** a **90-minute hard timebox** for each prototype, then a 20-min show-and-pick. The current B1 budget of 2-3h each is too generous: with assistants, an ugly end-to-end spike in 60-90 min is what our own timings suggest (the first big deliverable took ~27-60 min). A spike that isn't working at 90 min is itself a signal. **Proposed B1: H1.5-3.5 (10pm-12am) build, H3.5-4 (~12:30am) pick, then start B2 early.** That gives back ~1.5h for B2 and for sleep **[reasoning]**.
- **What each prototype must prove:** that the **demo moment** works on **real data**. Not auth, not styling.
- **How to decide (score 1-3 each, 20 min total):**
  1. Demo moment: do 2-3 passersby say "oh, nice" within 30 s without being told what to look at?
  2. Is the technical core real and explainable (could we defend it on criterion 1)?
  3. Did the data path actually work (remember the 1-in-3 surprise rate)?
  4. Hours of known risk left.
  5. Prize fit.
  Highest total wins. On a tie, take the one with the working data path. **Steal** the best feature or visual from the loser (Dow: merging ideas across prototypes is part of the benefit). Then **delete the loser's branch**, and never merge prototype code wholesale.
- **Kill rule:** if neither prototype shows the moment at 90 min, don't start a third. Take the one with the working data path and spend 60 more min on its demo moment.

---

## Q14. Two people + two coding assistants on one repo

### What goes wrong (reported)
- A preprint on **33,596 agent-authored PRs** (Xu et al. 2026, arXiv:2607.04697, as summarized by [D. Vaughan](https://codex.danielvaughan.com/2026/07/28/agent-pr-merge-conflicts-concurrent-coding-agents-codex-cli-worktree-isolation-coordination-defence/)) found:
  - Textual conflict rates of **19.8%** for PR pairs from the same agent and **41.7%** for PR pairs from different agents.
  - **84% of conflicts were in source files**. Lockfiles were only 3.9%.
  - Conflict types: content 58%, modify/delete 27%, add/add 15%.
  - The related AgenticFlict dataset reports a 27.7% conflict rate across 142k agent PRs.
  This is **[secondary]**, a preprint, not peer reviewed. Takeaway: two different assistants touching the same files conflict about **2× as often**, so the fix is file ownership, not better merging.
- **Same working directory = silent overwrites.** Git only sees commits, so two agents in one checkout overwrite each other's uncommitted edits with no error. They also fight over `.git/index.lock` and work from stale views ([augmentcode](https://augmentcode.com/guides/git-worktrees-parallel-ai-agent-execution), [openreplay](https://blog.openreplay.com/git-worktrees-ai-agents/), [dev.to](https://dev.to/yureki_lab/how-i-run-multiple-claude-code-agents-in-parallel-without-collisions-3pbk)) **[secondary]**.
- **A clean merge doesn't mean it works.** Semantic conflicts (renamed field, changed response shape) get through, so CI has to build and test every merge ([Vaughan](https://codex.danielvaughan.com/2026/07/28/agent-pr-merge-conflicts-concurrent-coding-agents-codex-cli-worktree-isolation-coordination-defence/)) **[secondary]**.
- **Wrong-worktree / drift:** agents editing the wrong checkout, reviewers looking at a different checkout ([git-kura README](https://pkg.go.dev/github.com/tooppoo/git-kura)) **[secondary]**.
- **Common assistant habits that cause churn** **[reasoning, from experience]**:
  - reformatting whole files (formatter or quote-style drift → giant diffs);
  - "helpfully" fixing the other side's files;
  - adding duplicate utilities;
  - inventing contract fields;
  - touching shared config (`vite.config`, `tsconfig`, `pyproject`, CI);
  - adding dependencies without saying so.

### Rules to drop into the plan (B0, ~20 min, before anyone generates code)
1. **Folder ownership.** For example, me: `api/`, `ml/`, `data/`; L: `web/`. Shared: `contracts/`, root config, `package.json`/lockfiles, `.github/`.
   - Write the map in NOTES.md **and** in the assistant instruction file each side uses : "Only edit files under X. To change shared files, open a separate tiny PR and @ the other person."
   - The shared rule is the cheapest defence against the 2× cross-agent conflict rate.
2. **Contract first, in 20-30 min of B0.** One file, `contracts/api.ts` (TS types) or `contracts/openapi.yaml`, with example JSON fixtures in `contracts/fixtures/*.json`.
   - The frontend builds against the fixtures through a mock (a static JSON fetch behind a flag, or MSW/Prism if we're already using them).
   - The backend has a test asserting its responses match the fixtures.
   - Changing the contract = its own PR, both of us approve, merged before code that uses it. (The plan already costs each contract mismatch at 30-90 min.)
3. **One task = one branch = one worktree.** Never run two assistants in one checkout. `git worktree add ../wt-<topic> -b alexander-freedman/<topic>`, and delete the worktree once merged.
4. **Small, fast PRs.**
   - Size: target **<200 changed lines** of hand-relevant code, hard cap ~400. Google's guide calls ~100 lines reasonable and 1000+ too large ([summaries](https://tianpan.co/blog/2019/11/21/192-google-software-engineering), [freeCodeCamp](https://www.freecodecamp.org/news/what-google-taught-me-about-code-reviews/)) **[secondary]**.
   - Branch life: **<2-3 hours** at a hackathon. Trunk-based guidance is <1 day and ≤3 live branches ([Octopus/DORA](https://octopus.com/blog/continuous-delivery-office-hours-e3), [Mergify](https://mergify.com/learn/trunk-based-development/short-lived-branches)) **[secondary]**; our scaled-down version is **[reasoning]**.
   - Rebase on main right before opening the PR, and merge sequentially (rebase the next PR after each merge).
5. **Review SLA, not review gates.** Non-risky PRs inside your own folder can merge after CI passes, with a 15-min heads-up comment. PRs touching shared files or contracts need the other person's approval. This matches the plan's "never block on review", plus the repo rule.
6. **CI from H0:** one GitHub Action running build + lint + tests (+ contract fixture test) on every PR and on main, ~10-15 min to set up. A red main gets fixed before any new feature.
7. **Formatter locked in B0:** commit the Prettier/Ruff (or Black) config plus a pre-commit or `npm run format`, and tell assistants "run the formatter, never reformat untouched files". This kills whole-file churn.
8. **Dependencies and lockfiles:** one owner per manifest (e.g. L owns `web/package.json`, me `api/pyproject` / `requirements.txt`). New deps go through that person or a `deps:` PR.
   - On a lockfile conflict: never hand-edit. Fix `package.json` first, take main's lockfile, then `npm install --package-lock-only` ([tkdodo](https://tkdodo.eu/blog/solving-conflicts-in-package-lock-json), [hashrocket TIL](https://til.hashrocket.com/posts/p1qugz14bc-git-npm-resolving-lockfile-conflicts-)) **[secondary]**.
   - CI uses `npm ci`.
9. **Generated code:** don't commit build output or generated clients (`dist/`, `__pycache__`, generated SDKs go in `.gitignore`). If a generated file has to be committed, mark it in `.gitattributes` (`linguist-generated`) and on conflict **regenerate it, never merge it**.
10. **Feature flags = env var or query param.** `?demo=1` / `DEMO_MODE=1` switches to fixture or replay data. Unfinished features merge to main behind `FEATURE_X=0`, so main is always demo-able (the plan rule). Flags are plain `if`s, not a flag service.
11. **Claims:** each issue says which folders it touches (similar to git-kura's "path seals"). If two open issues claim the same file, the later claimer stops (matches the CLAIM LOCK rule).
12. **Shared memory files** (TASKS.md, NOTES.md) conflict often because both sides append. Keep entries one line each, append at section bottoms. On conflict, keep both sides; don't hand-merge in favour of one. Optional: `.gitattributes` `TASKS.md merge=union` (union merge keeps both sides' lines; check the result by eye).

---

## Q18. Sleep for ~36h with 2 people

### Evidence
- **Awake time vs alcohol:** Dawson & Reid (Nature 1997) found performance after **17h awake ≈ 0.05% BAC**, **22h ≈ 0.08%**, **24h ≈ 0.10%** ([patent text summarizing it](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8075484), [SWOV](https://swov.nl/en/publicatie/fatigue)). A 2001 simulator replication found **18.5h ≈ 0.05%, 21h ≈ 0.08%** ([PubMed 11235795](https://pubmed.ncbi.nlm.nih.gov/11235795)) **[secondary]**. The equivalence held on some tests, not all.
  - Applied to us: if we wake at 8am Fri, we hit 17h at **1am Fri night** and 0.08-equivalent by **~6am Sat**. Someone who never sleeps is ~49h awake at Sunday judging **[computed]**.
- **Circadian low:** alertness and performance bottom out around **2-6am** (4-6am in a NIOSH-sponsored report, which notes the dip persists even if you slept enough) ([NTRL abstract](https://ntrl.ntis.gov/NTRL/dashboard/searchResults/titleDetail/PB2015102119.xhtml)) **[secondary]**. With sleep loss, the worst window can shift to 6-10am (Wesensten 2002, [PDF](https://www.gwern.net/doc/modafinil/2002-wesensten.pdf)) **[secondary]**. That overlaps Sunday's submit-and-judging morning, so Sunday morning is exactly when we most need to have slept.
- **NASA nap:** a ~**26-min** nap in the cockpit improved performance **34%** and alertness **54%** ("up to") vs no nap (Rosekind et al., 1995) ([Sleep Foundation](https://www.sleepfoundation.org/sleep-hygiene/nasa-nap), [Time](https://swampland.time.com/?p=46445)) **[secondary]**.
- **Sleep inertia:** keep naps **<30 min**, since slow-wave sleep starts around 30 min in and waking from it is the groggiest ([Wikipedia: Sleep inertia](https://en.wikipedia.org/wiki/Sleep_inertia)). Grogginess usually lasts **30-60 min**, sometimes up to 2h ([SKYbrary](https://skybrary.aero/articles/sleep-inertia)) **[secondary]**.
  - So for a longer block, sleep **full ~90-min cycles (3h)**, not 45-60 min.
  - "Caffeine nap": coffee right before a ≤25-min nap kicks in on waking, about 30 min later ([SKYbrary](https://skybrary.aero/articles/sleep-inertia)). That's practical advice; continuous low-dose caffeine did remove post-nap inertia in a lab study ([Van Dongen 2001](https://www.med.upenn.edu/uep/assets/user-content/documents/Van_Dongen_etal_Sleep_24_7_2001.pdf)).
- **Caffeine cutoff:** 400 mg taken **6h before bed cut objective sleep by >1h**, and people didn't notice ([Drake et al. 2013, JCSM, PMC3805807](https://pmc.ncbi.nlm.nih.gov/articles/PMC3805807/)) **[primary abstract]**. Stop big doses ~6h before your sleep block.
- **Split sleep:** a 90-min + 30-min split held up for overnight shift workers (Hiroshima study, via an all-nighter roundup) **[secondary, weak]**. A hackathon builder's guide: "if you're creating more bugs than you're fixing, go to bed" ([BuilderBase ch.13](https://intercom.help/builderbase/en/articles/14836126-builder-s-guide-ch-13-surviving-an-overnight-hackathon)) **[secondary]**.
- I found **no source on what repeat winners do** for sleep, so the schedule below is our own design from the evidence above.

### Staggered schedule (one of us always awake, ~6h sleep each + a nap)
Assumes we both wake ~8am Fri. Replace the "Sleep in shifts" note in B2 and add rows to B6-B8.

| Time | Me | L | Why |
|---|---|---|---|
| Fri 8:30pm-1:30am (H0-5) | awake | awake | B0/B1 need both; spike + pick |
| **1:30-4:45am** (H5-8.25) | awake: model/eval runs, data jobs, **no deploys or merges to main** | **sleep 3h** (2 cycles + ~15 min to fall asleep) | the sleeper takes the worst circadian hours; the person awake does low-risk solo work |
| **4:45-8:00am** (H8.25-11.5) | **sleep 3h** | awake: UI against fixtures/real API; merges own-folder PRs if CI is green | |
| 8:00am Sat (H11.5) | up | up | both awake for the **H12 "can we demo now?" checkpoint** |
| Sat ~2:00-2:30pm | **26-min nap** | awake | post-lunch dip; after round 1 user tests |
| Sat ~2:30-3:00pm | awake | **26-min nap** | |
| Caffeine | last big dose ~6:30pm | last big dose ~9:30pm | Drake: ≥6h before your sleep block |
| Sat 8:30pm-12:30am (H24-28) | awake | awake | **feature freeze at H28 + video**: both must be awake |
| **12:45-3:45am Sun** (H28.25-31.25) | **sleep 3h** | awake: Devpost write-up, screenshots; **no code merges** except a fix for a break | |
| **3:45-6:45am** (H31.25-34.25) | awake: bug fixes only, final eval table, **submit by ~6:00am** | **sleep 3h** | the submitter has to be the one with the fresher brain; I'm 2h off sleep at 6am |
| 6:45-8:00am | rehearse together; final Devpost edits | up by 6:45, water + coffee + walk; rehearse | ≥60-90 min awake before judging (sleep inertia 30-60 min) |
| Sun judging | awake | awake | |

Totals: ~6h sleep + 26-min nap each. At judging, L has been up ~2.5h and I ~5h, versus ~49h with no sleep.

### When NOT to be asleep (hard rules)
- **Neither** person sleeps during:
  - B0/B1 (decide + pick);
  - the **H12 checkpoint**;
  - **feature freeze (H28) and the video recording**;
  - the **submission window (5:30-8:00am Sun)**;
  - the **90 min before judging**;
  - judging itself.
- **Never both asleep at once.** Someone has to watch the deploy, the repo and the gear.
- The sleeping person's branch is frozen. The awake person doesn't merge into main things that touch the sleeper's folder or the contract; open the PR and @ them instead.
- **No naps longer than 30 min** unless it's a full 3h block (avoids waking from deep sleep).
- **No new naps after 7:30am Sun.**
- **Rule of thumb:** after ~17h awake (~0.05% BAC equivalent), no deploy config changes, no data migrations, no contract changes, no `git` surgery. Queue them for when the other person is awake, or do them with a second pair of eyes.
- **Pack:** eye mask, earplugs, hoodie, a sleeping bag or pad. Venues are bright and loud. Set two alarms, and have the awake person wake the sleeper on schedule.

### Plan tweaks implied
- B1 shrinks to ~2.5h (see Q6), so B2 starts ~12:30am and the first sleep block can start at 1:30am without losing core depth.
- B2's "Sleep in shifts: 3-4h each" becomes the table above. The current plan has **no Saturday-night sleep**, and that's the riskiest gap: Sunday 6-10am is the sleep-deprived circadian worst window ([Wesensten 2002](https://www.gwern.net/doc/modafinil/2002-wesensten.pdf)), and it's exactly submit + judging time.
