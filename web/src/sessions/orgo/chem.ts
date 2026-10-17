import { ANALYSIS_MISTAKES, type AnalysisMistake } from './analysis'
// Chemistry rules for the orgo session. Everything the screens claim is computed here:
// valence, molecular formula, formal charge, isomer checks and curved-arrow checks.

export type El = 'C' | 'H' | 'O' | 'N' | 'Br' | 'I'

/** Valence electrons and the bond count of the neutral atom with a full shell. */
export const ELEMENTS: Record<El, { valence: number; bonds: number; name: string }> = {
  C: { valence: 4, bonds: 4, name: 'carbon' },
  H: { valence: 1, bonds: 1, name: 'hydrogen' },
  O: { valence: 6, bonds: 2, name: 'oxygen' },
  N: { valence: 5, bonds: 3, name: 'nitrogen' },
  Br: { valence: 7, bonds: 1, name: 'bromine' },
  I: { valence: 7, bonds: 1, name: 'iodine' },
}

export type Atom = { id: string; el: El; x: number; y: number }
export type Order = 1 | 2 | 3
export type Bond = { a: string; b: string; order: Order }
export type Mol = { atoms: Atom[]; bonds: Bond[] }

const shell = (el: El) => (el === 'H' ? 2 : 8)

/** FC = V − N − B/2: valence electrons, nonbonding electrons, bonding electrons. */
export function formalCharge(v: number, nonbonding: number, bonding: number): number {
  return v - nonbonding - bonding / 2
}

/** Sum of bond orders on an atom (a double bond counts 2). */
export function bondCount(mol: Mol, id: string): number {
  return mol.bonds.reduce((s, b) => s + (b.a === id || b.b === id ? b.order : 0), 0)
}

/**
 * Nonbonding electrons on an atom while you build. Up to its usual bond count an atom keeps
 * the rest of its own electrons (an unfilled slot is an open slot, not a charge). Past it,
 * the extra bond uses a lone pair, so whatever is left of the shell stays nonbonding.
 */
export function nonbonding(el: El, bonds: number): number {
  const e = ELEMENTS[el]
  if (bonds <= e.bonds) return e.valence - bonds
  return Math.max(0, shell(el) - 2 * bonds)
}

export function atomCharge(el: El, bonds: number): number {
  return formalCharge(ELEMENTS[el].valence, nonbonding(el, bonds), 2 * bonds)
}

export function charges(mol: Mol): Record<string, number> {
  return Object.fromEntries(mol.atoms.map((a) => [a.id, atomCharge(a.el, bondCount(mol, a.id))]))
}

export type FormulaPart = { el: El; n: number }

/** Hill order: C, then H, then the rest alphabetically (no carbon: all alphabetical). */
export function formula(mol: Mol): FormulaPart[] {
  const n = new Map<El, number>()
  for (const a of mol.atoms) n.set(a.el, (n.get(a.el) ?? 0) + 1)
  const els = [...n.keys()].sort((a, b) => a.localeCompare(b))
  const order = n.has('C') ? (['C', 'H', ...els.filter((e) => e !== 'C' && e !== 'H')] as El[]).filter((e) => n.has(e)) : els
  return order.map((el) => ({ el, n: n.get(el)! }))
}

const SUB = '₀₁₂₃₄₅₆₇₈₉'
export const sub = (k: number) => String(k).replace(/\d/g, (d) => SUB[+d])
export const formulaText = (parts: FormulaPart[], pretty = true) =>
  parts.map((p) => p.el + (p.n > 1 ? (pretty ? sub(p.n) : String(p.n)) : '')).join('')

/** Connected pieces (an empty canvas has 0). */
export function pieces(mol: Mol): number {
  const seen = new Set<string>()
  let k = 0
  for (const a of mol.atoms) {
    if (seen.has(a.id)) continue
    k++
    const stack = [a.id]
    while (stack.length) {
      const id = stack.pop()!
      if (seen.has(id)) continue
      seen.add(id)
      for (const b of mol.bonds) {
        if (b.a === id) stack.push(b.b)
        else if (b.b === id) stack.push(b.a)
      }
    }
  }
  return k
}

