import { useSyncExternalStore } from 'react'
import type { Computed } from './truth'
import type { Item, Round } from './types'

// What the API sends next to a generated round (POST /api/rounds). Showcases carry none.
export type RoundMeta = {
  source?: string
  seconds?: number
  checks?: { kept: string[]; dropped: Record<string, string>; blind_checked: boolean }
}

export type Current = { round: Round; idx: number; meta?: RoundMeta } | null

let current: Current = null
const subs = new Set<() => void>()

export function setCurrent(c: Current) {
  current = c
  subs.forEach((f) => f())
}

export function useCurrent(): Current {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => current,
  )
}

// Fired on reset; anything holding local state (a pending topic build, the collection) listens for it.
export const RESET_EVENT = 'mm:reset'

export function resetLocal() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      Object.keys(store).filter((k) => k.startsWith('mm')).forEach((k) => store.removeItem(k))
    } catch {
      // storage blocked: nothing to clear
    }
  }
  const url = new URL(location.href)
  url.searchParams.delete('reset')
  url.searchParams.delete('round')
  history.replaceState(history.state, '', url)
  window.dispatchEvent(new Event(RESET_EVENT))
}

export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  if (!t || !t.tagName) return false
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
}

export type CheckState = 'pass' | 'fail' | 'na'
export type Check = { name: string; state: CheckState; note: string }

const HAND = 'n/a — hand-checked showcase'

export function checksFor(round: Round, item: Item, truth: Computed, meta?: RoundMeta): Check[] {
  const gen = !round.reviewed
  const dropped = meta?.checks ? Object.keys(meta.checks.dropped).length : 0
  const value = truth.value
  const correct = item.bands?.filter((b) => b.misconception_id == null) ?? []

  let bands: Check
  if (item.input_type === 'slider' && correct.length === 1 && value != null) {
    const ok = value >= correct[0].min && value <= correct[0].max
    bands = { name: 'bands agree', state: ok ? 'pass' : 'fail', note: `correct band ${correct[0].min}–${correct[0].max}` }
  } else if (item.input_type === 'choice' && item.options?.length) {
    const n = item.options.filter((o) => o.misconception_id == null).length
    bands = { name: 'bands agree', state: n === 1 ? 'pass' : 'fail', note: `${n} correct option${n === 1 ? '' : 's'}` }
  } else {
    bands = { name: 'bands agree', state: 'na', note: 'no numeric answer' }
  }

  const c = (name: string, state: CheckState, note: string): Check => ({ name, state, note })
  const stepper = item.truth.widget === 'stepper'
  return [
    gen ? c('schema', 'pass', 'validated by the API') : c('schema', 'na', HAND),
    value != null
      ? c('truth computed', 'pass', 'in this browser, from the spec')
      : c('truth computed', stepper ? 'na' : 'fail', stepper ? 'worked steps, no number' : 'no value'),
    bands,
    gen ? c('lint', 'pass', dropped ? `passed; ${dropped} item${dropped === 1 ? '' : 's'} dropped` : 'passed') : c('lint', 'na', HAND),
    meta?.checks?.blind_checked
      ? c('blind check', 'pass', 'second model agreed')
      : c('blind check', 'na', gen ? 'not run: code computed the truth' : HAND),
  ]
}
