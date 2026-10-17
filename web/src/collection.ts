import type { Item, Round } from './types'

// Every wrong idea you've been signalled on. Local-first; API sync can come later.
export const KEY = 'mm.collection.v1'
export const WINS_TO_BUST = 2

export type Entry = {
  id: string
  label: string
  topic: string
  status: 'caught' | 'busted'
  signals: number
  wins: number
  first: number
  last: number
}

export type Collection = Record<string, Entry>

export function load(): Collection {
  try {
    const raw = localStorage.getItem(KEY)
    const c = raw ? JSON.parse(raw) : {}
    return c && typeof c === 'object' && !Array.isArray(c) ? c : {}
  } catch {
    return {}
  }
}

function save(c: Collection) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    // private mode or full: the collection just doesn't persist
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}

export type Change = { caught: string | null; busted: string[] }

// One locked answer. Wrong → that idea is caught (again). Right → every caught idea
// this item targets gets a win; WINS_TO_BUST wins on later items busts it.
export function record(round: Round, item: Item, misconceptionId: string | null, now = Date.now()): Change {
  const c = load()
  const change: Change = { caught: null, busted: [] }
  if (misconceptionId) {
    const m = round.misconceptions.find((x) => x.id === misconceptionId)
    const prev = c[misconceptionId]
    c[misconceptionId] = {
      id: misconceptionId,
      label: m?.label ?? prev?.label ?? misconceptionId,
      topic: round.topic,
      status: 'caught',
      signals: (prev?.signals ?? 0) + 1,
      wins: 0,
      first: prev?.first ?? now,
      last: now,
    }
    change.caught = misconceptionId
  } else {
    for (const id of item.targets ?? []) {
      const e = c[id]
      if (!e || e.status === 'busted') continue
      e.wins += 1
      e.last = now
      if (e.wins >= WINS_TO_BUST) {
        e.status = 'busted'
        change.busted.push(id)
      }
    }
  }
  save(c)
  return change
}

export function unbusted(c: Collection = load()): Entry[] {
  return Object.values(c).filter((e) => e.status === 'caught')
}
