# Visual + brand direction (#26)

Look and feel for an Entertainment-track learning game that also has a shot at Easy On The Eyes. Builds on docs/design-depth.md (the method, the tells, contrast rules) and the paused lab-notebook tokens (`web/src/index.css`, `web/src/mm/ink.ts` on luanamaldaner/pen-input). Checked Oct 16 2026. Contrast numbers are WCAG ratios I computed myself.

## TL;DR
- **Recommend "Notebook Arcade":** keep the lab-notebook *meaning* (paper, ink = truth, pencil = your guess) and add a game layer (a chunky display face, a verdict stamp, springy lock-in, a streak). The notebook on its own reads as a calm study tool, not Entertainment.
- **The current ghost fails contrast.** `rgba(85,83,78,0.38)` on paper is **1.85:1**, under the 3:1 minimum for graphics. Use solid `#85827a` (3.6:1), 3px, dashed.
- **Marker orange `#e4572e` is 3.47:1 on paper.** That's fine for fills and large marks but not for text. Use `#b8401c` (5.2:1) for any orange text.
- Swap Caveat for **Shantell Sans** on hand labels: it's more legible, and its Bounce axis can animate on a win. Swap Plex Sans for **Atkinson Hyperlegible Next** as the body face (a legibility story for UI/UX judges). All are on @fontsource 5.3.0.
- Sound is a bonus, never needed: every sound has a visual twin, plus a mute toggle that stays visible. The expo is loud, and Minerva's audio died at TreeHacks (deep-mental-models.md).

## References: what to steal