/** Same atoms joined the same way (graph isomorphism on elements and bond orders). */
export function sameMolecule(m1: Mol, m2: Mol): boolean {
  if (m1.atoms.length !== m2.atoms.length || m1.bonds.length !== m2.bonds.length) return false
  if (formulaText(formula(m1)) !== formulaText(formula(m2))) return false
  const adj = (m: Mol) => {
    const g = new Map<string, Map<string, number>>(m.atoms.map((a) => [a.id, new Map()]))
    for (const b of m.bonds) {
      g.get(b.a)?.set(b.b, b.order)
      g.get(b.b)?.set(b.a, b.order)
    }
    return g
  }
  const g1 = adj(m1)
  const g2 = adj(m2)
  const el1 = new Map(m1.atoms.map((a) => [a.id, a.el]))
  const el2 = new Map(m2.atoms.map((a) => [a.id, a.el]))
  const sig = (g: Map<string, Map<string, number>>, el: Map<string, El>, id: string) =>
    el.get(id)! + ':' + [...g.get(id)!].map(([n, o]) => el.get(n)! + o).sort().join(',')
  // heavy atoms first, then by connections, so the search stays small
  const order = [...m1.atoms].sort((a, b) => (a.el === 'H' ? 1 : 0) - (b.el === 'H' ? 1 : 0) || g1.get(b.id)!.size - g1.get(a.id)!.size).map((a) => a.id)
  const map = new Map<string, string>()
  const used = new Set<string>()
  const fits = (u: string, v: string) => {
    if (sig(g1, el1, u) !== sig(g2, el2, v)) return false
    for (const [n, o] of g1.get(u)!) {
      const w = map.get(n)
      if (w !== undefined && g2.get(v)!.get(w) !== o) return false
    }
    return true
  }
  const go = (i: number): boolean => {
    if (i === order.length) return true
    const u = order[i]
    for (const a of m2.atoms) {
      if (used.has(a.id) || !fits(u, a.id)) continue
      map.set(u, a.id)
      used.add(a.id)
      if (go(i + 1)) return true
      map.delete(u)
      used.delete(a.id)
    }
    return false
  }
  return go(0)
}

/** A molecule from its heavy atoms and bonds, with hydrogens added to fill every open slot. */
export function withHydrogens(heavy: El[], bonds: [number, number, Order?][]): Mol {
  const atoms: Atom[] = heavy.map((el, i) => ({ id: `a${i}`, el, x: 0, y: 0 }))
  const bs: Bond[] = bonds.map(([a, b, o]) => ({ a: `a${a}`, b: `a${b}`, order: o ?? 1 }))
  const mol: Mol = { atoms, bonds: bs }
  let h = 0
  for (const a of [...atoms]) {
    for (let k = bondCount(mol, a.id); k < ELEMENTS[a.el].bonds; k++) {
      const id = `h${h++}`
      atoms.push({ id, el: 'H', x: 0, y: 0 })
      bs.push({ a: a.id, b: id, order: 1 })
    }
  }
  return mol
}

export const ETHANOL = withHydrogens(['C', 'C', 'O'], [[0, 1], [1, 2]])
export const DIMETHYL_ETHER = withHydrogens(['C', 'O', 'C'], [[0, 1], [1, 2]])

// ---------- step 1: build a molecule ----------

export type BuildMistake = 'carbon-five-bonds' | 'hydrogen-two-bonds' | 'oxygen-three-bonds' | 'missing-hydrogens' | 'same-formula-different-molecule'
export type BuildHint = 'empty' | 'loose' | 'too-many-bonds' | 'wrong-atoms' | 'open-slots'

/** Atoms past their usual bond count, by the named mistake they make. */
export function overfilled(mol: Mol): { id: string; mistake: BuildMistake | null }[] {
  return mol.atoms.flatMap((a) => {
    const n = bondCount(mol, a.id)
    if (n <= ELEMENTS[a.el].bonds) return []
    const mistake: BuildMistake | null = a.el === 'C' ? 'carbon-five-bonds' : a.el === 'H' ? 'hydrogen-two-bonds' : a.el === 'O' && n === 3 ? 'oxygen-three-bonds' : null
    return [{ id: a.id, mistake }]
  })
}

export type BuildCheck =
  | { ok: true; name: string }
  | { ok: false; mistakes: BuildMistake[]; hint: BuildHint | null; isomer: string | null }

