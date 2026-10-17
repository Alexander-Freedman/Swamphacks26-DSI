import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { record } from '../../notebook'
import { dirOf, fx, fy, fz, HILL, type Dir, type Surf } from './surfaceMath'

// Calc 3, first topic: a surface z = f(x, y) you can turn around, two slices through a point,
// and the partial derivatives read off the slices as ordinary 2D slopes.
// Drawn in plain SVG: a small projection, quads sorted back to front (painter's algorithm).
// The gradient and volume topics (Gradient.tsx, Volume.tsx) draw on the same stage.

const R = 3 // the hill's floor runs from −R to R in x and y
const N = 22 // grid cells per side
const W = 520
const H = 360

export type View = { yaw: number; pitch: number }
/** Where the scene sits: the floor point in the middle of the picture, pixels per unit, how far down to shift it. */
export type Fit = { cx: number; cy: number; scale: number; lift: number }
const HILL_FIT: Fit = { cx: 0, cy: 0, scale: 62, lift: 40 }

export type Project = (x: number, y: number, z: number) => { x: number; y: number; depth: number }

function projector({ yaw, pitch }: View, { cx, cy: cy0, scale, lift }: Fit): Project {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  return (x: number, y: number, z: number) => {
    const xr = (x - cx) * cy - (y - cy0) * sy
    const yr = (x - cx) * sy + (y - cy0) * cy
    return {
      x: W / 2 + scale * xr,
      y: H / 2 + lift - scale * (z * cp + yr * sp * 0.9),
      depth: yr * cp - z * sp, // bigger = farther back
    }
  }
}

const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

/**
 * The turnable 3D stage: drag or the arrow keys turn it. Draws the floor (the surface's rectangle)
 * and the x and y axes, then whatever `children` draws with the projection it's handed.
 */
export function Scene3D(p: { view: View; setView: (f: (v: View) => View) => void; surf: Surf; fit?: Fit; label: string; children: (P: Project) => ReactNode }) {
  const { view, setView, surf, fit = HILL_FIT, label, children } = p
  const P = projector(view, fit)
  const floor = (x: number, y: number) => P(x, y, 0)
  const { x0, x1, y0, y1 } = surf

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
      aria-label={label}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      {/* the floor and its axes */}
      <polygon className="calc-3d-floor" points={pts([floor(x0, y0), floor(x1, y0), floor(x1, y1), floor(x0, y1)])} />
      <line className="calc-3d-axis" x1={floor(x0, 0).x} y1={floor(x0, 0).y} x2={floor(x1 + 0.6, 0).x} y2={floor(x1 + 0.6, 0).y} />
      <line className="calc-3d-axis" x1={floor(0, y0).x} y1={floor(0, y0).y} x2={floor(0, y1 + 0.6).x} y2={floor(0, y1 + 0.6).y} />
      <text className="calc-3d-lab" x={floor(x1 + 0.9, 0).x} y={floor(x1 + 0.9, 0).y}>x</text>
      <text className="calc-3d-lab" x={floor(0, y1 + 0.9).x} y={floor(0, y1 + 0.9).y}>y</text>
      {children(P)}
    </svg>
  )
}

/** The surface as shaded quads sorted back to front (higher = more yellow). `wire` draws only its grid. */
export function SurfaceMesh({ P, surf, wire = false, n = N }: { P: Project; surf: Surf; wire?: boolean; n?: number }) {
  const sx = (surf.x1 - surf.x0) / n
  const sy = (surf.y1 - surf.y0) / n
  let top = 0
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) top = Math.max(top, surf.z(surf.x0 + i * sx, surf.y0 + j * sy))
  const quads: { d: string; depth: number; t: number }[] = []
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const xa = surf.x0 + i * sx
      const ya = surf.y0 + j * sy
      const c = [
        [xa, ya],
        [xa + sx, ya],
        [xa + sx, ya + sy],
        [xa, ya + sy],
      ].map(([x, y]) => P(x, y, surf.z(x, y)))
      quads.push({ d: pts(c), depth: c.reduce((s, q) => s + q.depth, 0) / 4, t: surf.z(xa + sx / 2, ya + sy / 2) / top })
    }
  quads.sort((a, b) => b.depth - a.depth)
  return (
    <g className={wire ? 'calc-3d-wire' : undefined}>
      {quads.map((q, i) => (
        <polygon key={i} className="calc-3d-quad" points={q.d} style={wire ? undefined : { fillOpacity: 0.12 + 0.6 * q.t }} />
      ))}
    </g>
  )
}

