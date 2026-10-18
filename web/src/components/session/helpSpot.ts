import { useEffect, useSyncExternalStore } from 'react'

// Where the learner is in a session, for the Ask panel (#186). Sessions that use the shell's
// SessionHead report it; App reads it. A session that reports nothing gets "unknown step".

/** What one layer/screen tells the Ask panel (#243): shared with the backend's generic help path. */
export type LayerHelp = {
  /** the layer's name, e.g. "Drag the tangent" */
  title: string
  /** one line: what the learner sees and can do right now */
  onScreen: string
  /** true numbers/rules the tutor may use; it never invents others */
  facts: string[]
  /** 2-3 starter questions shown as buttons */
  suggested: string[]
  /** shown when help can't answer (no backend, busy, offline) */
  hint: string
}

/** A LayerHelp plus where it sits. Subject/topic/layer number default from the session and the shell. */
export type LayerReport = LayerHelp & { subject?: string; topic?: string; layerN?: number; lastAction?: string }

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
  /** the SessionHead chip, e.g. "Calculus · The slope of a curve" */
  chip?: string
  /** the screen's own LayerHelp, when it reports one */
  layer?: LayerReport
}

let spot: HelpSpot | null = null
const listeners = new Set<() => void>()
const set = (s: HelpSpot | null) => {
  spot = s
  listeners.forEach((l) => l())
}

/** Report the current spot while mounted; cleared on unmount. */
export function useReportSpot(s: HelpSpot) {
  const { screen, locked, guess, step, total, label, chip, layer } = s
  // the layer object is usually rebuilt each render; report it again only when its content changes
  const layerKey = layer ? JSON.stringify(layer) : ''
  useEffect(() => {
    set({ screen, locked, guess, step, total, label, chip, layer: layerKey ? (JSON.parse(layerKey) as LayerReport) : undefined })
  }, [screen, locked, guess, step, total, label, chip, layerKey])
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
