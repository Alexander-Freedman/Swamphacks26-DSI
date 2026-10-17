import { apiBase } from '../extras'
import { hintFor } from './helpHints'

// POST /api/help (shared/schema/README.md "Help chat"). The server holds the key, the limits and
// the truth; the browser only sends where the learner is. Anything that fails → the static hint.

export const MAX_QUESTION = 300
// The server tries two models with a 12 s timeout each.
export const HELP_TIMEOUT_MS = 26_000

export type HelpAsk = {
  slug: string
  kind: 'session' | 'round'
  screen: string
  locked: boolean
  guess?: number | string | null
  question: string
}

export type HelpReply = { answer: string; hintOnly: boolean; fallback: boolean }

export const BUSY_LINE = 'Lots of questions at once! Give the screen a minute: '
export const OFFLINE_LINE = "Help can't answer right now, but the screen has what you need: "

export function helpBody(a: HelpAsk) {
  const guess = typeof a.guess === 'number' ? a.guess : typeof a.guess === 'string' && a.guess.trim() ? a.guess.trim().slice(0, 40) : undefined
  return {
    [a.kind === 'session' ? 'session_slug' : 'round_slug']: a.slug,
    screen_id: a.screen,
    question: a.question.trim().slice(0, MAX_QUESTION),
    locked: a.locked,
    context: guess === undefined ? {} : { guess },
  }
}

export async function askHelp(a: HelpAsk, timeoutMs = HELP_TIMEOUT_MS): Promise<HelpReply> {
  const hint = hintFor(a.screen)
  const api = apiBase()
  if (api === null) return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${api}/api/help`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(helpBody(a)),
      signal: ctrl.signal,
    })
    if (res.status === 429) return { answer: BUSY_LINE + hint, hintOnly: true, fallback: true }
    if (!res.ok) return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
    const body = (await res.json()) as { answer?: unknown; hint_only?: unknown }
    const answer = typeof body.answer === 'string' ? body.answer.trim() : ''
    if (!answer) return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
    return { answer, hintOnly: body.hint_only !== false, fallback: false }
  } catch {
    return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
  } finally {
    clearTimeout(timer)
  }
}
