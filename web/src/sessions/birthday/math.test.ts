import { describe, expect, it } from 'vitest'
import {
  coverage, dayLabel, FIRST_ROOM_SEED, lineFromGuess, monthDay, needForMe, pairs, pct, pMatch, pMine,
  resample, rng, roomUntilMatch, sizeForChance,
} from './math'

describe('exact birthday math', () => {
  it('matches the known values', () => {
    expect(pMatch(23)).toBeCloseTo(0.5072972343, 9)
    expect(pMatch(57)).toBeCloseTo(0.9901224593, 9)
    expect(pct(pMatch(23))).toBe('50.7%')
    expect(pct(pMatch(57))).toBe('99.0%')
    expect(pct(pMatch(30))).toBe('70.6%')
    expect(pMatch(1)).toBe(0)
    expect(pMatch(366)).toBe(1)
  })
  it('counts pairs', () => {
    expect(pairs(23)).toBe(253)
    expect(pairs(30)).toBe(435)
    expect(pairs(2)).toBe(1)
  })
  it('separates MY birthday from any two', () => {
    expect(pMine(23)).toBeCloseTo(0.0585713253, 9)
    expect(needForMe()).toBe(253)
  })
  it('finds break points', () => {
    expect(sizeForChance(0.5)).toBe(23)
    expect(sizeForChance(0.99)).toBe(57)
  })
})

describe('calendar', () => {
  it('maps day of year to month/day', () => {
    expect(monthDay(0)).toEqual([0, 0])
    expect(monthDay(31)).toEqual([1, 0])
    expect(monthDay(364)).toEqual([11, 30])
    expect(dayLabel(189)).toBe('Jul 9')
  })
})

describe('seeded room', () => {
  it('first room matches at 23 people every time', () => {
    const days = roomUntilMatch(rng(FIRST_ROOM_SEED))
    expect(days.length).toBe(23)
    expect(new Set(days).size).toBe(22)
    expect(roomUntilMatch(rng(FIRST_ROOM_SEED))).toEqual(days)
  })
})

describe('drawing -> curve', () => {
  it('returns null for no drawing', () => {
    expect(resample([])).toBeNull()
  })
  it('fills every x from 2 to 80, holding the ends flat', () => {
    const c = resample([{ x: 10, y: 0.1 }, { x: 40, y: 0.4 }])!
    expect(c[2]).toBeCloseTo(0.1)
    expect(c[25]).toBeCloseTo(0.25)
    expect(c[80]).toBeCloseTo(0.4)
    for (let x = 2; x <= 80; x++) expect(c[x]).toBeTypeOf('number')
  })
  it('clamps off-grid points and lets later strokes win', () => {
    const c = resample([{ x: -5, y: 2 }, { x: 100, y: -1 }, { x: 50, y: 0.9 }])!
    expect(c[2]).toBe(1)
    expect(c[80]).toBe(0)
    expect(c[50]).toBe(0.9)
  })
  it('measures coverage', () => {
    expect(coverage([{ x: 2, y: 0 }, { x: 80, y: 1 }])).toBe(1)
    expect(coverage([{ x: 2, y: 0 }])).toBe(0)
  })
  it('skip line goes through 50% at your guess', () => {
    const l = lineFromGuess(42)
    expect(l[2]).toBe(0)
    expect(l[42]).toBeCloseTo(0.5)
    expect(lineFromGuess(180)[80]).toBeLessThan(0.25)
    expect(lineFromGuess(10)[80]).toBe(1)
  })
})
