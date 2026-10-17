import { useRef, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { A, B, exactArea, f, F, fPrime, GUESS_MAX, ONE_RECT, rects, type Rule } from './math'
import { clamp, ix, local, pathOf, sx, sy, type Box } from './plot'

/* ---------- the area under f, filled with n rectangles ---------- */

export function AreaChart({ w, n, rule, label }: { w: number; n: number; rule: Rule; label: string }) {
  const phone = w < 480
  const b: Box = { l: 30, t: 14, w: w - 40, h: phone ? 200 : 240, x0: 0, x1: 4, y0: 0, y1: 3.6 }
  const h = b.t + b.h + 26
  const rs = rects(n, rule)
  const thin = n > 40
  return (
    <svg className="calc-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <g className="calc-grid calc-grid-strong">
        {[0, 1, 2, 3, 4].map((x) => <line key={'x' + x} x1={sx(b, x)} x2={sx(b, x)} y1={b.t} y2={b.t + b.h} />)}
        {[1, 2, 3].map((y) => <line key={'y' + y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />)}
      </g>
      <rect className="calc-frame" x={b.l} y={b.t} width={b.w} height={b.h} />
      {/* the true region, faint, so the rectangles' overshoot reads against it */}
      <path className="calc-under" d={`${pathOf(b, f, A, B, 80)}L${sx(b, B)} ${sy(b, 0)}L${sx(b, A)} ${sy(b, 0)}Z`} />
      {rs.map(([x, rw, rh], i) => (
        <rect key={i} className={'calc-rect' + (thin ? ' thin' : '')} x={sx(b, x)} y={sy(b, rh)} width={Math.max(0.5, sx(b, x + rw) - sx(b, x))} height={sy(b, 0) - sy(b, rh)} />
      ))}
      {/* the gap: where the rectangle tops miss the curve */}
      {rs.map(([x, rw, rh], i) => {
        const k = Math.max(2, Math.min(12, Math.round(rw * 12)))
        const pts = Array.from({ length: k + 1 }, (_, j) => x + (rw * j) / k)
        const d = `M${sx(b, x)} ${sy(b, rh)}` + pts.map((p) => `L${sx(b, p).toFixed(1)} ${sy(b, f(p)).toFixed(1)}`).join('') + `L${sx(b, x + rw)} ${sy(b, rh)}Z`
        return <path key={'g' + i} className="calc-gapfill" d={d} />
      })}
      <path className="calc-ink" d={pathOf(b, f)} />
      {[A, B].map((x) => <line key={x} className="calc-edge" x1={sx(b, x)} x2={sx(b, x)} y1={sy(b, 0)} y2={sy(b, f(x)) - 6} />)}
      <text className="calc-axis" x={sx(b, A)} y={b.t + b.h + 18} textAnchor="middle">1</text>
      <text className="calc-axis" x={sx(b, B)} y={b.t + b.h + 18} textAnchor="middle">3.5</text>
      {[0, 2, 3, 4].map((x) => <text key={x} className="calc-axis" x={sx(b, x)} y={b.t + b.h + 18} textAnchor="middle">{x}</text>)}
      <text className="calc-sidelab" x={b.l + b.w - 6} y={b.t + 16} textAnchor="end">1 square = 1</text>
    </svg>
  )
}

/* ---------- your pencil guess on a 0..10 bar ---------- */

type BarProps = {
  w: number
  guess: number | null
  onGuess?: (v: number) => void
  /** after the reveal: the exact area and the current sum */
  exact?: boolean
  sum?: number
  n?: number
}

export function GuessBar({ w, guess, onGuess, exact, sum, n }: BarProps) {
  const b: Box = { l: 14, t: 34, w: w - 28, h: 26, x0: 0, x1: GUESS_MAX, y0: 0, y1: 1 }
  const h = 104
  const X = (v: number) => sx(b, v)
  const active = useRef(false)
  const set = (e: RPointerEvent<SVGSVGElement>) => onGuess?.(Math.round(clamp(ix(b, local(e).px), 0, GUESS_MAX) * 10) / 10)
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!onGuess) return
    const v = guess ?? 5
    const d = e.shiftKey ? 1 : 0.1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onGuess(Math.min(GUESS_MAX, Math.round((v + d) * 10) / 10))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onGuess(Math.max(0, Math.round((v - d) * 10) / 10))
    else return
    e.preventDefault()
  }
  const ex = exactArea()
  const ticks = Array.from({ length: GUESS_MAX + 1 }, (_, i) => i)
  return (
    <svg
      className={'calc-svg calc-bar' + (onGuess ? ' calc-touch calc-drag' : '')}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role={onGuess ? 'slider' : 'img'}
      tabIndex={onGuess ? 0 : undefined}
      aria-label={onGuess ? 'your area guess, in squares' : `your guess ${guess ?? 'none'} vs exact ${ex.toFixed(2)}`}
      aria-valuemin={onGuess ? 0 : undefined}
      aria-valuemax={onGuess ? GUESS_MAX : undefined}
      aria-valuenow={onGuess && guess != null ? guess : undefined}
      onKeyDown={key}
      onPointerDown={onGuess ? (e) => (e.currentTarget.setPointerCapture?.(e.pointerId), (active.current = true), set(e)) : undefined}
      onPointerMove={onGuess ? (e) => active.current && set(e) : undefined}
      onPointerUp={() => (active.current = false)}
      onPointerCancel={() => (active.current = false)}
    >
      <rect className="calc-track" x={b.l} y={b.t} width={b.w} height={b.h} />
      {exact && guess != null && <rect className="calc-gap" x={Math.min(X(guess), X(ex))} y={b.t} width={Math.abs(X(guess) - X(ex))} height={b.h} />}
      {ticks.map((t) => (
        <g key={t}>
          <line className="calc-tick" x1={X(t)} x2={X(t)} y1={b.t + b.h} y2={b.t + b.h + 5} />
          {(w > 420 || t % 2 === 0) && <text className="calc-axis" x={X(t)} y={b.t + b.h + 19} textAnchor="middle">{t}</text>}
        </g>
      ))}
      {/* one rectangle's sum, always on the bar */}
      <line className="calc-onerect" x1={X(ONE_RECT)} x2={X(ONE_RECT)} y1={b.t - 4} y2={b.t + b.h} />
      <text className="calc-note" x={X(ONE_RECT)} y={h - 6} textAnchor="middle">1 rectangle</text>
      {exact && (
        <>
          <line className="calc-exactline" x1={X(ex)} x2={X(ex)} y1={b.t - 6} y2={b.t + b.h + 6} />
          <text className="calc-exactlab" x={X(ex)} y={h - 6} textAnchor="middle">exact {ex.toFixed(2)}</text>
        </>
      )}
      {sum != null && n != null && <rect className="calc-sumtick" x={X(Math.min(GUESS_MAX, sum)) - 2} y={b.t + 3} width={4} height={b.h - 6} />}
      {guess != null && (
        <g>
          <line className="calc-pencil" x1={X(guess)} x2={X(guess)} y1={b.t - 4} y2={b.t + b.h + 4} />
          {onGuess && <circle className="calc-phandle" cx={X(guess)} cy={b.t + b.h / 2} r={11} />}
          <text className="calc-you" x={clamp(X(guess), 20, w - 20)} y={b.t - 10} textAnchor="middle">you</text>
        </g>
      )}
    </svg>
  )
}

