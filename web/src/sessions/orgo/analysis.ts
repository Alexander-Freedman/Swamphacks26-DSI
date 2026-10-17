import type { Part } from './chem'
import type { RxId } from './sn2'

// Working out a mechanism in the order a student would on paper: find the three parts,
// size each one up, then read the mechanism off the chart. Only after that do the arrows.

export type Strength = 'strong' | 'weak'
export type CarbonKind = 'methyl' | 'primary' | 'secondary' | 'tertiary'
export type LeavingQ = 'good' | 'poor'
export type Mech = 'SN1' | 'SN2' | 'E1' | 'E2'

export type AnalysisMistake = 'charged-nu-weak' | 'carbon-miscounted' | 'bromide-poor-leaving' | 'sn1-on-methyl' | 'elimination-no-neighbor'

/** Tags drawn under the atoms once they're found. */
export const PART_TAG: Record<Part, string> = { nucleophile: 'Nu', electrophile: 'Sub', leaving: 'LG' }

export const PART_ASK: { part: Part; ask: string; hint: string }[] = [
  { part: 'nucleophile', ask: 'Tap the nucleophile: the atom with electrons to give.', hint: 'Look for lone pairs •• and a − charge.' },
  { part: 'electrophile', ask: 'Tap the substrate carbon: the carbon those electrons will go to.', hint: 'It’s the carbon bonded to the leaving group. Br pulls on its electrons, so that carbon is a little positive (δ+).' },
  { part: 'leaving', ask: 'Tap the leaving group: the atom that will leave and take its bond’s electrons.', hint: 'Which atom can leave as a stable ion on its own?' },
]

export type Choice<T extends string> = { value: T; label: string; sub?: string }
export type Question<T extends string> = {
  id: 'nu' | 'carbon' | 'lg'
  /** the atom the question is about, marked on the picture */
  atom: string
  tag: string
  ask: string
  choices: Choice<T>[]
  answer: T
  /** why the answer is right, shown once it's picked */
  why: string
  /** wrong picks that are named mistakes; any other wrong pick gets `retry` */
  traps: Partial<Record<T, AnalysisMistake>>
  retry: string
}

export type Case = {
  rx: RxId
  name: string
  nu: Question<Strength>
  carbon: Question<CarbonKind>
  lg: Question<LeavingQ>
  mech: Mech
  /** the one-paragraph reason, shown when the mechanism is picked */
  why: string
  mechTraps: Partial<Record<Mech, AnalysisMistake>>
}

export const CARBON_SHORT: Record<CarbonKind, string> = { methyl: 'methyl', primary: '1°', secondary: '2°', tertiary: '3°' }

/** The intro-orgo chart: carbon type down the side, nucleophile/base strength across the top. */
export const CHART: Record<CarbonKind, Record<Strength, Mech[]>> = {
  methyl: { strong: ['SN2'], weak: ['SN2'] },
  primary: { strong: ['SN2'], weak: ['SN2'] },
  secondary: { strong: ['SN2', 'E2'], weak: ['SN1', 'E1'] },
  tertiary: { strong: ['E2'], weak: ['SN1', 'E1'] },
}
/** Small print under a chart cell. */
export const CHART_NOTE: Partial<Record<CarbonKind, Partial<Record<Strength, string>>>> = {
  methyl: { weak: 'slow' },
  primary: { weak: 'slow' },
  secondary: { strong: 'base → E2' },
  tertiary: { strong: 'too crowded for SN2' },
}

export const MECHS: { id: Mech; steps: string; what: string }[] = [
  { id: 'SN1', steps: '2 steps', what: 'The leaving group leaves first (a carbocation forms), then the nucleophile attacks.' },
  { id: 'SN2', steps: '1 step', what: 'The nucleophile attacks from the back as the leaving group leaves.' },
  { id: 'E1', steps: '2 steps', what: 'A carbocation forms, then an H on the next carbon leaves to make C=C.' },
  { id: 'E2', steps: '1 step', what: 'A base pulls an H off the next carbon as C=C forms and the leaving group leaves.' },
]

export const SN2_CASE: Case = {
  rx: 'oh-mebr',
  name: 'HO⁻ + CH₃Br',
  nu: {
    id: 'nu',
    atom: 'nu',
    tag: 'Nu',
    ask: 'How strong is the nucleophile, HO⁻?',
    choices: [
      { value: 'strong', label: 'Strong', sub: 'eager to give electrons' },
      { value: 'weak', label: 'Weak', sub: 'holds on to its electrons' },
    ],
    answer: 'strong',
    why: 'Strong. Oxygen carries a − charge and three lone pairs: plenty of electrons and a push to give them away.',
    traps: { weak: 'charged-nu-weak' },
    retry: '',
  },
  carbon: {
    id: 'carbon',
    atom: 'c',
    tag: 'Sub',
    ask: 'What kind of carbon holds the Br? Count the other carbons bonded to it.',
    choices: [
      { value: 'methyl', label: 'Methyl', sub: '0 other carbons' },
      { value: 'primary', label: '1°', sub: '1 other carbon' },
      { value: 'secondary', label: '2°', sub: '2 other carbons' },
      { value: 'tertiary', label: '3°', sub: '3 other carbons' },
    ],
    answer: 'methyl',
    why: 'Methyl. That carbon holds three H and the Br, no other carbons, so nothing crowds its back side.',
    traps: { primary: 'carbon-miscounted', secondary: 'carbon-miscounted', tertiary: 'carbon-miscounted' },
    retry: '',
  },
  lg: {
    id: 'lg',
    atom: 'lg',
    tag: 'LG',
    ask: 'Is Br a good leaving group?',
    choices: [
      { value: 'good', label: 'Good', sub: 'happy to leave as an ion' },
      { value: 'poor', label: 'Poor', sub: 'unstable on its own' },
    ],
    answer: 'good',
    why: 'Good. Br⁻ is a big ion that spreads its charge out, so it’s stable once it leaves (HBr is a strong acid).',
    traps: { poor: 'bromide-poor-leaving' },
    retry: '',
  },
  mech: 'SN2',
  why: 'SN2. A strong nucleophile and a methyl carbon: nothing blocks the back side, so the attack and the departure happen in one step. SN1 and E1 would need a methyl carbocation (far too unstable), and E1/E2 need an H on a neighboring carbon, which CH₃Br doesn’t have.',
  mechTraps: { SN1: 'sn1-on-methyl', E1: 'elimination-no-neighbor', E2: 'elimination-no-neighbor' },
}

export const ANALYSIS_MISTAKES: Record<AnalysisMistake, { label: string; line: string }> = {
  'charged-nu-weak': { label: 'A charged nucleophile called weak', line: 'A − charge plus lone pairs means lots of electrons to give. HO⁻ is strong.' },
  'carbon-miscounted': { label: 'Miscounting the carbon type', line: 'Count only the carbons bonded to the carbon holding Br. In CH₃Br there are none: methyl.' },
  'bromide-poor-leaving': { label: 'Bromide called a poor leaving group', line: 'Br⁻ is big and stable on its own, so it leaves easily.' },
  'sn1-on-methyl': { label: 'SN1 on a methyl carbon', line: 'SN1 needs a carbocation to form first. A methyl carbocation is the least stable there is.' },
  'elimination-no-neighbor': { label: 'Elimination with no neighbor carbon', line: 'E1 and E2 remove an H from the next carbon to make C=C. CH₃Br has no next carbon.' },
}
