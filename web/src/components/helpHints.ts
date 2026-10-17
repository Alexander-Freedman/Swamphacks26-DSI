// The Ask panel's offline side (#186): the static per-screen hints (same text as `hint` in
// api/app/help_context.py, the cut line) and starter questions. Shown when help can't answer.

/** Which sessions/rounds the help API knows, and the screen to use when the step is unknown. */
export const HELP_TOPICS: Record<string, { prefix: string; guessScreen: string }> = {
  birthday: { prefix: 'B', guessScreen: 'B1' },
  'coin-streak': { prefix: 'C', guessScreen: 'C3' },
  'positive-test': { prefix: 'P', guessScreen: 'P1' },
}

/** Round player: the screen behind each showcase item's question. */
export const ITEM_SCREENS: Record<string, string> = {
  'people-for-half': 'B1',
  'longest-run-100': 'C3',
  'which-is-real': 'C7',
  'chance-given-positive': 'P1',
}

export const HINTS: Record<string, string> = {
  B1: 'Think about pairs, not people: every new person can match everyone already in the room. Set the slider to your honest guess; the next screens show you.',
  B2: 'Tap ‘Add a person’ a few times and watch the pairs counter: it grows much faster than the people count.',
  B3: 'Empty the room and fill it again 3 or 4 times, then look where the dots bunch up compared with your tick.',
  B4: 'Draw what you believe; no need to be right. Ask yourself: does adding the 20th person add the same as adding the 2nd?',
  B5: 'Drag the group size to 23 and then to 57 and watch the dot and the pairs counter.',
  B6: 'Read the card: the trap is thinking about your own birthday. The room counts every pair.',
  B7: 'Count the pairs in a class of 30 and compare with the room you filled earlier.',
  C1: "Just tap out 20 flips the way a fair coin feels to you; there's no wrong row here.",
  C2: "Press ‘Flip again’ 3 or 4 times and compare the underlined runs: which row has the longer ones?",
  C3: 'Remember the real rows: they had longer runs than yours. Now picture 5 times as many flips and set the slider.',
  C4: 'Find the tallest bars and compare them with your tick; tap a bar to see a real row of 100 flips with its run highlighted.',
  C5: 'Drag the flips slider from 100 to 200 to 400 and watch the dot: each doubling adds only about one to the longest run.',
  C6: 'Read the card: real randomness clumps. Evenly mixed rows are what people make up.',
  C7: 'Look at the longest run in each row. Which one looks like the real rows you flipped earlier?',
  P1: 'Picture 1,000 people: how many are sick, and how many healthy people would the test wrongly flag? Set the slider to your gut answer.',
  P2: 'Tap ‘Test everyone’ and count how many lit dots are ink (sick) and how many are grey (healthy).',
  P3: "Tap a handful of dots in the pile; most say ‘false alarm’. Compare the ink share with your guess.",
  P4: "Drag ‘how common’ from 1% up to 20% and watch the curve climb away from your flat line.",
  P5: "Read the card: the test's accuracy is not your chance. How rare the condition is matters most.",
  P6: 'Picture 1,000 people again: 20 sick, 980 healthy. Count the true positives and the false alarms before you slide.',
}

const GUESS_SCREENS = new Set(['B1', 'B4', 'B7', 'C3', 'C7', 'P1', 'P6'])
const CARD_SCREENS = new Set(['B6', 'C6', 'P5'])

/** Two or three starter questions for the screen (unknown screen: the general ones). */
export function startersFor(screen: string | undefined, locked: boolean): string[] {
  if (screen && CARD_SCREENS.has(screen)) return ['Can you explain the mistake?', 'Why is it so tempting?', 'How do I spot it next time?']
  if (screen && GUESS_SCREENS.has(screen) && !locked) return ['What am I looking at?', 'Where do I even start?', "What's the answer?"]
  if (locked) return ['What am I looking at?', 'Why does this happen?', 'Why was my guess off?']
  return ['What am I looking at?', 'Why does this happen?']
}

export const GENERAL_HINT = 'Follow the line under the title: it says what to drag, tap or watch on this screen.'

/** The static hint for a screen, or a general one when the step is unknown. */
export function hintFor(screen: string | undefined): string {
  return (screen && HINTS[screen]) || GENERAL_HINT
}
