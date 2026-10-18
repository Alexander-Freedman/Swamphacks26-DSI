import { describe, expect, it } from 'vitest'
import { atBest, BEST, CUTS, FLAT_X, V, V_BEST, Vp } from './boxMath'
import { chain2, F1, f1, f2, G1, g1, g2, isStill, STILL } from './chainMath'
import { A, hole, jump, limitOf, valueAt, walkers, zoomToWidth } from './limitMath'
import { ASK_X, compare, L, SAME_X, top, topFaster, topSpeed } from './ladderMath'

const d = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h)

describe('what a limit is', () => {
  it('the hole is x + 2 everywhere but at 2, where there is nothing', () => {
    expect(hole(1.9)).toBeCloseTo(3.9, 9)
    expect(hole(2.001)).toBeCloseTo(4.001, 9)
    expect(Number.isNaN(hole(A))).toBe(true)
    expect(limitOf('hole')).toBe(4)
    expect(valueAt('hole')).toBeNull()
  })

  it('the jump heads for 4 from the left and 5 from the right: no limit, but a value of 5', () => {
    expect(jump(1.99)).toBeCloseTo(3.99, 9)
    expect(jump(2)).toBe(5)
    expect(limitOf('jump')).toBeNull()
    expect(valueAt('jump')).toBe(5)
  })

  it('zooming in brings both walkers to the same height on the hole, and 1 apart on the jump', () => {
    expect(zoomToWidth(0)).toBe(2)
    expect(zoomToWidth(100)).toBeCloseTo(0.002, 9)
    const far = walkers('hole', 0)
    const near = walkers('hole', 100)
    expect(Math.abs(far.yl - far.yr)).toBeGreaterThan(2)
    expect(Math.abs(near.yl - near.yr)).toBeLessThan(0.01)
    expect(near.yl).toBeCloseTo(4, 2)
    const j = walkers('jump', 100)
    expect(j.yr - j.yl).toBeCloseTo(1, 2)
  })
})

describe('the chain rule', () => {
  it('straight lines: 1 of x is 2 of u is 6 of y', () => {
    expect(g1(1) - g1(0)).toBe(G1)
    expect(f1(1) - f1(0)).toBe(F1)
    expect(f1(g1(1)) - f1(g1(0))).toBe(G1 * F1)
  })

  it('y = sin(x²): dy/dx = cos(x²) · 2x, checked against a finite difference', () => {
    for (const x of [0.3, 1, 1.5, 1.9]) expect(chain2(x)).toBeCloseTo(d((t) => f2(g2(t)), x), 6)
  })

  it('y stands still at x = √(π/2), where the outer rate is 0 while the inner is not', () => {
    expect(chain2(STILL)).toBeCloseTo(0, 9)
    expect(isStill(STILL)).toBe(true)
    expect(isStill(STILL + 0.03)).toBe(true)
    expect(isStill(0)).toBe(false) // the inner rate is 0 there; a different reason
    expect(isStill(1)).toBe(false)
  })
})

describe('maximums and minimums', () => {
  it("the box's volume and slope, and where the slope is 0", () => {
    expect(V(2)).toBe(128)
    expect(V_BEST).toBe(128)
    for (const x of [0.5, 2, 3.7, 5]) expect(Vp(x)).toBeCloseTo(d(V, x), 5)
    for (const x of FLAT_X) expect(Vp(x)).toBeCloseTo(0, 12)
    expect(V(6)).toBe(0)
  })

  it('of the three cuts, 2 gives the biggest box, and nothing beats it', () => {
    const best = CUTS.reduce((a, b) => (V(b) > V(a) ? b : a))
    expect(best).toBe(BEST)
    for (let x = 0; x <= 6; x += 0.01) expect(V(x)).toBeLessThanOrEqual(V_BEST + 1e-9)
    expect(atBest(2.1)).toBe(true)
    expect(atBest(2.4)).toBe(false)
  })
})

describe('related rates: the ladder', () => {
  it('foot 3 out, top 4 up, top falling at 0.75 m/s: slower than the foot', () => {
    expect(top(ASK_X)).toBe(4)
    expect(topSpeed(ASK_X)).toBeCloseTo(0.75, 9)
    expect(compare(ASK_X)).toBe('slower')
  })

  it("the top's speed is −dy/dt from x² + y² = L², checked against a finite difference", () => {
    // foot at x(t) = t, so dy/dt = d/dt √(L² − t²)
    for (const x of [1, 2.5, 4, 4.8]) expect(topSpeed(x)).toBeCloseTo(-d(top, x), 5)
  })

  it('same speed at L/√2, faster beyond it, and racing away as the top nears the floor', () => {
    expect(SAME_X).toBeCloseTo(3.5355, 3)
    expect(compare(SAME_X)).toBe('same')
    expect(topFaster(3.4)).toBe(false)
    expect(topFaster(3.7)).toBe(true)
    expect(topSpeed(4.99)).toBeGreaterThan(10)
    expect(topFaster(L)).toBe(false) // the ladder is flat on the floor: nothing to fall
  })
})
