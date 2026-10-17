import { showcaseRound } from '../../rounds'
import type { Item, Misconception, Round } from '../../types'
import { misconceptionFor, type Verdict } from '../../verdict'
import { pMatch, sizeForChance } from './math'

export const R = showcaseRound('birthday') as Round
export const ITEM = R.items[0] as Item
export const TRUTH_N = sizeForChance(0.5)

/**
 * The generic slider rule (within 15% of the 2-366 span) calls a guess of 2 "close".
 * Here close means the real chance at the guess is somewhere between 10% and 99% (10-57 people).
 */
const isClose = (guess: number) => pMatch(guess) >= 0.1 && pMatch(guess) < 0.99

export function verdictOf(guess: number): { v: Verdict; m: Misconception | null } {
  const mid = misconceptionFor(ITEM, { value: guess, optionId: null, confidence: 'pretty sure' })
  const m = R.misconceptions.find((x) => x.id === mid) ?? null
  const v: Verdict = mid === null ? 'called' : isClose(guess) ? 'close' : 'off'
  return { v, m }
}
