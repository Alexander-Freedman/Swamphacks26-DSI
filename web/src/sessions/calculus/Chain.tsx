import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { CalcEnd } from './CalcEnd'
import { CHAIN_LABELS, chain2, F1, f1, f2, f2p, G1, g1, g2, g2p, isStill, X1, type ChainMistake } from './chainMath'

// Calc 1, the chain rule: three number lines stacked, x → u = g(x) → y = f(u). A small step in x
// fans down into a step in u, which fans down into a step in y. You see each stretch, then that
// the two stretches multiply. Warm-up on straight lines, then y = sin(x²).

const W = 520
const H = 250
const L = 40
const R = 30
const ROWS = { x: 42, u: 130, y: 218 }

type Line = { lo: number; hi: number }
const px = ({ lo, hi }: Line, v: number) => L + ((v - lo) / (hi - lo)) * (W - L - R)

/** One number line with ticks, and the bracket [a, b] on it. */
function NumberLine({ y, line, name, a, b, ticks, fmt = (t) => t.toString() }: { y: number; line: Line; name: string; a: number; b: number; ticks: number[]; fmt?: (t: number) => string }) {
  return (
    <g>
      <line className="calc-zero" x1={L} x2={W - R} y1={y} y2={y} />
      {ticks.map((t) => (
        <g key={t}>
          <line className="calc-tick" x1={px(line, t)} x2={px(line, t)} y1={y - 4} y2={y + 4} />
          <text className="calc-axis" x={px(line, t)} y={y + 18} textAnchor="middle">{fmt(t)}</text>
        </g>
      ))}
      <text className="calc-ptitle" x={L - 10} y={y + 5} textAnchor="end">{name}</text>
      <line className="calc-chain-step" x1={px(line, a)} x2={px(line, b)} y1={y} y2={y} />
      <circle className="calc-handle" cx={px(line, a)} cy={y} r={6} />
      <circle className="calc-handle" cx={px(line, b)} cy={y} r={6} />
    </g>
  )
}

/** The fan from the bracket on one line to its image on the next. */
function Fan({ y1, y2, l1, l2, a, b, fa, fb }: { y1: number; y2: number; l1: Line; l2: Line; a: number; b: number; fa: number; fb: number }) {
  return <polygon className="calc-chain-fan" points={`${px(l1, a)},${y1} ${px(l1, b)},${y1} ${px(l2, fb)},${y2} ${px(l2, fa)},${y2}`} />
}

const LX1: Line = { lo: 0, hi: 3 }
const LU1: Line = { lo: 1, hi: 7 }
const LY1: Line = { lo: 1, hi: 19 }
const LX2: Line = { lo: 0, hi: X1 }
const LU2: Line = { lo: 0, hi: 4 }
const LY2: Line = { lo: -1, hi: 1 }

type Pick = { id: string; text: string; right?: boolean; mistake?: ChainMistake; why?: string }
const Q1: Pick[] = [
  { id: 'six', text: '6: the stretches multiply, 2 × 3', right: true },
  { id: 'five', text: '5: the two rates add up, 2 + 3', mistake: 'chain-rates-add', why: 'Look at the fans: 1 of x opens to 2 of u, and each of those 2 opens to 3 of y. That’s 2 lots of 3, not 2 plus 3.' },
  { id: 'three', text: '3: only the last step counts', mistake: 'chain-outer-only', why: 'The last step turns each 1 of u into 3 of y, but x has already been stretched to 2 of u before that. Both stretches happen.' },
]

