import { withUnit } from '../format'
import type { Round, RoundCompare as RC } from '../types'
import { Compare } from './session/Compare'

// Engine v4 round.compare (#184): after the last reveal, the first case next to a second one that
// looks different but works the same. A compare item (played already) brings its computed number;
// without one the second case is its name only. Then the shared principle in ink.
export function RoundCompare({ round, compare, answers, onDone }: { round: Round; compare: RC; answers: Record<string, number | null>; onDone: () => void }) {
  const main = round.items.find((i) => i.id !== compare.item_id) ?? round.items[0]
  const second = compare.item_id ? round.items.find((i) => i.id === compare.item_id) : undefined
  const line = (id: string, unit: string) => {
    const v = answers[id]
    return v == null ? null : <p className="cmp-num">Answer: <strong>{withUnit(v, unit)}</strong></p>
  }
  return (
    <div className="round-compare">
      <h2 className="prompt">Same idea, new case</h2>
      <Compare
        cases={[
          { tag: 'case 1', title: round.topic, body: <><p>{main.prompt}</p>{line(main.id, main.slider?.unit ?? '')}</> },
          { tag: 'case 2', title: compare.topic, body: second ? <><p>{second.prompt}</p>{line(second.id, second.slider?.unit ?? '')}</> : <p>A different surface, the same model underneath.</p> },
        ]}
        options={[]}
        question={compare.prompt || undefined}
        principle={compare.shared_principle}
        onAnswer={() => {}}
      >
        <button className="next" onClick={onDone}>Done</button>
      </Compare>
    </div>
  )
}
