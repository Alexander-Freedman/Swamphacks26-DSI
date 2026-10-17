import { useEffect, useSyncExternalStore } from 'react'

// Where the learner is in a session, for the Ask panel (#186). Sessions that use the shell's
// SessionHead report it; App reads it. A session that reports nothing gets "unknown step".

export type HelpSpot = {
  /** storyboard screen id (B1-B7, C1-C7, P1-P6), when the session knows it */
  screen?: string
  /** true once the guess this screen asks about (or the session's guess) is locked in */
  locked?: boolean
  /** the learner's own guess, if they've made one */
  guess?: number | string | null
  step?: number
  total?: number
  label?: string
}

let spot: HelpSpot | null = null
const listeners = new Set<() => void>()
const set = (s: HelpSpot | null) => {
  spot = s
  listeners.forEach((l) => l())
}

/** Report the current spot while mounted; cleared on unmount. */
export function useReportSpot(s: HelpSpot) {
  const { screen, locked, guess, step, total, label } = s
  useEffect(() => {
    set({ screen, locked, guess, step, total, label })
  }, [screen, locked, guess, step, total, label])
  useEffect(() => () => set(null), [])
}

export function useHelpSpot(): HelpSpot | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => spot,
  )
}
