import { useEffect, useState, useSyncExternalStore } from 'react'
import { showcaseRound, showcaseSlugs } from './rounds'
import type { Round } from './types'
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

/** Slug of a showcase or extra topic matching typed text (topic, slug or alias), if any. */
export function matchTopic(text: string, extras: ExtraTopic[]): string | null {
  const key = normalizeTopic(text)
  if (!key) return null
  for (const slug of showcaseSlugs) {
    const r = showcaseRound(slug)!
    if (key === normalizeTopic(r.topic) || key === normalizeTopic(slug)) return slug
  }
  const hit = extras.find((e) => [e.topic, e.slug, ...e.aliases].some((t) => normalizeTopic(t) === key))
  return hit?.slug ?? null
}

// Rounds fetched or generated this visit, so opening one is instant and Back/Forward work.
const loaded = new Map<string, Round>()

export function cachedRound(slug: string): Round | undefined {
  return loaded.get(slug)
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

export type Generated = { status: 'ok'; slug: string } | { status: 'fallback'; suggestions: string[] }

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
    const body = await getJson<{ status: string; round?: Round; suggestions?: string[] }>(`${api}/api/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
      signal: ctrl.signal,
    })
    if (body.status === 'ok' && body.round?.slug && Array.isArray(body.round.items)) {
      loaded.set(body.round.slug, body.round)
      return { status: 'ok', slug: body.round.slug }
    }
    return { status: 'fallback', suggestions: body.suggestions ?? [] }
  } catch {
    return { status: 'fallback', suggestions: [] }
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
  | { kind: 'failed'; topic: string; suggestions: string[] }

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
  setBuild(res.status === 'ok' ? { kind: 'ready', topic, slug: res.slug } : { kind: 'failed', topic, suggestions: res.suggestions })
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
  build = { kind: 'idle' }
}
