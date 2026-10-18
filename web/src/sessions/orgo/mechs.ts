import { ELEMENTS, formalCharge, sameBond, type Arrow, type El, type MechHint, type MechMistake, type Pt, type Source, type Target } from './chem'
import { ease, VW, type SAtom, type SBond, type Scene } from './sn2'

// SN1, E2 and E1 as keyframes: key 0 = reactants, one more key per step. Positions move between
// keys; lone pairs, bonds and charges switch over around the middle of each step. Charges come
// from formalCharge on each key's lone pairs and bond orders, never written by hand.
// All three use (CH₃)₃C–Br so the only thing that changes is the conditions:
// strong base → E2 (one step); water → SN1 or E1 (carbocation first).

export type MechId = 'sn1' | 'e2' | 'e1'

/** Mistakes a mechanism can name: its own, plus the shared arrow ones in chem.ts. */
export type AnyMistake = MechMistake | 'arrow-from-electrophile' | 'arrow-backwards' | 'leaving-bond-stays'
type AnyHint = MechHint | 'not-from-electrons' | 'extra-arrow' | 'none'

type KAtom = { id: string; el: El; name: string; label?: string; at: Pt[]; lp: number[][] }
type KBond = { a: string; b: string; order: number[] }
type Pat = { from: Source; to: Target }
type Real = { pat: Pat; alts?: Pat[]; bend?: Pt; missing: { mistake?: AnyMistake; needs?: number; hint: MechHint } }
type Trap = { when: (a: Arrow) => boolean; mistake: AnyMistake }
export type Stage = { title: string; sub: string; real: Real[]; traps: Trap[]; caption: (u: number) => string }
export type Mech = { id: MechId; vh: number; text: string[]; atoms: KAtom[]; bonds: KBond[]; stages: Stage[] }

// ---------- arrow patterns ----------
const lp = (atom: string): Source => ({ kind: 'lp', atom, slot: 0 })
const atom = (id: string): Target => ({ kind: 'atom', atom: id })
const bond = (a: string, b: string): Source & Target => ({ kind: 'bond', a, b })
const same = (x: Source | Target, y: Source | Target) =>
  x.kind === y.kind && (x.kind === 'bond' ? sameBond(x, y as { a: string; b: string }) : x.atom === (y as { atom: string }).atom)
export const matches = (a: Arrow, p: Pat) => same(a.from, p.from) && same(a.to, p.to)
const touches = (s: Source | Target, id: string) => (s.kind === 'bond' ? s.a === id || s.b === id : s.atom === id)
const fromLp = (o: string, to: string[]) => (a: Arrow) => a.from.kind === 'lp' && a.from.atom === o && to.some((id) => touches(a.to, id))
const fromAtom = (id: string) => (a: Arrow) => a.from.kind === 'atom' && a.from.atom === id
/** Br giving electrons to carbon: from its lone pair, the C–Br bond pointed at C, or Br itself. */
const backwards = (c: string, lg: string) => (a: Arrow) =>
  (a.from.kind === 'lp' && a.from.atom === lg && touches(a.to, c)) ||
  (a.from.kind === 'bond' && sameBond(a.from, { a: c, b: lg }) && a.to.kind === 'atom' && a.to.atom === c) ||
  (a.from.kind === 'atom' && a.from.atom === lg)

const LEAVE: Real = { pat: { from: bond('c', 'lg'), to: atom('lg') }, bend: { x: 272, y: 68 }, missing: { hint: 'mech-leave' } }
const IONIZE_CAP = (u: number) => (u < 0.5 ? 'C–Br breaks on its own. Br takes both electrons.' : 'A flat C⁺ is left. This slow step sets the speed.')

// tert-butyl bromide drawn as a cross: CH₃ up and down, Br on the right, the third group on the left.
const CH3 = (id: string, name: string, at: Pt[]): KAtom => ({ id, el: 'C', label: 'CH₃', name, at, lp: at.map(() => []) })
const BR = (at: Pt[], keys: number): KAtom => ({ id: 'lg', el: 'Br', name: 'Br', at, lp: at.map((_, k) => (k < keys ? [90, 0, 270] : [90, 0, 270, 180])) })

