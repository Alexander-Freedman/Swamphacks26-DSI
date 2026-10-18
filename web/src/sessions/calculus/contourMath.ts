// Calc 3, contour maps (Contour.tsx draws them).
//
// Two hills of different heights: f(x, y) = 3·e^(−((x−1)² + (y−1)²)/2) + 2·e^(−((x+1.5)² + (y+1)²)/1.5).
// The tall one (3) sits at (1, 1), the short one (2) at (−1.5, −1). A contour line is where f = h for
// one height h: the shoreline if you flooded the hills up to h. Cut at many heights and you get the map.

import type { Surf } from './surfaceMath'

const tall = (x: number, y: number) => 3 * Math.exp(-((x - 1) ** 2 + (y - 1) ** 2) / 2)
const short = (x: number, y: number) => 2 * Math.exp(-((x + 1.5) ** 2 + (y + 1) ** 2) / 1.5)

export const cz = (x: number, y: number) => tall(x, y) + short(x, y)
export const cx = (x: number, y: number) => -(x - 1) * tall(x, y) - ((2 * (x + 1.5)) / 1.5) * short(x, y)
export const cy = (x: number, y: number) => -(y - 1) * tall(x, y) - ((2 * (y + 1)) / 1.5) * short(x, y)

/** The floor: −R..R in x and y. */
export const R = 3.5
export const TWIN: Surf = { z: cz, zx: cx, zy: cy, x0: -R, x1: R, y0: -R, y1: R, name: 'two hills, one taller than the other' }

export type Vec = { x: number; y: number }
export const grad = (p: Vec): Vec => ({ x: cx(p.x, p.y), y: cy(p.x, p.y) })
export const len = (v: Vec) => Math.hypot(v.x, v.y)

/** Every 0.25 of height gets a line on the map, from just above the floor to just under the tall top. */
export const STEP = 0.25
export const LEVELS: number[] = Array.from({ length: 11 }, (_, i) => STEP * (i + 1)) // 0.25 … 2.75
/** The water starts above everything and the student lowers it. */
export const H_TOP = 3.2

/** One straight piece of a contour line, from (x1, y1) to (x2, y2) on the floor. */
export type Seg = [number, number, number, number]

/**
 * The contour line f = h as short straight pieces: marching squares on an n × n grid. Each grid cell is
 * checked corner by corner; where the height crosses h along a cell edge, the crossing point is found by
 * linear interpolation, and the crossing points of one cell are joined up.
 */
export function contour(h: number, n = 80, surf: Surf = TWIN): Seg[] {
  const { x0, x1, y0, y1, z } = surf
  const dx = (x1 - x0) / n
  const dy = (y1 - y0) / n
  const zs: number[][] = []
  for (let i = 0; i <= n; i++) {
    zs.push([])
    for (let j = 0; j <= n; j++) zs[i].push(z(x0 + i * dx, y0 + j * dy))
  }
  const out: Seg[] = []
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const xa = x0 + i * dx
      const ya = y0 + j * dy
      // corners counter-clockwise from the bottom left: a (xa, ya), b (xa + dx, ya), c (xa + dx, ya + dy), d (xa, ya + dy)
      const a = zs[i][j]
      const b = zs[i + 1][j]
      const c = zs[i + 1][j + 1]
      const d = zs[i][j + 1]
      const code = (a > h ? 1 : 0) | (b > h ? 2 : 0) | (c > h ? 4 : 0) | (d > h ? 8 : 0)
      if (code === 0 || code === 15) continue
      const t = (u: number, v: number) => (h - u) / (v - u)
      // the crossing on each edge: bottom (a→b), right (b→c), top (d→c), left (a→d)
      const bottom: Vec = { x: xa + t(a, b) * dx, y: ya }
      const right: Vec = { x: xa + dx, y: ya + t(b, c) * dy }
      const top: Vec = { x: xa + t(d, c) * dx, y: ya + dy }
      const left: Vec = { x: xa, y: ya + t(a, d) * dy }
      const seg = (p: Vec, q: Vec) => out.push([p.x, p.y, q.x, q.y])
      switch (code) {
        case 1: case 14: seg(left, bottom); break
        case 2: case 13: seg(bottom, right); break
        case 3: case 12: seg(left, right); break
        case 4: case 11: seg(right, top); break
        case 6: case 9: seg(bottom, top); break
        case 7: case 8: seg(left, top); break
        case 5: case 10: {
          // two opposite corners are high: the cell's middle decides which pairs join up
          const mid = (a + b + c + d) / 4 > h
          if ((code === 5) === mid) { seg(left, top); seg(bottom, right) }
          else { seg(left, bottom); seg(right, top) }
        }
      }
    }
  return out
}

/** The two points to compare on the map: A near the short hill's top, B low on the tall hill's side. */
export const PT_A: Vec = { x: -1.5, y: -1.3 }
export const PT_B: Vec = { x: 1.2, y: -0.6 }

export type ContourMistake = 'contour-count-is-height' | 'contour-spacing-flat'
export const CONTOUR_LABELS: Record<ContourMistake, string> = {
  'contour-count-is-height': 'Hill with more rings = higher point',
  'contour-spacing-flat': 'Close lines = flat ground',
}