/* ---------- tiny visuals for the mistake card ---------- */

export function MiniTangent({ at, note }: { at: number; note: string }) {
  const w = 240
  const b: Box = { l: 8, t: 10, w: 224, h: 90, x0: 0, x1: 4, y0: 0.5, y1: 3.4 }
  const s = fPrime(at)
  const tan = (x: number) => f(at) + s * (x - at)
  return (
    <svg className="calc-mini" width={w} height={124} viewBox={`0 0 ${w} 124`} role="img" aria-label={note}>
      <path className="calc-ink" d={pathOf(b, f)} />
      <path className="calc-tangent" d={`M${sx(b, at - 0.8)} ${sy(b, tan(at - 0.8))}L${sx(b, at + 0.8)} ${sy(b, tan(at + 0.8))}`} />
      <circle className="calc-handle" cx={sx(b, at)} cy={sy(b, f(at))} r={7} />
      <text className="calc-note" x={w / 2} y={118} textAnchor="middle">{note}</text>
    </svg>
  )
}

export function MiniRects() {
  const w = 240
  const pane = (n: number, x0: number) => {
    const b: Box = { l: x0, t: 8, w: 104, h: 80, x0: 0.8, x1: 3.7, y0: 0, y1: 3.3 }
    return (
      <g key={n}>
        {rects(n, 'left').map(([x, rw, rh], i) => (
          <rect key={i} className="calc-rect" x={sx(b, x)} y={sy(b, rh)} width={sx(b, x + rw) - sx(b, x)} height={sy(b, 0) - sy(b, rh)} />
        ))}
        <path className="calc-ink thin" d={pathOf(b, f, 0.8, 3.7, 40)} />
        <text className="calc-note" x={x0 + 52} y={106} textAnchor="middle">{n === 1 ? '1 → 7.5' : `${n} → ${rects(n, 'left').reduce((s, [, rw, rh]) => s + rw * rh, 0).toFixed(2)}`}</text>
      </g>
    )
  }
  return (
    <svg className="calc-mini" width={w} height={120} viewBox={`0 0 ${w} 120`} role="img" aria-label="one rectangle overshoots at 7.5; twelve rectangles hug the curve at 4.74">
      {pane(1, 6)}
      {pane(12, 128)}
    </svg>
  )
}

