// Calc 3, vector fields (Field.tsx draws them).
//
// A vector field hands every point of the floor an arrow F(x, y): which way the water flows there and
// how fast. Two fields: the whirl F = (−y, x), which carries a leaf round in a circle (its speed is
// |F| = r, and F is at right angles to the position, so r never changes); and the source F = (x, y),
// which flings a leaf straight away from the middle, faster the further out it gets (r grows like e^t).

export type Vec = { x: number; y: number }
export type FieldId = 'whirl' | 'source'
export type Field = { id: FieldId; name: string; formula: string; F: (p: Vec) => Vec }

export const FIELDS: Field[] = [
  { id: 'whirl', name: 'whirl', formula: 'F(x, y) = (−y, x)', F: (p) => ({ x: -p.y, y: p.x }) },
  { id: 'source', name: 'source', formula: 'F(x, y) = (x, y)', F: (p) => ({ x: p.x, y: p.y }) },
]
export const fieldOf = (id: FieldId): Field => FIELDS.find((f) => f.id === id)!

/** The floor: −R..R in x and y. A leaf past its edge is out of the picture; past 2R it's gone for good. */
export const R = 3.2
/** Arrow grid: one arrow every GAP units. */
export const GAP = 0.75
export const GRID: Vec[] = (() => {
  const out: Vec[] = []
  for (let x = -3; x <= 3.001; x += GAP) for (let y = -3; y <= 3.001; y += GAP) out.push({ x, y })
  return out
})()

export const len = (v: Vec) => Math.hypot(v.x, v.y)
/** How fast the water moves at p: the arrow's length. */
export const speed = (f: Field, p: Vec) => len(f.F(p))

const add = (a: Vec, b: Vec, k: number): Vec => ({ x: a.x + k * b.x, y: a.y + k * b.y })

/** One RK4 step of dp/dt = F(p). */
export function step(f: Field, p: Vec, dt: number): Vec {
  const k1 = f.F(p)
  const k2 = f.F(add(p, k1, dt / 2))
  const k3 = f.F(add(p, k2, dt / 2))
  const k4 = f.F(add(p, k3, dt))
  return { x: p.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x), y: p.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y) }
}

/** Time between two dots of a trail. Equal time steps, so dots far apart = moving fast. */
export const DT = 0.05
/** The whirl goes round once in 2π; a little more than one lap shows it closes up. */
const MAX_STEPS = Math.ceil((2.2 * Math.PI) / DT)

/**
 * Where the arrows carry a leaf dropped at p: the path of dp/dt = F(p), one dot per DT, until it has
 * had a lap's worth of time or is well off the floor (a whirl leaf that slips past the edge comes back).
 */
export function flow(f: Field, p: Vec, maxSteps = MAX_STEPS): Vec[] {
  const out: Vec[] = [p]
  let q = p
  for (let i = 0; i < maxSteps; i++) {
    q = step(f, q, DT)
    out.push(q)
    if (Math.abs(q.x) > 2 * R || Math.abs(q.y) > 2 * R) break
  }
  return out
}

/** Where a trail ends up, in words. */
export type Fate = 'circle' | 'in' | 'out'
export function fate(trail: Vec[]): Fate {
  const r0 = len(trail[0])
  const r1 = len(trail[trail.length - 1])
  if (r1 > r0 * 1.2) return 'out'
  if (r1 < r0 * 0.8) return 'in'
  return 'circle'
}

export type FieldMistake = 'field-arrows-are-paths' | 'whirl-spirals-in' | 'field-length-ignored'
export const FIELD_LABELS: Record<FieldMistake, string> = {
  'field-arrows-are-paths': 'One arrow = the whole path',
  'whirl-spirals-in': 'A whirl spirals inward',
  'field-length-ignored': 'Arrow length doesn’t matter',
}
