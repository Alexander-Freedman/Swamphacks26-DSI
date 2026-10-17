# Expo table: card, attract loop, setup, hallway pitch

For the Sun 10 AM-12 PM expo, where judges walk the tables. Builds on docs/expo-video.md (table craft research), docs/demo-script.md (the 3:00 at the table) and docs/pitch.md (the words). Where they differ, demo-script.md wins for what's on screen. Numbers here come only from the demo-script.md table.

**Goal:** someone walking past gets the visual idea in about 10 seconds (guess in pencil, truth in ink) and tries it, either on our laptop or on their own phone from the QR.

---

## 1. Table tent card

Printable: [docs/expo/table-card.html](expo/table-card.html) (preview: [table-card.png](expo/table-card.png)). Letter, portrait, two 8.5 x 5.5 in panels. The top panel is printed upside down on purpose, so after folding on the dashed line both sides read the right way up.

**Print settings:** 100% scale (not "fit to page"), margins none, background graphics on. Card stock if the print shop has it. Then test the QR with two phones under the hall lights.

**QR:** points at `https://alexander-freedman.github.io/Swamphacks26-DSI/?session=birthday`, so a scan lands straight on the birthday guess screen. It's an inline SVG (navy on white, error correction M). Rebuild it with `uv run --with qrcode python docs/expo/make-qr.py [url]`; that swaps both QR blocks in the card. When onionskin.study stops being parked and points at the app, I'll rerun it with that URL. I checked that the current one decodes to the URL above (OpenCV QR detector on the rendered PNG).

### Front
- **Onionskin**
- *See your thinking in layers.*
- Hook (passer-by answers it in their head): **"How many people do you need in a room for a 50% chance that two share a birthday?"** with a blank pencil line: "your guess, in pencil. Now scan and see the truth in ink."
- QR + "scan · lock your guess" + the short URL.

The answer (23 → 50.7%) is not on the card on purpose. The app gives it after they've locked a guess, which is the whole point.

### Back
- **What it is** · short visual sessions, 2-3 min each (2-3 min is a design target, not measured yet)
  1. *pencil* **Guess first.** Lock in your number and draw how you think it goes. No changing it.
  2. *ink* **Watch reality play out over your guess.** Fill the room, flip the coins, test the town. Your pencil stays on screen.
  3. *the gap* **See where your model broke.** The gap is shaded and your exact wrong idea gets a name, using your own number.
- **Three sessions:** Birthday room · Coin streak · Positive test
- Alex Freedman · Luana Maldaner · SwampHacks XII · Entertainment & Creative Technology · table # ____ (write it in once we get the number)

**Before printing:** if coin streak or positive test isn't live on the deployed site Sunday morning, delete its chip (and the "flip the coins, test the town" words) from the HTML. The card never promises a session we can't show (pitch.md "Say only what's live").

---

## 2. Attract loop (unattended second screen)

The second screen runs a muted 10-20 s loop that pulls people in, and becomes demo station 2 when two judges show up (expo-video.md).

