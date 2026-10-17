# Deep dive: Mental Models Tool

Candidate idea, not picked. The 10-second feature is "the ghost" (draw the prediction, watch it replay next to the truth). The open lane: diagnose misconceptions *and measure it* on real data collected at the event. Track: AI/ML.

# Mental Models Tool: deep dive (teardowns, design, eval, track, build order)

Context: SwampHacks XII, Oct 16-18 2026, ~35h, 2 people, expo judging (3 min demo + 1 min Q&A, 2 min video). Criteria: Technical Understanding, Innovation & Creativity, Functionality, Design & Usability, Purpose & Audience, Track & Challenge Relevance, Sponsor ([overview](https://swamphacks-xii.devpost.com/)). Rules: AI use must be disclosed, "not simple reskins of existing AI tools" ([rules](https://swamphacks-xii.devpost.com/rules)).

## What this means for us (short)

1. **Make the drawing the hero, not the chat.** The student *draws* a path (marble off a desk, puck when the string snaps). Their drawing replays as a ghost racing the real object. The drawn shape alone already tells us which wrong idea they hold, before they type anything. No winner we found does this; every edtech winner below is "AI explains better".
2. **Tech core = deterministic physics + deterministic path-shape diagnosis + an LLM that only picks a label from a closed list, fused, with an abstain option.** This is the architecture recent winners converged on (Untangled, Mimir, Loomin all pair a deterministic checker with a model). Our twist is that we *measure* the diagnosis.
3. **Eval on real explanations from hackers at the event.** Run an anonymous 60-second "Beat the Ghost" kiosk with a QR code on Saturday. Both of us label blind. Report macro-F1, kappa and per-code confusion against keyword, text-only and shape-only baselines. Target: 150+ real explanations.
4. **Track: AI/ML.** Our story ("we measured the diagnosis") is exactly its brief. Entertainment only if we pivot to a pure game. Honest MLH extras: Gemini, GoDaddy, Auth0 (instructor login), Vultr if we really host there. Skip Tiger Data, Solana and DeepSpace (unless live mode survives the cut line).
5. **The instructor dashboard is the closer.** Show every student's drawn path overlaid on one canvas, colored by diagnosed misconception, and pre-filled with Saturday's real hacker data: "this is 70 of you."

---

## 1. Teardowns

### Loomin: 1st of ~300, NVIDIA GTC 2026 Agents for Impact (Mar 19 2026)
Sources: [UCSC news](https://news.ucsc.edu/2026/04/engineering-student-wins-nvidia-agents-for-impact-hackathon/), [Devpost (earlier Jan 2026 version)](https://devpost.com/software/loomin), [video](https://www.youtube.com/watch?v=ekemdSVbw7I), event [shortesthack.com](https://www.shortesthack.com/).
- **What it is:** Type a physics concept and get structured notes, real equations, and an interactive 3D model with live sliders (screenshot: a wind turbine). "When a simulation breaks, the tool explains what happened and why."
- **Demo moment:** "Break the machine." Push a parameter until the system fails, then get the why. The notes are the control surface: change a number in the text and the 3D sim reacts.
- **Tech core:** At GTC it ran NVIDIA Nemotron Ultra with RAG over a local physics knowledge base, in "under three seconds" (UCSC). The Devpost version (Jan 2026, a different event with no prize listed) is Next.js + Monaco + React Three Fiber. It uses regex parsing for instant updates and Groq for deeper extraction, with Prisma/SQLite caching. Gemini checks screenshots of the live UI for "silent failures". The models are **hand-built parameterized Three.js models**, not generated assets.
- **Novelty framing:** A manifesto. "Understanding that never has to survive execution is fake." "Not another notebook. A proving ground for ideas." It frames AI as "powerful but constrained, fast but grounded."
- **Write-up structure:** Devpost template headings, long paragraphs, no numbers except latency. Inspiration names the competitors (OpenNote, Gemini, Groq) and says what they lack.
- **Lesson for us:** The idea came from talking to other participants at the event (UCSC). The winning version leaned on the *sponsor's* model (Nemotron at an NVIDIA event). Its framing, "your understanding must survive reality", is close to ours, so **we must not sound like Loomin**. Loomin lets you play with parameters; we make you *commit before you see* and then diagnose. Say that out loud.

### Minerva: 1st Zoom Education Track + HeyGen prize, TreeHacks 2026
Sources: [Devpost](https://devpost.com/software/minerva-3sj6z0), [team blog](https://www.evanyu.dev/blog/treehacks-2026), [video](https://www.youtube.com/watch?v=vK0Tob8xZKE), [UNL news](https://computing.unl.edu/news/angeletti-claims-awards-stanford-university-hackathon).
- **What it is:** An AI tutor you video-call. It's a HeyGen LiveAvatar inside the Zoom Video SDK, using tools: Manim videos generated on the fly, Desmos/Desmos 3D/GeoGebra, generated HTML applets, a study plan, and a parent dashboard.
- **Demo moment:** You talk to a face, and it draws a 3Blue1Brown-style animation mid-conversation.
- **Tech core:** Web Speech API transcription, then a small fast model as a router with tools. Manim code generation is delegated to a slower, stronger model and executed. HeyGen is used only as TTS, so they keep control of tool calls. Their main engineering problem was latency.
- **Novelty framing:** Barely any. They say so themselves: "Minerva isn't a groundbreaking idea, nor is it a very technically impressive project, but the way we executed and presented it is what made it stand out" (blog). The inspiration section has a stat (22% of US seniors proficient in math) plus "8 years as a tutor".
- **Write-up structure:** Short. Inspiration (stat + personal), a "Minerva can:" bullet list, How we built it (pipeline), one challenge (latency). The gallery is mostly feature screenshots, 4 of them the **parent dashboard**.
- **Lessons:** (1) They lobbied judges during the event, and judges came over saying "we heard about this project" (blog). (2) Audio failed at the expo, so they moved judges to a quiet hallway. **Our demo must work with no sound.** (3) A stakeholder dashboard (parents, for them) shows up in the gallery. (4) Two sponsor tools were central, not decorative.

### MathWhiz: 3rd Overall, SwampHacks X (Jan 2025)
Sources: [Devpost](https://devpost.com/software/mathwhiz), live at mathwhiz.biz, [GitHub](https://github.com/SupreetTadeparti/MathWhiz).
- **What it is:** A prompt goes in and a Manim math/physics explainer video with AI voiceover comes out.
- **Demo moment:** Type a concept and watch a custom animated lesson render.
- **Tech core:** React/Tailwind, Flask, Auth0, Cloudflare Workers AI, Supabase, OpenAI for voice. They *tried* fine-tuning a Llama to write Manim code, which they list as an accomplishment ("rather than simply calling the OpenAI API").
- **Novelty framing:** "Every child has access to their own personal math tutor." Generic.
- **Write-up structure:** Template headings with generic adjectives ("innovative", "powerful", "robust"). No numbers, no video on the page. It names a teammate's illness as resilience.
- **Lesson:** At SwampHacks, a visual edtech product with a live domain, Auth0 and an attempt at custom ML placed 3rd overall with a fairly weak write-up. The bar for writing here is low, so a write-up with real numbers will stand out.

### Neuroview: Best User Design, SwampHacks XI (Jan 2026)
Sources: [Devpost](https://devpost.com/software/neuroview), live at neuroview.onrender.com, [video](https://www.youtube.com/watch?v=4fMkUkWLkVI).
- **What it is:** "Google Docs for brain MRIs." A free, open-source 3D NIfTI viewer with multi-plane slicing, annotations, and 4-person real-time sync.
- **Demo moment:** Rotate a real brain, scrub slices, drop a marker, and it appears on a second laptop.
- **Tech core:** Marching cubes over a 256x178x256 volume (scikit-image), Three.js raycast annotations, FastAPI WebSockets, deployed on Render with CI.
- **Novelty framing:** The analogy (Google Docs for X), plus "free, no accounts, no paywalls" against expensive tools.
- **Write-up structure:** Clean, scannable sub-headed feature lists. Challenges are concrete (feedback loops in sync, mesh size). Team roles are spelled out: 3 of 4 people on UI/art/landing page.
- **Lesson:** UI winners at SwampHacks put real people-hours on visual design. One clean analogy, a live link, and concrete challenges.

### Explainable: Best Use of Gemini API, SwampHacks XI
Sources: [Devpost](https://devpost.com/software/explainable), [live](https://explainable-mu.vercel.app/), [video](https://www.youtube.com/watch?v=ybkRKNvf2_A), [GitHub](https://github.com/eren-s-chang/explainable).
- **What it is:** A voice tutor with two personas named after UF mascots (Alberta for K-8, Albert for high school and college). Gemini answers, ElevenLabs speaks, and a Twilio phone number works without a browser.
- **Demo moment:** Call a real phone number from the table and talk to Albert.
- **Tech core:** Flask, Gemini with grade-specific prompts, streamed text + TTS audio chunks, a Redis/Upstash cache ("about 30%" faster), Vercel deploy. The frontend was largely made with Lovable (disclosed).
- **Novelty framing:** "Explain anything. At the right level. By voice." Plus the accessibility angle (phone, no laptop needed) and the UF-mascot local touch.
- **Write-up structure:** Personal story ("two online tutors"), a real number (30%), a candid challenges section (rate limits, Twilio), and a References section citing a paper (Wambsganss et al. 2024).
- **Lesson:** The Gemini prize went to Gemini at the center of the experience. A citation and one number made it read as serious. Local UF flavor helped. It's a generic tutor, which is exactly what we need to *not* look like for Overall/AI-ML.

### Other recent edtech winners
**Mimir: Runner-Up + Pitch Competition Winner, SASEhack (Sep 2026).** [Devpost](https://devpost.com/software/mimir-the-ai-blackboard), [video](https://www.youtube.com/watch?v=n7KDCCUtQVI).
- An infinite canvas where Gemini Live (over LiveKit) watches your handwriting, talks, and highlights the exact term you got wrong. A physics word problem becomes a scrubbable animation (their GIF: a "ball drop physics visualization").
- **Demo moment, written as one concrete example:** "A student writes 2(x + 3) = 14 as 2x + 3 = 14. Mimir doesn't say 'wrong.' It highlights the 2(x + 3) and asks, 'What does that 2 multiply?'"
- **Tech:** "The model doesn't guess whether your algebra is right. Deterministic validators check that." Units are validated server side, and no generated code runs.
- **Framing:** "Most AI tutors are chatbots with a math plugin." Accessibility (learning disabilities) up front.
- **Lesson:** The "never gives the answer + deterministic check" framing wins pitch competitions now. It's also getting common, so it alone is not our novelty.

**Untangled: Software winner, Cornell Hacks 2026 (Oct 2026).** [Devpost](https://devpost.com/software/untangled-mj5dy7), [video](https://www.youtube.com/watch?v=56DcrK1BDGQ).
- A whiteboard tutor that "marks the first wrong turn". A vision model transcribes lines, SymPy verifies steps, and AI-only judgments are **labeled as such**. It gives a hint ladder instead of answers, plus a GPS-style voice ("back on route"). They also collected thousands of handwritten characters for a handwriting model.
- **Lesson:** Two signals judges reward: (1) honest labeling of uncertainty, and (2) self-collected data. We do both: an abstain option, plus real explanations collected at the event.

**Neural Network Visualizer: 1st AI Track, SwampHacks X.** [Devpost](https://devpost.com/software/neural-network-visualizer). It made an obscure ML idea visible and claimed "first". It was the most-liked project of X (from docs/teardowns.md). The SwampHacks AI track rewards technical and visual work, not chatbots.

### Patterns across all of them
| | Demo moment | Deterministic core? | Measured anything? | Stakeholder view |
|---|---|---|---|---|
| Loomin | break the sim | hand-built models | latency | no |
| Minerva | avatar draws Manim | no | no | parent dashboard |
| MathWhiz | video renders | no | no | no |
| Neuroview | 3D brain + sync | marching cubes | no | collab |
| Explainable | call a phone | no | 30% cache speedup | no |
| Mimir | highlights your term | math validators | no | (teacher view "next") |
| Untangled | marks first wrong line | SymPy | no (but self-collected data) | no |

**Takeaway:** Nobody measured whether their pedagogy or diagnosis was right. Nobody made the student commit before seeing. "AI tutor explains/visualizes" is saturated: Minerva, MathWhiz, Explainable, Mimir and Loomin all do a version of it, and Gemini makes sims natively ([Google](https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/)). Our open lane is **predict-first + measured misconception diagnosis + class-level data**.

---

## 2. Strongest version for these judges

Judges who matter here: Ashish Aggarwal (UF EEd), whose work is LLM tools for student assistance and assessment plus learning analytics, and who is Co-PI on a $474k UF grant for AI tools for student help ([EEd page](https://eed.eng.ufl.edu/people/faculty/name/ashish-aggarwal/)); 3 DSI students (want a real model and an honest eval); CISE teaching faculty ("can you explain how and why"); big-tech engineers (polish, it works, it's not a wrapper).

### The single 10-second feature: "the ghost"
The judge draws where they think the object goes. The real object and **their own drawn path, animated as a ghost**, then run side by side. The moment the ghost "falls off" reality, a card appears with a *named* wrong idea ("Push runs out: you expect the forward motion to fade before it falls"), and it still doesn't tell them the answer.

Why this beats "another AI tutor" in 10 seconds:
- There is no chat box on the first screen. The first thing on screen is a pen, not a text input.
- The judge is wrong *in their own handwriting*. That's personal, and an expo judge remembers it.
- The diagnosis starts from the drawing itself, using geometry, before any LLM call. A straight-out-then-drop path, a curved path after release, and a radial fly-out are each a classic wrong model (impetus dissipation I3/G5, circular impetus I5, centrifugal force CF in the Hestenes taxonomy, [Hestenes et al. 1992](https://gwern.net/doc/science/physics/1992-hestenes.pdf)).
- One-line contrast to use proactively: **"Every AI tutor is trying to explain better. Ours makes you commit first, then tells you which wrong idea you have and proves it measured that right."**

### Tech core (what we defend at the table)
1. **Physics:** analytic or hand-written integration per item, checked against textbook numbers. The LLM never computes physics. (LLMs themselves fall for FCI misconceptions, [CEDTECH](https://www.cedtech.net/article/assessing-ais-problem-solving-in-physics-analyzing-reasoning-false-positives-and-negatives-through-15592), so this answers "why trust it".)
2. **Shape channel (deterministic):** resample the drawn polyline. Compare it to the true path with features: max deviation, horizontal-velocity decay before the drop, curvature after release, the angle of departure vs the tangent and the radial direction, and landing-point error. A few rules or a tiny logistic regression map these to the candidate codes for that item. It's explainable, fast and free.
3. **Text channel (LLM):** Gemini structured output with an `enum` of that item's codes + `correct` + `other` + `unclear`, an evidence quote, and confidence (per docs/feasibility.md). The prompt gets the item, the true outcome, the student's shape-channel result and their sentence. **It only labels and never generates feedback text with the answer.**
4. **Fusion + abstain:** If the channels agree, show the card. If they disagree or confidence is low, ask one targeted follow-up ("Did you expect it to keep going sideways after leaving the desk?") instead of guessing. Report accuracy at coverage.
5. **Next item:** A small table maps code to 2-3 items that discriminate that idea in a new context. A correct prediction there turns the node green.
6. **Leak guard:** All student-facing text comes from a fixed template per code. Nothing generated is shown to the student, so it can't leak the answer by construction. Say this to the Bastani point: unrestricted GPT-4 help left students 17% worse when it was removed ([Bastani et al., PNAS 2025](https://papers.ssrn.com/abstract=4895486)).

### The 3 demo items (our own wording, not FCI items)
Each is a drawing prediction, so the ghost works. Codes are from the Hestenes 1992 taxonomy.

**Item 1, "Off the Edge" (lead item):**
> A marble rolls at a steady speed across a desk and off the edge. Draw the path it follows until it hits the floor.
- Truth: a parabola starting horizontal at the edge.
- Wrong shapes to detect:
  - straight out, then a sharp corner straight down (I3 impetus dissipation / G5 gravity acts after impetus wears down);
  - a straight diagonal line down (K3-ish, the motion composed wrong);
  - dropping straight down at the edge (AF2-type: no push means no forward motion).
- Ghost moment: the ghost hangs in the air like a cartoon character, then drops, while the real marble curves. It's funny, and it's the hook.
- Follow-ups if missed: a delivery drone flying level releases a package (where does it land compared to the drone?); a ball rolled off the desk twice as fast (does it hit the floor sooner?). The second one targets K/G confusions about fall time.

**Item 2, "Snap":**
> A puck on ice is swung in a circle on a string, seen from above. At the marked point the string snaps. Draw where the puck goes next.
- Truth: a straight line along the tangent.
- Wrong shapes:
  - a curved path that keeps bending, then straightens (I5 circular impetus);
  - straight outward from the center (CF centrifugal force);
  - a mix (between the tangent and the radial direction).
- The ghost is very visual. The shape channel is nearly perfect here (angle and curvature), which gives us one item with high, defensible accuracy.
- Follow-up: a ball rolling out the end of a curved tube lying flat on a table.

**Item 3, "Top of the Toss" (arrow, not a path):**
> You toss a ball straight up. Freeze it at the highest point. Draw an arrow for the total force on it right then. (Draw a dot if you think it's zero.)
- Truth: a downward arrow, the same size as everywhere else on the flight.
- Wrong answers:
  - a dot / zero (AF3 no motion implies no force, or K2 velocity-acceleration undiscriminated);
  - an up arrow, or up and down "balanced" (AF2 motion implies active force, I3 the hand's push still inside it);
  - a smaller down arrow (G4/AF7 gravity varies with motion).
- Ghost: the student's arrow drawn on a scrubbable timeline next to the true constant arrow, plus a live v-t strip.
- **This is where the text channel earns its keep.** A dot can come from AF3 or K2, and only the sentence tells them apart ("it stops so nothing's pushing" vs "acceleration is zero because speed is zero"). That's a great Q&A answer for "why do you need the LLM at all?"

Order at the table: Item 1 (hook, 30 s) → explain the miss → targeted follow-up → dashboard. Items 2 and 3 are backups if a judge has more time or already knows Item 1.

### Eval design
- **Label sets:** 4-6 labels per item (codes above + `correct` + `other/unclear`). That's about 12-15 labels total, defined in a one-page label guide written *before* any data comes in, with 2 examples each.
- **Data, three sources, reported separately:**
  1. **Real at the event (headline set):** target 50-80 people x 3 items, giving 150-240 (drawing, sentence) pairs.
  2. **Hand-written by us:** 10 per code, about 150, written from the taxonomy descriptions. Used for prompt development and few-shot only, **never for the test.**
  3. Optional synthetic paraphrases, for stress-testing robustness only. Report them separately or not at all. DSI judges will discount synthetic test data.
- **Labeling:** both of us label every real item blind to the model output and to each other. Report **Cohen's kappa** between us, then adjudicate disagreements to make the gold set. The closest published reference point: GPT-4o vs human graders on energy/momentum explanations reached mean kappa 0.77 ([Savage & Rebello, PERC 2025 / arXiv 2508.14823](https://arxiv.org/abs/2508.14823)). A ModernBERT classifier beat prompted LLMs on one motion misconception ([FLAIRS 2026](https://journals.flvc.org/FLAIRS/article/view/141769)). Math-side precedent: Eedi's Kaggle MAP competition labeled student explanations with misconceptions, scored by MAP@3 ([Learning Agency case study](https://the-learning-agency.com/the-cutting-ed/article/case-study-math-misconceptions-competition), [Eedi](https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions)). Name-drop it: it shows we know the field.
- **Metrics, in the README table:**
  - macro-F1 and per-code precision/recall; a confusion matrix image;
  - model-vs-gold kappa next to our human-human kappa ("the model agrees with us about as well as we agree with each other" is the strongest sentence we could earn);
  - accuracy at coverage for the abstain rule (e.g. "92% when it answers, answers 81% of the time"; fill in real numbers);
  - **ablation:** majority class, keyword rules, shape-only, text-only, fused. The ablation is what turns this into ML for the AI/ML track rather than a prompt.
  - leak check: 0 answer leaks by construction (templated feedback), plus a regex audit of anything generated.
- **Honesty lines:** Hackers are mostly CS students, not intro-physics students, so the class balance differs from PHY 2048. N is small, so add bootstrap CIs. We don't claim learning gains; the eval is diagnosis accuracy only. The instrumented loop is what would let a course run a pre/post study.

### Collecting real explanations at the hackathon, quickly and ethically
- **Format:** "Beat the Ghost": 3 items, about 60 seconds, a phone-friendly page reached by QR code. Put a printed sign at meals (Saturday lunch and dinner) and the midnight snack, and keep a laptop at our table.
- **Incentive:** candy or stickers, and seeing your own ghost. People will do it for the "you got cartooned" moment.
- **Consent screen, plain language, before item 1:** "SwampHacks project by two students. We save your drawings and your one-sentence answers **anonymously** (no name, email or login) to test our classifier, and may show totals and anonymous examples in our demo and public repo. Skip any time. Tap 'delete my answers' at the end to remove them."
  - Add an "I'm 18 or older" checkbox and drop anything without it (MLH events can have minors).
  - Free text tends to pick up names, so tell people "don't type your name".
  - Scrub obvious PII (emails, phone numbers) with a regex before saving.
- **Store** only the strokes, the sentence, the item id, a timestamp and a random session id. No IP logging in the app (check the host's logs too). Put the dataset in the repo only after a manual PII pass, and keep a short data card next to it.
- **Ethics framing:** This is product testing for a hackathon demo, not research meant to produce generalizable knowledge. That keeps it outside IRB scope. UF's own QI-determination guidance draws the line at the intent to generalize ([UF Research](https://research.ufl.edu/?p=36345)). **If we ever want to publish or use it in a UF class, that needs an IRB determination first.** Say this in the README. The UF EEd judge will notice whether we know it.
- **Ask an organizer Friday night** whether a QR sign at meals is OK. Don't spam Discord channels. One post in the event's general or social channel, if allowed.
- Do not recruit in UF classes or the UF Physics department this weekend. That would be research on students and needs approval.

### Instructor-dashboard angle (the Aggarwal-facing closer)
- **The "class ghost cloud":** every student's drawn path for an item, overlaid at low opacity, colored by diagnosed code. An instructor sees in one second that 40% of the class draws the cartoon drop. It's novel and visual, and no tutor we found does it.
- **The misconception heatmap:** codes x items, % holding, with "fixed after follow-up" in green. Click a cell to see 5 anonymous sentences: the instructor reads the actual words.
- **"What to teach Monday":** the top 2 codes, plus the item that best separates them, ready to use as a clicker question. It's a template, not generated text.
- **Agreement panel:** where the model abstained, the instructor can relabel with one click. That adds to the labeled set. It's a human-in-the-loop data flywheel, which the DSI judges like, and it's real learning analytics.
- At judging it's pre-filled with the real hacker data from Saturday: "These are 70 of you, collected yesterday."
- Auth0 gives the instructor a login and role separation (instructor vs anonymous student). That's an honest Auth0 use.
- Live classroom mode (the room code, everyone locks in a prediction, the class ghost cloud reveals live) is the dream version and fits DeepSpace. **It's below the cut line.**

---

## 3. Track and prizes

**Recommendation: AI/ML track.**
- The brief is "AI/ML must be central ... fine-tuning, RAG pipelines, agents, custom models, evals ... non-trivial implementations and good coding conventions", and it needs a public repo with a README ([overview](https://swamphacks-xii.devpost.com/)). A two-channel classifier with an ablation, kappa and an abstain curve is literally "evals, non-trivial". The SwampHacks X AI winner was technical and visual (NN Visualizer), not a chatbot.
- It's crowded (about half of XI tagged Gemini), but most entries will be wrappers with no measurement. Our eval table is the separator.
- Track & Challenge Relevance is a general criterion too. A learning tool entered in Entertainment would read as a stretch to judges, which hurts on that criterion.
- **Entertainment & Creative** fits only if we re-skin it as an arcade game (Beat the Ghost with a leaderboard and levels). Then the classifier and dashboard are wasted effort for that track. Pick it only if the eval collapses (e.g. under 40 real responses by Saturday night) and the project becomes a game. That's a fallback decision point at about H24.

**Prize stack (honest):**
| Prize | Fit | Cost | Keep? |
|---|---|---|---|
| Best Overall (General) | Core | 0 | yes |
| AI/ML track | Core (classifier + eval) | 0 | yes |
| MLH Gemini API | Gemini is the text channel | 0 | yes (crowded, but free) |
| MLH GoDaddy domain | A live domain for the QR code and the demo | 0.3h | yes |
| MLH Auth0 | Instructor login + roles for the dashboard | 1-2h | yes, cut line 2 |
| MLH Vultr | Only if we actually host there (not Vercel) | 1-2h | optional |
| UI/UX (Easy On the Eyes) | Implicit; the ghost and the dashboard should be beautiful | polish | implicit |
| DeepSpace | Live classroom room | 4-8h, alpha SDK | only if live mode is done by H22 (unlikely) |
| Tiger Data / Solana / Sperry / Roblox / Nessie | No honest fit | — | skip |
| DEV post (#mlhacks, October) | Write it up after | 1-2h after | yes |

---

## 4. Build order: 2 people, 28 working hours

Roles: **A = classifier, eval, data, backend** (me). **B = canvas, sims, ghost, dashboard UI** (@luanamaldaner). Stack: React + Vite + canvas on the frontend; FastAPI + SQLite (or Supabase) on the backend; Gemini structured output.

| Hours | A (classifier/eval/backend) | B (sims/UI) | Gate |
|---|---|---|---|
| 0-2 | Both: lock the 3 items and the code list, and write the one-page label guide. A: repo, FastAPI hello-world deployed on the domain, Gemini key, GoDaddy domain. | Both (label guide). B: Vite app, canvas pen input with resampled polylines. | Deployed hello-world |
| 2-6 | Each writes 10 dev examples per code (blind). Gemini classifier endpoint: enum schema, evidence quote, confidence, abstain. | Item 1 analytic sim + ghost replay (draw, then race). | |
| 6-10 | Shape features + rules for Items 1 and 2. Eval harness: sklearn metrics, confusion matrix, kappa, baselines. | Item 2 sim + ghost. Misconception card (templated text). | |
| **10** | | | **Cut line 1:** a full loop on Item 1 (draw, ghost, sentence, card). If it's not working, drop Item 3 now. |
| 10-14 | Collection mode: consent screen, anonymous session id, 18+ box, PII scrub, delete-my-answers, storage. QR sign. | Item 3 (arrow + v-t strip). Follow-up item table + red-to-green mental-model graph. | Collection live before Saturday lunch |
| 14-18 | **Collect at lunch and in the afternoon.** Fusion + abstain follow-up question. | Instructor dashboard: ghost cloud + heatmap from live data. | 40+ responses by H18 |
| 18-22 | Sleep in shifts (4h each, staggered). Collect again at dinner. | | |
| 22-25 | Blind-label all real data (both of us), kappa, adjudicate, run the eval and ablation, write the README eval table + data card. | Auth0 instructor login (**cut line 2**: skip if not done by H24). Polish, accessibility (keyboard + no-audio demo), mobile check. | Eval table done by H25 |
| **24** | | | **Cut line 3:** if there are under 40 real responses, report the eval on what we have plus our dev set, clearly labeled. Don't switch tracks this late unless the classifier doesn't work at all. |
| 25-27 | Devpost write-up. | 2-min video (no-audio-safe, captions). | Video uploaded by H27 |
| 27-28 | Both: feature freeze, rehearse the 3-min script x3, run the "why did we do X" drill, prepare an offline fallback (recorded ghost clip + static eval table). | | Submit with margin |

**Never cut:** Item 1 loop + ghost + named card + real-data eval table.
**Cut in this order:** live classroom/DeepSpace → Auth0 → Item 3 → adaptive follow-ups (use a fixed sequence) → the graph (use a colored list) → Item 2.

### Write-up structure (take what worked from the winners)
1. Tagline: "Draw what happens. Watch your guess lose. Find out which wrong idea you have."
2. Inspiration: the cartoon-drop path, with one real number from *our* collected data ("X of 70 hackers drew it"), plus Hake 1998 ([PDF](https://web.mit.edu/jrankin/www/Active_Learning/hake_active_phys.pdf)) and Bastani 2025.
3. What it does: 3 short bullets + a GIF of the ghost (Pay Pals / Mimir style: lots of GIFs).
4. How we built it: an architecture line (sim → shape features → Gemini enum → fusion/abstain → templated card), plus "what the model is not allowed to do".
5. **Eval:** the table, the confusion matrix and the honesty lines (no other winner has this section).
6. Data and ethics: the anonymous collection, the consent text and the data card.
7. Challenges: concrete ones (an ambiguous dot in Item 3, timing the ghost, inter-rater disagreements).
8. AI-use disclosure, as the rules require.
9. What's next: the live classroom room and a pre/post study with IRB approval.
10. References: Hestenes 1992, Hake 1998, Bastani 2025, Savage & Rebello 2025 (Explainable's References section showed this reads well).

### Table tactics (from the teardowns)
- No audio dependence (Minerva's mic failure). The ghost is silent and visual.
- Hand the judge the stylus or mouse within 10 seconds. Never start with slides.
- Lobby during the event: show the kiosk to judges and mentors walking by on Saturday, and get them to try it (Minerva's "we heard about this project").
- Offline fallback: a recorded ghost clip and a static eval table, kept on the laptop.

## Sources
- Loomin: https://news.ucsc.edu/2026/04/engineering-student-wins-nvidia-agents-for-impact-hackathon/ · https://devpost.com/software/loomin · https://www.shortesthack.com/
- Minerva: https://devpost.com/software/minerva-3sj6z0 · https://www.evanyu.dev/blog/treehacks-2026 · https://computing.unl.edu/news/angeletti-claims-awards-stanford-university-hackathon · https://stanforddaily.com/2026/02/15/12th-annual-treehacks/
- MathWhiz: https://devpost.com/software/mathwhiz
- Neuroview: https://devpost.com/software/neuroview
- Explainable: https://devpost.com/software/explainable
- Mimir: https://devpost.com/software/mimir-the-ai-blackboard
- Untangled: https://devpost.com/software/untangled-mj5dy7
- NN Visualizer: https://devpost.com/software/neural-network-visualizer
- SwampHacks XII: https://swamphacks-xii.devpost.com/ · https://swamphacks-xii.devpost.com/rules
- Taxonomy: https://gwern.net/doc/science/physics/1992-hestenes.pdf
- LLM-on-explanations: https://arxiv.org/abs/2508.14823 · https://journals.flvc.org/FLAIRS/article/view/141769 · https://www.per-central.org/perc/2025/detail.cfm?ID=19858
- Eedi/MAP: https://the-learning-agency.com/the-cutting-ed/article/case-study-math-misconceptions-competition · https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions
- LLMs and FCI: https://www.cedtech.net/article/assessing-ais-problem-solving-in-physics-analyzing-reasoning-false-positives-and-negatives-through-15592
- Bastani: https://papers.ssrn.com/abstract=4895486 · Hake: https://web.mit.edu/jrankin/www/Active_Learning/hake_active_phys.pdf
- Judge: https://eed.eng.ufl.edu/people/faculty/name/ashish-aggarwal/
- UF QI vs research: https://research.ufl.edu/?p=36345
- Gemini sims: https://blog.google/innovation-and-ai/products/gemini-app/3d-models-charts/
