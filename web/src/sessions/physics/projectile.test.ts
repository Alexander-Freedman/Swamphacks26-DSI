import { describe, expect, it } from 'vitest'
import { at, fallTime, flightTime, G, range, topSpeed } from './projectile'

describe('projectile motion', () => {
  it('a ball fired sideways lands at the same time as a dropped one', () => {
    const h = 20
    const T = fallTime(h)
    expect(T).toBeCloseTo(Math.sqrt(40 / G), 10)
    expect(flightTime(12, 0, h)).toBeCloseTo(T, 10)
    expect(at(12, 0, T, h).y).toBeCloseTo(0, 10)
  })

  it('range from the ground is v² sin 2θ / g, farthest at 45°, and 30° = 60°', () => {
    expect(range(20, 45)).toBeCloseTo((20 * 20) / G, 8)
    expect(range(20, 30)).toBeCloseTo(range(20, 60), 8)
    for (const d of [20, 30, 40, 50, 60, 75]) expect(range(20, d)).toBeLessThan(range(20, 45))
  })

  it('at the top only the sideways speed is left', () => {
    const v = 20
    const d = 60
    const tTop = (v * Math.sin((d * Math.PI) / 180)) / G
    const dt = 1e-6
    const vx = (at(v, d, tTop + dt).x - at(v, d, tTop).x) / dt
    const vy = (at(v, d, tTop + dt).y - at(v, d, tTop - dt).y) / (2 * dt)
    expect(vy).toBeCloseTo(0, 3)
    expect(vx).toBeCloseTo(topSpeed(v, d), 3)
  })
})
