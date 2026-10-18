// Placeholder for the done stage. Replace with the mistake card + Notebook save; keep StageProps.
import type { StageProps } from './types'

export function DoneScreen({ topic, state, next }: StageProps) {
  const m = topic.misconceptions.find((x) => x.id === state.misconceptionId)
  return (
    <section className="learn-step" aria-label="done">
      <p className="learn-instruction">{m ? `The idea to watch: ${m.label}` : 'You ran the whole model.'}</p>
      <button onClick={next}>Finish</button>
    </section>
  )
}
