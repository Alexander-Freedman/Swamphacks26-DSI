// Calc 1, what a limit is (Limit.tsx draws it).
//
// Two curves, both approached at x = A = 2 from either side under a zoom lens.
// The hole: h(x) = (x² − 4)/(x − 2) = x + 2 everywhere except x = 2, where it isn't defined.
// Both sides head for 4, so the limit is 4 even though there's nothing at the point.
// The jump: j(x) = x + 2 left of 2, x + 3 from 2 on. The sides disagree (4 and 5), so no limit.

export const A = 2

export type Curve = 'hole' | 'jump'

export const hole = (x: number) => (x === A ? NaN : (x * x - 4) / (x - A))
export const jump = (x: number) => (x < A ? x + 2 : x + 3)
export const curve = (c: Curve) => (c === 'hole' ? hole : jump)

/** The height the curve heads for from each side. null = the two sides disagree. */
export const LEFT: Record<Curve, number> = { hole: 4, jump: 4 }
export const RIGHT: Record<Curve, number> = { hole: 4, jump: 5 }
export const limitOf = (c: Curve): number | null => (LEFT[c] === RIGHT[c] ? LEFT[c] : null)
/** What's actually drawn at the point: the hole has nothing, the jump has a dot at 5. */
export const valueAt = (c: Curve): number | null => (c === 'hole' ? null : jump(A))

/** The zoom slider 0..100 → half-width of the window around x = A, from 2 down to 0.002. */
export const zoomToWidth = (z: number) => 2 * 10 ** (-3 * (z / 100))

/** Where the two walkers stand at a zoom: a little inside each edge of the window. */
export const walkers = (c: Curve, z: number) => {
  const w = zoomToWidth(z)
  const f = curve(c)
  const l = A - 0.7 * w
  const r = A + 0.7 * w
  return { l, r, yl: f(l), yr: f(r), w }
}

export type LimitMistake = 'limit-needs-the-point' | 'limit-is-the-value'
export const LIMIT_LABELS: Record<LimitMistake, string> = {
  'limit-needs-the-point': 'A hole means no limit',
  'limit-is-the-value': 'Limit = the value at the point',
}
