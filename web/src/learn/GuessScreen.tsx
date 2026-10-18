// Placeholder for the guess stage (one input + Next). Replace with the real screen; keep StageProps.
// Shows the graded-call pattern: "thinking…" while the call runs, "offline check" on a fallback result.
import { useCallback } from 'react'
import type { GuessRequest, StageProps } from './types'
import { offlineText, useGraded } from './useGraded'

export function GuessScreen({ topic, state, update, next, api }: StageProps) {
  const call = useCallback((b: GuessRequest) => api.guess(topic.slug, b), [api, topic.slug])
  const { run, busy, offline } = useGraded(call)
  const submit = async () => {
    const r = state.guess.trim() ? await run({ text: state.guess.trim() }) : null
    if (r) update({ guessResult: r, misconceptionId: r.misconceptionId })
    next()
  }
  return (
    <section className="learn-step" aria-label="guess">
      <p className="learn-instruction">Write your best one-line guess.</p>
      <textarea aria-label="guess answer" rows={2} value={state.guess} onChange={(e) => update({ guess: e.target.value })} />
      {busy && <p className="learn-thinking" role="status">thinking…</p>}
      {offline && <p className="learn-offline">{offlineText(offline)}</p>}
      <button onClick={submit} disabled={busy}>Next</button>
    </section>
  )
}
