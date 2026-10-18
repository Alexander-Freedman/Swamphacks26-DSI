// Screen copy for an Offline result, with a friendly line for the rate limit (429).
import type { Offline } from './types'
import { offlineText } from './useGraded'

export const BUSY_LINE = 'Lots of questions right now; try again in a minute, or keep going with the offline check'

export const isRateLimited = (o: Offline) => /\b429\b|rate.?limit|too many/i.test(o.detail ?? '')

export const offlineLine = (o: Offline) => (isRateLimited(o) ? BUSY_LINE : offlineText(o))
