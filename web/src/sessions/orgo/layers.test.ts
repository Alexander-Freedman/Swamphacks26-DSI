import { describe, expect, it } from 'vitest'
import { labelFor } from '../../notebook'
import { gradeSN2 } from './chem'
import { REAL } from './sn2Arrows'
import { RX, sceneAt } from './sn2'
import {
  backBlocked, crowdScene, energy, FC, FC_LINES, gradeAtomTap, gradeCrowd, gradeHill, gradePairTap, hillSpot, KINDS, LAYER_MISTAKES, LAYERS, SN2_ORDER, sn2Layers, TS_T,
} from './layers'

describe('peel SN2: chemistry', () => {
  it('formal charges: O in HO⁻ is −1, C and Br in CH₃Br are 0', () => {
    expect(FC.O.fc).toBe(-1)
    expect(FC.C.fc).toBe(0)
    expect(FC.Br.fc).toBe(0)
    expect(FC_LINES).toEqual(['FC(O) = 6 − 6 − 1 = −1', 'FC(C) = 4 − 0 − 4 = 0', 'FC(Br) = 7 − 6 − 1 = 0'])
    // and the picture draws the same charges
    const s = sceneAt(RX['oh-mebr'], 0)
    expect(s.atoms.find((a) => a.id === 'nu')!.charge).toBe(-1)
    expect(s.atoms.find((a) => a.id === 'lg')!.charge).toBe(0)
  })

  it('the real arrows are a back-side attack plus C–Br → Br, and they grade correct', () => {
    expect(gradeSN2(REAL.map((d) => d.arrow), RX['oh-mebr'].roles).ok).toBe(true)
    const front = { ...REAL[0].arrow, front: true }
    expect(gradeSN2([front, REAL[1].arrow], RX['oh-mebr'].roles).mistakes).toContain('front-side-attack')
  })

  it('one concerted step: one hill, its top in the middle, where both bonds are partial and both ends δ−', () => {
    let peaks = 0
    for (let k = 1; k < 200; k++) if (energy(k / 200) > energy((k - 1) / 200) && energy(k / 200) > energy((k + 1) / 200)) peaks++
    expect(peaks).toBe(1)
    expect(Math.abs(TS_T - 0.5)).toBeLessThan(0.05)
    expect(energy(1)).toBeLessThan(energy(0)) // products lower: exothermic
    const ts = sceneAt(RX['oh-mebr'], TS_T)
    expect(ts.bonds.filter((b) => b.dashed).map((b) => b.id).sort()).toEqual(['c-lg', 'nu-c'])
    expect(ts.atoms.filter((a) => a.partial).map((a) => a.id).sort()).toEqual(['lg', 'nu'])
  })

  it('inversion: the H’s end on the other side of the carbon', () => {
    const h = (t: number) => sceneAt(RX['oh-mebr'], t).atoms.find((a) => a.id === 'h1')!.x
    const c = sceneAt(RX['oh-mebr'], 0).atoms.find((a) => a.id === 'c')!.x
    expect(h(0)).toBeLessThan(c)
    expect(h(1)).toBeGreaterThan(c)
  })

  it('crowding: only the 3° carbon blocks the back side; methyl is fastest', () => {
    expect(KINDS.map(backBlocked)).toEqual([false, false, false, true])
    expect(crowdScene('tertiary').atoms.filter((a) => a.label === 'CH₃')).toHaveLength(3)
    expect(crowdScene('methyl').atoms.filter((a) => a.label === 'CH₃')).toHaveLength(0)
    expect(SN2_ORDER).toEqual(['methyl', 'primary', 'secondary', 'tertiary'])
  })
})

describe('peel SN2: each layer’s do-it check', () => {
  it('layer 1: the carbon is attacked; Br, O and H are named mistakes', () => {
    expect(gradeAtomTap('c').ok).toBe(true)
    expect(gradeAtomTap('lg').mistake).toBe('attack-the-bromine')
    expect(gradeAtomTap('nu').mistake).toBe('attack-the-oxygen')
    expect(gradeAtomTap('h2').mistake).toBe('attack-a-hydrogen')
  })
  it('layer 2: an O pair attacks; a Br pair is a named mistake', () => {
    expect(gradePairTap('nu').ok).toBe(true)
    expect(gradePairTap('lg').mistake).toBe('bromine-pair-attacks')
  })
  it('layer 4: only the top of the hill is the transition state', () => {
    expect(gradeHill(TS_T).ok).toBe(true)
    expect(gradeHill(0.05)).toEqual({ ok: false, mistake: 'ts-not-at-top' })
    expect(hillSpot(0.05)).toBe('start')
    expect(hillSpot(0.95)).toBe('end')
    expect(hillSpot(0.3)).toBe('up')
  })
  it('layer 5: methyl; 3° and the in-between ones are named', () => {
    expect(gradeCrowd('methyl').ok).toBe(true)
    expect(gradeCrowd('tertiary').mistake).toBe('sn2-on-tertiary')
    expect(gradeCrowd('secondary').mistake).toBe('crowded-carbon-faster')
  })
  it('every new mistake has a notebook label', () => {
    for (const [id, m] of Object.entries(LAYER_MISTAKES)) expect(labelFor('orgo', id)).toBe(m.label)
  })
  it('every layer exports a LayerHelp object for the side chat', () => {
    expect(LAYERS.map((l) => l.n)).toEqual([1, 2, 3, 4, 5])
    for (const l of LAYERS) {
      const h = sn2Layers[l.n]
      expect(h.title).toBe(l.title)
      expect(h.onScreen.length).toBeGreaterThan(10)
      expect(h.facts.length).toBeGreaterThan(0)
      expect(h.suggested.length).toBeGreaterThanOrEqual(2)
      expect(h.hint.length).toBeGreaterThan(5)
    }
    expect(sn2Layers[2].facts).toContain('FC(O) = 6 − 6 − 1 = −1')
  })
})
