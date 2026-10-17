import type { Verdict } from '../../verdict'

// One verdict rule for the session shell (#151).
// "Close" needs the guess near the truth in points AND in proportion: within `window`
// points and within a factor of 2. At the low end a 15-point window alone would call
// 0% "close" to 9.2%, right next to a named mistake.
export function isClose(guess: number, truth: number, window: number): boolean {
  return Math.abs(guess - truth) <= window && guess >= truth / 2 && guess <= truth * 2
}

/**
 * The stamp for a first guess. "Called it" exactly when the guess names no mistake,
 * so the stamp and the card never disagree; otherwise close or way off by `isClose`.
 */
export function shellVerdict(misconception: string | null, guess: number, truth: number, window: number): Verdict {
  if (misconception === null) return 'called'
  return isClose(guess, truth, window) ? 'close' : 'off'
}

/** The stamp for a rematch with no bands: called within `called` points, else the same close rule. */
export function rematchVerdict(guess: number, truth: number, called: number, window: number): Verdict {
  if (Math.abs(guess - truth) <= called) return 'called'
  return isClose(guess, truth, window) ? 'close' : 'off'
}
