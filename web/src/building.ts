import { useSyncExternalStore } from 'react'
import { showcaseSlugs } from './rounds'
import { computeTruth } from './truth'
import type { Item, Round } from './types'

// One build at a time, kept outside React so reset can cancel it from anywhere.
export const STEPS = ['writing the question', 'picking a reveal', 'computing the truth'] as const
export const CUTOFF_MS = 20_000
const HARD_STOP_MS = 60_000
const PICKING_AT_MS = 2_500

export type FallbackReason = 'static' | 'failed' | 'slow'
export type Build =
  | { status: 'idle' }
  | { status: 'building'; topic: string; step: number }
  | { status: 'ready'; topic: string; round: Round }
  | { status: 'fallback'; topic: string; reason: FallbackReason; suggestions: string[] }

let state: Build = { status: 'idle' }
let ctrl: AbortController | null = null
let timers: ReturnType<typeof setTimeout>[] = []
const subs = new Set<() => void>()

function set(next: Build) {
  state = next
  subs.forEach((f) => f())
}

export function getBuild(): Build {
  return state
}

export function subscribe(f: () => void): () => void {
  subs.add(f)
  return () => subs.delete(f)
}

export function useBuild(): Build {
  return useSyncExternalStore(subscribe, getBuild, getBuild)
}

function stopTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

export function cancelBuild() {
  ctrl?.abort()
  ctrl = null
  stopTimers()
  set({ status: 'idle' })
}

export function apiBase(): string {
  return (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')
}

function closest(suggestions: unknown): string[] {
  const s = Array.isArray(suggestions) ? suggestions.filter((x) => showcaseSlugs.includes(x)) : []
  return (s.length ? s : showcaseSlugs).slice(0, 3)
}

// Keep only items this build can play, and only where the truth actually computes.
function playable(item: Item): boolean {
  if (item.input_type === 'slider' && !item.slider) return false
  if (item.input_type === 'choice' && !item.options?.length) return false
  if (item.input_type !== 'slider' && item.input_type !== 'choice') return false
  try {
    computeTruth(item)
    return true
  } catch {
    return false
  }
}

export function usable(round: unknown): Round | null {
  const r = round as Round | null
  if (!r || typeof r !== 'object' || !Array.isArray(r.items) || !Array.isArray(r.misconceptions)) return null
  const items = r.items.filter(playable)
  return items.length ? { ...r, items } : null
}

export function startBuild(topic: string) {
  cancelBuild()
  const t = topic.trim()
  if (!t) return
  const base = apiBase()
  if (!base) return set({ status: 'fallback', topic: t, reason: 'static', suggestions: closest(null) })

  const c = new AbortController()
  ctrl = c
  let late = false
  set({ status: 'building', topic: t, step: 0 })
  const fallback = (reason: FallbackReason, suggestions?: unknown) => {
    if (ctrl !== c) return
    if (reason !== 'slow') {
      ctrl = null
      stopTimers()
    }
    set({ status: 'fallback', topic: t, reason, suggestions: closest(suggestions) })
  }
  timers.push(
    setTimeout(() => state.status === 'building' && ctrl === c && set({ ...state, step: 1 }), PICKING_AT_MS),
    // Past the cutoff we offer the closest showcases, but a late round still lands quietly.
    setTimeout(() => {
      late = true
      fallback('slow')
    }, CUTOFF_MS),
    setTimeout(() => c.abort(), HARD_STOP_MS),
  )

  fetch(`${base}/api/rounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: t }),
    signal: c.signal,
  })
    .then(async (res) => {
      if (ctrl !== c) return
      const body = res.ok ? await res.json() : null
      if (ctrl !== c) return
      if (!body || body.status !== 'ok') return fallback('failed', body?.suggestions)
      if (!late) set({ status: 'building', topic: t, step: 2 })
      const round = usable(body.round)
      if (!round) return fallback('failed')
      ctrl = null
      stopTimers()
      set({ status: 'ready', topic: t, round })
    })
    .catch(() => fallback(late ? 'slow' : 'failed'))
}
