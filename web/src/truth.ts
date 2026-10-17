import { compile, parse, SymbolNode } from 'mathjs'
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
    case 'coin_longest_run': {
      // Same as longestRun(flips(...)) without the array: n=1000 x 10k trials stays fast.
      const n = p.n ?? 100
      const q = p.p ?? 0.5
      let best = 0
      let run = 0
      let prev = false
      for (let i = 0; i < n; i++) {
        const h = rand() < q
        run = i > 0 && h === prev ? run + 1 : 1
        if (run > best) best = run
        prev = h
      }
      return best
    }
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

export function simulate(t: DistributionTruth, seed = 7, trialsOverride?: number): Histogram {
  const rand = rng(seed)
  const trials = trialsOverride ?? t.params.trials ?? 10000
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

export function birthdayMatch365(x: number): number {
  let none = 1
  for (let i = 0; i < x; i++) none *= (365 - i) / 365
  return 1 - none
}

export function curveFn(t: CurveTruth): (x: number) => number {
  if (t.preset === 'birthday_match_probability') return birthdayMatch365
  if (!t.expr) throw new Error('curve truth needs a preset or expr')
  const f = compile(t.expr)
  return (x) => Number(f.evaluate({ x }))
}

// First integer x where the curve reaches y (the birthday problem's "how many for 50%").
export function firstReaching(f: (x: number) => number, y: number, lo: number, hi: number): number | null {
  for (let x = Math.ceil(lo); x <= hi; x++) if (f(x) >= y) return x
  return null
}

export type Computed =
  | { kind: 'distribution'; hist: Histogram; value: number }
  | { kind: 'icons'; counts: ReturnType<typeof baseRate>; value: number }
  | { kind: 'curve'; f: (x: number) => number; value: number | null }
  | { kind: 'estimate'; unit: string; value: number }
  | { kind: 'none'; value: null }

// The number the guess is compared against, in the guess's own units.
export function computeTruth(item: Item): Computed {
  const t = item.truth
  if (t.widget === 'distribution') {
    if (t.sampler === 'base_rate_test') {
      const counts = baseRate(t.params)
      return { kind: 'icons', counts, value: counts.truth * 100 }
    }
    const hist = simulate(t)
    return { kind: 'distribution', hist, value: hist.mean }
  }
  if (t.widget === 'curve') {
    const f = curveFn(t)
    const half = t.preset === 'birthday_match_probability' ? firstReaching(f, 0.5, t.x_min, 366) : null
    return { kind: 'curve', f, value: half }
  }
  if (t.widget === 'estimate') {
    const value = item.answer_expr ? evalExpr(item.answer_expr) : null
    return value == null ? { kind: 'none', value: null } : { kind: 'estimate', unit: t.unit ?? '', value }
  }
  return { kind: 'none', value: null }
}

// answer_expr: the shared mathjs subset (api/app/truth.py::eval_expr). Bad specs show no number, not a crash.
export function evalExpr(expr: string, scope: Record<string, number> = {}): number | null {
  try {
    const v = Number(compile(expr).evaluate({ ...scope }))
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

export function exprUses(expr: string, name: string): boolean {
  try {
    return parse(expr).filter((n) => n instanceof SymbolNode && n.name === name).length > 0
  } catch {
    return false
  }
}

// "Play with it": does the explore slider change anything this widget draws?
export function explorable(item: Item): boolean {
  const e = item.explore
  const t = item.truth
  if (!e) return false
  if (t.widget === 'distribution') return e.param in PARAM_KEYS
  if (t.widget === 'curve') return true
  if (t.widget === 'estimate') return !!item.answer_expr && exprUses(item.answer_expr, e.param)
  return false
}

const PARAM_KEYS: Record<keyof SamplerParams, true> = {
  n: true, p: true, population: true, base_rate: true, sensitivity: true, false_positive_rate: true, group_size: true, dice: true, trials: true,
}

// Where the explore slider starts: the value the question was asked at.
export function exploreStart(item: Item, truth: Computed): number {
  const e = item.explore!
  const t = item.truth
  const raw = t.widget === 'distribution' ? t.params[e.param as keyof SamplerParams] : t.widget === 'curve' ? truth.value : null
  return Math.min(e.max, Math.max(e.min, raw ?? e.min))
}

// Recompute the truth with the explore param set to v. Same seed, so dragging back gives the same picture.
// Curves don't change (the slider moves a marker along them); trials can be cut while dragging.
export function exploreTruth(item: Item, v: number, trials?: number): Computed {
  const t = item.truth
  const param = item.explore?.param
  if (!param) return computeTruth(item)
  if (t.widget === 'distribution') {
    const params = { ...t.params, [param]: v }
    if (t.sampler === 'base_rate_test') {
      const counts = baseRate(params)
      return { kind: 'icons', counts, value: counts.truth * 100 }
    }
    const hist = simulate({ ...t, params }, 7, trials)
    return { kind: 'distribution', hist, value: hist.mean }
  }
  if (t.widget === 'estimate' && item.answer_expr) {
    const value = evalExpr(item.answer_expr, { [param]: v })
    return value == null ? { kind: 'none', value: null } : { kind: 'estimate', unit: t.unit ?? '', value }
  }
  return computeTruth(item)
}

// One random room of size n, as day-of-year numbers. Seeded, so adding people keeps the earlier ones
// (seed 22: the first shared pair shows up at exactly 23 people).
export function birthdays(n: number, seed = 22): number[] {
  const rand = rng(seed)
  return Array.from({ length: n }, () => Math.floor(rand() * 365))
}
