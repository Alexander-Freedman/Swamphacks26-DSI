import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { apiBase } from '../extras'
import { askHelp, MAX_QUESTION } from './askHelpApi'
import { HELP_TOPICS, startersFor } from './helpHints'
import { useHelpSpot, type HelpSpot } from './session/helpSpot'
import './AskHelp.css'

type Turn = { q: string; a?: string; hint?: boolean }
const KEEP = 4 // turns shown

/** Typing in a text field: the ? key is just a character there. */
function typing(el: Element | null): boolean {
  const e = el as HTMLElement | null
  if (!e) return false
  return e.isContentEditable || e.tagName === 'TEXTAREA' || (e.tagName === 'INPUT' && !/^(range|radio|checkbox|button)$/.test((e as HTMLInputElement).type))
}

/**
 * "Ask" button + panel beside How it works (#186). Sessions report their screen through the shell
 * (session/helpSpot); the round player passes `spot`. Hidden without a backend or for a topic
 * the help API doesn't know.
 */
export function AskHelp({ slug, kind, spot: given }: { slug: string; kind: 'session' | 'round'; spot?: HelpSpot | null }) {
  const reported = useHelpSpot()
  const topic = HELP_TOPICS[slug]
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const button = useRef<HTMLButtonElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const enabled = apiBase() !== null && !!topic

  const spot = given !== undefined ? given : reported
  // Unknown step: the session's guess screen, as not locked, so the server only ever hints.
  const known = !!spot?.screen && spot.screen.startsWith(topic?.prefix ?? '?')
  const screen = known ? spot!.screen! : topic?.guessScreen ?? ''
  const locked = known ? !!spot!.locked : false

  const close = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => button.current?.focus())
  }, [])

  // ? opens/closes (not while typing); Esc closes unless a modal drawer is on top.
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !document.querySelector('[aria-modal="true"]')) {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e.target as Element)) return
      e.preventDefault()
      if (open) close()
      else setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, open, close])

  useEffect(() => {
    if (open) box.current?.focus()
  }, [open])

  // Newest turn in view.
  useEffect(() => {
    const log = panel.current?.querySelector('.ask-log')
    if (log) log.scrollTop = log.scrollHeight
  }, [turns, busy])

  if (!enabled) return null

  const send = async (raw: string) => {
    const question = raw.trim().slice(0, MAX_QUESTION)
    if (!question || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setText('')
    setTurns((t) => [...t, { q: question }].slice(-KEEP))
    const reply = await askHelp({ slug, kind, screen, locked, guess: known ? spot?.guess : null, question })
    setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: reply.answer, hint: reply.hintOnly } : x)))
    inFlight.current = false
    setBusy(false)
    box.current?.focus()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void send(text)
  }
  const onBoxKey = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(text)
    }
  }

  const where = spot?.label && spot.step && spot.total ? `${spot.label} · ${spot.step} of ${spot.total}` : 'this screen'

  return (
    <>
      <button ref={button} className="hiw-btn ask-btn" onClick={() => (open ? close() : setOpen(true))} aria-expanded={open} aria-controls={open ? `${titleId}-panel` : undefined}>
        Ask <kbd aria-hidden="true">?</kbd>
      </button>
      {open && (
        <div className="ask-panel" id={`${titleId}-panel`} role="dialog" aria-modal="false" aria-labelledby={titleId} ref={panel}>
          <header className="ask-head">
            <h2 id={titleId}>Stuck? Ask.</h2>
            <button className="hiw-close" onClick={close} aria-label="Close the ask panel">
              Close <kbd>Esc</kbd>
            </button>
          </header>
          <p className="ask-where">
            About <b>{where}</b>. {locked ? 'Your guess is in, so I can explain the real answer.' : 'Before you check your guess, you get hints, not the answer.'}
          </p>
          <div className="ask-log" aria-live="polite">
            {turns.length === 0 && (
              <div className="ask-starters" role="group" aria-label="starter questions">
                {startersFor(known ? screen : undefined, locked).map((q) => (
                  <button key={q} className="ask-starter" disabled={busy} onClick={() => void send(q)}>{q}</button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className="ask-turn">
                <p className="ask-q">{t.q}</p>
                {t.a ? (
                  <p className="ask-a">
                    {t.hint && <span className="ask-tag">hint</span>}
                    {t.a}
                  </p>
                ) : (
                  <p className="ask-a ask-typing" role="status">
                    <span className="ask-dots" aria-hidden="true"><i /><i /><i /></span>
                    thinking…
                  </p>
                )}
              </div>
            ))}
          </div>
          <form className="ask-form" onSubmit={submit}>
            <label className="ask-label" htmlFor={`${titleId}-q`}>Your question</label>
            <textarea
              id={`${titleId}-q`}
              ref={box}
              rows={2}
              maxLength={MAX_QUESTION}
              aria-describedby={`${titleId}-count`}
              value={text}
              placeholder="What's confusing here?"
              onChange={(e) => setText(e.target.value.slice(0, MAX_QUESTION))}
              onKeyDown={onBoxKey}
            />
            <div className="ask-row">
              <span id={`${titleId}-count`} className={'ask-count' + (text.length >= MAX_QUESTION ? ' full' : '')}>{text.length}/{MAX_QUESTION}</span>
              <button type="submit" className="ask-send" disabled={busy || !text.trim()}>{busy ? 'Asking…' : 'Send'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
