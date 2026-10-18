import { describe, expect, it } from 'vitest'
import { contour, CONTOUR_LABELS, cx, cy, cz, grad, LEVELS, len, PT_A, PT_B, STEP, TWIN } from './contourMath'
import { DT, fate, FIELD_LABELS, fieldOf, flow, GRID, R as FR, speed, step } from './fieldMath'

// central difference, to check every hand-written partial derivative
const d = (f: (x: number, y: number) => number, x: number, y: number, along: 'x' | 'y', h = 1e-5) =>
  along === 'x' ? (f(x + h, y) - f(x - h, y)) / (2 * h) : (f(x, y + h) - f(x, y - h)) / (2 * h)

describe('contour maps', () => {
  it('the partial derivatives match the two-hill surface', () => {
    for (const [x, y] of [[1, 1], [-1.5, -1], [0, 0], [2, -2], [-0.3, 0.8], [1.2, -0.6]]) {
      expect(cx(x, y)).toBeCloseTo(d(cz, x, y, 'x'), 6)
      expect(cy(x, y)).toBeCloseTo(d(cz, x, y, 'y'), 6)
    }
    expect(TWIN.z).toBe(cz)
    expect(TWIN.zx).toBe(cx)
    expect(TWIN.zy).toBe(cy)
  })

  it('a tall hill (3) at (1, 1), a short one (2) at (−1.5, −1); A is high on the short hill, B low on the tall one', () => {
    expect(cz(1, 1)).toBeCloseTo(3, 2)
    expect(cz(-1.5, -1)).toBeCloseTo(2.02, 2)
    expect(cz(PT_A.x, PT_A.y)).toBeCloseTo(1.89, 2)
    expect(cz(PT_B.x, PT_B.y)).toBeCloseTo(0.83, 2)
    // A sits between the 1.75 and 2.00 lines; B between 0.75 and 1.00
    expect(Math.floor(cz(PT_A.x, PT_A.y) / STEP)).toBe(7)
    expect(Math.floor(cz(PT_B.x, PT_B.y) / STEP)).toBe(3)
  })

  it('eleven lines, every 0.25 from 0.25 to 2.75', () => {
    expect(LEVELS).toHaveLength(11)
    expect(LEVELS[0]).toBeCloseTo(0.25, 12)
    expect(LEVELS[10]).toBeCloseTo(2.75, 12)
  })

  it('every point of a contour line sits at that height; nothing above the tall top', () => {
    for (const h of [0.5, 1, 1.5, 2.5]) {
      const segs = contour(h)
      expect(segs.length).toBeGreaterThan(40)
      for (const [x1, y1, x2, y2] of segs) {
        expect(Math.abs(cz(x1, y1) - h)).toBeLessThan(0.03)
        expect(Math.abs(cz(x2, y2) - h)).toBeLessThan(0.03)
      }
    }
    expect(contour(3.1)).toHaveLength(0)
    // 2.5 is above the short hill: that line only rings the tall one
    for (const [x1, y1] of contour(2.5)) expect(Math.hypot(x1 - 1, y1 - 1)).toBeLessThan(1.2)
  })

  it('the gradient crosses the contour lines at right angles', () => {
    for (const [x1, y1, x2, y2] of contour(1.5)) {
      const l = Math.hypot(x2 - x1, y2 - y1)
      if (l < 0.02) continue
      const g = grad({ x: (x1 + x2) / 2, y: (y1 + y2) / 2 })
      const cos = ((x2 - x1) * g.x + (y2 - y1) * g.y) / (l * len(g))
      expect(Math.abs(cos)).toBeLessThan(0.2)
    }
  })

  it('the hill is steepest where the lines are close: on the tall hill’s side, not at its top or in the flats', () => {
    const side = len(grad({ x: 1, y: 0 }))
    expect(side).toBeCloseTo(1.8, 2)
    expect(len(grad({ x: 1, y: 1 }))).toBeLessThan(0.05) // the top
    expect(len(grad({ x: 2.8, y: -2.8 }))).toBeLessThan(0.05) // the flat corner
    expect(side).toBeGreaterThan(len(grad(PT_B)))
  })

  it('names both mistakes', () => {
    expect(Object.keys(CONTOUR_LABELS)).toEqual(['contour-count-is-height', 'contour-spacing-flat'])
  })
})

describe('vector fields', () => {
  const whirl = fieldOf('whirl')
  const source = fieldOf('source')

  it('81 arrows on the grid; the whirl is at right angles to the position, the source along it', () => {
    expect(GRID).toHaveLength(81)
    for (const p of GRID) {
      const w = whirl.F(p)
      expect(w.x * p.x + w.y * p.y).toBeCloseTo(0, 12)
      expect(source.F(p)).toEqual(p)
      expect(speed(whirl, p)).toBeCloseTo(Math.hypot(p.x, p.y), 12)
    }
  })

  it('one RK4 step of the whirl is a tiny rotation', () => {
    const q = step(whirl, { x: 1.5, y: 0 }, DT)
    expect(q.x).toBeCloseTo(1.5 * Math.cos(DT), 8)
    expect(q.y).toBeCloseTo(1.5 * Math.sin(DT), 8)
  })

  it('a leaf in the whirl goes round in a circle: same distance from the middle all the way, back where it started after 2π', () => {
    const trail = flow(whirl, { x: 1.5, y: 0.5 })
    const r0 = Math.hypot(1.5, 0.5)
    for (const p of trail) expect(Math.hypot(p.x, p.y)).toBeCloseTo(r0, 6)
    // 2π isn’t a whole number of steps: after k steps the leaf has turned by k·DT
    const lap = Math.round((2 * Math.PI) / DT)
    expect(trail.length).toBeGreaterThan(lap)
    const a = lap * DT
    expect(trail[lap].x).toBeCloseTo(1.5 * Math.cos(a) - 0.5 * Math.sin(a), 4)
    expect(trail[lap].y).toBeCloseTo(1.5 * Math.sin(a) + 0.5 * Math.cos(a), 4)
    expect(fate(trail)).toBe('circle')
  })

  it('a leaf in the source flies straight out, speeding up (r = r₀·eᵗ), and leaves the picture', () => {
    const p0 = { x: 0.4, y: 0.3 }
    const trail = flow(source, p0)
    const r0 = Math.hypot(p0.x, p0.y)
    trail.forEach((p, k) => {
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(r0 * Math.exp(k * DT), 5)
      expect(p.y / p.x).toBeCloseTo(p0.y / p0.x, 8) // a straight line through the middle
      if (k) expect(speed(source, p)).toBeGreaterThan(speed(source, trail[k - 1]))
    })
    const last = trail[trail.length - 1]
    expect(Math.max(Math.abs(last.x), Math.abs(last.y))).toBeGreaterThan(FR)
    expect(trail.length).toBeLessThan(60) // gone well before a lap's worth of time
    expect(fate(trail)).toBe('out')
    expect(fate([...trail].reverse())).toBe('in')
  })

  it('a whirl leaf dropped near a corner slips off the floor and comes back round', () => {
    const trail = flow(whirl, { x: 2.5, y: 2.5 })
    const lap = Math.round((2 * Math.PI) / DT)
    expect(trail.length).toBeGreaterThan(lap)
    expect(trail.some((p) => Math.abs(p.y) > FR)).toBe(true)
    expect(trail[lap].x).toBeCloseTo(2.5, 1)
  })

  it('names the three mistakes', () => {
    expect(Object.keys(FIELD_LABELS)).toEqual(['field-arrows-are-paths', 'whirl-spirals-in', 'field-length-ignored'])
  })
})
