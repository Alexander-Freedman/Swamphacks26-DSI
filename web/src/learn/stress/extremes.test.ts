import { describe, expect, it } from 'vitest'
import bundled from '../../../../data/learn/compound-interest.json'
import seasonsJson from '../../../../data/learn/why-we-have-seasons.json'
import type { Topic } from '../types'
import { extremeCurve, extremesOf } from './extremes'

const topic = bundled as unknown as Topic

describe('stress pictures: the curve at each extreme, computed in code', () => {
  it('reads the three extremes, one per stress card', () => {
    expect(extremesOf(topic).map((e) => e.value)).toEqual([5, 0, 10])
  })

  it('card 1 at 5% gives $4,322 at year 30, card 2 at 0% stays flat at $1,000, card 3 at 10% gives $17,449', () => {
    const one = extremeCurve(topic, 0)!
    expect(one.at).toBe('yearly rate (%) = 5')
    expect(Math.round(one.f(30))).toBe(4322)
    const two = extremeCurve(topic, 1)!
    expect(two.f(0)).toBe(1000)
    expect(two.f(40)).toBe(1000)
    const three = extremeCurve(topic, 2)!
    expect(Math.round(three.f(30))).toBe(17449)
    expect(extremeCurve(topic, 3)).toBeNull()
  })

  it('an extreme on a variable (not the knob) is labelled with what the variable means', () => {
    const seasons = seasonsJson as unknown as Topic
    const third = extremeCurve(seasons, 2)!
    expect(third.at).toBe('how far north the city is = 71')
    expect(third.f(172)).toBeCloseTo(42.5, 1)
  })

  it('a topic with no curve visual, or a broken expression, gets no picture', () => {
    expect(extremeCurve({ ...topic, visual: null }, 0)).toBeNull()
    const broken = JSON.parse(JSON.stringify(topic)) as Topic
    ;(broken.visual!.spec as { curve: { expr: string } }).curve.expr = 'P*(('
    expect(extremeCurve(broken, 0)).toBeNull()
  })
})
