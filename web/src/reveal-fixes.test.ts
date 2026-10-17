import { describe, expect, it } from 'vitest'
import { niceTicks } from './components/ticks'
import { birthdayMatch365 } from './truth'
import type { Item } from './types'
import { misconceptionFor } from './verdict'

describe('reveal fixes', () => {
  it('birthday curve floors fractional group sizes', () => {
    expect(birthdayMatch365(22.7)).toBe(birthdayMatch365(22))
    expect(birthdayMatch365(23)).toBeCloseTo(0.507, 3)
  })
  it('ticks are round numbers', () => {
    expect(niceTicks(2, 80, 9)).toEqual([10, 20, 30, 40, 50, 60, 70, 80])
    expect(niceTicks(2, 80, 5)).toEqual([20, 40, 60, 80])
    expect(niceTicks(0, 1, 4)).toEqual([0, 0.5, 1])
  })
  it('bands match by min order, not JSON order', () => {
    const item = {
      input_type: 'slider',
      bands: [
        { min: 50, max: 100, misconception_id: 'high' },
        { min: 0, max: 50, misconception_id: 'low' },
      ],
    } as unknown as Item
    expect(misconceptionFor(item, { value: 50, optionId: null, confidence: 'certain' })).toBe('low')
  })
})
