import type { Pt } from './geometry'

// Item 1 "Off the Edge": marble leaves the desk edge (origin) horizontally at v, floor at y = -h.
export type EdgeParams = { v: number; h: number; g: number }

export const DEFAULT_EDGE: EdgeParams = { v: 1.2, h: 0.9, g: 9.81 }

export function fallTime({ h, g }: EdgeParams) {
  return Math.sqrt((2 * h) / g)
}

export function landingX(p: EdgeParams) {
  return p.v * fallTime(p)
}

export function position(p: EdgeParams, t: number): Pt {
  const tc = Math.min(Math.max(t, 0), fallTime(p))
  return [p.v * tc, -0.5 * p.g * tc * tc]
}

export function speed(p: EdgeParams, t: number) {
  return Math.hypot(p.v, p.g * Math.min(t, fallTime(p)))
}

// Arc length travelled by time t: integral of sqrt(v² + (g t)²) dt, closed form.
export function arcLength(p: EdgeParams, t: number) {
  const tc = Math.min(Math.max(t, 0), fallTime(p))
  const { v, g } = p
  const u = g * tc
  const r = Math.hypot(v, u)
  return (u * r + v * v * Math.log((u + r) / v)) / (2 * g)
}

export function truthPath(p: EdgeParams, n = 64): Pt[] {
  const T = fallTime(p)
  return Array.from({ length: n }, (_, i) => position(p, (T * i) / (n - 1)))
}
