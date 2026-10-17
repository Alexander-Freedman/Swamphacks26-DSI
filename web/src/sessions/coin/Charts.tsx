import { useMemo } from 'react'
import { fmt, useWidth } from './hooks'
import { expectedLongest } from './math'

export const KMAX = 18 // last histogram column is "18+"

// Histogram of simulated longest runs, dot by dot. Ink dots = real (simulated) coins,
// solid ink line = exact average, dashed pencil = your guess, marker band = the gap.
export function RunHistogram({ hist, total, newest, guess, mean }: { hist: number[]; total: number; newest: number; guess: number; mean: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const H = 250
  const L = 8, R = w - 8, top = 52, base = H - 46
  const cw = (R - L) / KMAX
  const x = (k: number) => L + (k - 0.5) * cw
  const maxC = Math.max(1, ...hist)
  const maxDots = 16
  const unit = Math.max(1, Math.ceil(maxC / maxDots))
  const dy = (base - top) / maxDots
  const r = Math.min(cw, dy) * 0.42
  const gx = x(Math.min(guess, KMAX))
  const ex = L + (mean - 0.5) * cw
  const textX = (px: number, label: string, size: number) => {
    // keep a label inside the plot: anchor left of the line if it would run off the right edge
    const width = label.length * size * 0.6
    return px + 6 + width > w ? { x: px - 6, anchor: 'end' as const } : { x: px + 6, anchor: 'start' as const }
  }
  const gLabel = `your guess: ${guess}`
  const eLabel = `real average ${mean.toFixed(2)} (exact)`
  const gt = textX(gx, gLabel, 15)
  const et = textX(ex, eLabel, 12)
  const dots = []
  for (let k = 1; k <= KMAX; k++) {
    const n = Math.ceil(hist[k] / unit)
    for (let i = 0; i < n; i++) {
      const isNew = k === Math.min(newest, KMAX) && i === n - 1
      const partial = i === n - 1 && hist[k] % unit !== 0
      dots.push(
        <circle key={`${k}-${i}`} cx={x(k)} cy={base - dy * (i + 0.5)} r={r} className={isNew ? 'dot new' : 'dot'} opacity={partial && !isNew ? 0.4 : 1} />,
      )
    }
  }
  return (
    <div ref={ref} className="chart">
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={`Histogram of the longest run in ${fmt(total)} simulated runs of 100 flips. Real average ${mean.toFixed(2)}, your guess ${guess}.`}>
        <rect x={Math.min(gx, ex)} y={top - 6} width={Math.abs(ex - gx)} height={base - top + 6} className="gap" />
        {dots}
        <line x1={L} x2={R} y1={base} y2={base} className="axis" />
        {Array.from({ length: KMAX }, (_, i) => i + 1)
          .filter((k) => (w < 420 ? k % 3 === 0 || k === 1 : k % 2 === 1 || k === KMAX))
          .map((k) => (
            <text key={k} x={x(k)} y={base + 17} className="tick" textAnchor="middle">
              {k === KMAX ? `${KMAX}+` : k}
            </text>
          ))}
        <text x={(L + R) / 2} y={base + 36} className="tick" textAnchor="middle">longest run in 100 flips</text>
        <line x1={ex} x2={ex} y1={top - 18} y2={base} className="truth" />
        <text x={et.x} y={top - 22} textAnchor={et.anchor} className="t-ink">{eLabel}</text>
        <line x1={gx} x2={gx} y1={6} y2={base} className="you" />
        <text x={gt.x} y={18} textAnchor={gt.anchor} className="t-you">{gLabel}</text>
      </svg>
      <p className="unit">{unit === 1 ? '1 dot = 1 run of 100 flips' : `1 dot = ${unit} runs of 100 flips`}</p>
    </div>
  )
}

const V_MIN = 1, V_MAX = 4 // log10 of 10 .. 10,000 flips

const curveCache = new Map<number, [number, number][]>()
function curve(r: number): [number, number][] {
  const key = Math.round(r * 100) / 100
  let pts = curveCache.get(key)
  if (!pts) {
    pts = []
    for (let v = V_MIN; v <= V_MAX + 1e-9; v += 0.1) pts.push([v, expectedLongest(Math.round(10 ** v), key)])
    curveCache.set(key, pts)
  }
  return pts
}

// Expected longest run vs number of flips (log scale): real coin in ink, a coin like you in pencil.
export function ExtremeChart({ v, rYou, guess, truthNow, youNow }: { v: number; rYou: number; guess: number; truthNow: number; youNow: number }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const H = 240
  const L = 30, R = w - 14, top = 10, base = H - 44, ymax = 16
  const X = (vv: number) => L + ((vv - V_MIN) / (V_MAX - V_MIN)) * (R - L)
  const Y = (e: number) => base - (Math.min(e, ymax) / ymax) * (base - top)
  const real = useMemo(() => curve(0.5), [])
  const you = useMemo(() => curve(rYou), [rYou])
  const path = (p: [number, number][]) => p.map((q, i) => `${i ? 'L' : 'M'}${X(q[0]).toFixed(1)} ${Y(q[1]).toFixed(1)}`).join(' ')
  const gapPath = path(real) + ' ' + you.slice().reverse().map((q) => `L${X(q[0]).toFixed(1)} ${Y(q[1]).toFixed(1)}`).join(' ') + 'Z'
  const log2 = real.map((q, i) => `${i ? 'L' : 'M'}${X(q[0]).toFixed(1)} ${Y(Math.log2(10 ** q[0])).toFixed(1)}`).join(' ')
  return (
    <div ref={ref} className="chart">
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label="Expected longest run against number of flips, real coin versus a coin that switches like you">
        {[0, 4, 8, 12, 16].map((e) => (
          <g key={e}>
            <line x1={L} x2={R} y1={Y(e)} y2={Y(e)} className="grid" />
            <text x={L - 6} y={Y(e) + 4} className="tick" textAnchor="end">{e}</text>
          </g>
        ))}
        {[1, 2, 3, 4].map((d) => (
          <text key={d} x={X(d)} y={base + 17} className="tick" textAnchor={d === 1 ? 'start' : d === 4 ? 'end' : 'middle'}>
            {fmt(10 ** d)}
          </text>
        ))}
        <text x={(L + R) / 2} y={base + 36} className="tick" textAnchor="middle">number of flips (log scale)</text>
        <path d={gapPath} className="gap" />
        <path d={log2} className="log2" />
        <path d={path(real)} className="truth thick" />
        <path d={path(you)} className="you" />
        <line x1={L} x2={R} y1={base} y2={base} className="axis" />
        <line x1={X(v)} x2={X(v)} y1={top} y2={base} className="cursor" />
        <line x1={X(2) - 20} x2={X(2) + 20} y1={Y(guess)} y2={Y(guess)} className="you thin" />
        <circle cx={X(v)} cy={Y(youNow)} r={6} className="pt-you" />
        <circle cx={X(v)} cy={Y(truthNow)} r={6.5} className="pt-ink" />
      </svg>
    </div>
  )
}
