// Placeholder for the draw stage (one input + Next). Replace with the real screen; keep StageProps.
import type { StageProps } from './types'

export function DrawScreen({ state, update, next }: StageProps) {
  return (
    <section className="learn-step" aria-label="draw">
      <p className="learn-instruction">Write the rule in one line.</p>
      <textarea aria-label="draw answer" rows={2} value={state.drawRule} onChange={(e) => update({ drawRule: e.target.value })} />
      <button onClick={next}>Next</button>
    </section>
  )
}
