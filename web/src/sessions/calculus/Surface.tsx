import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { dirOf, fx, fy, fz, type Dir } from './surfaceMath'

// Calc 3, first topic: a surface z = f(x, y) you can turn around, two slices through a point,
// and the partial derivatives read off the slices as ordinary 2D slopes.
// Drawn in plain SVG: a small projection, quads sorted back to front (painter's algorithm).

const R = 3 // the floor runs from −R to R in x and y
const N = 22 // grid cells per side
const W = 520
const H = 360


type View = { yaw: number; pitch: number }

function projector({ yaw, pitch }: View) {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const scale = 62
  return (x: number, y: number, z: number) => {
    const xr = x * cy - y * sy
    const yr = x * sy + y * cy
    return {
      x: W / 2 + scale * xr,
      y: H / 2 + 40 - scale * (z * cp + yr * sp * 0.9),
      depth: yr * cp - z * sp, // bigger = farther back
    }
  }
}

const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

/** The rotating surface with the point, its two slices, and the floor axes. */
export function SurfaceView({ view, setView, x0, y0, showX, showY }: { view: View; setView: (f: (v: View) => View) => void; x0: number; y0: number; showX: boolean; showY: boolean }) {
  const P = projector(view)
  const quads = useMemo(() => {
    const out: { d: string; depth: number; t: number }[] = []
    const step = (2 * R) / N
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const xa = -R + i * step
        const ya = -R + j * step
        const c = [
          [xa, ya],
          [xa + step, ya],
          [xa + step, ya + step],
          [xa, ya + step],
        ].map(([x, y]) => P(x, y, fz(x, y)))
        const zc = fz(xa + step / 2, ya + step / 2)
        out.push({ d: pts(c), depth: c.reduce((s, p) => s + p.depth, 0) / 4, t: zc / 3 })
      }
    return out.sort((a, b) => b.depth - a.depth)
  }, [P])
  const line = (f: (u: number) => [number, number]) =>
    pts(Array.from({ length: 61 }, (_, k) => -R + (2 * R * k) / 60).map((u) => {
      const [x, y] = f(u)
      return P(x, y, fz(x, y))
    }))
  const floor = (x: number, y: number) => P(x, y, 0)
  const p = P(x0, y0, fz(x0, y0))
  const pf = floor(x0, y0)

  const drag = useRef<{ x: number; y: number } | null>(null)
  const down = (e: PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setView((v) => ({ yaw: v.yaw + dx * 0.01, pitch: Math.min(1.35, Math.max(0.1, v.pitch + dy * 0.008)) }))
  }
  const up = () => (drag.current = null)
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const k: Record<string, [number, number]> = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }
    const d = k[e.key]
    if (!d) return
    e.preventDefault()
    setView((v) => ({ yaw: v.yaw + d[0], pitch: Math.min(1.35, Math.max(0.1, v.pitch + d[1])) }))
  }

  return (
    <svg
      className="calc-3d"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      tabIndex={0}
      aria-label={`3D surface z = f(x, y), a hill. Point at x = ${x0.toFixed(1)}, y = ${y0.toFixed(1)}, height ${fz(x0, y0).toFixed(2)}. Drag or use the arrow keys to turn it.`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      {/* the floor and its axes */}
      <polygon className="calc-3d-floor" points={pts([floor(-R, -R), floor(R, -R), floor(R, R), floor(-R, R)])} />
      <line className="calc-3d-axis" x1={floor(-R, 0).x} y1={floor(-R, 0).y} x2={floor(R + 0.6, 0).x} y2={floor(R + 0.6, 0).y} />
      <line className="calc-3d-axis" x1={floor(0, -R).x} y1={floor(0, -R).y} x2={floor(0, R + 0.6).x} y2={floor(0, R + 0.6).y} />
      <text className="calc-3d-lab" x={floor(R + 0.9, 0).x} y={floor(R + 0.9, 0).y}>x</text>
      <text className="calc-3d-lab" x={floor(0, R + 0.9).x} y={floor(0, R + 0.9).y}>y</text>
      {quads.map((q, i) => (
        <polygon key={i} className="calc-3d-quad" points={q.d} style={{ fillOpacity: 0.12 + 0.6 * q.t }} />
      ))}
      {showX && <polyline className="calc-3d-slice sx" points={line((u) => [u, y0])} />}
      {showY && <polyline className="calc-3d-slice sy" points={line((u) => [x0, u])} />}
      <line className="calc-3d-stem" x1={pf.x} y1={pf.y} x2={p.x} y2={p.y} />
      <circle className="calc-3d-foot" cx={pf.x} cy={pf.y} r={4} />
      <circle className="calc-3d-pt" cx={p.x} cy={p.y} r={8} />
    </svg>
  )
}