const RAW: Record<MechId, Mech> = {
  sn1: {
    id: 'sn1',
    vh: 190,
    text: ['(CH₃)₃C–Br + H₂O', '(CH₃)₃C⁺ + Br⁻', '(CH₃)₃C–OH₂⁺ + Br⁻'],
    atoms: [
      { id: 'c', el: 'C', name: 'central C', at: [{ x: 240, y: 95 }, { x: 240, y: 95 }, { x: 240, y: 95 }], lp: [[], [], []] },
      CH3('m1', 'top CH₃', [{ x: 240, y: 35 }, { x: 270, y: 43 }, { x: 240, y: 35 }]),
      CH3('m2', 'bottom CH₃', [{ x: 240, y: 155 }, { x: 270, y: 147 }, { x: 240, y: 155 }]),
      CH3('m3', 'left CH₃', [{ x: 178, y: 95 }, { x: 178, y: 95 }, { x: 178, y: 95 }]),
      BR([{ x: 302, y: 95 }, { x: 385, y: 150 }, { x: 385, y: 150 }], 1),
      { id: 'o', el: 'O', name: 'O of water', at: [{ x: 362, y: 40 }, { x: 362, y: 40 }, { x: 302, y: 95 }], lp: [[222, 132], [222, 132], [90]] },
      { id: 'ha', el: 'H', name: 'H of water (top)', at: [{ x: 403, y: 25 }, { x: 403, y: 25 }, { x: 338, y: 70 }], lp: [[], [], []] },
      { id: 'hb', el: 'H', name: 'H of water (bottom)', at: [{ x: 384, y: 78 }, { x: 384, y: 78 }, { x: 338, y: 120 }], lp: [[], [], []] },
    ],
    bonds: [
      { a: 'c', b: 'm1', order: [1, 1, 1] },
      { a: 'c', b: 'm2', order: [1, 1, 1] },
      { a: 'c', b: 'm3', order: [1, 1, 1] },
      { a: 'c', b: 'lg', order: [1, 0, 0] },
      { a: 'o', b: 'ha', order: [1, 1, 1] },
      { a: 'o', b: 'hb', order: [1, 1, 1] },
      { a: 'c', b: 'o', order: [0, 0, 1] },
    ],
    stages: [
      {
        title: 'SN1, step 1: the slow step',
        sub: 'Draw the curved arrow for the first step: the change that happens on its own, before water does anything. An arrow starts on a pair of electrons and ends where that pair goes.',
        real: [LEAVE],
        traps: [
          { when: fromLp('o', ['c']), mistake: 'sn1-attack-first' },
          { when: backwards('c', 'lg'), mistake: 'arrow-backwards' },
          { when: fromAtom('c'), mistake: 'arrow-from-electrophile' },
        ],
        caption: IONIZE_CAP,
      },
      {
        title: 'SN1, step 2: fill the C⁺',
        sub: 'Br left with both electrons, so the carbon has only 3 bonds and a + charge (C⁺). Draw the arrow that gives it a 4th bond.',
        real: [{ pat: { from: lp('o'), to: atom('c') }, bend: { x: 286, y: 52 }, missing: { hint: 'mech-attack' } }],
        traps: [{ when: fromAtom('c'), mistake: 'arrow-from-electrophile' }],
        caption: (u) => (u < 0.5 ? 'Water’s lone pair fills the empty spot on C⁺.' : 'O has 3 bonds now (O⁺). Another water takes that H⁺: (CH₃)₃C–OH.'),
      },
    ],
  },

  e2: {
    id: 'e2',
    vh: 190,
    text: ['HO⁻ + (CH₃)₃C–Br', 'H₂O + (CH₃)₂C=CH₂ + Br⁻'],
    atoms: [
      { id: 'o', el: 'O', name: 'O of hydroxide', at: [{ x: 105, y: 38 }, { x: 112, y: 38 }], lp: [[0, 90, 270], [90, 270]] },
      { id: 'oh', el: 'H', name: 'H of hydroxide', at: [{ x: 61, y: 38 }, { x: 68, y: 38 }], lp: [[], []] },
      { id: 'hb', el: 'H', name: 'H straight across from Br', at: [{ x: 180, y: 45 }, { x: 156, y: 38 }], lp: [[], []] },
      { id: 'cb', el: 'C', name: 'left C', at: [{ x: 180, y: 95 }, { x: 185, y: 100 }], lp: [[], []] },
      { id: 'c', el: 'C', name: 'central C', at: [{ x: 240, y: 95 }, { x: 245, y: 100 }], lp: [[], []] },
      { id: 'hy', el: 'H', name: 'H on the left C (left)', at: [{ x: 130, y: 95 }, { x: 142, y: 75 }], lp: [[], []] },
      { id: 'hz', el: 'H', name: 'H on the left C (bottom)', at: [{ x: 180, y: 145 }, { x: 142, y: 125 }], lp: [[], []] },
      CH3('m1', 'top CH₃', [{ x: 240, y: 35 }, { x: 288, y: 75 }]),
      CH3('m2', 'right CH₃', [{ x: 300, y: 95 }, { x: 288, y: 125 }]),
      { id: 'lg', el: 'Br', name: 'Br', at: [{ x: 240, y: 152 }, { x: 345, y: 160 }], lp: [[180, 270, 0], [0, 90, 180, 270]] },
    ],
    bonds: [
      { a: 'o', b: 'oh', order: [1, 1] },
      { a: 'o', b: 'hb', order: [0, 1] },
      { a: 'cb', b: 'hb', order: [1, 0] },
      { a: 'cb', b: 'hy', order: [1, 1] },
      { a: 'cb', b: 'hz', order: [1, 1] },
      { a: 'cb', b: 'c', order: [1, 2] },
      { a: 'c', b: 'm1', order: [1, 1] },
      { a: 'c', b: 'm2', order: [1, 1] },
      { a: 'c', b: 'lg', order: [1, 0] },
    ],
    stages: [
      {
        title: 'E2: one step, three arrows',
        sub: 'Everything happens in one step, so draw every arrow at once: which electrons grab an H, which make the new C=C, and which leave with Br. Then watch it run.',
        real: [
          { pat: { from: lp('o'), to: atom('hb') }, bend: { x: 150, y: 22 }, missing: { hint: 'mech-base' } },
          { pat: { from: bond('cb', 'hb'), to: bond('cb', 'c') }, alts: [{ from: bond('cb', 'hb'), to: atom('c') }], bend: { x: 214, y: 64 }, missing: { mistake: 'ch-bond-lost', needs: 0, hint: 'mech-ch' } },
          { pat: { from: bond('c', 'lg'), to: atom('lg') }, bend: { x: 268, y: 126 }, missing: { mistake: 'leaving-bond-stays', needs: 1, hint: 'mech-leave' } },
        ],
        traps: [
          { when: fromLp('o', ['c']), mistake: 'e2-base-hits-carbon' },
          { when: fromLp('o', ['hy', 'hz']), mistake: 'e2-not-anti' },
          { when: backwards('c', 'lg'), mistake: 'arrow-backwards' },
          { when: (a) => fromAtom('c')(a) || fromAtom('cb')(a), mistake: 'arrow-from-electrophile' },
        ],
        caption: (u) =>
          u < 0.32
            ? 'HO⁻ reaches for the H straight across from Br.'
            : u < 0.68
              ? 'All at once: O–H forms, the C–H electrons swing in to make C=C, C–Br breaks.'
              : 'One step: water, a C=C, and Br⁻. No carbocation, ever.',
      },
    ],
  },

  e1: {
    id: 'e1',
    vh: 190,
    text: ['(CH₃)₃C–Br + H₂O', '(CH₃)₃C⁺ + Br⁻', '(CH₃)₂C=CH₂ + H₃O⁺ + Br⁻'],
    atoms: [
      { id: 'c', el: 'C', name: 'central C', at: [{ x: 240, y: 95 }, { x: 240, y: 95 }, { x: 245, y: 95 }], lp: [[], [], []] },
      CH3('m1', 'top CH₃', [{ x: 240, y: 35 }, { x: 270, y: 43 }, { x: 275, y: 43 }]),
      CH3('m2', 'bottom CH₃', [{ x: 240, y: 155 }, { x: 270, y: 147 }, { x: 275, y: 147 }]),
      { id: 'cm', el: 'C', name: 'left C', at: [{ x: 178, y: 95 }, { x: 178, y: 95 }, { x: 185, y: 95 }], lp: [[], [], []] },
      { id: 'hx', el: 'H', name: 'H on the left C (top)', at: [{ x: 150, y: 55 }, { x: 150, y: 55 }, { x: 114, y: 22 }], lp: [[], [], []] },
      { id: 'hy', el: 'H', name: 'H on the left C (left)', at: [{ x: 130, y: 105 }, { x: 130, y: 105 }, { x: 142, y: 70 }], lp: [[], [], []] },
      { id: 'hz', el: 'H', name: 'H on the left C (bottom)', at: [{ x: 165, y: 145 }, { x: 165, y: 145 }, { x: 142, y: 120 }], lp: [[], [], []] },
      BR([{ x: 302, y: 95 }, { x: 385, y: 150 }, { x: 385, y: 150 }], 1),
      { id: 'o', el: 'O', name: 'O of water', at: [{ x: 78, y: 34 }, { x: 78, y: 34 }, { x: 72, y: 30 }], lp: [[40, 330], [40, 330], [270]] },
      { id: 'ha', el: 'H', name: 'H of water (top)', at: [{ x: 37, y: 19 }, { x: 37, y: 19 }, { x: 31, y: 15 }], lp: [[], [], []] },
      { id: 'hb', el: 'H', name: 'H of water (bottom)', at: [{ x: 44, y: 62 }, { x: 44, y: 62 }, { x: 38, y: 58 }], lp: [[], [], []] },
    ],
    bonds: [
      { a: 'c', b: 'm1', order: [1, 1, 1] },
      { a: 'c', b: 'm2', order: [1, 1, 1] },
      { a: 'c', b: 'cm', order: [1, 1, 2] },
      { a: 'c', b: 'lg', order: [1, 0, 0] },
      { a: 'cm', b: 'hx', order: [1, 1, 0] },
      { a: 'cm', b: 'hy', order: [1, 1, 1] },
      { a: 'cm', b: 'hz', order: [1, 1, 1] },
      { a: 'o', b: 'ha', order: [1, 1, 1] },
      { a: 'o', b: 'hb', order: [1, 1, 1] },
      { a: 'o', b: 'hx', order: [0, 0, 1] },
    ],
    stages: [
      {
        title: 'E1, step 1: the slow step',
        sub: 'Water is a weak base, so it can’t pull an H off yet. Draw the arrow for the change that happens on its own first.',
        real: [LEAVE],
        traps: [
          { when: fromLp('o', ['hx', 'hy', 'hz']), mistake: 'e1-base-first' },
          { when: fromLp('o', ['c']), mistake: 'sn1-attack-first' },
          { when: backwards('c', 'lg'), mistake: 'arrow-backwards' },
          { when: fromAtom('c'), mistake: 'arrow-from-electrophile' },
        ],
        caption: IONIZE_CAP,
      },
      {
        title: 'E1, step 2: lose an H⁺',
        sub: 'Now there’s a C⁺ next to a carbon with H’s. Draw the two arrows that turn it into a C=C double bond.',
        real: [
          {
            pat: { from: lp('o'), to: atom('hx') },
            alts: [{ from: lp('o'), to: atom('hy') }, { from: lp('o'), to: atom('hz') }],
            bend: { x: 118, y: 22 },
            missing: { hint: 'mech-base' },
          },
          {
            pat: { from: bond('cm', 'hx'), to: bond('cm', 'c') },
            alts: ['hx', 'hy', 'hz'].flatMap((h) => [{ from: bond('cm', h), to: bond('cm', 'c') }, { from: bond('cm', h), to: atom('c') }]),
            bend: { x: 200, y: 62 },
            missing: { mistake: 'ch-bond-lost', needs: 0, hint: 'mech-ch' },
          },
        ],
        traps: [
          { when: fromLp('o', ['c']), mistake: 'e1-base-hits-carbon' },
          { when: (a) => fromAtom('c')(a) || fromAtom('cm')(a), mistake: 'arrow-from-electrophile' },
        ],
        caption: (u) => (u < 0.5 ? 'Water pulls an H⁺ off the carbon next to C⁺.' : 'That C–H bond’s electrons become the C=C. No charge left on carbon.'),
      },
    ],
  },
}

