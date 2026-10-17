import { describe, expect, it } from 'vitest'
import {
  BOX, CHORD, classifyArea, classifySketch, corr, coverage, df, exactArea, f, g, hFromSlider, position, rects, resample,
  riemann, secantSlope, secantSlopeF, speed, tangent, xsFor,
} from './math'

describe('derivative and tangent', () => {
  it("f' is the exact derivative of f (central differences agree)", () => {
    for (const x of [-2, -1.3, 0, 0.5, 1, 1.9]) {
      const num = (f(x + 1e-5) - f(x - 1e-5)) / 2e-5
      expect(num).toBeCloseTo(df(x), 6)
    }
    expect(df(-1)).toBe(0)
    expect(df(1)).toBe(0)
  })

  it('the secant slope closes on the tangent slope as h shrinks', () => {
    const x = 1.5
    const gaps = [1, 0.1, 0.01, 0.001].map((h) => Math.abs(secantSlope(f, x, h) - df(x)))
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeLessThan(gaps[i - 1])
    expect(gaps[3]).toBeLessThan(0.002)
  })

  it('the closed-form secant matches the definition', () => {
    for (const [x, h] of [[0.3, 0.7], [-1.2, 1.5], [1.9, 0.001]]) expect(secantSlopeF(x, h)).toBeCloseTo(secantSlope(f, x, h), 9)
  })

  it('the tangent touches the curve and has slope f\'(x)', () => {
    const t = tangent(f, df, 0.5)
    expect(t.at(0.5)).toBeCloseTo(f(0.5), 12)
    expect(t.at(1.5) - t.at(0.5)).toBeCloseTo(df(0.5), 12)
  })

  it('the h slider runs 2 → 0.001', () => {
    expect(hFromSlider(0)).toBeCloseTo(2, 9)
    expect(hFromSlider(100)).toBeCloseTo(0.001, 6)
  })
})

describe('Riemann sums vs the exact integral', () => {
  it('∫₀² x² = 8/3', () => expect(exactArea()).toBeCloseTo(8 / 3, 12))

  it('left sums under, right sums over, for an increasing curve', () => {
    for (const n of [1, 4, 10, 100]) {
      expect(riemann(g, 0, 2, n, 'left')).toBeLessThan(exactArea())
      expect(riemann(g, 0, 2, n, 'right')).toBeGreaterThan(exactArea())
    }
    expect(riemann(g, 0, 2, 1, 'left')).toBe(0)
    expect(riemann(g, 0, 2, 1, 'right')).toBe(8)
  })

  it('error shrinks like 1/n (left/right) and 1/n² (mid), exactly', () => {
    // for x² on [0,2]: left = 8/3 - 4/n + 4/(3n²), mid = 8/3 - 2/(3n²)
    for (const n of [1, 3, 10, 100]) {
      expect(riemann(g, 0, 2, n, 'left')).toBeCloseTo(8 / 3 - 4 / n + 4 / (3 * n * n), 10)
      expect(riemann(g, 0, 2, n, 'mid')).toBeCloseTo(8 / 3 - 2 / (3 * n * n), 10)
    }
  })

  it('rectangles add up to the sum', () => {
    const r = rects(g, 0, 2, 7, 'mid')
    expect(r).toHaveLength(7)
    expect(r.reduce((s, q) => s + q.w * q.h, 0)).toBeCloseTo(riemann(g, 0, 2, 7, 'mid'), 12)
  })

  it('names the tempting area guesses', () => {
    expect(BOX).toBe(8)
    expect(CHORD).toBe(4)
    expect(classifyArea(2.7)).toBeNull()
    expect(classifyArea(8)).toBe('whole-box')
    expect(classifyArea(4)).toBe('straight-line')
    expect(classifyArea(1)).toBeNull()
  })
})

describe('motion: speed is the slope of position', () => {
  it('position is the integral of speed', () => {
    for (const t of [0.5, 2, 3.7]) {
      expect((position(t + 1e-5) - position(t - 1e-5)) / 2e-5).toBeCloseTo(speed(t), 6)
      expect(riemann(speed, 0, t, 2000, 'mid')).toBeCloseTo(position(t), 5)
    }
    expect(position(4)).toBe(8)
    expect(speed(4)).toBe(0)
  })
})

describe('sketch resampling and classifier', () => {
  const xs = xsFor()
  const line = (fn: (x: number) => number) => xs.map((x) => ({ x, y: fn(x) }))

  it('resamples a polyline in any drawing order and measures coverage', () => {
    const pts = [{ x: 1, y: 1 }, { x: -1, y: -1 }, { x: 0, y: 0 }]
    const s = resample(pts, 5)
    expect(s).toEqual([-1, -1, 0, 1, 1])
    expect(coverage(pts)).toBe(0.5)
    expect(coverage([])).toBe(0)
  })

  it('the true derivative (with a wobble) is right', () => {
    expect(classifySketch(resample(line((x) => df(x) + 0.2 * Math.sin(5 * x))))).toBeNull()
  })

  it('tracing f is "derivative = height"', () => {
    expect(classifySketch(resample(line(f)))).toBe('derivative-is-height')
    expect(classifySketch(resample(line((x) => 2 * f(x))))).toBe('derivative-is-height')
  })

  it('flipping the sign is "sign flip"', () => {
    expect(classifySketch(resample(line((x) => -df(x))))).toBe('sign-flip')
  })

  it('right shape, wrong scale', () => {
    expect(classifySketch(resample(line((x) => 0.3 * df(x))))).toBe('wrong-scale')
    expect(classifySketch(resample(line((x) => 2.5 * df(x))))).toBe('wrong-scale')
  })

  it('right shape, lifted off zero', () => {
    expect(classifySketch(resample(line((x) => df(x) + 1.2)))).toBe('flat-not-zero')
  })

  it('a flat line or a random shape is "not the slope"', () => {
    expect(classifySketch(resample(line(() => 0)))).toBe('not-the-slope')
    expect(classifySketch(resample(line((x) => Math.sin(3 * x))))).toBe('not-the-slope')
  })

  it('f and f\' are uncorrelated on [-2, 2]', () => {
    expect(Math.abs(corr(xs.map(f), xs.map(df)))).toBeLessThan(1e-9)
  })
})
