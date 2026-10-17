import type { Histogram } from '../truth'
import './Distribution.css'

type Props = {
  hist: Histogram
  xLabel: string
  guess?: number | null
  // Clamp the x axis to the input's range so the guess is always on the chart.
  range?: { min: number; max: number }
}

const W = 640
const H = 260
const PAD = { l: 16, r: 16, t: 28, b: 44 }

export function Distribution({ hist, xLabel, guess, range }: Props) {
  const lo = Math.min(range?.min ?? hist.min, hist.min)
  const hi = Math.max(Math.min(range?.max ?? hist.max, Math.max(hist.max, guess ?? hist.max)), hist.min)
  const xs = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  const peak = Math.max(...xs.map((x) => hist.counts.get(x) ?? 0))
  const bw = (W - PAD.l - PAD.r) / xs.length
  const xAt = (v: number) => PAD.l + (v - lo + 0.5) * bw
  const yAt = (c: number) => H - PAD.b - (c / peak) * (H - PAD.t - PAD.b)
  const mean = hist.mean
  const showGuess = guess != null
  const gapL = showGuess ? Math.min(xAt(guess), xAt(mean)) : 0
  const gapR = showGuess ? Math.max(xAt(guess), xAt(mean)) : 0
  const labelEvery = Math.ceil(xs.length / 16)

  return (
    <svg className="dist" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${xLabel}: average ${mean.toFixed(2)}${showGuess ? `, your guess ${guess}` : ''}`}>
      {showGuess && <rect className="dist-gap" x={gapL} y={PAD.t} width={gapR - gapL} height={H - PAD.t - PAD.b} />}
      {xs.map((x, i) => {
        const c = hist.counts.get(x) ?? 0
        const y = yAt(c)
        return (
          <g key={x}>
            <rect className="dist-bar" x={PAD.l + i * bw + 2} y={y} width={Math.max(bw - 4, 1)} height={H - PAD.b - y} style={{ animationDelay: `${i * 35}ms` }} />
            {i % labelEvery === 0 && (
              <text className="dist-tick" x={xAt(x)} y={H - PAD.b + 18} textAnchor="middle">{x}</text>
            )}
          </g>
        )
      })}
      <line className="dist-axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
      <text className="dist-xlabel" x={W / 2} y={H - 6} textAnchor="middle">{xLabel}</text>
      {showGuess && (
        <g className="dist-guess">
          <line x1={xAt(guess)} x2={xAt(guess)} y1={PAD.t - 6} y2={H - PAD.b} />
          <text x={xAt(guess)} y={PAD.t - 10} textAnchor="middle">your guess</text>
        </g>
      )}
      <g className="dist-mean">
        <line x1={xAt(mean)} x2={xAt(mean)} y1={PAD.t + 8} y2={H - PAD.b} />
      </g>
    </svg>
  )
}
