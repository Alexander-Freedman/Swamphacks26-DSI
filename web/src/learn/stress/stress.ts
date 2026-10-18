// Stress test helpers: kept out of the screen file so it only exports components.
import type { Offline, StressHistoryItem } from '../types'
import { offlineText } from '../useGraded'

/** The latest verdict per case: a retry after a break replaces it. */
export function latestByCase(history: StressHistoryItem[]) {
  const out = new Map<number, StressHistoryItem>()
  for (const h of history) out.set(h.caseIndex, h)
  return out
}

/** A 429 from the graded endpoints ("slow down…" / "daily limit reached…") gets a friendly line, not "can't reach the server". */
export const isRateLimited = (o: Offline) => /slow down|limit reached|HTTP 429/i.test(o.detail ?? '')

export const offlineLine = (o: Offline) =>
  isRateLimited(o) ? 'Lots of people are trying this right now. Give it a minute, then test again.' : offlineText(o)

/** Append a piece to the rule as one more clause. */
export const withPiece = (rule: string, piece: string) => {
  const base = rule.trim().replace(/[.\s;]+$/, '')
  return base ? `${base}; and ${piece}` : piece
}
