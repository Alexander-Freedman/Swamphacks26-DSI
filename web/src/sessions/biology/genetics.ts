// The central dogma in code: DNA → mRNA (transcription) → protein (translation).
// Every answer the screens check comes from these functions and the standard genetic code,
// never from a hand-typed list.

export type DnaBase = 'A' | 'T' | 'G' | 'C'
export type RnaBase = 'A' | 'U' | 'G' | 'C'

/** The base an RNA polymerase puts opposite each template-strand DNA base. */
export const PAIR: Record<DnaBase, RnaBase> = { A: 'U', T: 'A', G: 'C', C: 'G' }
/** The DNA base opposite each DNA base (the other strand). */
export const DNA_PAIR: Record<DnaBase, DnaBase> = { A: 'T', T: 'A', G: 'C', C: 'G' }

// Standard genetic code, codons in UCAG order (first base slowest): UUU, UUC, UUA, UUG, UCU, ...
const ORDER = 'UCAG'
const CODE = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'

export type AminoAcid = { one: string; three: string; name: string }
export const AMINO: Record<string, AminoAcid> = {
  A: { one: 'A', three: 'Ala', name: 'alanine' },
  R: { one: 'R', three: 'Arg', name: 'arginine' },
  N: { one: 'N', three: 'Asn', name: 'asparagine' },
  D: { one: 'D', three: 'Asp', name: 'aspartate' },
  C: { one: 'C', three: 'Cys', name: 'cysteine' },
  Q: { one: 'Q', three: 'Gln', name: 'glutamine' },
  E: { one: 'E', three: 'Glu', name: 'glutamate' },
  G: { one: 'G', three: 'Gly', name: 'glycine' },
  H: { one: 'H', three: 'His', name: 'histidine' },
  I: { one: 'I', three: 'Ile', name: 'isoleucine' },
  L: { one: 'L', three: 'Leu', name: 'leucine' },
  K: { one: 'K', three: 'Lys', name: 'lysine' },
  M: { one: 'M', three: 'Met', name: 'methionine' },
  F: { one: 'F', three: 'Phe', name: 'phenylalanine' },
  P: { one: 'P', three: 'Pro', name: 'proline' },
  S: { one: 'S', three: 'Ser', name: 'serine' },
  T: { one: 'T', three: 'Thr', name: 'threonine' },
  W: { one: 'W', three: 'Trp', name: 'tryptophan' },
  Y: { one: 'Y', three: 'Tyr', name: 'tyrosine' },
  V: { one: 'V', three: 'Val', name: 'valine' },
  '*': { one: '*', three: 'Stop', name: 'stop' },
}

/** One-letter amino acid (or '*' for stop) for an RNA codon. */
export function codonToAmino(codon: string): string {
  if (!/^[UCAG]{3}$/.test(codon)) throw new Error(`not an RNA codon: ${codon}`)
  const i = ORDER.indexOf(codon[0]) * 16 + ORDER.indexOf(codon[1]) * 4 + ORDER.indexOf(codon[2])
  return CODE[i]
}

/** All 64 codons for one amino acid ('*' = the stop codons). */
export const codonsFor = (one: string) => {
  const out: string[] = []
  for (const a of ORDER) for (const b of ORDER) for (const c of ORDER) if (codonToAmino(a + b + c) === one) out.push(a + b + c)
  return out
}

/** mRNA made from a template strand (read 3'→5', written here in that order). */
export const transcribe = (template: string) => [...template].map((b) => PAIR[b as DnaBase]).join('')

/** The template strand that makes this mRNA. */
export const templateFor = (mrna: string) => [...mrna].map((b) => ({ U: 'A', A: 'T', G: 'C', C: 'G' })[b]!).join('')

/** Where the ribosome starts: the first AUG. -1 if there isn't one. */
export const startIndex = (mrna: string) => mrna.indexOf('AUG')

/** Codons read from the first AUG, in threes, up to and including the first stop (or the end). */
export function readingFrame(mrna: string): string[] {
  const s = startIndex(mrna)
  if (s < 0) return []
  const out: string[] = []
  for (let i = s; i + 3 <= mrna.length; i += 3) {
    const c = mrna.slice(i, i + 3)
    out.push(c)
    if (codonToAmino(c) === '*') break
  }
  return out
}

/** The protein (one-letter amino acids, stop not included). */
export const translate = (mrna: string) =>
  readingFrame(mrna)
    .map(codonToAmino)
    .filter((a) => a !== '*')
    .join('')

/** Did the reading frame end on a stop codon? */
export const endsOnStop = (mrna: string) => {
  const f = readingFrame(mrna)
  return f.length > 0 && codonToAmino(f[f.length - 1]) === '*'
}

/** The tRNA anticodon that pairs with a codon, written in the same left-to-right order as the codon. */
export const anticodon = (codon: string) => [...codon].map((b) => ({ A: 'U', U: 'A', G: 'C', C: 'G' })[b]!).join('')

// ---------- the worked example ----------

/** mRNA for the showcase gene: two bases before the start, Met-Phe-Gly-Lys-Trp, then stop. */
export const MRNA = 'GCAUGUUUGGCAAAUGGUAA'
export const TEMPLATE = templateFor(MRNA)
/** The strand the student pairs by hand before the polymerase finishes. */
export const BY_HAND = 6

export type Mutation = { id: 'silent' | 'frameshift' | 'nonsense'; label: string; mrna: string; at: number; what: string }

/** Point changes to the showcase mRNA. Effects come out of translate(), not out of the labels. */
export const MUTATIONS: Mutation[] = [
  { id: 'silent', label: 'Swap one base: the U at the end of UUU becomes C', mrna: MRNA.slice(0, 7) + 'C' + MRNA.slice(8), at: 7, what: 'UUU → UUC' },
  { id: 'nonsense', label: 'Swap one base: the G in UGG becomes A', mrna: MRNA.slice(0, 15) + 'A' + MRNA.slice(16), at: 15, what: 'UGG → UAG' },
  { id: 'frameshift', label: 'Add one extra base (an A) right after AUG', mrna: MRNA.slice(0, 5) + 'A' + MRNA.slice(5), at: 5, what: '+1 base' },
]

export type Effect = 'none' | 'early-stop' | 'everything-after'

/** What a change does to the protein, worked out by translating both. */
export function effectOf(before: string, after: string): Effect {
  const p0 = translate(before)
  const p1 = translate(after)
  if (p0 === p1) return 'none'
  if (p1.length < p0.length && p0.startsWith(p1)) return 'early-stop'
  return 'everything-after'
}
