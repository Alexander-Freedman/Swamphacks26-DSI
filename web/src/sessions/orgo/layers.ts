import { ELEMENTS, formalCharge, type El, type Pt } from './chem'
import { C_X, RX, sceneAt, type SAtom, type Scene } from './sn2'

// "Peel SN2": one picture of HO⁻ + CH₃Br, opened one layer at a time. Each layer adds one idea
// and one thing to do. Everything a layer claims is computed here (formal charges, the hill's top,
// what blocks the back side), and each layer has a LayerHelp object for the side chat (#243).

export type LayerHelp = {
  title: string
  /** 1-2 plain sentences: what the student sees on this layer */
  onScreen: string
  /** the only numbers/claims the tutor may use */
  facts: string[]
  /** tap-to-ask questions */
  suggested: string[]
  /** static fallback when the chat is capped/offline */
  hint: string
}

export type LayerMistake = 'attack-the-bromine' | 'attack-the-oxygen' | 'attack-a-hydrogen' | 'bromine-pair-attacks' | 'ts-not-at-top' | 'crowded-carbon-faster'

export const LAYER_MISTAKES: Record<LayerMistake, { label: string; line: string }> = {
  'attack-the-bromine': { label: 'Br as the target', line: 'Br is what leaves. The electrons go to the carbon holding it.' },
  'attack-the-oxygen': { label: 'The attacker as the target', line: 'HO⁻ is the attacker: it brings the electrons. They go to the carbon.' },
  'attack-a-hydrogen': { label: 'An H as the target', line: 'Br pulls electrons off the carbon, so the carbon (δ+) is the target, not an H.' },
  'bromine-pair-attacks': { label: 'Br’s lone pair attacks', line: 'Br has no charge (FC 7 − 6 − 1 = 0) and is about to leave. O carries the − (FC 6 − 6 − 1 = −1).' },
  'ts-not-at-top': { label: 'Transition state off the top', line: 'The transition state is the highest point: O–C half made, C–Br half broken.' },
  'crowded-carbon-faster': { label: 'More groups, faster SN2', line: 'Every group on the carbon crowds its back side. Fewer groups, faster SN2: methyl > 1° > 2° >> 3°.' },
}

export type LayerId = 'atoms' | 'pairs' | 'arrows' | 'hill' | 'crowd'
export type Layer = { n: number; id: LayerId; short: string; title: string; ask: string; help: LayerHelp }

const RXN = RX['oh-mebr']
/** Formal charge of an atom in the starting picture: FC = valence − nonbonding − bonds. */
export function fcParts(el: El, lonePairs: number, bonds: number) {
  const v = ELEMENTS[el].valence
  return { v, n: 2 * lonePairs, b: bonds, fc: formalCharge(v, 2 * lonePairs, 2 * bonds) }
}
export const FC = { O: fcParts('O', 3, 1), C: fcParts('C', 0, 4), Br: fcParts('Br', 3, 1) }
const fcLine = (el: string, p: { v: number; n: number; b: number; fc: number }) => `FC(${el}) = ${p.v} − ${p.n} − ${p.b} = ${p.fc === 0 ? '0' : p.fc < 0 ? `−${-p.fc}` : `+${p.fc}`}`
export const FC_LINES = [fcLine('O', FC.O), fcLine('C', FC.C), fcLine('Br', FC.Br)]

