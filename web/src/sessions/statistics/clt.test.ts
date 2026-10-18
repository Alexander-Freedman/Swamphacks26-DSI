import { describe, expect, it } from 'vitest'
import { histogram, popMean, popSd, PROBS, sampleMeans, skew, spread, BINS } from './clt'

describe('central limit theorem data', () => {
  it('the waits are a real, lopsided distribution', () => {
    expect(PROBS.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 10)
    expect(PROBS[0]).toBeGreaterThan(PROBS[9])
    expect(popMean).toBeGreaterThan(1.5)
    expect(popMean).toBeLessThan(3)
  })

  it('single waits are skewed; averages of 10 are much less so, and centered on the mean', () => {
    const one = sampleMeans(1, 3000)
    const ten = sampleMeans(10, 3000)
    expect(skew(one)).toBeGreaterThan(0.8)
    expect(Math.abs(skew(ten))).toBeLessThan(0.5)
    const m = ten.reduce((s, x) => s + x, 0) / ten.length
    expect(m).toBeCloseTo(popMean, 1)
  })

  it('the spread shrinks like σ/√n: four times n, about half the spread', () => {
    const s10 = spread(sampleMeans(10, 3000))
    const s40 = spread(sampleMeans(40, 3000))
    expect(s10).toBeCloseTo(popSd / Math.sqrt(10), 1)
    expect(s40 / s10).toBeGreaterThan(0.4)
    expect(s40 / s10).toBeLessThan(0.6)
  })

  it('bins cover 0 to 9 minutes', () => {
    const h = histogram([0, 8.99, 9, 4.5])
    expect(h).toHaveLength(BINS)
    expect(h.reduce((s, c) => s + c, 0)).toBe(4)
  })
})
