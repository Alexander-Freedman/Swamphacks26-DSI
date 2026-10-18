import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { CalcEnd } from './CalcEnd'
import { ASK_X, compare, FOOT_SPEED, L, LADDER_LABELS, SAME_X, top, topFaster, topSpeed, type LadderMistake, type Speed } from './ladderMath'

// Calc 1, related rates: a ladder against a wall. Pull the foot out at a steady 1 m/s and the
// top slides down, slowly at first, then faster and faster. The two speeds are tied together by
// x² + y² = L², and differentiating that is the whole trick.

const W = 360
const H = 320
const P = { l: 60, b: 44, t: 24 }
const S = (W - P.l - 30) / L // pixels per metre

/** The wall, the floor, the ladder, and an arrow at each end sized by its speed. */
function Scene({ x, showTop }: { x: number; showTop: boolean }) {
  const y = top(x)
  const X = (m: number) => P.l + m * S
  const Y = (m: number) => H - P.b - m * S
  const foot = { x: X(x), y: Y(0) }
  const head = { x: X(0), y: Y(y) }
  const ts = Math.min(topSpeed(x), 3.5)
  return (
    <svg className="calc-svg calc-ladder calc-fit" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`ladder ${L} m long, foot ${x.toFixed(2)} m out moving at ${FOOT_SPEED} m/s, top ${y.toFixed(2)} m up${showTop ? ` falling at ${topSpeed(x).toFixed(2)} m/s` : ''}`}>
      <line className="calc-ladder-wall" x1={X(0)} x2={X(0)} y1={Y(L + 0.3)} y2={Y(0)} />
      <line className="calc-ladder-wall" x1={X(0)} x2={X(L + 0.3)} y1={Y(0)} y2={Y(0)} />
      {[1, 2, 3, 4, 5].map((m) => (
        <g key={m}>
          <line className="calc-tick" x1={X(m)} x2={X(m)} y1={Y(0)} y2={Y(0) + 5} />
          <text className="calc-axis" x={X(m)} y={Y(0) + 18} textAnchor="middle">{m}</text>
          <line className="calc-tick" x1={X(0) - 5} x2={X(0)} y1={Y(m)} y2={Y(m)} />
          <text className="calc-axis" x={X(0) - 9} y={Y(m) + 4} textAnchor="end">{m}</text>
        </g>
      ))}
      <line className="calc-ladder-rail" x1={foot.x} y1={foot.y} x2={head.x} y2={head.y} />
      {Array.from({ length: 7 }, (_, i) => (i + 1) / 8).map((t) => {
        const cx = foot.x + (head.x - foot.x) * t
        const cy = foot.y + (head.y - foot.y) * t
        const ux = (head.y - foot.y) / (L * S)
        const uy = -(head.x - foot.x) / (L * S)
        return <line key={t} className="calc-ladder-rung" x1={cx - 6 * ux} y1={cy - 6 * uy} x2={cx + 6 * ux} y2={cy + 6 * uy} />
      })}
      {/* the foot's arrow, 1 m/s; the top's arrow, x/y times that */}
      <g className="calc-ladder-arrow foot">
        <line x1={foot.x} y1={foot.y - 10} x2={foot.x + FOOT_SPEED * S * 0.6} y2={foot.y - 10} />
        <polygon points={`${foot.x + FOOT_SPEED * S * 0.6 + 8},${foot.y - 10} ${foot.x + FOOT_SPEED * S * 0.6},${foot.y - 16} ${foot.x + FOOT_SPEED * S * 0.6},${foot.y - 4}`} />
        <text className="calc-note" x={foot.x + 4} y={foot.y - 20}>{FOOT_SPEED.toFixed(2)} m/s</text>
      </g>
      {showTop && y > 0.05 && (
        <g className="calc-ladder-arrow top">
          <line x1={head.x + 10} y1={head.y} x2={head.x + 10} y2={head.y + ts * S * 0.6} />
          <polygon points={`${head.x + 10},${head.y + ts * S * 0.6 + 8} ${head.x + 4},${head.y + ts * S * 0.6} ${head.x + 16},${head.y + ts * S * 0.6}`} />
          <text className="calc-note" x={head.x + 20} y={head.y + 14}>{topSpeed(x).toFixed(2)} m/s</text>
        </g>
      )}
      <circle className="calc-dot" cx={foot.x} cy={foot.y} r={5} />
      <circle className="calc-dot" cx={head.x} cy={head.y} r={5} />
    </svg>
  )
}

type Pick = { id: Speed; text: string; mistake?: LadderMistake; why?: string }
const Q1: Pick[] = [
  { id: 'slower', text: 'Slower than the foot' },
  { id: 'same', text: 'The same, 1 m/s: it’s one ladder', mistake: 'ladder-same-speed', why: 'One ladder, but two different motions. The foot moves 1 m out; the top only drops as much as the triangle forces it to, and with 4 m of wall left that’s less than 1 m.' },
  { id: 'faster', text: 'Faster than the foot' },
]

