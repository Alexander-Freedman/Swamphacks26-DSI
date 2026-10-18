// Calc 2, does it add up? (Series.tsx draws it).
//
// Two series whose terms both shrink to nothing:
//   geometric  1 + 1/2 + 1/4 + 1/8 + …   the stack levels off at 2
//   harmonic   1 + 1/2 + 1/3 + 1/4 + …   the stack keeps climbing, slower and slower, past any height
// Terms → 0 is necessary for a series to add up, but it isn't enough.

export type SeriesId = 'geometric' | 'harmonic'

export type Series = { id: SeriesId; name: string; text: string; term: (k: number) => number; limit: number | null }

export const SERIES: Record<SeriesId, Series> = {
  geometric: { id: 'geometric', name: 'halving', text: '1 + ½ + ¼ + ⅛ + …', term: (k) => Math.pow(0.5, k - 1), limit: 2 },
  harmonic: { id: 'harmonic', name: 'harmonic', text: '1 + ½ + ⅓ + ¼ + …', term: (k) => 1 / k, limit: null },
}

/** How many terms the slider can stack. */
export const MAX_TERMS = 60

/** The k-th term, k = 1, 2, 3, … */
export const term = (s: SeriesId, k: number) => SERIES[s].term(k)

/** The running totals S_1 … S_n. */
export function partialSums(s: SeriesId, n: number): number[] {
  const out: number[] = []
  let t = 0
  for (let k = 1; k <= n; k++) {
    t += term(s, k)
    out.push(t)
  }
  return out
}

export const partialSum = (s: SeriesId, n: number) => partialSums(s, n)[n - 1]

/** The harmonic total after n terms, for the "it keeps going" readout (exact loop up to a million). */
export function harmonic(n: number): number {
  let t = 0
  for (let k = 1; k <= n; k++) t += 1 / k
  return t
}

/**
 * The classic argument that the harmonic stack never stops: group the terms as
 * (1/2), (1/3 + 1/4), (1/5 + … + 1/8), (1/9 + … + 1/16), … Each group adds more than 1/2.
 * Returns [first, last] term indices of each group that fits in n terms, starting with the single term 2.
 */
export function groups(n: number): [number, number][] {
  const out: [number, number][] = []
  for (let hi = 2; hi / 2 < n; hi *= 2) out.push([hi / 2 + 1, Math.min(n, hi)])
  return out
}

export const groupSum = (s: SeriesId, [a, b]: [number, number]) => {
  let t = 0
  for (let k = a; k <= b; k++) t += term(s, k)
  return t
}

export type SeriesMistake = 'terms-shrink-so-it-converges'
export const SERIES_LABELS: Record<SeriesMistake, string> = { 'terms-shrink-so-it-converges': 'Terms shrink, so it adds up' }
