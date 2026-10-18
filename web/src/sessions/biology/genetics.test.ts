import { describe, expect, it } from 'vitest'
import { anticodon, codonsFor, codonToAmino, effectOf, endsOnStop, MRNA, MUTATIONS, readingFrame, startIndex, TEMPLATE, transcribe, translate } from './genetics'

describe('the genetic code', () => {
  it('matches the standard table at known codons', () => {
    expect(codonToAmino('AUG')).toBe('M')
    expect(codonToAmino('UUU')).toBe('F')
    expect(codonToAmino('UUC')).toBe('F')
    expect(codonToAmino('UGG')).toBe('W')
    expect(codonToAmino('GGC')).toBe('G')
    expect(codonToAmino('AAA')).toBe('K')
    for (const s of ['UAA', 'UAG', 'UGA']) expect(codonToAmino(s)).toBe('*')
  })
  it('has 64 codons: 61 for amino acids, 3 stops, Met and Trp with one codon each', () => {
    const all = 'ACDEFGHIKLMNPQRSTVWY*'.split('').reduce((n, a) => n + codonsFor(a).length, 0)
    expect(all).toBe(64)
    expect(codonsFor('*')).toHaveLength(3)
    expect(codonsFor('M')).toEqual(['AUG'])
    expect(codonsFor('W')).toEqual(['UGG'])
    expect(codonsFor('L')).toHaveLength(6)
  })
})

describe('the showcase gene', () => {
  it('the template strand transcribes back to the mRNA', () => {
    expect(transcribe(TEMPLATE)).toBe(MRNA)
    expect(TEMPLATE).not.toContain('U')
  })
  it('starts at the first AUG and reads Met-Phe-Gly-Lys-Trp, then stops', () => {
    expect(startIndex(MRNA)).toBe(2)
    expect(readingFrame(MRNA)).toEqual(['AUG', 'UUU', 'GGC', 'AAA', 'UGG', 'UAA'])
    expect(translate(MRNA)).toBe('MFGKW')
    expect(endsOnStop(MRNA)).toBe(true)
  })
  it('anticodons pair base by base', () => {
    expect(anticodon('AUG')).toBe('UAC')
    expect(anticodon('GGC')).toBe('CCG')
  })
  it('each mutation’s effect comes out of translating both', () => {
    const by = Object.fromEntries(MUTATIONS.map((m) => [m.id, m]))
    expect(effectOf(MRNA, by.silent.mrna)).toBe('none')
    expect(translate(by.nonsense.mrna)).toBe('MFGK')
    expect(effectOf(MRNA, by.nonsense.mrna)).toBe('early-stop')
    expect(translate(by.frameshift.mrna)).toBe('MIWQMV')
    expect(effectOf(MRNA, by.frameshift.mrna)).toBe('everything-after')
    expect(by.frameshift.mrna.length).toBe(MRNA.length + 1)
    expect(by.silent.mrna.length).toBe(MRNA.length)
  })
})
