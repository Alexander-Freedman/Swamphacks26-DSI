// The central limit theorem with a lopsided population: how long people wait for a bus.
// Draw n waits, average them, repeat; the averages pile into a bell around the true mean,
// and the pile gets narrower as n grows (spread ~ σ/√n).

/** Waits in minutes, 0..9: most people wait a little, a few wait a long time. */
export const WAITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
export const WEIGHTS = WAITS.map((m) => Math.pow(0.7, m))
const TOTAL = WEIGHTS.reduce((s, w) => s + w, 0)
export const PROBS = WEIGHTS.map((w) => w / TOTAL)

export const popMean = WAITS.reduce((s, m, i) => s + m * PROBS[i], 0)
export const popSd = Math.sqrt(WAITS.reduce((s, m, i) => s + (m - popMean) ** 2 * PROBS[i], 0))

/** A small seeded generator (mulberry32), so every run and every test draws the same samples. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function drawWait(r: () => number): number {
  let u = r()
  for (let i = 0; i < WAITS.length; i++) {
    u -= PROBS[i]
    if (u <= 0) return WAITS[i]
  }
  return WAITS[WAITS.length - 1]
}

/** `count` averages of `n` waits each. */
export function sampleMeans(n: number, count: number, seed = 7): number[] {
  const r = rng(seed)
  return Array.from({ length: count }, () => {
    let s = 0
    for (let k = 0; k < n; k++) s += drawWait(r)
    return s / n
  })
}

export const BIN = 0.25
export const BINS = Math.round(9 / BIN) // 0..9 in quarter-minute bins

/** Counts per bin of width BIN from 0 to 9. */
export function histogram(xs: number[]): number[] {
  const h = Array.from({ length: BINS }, () => 0)
  for (const x of xs) h[Math.min(BINS - 1, Math.floor(x / BIN))]++
  return h
}

export const spread = (xs: number[]) => {
  const m = xs.reduce((s, x) => s + x, 0) / xs.length
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length)
}

/** Fraction of the pile that sits in the lower or upper tail, a rough skew check. */
export const skew = (xs: number[]) => {
  const m = xs.reduce((s, x) => s + x, 0) / xs.length
  const sd = spread(xs)
  return xs.reduce((s, x) => s + ((x - m) / sd) ** 3, 0) / xs.length
}

export type CltMistake = 'averages-keep-shape' | 'averages-flat' | 'bigger-sample-wider'

export const CLT_MISTAKES: Record<CltMistake, { label: string; line: string }> = {
  'averages-keep-shape': { label: 'Averages keep the original shape', line: 'One wait can be long, but an average of 10 rarely is: the long and short waits cancel out, so the averages bunch up in the middle.' },
  'averages-flat': { label: 'Every average is equally likely', line: 'Averages near the true mean can happen many ways; extreme averages need almost every draw to be extreme. So the middle piles up.' },
  'bigger-sample-wider': { label: 'Bigger samples spread out more', line: 'More draws per average means more canceling out. The averages hug the true mean tighter: the spread shrinks like 1/√n.' },
}
