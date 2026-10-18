// Placeholder for the contrast stage (one input + Next). Replace with the real screen; keep StageProps.
import type { StageProps } from './types'

export function ContrastScreen({ state, update, next }: StageProps) {
  return (
    <section className="learn-step" aria-label="contrast">
      <p className="learn-instruction">Write one line on why these two cases differ.</p>
      <textarea aria-label="contrast answer" rows={2} value={state.fix} onChange={(e) => update({ fix: e.target.value })} />
      <button onClick={next}>Next</button>
    </section>
  )
}
