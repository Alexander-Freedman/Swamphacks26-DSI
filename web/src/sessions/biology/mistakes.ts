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
  | 'heart-sides-swapped'
  | 'enters-ventricle'
  | 'valve-mixup'
  | 'skips-ventricle'
  | 'right-pumps-to-body'
  | 'lungs-remove-oxygen'
  | 'equal-ventricles'
  | 'glucose-not-filtered'
  | 'glucose-in-urine'
  | 'urine-is-all-filtrate'
  | 'waste-all-reabsorbed'
  | 'urea-not-filtered'
  | 'adh-backwards'
  | 'filaments-shrink'
  | 'bands-all-shrink'
  | 'atp-uncovers-sites'
  | 'atp-makes-grab'

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
  'heart-sides-swapped': { label: 'Mixing up the heart’s sides', line: 'The right side takes oxygen-poor blood from the body and sends it to the lungs. The left side takes oxygen-rich blood from the lungs and sends it to the body.' },
  'enters-ventricle': { label: 'Blood entering a ventricle first', line: 'Blood always comes into an atrium first. The atria are the waiting rooms; the ventricles are the pumps.' },
  'valve-mixup': { label: 'Mixing up the valves', line: 'Right side: tricuspid, then pulmonary. Left side: mitral, then aortic.' },
  'skips-ventricle': { label: 'Skipping the ventricle', line: 'Every trip goes atrium → ventricle. The ventricle does the big push out of the heart.' },
  'right-pumps-to-body': { label: 'The right ventricle pumping to the body', line: 'The right ventricle sends blood to the lungs to pick up oxygen. Only the left ventricle pumps to the body.' },
  'lungs-remove-oxygen': { label: 'Lungs taking oxygen out', line: 'The lungs load oxygen into the blood and unload CO₂. The body’s tissues are where oxygen gets used up.' },
  'equal-ventricles': { label: 'Both ventricles equally strong', line: 'The left ventricle’s wall is much thicker: it pushes blood around the whole body, the right only to the lungs next door.' },
  'glucose-not-filtered': { label: 'Glucose too big to filter', line: 'Glucose is small and passes the filter easily. It’s taken back later, in the proximal tubule.' },
  'glucose-in-urine': { label: 'Glucose lost in urine', line: 'A healthy kidney takes back nearly all the glucose in the proximal tubule. Glucose in urine is a warning sign (as in diabetes).' },
  'urine-is-all-filtrate': { label: 'Urine is everything filtered', line: 'About 180 L is filtered a day but only about 1.5 L leaves: roughly 99% of the water goes back into the blood.' },
  'waste-all-reabsorbed': { label: 'All the urea goes back', line: 'Some urea leaks back, but about half leaves in urine. Getting rid of it is the point.' },
  'urea-not-filtered': { label: 'Urea not filtered', line: 'Urea is a small molecule, so it passes the filter with the water.' },
  'adh-backwards': { label: 'ADH backwards', line: 'ADH saves water: it opens water channels so more water goes back into the blood, leaving less, more concentrated urine.' },
  'filaments-shrink': { label: 'Filaments shrinking', line: 'Neither filament gets shorter. Thin filaments slide over thick ones and pull the Z lines together.' },
  'bands-all-shrink': { label: 'The A band shrinking', line: 'Only the zones without overlap shrink (the I band and H zone). The A band is myosin’s own length, and that stays the same.' },
  'atp-uncovers-sites': { label: 'ATP uncovering the binding sites', line: 'Ca²⁺ does that: it binds troponin, which moves tropomyosin off actin. ATP powers the heads and lets them go.' },
  'atp-makes-grab': { label: 'ATP making myosin grab', line: 'It’s the other way round: ATP makes the head let go. With no ATP the heads stay locked on (rigor mortis).' },
}
