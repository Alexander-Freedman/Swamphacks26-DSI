// Learn answers go to the answers hypertable on Tiger Data (POST /api/learn-events): which known
// misconception a first guess matched, and which prediction was picked on each stress card. The reply
// is how everyone answered that step, read from the room_hourly continuous aggregate. Fire and forget:
// no backend, an error or a slow reply just means no "how others answered" line.
import { apiBase } from '../extras'

export type Room = { n: number; shares: Record<string, number> }

export type LearnEvent =
  | { slug: string; step: 'guess'; misconceptionId: string | null }
  | { slug: string; step: 'stress'; caseIndex: number; choice: number }

const KEY = 'onionskin-sid'
const TIMEOUT_MS = 4000

/** An anonymous id for this browser, so each step counts once per learner. */
export function sessionId(): string {
  try {
    let s = localStorage.getItem(KEY)
    if (!s) {
      s = `s${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`
      localStorage.setItem(KEY, s)
    }
    return s
  } catch {
    return `s${Math.random().toString(36).slice(2).padEnd(12, '0')}`
  }
}

export async function recordLearnEvent(e: LearnEvent): Promise<Room | null> {
  const base = apiBase()
  if (base === null || import.meta.env.VITE_LEARN_MOCK === '1') return null
  const body =
    e.step === 'guess'
      ? { session_id: sessionId(), slug: e.slug, step: 'guess', misconception_id: e.misconceptionId }
      : { session_id: sessionId(), slug: e.slug, step: 'stress', case_index: e.caseIndex, choice: e.choice }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${base}/api/learn-events`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const room = ((await res.json()) as { room?: Room }).room
    return room && typeof room.n === 'number' ? room : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** "62% of 13 learners predicted this right", or null when there's nothing worth saying. */
export function roomLine(room: Room | null | undefined): string | null {
  if (!room || room.n < 1) return null
  if (room.n === 1) return 'You’re the first learner to answer this one.'
  const pct = Math.round((room.shares.correct ?? 0) * 100)
  return `${pct}% of ${room.n} learners predicted this right.`
}
