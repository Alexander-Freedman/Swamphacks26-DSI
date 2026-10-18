import { describe, expect, it } from 'vitest'
import bundled from '../../../../data/learn/compound-interest.json'
import type { Topic } from '../types'
import { extremeCurve, extremesOf } from './extremes'

const topic = bundled as unknown as Topic

describe('stress pictures: the curve at each extreme, computed in code', () => {
  it('reads the extremes from the curve spec', () => {
    expect(extremesOf(topic).map((e) => e.value)).toEqual([1, 15])
  })

  it('card 1 is $1,000 at 1% (≈ $1,348 at year 30), card 2 at 15% passes $66,000; card 3 has no extreme', () => {
    const one = extremeCurve(topic, 0)!
    expect(one.at).toBe('yearly rate (%) = 1')
    expect(one.f(30)).toBeCloseTo(1000 * 1.01 ** 30, 6)
    expect(Math.round(one.f(30))).toBe(1348)
    const two = extremeCurve(topic, 1)!
    expect(two.f(30)).toBeGreaterThan(66000)
    expect(two.watch).toMatch(/15%/)
    expect(extremeCurve(topic, 2)).toBeNull()
  })

  it('a topic with no curve visual, or a broken expression, gets no picture', () => {
    expect(extremeCurve({ ...topic, visual: null }, 0)).toBeNull()
    const broken = JSON.parse(JSON.stringify(topic)) as Topic
    ;(broken.visual!.spec as { curve: { expr: string } }).curve.expr = 'P*(('
    expect(extremeCurve(broken, 0)).toBeNull()
  })
})
