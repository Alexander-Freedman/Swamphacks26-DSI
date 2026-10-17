import { percent } from '../../components/session/percent'
// Exact math for the positive test session. Everything here is closed form (no simulation).
// P(sick | positive) = b*s / (b*s + (1-b)*f)

export type Test = { baseRate: number; sensitivity: number; falseAlarm: number }

export const CARD: Test = { baseRate: 0.01, sensitivity: 0.9, falseAlarm: 0.09 }
export const POP = 1000

/** Chance you're sick given one positive result (0..1). */
export function ppv({ baseRate: b, sensitivity: s, falseAlarm: f }: Test): number {
  const hit = b * s
  const alarm = (1 - b) * f
  return hit + alarm === 0 ? 0 : hit / (hit + alarm)
}

export type Piles = { sick: number; healthy: number; truePos: number; falsePos: number; positives: number }

/** Expected counts in a crowd, each rounded to whole people (10 sick → 9 hits; 990 healthy → 89 false alarms). */
export function piles(t: Test, pop = POP): Piles {
  const sick = Math.round(pop * t.baseRate)
  const healthy = pop - sick
  const truePos = Math.round(sick * t.sensitivity)
  const falsePos = Math.round(healthy * t.falseAlarm)
  return { sick, healthy, truePos, falsePos, positives: truePos + falsePos }
}

/** Base rate where a positive becomes a coin flip (ppv = 50%): b = f / (s + f). */
export function breakEven({ sensitivity: s, falseAlarm: f }: Pick<Test, 'sensitivity' | 'falseAlarm'>): number {
  return f / (s + f)
}

/** A second, independent positive: the first answer becomes the new base rate. */
export function secondTest(t: Test): number {
  return ppv({ ...t, baseRate: ppv(t) })
}

/** 0.0917 → "9.2%", 0.5025 → "50%", 0.001 → "0.1%", 0.01 → "1%". One decimal under 10%, no trailing ".0". */
export function pct(p: number): string {
  const v = p * 100
  if (!Number.isFinite(v)) return '-'
  // capped like exact() (#161): 99.6% reads ">99%", never "100%"
  return v < 10 ? percent(p, 1).replace(/\.0%$/, '%') : percent(p, 0)
}

/** Exact readouts keep one decimal: 0.909 → "90.9%", 0.0917 → "9.2%". */
export function exact(p: number): string {
  return percent(p, 1)
}

/** P6 rematch: same story, new numbers (docs/experience.md): 2% sick, 95% caught, 5% false alarms → 27.9%. */
export const REMATCH: Test = { baseRate: 0.02, sensitivity: 0.95, falseAlarm: 0.05 }

// Log slider for the base rate: 0..1000 maps to 0.1%..50%.
export const BASE_MIN = 0.001
export const BASE_MAX = 0.5
export const SLIDER_STEPS = 1000
export function sliderToBase(v: number): number {
  return BASE_MIN * Math.pow(BASE_MAX / BASE_MIN, v / SLIDER_STEPS)
}
export function baseToSlider(b: number): number {
  return Math.round((Math.log(b / BASE_MIN) / Math.log(BASE_MAX / BASE_MIN)) * SLIDER_STEPS)
}

/** A fixed shuffle of 0..n-1 so "who is sick" is the same on every run (demo and screenshots match). */
export function seededOrder(n = POP, seed = 7): number[] {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const order = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/**
 * Compare step (#183): an airport bag scanner, same structure as the test. Illustrative numbers,
 * not real airport data: 1 in 1,000 bags has something, the scanner flags 99% of those, and
 * 2% of clean bags set it off too. Over a day of 100,000 bags every count is a whole bag:
 * 100 with something, 99 flagged, 1,998 false alarms, so 99 / 2,097 alarms are real (4.72%).
 */
export const BAGS: Test = { baseRate: 0.001, sensitivity: 0.99, falseAlarm: 0.02 }
export const BAG_DAY = 100_000
