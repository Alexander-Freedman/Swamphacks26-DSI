import { entries, KEY, type Entry } from '../../notebook'

// One notebook entry per play (#159): saved when the mistake card shows, so skipping the rematch
// still leaves the mistake in the notebook; the rematch pick then rewrites that same entry.
// Same shape as the shared upsert in #168; switch to useNotebookEntry once that's on main.

/** Writes `e`, replacing the entry with the same session + `at` if there is one. */
export function upsert(e: Entry & Record<string, unknown>): void {
  try {
    const s = globalThis.localStorage
    if (!s) return
    const all: (Entry & Record<string, unknown>)[] = entries()
    let i = -1
    for (let k = all.length - 1; k >= 0; k--) if (all[k].session === e.session && all[k].at === e.at) { i = k; break }
    if (i >= 0) all[i] = e
    else all.push(e)
    s.setItem(KEY, JSON.stringify(all.slice(-200)))
  } catch {
    // blocked or full storage: the session still ends fine
  }
}
