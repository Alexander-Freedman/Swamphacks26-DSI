# Devpost submission: Onionskin

**Status:** the single submission text for SwampHacks XII (Entertainment & Creative Technology). Rewritten Sat evening for the Sat ~12:15 PM reframe and the Sat ~1:05 PM direction (#193) in NOTES.md. Paste the body (Inspiration through Built with) as is. Every number has a source link, a "computed" note or a "measured (date)" note; anything we couldn't check is marked *unverified*. Parts marked **[if merged]** describe work still in review: go through "Confirm before submit" at the bottom and cut what isn't live. The AI tools disclosure needs my approval before it goes anywhere.

- **Name:** Onionskin
- **Headline:** See your thinking in layers.
- **Subline:** Type any topic. Watch it come alive.
- **Live:** https://onionskin.study (registered, not pointed yet) · current live link: https://alexander-freedman.github.io/Swamphacks26-DSI/
- **Repo:** https://github.com/Alexander-Freedman/Swamphacks26-DSI
- **Track:** Entertainment & Creative Technology

---

## Inspiration
Animators draw on onion skin: the last frame stays faintly visible under the new one. We wanted that for ideas. You sketch what you think is true, reality inks in on top, and your guess stays underneath as a faint layer. The gap between the layers is the lesson.

Being told isn't the same as having a model you can run in your head. In one classic case, about 95 of 100 doctors estimated a positive mammogram meant roughly a 75% chance of cancer; the answer was 7.7% ([APS Observer on Eddy 1982](https://www.psychologicalscience.org/observer/helping-physicians-understand-screening-tests-will-improve-health-care)). And watching isn't enough: students who only *watched* a physics demo understood it no better than students who never saw it, while students who *predicted* first did significantly better ([Crouch et al. 2004](https://doi.org/10.1119/1.1707018)). So every Onionskin screen starts with your guess, and every step is something you drag, draw or watch move.

## What it does
Onionskin takes you from never having seen a concept to a picture of it you can run yourself. **The AI builds the simulation; code guarantees the truth; you do the thinking.**

**Three hand-built sessions**, each a few minutes of visuals:
- **Birthday problem.** Guess how many people it takes for a 50% chance two share a birthday, fill a room and watch a line appear for every pair, then draw your curve. The real one inks in over it: 23 people → 50.7%, 57 → 99.0% (computed). Your mistake gets named: someone sharing *your* birthday in a room of 23 is only 5.9% (computed).
- **Coin streaks.** Tap out 20 "random" flips and 20 real ones deal in under yours. Real coins clump: in 100 flips the longest run averages 6.98, and a run of 5 or more shows up 97.2% of the time (computed exactly).
- **A positive medical test.** Test 1,000 people and the positives fly into two piles: a 9.2% chance you're sick, not 90% (computed).

**Compare screens.** After the reveal, a second case that looks different but works the same: birthdays → shared 4-digit PINs (about 119 people for a 50% chance, computed); coin streaks → a 50% basketball shooter; the medical test → airport bag screening (4.7% of alarms are real, computed). You say what's the same, then the shared principle inks in. Comparing two cases beats studying them one at a time for carrying an idea to new situations ([Gentner, Loewenstein & Thompson 2003](https://doi.org/10.1037/0022-0663.95.2.393)).

**Type any topic.** The engine turns a topic into a runnable visual: a curve with a knob, a sampler, or a calculus view (slope, area, limit), with the guess prompt, the extremes to try and the misconception people have. The true answer is computed in code from that spec, never written by the model. If nothing fits ("the French Revolution", gibberish), it says so honestly and offers the nearest checked topic instead of faking a chart. **[if merged]** 18 hand-checked topics load instantly, and showcase levels let you drag a tangent line in calculus and build a molecule in organic chemistry.

**Around every session:** a notebook that keeps your mistakes and brings them back as rematches with new numbers; an Ask panel that gives a hint, never the answer, before you commit; and a "How it works" drawer that shows the math behind each screen.

**No points, on purpose.** In a semester-long class, badges and a leaderboard lowered final-exam scores ([Hanus & Fox 2015](https://doi.org/10.1016/j.compedu.2014.08.019)). The reward is the moment your layer meets reality.

## How we built it
- **Frontend:** React + TypeScript + Vite on GitHub Pages. Each session is a module that computes its own truth in the browser (exact formulas, an exact dynamic program for coin runs). One visual language: pencil (dashed) = you, ink (solid) = truth, highlighter = the gap, never told apart by color alone.
- **Backend:** FastAPI on one Vultr VM with Caddy for automatic HTTPS, set up with one script. The API key lives only on the server; every public endpoint has a per-IP rate limit and a daily cap.
- **Engine v4:** Gemini Flash-Lite returns structured JSON. We validate it against a schema, compute the truth from the spec in code, and check that the picture actually depends on its knob. A spec that fails gets one retry with the failed check, then an honest no-fit.
- **Answer events on Tiger Data:** every answer goes into a TimescaleDB hypertable, and a continuous aggregate rolls them up hourly into how people guess on each question.
- **Card art:** generated with Azure image generation at build time and served as static files; the public site never calls a paid image API.

## Challenges we ran into
- **A check that lied.** Our first "blind check" asked a second model to verify answers. In a 25-topic trial it mostly timed out while still reporting success. We fixed the reporting, then removed it: truth computed in code is the real check.
- **Speed.** That first generator took a median of 27 s per topic, too slow to show live. Engine v4 builds a topic in one call: about 6 s median.
- **Nonsense and non-math topics.** Gibberish is refused before any model call; topics no widget can draw come back as an honest no-fit instead of a made-up chart.
- **Visual, not a quiz.** Our first version was a guess plus a text answer: correct and forgettable. We rebuilt every step as something you manipulate.

## Accomplishments that we're proud of
- The birthday reveal: your hand-drawn curve under the real one, gap shaded, then the PIN case showing it's the same idea.
- Every number on screen is computed or sourced, including in typed topics.
- An AI feature that admits when it can't help.
- Every session works on a phone and by keyboard.

## What we learned
- Confident mistakes teach best: high-confidence errors are the ones corrected best ([Butterfield & Metcalfe 2001](https://doi.org/10.1037/0278-7393.27.6.1491)).
- Learning that works often *feels* harder: active-learning students learned more but felt they learned less ([Deslauriers et al. 2019](https://doi.org/10.1073/pnas.1821936116)).
- Generating content is easy; checking it is the product. Letting the model choose the picture and code compute the answer was the split that worked.

## What's next
- More widgets so fewer topics end in a no-fit (reaction mechanisms, history timelines).
- Compare screens for typed topics, built from a second case the engine already names.
- Rematches spaced over days, not minutes.

## AI tools disclosure
> **Left blank on purpose: wording still being decided by the team.** Required by the event rules before submit.

## Built with
- React, TypeScript, Vite, Vitest
- Python, FastAPI, Pydantic, Uvicorn
- Google Gen AI SDK: Gemini API (Gemini Flash-Lite)
- Tiger Data (TimescaleDB): hypertable + continuous aggregate
- Vultr, Caddy
- Azure image generation (build time only)
- GitHub Pages, GitHub Actions

---

### Confirm before submit (not part of the Devpost text)
For each item, what must be true on the live site at submit time. If it isn't, cut or move it to "What's next".

**Not merged / not live as of this draft (Sat evening):**
- [ ] **Pre-built set** (PR #206, 18 hand-checked v4 topics): merged and deployed? If not, cut "18 hand-checked topics load instantly".
- [ ] **Calculus level** (PR #202, drag the tangent / fill the area): merged and deployed? If not, cut "drag a tangent line in calculus" (typed calculus topics through the engine count only if they build live).
- [ ] **Orgo showcase** (PR #204, build a molecule): merged and deployed? If not, cut "build a molecule in organic chemistry".
- [ ] **Home rewrite / no betting language** (PR #205): merged? The headline and subline assume the new Home. Also check no "lock it in", "called it" or confidence picker is left on screen.
- [ ] When all four are in, delete the **[if merged]** tag.

**Numbers and their sources:**
- [ ] **Engine v4: 10/15 topics built, median ~6.0 s** (one call 5.2-6.0 s; with the retry 11-12 s): our local trial, [docs/research/gemini.md](../research/gemini.md) Run 2. Small sample.
- [ ] **Live smoke: "derivative of x squared" built in ~4 s** on the Vultr API: measured (Sat Oct 17 ~4:10 PM), one run. Not in the body; Q&A only.
- [ ] **Old generator median 27 s** (27.6 s; p90 51 s): measured (Sat ~12:10 AM, 25-topic trial), NOTES.md and gemini.md.
- [ ] **Blind check timed out while reporting `blind_checked: true`:** NOTES.md Sat ~12:10 AM. Removed on main: `api/app/checks.py` ("There is no blind second-model check any more").
- [ ] **Birthday** 23 → 50.7% (0.5073), 57 → 99.0% (0.9901), mine 1 − (364/365)^22 = 5.9% (0.0586): computed (re-run in Python for this draft).
- [ ] **PINs:** smallest n with ≥ 50% for 10,000 PINs = 119 (0.5058): computed.
- [ ] **Coin** N=100 mean longest run 6.977, P(≥5) = 0.9717: exact DP, matches the `web/src/sessions/coin` tests.
- [ ] **Positive test** 0.009 / (0.009 + 0.99 × 0.09) = 9.2%: computed. **Bags** 1 in 1,000, 99% flagged, 2% false alarms → 99 / 2,097 = 4.7%: computed, `web/src/sessions/positive/math.test.ts`.
- [ ] **Doctors 95/100, ~75% vs 7.7%:** stated on the APS Observer page; the original Eddy 1982 chapter is *unverified against the primary*.
- [ ] **Gentner et al. 2003:** "a marked advantage" from the abstract; effect sizes *unverified*.
- [ ] **DOIs** (Crouch 2004, Hanus & Fox 2015, Butterfield & Metcalfe 2001, Deslauriers 2019, Gentner 2003): resolve to the right articles (checked in the #104/#113 drafts).

**User test:**
- [ ] **User-test numbers: placeholder until real.** If we test before submit, add one line to "Accomplishments" (e.g. "N students, X of N …") with the date. Don't add numbers we didn't measure.

**Live features to click through:**
- [ ] Birthday, coin and positive sessions, each with its compare screen, on the live link.
- [ ] A typed topic builds a visual from the live site (Vultr API answering, CORS ok); a nonsense topic shows the honest no-fit.
- [ ] Notebook saves a mistake and offers a rematch; Ask panel answers with a hint; "How it works" drawer opens on a session.
- [ ] Tiger: answer events landing in the hypertable on the deployed backend. The "how others guessed" view is not in the frontend as of this draft, so the body only claims the hourly rollup; add a "what others guessed" line only if a screen shows it.
- [ ] Card art: the `web/public/art/session-*.webp` files are the Azure build-time images.
- [ ] **onionskin.study** points at the site; until then lead with the GitHub Pages URL.
- [ ] **"Phone + keyboard":** re-check on a real phone.

**Before pasting:**
- [ ] **Disclosure approved** by me, then copied to the README too ([Devpost rules](https://swamphacks-xii.devpost.com/rules) ask for disclosure).
- [ ] **Word count:** body (Inspiration through Built with, URLs excluded, disclosure included) = 1,082 words (computed by script). Limit 1,100.
