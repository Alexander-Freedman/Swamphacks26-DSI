import { useEffect, useState, useSyncExternalStore } from 'react'
import { showcaseRound, showcaseSlugs } from './rounds'
import type { ChecksReport, Round } from './types'
import type { ExtraTopic } from './extraIndex'
import bundledIndex from 'virtual:extra-index'

// "Try any topic": hand-reviewed extra rounds (data/rounds/extra/) and, only when a backend is
// configured, freshly generated ones. On Pages there is no backend: scripts/deploy-pages.sh
// publishes the extras as static files at <base>rounds/extra/<slug>.json + index.json.

export type { ExtraTopic }

// Builds take a median 27 s, p90 51 s (NOTES.md, 25-topic trial), so wait up to 45 s.
export const GENERATE_TIMEOUT_MS = 45_000

const base = () => import.meta.env.BASE_URL
// Backend origin for POST /api/rounds. Unset on Pages (no backend), so typed topics never
// trigger a network call there. '' would mean "same origin" (dev, via the vite proxy).
export const apiBase = (): string | null => (import.meta.env.VITE_API_BASE as string | undefined) ?? null

// Same key as the backend's normalize_topic: casefold, non-alphanumerics except + and # to spaces.
export function normalizeTopic(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return (await res.json()) as T
}

let indexPromise: Promise<ExtraTopic[]> | null = null

// bundledIndex: the hand-checked extras' names (slug/topic/aliases, not the rounds), baked in at
// build time by the extra-rounds plugin in vite.config.ts; a file with no aliases gets []. Used
// only when there's a backend but no static index next to the page (a backend-only deploy): the
// backend serves those rounds at GET /api/rounds/{slug}.

/**
 * The reviewed extra topics: the static index (Pages, dev) first. If it isn't there and a backend
 * is configured, the names baked into the bundle (the backend serves those rounds). Else none.
 */
export function loadExtraIndex(): Promise<ExtraTopic[]> {
  indexPromise ??= (async () => {
    try {
      return await getJson<ExtraTopic[]>(`${base()}rounds/extra/index.json`)
    } catch {
      return apiBase() === null ? [] : bundledIndex
    }
  })()
  return indexPromise
}

/**
 * Common names for the three sessions (#167), so the topic box opens them like any extra. Session
 * folders stay untouched: the names live here, keyed by the session's (and showcase round's) slug.
 */
export const SESSION_ALIASES: Record<string, string[]> = {
  birthday: ['the birthday problem', 'birthday problem', 'birthday paradox', 'shared birthday', 'shared birthdays', 'same birthday', 'birthdays'],
  'coin-streak': [
    'be a coin', 'coin', 'coins', 'coin flip', 'coin flips', 'coin toss', 'flipping coins', 'streak', 'streaks',
    "gambler's fallacy", 'hot hand', 'hot hand fallacy', 'randomness', 'random', 'heads or tails',
  ],
  'positive-test': [
    'you tested positive', 'positive test', 'false positive', 'false positives', 'base rate', 'base rate fallacy',
    'base rate neglect', 'bayes', "bayes' theorem", 'bayes theorem', 'bayes rule', 'medical test', 'screening test',
  ],
}

// Words that don't pick a topic on their own ("monty hall paradox" = "monty hall", "dice odds" = "dice").
const FILLER = new Set(
  'a an the of to in on and or for is are do does what why how works work problem paradox effect theorem rule law probability odds chance chances math statistics'.split(' '),
)

/** Content words of a name: normalized, filler and 1-letter bits dropped, a plural s trimmed. */
function words(text: string): Set<string> {
  return new Set(
    normalizeTopic(text)
      .split(' ')
      .filter((w) => w.length > 1 && !FILLER.has(w))
      .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)),
  )
}

// A loose hit needs every content word of one side inside the other, covering at least half of
// the longer one ("interest" in "compound interest", "dice" in "dice odds").
export const LOOSE_MIN = 0.5

function looseScore(typed: Set<string>, name: Set<string>): number {
  if (!typed.size || !name.size) return 0
  const inside = (a: Set<string>, b: Set<string>) => [...a].every((w) => b.has(w))
  if (inside(typed, name)) return typed.size / name.size
  if (inside(name, typed)) return name.size / typed.size
  return 0
}

/**
 * Slug of a session, showcase or extra topic matching typed text, if any. Exact first (topic, slug,
 * session name or alias, case and punctuation ignored); else the best loose word match at or above
 * LOOSE_MIN, unless two different topics tie for it (then it's a miss, never a guess).
 */
export function matchTopic(text: string, extras: ExtraTopic[]): string | null {
  const key = normalizeTopic(text)
  if (!key) return null
  const names: [string, string[]][] = [
    ...showcaseSlugs.map((slug): [string, string[]] => [slug, [showcaseRound(slug)!.topic, slug, ...(SESSION_ALIASES[slug] ?? [])]]),
    ...extras.map((e): [string, string[]] => [e.slug, [e.topic, e.slug, ...e.aliases]]),
  ]
  for (const [slug, list] of names) if (list.some((t) => normalizeTopic(t) === key)) return slug
  const typed = words(text)
  let best: string | null = null
  let top = 0
  let tie = false
  for (const [slug, list] of names) {
    const score = Math.max(...list.map((t) => looseScore(typed, words(t))))
    if (score < LOOSE_MIN || score < top) continue
    if (score > top) {
      top = score
      best = slug
      tie = false
    } else if (slug !== best) tie = true
  }
  return tie ? null : best
}

// Rounds fetched or generated this visit, so opening one is instant and Back/Forward work.
const loaded = new Map<string, Round>()

export function cachedRound(slug: string): Round | undefined {
  return loaded.get(slug)
}

