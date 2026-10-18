import { describe, expect, it } from 'vitest'
import { bot, BOT_ONLY, CROSSINGS, EXACT as ENCLOSED, gap, N_DONE, N_MAX, readArea, stripsOf, stripSum as enclosedSum, top, TOP_ONLY } from './enclosedMath'
import { ASK, ASK_PROFILE, curveProfile, discProfile, discs, discSum, discVolume, DISCS, EXACT as VOLUME, ONE_DISC, r, readDisc, RX } from './revolutionMath'
import { A, baseWidth, dg, EXACT as USUB, g, messy, morphHeight, peak, readStretch, simple, strips, stripSum as usubSum, U1, warp } from './usubMath'

// trapezoid rule, to check the hand-written integrals
const integral = (f: (x: number) => number, a: number, b: number, n = 4000) => {
  let s = (f(a) + f(b)) / 2
  for (let i = 1; i < n; i++) s += f(a + ((b - a) * i) / n)
  return (s * (b - a)) / n
}

describe('u-substitution', () => {
  it('the messy integral in x and the simple one in u are the same number, 1', () => {
    expect(g(A)).toBeCloseTo(U1, 12)
    expect(integral(messy, 0, A)).toBeCloseTo(USUB, 5)
    expect(integral(simple, 0, U1)).toBeCloseTo(USUB, 5)
    // du = 2x dx: the messy integrand is the simple one times the stretch factor
    for (const x of [0.2, 0.7, 1.1]) expect(messy(x)).toBeCloseTo(simple(g(x)) * dg(x), 12)
  })

  it('the stretch goes from x itself (t = 0) to u = x² (t = 1)', () => {
    for (const x of [0, 0.3, 0.9, A]) {
      expect(warp(x, 0)).toBeCloseTo(x, 12)
      expect(warp(x, 1)).toBeCloseTo(g(x), 12)
    }
    expect(baseWidth(0)).toBeCloseTo(A, 12)
    expect(baseWidth(1)).toBeCloseTo(U1, 12)
    expect(baseWidth(0.5)).toBeGreaterThan(A)
    expect(baseWidth(0.5)).toBeLessThan(U1)
  })

  it('the morphing curve is the messy one at t = 0, cos(u) at t = 1, and keeps the area 1 in between', () => {
    for (const x of [0.1, 0.5, 1, A]) {
      expect(morphHeight(x, 0)).toBeCloseTo(messy(x), 12)
      expect(morphHeight(x, 1)).toBeCloseTo(simple(g(x)), 12)
    }
    expect(morphHeight(0, 0)).toBe(0)
    expect(morphHeight(0, 1)).toBe(1)
    expect(peak(0)).toBeCloseTo(1.28, 2)
    expect(peak(1)).toBeCloseTo(1, 6)
    expect(peak(0.5)).toBeLessThan(peak(0))
    // ∫ height dw with w = x^p: substitute back, dw = p x^(p−1) dx
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const p = 1 + t
      expect(integral((x) => morphHeight(x, t) * p * Math.pow(x, p - 1), 0, A, 20000)).toBeCloseTo(1, 3)
    }
  })

  it('every strip keeps its area as the axis stretches, so the total stays 1', () => {
    const at0 = strips(0)
    for (const t of [0, 0.3, 0.6, 1]) {
      const s = strips(t)
      expect(s).toHaveLength(10)
      expect(usubSum(t)).toBeCloseTo(1, 10)
      s.forEach(([w0, width, height], i) => {
        expect(width * height).toBeCloseTo(at0[i][1] * at0[i][2], 10)
        expect(width).toBeGreaterThan(0)
        if (i) expect(w0).toBeCloseTo(s[i - 1][0] + s[i - 1][1], 10)
      })
    }
    // at t = 1 the strips are the strips under cos(u), and the stretch factor 2x shows: the first ones narrower, the last ones wider
    const u = strips(1)
    expect(u[0][1]).toBeLessThan(at0[0][1])
    expect(u[9][1]).toBeGreaterThan(at0[9][1])
    expect(u[9][0] + u[9][1]).toBeCloseTo(U1, 10)
  })

  it('bigger and smaller are both "the stretch changes the area"', () => {
    expect(readStretch('same')).toBeNull()
    expect(readStretch('bigger')).toBe('usub-changes-area')
    expect(readStretch('smaller')).toBe('usub-changes-area')
  })
})

