import { showcaseRound } from '../../rounds'
import type { Item, Round } from '../../types'
import { misconceptionFor, verdictFor } from '../../verdict'
import { sizeForChance } from './math'

export const R = showcaseRound('birthday') as Round
export const ITEM = R.items[0] as Item
export const TRUTH_N = sizeForChance(0.5)

export function verdictOf(guess: number) {
  const a = { value: guess, optionId: null, confidence: 'pretty sure' as const }
  const v = verdictFor(ITEM, a, TRUTH_N)
  const mid = misconceptionFor(ITEM, a)
  const m = R.misconceptions.find((x) => x.id === mid) ?? null
  return { v, m }
}

