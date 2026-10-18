// Demo mode. On the static site (no AI server, which is retired) it is always on. On a build with a
// server it is for recording: open with ?demo=1 (it stays on for the tab; ?demo=0 turns it off). Then:
//  - Shift+W fills the current step's empty answer boxes with the demo script (script.json).
//  - A scripted answer gets its reply at once: the real reply the live AI gave to that exact answer,
//    saved ahead of time (replies.json, from demo-video/recapture.py). Anything off-script still goes
//    to the live AI as usual.
import { apiBase } from '../extras'
import replies from './replies.json'
import script from './script.json'

const KEY = 'onionskin-demo'
type Saved = { request: Record<string, unknown>; reply: unknown }
const REPLIES = replies as Record<string, Saved | { answer: string; hint_only?: boolean }>
const SCRIPT = script as unknown as Record<string, Record<string, string>> & { home: string }

/** No AI server in this build: the recorded replies are the only AI there is. */
export const isStatic = () => apiBase() === null

/** The tag on an answer checked without the AI. */
export const checkLabel = () => (isStatic() ? 'quick keyword check, no AI' : 'offline check')
/** The line under a step that was checked against the topic's notes instead of the AI. */
export const notesLine = () =>
  isStatic() ? 'Quick keyword check against our notes, not AI feedback.' : "Checked against the topic's notes (the live checker is busy or offline)."

/** This topic has a demo script (and recorded replies for it). */
export const hasScript = (slug: string) => slug !== 'home' && !!SCRIPT[slug]

export function demoOn(): boolean {
  if (isStatic()) return true
  try {
    const p = new URLSearchParams(location.search).get('demo')
    if (p !== null) sessionStorage.setItem(KEY, p === '0' ? '0' : '1')
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// The answer text each step sends, to check the request is the scripted one.
const TEXT: Record<string, string> = { guess: 'text', anchor: 'answer', why: 'answer', draw: 'rule', neighbor: 'answer', transfer: 'analogy' }
const norm = (s: unknown) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

/** The saved reply for a scripted request, or null (then the live AI answers). */
export function demoReply<T>(slug: string, step: string, body: unknown): Promise<T> | null {
  if (!demoOn()) return null
  const b = (body ?? {}) as Record<string, unknown>
  const key = step === 'stress' ? `${slug}/stress/${b.caseIndex}` : `${slug}/${step}`
  const saved = REPLIES[key] as Saved | undefined
  if (!saved || !('reply' in saved)) return null
  const field = TEXT[step]
  if (field && norm(b[field]) !== norm(saved.request[field])) return null
  return new Promise((ok) => setTimeout(() => ok(saved.reply as T), 350))
}

/** Ask Onion's saved answer for a scripted question on this topic, or null. */
export function demoHelp(topic: string, question: string): { answer: string; hintOnly: boolean; fallback: boolean } | null {
  if (!demoOn()) return null
  const saved = REPLIES[`help/${topic}/${question}`] as { answer?: string; hint_only?: boolean } | undefined
  if (!saved?.answer) return null
  return { answer: saved.answer, hintOnly: saved.hint_only !== false, fallback: false }
}

/** Which script line a box takes: its aria-label, or the draw/neighbor/transfer boxes by place. */
function boxKey(el: HTMLInputElement | HTMLTextAreaElement): string | null {
  if (el.id === 'ldf-neighbor') return 'neighbor answer'
  if (el.id === 'ldf-transfer') return 'transfer answer'
  const field = el.closest('.dr-field')
  if (field) return [...document.querySelectorAll('.learn-card.is-now .dr-field')].indexOf(field) === 0 ? 'draw rule' : 'draw notes'
  return el.getAttribute('aria-label')
}

/** Set a React-controlled box's value the way typing does, so the app sees the change. */
function put(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, text)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

export function fillStep(): number {
  const card = document.querySelector('.learn-card.is-now')
  if (!card) {
    const home = document.querySelector<HTMLInputElement>('input[aria-label="topic to learn"]')
    if (home && !home.value) {
      put(home, SCRIPT.home)
      home.focus()
      return 1
    }
    return 0
  }
  const slug = new URLSearchParams(location.search).get('learn') ?? ''
  const lines = SCRIPT[slug]
  if (!lines) return 0
  let last: HTMLInputElement | HTMLTextAreaElement | null = null
  let n = 0
  for (const el of card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('textarea, input[type="text"], input:not([type])')) {
    const key = boxKey(el)
    const text = key ? lines[key] : undefined
    if (!text || el.value.trim() || el.readOnly || el.disabled) continue
    put(el, text)
    last = el
    n++
  }
  last?.focus()
  return n
}

/** Shift+W: fill this step from the script (demo mode only, so a capital W types normally otherwise). */
export function installDemoKeys() {
  if (!demoOn()) return
  addEventListener(
    'keydown',
    (e) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || e.code !== 'KeyW') return
      e.preventDefault()
      e.stopPropagation()
      fillStep()
    },
    true,
  )
}
