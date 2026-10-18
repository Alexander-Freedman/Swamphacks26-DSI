import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { apiBase } from '../extras'
import { askHelp, askLayer, MAX_QUESTION, type HelpTurn } from './askHelpApi'
import { HELP_TOPICS, startersFor } from './helpHints'
import { layerFor, PRIVACY_LINE } from './askLayer'
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
 * "Stuck? Ask" button + panel beside How it works (#186). Sessions report their screen through the shell
 * (session/helpSpot); the round player passes `spot`. On every session screen (#243): a screen that
 * reports a LayerHelp (or any session but the 3 probability ones) uses the generic request; the
 * round player stays hidden without a backend or for a topic the help API doesn't know.
 */
/** A small onion: layered rings and a sprout, drawn in ink so it matches the pencil-and-ink look. */
function OnionIcon() {
  return (
    <svg className="ask-onion" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M16 3c-1 2.5-1.2 4.3-.6 6.3M16 3c1.6 2 2.4 3.9 2.1 6.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 9c-6.5 1.8-11 7.4-9.6 13.2C7.6 27 11.4 29.5 16 29.5s8.4-2.5 9.6-7.3C27 16.4 22.5 10.8 16 9Z" fill="var(--marker)" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 9.6c-3.6 2.6-5.6 6.9-5 11.6.4 3.6 2.2 6.6 5 8.2M16 9.6c3.6 2.6 5.6 6.9 5 11.6-.4 3.6-2.2 6.6-5 8.2M16 9.6v19.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

/** `docked`: open as a full-height panel on the right that the page makes room for (Learn pages). */
export function AskHelp({
  slug,
  kind,
  spot: given,
  subject = '',
  docked = false,
}: {
  slug: string
  kind: 'session' | 'round'
  spot?: HelpSpot | null
  subject?: string
  docked?: boolean
}) {
  const reported = useHelpSpot()
  const topic = HELP_TOPICS[slug]
  const [open, setOpen] = useState(false)
  // Docked: tell the page to make room on the right while the panel is open.
  useEffect(() => {
    if (!docked) return
    document.body.classList.toggle('onion-docked', open)
    return () => document.body.classList.remove('onion-docked')
  }, [docked, open])

  const [text, setText] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const button = useRef<HTMLButtonElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const spot = given !== undefined ? given : reported
  // sessions always get the panel (the static hint covers no backend); rounds need the help API
  const enabled = kind === 'session' || (apiBase() !== null && !!topic)
  const generic = kind === 'session' && (!!spot?.layer || !topic)
  const layer = generic && open ? layerFor(spot, subject) : null
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
    const history: HelpTurn[] = turns.flatMap((t) => (t.a ? [{ role: 'user' as const, text: t.q }, { role: 'assistant' as const, text: t.a }] : [])).slice(-KEEP)
    const l = generic ? layerFor(spot, subject) : null
    const reply = l
      ? await askLayer({ subject: l.subject, topic: l.topic, layerN: l.layerN, title: l.title, onScreen: l.onScreen, facts: l.facts, lastAction: l.lastAction, history, question, hint: l.hint })
      : await askHelp({ slug, kind, screen, locked, guess: known ? spot?.guess : null, question })
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

  const where = layer ? layer.title : spot?.label && spot.step && spot.total ? `${spot.label} · ${spot.step} of ${spot.total}` : 'this screen'

  return (
    <>
      <button ref={button} className="hiw-btn ask-btn" title="Ask Onion" onClick={() => (open ? close() : setOpen(true))} aria-keyshortcuts="?" aria-expanded={open} aria-controls={open ? `${titleId}-panel` : undefined}>
        <OnionIcon />
        <span className="ask-label">Ask Onion</span>
      </button>
      {open && (
        <div className={`ask-panel${docked ? ' ask-docked' : ''}`} id={`${titleId}-panel`} role="dialog" aria-modal="false" aria-labelledby={titleId} ref={panel}>
          <header className="ask-head">
            <h2 id={titleId}>Ask Onion</h2>
            <button className="hiw-close" onClick={close} aria-label="Close Ask Onion">
              Close <kbd>Esc</kbd>
            </button>
          </header>
          <p className="ask-where">
            About <b>{where}</b>.{layer ? '' : locked ? ' Your guess is in, so I can explain the real answer.' : ' Before you check your guess, you get hints, not the answer.'}
          </p>
          <div className="ask-log" aria-live="polite">
            {turns.length === 0 && (
              <div className="ask-starters" role="group" aria-label="starter questions">
                {(layer ? layer.suggested : startersFor(known ? screen : undefined, locked)).map((q) => (
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
              placeholder="Ask Onion what's confusing here"
              onChange={(e) => setText(e.target.value.slice(0, MAX_QUESTION))}
              onKeyDown={onBoxKey}
            />
            <div className="ask-row">
              {/* only near the limit: a bare 0/300 reads like a lesson score */}
              <span id={`${titleId}-count`} className={'ask-count' + (text.length >= MAX_QUESTION ? ' full' : '')}>
                {text.length > MAX_QUESTION - 50 ? `${MAX_QUESTION - text.length} characters left` : ''}
              </span>
              <button type="submit" className="ask-send" disabled={busy || !text.trim()}>{busy ? 'Onion is thinking…' : 'Send'}</button>
            </div>
          </form>
          <p className="ask-privacy">{PRIVACY_LINE}</p>
        </div>
      )}
    </>
  )
}
