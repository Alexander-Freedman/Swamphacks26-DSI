import type { DistributionTruth, SamplerParams } from './types'

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
