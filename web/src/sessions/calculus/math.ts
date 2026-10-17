// Calculus level: every number on screen is computed here, in closed form where one exists.
//
// The curve: f(x) = (x³ − 6x² + 9x)/2 + 1 on [0, 4]. A hill at x = 1, a valley at x = 3.
// Its slope:  f'(x) = 1.5(x − 1)(x − 3), zero at 1 and 3, most negative (−1.5) at x = 2.
// Its area:   F(x) = x⁴/8 − x³ + 9x²/4 + x, so the area under f on [a, b] is F(b) − F(a).

export const X0 = 0
export const X1 = 4

export const f = (x: number) => (x ** 3 - 6 * x ** 2 + 9 * x) / 2 + 1
export const fPrime = (x: number) => 1.5 * (x - 1) * (x - 3)
export const F = (x: number) => x ** 4 / 8 - x ** 3 + (9 * x ** 2) / 4 + x

/** Where the slope is 0 (top of the hill, bottom of the valley) and where it's most negative. */
export const FLAT = [1, 3] as const
export const STEEPEST_DOWN = { x: 2, slope: fPrime(2) }

/** The area step: under f from A to B. */
export const A = 1
export const B = 3.5
export const exactArea = (a = A, b = B) => F(b) - F(a)

export type Rule = 'left' | 'mid'

/** Riemann sum of f on [a, b] with n equal rectangles, height from the left edge or the midpoint. */
export function riemann(n: number, rule: Rule, a = A, b = B, g: (x: number) => number = f): number {
  const w = (b - a) / n
  let s = 0
  for (let i = 0; i < n; i++) s += g(a + (i + (rule === 'mid' ? 0.5 : 0)) * w)
  return s * w
}

/** The rectangles themselves: [left x, width, height]. */
export function rects(n: number, rule: Rule, a = A, b = B): [number, number, number][] {
  const w = (b - a) / n
  return Array.from({ length: n }, (_, i) => [a + i * w, w, f(a + (i + (rule === 'mid' ? 0.5 : 0)) * w)])
}

/** Slider position 0..100 → rectangles 1..200, spaced so the small counts get room. */
export const sliderToN = (p: number) => Math.max(1, Math.min(200, Math.round(200 ** (p / 100))))
export const nToSlider = (n: number) => Math.round((Math.log(n) / Math.log(200)) * 100)

/* ---------- the sketch ---------- */

export type Pt = { x: number; y: number }
export const SAMPLES = 41
export const xs = Array.from({ length: SAMPLES }, (_, i) => X0 + ((X1 - X0) * i) / (SAMPLES - 1))

/** How much of [X0, X1] the stroke covers, 0..1. */
export function coverage(pts: Pt[]): number {
  if (pts.length < 2) return 0
  let lo = Infinity
  let hi = -Infinity
  for (const p of pts) {
    lo = Math.min(lo, p.x)
    hi = Math.max(hi, p.x)
  }
  return Math.max(0, Math.min(X1, hi) - Math.max(X0, lo)) / (X1 - X0)
}

/**
 * A freehand stroke → one value per sample x. Points are sorted by x and interpolated;
 * outside the drawn range the nearest end value is held. Null for an empty stroke.
 */
export function resample(pts: Pt[]): number[] | null {
  if (!pts.length) return null
  const s = [...pts].sort((p, q) => p.x - q.x)
  return xs.map((x) => {
    if (x <= s[0].x) return s[0].y
    if (x >= s[s.length - 1].x) return s[s.length - 1].y
    let i = 1
    while (s[i].x < x) i++
    const p = s[i - 1]
    const q = s[i]
    const t = q.x === p.x ? 0 : (x - p.x) / (q.x - p.x)
    return p.y + t * (q.y - p.y)
  })
}

function corr(a: number[], b: number[]): number {
  const n = a.length
  const ma = a.reduce((s, v) => s + v, 0) / n
  const mb = b.reduce((s, v) => s + v, 0) / n
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da += (a[i] - ma) ** 2
    db += (b[i] - mb) ** 2
  }
  return da < 1e-9 || db < 1e-9 ? 0 : num / Math.sqrt(da * db)
}

export const slopeTruth = xs.map(fPrime)
export const heightTruth = xs.map(f)

export type SlopeMistake = 'slope-is-height' | 'slope-never-negative' | 'slope-sign-flipped' | 'slope-misses-the-turns'

export type SlopeRead = { mistake: SlopeMistake | null; matchSlope: number; matchHeight: number }

/**
 * Reads a slope sketch by shape (correlation), not by exact height, so a sketch that rises and
 * falls in the right places counts even if it's drawn a bit tall or short.
 */
export function readSketch(sketch: number[]): SlopeRead {
  const matchSlope = corr(sketch, slopeTruth)
  const matchHeight = corr(sketch, heightTruth)
  const r = (mistake: SlopeMistake | null): SlopeRead => ({ mistake, matchSlope, matchHeight })
  // the downhill stretch between the hill and the valley has to go below 0
  const mid = sketch.filter((_, i) => xs[i] >= 1.3 && xs[i] <= 2.7)
  const dips = mid.reduce((s, v) => s + v, 0) / mid.length < 0
  if (matchSlope >= 0.7 && dips) return r(null)
  if (matchHeight >= 0.6 && matchHeight > matchSlope) return r('slope-is-height')
  if (matchSlope <= -0.6) return r('slope-sign-flipped')
  if (!dips) return r('slope-never-negative')
  return r('slope-misses-the-turns')
}

/* ---------- the area guess ---------- */

export const GUESS_MAX = 10
export const ONE_RECT = riemann(1, 'left')

export type AreaMistake = 'more-rectangles-more-area'
export type AreaRead = { mistake: AreaMistake | null; close: boolean; gap: number }

/** Within 15% of the exact area is close. At or above the one-rectangle sum means "adding rectangles adds area". */
export function readArea(guess: number): AreaRead {
  const exact = exactArea()
  const gap = guess - exact
  const close = Math.abs(gap) <= 0.15 * exact
  const mistake = !close && guess >= ONE_RECT - 0.25 ? 'more-rectangles-more-area' : null
  return { mistake, close, gap }
}

export const LABELS: Record<SlopeMistake | AreaMistake, string> = {
  'slope-is-height': 'Slope = height of the curve',
  'slope-never-negative': 'Slope is never negative',
  'slope-sign-flipped': 'Uphill is negative',
  'slope-misses-the-turns': 'Slope misses the turns',
  'more-rectangles-more-area': 'More rectangles = more area',
}

/** Mastered = the slope sketch has the right shape and the area guess is within 15%. */
export const mastered = (s: SlopeRead, a: AreaRead) => s.mistake === null && a.close

export const fmt = (v: number, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d)
