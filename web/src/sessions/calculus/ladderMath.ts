// Calc 1, related rates (Ladder.tsx draws it).
//
// A ladder of length L = 5 leans on a wall. Its foot is x from the wall, its top y up the wall:
// x² + y² = L². Pull the foot out at a steady 1 m/s. Differentiating, 2x·x' + 2y·y' = 0, so
// y' = −(x / y) · x': the top slides down at x/y times the foot's speed. Slower than the foot
// while x < y, the same when x = y (x = L/√2 ≈ 3.54), faster once x > y, and without bound as y → 0.

export const L = 5
export const FOOT_SPEED = 1

export const top = (x: number) => Math.sqrt(Math.max(0, L * L - x * x))
/** How fast the top is falling (positive = down) when the foot is x out. */
export const topSpeed = (x: number) => (x / top(x)) * FOOT_SPEED

/** Where the student first predicts: foot 3 m out, top 4 m up, top falling at 0.75 m/s. */
export const ASK_X = 3
/** Where top and foot move at the same speed. */
export const SAME_X = L / Math.SQRT2
export const topFaster = (x: number) => x < L && topSpeed(x) > FOOT_SPEED

export type Speed = 'faster' | 'slower' | 'same'
export const compare = (x: number): Speed => {
  const s = topSpeed(x)
  return Math.abs(s - FOOT_SPEED) < 0.02 ? 'same' : s > FOOT_SPEED ? 'faster' : 'slower'
}

export type LadderMistake = 'ladder-same-speed'
export const LADDER_LABELS: Record<LadderMistake, string> = { 'ladder-same-speed': 'Both ends of the ladder move at the same speed' }
