import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { clamp, ix, local, pathOf, reducedMotion, sx, sy, useWidth, type Box } from './plot'
import { angleOf, deg, flipped, negativeSpans, petalsDrawn, point, POLAR_LABELS, r, rad, TAU, trace, type PolarMistake } from './polarMath'

// Calc 2, polar curves: an angle θ sweeps round and an arm of length r(θ) = cos 3θ traces a rose, while the
// ordinary graph of r against θ draws in sync beside it. Predict the number of petals first: the humps where
// r < 0 flip the dot across the origin and retrace, so 3 petals, not 6.

type Q1 = 'two' | 'three' | 'six'
const Q1S: { id: Q1; text: string; why?: string; mistake?: PolarMistake }[] = [
  { id: 'three', text: '3 petals' },
  { id: 'six', text: '6 petals', mistake: 'polar-negative-r-ignored', why: 'The ordinary graph of r has 6 humps, 3 up and 3 down. But a hump below the axis is r < 0: the dot goes the other way across the origin, back over a petal that’s already drawn.' },
  { id: 'two', text: '2 petals', why: 'Read r off the graph: it’s 1 at θ = 0°, 1 again at 120°, and again at 240°. That’s a petal tip at each of those angles.' },
]
type Q2 = 'ray' | 'opposite' | 'none'
const Q2S: { id: Q2; text: string; why?: string; mistake?: PolarMistake }[] = [
  { id: 'ray', text: '1 unit out along the 60° ray', mistake: 'polar-negative-r-ignored', why: 'That’s where r = +1 would put it. Slide to 60° and look: the arm goes the other way.' },
  { id: 'opposite', text: '1 unit out the opposite way, on the 240° ray' },
  { id: 'none', text: 'Nowhere: a negative r means no point', mistake: 'polar-negative-r-ignored', why: 'Every θ gives a point. A negative r just walks backwards through the origin, so the dot lands behind you.' },
]

const DEG_MAX = 360

/** The polar picture: grid, the ray at θ, the arm of length r(θ), the dot, and the rose traced so far. */
function RoseChart({ s, th, onTh, label }: { s: number; th: number; onTh: (d: number) => void; label: string }) {
  const c = s / 2
  const R = s / 2 - 26
  const X = (x: number) => c + x * R
  const Y = (y: number) => c - y * R
  const active = useRef(false)
  const set = (e: PointerEvent<SVGSVGElement>) => {
    const { px, py } = local(e)
    onTh(Math.round(deg(angleOf(px - c, c - py))))
  }
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = e.shiftKey ? 15 : 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onTh(Math.min(DEG_MAX, th + d))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onTh(Math.max(0, th - d))
    else return
    e.preventDefault()
  }
  const t = rad(th)
  const p = point(t)
  const neg = flipped(t)
  const path = trace(t).map((q, i) => (i ? 'L' : 'M') + X(q.x).toFixed(1) + ' ' + Y(q.y).toFixed(1)).join('')
  return (
    <svg
      className="calc-svg calc-touch calc-draw calc-pol-rose"
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={DEG_MAX}
      aria-valuenow={th}
      aria-valuetext={`θ = ${th}°, r = ${r(t).toFixed(2)}`}
      onKeyDown={key}
      onPointerDown={(e) => (e.currentTarget.setPointerCapture?.(e.pointerId), (active.current = true), set(e))}
      onPointerMove={(e) => active.current && set(e)}
      onPointerUp={() => (active.current = false)}
      onPointerCancel={() => (active.current = false)}
    >
      <g className="calc-pol-grid">
        {[0.5, 1].map((k) => <circle key={k} cx={c} cy={c} r={k * R} />)}
        {Array.from({ length: 12 }, (_, i) => i * 30).map((d) => (
          <line key={d} x1={c} y1={c} x2={X(Math.cos(rad(d)))} y2={Y(Math.sin(rad(d)))} />
        ))}
      </g>
      {[0, 90, 180, 270].map((d) => (
        <text key={d} className="calc-axis" x={X(1.13 * Math.cos(rad(d)))} y={Y(1.13 * Math.sin(rad(d))) + 4} textAnchor="middle">{d}°</text>
      ))}
      <text className="calc-axis" x={c + 5} y={Y(1) + 14}>r = 1</text>
      <path className="calc-ink" d={path} />
      {/* the ray at θ, dashed; the arm from the origin to the dot, solid (red when r < 0 sends it the other way) */}
      <line className="calc-pol-ray" x1={c} y1={c} x2={X(1.08 * Math.cos(t))} y2={Y(1.08 * Math.sin(t))} />
      <line className={'calc-pol-arm' + (neg ? ' neg' : '')} x1={c} y1={c} x2={X(p.x)} y2={Y(p.y)} />
      <circle className={'calc-pol-dot' + (neg ? ' neg' : '')} cx={X(p.x)} cy={Y(p.y)} r={9} />
      <text className="calc-note" x={X(1.08 * Math.cos(t))} y={Y(1.08 * Math.sin(t)) - 8} textAnchor="middle">θ</text>
    </svg>
  )
}