// The check report that came with a round built this visit (the "How it works" drawer shows it).
const reports = new Map<string, ChecksReport | null>()

/** undefined = no build this visit gave us a report for this slug; null = the backend sent none. */
export function checksFor(slug: string): ChecksReport | null | undefined {
  return reports.get(slug)
}

let health: Promise<boolean> | null = null

/**
 * One GET /api/health per page load (no polling): true = the backend answered. Only called when
 * a backend is configured; it's a free endpoint, nothing paid.
 */
export function backendHealth(timeoutMs = 5000): Promise<boolean> {
  const api = apiBase()
  if (api === null) return Promise.resolve(false)
  health ??= (async () => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(`${api}/api/health`, { signal: ctrl.signal })
      return res.ok
    } catch {
      return false
    } finally {
      clearTimeout(timer)
    }
  })()
  return health
}

/** An extra round by slug: static file first, then GET /api/rounds/{slug} if there's a backend. */
export async function loadExtraRound(slug: string): Promise<Round> {
  const hit = loaded.get(slug)
  if (hit) return hit
  let round: Round
  try {
    round = await getJson<Round>(`${base()}rounds/extra/${encodeURIComponent(slug)}.json`)
  } catch (err) {
    // No backend (Pages): never ask the page's own origin for /api, it can only 404.
    const api = apiBase()
    if (api === null) throw err
    round = await getJson<Round>(`${api}/api/rounds/${encodeURIComponent(slug)}`)
  }
  if (!round?.slug || !Array.isArray(round.items)) throw new Error(`round ${slug}: not a round`)
  loaded.set(slug, round)
  return round
}

// nearest: the API's closest ready topics ({slug, topic, kind}); reason: why nothing was built.
export type Nearest = { slug: string; topic: string; kind?: string }
export type Generated = { status: 'ok'; slug: string } | { status: 'fallback'; suggestions: string[]; reason?: string; nearest?: Nearest[] }

// Shown when the API says nothing fits but gives no reason, and when the build ran past the wait.
export const NO_FIT = 'No runnable model fits that topic yet.'
export const TOO_SLOW = 'No model came back within 45 seconds.'

/**
 * POST /api/rounds {topic}. The backend rate-limits and caps this; the browser only ever calls
 * it on a typed topic with no cached match. Anything slow, failed or refused → fallback.
 */
export async function generateRound(topic: string, timeoutMs = GENERATE_TIMEOUT_MS): Promise<Generated> {
  const api = apiBase()
  if (api === null) return { status: 'fallback', suggestions: [] }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const body = await getJson<{ status: string; round?: Round; suggestions?: string[]; checks?: ChecksReport | null; reason?: string; nearest?: Nearest[] }>(`${api}/api/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
      signal: ctrl.signal,
    })
    if (body.status === 'ok' && body.round?.slug && Array.isArray(body.round.items)) {
      loaded.set(body.round.slug, body.round)
      reports.set(body.round.slug, body.checks ?? null)
      return { status: 'ok', slug: body.round.slug }
    }
    const nearest = (body.nearest ?? []).filter((n) => n && typeof n.slug === 'string')
    return { status: 'fallback', suggestions: body.suggestions ?? nearest.map((n) => n.slug), reason: body.reason || NO_FIT, nearest }
  } catch (err) {
    const slow = (err as Error)?.name === 'AbortError'
    return { status: 'fallback', suggestions: [], reason: slow ? TOO_SLOW : NO_FIT }
  } finally {
    clearTimeout(timer)
  }
}

// One build at a time, kept outside the component: someone can play a reviewed chip while it
// runs, and when it lands we offer it ("Your topic's ready") instead of pulling them out.
export type Build =
  | { kind: 'idle' }
  | { kind: 'building'; topic: string }
  | { kind: 'ready'; topic: string; slug: string }
  | { kind: 'failed'; topic: string; suggestions: string[]; reason?: string; nearest?: Nearest[] }

let build: Build = { kind: 'idle' }
const listeners = new Set<() => void>()
const setBuild = (b: Build) => {
  build = b
  listeners.forEach((l) => l())
}

export function useBuild(): Build {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => build,
  )
}

export async function startBuild(topic: string, timeoutMs?: number): Promise<void> {
  if (build.kind === 'building') return
  setBuild({ kind: 'building', topic })
  const res = await generateRound(topic, timeoutMs)
  setBuild(
    res.status === 'ok'
      ? { kind: 'ready', topic, slug: res.slug }
      : { kind: 'failed', topic, suggestions: res.suggestions, reason: res.reason, nearest: res.nearest },
  )
}

export function clearBuild(): void {
  if (build.kind !== 'building') setBuild({ kind: 'idle' })
}

/** Round for a ?round= slug that isn't a bundled showcase: loading, then the round or missing. */
export function useExtraRound(slug: string | null): { round?: Round; missing: boolean } {
  const [state, setState] = useState<{ slug: string; round?: Round; missing: boolean } | null>(null)
  useEffect(() => {
    if (!slug || loaded.has(slug)) return
    let live = true
    loadExtraRound(slug).then(
      (round) => live && setState({ slug, round, missing: false }),
      () => live && setState({ slug, missing: true }),
    )
    return () => {
      live = false
    }
  }, [slug])
  if (!slug) return { missing: false }
  const hit = loaded.get(slug)
  if (hit) return { round: hit, missing: false }
  return state?.slug === slug ? { round: state.round, missing: state.missing } : { missing: false }
}

/** Test hook: forget the cached index and rounds. */
export function resetExtrasCache(): void {
  indexPromise = null
  loaded.clear()
  reports.clear()
  health = null
  build = { kind: 'idle' }
}
