import { describe, expect, it } from 'vitest'
import { pathLength } from './geometry'
import { arcLength, fallTime, landingX, position, truthPath } from './offTheEdge'

describe('Off the Edge physics', () => {
  // Checked by hand: t = sqrt(2h/g), x = v t.
  const cases = [
    { v: 1.2, h: 0.9, g: 9.81, t: 0.42835, x: 0.51402 },
    { v: 2.0, h: 0.8, g: 9.81, t: 0.40387, x: 0.80773 },
    { v: 0.5, h: 1.0, g: 9.81, t: 0.45152, x: 0.22576 },
  ]

  for (const c of cases) {
    it(`v=${c.v} h=${c.h}`, () => {
      expect(fallTime(c)).toBeCloseTo(c.t, 4)
      expect(landingX(c)).toBeCloseTo(c.x, 4)
      const [, y] = position(c, fallTime(c))
      expect(y).toBeCloseTo(-c.h, 6)
    })
  }

  it('closed-form arc length matches the sampled path', () => {
    const p = cases[0]
    expect(arcLength(p, fallTime(p))).toBeCloseTo(pathLength(truthPath(p, 2000)), 4)
  })

  it('doubling v doubles range but not fall time', () => {
    const a = cases[0]
    const b = { ...a, v: a.v * 2 }
    expect(fallTime(b)).toBe(fallTime(a))
    expect(landingX(b)).toBeCloseTo(2 * landingX(a), 9)
  })
})
