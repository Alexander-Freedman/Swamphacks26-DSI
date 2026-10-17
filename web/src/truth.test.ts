import { describe, expect, it } from 'vitest'
import { baseRate, longestRun, simulate } from './truth'

describe('truth', () => {
  it('longest run', () => {
    expect(longestRun([true, true, false, false, false, true])).toBe(3)
    expect(longestRun([])).toBe(0)
  })
  it('coin streak mean matches the exact 6.977', () => {
    const h = simulate({ widget: 'distribution', sampler: 'coin_longest_run', params: { n: 100, p: 0.5, trials: 20000 }, x_label: '' })
    expect(h.mean).toBeGreaterThan(6.9)
    expect(h.mean).toBeLessThan(7.06)
  })
  it('base rate 1%/90%/9% is 9.17%', () => {
    expect(baseRate({ population: 1000, base_rate: 0.01, sensitivity: 0.9, false_positive_rate: 0.09 }).truth).toBeCloseTo(0.0917, 3)
  })
  it('birthday 23 is about half', () => {
    const h = simulate({ widget: 'distribution', sampler: 'birthday_match', params: { group_size: 23, trials: 20000 }, x_label: '' })
    expect(h.mean).toBeGreaterThan(0.49)
    expect(h.mean).toBeLessThan(0.525)
  })
})