/** Grade a build against a neutral target. Named mistakes first, then hints. */
export function checkBuild(mol: Mol, target: Mol, targetName: string): BuildCheck {
  if (!mol.atoms.length) return { ok: false, mistakes: [], hint: 'empty', isomer: null }
  const over = overfilled(mol)
  const named = [...new Set(over.flatMap((o) => (o.mistake ? [o.mistake] : [])))]
  if (over.length) return { ok: false, mistakes: named, hint: named.length ? null : 'too-many-bonds', isomer: null }

  const mine = formula(mol)
  const want = formula(target)
  const count = (f: FormulaPart[], el: El) => f.find((p) => p.el === el)?.n ?? 0
  const heavySame = [...new Set([...mine, ...want].map((p) => p.el))].filter((e) => e !== 'H').every((e) => count(mine, e) === count(want, e))
  if (formulaText(mine) !== formulaText(want)) {
    if (heavySame && count(mine, 'H') < count(want, 'H')) return { ok: false, mistakes: ['missing-hydrogens'], hint: pieces(mol) > 1 ? 'loose' : null, isomer: null }
    return { ok: false, mistakes: [], hint: 'wrong-atoms', isomer: null }
  }
  if (pieces(mol) > 1) return { ok: false, mistakes: [], hint: 'loose', isomer: null }
  if (sameMolecule(mol, target)) return { ok: true, name: targetName }
  const open = mol.atoms.some((a) => bondCount(mol, a.id) < ELEMENTS[a.el].bonds)
  if (open) return { ok: false, mistakes: [], hint: 'open-slots', isomer: null }
  return { ok: false, mistakes: ['same-formula-different-molecule'], hint: null, isomer: sameMolecule(mol, DIMETHYL_ETHER) ? 'dimethyl ether' : null }
}

// ---------- step 2: curved arrows ----------

/** Where an arrow starts: electrons (a lone pair or a bond), or (wrongly) a bare atom. */
export type Source = { kind: 'lp'; atom: string; slot: number } | { kind: 'bond'; a: string; b: string } | { kind: 'atom'; atom: string }
export type Target = { kind: 'atom'; atom: string } | { kind: 'bond'; a: string; b: string }
export type Arrow = { from: Source; to: Target; /** the arrow came in on the leaving group's side of the carbon */ front?: boolean }

export const sameBond = (p: { a: string; b: string }, q: { a: string; b: string }) => (p.a === q.a && p.b === q.b) || (p.a === q.b && p.b === q.a)

/** An arrow is a pair of electrons moving: it must start at electrons and end at an atom or a bond. */
export function arrowValid(a: Arrow): boolean {
  if (a.from.kind === 'atom') return false
  if (a.from.kind === 'bond' && a.to.kind === 'bond' && sameBond(a.from, a.to)) return false
  if (a.from.kind === 'lp' && a.to.kind === 'atom' && a.from.atom === a.to.atom) return false
  return true
}

export type Pt = { x: number; y: number }
/** True when `approach` (a point on the arrow just before its tip) is on the leaving group's side of the carbon. */
export function frontSide(approach: Pt, carbon: Pt, leaving: Pt): boolean {
  return (approach.x - carbon.x) * (leaving.x - carbon.x) + (approach.y - carbon.y) * (leaving.y - carbon.y) > 0
}

/** The atoms an SN2 step is about. */
export type Roles = { nu: string; c: string; lg: string }

export type ArrowMistake = 'arrow-from-electrophile' | 'arrow-backwards' | 'front-side-attack' | 'leaving-bond-stays'
export type ArrowHint = 'not-from-electrons' | 'attack-missing' | 'wrong-target' | 'extra-arrow' | 'none'

export type ArrowGrade = { ok: boolean; attack: boolean; leave: boolean; mistakes: ArrowMistake[]; hints: ArrowHint[] }

const touches = (s: Source | Target, atom: string) => (s.kind === 'bond' ? s.a === atom || s.b === atom : s.atom === atom)

