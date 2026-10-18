// Calc 3, the gradient (Gradient.tsx draws it).
//
// The hill: f(x, y) = 3·e^(−x²/8 − y²/2). Long in x, narrow in y, so from most points the
// steepest way up is NOT straight at the top: it heads for the ridge (y = 0) first.
// Its gradient: ∇f = (∂f/∂x, ∂f/∂y) = (−x/4 · f, −y · f).

import type { Surf } from './surfaceMath'

export const gz = (x: number, y: number) => 3 * Math.exp(-(x * x) / 8 - (y * y) / 2)
export const gx = (x: number, y: number) => (-x / 4) * gz(x, y)
export const gy = (x: number, y: number) => -y * gz(x, y)

export const RIDGE: Surf = { z: gz, zx: gx, zy: gy, x0: -3, x1: 3, y0: -3, y1: 3, name: 'a long hill' }

export type Vec = { x: number; y: number }
export const grad = (p: Vec): Vec => ({ x: gx(p.x, p.y), y: gy(p.x, p.y) })
export const len = (v: Vec) => Math.hypot(v.x, v.y)
export const unit = (v: Vec): Vec => {
  const l = len(v)
  return l < 1e-12 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l }
}
/** How fast the height changes walking one unit in direction u (the directional derivative ∇f · u). */
export const climb = (p: Vec, u: Vec) => {
  const g = grad(p)
  const d = unit(u)
  return g.x * d.x + g.y * d.y
}

/** Where the student starts: on the side of the ridge, where "toward the top" and "steepest" differ most. */
export const START: Vec = { x: 2, y: 1 }

/** The three arrows to pick from at START. Only one is the gradient. */
export type ArrowId = 'top' | 'grad' | 'level'
export const ARROWS: { id: ArrowId; name: string; dir: Vec }[] = (() => {
  const g = unit(grad(START))
  return [
    { id: 'top', name: 'A', dir: unit({ x: -START.x, y: -START.y }) }, // straight at the top
    { id: 'grad', name: 'B', dir: g }, // steepest uphill
    { id: 'level', name: 'C', dir: { x: g.y, y: -g.x } }, // at right angles to it: the height stays the same
  ]
})()

/**
 * One step of walking uphill along the arrow: follow dp/dt = ∇f for time dt (RK4 in small pieces).
 * Steps shrink with the arrow, so you slow down as the hill flattens out near the top.
 */
export function walk(p: Vec, dt = 0.6, pieces = 24): Vec {
  let q = p
  const h = dt / pieces
  const add = (a: Vec, b: Vec, k: number): Vec => ({ x: a.x + k * b.x, y: a.y + k * b.y })
  for (let i = 0; i < pieces; i++) {
    const k1 = grad(q)
    const k2 = grad(add(q, k1, h / 2))
    const k3 = grad(add(q, k2, h / 2))
    const k4 = grad(add(q, k3, h))
    q = { x: q.x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x), y: q.y + (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y) }
  }
  return q
}

/** The arrow counts as shrunk to nothing below this length (same "flat" cut as the slices). */
export const TOP = 0.08
export const atTop = (p: Vec) => len(grad(p)) < TOP

export type GradMistake = 'gradient-points-at-peak' | 'gradient-is-height'
export const GRAD_LABELS: Record<GradMistake, string> = {
  'gradient-points-at-peak': 'Steepest = straight at the top',
  'gradient-is-height': 'Steeper the higher you go',
}
