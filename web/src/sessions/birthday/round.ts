import { showcaseRound } from '../../rounds'
import type { Item, Misconception, Round } from '../../types'
import { misconceptionFor, verdictFor, type Verdict } from '../../verdict'
import { pairs, pct, pMatch, sizeForChance } from './math'

export const R = showcaseRound('birthday') as Round
export const ITEM = R.items[0] as Item
export const TRUTH_N = sizeForChance(0.5)

/** Below this, the room is too small to reach a coin flip by a wide margin (15 people: 25.3%). */
export const TOO_FEW = sizeForChance(0.25) - 1

/** The round's low band (2-30) counts every small guess as right; a room of 2-14 is well under 50%, so it gets its own card. */
function tooFew(guess: number): Misconception {
  return {
    id: 'too-few',
    label: 'A handful of people is enough',
    why_tempting: "Once you've heard the answer is surprisingly small, it's easy to overshoot the other way.",
    refutation: `${guess} people make only ${pairs(guess)} ${pairs(guess) === 1 ? 'pair' : 'pairs'}: a ${pct(pMatch(guess))} chance. It takes ${TRUTH_N} people (${pairs(TRUTH_N)} pairs) to pass 50%.`,
    source_url: null,
    source_note: 'exact formula, computed in code',
  }
}

export function verdictOf(guess: number): { v: Verdict; m: Misconception | null } {
  if (guess <= TOO_FEW) return { v: 'close', m: tooFew(guess) }
  const a = { value: guess, optionId: null, confidence: 'pretty sure' as const }
  const v = verdictFor(ITEM, a, TRUTH_N)
  const mid = misconceptionFor(ITEM, a)
  const m = R.misconceptions.find((x) => x.id === mid) ?? null
  return { v, m }
}
