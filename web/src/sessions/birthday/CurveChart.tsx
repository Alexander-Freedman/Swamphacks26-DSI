import { useId, type ReactNode, type PointerEvent as RPointerEvent } from 'react'
import { frameFor, pathOf, sx, sy, TRUTH, type Frame } from './chart'
import { pct, pMatch, X_MAX, X_MIN } from './math'

/** Where the "n → p%" label goes: above-left of the dot, or below-right when there is no room on the left. */
function atLabel(f: Frame, at: number) {
  const x = sx(f, at)
  const y = sy(f, pMatch(at))
  if (x - f.l < 120) return { x: x + 12, y: y + 20, textAnchor: 'start' as const }
  return { x: x - 12, y: y - 12, textAnchor: 'end' as const }
}

type Props = {
  width: number
  pencil?: number[] | null
  /** live points while drawing (raw, not resampled) */
  rawPath?: string
  truth?: boolean
  /** animate the ink in over the pencil */
  animate?: boolean
  gap?: boolean
  /** a group size marked on the ink curve */
  at?: number | null
  guess?: number
  coinFlip?: boolean
  label?: string
  pointer?: {
    onPointerDown: (e: RPointerEvent<SVGSVGElement>) => void
    onPointerMove: (e: RPointerEvent<SVGSVGElement>) => void
    onPointerUp: (e: RPointerEvent<SVGSVGElement>) => void
    onPointerCancel: (e: RPointerEvent<SVGSVGElement>) => void
  }
  children?: ReactNode
}

export function CurveChart({ width, pencil, rawPath, truth, animate, gap, at, guess, coinFlip, label, pointer, children }: Props) {
  const f = frameFor(width)
  const clip = useId()
  const truthPath = pathOf(f, TRUTH)
  let gapPath = ''
  if (pencil && gap) {
    gapPath = pathOf(f, pencil)
    for (let x = X_MAX; x >= X_MIN; x--) gapPath += 'L' + sx(f, x).toFixed(1) + ' ' + sy(f, TRUTH[x]).toFixed(1)
    gapPath += 'Z'
  }
  const xt = [2, 10, 20, 30, 40, 50, 60, 70, 80]
  const yt = [0, 0.25, 0.5, 0.75, 1]
  const narrow = width < 420
  const youX = 68
  return (
    <svg
      className={'bday-chart' + (pointer ? ' bday-drawpad' : '')}
      width={f.w}
      height={f.h}
      viewBox={`0 0 ${f.w} ${f.h}`}
      role="img"
      aria-label={label ?? 'chance two people share a birthday, by people in the room'}
      {...pointer}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={f.l} y={0} width={f.w - f.l - f.r + 2} height={f.h} />
        </clipPath>
      </defs>
      <rect x={f.l} y={f.t} width={f.w - f.l - f.r} height={f.h - f.t - f.b} fill="var(--card)" />
      {yt.map((y) => (
        <g key={y}>
          <line className="bday-gridl" x1={f.l} x2={f.w - f.r} y1={sy(f, y)} y2={sy(f, y)} />
          <text className="bday-tick" x={f.l - 6} y={sy(f, y) + 4} textAnchor="end">{Math.round(y * 100)}%</text>
        </g>
      ))}
      {xt.filter((x) => !narrow || x % 20 === 0 || x === 2 || x === 30 || x === 50 || x === 70).map((x) => (
        <g key={x}>
          <line className="bday-gridl" x1={sx(f, x)} x2={sx(f, x)} y1={f.t} y2={f.h - f.b} />
          <text className="bday-tick" x={sx(f, x)} y={f.h - f.b + 17} textAnchor="middle">{x}</text>
        </g>
      ))}
      <line className="bday-axis" x1={f.l} x2={f.l} y1={f.t} y2={f.h - f.b} />
      <line className="bday-axis" x1={f.l} x2={f.w - f.r} y1={f.h - f.b} y2={f.h - f.b} />
      <text className="bday-axlabel" x={(f.l + f.w - f.r) / 2} y={f.h - 8} textAnchor="middle">people in the room</text>
      {coinFlip && (
        <g>
          <line x1={f.l} x2={f.w - f.r} y1={sy(f, 0.5)} y2={sy(f, 0.5)} stroke="var(--ink-soft)" strokeDasharray="2 4" />
          <text className="bday-h" x={f.l + 6} y={sy(f, 0.5) - 6}>coin flip</text>
        </g>
      )}
      {guess != null && guess <= X_MAX && (
        <g>
          <line className="bday-you" x1={sx(f, guess)} x2={sx(f, guess)} y1={f.t} y2={f.h - f.b} strokeWidth={1.5} />
          <text className="bday-h bday-pencil-t" x={sx(f, guess) + (guess > 60 ? -5 : 5)} y={f.t + 16} textAnchor={guess > 60 ? 'end' : 'start'}>your guess: {guess}</text>
        </g>
      )}
      {guess != null && guess > X_MAX && !truth && (
        <text className="bday-h bday-pencil-t" x={f.l + 8} y={f.t + 18}>your guess: {guess} → off this grid</text>
      )}
      {gapPath && <path key={'g' + String(animate)} className={'bday-gap' + (animate ? ' bday-gap-in' : '')} d={gapPath} clipPath={`url(#${clip})`} />}
      {pencil && <path className="bday-you" d={pathOf(f, pencil)} />}
      {pencil && (
        <text className="bday-h bday-pencil-t" x={sx(f, youX)} y={Math.min(f.h - f.b - 8, sy(f, pencil[youX]) + (pencil[youX] > TRUTH[youX] - 0.12 && pencil[youX] < 0.85 ? 22 : -10))} textAnchor="middle">
          you
        </text>
      )}
      {rawPath && <path className="bday-you bday-live" d={rawPath} />}
      {truth && (
        <g>
          <path key={'t' + String(animate)} className={'bday-ink' + (animate ? ' bday-ink-in' : '')} d={truthPath} pathLength={1} />
          <text className={'bday-h' + (animate ? ' bday-late' : '')} x={f.w - f.r - 4} y={sy(f, 1) + 20} textAnchor="end">real (exact)</text>
        </g>
      )}
      {truth && at != null && (
        <g className={animate ? 'bday-late' : undefined}>
          <line x1={sx(f, at)} x2={sx(f, at)} y1={sy(f, pMatch(at))} y2={f.h - f.b} stroke="var(--ink)" strokeDasharray="2 3" />
          {pencil && <circle cx={sx(f, at)} cy={sy(f, pencil[at])} r={5} fill="var(--card)" stroke="var(--pencil)" strokeWidth={2.5} />}
          <circle cx={sx(f, at)} cy={sy(f, pMatch(at))} r={8} fill="var(--marker)" stroke="var(--ink)" strokeWidth={2.5} />
          <text className="bday-h bday-at" {...atLabel(f, at)}>
            {at} → {pct(pMatch(at))}
          </text>
        </g>
      )}
      {children}
    </svg>
  )
}
