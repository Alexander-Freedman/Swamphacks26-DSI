import { showcaseRound } from './rounds'

// The notebook: every session's end result, kept in this browser only.
// Storage can be blocked (private mode, quotas, embedded frames): every access
// is wrapped so a broken store reads as empty and writes are silently dropped.

/** Same key the birthday session wrote before this module existed, so old entries still count. */
export const KEY = 'mm.sessions'
const MAX = 200
/** Right answers after a catch that it takes to bust a mistake (docs/experience.md, "Coming back"). */
export const BUST_AFTER = 2

/** `?notebook=1` is the notebook screen (url.ts); sessions link to it from their end card. */
export const NOTEBOOK_HREF = `${import.meta.env.BASE_URL}?notebook=1`

export type Entry = {
  session: string
  at: string
  guess: number | string
  confidence?: string
  misconception: string | null
  rematch: 'right' | 'wrong' | null
}

export type Card = {
  session: string
  id: string
  label: string
  topic: string
  status: 'caught' | 'busted'
  /** times this mistake was caught */
  caught: number
  /** right answers since the last catch */
  wins: number
  lastSeen: string
}

// Session-only misconceptions that aren't in a round JSON.
const EXTRA_LABELS: Record<string, string> = {
  'too-few': 'A handful of people is enough',
  // orgo (sessions/orgo/chem.ts MISTAKES)
  'carbon-five-bonds': 'A carbon with 5 bonds',
  'hydrogen-two-bonds': 'Hydrogen with 2 bonds',
  'oxygen-three-bonds': 'Oxygen with 3 bonds, no charge',
  'missing-hydrogens': 'Missing hydrogens',
  'same-formula-different-molecule': 'Same formula, different molecule',
  'arrow-from-electrophile': 'Arrow starts at the carbon',
  'arrow-backwards': 'Arrow from Br toward C (backwards)',
  'front-side-attack': 'Front-side attack',
  'leaving-bond-stays': 'The C–Br bond never breaks',
  'cyanide-nitrogen': 'Nitrogen as cyanide’s attacker',
  'wrong-carbon': 'Cyanide’s carbon as the target',
  'charged-nu-weak': 'A charged nucleophile called weak',
  'carbon-miscounted': 'Miscounting the carbon type',
  'bromide-poor-leaving': 'Bromide called a poor leaving group',
  'sn1-on-methyl': 'SN1 on a methyl carbon',
  'elimination-no-neighbor': 'Elimination with no neighbor carbon',
}

function store(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function valid(e: unknown): e is Entry {
  if (!e || typeof e !== 'object') return false
  const x = e as Record<string, unknown>
  return typeof x.session === 'string' && typeof x.at === 'string' && (x.misconception == null || typeof x.misconception === 'string')
}

export function entries(): Entry[] {
  try {
    const raw = store()?.getItem(KEY)
    const all: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(all)) return []
    return all.filter(valid).map((e) => ({ ...e, misconception: e.misconception ?? null, rematch: e.rematch ?? null }))
  } catch {
    return []
  }
}

/** Sessions may add their own extra fields (e.g. coin's switch rate); the notebook ignores them. */
export function record(entry: Entry & Record<string, unknown>): void {
  try {
    const s = store()
    if (!s) return
    s.setItem(KEY, JSON.stringify([...entries(), entry].slice(-MAX)))
  } catch {
    // blocked or full storage: the session still ends fine
  }
}

/** Clears the notebook and any other answers this app keeps (every `mm.` key). */
export function reset(): void {
  try {
    const s = store()
    if (!s) return
    const keys: string[] = []
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i)
      if (k && k.startsWith('mm.')) keys.push(k)
    }
    for (const k of keys) s.removeItem(k)
  } catch {
    // nothing to clear if storage is blocked
  }
}

export function labelFor(session: string, id: string): string {
  const own = showcaseRound(session)?.misconceptions.find((m) => m.id === id)
  if (own) return own.label
  if (EXTRA_LABELS[id]) return EXTRA_LABELS[id]
  const words = id.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function topicFor(session: string): string {
  return showcaseRound(session)?.topic ?? session.replace(/[-_]+/g, ' ')
}

/**
 * One card per mistake (session + misconception id), oldest catch first.
 * Each later session of the same slug is at most one right answer: right if its guess had no mistake
 * or its rematch was right. The session that caught a mistake never counts toward busting it
 * (its own rematch included). Two right answers since the last catch bust it; getting caught again
 * puts it back to pencil.
 */
export function notebook(list: Entry[] = entries()): Card[] {
  const cards = new Map<string, Card>()
  const sorted = [...list].sort((a, b) => a.at.localeCompare(b.at))
  for (const e of sorted) {
    const right = !e.misconception || e.rematch === 'right'
    for (const c of cards.values()) {
      if (c.session !== e.session || c.id === e.misconception || !right) continue
      c.wins += 1
      c.lastSeen = e.at
    }
    if (!e.misconception) continue
    const key = `${e.session}\u0000${e.misconception}`
    const c = cards.get(key)
    if (c) {
      c.caught += 1
      c.wins = 0
      c.lastSeen = e.at
    } else {
      cards.set(key, {
        session: e.session,
        id: e.misconception,
        label: labelFor(e.session, e.misconception),
        topic: topicFor(e.session),
        status: 'caught',
        caught: 1,
        wins: 0,
        lastSeen: e.at,
      })
    }
  }
  for (const c of cards.values()) c.status = c.wins >= BUST_AFTER ? 'busted' : 'caught'
  return [...cards.values()]
}
