// Placeholder for the neighbor stage (one input + Next). Replace with the real screen; keep StageProps.
import type { StageProps } from './types'

export function NeighborScreen({ state, update, next }: StageProps) {
  return (
    <section className="learn-step" aria-label="neighbor">
      <p className="learn-instruction">Say how this differs from its look-alike.</p>
      <textarea aria-label="neighbor answer" rows={2} value={state.neighborAnswer} onChange={(e) => update({ neighborAnswer: e.target.value })} />
      <button onClick={next}>Next</button>
    </section>
  )
}
