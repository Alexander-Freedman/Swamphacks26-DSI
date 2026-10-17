import { describe, expect, it } from 'vitest'
import type { Arrow } from './chem'
import { chargeAt, gradeStage, keys, MECHS, mechScene, mechText, type MechId } from './mechs'

const lp = (atom: string): Arrow['from'] => ({ kind: 'lp', atom, slot: 0 })
const at = (atom: string): Arrow['to'] => ({ kind: 'atom', atom })
const bond = (a: string, b: string) => ({ kind: 'bond' as const, a, b })
const leave: Arrow = { from: bond('c', 'lg'), to: at('lg') }

describe('mechanism pictures', () => {
  it('total charge is conserved at every key, and every atom fills its shell', () => {
    for (const id of ['sn1', 'e2', 'e1'] as MechId[]) {
      const m = MECHS[id]
      const total = (k: number) => m.atoms.reduce((s, a) => s + chargeAt(m, a.id, k), 0)
      for (let k = 0; k <= keys(m); k++) expect(total(k)).toBe(total(0))
    }
  })

  it('charges come from the formal charge rule', () => {
    const { sn1, e2, e1 } = MECHS
    expect(chargeAt(sn1, 'c', 1)).toBe(1) // carbocation
    expect(chargeAt(sn1, 'lg', 1)).toBe(-1) // Br⁻
    expect(chargeAt(sn1, 'o', 2)).toBe(1) // R–OH₂⁺
    expect(chargeAt(sn1, 'c', 2)).toBe(0)
    expect(chargeAt(e2, 'o', 0)).toBe(-1) // HO⁻
    expect(chargeAt(e2, 'o', 1)).toBe(0) // H₂O
    expect(chargeAt(e2, 'c', 1)).toBe(0) // alkene carbons stay neutral
    expect(chargeAt(e2, 'cb', 1)).toBe(0)
    expect(chargeAt(e1, 'c', 1)).toBe(1)
    expect(chargeAt(e1, 'c', 2)).toBe(0)
    expect(chargeAt(e1, 'o', 2)).toBe(1) // H₃O⁺
  })

  it('bonds form dashed, then solid; the double bond shows up in the elimination', () => {
    const ids = (t: number) => mechScene(MECHS.e2, t).bonds.map((b) => b.id)
    expect(ids(0)).toContain('c-lg')
    expect(ids(0)).not.toContain('o-hb')
    expect(mechScene(MECHS.e2, 0.5).bonds.find((b) => b.id === 'o-hb')?.dashed).toBe(true)
    expect(ids(1)).not.toContain('c-lg')
    expect(mechScene(MECHS.e2, 1).bonds.find((b) => b.id === 'cb-c')?.order).toBe(2)
    // SN1: after step 1 there is no C–Br and no C–O yet
    const mid = mechScene(MECHS.sn1, 1).bonds.map((b) => b.id)
    expect(mid).not.toContain('c-lg')
    expect(mid).not.toContain('c-o')
    expect(mechScene(MECHS.sn1, 2).bonds.map((b) => b.id)).toContain('c-o')
  })

  it('the formula line follows the picture', () => {
    expect(mechText(MECHS.sn1, 0)).toBe('(CH₃)₃C–Br + H₂O')
    expect(mechText(MECHS.sn1, 1)).toBe('(CH₃)₃C⁺ + Br⁻')
    expect(mechText(MECHS.e1, 2)).toContain('H₃O⁺')
  })
})

describe('SN1 arrows', () => {
  const [s1, s2] = MECHS.sn1.stages
  it('step 1 is the C–Br bond leaving on its own', () => {
    expect(gradeStage(s1, [leave]).ok).toBe(true)
    expect(gradeStage(s1, [{ from: lp('o'), to: at('c') }, leave]).mistakes).toEqual(['sn1-attack-first'])
    expect(gradeStage(s1, [{ from: bond('lg', 'c'), to: at('c') }]).mistakes).toContain('arrow-backwards')
    expect(gradeStage(s1, []).hints).toEqual(['none'])
  })
  it('step 2 is water’s lone pair into the C⁺', () => {
    expect(gradeStage(s2, [{ from: lp('o'), to: at('c') }]).ok).toBe(true)
    expect(gradeStage(s2, [{ from: at('c'), to: at('o') }]).mistakes).toEqual(['arrow-from-electrophile'])
    expect(gradeStage(s2, [{ from: lp('o'), to: at('m1') }]).hints).toEqual(['extra-arrow', 'mech-attack'])
  })
})

describe('E2 arrows', () => {
  const [s] = MECHS.e2.stages
  const base: Arrow = { from: lp('o'), to: at('hb') }
  const ch: Arrow = { from: bond('cb', 'hb'), to: bond('c', 'cb') }
  const e2Leave: Arrow = { from: bond('c', 'lg'), to: at('lg') }
  it('three arrows, any order; the C–H arrow may end on the carbon', () => {
    expect(gradeStage(s, [base, ch, e2Leave]).ok).toBe(true)
    expect(gradeStage(s, [e2Leave, { from: bond('hb', 'cb'), to: at('c') }, base]).ok).toBe(true)
  })
  it('names the base hitting the carbon (that’s SN2)', () => {
    expect(gradeStage(s, [{ from: lp('o'), to: at('c') }, e2Leave]).mistakes).toEqual(['e2-base-hits-carbon'])
  })
  it('names a non-anti H', () => {
    expect(gradeStage(s, [{ from: lp('o'), to: at('hy') }, ch, e2Leave]).mistakes).toEqual(['e2-not-anti'])
  })
  it('names the C–H electrons going nowhere, and the C–Br bond that stays', () => {
    expect(gradeStage(s, [base, e2Leave]).mistakes).toEqual(['ch-bond-lost'])
    expect(gradeStage(s, [base, ch]).mistakes).toEqual(['leaving-bond-stays'])
  })
  it('hints when the base arrow is missing', () => {
    expect(gradeStage(s, [e2Leave]).hints).toEqual(['mech-base', 'mech-ch'])
  })
})

describe('E1 arrows', () => {
  const [s1, s2] = MECHS.e1.stages
  it('step 1: pulling the H first is named as E2 thinking', () => {
    expect(gradeStage(s1, [leave]).ok).toBe(true)
    expect(gradeStage(s1, [{ from: lp('o'), to: at('hx') }, leave]).mistakes).toEqual(['e1-base-first'])
  })
  it('step 2: any H on the carbon next door works; bonding to C⁺ is the SN1 path', () => {
    expect(gradeStage(s2, [{ from: lp('o'), to: at('hx') }, { from: bond('cm', 'hx'), to: bond('cm', 'c') }]).ok).toBe(true)
    expect(gradeStage(s2, [{ from: lp('o'), to: at('hz') }, { from: bond('cm', 'hz'), to: at('c') }]).ok).toBe(true)
    expect(gradeStage(s2, [{ from: lp('o'), to: at('c') }]).mistakes).toEqual(['e1-base-hits-carbon'])
    expect(gradeStage(s2, [{ from: lp('o'), to: at('hx') }]).mistakes).toEqual(['ch-bond-lost'])
  })
})
