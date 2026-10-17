// Exact math for the coin streak session. Headline numbers are computed, never simulated.
// A "coin" here repeats the previous side with probability r. A fair coin is r = 0.5;
// "a coin that switches like you" uses r = 1 - your switch rate (a two-state Markov chain).

export type Side = 'H' | 'T'

// P(longest run <= k) in n flips, O(n).
// a[m] = P(first m flips have every run <= k and flip m+1 switches side), a[0] = 1.
// T(m) = sum_{j=1..k} a[m-j] r^(j-1) = P(first m flips have every run <= k).
export function pLongestAtMost(n: number, k: number, r = 0.5): number {
  if (n <= 0) return 1
  if (k <= 0) return 0
  if (k >= n) return 1
  const a = new Float64Array(n + 1)
  a[0] = 1
  const rk1 = Math.pow(r, k - 1)
  let t = 1 // T(1)
  for (let m = 1; m < n; m++) {
    a[m] = (1 - r) * t
    t = a[m] + r * (t - (m - k >= 0 ? a[m - k] * rk1 : 0))
  }
  return Math.min(1, Math.max(0, t))
}

export const pLongestAtLeast = (n: number, k: number, r = 0.5) => 1 - pLongestAtMost(n, k - 1, r)

// E[longest run] = sum_{k>=0} P(L > k).
// Speed-up: the first k0+1 terms are 1 to within 1e-13 each, so find k0 by binary search
// (P(L <= k) grows with k) and sum from there. Once the tail is tiny it shrinks by a factor r per
// step (P(L > k) ~ n(1-r)r^k), so the rest of the sum is closed-form: tail * r / (1 - r).
// The error from that is far below the 2 decimals we show (tests pin it against the plain sum).
export function expectedLongest(n: number, r = 0.5): number {
  if (n <= 0) return 0
  let lo = 0
  let hi = n
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (pLongestAtMost(n, mid, r) < 1e-13) lo = mid
    else hi = mid
  }
  let e = lo // k = 0 .. lo-1 contribute 1 each
  for (let k = lo; k < n; k++) {
    const tail = 1 - pLongestAtMost(n, k, r)
    e += tail
    if (tail < 1e-7) return e + (tail * r) / (1 - r)
  }
  return e
}

// The plain sum over every k, for the tests.
export function expectedLongestSlow(n: number, r = 0.5): number {
  let e = 0
  for (let k = 0; k < n; k++) e += 1 - pLongestAtMost(n, k, r)
  return e
}

// Slow O(n*k) state DP over the current run length. Used by the tests to check the fast one.
export function pLongestAtMostSlow(n: number, k: number, r = 0.5): number {
  if (n <= 0) return 1
  if (k <= 0) return 0
  let p = new Float64Array(k + 1)
  p[1] = 1
  for (let i = 1; i < n; i++) {
    const q = new Float64Array(k + 1)
    for (let j = 1; j <= k; j++) {
      if (!p[j]) continue
      q[1] += p[j] * (1 - r)
      if (j < k) q[j + 1] += p[j] * r
    }
    p = q
  }
  return p.reduce((s, v) => s + v, 0)
}

export type Run = { start: number; len: number }

export function runs(seq: readonly Side[]): Run[] {
  const out: Run[] = []
  let s = 0
  for (let i = 1; i <= seq.length; i++) {
    if (i === seq.length || seq[i] !== seq[i - 1]) {
      out.push({ start: s, len: i - s })
      s = i
    }
  }
  return out
}

export function longestRun(seq: readonly Side[]): number {
  return runs(seq).reduce((b, r) => Math.max(b, r.len), 0)
}

export function longestRunAt(seq: readonly Side[]): Run | null {
  return runs(seq).reduce<Run | null>((b, r) => (!b || r.len > b.len ? r : b), null)
}

export function switchRate(seq: readonly Side[]): number {
  if (seq.length < 2) return 0
  let c = 0
  for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) c++
  return c / (seq.length - 1)
}

// Repeat chance of "a coin like you", kept away from 0/1 so the curve stays finite.
export const repeatRateLike = (seq: readonly Side[]) => Math.min(0.9, Math.max(0.05, 1 - switchRate(seq)))

// Seeded RNG (mulberry32) so the first flip and the screenshots are the same every time.
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

export function flipSeq(n: number, rand: () => number): Side[] {
  return Array.from({ length: n }, () => (rand() < 0.5 ? 'H' : 'T'))
}

// Longest run of n fair flips without building the array (for "run 1,000").
export function longestOfFlips(n: number, rand: () => number): number {
  let best = 1
  let run = 1
  let prev = rand() < 0.5
  for (let i = 1; i < n; i++) {
    const x = rand() < 0.5
    run = x === prev ? run + 1 : 1
    if (run > best) best = run
    prev = x
  }
  return best
}

export const toSides = (s: string): Side[] => s.split('').filter((c): c is Side => c === 'H' || c === 'T')

// A sample "human" sequence: 66% switch chance, runs capped at 4 (68 switches in 99, longest run 4).
// It mimics what people inventing random sequences tend to write; the exact 68% is our parameter (unverified).
export const HUMAN_SAMPLE = toSides(
  'HTTHTHTHTHTTHHHHTHTTHTTTTHTHHTTHTHHTHTHHTTHTHHTHTHHTHTTTHTHTHTHTTHHHHTTHHHTTHTHTTHTTHTTHTHTHHTHTHTHH',
)
