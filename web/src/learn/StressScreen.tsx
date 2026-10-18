// Placeholder for the stress stage (one input + Next). Replace with the real screen; keep StageProps.
import type { StageProps } from './types'

export function StressScreen({ state, update, next }: StageProps) {
  return (
    <section className="learn-step" aria-label="stress">
      <p className="learn-instruction">Test your fix on the extreme cases.</p>
      <textarea aria-label="stress answer" rows={2} value={state.fix} onChange={(e) => update({ fix: e.target.value })} />
      <button onClick={next}>Next</button>
    </section>
  )
}