/* ---------- compare: position → velocity (slope) and velocity → distance (area) ---------- */

export function PositionChart({ w, t, label, onT }: { w: number; t: number; label: string; onT: (t: number) => void }) {
  const b: Box = { l: 30, t: 12, w: w - 40, h: 150, x0: 0, x1: 4, y0: 0, y1: 8.6 }
  const h = b.t + b.h + 26
  const s = f(t) // slope of position = velocity
  const tan = (x: number) => F(t) + s * (x - t)
  return (
    <DragSvg w={w} h={h} b={b} t={t} onT={onT} label={label}>
      <g className="calc-grid">
        {[1, 2, 3].map((x) => <line key={x} x1={sx(b, x)} x2={sx(b, x)} y1={b.t} y2={b.t + b.h} />)}
        {[2, 4, 6, 8].map((y) => <line key={y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />)}
      </g>
      <rect className="calc-frame" x={b.l} y={b.t} width={b.w} height={b.h} />
      <line className="calc-heightbar" x1={sx(b, t)} x2={sx(b, t)} y1={sy(b, 0)} y2={sy(b, F(t))} />
      <path className="calc-ink" d={pathOf(b, F)} />
      <clipPath id="calc-clip-pos">
        <rect x={b.l} y={b.t} width={b.w} height={b.h} />
      </clipPath>
      <path className="calc-tangent" clipPath="url(#calc-clip-pos)" d={`M${sx(b, t - 0.7)} ${sy(b, tan(t - 0.7))}L${sx(b, t + 0.7)} ${sy(b, tan(t + 0.7))}`} />
      <circle className="calc-handle" cx={sx(b, t)} cy={sy(b, F(t))} r={10} />
      {[0, 1, 2, 3, 4].map((x) => <text key={x} className="calc-axis" x={sx(b, x)} y={b.t + b.h + 18} textAnchor="middle">{x}</text>)}
    </DragSvg>
  )
}

export function VelocityChart({ w, t, label, onT }: { w: number; t: number; label: string; onT: (t: number) => void }) {
  const b: Box = { l: 30, t: 12, w: w - 40, h: 150, x0: 0, x1: 4, y0: 0, y1: 3.6 }
  const h = b.t + b.h + 26
  return (
    <DragSvg w={w} h={h} b={b} t={t} onT={onT} label={label}>
      <g className="calc-grid">
        {[1, 2, 3].map((x) => <line key={x} x1={sx(b, x)} x2={sx(b, x)} y1={b.t} y2={b.t + b.h} />)}
        {[1, 2, 3].map((y) => <line key={y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />)}
      </g>
      <rect className="calc-frame" x={b.l} y={b.t} width={b.w} height={b.h} />
      {t > 0 && <path className="calc-areafill" d={`${pathOf(b, f, 0, t, 60)}L${sx(b, t)} ${sy(b, 0)}L${sx(b, 0)} ${sy(b, 0)}Z`} />}
      <line className="calc-heightbar" x1={sx(b, t)} x2={sx(b, t)} y1={sy(b, 0)} y2={sy(b, f(t))} />
      <path className="calc-ink" d={pathOf(b, f)} />
      <circle className="calc-handle" cx={sx(b, t)} cy={sy(b, f(t))} r={10} />
      {[0, 1, 2, 3, 4].map((x) => <text key={x} className="calc-axis" x={sx(b, x)} y={b.t + b.h + 18} textAnchor="middle">{x}</text>)}
    </DragSvg>
  )
}

function DragSvg({ w, h, b, t, onT, label, children }: { w: number; h: number; b: Box; t: number; onT: (t: number) => void; label: string; children: React.ReactNode }) {
  const active = useRef(false)
  const set = (e: RPointerEvent<SVGSVGElement>) => onT(Math.round(clamp(ix(b, local(e).px), 0, 4) * 100) / 100)
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = e.shiftKey ? 0.5 : 0.1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onT(Math.min(4, Math.round((t + d) * 100) / 100))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onT(Math.max(0, Math.round((t - d) * 100) / 100))
    else return
    e.preventDefault()
  }
  return (
    <svg
      className="calc-svg calc-touch calc-drag"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={t}
      onKeyDown={key}
      onPointerDown={(e) => (e.currentTarget.setPointerCapture?.(e.pointerId), (active.current = true), set(e))}
      onPointerMove={(e) => active.current && set(e)}
      onPointerUp={() => (active.current = false)}
      onPointerCancel={() => (active.current = false)}
    >
      {children}
    </svg>
  )
}
