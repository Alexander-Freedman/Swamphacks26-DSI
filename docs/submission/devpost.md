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
Onionskin takes you from never having seen a concept to a picture of it you can run yourself. You guess first, watch it run on top of your guess, and the exact wrong idea gets named. **The AI builds the simulation; code guarantees the truth; you do the thinking.**

**Calculus: slopes and areas.** Pencil in how steep a hilly curve is, then drag the tangent along it while the true derivative inks over your sketch. Guess the area under the curve, then drag from 1 to 200 rectangles: one rectangle says 7.5, and the sum closes in on the exact 4.57 (computed). Copy the curve's shape instead of its steepness and the mistake is named: "Slope = height of the curve." Last, slope and area side by side: one undoes the other.

**[if merged] Organic chemistry: push the electrons.** Build ethanol (C₂H₆O) by dragging atoms and bonds. Mistakes are named as you make them: "A carbon with 5 bonds", or an oxygen with three bonds and no charge (formal charge 6 − 2 − 3 = +1, so it's O⁺). Then draw the curved arrows for HO⁻ + CH₃Br. The real arrows ink over yours and the SN2 mechanism plays on a scrubber: backside attack, Br leaves with the bond's electrons, the carbon inverts. Then find the same three parts in cyanide + CH₃I, where carbon, not nitrogen, attacks.

**Type any topic.** The engine turns a topic into a runnable visual: a curve with a knob, a sampler, or a calculus view (slope, area, limit). Type "derivative of x squared" and you get a tangent to drag. The answer is computed in code from the spec, never written by the model. If nothing fits ("the French Revolution", gibberish), it says so and offers the nearest checked topic instead of faking a chart. **[if merged]** 18 hand-checked topics load instantly.

**Three probability sessions**, each with a compare screen: the birthday problem (23 people → 50.7%, computed; compared with shared 4-digit PINs), coin streaks (a run of 5+ in 97.2% of 100 fair flips, computed exactly) and a positive medical test (9.2% chance you're sick, not 90%, computed). Comparing two cases helps an idea transfer ([Gentner, Loewenstein & Thompson 2003](https://doi.org/10.1037/0022-0663.95.2.393)).

**Around every session:** a notebook that keeps your mistakes and brings them back as rematches with new numbers; an Ask panel that gives a hint, never the answer; and a "How it works" drawer that shows the math.

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
- [ ] **Calculus level** (PR #202, merged; `?session=calculus`): deployed? Check the screen shows 7.5 for one rectangle and 4.57 exact (computed: f(x) = (x³ − 6x² + 9x)/2 + 1 on [1, 3.5], F(3.5) − F(1) = 4.5703; one left rectangle = f(1) × 2.5 = 7.5; `web/src/sessions/calculus/math.ts`).
- [ ] **Orgo showcase** (PR #204, build a molecule + push the electrons): merged and deployed? If not, cut the whole "[if merged] Organic chemistry" paragraph. Chemistry checks: FC = V − N − B ([formal charge](https://en.wikipedia.org/wiki/Formal_charge)): O with 3 bonds and 1 lone pair = 6 − 2 − 3 = +1; SN2 backside attack with inversion ([SN2](https://en.wikipedia.org/wiki/SN2_reaction), [Walden inversion](https://en.wikipedia.org/wiki/Walden_inversion)); cyanide attacks through carbon, giving nitriles ([Kolbe nitrile synthesis](https://en.wikipedia.org/wiki/Kolbe_nitrile_synthesis)); ethanol and dimethyl ether are both C₂H₆O.
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
- [ ] **Word count:** body (Inspiration through Built with, URLs excluded, disclosure included) = 1,094 words (computed by script, after the orgo + calculus rewrite of "What it does"). Limit 1,100.
