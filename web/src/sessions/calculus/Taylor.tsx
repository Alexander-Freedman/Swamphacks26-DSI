import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { clamp, ix, local, pathOf, sx, sy, useWidth, type Box } from './plot'
import { gap, goodRadius, MAX_TERMS, TAYLOR_LABELS, target, taylor, termText, TOL, X_MAX, type TaylorMistake } from './taylorMath'

// Calc 2, Taylor polynomials: sin x in ink, and a pencil polynomial built one term at a time around x = 0.
// Predict how far 3 terms stay close, then whether an extra term helps everywhere; drag the dot to read the gap.

type Q1 = 'one' | 'two' | 'five' | 'all'
const Q1S: { id: Q1; text: string; why?: string; mistake?: TaylorMistake }[] = [
  { id: 'one', text: 'Out to about x = 1', why: 'Even 1 term, the line y = x, stays within 0.1 out to x ≈ 0.85. Two more terms reach a good deal further.' },
  { id: 'two', text: 'Out to about x = 2.5' },
  { id: 'five', text: 'Out to about x = 5', why: 'Three terms is x − x³/6 + x⁵/120. At x = 5 the x⁵ term alone is 26, nowhere near sin 5 = −0.96.' },
  { id: 'all', text: 'Everywhere: 3 terms already match the whole curve', mistake: 'taylor-good-everywhere', why: 'A polynomial can’t wave up and down forever. Far from 0 its biggest power takes over and it shoots off the chart, however many terms it has.' },
]
type Q2 = 'everywhere' | 'centre' | 'worse'
const Q2S: { id: Q2; text: string; why?: string; mistake?: TaylorMistake }[] = [
  { id: 'everywhere', text: 'Yes: every new term helps everywhere at once', mistake: 'taylor-good-everywhere', why: 'Drag the dot out to x = 7 and go from 1 term to 2: the gap jumps from about 6 to about 50. Far out, a new term can make things worse before later ones fix them.' },
  { id: 'centre', text: 'Only near the centre: the hug reaches further out each time, but it always peels off eventually' },
  { id: 'worse', text: 'No: more terms make it worse', why: 'Near 0 every term helps. With 3 terms it stays within 0.1 out to x ≈ 2.4; with 8, out past 6.' },
]

const H = 310
const box = (w: number): Box => ({ l: 36, t: 14, w: w - 50, h: 236, x0: -X_MAX, x1: X_MAX, y0: -2.5, y1: 2.5 })

