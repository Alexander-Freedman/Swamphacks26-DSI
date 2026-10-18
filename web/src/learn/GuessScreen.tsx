// Placeholder for the guess stage (one input + Next). Replace with the real screen; keep StageProps.
import type { StageProps } from './types'

export function GuessScreen({ state, update, next }: StageProps) {
  return (
    <section className="learn-step" aria-label="guess">
      <p className="learn-instruction">Write your best one-line guess.</p>
      <textarea aria-label="guess answer" rows={2} value={state.guess} onChange={(e) => update({ guess: e.target.value })} />
      <button onClick={next}>Next</button>
    </section>
  )
}
