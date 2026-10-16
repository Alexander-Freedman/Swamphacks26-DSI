# Lean finance stack (L-F1): transfer-fraud interceptor

Feeds docs/prize-strategy.md. Nothing is picked.

# L-F1: lean transfer-fraud interceptor ("Held at the bank"), ~30h core

Oct 16. Same format and conventions as ps-redteam.md (L1/M1): ~37-41h real build budget, 3-4h integration buffer, reliability factor = P_ok + (1-P_ok)×0.4. Cash readings as in ps-stacks.md: **A** = split four ways regardless of team size (we get half), **B** = split among members. Physical prizes ×2. Probabilities are gut estimates for ranking, not forecasts. Sources: ps-fintech.md, ps-stacks.md, ps-redteam.md, docs/prize-strategy.md, docs/36-hour-plan.md, docs/judges.md, docs/ideas.md, plus checks run today (below).

## Bottom line

- **Adjusted EV ~$232 (A) / ~$261 (B, Capital One = $500) / ~$361 (B, Capital One = $1,000).** L1 is ~$280/$306, M1 ~$132/$194.
- **It ranks #2: below L1, well above M1**, under the most likely reading of the Capital One prize. Both official readings that agree ("$250 per member" in the guide; Devpost's "$1,000" split four ways under the rules) give a 2-person team **$500**. It only goes to #1 if the help desk says the full $1,000 goes to us, *and* our Capital One odds are ≥ ~16%.
- **It's a one-prize bet.** Capital One is ~45% of its EV. L1 spreads across Sperry's 3 places, plus interviews. L-F1 has a higher chance of nothing, and no recruiting upside.
- **The crowd is real and recent.** Three Nessie scam/hold projects went up on Devpost in the last two weeks (MHacks 2026 "Aval", a bank-side family hold on risky payments; HackNC 2026 "Ring-Radar", freezing mule accounts; HackNC 2026 "FinGuard"). Capital One reps travel the MLH circuit, so **"we hold the transfer" is no longer novel on its own.** The hook has to be the bank-side hold *driven by a model whose numbers we can defend*. Aval's own write-up says its risk score is computed "from live Nessie data", which is mock data.
- **Data is not a blocker.** PaySim and the credit-card set both have no-account mirrors (checked today). Kaggle itself needs a login.

---

## 0. Facts checked today

| Check | Result | What it means |
|---|---|---|
| Kaggle API download, PaySim (`ealaxi/paysim1`) and credit-card (`mlg-ulb/creditcardfraud`), no token | **404 on both** | The Kaggle originals need a Kaggle account. Under our rules, a human would have to download them. We don't need to, see the next rows |
| **PaySim mirror on Hugging Face** `datasets/theman10/paysim`, `paysim.csv` | **494 MB** (493,534,783 B), not gated, MIT tag, no login. The header matches the Kaggle original (`step,type,amount,nameOrig,oldbalanceOrg,newbalanceOrig,nameDest,oldbalanceDest,newbalanceDest,isFraud,isFlaggedFraud`) | Primary source. It's a third-party re-upload, so verify it at load time: 6,362,620 rows, 8,213 fraud, 16 `isFlaggedFraud` (the Kaggle card's numbers). Stop if it doesn't match |
| Smaller PaySim copies on HF | `purulalwani/Synthetic-Financial-Datasets-For-Fraud-Detection` one parquet, **274 MB**; `flwrlabs/fed-fraud-paysim-banks` (Flower Labs, CC-BY-4.0), 3 parquet files, **276 MB**, adds a `BankID` column | Fallbacks if the 494 MB copy is slow or fails the row-count check |
| Download speed from our box | 50 MB range in **3.0 s (~17 MB/s)**, so the full CSV takes ~30 s | **Download on the server, not on a laptop over venue Wi-Fi** (hundreds of people on one network: guess 2-10+ min). Do it at 8:30 PM, not before, to stay clear of the "nothing before hacking starts" rule |
| Credit-card fraud set, no account | TF storage `storage.googleapis.com/download.tensorflow.org/data/creditcard.csv` **151 MB, 200**; OpenML did 1597 also 200 | Available, but **it can't score a live transfer**: its features are anonymized PCA components V1-V28. At most it's a second, offline "the method holds up on real card data" eval. It's on the cut list |
| Nessie `/enterprise/transfers` | 1,591 transfers. Status counts: completed 1357, pending 230, **bogus 2**, cancelled 2 | A "bogus" status suggests teams can set `status` on POST. That's an inference, not documented. Whether PUT can change status later is **unverified**; it's gate H1 |
| Nessie docs | The 2026 site is a JS app, and transfer fields aren't greppable from the bundle | Check the docs page by hand at H0-1 |
| Devpost "fraud nessie" / "scam nessie" | 39 / 11 hits. Aval (MHacks 2026, Oct 4), Ring-Radar and FinGuard (HackNC 2026, Oct 11) | See crowding below |
| Judges (docs/judges.md) | A **Blackhawk Network** judge is in the general pool, and Blackhawk works on fraud mitigation and chargeback disputes | Good for Overall if we're honest, and dangerous if we overclaim. Expect the precision/recall and false-hold-rate question |

