// Stage 2, anchor: one true fact, then a prediction from it. Curve topics predict ON the graph (a pencil
// mark at the year asked about) and then see the real curve next to the mark. One retry on a follow-up.
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Curve } from '../components/Curve'
import { useNarrow } from '../components/useNarrow'
import { curveFn } from '../truth'
import type { AnchorRequest, AnchorResponse, StageProps } from './types'
import { useGraded } from './useGraded'
import { curveSpec, offlineLine, type CurveSpec } from './learn-guess-anchor'
import './learn-guess-anchor.css'

const H = 280
const PAD = { l: 52, r: 20, t: 30, b: 44 }

const money = (unit: string | undefined, v: number) =>
  unit === '$' ? `$${Math.round(v).toLocaleString('en-US')}` : `${Number(v.toPrecision(4)).toLocaleString('en-US')}${unit ? ` ${unit}` : ''}`

/** Empty axes with a pencil mark you drag up and down at the x the question asks about. */
function PredictPad({
  spec,
  yMax,
  value,
  onChange,
}: {
  spec: CurveSpec
  yMax: number
  value: number | null
  onChange: (v: number) => void
}) {
  const narrow = useNarrow()
  const W = narrow ? 360 : 640
  const c = spec.curve
  const s = spec.prediction?.slider
  const unit = s?.unit ?? spec.variables?.[0]?.unit
  const lo = 0
  const step = s?.step ?? yMax / 100
  const askX = c.ask_x as number
  const xAt = (x: number) => PAD.l + ((x - c.x_min) / (c.x_max - c.x_min)) * (W - PAD.l - PAD.r)
  const yAt = (y: number) => H - PAD.b - ((y - lo) / (yMax - lo)) * (H - PAD.t - PAD.b)
  const svg = useRef<SVGSVGElement>(null)
  const snap = (y: number) => Math.min(yMax, Math.max(lo, Math.round(y / step) * step))
  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current?.getBoundingClientRect()
    if (!r || r.height === 0) return
    const py = ((e.clientY - r.top) / r.height) * H
    onChange(snap(lo + ((H - PAD.b - py) / (H - PAD.t - PAD.b)) * (yMax - lo)))
  }
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const big = step * 10
    const d = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: big, PageDown: -big }[e.key]
    if (d === undefined) return
    e.preventDefault()
    onChange(snap((value ?? s?.min ?? lo) + d))
  }
  const ax = xAt(askX)
  return (
    <svg
      ref={svg}
      className="lga-pad"
      viewBox={`0 0 ${W} ${H}`}
      role="slider"
      tabIndex={0}
      aria-label={`your prediction at ${c.x_label} ${askX}`}
      aria-valuemin={lo}
      aria-valuemax={yMax}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value == null ? 'not placed yet' : money(unit, value)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        fromPointer(e)
      }}
      onPointerMove={(e) => e.buttons && fromPointer(e)}
      onKeyDown={key}
    >
      <line className="lga-axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
      <line className="lga-axis" x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} />
      <text className="lga-tick" x={PAD.l} y={PAD.t - 14}>{c.y_label}</text>
      <text className="lga-tick" x={(W + PAD.l) / 2} y={H - 4} textAnchor="middle">{c.x_label}</text>
      <text className="lga-tick" x={xAt(c.x_min)} y={H - PAD.b + 20} textAnchor="middle">{c.x_min}</text>
      <text className="lga-tick" x={ax} y={H - PAD.b + 20} textAnchor="middle">{askX}</text>
      <text className="lga-tick" x={xAt(c.x_max)} y={H - PAD.b + 20} textAnchor="middle">{c.x_max}</text>
      <line className="lga-ask" x1={ax} x2={ax} y1={PAD.t} y2={H - PAD.b} />
      {value == null ? (
        <text className="lga-hint" x={ax} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle">drag here</text>
      ) : (
        <g className="lga-mark">
          <line x1={PAD.l} x2={ax} y1={yAt(value)} y2={yAt(value)} />
          <circle cx={ax} cy={yAt(value)} r={8} />
          <text x={ax > W / 2 ? ax - 14 : ax + 14} y={yAt(value) - 10} textAnchor={ax > W / 2 ? 'end' : 'start'}>
            {money(unit, value)}
          </text>
        </g>
      )}
    </svg>
  )
}

function Verdict({ r }: { r: AnchorResponse }) {
  const ok = r.verdict === 'demonstrated'
  return (
    <div className="lga-result" role="status">
      <span className={`lga-stamp ${ok ? 'is-ok' : 'is-not'}`}>{ok ? 'SPOT ON' : 'NOT YET'}</span>
      <p className="lga-line">{r.feedback}</p>
      {r.offline && <p className="learn-offline">offline check</p>}
    </div>
  )
}