export function LadderStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [x, setX] = useState(ASK_X)
  const [wrong, setWrong] = useState<Speed[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [caught, setCaught] = useState<LadderMistake[]>([])
  const [missed, setMissed] = useState(0)
  const faster = answered && topFaster(x)
  const choose = (p: Pick) => {
    if (p.id === compare(ASK_X)) {
      setAnswered(true)
      setNote(null)
      return
    }
    setWrong((w) => [...w, p.id])
    setMissed((m) => m + 1)
    if (p.mistake) setCaught((k) => (k.includes(p.mistake!) ? k : [...k, p.mistake!]))
    setNote(p.why ?? `With the foot ${ASK_X} m out, the top is ${top(ASK_X)} m up. Picture the next second: the foot goes 1 m further out; how far does the top have to drop to keep the ladder ${L} m long?`)
  }
  const saved = useRef(false)
  useEffect(() => {
    if (!faster || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [faster, caught, missed, topic])
  const y = top(x)

  return (
    <section>
      <div className="calc-3d-layout">
        <div className="calc-card calc-tight calc-3d-main">
          <div className="calc-k calc-pad">a {L} m ladder · the foot is pulled out at {FOOT_SPEED} m/s</div>
          <Scene x={x} showTop={answered} />
          <label className="calc-range">
            <span>foot {x.toFixed(2)} m</span>
            <input type="range" min={0.5} max={4.95} step={0.05} value={x} onChange={(e) => setX(+e.target.value)} disabled={!answered} aria-label="how far out the foot is" />
          </label>
        </div>
        <div className="calc-3d-side">
          <div className="calc-card calc-readout calc-twin" aria-live="polite">
            <div>
              <div className="calc-tag">foot, moving out</div>
              <div className="calc-big">{FOOT_SPEED.toFixed(2)}</div>
              <div className="calc-sub">m/s, steady</div>
            </div>
            <div>
              <div className="calc-tag">top, sliding down</div>
              <div className={'calc-big' + (answered ? '' : ' calc-dim')}>{answered ? <span className="calc-hl">{topSpeed(x).toFixed(2)}</span> : '?'}</div>
              <div className="calc-sub">{answered ? `m/s = (x / y) × 1 = ${x.toFixed(2)} / ${y.toFixed(2)}` : 'm/s'}</div>
            </div>
          </div>
          <div className="calc-card">
            {!answered && (
              <>
                <div className="calc-k">question 1 of 2 · predict</div>
                <p className="calc-ask">The foot is {ASK_X} m from the wall, so the top is {top(ASK_X)} m up. The foot moves out at 1 m/s. Right now, is the top sliding down faster than that, slower, or at the same speed?</p>
                <div className="calc-picks" role="group" aria-label="faster, slower or the same">
                  {Q1.map((p) => (
                    <button key={p.id} className={'calc-pick' + (wrong.includes(p.id) ? ' wrong' : '')} disabled={wrong.includes(p.id)} onClick={() => choose(p)}>
                      {wrong.includes(p.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                      {p.text}
                    </button>
                  ))}
                </div>
                {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
              </>
            )}
            {answered && !faster && (
              <>
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> Slower: 0.75 m/s. The ladder’s length ties the two ends together, x² + y² = {L * L}, and differentiating that gives 2x·x′ + 2y·y′ = 0, so the top’s speed is (x / y) × the foot’s: 3/4 of it here.</span>
                </p>
                <div className="calc-k">question 2 of 2</div>
                <p className="calc-ask">The top’s speed is x / y times the foot’s, and x / y grows as the ladder comes down. Drag the foot out until the top is falling <b>faster</b> than the foot is moving.</p>
              </>
            )}
            {faster && (
              <>
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> Past x = {SAME_X.toFixed(2)} m (where x = y) the top is falling at {topSpeed(x).toFixed(2)} m/s, faster than the foot. As the top nears the floor, y → 0 and its speed shoots up.</span>
                </p>
                <p className="calc-rule">
                  <span>Write the tie: <span className="calc-hl">x² + y² = {L * L}</span>.</span>
                  <span>Differentiate it with respect to time: 2x·x′ + 2y·y′ = 0.</span>
                  <span>Solve for the rate you want: y′ = −(x / y)·x′.</span>
                </p>
              </>
            )}
          </div>
          {faster && <CalcEnd caught={caught.map((m) => `“${LADDER_LABELS[m]}”`)} mastered={missed === 0} remix="Next: the area under a curve." onDone={onDone} />}
        </div>
      </div>
    </section>
  )
}
