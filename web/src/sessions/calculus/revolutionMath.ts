// Calc 2, volumes of revolution (Revolution.tsx draws it).
//
// The curve y = √x on [0, 4], spun around the x-axis, sweeps out a solid. Slice it into discs:
// each is a circle of radius √x, Δx thick, so its volume is π(√x)²Δx. Adding them up,
// volume = π ∫₀⁴ (√x)² dx = π ∫₀⁴ x dx = 8π ≈ 25.13.

import type { Surf } from './surfaceMath'

export const RX = 4
/** the curve: the radius of the solid at x */
export const r = (x: number) => Math.sqrt(x)
export const EXACT = 8 * Math.PI

/** The 3D stage: x along the axis of revolution, the floor wide enough for the solid (radius 2). */
export const STAGE: Surf = { z: () => 0, zx: () => 0, zy: () => 0, x0: 0, x1: RX, y0: -2.2, y1: 2.2, name: 'the curve y = √x spun around the x-axis' }

/** the disc counts the slider walks through */
export const DISCS = [1, 2, 4, 8, 16, 32, 64] as const

/** One disc: π · radius² · thickness. */
export const discVolume = (radius: number, dx: number) => Math.PI * radius * radius * dx

/** n discs, each as wide as the curve at its right edge: [left x, thickness, radius]. */
export function discs(n: number): [number, number, number][] {
  const dx = RX / n
  const out: [number, number, number][] = []
  for (let i = 0; i < n; i++) out.push([i * dx, dx, r((i + 1) * dx)])
  return out
}

/**
 * The discs' total. √x only grows, so a disc as wide as its right edge pokes out past the curve
 * everywhere else in its slab: the sum overshoots, and thinner discs overshoot less (it is 8π(1 + 1/n)).
 */
export const discSum = (n: number) => discs(n).reduce((s, [, dx, rad]) => s + discVolume(rad, dx), 0)
export const ONE_DISC = discSum(1)

/** The disc the question is about: the last slab, x from 3 to 4, 1 thick, radius √4 = 2. */
export const ASK = { x0: 3, dx: 1, radius: r(4) }
/** that disc's outline, to revolve: up its left face, along its rim, down its right face */
export const ASK_PROFILE: [number, number][] = [[ASK.x0, 0], [ASK.x0, ASK.radius], [ASK.x0 + ASK.dx, ASK.radius], [ASK.x0 + ASK.dx, 0]]

/** The outline to revolve: (x, radius) points along the curve, dense near 0 where it is steep, then down to the axis at x = 4. */
export function curveProfile(k = 28): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= k; i++) {
    const x = RX * (i / k) * (i / k)
    out.push([x, r(x)])
  }
  out.push([RX, 0])
  return out
}

/** The stepped outline of n discs: up each disc's left face, along its rim, down the last one. */
export function discProfile(n: number): [number, number][] {
  const out: [number, number][] = [[0, 0]]
  for (const [x, dx, rad] of discs(n)) out.push([x, rad], [x + dx, rad])
  out.push([RX, 0])
  return out
}

export type DiscPick = 'linear' | 'squared' | 'strip'
export type RevMistake = 'disc-radius-not-squared'
export const REV_LABELS: Record<RevMistake, string> = { 'disc-radius-not-squared': 'Disc volume = π · r · thickness' }
/** Forgetting to square the radius is the idea worth naming; "the strip's area" is just the 2D picture. */
export const readDisc = (pick: DiscPick): RevMistake | null => (pick === 'linear' ? 'disc-radius-not-squared' : null)
