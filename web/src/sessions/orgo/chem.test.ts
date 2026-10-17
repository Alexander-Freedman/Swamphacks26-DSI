import { describe, expect, it } from 'vitest'
import {
  arrowValid,
  atomCharge,
  bondCount,
  charges,
  checkBuild,
  DIMETHYL_ETHER,
  ELEMENTS,
  ETHANOL,
  formalCharge,
  formula,
  formulaText,
  frontSide,
  gradeSN2,
  MISTAKES,
  nonbonding,
  pieces,
  sameMolecule,
  tapVerdict,
  withHydrogens,
  type Arrow,
  type Mol,
} from './chem'
import { RX, sceneAt } from './sn2'

const at = (id: string, el: Mol['atoms'][number]['el']) => ({ id, el, x: 0, y: 0 })
/** Shuffle ids and order so the checks can't lean on how a molecule was typed in. */
const scramble = (m: Mol): Mol => {
  const ids = new Map(m.atoms.map((a, i) => [a.id, `z${(i * 7) % m.atoms.length}-${i}`]))
  return {
    atoms: [...m.atoms].reverse().map((a) => ({ ...a, id: ids.get(a.id)! })),
    bonds: [...m.bonds].reverse().map((b) => ({ a: ids.get(b.b)!, b: ids.get(b.a)!, order: b.order })),
  }
}

describe('valence table', () => {
  it('has the usual bond counts and valence electrons', () => {
    expect(ELEMENTS.C).toMatchObject({ valence: 4, bonds: 4 })
    expect(ELEMENTS.H).toMatchObject({ valence: 1, bonds: 1 })
    expect(ELEMENTS.O).toMatchObject({ valence: 6, bonds: 2 })
    expect(ELEMENTS.N).toMatchObject({ valence: 5, bonds: 3 })
    expect(ELEMENTS.Br).toMatchObject({ valence: 7, bonds: 1 })
    expect(ELEMENTS.I).toMatchObject({ valence: 7, bonds: 1 })
  })
})

describe('formal charge', () => {
  it('is V − N − B/2', () => {
    expect(formalCharge(6, 6, 2)).toBe(-1) // hydroxide O
    expect(formalCharge(6, 2, 6)).toBe(1) // hydronium O
    expect(formalCharge(5, 0, 8)).toBe(1) // ammonium N
    expect(formalCharge(4, 2, 6)).toBe(-1) // cyanide C
    expect(formalCharge(7, 8, 0)).toBe(-1) // bromide
    expect(formalCharge(4, 0, 8)).toBe(0)
  })

  it('keeps open slots neutral while building and charges extra bonds', () => {
    for (const el of ['C', 'H', 'O', 'N', 'Br'] as const) {
      for (let b = 0; b <= ELEMENTS[el].bonds; b++) expect(atomCharge(el, b)).toBe(0)
    }
    expect(nonbonding('O', 2)).toBe(4)
    expect(nonbonding('O', 3)).toBe(2)
    expect(atomCharge('O', 3)).toBe(1)
    expect(atomCharge('N', 4)).toBe(1)
    expect(atomCharge('C', 5)).toBe(-1)
    expect(atomCharge('H', 2)).toBe(-1)
  })

  it('reads a whole molecule', () => {
    expect(Object.values(charges(ETHANOL)).every((c) => c === 0)).toBe(true)
    const ox = withHydrogens(['O'], [])
    ox.atoms.push(at('hx', 'H'))
    ox.bonds.push({ a: 'a0', b: 'hx', order: 1 })
    expect(charges(ox).a0).toBe(1)
  })
})

describe('formula', () => {
  it('is in Hill order with subscripts', () => {
    expect(formulaText(formula(ETHANOL))).toBe('C₂H₆O')
    expect(formulaText(formula(ETHANOL), false)).toBe('C2H6O')
    expect(formulaText(formula(withHydrogens(['C', 'Br'], [[0, 1]])))).toBe('CH₃Br')
    expect(formulaText(formula(withHydrogens(['N', 'C', 'O'], [[0, 1], [1, 2, 2]])))).toBe('CH₃NO')
    expect(formulaText(formula(withHydrogens(['O'], [])))).toBe('H₂O')
    expect(formulaText(formula(withHydrogens(['N', 'Br'], [[0, 1]])))).toBe('BrH₂N')
    expect(formula({ atoms: [], bonds: [] })).toEqual([])
  })

  it('fills hydrogens to the usual bond counts', () => {
    expect(ETHANOL.atoms).toHaveLength(9)
    expect(ETHANOL.bonds).toHaveLength(8)
    for (const a of ETHANOL.atoms) expect(bondCount(ETHANOL, a.id)).toBe(ELEMENTS[a.el].bonds)
    expect(withHydrogens(['C', 'C'], [[0, 1, 2]]).atoms).toHaveLength(6)
  })
})

