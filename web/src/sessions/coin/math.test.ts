import { describe, expect, it } from 'vitest'
import {
  expectedLongest,
  expectedLongestSlow,
  longestOfFlips,
  longestRun,
  pLongestAtLeast,
  pLongestAtMost,
  pLongestAtMostSlow,
  repeatRateLike,
  rng,
  runs,
  switchRate,
  toSides,
} from './math'

// Brute force over all 2^n sequences, for small n.
function brute(n: number, k: number): number {
  let ok = 0
  for (let m = 0; m < 1 << n; m++) {
    let best = 1
    let run = 1
    for (let i = 1; i < n; i++) {
      run = ((m >> i) & 1) === ((m >> (i - 1)) & 1) ? run + 1 : 1
      best = Math.max(best, run)
    }
    if (best <= k) ok++
  }
  return ok / (1 << n)
}

describe('exact longest-run math', () => {
  it('matches brute force for small n', () => {
    for (let n = 1; n <= 12; n++) for (let k = 0; k <= n; k++) expect(pLongestAtMost(n, k)).toBeCloseTo(brute(n, k), 12)
  })

  it('fast DP matches the slow state DP, fair and biased', () => {
    for (const r of [0.5, 0.31, 0.8]) for (const [n, k] of [[100, 4], [100, 7], [1000, 9], [57, 3]]) {
      expect(pLongestAtMost(n, k, r)).toBeCloseTo(pLongestAtMostSlow(n, k, r), 10)
    }
  })

  it('N = 100: mean 6.977, a run of 5+ 97.17% of the time', () => {
    expect(expectedLongest(100)).toBeCloseTo(6.977, 3)
    expect(pLongestAtLeast(100, 5)).toBeCloseTo(0.9717, 4)
    expect((pLongestAtLeast(100, 5) * 100).toFixed(2)).toBe('97.17')
  })

  it('expected longest run at 10 / 1,000 / 10,000 flips', () => {
    expect(expectedLongest(10).toFixed(2)).toBe('3.66')
    expect(expectedLongest(20)).toBeCloseTo(4.6591, 4) // the 20-flip demo row
    expect(expectedLongest(1000).toFixed(2)).toBe('10.30')
    expect(expectedLongest(10000).toFixed(2)).toBe('13.62')
  })

  it('the fast mean matches the plain sum over every k', () => {
    for (const r of [0.5, 0.31, 0.9]) for (const n of [10, 20, 100, 1000]) {
      expect(expectedLongest(n, r)).toBeCloseTo(expectedLongestSlow(n, r), 6)
    }
  })

  it('a coin that switches more has shorter streaks', () => {
    expect(expectedLongest(100, 0.32)).toBeLessThan(expectedLongest(100) - 2)
  })

  it('simulation agrees with the exact mean', () => {
    const rand = rng(1)
    let sum = 0
    for (let i = 0; i < 20000; i++) sum += longestOfFlips(100, rand)
    expect(sum / 20000).toBeCloseTo(6.977, 1)
  })
})

describe('sequence helpers', () => {
  it('runs, longest run and switch rate', () => {
    const s = toSides('HHTHHHT')
    expect(runs(s)).toEqual([{ start: 0, len: 2 }, { start: 2, len: 1 }, { start: 3, len: 3 }, { start: 6, len: 1 }])
    expect(longestRun(s)).toBe(3)
    expect(switchRate(s)).toBeCloseTo(3 / 6)
    expect(longestRun([])).toBe(0)
  })

  it('repeat rate from your taps: 1 - switch rate, clamped to 0.05..0.9', () => {
    expect(repeatRateLike(toSides('HTTHHHTH'))).toBeCloseTo(1 - 4 / 7)
    expect(repeatRateLike(toSides('HTHTHTHT'))).toBe(0.05)
    expect(repeatRateLike(toSides('HHHHHHHH'))).toBe(0.9)
  })

  it('the which-is-real pair: A tops out at 2, B at 4', () => {
    expect(longestRun(toSides('HTHHTHTTHTHHTHTTHTHT'))).toBe(2)
    expect(longestRun(toSides('HTTTTHHTHHHHTTHTHHHT'))).toBe(4)
  })
})
