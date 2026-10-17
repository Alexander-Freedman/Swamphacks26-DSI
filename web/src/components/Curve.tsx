import type { CurveTruth } from '../types'
import './Curve.css'

type Props = { t: CurveTruth; f: (x: number) => number; guess?: number | null; target?: number | null }

const W = 640
const H = 280
const PAD = { l: 44, r: 20, t: 28, b: 44 }

export function Curve({ t, f, guess, target }: Props) {
  const { x_min: lo, x_max: hi } = t
  const steps = 120
  const pts = Array.from({ length: steps + 1 }, (_, i) => lo + ((hi - lo) * i) / steps).map((x) => [x, f(x)] as const)
  const ys = pts.map(([, y]) => y)
  const yLo = Math.min(0, ...ys)
  const yHi = Math.max(1, ...ys)
  const xAt = (x: number) => PAD.l + ((Math.min(Math.max(x, lo), hi) - lo) / (hi - lo)) * (W - PAD.l - PAD.r)
  const yAt = (y: number) => H - PAD.b - ((y - yLo) / (yHi - yLo)) * (H - PAD.t - PAD.b)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${xAt(x).toFixed(1)},${yAt(y).toFixed(1)}`).join('')
  const offChart = guess != null && guess > hi
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4)

  return (
    <svg className="curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t.y_label} vs ${t.x_label}${target != null ? `; reaches 50% at ${target}` : ''}`}>
      {guess != null && target != null && (
        <rect className="curve-gap" x={Math.min(xAt(guess), xAt(target))} y={PAD.t} width={Math.abs(xAt(guess) - xAt(target))} height={H - PAD.t - PAD.b} />
      )}
      <line className="curve-axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
      <line className="curve-axis" x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} />
      {yHi === 1 && (
        <>
          <line className="curve-half" x1={PAD.l} x2={W - PAD.r} y1={yAt(0.5)} y2={yAt(0.5)} />
          <text className="curve-tick" x={PAD.l - 6} y={yAt(0.5) + 4} textAnchor="end">50%</text>
          <text className="curve-tick" x={PAD.l - 6} y={yAt(1) + 4} textAnchor="end">100%</text>
        </>
      )}
      {ticks.map((x) => (
        <text key={x} className="curve-tick" x={xAt(x)} y={H - PAD.b + 18} textAnchor="middle">{Math.round(x)}</text>
      ))}
      <text className="curve-tick" x={(W + PAD.l) / 2} y={H - 6} textAnchor="middle">{t.x_label}</text>
      <path className="curve-ink" d={d} pathLength={1} />
      {guess != null && (
        <g className="curve-guess">
          <line x1={xAt(guess)} x2={xAt(guess)} y1={PAD.t - 4} y2={H - PAD.b} />
          <text x={xAt(guess) - (offChart ? 4 : 0)} y={PAD.t - 10} textAnchor={offChart ? 'end' : 'middle'}>
            {offChart ? `your guess: ${guess} →` : 'your guess'}
          </text>
        </g>
      )}
      {target != null && (
        <g className="curve-target">
          <circle cx={xAt(target)} cy={yAt(f(target))} r={7} />
          <text x={xAt(target) + 10} y={yAt(f(target)) + 22}>{target}</text>
        </g>
      )}
    </svg>
  )
}
