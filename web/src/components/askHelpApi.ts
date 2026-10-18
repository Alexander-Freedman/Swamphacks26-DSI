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

export type HelpTurn = { role: 'user' | 'assistant'; text: string }

/** The generic ask (#243): any subject, about one layer. */
export type LayerAsk = {
  subject: string
  topic: string
  layerN: number
  title: string
  onScreen: string
  facts: string[]
  lastAction?: string
  history: HelpTurn[]
  question: string
  hint: string
}

const cut = (s: string, n: number) => s.trim().slice(0, n)

export function layerBody(a: LayerAsk) {
  return {
    subject: cut(a.subject, 80),
    topic: cut(a.topic, 120),
    layer: { n: a.layerN, title: cut(a.title, 120) },
    on_screen: cut(a.onScreen, 600),
    facts: a.facts.slice(0, 12).map((f) => cut(f, 200)),
    last_action: a.lastAction ? cut(a.lastAction, 200) : null,
    history: a.history.slice(-4).map((t) => ({ role: t.role, text: cut(t.text, 600) })),
    question: cut(a.question, MAX_QUESTION),
    hint: cut(a.hint, 600),
  }
}

async function post(body: unknown, hint: string, timeoutMs: number): Promise<HelpReply> {
  const api = apiBase()
  if (api === null) return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${api}/api/help`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (res.status === 429) return { answer: BUSY_LINE + hint, hintOnly: true, fallback: true }
    if (!res.ok) return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
    const got = (await res.json()) as { answer?: unknown; hint_only?: unknown; source?: unknown }
    const answer = typeof got.answer === 'string' ? got.answer.trim() : ''
    if (!answer) return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
    return { answer, hintOnly: got.hint_only !== false, fallback: got.source === 'static' }
  } catch {
    return { answer: OFFLINE_LINE + hint, hintOnly: true, fallback: true }
  } finally {
    clearTimeout(timer)
  }
}

/** The 3 probability sessions and the round player: session_slug/round_slug + screen_id. */
export function askHelp(a: HelpAsk, timeoutMs = HELP_TIMEOUT_MS): Promise<HelpReply> {
  return post(helpBody(a), hintFor(a.screen), timeoutMs)
}

/** Every other screen: the layer's own words and facts. */
export function askLayer(a: LayerAsk, timeoutMs = HELP_TIMEOUT_MS): Promise<HelpReply> {
  return post(layerBody(a), a.hint, timeoutMs)
}