describe('isomers', () => {
  it('ethanol and dimethyl ether share a formula but are different molecules', () => {
    expect(formulaText(formula(DIMETHYL_ETHER))).toBe(formulaText(formula(ETHANOL)))
    expect(sameMolecule(ETHANOL, DIMETHYL_ETHER)).toBe(false)
    expect(sameMolecule(ETHANOL, scramble(ETHANOL))).toBe(true)
    expect(sameMolecule(scramble(DIMETHYL_ETHER), DIMETHYL_ETHER)).toBe(true)
  })

  it('tells bond orders and branching apart', () => {
    const ethene = withHydrogens(['C', 'C'], [[0, 1, 2]])
    const wrong: Mol = { atoms: ethene.atoms, bonds: ethene.bonds.map((b) => ({ ...b, order: 1 })) }
    expect(sameMolecule(ethene, wrong)).toBe(false)
    const butane = withHydrogens(['C', 'C', 'C', 'C'], [[0, 1], [1, 2], [2, 3]])
    const isobutane = withHydrogens(['C', 'C', 'C', 'C'], [[0, 1], [0, 2], [0, 3]])
    expect(sameMolecule(butane, isobutane)).toBe(false)
    expect(sameMolecule(isobutane, scramble(isobutane))).toBe(true)
  })

  it('counts pieces', () => {
    expect(pieces(ETHANOL)).toBe(1)
    expect(pieces({ atoms: [at('a', 'C'), at('b', 'H')], bonds: [] })).toBe(2)
    expect(pieces({ atoms: [], bonds: [] })).toBe(0)
  })
})

describe('build check (target: ethanol)', () => {
  const check = (m: Mol) => checkBuild(m, ETHANOL, 'ethanol')

  it('accepts ethanol however it was drawn', () => {
    expect(check(scramble(ETHANOL))).toEqual({ ok: true, name: 'ethanol' })
  })

  it('names dimethyl ether: same formula, different molecule', () => {
    const r = check(scramble(DIMETHYL_ETHER))
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.mistakes).toEqual(['same-formula-different-molecule'])
    expect(r.isomer).toBe('dimethyl ether')
  })

  it('names a 5-bond carbon, a 2-bond hydrogen and a 3-bond oxygen', () => {
    const five = withHydrogens(['C', 'C', 'O'], [[0, 1], [1, 2]])
    five.atoms.push(at('x', 'H'))
    five.bonds.push({ a: 'a0', b: 'x', order: 1 })
    expect(check(five)).toMatchObject({ ok: false, mistakes: ['carbon-five-bonds'] })

    const h2: Mol = { atoms: [at('c', 'C'), at('h', 'H'), at('o', 'O')], bonds: [{ a: 'c', b: 'h', order: 1 }, { a: 'h', b: 'o', order: 1 }] }
    expect(check(h2)).toMatchObject({ ok: false, mistakes: ['hydrogen-two-bonds'] })

    const ox = withHydrogens(['C', 'C', 'O'], [[0, 1], [1, 2]])
    const oh = ox.bonds.find((b) => b.a === 'a2')!
    ox.bonds.push({ a: 'a0', b: oh.a, order: 1 }) // ring through O: O has 3 bonds
    const r = check(ox)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.mistakes).toContain('oxygen-three-bonds')
  })

  it('names missing hydrogens when the heavy atoms are right', () => {
    const m = withHydrogens(['C', 'C', 'O'], [[0, 1], [1, 2]])
    m.atoms = m.atoms.filter((a) => a.id !== 'h0')
    m.bonds = m.bonds.filter((b) => b.b !== 'h0')
    expect(formulaText(formula(m))).toBe('C₂H₅O')
    expect(check(m)).toMatchObject({ ok: false, mistakes: ['missing-hydrogens'] })
    expect(check({ atoms: [at('a', 'C'), at('b', 'C'), at('o', 'O')], bonds: [] })).toMatchObject({ mistakes: ['missing-hydrogens'], hint: 'loose' })
  })

  it('gives hints, not named mistakes, for the rest', () => {
    expect(check({ atoms: [], bonds: [] })).toMatchObject({ hint: 'empty', mistakes: [] })
    expect(check(withHydrogens(['C', 'N'], [[0, 1]]))).toMatchObject({ hint: 'wrong-atoms', mistakes: [] })
    const twoBr: Mol = { atoms: [at('a', 'Br'), at('b', 'Br'), at('c', 'Br')], bonds: [{ a: 'a', b: 'b', order: 1 }, { a: 'b', b: 'c', order: 1 }] }
    expect(check(twoBr)).toMatchObject({ hint: 'too-many-bonds', mistakes: [] })
    // right formula, one H floating free and a C=O-ish gap: not ethanol yet
    const loose = withHydrogens(['C', 'C', 'O'], [[0, 1], [1, 2]])
    loose.bonds = loose.bonds.filter((b) => b.b !== 'h0')
    expect(check(loose)).toMatchObject({ hint: 'loose', mistakes: [] })
  })

  it('every named mistake has a label and a line', () => {
    for (const m of Object.values(MISTAKES)) {
      expect(m.label.length).toBeGreaterThan(5)
      expect(m.line.length).toBeGreaterThan(10)
    }
  })
})

