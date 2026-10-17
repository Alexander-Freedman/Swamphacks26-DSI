import { useEffect, useState } from 'react'
import { reset } from './notebook'

// Demo reset (docs/demo-script.md, "Reset shortcut"): `?reset=1` on load, or Shift+R on Home,
// clears this browser's notebook and session answers and lands on Home. No dialog.

let justReset = false

/**
 * Handles `?reset=1` once: clears storage and replaces the URL with plain Home (the param and any
 * session/round with it). Called before the first render (main.tsx) so the app starts on Home.
 */
export function consumeResetParam(): boolean {
  if (new URLSearchParams(location.search).has('reset')) {
    reset()
    history.replaceState(null, '', location.pathname)
    justReset = true
  }
  return justReset
}

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

/**
 * Shift+R while `active` (Home / notebook) clears everything and calls `onReset`.
 * Returns true for a moment after a reset so the screen can say so.
 */
export function useReset(active: boolean, onReset: () => void): boolean {
  const [done, setDone] = useState(consumeResetParam)
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.key.toLowerCase() !== 'r' || typing(e.target)) return
      e.preventDefault()
      reset()
      setDone(true)
      onReset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onReset])
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => {
      justReset = false
      setDone(false)
    }, 4000)
    return () => {
      clearTimeout(t)
      justReset = false
    }
  }, [done])
  return done
}
