export type Pt = [number, number]

export function dist(a: Pt, b: Pt) {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

export function pathLength(pts: Pt[]) {
  let s = 0
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i])
  return s
}

// Point at arc length s along the polyline (clamped to the ends).
export function pointAt(pts: Pt[], s: number): Pt {
  if (pts.length === 0) return [0, 0]
  if (s <= 0) return pts[0]
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i])
    if (s <= d && d > 0) {
      const k = s / d
      const [a, b] = [pts[i - 1], pts[i]]
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
    }
    s -= d
  }
  return pts[pts.length - 1]
}

// n points evenly spaced by arc length, so fast and slow strokes look the same to the backend.
export function resample(pts: Pt[], n = 64): Pt[] {
  if (pts.length < 2) return pts.slice()
  const total = pathLength(pts)
  if (total === 0) return [pts[0]]
  return Array.from({ length: n }, (_, i) => pointAt(pts, (total * i) / (n - 1)))
}

// World (metres, y up) <-> screen (CSS px, y down).
export type View = { x0: number; x1: number; y0: number; y1: number; w: number; h: number }

export function toScreen(v: View, [x, y]: Pt): Pt {
  return [((x - v.x0) / (v.x1 - v.x0)) * v.w, ((v.y1 - y) / (v.y1 - v.y0)) * v.h]
}

export function toWorld(v: View, [sx, sy]: Pt): Pt {
  return [v.x0 + (sx / v.w) * (v.x1 - v.x0), v.y1 - (sy / v.h) * (v.y1 - v.y0)]
}
