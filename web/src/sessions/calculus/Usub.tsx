import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { pathOf, pathThrough, reducedMotion, sx, sy, useWidth, type Box } from './plot'
import { A, baseWidth, EXACT, morphHeight, NSTRIPS, peak, readStretch, simple, strips, stripSum, U1, USUB_LABELS, type Stretch, type UsubMistake } from './usubMath'

// Calc 2, u-substitution: the messy picture (2x·cos(x²) over x) on top, the simple one (cos(u) over u)
// below, rubber bands from each x to its u = x². Predict what stretching the axis does to the area,
// then drag the stretch and watch the top picture turn into the bottom one with the same area.

const T_MAX = 100 // slider steps

/** Both pictures on one x-scale, so at full stretch the top one lands exactly on the bottom one. */
function UsubChart({ w, t, label }: { w: number; t: number; label: string }) {
  const phone = w < 480
  const ph = phone ? 120 : 150
  const gapH = 54 // room for the rubber bands
  const top: Box = { l: 34, t: 16, w: w - 46, h: ph, x0: 0, x1: 1.7, y0: 0, y1: 1.45 }
  const bot: Box = { ...top, t: top.t + ph + gapH }
  const h = bot.t + bot.h + 24
  const n = 120
  const xs = Array.from({ length: n + 1 }, (_, i) => (A * i) / n)
  const done = t >= 1
  const base = baseWidth(t)
  const ticks = [0, 0.5, 1]
  const bands = Array.from({ length: NSTRIPS + 1 }, (_, i) => (A * i) / NSTRIPS)
  return (
    <svg className="calc-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {[top, bot].map((b, k) => (
        <g key={k}>
          <g className="calc-grid calc-grid-strong">
            {ticks.map((x) => <line key={'x' + x} x1={sx(b, x)} x2={sx(b, x)} y1={b.t} y2={b.t + b.h} />)}
            {[0.5, 1].map((y) => <line key={'y' + y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />)}
          </g>
          <rect className="calc-frame" x={b.l} y={b.t} width={b.w} height={b.h} />
          {ticks.map((x) => <text key={x} className="calc-axis" x={sx(b, x)} y={b.t + b.h + 15} textAnchor="middle">{x}</text>)}
          <text className="calc-axis" x={b.l - 6} y={sy(b, 1) + 4} textAnchor="end">1</text>
        </g>
      ))}

      {/* top: the strips, each keeping its area as the axis stretches, then the curve over them */}
      {strips(t).map(([w0, sw, sh], i) => (
        <rect key={i} className={'calc-usub-strip' + (i % 2 ? ' alt' : '')} x={sx(top, w0)} y={sy(top, sh)} width={Math.max(0.5, sx(top, w0 + sw) - sx(top, w0))} height={sy(top, 0) - sy(top, sh)} />
      ))}
      <path className="calc-ink" d={pathThrough(top, xs.map((x) => Math.pow(x, 1 + t)), xs.map((x) => morphHeight(x, t)))} />
      <line className="calc-edge" x1={sx(top, base)} x2={sx(top, base)} y1={sy(top, 0)} y2={sy(top, morphHeight(A, t)) - 4} />
      <text className="calc-exactlab" x={sx(top, base)} y={top.t + top.h + 15} textAnchor="middle">{base.toFixed(2)}</text>
      <text className="calc-ptitle" x={top.l + 6} y={top.t + 15}>{t <= 0 ? 'y = 2x·cos(x²)' : done ? 'y = cos(u)' : 'stretching…'}</text>
      <text className="calc-sidelab" x={top.l + top.w - 6} y={top.t + 15} textAnchor="end">{t <= 0 ? 'x' : done ? 'u' : 'x → u'}</text>

      {/* the rubber bands: each x on the top axis to its u = x² on the bottom one; straight once the stretch is done */}
      <g className={'calc-usub-bands' + (done ? ' done' : '')}>
        {bands.map((x) => (
          <line key={x} x1={sx(top, Math.pow(x, 1 + t))} y1={top.t + top.h + 18} x2={sx(bot, x * x)} y2={bot.t - 3} />
        ))}
      </g>
      <text className="calc-note" x={sx(top, 1.7) - 2} y={top.t + top.h + gapH / 2 + 4} textAnchor="end">u = x²</text>

      {/* bottom: the simple picture, an outline until the stretch lands on it */}
      {done && <path className="calc-areafill" d={`${pathOf(bot, simple, 0, U1, 80)}L${sx(bot, U1)} ${sy(bot, 0)}L${sx(bot, 0)} ${sy(bot, 0)}Z`} />}
      <path className={done ? 'calc-ink' : 'calc-under'} d={pathOf(bot, simple, 0, U1, 80)} />
      <line className="calc-edge" x1={sx(bot, U1)} x2={sx(bot, U1)} y1={sy(bot, 0)} y2={sy(bot, simple(U1)) - 2} />
      <text className="calc-exactlab" x={sx(bot, U1)} y={bot.t + bot.h + 15} textAnchor="middle">π/2</text>
      <text className="calc-ptitle" x={bot.l + 6} y={bot.t + 15}>y = cos(u)</text>
      <text className="calc-sidelab" x={bot.l + bot.w - 6} y={bot.t + 15} textAnchor="end">u</text>
    </svg>
  )
}

