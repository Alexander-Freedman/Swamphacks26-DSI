import type { Part, PartMap } from './chem'
import { MECHS as RUNS, mechScene, type MechId } from './mechs'
import { RX, sceneAt, type Scene } from './sn2'

// Working out a mechanism in the order a student would on paper: find the three parts,
// size each one up, then read the mechanism off the chart. Only after that do the arrows.

export type Strength = 'strong' | 'weak'
export type CarbonKind = 'methyl' | 'primary' | 'secondary' | 'tertiary'
export type LeavingQ = 'good' | 'poor'
export type Mech = 'SN1' | 'SN2' | 'E1' | 'E2'

export type AnalysisMistake =
  | 'charged-nu-weak' | 'carbon-miscounted' | 'bromide-poor-leaving' | 'sn1-on-methyl' | 'elimination-no-neighbor'
  | 'neutral-nu-strong' | 'tertiary-miscounted' | 'sn2-on-tertiary' | 'carbocation-with-strong-base' | 'e2-weak-base' | 'e1-without-heat' | 'sn1-with-heat'

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

/** What a part is called in this reaction, when it isn't the substitution wording (a base, not a nucleophile). */
export type PartWords = { tag: string; name: string; ask: string; hint: string }

export type Case = {
  name: string
  /** the reactants as drawn, before anything moves */
  picture: () => { scene: Scene; vh?: number }
  /** which atom is which part, and tempting wrong taps */
  parts: PartMap
  /** atom names for screen readers and the found list */
  names: Record<string, string>
  /** what the parts step says under its title */
  partsSub: string
  /** "nucleophile", "base", or "nucleophile/base" in the sentences */
  nuWord: string
  /** the condition that tips SN1 vs E1 (shown on the picture and next to the chart) */
  cue?: string
  words?: Partial<Record<Part, PartWords>>
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
  tertiary: { strong: 'too crowded for SN2', weak: 'heat → E1' },
}

export const MECHS: { id: Mech; steps: string; what: string }[] = [
  { id: 'SN1', steps: '2 steps', what: 'The leaving group leaves first (a carbocation forms), then the nucleophile attacks.' },
  { id: 'SN2', steps: '1 step', what: 'The nucleophile attacks from the back as the leaving group leaves.' },
  { id: 'E1', steps: '2 steps', what: 'A carbocation forms, then an H on the next carbon leaves to make C=C.' },
  { id: 'E2', steps: '1 step', what: 'A base pulls an H off the next carbon as C=C forms and the leaving group leaves.' },
]

const SN2_NAMES: Record<string, string> = { back: 'H of hydroxide', nu: 'O of hydroxide', c: 'carbon of CH₃Br', h1: 'H on carbon', h2: 'H on carbon', h3: 'H on carbon', lg: 'Br' }