describe('curved arrows (SN2: HO⁻ + CH₃Br)', () => {
  const r = { nu: 'O', c: 'C', lg: 'Br' }
  const attack: Arrow = { from: { kind: 'lp', atom: 'O', slot: 0 }, to: { kind: 'atom', atom: 'C' } }
  const leave: Arrow = { from: { kind: 'bond', a: 'C', b: 'Br' }, to: { kind: 'atom', atom: 'Br' } }

  it('needs electrons at the tail and an atom or bond at the head', () => {
    expect(arrowValid(attack)).toBe(true)
    expect(arrowValid(leave)).toBe(true)
    expect(arrowValid({ from: { kind: 'atom', atom: 'C' }, to: { kind: 'atom', atom: 'O' } })).toBe(false)
    expect(arrowValid({ from: { kind: 'bond', a: 'C', b: 'Br' }, to: { kind: 'bond', a: 'Br', b: 'C' } })).toBe(false)
    expect(arrowValid({ from: { kind: 'lp', atom: 'O', slot: 1 }, to: { kind: 'atom', atom: 'O' } })).toBe(false)
  })

  it('accepts the real mechanism in either order', () => {
    expect(gradeSN2([attack, leave], r)).toMatchObject({ ok: true, mistakes: [], hints: [] })
    expect(gradeSN2([leave, { ...attack, from: { kind: 'lp', atom: 'O', slot: 2 } }], r).ok).toBe(true)
  })

  it('names an arrow from the carbon', () => {
    const g = gradeSN2([{ from: { kind: 'atom', atom: 'C' }, to: { kind: 'atom', atom: 'O' } }, leave], r)
    expect(g.ok).toBe(false)
    expect(g.mistakes).toEqual(['arrow-from-electrophile'])
  })

  it('names arrows from Br toward C as backwards', () => {
    expect(gradeSN2([attack, { from: { kind: 'bond', a: 'Br', b: 'C' }, to: { kind: 'atom', atom: 'C' } }], r).mistakes).toContain('arrow-backwards')
    expect(gradeSN2([attack, { from: { kind: 'lp', atom: 'Br', slot: 0 }, to: { kind: 'atom', atom: 'C' } }], r).mistakes).toContain('arrow-backwards')
    expect(gradeSN2([attack, { from: { kind: 'atom', atom: 'Br' }, to: { kind: 'bond', a: 'C', b: 'Br' } }], r).mistakes).toContain('arrow-backwards')
  })

  it('names a front-side attack from the arrow geometry', () => {
    const c = { x: 250, y: 100 }
    const br = { x: 312, y: 100 }
    expect(frontSide({ x: 200, y: 60 }, c, br)).toBe(false)
    expect(frontSide({ x: 290, y: 50 }, c, br)).toBe(true)
    expect(frontSide({ x: 250, y: 40 }, c, br)).toBe(false) // straight down onto C: not the front
    expect(gradeSN2([{ ...attack, front: true }, leave], r).mistakes).toEqual(['front-side-attack'])
  })

  it('names a C–Br bond that never breaks', () => {
    expect(gradeSN2([attack], r)).toMatchObject({ ok: false, attack: true, leave: false, mistakes: ['leaving-bond-stays'] })
  })

  it('gives hints for the rest', () => {
    expect(gradeSN2([], r).hints).toEqual(['none'])
    expect(gradeSN2([leave], r).hints).toEqual(['attack-missing'])
    expect(gradeSN2([{ from: { kind: 'atom', atom: 'O' }, to: { kind: 'atom', atom: 'C' } }, leave], r).hints).toContain('not-from-electrons')
    expect(gradeSN2([{ from: { kind: 'lp', atom: 'O', slot: 0 }, to: { kind: 'atom', atom: 'Br' } }, leave], r).hints).toContain('wrong-target')
    expect(gradeSN2([attack, leave, { from: { kind: 'bond', a: 'C', b: 'H1' }, to: { kind: 'atom', atom: 'O' } }], r)).toMatchObject({ ok: false, hints: ['extra-arrow'] })
  })
})

