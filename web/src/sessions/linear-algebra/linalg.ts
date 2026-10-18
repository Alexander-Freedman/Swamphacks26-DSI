// 2×2 matrices as moves of the plane. A matrix is stored by its columns: where î = (1, 0) lands
// and where ĵ = (0, 1) lands. Every other point follows: (x, y) goes to x·î' + y·ĵ'.

export type V = { x: number; y: number }
export type M = { i: V; j: V } // the two columns

export const I: M = { i: { x: 1, y: 0 }, j: { x: 0, y: 1 } }

export const apply = (m: M, p: V): V => ({ x: p.x * m.i.x + p.y * m.j.x, y: p.x * m.i.y + p.y * m.j.y })

/** How much areas scale (negative = the plane got flipped over). */
export const det = (m: M) => m.i.x * m.j.y - m.j.x * m.i.y

/** Straight-line morph between two matrices, for the animation. */
export const lerp = (a: M, b: M, t: number): M => ({
  i: { x: a.i.x + (b.i.x - a.i.x) * t, y: a.i.y + (b.i.y - a.i.y) * t },
  j: { x: a.j.x + (b.j.x - a.j.x) * t, y: a.j.y + (b.j.y - a.j.y) * t },
})

export const near = (a: V, b: V, tol = 0.01) => Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol

/** A quarter turn counterclockwise: î goes up, ĵ goes left. */
export const QUARTER: M = { i: { x: 0, y: 1 }, j: { x: -1, y: 0 } }

/** Snap a dragged point to the half-grid so targets are reachable on a phone. */
export const snap = (p: V): V => ({ x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 })

/** The little house every matrix gets tried on: walls, then the roof. */
export const HOUSE: V[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0.5, y: 1.6 },
  { x: 0, y: 1 },
]

export type LinMistake = 'rows-vs-columns' | 'squash-undoable'

export const LIN_MISTAKES: Record<LinMistake, { label: string; line: string }> = {
  'rows-vs-columns': { label: 'Reading a matrix by rows', line: 'Each column is where an arrow lands. The first column (2, 0) says î lands at (2, 0): everything stretches ×2 sideways, not up.' },
  'squash-undoable': { label: 'A squashed plane can be unsquashed', line: 'Once the plane is flattened onto a line, many points sit on top of each other. No matrix can pull them apart again: determinant 0 means no inverse.' },
}
