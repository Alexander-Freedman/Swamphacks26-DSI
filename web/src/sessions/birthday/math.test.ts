import { describe, expect, it } from 'vitest'
import {
  addPeople, coverage, dayLabel, firstMatchAt, ROOM_MAX, sharedDays, FIRST_ROOM_SEED, lineFromGuess, monthDay, needForMe, pairs, pct, pMatch, pMine,
  resample, rng, roomUntilMatch, sizeForChance, pAnyMatch, PINS, DAYS, sizeForChanceIn,
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
    expect(Object.is(pairs(0), 0)).toBe(true) // not -0, which prints as "-0"
    expect(pairs(1)).toBe(0)
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

describe('room that keeps filling', () => {
  it('stops at the first match, then keeps adding past it', () => {
    const r = rng(FIRST_ROOM_SEED)
    let days: number[] = []
    while (firstMatchAt(days) == null) days = addPeople(days, 5, r, true)
    expect(days.length).toBe(23)
    expect(days).toEqual(roomUntilMatch(rng(FIRST_ROOM_SEED)))
    const more = addPeople(days, 5, r, false)
    expect(more.length).toBe(28)
    expect(more.slice(0, 23)).toEqual(days)
    expect(firstMatchAt(more)).toBe(23)
  })
  it('never goes past the cap', () => {
    const r = rng(1)
    const full = addPeople([], ROOM_MAX + 50, r, false)
    expect(full.length).toBe(ROOM_MAX)
    expect(addPeople(full, 5, r, false)).toEqual(full)
  })
  it('finds shared days', () => {
    expect(firstMatchAt([1, 2, 3])).toBeNull()
    expect(firstMatchAt([1, 2, 1, 2])).toBe(3)
    expect(sharedDays([1, 2, 1, 2, 2, 5]).sort()).toEqual([1, 2])
  })
})

describe('compare screen: shared 4-digit PINs', () => {
  it('reaches a coin flip at exactly 119 people', () => {
    expect(pAnyMatch(119, PINS)).toBeGreaterThanOrEqual(0.5)
    expect(pAnyMatch(118, PINS)).toBeLessThan(0.5)
    expect(pAnyMatch(119, PINS)).toBeCloseTo(0.5058, 4)
    expect(sizeForChanceIn(0.5, PINS)).toBe(119)
  })
  it('matches the birthday numbers when options = 365', () => {
    expect(sizeForChanceIn(0.5, DAYS)).toBe(23)
    expect(pAnyMatch(23, DAYS)).toBeCloseTo(0.5073, 4)
    for (const n of [1, 2, 10, 23, 57, 80]) expect(pAnyMatch(n, DAYS)).toBe(pMatch(n))
    expect(pAnyMatch(1, PINS)).toBe(0)
    expect(pAnyMatch(10_001, PINS)).toBe(1)
  })
  it('counts pairs as n(n-1)/2', () => {
    for (const n of [2, 23, 119, 300]) expect(pairs(n)).toBe((n * (n - 1)) / 2)
    expect(pairs(23)).toBe(253)
    expect(pairs(119)).toBe(7021)
    // both cross 50% when the pairs reach ~70% of the options
    expect(Math.round((pairs(23) / DAYS) * 100)).toBe(69)
    expect(Math.round((pairs(119) / PINS) * 100)).toBe(70)
  })
})

describe('compare screen: one slider, two crowds', () => {
  it('scales the PIN crowd by sqrt(10000/365) so the chances track each other', async () => {
    const { pinCrowd, ROOM_LO, ROOM_HI } = await import('./compareData')
    expect(pinCrowd(23)).toBe(120)
    expect(pinCrowd(60)).toBe(314)
    for (let n = ROOM_LO + 3; n <= ROOM_HI; n++) expect(Math.abs(pAnyMatch(n, DAYS) - pAnyMatch(pinCrowd(n), PINS))).toBeLessThan(0.03)
  })
})
