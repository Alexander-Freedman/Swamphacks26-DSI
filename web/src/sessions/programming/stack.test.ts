import { describe, expect, it } from 'vitest'
import { depth, fact, trace } from './stack'

describe('factorial trace', () => {
  it('computes factorial', () => {
    expect([1, 2, 3, 4, 5].map(fact)).toEqual([1, 2, 6, 24, 120])
  })

  it('calls go up one frame at a time, then returns come back down', () => {
    const t = trace(4)
    expect(t.map((m) => m.frames.length)).toEqual([1, 2, 3, 4, 4, 3, 2, 1])
    expect(depth(4)).toBe(4)
    // the newest frame finishes first: fact(1), then fact(2), fact(3), fact(4)
    const returns = t.filter((m) => m.handing != null).map((m) => m.handing)
    expect(returns).toEqual([1, 2, 6, 24])
    expect(t.at(-1)!.frames).toEqual([{ n: 4, value: 24 }])
  })
})
