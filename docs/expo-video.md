# Expo table, demo video, Devpost checklist

General, works for any idea.

**Bottom line:**
- Be the most memorable of the ~10 tables a judge sees, and keep the table staffed the whole expo.
- Both of us can give the 3:00 and 1:30 pitches alone.
- A muted, captioned 10-20 s loop plays on the second screen.
- **Put the video URL in Devpost Saturday night**, since the video can't change after 8:00am Sun.
- **Stop editing the gallery page early**, because edits unpublish it until re-review.

# Expo table, demo video, Devpost checklist

Research notes, 2026-10-16. For SwampHacks XII (Reitz Union). Judging is a science-fair expo: judges walk to our table, we get 3:00 of live demo plus 1:00 of Q&A, and there's no finals stage. The Devpost video is 2:00 max. Submit by Sun 8:00am. This builds on docs/pitch.md and docs/teardowns.md and doesn't repeat them.

## What this means for us (short version)
- **Judges stack-rank.** Each judge sees a set of tables and brings back their **top 3**. Organizers then re-check the top 3-5 before picking winners ([MLH judging plan](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)). So:
  - we need to be memorable relative to the ~10 tables next to us;
  - at least one of us has to be at the table, demo reset, for the **whole** expo, because a validation visit can come late.
- **Expect 3+ judge visits plus separate sponsor-judge visits.** MLH recommends every project gets seen 3 times, and sponsor judges go only to the projects that opted into their challenge ([MLH](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan), [MHacks expo writeup](https://medium.com/how-to-throw-a-hackathon/why-hackathons-should-conclude-with-an-expo-635563ceab2f)). Have a sponsor-tuned version of the pitch ready for each challenge we enter.
- **Both of us must be able to give the full 3:00 and the 0:90 solo.** With 2 people, a queue or two judges at once means we split. That needs a second demo surface: the attract-loop screen doubles as demo station 2.
- **Video: build it from ffmpeg + a scratch voiceover. Lock it Sat night, polish Sun 2-5am, final upload by 6am.**
  - YouTube processing can take "anywhere from a few minutes to several hours" ([Devpost](https://help.devpost.com/article/84-video-making-best-practices)).
  - After the deadline we can't change the submission's video at all ([Devpost](https://help.devpost.com/article/123-how-to-edit-a-submission)).
- **Devpost gotchas:**
  - Mark a track (**max one specialized track**) and every challenge we qualify for.
  - Credit libraries and APIs, and disclose AI tools ([XII rules](https://swamphacks-xii.devpost.com/rules)).
  - The video must be a YouTube/Vimeo/Youku URL.
  - The repo must be accessible.
  - Editing after the gallery is published sends us back to the review queue ([Devpost](https://help.devpost.com/article/81-my-submission-disappeared)), so stop fiddling once we're published.

---

## 1. Expo table craft

### How expo judging works from the judge's side
- Judges get a set of table numbers and a room map, and walk the set. MLH budgets **~4 min per project**: 2 min presentation + demo, 1 min questions and scoring, 1 min walking. Each judge brings back their top 3 of the set ([MLH](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)). SwampHacks gives us 3+1, so expect judges to cut us off at 4.
- MLH tells judges to "focus on learning over profit": awesome technology over a startup pitch ([MLH](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)).
- Judges score relative to what they just saw, even when told not to. Square's judge says "it's very easy to try to evaluate projects relative to one another" ([Devpost judges interview](https://info.devpost.com/blog/hackathon-judging-tips)). The table next to us is our competition.
- The bar to aim for is something working within ~90 seconds, and **one** clear flow, not a feature tour ([JetBrains judges' notes](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/), via search snippet; the page itself 403'd).
- AngelHack's 3-minute split: ~30 s problem/solution, ~90 s live demo, the rest on tech and next steps ([AngelHack](https://angelhack.com/blog/10-tips-to-help-you-rock-your-next-hackathon-demo/), snippet). Our pitch.md script already fits this.

### Table layout (we have about a 6 ft table, shared or half)
```
 [aisle / judges stand here]
 ┌───────────────────────────────────────────────────────────┐
 │  SIGN (tent card)     MAIN LAPTOP          ATTRACT SCREEN  │
 │  name + 1 line +      angled ~45° toward   (2nd laptop or  │
 │  QR + table #         judge, not us        phone/tablet on │
 │                       crew phone / prop    a stand), muted │
 │                       in front, in reach   loop + captions │
 └───────────────────────────────────────────────────────────┘
   narrator stands at the aisle corner; driver stands beside the laptop
```
- **Angle screens toward the aisle.** Trade-show advice is to face the demo inward or at about 45° so it pulls people in ([SpeedPro](https://www.speedpro.com/nw-raleigh/tips-for-effective-trade-show-booths-displays/), snippet).
- **The prop goes closest to the judge.** The judge's hand on the device is the most memorable moment (pitch.md "Table demo moments"). MHacks: "you get to jump on their laptop or smartphone to try it out for yourself right there" ([MHacks](https://medium.com/how-to-throw-a-hackathon/why-hackathons-should-conclude-with-an-expo-635563ceab2f)).
- **Height.** Booth guides put the anchor visual at standing eye level, about 60 in ([rentforevent](https://rentforevent.com/blog/trade-show-booth-ideas/), snippet). Use free height: a laptop on a closed backpack or a box, or a phone on a stand. Don't make everyone look down at a flat screen on a 30-inch table.
- **Keep the table bare.** No cans, cables or chargers in view. Tape the power strip under the table.

### Attract loop (second screen)
- Movement draws the eye. One exhibitor wrote that a looping video of real use made people start "gravitating toward our booth in droves." Run it **muted with captions** ([Entrepreneur](https://www.entrepreneur.com/article/247570), [SpeedPro](https://www.speedpro.com/nw-raleigh/tips-for-effective-trade-show-booths-displays/), snippets).
- **Content:**
  - the 10-20 s wow moment from the Devpost video (storm sweeps in and the site goes red, or the ghost arrow vs the real force);
  - a big caption line;
  - the project name.
  - Not the whole 2:00 video: passers-by give it 3 seconds.
- **How:**
  - `ffmpeg` cuts a seamless clip (cheat sheet below).
  - Play it fullscreen on loop: `mpv --loop-file=inf --fs --no-audio clip.mp4`, or VLC "Repeat one" + fullscreen, or macOS QuickTime View > Loop.
  - A browser tab running the live app in replay mode works too, if it's stable.
- The loop screen becomes **demo station 2** when two judges arrive. Make sure that machine can also run the app.

### Signage, QR, handouts
- **Table number visible.** MLH tells organizers to put a project-number paper on each table, and suggests a number on a yard-long stick to show above heads ([MLH](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)). If the organizers don't hand one out, make one.
- **Tent card / sign** (letter paper folded, or a screen if we can't print):
  - project name in huge type;
  - one line of what it does;
  - the track/challenges we're in ("Sperry Tech challenge");
  - a QR to the Devpost page or live URL.
  - Readable from 2-3 m. That means name text about 1.5 in tall, roughly 100+ pt.
- **QR code:** generate one free and offline, e.g. `qrencode -o qr.png -s 12 'https://...'` on Linux, or any QR site. Test it with two phones under hall lighting.
- **Handout = something the judge keeps.** It's the "judge leaves holding something" item in pitch.md: the printed briefing card or prediction card, which also has the QR.
  - **Printing costs money** (campus print cents). My call. Free fallback: QR on the attract screen, and judges photograph it.
- **Point at things while talking.** Science-fair coaching says reference the board and results while you talk ([Weber State advice](https://apps.weber.edu/wsuimages/ritchey-science-fair/Analysis_Presentation/Advice_for_Judging_Day.pdf), snippet).

### Standing vs sitting, greeting
- **Stand.** Science-fair coaching across the board: stand when a judge arrives, introduce yourself (first and last name), eye contact, and treat it as a conversation, not a speech ([Weber State](https://apps.weber.edu/wsuimages/ritchey-science-fair/Analysis_Presentation/Advice_for_Judging_Day.pdf), [St. Johns County STEM fair tips](https://www.stjohns.k12.fl.us/stem-fair/wp-content/uploads/sites/182/2024/11/SJCSD-Judging-Tips-for-Students.pdf), [Idaho ISEF tips](https://stem.idaho.gov/wp-content/uploads/IDSEF/ISEF-Science-Fair-Competition-Tips.pdf), snippets).
  - I found no study showing that standing staff draw more traffic. Booth guides just treat seating as a later, deeper-conversation thing.
  - Standing also keeps us awake.
- **Opening line, in order:**
  1. "Hi, I'm Alex, this is Luana."
  2. A one-line hook (from pitch.md).
  3. Hand them the prop.
  - Ask "how much time do you have?" only if they look rushed. That's when we switch to the 0:90.
- **Ask for their badge/company.** A Sperry or NextEra judge gets the utility-ops framing; a Meta/Apple judge gets the tech framing. Judge profiles are in docs/judges.md.
- **Don't overstaff the front.** Trade-show advice says people get intimidated approaching more than three staff ([SpeedPro](https://www.speedpro.com/nw-raleigh/tips-for-effective-trade-show-booths-displays/), snippet). We're two, which is fine. Don't let friends crowd the table.

### Sound in a loud hall
- **Assume the judge hears nothing from our laptop speakers.** The demo can't depend on audio.
  - Alerts must be **visual**: a color flip, a toast, a full-screen flash.
  - A buzz/vibration in the judge's hand (phone) beats a sound.
- **Voice.** Stand on the judge's side of the table, so we're shoulder to shoulder facing the screen, not across it. Lean in, slow down, and use short sentences. Narrator voice carries; don't over-explain.
- If something has to make sound, play it from the phone held near the judge's ear. Don't turn up laptop volume: booth advice is that intrusive audio annoys neighbors and backfires ([SpeedPro](https://www.speedpro.com/nw-raleigh/tips-for-effective-trade-show-booths-displays/), snippet).

### Lighting and screen setup (Reitz ballroom lights + glare)
- **Brightness:**
  - Screen at 100%.
  - Disable auto-brightness, Night Shift / Night Light and True Tone.
  - Dark-mode UI washes out under overhead lights. Prefer a light theme or high-contrast colors for the demo screen.
- **Stop the machines sleeping:**
  - Mac: `caffeinate -dimsu &`.
  - Windows: Settings > Power > Screen/sleep "Never".
  - Linux: disable the screen blanker.
- **Do Not Disturb on, everywhere.** Close Slack/Discord/email. Hide the bookmarks bar. Use one browser window with only demo tabs, zoomed to 125-150% so a standing judge can read it.
- **Camera-input demos** (Mental Models sketch cards) need a desk lamp or a phone flashlight as a fixed light source. Test at the actual table during setup.
- **Power and network:**
  - power strip + extension cord;
  - hotspot phone charged; venue Wi-Fi will be crowded;
  - replay data served locally (already in pitch.md fallbacks).

### Judge queue and two judges at once
- **Second judge arrives mid-pitch:**
  - Narrator (no pause): "Hi, join us. We're about a minute in. Luana will catch you up / give you your own run in a sec."
  - **Driver takes judge 2 to station 2** (the loop screen) and gives the 0:90 solo. Judge 2's score then isn't dependent on a half-heard pitch.
  - Never make a judge wait out someone else's full 4 minutes. Judges have a strict clock ([MLH](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)), and a waiting judge walks off.
- **Two judges arrive together:** run one pitch for both. Make eye contact with both, and hand the prop to one and a second prop or phone to the other.
- **Queue of 3+ (sponsor reps plus judges plus passers-by):**
  - Real judges first. They have badges or clipboards; ask "are you judging?"
  - Passers-by watch the loop or get the 0:90 from whichever of us is free.
  - Peers can be sent to the QR.
- **Being cut off:** if the judge glances at their sheet or the next table, jump straight to the wow moment and the one-line close. The 0:90 version is literally: hook → "we built X" → wow → one sentence of tech/sponsors → stop (pitch.md).
- **Reset between judges in under 10 s.** Have a "reset demo" button or keyboard shortcut that puts the replay back to t=0 and clears state. Practice it.
- **Note each visit.** Jot each judge's name/company and the questions they asked on a phone note. Repeat questions mean the pitch is missing something; patch the script.
- **Rotation (MHacks):** one person demos while the other walks the floor ([MHacks](https://medium.com/how-to-throw-a-hackathon/why-hackathons-should-conclude-with-an-expo-635563ceab2f)). For us, with prize-critical judging, **both stay** during peak judging. Only rotate breaks (water, bathroom) during lulls, and never leave the table empty.

### Energy after no sleep
- **Caffeine nap:** caffeine right before a 20-min nap beat either alone in small studies. The caffeine kicks in as you wake, which cuts grogginess (Hayashi et al. 2003; Horne & Reyner driving-sim study; a 2020 night-shift pilot with 200 mg + a 30-min nap) ([Frontiers review](https://www.frontiersin.org/articles/10.3389/fpsyg.2021.720493/full), [PubMed pilot](https://pubmed.ncbi.nlm.nih.gov/32819191/)).
  - Samples were tiny (6-12 people), but it's cheap.
  - Plan: after submitting (~6am), each of us takes one coffee + 20-min nap shift before the expo, staggered so the table and the rehearsal are covered.
- **Sleep in shifts Fri/Sat** (already in strategy.md: 3-4h each).
- **Eat real food before the expo, and drink water.** Avoid a huge sugar spike right before judging.
- **Run the script three times out loud right before the expo.** Fatigue kills recall first, so write the 5 beats on an index card taped beside the trackpad:
  1. hook
  2. built X
  3. wow
  4. tech + sponsors
  5. limit / close
- **Don't vamp.** Tired people over-explain. Stop when the script stops and let them ask.
- **When the demo breaks:** stay calm, crack a joke, switch to the recorded run. Calm under pressure is visible and counts ([Morrill on Disrupt demos](https://ellemorrill.substack.com/p/tips-for-your-60-second-techcrunch-disrupt-demo)).

### Keeping the 0:90 version
- The 0:90 version is the 3:00 with beats 4-5 compressed and the Q&A seeded.
- **Rehearse it as a separate piece**, timed, at least twice. Science-fair coaching keeps both a full talk and a 30-60 s "four sentences" version: what you did, why, what you found, take-home ([Weber State](https://apps.weber.edu/wsuimages/ritchey-science-fair/Analysis_Presentation/Advice_for_Judging_Day.pdf), snippet).
- TechCrunch's line: consolidating the key development points into "ten seconds or less" wins technical judges ([TechCrunch](https://techcrunch.com/?p=546803), snippet). That's our "we built X" sentence.

### Expo checklist (set up as soon as table assignments drop)
- [ ] Table number visible; tent card with name / one line / QR / challenges
- [ ] Main laptop on a riser, angled, 100% brightness, DND on, caffeinate on, demo tabs only, zoom 125-150%
- [ ] Attract loop running muted with captions on the second device, which can also run the demo
- [ ] Props in front: crew phone (charged), cards
- [ ] Power strip taped, hotspot ready, local replay data loaded
- [ ] Reset shortcut tested
- [ ] Recorded backup video open in a background tab, offline copy on disk
- [ ] Index card with the 5 beats; judge-notes phone note open
- [ ] One of us at the table at all times; both at closing (prize rule)

---

## 2. Demo video in under 2 hours (free tools, no paid accounts)

### Ground rules
- **Devpost wants a screencast with narration**, not a marketing video. Pitch what it does in the first few seconds, edit out the messy parts, and script and rehearse first ([Devpost best practices](https://help.devpost.com/article/84-video-making-best-practices)).
- **MLH:** "Their video should be a demo of their hack, not a presentation" ([MLH](https://guide.mlh.com/general-information/judging-and-submissions/judging-plan)).
- **Databricks judge:** they liked videos that "demo their code" or voice over the components, and "the storytelling component is huge" ([Devpost judges interview](https://info.devpost.com/blog/hackathon-judging-tips)).
- **Our limit is 2:00 hard** ([XII rules](https://swamphacks-xii.devpost.com/rules)). Target 1:50-1:55. The outline is in pitch.md (hook 0-10 s, happy path with VO, wow by 0:30, architecture + sponsors, eval number + close).
- **Upload only from an account Alex already has.** Rule: no new accounts. The default YouTube upload limit is 15 min, which is fine for us; verification only matters for longer videos and custom thumbnails ([YouTube](https://support.google.com/youtube/answer/71673)).

### Recording tools
| Tool | How | Notes |
|---|---|---|
| macOS built-in | **Shift-Cmd-5** → Record Entire Screen / Selected Portion (Selected Window on macOS 26+) → Options → Microphone | Saves `.mov`. Pick the mic under Options; "None" = no mic ([Apple](https://support.apple.com/102618), [Apple guide](https://support.apple.com/guide/mac-help/mh26782)) |
| Windows 11 Snipping Tool | **Win+Shift+R** → select area → Start | Mic is muted by default and system audio is a separate toggle; update the app if the toggles are missing ([Microsoft](https://support.microsoft.com/help/13776), [ScreenSnap](https://www.screensnap.pro/blog/snipping-tool-screen-recording-windows)) |
| Windows Game Bar | Win+Alt+R | Records one app window only; Devpost mentions it ([Devpost](https://help.devpost.com/article/85-uploading-a-demo-video)) |
| OBS Studio (free, all OSes) | Settings > Output > Recording Format **Hybrid MP4** (OBS 30.2+) or MKV, then File > Remux Recordings | Hybrid MP4 stays recoverable if OBS crashes mid-recording; plain MP4 does not. Remuxing MKV→MP4 doesn't re-encode ([OBS KB](https://obsproject.com/kb/hybrid-mp4), [Radboud OBS wiki](https://tsgdoc.socsci.ru.nl/index.php/OBS_Studio)) |

**Recording tips:**
- Set the display to **1920x1080**, or record a 16:9 region. Mac screens are 16:10 and will get letterboxed (the pad command below fixes that).
- Use browser zoom 125%, hide the bookmarks bar, DND on, and fake but realistic seeded data.
- **Record each beat as a separate short clip** (5-6 clips of 10-30 s). Retakes are cheap, and concatenating is trivial.
- **Record picture without voice, then the VO separately** against the cut. That's far fewer takes for tired people.
- Move the mouse slowly and pause 1 s on each result. You can speed up dead time later.

### Voiceover tips
- **Write the VO script to the second**, at about 150 words per minute → **~270 words for 1:50**. That's two-thirds of what you think you can say. pitch.md's table script is too long for 2:00 as VO; trim it.
- **Mic:** a phone voice memo, or wired earbuds' mic, held 10-15 cm from the mouth, slightly off-axis to avoid pops.
- **Room:** a quiet small room with soft stuff (a closet or a car, or a hoodie over the head and phone). Hall noise ruins VO; Reitz has study rooms and stairwells.
- **Take discipline:** record each paragraph 2-3 times and keep the best. Leave 1 s of silence at the start for the noise floor.
- Normalize loudness with ffmpeg `loudnorm` at -14 LUFS integrated / -1.5 dBTP. -14 is the commonly used streaming target; YouTube doesn't publish one.
- **Music optional.** If used, keep it ~-20 dB under the voice and fade in and out. Music under fast talk hurts comprehension, so when in doubt, none.

### Editing options
- **ffmpeg** (scriptable, v6.1.1 on our server). Best for cut / concat / speed / captions / export. All commands below were test-run on 2026-10-16.
- **Shotcut** (free, open source, Win/Mac/Linux; https://shotcut.org/). It's a timeline editor: drag clips in, split with S, Export > preset "YouTube".
- **DaVinci Resolve** (free version; https://www.blackmagicdesign.com/products/davinciresolve). The most powerful option, and it has a Deliver page YouTube preset.
  - It's a multi-GB download, and the download form asks for name and email. It needs a decent GPU.
  - **Skip it for a 2-hour job unless someone already has it installed.**
- **macOS iMovie / Windows Clipchamp:** fine for trim + text titles if someone already knows them.

### Captions
- **Burned-in captions:** always visible, including when muted in the attract loop. Good for Devpost judges watching with no sound.
- **Soft captions:** a toggle in the player. YouTube auto-captions arrive after processing and need checking.
- **Plan:**
  1. Write the SRT from the VO script. We already have the exact text, so just time it.
  2. Or auto-transcribe locally with whisper.cpp:
     `ffmpeg -i vo.wav -ar 16000 -ac 1 -c:a pcm_s16le vo16.wav`
     then `whisper-cli -m models/ggml-base.en.bin -f vo16.wav -osrt`. The older builds call the binary `./main`. whisper.cpp needs 16 kHz mono 16-bit WAV ([dev.to](https://dev.to/mario_chavez/sound-to-script-using-openais-whisper-model-and-whispercpp-naf), [pyvideotrans](https://en.pyvideotrans.com/blog/whisper-cpp)).
     Hand-fix names: Tiger Data, NWS, Sperry.
  3. Burn in with the `subtitles` filter. Also upload the `.srt` to YouTube Studio > Subtitles.

### Music licensing (free, no account trouble)
- **Pixabay Music:** no attribution required, commercial use OK. Don't redistribute the track standalone, and watch out for trademark content ([Pixabay license summary](https://pixabay.com/service/license-summary/)).
  - Risk: third parties sometimes register Pixabay tracks in Content ID, which leads to claims ([musicgpt blog](https://musicgpt.com/blog/truly-safe-copyright-free-music/), snippet). Screenshot the track page plus the license at download.
  - A claim on an unlisted demo usually doesn't block playback, but it's a hassle.
- **YouTube Audio Library** (inside YouTube Studio, using the existing account): tracks are either "no attribution" or CC BY with the exact credit text given. Filter on "Attribution not required." The license is aimed at YouTube use, which is ours ([SocialPilot guide](https://www.socialpilot.co/youtube-marketing/youtube-audio-library), third-party).
- **CC0 / public domain:** Free Music Archive with the CC0 filter (https://freemusicarchive.org/), or incompetech (CC BY: credit "Kevin MacLeod (incompetech.com), CC BY 4.0" in the description).
- **Never:** commercial songs, even 5 seconds.

### Export settings (YouTube)
- YouTube recommends:
  - MP4, **H.264 High profile**, progressive, 4:2:0, CABAC, closed GOP of half the frame rate, VBR;
  - **moov atom at the front (fast start)**;
  - AAC-LC 48 kHz stereo at 384 kbps (mono 128);
  - 1080p SDR at ~8 Mbps for 24-30 fps or ~12 Mbps for 50-60 fps;
  - upload at the frame rate it was recorded at.
  ([YouTube recommended upload settings](https://support.google.com/youtube/answer/1722171))
- **For us:** 1920x1080, 30 fps, CRF 18 (quality-based; a 2-min screencast will land well under 8 Mbps average, which is fine because the bitrates are recommendations, not minimums).
- **Upload:**
  - Visibility **Unlisted** (or Public). Devpost needs it publicly viewable; unlisted works because anyone with the link can watch ([Devpost](https://help.devpost.com/article/85-uploading-a-demo-video); unlisted is common in hackathon guides, e.g. [RowdyHacks via search](https://acmutsa.notion.site/Submitting-Your-Project-to-Devpost-9e7014a39d5f481d8439f63f04a78300)).
  - **Not Private.**
  - Leave **"Allow embedding" on** (YouTube Studio > video > Show more), otherwise the embed won't play off-site ([embed checker note](https://www.embedvid.io/tools/youtube-embed-checker)).
  - Audience: "No, it's not made for kids." There are unconfirmed reports that Made-for-Kids can break embeds ([Shopify forum](https://community.shopify.com/t/embedded-youtube-thumbnail-not-showing-up/93605)).
- **Thumbnail:**
  - The YouTube custom thumbnail needs a **verified** account. Specs: 16:9, minimum 640 px wide, max 2 MB ([YouTube](https://support.google.com/youtube/answer/72431)). If it isn't verified, pick the best auto frame.
  - The Devpost gallery thumbnail is separate and matters more: **3:2, JPG/PNG/GIF, max 5 MB** ([Devpost](https://help.devpost.com/article/126-know-your-submission-steps)). Use the wow frame plus the project name; that card is what judges see in the gallery.

### ffmpeg cheat sheet (all run OK on ffmpeg 6.1.1, 2026-10-16)
```bash
# 0. Inspect a file (duration, codec, fps, size)
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact in.mov

# 1a. Trim fast, no re-encode (cuts land on keyframes, so can be off by ~1-2 s)
ffmpeg -ss 00:00:02 -to 00:00:08 -i in.mp4 -c copy cut.mp4
# 1b. Trim frame-accurate (re-encode). -ss before -i = fast seek; -t = duration
ffmpeg -ss 2 -i in.mov -t 6 -c:v libx264 -crf 18 -preset veryfast -pix_fmt yuv420p -r 30 -c:a aac -ar 48000 clip1.mp4
#     (-r 30 forces constant frame rate: macOS .mov recordings are variable-rate)

# 2. Concatenate clips (all must share codec/size/fps, e.g. all made with 1b)
printf "file 'clip1.mp4'\nfile 'clip2.mp4'\nfile 'clip3.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy joined.mp4

# 3. Speed up a boring stretch 2x (video + audio). atempo range is 0.5-100 per instance
ffmpeg -i slow.mp4 -filter_complex "[0:v]setpts=PTS/2[v];[0:a]atempo=2.0[a]" -map "[v]" -map "[a]" fast.mp4
#    (video only, drop audio: ffmpeg -i slow.mp4 -vf setpts=PTS/4 -an fast4x.mp4)

# 4. Fit any screen size (e.g. Mac 16:10) into 1920x1080 with black bars
ffmpeg -i joined.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:a copy fit.mp4

# 5. Replace the audio with the voiceover (ends at the shorter of the two)
ffmpeg -i fit.mp4 -i vo.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest withvo.mp4
#    (VO longer than the picture? Freeze the last frame: add -vf tpad=stop_mode=clone:stop_duration=5 and drop -c:v copy)

# 6. Add a quiet music bed under the VO, fade it in/out, normalize loudness
ffmpeg -i withvo.mp4 -i music.mp3 -filter_complex \
 "[1:a]volume=0.15,afade=t=in:d=1,afade=t=out:st=108:d=2[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 mixed.mp4
#    (set afade out st= to video length minus 2)

# 7a. Burn captions in (needs libass; this build has it)
ffmpeg -i mixed.mp4 -vf "subtitles=subs.srt:force_style='FontSize=24,Outline=2,MarginV=40'" -c:a copy burned.mp4
# 7b. Soft captions track instead (player toggle)
ffmpeg -i mixed.mp4 -i subs.srt -map 0 -map 1 -c copy -c:s mov_text -metadata:s:s:0 language=eng soft.mp4

# 8. Title card (3 s, fade in/out) to put at the front via concat
ffmpeg -f lavfi -i color=c=black:s=1920x1080:d=3 -f lavfi -i anullsrc=r=48000:cl=stereo -t 3 \
 -vf "drawtext=text='PlanIT Radar':fontcolor=white:fontsize=96:x=(w-text_w)/2:y=(h-text_h)/2,fade=t=in:d=0.5,fade=t=out:st=2.5:d=0.5" \
 -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -ar 48000 title.mp4
#    (the silent audio track keeps it concat-compatible with clips that have audio)

# 9. Final YouTube export (High profile, CFR 30, AAC 48k stereo 384k, faststart)
ffmpeg -i burned.mp4 -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p -r 30 -g 15 -bf 2 \
 -c:a aac -b:a 384k -ar 48000 -ac 2 -movflags +faststart final.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 final.mp4   # must be < 120

# 10. Thumbnails: grab a frame, then crop to Devpost 3:2 and YouTube 16:9
ffmpeg -ss 00:00:25 -i final.mp4 -frames:v 1 -q:v 2 frame.jpg
ffmpeg -i frame.jpg -vf "scale=1500:1000:force_original_aspect_ratio=increase,crop=1500:1000" thumb_devpost_3x2.jpg
ffmpeg -i frame.jpg -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" thumb_yt_16x9.jpg

# 11. GIF for the Devpost write-up / README (palette = no banding)
ffmpeg -ss 20 -t 4 -i final.mp4 -vf "fps=12,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" wow.gif

# 12. Seamless attract-loop clip for the second screen (no audio)
ffmpeg -ss 22 -i final.mp4 -t 15 -an -c:v libx264 -crf 20 -pix_fmt yuv420p loop.mp4
mpv --loop-file=inf --fs loop.mp4        # or VLC: Repeat One + fullscreen

# 13. Find dead air in the VO to cut (prints silence_start / silence_end times)
ffmpeg -i vo.wav -af silencedetect=noise=-35dB:d=0.7 -f null - 2>&1 | grep silence_

# 14. OBS MKV -> MP4 without re-encode (same as OBS File > Remux)
ffmpeg -i rec.mkv -c copy rec.mp4
```
**Gotchas found while testing:**
- With `-preset ultrafast`, x264 reports Main profile even when `-profile:v high` is asked for. Use `slow` or `medium` for the final.
- `-c copy` trims snap to keyframes. Use 1b for the real cuts.
- Concat with `-c copy` fails or glitches if clips differ in size, fps or audio presence. Make every clip with 1b plus the same `-r`/`-ar` (the title card in 8 includes silent audio for this reason).
- Our server has 1 CPU core, and a 1440p x264 encode crawled. Do the final export on a laptop, or at 1080p with `-preset medium`.

### The 2-hour schedule (Sat night, after feature freeze)
| Time | What | Who |
|---|---|---|
| 0:00-0:15 | Lock the VO script (~270 words) against the pitch.md outline. Mark the 5-6 shots. Seed demo data, reset the app, DND on, 1080p display | narrator writes, driver preps the screen |
| 0:15-0:45 | **Record picture:** one clip per shot, 2 takes each, no talking. Also the architecture diagram (a static PNG for 10 s is fine) and the eval table screenshot | driver |
| 0:15-0:45 (parallel) | **Record VO** in a quiet room, paragraph by paragraph, 2-3 takes. Pick the best and `loudnorm` it | narrator |
| 0:45-1:15 | **Rough cut with ffmpeg 1b + 2:** trim each clip to its VO paragraph length, speed up waits (3), fit to 1080 (4), lay the VO (5). Check the length (target 1:50) | driver |
| 1:15-1:30 | **Captions:** time the SRT from the script (or whisper.cpp), burn in (7a). Optional music bed (6). Title card (8) | narrator |
| 1:30-1:40 | **Export (9). Watch the full thing once with sound and once muted.** Fix only real errors | both |
| 1:40-1:50 | **Upload to YouTube unlisted** (embedding on, not for kids). Paste the URL into Devpost *now*, even if a v2 comes later | narrator |
| 1:50-2:00 | Thumbnails (10), the GIF (11), the loop clip (12) for the expo screen | driver |

- **Buffer:** this leaves Sun 2-5am for a v2 if the demo improves.
- **Replacing the video:** upload v2 as a **new** video and swap the URL in the Devpost submission before 8:00am. YouTube doesn't let you replace a file in place.
- **Never leave the Devpost video field empty.** Devpost's own note: make sure "you replaced your Rick Astley video before the deadline!" ([Devpost](https://help.devpost.com/article/126-know-your-submission-steps)).

---

## 3. Devpost submission checklist (mechanics)

From Devpost help ([enter](https://help.devpost.com/article/122-how-to-enter-a-submission), [steps](https://help.devpost.com/article/126-know-your-submission-steps), [edit](https://help.devpost.com/article/123-how-to-edit-a-submission), [teammates](https://help.devpost.com/article/121-teams-adding-teammates), [video](https://help.devpost.com/article/85-uploading-a-demo-video), [gallery](https://help.devpost.com/article/81-my-submission-disappeared)) and the [SwampHacks XII rules](https://swamphacks-xii.devpost.com/rules). Logging in, typing into forms and clicking Submit is Alex's call (rule: we never submit); this list is so nothing gets missed.

**Start early (Sat):** hackathon page sidebar → **Start project** creates an "Untitled" **Draft**. A Draft is **not** submitted until the final Submit step. Green checks mark the finished steps, and Submit errors out naming any missing steps.

1. **Manage team**
   - [ ] Leader adds @luanamaldaner by email or invite link. They must **accept**, and **must be registered for the hackathon on Devpost** (teammates need accounts to be tagged; [HackUTD guide](https://hackutd.notion.site/Devpost-Guide-7775720c1f0d4dbd9dd9d4127cb0a16d)).
   - [ ] XII rule: teams are 2-4, so a 1-member submission would break the rules. Check that both names show under "Created by."
   - [ ] One project per team; one of us submits.
2. **Project overview**
   - [ ] Name, plus a tagline: the one-liner from pitch.md.
   - [ ] **Thumbnail:** JPG/PNG/GIF, **≤ 5 MB, 3:2 ratio** (e.g. 1500x1000). It's the gallery card, so use the wow frame plus the name.
3. **Project details**
   - [ ] Story: the template headings (pitch.md skeleton), in Markdown/LaTeX. Bold the numbers; add a code-block pipeline diagram.
   - [ ] **Built with tags, max 25.** Tag **every sponsor tool by its exact name** (Devpost: "Tag the sponsor's tool") plus languages, frameworks, APIs and hosting. The same list goes in the story, since XII requires crediting libraries and APIs.
   - [ ] "Try it out" links: the live URL **and** the GitHub repo.
   - [ ] **Image gallery:** 6+ captioned screenshots (teardowns.md). Devpost publishes no gallery size spec beyond the 3:2 thumbnail, so use 16:9 or 3:2 PNGs at ≥1280 px wide, each under 5 MB to be safe. Put text-heavy shots (the eval table) as images *and* in the text.
   - [ ] **Video demo link:** a YouTube/Vimeo/Youku URL, otherwise you get the error "Must be a valid YouTube, Vimeo, or Youku url." Public or unlisted, **≤ 2:00** (XII). Open the project's **View** page in a logged-out/incognito window and confirm it plays embedded.
4. **Additional details** (event-specific form; XI asked these)
   - [ ] **Track:** General is automatic; opt into **at most ONE** specialized track.
   - [ ] **Challenges / prizes:** tick **every** sponsor and MLH challenge we actually meet. Each has its own requirements: read each one, e.g. MLH prizes often need the tool used in a specific way, or a domain registered. "Mark which track and challenge(s)" is required for eligibility.
   - [ ] **Repo URL:** **public** GitHub. Check it in incognito. README has run steps; no secrets in history; a license if asked.
   - [ ] **AI/LLM tool disclosure:** required by XII ("must be disclosed"). I decide the wording (strategy.md).
   - [ ] Any file upload: ≤ 35 MB, zip/pdf/word/apk.
5. **Submit**
   - [ ] Agree to the terms → **Submit project**. Then confirm: a green bar appears, and **My projects** shows a green "Submitted" tag.
   - [ ] Aim for ~6:00am (strategy.md), with buffer before 8:00am.
6. **After submit, before 8:00am**
   - [ ] Edits are allowed ("as many times as you want") until the deadline via **Manage projects / Edit project**. After the deadline, edits only change the portfolio page, **not** the judged submission. That includes the video: "After the deadline, you can't change a submission's video."
   - [ ] If the gallery is already published, **any edit unpublishes it until a manager re-reviews**. Make the final edits early, then stop.
   - [ ] Proofread with **View** (formatting, links, video plays, both teammates listed, track + challenges correct).
   - [ ] Check Submission history (project nav) to confirm which video is attached to the submission, since the project page video and the submission video can differ.
7. **Expo eligibility** (XII): we must also *present at the expo*, and at least one of us must be at closing (strategy.md).

---

## Sources I could not open directly
JetBrains, Science Buddies and several booth/fair pages blocked fetches (403 / captcha). Where a claim is marked "snippet", it comes from the search-result summary, not the page body. Treat those as directional. All Devpost help, MLH judging plan, YouTube settings/thumbnail/length, Pixabay license and XII rules claims were read from the full pages.
