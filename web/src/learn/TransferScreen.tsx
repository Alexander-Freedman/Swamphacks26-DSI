// Carry it: the same idea in a different world. One push if it doesn't map yet.
import { checkLabel } from '../demo/demo'
import { useCallback, useState } from 'react'
import type { StageProps, TransferRequest } from './types'
import { useGraded } from './useGraded'
import { offlineLine } from './offlineLine'
import './learn-draw-finish.css'

const SAY = { maps: 'It maps', partial: 'Partly maps', 'too-abstract': 'Too abstract', fails: "Doesn't map" } as const

export function TransferScreen({ topic, state, update, next, api }: StageProps) {
  const call = useCallback((body: TransferRequest) => api.transfer(topic.slug, body), [api, topic.slug])
  const { run, busy, offline } = useGraded(call)
  const [pushed, setPushed] = useState(false)
  const [tries, setTries] = useState(0)
  const result = state.transferResult

  const submit = async () => {
    const r = await run({ analogy: state.transferAnalogy, wasPushed: pushed })
    if (!r) return
    update({ transferResult: r })
    setTries((t) => t + 1)
    if (r.verdict !== 'maps' && !pushed) setPushed(true)
  }
  const canTry = tries === 0 || (tries === 1 && pushed && result?.verdict !== 'maps')

  return (
    <section className="learn-step ldf" aria-label="transfer">
      <p className="learn-instruction">Same idea, different world: give one example from another domain.</p>
      <label className="ldf-label" htmlFor="ldf-transfer">
        Your example
      </label>
      <textarea
        id="ldf-transfer"
        rows={3}
        value={state.transferAnalogy}
        onChange={(e) => update({ transferAnalogy: e.target.value })}
        disabled={busy || !canTry}
      />
      {canTry && (
        <button className="ldf-go" disabled={busy || !state.transferAnalogy.trim()} onClick={submit}>
          {tries === 0 ? 'Check' : 'Try again'}
        </button>
      )}
      {busy && (
        <p className="learn-thinking" role="status">
          thinking…
        </p>
      )}
      {offline && <p className="learn-offline" role="status">{offlineLine(offline)}</p>}
      {result && !busy && (
        <div className={`ldf-verdict is-${result.verdict}`} aria-live="polite">
          <strong>{SAY[result.verdict]}.</strong> {result.critique}
          {result.verdict !== 'maps' && result.missingPiece && (
            <p className="ldf-missing">
              missing: {result.missingPiece}
            </p>
          )}
          {result.offline && <span className="learn-offline">{checkLabel()}</span>}
        </div>
      )}
      <div className="ldf-actions">
        <button onClick={next} disabled={busy}>
          Next
        </button>
      </div>
    </section>
  )
}
