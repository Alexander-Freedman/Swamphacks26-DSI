import type { Misconception } from '../types'
import './MisconceptionCard.css'

// Named only after 2+ consistent signals; before that it's "this looks like…" (misconceptions.md).
export function MisconceptionCard({ m, signals }: { m: Misconception; signals: number }) {
  const named = signals >= 2
  return (
    <aside className="mcard" aria-live="polite">
      <p className="mcard-kicker hand">{named ? 'Caught it' : 'This looks like…'}</p>
      <h3 className="mcard-label">{m.label}</h3>
      <dl>
        <dt>Why it's tempting</dt>
        <dd>{m.why_tempting}</dd>
        <dt>The better model</dt>
        <dd>{m.refutation}</dd>
      </dl>
      <p className="mcard-source">
        {m.source_url ? <a href={m.source_url} target="_blank" rel="noreferrer">{m.source_note}</a> : m.source_note}
      </p>
    </aside>
  )
}