export function ChainStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [phase, setPhase] = useState<'warm' | 'real'>('warm')
  const [x1, setX1] = useState(1)
  const [x2, setX2] = useState(0.7)
  const [wrong, setWrong] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [caught, setCaught] = useState<ChainMistake[]>([])
  const [missed, setMissed] = useState(0)
  const still = phase === 'real' && isStill(x2)
  const choose = (p: Pick) => {
    if (p.right) {
      setAnswered(true)
      setNote(null)
      return
    }
    setWrong((w) => [...w, p.id])
    setMissed((m) => m + 1)
    if (p.mistake) setCaught((k) => (k.includes(p.mistake!) ? k : [...k, p.mistake!]))
    setNote(p.why ?? '')
  }
  const saved = useRef(false)
  useEffect(() => {
    if (!still || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [still, caught, missed, topic])

  // the warm-up bracket is a whole unit of x; the real one is a small step of 0.2
  const h = phase === 'warm' ? 1 : 0.2
  const x = phase === 'warm' ? x1 : x2
  const g = phase === 'warm' ? g1 : g2
  const f = phase === 'warm' ? f1 : f2
  const a = x - h / 2
  const b = x + h / 2
  const lx = phase === 'warm' ? LX1 : LX2
  const lu = phase === 'warm' ? LU1 : LU2
  const ly = phase === 'warm' ? LY1 : LY2
  const inner = phase === 'warm' ? G1 : g2p(x)
  const outer = phase === 'warm' ? F1 : f2p(g(x))
  const showY = phase === 'real' || answered
  const n2 = (v: number) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2)

  return (
    <section>
      <div className="calc-split">
        <div className="calc-card calc-tight calc-main">
          <div className="calc-k calc-pad">{phase === 'warm' ? 'u = 2x + 1, then y = 3u − 2' : 'u = x², then y = sin u'} · a step in x fans down into u, then into y</div>
          <svg className="calc-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`x = ${x.toFixed(2)}; a step of ${h} in x becomes ${(g(b) - g(a)).toFixed(2)} in u${showY ? ` and ${(f(g(b)) - f(g(a))).toFixed(2)} in y` : ''}`}>
            <Fan y1={ROWS.x} y2={ROWS.u} l1={lx} l2={lu} a={a} b={b} fa={g(a)} fb={g(b)} />
            {showY && <Fan y1={ROWS.u} y2={ROWS.y} l1={lu} l2={ly} a={g(a)} b={g(b)} fa={f(g(a))} fb={f(g(b))} />}
            <NumberLine y={ROWS.x} line={lx} name="x" a={a} b={b} ticks={phase === 'warm' ? [0, 1, 2, 3] : [0, 0.5, 1, 1.5, 2]} />
            <NumberLine y={ROWS.u} line={lu} name="u" a={g(a)} b={g(b)} ticks={phase === 'warm' ? [1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4]} />
            {showY ? (
              <NumberLine y={ROWS.y} line={ly} name="y" a={f(g(a))} b={f(g(b))} ticks={phase === 'warm' ? [1, 4, 7, 10, 13, 16, 19] : [-1, -0.5, 0, 0.5, 1]} />
            ) : (
              <text className="calc-hint" x={W / 2} y={ROWS.y + 5} textAnchor="middle">y = 3u − 2 shows up here once you answer</text>
            )}
          </svg>
          <label className="calc-range">
            <span>x = {x.toFixed(2)}</span>
            {phase === 'warm' ? (
              <input type="range" min={0.5} max={2.5} step={0.1} value={x1} onChange={(e) => setX1(+e.target.value)} aria-label="move x" />
            ) : (
              <input type="range" min={0.1} max={X1 - 0.1} step={0.01} value={x2} onChange={(e) => setX2(+e.target.value)} aria-label="move x" />
            )}
          </label>
        </div>
        <div className="calc-side">
          <div className="calc-card calc-readout" aria-live="polite">
            <div className="calc-tag">x → u: the inside stretch</div>
            <div className="calc-big">{phase === 'warm' ? `×${G1}` : `×${n2(inner)}`}</div>
            <div className="calc-sub">{phase === 'warm' ? 'every 1 of x is 2 of u' : `du/dx = 2x at x = ${x.toFixed(2)}`}</div>
            {showY && (
              <>
                <div className="calc-tag">u → y: the outside stretch</div>
                <div className="calc-big">{phase === 'warm' ? `×${F1}` : `×${n2(outer)}`}</div>
                <div className="calc-sub">{phase === 'warm' ? 'every 1 of u is 3 of y' : `dy/du = cos u at u = ${g(x).toFixed(2)}`}</div>
                <div className="calc-tag">x → y, all together</div>
                <div className="calc-big calc-hl">{phase === 'warm' ? `×${G1 * F1}` : `×${n2(chain2(x))}`}</div>
              </>
            )}
          </div>
        </div>
        <div className="calc-after">
          <div className="calc-card">
            {phase === 'warm' && !answered && (
              <>
                <div className="calc-k">question 1 of 2</div>
                <p className="calc-ask">Slide x and watch the fan: every 1 of x opens into 2 of u. Next, every 1 of u opens into 3 of y. So when x moves by 1, how far does y move?</p>
                <div className="calc-picks" role="group" aria-label="how far does y move">
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
            {phase === 'warm' && answered && (
              <>
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> 1 of x → 2 of u → 6 of y. Two stretches in a row multiply: dy/dx = dy/du · du/dx = 3 · 2 = 6. That’s the chain rule.</span>
                </p>
                <button className="calc-btn calc-go" onClick={() => setPhase('real')}>Now a curvy one: y = sin(x²) →</button>
              </>
            )}
            {phase === 'real' && !still && (
              <>
                <div className="calc-k">question 2 of 2</div>
                <p className="calc-ask">
                  Now the stretches change as you move: the inside is ×2x, the outside is ×cos(x²). Slide x to a spot <b>other than 0</b> where y stands still even though x is moving (the bottom bracket closes up).
                </p>
              </>
            )}
            {still && (
              <>
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> At x ≈ {x.toFixed(2)}, u = x² ≈ π/2, where cos u = 0. The inside still stretches (×{n2(inner)}), but the outside squashes everything to 0, and 0 times anything is 0.</span>
                </p>
                <p className="calc-rule">
                  <span><span className="calc-hl">dy/dx = dy/du · du/dx</span>: outside stretch times inside stretch.</span>
                  <span>Rates in a chain multiply, they don’t add.</span>
                  <span>If either stretch is 0, y stands still.</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {still && <CalcEnd caught={caught.map((m) => `“${CHAIN_LABELS[m]}”`)} mastered={missed === 0} remix="Next: use slope 0 to find the biggest box." onDone={onDone} />}
    </section>
  )
}