| Reference | Strong identity because | Steal |
|---|---|---|
| Duolingo | One owned color (Feather Green `#58CC02`, from the mascot; Eel `#4B4B4B` for text) ([design.duolingo.com](https://design.duolingo.com/identity/color)), and a custom face, Feather Bold ([Creative Bloq](https://creativebloq.com/news/feather-bold)) | One owned color with a meaning. Ours: ink blue = truth. |
| Wordle / NYT Games | Three state colors and nothing else. Staggered tile flips. The emoji share grid spread it | A staggered reveal. A **share card** ("my ghost vs reality"). NYT fonts I couldn't confirm ([Office-Watch](https://office-watch.com/2022/make-worlde-in-office-word/)) [unverified] |
| Balatro | A "juice stack": rolling chip/mult counters, shake scaled to the score, and Joker triggers fire **one at a time**, which teaches cause and effect ([design breakdown](https://blakecrosley.com/es/guides/design/balatro)) [secondary] | The score counts up, and each misconception check "fires" in sequence, like jokers. |
| Juice it or lose it (Jonasson & Purho, GDC EU) | Tweening, squash/stretch and small sounds make a plain Breakout feel alive ([Game Developer](https://www.gamedeveloper.com/business/has-your-game-got-juice-more-), [roblog](https://roblog.co.uk/2024/03/juicy-games/)) | Squash on the lock button, a wobble on a wrong guess. Counterpoint: juice for its own sake distracts ([rpgplayground](https://rpgplayground.com/research-making-a-juicy-game/)). |
| Kahoot | Lobby and countdown music drive the energy. In a small NTNU study, music raised classroom energy, but "no audio = highest effort" ([NTNU pdf](https://ntnu.no/wiki/download/attachments/227443360/Effects%20of%20Points%20and%20Audio%20in%20K%21.pdf?api=v2)). Teachers complain the jingle drowns things out ([Kahoot forum](https://support.kahoot.com/hc/en-us/community/posts/115001072588-Ability-to-customize-or-disable-the-countdown-music?page=2)) | Sound for energy at the reveal only, and silent while thinking. Answer = color + shape [unverified on their exact pairing] |
| Brilliant | "Interactive games, no videos", with feedback built into the visual ([job post](https://jobs.lever.co/brilliant/9f63e8ed-2f9d-4e28-8a68-6262a0f8f68d)) | Feedback lives in the graph, not a toast. |
| Monument Valley | A small pastel palette per level, so every frame works as a poster [my read, unverified] | One palette for the whole app. Each topic gets one tint, nothing more. |
| Reigns | One binary swipe per card, and the whole UI is one decision [my read] | One prediction per screen. No sidebars. |
| The Pudding / NYT You Draw It | Editorial charts with hand-feel annotations. The reader's guess is the hero | Annotations in a hand font, pointing at the gap. |
| 3Blue1Brown | Dark bg, blue primary, yellow highlight (Manim `BLUE` `#58C4DD`, per [community notes](https://cdn.jsdelivr.net/gh/subinium/3b1b-style-animation-skill@main/README.md)) [secondary] | Motion as explanation. But dark + glow is the generic tell, so skip the palette. |

## Avoiding the generated look (on top of design-depth.md's tell list)
- The tells are Inter, purple/indigo gradients, three icon cards, glowing cyan on dark, and the same big radius everywhere. Also avoid shadcn default cards, emoji as icons, and a chat bubble as the main UI.
- **Make the hand-made parts actually hand-made:** perfect-freehand strokes for the user, `roughjs` (4.6.6) for 2-3 sketchy frames *only* (the lock button, the stamp), and real handwritten labels. Sketchy everywhere looks like a template.
- **Every color has a job:** ink = truth, pencil = you, marker = the gap / your mistake, green = called it. That's 4 roles and nothing decorative. Delete Tailwind defaults (`--color-*: initial`).

## Three directions

### A. Lab Notebook (existing, on pen-input)
- **Palette:** bg `#f4efe4`, paper `#fbf8f1`, grid `#dbe6ef`, text `#22201c` (15.3:1), ink `#1d3c8a` (9.6:1), pencil `#55534e` (7.2:1), marker `#e4572e` (3.5:1, fills only), marker text `#b8401c` (5.2:1).
- **Fonts:** IBM Plex Sans / Plex Mono + Caveat.
- **Motion:** calm. The ink draws on, and the ghost replays.
- **Signature:** graph paper with ink truth over a pencil ghost.
- **Why:** the metaphor *is* the mechanic, so the ghost needs no legend. It's far from the purple default. A light warm bg holds up in a lit hall.
- **Honest judgment:** the best *semantics* of the three, but the weakest *Entertainment* signal. Plex is safe and corporate, and Caveat goes thin and hard to read under ~20px. The ghost fails contrast (1.85:1). There's no juice yet. As-is, judges would file it under "nice study tool", not "creative tech".

### B. Called It (game-show stickers)
- **Palette:** cream `#fff6e5`, outline/text `#1a1a1a` (16.2:1), truth blue `#2f5bea` (5.1:1), tomato `#ff5a36` (fill; black on it 5.6:1), tomato text `#d63a1a` (4.4:1, large only), sun `#ffc531` (fill only; black on it 11:1), win teal `#00766a` (5.2:1).
- **Fonts:** Bricolage Grotesque (display, variable) + Atkinson Hyperlegible Next + JetBrains Mono for scores.
- **Motion:** springy (motion `spring`, stiff, low damping). Hard 4px offset shadows that "press" on click. 2px shake on the stamp.
- **Signature:** a verdict stamp that slams over the graph: CALLED IT / CLOSE / GHOSTED.
- **Why:** reads instantly as a game, has Duolingo/Balatro energy, and stays light-bg.
- **Risk:** neo-brutalist stickers are their own 2025-26 trend [unverified], so overdone it's a template. And it loses the pencil-vs-ink meaning.

### C. Chalk Show (dark chalkboard)
- **Palette:** board `#1f3a30`, chalk `#f3f1e7` (10.9:1), truth yellow `#f2d45c` (8.4:1), your guess pink `#f49ab5` (5.9:1), ghost `#9fb5aa` (5.7:1).
- **Fonts:** Shantell Sans + Recursive (mono/casual axes).
- **Motion:** chalk draw-on with a dust puff.
- **Signature:** the truth drawn by an invisible teacher's hand.
- **Why:** classroom plus game show, and it feels warm.
- **Risk:** dark bgs wash out on borrowed expo monitors in a lit room, dark + bright accents is close to the generic tell, and green-board reads "school", not fun.

## Recommendation: Notebook Arcade (A's meaning + B's game layer)
- **Palette (A, fixed):** paper `#fbf8f1`, desk `#f4efe4`, ink `#1d3c8a` = truth, pencil `#55534e` = your live stroke, ghost `#85827a` dashed 3px = your locked guess (3.6:1), marker `#e4572e` = the gap shading (at ~25% fill) and the mistake callout (text in `#b8401c`), called-it green `#1f7a3a` (5.1:1).
- **Fonts (all `@fontsource` 5.3.0):** `bricolage-grotesque` for display (titles, score, stamp), `atkinson-hyperlegible-next` for body/UI, `shantell-sans` for hand annotations and the user's labels, `jetbrains-mono` with `tabular-nums` for counters. Four families sounds like a lot, but each has one job; the body is only Atkinson.
- **Graph paper only inside the play area.** The chrome is plain paper, so the grid means "this is where you predict".
- **Signature component: the verdict stamp + gap callout.** After the wipe, the shaded gap pulses once, a hand-lettered arrow points at the biggest miss, and a stamp lands: CALLED IT (green), CLOSE (ink), or the misconception's short name (marker, e.g. "PUSH RUNS OUT"). The stamp is also the share card.
- **Motion budget:** lock = squash 0.95 then spring back (120 ms). Beat 400 ms. Truth wipe 1.2-2 s ease-in-out. Stamp drops in 180 ms with overshoot and a 2px shake. Score rolls up over 600 ms. Shantell's Bounce axis wiggles on CALLED IT. Chrome never animates. Respect `prefers-reduced-motion`.
- **Sound (opt-in friendly):** 4 sounds max: pencil scratch while drawing, the lock click, a rising tick during the wipe, and a stamp thud. Either Web Audio synth or `use-sound` (5.0.0) on howler. Default **on** at the table (energy) with a mute toggle in a corner, and nothing ever depends on sound.
- **Why:** it keeps the one idea judges will remember (your pencil ghost vs the ink truth) and adds the game energy the Entertainment track needs. It's cheap, because the tokens exist and only the fonts + stamp + springs are new (~2-3h).

## Projector / expo checklist
- Light bg (paper) for the lit hall. Truth line 4px, ghost 3px dashed, gap shading 25% marker. Never tell guess from truth by color alone: line style + label differ too (WCAG 1.4.1).
- Hero text (stamp, score) 48-72px in `?demo=1`, nothing under 14px, no hover-only info (design-depth.md).
- Check on a real external monitor Saturday. Projectors kill pale tints, so the grid `#dbe6ef` (1.19:1) may disappear, and that's OK; it's decoration. The ghost must not disappear.
- Contrast list to recheck when tokens are final: stamp text on its fill, and topic tints.
