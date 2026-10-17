import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { biggestGap, classifySketch, coverage, df, f, fix, MISTAKES, resample, X0, X1, xsFor, type Pt, type SketchMistake } from './math'
import { Chart, Paper } from './Plot'
import { box, fnPath, ix, iy, ptsPath, sx, sy, useWidth } from './frame'

const Y0 = -2
const Y1 = 3.5
/** Handles for the points editor (the keyboard way to sketch). */
const HX = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]
const XS = xsFor()
const clampY = (y: number) => Math.min(Y1, Math.max(Y0, y))
const round = (v: number) => Math.round(v * 100) / 100

export type SketchResult = { mistake: SketchMistake; samples: number[] }

export function SketchStep({ result, onReveal, onNext }: { result: SketchResult | null; onReveal: (r: SketchResult) => void; onNext: () => void }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const pad = { l: 38, r: 14 }
  const top = box(w, Math.round(Math.min(220, Math.max(150, w * 0.32))), [-2.3, 2.3], [-1, 1], pad)
  const pf = box(w, Math.round(Math.min(330, Math.max(240, w * 0.5))), [-2.3, 2.3], [Y0, Y1], pad)
  const [pts, setPts] = useState<Pt[]>([])
  const [mode, setMode] = useState<'pen' | 'points'>('pen')
  const [penX, setPenX] = useState<number | null>(null)
  const stroke = useRef<{ old: Pt[]; cur: Pt[] } | null>(null)
  const dragHandle = useRef<number | null>(null)
  const shown = result !== null

  const toPt = (e: RPointerEvent<SVGElement>): Pt => {
    const b = (e.currentTarget.ownerSVGElement ?? (e.currentTarget as SVGSVGElement)).getBoundingClientRect()
    return { x: Math.min(X1, Math.max(X0, ix(pf, e.clientX - b.left))), y: clampY(iy(pf, e.clientY - b.top)) }
  }
  // A new stroke replaces the old sketch only where it overlaps, so you can redraw one part.
  const merge = (old: Pt[], cur: Pt[]) => {
    const lo = Math.min(...cur.map((p) => p.x))
    const hi = Math.max(...cur.map((p) => p.x))
    return [...old.filter((p) => p.x < lo || p.x > hi), ...cur].sort((a, b) => a.x - b.x)
  }

  const toPoints = () => {
    const ys = pts.length ? resample(pts, HX.length) : HX.map(() => 0)
    setPts(HX.map((x, i) => ({ x, y: round(ys[i]) })))
    setMode('points')
  }
  const setHandle = (i: number, y: number) => setPts((a) => a.map((p, k) => (k === i ? { ...p, y: round(clampY(y)) } : p)))
  const onHandleKey = (i: number) => (e: KeyboardEvent<SVGCircleElement>) => {
    const step = e.shiftKey ? 0.5 : 0.1
    if (e.key === 'ArrowUp') setHandle(i, pts[i].y + step)
    else if (e.key === 'ArrowDown') setHandle(i, pts[i].y - step)
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const j = Math.min(HX.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)))
      ;(e.currentTarget.parentNode?.children[j] as SVGElement | undefined)?.focus()
    } else return
    e.preventDefault()
  }

  const cov = coverage(pts)
  const ready = cov >= 0.7
  const samples = useMemo(() => resample(pts), [pts])
  const shownSamples = result?.samples ?? samples
  const worst = result ? biggestGap(result.samples, XS) : null
  const gapPoly = result
    ? XS.map((x, i) => `${sx(pf, x).toFixed(1)},${sy(pf, shownSamples[i]).toFixed(1)}`).join(' ') + ' ' + [...XS].reverse().map((x) => `${sx(pf, x).toFixed(1)},${sy(pf, df(x)).toFixed(1)}`).join(' ')
    : ''
  const guideX = worst?.x ?? penX
  const m = result?.mistake ? MISTAKES[result.mistake] : null
  const sketchPath = result ? ptsPath(pf, XS.map((x, i) => ({ x, y: shownSamples[i] }))) : ptsPath(pf, pts)

  return (
    <section className="calc-step">
      <div ref={ref} className="calc-card calc-tight calc-chartcard">
        <Chart f={top} label="the curve y = x³/3 − x">
          {(clip) => (
            <>
              <Paper f={top} yStep={1} yLabel="f" />
              <g clipPath={clip}>
                {guideX != null && <line x1={sx(top, guideX)} x2={sx(top, guideX)} y1={top.t} y2={top.h - top.b} className="calc-guide" />}
                <path d={fnPath(top, f)} className="calc-ink calc-curve" />
                {worst && (
                  <line
                    x1={sx(top, worst.x - 0.6)}
                    y1={sy(top, f(worst.x) - 0.6 * df(worst.x))}
                    x2={sx(top, worst.x + 0.6)}
                    y2={sy(top, f(worst.x) + 0.6 * df(worst.x))}
                    className="calc-tangent"
                  />
                )}
              </g>
            </>
          )}
        </Chart>
        <Chart
          f={pf}
          role="group"
          label={shown ? "your sketch of the slope, with the real slope drawn over it" : 'drawing pad: draw the slope of the curve above'}
          className={mode === 'pen' && !shown ? 'calc-drawpad' : ''}
          onPointerDown={(e) => {
            if (mode !== 'pen' || shown) return
            e.currentTarget.setPointerCapture?.(e.pointerId)
            const p = toPt(e)
            stroke.current = { old: pts, cur: [p] }
            setPenX(p.x)
          }}
          onPointerMove={(e) => {
            if (dragHandle.current != null) return setHandle(dragHandle.current, toPt(e).y)
            if (!stroke.current) return
            const p = toPt(e)
            stroke.current.cur.push(p)
            setPenX(p.x)
            setPts(merge(stroke.current.old, stroke.current.cur))
          }}
          onPointerUp={() => {
            stroke.current = null
            dragHandle.current = null
            setPenX(null)
          }}
          onPointerCancel={() => {
            stroke.current = null
            dragHandle.current = null
          }}
        >
          {(clip) => (
            <>
              <Paper f={pf} yLabel="slope" />
              <g clipPath={clip}>
                {guideX != null && <line x1={sx(pf, guideX)} x2={sx(pf, guideX)} y1={pf.t} y2={pf.h - pf.b} className="calc-guide" />}
                {result && <polygon points={gapPoly} className="calc-gap" />}
                {pts.length > 1 && <path d={sketchPath} className="calc-pencil" />}
                {result && <path d={fnPath(pf, df, X0, X1)} className="calc-ink calc-truth calc-drawin" pathLength={1} />}
              </g>
              {mode === 'points' && !shown && (
                <g>
                  {pts.map((p, i) => (
                    <circle
                      key={HX[i]}
                      cx={sx(pf, p.x)}
                      cy={sy(pf, p.y)}
                      r={10}
                      className="calc-handle calc-handle-pencil"
                      tabIndex={0}
                      role="slider"
                      aria-label={`slope at x = ${p.x} (up/down arrows)`}
                      aria-valuemin={Y0}
                      aria-valuemax={Y1}
                      aria-valuenow={p.y}
                      onKeyDown={onHandleKey(i)}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.currentTarget.ownerSVGElement?.setPointerCapture?.(e.pointerId)
                        dragHandle.current = i
                      }}
                    />
                  ))}
                </g>
              )}
              {!pts.length && !shown && (
                <text x={(pf.l + pf.w - pf.r) / 2} y={sy(pf, 2.6)} className="calc-handlabel calc-hint" textAnchor="middle">draw left → right ✎</text>
              )}
            </>
          )}
        </Chart>
        <div className="calc-legend">
          <span><i className="calc-l pencil" />your slope</span>
          {shown && <span><i className="calc-l ink" />real slope (exact)</span>}
          {shown && <span><i className="calc-l gap" />the gap</span>}
        </div>
      </div>

      {!shown && (
        <div className="calc-toolbar">
          <span className="calc-seg" role="group" aria-label="sketch with">
            <button aria-pressed={mode === 'pen'} onClick={() => setMode('pen')}>pen</button>
            <button aria-pressed={mode === 'points'} onClick={toPoints}>points (keys)</button>
          </span>
          <button className="calc-mini" onClick={() => (setPts([]), setMode('pen'))} disabled={!pts.length}>clear</button>
          <button className="ss-btn calc-go" disabled={!ready} onClick={() => onReveal({ mistake: classifySketch(samples, XS), samples })}>
            Show the real slope
          </button>
        </div>
      )}
      {!shown && <p className="calc-hand">{ready ? 'ready when you are' : pts.length ? 'keep going across' : 'steep up = high · flat = 0 · going down = below 0'}</p>}

      {result && (
        <>
          <div className="calc-card calc-verdict" role="status">
            {m ? (
              <>
                <div className="calc-k calc-red">your sketch says</div>
                <h3 className="calc-named"><span className="calc-hl">{m.label}</span></h3>
                <p>{m.line}</p>
              </>
            ) : (
              <h3 className="calc-named">✓ That’s the slope.</h3>
            )}
            {worst && worst.gap > 0.3 && (
              <p className="calc-hand">
                biggest gap at x = {fix(worst.x, 1)}: real slope <b className="calc-num">{fix(df(worst.x))}</b>, you drew <b className="calc-num calc-pencil-c">{fix(result.samples[XS.indexOf(worst.x)])}</b>
              </p>
            )}
          </div>
          <button className="ss-btn calc-go" onClick={onNext}>Next: fill the area →</button>
        </>
      )}
    </section>
  )
}
