import { useId } from 'react'
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
  // Calculus pictures (engine v4 truth.show). tangent: the real tangent at x in ink; guessSlope: your
  // tangent through the same point in pencil. area: the region from..to shaded, n left rectangles
  // (null = none), guess = your area as one pencil rectangle over the same base.
  tangent?: { x: number; slope: number | null } | null
  guessSlope?: number | null
  area?: { from: number; to: number; n: number | null; guess?: number | null } | null
  // A dashed guide at the x the question asks about; the limit's point as a hollow dot.
  mark?: number | null
  hole?: boolean
}

const H = 280
const PAD = { l: 52, r: 20, t: 30, b: 44 }

const short = (v: number) => {
  const a = Math.abs(v)
  if (a >= 1e6) return `${Number((v / 1e6).toPrecision(3))}M`
  if (a >= 1e3) return `${Number((v / 1e3).toPrecision(3))}k`
  return String(Number(v.toPrecision(3)))
}

export function Curve({ t, f, guess, point, pointLabel, tangent, guessSlope, area, mark, hole }: Props) {
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
  // your area drawn as one rectangle over the same base needs to fit too
  const areaH = area?.guess != null && area.to !== area.from ? area.guess / (area.to - area.from) : null
  const yLo = Math.min(0, ...ys, guessY ?? 0, areaH ?? 0)
  let yHi = Math.max(prob ? 1 : -Infinity, ...ys, guessY ?? -Infinity, areaH ?? -Infinity)
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
  const clip = useId().replace(/:/g, '')
  // A tangent line through (x, f(x)) with this slope, a quarter of the plot wide each way.
  const line = (x: number, m: number) => {
    const y = f(x)
    const dx = (hi - lo) / 4
    return { x1: xAt(x - dx), y1: yAt(y - m * dx), x2: xAt(x + dx), y2: yAt(y + m * dx) }
  }
  const areaPath = (a: number, b: number) => {
    const n = 80
    const top = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n).map((x) => `L${xAt(x).toFixed(1)},${yAt(Number.isFinite(f(x)) ? f(x) : 0).toFixed(1)}`)
    return `M${xAt(a)},${yAt(0)}${top.join('')}L${xAt(b)},${yAt(0)}Z`
  }

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
      <defs>
        <clipPath id={clip}>
          <rect x={PAD.l} y={PAD.t - 6} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b + 6} />
        </clipPath>
      </defs>
      {area && (
        <g clipPath={`url(#${clip})`}>
          <path className="curve-area" d={areaPath(area.from, area.to)} />
          {area.n != null &&
            Array.from({ length: area.n }, (_, i) => {
              const w = (area.to - area.from) / area.n!
              const x0 = area.from + i * w
              const y0 = f(x0)
              if (!Number.isFinite(y0)) return null
              return <rect key={i} className="curve-rect" x={xAt(x0)} y={Math.min(yAt(y0), yAt(0))} width={Math.max(0.5, xAt(x0 + w) - xAt(x0))} height={Math.abs(yAt(0) - yAt(y0))} />
            })}
          {areaH != null && <rect className="curve-guess-rect" x={xAt(area.from)} y={Math.min(yAt(areaH), yAt(0))} width={xAt(area.to) - xAt(area.from)} height={Math.abs(yAt(0) - yAt(areaH))} />}
        </g>
      )}
      {mark != null && <line className="curve-mark" x1={xAt(mark)} x2={xAt(mark)} y1={PAD.t} y2={H - PAD.b} />}
      <path className="curve-ink" d={d} pathLength={1} />
      {tangent && (
        <g clipPath={`url(#${clip})`}>
          {guessSlope != null && <line className="curve-tangent-pencil" {...line(tangent.x, guessSlope)} />}
          {tangent.slope != null && <line className="curve-tangent" {...line(tangent.x, tangent.slope)} />}
        </g>
      )}
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
          {!prob && !tangent && !hole && <line className="curve-drop" x1={px} x2={px} y1={py} y2={H - PAD.b} />}
          {!prob && !tangent && !hole && <line className="curve-drop" x1={PAD.l} x2={px} y1={py} y2={py} />}
          <circle cx={px} cy={py} r={7} className={hole ? 'curve-hole' : undefined} />
          <text x={labelRight ? px + 12 : px - 12} y={py < PAD.t + 30 ? py + 26 : py - 12} textAnchor={labelRight ? 'start' : 'end'}>
            {label}
          </text>
        </g>
      )}
    </svg>
  )
}
