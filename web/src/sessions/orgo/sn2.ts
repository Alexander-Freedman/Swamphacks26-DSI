import { ELEMENTS, formalCharge, type El, type PartMap, type Pt, type Roles } from './chem'

// The SN2 picture as a function of time t (0 = reactants, 1 = products).
// Positions are in the scene's viewBox units; charges come from formalCharge on each
// atom's lone pairs and bonds at the start and at the end.

export const VW = 420
export const VH = 170
const Y = 85

export type RxId = 'oh-mebr' | 'cn-mei'
export type Rx = {
  id: RxId
  /** attacking atom and the atom behind it */
  nu: { el: El; lp: number; bonds: number }
  back: { el: El; lp: number; order: 1 | 3 }
  lg: El
  roles: Roles
  parts: PartMap
  text: { reactants: string; products: string }
}

export const RX: Record<RxId, Rx> = {
  'oh-mebr': {
    id: 'oh-mebr',
    nu: { el: 'O', lp: 3, bonds: 1 },
    back: { el: 'H', lp: 0, order: 1 },
    lg: 'Br',
    roles: { nu: 'nu', c: 'c', lg: 'lg' },
    parts: { nucleophile: 'nu', electrophile: 'c', leaving: 'lg' },
    text: { reactants: 'HO⁻ + CH₃Br', products: 'CH₃OH + Br⁻' },
  },
  'cn-mei': {
    id: 'cn-mei',
    nu: { el: 'C', lp: 1, bonds: 3 },
    back: { el: 'N', lp: 1, order: 3 },
    lg: 'I',
    roles: { nu: 'nu', c: 'c', lg: 'lg' },
    parts: {
      nucleophile: 'nu',
      electrophile: 'c',
      leaving: 'lg',
      traps: { back: { part: 'nucleophile', mistake: 'cyanide-nitrogen' }, nu: { part: 'electrophile', mistake: 'wrong-carbon' } },
    },
    text: { reactants: 'N≡C⁻ + CH₃I', products: 'CH₃CN + I⁻' },
  },
}

export type SAtom = { id: string; el: El; x: number; y: number; lp: number[]; charge: number; partial: boolean; opacity: number }
export type SBond = { id: string; a: string; b: string; order: number; dashed: boolean; opacity: number }
export type Scene = { atoms: SAtom[]; bonds: SBond[]; pair: Pt | null }

const clamp = (v: number) => Math.min(1, Math.max(0, v))
/** 0 → 1 smoothly while t goes from a to b. */
export const ease = (t: number, a: number, b: number) => {
  const u = clamp((t - a) / (b - a))
  return u * u * (3 - 2 * u)
}
const lerp = (a: number, b: number, u: number) => a + (b - a) * u

export const C_X = 225
const BOND = 62
const NU0 = 90
const LG_END = 378

/** Lone-pair angles in degrees (0 = toward the right, 90 = up). */
const LP_NU: Record<number, number[]> = { 3: [0, 90, 270], 1: [0] }

export function sceneAt(rx: Rx, t: number): Scene {
  const inn = ease(t, 0.05, 0.5) // nucleophile comes in
  const out = ease(t, 0.5, 0.95) // leaving group goes out
  const flip = ease(t, 0.3, 0.7) // the umbrella turns inside out
  const ts = t > 0.32 && t < 0.68 // around the transition state
  const after = t >= 0.68

  const nuX = lerp(NU0, C_X - BOND, inn)
  const backX = nuX - 46
  const lgX = lerp(C_X + BOND, LG_END, out)
  const dx = 1 - 2 * flip // +1: hydrogens on the left (toward the nucleophile), −1: flipped right

  const nuLp = after ? (LP_NU[rx.nu.lp] ?? []).filter((a) => a !== 0) : (LP_NU[rx.nu.lp] ?? [])
  const nuBonds = rx.nu.bonds + (after ? 1 : 0)
  const lgLp = after ? [70, 0, 290, 180] : [70, 0, 290]
  const lgBonds = after ? 0 : 1
  const charge = (el: El, lp: number, bonds: number) => formalCharge(ELEMENTS[el].valence, 2 * lp, 2 * bonds)

  const atoms: SAtom[] = [
    { id: 'back', el: rx.back.el, x: backX, y: Y, lp: rx.back.lp ? [180] : [], charge: charge(rx.back.el, rx.back.lp, rx.back.order), partial: false, opacity: 1 },
    { id: 'nu', el: rx.nu.el, x: nuX, y: Y, lp: nuLp, charge: charge(rx.nu.el, nuLp.length, nuBonds), partial: ts, opacity: 1 },
    { id: 'h3', el: 'H', x: C_X - 48 * dx, y: Y + 16, lp: [], charge: 0, partial: false, opacity: clamp(Math.abs(dx) * 2.2) },
    { id: 'c', el: 'C', x: C_X, y: Y, lp: [], charge: 0, partial: false, opacity: 1 },
    { id: 'h1', el: 'H', x: C_X - 26 * dx, y: Y - 50, lp: [], charge: 0, partial: false, opacity: 1 },
    { id: 'h2', el: 'H', x: C_X - 26 * dx, y: Y + 50, lp: [], charge: 0, partial: false, opacity: 1 },
    { id: 'lg', el: rx.lg, x: lgX, y: Y, lp: lgLp, charge: charge(rx.lg, lgLp.length, lgBonds), partial: ts, opacity: 1 },
  ]
  const bonds: SBond[] = [
    { id: 'back-nu', a: 'back', b: 'nu', order: rx.back.order, dashed: false, opacity: 1 },
    { id: 'c-h1', a: 'c', b: 'h1', order: 1, dashed: false, opacity: 1 },
    { id: 'c-h2', a: 'c', b: 'h2', order: 1, dashed: false, opacity: 1 },
    { id: 'c-h3', a: 'c', b: 'h3', order: 1, dashed: false, opacity: clamp(Math.abs(dx) * 2.2) },
  ]
  if (t > 0.32) bonds.push({ id: 'nu-c', a: 'nu', b: 'c', order: 1, dashed: !after, opacity: 1 })
  if (t < 0.68) bonds.push({ id: 'c-lg', a: 'c', b: 'lg', order: 1, dashed: t > 0.32, opacity: 1 })
  // the C–LG bond's two electrons ride out with the leaving group
  const pair = t > 0.5 && t < 0.72 ? { x: lerp((C_X + lgX) / 2, lgX - 24, ease(t, 0.5, 0.7)), y: Y } : null
  return { atoms, bonds, pair }
}

export const LP_R = 25
export const lpPos = (a: { x: number; y: number }, deg: number, r = LP_R): Pt => ({
  x: a.x + r * Math.cos((deg * Math.PI) / 180),
  y: a.y - r * Math.sin((deg * Math.PI) / 180),
})
