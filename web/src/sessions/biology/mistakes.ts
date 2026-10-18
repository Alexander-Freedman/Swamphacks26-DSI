// Named wrong answers in the biology session. Labels are what the notebook shows (notebook.ts EXTRA_LABELS).

export type BioMistake =
  | 'rna-has-thymine'
  | 'copied-not-paired'
  | 'mispaired-base'
  | 'too-few-bases-per-codon'
  | 'starts-at-first-base'
  | 'read-anticodon'
  | 'stop-has-amino-acid'
  | 'every-change-breaks-protein'
  | 'frameshift-one-change'
  | 'new-stop-missed'

export const BIO_MISTAKES: Record<BioMistake, { label: string; line: string }> = {
  'rna-has-thymine': { label: 'Putting T in RNA', line: 'RNA has no T (thymine). It uses U (uracil) instead, so A in DNA pairs with U in RNA.' },
  'copied-not-paired': { label: 'Copying the base instead of pairing it', line: 'The new strand is the partner, not a copy: A pairs with U, T with A, G with C, C with G.' },
  'mispaired-base': { label: 'Pairing the wrong bases', line: 'Only two pairs fit: A with U (T in DNA) and G with C. A big base always pairs with a small one.' },
  'too-few-bases-per-codon': { label: 'Too few bases per codon', line: 'One base gives only 4 words and two give 16, but there are 20 amino acids. Three give 64: enough, with spares.' },
  'starts-at-first-base': { label: 'Starting at the first base', line: 'The ribosome starts at the start codon AUG, not at the first base. The bases before AUG are never read.' },
  'read-anticodon': { label: 'Reading the anticodon', line: 'That’s the amino acid for the tRNA’s side (the anticodon). Look up the mRNA codon itself.' },
  'stop-has-amino-acid': { label: 'A stop codon with an amino acid', line: 'UAA, UAG and UGA have no tRNA. Nothing new is added, and the finished protein is let go.' },
  'every-change-breaks-protein': { label: 'Every change breaks the protein', line: 'The code has spares: UUU and UUC both mean Phe, so this change is silent. The protein is the same.' },
  'frameshift-one-change': { label: 'An extra base changes just one amino acid', line: 'One extra base shifts every codon after it (a frameshift), so every amino acid after it changes.' },
  'new-stop-missed': { label: 'Missing a new stop codon', line: 'UGG became UAG, a stop codon. The ribosome lets go right there, so the protein ends early.' },
}