export const LAYERS: Layer[] = [
  {
    n: 1,
    id: 'atoms',
    short: 'Atoms',
    title: 'Atoms',
    ask: 'Tap the atom HO⁻ will attack.',
    help: {
      title: 'Atoms',
      onScreen: 'Only atoms and bonds: H–O on the left, CH₃Br (a carbon with three H and a Br) on the right.',
      facts: ['HO⁻ + CH₃Br → CH₃OH + Br⁻', 'Br pulls electrons off the carbon, so that carbon is δ+', 'The attacked atom is the carbon bonded to Br'],
      suggested: ['Why the carbon and not the Br?', 'What does δ+ mean?', 'Why is Br pulling on the electrons?'],
      hint: 'Look for the atom that is short on electrons: the one Br is pulling on.',
    },
  },
  {
    n: 2,
    id: 'pairs',
    short: 'Electron pairs',
    title: 'Electron pairs',
    ask: 'Tap a lone pair that will attack.',
    help: {
      title: 'Electron pairs',
      onScreen: 'Lone pairs (••) and formal charges now show: O has three pairs and a − charge, Br has three pairs and no charge.',
      facts: ['FC = valence − nonbonding electrons − bonds', ...FC_LINES, 'The attacking pair is on O, the atom with the − charge'],
      suggested: ['How do I count formal charge?', 'Why doesn’t Br’s lone pair attack?', 'Which O pair is the one drawn?'],
      hint: 'The attacker is the atom with spare electrons and a − charge.',
    },
  },
  {
    n: 3,
    id: 'arrows',
    short: 'Curved arrows',
    title: 'Curved arrows',
    ask: 'Draw the two arrows: where do the electrons go?',
    help: {
      title: 'Curved arrows',
      onScreen: 'You draw curved arrows on HO⁻ + CH₃Br, then the reaction plays: O comes in from the back of the carbon as Br leaves.',
      facts: ['An arrow starts at electrons (a lone pair or a bond) and ends where they go', 'Arrow 1: O’s lone pair → the back of C (opposite Br)', 'Arrow 2: the C–Br bond → Br', 'SN2 is one step: both arrows happen at once', 'The carbon turns inside out (inversion)'],
      suggested: ['Why from the back?', 'Why does the C–Br bond need an arrow?', 'What is inversion?'],
      hint: 'Two arrows: one brings electrons to the carbon, one takes the C–Br electrons away.',
    },
  },
  {
    n: 4,
    id: 'hill',
    short: 'Energy hill',
    title: 'Energy hill',
    ask: 'Drag the dot to the transition state.',
    help: {
      title: 'Energy hill',
      onScreen: 'An energy diagram sits under the molecules: one hill from reactants to products. Moving the dot along it runs the reaction.',
      facts: ['SN2 is one step, so the diagram has one hill', 'The top of the hill is the transition state', 'At the transition state O–C is half formed and C–Br half broken (dashed)', 'O and Br each carry part of the − charge (δ−) at the top'],
      suggested: ['Why only one hill?', 'What is a transition state?', 'Why are the bonds dashed at the top?'],
      hint: 'The transition state is the highest point of the hill.',
    },
  },
  {
    n: 5,
    id: 'crowd',
    short: 'Crowding',
    title: 'Crowding',
    ask: 'Swap in bigger groups. Which carbon does SN2 work best on?',
    help: {
      title: 'Crowding',
      onScreen: 'The H’s on the carbon can be swapped for CH₃ groups (1°, 2°, 3°). The more groups, the more of the back side is blocked.',
      facts: ['SN2 needs a clear path to the back of the carbon', 'SN2 rate: methyl > 1° > 2° >> 3°', 'On a 3° carbon the three groups block the back side: no SN2'],
      suggested: ['Why is 3° so slow?', 'What happens on a 3° carbon instead?', 'Is 1° still fast?'],
      hint: 'Fewer groups on the carbon leave the back side open.',
    },
  },
]

/** The layer objects for the side chat, keyed by layer number. */
export const sn2Layers: Record<number, LayerHelp> = Object.fromEntries(LAYERS.map((l) => [l.n, l.help]))

/* ---------- layer 1: tap the atom that gets attacked ---------- */

export type Verdict<M> = { ok: boolean; mistake: M | null }

export function gradeAtomTap(id: string): Verdict<LayerMistake> {
  if (id === 'c') return { ok: true, mistake: null }
  if (id === 'lg') return { ok: false, mistake: 'attack-the-bromine' }
  if (id === 'nu' || id === 'back') return { ok: false, mistake: 'attack-the-oxygen' }
  return { ok: false, mistake: 'attack-a-hydrogen' }
}

/** Layer 1 shows atoms and bonds only: no lone pairs, no charges. */
export const bare = (s: Scene): Scene => ({ ...s, atoms: s.atoms.map((a) => ({ ...a, lp: [], charge: 0, partial: false })) })

/* ---------- layer 2: tap the lone pair that attacks ---------- */

export function gradePairTap(atom: string): Verdict<LayerMistake> {
  if (atom === 'nu') return { ok: true, mistake: null }
  if (atom === 'lg') return { ok: false, mistake: 'bromine-pair-attacks' }
  return { ok: false, mistake: null }
}

/* ---------- layer 4: the energy hill ---------- */