/** An arrow lying flat on the floor from (x, y) along (dx, dy). The head is drawn on the floor too, so it turns with the view. */
export function FloorArrow({ P, x, y, dx, dy, className, label }: { P: Project; x: number; y: number; dx: number; dy: number; className: string; label?: string }) {
  const l = Math.hypot(dx, dy)
  if (l < 0.02) return null
  const ux = dx / l
  const uy = dy / l
  const head = Math.min(0.3, l * 0.45)
  const tx = x + dx
  const ty = y + dy
  const side = (s: number) => P(tx - head * ux - s * head * 0.55 * uy, ty - head * uy + s * head * 0.55 * ux, 0)
  const a = P(x, y, 0)
  const b = P(tx, ty, 0)
  const neck = P(tx - head * ux * 0.8, ty - head * uy * 0.8, 0)
  const lab = P(tx + 0.32 * ux, ty + 0.32 * uy, 0)
  return (
    <g className={'calc-3d-arrow ' + className}>
      <line x1={a.x} y1={a.y} x2={neck.x} y2={neck.y} />
      <polygon points={pts([b, side(1), side(-1)])} />
      {label && <text className="calc-3d-alab" x={lab.x} y={lab.y + 5} textAnchor="middle">{label}</text>}
    </g>
  )
}

/** The rotating surface with the point, its two slices, and the floor axes. `overlay` draws on top (arrows, a trail). */
export function SurfaceView(p: { view: View; setView: (f: (v: View) => View) => void; x0: number; y0: number; showX: boolean; showY: boolean; surf?: Surf; overlay?: (P: Project) => ReactNode }) {
  const { view, setView, x0, y0, showX, showY, surf = HILL, overlay } = p
  const z = surf.z
  return (
    <Scene3D
      view={view}
      setView={setView}
      surf={surf}
      label={`3D surface z = f(x, y), ${surf.name}. Point at x = ${x0.toFixed(1)}, y = ${y0.toFixed(1)}, height ${z(x0, y0).toFixed(2)}. Drag or use the arrow keys to turn it.`}
    >
      {(P) => {
        const line = (f: (u: number) => [number, number], a: number, b: number) =>
          pts(Array.from({ length: 61 }, (_, k) => a + ((b - a) * k) / 60).map((u) => {
            const [x, y] = f(u)
            return P(x, y, z(x, y))
          }))
        const pt = P(x0, y0, z(x0, y0))
        const pf = P(x0, y0, 0)
        return (
          <>
            <SurfaceMesh P={P} surf={surf} />
            {showX && <polyline className="calc-3d-slice sx" points={line((u) => [u, y0], surf.x0, surf.x1)} />}
            {showY && <polyline className="calc-3d-slice sy" points={line((u) => [x0, u], surf.y0, surf.y1)} />}
            <line className="calc-3d-stem" x1={pf.x} y1={pf.y} x2={pt.x} y2={pt.y} />
            <circle className="calc-3d-foot" cx={pf.x} cy={pf.y} r={4} />
            {overlay?.(P)}
            <circle className="calc-3d-pt" cx={pt.x} cy={pt.y} r={8} />
          </>
        )
      }}
    </Scene3D>
  )
}

/** One slice as a flat 2D curve, with the tangent at the point: its slope is the partial derivative. */
export function SliceChart({ along, x0, y0, surf = HILL }: { along: 'x' | 'y'; x0: number; y0: number; surf?: Surf }) {
  const w = 260
  const h = 150
  const l = 28
  const [lo, hi] = along === 'x' ? [surf.x0, surf.x1] : [surf.y0, surf.y1]
  const sx = (u: number) => l + ((u - lo) / (hi - lo)) * (w - l - 10)
  const sy = (z: number) => h - 22 - (z / 3.2) * (h - 36)
  const g = (u: number) => (along === 'x' ? surf.z(u, y0) : surf.z(x0, u))
  const u0 = along === 'x' ? x0 : y0
  const s = along === 'x' ? surf.zx(x0, y0) : surf.zy(x0, y0)
  const curve = Array.from({ length: 61 }, (_, k) => lo + ((hi - lo) * k) / 60).map((u) => `${sx(u).toFixed(1)},${sy(g(u)).toFixed(1)}`).join(' ')
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
      <div className="calc-two calc-3d-wrap">
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">z = f(x, y) · drag to turn it</div>
          <SurfaceView view={view} setView={setView} x0={x0} y0={y0} showX={q >= 1} showY={q >= 2} />
          <p className="calc-pair">
            dot at x = <b className="calc-num">{x0.toFixed(1)}</b>, y = <b className="calc-num">{y0.toFixed(1)}</b> · height <b className="calc-box calc-num">{fz(x0, y0).toFixed(2)}</b>
          </p>
        </div>
        <div className="calc-side calc-slices">
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
