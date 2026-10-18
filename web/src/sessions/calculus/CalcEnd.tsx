import { NOTEBOOK_HREF } from '../../notebook'

/** The yellow end bar every calculus step finishes on: saved, what was caught, Open notebook, Done. */
export function CalcEnd({ caught, mastered: ok, remix, onDone }: { caught: string[]; mastered: boolean; remix: string; onDone: () => void }) {
  return (
    <div className="calc-end" role="status">
      <p>
        <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.join(' and ')}.` : 'No mistake caught this time.'}{' '}
        {ok && <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} {remix}
      </p>
      <div className="calc-endact">
        <a className="calc-nblink" href={NOTEBOOK_HREF}>Open notebook</a>
        <button className="calc-btn" onClick={onDone}>Done</button>
      </div>
    </div>
  )
}