/** sin x, the ±0.1 tube around it, the n-term polynomial, and a draggable dot that shows the gap between them. */
function TaylorChart({ w, n, at, onAt, showRadius }: { w: number; n: number; at: number; onAt: (x: number) => void; showRadius: boolean }) {
  const b = box(w)
  const clip = useId()
  const active = useRef(false)
  const set = (e: PointerEvent<SVGSVGElement>) => onAt(Math.round(clamp(ix(b, local(e).px), -X_MAX, X_MAX) * 10) / 10)
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = e.shiftKey ? 1 : 0.1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onAt(Math.min(X_MAX, Math.round((at + d) * 10) / 10))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onAt(Math.max(-X_MAX, Math.round((at - d) * 10) / 10))
    else return
    e.preventDefault()
  }
  // the polynomial shoots far off the chart; keep its path coordinates sane and let the clip hide the rest
  const poly = (x: number) => clamp(taylor(x, n), -40, 40)
  const tube = pathOf(b, (x) => target(x) + TOL, b.x0, b.x1, 160) + pathOf(b, (x) => target(x) - TOL, b.x1, b.x0, 160).replace('M', 'L') + 'Z'
  const R = goodRadius(n)
  const ys = sy(b, target(at))
  const yp = sy(b, poly(at))
  const g = gap(at, n)
  const xs = Array.from({ length: 2 * X_MAX + 1 }, (_, i) => i - X_MAX)
  return (
    <svg
      className="calc-svg calc-touch calc-drag calc-tay-chart"
      width={w}
      height={H}
      viewBox={`0 0 ${w} ${H}`}
      role="slider"
      tabIndex={0}
      aria-label="drag the dot along x to read the gap"
      aria-valuemin={-X_MAX}
      aria-valuemax={X_MAX}
      aria-valuenow={at}
      aria-valuetext={`x = ${at.toFixed(1)}, gap ${g.toFixed(2)}`}
      onKeyDown={key}
      onPointerDown={(e) => (e.currentTarget.setPointerCapture?.(e.pointerId), (active.current = true), set(e))}
      onPointerMove={(e) => active.current && set(e)}
      onPointerUp={() => (active.current = false)}
      onPointerCancel={() => (active.current = false)}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={b.l} y={b.t} width={b.w} height={b.h} />
        </clipPath>
      </defs>
      <g className="calc-grid">
        {xs.map((x) => <line key={x} x1={sx(b, x)} x2={sx(b, x)} y1={b.t} y2={b.t + b.h} />)}
        {[-2, -1, 1, 2].map((y) => <line key={y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />)}
      </g>
      <line className="calc-zero" x1={b.l} x2={b.l + b.w} y1={sy(b, 0)} y2={sy(b, 0)} />
      <line className="calc-zero" x1={sx(b, 0)} x2={sx(b, 0)} y1={b.t} y2={b.t + b.h} />
      {xs.filter((x) => x % 2 === 0 || w > 520).map((x) => (
        <text key={x} className="calc-axis" x={sx(b, x)} y={b.t + b.h + 14} textAnchor="middle">{x}</text>
      ))}
      {[-2, -1, 1, 2].map((y) => (
        <text key={y} className="calc-axis" x={b.l - 6} y={sy(b, y) + 4} textAnchor="end">{y}</text>
      ))}
      <g clipPath={`url(#${clip})`}>
        <path className="calc-tay-tube" d={tube} />
        <path className="calc-ink" d={pathOf(b, target, b.x0, b.x1, 200)} />
        <path className="calc-pencil" d={pathOf(b, poly, b.x0, b.x1, 240)} />
        <rect className="calc-tay-band" x={sx(b, at) - 6} y={Math.min(ys, yp)} width={12} height={Math.max(2, Math.abs(ys - yp))} />
      </g>
      {showRadius && (
        <g className="calc-tay-radius">
          <line x1={sx(b, -R)} x2={sx(b, R)} y1={b.t + b.h + 26} y2={b.t + b.h + 26} />
          <line x1={sx(b, -R)} x2={sx(b, -R)} y1={b.t + b.h + 20} y2={b.t + b.h + 32} />
          <line x1={sx(b, R)} x2={sx(b, R)} y1={b.t + b.h + 20} y2={b.t + b.h + 32} />
          <text className="calc-note" x={sx(b, 0)} y={b.t + b.h + 46} textAnchor="middle">within {TOL} out to x ≈ ±{R.toFixed(1)}</text>
        </g>
      )}
      <circle className="calc-dot" cx={sx(b, at)} cy={ys} r={5} />
      <circle className="calc-phandle" cx={sx(b, at)} cy={clamp(yp, b.t, b.t + b.h)} r={10} />
      <text className="calc-ptitle" x={b.l + 4} y={b.t + 14}>sin x</text>
      <text className="calc-sidelab" x={b.l + b.w - 4} y={b.t + 14} textAnchor="end">pencil: P{SUB[n]}(x), {n} {n === 1 ? 'term' : 'terms'}</text>
    </svg>
  )
}
const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈']

