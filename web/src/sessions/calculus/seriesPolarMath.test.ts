import { describe, expect, it } from 'vitest'
import { angleOf, deg, flipped, negativeSpans, petalsDrawn, point, r, rad, TAU, trace } from './polarMath'
import { groups, groupSum, harmonic, MAX_TERMS, partialSum, partialSums, SERIES, term as sterm } from './seriesMath'
import { gap, goodRadius, MAX_TERMS as TAYLOR_TERMS, target, taylor, term, termText, TOL, X_MAX } from './taylorMath'

describe('Taylor polynomials of sin x', () => {
  it('the terms are x, −x³/6, x⁵/120, …', () => {
    expect(term(2, 0)).toBe(2)
    expect(term(2, 1)).toBeCloseTo(-8 / 6, 12)
    expect(term(2, 2)).toBeCloseTo(32 / 120, 12)
    expect(taylor(2, 3)).toBeCloseTo(2 - 8 / 6 + 32 / 120, 12)
    expect(termText(4)).toEqual(['x', '− x³/6', '+ x⁵/120', '− x⁷/5040'])
    expect(termText(5)[4]).toBe('+ x⁹/9!')
    expect(termText(TAYLOR_TERMS)).toHaveLength(8)
  })

  it('more terms hug the curve further out, but 8 terms still drift off before x = 7', () => {
    expect(taylor(0, 5)).toBe(0)
    expect(goodRadius(1)).toBeCloseTo(0.85, 1)
    expect(goodRadius(3)).toBeCloseTo(2.45, 1)
    expect(goodRadius(8)).toBeGreaterThan(6)
    expect(goodRadius(8)).toBeLessThan(X_MAX)
    for (let n = 1; n < TAYLOR_TERMS; n++) expect(goodRadius(n + 1)).toBeGreaterThan(goodRadius(n))
    // inside the radius the gap is at most TOL, just past it more
    expect(gap(goodRadius(3), 3)).toBeLessThanOrEqual(TOL)
    expect(gap(goodRadius(3) + 0.05, 3)).toBeGreaterThan(TOL)
  })

  it('far from the centre an extra term can make it worse: at x = 7, 1 term is off by 6, 2 terms by 50', () => {
    expect(target(7)).toBeCloseTo(Math.sin(7), 12)
    expect(gap(7, 1)).toBeCloseTo(6.34, 2)
    expect(gap(7, 2)).toBeCloseTo(50.8, 1)
    expect(gap(7, 8)).toBeCloseTo(0.57, 2)
  })
})

describe('does it add up?', () => {
  it('halving: terms 1, 1/2, 1/4; the stack closes in on 2 and never passes it', () => {
    expect([1, 2, 3].map((k) => sterm('geometric', k))).toEqual([1, 0.5, 0.25])
    expect(partialSums('geometric', 3)).toEqual([1, 1.5, 1.75])
    expect(partialSum('geometric', MAX_TERMS)).toBeCloseTo(2, 9)
    for (let n = 1; n <= 50; n++) expect(partialSum('geometric', n)).toBeLessThan(2)
    expect(SERIES.geometric.limit).toBe(2)
  })

  it('harmonic: terms 1, 1/2, 1/3 shrink to nothing, but the stack keeps climbing past any height', () => {
    expect([1, 2, 3].map((k) => sterm('harmonic', k))).toEqual([1, 0.5, 1 / 3])
    expect(partialSums('harmonic', 3)).toEqual([1, 1.5, 1.5 + 1 / 3])
    expect(partialSum('harmonic', MAX_TERMS)).toBeCloseTo(4.68, 2)
    expect(harmonic(1000)).toBeCloseTo(7.49, 2)
    expect(harmonic(1_000_000)).toBeCloseTo(14.39, 2)
    expect(SERIES.harmonic.limit).toBeNull()
    expect(sterm('harmonic', 1000)).toBeLessThan(0.002)
  })

  it('grouping the harmonic terms in blocks of 1, 2, 4, 8, … every block adds more than 1/2', () => {
    expect(groups(16)).toEqual([[2, 2], [3, 4], [5, 8], [9, 16]])
    expect(groups(60)).toEqual([[2, 2], [3, 4], [5, 8], [9, 16], [17, 32], [33, 60]])
    for (const g of groups(32)) expect(groupSum('harmonic', g)).toBeGreaterThanOrEqual(0.5)
    expect(groupSum('harmonic', [3, 4])).toBeCloseTo(1 / 3 + 1 / 4, 12)
  })
})

describe('the rose r = cos 3θ', () => {
  it('r is 1 at θ = 0, 0 at 30°, −1 at 60° (the dot flips to the 240° side)', () => {
    expect(r(0)).toBe(1)
    expect(r(rad(30))).toBeCloseTo(0, 12)
    expect(r(rad(60))).toBeCloseTo(-1, 12)
    expect(flipped(rad(60))).toBe(true)
    expect(flipped(rad(120))).toBe(false)
    const p = point(rad(60))
    const q = point(rad(240))
    expect(p.x).toBeCloseTo(q.x, 12) // the same spot, reached twice
    expect(p.y).toBeCloseTo(q.y, 12)
    expect(deg(angleOf(p.x, p.y))).toBeCloseTo(240, 9)
  })

  it('r is negative on three 60° spans, so the sweep retraces: 3 petals, done by 210°', () => {
    expect(negativeSpans()).toEqual([[30, 90], [150, 210], [270, 330]])
    expect(petalsDrawn(0)).toBe(0)
    expect(petalsDrawn(rad(89))).toBe(0)
    expect(petalsDrawn(rad(90))).toBe(1)
    expect(petalsDrawn(rad(150))).toBe(2)
    expect(petalsDrawn(rad(210))).toBe(3)
    expect(petalsDrawn(TAU)).toBe(3)
    // the second half-turn adds no new points: every point of the trace from π to 2π is on the trace from 0 to π
    const first = trace(Math.PI)
    for (const p of trace(TAU).slice(180)) expect(first.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 0.02)).toBe(true)
  })

  it('angleOf reads a pointer into [0, 2π)', () => {
    expect(angleOf(1, 0)).toBe(0)
    expect(angleOf(0, 1)).toBeCloseTo(Math.PI / 2, 12)
    expect(angleOf(0, -1)).toBeCloseTo((3 * Math.PI) / 2, 12)
    expect(angleOf(-1, 0)).toBeCloseTo(Math.PI, 12)
  })
})