describe('the SN2 scene', () => {
  const by = (t: number, rx = RX['oh-mebr']) => Object.fromEntries(sceneAt(rx, t).atoms.map((a) => [a.id, a]))

  it('charges come out of the formal charge rule', () => {
    expect(by(0).nu.charge).toBe(-1) // HO⁻
    expect(by(0).lg.charge).toBe(0)
    expect(by(1).nu.charge).toBe(0) // CH₃OH
    expect(by(1).lg.charge).toBe(-1) // Br⁻
    expect(by(0, RX['cn-mei']).nu.charge).toBe(-1) // cyanide carbon
    expect(by(0, RX['cn-mei']).back.charge).toBe(0) // cyanide nitrogen
    expect(by(1, RX['cn-mei']).nu.charge).toBe(0)
    const total = (t: number, id: 'oh-mebr' | 'cn-mei') => sceneAt(RX[id], t).atoms.reduce((s, a) => s + a.charge, 0)
    for (const id of ['oh-mebr', 'cn-mei'] as const) {
      expect(total(0, id)).toBe(-1)
      expect(total(1, id)).toBe(-1)
    }
  })

  it('the leaving group takes the bond’s electrons: 3 lone pairs → 4', () => {
    expect(by(0).lg.lp).toHaveLength(3)
    expect(by(1).lg.lp).toHaveLength(4)
    expect(by(0).nu.lp).toHaveLength(3)
    expect(by(1).nu.lp).toHaveLength(2)
  })

  it('backside attack and inversion: hydrogens start toward the nucleophile and end away from it', () => {
    const s0 = by(0)
    const s1 = by(1)
    expect(s0.nu.x).toBeLessThan(s0.c.x)
    expect(s0.lg.x).toBeGreaterThan(s0.c.x)
    expect(s0.h1.x).toBeLessThan(s0.c.x)
    expect(s1.h1.x).toBeGreaterThan(s1.c.x)
    expect(s1.lg.x - s1.c.x).toBeGreaterThan(s0.lg.x - s0.c.x)
    const bonds = (t: number) => sceneAt(RX['oh-mebr'], t).bonds.map((b) => b.id)
    expect(bonds(0)).toContain('c-lg')
    expect(bonds(0)).not.toContain('nu-c')
    expect(bonds(0.5)).toEqual(expect.arrayContaining(['c-lg', 'nu-c']))
    expect(bonds(1)).not.toContain('c-lg')
  })

  it('cyanide’s traps are named', () => {
    const p = RX['cn-mei'].parts
    expect(tapVerdict(p, 'nucleophile', 'nu')).toEqual({ ok: true, mistake: null })
    expect(tapVerdict(p, 'nucleophile', 'back')).toEqual({ ok: false, mistake: 'cyanide-nitrogen' })
    expect(tapVerdict(p, 'electrophile', 'nu')).toEqual({ ok: false, mistake: 'wrong-carbon' })
    expect(tapVerdict(p, 'leaving', 'h1')).toEqual({ ok: false, mistake: null })
    expect(tapVerdict(p, 'leaving', 'lg').ok).toBe(true)
  })
})