/** Room around the outermost atom centers: an atom disc plus its lone pairs. */
const MARGIN = 40

const span = (v: number[]) => [Math.min(...v), Math.max(...v)] as const
/** Shift that centers [a0, a1] in [0, size], nudged so [b0, b1] (every keyframe) stays inside the margins when it can. */
function shift(a0: number, a1: number, b0: number, b1: number, size: number) {
  const want = size / 2 - (a0 + a1) / 2
  const lo = MARGIN - b0
  const hi = size - MARGIN - b1
  return Math.round(lo <= hi ? Math.min(hi, Math.max(lo, want)) : (lo + hi) / 2)
}

/**
 * Centers a mechanism in the frame: the starting picture (what you draw on) goes in the middle,
 * with one shift for every keyframe so nothing jumps between steps. The frame grows taller if it has to.
 */
function centered(m: Mech): Mech {
  const all = m.atoms.flatMap((a) => a.at)
  const start = m.atoms.map((a) => a.at[0])
  const [x0, x1] = span(all.map((p) => p.x))
  const [y0, y1] = span(all.map((p) => p.y))
  const [sx0, sx1] = span(start.map((p) => p.x))
  const [sy0, sy1] = span(start.map((p) => p.y))
  const vh = Math.max(m.vh, y1 - y0 + 2 * MARGIN)
  const dx = shift(sx0, sx1, x0, x1, VW)
  const dy = shift(sy0, sy1, y0, y1, vh)
  const move = (p: Pt): Pt => ({ x: p.x + dx, y: p.y + dy })
  return {
    ...m,
    vh,
    atoms: m.atoms.map((a) => ({ ...a, at: a.at.map(move) })),
    stages: m.stages.map((st) => ({ ...st, real: st.real.map((r) => (r.bend ? { ...r, bend: move(r.bend) } : r)) })),
  }
}

