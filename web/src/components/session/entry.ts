import { useMemo, useRef } from 'react'
import { upsert, type Entry } from '../../notebook'

// One notebook entry per play (#159): saved when the card shows, so someone who never plays the
// rematch still finds the mistake in the notebook; the rematch then updates that same entry.
// Birthday can adopt it: `atCard(...)` when its card shows, `rematch(...)` on the pick.

/** Fields `extend` never touches: the ones the notebook's catch and bust rules read. */
const CORE = new Set(['session', 'at', 'guess', 'confidence', 'misconception', 'rematch', 'rematchMisconception'])

type Fields = Omit<Entry, 'session' | 'at' | 'rematch' | 'rematchMisconception'> & Record<string, unknown>

export function useNotebookEntry(session: string) {
  const saved = useRef<(Entry & Record<string, unknown>) | null>(null)
  return useMemo(
    () => ({
      /** Saves the first guess once per play; showing the card again (step dots) never adds a second entry. */
      atCard(fields: Fields) {
        if (saved.current) return
        saved.current = { ...fields, session, at: new Date().toISOString(), rematch: null }
        upsert(saved.current)
      },
      /** Writes the rematch onto the entry the card saved. A miss keeps the mistake it points to (#162). */
      rematch(result: 'right' | 'wrong', misconception: string | null, extra: Record<string, unknown> = {}) {
        if (!saved.current) return
        saved.current = { ...saved.current, ...extra, rematch: result, rematchMisconception: result === 'wrong' ? misconception : null }
        upsert(saved.current)
      },
      /** Adds extra fields (e.g. the compare step's answer) to the entry the card saved; core fields never change. */
      extend(fields: Record<string, unknown>) {
        if (!saved.current) return
        const extra = Object.fromEntries(Object.entries(fields).filter(([k]) => !CORE.has(k)))
        saved.current = { ...saved.current, ...extra }
        upsert(saved.current)
      },
      /** A new play (e.g. coin's "Tap a new row"): the next card saves a new entry. */
      reset() {
        saved.current = null
      },
    }),
    [session],
  )
}
