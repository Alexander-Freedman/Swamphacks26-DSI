import { useRef, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { f, FLAT, fPrime, STEEPEST_DOWN, X0, X1, xs, type Pt } from './math'
import { clamp, ix, iy, local, pathOf, pathThrough, sx, sy, type Box } from './plot'
import { boxes, fineXs, pencilAt, SLOPE_Y } from './slopeGeo'

// Two panels on one x axis: the curve f on top (ink), its slope underneath.
// Step 1 draws your pencil slope in the bottom panel; step 2 drags a tangent along the top
// while the true slope (ink) traces itself over your pencil, the gap in marker.

function Grid({ b, ys }: { b: Box; ys: number[] }) {
  return (
    <g className="calc-grid">
      {[0, 1, 2, 3, 4].map((x) => (
        <line key={'x' + x} x1={sx(b, x)} x2={sx(b, x)} y1={b.t} y2={b.t + b.h} />
      ))}
      {ys.map((y) => (
        <line key={'y' + y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />
      ))}
    </g>
  )
}

/** Runs of revealed fine samples → [start, end] index pairs. */
function runs(revealed: boolean[]): [number, number][] {
  const out: [number, number][] = []
  let s = -1
  revealed.forEach((on, i) => {
    if (on && s < 0) s = i
    if ((!on || i === revealed.length - 1) && s >= 0) {
      out.push([s, on ? i : i - 1])
      s = -1
    }
  })
  return out
}

type Props = {
  w: number
  /** raw pencil stroke while drawing (step 1) */
  stroke?: Pt[]
  /** the resampled pencil sketch (step 2) */
  sketch?: number[] | null
  /** step 2: where the tangent sits, and which fine samples of f' have been traced */
  at?: number
  revealed?: boolean[]
  extremes?: boolean
  label: string
  hint?: string
  onDraw?: { start: (p: Pt) => void; move: (p: Pt) => void; end: () => void }
  onDrag?: (x: number) => void
}

export function SlopeChart({ w, stroke, sketch, at, revealed, extremes, label, hint, onDraw, onDrag }: Props) {
  const { top, bot, h } = boxes(w)
  const active = useRef(false)
  const toPt = (e: RPointerEvent<SVGSVGElement>): Pt => {
    const { px, py } = local(e)
    return { x: clamp(ix(bot, px), X0, X1), y: clamp(iy(bot, py), SLOPE_Y[0], SLOPE_Y[1]) }
  }
  const down = (e: RPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    active.current = true
    if (onDraw) onDraw.start(toPt(e))
    if (onDrag) onDrag(toPt(e).x)
  }
  const move = (e: RPointerEvent<SVGSVGElement>) => {
    if (!active.current) return
    if (onDraw) onDraw.move(toPt(e))
    if (onDrag) onDrag(toPt(e).x)
  }
  const up = () => {
    if (!active.current) return
    active.current = false
    onDraw?.end()
  }
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!onDrag || at == null) return
    const step = e.shiftKey ? 0.5 : 0.1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onDrag(clamp(at + step, X0, X1))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onDrag(clamp(at - step, X0, X1))
    else if (e.key === 'Home') onDrag(X0)
    else if (e.key === 'End') onDrag(X1)
    else return
    e.preventDefault()
  }

  const rawPath = stroke?.length
    ? [...stroke].sort((p, q) => p.x - q.x).map((p, i) => (i ? 'L' : 'M') + sx(bot, p.x).toFixed(1) + ' ' + sy(bot, p.y).toFixed(1)).join('')
    : ''
  const traced = revealed ? runs(revealed) : []
  const slopeAt = at != null ? fPrime(at) : 0
  const tan = (x: number) => f(at ?? 0) + slopeAt * (x - (at ?? 0))
  const span = 0.75

  return (
    <svg
      className={'calc-svg calc-touch' + (onDraw ? ' calc-draw' : '') + (onDrag ? ' calc-drag' : '')}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role={onDrag ? 'slider' : 'img'}
      aria-label={label}
      aria-valuemin={onDrag ? X0 : undefined}
      aria-valuemax={onDrag ? X1 : undefined}
      aria-valuenow={onDrag && at != null ? Math.round(at * 100) / 100 : undefined}
      aria-valuetext={onDrag && at != null ? `x = ${at.toFixed(1)}, slope ${slopeAt.toFixed(2)}` : undefined}
      tabIndex={onDrag ? 0 : undefined}
      onKeyDown={key}
      onPointerDown={onDraw || onDrag ? down : undefined}
      onPointerMove={onDraw || onDrag ? move : undefined}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
    >
      <defs>
        <clipPath id="calc-clip-top">
          <rect x={top.l} y={top.t} width={top.w} height={top.h} />
        </clipPath>
        <clipPath id="calc-clip-bot">
          <rect x={bot.l} y={bot.t} width={bot.w} height={bot.h} />
        </clipPath>
      </defs>

      {/* top: the curve */}
      <Grid b={top} ys={[1, 2, 3]} />
      <rect className="calc-frame" x={top.l} y={top.t} width={top.w} height={top.h} />
      <text className="calc-ptitle" x={top.l} y={top.t - 7}>the curve</text>
      <path className="calc-ink" d={pathOf(top, f)} />

      {/* bottom: its slope */}
      <Grid b={bot} ys={[-2, -1, 1, 2, 3, 4, 5]} />
      <rect className="calc-frame" x={bot.l} y={bot.t} width={bot.w} height={bot.h} />
      <text className="calc-ptitle" x={bot.l} y={bot.t - 7}>its slope</text>
      <line className="calc-zero" x1={bot.l} x2={bot.l + bot.w} y1={sy(bot, 0)} y2={sy(bot, 0)} />
      <text className="calc-axis" x={bot.l - 6} y={sy(bot, 0) + 4} textAnchor="end">0</text>
      <text className="calc-axis" x={bot.l - 6} y={sy(bot, 4) + 4} textAnchor="end">+4</text>
      <text className="calc-axis" x={bot.l - 6} y={sy(bot, -2) + 4} textAnchor="end">−2</text>
      <text className="calc-sidelab" x={bot.l + bot.w - 6} y={sy(bot, 5) + 4} textAnchor="end">uphill ↑</text>
      <text className="calc-sidelab" x={bot.l + bot.w - 6} y={sy(bot, -2) + 4} textAnchor="end">downhill ↓</text>

      <g clipPath="url(#calc-clip-bot)">
        {/* the gap between your pencil and the real slope, only where it's been traced */}
        {sketch &&
          traced.map(([s, e]) => {
            const fwd = fineXs.slice(s, e + 1).map((x) => `${sx(bot, x).toFixed(1)},${sy(bot, pencilAt(sketch, x)).toFixed(1)}`)
            const back = fineXs.slice(s, e + 1).reverse().map((x) => `${sx(bot, x).toFixed(1)},${sy(bot, fPrime(x)).toFixed(1)}`)
            return <polygon key={s} className="calc-gap" points={[...fwd, ...back].join(' ')} />
          })}
        {rawPath && <path className="calc-pencil" d={rawPath} />}
        {sketch && <path className="calc-pencil" d={pathThrough(bot, xs, sketch)} />}
        {traced.map(([s, e]) => (
          <path key={s} className="calc-ink" d={pathOf(bot, fPrime, fineXs[s], fineXs[e], Math.max(1, e - s))} />
        ))}
      </g>

      {extremes && (
        <g className="calc-ext">
          {FLAT.map((x) => (
            <g key={x}>
              <line className="calc-flat" x1={sx(top, x - 0.45)} x2={sx(top, x + 0.45)} y1={sy(top, f(x))} y2={sy(top, f(x))} />
              <circle className="calc-mk" cx={sx(bot, x)} cy={sy(bot, 0)} r={6} />
              <text className="calc-note" x={sx(bot, x)} y={sy(bot, 0) + 20} textAnchor="middle">slope 0</text>
            </g>
          ))}
          <circle className="calc-mk" cx={sx(bot, STEEPEST_DOWN.x)} cy={sy(bot, STEEPEST_DOWN.slope)} r={6} />
          <text className="calc-note" x={sx(bot, STEEPEST_DOWN.x)} y={sy(bot, STEEPEST_DOWN.slope) + 20} textAnchor="middle">
            steepest down: −1.5
          </text>
        </g>
      )}

      {at != null && (
        <g>
          <line className="calc-link" x1={sx(top, at)} x2={sx(top, at)} y1={sy(top, f(at))} y2={sy(bot, clamp(slopeAt, SLOPE_Y[0], SLOPE_Y[1]))} />
          <path className="calc-tangent" clipPath="url(#calc-clip-top)" d={`M${sx(top, at - span)} ${sy(top, tan(at - span))}L${sx(top, at + span)} ${sy(top, tan(at + span))}`} />
          <circle className="calc-handle" cx={sx(top, at)} cy={sy(top, f(at))} r={11} />
          <circle className="calc-dot" cx={sx(bot, at)} cy={sy(bot, slopeAt)} r={6} />
        </g>
      )}

      {hint && (
        <text className="calc-hint" x={bot.l + bot.w / 2} y={sy(bot, 2.5)} textAnchor="middle">
          {hint}
        </text>
      )}
      {[0, 1, 2, 3, 4].map((x) => (
        <text key={x} className="calc-axis" x={sx(bot, x)} y={bot.t + bot.h + 18} textAnchor="middle">{x}</text>
      ))}
    </svg>
  )
}