/** Where the hill sits inside the picture (viewBox units, under the molecules). */
export const HILL = { x0: 40, x1: 400, top: 186, base: 300, vh: 314 }
const REACT = 0.42 // energy of the reactants (0 = bottom, 1 = top of the box)
const PROD = 0.2 // products sit lower: the reaction gives off energy
/** Energy along the reaction (t: 0 reactants, 1 products), 0-1. One hump: one step. */
export function energy(t: number): number {
  const s = t * t * (3 - 2 * t)
  return REACT + (PROD - REACT) * s + 0.62 * Math.exp(-(((t - 0.5) / 0.16) ** 2))
}
/** The top of the hill, found on the curve itself. */
export const TS_T = (() => {
  let best = 0
  for (let k = 0; k <= 1000; k++) if (energy(k / 1000) > energy(best / 1000)) best = k
  return best / 1000
})()
export const hillPt = (t: number): Pt => ({ x: HILL.x0 + (HILL.x1 - HILL.x0) * t, y: HILL.base - (HILL.base - HILL.top) * energy(t) })
export const hillPath = () =>
  Array.from({ length: 81 }, (_, k) => hillPt(k / 80))
    .map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

export type HillSpot = 'top' | 'start' | 'end' | 'up' | 'down'
export function hillSpot(t: number): HillSpot {
  if (Math.abs(t - TS_T) <= 0.06) return 'top'
  if (t < 0.15) return 'start'
  if (t > 0.85) return 'end'
  return t < TS_T ? 'up' : 'down'
}
export const HILL_SAY: Record<HillSpot, string> = {
  top: 'The top: bonds half made, half broken.',
  start: 'That’s the start: HO⁻ and CH₃Br, apart.',
  end: 'That’s the end: CH₃OH and Br⁻.',
  up: 'Still climbing: O–C isn’t half made yet.',
  down: 'Past the top: Br is already on its way out.',
}
export function gradeHill(t: number): Verdict<LayerMistake> {
  return hillSpot(t) === 'top' ? { ok: true, mistake: null } : { ok: false, mistake: 'ts-not-at-top' }
}

/* ---------- layer 5: crowding ---------- */

export type Kind = 'methyl' | 'primary' | 'secondary' | 'tertiary'
export const KINDS: Kind[] = ['methyl', 'primary', 'secondary', 'tertiary']
export const KIND_SHORT: Record<Kind, string> = { methyl: 'methyl', primary: '1°', secondary: '2°', tertiary: '3°' }
export const KIND_FORMULA: Record<Kind, string> = { methyl: 'CH₃Br', primary: 'CH₃CH₂Br', secondary: '(CH₃)₂CHBr', tertiary: '(CH₃)₃CBr' }
/** SN2 speed, fastest first (relative order only). */
export const SN2_ORDER: Kind[] = ['methyl', 'primary', 'secondary', 'tertiary']
/** Which of the carbon's three H's become CH₃ groups for each kind (h3 sits in the attack path). */
const SWAP: Record<Kind, string[]> = { methyl: [], primary: ['h1'], secondary: ['h1', 'h2'], tertiary: ['h1', 'h2', 'h3'] }
export const groups = (k: Kind) => SWAP[k].length

/** How much room each CH₃ takes (drawn as a soft halo) and how close the attack path runs. */
export const BULK_R = 30
const PATH_Y = 85

/** The starting picture with the carbon's H's swapped for CH₃ groups. */
export function crowdScene(k: Kind): Scene {
  const s = sceneAt(RXN, 0)
  const swap = new Set(SWAP[k])
  const atoms: SAtom[] = s.atoms.map((a) => (swap.has(a.id) ? { ...a, el: 'C' as const, label: 'CH₃', ...push(a) } : a))
  return { ...s, atoms }
}
// a CH₃ is bigger than an H: set it a little further out along its bond
function push(a: SAtom): { x: number; y: number } {
  const dx = a.x - C_X
  const dy = a.y - PATH_Y
  const d = Math.hypot(dx, dy) || 1
  return { x: C_X + (dx / d) * (d + 6), y: PATH_Y + (dy / d) * (d + 6) }
}

/** True when a CH₃ group's bulk sits across the straight line the nucleophile takes to the back of the carbon. */
export function backBlocked(k: Kind): boolean {
  return crowdScene(k).atoms.some((a) => a.label === 'CH₃' && a.x < C_X && Math.abs(a.y - PATH_Y) < BULK_R)
}

export function gradeCrowd(k: Kind): Verdict<LayerMistake | 'sn2-on-tertiary'> {
  if (k === SN2_ORDER[0]) return { ok: true, mistake: null }
  return { ok: false, mistake: k === 'tertiary' ? 'sn2-on-tertiary' : 'crowded-carbon-faster' }
}
