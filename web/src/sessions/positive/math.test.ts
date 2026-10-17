import { describe, expect, it } from 'vitest'
import { BAG_DAY, BAGS, baseToSlider, breakEven, CARD, exact, pct, piles, ppv, REMATCH, secondTest, seededOrder, sliderToBase } from './math'

describe('positive test math', () => {
  it('1% / 90% / 9% gives 9.17%, shown as 9.2%', () => {
    const p = ppv(CARD)
    expect(p).toBeCloseTo(0.009 / 0.0981, 10)
    expect(p).toBeCloseTo(0.0917, 4)
    expect(pct(p)).toBe('9.2%')
  })

  it('1,000 people split into 9 true vs 89 false positives', () => {
    expect(piles(CARD)).toEqual({ sick: 10, healthy: 990, truePos: 9, falsePos: 89, positives: 98 })
  })

  it('a coin-flip crowd (50%) makes the same test 90.9%', () => {
    expect(ppv({ ...CARD, baseRate: 0.5 })).toBeCloseTo(0.9091, 4)
  })

  it('a positive is a coin flip at 9.09% sick', () => {
    const b = breakEven(CARD)
    expect(b).toBeCloseTo(0.0909, 4)
    expect(ppv({ ...CARD, baseRate: b })).toBeCloseTo(0.5, 10)
  })

  it('a second positive test takes you to 50.3%', () => {
    expect(secondTest(CARD)).toBeCloseTo(0.5025, 4)
    expect(pct(secondTest(CARD))).toBe('50%')
  })

  it('never returns NaN, even with no false alarms and no sick people', () => {
    expect(ppv({ baseRate: 0, sensitivity: 0.9, falseAlarm: 0 })).toBe(0)
    expect(pct(Number.NaN)).toBe('-')
    expect(pct(0.01)).toBe('1%')
    expect(pct(0.001)).toBe('0.1%')
  })

  it('log slider covers 0.1% to 50% and round-trips 1%', () => {
    expect(sliderToBase(0)).toBeCloseTo(0.001, 10)
    expect(sliderToBase(1000)).toBeCloseTo(0.5, 10)
    expect(sliderToBase(baseToSlider(0.01))).toBeCloseTo(0.01, 4)
  })

  it('seeded order is a stable permutation', () => {
    const a = seededOrder()
    expect(new Set(a).size).toBe(1000)
    expect(seededOrder()).toEqual(a)
  })

  it('exact readouts keep one decimal: 90.9%, 9.2%, 0.3%', () => {
    expect(exact(ppv({ ...CARD, baseRate: 0.5 }))).toBe('90.9%')
    expect(exact(ppv(CARD))).toBe('9.2%')
    expect(exact(0.003)).toBe('0.3%')
    expect(exact(NaN)).toBe('-')
  })

  it('rematch: 2% sick, 95% caught, 5% false alarms → 27.9%, 19 of 68 per 1,000', () => {
    expect(exact(ppv(REMATCH))).toBe('27.9%')
    expect(piles(REMATCH)).toEqual({ sick: 20, healthy: 980, truePos: 19, falsePos: 49, positives: 68 })
  })
})

describe('compare step: airport bags (#183, illustrative numbers)', () => {
  it('1 in 1,000 bags, 99% flagged, 2% false alarms: 99 of 2,097 alarms are real, 4.72%', () => {
    const b = piles(BAGS, BAG_DAY)
    expect(b).toEqual({ sick: 100, healthy: 99_900, truePos: 99, falsePos: 1_998, positives: 2_097 })
    // whole bags, no rounding: the counts are the exact expectation
    expect(BAG_DAY * BAGS.baseRate * BAGS.sensitivity).toBeCloseTo(99, 9)
    expect(BAG_DAY * (1 - BAGS.baseRate) * BAGS.falseAlarm).toBeCloseTo(1_998, 9)
    expect(ppv(BAGS)).toBeCloseTo(99 / 2_097, 12)
    expect(ppv(BAGS)).toBeCloseTo(0.04721, 5)
    expect(exact(ppv(BAGS))).toBe('4.7%')
    // most alarms are false: about 20 false for every real one
    expect(Math.round(b.falsePos / b.truePos)).toBe(20)
  })
})
