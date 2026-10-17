import { useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { A, B, BOX, exactArea, fix, g, MISTAKES, rects, riemann, type AreaMistake, type Rule } from './math'
import { Chart, Paper } from './Plot'
import { box, fnPath, sx, sy, useWidth } from './frame'

/** The guess bar runs 0 → the box (8). */
const BAR_MAX = BOX
/** n you need to reach before moving on. */
export const ENOUGH = 30
const RULES: Rule[] = ['left', 'mid', 'right']

export function AreaStep({ guess, setGuess, mistake, onFill, onNext }: {
  guess: number | null
  setGuess: (v: number) => void
  mistake: AreaMistake | undefined
  onFill: () => void
  onNext: () => void
}) {
  const [ref, w] = useWidth<HTMLDivElement>(560)
  const fr = box(w, Math.round(Math.min(360, Math.max(250, w * 0.62))), [-0.15, 2.2], [0, 4.4], { l: 30 })
  const filled = mistake !== undefined
  const [n, setN] = useState(4)
  const [rule, setRule] = useState<Rule>('left')
  const [maxN, setMaxN] = useState(4)
  const exact = exactArea()
  const sum = riemann(g, A, B, n, rule)
  const err = sum - exact
  const rs = filled ? rects(g, A, B, n, rule) : []

  // the gap between each rectangle's top and the curve, in marker
  const gapPath = rs
    .map((r) => {
      const steps = 8
      const curve = Array.from({ length: steps + 1 }, (_, k) => {
        const x = r.x + r.w - (r.w * k) / steps
        return `L${sx(fr, x).toFixed(1)} ${sy(fr, g(x)).toFixed(1)}`
      }).join('')
      return `M${sx(fr, r.x).toFixed(1)} ${sy(fr, r.h).toFixed(1)}L${sx(fr, r.x + r.w).toFixed(1)} ${sy(fr, r.h).toFixed(1)}${curve}Z`
    })
    .join('')
  const areaPath = `${fnPath(fr, g, A, B)}L${sx(fr, B)} ${sy(fr, 0)}L${sx(fr, A)} ${sy(fr, 0)}Z`

  return (
    <section className="calc-step">
      <div className="calc-split calc-split-area">
        <div ref={ref} className="calc-card calc-tight calc-chartcard">
          <Chart f={fr} label={filled ? `area under y = x² from 0 to 2, filled with ${n} ${rule} rectangles` : 'the curve y = x² from 0 to 2 inside its box'}>
            {(clip) => (
              <>
                <Paper f={fr} xLabel="x" yLabel="y = x²" />
                <g clipPath={clip}>
                  <rect x={sx(fr, A)} y={sy(fr, BOX / 2)} width={sx(fr, B) - sx(fr, A)} height={sy(fr, 0) - sy(fr, BOX / 2)} className="calc-boxoutline" />
                  {!filled && <path d={areaPath} className="calc-areafill" />}
                  {rs.map((r, i) => (
                    <rect key={i} x={sx(fr, r.x)} y={sy(fr, r.h)} width={Math.max(0.5, sx(fr, r.x + r.w) - sx(fr, r.x))} height={sy(fr, 0) - sy(fr, r.h)} className={'calc-rect' + (n > 40 ? ' thin' : '')} />
                  ))}
                  {filled && <path d={gapPath} className="calc-gap" fillRule="evenodd" />}
                  <path d={fnPath(fr, g, fr.x0, fr.x1)} className="calc-ink calc-curve" />
                </g>
                <text x={sx(fr, B) - 4} y={sy(fr, BOX / 2) + 16} className="calc-handlabel" textAnchor="end">box = {BOX}</text>
              </>
            )}
          </Chart>
          {filled && (
            <div className="calc-legend">
              <span><i className="calc-l rect" />rectangles</span>
              <span><i className="calc-l ink" />curve</span>
              <span><i className="calc-l gap" />the gap</span>
            </div>
          )}
        </div>

        <div className="calc-side">
          <div className="calc-areabox">
            <GuessBar guess={guess} setGuess={setGuess} locked={filled} sum={filled ? sum : null} exact={filled ? exact : null} />
            <div className="calc-areaside">
              {!filled ? (
                <>
                  <p className="calc-k">your area</p>
                  <p className="calc-guessval" aria-live="polite">{guess == null ? '?' : fix(guess, 1)}</p>
                  <p className="calc-hand">drag the line on the bar</p>
                  <button className="ss-btn calc-go" disabled={guess == null} onClick={onFill}>Fill it with rectangles</button>
                </>
              ) : (
                <div className="calc-readout" aria-live="polite">
                  <div className="calc-row"><span className="calc-k">you</span><b className="calc-num calc-pencil-c">{fix(guess ?? 0, 1)}</b></div>
                  <div className="calc-row"><span className="calc-k">{n} rects</span><b className="calc-num">{fix(sum, 4)}</b></div>
                  <div className="calc-row"><span className="calc-k">exact <span className="calc-tag">8/3</span></span><b className="calc-big calc-num">{fix(exact, 4)}</b></div>
                  <div className="calc-row"><span className="calc-k">error</span><b className="calc-num calc-hl">{err >= 0 ? '+' : '−'}{fix(Math.abs(err), 4)}</b></div>
                  <div className="calc-gapbar" aria-hidden="true"><i style={{ width: `${Math.min(100, (Math.abs(err) / 5.4) * 100)}%` }} /></div>
                </div>
              )}
            </div>
          </div>
          {filled && (
            <div className="calc-card">
              <label className="calc-lab" htmlFor="calc-n">rectangles <span className="calc-num">n = {n}</span></label>
              <input
                id="calc-n"
                type="range"
                min={1}
                max={100}
                step={1}
                value={n}
                onChange={(e) => {
                  setN(+e.target.value)
                  setMaxN((m) => Math.max(m, +e.target.value))
                }}
              />
              <div className="calc-ends"><span>1</span><span>100</span></div>
              <span className="calc-seg calc-mt" role="group" aria-label="height from">
                {RULES.map((r) => (
                  <button key={r} aria-pressed={rule === r} onClick={() => setRule(r)}>{r}</button>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>

      {filled && (
        <>
          <div className="calc-card calc-verdict" role="status">
            {mistake ? (
              <>
                <div className="calc-k calc-red">your guess says</div>
                <h3 className="calc-named"><span className="calc-hl">{MISTAKES[mistake].label}</span></h3>
                <p>{MISTAKES[mistake].line}</p>
              </>
            ) : (
              <h3 className="calc-named">{Math.abs((guess ?? 0) - exact) <= 0.15 * exact ? '✓ Close to the real area.' : 'Off, but no single pattern to name.'}</h3>
            )}
            <p className="calc-hand">{maxN >= ENOUGH ? 'more rectangles, smaller gap: the limit is the exact area' : `slide n past ${ENOUGH}`}</p>
          </div>
          <button className="ss-btn calc-go" disabled={maxN < ENOUGH} onClick={onNext}>Next: a moving car →</button>
        </>
      )}
    </section>
  )
}

/** A tall bar from 0 to the box (8). You drag a pencil line to your area; after filling, the rectangles' sum rises in it next to the exact line. */
function GuessBar({ guess, setGuess, locked, sum, exact }: { guess: number | null; setGuess: (v: number) => void; locked: boolean; sum: number | null; exact: number | null }) {
  const H = 240
  const T = 12
  const y = (v: number) => T + (1 - v / BAR_MAX) * (H - 2 * T)
  const drag = useRef(false)
  const from = (e: RPointerEvent<SVGSVGElement>) => {
    const b = e.currentTarget.getBoundingClientRect()
    const v = ((H - T - (e.clientY - b.top)) / (H - 2 * T)) * BAR_MAX
    setGuess(Math.round(Math.min(BAR_MAX, Math.max(0, v)) * 10) / 10)
  }
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 0.1
    const cur = guess ?? BAR_MAX / 2
    const d = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? step : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -step : 0
    if (!d) return
    e.preventDefault()
    setGuess(Math.round(Math.min(BAR_MAX, Math.max(0, cur + d)) * 10) / 10)
  }
  return (
    <svg
      width={92}
      height={H}
      viewBox={`0 0 92 ${H}`}
      className={'calc-bar' + (locked ? '' : ' calc-drag')}
      role="group"
      aria-label="area bar from 0 to 8"
      onPointerDown={(e) => {
        if (locked) return
        e.currentTarget.setPointerCapture?.(e.pointerId)
        drag.current = true
        from(e)
      }}
      onPointerMove={(e) => drag.current && from(e)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
    >
      <rect x={30} y={T} width={30} height={H - 2 * T} className="calc-barbg" />
      {[0, 2, 4, 6, 8].map((v) => (
        <g key={v}>
          <line x1={24} x2={30} y1={y(v)} y2={y(v)} className="calc-axis" />
          <text x={20} y={y(v) + 4} className="calc-tick" textAnchor="end">{v}</text>
        </g>
      ))}
      {sum != null && <rect x={32} y={y(Math.min(BAR_MAX, sum))} width={26} height={y(0) - y(Math.min(BAR_MAX, sum))} className="calc-rect" />}
      {exact != null && sum != null && <rect x={60} y={Math.min(y(sum), y(exact))} width={8} height={Math.abs(y(sum) - y(exact))} className="calc-gap" />}
      {exact != null && <line x1={26} x2={72} y1={y(exact)} y2={y(exact)} className="calc-ink calc-exactline" />}
      {guess != null && <line x1={22} x2={68} y1={y(guess)} y2={y(guess)} className="calc-pencil" />}
      <rect
        x={20}
        y={y(guess ?? BAR_MAX / 2) - 10}
        width={52}
        height={20}
        className={'calc-barhandle' + (guess == null ? ' idle' : '')}
        tabIndex={locked ? -1 : 0}
        role="slider"
        aria-label="your guess for the area (arrow keys)"
        aria-valuemin={0}
        aria-valuemax={BAR_MAX}
        aria-valuenow={guess ?? undefined}
        aria-disabled={locked}
        onKeyDown={locked ? undefined : onKey}
      />
      {exact != null && <text x={74} y={y(exact) + 4} className="calc-tick calc-tick-ink">8/3</text>}
    </svg>
  )
}