const PICKS: { id: Stretch; text: string; why: string }[] = [
  { id: 'bigger', text: 'Bigger: the base gets wider', why: 'The base does get wider, from 1.25 to 1.57, but look at the curve: where a strip gets wider, it gets shorter by exactly the same factor. That factor is the 2x in du = 2x dx.' },
  { id: 'same', text: 'The same', why: '' },
  { id: 'smaller', text: 'Smaller: the curve gets lower', why: 'The peak does come down, but every strip that gets shorter also gets wider by the same factor, 2x. That is what du = 2x dx says. Nothing is lost.' },
]

export function UsubStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const [phase, setPhase] = useState<'predict' | 'stretch'>('predict')
  const [wrong, setWrong] = useState<Stretch[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<UsubMistake[]>([])
  const [step, setStep] = useState(0) // 0..T_MAX
  const [reached, setReached] = useState(false) // the stretch has been taken all the way once
  const t = step / T_MAX
  const timer = useRef<number | null>(null)
  useEffect(() => () => void (timer.current && cancelAnimationFrame(timer.current)), [])
  const setT = (k: number) => {
    setStep(k)
    if (k >= T_MAX) setReached(true)
  }
  const animate = () => {
    if (timer.current) cancelAnimationFrame(timer.current)
    if (reducedMotion()) return setT(T_MAX)
    const t0 = performance.now()
    const from = step
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 2200)
      setT(Math.round(from + (T_MAX - from) * p))
      if (p < 1) timer.current = requestAnimationFrame(tick)
    }
    timer.current = requestAnimationFrame(tick)
  }

  const pick = (c: (typeof PICKS)[number]) => {
    const m = readStretch(c.id)
    if (!m) {
      setPhase('stretch')
      setNote(null)
      return
    }
    setWrong((ws) => [...ws, c.id])
    setMissed((k) => k + 1)
    setCaught((cs) => (cs.includes(m) ? cs : [...cs, m]))
    setNote(c.why)
  }

  const done = reached
  const mastered = done && missed === 0
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered, calcTopic: topic })
  }, [done, caught, mastered, topic])

  const sum = stripSum(t)
  return (
    <section>
      <div className="calc-split">
        <div className="calc-card calc-tight calc-main">
          <div className="calc-k calc-pad">x on top, u = x² below · the lines show where each x goes</div>
          <div ref={ref}>
            <UsubChart w={w} t={t} label={`Two pictures: 2x·cos(x²) over x from 0 to ${A.toFixed(2)} on top, cos(u) over u from 0 to π/2 below, with lines from each x to u = x². The top one is stretched ${Math.round(t * 100)}% of the way into the bottom one; its area is ${sum.toFixed(3)}.`} />
          </div>
          <div className="calc-legend">
            <span><i className="calc-l rect" />the strips, each keeping its area</span>
            <span><i className="calc-l ink" />the curve</span>
          </div>
        </div>
        <div className="calc-side">
          <div className="calc-card calc-readout" aria-live="polite">
            <div className="calc-tag">area under the top curve</div>
            <div className="calc-big">{sum.toFixed(3)}</div>
            <div className="calc-sub">
              base from 0 to <b className="calc-truthnum">{baseWidth(t).toFixed(2)}</b> · peak <b className="calc-truthnum">{peak(t).toFixed(2)}</b>
            </div>
          </div>
          {phase === 'stretch' && (
            <div className="calc-card calc-controls">
              <label className="calc-lab" htmlFor="calc-usub-t">
                Stretch the axis: <span className="calc-num">{Math.round(t * 100)}%</span>
              </label>
              <input id="calc-usub-t" type="range" min={0} max={T_MAX} value={step} onChange={(e) => setT(+e.target.value)} />
              <div className="calc-ends"><span>x</span><span>u = x²</span></div>
              {!done && (
                <div className="calc-row calc-start">
                  <button className="calc-btn calc-ghost calc-sm" onClick={animate}>stretch it for me</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {phase === 'predict' && (
        <div className="calc-card">
          <div className="calc-k">predict</div>
          <p className="calc-ask">
            The top area is {EXACT.toFixed(3)}. Substituting u = x² slides every x along a line to its u, stretching the picture with it until the curve is cos(u). After the stretch, is the area under the top curve bigger, smaller or the same?
          </p>
          <div className="calc-picks" role="group" aria-label="bigger, smaller or the same">
            {PICKS.map((c) => (
              <button key={c.id} className={'calc-pick' + (wrong.includes(c.id) ? ' wrong' : '')} disabled={wrong.includes(c.id)} onClick={() => pick(c)}>
                {wrong.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                {c.text}
              </button>
            ))}
          </div>
          {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
        </div>
      )}

      {phase === 'stretch' && (
        <div className="calc-card">
          <p className="calc-correct" role="status">
            <span className="calc-check" aria-hidden="true">✓</span>
            <span>
              <b>Correct!</b> The area stays {EXACT.toFixed(3)}. {done ? 'The top picture is now exactly the bottom one: cos(u) from 0 to π/2.' : 'Drag the slider (or press the button) to stretch the x-axis into the u-axis and watch the number not move.'}
            </span>
          </p>
          {done && (
            <p className="calc-rule">
              <span>Each strip got <span className="calc-hl">wider by du/dx = 2x</span> and <span className="calc-hl">shorter by the same 2x</span>: same area.</span>
              <span className="calc-num">∫₀^{A.toFixed(2)} 2x·cos(x²) dx = ∫₀^(π/2) cos(u) du = sin(π/2) − sin(0) = 1</span>
              <span>Substitution never changes an area. It only changes the axis you measure it on.</span>
            </p>
          )}
        </div>
      )}

      {done && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${USUB_LABELS[m]}”`).join(' and ')}.` : null}{' '}
            {mastered && <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: the area trapped between two curves.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