/** Grade drawn arrows against the SN2 mechanism: nucleophile's lone pair → back of carbon, C–LG bond → LG. */
export function gradeSN2(arrows: Arrow[], r: Roles): ArrowGrade {
  const mistakes = new Set<ArrowMistake>()
  const hints = new Set<ArrowHint>()
  const cLg = { a: r.c, b: r.lg }
  let attack = false
  let leave = false
  for (const a of arrows) {
    const { from, to } = a
    const isAttack = from.kind === 'lp' && from.atom === r.nu && to.kind === 'atom' && to.atom === r.c
    const isLeave = from.kind === 'bond' && sameBond(from, cLg) && to.kind === 'atom' && to.atom === r.lg
    if (isAttack) {
      if (a.front) mistakes.add('front-side-attack')
      else attack = true
      continue
    }
    if (isLeave) {
      leave = true
      continue
    }
    if (from.kind === 'atom' && from.atom === r.c) mistakes.add('arrow-from-electrophile')
    else if (from.kind === 'bond' && sameBond(from, cLg) && to.kind === 'atom' && to.atom === r.c) mistakes.add('arrow-backwards')
    else if (touches(from, r.lg) && from.kind !== 'bond' && (touches(to, r.c) || touches(to, r.nu))) mistakes.add('arrow-backwards')
    else if (from.kind === 'atom') hints.add('not-from-electrons')
    else if (from.kind === 'lp' && from.atom === r.nu) hints.add('wrong-target')
    else hints.add('extra-arrow')
  }
  if (!arrows.length) hints.add('none')
  else if (attack && !leave) mistakes.add('leaving-bond-stays')
  else if (!attack && !mistakes.has('front-side-attack') && !mistakes.has('arrow-from-electrophile')) hints.add('attack-missing')
  const ok = attack && leave && mistakes.size === 0 && hints.size === 0
  return { ok, attack, leave, mistakes: [...mistakes], hints: [...hints] }
}

// ---------- step 3: the same parts in another reaction ----------

export type Part = 'nucleophile' | 'electrophile' | 'leaving'
export type TapMistake = 'cyanide-nitrogen' | 'wrong-carbon'
/** The real atom for each part, plus the tempting wrong atoms that are named mistakes. */
export type PartMap = Record<Part, string> & { traps?: Partial<Record<string, { part: Part; mistake: TapMistake }>> }

export function tapVerdict(map: PartMap, part: Part, atom: string): { ok: boolean; mistake: TapMistake | null } {
  if (map[part] === atom) return { ok: true, mistake: null }
  const trap = map.traps?.[atom]
  return { ok: false, mistake: trap && trap.part === part ? trap.mistake : null }
}

export const MISTAKES: Record<BuildMistake | ArrowMistake | TapMistake | AnalysisMistake, { label: string; line: string }> = {
  ...ANALYSIS_MISTAKES,
  'carbon-five-bonds': { label: 'A carbon with 5 bonds', line: 'Carbon has 4 slots. A 5th bond has no electrons to use.' },
  'hydrogen-two-bonds': { label: 'Hydrogen with 2 bonds', line: 'Hydrogen holds exactly one bond.' },
  'oxygen-three-bonds': { label: 'Oxygen with 3 bonds, no charge', line: 'Three bonds on oxygen make it O⁺: FC = 6 − 2 − 3 = +1. Ethanol has no charge.' },
  'missing-hydrogens': { label: 'Missing hydrogens', line: 'Every empty slot gets an H. Count them against the formula.' },
  'same-formula-different-molecule': { label: 'Same formula, different molecule', line: 'C–O–C is dimethyl ether. Ethanol is C–C–O–H: same atoms, joined differently.' },
  'arrow-from-electrophile': { label: 'Arrow starts at the carbon', line: 'Arrows start at electrons. The carbon is where they go.' },
  'arrow-backwards': { label: 'Arrow from Br toward C (backwards)', line: 'Br takes the bond’s electrons. It doesn’t give any.' },
  'front-side-attack': { label: 'Front-side attack', line: 'Br blocks the front. HO⁻ comes in from the back, opposite Br.' },
  'leaving-bond-stays': { label: 'The C–Br bond never breaks', line: 'Without that arrow the carbon ends with 5 bonds.' },
  'cyanide-nitrogen': { label: 'Nitrogen as cyanide’s attacker', line: 'The lone pair and the − charge sit on cyanide’s carbon (FC −1). Carbon attacks.' },
  'wrong-carbon': { label: 'Cyanide’s carbon as the target', line: 'That carbon is electron-rich. The target is the carbon holding I.' },
}

export const HINTS: Record<BuildHint | ArrowHint, string> = {
  empty: 'Drag a C onto the paper to start.',
  loose: 'Some atoms aren’t connected yet.',
  'too-many-bonds': 'An atom has more bonds than slots.',
  'wrong-atoms': 'Ethanol is 2 C, 6 H, 1 O.',
  'open-slots': 'Some slots are still empty.',
  'not-from-electrons': 'Arrows start at electrons: a lone pair or a bond.',
  'attack-missing': 'Which electrons attack the carbon?',
  'wrong-target': 'Where do those electrons go?',
  'extra-arrow': 'One arrow isn’t part of this reaction.',
  none: 'Draw an arrow first.',
}
