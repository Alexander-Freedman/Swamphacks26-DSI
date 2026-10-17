// Calc 3, volume under a surface (Volume.tsx draws it).
//
// The roof: v(x, y) = 2 − x²/6 − y²/8 over the rectangle 0 ≤ x ≤ 3, 0 ≤ y ≤ 2.
// Highest (2) at the corner by the origin, down to 0 at the far corner (3, 2).
// Exact volume: ∫∫ v dA = 2·6 − (1/6)(3³/3)(2) − (1/8)(3)(2³/3) = 12 − 3 − 1 = 8.

import type { Surf } from './surfaceMath'

export const vz = (x: number, y: number) => 2 - (x * x) / 6 - (y * y) / 8
export const VX = 3
export const VY = 2
export const ROOF: Surf = { z: vz, zx: (x) => -x / 3, zy: (_, y) => -y / 4, x0: 0, x1: VX, y0: 0, y1: VY, name: 'a curved roof' }
export const EXACT = 8

/**
 * The 3D Riemann sum with an n × n grid of columns. Each column is as tall as the roof at its
 * corner nearest the origin. The roof only falls away from there, so every column pokes out
 * above it and the sum overshoots; thinner columns trim the overshoot.
 */
export function columnSum(n: number): number {
  const dx = VX / n
  const dy = VY / n
  let s = 0
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += vz(i * dx, j * dy)
  return s * dx * dy
}

/** The columns themselves: [x, y, width, depth, height] of each. */
export function columns(n: number): [number, number, number, number, number][] {
  const dx = VX / n
  const dy = VY / n
  const out: [number, number, number, number, number][] = []
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push([i * dx, j * dy, dx, dy, vz(i * dx, j * dy)])
  return out
}

/** The grids the slider walks through, coarse to fine. */
export const GRIDS = [2, 3, 4, 6, 8, 10, 15, 20, 30, 40] as const
export const COARSE = columnSum(GRIDS[0])
export const GUESS_MAX = 14

export type VolumeMistake = 'more-columns-more-volume'
export const VOLUME_LABELS: Record<VolumeMistake, string> = { 'more-columns-more-volume': 'More columns = more volume' }
export type VolumeRead = { mistake: VolumeMistake | null; close: boolean; gap: number }

/** Within 15% of 8 is close. At or above the 2 × 2 sum means "adding columns adds volume". */
export function readVolume(guess: number): VolumeRead {
  const gap = guess - EXACT
  const close = Math.abs(gap) <= 0.15 * EXACT
  const mistake = !close && guess >= COARSE - 0.25 ? 'more-columns-more-volume' : null
  return { mistake, close, gap }
}
