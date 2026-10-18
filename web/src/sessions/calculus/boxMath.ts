// Calc 1, maximums and minimums (Optimize.tsx draws it).
//
// A box folded from a 12 × 12 sheet: cut a square of side x out of each corner and fold the
// sides up. Volume V(x) = x(12 − 2x)², for 0 ≤ x ≤ 6.
// V'(x) = (12 − 2x)² − 4x(12 − 2x) = (12 − 2x)(12 − 6x): zero at x = 2 (the max, V = 128) and
// at x = 6 (the sides are gone, V = 0: a minimum).

export const SHEET = 12
export const X_MAX = SHEET / 2

export const V = (x: number) => x * (SHEET - 2 * x) ** 2
export const Vp = (x: number) => (SHEET - 2 * x) * (SHEET - 6 * x)

export const BEST = 2
export const V_BEST = V(BEST)
/** Where the slope is 0. */
export const FLAT_X = [2, 6] as const

/** The three cuts offered as a first guess. */
export const CUTS = [1, 2, 3] as const
/** Near enough to the top: the slope is small and the box is nearly full size. */
export const atBest = (x: number) => Math.abs(x - BEST) <= 0.15

export type BoxMistake = 'flat-means-max'
export const BOX_LABELS: Record<BoxMistake, string> = { 'flat-means-max': 'Slope 0 means a maximum' }
