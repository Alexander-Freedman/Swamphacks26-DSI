import { describe, expect, it } from 'vitest'
import { type Pt, pathLength, resample, toScreen, toWorld } from './geometry'

describe('resample', () => {
  it('spaces points evenly and keeps the ends', () => {
    const l: Pt[] = [
      [0, 0],
      [0.1, 0],
      [1, 0],
      [1, -1],
    ]
    const r = resample(l, 21)
    expect(r).toHaveLength(21)
    expect(r[0]).toEqual([0, 0])
    expect(r[20][0]).toBeCloseTo(1)
    expect(r[20][1]).toBeCloseTo(-1)
    expect(r[10][0]).toBeCloseTo(1)
    expect(r[10][1]).toBeCloseTo(0)
    expect(pathLength(r)).toBeCloseTo(2)
  })
})

describe('view transform', () => {
  it('round-trips', () => {
    const v = { x0: -0.5, x1: 1.5, y0: -1, y1: 0.3, w: 800, h: 520 }
    const p: Pt = [0.37, -0.42]
    const [x, y] = toWorld(v, toScreen(v, p))
    expect(x).toBeCloseTo(p[0])
    expect(y).toBeCloseTo(p[1])
  })
})
