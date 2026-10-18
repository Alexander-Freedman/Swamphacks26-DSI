// Calc 2, u-substitution (Usub.tsx draws it).
//
// The messy integral ∫₀^√(π/2) 2x·cos(x²) dx. With u = x² (so du = 2x dx) it is ∫₀^(π/2) cos(u) du = 1.
// The picture: substituting stretches the x-axis into the u-axis. Every strip under the messy curve
// gets wider by du/dx = 2x and shorter by the same 2x, so each keeps its area, and so does the whole thing.

/** x runs from 0 to A; u = x² runs from 0 to U1. */
export const A = Math.sqrt(Math.PI / 2)
export const U1 = Math.PI / 2
/** the messy integrand, in x */
export const messy = (x: number) => 2 * x * Math.cos(x * x)
/** the substitution and its derivative */
export const g = (x: number) => x * x
export const dg = (x: number) => 2 * x
/** the simple integrand, in u */
export const simple = (u: number) => Math.cos(u)
/** ∫ cos(u) du from 0 to π/2 = sin(π/2) − sin(0) */
export const EXACT = 1
export const NSTRIPS = 10

/**
 * The stretch, part way: at t the axis shows w = x^(1+t), so t = 0 is x itself and t = 1 is u = x².
 * Stretching this way keeps the picture smooth from one end to the other.
 */
export const warp = (x: number, t: number) => Math.pow(x, 1 + t)
/** How wide the base is at t: from 0 to A^(1+t). */
export const baseWidth = (t: number) => warp(A, t)

/**
 * The curve part way through the stretch, as a height above w = warp(x, t). Its height is the messy
 * height divided by dw/dx, so the area under it stays exactly 1 for every t: at t = 0 it is 2x·cos(x²),
 * at t = 1 it is cos(x²) = cos(u).
 */
export function morphHeight(x: number, t: number): number {
  const p = 1 + t
  if (x === 0) return p === 2 ? 1 : 0
  return (2 / p) * Math.pow(x, 2 - p) * Math.cos(x * x)
}

/** The curve's highest point at t: about 1.28 before the stretch, 1 (at u = 0) after it. */
export function peak(t: number): number {
  let best = 0
  for (let i = 0; i <= 400; i++) best = Math.max(best, morphHeight((A * i) / 400, t))
  return best
}

/**
 * NSTRIPS strips of equal x-width, each stretched to the axis at t: [left w, width, height].
 * Every strip's height is its true area divided by its stretched width, so each keeps its area.
 */
export function strips(t: number, n = NSTRIPS): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let i = 0; i < n; i++) {
    const xa = (A * i) / n
    const xb = (A * (i + 1)) / n
    const area = Math.sin(xb * xb) - Math.sin(xa * xa) // ∫ 2x·cos(x²) dx = sin(x²)
    const wa = warp(xa, t)
    const wb = warp(xb, t)
    out.push([wa, wb - wa, area / (wb - wa)])
  }
  return out
}

/** The strips' total: 1 at every t. */
export const stripSum = (t: number) => strips(t).reduce((s, [, w, h]) => s + w * h, 0)

export type Stretch = 'bigger' | 'smaller' | 'same'
export type UsubMistake = 'usub-changes-area'
export const USUB_LABELS: Record<UsubMistake, string> = { 'usub-changes-area': 'Stretching the axis changes the area' }
/** "Bigger" and "smaller" are the same idea: that the stretch changes the area. */
export const readStretch = (pick: Stretch): UsubMistake | null => (pick === 'same' ? null : 'usub-changes-area')
