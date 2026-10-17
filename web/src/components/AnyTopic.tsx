import { useEffect, useId, useState, type FormEvent } from 'react'
import { apiBase, generateRound, loadExtraIndex, matchTopic, type ExtraTopic } from '../extras'
import { showcaseRound } from '../rounds'
import './AnyTopic.css'

const FIRST_CHIPS = 4

type Status =
  | { kind: 'idle' }
  | { kind: 'building'; topic: string }
  | { kind: 'fallback'; topic: string; why: 'offline' | 'failed'; suggestions: string[] }

// Under the session cards on Home: a small, secondary box. Chips open reviewed extra rounds;
// typed text opens a cached match, or (only with a backend) asks POST /api/rounds to build one.
export function AnyTopic({ onOpen, timeoutMs }: { onOpen: (slug: string) => void; timeoutMs?: number }) {
  const [extras, setExtras] = useState<ExtraTopic[]>([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [all, setAll] = useState(false)
  const id = useId()

  useEffect(() => {
    let live = true
    loadExtraIndex().then((list) => {
      if (live) setExtras(list)
    })
    return () => {
      live = false
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const topic = text.trim()
    if (!topic || status.kind === 'building') return
    const hit = matchTopic(topic, extras)
    if (hit) return onOpen(hit)
    if (apiBase() === null) return setStatus({ kind: 'fallback', topic, why: 'offline', suggestions: [] })
    setStatus({ kind: 'building', topic })
    const res = await generateRound(topic, timeoutMs)
    if (res.status === 'ok') {
      setStatus({ kind: 'idle' })
      return onOpen(res.slug)
    }
    setStatus({ kind: 'fallback', topic, why: 'failed', suggestions: res.suggestions })
  }

  const topicName = (slug: string) => extras.find((x) => x.slug === slug)?.topic ?? showcaseRound(slug)?.topic
  const suggested = status.kind === 'fallback' ? status.suggestions.filter((s) => topicName(s)) : []
  const chips = [...suggested, ...extras.map((x) => x.slug).filter((s) => !suggested.includes(s))]
  // Keep the box small next to the session cards: a few chips until asked (or after a miss).
  const open = all || status.kind === 'fallback'
  const shown = open ? chips : chips.slice(0, FIRST_CHIPS)

  return (
    <section className="anytopic" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="anytopic-title">
        Try any topic <span className="anytopic-tag">auto-checked</span>
      </h2>
      <form className="anytopic-form" onSubmit={submit}>
        <label htmlFor={`${id}-in`} className="sr-only">
          A topic you want to test your gut on
        </label>
        <input
          id={`${id}-in`}
          type="text"
          value={text}
          maxLength={80}
          autoComplete="off"
          placeholder="e.g. Monty Hall, compound interest"
          disabled={status.kind === 'building'}
          onChange={(e) => {
            setText(e.target.value)
            if (status.kind === 'fallback') setStatus({ kind: 'idle' })
          }}
        />
        <button type="submit" disabled={!text.trim() || status.kind === 'building'}>
          Go
        </button>
      </form>
      <p className="anytopic-status" aria-live="polite">
        {status.kind === 'idle' && chips.length > 0 && <>Ready now, each one checked by hand:</>}
        {status.kind === 'building' && <>Building your round on “{status.topic}”… code checks every answer it can.</>}
        {status.kind === 'fallback' && status.why === 'offline' && (
          <>No round on “{status.topic}” yet on this site. Pick one of these, each one checked by hand:</>
        )}
        {status.kind === 'fallback' && status.why === 'failed' && (
          <>Couldn't build “{status.topic}” right now. Try one of these instead:</>
        )}
      </p>
      {chips.length > 0 && (
        <div className="anytopic-chips" role="group" aria-label="Reviewed topics">
          {shown.map((slug) => (
            <button key={slug} type="button" className={`anytopic-chip ${suggested.includes(slug) ? 'suggested' : ''}`} onClick={() => onOpen(slug)}>
              {topicName(slug)}
            </button>
          ))}
          {shown.length < chips.length && (
            <button type="button" className="anytopic-chip more" aria-expanded={false} onClick={() => setAll(true)}>
              +{chips.length - shown.length} more
            </button>
          )}
        </div>
      )}
    </section>
  )
}