const H = 240
const box = (w: number): Box => ({ l: 34, t: 16, w: w - 46, h: 180, x0: 0, x1: TAU, y0: -1.25, y1: 1.25 })
const PI_TICKS: [number, string][] = [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [(3 * Math.PI) / 2, '3π/2'], [TAU, '2π']]

/** The same function as an ordinary graph: r against θ, drawn in sync up to θ, with the r < 0 spans shaded. */
function GraphChart({ w, th, onTh, label }: { w: number; th: number; onTh: (d: number) => void; label: string }) {
  const b = box(w)
  const active = useRef(false)
  const set = (e: PointerEvent<SVGSVGElement>) => onTh(Math.round(clamp(deg(ix(b, local(e).px)), 0, DEG_MAX)))
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = e.shiftKey ? 15 : 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onTh(Math.min(DEG_MAX, th + d))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onTh(Math.max(0, th - d))
    else return
    e.preventDefault()
  }
  const t = rad(th)
  return (
    <svg
      className="calc-svg calc-touch calc-drag calc-pol-graph"
      width={w}
      height={H}
      viewBox={`0 0 ${w} ${H}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={DEG_MAX}
      aria-valuenow={th}
      aria-valuetext={`θ = ${th}°, r = ${r(t).toFixed(2)}`}
      onKeyDown={key}
      onPointerDown={(e) => (e.currentTarget.setPointerCapture?.(e.pointerId), (active.current = true), set(e))}
      onPointerMove={(e) => active.current && set(e)}
      onPointerUp={() => (active.current = false)}
      onPointerCancel={() => (active.current = false)}
    >
      {negativeSpans().map(([a, c]) => (
        <rect key={a} className="calc-pol-neg" x={sx(b, rad(a))} y={sy(b, 0)} width={sx(b, rad(c)) - sx(b, rad(a))} height={sy(b, -1.25) - sy(b, 0)} />
      ))}
      <g className="calc-grid">
        {PI_TICKS.map(([x]) => <line key={x} x1={sx(b, x)} x2={sx(b, x)} y1={b.t} y2={b.t + b.h} />)}
        {[-1, 1].map((y) => <line key={y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />)}
      </g>
      <line className="calc-zero" x1={b.l} x2={b.l + b.w} y1={sy(b, 0)} y2={sy(b, 0)} />
      {PI_TICKS.map(([x, s]) => (
        <text key={s} className="calc-axis" x={sx(b, x)} y={b.t + b.h + 15} textAnchor={x === 0 ? 'start' : x === TAU ? 'end' : 'middle'}>{s}</text>
      ))}
      {[-1, 0, 1].map((y) => (
        <text key={y} className="calc-axis" x={b.l - 6} y={sy(b, y) + 4} textAnchor="end">{y}</text>
      ))}
      <text className="calc-sidelab" x={b.l + b.w} y={b.t + b.h + 32} textAnchor="end">θ</text>
      <text className="calc-ptitle" x={b.l + 4} y={b.t + 13}>r = cos 3θ</text>
      <text className="calc-note" x={sx(b, rad(60))} y={sy(b, -1.25) - 5} textAnchor="middle">r &lt; 0</text>
      <path className="calc-pol-ghost" d={pathOf(b, r, 0, TAU, 240)} />
      {th > 0 && <path className="calc-ink" d={pathOf(b, r, 0, t, Math.max(2, Math.round(th / 1.5)))} />}
      <line className="calc-link" x1={sx(b, t)} x2={sx(b, t)} y1={sy(b, 0)} y2={sy(b, r(t))} />
      <circle className={'calc-pol-dot' + (flipped(t) ? ' neg' : '')} cx={sx(b, t)} cy={sy(b, r(t))} r={9} />
    </svg>
  )
}

export function PolarStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [refL, wl] = useWidth<HTMLDivElement>(320, 420)
  const [refR, wr] = useWidth<HTMLDivElement>(320, 520)
  const [th, setTh] = useState(0)
  const [phase, setPhase] = useState<'q1' | 'sweep' | 'q2' | 'end'>('q1')
  const [wrong1, setWrong1] = useState<Q1[]>([])
  const [wrong2, setWrong2] = useState<Q2[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<PolarMistake[]>([])
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | null>(null)
  const stop = () => {
    if (timer.current) cancelAnimationFrame(timer.current)
    timer.current = null
    setPlaying(false)
  }
  useEffect(() => () => void (timer.current && cancelAnimationFrame(timer.current)), [])
  const go = (d: number) => {
    setTh(d)
    // a full turn done: on to the second question
    if (d >= DEG_MAX) setPhase((p) => (p === 'sweep' ? 'q2' : p))
  }
  const drag = (d: number) => {
    stop()
    go(d)
  }
  // sweep from where the dot is to a full turn; with reduced motion, jump straight there
  const play = () => {
    stop()
    const from = th >= DEG_MAX ? 0 : th
    if (reducedMotion()) return go(DEG_MAX)
    setPlaying(true)
    const ms = ((DEG_MAX - from) / DEG_MAX) * 7000
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      go(Math.round(from + p * (DEG_MAX - from)))
      if (p < 1) timer.current = requestAnimationFrame(tick)
      else stop()
    }
    timer.current = requestAnimationFrame(tick)
  }

  const miss = (m: PolarMistake | undefined, why: string) => {
    setMissed((k) => k + 1)
    if (m) setCaught((c) => (c.includes(m) ? c : [...c, m]))
    setNote(why)
  }
  const pick1 = (c: (typeof Q1S)[number]) => {
    if (c.id === 'three') {
      setPhase('sweep')
      setNote(null)
      return
    }
    setWrong1((x) => [...x, c.id])
    miss(c.mistake, c.why ?? '')
  }
  const pick2 = (c: (typeof Q2S)[number]) => {
    if (c.id === 'opposite') {
      setPhase('end')
      setNote(null)
      return
    }
    setWrong2((x) => [...x, c.id])
    miss(c.mistake, c.why ?? '')
  }
  const done = phase === 'end'
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [done, caught, missed, topic])

  const t = rad(th)
  const rr = r(t)
  const neg = flipped(t)
  const locked = phase === 'q1'
  const onTh = locked ? () => {} : drag
  const petals = petalsDrawn(t)
  return (
    <section className="calc-pol">
      <div className="calc-card">
        {phase === 'q1' && (
          <>
            <div className="calc-k">question 1 of 2</div>
            <p className="calc-ask">r = cos 3θ. The ordinary graph shows r for every angle: read it off. Sweep θ once round, from 0° to 360°: how many petals does the rose get?</p>
            <div className="calc-picks calc-picks-row" role="group" aria-label="how many petals">
              {Q1S.map((c) => (
                <button key={c.id} className={'calc-pick' + (wrong1.includes(c.id) ? ' wrong' : '')} disabled={wrong1.includes(c.id)} onClick={() => pick1(c)}>
                  {wrong1.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  {c.text}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
          </>
        )}
        {phase === 'sweep' && (
          <>
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> 3 petals. Now watch it happen: press play, or drag either dot. Whenever the graph dips below the axis, r is negative and the arm points <b>backwards</b>, over a petal that’s already there.</span>
            </p>
            <p className="calc-ask">Sweep all the way round to 360°.</p>
          </>
        )}
        {phase === 'q2' && (
          <>
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> One full turn, and the rose was already complete at 210°: the last 150° only retrace it. Each petal gets drawn twice, once with r &gt; 0 and once with r &lt; 0 from the opposite angle.</span>
            </p>
            <div className="calc-k">question 2 of 2</div>
            <p className="calc-ask">At θ = 60°, r = cos 180° = −1. Where is the dot?</p>
            <div className="calc-picks" role="group" aria-label="where the dot is at 60 degrees">
              {Q2S.map((c) => (
                <button key={c.id} className={'calc-pick' + (wrong2.includes(c.id) ? ' wrong' : '')} disabled={wrong2.includes(c.id)} onClick={() => pick2(c)}>
                  {wrong2.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  {c.text}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
          </>
        )}
        {phase === 'end' && (
          <>
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> r is how far to walk along the ray at θ, and a negative r walks backwards, straight through the origin to the other side. That’s why cos 3θ makes 3 petals: the 3 negative humps land on the petals the positive ones drew.</span>
            </p>
            <p className="calc-rule">
              <span><span className="calc-hl">(r, θ)</span>: go r along the ray at angle θ.</span>
              <span>r &lt; 0: go the other way through the origin.</span>
              <span>Same function, two pictures: the dots always match.</span>
            </p>
          </>
        )}
      </div>

      <div className="calc-two calc-pol-charts">
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">the rose: r along the ray at θ</div>
          <div ref={refL} className="calc-pol-rosewrap">
            <RoseChart s={Math.min(wl, 420)} th={th} onTh={onTh} label={locked ? 'the rose r = cos 3θ; answer the question to sweep θ' : 'drag around the rose to set the angle θ'} />
          </div>
          <p className="calc-pair">
            {petals} {petals === 1 ? 'petal' : 'petals'} drawn{th >= 210 ? ' · now retracing' : ''}
          </p>
        </div>
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">the same r, as an ordinary graph</div>
          <div ref={refR}>
            <GraphChart w={wr} th={th} onTh={onTh} label={locked ? 'the graph of r = cos 3θ against θ; answer the question to sweep θ' : 'drag along the graph to set the angle θ'} />
          </div>
          <p className="calc-pair" aria-live="polite">
            θ = <b className="calc-num">{th}°</b> · r = cos {3 * th}° = <b className={'calc-num' + (neg ? ' calc-hl' : ' calc-box')}>{(Math.abs(rr) < 0.005 ? 0 : rr).toFixed(2)}</b>
            {neg ? ' · negative: the dot is on the opposite side' : rr > 0.005 ? ' · along the ray' : ' · at the origin'}
          </p>
        </div>
      </div>

      <div className="calc-card calc-tight calc-pol-controls">
        <label className="calc-lab" htmlFor="calc-pol-th">
          θ: <span className="calc-num">{th}°</span>
          {locked && <span className="calc-small"> · answer the question first, then sweep</span>}
        </label>
        <input id="calc-pol-th" type="range" min={0} max={DEG_MAX} step={1} value={th} disabled={locked} onChange={(e) => drag(+e.target.value)} />
        <div className="calc-ends"><span>0°</span><span>360°</span></div>
        <div className="calc-row calc-start">
          <button className="calc-btn calc-ghost calc-sm" disabled={locked} onClick={playing ? stop : play}>{playing ? 'pause' : th >= DEG_MAX ? 'play again' : 'play ▶'}</button>
          <button className="calc-btn calc-ghost calc-sm" disabled={locked || th === 0} onClick={() => drag(0)}>back to 0°</button>
        </div>
      </div>

      {done && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${POLAR_LABELS[m]}”`).join(' and ')}.` : missed ? 'No mistake named this time.' : <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: Calc 3, surfaces in 3D.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
