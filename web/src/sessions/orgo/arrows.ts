import type { Arrow, Pt } from './chem'
import { dist, R } from './geom'
import { VH, VW } from './sn2'

// Drawing curved arrows by hand: snap to the nearest electrons/target, bend the curve through the path.

export type Drawn = { arrow: Arrow; p0: Pt; c: Pt; p3: Pt }
export type Cand<T> = { v: T; at: Pt; name: string }

export const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

export const nearest = <T,>(list: Cand<T>[], p: Pt, within: number) => {
  let best: Cand<T> | null = null
  for (const c of list) if (dist(c.at, p) < within && (!best || dist(c.at, p) < dist(best.at, p))) best = c
  return best
}

/** Turn a start, an end and the path in between into a curved arrow; `bendAt` is a point the curve passes near. */
export function shapeArrow(arrow: Arrow, p0: Pt, end: Pt, bendAt: Pt | null, vh = VH): Drawn {
  const m = mid(p0, end)
  const len = dist(p0, end) || 1
  let c: Pt = bendAt ? { x: 2 * bendAt.x - m.x, y: 2 * bendAt.y - m.y } : m
  if (dist(c, m) < 0.2 * len) {
    // a straight drag still gets a curve, bowed up
    const nx = (end.y - p0.y) / len
    const ny = -(end.x - p0.x) / len
    const s = ny <= 0 ? 1 : -1
    c = { x: m.x + nx * s * 0.35 * len, y: m.y + ny * s * 0.35 * len }
  }
  c = { x: Math.min(VW - 6, Math.max(6, c.x)), y: Math.min(vh - 6, Math.max(6, c.y)) }
  let p3 = end
  if (arrow.to.kind === 'atom') {
    const d = dist(c, end) || 1
    p3 = { x: end.x + ((c.x - end.x) / d) * (R + 5), y: end.y + ((c.y - end.y) / d) * (R + 5) }
  }
  return { arrow, p0, c, p3 }
}

export const pointAlong = (pts: Pt[], f: number): Pt => {
  if (pts.length < 2) return pts[0]
  const seg = pts.slice(1).map((p, i) => dist(pts[i], p))
  const total = seg.reduce((a, b) => a + b, 0)
  let want = total * f
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i]) {
      const u = seg[i] ? want / seg[i] : 0
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u }
    }
    want -= seg[i]
  }
  return pts[pts.length - 1]
}
