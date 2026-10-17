import { compile, evaluate } from 'mathjs'
import type { CurveTruth, DistributionTruth, Item, SamplerParams } from './types'

// The truth is computed here, after lock-in, never taken from the model.
// Seeded so the same round always shows the same histogram (and tests are stable).
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function flips(n: number, p: number, rand: () => number): boolean[] {
  return Array.from({ length: n }, () => rand() < p)
}

export function longestRun(seq: boolean[]): number {
  let best = 0
  let run = 0
  for (let i = 0; i < seq.length; i++) {
    run = i > 0 && seq[i] === seq[i - 1] ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

function birthdayMatch(group: number, rand: () => number): number {
  const seen = new Set<number>()
  for (let i = 0; i < group; i++) {
    const d = Math.floor(rand() * 365)
    if (seen.has(d)) return 1
    seen.add(d)
  }
  return 0
}

function sampleOnce(sampler: DistributionTruth['sampler'], p: SamplerParams, rand: () => number): number {
  switch (sampler) {
    case 'coin_longest_run':
      return longestRun(flips(p.n ?? 100, p.p ?? 0.5, rand))
    case 'binomial_count':
      return flips(p.n ?? 100, p.p ?? 0.5, rand).filter(Boolean).length
    case 'dice_sum': {
      let s = 0
      for (let i = 0; i < (p.dice ?? 2); i++) s += 1 + Math.floor(rand() * 6)
      return s
    }
    case 'birthday_match':
      return birthdayMatch(p.group_size ?? 23, rand)
    case 'base_rate_test':
      return baseRate(p).truth
  }
}

export type Histogram = { counts: Map<number, number>; trials: number; mean: number; min: number; max: number }

export function simulate(t: DistributionTruth, seed = 7): Histogram {
  const rand = rng(seed)
  const trials = t.params.trials ?? 10000
  const counts = new Map<number, number>()
  let sum = 0
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < trials; i++) {
    const v = sampleOnce(t.sampler, t.params, rand)
    counts.set(v, (counts.get(v) ?? 0) + 1)
    sum += v
    if (v < min) min = v
    if (v > max) max = v
  }
  return { counts, trials, mean: sum / trials, min, max }
}

export function shareAtLeast(h: Histogram, x: number): number {
  let n = 0
  for (const [v, c] of h.counts) if (v >= x) n += c
  return n / h.trials
}

// Deterministic icon-array counts for a screening test.
export function baseRate(p: SamplerParams) {
  const population = p.population ?? 1000
  const sick = Math.round(population * (p.base_rate ?? 0.01))
  const truePos = sick * (p.sensitivity ?? 0.9)
  const falsePos = (population - sick) * (p.false_positive_rate ?? 0.09)
  return { population, sick, truePos, falsePos, truth: truePos / (truePos + falsePos) }
}

// Curve truth: a preset or a mathjs expression in x. Only evaluated, never executed as code.

// Group sizes are whole people, so a fractional x is floored (22.7 people is 22).
export function birthdayMatch365(x: number): number {
  const n = Math.floor(x)
  let none = 1
  for (let i = 0; i < n; i++) none *= (365 - i) / 365
  return 1 - none
}

// knobs: named values the expr may use next to x (the explore knob, e.g. r in 1000*(1+r/100)^x).
export function curveFn(t: CurveTruth, knobs: Record<string, number> = {}): (x: number) => number {
  if (t.preset === 'birthday_match_probability') return birthdayMatch365
  if (!t.expr) throw new Error('curve truth needs a preset or expr')
  const f = compile(t.expr)
  return (x) => Number(f.evaluate({ ...knobs, x }))
}

// The explore knob at the value the question asks about (its default).
export function knobsFor(item: Item): Record<string, number> {
  const ex = item.explore
  return ex && ex.default != null ? { [ex.param]: ex.default } : {}
}

// First integer x where the curve reaches y (the birthday problem's "how many for 50%").
export function firstReaching(f: (x: number) => number, y: number, lo: number, hi: number): number | null {
  for (let x = Math.ceil(lo); x <= hi; x++) if (f(x) >= y) return x
  return null
}

// The true value the round states: answer_expr computed here (numbers only), else answer_claimed.
export function answerValue(item: Item): number | null {
  if (item.answer_expr) {
    try {
      const v = Number(evaluate(item.answer_expr))
      if (Number.isFinite(v)) return v
    } catch {
      // fall through to the claimed number
    }
  }
  const c = item.answer_claimed
  return c != null && Number.isFinite(c) ? c : null
}

// First x in [lo, hi] where f reaches y (scan, then bisect).
export function crossing(f: (x: number) => number, y: number, lo: number, hi: number): number | null {
  const n = 400
  let x0 = lo
  let g0 = f(lo) - y
  if (g0 === 0) return lo
  for (let i = 1; i <= n; i++) {
    const x1 = lo + ((hi - lo) * i) / n
    const g1 = f(x1) - y
    if (g1 === 0) return x1
    if (g0 * g1 < 0) {
      let a = x0
      let b = x1
      let ga = g0
      for (let k = 0; k < 50; k++) {
        const m = (a + b) / 2
        const gm = f(m) - y
        if (ga * gm <= 0) b = m
        else [a, ga] = [m, gm]
      }
      return (a + b) / 2
    }
    x0 = x1
    g0 = g1
  }
  return null
}

const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.02 * Math.abs(b), 1e-6)

