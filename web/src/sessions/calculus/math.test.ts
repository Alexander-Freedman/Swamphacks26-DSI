import { describe, expect, it } from 'vitest'
import {
  coverage, exactArea, f, F, FLAT, fmt, fPrime, mastered, nToSlider, ONE_RECT, readArea, readSketch, resample,
  riemann, sliderToN, slopeTruth, heightTruth, STEEPEST_DOWN, xs,
} from './math'

describe('calculus math', () => {
  it("f' matches a numeric derivative everywhere on [0, 4]", () => {
    const h = 1e-5
    for (let x = 0; x <= 4; x += 0.1) expect(fPrime(x)).toBeCloseTo((f(x + h) - f(x - h)) / (2 * h), 6)
  })

  it('slope is 0 at the hill and the valley, most negative at x = 2', () => {
    for (const x of FLAT) expect(fPrime(x)).toBeCloseTo(0, 12)
    expect(STEEPEST_DOWN.slope).toBe(-1.5)
    for (let x = 0; x <= 4; x += 0.01) expect(fPrime(x)).toBeGreaterThanOrEqual(-1.5)
    expect(f(1)).toBe(3)
    expect(f(3)).toBe(1)
  })

  it("F' = f, and the exact area is F(b) − F(a)", () => {
    const h = 1e-5
    for (let x = 0; x <= 4; x += 0.25) expect((F(x + h) - F(x - h)) / (2 * h)).toBeCloseTo(f(x), 6)
    expect(exactArea(0, 4)).toBe(8)
    expect(exactArea(1, 3)).toBe(4)
    expect(exactArea()).toBeCloseTo(4.5703125, 10)
  })

  it('Riemann sums converge to the exact integral', () => {
    const exact = exactArea()
    expect(ONE_RECT).toBe(7.5)
    expect(riemann(20000, 'left')).toBeCloseTo(exact, 3)
    expect(riemann(2000, 'mid')).toBeCloseTo(exact, 5)
    // error shrinks as n grows: left ~ 1/n, midpoint ~ 1/n²
    let prevL = Infinity
    let prevM = Infinity
    for (const n of [1, 2, 4, 8, 16, 32, 64, 128, 200]) {
      const eL = Math.abs(riemann(n, 'left') - exact)
      const eM = Math.abs(riemann(n, 'mid') - exact)
      expect(eL).toBeLessThan(prevL)
      expect(eM).toBeLessThan(prevM)
      prevL = eL
      prevM = eM
    }
    expect(Math.abs(riemann(200, 'left') - exact)).toBeLessThan(0.02)
    expect(Math.abs(riemann(200, 'mid') - exact)).toBeLessThan(0.0001)
    // on this stretch more rectangles means LESS area, not more
    expect(riemann(200, 'left')).toBeLessThan(riemann(1, 'left'))
  })

  it('the n slider runs 1 → 200 and round-trips', () => {
    expect(sliderToN(0)).toBe(1)
    expect(sliderToN(100)).toBe(200)
    for (const n of [1, 5, 20, 100, 200]) expect(sliderToN(nToSlider(n))).toBeGreaterThanOrEqual(n - 2)
  })

  it('resamples a stroke and measures coverage', () => {
    expect(resample([])).toBeNull()
    const s = resample([{ x: 3, y: 2 }, { x: 1, y: 0 }])!
    expect(s).toHaveLength(xs.length)
    expect(s[0]).toBe(0) // held before the stroke starts
    expect(s[s.length - 1]).toBe(2) // held after it ends
    expect(s[20]).toBeCloseTo(1) // x = 2, halfway
    expect(coverage([{ x: 1, y: 0 }, { x: 3, y: 0 }])).toBe(0.5)
    expect(coverage([{ x: -1, y: 0 }, { x: 9, y: 0 }])).toBe(1)
  })

  it('reads the slope sketch by shape', () => {
    expect(readSketch(slopeTruth).mistake).toBeNull()
    // drawn too tall and shifted up a little: still the right shape
    expect(readSketch(slopeTruth.map((v) => v * 1.4 + 0.3)).mistake).toBeNull()
    // tracing the curve itself instead of its slope
    expect(readSketch(heightTruth).mistake).toBe('slope-is-height')
    expect(readSketch(heightTruth.map((v) => v + 1)).mistake).toBe('slope-is-height')
    // steepness without sign
    expect(readSketch(slopeTruth.map(Math.abs)).mistake).toBe('slope-never-negative')
    // upside down
    expect(readSketch(slopeTruth.map((v) => -v)).mistake).toBe('slope-sign-flipped')
    // a flat line says nothing about the turns
    expect(readSketch(xs.map(() => -0.5)).mistake).toBe('slope-misses-the-turns')
  })

  it('reads the area guess', () => {
    expect(readArea(4.6)).toMatchObject({ mistake: null, close: true })
    expect(readArea(9).mistake).toBe('more-rectangles-more-area')
    expect(readArea(7.5).mistake).toBe('more-rectangles-more-area')
    expect(readArea(2)).toMatchObject({ mistake: null, close: false })
    expect(mastered(readSketch(slopeTruth), readArea(4.5))).toBe(true)
    expect(mastered(readSketch(heightTruth), readArea(4.5))).toBe(false)
    expect(mastered(readSketch(slopeTruth), readArea(8))).toBe(false)
  })

  it('never prints -0.00', () => {
    expect(fmt(fPrime(1))).toBe('0.00')
    expect(fmt(-0.0001)).toBe('0.00')
    expect(fmt(-1.5)).toBe('-1.50')
  })
})
