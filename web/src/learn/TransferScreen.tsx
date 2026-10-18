// Placeholder for the transfer stage (one input + Next). Replace with the real screen; keep StageProps.
import type { StageProps } from './types'

export function TransferScreen({ state, update, next }: StageProps) {
  return (
    <section className="learn-step" aria-label="transfer">
      <p className="learn-instruction">Say the same idea in a different field.</p>
      <textarea aria-label="transfer answer" rows={2} value={state.transferAnalogy} onChange={(e) => update({ transferAnalogy: e.target.value })} />
      <button onClick={next}>Next</button>
    </section>
  )
}
