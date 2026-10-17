// Calculus session math. Everything the screens show is computed here, exactly
// (closed forms for the curves, derivatives and integrals), never estimated by hand.

export type Pt = { x: number; y: number }
export type Fn = (x: number) => number

/** Step 1 + 2 curve: a hill at x = -1 and a valley at x = 1. */
export const f: Fn = (x) => x ** 3 / 3 - x
/** Its exact derivative. */
export const df: Fn = (x) => x * x - 1
/** Where f and f' are drawn. */
export const X0 = -2
export const X1 = 2

/** Slope of the secant from x to x + h. */
export function secantSlope(fn: Fn, x: number, h: number): number {
  return (fn(x + h) - fn(x)) / h
}

/** Exact secant slope of f: (f(x+h) - f(x)) / h = x² - 1 + x·h + h²/3, so the gap to f'(x) is x·h + h²/3. */
export const secantSlopeF = (x: number, h: number) => x * x - 1 + x * h + (h * h) / 3

/** The tangent line to a curve at x, as y = m·(t - x) + y0. */
export function tangent(fn: Fn, dfn: Fn, x: number): { m: number; y0: number; at: (t: number) => number } {
  const m = dfn(x)
  const y0 = fn(x)
  return { m, y0, at: (t) => m * (t - x) + y0 }
}

/** h on the step 1 slider: 0 → 2, 100 → 0.001 (log scale, so the last stretch to "tiny" is easy to reach). */
export const hFromSlider = (v: number) => 2 * 10 ** ((-3.30103 * v) / 100)

/* ---------- Area (step 3) ---------- */

/** Step 3 curve: g(x) = x² on [0, 2]. */
export const g: Fn = (x) => x * x
export const A = 0
export const B = 2
/** Exact ∫₀² x² dx = 8/3. */
export const exactArea = (a = A, b = B) => (b ** 3 - a ** 3) / 3
/** The box around the curve (width × top height) and the straight-line (trapezoid) area: the two tempting guesses. */
export const BOX = (B - A) * g(B)
export const CHORD = ((B - A) * (g(A) + g(B))) / 2

export type Rule = 'left' | 'right' | 'mid'

/** Riemann sum of fn on [a, b] with n equal rectangles, height at the left edge, right edge or middle. */
export function riemann(fn: Fn, a: number, b: number, n: number, rule: Rule): number {
  const w = (b - a) / n
  const off = rule === 'left' ? 0 : rule === 'right' ? 1 : 0.5
  let s = 0
  for (let i = 0; i < n; i++) s += fn(a + (i + off) * w)
  return s * w
}

/** The rectangles themselves, for drawing. */
export function rects(fn: Fn, a: number, b: number, n: number, rule: Rule): { x: number; w: number; h: number }[] {
  const w = (b - a) / n
  const off = rule === 'left' ? 0 : rule === 'right' ? 1 : 0.5
  return Array.from({ length: n }, (_, i) => ({ x: a + i * w, w, h: fn(a + (i + off) * w) }))
}

export type AreaMistake = 'whole-box' | 'straight-line' | null

/** Names the mistake an area guess points to. Within 15% of the truth is right. */
export function classifyArea(guess: number): AreaMistake {
  const truth = exactArea()
  if (Math.abs(guess - truth) <= 0.15 * truth) return null
  if (guess >= BOX * 0.75) return 'whole-box'
  if (Math.abs(guess - CHORD) <= 0.5) return 'straight-line'
  return null
}

/* ---------- Motion (step 4) ---------- */

/** Speed of a car (m/s) over 0-4 s: speeds up, then slows to a stop. */
export const T1 = 4
export const speed: Fn = (t) => 3 * t - 0.75 * t * t
/** Position = ∫ speed, starting at 0. */
export const position: Fn = (t) => 1.5 * t * t - 0.25 * t ** 3

/* ---------- Sketch (step 2) ---------- */

/** Samples a hand-drawn polyline at n evenly spaced x in [x0, x1], linear in between, held flat past its ends. */
export function resample(pts: Pt[], n = 81, x0 = X0, x1 = X1): number[] {
  const s = [...pts].filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).sort((p, q) => p.x - q.x)
  if (!s.length) return Array(n).fill(0)
  const out: number[] = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1)
    if (x <= s[0].x) out.push(s[0].y)
    else if (x >= s[s.length - 1].x) out.push(s[s.length - 1].y)
    else {
      while (j < s.length - 2 && s[j + 1].x < x) j++
      const a = s[j]
      const b = s[j + 1]
      const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x)
      out.push(a.y + t * (b.y - a.y))
    }
  }
  return out
}

