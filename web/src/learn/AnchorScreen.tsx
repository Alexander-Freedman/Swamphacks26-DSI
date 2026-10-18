// Placeholder for the anchor stage (one input + Next). Replace with the real screen; keep StageProps.
import type { StageProps } from './types'

export function AnchorScreen({ state, update, next }: StageProps) {
  return (
    <section className="learn-step" aria-label="anchor">
      <p className="learn-instruction">Use the fact to predict what happens next.</p>
      <textarea aria-label="anchor answer" rows={2} value={state.anchorAnswer} onChange={(e) => update({ anchorAnswer: e.target.value })} />
      <button onClick={next}>Next</button>
    </section>
  )
}
