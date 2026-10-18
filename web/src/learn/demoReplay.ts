// Demo links for judging: open the site once with ?demo=1 and, for the rest of that tab, the scripted
// answers on the judging path get the real model's reply recorded earlier (data/demo/<slug>.json, made by
// calling the live API with exactly these answers). Anything else, like a judge's own guess, still goes
// to the live API. ?demo=0 turns it off. A graded step takes 4-6 s live; this keeps a demo under 2 minutes.
import type { Result } from './types'

type Recording = { slug: string; recorded: string; responses: Record<string, unknown> }

const files = import.meta.glob<{ default: Recording }>('../../../data/demo/*.json', { eager: true })
const BY_SLUG: Record<string, Recording['responses']> = Object.fromEntries(
  Object.values(files).map((m) => [m.default.slug, m.default.responses]),
)

const KEY = 'onionskin-demo'
/** A short pause so the "checking" state still shows. */
export const REPLAY_MS = 600

/** On for this tab once the URL has had ?demo=1; off again with ?demo=0. */
export function demoOn(search: string = typeof location === 'undefined' ? '' : location.search): boolean {
  try {
    const q = new URLSearchParams(search).get('demo')
    if (q === '1') sessionStorage.setItem(KEY, '1')
    if (q === '0') sessionStorage.removeItem(KEY)
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return new URLSearchParams(search).get('demo') === '1'
  }
}

// Latch as soon as the app loads, so ?demo=1 on Home still holds after the URL moves to ?learn=…
demoOn()

export const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '')

/** The lookup key for a graded call, or null when that call is never replayed (draw sends a picture). */
export function replayKey(name: string, body: Record<string, unknown>): string | null {
  const s = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '')
  switch (name) {
    case 'guess':
      return `guess|${norm(s('text'))}`
    case 'anchor':
      // the screen puts the pencil value in front ("At day of the year 172 I predict about 74°. …"); match the words
      return `anchor|${norm(s('answer').replace(/^At .*? I predict about [^.]*\.\s*/, ''))}`
    case 'stress':
      return `stress|${norm(s('fix'))}|${body.caseIndex}`
    case 'neighbor':
      return `neighbor|${s('key')}|${norm(s('answer'))}`
    case 'transfer':
      return `transfer|${norm(s('analogy'))}|${body.wasPushed === true}`
    default:
      return null
  }
}

/** The recorded reply for this call, if demo mode is on and this exact answer was recorded. */
export async function demoReplay<T>(slug: string, name: string, body: unknown, wait = REPLAY_MS): Promise<Result<T> | null> {
  if (!demoOn() || !body || typeof body !== 'object') return null
  const key = replayKey(name, body as Record<string, unknown>)
  const hit = key ? BY_SLUG[slug]?.[key] : undefined
  if (hit === undefined) return null
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  return hit as Result<T>
}
