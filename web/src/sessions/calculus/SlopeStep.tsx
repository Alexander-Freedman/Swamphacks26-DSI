import { useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { df, f, fix, hFromSlider, secantSlopeF, tangent } from './math'
import { Chart, Paper } from './Plot'
import { box, fnPath, ix, sx, sy, useWidth } from './frame'

const XMIN = -2
const XMAX = 2
/** Slider position where h counts as "tiny" (h ≈ 0.01). */
export const TINY = 70

export function SlopeStep({ onNext }: { onNext: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const fr = box(w, Math.round(Math.min(380, Math.max(260, w * 0.62))), [-2.4, 2.4], [-1.6, 1.6])
  const [x, setX] = useState(-1.5)
  const [hv, setHv] = useState(10)
  const [reached, setReached] = useState(false)
  const h = hFromSlider(hv)
  const sec = secantSlopeF(x, h)
  const tan = tangent(f, df, x)
  const q = { x: x + h, y: f(x + h) }
  const p = { x, y: f(x) }
  const dragging = useRef(false)

  const setH = (v: number) => {
    setHv(v)
    if (v >= TINY) setReached(true)
  }
  const moveTo = (px: number) => setX(Math.round(Math.min(XMAX, Math.max(XMIN, ix(fr, px))) * 100) / 100)
  const onPointer = (e: RPointerEvent<SVGSVGElement>) => moveTo(e.clientX - e.currentTarget.getBoundingClientRect().left)
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.25 : 0.05
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? step : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -step : 0
    if (e.key === 'Home') setX(XMIN)
    else if (e.key === 'End') setX(XMAX)
    else if (d) setX((v) => Math.round(Math.min(XMAX, Math.max(XMIN, v + d)) * 100) / 100)
    else return
    e.preventDefault()
  }
  const lineAt = (m: number, through: { x: number; y: number }) => ({ x1: sx(fr, fr.x0), y1: sy(fr, through.y + m * (fr.x0 - through.x)), x2: sx(fr, fr.x1), y2: sy(fr, through.y + m * (fr.x1 - through.x)) })
  const gap = Math.abs(sec - tan.m)
  const showLegs = h > 0.15

  return (
    <section className="calc-step">
      <div className="calc-split">
        <div ref={ref} className="calc-card calc-tight calc-chartcard">
          <Chart
            f={fr}
            role="group"
            label="the curve y = x³/3 − x with a draggable point, its secant and its tangent"
            className="calc-drag"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId)
              dragging.current = true
              onPointer(e)
            }}
            onPointerMove={(e) => dragging.current && onPointer(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            {(clip) => (
              <>
                <Paper f={fr} xLabel="x" yLabel="y" />
                <g clipPath={clip}>
                  <path d={fnPath(fr, f)} className="calc-ink calc-curve" />
                  <line {...lineAt(tan.m, p)} className="calc-tangent" />
                  <line {...lineAt(sec, p)} className="calc-secant" />
                  {showLegs && (
                    <>
                      <line x1={sx(fr, p.x)} x2={sx(fr, q.x)} y1={sy(fr, p.y)} y2={sy(fr, p.y)} className="calc-leg" />
                      <line x1={sx(fr, q.x)} x2={sx(fr, q.x)} y1={sy(fr, p.y)} y2={sy(fr, q.y)} className="calc-leg" />
                      <text x={(sx(fr, p.x) + sx(fr, q.x)) / 2} y={sy(fr, p.y) + (q.y >= p.y ? 16 : -7)} className="calc-handlabel" textAnchor="middle">h</text>
                    </>
                  )}
                  <circle cx={sx(fr, q.x)} cy={sy(fr, q.y)} r={6} className="calc-qdot" />
                </g>
                <circle
                  cx={sx(fr, p.x)}
                  cy={sy(fr, p.y)}
                  r={11}
                  className="calc-handle"
                  tabIndex={0}
                  role="slider"
                  aria-label="point on the curve (arrow keys move it)"
                  aria-valuemin={XMIN}
                  aria-valuemax={XMAX}
                  aria-valuenow={x}
                  aria-valuetext={`x = ${fix(x)}, slope ${fix(tan.m)}`}
                  onKeyDown={onKey}
                />
              </>
            )}
          </Chart>
          <div className="calc-legend">
            <span><i className="calc-l pencil" />secant (2 points)</span>
            <span><i className="calc-l ink" />tangent (exact)</span>
          </div>
        </div>

        <div className="calc-side">
          <div className="calc-card">
            <label className="calc-lab" htmlFor="calc-h">
              h <span className="calc-num">= {h < 0.01 ? h.toFixed(3) : fix(h)}</span>
            </label>
            <input id="calc-h" type="range" min={0} max={100} step={1} value={hv} onChange={(e) => setH(+e.target.value)} aria-valuetext={`h = ${h.toFixed(3)}`} />
            <div className="calc-ends"><span>h = 2</span><span>h → 0</span></div>
          </div>
          <div className="calc-readout" aria-live="polite">
            <div className="calc-row"><span className="calc-k">secant</span><b className="calc-num calc-pencil-c">{fix(sec, 3)}</b></div>
            <div className="calc-row"><span className="calc-k">tangent <span className="calc-tag">exact</span></span><b className="calc-big calc-num">{fix(tan.m, 3)}</b></div>
            <div className="calc-row"><span className="calc-k">gap</span><b className="calc-num calc-hl">{fix(gap, 3)}</b></div>
            <div className="calc-gapbar" aria-hidden="true"><i style={{ width: `${Math.min(100, (gap / 3) * 100)}%` }} /></div>
          </div>
          <p className="calc-hand">{reached ? 'the secant became the tangent' : x === -1.5 && hv === 10 ? 'drag the dot · slide h →' : 'keep shrinking h'}</p>
          <button className="ss-btn calc-go" disabled={!reached} onClick={onNext}>Next: sketch the slope →</button>
        </div>
      </div>
    </section>
  )
}
