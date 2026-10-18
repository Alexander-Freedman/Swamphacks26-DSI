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
  /** The mistake a missed rematch points to, if it maps to one (#162). */
  rematchMisconception?: string | null
  /** Rounds (#172): the mistake's label and the round's topic, saved with the entry since extra rounds aren't bundled. */
  label?: string
  topic?: string
  /** Rounds (#172): one id per play, so a round that caught two mistakes still counts as one play. */
  play?: string
  /** 'round' for the round player (its card links to ?round=); sessions leave it out. */
  kind?: 'round'
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
  /**
   * The latest try at this mistake, so the card can show it (#176): the catching session's own rematch
   * ('rematch-right' doesn't count toward busting, 'rematch-missed'), or a later session ('right' counts, 'missed').
   */
  last: 'rematch-right' | 'rematch-missed' | 'right' | 'missed' | null
  lastSeen: string
  /** Where "try it again" goes: the session, or the round (#172). */
  href: string
}

// Session-only misconceptions that aren't in a round JSON.
const EXTRA_LABELS: Record<string, string> = {
  'too-few': 'A handful of people is enough',
  // calculus, Calc 3 (sessions/calculus/Surface.tsx)
  'partial-wrong-way': 'Walking a slice the wrong way',
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
  'sn1-attack-first': 'Water attacks before Br leaves',
  'e1-base-first': 'H pulled before Br leaves',
  'e1-base-hits-carbon': 'Water bonds to the C⁺',
  'e2-base-hits-carbon': 'Base attacks the carbon',
  'e2-not-anti': 'Not the H across from Br',
  'ch-bond-lost': 'The C–H electrons go nowhere',
  // statistics (sessions/statistics/clt.ts CLT_MISTAKES)
  'averages-keep-shape': 'Averages keep the original shape',
  'averages-flat': 'Every average is equally likely',
  'bigger-sample-wider': 'Bigger samples spread out more',
  // physics (sessions/physics/projectile.ts PROJ_MISTAKES)
  'sideways-falls-slower': 'Moving sideways slows the fall',
  'zero-speed-at-top': 'A ball stops at the top of its arc',
  'steeper-goes-farther': 'Aiming higher always goes farther',
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

/**
 * Saves an entry, replacing the one with the same session + `at` if it's there (#159):
 * sessions save at the card, then the rematch updates that same entry instead of adding a second one.
 */
export function upsert(entry: Entry & Record<string, unknown>): void {
  try {
    const s = store()
    if (!s) return
    const all = entries()
    const i = all.findLastIndex((e) => e.session === entry.session && e.at === entry.at)
    if (i >= 0) all[i] = entry
    else all.push(entry)
    s.setItem(KEY, JSON.stringify(all.slice(-MAX)))
  } catch {
    // blocked or full storage: the session still ends fine
  }
}

/**
 * The mistake an entry caught (#162): the first guess's, or else the one a missed rematch points to.
 * A called-it first guess with a missed rematch that maps to a mistake lands in the notebook too,
 * so the end bar's "it's in your notebook" is true.
 */
export function caughtId(e: Entry): string | null {
  if (e.misconception) return e.misconception
  return e.rematch === 'wrong' ? (e.rematchMisconception ?? null) : null
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

/** How many plays the notebook has seen: entries sharing a `play` id are one play (#172). */
export function plays(list: Entry[] = entries()): number {
  return new Set(list.map((e) => e.play ?? `${e.session}\u0000${e.at}`)).size
}

/** `saved`: the label stored with a round entry, for rounds that aren't bundled (#172). */
export function labelFor(session: string, id: string, saved?: string): string {
  const own = showcaseRound(session)?.misconceptions.find((m) => m.id === id)
  if (own) return own.label
  if (saved) return saved
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
    const id = caughtId(e)
    const right = !id || e.rematch === 'right'
    for (const c of cards.values()) {
      if (c.session !== e.session || c.id === id) continue
      c.last = right ? 'right' : 'missed'
      c.lastSeen = e.at
      if (right) c.wins += 1
    }
    const own = e.rematch === 'right' ? 'rematch-right' : e.rematch === 'wrong' ? 'rematch-missed' : null
    if (!id) continue
    const key = `${e.session}\u0000${id}`
    const c = cards.get(key)
    if (c) {
      c.caught += 1
      c.wins = 0
      c.last = own
      c.lastSeen = e.at
    } else {
      cards.set(key, {
        session: e.session,
        id,
        label: labelFor(e.session, id, e.label),
        topic: e.topic ?? topicFor(e.session),
        status: 'caught',
        caught: 1,
        wins: 0,
        last: own,
        lastSeen: e.at,
        href: `${import.meta.env.BASE_URL}?${e.kind === 'round' ? 'round' : 'session'}=${encodeURIComponent(e.session)}`,
      })
    }
  }
  for (const c of cards.values()) c.status = c.wins >= BUST_AFTER ? 'busted' : 'caught'
  return [...cards.values()]
}