/** One slice as a flat 2D curve, with the tangent at the point: its slope is the partial derivative. */
export function SliceChart({ along, x0, y0 }: { along: 'x' | 'y'; x0: number; y0: number }) {
  const w = 300
  const h = 130
  const l = 28
  const sx = (u: number) => l + ((u + R) / (2 * R)) * (w - l - 10)
  const sy = (z: number) => h - 22 - (z / 3.2) * (h - 36)
  const g = (u: number) => (along === 'x' ? fz(u, y0) : fz(x0, u))
  const u0 = along === 'x' ? x0 : y0
  const s = along === 'x' ? fx(x0, y0) : fy(x0, y0)
  const curve = Array.from({ length: 61 }, (_, k) => -R + (2 * R * k) / 60).map((u) => `${sx(u).toFixed(1)},${sy(g(u)).toFixed(1)}`).join(' ')
  const t = (u: number) => g(u0) + s * (u - u0)
  const a = u0 - 0.9
  const b = u0 + 0.9
  return (
    <svg className={`calc-slice ${along === 'x' ? 'sx' : 'sy'}`} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`slice along ${along}: slope ${s.toFixed(2)}, ${dirOf(s)}`}>
      <line className="calc-slice-axis" x1={l} y1={sy(0)} x2={w - 10} y2={sy(0)} />
      <text className="calc-3d-lab" x={w - 14} y={sy(0) + 16}>{along}</text>
      <polyline className="calc-slice-curve" points={curve} />
      <line className="calc-slice-tan" x1={sx(a)} y1={sy(t(a))} x2={sx(b)} y2={sy(t(b))} />
      <circle className="calc-3d-pt" cx={sx(u0)} cy={sy(g(u0))} r={6} />
    </svg>
  )
}

/* ---------- the activity ---------- */

const START = { x: 1, y: -1 }
const QS: { along: 'x' | 'y'; ask: string; walk: string }[] = [
  { along: 'x', ask: 'Stand on the dot and walk in the +x direction (y stays the same). Uphill, downhill or flat?', walk: 'toward +x' },
  { along: 'y', ask: 'Now walk in the +y direction instead (x stays the same). Uphill, downhill or flat?', walk: 'toward +y' },
]
const DIRS: Dir[] = ['uphill', 'downhill', 'flat']

