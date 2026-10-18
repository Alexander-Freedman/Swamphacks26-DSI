// Done: the mistake card, what they did, and the Notebook save.
import { useEffect, useState } from 'react'
import { NOTEBOOK_HREF, upsert } from '../notebook'
import { customScreen } from './custom/registry'
import type { LearnNotebookEntry, Stage, StageProps } from './types'
import './learn-draw-finish.css'

const TRANSFER = { maps: 'it maps', partial: 'partly maps', 'too-abstract': 'too abstract', fails: "didn't map" } as const

export function DoneScreen({ topic, state, next }: StageProps) {
  const m = topic.misconceptions.find((x) => x.id === state.misconceptionId) ?? null
  const [at] = useState(() => new Date().toISOString())
  const shown = state.drawVerdicts.filter((c) => c.verdict === 'demonstrated').length
  const survived = state.stressHistory.filter((h) => h.verdict === 'survives').length
  // A topic's own tool (calculus, orgo) replaces the generic step and records no verdict: it was done, not skipped.
  const missing = (st: Stage) => (customScreen(topic.slug, st) ? 'done' : 'skipped')

  useEffect(() => {
    const entry: LearnNotebookEntry = {
      session: 'learn',
      slug: topic.slug,
      at,
      guess: state.guess,
      misconception: m?.id ?? null,
      stressRounds: state.stressHistory,
      drawVerdicts: state.drawVerdicts,
      transferVerdict: state.transferResult?.verdict ?? null,
    }
    // The notebook's Entry also wants rematch; label + topic let the card name the mistake.
    upsert({ ...entry, rematch: null, label: m?.label, topic: topic.topic, fix: m?.fix })
  }, [at, topic.slug, topic.topic, m, state.guess, state.stressHistory, state.drawVerdicts, state.transferResult])

  return (
    <section className="learn-step ldf" aria-label="done">
      <p className="learn-instruction">That's the whole model. Here's what you caught.</p>
      {m ? (
        <aside className="ldf-mcard" aria-label="the mistake">
          <span className="ldf-kicker">the wrong model you started with</span>
          <h2>{m.label}</h2>
          <p>{m.fix}</p>
        </aside>
      ) : (
        <aside className="ldf-mcard" aria-label="the mistake">
          <span className="ldf-kicker">your first guess</span>
          <h2>No wrong model caught</h2>
        </aside>
      )}
      <ul className="ldf-summary">
        <li>
          Stress test: {state.stressHistory.length ? `${survived} of ${state.stressHistory.length} cases survived` : missing('stress')}
        </li>
        <li>Sketch: {state.drawVerdicts.length ? `${shown} of ${state.drawVerdicts.length} parts shown` : missing('draw')}</li>
        <li>Other world: {state.transferResult ? TRANSFER[state.transferResult.verdict] : missing('transfer')}</li>
      </ul>
      <p className="ldf-saved">Saved to your notebook.</p>
      <div className="ldf-actions">
        <a className="ldf-link" href={NOTEBOOK_HREF}>
          Open notebook
        </a>
        <button onClick={next}>Try another topic</button>
      </div>
    </section>
  )
}