export const MECHS = Object.fromEntries(Object.entries(RAW).map(([id, m]) => [id, centered(m)])) as Record<MechId, Mech>

// ---------- grading ----------

export type MechGrade = { ok: boolean; mistakes: AnyMistake[]; hints: AnyHint[] }

/** Grade one step's drawn arrows: every real arrow drawn, nothing else, named traps first. */
export function gradeStage(stage: Stage, arrows: Arrow[]): MechGrade {
  const mistakes = new Set<AnyMistake>()
  const hints = new Set<AnyHint>()
  const hit = stage.real.map(() => false)
  for (const a of arrows) {
    const i = stage.real.findIndex((r) => [r.pat, ...(r.alts ?? [])].some((p) => matches(a, p)))
    if (i >= 0) {
      hit[i] = true
      continue
    }
    const trap = stage.traps.find((t) => t.when(a))
    if (trap) mistakes.add(trap.mistake)
    else hints.add(a.from.kind === 'atom' ? 'not-from-electrons' : 'extra-arrow')
  }
  if (!arrows.length) hints.add('none')
  else
    stage.real.forEach((r, i) => {
      if (hit[i]) return
      const m = r.missing
      if (m.mistake && m.needs !== undefined && hit[m.needs]) mistakes.add(m.mistake)
      else if (!mistakes.size) hints.add(m.hint)
    })
  const ok = hit.every(Boolean) && !mistakes.size && !hints.size
  return { ok, mistakes: [...mistakes], hints: [...hints] }
}

