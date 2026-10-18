import { describe, expect, it } from 'vitest'
import { angleBetween, bondDirs, lonePairDirs, MOLECULES, TETRA } from './vsepr'

describe('molecule shapes', () => {
  it('tetrahedron corners are 109.5° apart', () => {
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) expect(angleBetween(TETRA[a], TETRA[b])).toBeCloseTo(109.47, 0)
  })

  it('drawn H–X–H angles match the real ones; lone pairs fill the other corners', () => {
    for (const m of MOLECULES) {
      const d = bondDirs(m)
      expect(d).toHaveLength(m.bonds)
      expect(angleBetween(d[0], d[1])).toBeCloseTo(m.angle, 0)
      expect(lonePairDirs(m)).toHaveLength(4 - m.bonds)
    }
  })
})