// axis: which coordinate the answer is ('y' = a value on the curve, 'x' = where it gets there).
export type CurvePoint = { x: number; y: number; axis: 'x' | 'y' }

// Where the answer sits on the curve. ask_x / ask_y say it outright; otherwise the answer is a y
// the curve reaches or an x in range, and the slider's unit breaks a tie (88.5 "% of ground
// gravity" is a y; day 47 is an x).
export function curvePoint(item: Item, t: CurveTruth, f: (x: number) => number, value: number | null): CurvePoint | null {
  const at = (x: number, axis: 'x' | 'y'): CurvePoint | null => {
    const y = f(x)
    return Number.isFinite(y) ? { x, y, axis } : null
  }
  if (t.ask_x != null) return at(t.ask_x, 'y')
  if (t.ask_y != null) {
    const x = value != null && near(f(value), t.ask_y) ? value : crossing(f, t.ask_y, t.x_min, t.x_max)
    return x == null ? null : { x, y: t.ask_y, axis: 'x' }
  }
  if (value == null) return null
  const yHit = crossing(f, value, t.x_min, t.x_max)
  const xHit = value >= t.x_min && value <= t.x_max
  if (yHit != null && xHit) {
    const unit = (item.slider?.unit ?? '').toLowerCase().trim()
    const inY = unit !== '' && t.y_label.toLowerCase().includes(unit)
    const inX = unit !== '' && t.x_label.toLowerCase().includes(unit)
    return inY && !inX ? { x: yHit, y: value, axis: 'y' } : at(value, 'x')
  }
  if (yHit != null) return { x: yHit, y: value, axis: 'y' }
  return xHit ? at(value, 'x') : null
}

export type Computed =
  | { kind: 'distribution'; hist: Histogram; value: number }
  | { kind: 'icons'; counts: ReturnType<typeof baseRate>; value: number }
  | { kind: 'curve'; f: (x: number) => number; value: number | null; point: CurvePoint | null }
  | { kind: 'estimate'; value: number | null }
  | { kind: 'none'; value: number | null }

// The number the guess is compared against, in the guess's own units.
export function computeTruth(item: Item): Computed {
  const t = item.truth
  if (t.widget === 'distribution') {
    if (t.sampler === 'base_rate_test') {
      const counts = baseRate(t.params)
      return { kind: 'icons', counts, value: counts.truth * 100 }
    }
    const hist = simulate(t)
    // A stated answer (P(9+ boys) = 15.1%) beats the average, which answers a different question.
    const stated = item.answer_expr ? answerValue(item) : null
    return { kind: 'distribution', hist, value: stated ?? hist.mean }
  }
  if (t.widget === 'curve') {
    const f = curveFn(t, knobsFor(item))
    if (t.preset === 'birthday_match_probability') {
      const half = firstReaching(f, 0.5, t.x_min, 366)
      return { kind: 'curve', f, value: half, point: half == null ? null : { x: half, y: f(half), axis: 'x' } }
    }
    const value = answerValue(item)
    const point = curvePoint(item, t, f, value)
    // With ask_x the truth is the curve's own y there.
    return { kind: 'curve', f, value: t.ask_x != null && point ? point.y : value, point }
  }
  if (t.widget === 'estimate') return { kind: 'estimate', value: answerValue(item) }
  return { kind: 'none', value: answerValue(item) }
}
