// Molecule shapes from electron groups (VSEPR). Four groups around the center point at the corners
// of a tetrahedron; lone pairs take corners too but aren't atoms, so the shape you see is what's left.
// Lone pairs push harder than bonds, which squeezes the bond angle below 109.5°.

export type P3 = [number, number, number]

const n = ([x, y, z]: P3): P3 => {
  const l = Math.hypot(x, y, z)
  return [x / l, y / l, z / l]
}

/** The four corners of a tetrahedron, as unit directions from the center. */
export const TETRA: P3[] = [n([0, 1, 0]), n([0.943, -0.333, 0]), n([-0.471, -0.333, 0.816]), n([-0.471, -0.333, -0.816])]

export const angleBetween = (a: P3, b: P3) => (Math.acos(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) * 180) / Math.PI

export type Shape = 'tetrahedral' | 'square-planar' | 'trigonal-pyramidal' | 'trigonal-planar' | 'bent' | 'linear'

export type Molecule = {
  id: string
  formula: string
  name: string
  center: 'C' | 'N' | 'O'
  /** which tetrahedron corners hold H atoms; the rest hold lone pairs */
  bonds: number
  shape: Shape
  angle: number
}

export const MOLECULES: Molecule[] = [
  { id: 'ch4', formula: 'CH₄', name: 'methane', center: 'C', bonds: 4, shape: 'tetrahedral', angle: 109.5 },
  { id: 'nh3', formula: 'NH₃', name: 'ammonia', center: 'N', bonds: 3, shape: 'trigonal-pyramidal', angle: 107 },
  { id: 'h2o', formula: 'H₂O', name: 'water', center: 'O', bonds: 2, shape: 'bent', angle: 104.5 },
]

export const SHAPE_NAME: Record<Shape, string> = {
  tetrahedral: 'Tetrahedral',
  'square-planar': 'Flat square',
  'trigonal-pyramidal': 'Pyramid',
  'trigonal-planar': 'Flat triangle',
  bent: 'Bent',
  linear: 'Straight line',
}

/**
 * Bond directions with the angle opened or closed to the molecule's real H–X–H angle: lone pairs
 * push the bonds together, so the directions are pulled toward their mean before drawing.
 */
export function bondDirs(m: Molecule): P3[] {
  const dirs = TETRA.slice(0, m.bonds)
  if (m.bonds === 4) return dirs
  // squeeze each bond toward the bonds' average until the pair angle matches
  const avg = n(dirs.reduce<P3>((s, d) => [s[0] + d[0], s[1] + d[1], s[2] + d[2]], [0, 0, 0]))
  let lo = 0
  let hi = 1
  for (let k = 0; k < 40; k++) {
    const t = (lo + hi) / 2
    const a = n([dirs[0][0] + (avg[0] - dirs[0][0]) * t, dirs[0][1] + (avg[1] - dirs[0][1]) * t, dirs[0][2] + (avg[2] - dirs[0][2]) * t])
    const b = n([dirs[1][0] + (avg[0] - dirs[1][0]) * t, dirs[1][1] + (avg[1] - dirs[1][1]) * t, dirs[1][2] + (avg[2] - dirs[1][2]) * t])
    if (angleBetween(a, b) > m.angle) lo = t
    else hi = t
  }
  const t = (lo + hi) / 2
  return dirs.map((d) => n([d[0] + (avg[0] - d[0]) * t, d[1] + (avg[1] - d[1]) * t, d[2] + (avg[2] - d[2]) * t]))
}

/** Where the lone pairs sit: the tetrahedron corners the H atoms don't use. */
export const lonePairDirs = (m: Molecule): P3[] => TETRA.slice(m.bonds)

export type ShapeMistake = 'flat-drawing-is-shape' | 'lone-pairs-ignored'

export const SHAPE_MISTAKES: Record<ShapeMistake, { label: string; line: string }> = {
  'flat-drawing-is-shape': { label: 'The flat drawing is the real shape', line: 'Lewis structures are drawn flat on paper, but the four bonds spread out in 3D to get as far apart as they can: 109.5°, not 90°.' },
  'lone-pairs-ignored': { label: 'Ignoring the lone pairs', line: 'Lone pairs are invisible in the shape, but they still take up a corner and push the bonds away. Count them as electron groups.' },
}