---

## 1. The idea, lean

**One picture:** the bank app's "Send money" screen. A $2,000 transfer to a new payee flips to **"Held at the bank: 91st-percentile risk"**, with the top 3 reasons ("new payee", "drains 96% of balance", "payee received 6 transfers in the last hour").

**One live moment:** the judge plays the scammer's victim and sends the money. It's held *on Nessie* (a real pending transfer), and the trusted contact's phone lights up. Then "I know this person" plus a second login releases it, and the transfer completes on Nessie, balance updated.

**One number:** on a held-out *later* time window of PaySim, at our chosen threshold, it catches X% of fraud while holding Y of every 1,000 legit transfers, vs Z% for the PaySim built-in rule. Every number goes in the README.

**Architecture:** FastAPI + LightGBM on Vultr → Tiger Data as the only database → React. Nessie over HTTPS is the money rail. Same shape as L1: one backend, one store.

### How the bank-side hold becomes the hook (and not "another fraud detector")

1. **The hold lives at the bank, not in a browser extension or a chatbot.** It's a real Nessie transfer in `pending`, which flips to `completed` or `cancelled`. That's Capital One's literal brief: money moving, with a safety guard, improving the user's financial life.
2. **The decision is a trained model with an operating point, not a vibe.** We choose the threshold from the eval (holds per 1,000 legit transfers vs fraud caught) and show it. This separates us from Aval, Ring-Radar and FinGuard, whose public write-ups use heuristics or scores on mock data.
3. **The release is the human step.** A hold that the account owner can release with a stronger login (Auth0 step-up, stretch #1) is what a real bank does. "Freeze everything" is not.
4. **We say what it costs.** The false-hold rate is on screen. Blackhawk and DSI judges will ask, and teams that skip it look naive.
5. **Mule framing, not phone-call scams.** PaySim fraud is TRANSFER followed by CASH_OUT (an account takeover drained through a mule). The "payee received N transfers recently" reason ties to it. That avoids the crowded scam-call space (Gemini Nano, OnGuardAI, ScamShield; docs/ideas.md #9).

### Honest ML caveats we put in the README (and say first, before a judge does)

- **PaySim is synthetic**, simulated from one African mobile-money service's logs. It's not real bank data, and we say so.
- **Expect near-perfect scores with the balance columns.** In PaySim, fraud tends to drain the origin account to zero, with destination balances that don't add up. Public notebooks get ~0.99 PR-AUC from "balance error" features. This is widely reported; verify at H4. **We report two feature sets:** (a) full, and (b) no balance-error features (amount, amount/balance ratio, type, hour, payee-history). Set (b) is the number we lead with. That's exactly the Technical Understanding point DSI rewards.
- **Accuracy is meaningless at 0.13% positives.** Report PR-AUC and recall at fixed precision / holds per 1,000. Baselines: the built-in `isFlaggedFraud` rule (it flags 16 of 8,213) and logistic regression.
- **Time split, not random split.** Train on steps 1-~550, test on later steps. PaySim's `step` is the hour.
- **Payer velocity can't be learned from PaySim.** Origin accounts almost never repeat (verify: ~6.35M unique `nameOrig` in 6.36M rows). Payee history (`nameDest` repeats) can. So the Tiger-fed live feature is **payee inbound count/amount in recent hours**, not payer velocity. Don't claim the other.
- **Train/serve mapping:** PaySim amounts are in a synthetic currency with a much higher mean. Use scale-free features (amount/balance, balance-drained flag, payee inbound count, type) so a $2,000 Nessie transfer means the same thing as in training. Say this in the README.
- **Never** report an eval on Nessie data (it's shared mock data; ps-fintech.md).

---

## 2. Core (never cut)

| Piece | Hours |
|---|---|
| Download + verify PaySim (row and fraud counts), parquet cache, time split | 1 |
| Features (two sets) + LightGBM + LogReg + rule baseline; PR-AUC, recall@precision, holds per 1,000; threshold choice | 7 |
| `/score` endpoint with top-3 reason codes (LightGBM `pred_contrib`, mapped to plain labels) | 1.5 |
| Nessie rail: seed customer, checking, a payee; POST transfer as pending/completed; release/cancel; cached snapshot + offline mock | 4 |
| Tiger Data: transfers hypertable + 1 continuous aggregate (payee inbound per hour) that feeds `/score` | 2 |
| Auth0 login for the account holder (no roles) | 1.5 |
| Bank UI: balance, send form, held card with reasons, release/cancel, eval "model card" tab | 6 |
| Trusted-contact page (second phone, polling, no SMS: Twilio would need an account) | 1 |
| Hold notice text: template + Gemini words + number validator | 1.5 |
| Replay/demo mode: scripted mule scenario that seeds payee history so the live hold is deterministic | 1.5 |
| Deploy: Vultr + Caddy + GoDaddy domain | 1.5 |
| README eval table + model card | 1 |
| **Total** | **~29.5** |

With the 3-4h buffer it's ~33-34h, which leaves **~5-8h** inside a ~38-41h build for user tests, design and rehearsal. That's slightly more slack than L1.

### Prizes kept

| Prize | Role | Fit |
|---|---|---|
| **Capital One Nessie** | The money rail: hold, release, cancel on real Nessie transfers | Central |
| Overall | Any polished build | — |
| **AI/ML track** | Trained model + honest eval; see section 5 | Central |
| **Auth0** | Account-holder login. Step-up MFA to release a hold (stretch #1) is the most bank-native Auth0 use we've found. Not "Auth0 for AI Agents": there's no agent, and we don't invent one | Honest; uncrowded (1 project at XI) |
| **Tiger Data** | The only store; the continuous aggregate computes the payee-inbound feature live | Honest but smaller than L1's (a short transfer stream, not sensor-rate data). Show it in the README, not as a UI panel |
| Vultr | Host for FastAPI + model | Gated on the card question |
| GoDaddy | Domain | — |
| Gemini | **One honest job:** turn the model's top-3 reason codes into a one-sentence hold notice and the trusted-contact text, with a validator that every number in the text matches ours, and a template fallback. Gemini never decides or scores. Reading the transfer memo for scam words would put an LLM in the decision path, with no training data for it (PaySim has no memo). Don't | Low odds (~3%, 48% crowding) |
| Easy On The Eyes | A clean banking UI is a natural design target | — |
| DEV | After the event | — |

**Dropped:** Sperry (no fit), DeepSpace (nothing realtime-multiuser that needs it; it would clash with Auth0), Solana, Roblox, Auth0 for AI Agents (no agent), the credit-card second eval (cut #2), phone-call ASR.

**Stretch, only after the Sat 8 AM "can we demo now?" is yes, in this order:**
1. Auth0 step-up MFA to release a hold (1.5-2h; unverified config, timebox it)
2. "Bank ops" queue view: all held transfers, ranked by score, with approve/cancel (1.5h). Speaks to the Capital One rep's side of the house
3. Credit-card dataset second eval, offline, README only (1.5h)
4. Calibrated probabilities (isotonic) shown as "1 in N chance this is fraud" (1h)

**Ordered cut list, if behind** (cut #1 first):
1. any stretch item not started
2. the credit-card eval (if started)
3. Gemini words (keep the template; we lose ~$1.5)
4. trusted-contact second phone (show the notice on the same screen)
5. Tiger Data → SQLite, payee feature computed in Python (we lose ~$32, so cut late)
6. LightGBM → logistic regression on the same features and eval
7. Vultr → Render free (we lose ~$23)

**Never cut:** the live hold → release on Nessie, the two-feature-set time-split eval table with baselines, the reason codes, the deployed URL, the offline Nessie mock (so a Nessie outage can't kill the demo), the backup video.

---

## 3. Decision gates (clock time)

| When | Check | If no |
|---|---|---|
| **Fri 8:30-9:00 PM** | **A human** does the GitHub login on nessieisreal.com and copies the key (our rules: no account creation by the assistants). Same for Auth0, Tiger Cloud, Gemini. Server pulls PaySim from HF (~30 s) and verifies the counts | Mirror fails the count check → try the 274 MB parquet copies. All fail → a human downloads from Kaggle (login needed; a zip of the ~470 MB CSV, compressed size unverified; minutes on venue Wi-Fi, so then scp it to the server) |
| Fri 9:30 PM | MLH desk: Vultr card? Help desk: **Capital One $500 or $1,000 to a 2-person team?** Cash split A or B? | Card needed → Render. The cash answer decides whether L-F1 can beat L1 at all (section 6) |
| **Fri 10:00 PM (H1.5)** | Nessie spike with the real key: POST a transfer with `status: pending`; change it to completed/cancelled (PUT or delete-and-repost); does a pending transfer change the balance? | Status not settable → the hold lives in our DB, and Nessie gets the POST only on release (cancel = never posted). Weaker on stage, but the money still moves. Decide now, not later |
| Fri 10:30 PM | Capital One table (if staffed): judging in person? Is a model-driven hold interesting to them? | Not staffed → plan the pitch for Company Connect Sat 10:30 |
| Sat 12:30 AM (H4) | Model v0 on the time split; both feature-set numbers in the README; the balance-leak check done | Logistic regression + rule baseline; still enough for the hold |
| Sat 5:30 AM (H9) | `/score` with reasons live; the held transfer created on Nessie from the UI | Cut to the replay scenario only; no free-form send |
| **Sat 8:00 AM** | Demo path from main on the deployed URL, 3 runs in a row | All stretch frozen until yes |
| **Sat 10:30 AM-12:30 PM** | Company Connect: one of us shows the hold to the Capital One rep and asks one question ("what would make you trust a hold like this?") | Write the answer in NOTES.md; it's our sponsor evidence. If their answer changes scope, decide by 2:30 PM |
| Sat 1:30-2:30 PM | 5 students at lunch: read the hold notice, release or cancel? Time to understand it | Fix the notice wording (cheap, high value) |
| Sat 8:30 PM | Scope freeze | Nothing new after this |
| Sat ~midnight | Feature freeze, backup video recorded with Nessie working | Cut from the list, never the video |
| Sun 7:00 AM | Track tick (section 5) | — |

---

## 4. Crowding, honestly

- **"Fraud detector" is one of the most common student ML projects.** Devpost search "fraud detection" returns ~2,660 projects, and the Kaggle credit-card set is a classic beginner dataset. DSI will have seen "XGBoost on Kaggle fraud" many times. A clean notebook alone gets nothing from them; the leakage discussion, time split and operating-point choice do.
- **At XII specifically:** XI had 5 of 111 projects using Nessie. Guess ~8-15 Nessie entries at XII, of which ~1-3 are fraud/scam themed, and ~3-6 fraud/scam projects in the whole ~100-project pool.
- **Capital One reps have seen the hold pattern recently** (Aval, Ring-Radar, FinGuard, all within the last two weeks). Our odds rest on the model plus the eval plus the polish, not on the concept.
- **Capital One odds: 22%** (1 winner, ~8-15 entries, strong fit, a recently seen pattern, no Capital One judge on the published list, so it rests on the rep at Company Connect). ps-fintech's 7/10 "win odds" was a relative score, not this.

---

## 5. Track choice: AI/ML vs Entertainment vs none

| Track | p | Extra hours | EV | Notes |
|---|---|---|---|---|
| **AI/ML** | ~10% | 1-2h (README model card, clean `ml/` folder, tests on the feature code) | **~$12** | The model *is* the product. DSI asked for custom models, evals and tradeoffs explained, and reads the repo. It's crowded (30-50 AI projects) and fraud is a cliché, so the leak analysis and time split are what lift it from ~5% to ~10% |
| Entertainment | ~0.5% | 0 | ~$1 | No fit (it's a banking safety tool, not a game or interactive media). A mismatched track risks a "Track & Challenge Relevance" hit with general judges. **No** |
| None | 0 | 0 | $0 | Only better than AI/ML if the eval gate failed and the repo would read as a tutorial clone, because DSI reading it could hurt our credibility with the same judges who sit in the general pool |
| First Timers (if eligible) | ~25% | 0 | ~$50 | Beats all of them if @luanamaldaner qualifies (still unconfirmed) |

**Pick:** First Timers if eligible. Otherwise **AI/ML if the Sat 12:30 AM eval gate passed** (time-split table with both feature sets and baselines in the README). Otherwise none. Decide at Sun 7 AM. Unlike L1, Entertainment isn't even a fallback.

---

## 6. EV

Per prize (Capital One at 22%):

| Prize | p | EV A | EV B (C1 = $500) | EV B (C1 = $1,000) |
|---|---|---|---|---|
| Capital One Nessie | 22% | 110 | 110 | 220 |
| Overall 1st / 2nd / 3rd | 2% / 3% / 3.5% | 30 | 60 | 60 |
| AI/ML | 10% | 12 | 12 | 12 |
| Auth0 (login core; step-up raises it) | 20% | 24 | 24 | 24 |
| Tiger Data | 20% | 32 | 32 | 32 |
| Vultr | 15% | 22.5 | 22.5 | 22.5 |
| Easy On The Eyes | 5% | 18 | 18 | 18 |
| GoDaddy / Gemini / DEV | 7% / 3% / 3% | 3.5 + 1.5 + 1.5 | 3.5 + 1.5 + 3 | 3.5 + 1.5 + 3 |
| **Total** | | **~$255** | **~$287** | **~$397** |

**Reliability.** P_ok ~0.85: one dataset (already verified reachable), one backend, one store, the live path on a replay scenario, and an offline Nessie mock. The risks are Nessie flakiness and the unverified status update. Factor 0.85 + 0.15×0.4 = **0.91**.

**Reliability-adjusted: ~$232 (A) / ~$261 (B, $500) / ~$361 (B, $1,000).**

P(at least one prize) ~70% under independence (overstated as usual). P(any cash prize, i.e. Capital One or Overall) ~29%. P(interview) 0.

### Where it ranks

| Rank | Stack | Adj. EV A / B | Person-h core / with buffer | Concentration |
|---|---|---|---|---|
| 1 | L1 lean hazard radar | ~$280 / $306 | ~33 / ~37 | Spread over Sperry ×3 + Tiger + Vultr; ~40% interview odds |
| **2** | **L-F1 lean fraud interceptor** | **~$232 / $261** (or **$361** if Capital One pays $1,000 to us) | **~30 / ~34** | ~45% of EV in one 1-winner prize; no interviews |
| 3 | M1 lean Mental Models | ~$132 / $194 | ~30 / ~34 | DeepSpace + UI |

**Break-even with L1** (L-F1's needed Capital One odds):
- A: **≥ ~33%**
- B with $500: **≥ ~32%**
- B with $1,000: **≥ ~16%**

So L-F1 only overtakes L1 if the help desk confirms $1,000 to the team *and* the cash is split among members, or if we learn something at the Capital One table that pushes our odds past ~1 in 3. Sperry's iPad being per member would widen L1's lead by ~$128.

**What L-F1 has over L1 that the EV doesn't credit:**
- ~3h more slack.
- No 9-source weather data plumbing (L1's biggest surprise risk).
- A cleaner, easier-to-defend ML story: one dataset, a known leakage trap we can show we handled.
- A consumer story any general judge gets in 10 seconds.

**What it lacks:**
- Sperry's guaranteed 3 places and internship interviews.
- A sponsor with judges we know are coming.
- A non-crowded concept.

**Verdict: keep L-F1 as the #2 option, the real alternative to L1, ahead of L1+DS on simplicity and ahead of M1 on EV.** Let the 9:30 PM help-desk answer on the Capital One amount and split decide between L1 and L-F1, if I wants a finance option on the table at all.
