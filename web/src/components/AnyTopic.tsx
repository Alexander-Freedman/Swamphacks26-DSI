import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { apiBase, clearBuild, loadExtraIndex, matchTopic, startBuild, useBuild, type ExtraTopic } from '../extras'
import { showcaseRound } from '../rounds'
import { sessionFor, sessions } from '../sessions/registry'
import './AnyTopic.css'

const FIRST_CHIPS = 4

// Under the session cards on Home: a small, secondary box. Chips open hand-checked extra rounds;
// typed text opens a cached match, or (only with a backend) asks POST /api/rounds to build one.
// A slug with a session opens the session (onSession) instead of its round (#167).
export function AnyTopic({
  onOpen,
  onSession,
  timeoutMs,
}: {
  onOpen: (slug: string) => void
  onSession?: (slug: string) => void
  timeoutMs?: number
}) {
  const [extras, setExtras] = useState<ExtraTopic[]>([])
  const [text, setText] = useState('')
  const [offline, setOffline] = useState<string | null>(null)
  const [all, setAll] = useState(false)
  const build = useBuild()
  // True while this box (still on screen) is waiting on a build it started: then open it directly.
  const waiting = useRef(false)
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  // Only a backend can build (and so auto-check) a round; on Pages every round is hand-checked.
  const canBuild = apiBase() !== null

  useEffect(() => {
    let live = true
    loadExtraIndex().then((list) => {
      if (live) setExtras(list)
    })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (build.kind === 'ready' && waiting.current) {
      waiting.current = false
      clearBuild()
      onOpen(build.slug)
    }
  }, [build, onOpen])

  const building = build.kind === 'building'
  const open = (slug: string) => (onSession && sessionFor(slug) ? onSession(slug) : onOpen(slug))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const topic = text.trim()
    if (!topic || building) return
    const hit = matchTopic(topic, extras)
    if (hit) return open(hit)
    if (apiBase() === null) return setOffline(topic)
    waiting.current = true
    // Go gets disabled while it builds, so keep focus in the (read-only) box, not on <body>.
    input.current?.focus()
    void startBuild(topic, timeoutMs)
  }

  const topicName = (slug: string) => extras.find((x) => x.slug === slug)?.topic ?? sessionFor(slug)?.title ?? showcaseRound(slug)?.topic
  const missed = offline !== null || build.kind === 'failed'
  const suggested = build.kind === 'failed' && offline === null ? build.suggestions.filter((s) => topicName(s)) : []
  // After a miss the three sessions come first (#167): they're the site's best-built rounds.
  const sessionChips = missed && onSession ? sessions.map((s) => s.slug) : []
  const chips = [
    ...sessionChips,
    ...suggested.filter((s) => !sessionChips.includes(s)),
    ...extras.map((x) => x.slug).filter((s) => !suggested.includes(s) && !sessionChips.includes(s)),
  ]
  // Keep the box small next to the session cards: a few chips until asked (or after a miss).
  const shown = all || missed ? chips : chips.slice(0, FIRST_CHIPS)

  return (
    <section className="anytopic" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="anytopic-title">
        Try any topic
        {canBuild && (
          <span className="anytopic-tag" title="New topics are built on the spot and checked by code before you see them">
            auto-checked
          </span>
        )}
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
          readOnly={building}
          aria-busy={building}
          ref={input}
          onChange={(e) => {
            setText(e.target.value)
            setOffline(null)
            clearBuild()
          }}
        />
        <button type="submit" disabled={!text.trim() || building}>
          Go
        </button>
      </form>
      <p className="anytopic-status" aria-live="polite">
        {offline !== null ? (
          <>No round on “{offline}” yet on this site. Pick one of these, each one hand-checked:</>
        ) : build.kind === 'building' ? (
          <>Building your round on “{build.topic}” (can take up to a minute). Play a hand-checked one while you wait:</>
        ) : build.kind === 'failed' ? (
          <>Couldn't build “{build.topic}” right now. Try one of these instead:</>
        ) : build.kind === 'ready' ? (
          <>
            Your topic's ready:{' '}
            <button type="button" className="anytopic-open" onClick={() => {
              clearBuild()
              onOpen(build.slug)
            }}>
              Open “{build.topic}”
            </button>
          </>
        ) : (
          chips.length > 0 && <>Ready now, each one hand-checked:</>
        )}
      </p>
      {chips.length > 0 && (
        <div className="anytopic-chips" role="group" aria-label="Hand-checked topics">
          {shown.map((slug) => (
            <button key={slug} type="button" className={`anytopic-chip${suggested.includes(slug) ? ' suggested' : ''}${sessionChips.includes(slug) ? ' session' : ''}`} onClick={() => open(slug)}>
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

// Off Home (e.g. mid-round on a chip): a small toast when the typed topic's build lands.
export function BuildReady({ onOpen }: { onOpen: (slug: string) => void }) {
  const build = useBuild()
  if (build.kind !== 'ready') return null
  return (
    <div className="anytopic-ready" role="status">
      <span className="anytopic-ready-text" title={build.topic}>
        Your topic's ready: “{build.topic}”
      </span>
      <button
        type="button"
        onClick={() => {
          clearBuild()
          onOpen(build.slug)
        }}
      >
        Open
      </button>
      <button type="button" aria-label="Dismiss" onClick={clearBuild}>
        ×
      </button>
    </div>
  )
}