/** Share of [x0, x1] the sketch spans. */
export function coverage(pts: Pt[], x0 = X0, x1 = X1): number {
  if (pts.length < 2) return 0
  const xs = pts.map((p) => Math.min(x1, Math.max(x0, p.x)))
  return (Math.max(...xs) - Math.min(...xs)) / (x1 - x0)
}

export const xsFor = (n = 81, x0 = X0, x1 = X1) => Array.from({ length: n }, (_, i) => x0 + ((x1 - x0) * i) / (n - 1))

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
export const rms = (a: number[], b: number[]) => Math.sqrt(mean(a.map((v, i) => (v - b[i]) ** 2)))

/** Pearson correlation; 0 when either side is flat. */
export function corr(a: number[], b: number[]): number {
  const ma = mean(a)
  const mb = mean(b)
  let sab = 0
  let saa = 0
  let sbb = 0
  for (let i = 0; i < a.length; i++) {
    sab += (a[i] - ma) * (b[i] - mb)
    saa += (a[i] - ma) ** 2
    sbb += (b[i] - mb) ** 2
  }
  return saa < 1e-9 || sbb < 1e-9 ? 0 : sab / Math.sqrt(saa * sbb)
}

/** Least-squares k in sketch ≈ k·truth + c. */
export function scaleFit(sketch: number[], truth: number[]): number {
  const ms = mean(sketch)
  const mt = mean(truth)
  let num = 0
  let den = 0
  for (let i = 0; i < truth.length; i++) {
    num += (sketch[i] - ms) * (truth[i] - mt)
    den += (truth[i] - mt) ** 2
  }
  return den < 1e-9 ? 0 : num / den
}

export type SketchMistake = 'derivative-is-height' | 'sign-flip' | 'wrong-scale' | 'flat-not-zero' | 'not-the-slope' | null

/** How close a sketch has to be (RMS, in y units) to count as right. f' runs from -1 to 3 on [-2, 2]. */
export const SKETCH_OK = 0.5

/**
 * Names the mistake a sketch of f' matches, from the sketch vs the truth (and vs f itself).
 * f is odd and f' is even on [-2, 2], so "traced f" and "drew f'" are cleanly apart.
 */
export function classifySketch(sketch: number[], xs: number[] = xsFor(sketch.length)): SketchMistake {
  const truth = xs.map(df)
  const height = xs.map(f)
  if (rms(sketch, truth) <= SKETCH_OK) return null
  const cF = corr(sketch, height)
  const cD = corr(sketch, truth)
  if (cF > 0.7 && cF > cD) return 'derivative-is-height'
  if (cD < -0.7) return 'sign-flip'
  if (cD > 0.8) {
    const k = scaleFit(sketch, truth)
    if (k < 0.6 || k > 1.6) return 'wrong-scale'
    return 'flat-not-zero'
  }
  return 'not-the-slope'
}

/** The x where the sketch and the truth are furthest apart. */
export function biggestGap(sketch: number[], xs: number[] = xsFor(sketch.length)): { x: number; gap: number } {
  let best = { x: xs[0], gap: 0 }
  xs.forEach((x, i) => {
    const d = Math.abs(sketch[i] - df(x))
    if (d > best.gap) best = { x, gap: d }
  })
  return best
}

export const MISTAKES: Record<Exclude<SketchMistake | AreaMistake, null> | 'same-shape', { label: string; line: string }> = {
  'derivative-is-height': { label: 'The derivative is the curve’s height', line: 'You traced the curve. The derivative is how steep it is, not how high.' },
  'sign-flip': { label: 'Uphill and downhill swapped', line: 'Going up is a positive slope; going down is negative.' },
  'wrong-scale': { label: 'Right shape, wrong steepness', line: 'Your bumps are in the right places; the slope numbers are off by a factor.' },
  'flat-not-zero': { label: 'Flat spots aren’t at zero', line: 'At the top of a hill the slope is exactly 0.' },
  'not-the-slope': { label: 'Drew a shape, not the slope', line: 'Read the steepness off the curve, one x at a time.' },
  'whole-box': { label: 'Counted the whole box', line: 'The curve hugs the bottom; most of the box is empty.' },
  'straight-line': { label: 'Treated the curve as a straight line', line: 'x² sags below the straight line, so the area is less.' },
  'same-shape': { label: 'A graph and its rate look alike', line: 'Speed peaks where position is steepest, not where it is highest.' },
}

/** Rounds to `d` decimals for display. */
export const fix = (v: number, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d)