export function SurfaceStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [view, setView] = useState<View>({ yaw: -0.6, pitch: 0.55 })
  const [q, setQ] = useState(0) // 0, 1: the two questions; 2: find the flat spot
  const [wrong, setWrong] = useState<Dir[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [pt, setPt] = useState(START)
  const x0 = q < 2 ? START.x : pt.x
  const y0 = q < 2 ? START.y : pt.y
  const flat = q === 2 && Math.abs(fx(x0, y0)) < 0.12 && Math.abs(fy(x0, y0)) < 0.12
  const saved = useRef(false)
  useEffect(() => {
    if (!flat || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: missed ? 'partial-wrong-way' : null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [flat, missed, topic])

  const answer = (d: Dir) => {
    const cur = QS[q]
    const s = cur.along === 'x' ? fx(START.x, START.y) : fy(START.x, START.y)
    if (d === dirOf(s)) {
      setQ((n) => n + 1)
      setWrong([])
      setNote(null)
      return
    }
    setWrong((w) => [...w, d])
    setMissed((m) => m + 1)
    setNote(`Not quite. Turn the hill so you can see the dot, then picture taking a step ${cur.walk}: does the ground under you rise or fall?`)
  }

  return (
    <section className="calc-surface">
      <div className="calc-3d-layout">
        <div className="calc-card calc-tight calc-3d-main">
          <div className="calc-k calc-pad">z = f(x, y) · drag to turn it</div>
          <SurfaceView view={view} setView={setView} x0={x0} y0={y0} showX={q >= 1} showY={q >= 2} />
          <p className="calc-pair">
            dot at x = <b className="calc-num">{x0.toFixed(1)}</b>, y = <b className="calc-num">{y0.toFixed(1)}</b> · height <b className="calc-box calc-num">{fz(x0, y0).toFixed(2)}</b>
          </p>
        </div>
        <div className="calc-3d-side">
          {q < 2 && (
            <div className="calc-card">
              <div className="calc-k">question {q + 1} of 2</div>
              <p className="calc-ask">{QS[q].ask}</p>
              <div className="calc-picks calc-picks-row" role="group" aria-label="uphill, downhill or flat">
                {DIRS.map((d) => (
                  <button key={d} className={'calc-pick' + (wrong.includes(d) ? ' wrong' : '')} disabled={wrong.includes(d)} onClick={() => answer(d)}>
                    {wrong.includes(d) && <span className="calc-mark" aria-hidden="true">✗</span>}
                    {d}
                  </button>
                ))}
              </div>
              {note && <p className="calc-wrong" role="status"><b>✗</b> {note}</p>}
              {q === 1 && !note && (
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> The slice along x is just a 2D curve. Its slope at the dot is the partial derivative ∂f/∂x = {fx(START.x, START.y).toFixed(2)}: negative, so downhill.</span>
                </p>
              )}
            </div>
          )}

          {q === 2 && (
            <div className="calc-card">
              {!flat ? (
                <>
                  <p className="calc-correct" role="status">
                    <span className="calc-check" aria-hidden="true">✓</span>
                    <span><b>Correct!</b> Along y the slope is ∂f/∂y = {fy(START.x, START.y).toFixed(2)}: positive, so uphill. Same point, two directions, two different slopes.</span>
                  </p>
                  <p className="calc-ask">Last one: move the dot to where <b>both</b> slices are flat.</p>
                  <label className="calc-range">
                    <span>x = {pt.x.toFixed(1)}</span>
                    <input type="range" min={-R} max={R} step={0.1} value={pt.x} onChange={(e) => setPt((p) => ({ ...p, x: +e.target.value }))} aria-label="move the dot in x" />
                  </label>
                  <label className="calc-range">
                    <span>y = {pt.y.toFixed(1)}</span>
                    <input type="range" min={-R} max={R} step={0.1} value={pt.y} onChange={(e) => setPt((p) => ({ ...p, y: +e.target.value }))} aria-label="move the dot in y" />
                  </label>
                </>
              ) : (
                <>
                  <p className="calc-correct" role="status">
                    <span className="calc-check" aria-hidden="true">✓</span>
                    <span><b>Correct!</b> Both partial derivatives are 0, so every direction is flat: you’re on top of the hill. That’s how you hunt for highest and lowest points in 3D.</span>
                  </p>
                  <p className="calc-rule">
                    <span><span className="calc-hl">∂f/∂x</span> = slope of the slice along x.</span>
                    <span><span className="calc-hl">∂f/∂y</span> = slope of the slice along y.</span>
                    <span>Both 0 = a flat spot.</span>
                  </p>
                </>
              )}
            </div>
          )}
          <div className="calc-slices">
          {q >= 1 ? (
            <div className="calc-card calc-tight">
              <div className="calc-k calc-pad">slice along x (y = {y0.toFixed(1)})</div>
              <SliceChart along="x" x0={x0} y0={y0} />
              <p className="calc-pair">∂f/∂x = <b className="calc-hl calc-num">{fx(x0, y0).toFixed(2)}</b> · {dirOf(fx(x0, y0))}</p>
            </div>
          ) : (
            <p className="calc-small">The slices show up here as you answer.</p>
          )}
          {q >= 2 && (
            <div className="calc-card calc-tight">
              <div className="calc-k calc-pad">slice along y (x = {x0.toFixed(1)})</div>
              <SliceChart along="y" x0={x0} y0={y0} />
              <p className="calc-pair">∂f/∂y = <b className="calc-hl calc-num">{fy(x0, y0).toFixed(2)}</b> · {dirOf(fy(x0, y0))}</p>
            </div>
          )}
          </div>
        </div>
      </div>
      {flat && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {missed ? 'Caught: “Walking a slice the wrong way”.' : <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: the gradient, the arrow that points straight uphill.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
