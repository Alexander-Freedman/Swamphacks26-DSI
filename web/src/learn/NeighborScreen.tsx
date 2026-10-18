// Tell it apart: two cards, this topic and its look-alike; the learner says what separates them.
import { checkLabel } from '../demo/demo'
import { useCallback, useState } from 'react'
import type { NeighborRequest, StageProps } from './types'
import { useGraded } from './useGraded'
import { offlineLine } from './offlineLine'
import './learn-draw-finish.css'

const SAY = { correct: 'Got it', partial: 'Partly', incorrect: 'Not quite' } as const

export function NeighborScreen({ topic, state, update, next, api }: StageProps) {
  const n = topic.rubric.confusableNeighbors[0]
  const call = useCallback((body: NeighborRequest) => api.neighbor(topic.slug, body), [api, topic.slug])
  const { run, busy, offline } = useGraded(call)
  const [prior, setPrior] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [answer, setAnswer] = useState(state.neighborAnswer)
  const result = state.neighborResult

  if (!n)
    return (
      <section className="learn-step ldf" aria-label="neighbor">
        <p className="learn-instruction">Nothing close enough to mix this up with. On to the next step.</p>
        <button onClick={next}>Next</button>
      </section>
    )

  const submit = async () => {
    const r = await run({ key: n.key, answer, priorAnswer: prior })
    if (!r) return
    update({ neighborAnswer: answer, neighborResult: r })
    if (prior === null && r.verdict !== 'correct' && r.followUpQuestion) {
      setPrior(answer)
      setFollowUp(r.followUpQuestion)
      setAnswer('')
    } else setFollowUp(null)
  }
  const done = !!result && (result.verdict === 'correct' || prior !== null) && !followUp

  return (
    <section className="learn-step ldf" aria-label="neighbor">
      <p className="learn-instruction">Which one is this? Say what tells them apart.</p>
      <div className="ldf-pair">
        <div className="ldf-card">
          <span className="ldf-kicker">this topic</span>
          <strong>{topic.topic}</strong>
        </div>
        <div className="ldf-card">
          <span className="ldf-kicker">easy to mix up with</span>
          <strong>{n.label}</strong>
        </div>
      </div>
      <p className="ldf-question">{followUp ?? n.question}</p>
      {!done && (
        <>
          <label className="ldf-label" htmlFor="ldf-neighbor">
            Your answer, one line
          </label>
          <input id="ldf-neighbor" type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={busy} />
          <button className="ldf-go" disabled={busy || !answer.trim()} onClick={submit}>
            Check
          </button>
        </>
      )}
      {busy && (
        <p className="learn-thinking" role="status">
          thinking…
        </p>
      )}
      {offline && <p className="learn-offline" role="status">{offlineLine(offline)}</p>}
      {result && !busy && (
        <div className={`ldf-verdict is-${result.verdict}`} aria-live="polite">
          <strong>{SAY[result.verdict]}.</strong> {result.feedback}
          {result.offline && <span className="learn-offline"> · {checkLabel()}</span>}
        </div>
      )}
      <div className="ldf-actions">
        <button onClick={next} disabled={busy}>
          Next
        </button>
      </div>
    </section>
  )
}