export function AnchorScreen({ topic, state, update, next, api }: StageProps) {
  const call = useCallback((b: AnchorRequest) => api.anchor(topic.slug, b), [api, topic.slug])
  const { run, busy, offline } = useGraded(call)
  const spec = useMemo(() => curveSpec(topic), [topic])
  const knob = spec?.curve.knob ?? null
  const baseKnobs = useMemo(() => {
    const k: Record<string, number> = {}
    for (const v of spec?.variables ?? []) k[v.name] = v.value
    if (knob) k[knob.param] = knob.default
    return k
  }, [spec, knob])
  const fDefault = useMemo(() => {
    if (!spec) return null
    try {
      return curveFn(spec.curve, baseKnobs)
    } catch {
      return null
    }
  }, [spec, baseKnobs])
  const yMax = useMemo(() => {
    if (!spec || !fDefault) return 1
    const n = 80
    let m = spec.prediction?.slider?.max ?? 0
    for (let i = 0; i <= n; i++) {
      const y = fDefault(spec.curve.x_min + ((spec.curve.x_max - spec.curve.x_min) * i) / n)
      if (Number.isFinite(y)) m = Math.max(m, y)
    }
    return m > 0 ? m : 1
  }, [spec, fDefault])
  const onCurve = !!(spec && fDefault)

  const [pred, setPred] = useState<number | null>(null)
  const [phase, setPhase] = useState<'ask' | 'retry' | 'done'>(state.anchorResult ? 'done' : 'ask')
  const [first, setFirst] = useState<AnchorResponse | null>(state.anchorResult)
  const [second, setSecond] = useState<AnchorResponse | null>(null)
  const [retry, setRetry] = useState('')
  const [rate, setRate] = useState(knob?.default ?? 0)
  const answer = state.anchorAnswer.trim()
  const unit = spec?.prediction?.slider?.unit ?? spec?.variables?.[0]?.unit

  const submit = async () => {
    if (!answer || busy || (onCurve && pred == null)) return
    const body = onCurve && pred != null ? `At ${spec!.curve.x_label} ${spec!.curve.ask_x} I predict about ${money(unit, pred)}. ${answer}` : answer
    const r = await run({ answer: body })
    update({ anchorResult: r })
    setFirst(r)
    setPhase(r && r.verdict === 'unresolved' && r.followUpQuestion ? 'retry' : 'done')
  }
  const submitRetry = async () => {
    const t = retry.trim()
    if (!t || busy) return
    const r = await run({ answer: `${answer} Then: ${t}` })
    if (r) update({ anchorResult: r })
    setSecond(r)
    setPhase('done')
  }

  const fNow = useMemo(() => {
    if (!spec || !fDefault) return null
    if (!knob) return fDefault
    try {
      return curveFn(spec.curve, { ...baseKnobs, [knob.param]: rate })
    } catch {
      return fDefault
    }
  }, [spec, fDefault, knob, baseKnobs, rate])
  const askX = spec?.curve.ask_x ?? 0
  const truthY = fNow ? fNow(askX) : null

  return (
    <section className="learn-step lga" aria-label="anchor">
      <p className="learn-instruction">Read the one fact, then predict.</p>
      <div className="lga-fact">
        <span className="lga-fact-k">a true fact</span>
        <p>{topic.rubric.anchorDescription}</p>
      </div>
      <p className="lga-q" id="lga-anchor-q">{topic.rubric.anchorPrompt}</p>

      {onCurve && phase !== 'done' && (
        <div className="lga-curve">
          <p className="lga-sub">
            {spec!.prediction?.prompt ? `${spec!.prediction.prompt} ` : ''}Drag your pencil mark to {spec!.curve.x_label} {askX}.
          </p>
          <PredictPad spec={spec!} yMax={yMax} value={pred} onChange={setPred} />
        </div>
      )}

      <textarea
        className="lga-pencil"
        aria-label="anchor answer"
        aria-describedby="lga-anchor-q"
        rows={2}
        maxLength={400}
        placeholder="one line, your own words"
        value={state.anchorAnswer}
        readOnly={phase !== 'ask'}
        onChange={(e) => update({ anchorAnswer: e.target.value })}
      />

      {first && <Verdict r={first} />}

      {phase === 'retry' && first?.followUpQuestion && (
        <div className="lga-retry">
          <p className="lga-q" id="lga-follow">{first.followUpQuestion}</p>
          <textarea
            className="lga-pencil"
            aria-label="follow-up answer"
            aria-describedby="lga-follow"
            rows={2}
            maxLength={400}
            value={retry}
            onChange={(e) => setRetry(e.target.value)}
          />
        </div>
      )}
      {second && <Verdict r={second} />}

      {busy && <p className="learn-thinking" role="status">thinking…</p>}
      {offline && <p className="learn-offline" role="status">{offlineLine(offline, 'Your answer is saved; keep going.')}</p>}

      {onCurve && phase === 'done' && fNow && truthY != null && (
        <div className="lga-curve">
          <Curve
            t={spec!.curve}
            f={fNow}
            guess={pred}
            point={{ x: askX, y: truthY, axis: 'y' }}
            pointLabel={money(unit, truthY)}
            mark={askX}
          />
          {knob && (
            <label className="lga-knob">
              <span>{knob.label}: {rate}</span>
              <input type="range" min={knob.min} max={knob.max} step={knob.step} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </label>
          )}
        </div>
      )}

      {phase === 'ask' && (
        <button onClick={submit} disabled={busy || !answer || (onCurve && pred == null)}>Submit</button>
      )}
      {phase === 'retry' && (
        <div className="lga-row">
          <button onClick={submitRetry} disabled={busy || !retry.trim()}>Try again</button>
          <button className="lga-quiet" onClick={() => setPhase('done')} disabled={busy}>Skip</button>
        </div>
      )}
      {phase === 'done' && <button onClick={next}>Next</button>}
    </section>
  )
}