describe('area enclosed by two curves', () => {
  it('the line is on top between the crossings, and the exact area is 9/2', () => {
    for (const x of CROSSINGS) expect(top(x)).toBeCloseTo(bot(x), 12)
    for (let x = -0.99; x < 2; x += 0.01) expect(gap(x)).toBeGreaterThan(0)
    expect(gap(-1.2)).toBeLessThan(0)
    expect(gap(2.2)).toBeLessThan(0)
    expect(integral(gap, -1, 2)).toBeCloseTo(ENCLOSED, 6)
    expect(integral(top, -1, 2)).toBeCloseTo(TOP_ONLY, 6)
    expect(integral(bot, -1, 2)).toBeCloseTo(BOT_ONLY, 6)
    expect(TOP_ONLY - BOT_ONLY).toBe(ENCLOSED)
  })

  it('strips reach from the parabola up to the line, and their total shrinks onto 9/2', () => {
    const s = stripsOf(3)
    expect(s).toHaveLength(3)
    expect(s[0]).toEqual([-1, 1, bot(-0.5), top(-0.5)])
    expect(s[2][0] + s[2][1]).toBeCloseTo(2, 12)
    let prev = Infinity
    for (const n of [1, 2, 4, 8, 16, 32, 64, N_MAX]) {
      const sum = enclosedSum(n)
      expect(sum).toBeGreaterThan(ENCLOSED)
      expect(sum).toBeLessThan(prev)
      prev = sum
    }
    expect(enclosedSum(1)).toBe(6.75)
    expect(Math.abs(enclosedSum(N_DONE) - ENCLOSED)).toBeLessThan(0.01)
    expect(enclosedSum(5000)).toBeCloseTo(ENCLOSED, 6)
  })

  it('only "the area under the top curve" is a named idea', () => {
    expect(readArea('minus')).toBeNull()
    expect(readArea('top')).toBe('enclosed-top-only')
    expect(readArea('plus')).toBeNull()
  })
})

describe('volumes of revolution', () => {
  it('the solid is 8π, and discs as wide as their right edge overshoot by exactly 1/n of it', () => {
    expect(integral((x) => Math.PI * r(x) * r(x), 0, RX)).toBeCloseTo(VOLUME, 6)
    expect(ONE_DISC).toBeCloseTo(16 * Math.PI, 10)
    for (const n of DISCS) expect(discSum(n)).toBeCloseTo(VOLUME * (1 + 1 / n), 10)
    expect(Math.abs(discSum(64) - VOLUME)).toBeLessThan(0.02 * VOLUME)
    const d = discs(4)
    expect(d).toHaveLength(4)
    expect(d[3]).toEqual([3, 1, 2])
    expect(d[0][2]).toBeCloseTo(1, 12)
  })

  it('the disc in the question is 1 thick with radius 2: π · 2² · 1', () => {
    expect(ASK).toEqual({ x0: 3, dx: 1, radius: 2 })
    expect(ASK_PROFILE).toEqual([[3, 0], [3, 2], [4, 2], [4, 0]])
    expect(discVolume(ASK.radius, ASK.dx)).toBeCloseTo(4 * Math.PI, 12)
    expect(discVolume(ASK.radius, ASK.dx)).not.toBeCloseTo(Math.PI * ASK.radius * ASK.dx, 1)
    expect(readDisc('squared')).toBeNull()
    expect(readDisc('linear')).toBe('disc-radius-not-squared')
    expect(readDisc('strip')).toBeNull()
  })

  it('the outlines run from the axis at 0, along the curve or the disc rims, back down to the axis at 4', () => {
    const c = curveProfile(10)
    expect(c[0]).toEqual([0, 0])
    expect(c[c.length - 1]).toEqual([RX, 0])
    expect(c[c.length - 2]).toEqual([RX, 2])
    for (let i = 1; i < c.length - 1; i++) expect(c[i][1]).toBeCloseTo(r(c[i][0]), 12)
    const d = discProfile(2)
    expect(d).toEqual([[0, 0], [0, r(2)], [2, r(2)], [2, 2], [4, 2], [4, 0]])
  })
})
