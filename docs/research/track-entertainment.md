# Entertainment & Creative track: what wins (#17)

**Bottom line:**
- **The track rewards a game loop with "juice" plus purpose** (SignHero), or art plus story (StudyVerse), not an "AI tutor".
- **Predicting first IS the learning mechanism.** Watching a demo taught nothing measurable; predicting first did ([Crouch et al. 2004](https://www.compadre.org/portal/items/detail.cfm?ID=2329)).
- **Five recommendations:**
  - a cinematic reveal
  - misconceptions as a collectible cast you "bust"
  - a confidence bet before the reveal
  - open on a trap question
  - one cohesive art style

# Mental Models x Entertainment & Creative Tech: track research

Research only. Pages fetched Oct 16 2026. Devpost prize labels were read off each project page (the `winner` badge). Anything marked [inference] is my read, not a source.

## TL;DR
- The creative/game prizes at SwampHacks go to projects that **feel like a game or a world in the first 5 seconds**: SignHero's rhythm highway (XI Game Design + Overall), StudyVerse's hand-drawn pixel campus (XI Creative Media), FortBox's juice (screen shake, voice lines, ELO). Two learning projects won these prizes. Both won because the learning sits inside a game loop. Neither is a "tutor with a nice UI".
- XI's Creative Media prize said outright that it rewards "visual design, storytelling, animation, audio, or interactive media" and "creativity, aesthetics, or emotional impact over technical depth". XII's track text ("engaging digital experiences… games, interactive media… storytelling") comes from the same family. Track relevance is judged on **feel**.
- Our honest bridge is that **predict-then-reveal is the mechanic that turns a demo into learning** (Crouch & Mazur 2004: watching a demo did nothing measurable, predicting first did). So the "entertainment" part is the learning mechanism itself, not chocolate on broccoli. Lead with that.
- Pitch in one line: **"Bet on what happens, watch reality play out, find out exactly why your gut was wrong, and come back tomorrow to beat your streak."** Show the reveal moment in the first 20 seconds.

## 1. Teardowns: what creative, game and edu-game winners did

### SwampHacks (same organizers, same expo format)

| Project | Prize | What it is | Why it won |
|---|---|---|---|
| [SignHero](https://devpost.com/software/signhero) | XI **Best Overall + Best Game Design** | A Guitar-Hero highway where you fingerspell ASL into the webcam | 1) A familiar game metaphor, recognizable in a second ("the same way Guitar Hero made learning rhythm patterns addictive"). 2) **Juice**: synthwave look, "screen flash & shake on hits/misses", "streak glow", "particle bursts and floating score text", combo multipliers. 3) A real custom model (MobileNetV2 on MediaPipe landmark masks) with a latency number (~30-50 ms) and explicit timing windows (perfect = ±0.3 s). 4) Four modes (song, training, timed test, Whack-a-Sign) and a learner report. **Fun mechanic + measurable learning + a technical number.** |
| [StudyVerse](https://devpost.com/software/studyverse-mxbws8) | XI **Best Creative Media** | A real-time multiplayer pixel-art UF campus to study "together" in | All art was **hand-drawn** with a "cohesive pixel-art-inspired style… without using AI-generated art". It was set at UF (local resonance). The story is personal ("I often struggle when studying alone"). Technically light (Next.js + Supabase Realtime); it won on aesthetics and emotional framing ("presence over constant interaction"). |
| [FortBox](https://devpost.com/software/fortbox) | XI Best Use of MongoDB Atlas; most-liked XI project (35 likes) | Fortnite-style 1v1 build battles in Roblox | It put a prize-targeting table in the write-up that maps every prize to features, including "Best Creative Media: screen shake, damage flash, victory cinematics, 13 voice clips" and "Best User Design: 5 colorblind modes, UI scaling, reduced motion, subtitles". It still didn't win Game Design or Creative Media. **Juice alone lost to juice + purpose (SignHero) and to art + story (StudyVerse).** [inference] |
| [ATC-Trainer](https://devpost.com/software/atc-trainer) | XI Best Use of ElevenLabs | Godot air-traffic-control sim with voice commands and AI pilots | A sim that is also training ("design an engaging and educational tool"). The tagline "Proceed To Runway" is pure flavor. It used real ATC conventions. Voice made it feel alive. |
| [Neuroview](https://devpost.com/software/neuroview) | XI Best User Design | 3D MRI brain viewer with Google-Docs-style live collaboration | Learning through **direct manipulation** (rotate, slice, annotate) and a live link. The team split roles explicitly, with two people on UI and visual design. |
| [Explainable](https://devpost.com/software/explainable) | XI Best Use of Gemini | Voice tutor with UF-mascot personas (Albert/Alberta) | Characters plus voice turned a chatbot into a personality. Note it won a sponsor-tech prize, not a creative one. **Plain "AI tutor" does not win the creative track.** |
| [Debug Demolition](https://devpost.com/software/tempdebugbattle) | X 1st Education | Multiplayer rooms where you race to fix AI-bugged code; ELO | Competition, ELO and rooms turn practice into a game. Timely framing ("the growing world of AI inaccuracies"). A short write-up (~675 words) still won, because the loop is obvious. |
| [MathWhiz](https://devpost.com/software/mathwhiz) | X 3rd Overall | Prompt → Manim animated explainer video with voiceover | Any-topic generation with a visual payoff. But it's passive (you watch). Our predict-first loop is the step beyond this. |

### Comparable events (dedicated Entertainment tracks)
- **Hacklytics 2026 Entertainment track** ("enhance storytelling, content creation, player engagement, or immersive media", https://hacklytics-2026.devpost.com/):
  - 1st, [A Spark in the Dark](https://devpost.com/software/a-spark-in-the-dark): hand-drawn indie art ("inspiration… Hollow Knight"), hand-gesture control via MediaPipe, and a Gemini + ElevenLabs **AI narrator** "to incorporate a complete story". Simple tech; won on art + novel input + narration.
  - 2nd, [Tempr](https://devpost.com/software/tempr): "we gamify the process of discovering new music"; mood/photo/calendar → Gemini + Spotify queue.
  - 3rd, [DataFables](https://devpost.com/software/hacklytics-2026): "turns **any topic** into a personalized illustrated kids' storybook with branching stories, vocab learning, and narration in 10 languages"; achievements, Lexile-level tailoring. **The closest analog to us that placed in an entertainment track**: any-topic in, story + choices + rewards out, and education stated as the goal ("an educational game for young children").
- **HackPrinceton Fall 2025**, [MindPad](https://devpost.com/software/mindpad): **Best Overall** + Amazon + Gemini. "Reignite the wonder of learning, one gesture at a time." Gestures + voice + flashcards + diagramming. The "wonder" framing for a study tool won the top prize.
- **HackPrinceton Fall 2025**, [Discer.io](https://devpost.com/software/discer-io): YC challenge + Dedalus. "Learn Agentic AI through play… like Scratch, but for AI agents"; agents fight in an MMO sandbox. Learning-through-play with a one-line analogy.
- **NVIDIA GTC 2026 Agents for Impact**, [Loomin](https://devpost.com/software/loomin): 1st of ~300 ([UCSC](https://news.ucsc.edu/2026/04/engineering-student-wins-nvidia-agents-for-impact-hackathon/)). "Understanding that never has to survive execution is fake"; notes become a live 3D physics sim. The closest thesis to ours; differentiate by **commit before you see** + named misconception (see docs/deep-mental-models.md).
- **HackUSF 2026**, [Bowser](https://devpost.com/software/bowser-d0nvh4): "Turning rehab into heroic play"; a game loop and a character voice (Bowser) over a serious task.

### Patterns
1. **A known game metaphor in the tagline** (Guitar Hero, Scratch, Fortnite, Whack-a-Mole, "heroic play"). Judges get it in one breath.
2. **Juice + audio + a narrator/character.** Every creative winner has at least one of: hand-drawn or cohesive art, screen-feel effects, voice/narration. Devpost's Google judge: "The first thing we're gonna do is just play the game… Adding elements of sound and storytelling makes it really fun" ([Devpost judging tips](https://info.devpost.com/blog/hackathon-judging-tips)).
3. **Learning-y projects win creative prizes only when the game loop *is* the learning** (SignHero's notes are the letters; Debug Demolition's race is the debugging). Explain-only tutors (Explainable, MathWhiz) won on other criteria.
4. **Personal/local story**: UF campus, "I struggle studying alone", mascots.
5. **One hard technical number even on creative entries** (SignHero latency, timing windows). Criterion 1 in XII is Technical Understanding.

## 2. Who likely judges this track
- XII judging is expo-style; judges come to tables ([Devpost](https://swamphacks-xii.devpost.com/)). Track prizes are judged by the **general pool** against the 7 criteria; only sponsor challenges get sponsor-assigned judges (criterion 7). MLH's plan sends ~3 judges per project and stack-ranks top-3s ([MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)). You need to be **someone's #1 of the batch they saw**: memorability wins.
- The entertainment-adjacent names in the pool are Roblox x2 (Nicolas Slenko, Blake Crawford), SiriusXM (Jayakumar Ramalingam), Apple x2 (Christopher Tressler, Shreyas Kodela), Meta (Haswanth Popuri) and Vobile (Britt Woodall; entertainment content and DreamMaker AI creation, see docs/judges.md). Individual bios were **not findable** by web search (searches returned nothing relevant), so their values below are inferred from their companies:
  - **Roblox**: engagement loops, social/multiplayer, creator tools, safety for young users. They will poke at "why would I come back?" and "can friends play?" [inference]. Roblox's own brief here names "educational" experiences explicitly.
  - **SiriusXM/Pandora**: personalization and recommendation, audio and voice. A sound design and a "your feed adapts to your misconceptions" angle land [inference].
  - **Apple**: polish, motion, haptic feel, accessibility, privacy, no jank. One smooth flow beats five features [inference].
  - **Meta**: social mechanics and sharing, scale [inference].
  - **UF teaching judges** (Engineering Education's Ashish Aggarwal researches LLM tools for student help; CISE teaching faculty): learning validity. "Is this actually learning or just fun?" Have the Crouch & Mazur line ready.
- The general pool is mostly enterprise engineers (docs/judges.md). For them the bar is "does it work, can you explain it" (Functionality + Technical Understanding).

## 3. Framing a learning app as Entertainment & Creative, honestly
- **The thesis:** In physics education research, students who passively watched a demonstration scored no better than students who never saw it; students who **predicted the outcome first** learned significantly more (Crouch, Fagen, Callan & Mazur, "Classroom demonstrations: Learning tools or entertainment?", Am. J. Phys. 72, 835 (2004), https://www.compadre.org/portal/items/detail.cfm?ID=2329). The title of that paper is literally our pitch: **we make the entertainment the learning tool.**
- **The surprise is the hook, and the science agrees.** Confident wrong predictions corrected by feedback stick best (the hypercorrection effect, Metcalfe/Butterfield; Fazio's Duke dissertation, https://dukespace.lib.duke.edu/items/d6ab09ca-f55c-4efb-9d32-2788bc5838b2/full). In game terms, a confidence bet before the reveal makes the payoff bigger. Fun and pedagogy point the same way.
- **Avoid "chocolate-covered broccoli"** (points and badges bolted onto quizzes). The classic critique of edutainment is Bruckman, "Can Educational Be Fun?" (GDC 1999), https://faculty.cc.gatech.edu/~asb/papers/conference/bruckman-gdc99.pdf. Our core loop (bet → reveal → "here's the exact wrong idea in your head") is intrinsically game-like. Streaks and XP are the retention wrapper, not the point.
- **The retention loop is real at scale.** Duolingo reports learners on a 7-day streak are ~2.4x as likely to come back the next day, and that redesigning the streak raised 7+ day streakers by over 40% (https://blog.duolingo.com/improving-the-streak/). Cite it to justify the "keep coming back" loop. Show a streak/"misconceptions busted" counter, but don't oversell it as learning.
- **Words to use** (track text vocabulary): "interactive", "experience", "story", "play", "reveal". Avoid "platform", "tutor", "dashboard" in the opener.
- **The story element:** each topic plays out as a tiny scene with stakes (a ball, a market, a cell, an election) and a narrator who names your misconception like a character reveal ("You're running the *impetus* model, the same one medieval scholars held"). Naming the model as a character/archetype is the storytelling hook and is honest: misconceptions have names and histories.

## 4. Five recommendations (Track Relevance + Innovation + Design)

1. **Make the reveal a moment, with juice and sound.** Lock-in animation → a beat of suspense → the truth plays out next to your ghost prediction → a hit/miss sting and a screen flash, then the misconception card flips in. One sound designer pass (free SFX) plus Framer Motion. This is the 5-second "play the game" test judges run ([Devpost tips](https://info.devpost.com/blog/hackathon-judging-tips)), and what SignHero and FortBox put in their write-ups. *Scores: Track, Design.*
2. **Turn misconceptions into a collectible cast ("the models in your head").** Each named misconception (impetus, "heavier falls faster", "correlation means cause") is a card with a name, an icon and a one-line origin story. You "bust" it by beating 2-3 transfer questions. A "Mind Map" collection screen plus a streak. That gives story, collection and return reasons without fake points, and it makes "your exact misconception named" the visual centerpiece. *Scores: Innovation (nobody names the learner's model as a character), Track, Purpose.*
3. **Add a confidence bet before the reveal.** A slider of how sure you are (or "bet 10/50/100 XP"). High-confidence misses get the dramatic reveal and the biggest XP for the comeback. That's game stakes grounded in the hypercorrection effect. One sentence in the pitch: "the bet isn't decoration; confident mistakes are the ones you fix for good." *Scores: Innovation, Technical Understanding.*
4. **Pitch line plus a 20-second demo opener built on a surprise most judges fail.** Start the judge on a topic where intuition is wrong (e.g. "two balls rolled off a table, one dropped: which lands first?" or Monty Hall). Let the judge predict, and let them be wrong. Then say: "That gut feeling has a name. Mental Models turns any topic into a predict-and-reveal game." Then type their topic live to show it's general. Close on Crouch & Mazur: "watching a demo teaches nothing; predicting first does. We made the prediction the game." Being someone's top-3 needs a memorable personal moment ([MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)). *Scores: Track, Purpose, Design.*
5. **One cohesive art direction plus a multiplayer/room hook if time allows.** Pick a single style (chalkboard, paper cutout, or pixel) and apply it everywhere. StudyVerse won Creative Media on cohesion alone, and hand-made assets also play well with the Least Vibe Coded judges. Stretch goal: a room code where the table or a class all predict, then see the "crowd ghost" cloud reveal. Debug Demolition (rooms + ELO) and Neuroview (live share) show social play wins at SwampHacks, and it suits the Roblox/Meta judges. Keep the any-topic generator honest: show 2-3 hand-polished "hero" topics for the demo and say other topics are generated. *Scores: Design, Innovation, Functionality.*

**Don'ts:** don't open with "AI tutor" (Explainable won a sponsor prize, not a creative one). Don't let the reveal be text-only (MathWhiz-style passive watching is exactly what the 2004 study shows fails). Don't claim learning gains we didn't measure. Do keep one honest number (e.g. "% of judges who missed the first prediction", collected at the table).

## Sources
- SwampHacks XII: https://swamphacks-xii.devpost.com/ ; local /home/bot/hack/event/hacker-guide.md, devpost.txt
- SwampHacks XI prizes (Game Design, Creative Media, User Design text): https://swamphacks-xi.devpost.com/ ; gallery https://swamphacks-xi.devpost.com/project-gallery
- SwampHacks X gallery: https://swamphacksx.devpost.com/project-gallery
- Hacklytics 2026 tracks and gallery: https://hacklytics-2026.devpost.com/ , https://hacklytics-2026.devpost.com/project-gallery
- Project pages: devpost.com/software/{signhero, studyverse-mxbws8, fortbox, atc-trainer, neuroview, explainable, tempdebugbattle, mathwhiz, a-spark-in-the-dark, tempr, hacklytics-2026, mindpad, discer-io, loomin, bowser-d0nvh4}
- Loomin win: https://news.ucsc.edu/2026/04/engineering-student-wins-nvidia-agents-for-impact-hackathon/
- Judge advice: https://info.devpost.com/blog/hackathon-judging-tips ; MLH: https://guide.mlh.com/general-information/judging-and-submissions/judging-plan
- Crouch et al. 2004: https://www.compadre.org/portal/items/detail.cfm?ID=2329 (DOI 10.1119/1.1707018); Mazur group page https://mazur.harvard.edu/research-areas/classroom-demonstrations
- Hypercorrection: https://dukespace.lib.duke.edu/items/d6ab09ca-f55c-4efb-9d32-2788bc5838b2/full
- Bruckman 1999: https://faculty.cc.gatech.edu/~asb/papers/conference/bruckman-gdc99.pdf
- Duolingo streak: https://blog.duolingo.com/improving-the-streak/
- Prior team notes: docs/teardowns.md, docs/judges.md, docs/prizes.md, docs/deep-mental-models.md
