import { describe, expect, it } from 'vitest'
import { baseRate, computeTruth, curveFn, knobsFor, longestRun, simulate } from './truth'
import type { CurveTruth, Item } from './types'

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

describe('curve + computeTruth', () => {
  it('birthday: 23 people → 50.7%', async () => {
    const { birthdayMatch365, computeTruth } = await import('./truth')
    expect(birthdayMatch365(23)).toBeCloseTo(0.5073, 4)
    const c = computeTruth({ id: 'b', prompt: '', input_type: 'slider', truth: { widget: 'curve', preset: 'birthday_match_probability', x_min: 2, x_max: 80, x_label: '', y_label: '' } })
    expect(c.value).toBe(23)
  })
  it('expr curves evaluate', async () => {
    const { curveFn } = await import('./truth')
    expect(curveFn({ widget: 'curve', expr: '1 - 0.5^x', x_min: 0, x_max: 10, x_label: '', y_label: '' })(2)).toBeCloseTo(0.75)
  })
  it('positive test truth is in percent', async () => {
    const { computeTruth } = await import('./truth')
    const c = computeTruth({ id: 'p', prompt: '', input_type: 'slider', truth: { widget: 'distribution', sampler: 'base_rate_test', params: { population: 1000, base_rate: 0.01, sensitivity: 0.9, false_positive_rate: 0.09 }, x_label: '' } })
    expect(c.value).toBeCloseTo(9.17, 1)
  })
})

describe('curve knob', () => {
  it('passes the explore default into the curve expr', () => {
    const item = {
      id: 'k',
      prompt: '',
      input_type: 'slider',
      truth: { widget: 'curve', expr: '1000*(1+r/100)^x', x_min: 0, x_max: 40, x_label: 'years', y_label: 'value ($)' },
      explore: { param: 'r', label: 'interest rate (%)', min: 1, max: 12, step: 0.5, default: 7 },
    } as Item
    expect(knobsFor(item)).toEqual({ r: 7 })
    const t = computeTruth(item)
    expect(t.kind).toBe('curve')
    if (t.kind === 'curve') expect(t.f(30)).toBeCloseTo(1000 * 1.07 ** 30, 6)
    // a knob can't shadow x
    expect(curveFn(item.truth as CurveTruth, { r: 12, x: 99 })(0)).toBe(1000)
  })
})
