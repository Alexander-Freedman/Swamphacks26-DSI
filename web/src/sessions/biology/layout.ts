import type { BioMistake } from './mistakes'

// Sizes for the strand drawings, and the verdict shape every step uses.

export const TILE = 28
export const GAP = 2
export const X0 = 22
export const tileX = (i: number) => X0 + i * (TILE + GAP)
/** The drawing width for n tiles, with the same margin on both sides so the strand sits centered. */
export const widthFor = (n: number) => 2 * X0 + n * (TILE + GAP) - GAP

export type Said = { ok: true; line: string } | { ok: false; mistake: BioMistake | null; line: string }

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
