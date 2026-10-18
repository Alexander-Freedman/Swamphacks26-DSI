// The Calc 3 surface and its partial derivatives (Surface.tsx draws them).

/** A surface z = f(x, y) over a rectangle of the floor, with its two partial derivatives. */
export type Surf = {
  z: (x: number, y: number) => number
  zx: (x: number, y: number) => number
  zy: (x: number, y: number) => number
  x0: number
  x1: number
  y0: number
  y1: number
  /** for screen readers: "a hill" */
  name: string
}

/** A hill: highest at the origin, falling off in every direction. */
export const fz = (x: number, y: number) => 3 * Math.exp(-(x * x + y * y) / 4)
export const fx = (x: number, y: number) => (-x / 2) * fz(x, y)
export const fy = (x: number, y: number) => (-y / 2) * fz(x, y)

export const HILL: Surf = { z: fz, zx: fx, zy: fy, x0: -3, x1: 3, y0: -3, y1: 3, name: 'a hill' }

export type Dir = 'uphill' | 'downhill' | 'flat'
export const dirOf = (s: number): Dir => (Math.abs(s) < 0.08 ? 'flat' : s > 0 ? 'uphill' : 'downhill')
