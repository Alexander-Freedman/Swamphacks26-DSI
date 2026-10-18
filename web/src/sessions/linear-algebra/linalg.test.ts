import { describe, expect, it } from 'vitest'
import { apply, det, I, lerp, QUARTER, snap } from './linalg'

describe('2×2 matrices as moves of the plane', () => {
  it('columns say where î and ĵ land; every point follows', () => {
    const m = { i: { x: 2, y: 0 }, j: { x: 0, y: 1 } }
    expect(apply(m, { x: 1, y: 1 })).toEqual({ x: 2, y: 1 })
    expect(apply(I, { x: 3, y: -2 })).toEqual({ x: 3, y: -2 })
  })

  it('a quarter turn sends (1, 0) up and keeps areas', () => {
    expect(apply(QUARTER, { x: 1, y: 0 })).toEqual({ x: 0, y: 1 })
    expect(apply(QUARTER, { x: 0, y: 1 })).toEqual({ x: -1, y: 0 })
    expect(det(QUARTER)).toBe(1)
  })

  it('determinant: stretch ×2 doubles area; parallel columns flatten it to 0', () => {
    expect(det({ i: { x: 2, y: 0 }, j: { x: 0, y: 1 } })).toBe(2)
    expect(det({ i: { x: 1, y: 2 }, j: { x: 2, y: 4 } })).toBe(0)
    expect(det({ i: { x: 0, y: 1 }, j: { x: 1, y: 0 } })).toBe(-1) // flipped over
  })

  it('morph and snap', () => {
    expect(lerp(I, QUARTER, 0.5)).toEqual({ i: { x: 0.5, y: 0.5 }, j: { x: -0.5, y: 0.5 } })
    expect(snap({ x: 0.74, y: -1.3 })).toEqual({ x: 0.5, y: -1.5 })
  })
})
