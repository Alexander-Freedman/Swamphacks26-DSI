// Draw it helpers: kept out of the screen file so it only exports components.
import type { Offline } from '../types'
import { offlineText } from '../useGraded'

/** A 429 from the graded endpoints ("slow down…" / "daily limit reached…") gets a friendly line, not "can't reach the server". */
export const isRateLimited = (o: Offline) => /slow down|limit reached|HTTP 429/i.test(o.detail ?? '')

export const offlineLine = (o: Offline) =>
  isRateLimited(o) ? 'Lots of people are trying this right now. Give it a minute, then check again.' : offlineText(o)