export const SN2_CASE: Case = {
  name: 'HO⁻ + CH₃Br',
  picture: () => ({ scene: sceneAt(RX['oh-mebr'], 0) }),
  parts: RX['oh-mebr'].parts,
  names: SN2_NAMES,
  partsSub: 'Every substitution has three players: the nucleophile brings electrons, the substrate carbon receives them, and the leaving group breaks off with its bond’s electrons. Tap each one in HO⁻ + CH₃Br.',
  nuWord: 'nucleophile',
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

// ---------- SN1, E2, E1: all on (CH₃)₃C–Br, so only the reagent and the conditions change ----------

const runNames = (id: MechId) => Object.fromEntries(RUNS[id].atoms.map((a) => [a.id, a.name]))
const runParts: PartMap = { nucleophile: 'o', electrophile: 'c', leaving: 'lg' }
const BASE_WORDS: PartWords = { tag: 'Base', name: 'base', ask: 'Tap the base: the atom whose lone pair will grab an H.', hint: 'Look for lone pairs •• on an atom that isn’t holding the Br.' }
const SUB_WORDS: PartWords = { tag: 'Sub', name: 'substrate carbon', ask: 'Tap the substrate carbon: the carbon holding the leaving group.', hint: 'It’s the carbon bonded to Br. Br pulls on its electrons, so it’s a little positive (δ+).' }

const tertiary = (left: string): Question<CarbonKind> => ({
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
  answer: 'tertiary',
  why: `3°. The carbon holding Br is bonded to three other carbons: two CH₃ groups and ${left}. Three groups crowd its back side.`,
  traps: { methyl: 'tertiary-miscounted', primary: 'tertiary-miscounted', secondary: 'tertiary-miscounted' },
  retry: '',
})
const LG_BR: Question<LeavingQ> = SN2_CASE.lg

const WATER_NU: Question<Strength> = {
  id: 'nu',
  atom: 'o',
  tag: 'Nu',
  ask: 'How strong is water (H₂O) as a nucleophile or base?',
  choices: [
    { value: 'strong', label: 'Strong', sub: 'eager to give electrons' },
    { value: 'weak', label: 'Weak', sub: 'holds on to its electrons' },
  ],
  answer: 'weak',
  why: 'Weak. Water has lone pairs but no − charge pushing them out, so it waits for something very positive (a carbocation) before it reacts.',
  traps: { strong: 'neutral-nu-strong' },
  retry: '',
}

export const E2_CASE: Case = {
  name: 'HO⁻ + (CH₃)₃C–Br',
  picture: () => ({ scene: mechScene(RUNS.e2, 0), vh: RUNS.e2.vh }),
  parts: runParts,
  names: runNames('e2'),
  partsSub: 'An elimination has three players: a base grabs an H, the substrate carbon holds the leaving group, and the leaving group breaks off with its bond’s electrons. Tap each one in HO⁻ + (CH₃)₃C–Br.',
  nuWord: 'base',
  words: { nucleophile: BASE_WORDS, electrophile: SUB_WORDS },
  nu: { ...SN2_CASE.nu, atom: 'o', tag: 'Base', ask: 'How strong is HO⁻ as a base?', why: 'Strong. Oxygen carries a − charge and three lone pairs, so it grabs an H⁺ as fast as it would attack a carbon.' },
  carbon: tertiary('the left carbon (a CH₃ drawn out with its H’s)'),
  lg: LG_BR,
  mech: 'E2',
  why: 'E2. A strong base on a 3° carbon: the three groups block any back-side attack (no SN2), and a strong base doesn’t wait for a carbocation. It pulls the H across from Br while C=C forms and Br leaves, all in one step.',
  mechTraps: { SN2: 'sn2-on-tertiary', SN1: 'carbocation-with-strong-base', E1: 'carbocation-with-strong-base' },
}

export const SN1_CASE: Case = {
  name: '(CH₃)₃C–Br in water, room temperature',
  picture: () => ({ scene: mechScene(RUNS.sn1, 0), vh: RUNS.sn1.vh }),
  parts: runParts,
  names: runNames('sn1'),
  partsSub: 'Every substitution has three players: the nucleophile brings electrons, the substrate carbon receives them, and the leaving group breaks off with its bond’s electrons. Here the nucleophile is water. Tap each one.',
  nuWord: 'nucleophile/base',
  cue: 'room temperature (no heat)',
  nu: WATER_NU,
  carbon: tertiary('one more CH₃'),
  lg: LG_BR,
  mech: 'SN1',
  why: 'SN1. Weak water and a 3° carbon put you in the SN1 / E1 box: Br leaves on its own first, because three CH₃ groups hold up the + charge of the carbocation. With no heat, water bonds to C⁺ (substitution) more than it pulls off an H.',
  mechTraps: { SN2: 'sn2-on-tertiary', E2: 'e2-weak-base', E1: 'e1-without-heat' },
}

export const E1_CASE: Case = {
  name: '(CH₃)₃C–Br in water, heated (Δ)',
  picture: () => ({ scene: mechScene(RUNS.e1, 0), vh: RUNS.e1.vh }),
  parts: runParts,
  names: runNames('e1'),
  partsSub: 'An elimination has three players: a base grabs an H, the substrate carbon holds the leaving group, and the leaving group breaks off with its bond’s electrons. Here the base is water. Tap each one.',
  nuWord: 'nucleophile/base',
  cue: 'heated (Δ)',
  words: { nucleophile: BASE_WORDS, electrophile: SUB_WORDS },
  nu: { ...WATER_NU, tag: 'Base' },
  carbon: tertiary('the left carbon (a CH₃ drawn out with its H’s)'),
  lg: LG_BR,
  mech: 'E1',
  why: 'E1. Same box as SN1 (weak water, 3° carbon, so the carbocation forms first), but heat tips it: elimination makes more molecules than it uses, and heat favors that. Water pulls an H off the carbon next to C⁺ and C=C forms.',
  mechTraps: { SN2: 'sn2-on-tertiary', E2: 'e2-weak-base', SN1: 'sn1-with-heat' },
}

/** The worked-out case for each mechanism topic (the guided path uses SN2). */
export const CASES: Record<string, Case> = { sn2: SN2_CASE, full: SN2_CASE, sn1: SN1_CASE, e2: E2_CASE, e1: E1_CASE }

export const ANALYSIS_MISTAKES: Record<AnalysisMistake, { label: string; line: string }> = {
  'charged-nu-weak': { label: 'A charged nucleophile called weak', line: 'A − charge plus lone pairs means lots of electrons to give. HO⁻ is strong.' },
  'carbon-miscounted': { label: 'Miscounting the carbon type', line: 'Count only the carbons bonded to the carbon holding Br. In CH₃Br there are none: methyl.' },
  'bromide-poor-leaving': { label: 'Bromide called a poor leaving group', line: 'Br⁻ is big and stable on its own, so it leaves easily.' },
  'sn1-on-methyl': { label: 'SN1 on a methyl carbon', line: 'SN1 needs a carbocation to form first. A methyl carbocation is the least stable there is.' },
  'elimination-no-neighbor': { label: 'Elimination with no neighbor carbon', line: 'E1 and E2 remove an H from the next carbon to make C=C. CH₃Br has no next carbon.' },
  'neutral-nu-strong': { label: 'Neutral water called strong', line: 'Water has lone pairs but no − charge to push them out. It’s weak: it waits for a carbocation.' },
  'tertiary-miscounted': { label: 'Miscounting a 3° carbon', line: 'Count the carbons bonded to the carbon holding Br: three of them (every CH₃ counts), so it’s 3°.' },
  'sn2-on-tertiary': { label: 'SN2 on a 3° carbon', line: 'SN2 needs a clear path to the back of the carbon. Three groups block it completely.' },
  'carbocation-with-strong-base': { label: 'Waiting for a carbocation with a strong base', line: 'A strong base doesn’t wait for Br to leave on its own. It pulls the H right away, in one step: E2.' },
  'e2-weak-base': { label: 'E2 with a weak base', line: 'E2 needs a strong base to rip the H off while Br leaves. Water is too weak, so the carbocation forms first.' },
  'e1-without-heat': { label: 'E1 without heat', line: 'Both start with the same carbocation. With no heat, water mostly bonds to C⁺: SN1. Heat is what tips it to E1.' },
  'sn1-with-heat': { label: 'Ignoring the heat', line: 'Same carbocation as SN1, but heat favors elimination (it makes more molecules), so water pulls an H off instead: E1.' },
}
