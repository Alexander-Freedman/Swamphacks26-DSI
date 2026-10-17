import { useCallback, useState } from 'react'
import type { Pt } from './geometry'
import { OffTheEdge, type Phase } from './OffTheEdge'
import { DEFAULT_EDGE, landingX } from './offTheEdge'

export type Prediction = { points: Pt[]; why: string }

// Item 1 flow: draw (sim hidden) → say why → race the ghost → result.
export function OffTheEdgeItem({ onCommit }: { onCommit?: (p: Prediction) => void }) {
  const [phase, setPhase] = useState<Phase>('draw')
  const [points, setPoints] = useState<Pt[] | null>(null)
  const [why, setWhy] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [replay, setReplay] = useState(0)
  const raceEnd = useCallback(() => setPhase('done'), [])

  const commit = () => {
    if (!points) return
    onCommit?.({ points, why: why.trim() })
    setPhase('race')
  }

  const reset = () => {
    setPoints(null)
    setWhy('')
    setPhase('draw')
    setAttempt((a) => a + 1)
  }

  const missBy = points ? points[points.length - 1][0] - landingX(DEFAULT_EDGE) : 0

  return (
    <section className="item">
      <header className="item-head">
        <p className="eyebrow">Item 1 · Off the Edge</p>
        <h2>A marble rolls at a steady speed across a desk and off the edge. Draw the path it follows until it hits the floor.</h2>
      </header>

      <OffTheEdge
        key={attempt}
        phase={phase}
        onStroke={setPoints}
        onRaceEnd={raceEnd}
        replayKey={replay}
      />

      {phase === 'draw' && (
        <div className="item-controls">
          <label className="why">
            <span>Why that path? One sentence.</span>
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="It keeps going until…"
              maxLength={280}
            />
          </label>
          <button type="button" className="primary" disabled={!points} onClick={commit}>
            Lock it in
          </button>
        </div>
      )}

      {phase !== 'draw' && (
        <div className="item-controls">
          <p className="result">
            {phase === 'race'
              ? 'Your ghost vs the real marble, 4× slow motion…'
              : Math.abs(missBy) < 0.05
                ? 'Right on. Your path lands where the real one does.'
                : `Your path lands ${Math.abs(missBy * 100).toFixed(0)} cm ${missBy < 0 ? 'short of' : 'past'} the real marble.`}
          </p>
          {phase === 'done' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setPhase('race')
                  setReplay((r) => r + 1)
                }}
              >
                Replay
              </button>
              <button type="button" onClick={reset}>
                Draw again
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
