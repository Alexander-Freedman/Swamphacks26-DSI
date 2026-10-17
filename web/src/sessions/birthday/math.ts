// Birthday problem math. Exact numbers only; the room simulation is seeded so the first run is the same every time.
// Assumes 365 equally likely days and ignores Feb 29.

export const DAYS = 365
export const X_MIN = 2
export const X_MAX = 80

/** Exact chance that at least two of n people share a birthday: 1 - prod_{k<n} (365-k)/365. */
export function pMatch(n: number): number {
  return pAnyMatch(n, DAYS)
}

/** 4-digit PINs (0000-9999): the compare screen's second case. */
export const PINS = 10_000

/** Exact chance that at least two of n things share one of `options` equally likely values: 1 - prod_{k<n} (options-k)/options. */
export function pAnyMatch(n: number, options: number): number {
  if (n < 2) return 0
  if (n > options) return 1
  let q = 1
  for (let k = 0; k < n; k++) q *= (options - k) / options
  return 1 - q
}

/** Smallest n whose exact match chance among `options` values reaches q. */
export function sizeForChanceIn(q: number, options: number): number {
  for (let n = 2; n <= options + 1; n++) if (pAnyMatch(n, options) >= q) return n
  return options + 1
}

/** Number of pairs among n people. */
export const pairs = (n: number) => (n < 2 ? 0 : (n * (n - 1)) / 2)

/** Chance that at least one of the other n-1 people shares YOUR birthday. */
export const pMine = (n: number) => 1 - Math.pow((DAYS - 1) / DAYS, n - 1)

/** Other people you need for a 50% chance that someone matches YOU (253). */
export const needForMe = () => Math.ceil(Math.log(0.5) / Math.log((DAYS - 1) / DAYS))

/** Smallest group size whose exact match chance reaches q. */
export function sizeForChance(q: number): number {
  for (let n = 2; n <= DAYS + 1; n++) if (pMatch(n) >= q) return n
  return DAYS + 1
}

export function pct(x: number): string {
  if (x >= 1) return '100%'
  if (x > 0.9995) return '>99.9%'
  return (x * 100).toFixed(1) + '%'
}

/** mulberry32: small seeded RNG so the demo room is the same every time. */
export function rng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Birthdays (0..364) people walk in with, stopping at the first person who matches someone. */
export function roomUntilMatch(rand: () => number): number[] {
  const days: number[] = []
  const seen = new Set<number>()
  for (;;) {
    const d = Math.floor(rand() * DAYS)
    days.push(d)
    if (seen.has(d)) return days
    seen.add(d)
  }
}

/** Most people the room holds (4,950 pairs); enough to watch matches pile up. */
export const ROOM_MAX = 100

/**
 * Add up to k people (days drawn from rand). With stopAtMatch, stop right after the first person who
 * matches someone, so +5 or holding never skips past the moment. Never goes past ROOM_MAX.
 */
export function addPeople(days: number[], k: number, rand: () => number, stopAtMatch: boolean): number[] {
  const out = [...days]
  const seen = new Set(out)
  let matched = seen.size < out.length
  for (let i = 0; i < k && out.length < ROOM_MAX; i++) {
    const d = Math.floor(rand() * DAYS)
    out.push(d)
    if (seen.has(d) && !matched) {
      matched = true
      if (stopAtMatch) break
    }
    seen.add(d)
  }
  return out
}

/** People in the room when the first match happened (1-based), or null if nobody matches yet. */
export function firstMatchAt(days: number[]): number | null {
  const seen = new Set<number>()
  for (let i = 0; i < days.length; i++) {
    if (seen.has(days[i])) return i + 1
    seen.add(days[i])
  }
  return null
}

/** Days with two or more people on them. */
export function sharedDays(days: number[]): number[] {
  const c = new Map<number, number>()
  for (const d of days) c.set(d, (c.get(d) ?? 0) + 1)
  return [...c].filter(([, v]) => v > 1).map(([d]) => d)
}

/** Seed for the first room: its first match lands at 23 people (checked in the tests). */
export const FIRST_ROOM_SEED = 94

const MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export { MONTH_LEN }

/** Day of year (0..364) -> [month 0..11, day of month 0..30]. */
export function monthDay(day: number): [number, number] {
  let m = 0
  let d = day
  while (d >= MONTH_LEN[m]) {
    d -= MONTH_LEN[m]
    m++
  }
  return [m, d]
}

export const dayLabel = (day: number) => {
  const [m, d] = monthDay(day)
  return `${MONTHS[m]} ${d + 1}`
}

export type Pt = { x: number; y: number }

/**
 * Turn raw drawn points (x in people, y in 0..1, any order, any density) into one value per
 * whole x from X_MIN..X_MAX. Later strokes win; gaps are filled by straight lines; the ends are held flat.
 * Returns null when nothing was drawn.
 */
export function resample(points: Pt[], lo = X_MIN, hi = X_MAX): number[] | null {
  if (!points.length) return null
  const at = new Map<number, number>()
  let prev: Pt | null = null
  for (const raw of points) {
    const p = { x: Math.min(hi, Math.max(lo, raw.x)), y: Math.min(1, Math.max(0, raw.y)) }
    if (prev && Math.round(prev.x) !== Math.round(p.x)) {
      // fill whole x's between consecutive points of one stroke
      const a = Math.round(prev.x)
      const b = Math.round(p.x)
      const step = Math.sign(b - a)
      for (let k = a; k !== b; k += step) at.set(k, prev.y + ((p.y - prev.y) * (k - a)) / (b - a))
    }
    at.set(Math.round(p.x), p.y)
    prev = p
  }
  const xs = [...at.keys()].sort((a, b) => a - b)
  const out: number[] = []
  for (let x = lo; x <= hi; x++) {
    const v = at.get(x)
    if (v != null) {
      out[x] = v
      continue
    }
    const below = xs.filter((k) => k < x).pop()
    const above = xs.find((k) => k > x)
    if (below == null) out[x] = at.get(above!)!
    else if (above == null) out[x] = at.get(below)!
    else out[x] = at.get(below)! + ((at.get(above)! - at.get(below)!) * (x - below)) / (above - below)
  }
  return out
}

/** How much of the x range a drawing covers (0..1), to decide if it's a real curve yet. */
export function coverage(points: Pt[], lo = X_MIN, hi = X_MAX): number {
  if (points.length < 2) return 0
  const xs = points.map((p) => p.x)
  return (Math.min(hi, Math.max(...xs)) - Math.max(lo, Math.min(...xs))) / (hi - lo)
}

/** The "skip" curve: a straight line from 0% at 2 people through 50% at your guess. */
export function lineFromGuess(guess: number, lo = X_MIN, hi = X_MAX): number[] {
  const out: number[] = []
  const g = Math.max(guess, lo + 1)
  for (let x = lo; x <= hi; x++) out[x] = Math.min(1, (0.5 * (x - lo)) / (g - lo))
  return out
}

/** Exact truth sampled on the same grid as a drawn curve. */
export function truthCurve(lo = X_MIN, hi = X_MAX): number[] {
  const out: number[] = []
  for (let x = lo; x <= hi; x++) out[x] = pMatch(x)
  return out
}