// ---------- the picture over time ----------

const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const SWITCH = 0.68

/** Keys a mechanism has (reactants + one per step). */
export const keys = (m: Mech) => m.stages.length

/** Charge on an atom at a key: CH₃ groups are neutral; the rest from FC = V − N − B/2. */
export function chargeAt(m: Mech, id: string, k: number): number {
  const a = m.atoms.find((x) => x.id === id)!
  if (a.label) return 0
  const b = m.bonds.reduce((s, x) => s + (x.a === id || x.b === id ? x.order[k] : 0), 0)
  return formalCharge(ELEMENTS[a.el].valence, 2 * a.lp[k].length, 2 * b)
}

/** The picture at time t, from 0 (reactants) to the number of steps (products). */
export function mechScene(m: Mech, t: number): Scene {
  const K = keys(m)
  const tt = Math.min(K, Math.max(0, t))
  const s = Math.min(K - 1, Math.floor(tt))
  const u = tt - s
  const move = ease(u, 0.05, 0.95)
  const k = u < SWITCH ? s : s + 1
  const atoms: SAtom[] = m.atoms.map((a) => ({
    id: a.id,
    el: a.el,
    label: a.label,
    x: lerp(a.at[s].x, a.at[s + 1].x, move),
    y: lerp(a.at[s].y, a.at[s + 1].y, move),
    lp: a.lp[k],
    charge: chargeAt(m, a.id, k),
    partial: false,
    opacity: 1,
  }))
  const bonds: SBond[] = m.bonds.flatMap((b) => {
    const o0 = b.order[s]
    const o1 = b.order[s + 1]
    const id = `${b.a}-${b.b}`
    if (o0 === o1) return o0 ? [{ id, a: b.a, b: b.b, order: o0, dashed: false, opacity: 1 }] : []
    if (!o0) return u > 0.32 ? [{ id, a: b.a, b: b.b, order: o1, dashed: u < SWITCH, opacity: 1 }] : [] // forming
    if (!o1) return u < SWITCH ? [{ id, a: b.a, b: b.b, order: o0, dashed: u > 0.32, opacity: 1 }] : [] // breaking
    return [{ id, a: b.a, b: b.b, order: u < 0.5 ? o0 : o1, dashed: false, opacity: 1 }] // single ↔ double
  })
  return { atoms, bonds, pair: null }
}

/** The formula line under the picture at time t. */
export const mechText = (m: Mech, t: number) => m.text[Math.min(keys(m), Math.floor(t) + (t % 1 >= SWITCH ? 1 : 0))]
