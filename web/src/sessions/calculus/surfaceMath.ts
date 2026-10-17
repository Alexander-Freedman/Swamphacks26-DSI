// The Calc 3 surface and its partial derivatives (Surface.tsx draws them).

/** A hill: highest at the origin, falling off in every direction. */
export const fz = (x: number, y: number) => 3 * Math.exp(-(x * x + y * y) / 4)
export const fx = (x: number, y: number) => (-x / 2) * fz(x, y)
export const fy = (x: number, y: number) => (-y / 2) * fz(x, y)

export type Dir = 'uphill' | 'downhill' | 'flat'
export const dirOf = (s: number): Dir => (Math.abs(s) < 0.08 ? 'flat' : s > 0 ? 'uphill' : 'downhill')
