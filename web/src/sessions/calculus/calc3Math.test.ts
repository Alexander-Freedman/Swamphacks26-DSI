import { describe, expect, it } from 'vitest'
import { ARROWS, atTop, climb, grad, gx, gy, gz, len, START, walk } from './gradientMath'
import { fx, fy, fz, HILL } from './surfaceMath'
import { COARSE, columns, columnSum, EXACT, GRIDS, readVolume, ROOF, VX, VY, vz } from './volumeMath'

// central difference, to check every hand-written partial derivative
const d = (f: (x: number, y: number) => number, x: number, y: number, along: 'x' | 'y', h = 1e-5) =>
  along === 'x' ? (f(x + h, y) - f(x - h, y)) / (2 * h) : (f(x, y + h) - f(x, y - h)) / (2 * h)

describe('Calc 3 surfaces', () => {
  it('every partial derivative matches the surface it belongs to', () => {
    for (const [s, x, y] of [[HILL, 1, -1], [HILL, -2, 0.5], [ROOF, 1, 1], [ROOF, 2.5, 0.3]] as const) {
      expect(s.zx(x, y)).toBeCloseTo(d(s.z, x, y, 'x'), 6)
      expect(s.zy(x, y)).toBeCloseTo(d(s.z, x, y, 'y'), 6)
    }
    for (const [x, y] of [[2, 1], [-1, 0.4], [0.3, -2]]) {
      expect(gx(x, y)).toBeCloseTo(d(gz, x, y, 'x'), 6)
      expect(gy(x, y)).toBeCloseTo(d(gz, x, y, 'y'), 6)
    }
    expect(HILL.zx).toBe(fx)
    expect(HILL.zy).toBe(fy)
    expect(HILL.z).toBe(fz)
  })
})

describe('the gradient', () => {
  it('at the start: ∇f = (−0.55, −1.10), length 1.23', () => {
    const g = grad(START)
    expect(g.x).toBeCloseTo(-0.552, 3)
    expect(g.y).toBeCloseTo(-1.104, 3)
    expect(len(g)).toBeCloseTo(1.234, 3)
  })

  it('of the three arrows, B (the gradient) climbs fastest, A (at the top) slower, C not at all', () => {
    const [a, b, c] = ARROWS.map((r) => climb(START, r.dir))
    expect(ARROWS.map((r) => r.id)).toEqual(['top', 'grad', 'level'])
    expect(b).toBeCloseTo(len(grad(START)), 9) // climbing along the gradient = its length
    expect(a).toBeCloseTo(0.987, 3)
    expect(a).toBeLessThan(b)
    expect(c).toBeCloseTo(0, 9)
    // and no direction at all beats the gradient
    for (let k = 0; k < 360; k += 5) expect(climb(START, { x: Math.cos((k * Math.PI) / 180), y: Math.sin((k * Math.PI) / 180) })).toBeLessThanOrEqual(b + 1e-9)
  })

  it('"straight at the top" and "steepest" really point different ways here (about 37° apart)', () => {
    const [top, g] = ARROWS
    const angle = (Math.acos(top.dir.x * g.dir.x + top.dir.y * g.dir.y) * 180) / Math.PI
    expect(angle).toBeCloseTo(36.87, 1)
  })

  it('walking along the arrow climbs every step, the arrow shrinks, and it reaches the top', () => {
    let p = START
    let steps = 0
    while (!atTop(p) && steps < 50) {
      const q = walk(p)
      expect(gz(q.x, q.y)).toBeGreaterThan(gz(p.x, p.y))
      expect(len(grad(q))).toBeLessThan(len(grad(p)))
      p = q
      steps++
    }
    expect(atTop(p)).toBe(true)
    expect(steps).toBeGreaterThanOrEqual(5)
    expect(steps).toBeLessThanOrEqual(10)
    expect(gz(p.x, p.y)).toBeGreaterThan(2.95)
  })

  it('the path curves: it reaches the ridge (y ≈ 0) while still far from the top in x', () => {
    let p = START
    for (let i = 0; i < 2; i++) p = walk(p)
    expect(Math.abs(p.y)).toBeLessThan(0.1)
    expect(p.x).toBeGreaterThan(1)
  })
})

describe('volume under a surface', () => {
  it('the roof is 2 at the origin corner and 0 at the far corner', () => {
    expect(vz(0, 0)).toBe(2)
    expect(vz(VX, VY)).toBeCloseTo(0, 12)
  })

  it('2 × 2 columns give 10.5; the exact volume is 8', () => {
    expect(COARSE).toBeCloseTo(10.5, 12)
    expect(columnSum(4)).toBeCloseTo(9.375, 12)
    // the closed form from the comment, checked against a fine midpoint sum
    let mid = 0
    const m = 400
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) mid += vz(((i + 0.5) * VX) / m, ((j + 0.5) * VY) / m)
    expect((mid * VX * VY) / m ** 2).toBeCloseTo(EXACT, 4)
  })

  it('more columns, less volume: the sum only shrinks toward 8, never below', () => {
    const sums = GRIDS.map(columnSum)
    for (let i = 1; i < sums.length; i++) expect(sums[i]).toBeLessThan(sums[i - 1])
    for (const s of sums) expect(s).toBeGreaterThan(EXACT)
    expect(sums[sums.length - 1] - EXACT).toBeLessThan(0.2)
  })

  it('the columns add up to the sum', () => {
    const cols = columns(6)
    expect(cols).toHaveLength(36)
    expect(cols.reduce((s, [, , w, dp, h]) => s + w * dp * h, 0)).toBeCloseTo(columnSum(6), 12)
  })

  it('a guess at or above the 2 × 2 sum is "more columns = more volume"; within 15% is close', () => {
    expect(readVolume(11)).toMatchObject({ mistake: 'more-columns-more-volume', close: false })
    expect(readVolume(10.3).mistake).toBe('more-columns-more-volume')
    expect(readVolume(8.9)).toMatchObject({ mistake: null, close: true })
    expect(readVolume(4)).toMatchObject({ mistake: null, close: false, gap: -4 })
  })
})