export function TaylorStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const [n, setN] = useState(1)
  const [maxN, setMaxN] = useState(1)
  const [at, setAt] = useState(1.5)
  const [phase, setPhase] = useState<'q1' | 'q2' | 'end'>('q1')
  const [wrong1, setWrong1] = useState<Q1[]>([])
  const [wrong2, setWrong2] = useState<Q2[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<TaylorMistake[]>([])
  const terms = (k: number) => {
    setN(k)
    setMaxN((m) => Math.max(m, k))
  }
  const miss = (m: TaylorMistake | undefined, why: string) => {
    setMissed((k) => k + 1)
    if (m) setCaught((c) => (c.includes(m) ? c : [...c, m]))
    setNote(why)
  }
  const pick1 = (c: (typeof Q1S)[number]) => {
    if (c.id === 'two') {
      setPhase('q2')
      setNote(null)
      terms(3)
      return
    }
    setWrong1((x) => [...x, c.id])
    miss(c.mistake, c.why ?? '')
  }
  const pick2 = (c: (typeof Q2S)[number]) => {
    if (c.id === 'centre') {
      setPhase('end')
      setNote(null)
      return
    }
    setWrong2((x) => [...x, c.id])
    miss(c.mistake, c.why ?? '')
  }
  const done = phase === 'end' && maxN >= MAX_TERMS
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [done, caught, missed, topic])

  const g = gap(at, n)
  const parts = termText(n)
  return (
    <section className="calc-split calc-tay">
      <div className="calc-side">
        {phase === 'q1' && (
          <div className="calc-card">
            <div className="calc-k">question 1 of 2</div>
            <p className="calc-ask">Right now the pencil is 1 term: the line y = x. With 3 terms (up to x⁵), how far from 0 will the pencil stay within 0.1 of sin x?</p>
            <div className="calc-picks" role="group" aria-label="how far 3 terms stay close">
              {Q1S.map((c) => (
                <button key={c.id} className={'calc-pick' + (wrong1.includes(c.id) ? ' wrong' : '')} disabled={wrong1.includes(c.id)} onClick={() => pick1(c)}>
                  {wrong1.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  {c.text}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
          </div>
        )}
        {phase === 'q2' && (
          <div className="calc-card">
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> With 3 terms the pencil stays inside the 0.1 tube out to x ≈ ±{goodRadius(3).toFixed(1)}, then peels away. Drag the dot past that edge and watch the yellow gap grow.</span>
            </p>
            <div className="calc-k">question 2 of 2</div>
            <p className="calc-ask">Now slide to 8 terms. Does each extra term bring the pencil closer to sin x everywhere at once?</p>
            <div className="calc-picks" role="group" aria-label="does every term help everywhere">
              {Q2S.map((c) => (
                <button key={c.id} className={'calc-pick' + (wrong2.includes(c.id) ? ' wrong' : '')} disabled={wrong2.includes(c.id)} onClick={() => pick2(c)}>
                  {wrong2.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  {c.text}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
          </div>
        )}
        {phase === 'end' && (
          <div className="calc-card">
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span>
                <b>Correct!</b> Each term widens the hug around the centre: within 0.1 out to ±{goodRadius(1).toFixed(1)} with 1 term, ±{goodRadius(3).toFixed(1)} with 3, ±{goodRadius(MAX_TERMS).toFixed(1)} with 8. Past that edge the pencil always peels off, because far out a polynomial’s biggest power takes over. A Taylor polynomial is a local fit: best at the centre, worse the further you go.
              </span>
            </p>
            {!done && <p className="calc-ask">Slide to all {MAX_TERMS} terms to see the widest hug.</p>}
            <p className="calc-rule">
              <span><span className="calc-hl">P<sub>n</sub>(x)</span> is built from the derivatives of f at the centre.</span>
              <span>More terms = a wider hug around the centre.</span>
              <span>Far from the centre it drifts off.</span>
            </p>
          </div>
        )}
      </div>

      <div className="calc-card calc-tight calc-main">
        <div className="calc-k calc-pad">sin x in ink · your polynomial in pencil · the gap in yellow</div>
        <div ref={ref}>
          <TaylorChart w={w} n={n} at={at} onAt={setAt} showRadius={phase !== 'q1'} />
        </div>
        <p className="calc-tay-formula" aria-live="polite">
          P{SUB[n]}(x) = {parts.map((t, i) => <span key={i} className={i === n - 1 && n > 1 ? 'calc-hl' : undefined}>{t} </span>)}
        </p>
        <label className="calc-lab calc-tay-lab" htmlFor="calc-tay-n">
          Terms: <span className="calc-num">{n}</span>
          {phase === 'q1' && <span className="calc-small"> · answer the question first, then add terms</span>}
        </label>
        <input id="calc-tay-n" type="range" min={1} max={MAX_TERMS} step={1} value={n} disabled={phase === 'q1'} onChange={(e) => terms(+e.target.value)} />
        <div className="calc-ends"><span>1</span><span>{MAX_TERMS}</span></div>
        <p className="calc-pair">
          at x = <b className="calc-num">{at.toFixed(1)}</b>: sin x = <b className="calc-num">{target(at).toFixed(2)}</b>, pencil <b className="calc-num calc-pencil-c">{Math.abs(taylor(at, n)) < 1000 ? taylor(at, n).toFixed(2) : 'off the chart'}</b>, gap{' '}
          <b className={'calc-num ' + (g <= TOL ? 'calc-box' : 'calc-hl')}>{g < 1000 ? g.toFixed(2) : '> 1000'}</b> {g <= TOL ? '· within 0.1' : '· more than 0.1 off'}
        </p>
      </div>

      {done && (
        <div className="calc-end calc-after" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${TAYLOR_LABELS[m]}”`).join(' and ')}.` : missed ? 'No mistake named this time.' : <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: does an infinite sum add up?
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
