import { describe, expect, it } from 'vitest'
import { SLOPE_FACTS, slopeLayer } from './help'

describe('slope-of-a-curve help layers', () => {
  it('quotes the real derivative values', () => {
    expect(SLOPE_FACTS).toContain("f'(0) = 4.5")
    expect(SLOPE_FACTS.some((s) => s.startsWith("f'(1) = 0"))).toBe(true)
    expect(SLOPE_FACTS.some((s) => s.startsWith("f'(2) = −1.5"))).toBe(true)
    expect(SLOPE_FACTS.some((s) => s.startsWith("f'(3) = 0"))).toBe(true)
    expect(SLOPE_FACTS).toContain("f'(4) = 4.5")
  })
  it('has a layer for sketch, tangent and the card, with 2-3 suggested questions', () => {
    for (const s of ['draw', 'tangent', 'card'] as const) {
      const l = slopeLayer(s, 1, null)!
      expect(l.suggested.length).toBeGreaterThanOrEqual(2)
      expect(l.suggested.length).toBeLessThanOrEqual(3)
      expect(l.hint).toBeTruthy()
    }
    expect(slopeLayer('area', 1, null)).toBeUndefined()
  })
})