**Which moment loops:** the birthday room filling up, then the ink curve drawing over a pencil curve. It's the most visual 15 seconds we have and needs no explanation:
1. (0-2 s) A pencil tick lands on the guess slider, labelled "a guess" (a made-up example, not a real person's).
2. (2-10 s) B2: people drop onto the 365-day strip, pair lines web up, counter climbs to **23 · 253**, a match circles in marker and the room shakes.
3. (10-16 s) B5: a dashed pencil curve is already on the axes; the ink S-curve draws in over it and the gap shades yellow. Readout **23 people → 50.7%**.
4. (16-18 s) Caption card: "Guess in pencil. See the truth in ink. Tap to try." Then back to 1.

Caption bar the whole time (no sound, the hall is loud): "How many people for a 50% chance two share a birthday?"

**Proposal for my teammate (not built; a suggestion, your call on how):**
- **`?session=birthday&loop=1` kiosk mode.** Plays the sequence above with the seeded room (first match already lands at 23 in `Room.tsx`) and a fixed example pencil curve, then restarts. Hides chrome, no network calls, nothing written to the notebook or to answer events (so it doesn't pollute "how the room guessed").
- **Any tap or key exits the loop** into a fresh B1 guess screen, so a passer-by who touches it is playing for real. After 60 s idle on any screen it goes back to the loop.
- Reduced motion: shows the end states as a slow crossfade instead.
- **Run it** with Chrome kiosk: `google-chrome --kiosk --app='https://alexander-freedman.github.io/Swamphacks26-DSI/?session=birthday&loop=1'` (or the local `vite preview` URL if the wifi is bad).
- **If `?loop=1` doesn't get built:** cut the same 15 s out of the backup video and loop it with `mpv --loop-file=inf --fs --no-audio clip.mp4` (ffmpeg steps in expo-video.md §2). Then the screen is a video, not a demo station, so we tap out to a normal tab when a second judge comes.

---

## 3. Table setup checklist

**Bring (Sat night, in one bag):**
- [ ] Main laptop + charger
- [ ] Second screen for the loop: second laptop, or a tablet/phone on a stand (charger for it too)
- [ ] One phone with the birthday session open, for a judge who'd rather draw with a finger
- [ ] Power strip + extension cord, tape to hide it under the table
- [ ] Hotspot phone, charged, with a charging cable
- [ ] Printed tent card (plus one spare), a marker for the table number
- [ ] Index card with the 5 beats taped beside the trackpad (expo-video.md)
- [ ] Something to raise the main laptop (closed backpack or a box)

**At the table (as soon as table numbers drop):**
- [ ] Table number written on the card; card at the aisle edge facing out
- [ ] Main laptop raised, angled about 45° toward the aisle; 100% brightness, auto-brightness / Night Shift / True Tone off, Do Not Disturb on, sleep off (`caffeinate -dimsu &` on a Mac), one browser window with demo tabs only, zoom 125-150%
- [ ] Loop screen running, muted
- [ ] Charger plugged in on every device, cables out of sight
- [ ] Join venue wifi; check the site loads on venue wifi **and** on the hotspot

**Cache pre-warm (10 min before doors):**
- [ ] On every device: open `?session=birthday`, play it once to the end, so the fonts, JS and images are cached. Same for coin streak and positive test if they're live.
- [ ] Open one reviewed "try any topic" chip once (demo-script.md: never a fresh generation at the table).
- [ ] Start a local `vite preview` build on the main laptop and keep it open in a background tab. The sessions compute everything in the browser, so this works with no network.
- [ ] Scan the printed QR with two different phones under the hall lights.

**Reset between visitors (under 10 s):**
- [ ] `Shift+R` on Home or open `?reset=1` (clears this browser's answers and notebook; on PR #130, check it's merged and deployed). Until it ships: a fresh private window per judge.
- [ ] Back to the birthday guess screen, slider at its start position.
- [ ] Loop screen back in loop mode (or the video restarted).
- [ ] Wipe the phone's session too if a visitor used it.

**Offline fallback:**
- Venue wifi dies → hotspot. Hotspot dies too → the local `vite preview` tab.
- Laptop dies → the **backup video**, downloaded to the phone, not streamed (docs/video-script.md). Say: "Here's the 2-minute cut." Also keep a copy on the main laptop's disk.
- A session isn't live → the interactive mockup in `docs/mockups/`, and we say it's the prototype. Never pass a mockup off as the app.

---

## 4. 20-second hallway pitch

For someone slowing down at the table, not a judge with a clipboard (that's the 1:30 or 3:00 in pitch.md). About 55 words:

> "Quick one: how many people in a room before it's a coin flip that two share a birthday? Got a number? Lock it in on here. Now watch the room fill up. Your guess stays in pencil, reality draws over it in ink, and it names exactly where your thinking went wrong. That's Onionskin. Want to try one?"

Then hand them the trackpad or point at the QR, and stop talking. If they answer out loud, don't tell them if they're right; let the reveal do it.
