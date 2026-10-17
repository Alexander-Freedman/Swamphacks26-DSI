import type { CurvePoint } from '../truth'
import type { CurveTruth } from '../types'
import './Curve.css'
import { niceTicks } from './ticks'
import { useNarrow } from './useNarrow'

type Props = {
  t: CurveTruth
  f: (x: number) => number
  // The pencil guess, on the axis the answer lives on (x = "how many people", y = "how many dollars").
  guess?: number | null
  point?: CurvePoint | null
  // The ink label at the truth point, e.g. "$76,123" or "23".
  pointLabel?: string
}

const H = 280
const PAD = { l: 52, r: 20, t: 30, b: 44 }

const short = (v: number) => {
  const a = Math.abs(v)
  if (a >= 1e6) return `${Number((v / 1e6).toPrecision(3))}M`
  if (a >= 1e3) return `${Number((v / 1e3).toPrecision(3))}k`
  return String(Number(v.toPrecision(3)))
}

export function Curve({ t, f, guess, point, pointLabel }: Props) {
  const narrow = useNarrow()
  const W = narrow ? 360 : 640
  const { x_min: lo, x_max: hi } = t
  const prob = t.preset === 'birthday_match_probability'
  const axis = point?.axis ?? 'x'
  // Presets count whole things (people), so plot integer x; an expression gets a smooth sample.
  const xs = prob
    ? Array.from({ length: Math.floor(hi) - Math.ceil(lo) + 1 }, (_, i) => Math.ceil(lo) + i)
    : Array.from({ length: 121 }, (_, i) => lo + ((hi - lo) * i) / 120)
  const pts = xs.map((x) => [x, f(x)] as const).filter(([, y]) => Number.isFinite(y))
  const ys = pts.map(([, y]) => y)
  const guessY = guess != null && axis === 'y' ? guess : null
  const yLo = Math.min(0, ...ys, guessY ?? 0)
  let yHi = Math.max(prob ? 1 : -Infinity, ...ys, guessY ?? -Infinity)
  if (!(yHi > yLo)) yHi = yLo + 1
  const xAt = (x: number) => PAD.l + ((Math.min(Math.max(x, lo), hi) - lo) / (hi - lo)) * (W - PAD.l - PAD.r)
  const yAt = (y: number) => H - PAD.b - ((y - yLo) / (yHi - yLo)) * (H - PAD.t - PAD.b)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${xAt(x).toFixed(1)},${yAt(y).toFixed(1)}`).join('')
  const xGuess = guess != null && axis === 'x' ? guess : null
  const offRight = xGuess != null && xGuess > hi
  const offLeft = xGuess != null && xGuess < lo
  // Skip an x tick that would sit under the truth's label.
  const ticks = niceTicks(lo, hi, narrow ? 5 : 9).filter((x) => !point || axis !== 'x' || Math.abs(xAt(x) - xAt(point.x)) > 26)
  const yTicks = prob ? [] : niceTicks(yLo, yHi, 4)
  // Keep hand-written labels inside the plot on a phone.
  const clampX = (x: number, half: number) => Math.min(Math.max(x, PAD.l + half), W - PAD.r - half)
  const px = point ? xAt(point.x) : 0
  const py = point ? yAt(point.y) : 0
  const labelRight = px < (W + PAD.l) / 2
  const label = pointLabel ?? (point ? String(point.x) : '')

  return (
    <svg
      className="curve"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${t.y_label} vs ${t.x_label}${point ? (prob ? `; reaches 50% at ${point.x}` : `; reality: ${label}`) : ''}`}
    >
      {xGuess != null && point && (
        <rect className="curve-gap" x={Math.min(xAt(xGuess), px)} y={PAD.t} width={Math.abs(xAt(xGuess) - px)} height={H - PAD.t - PAD.b} />
      )}
      {guessY != null && point && (
        <rect className="curve-gap" x={PAD.l} y={Math.min(yAt(guessY), py)} width={W - PAD.l - PAD.r} height={Math.abs(yAt(guessY) - py)} />
      )}
      <line className="curve-axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
      <line className="curve-axis" x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} />
      {prob && (
        <>
          <line className="curve-half" x1={PAD.l} x2={W - PAD.r} y1={yAt(0.5)} y2={yAt(0.5)} />
          <text className="curve-tick" x={PAD.l - 6} y={yAt(0.5) + 4} textAnchor="end">50%</text>
          <text className="curve-tick" x={PAD.l - 6} y={yAt(1) + 4} textAnchor="end">100%</text>
        </>
      )}
      {yTicks.map((y) => (
        <text key={y} className="curve-tick" x={PAD.l - 6} y={yAt(y) + 5} textAnchor="end">{short(y)}</text>
      ))}
      {!prob && t.y_label && (
        <text className="curve-tick curve-ylabel" x={PAD.l} y={PAD.t - 14}>{t.y_label}</text>
      )}
      {ticks.map((x) => (
        <text key={x} className="curve-tick" x={xAt(x)} y={H - PAD.b + 20} textAnchor="middle">{short(x)}</text>
      ))}
      <text className="curve-tick" x={(W + PAD.l) / 2} y={H - 4} textAnchor="middle">{t.x_label}</text>
      <path className="curve-ink" d={d} pathLength={1} />
      {xGuess != null && (
        <g className="curve-guess">
          <line x1={xAt(xGuess)} x2={xAt(xGuess)} y1={PAD.t - 4} y2={H - PAD.b} />
          <text x={offRight ? xAt(xGuess) - 4 : offLeft ? xAt(xGuess) + 4 : clampX(xAt(xGuess), 40)} y={PAD.t - 10} textAnchor={offRight ? 'end' : offLeft ? 'start' : 'middle'}>
            {offRight ? `your guess: ${xGuess} →` : offLeft ? `← your guess: ${xGuess}` : 'your guess'}
          </text>
        </g>
      )}
      {guessY != null && (
        <g className="curve-guess">
          <line x1={PAD.l} x2={W - PAD.r} y1={yAt(guessY)} y2={yAt(guessY)} />
          <text x={W - PAD.r} y={yAt(guessY) - 8} textAnchor="end">your guess</text>
        </g>
      )}
      {point && (
        <g className="curve-target">
          {!prob && <line className="curve-drop" x1={px} x2={px} y1={py} y2={H - PAD.b} />}
          {!prob && <line className="curve-drop" x1={PAD.l} x2={px} y1={py} y2={py} />}
          <circle cx={px} cy={py} r={7} />
          <text x={labelRight ? px + 12 : px - 12} y={py < PAD.t + 30 ? py + 26 : py - 12} textAnchor={labelRight ? 'start' : 'end'}>
            {label}
          </text>
        </g>
      )}
    </svg>
  )
}
