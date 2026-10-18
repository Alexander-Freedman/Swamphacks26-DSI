// Top of Home: "Try any topic" opens a six-screen Learn session (docs/learn-plan.md).
// Chips are the prebuilt Learn topics. Typed text opens the closest prebuilt topic; anything else
// is built live by the backend (about a minute), or says it needs the backend when there is none.
import { useEffect, useId, useState, type FormEvent } from 'react'
import { keywords, learnApi, overlap } from '../learnApi'
import { offlineLine } from './offlineLine'
import { isOffline, type LearnApi, type TopicSummary } from './types'
import '../components/AnyTopic.css'
import './learn-topic-box.css'

/** The prebuilt topic `text` names, if any: exact slug/topic, or at least half its keywords. */
export function matchLearnTopic(text: string, topics: TopicSummary[]): string | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  const exact = topics.find((x) => x.slug === t || x.topic.toLowerCase() === t)
  if (exact) return exact.slug
  let best: { slug: string; score: number } | null = null
  for (const x of topics) {
    const size = keywords(x.topic).size
    if (!size) continue
    const score = overlap(t, x.topic) / size
    if (score >= 0.5 && (!best || score > best.score)) best = { slug: x.slug, score }
  }
  return best?.slug ?? null
}

export function LearnTopicBox({ onOpen, api = learnApi }: { onOpen: (slug: string) => void; api?: LearnApi }) {
  const [topics, setTopics] = useState<TopicSummary[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const id = useId()

  useEffect(() => {
    let live = true
    api.listTopics().then((list) => live && setTopics(list)).catch(() => {})
    return () => {
      live = false
    }
  }, [api])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const topic = text.trim()
    if (!topic || busy) return
    const hit = matchLearnTopic(topic, topics)
    if (hit) return onOpen(hit)
    setBusy(true)
    setNote(null)
    try {
      const r = await api.createTopic(topic)
      if (isOffline(r)) {
        setNote(r.reason === 'no_backend' ? 'Building a new topic needs the live backend. Try one of these:' : offlineLine(r))
      } else {
        onOpen(r.slug)
      }
    } catch {
      setNote('That one did not build. Try one of these:')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="anytopic learn-box" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="anytopic-title">
        Try any topic
      </h2>
      <form className="anytopic-form" onSubmit={submit}>
        <input
          aria-label="topic to learn"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. why we have seasons, recursion"
          maxLength={120}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !text.trim()}>
          {busy ? 'Building…' : 'Learn it'}
        </button>
      </form>
      <p className="anytopic-status" aria-live="polite">
        {busy ? 'Building your lesson: cases, extreme tests and common mistakes. About a minute.' : note}
      </p>
      {topics.length > 0 && (
        <div className="anytopic-chips" role="group" aria-label="Ready-made topics">
          {topics.map((t) => (
            <button key={t.slug} type="button" className="anytopic-chip" onClick={() => onOpen(t.slug)} disabled={busy}>
              {t.topic}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
