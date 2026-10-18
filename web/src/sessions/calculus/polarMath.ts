// Calc 2, polar curves (Polar.tsx draws it).
//
// The rose r(θ) = cos 3θ. The same function read two ways: as an ordinary graph of r against θ,
// and as a point at distance r along the ray at angle θ. A negative r puts the point on the
// opposite side of the origin, so the three negative humps retrace the three petals: 3 petals, not 6.

export const PETALS = 3
export const r = (theta: number) => Math.cos(PETALS * theta)

export const TAU = 2 * Math.PI
export const deg = (theta: number) => (theta * 180) / Math.PI
export const rad = (d: number) => (d * Math.PI) / 180

/** Where the dot is in the plane for angle θ: r(θ) along the ray at θ (behind the origin when r < 0). */
export const point = (theta: number) => {
  const rr = r(theta)
  return { x: rr * Math.cos(theta), y: rr * Math.sin(theta) }
}

/** The angle a pointer at (x, y) from the centre asks for, in [0, 2π). */
export function angleOf(x: number, y: number): number {
  const a = Math.atan2(y, x)
  return a < 0 ? a + TAU : a
}

/** Points along the rose from θ = 0 to θ = to, for the traced path. */
export function trace(to: number, step = TAU / 360): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let t = 0; t <= to + 1e-9; t += step) out.push(point(Math.min(t, to)))
  return out
}

/** The θ intervals (in degrees, within one turn) where r is negative: the dot is flipped across the origin. */
export function negativeSpans(): [number, number][] {
  const out: [number, number][] = []
  // cos 3θ < 0 when 3θ is in (90°, 270°) + 360°·k
  for (let k = 0; k < PETALS; k++) out.push([(90 + 360 * k) / PETALS, (270 + 360 * k) / PETALS])
  return out
}

/** True when the dot at θ is on the flipped side (r < 0). */
export const flipped = (theta: number) => r(theta) < -1e-9

/**
 * How many petals the sweep from 0 to θ has finished drawing. The petal pointing at 240° is done
 * at θ = 90° (traced with r < 0 from 30° to 90°), the one at 120° at θ = 150°, and the one at 0°
 * at θ = 210° (its second half is traced with r < 0 from 150° to 210°). After that, every point is a retrace.
 */
export function petalsDrawn(theta: number): number {
  const d = deg(theta)
  return [90, 150, 210].filter((a) => d >= a - 1e-9).length
}

export type PolarMistake = 'polar-negative-r-ignored'
export const POLAR_LABELS: Record<PolarMistake, string> = { 'polar-negative-r-ignored': 'Negative r = another petal' }
