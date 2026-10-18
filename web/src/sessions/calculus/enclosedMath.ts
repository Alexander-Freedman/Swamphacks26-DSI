// Calc 2, area enclosed by two curves (Enclosed.tsx draws it).
//
// The line y = x + 2 and the parabola y = x² cross at x = −1 and x = 2 and trap a region between them.
// Each thin strip of it reaches from the parabola (bottom) up to the line (top), so
// area = ∫₋₁² (top − bottom) dx = ∫₋₁² (x + 2 − x²) dx = 9/2.

export const X0 = -1
export const X1 = 2
export const top = (x: number) => x + 2
export const bot = (x: number) => x * x
/** how tall a strip at x is */
export const gap = (x: number) => top(x) - bot(x)
export const EXACT = 4.5
/** ∫₋₁² (x + 2) dx: the area under the line alone, down to the x-axis */
export const TOP_ONLY = 7.5
/** ∫₋₁² x² dx: the part under the parabola, which the line-only area wrongly counts */
export const BOT_ONLY = 3
/** where the curves cross: the region's left and right ends */
export const CROSSINGS: [number, number] = [X0, X1]

/** n strips of equal width, as tall as the gap at their midpoint: [left x, width, bottom, top]. */
export function stripsOf(n: number): [number, number, number, number][] {
  const w = (X1 - X0) / n
  const out: [number, number, number, number][] = []
  for (let i = 0; i < n; i++) {
    const m = X0 + (i + 0.5) * w
    out.push([X0 + i * w, w, bot(m), top(m)])
  }
  return out
}

/** The strips' total. The gap is concave, so midpoint strips overshoot a little and the sum shrinks toward 9/2. */
export const stripSum = (n: number) => stripsOf(n).reduce((s, [, w, b, t]) => s + w * (t - b), 0)

export const N_MAX = 80
/** enough strips to see the total settle */
export const N_DONE = 40

export type TopPick = 'line' | 'parabola' | 'turns'
export type AreaPick = 'top' | 'minus' | 'plus'
export type EnclosedMistake = 'enclosed-top-only'
export const ENCLOSED_LABELS: Record<EnclosedMistake, string> = { 'enclosed-top-only': 'Area between = area under the top curve' }
/** Taking the top curve's whole area, down to the x-axis, is the idea worth naming. */
export const readArea = (pick: AreaPick): EnclosedMistake | null => (pick === 'top' ? 'enclosed-top-only' : null)
