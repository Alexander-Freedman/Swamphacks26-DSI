# Friday night checklist (before we commit to an idea)

Hacking opens Friday evening and Devpost closes **Sun 8:00am**. All of this is talking and signing up, no code. It goes in this order.

## 1. Talk to people (first hour)
- **Sperry Tech table** (if we're considering the hazard radar):
  - Is GOES satellite lightning OK in place of a paid strike feed?
  - Is 50 plants a hard minimum?
  - For the hazard index labels, OSHA severe injuries or storm events near the site?
  - What would make them want to hire the team?
  - Watch their reaction to the one-liner.
- **Hardware desk:**
  - Temp/humidity sensor? Temperature probe?
  - ESP32 or Pi? A load cell?
  - How long can we keep them?
  - This decides Heat Badge and Bridge Oracle.
- **Capital One table** (only if the finance idea is alive): are you judging in person? $250/member or $1,000? (The Nessie key is self-serve via GitHub login on nessieisreal.com.)
- **MLH table:**
  - Domain prize code.
  - Vultr credit code.
  - Which MLH prizes are judged by MLH vs the event.

## 2. Accounts (one of us, ~20 min)
Only for the direction we pick:
- **Hazard radar:** Tiger Data (Tiger Cloud) free tier, Auth0, Vultr (MLH credits), GoDaddy domain via the MLH code, Gemini API key.
- **Mental Models:** Gemini API key, the domain, Auth0 if there are accounts. DeepSpace too, if we go for the live-classroom version.
- **Both:** a hosting account, plus a YouTube account for the unlisted video.

## 3. Decide (hard stop ~1.5h after opening)
- Fill in docs/scorecard.md with what the reps and the hardware desk said.
- Pick one. Write the one-liner at the top of TASKS.md.
- Open the build issues from docs/build-plans.md and split the halves.

## 4. Before the first line of code
- Agree the API contract (docs/build-plans.md).
- Pick the narrator and the driver for judging.
- Set alarms:
  - H6: deployed URL.
  - H12: "can we demo now?".
  - ~H28: feature freeze.
  - Sun 6:00am: submit.
