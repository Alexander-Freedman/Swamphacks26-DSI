import type { Arrow, Source, Target } from './chem'
import { mid, shapeArrow, type Cand, type Drawn } from './arrows'
import { lpPos, RX, sceneAt, type Rx } from './sn2'

// The SN2 arrow pieces both arrow screens share (PushStep, Peel layer 3): where an arrow can start
// and end, the two real arrows, and how to say an arrow in words.

const START = sceneAt(RX['oh-mebr'], 0)
const ATOM = new Map(START.atoms.map((a) => [a.id, a]))
const NAME: Record<string, string> = { back: 'H', nu: 'O', c: 'C', h1: 'H', h2: 'H', h3: 'H', lg: 'Br' }
const bondName = (a: string, b: string) => `${NAME[a]}–${NAME[b]} bond`
const SIDE: Record<number, string> = { 0: 'right', 70: 'top', 90: 'top', 180: 'left', 270: 'bottom', 290: 'bottom' }

/** Every place an arrow can start: lone pairs, bonds, and (wrongly) bare atoms. */
function sources(rx: Rx = RX['oh-mebr']): Cand<Source>[] {
  const s = sceneAt(rx, 0)
  const at = new Map(s.atoms.map((a) => [a.id, a]))
  const lp = s.atoms.flatMap((a) => a.lp.map((deg, slot) => ({ v: { kind: 'lp', atom: a.id, slot } as Source, at: lpPos(a, deg), name: `lone pair on ${NAME[a.id]}${a.lp.length > 1 ? ` (${SIDE[deg] ?? deg})` : ''}` })))
  const bonds = s.bonds.map((b) => ({ v: { kind: 'bond', a: b.a, b: b.b } as Source, at: mid(at.get(b.a)!, at.get(b.b)!), name: bondName(b.a, b.b) + (b.a === 'c' && b.b.startsWith('h') ? ` (${b.b})` : '') }))
  const atoms = s.atoms.map((a) => ({ v: { kind: 'atom', atom: a.id } as Source, at: { x: a.x, y: a.y }, name: `the ${NAME[a.id]} atom` + (a.id.startsWith('h') || a.id === 'back' ? ` (${a.id})` : '') }))
  return [...lp, ...bonds, ...atoms]
}
function targets(rx: Rx = RX['oh-mebr']): Cand<Target>[] {
  return sources(rx).flatMap((c) => (c.v.kind === 'lp' ? [] : [{ ...c, v: c.v as Target, name: c.name.replace(/^the /, '') }]))
}
export const SRC = sources()
export const TGT = targets()

export const C = ATOM.get('c')!
export const LG = ATOM.get('lg')!
/** The real mechanism's two arrows, in ink. */
export const REAL: Drawn[] = [
  shapeArrow({ from: { kind: 'lp', atom: 'nu', slot: 0 }, to: { kind: 'atom', atom: 'c' } }, lpPos(ATOM.get('nu')!, 0), C, { x: C.x - 70, y: C.y - 24 }),
  shapeArrow({ from: { kind: 'bond', a: 'c', b: 'lg' }, to: { kind: 'atom', atom: 'lg' } }, mid(C, LG), LG, { x: (C.x + LG.x) / 2 - 9, y: C.y - 24 }),
]

export const CAPTION = (t: number) =>
  t < 0.3 ? 'The O’s lone pair heads for the back of the carbon.' : t < 0.68 ? 'Halfway: O–C forming, C–Br breaking, the H’s flat.' : 'Br leaves with the bond’s two electrons. The carbon turned inside out.'

const where = (s: Source | Target) =>
  s.kind === 'lp' ? `lone pair on ${NAME[s.atom]}` : s.kind === 'bond' ? bondName(s.a, s.b) : NAME[s.atom]
export function describe(a: Arrow) {
  const back = a.to.kind === 'atom' && a.to.atom === 'c' && a.front !== undefined ? (a.front ? ', from the front' : ', from the back') : ''
  return `${a.from.kind === 'atom' ? `the ${NAME[a.from.atom]} atom` : where(a.from)} → ${where(a.to)}${back}`
}

