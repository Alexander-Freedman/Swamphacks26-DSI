import { breakEven, pct, ppv, type Test } from './math'

const clampX = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/** Your guess (pencil, dashed) vs the truth (ink, solid) on one 0-100% line; the gap is marker. */
export function GuessBar({ guess, truth }: { guess: number; truth: number }) {
  const X = (p: number) => 24 + p * 352
  const g = guess / 100
  const lo = Math.min(g, truth)
  return (
    <svg className="pt-chart" viewBox="0 0 400 118" role="img" aria-label={`your guess ${guess}% vs real ${pct(truth)}`}>
      <rect className="pt-gap" x={X(lo)} y={36} width={Math.abs(g - truth) * 352} height={30} />
      <line className="pt-axis" x1={24} x2={376} y1={66} y2={66} />
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line className="pt-axis" x1={X(v / 100)} x2={X(v / 100)} y1={62} y2={70} />
          <text className="pt-tick" x={X(v / 100)} y={88} textAnchor="middle">{v}%</text>
        </g>
      ))}
      <line className="pt-truth" x1={X(truth)} x2={X(truth)} y1={28} y2={74} />
      <text className="pt-truth-label" x={clampX(X(truth), 24, 300)} y={22}>real {pct(truth)}</text>
      <line className="pt-you" x1={X(g)} x2={X(g)} y1={28} y2={74} />
      <text className="pt-you-label" x={clampX(X(g), 50, 350)} y={112} textAnchor="middle">you {guess}%</text>
    </svg>
  )
}

/** The 98 positives twice: how you split them vs how they really split. */
export function PileCompare({ yourSick, truePos, positives }: { yourSick: number; truePos: number; positives: number }) {
  const rows = Math.ceil(positives / 10)
  const h = 44 + rows * 15
  const pile = (ox: number, nSick: number, mine: boolean) =>
    Array.from({ length: positives }, (_, k) => {
      const x = ox + (k % 10) * 15
      const y = 42 + Math.floor(k / 10) * 15
      const sick = k < nSick
      if (mine) {
        const wrong = sick && k >= truePos
        return (
          <g key={k}>
            {wrong && <rect className="pt-gap-solid" x={x - 7.5} y={y - 7.5} width={15} height={15} />}
            <circle cx={x} cy={y} r={4.6} className={sick ? 'pt-p-sick' : 'pt-p-healthy'} />
          </g>
        )
      }
      return <circle key={k} cx={x} cy={y} r={4.6} className={sick ? 'pt-dot tp' : 'pt-dot fp'} />
    })
  return (
    <svg className="pt-chart" viewBox={`0 0 400 ${h}`} role="img" aria-label={`your model: ${yourSick} sick of ${positives}; reality: ${truePos} sick of ${positives}`}>
      <text className="pt-you-label" x={10} y={22}>you: {yourSick} sick</text>
      <text className="pt-truth-label" x={226} y={22}>real: {truePos} sick</text>
      {pile(17, yourSick, true)}
      {pile(233, truePos, false)}
    </svg>
  )
}

/** P(sick | positive) across base rates 0.1%..50% (log x), with the coin-flip line and your pinned guess at 1%. */
export function CrowdCurve({ test, guess, cardBase }: { test: Test; guess: number; cardBase: number }) {
  const lmin = -3
  const lmax = Math.log10(0.5)
  const LX = (b: number) => 52 + ((Math.log10(b) - lmin) / (lmax - lmin)) * 328
  const LY = (p: number) => 196 - p * 172
  let d = ''
  for (let k = 0; k <= 120; k++) {
    const b = 0.001 * Math.pow(500, k / 120)
    d += `${k ? 'L' : 'M'}${LX(b).toFixed(1)} ${LY(ppv({ ...test, baseRate: b })).toFixed(1)}`
  }
  const bStar = breakEven(test)
  const now = ppv(test)
  const atCard = ppv({ ...test, baseRate: cardBase })
  const g = guess / 100
  const youRight = LX(cardBase) > 300
  return (
    <svg className="pt-chart" viewBox="0 -14 400 250" role="img" aria-label={`chance you're sick if positive: ${pct(now)} at ${pct(test.baseRate)} sick`}>
      <line className="pt-axis" x1={52} x2={380} y1={196} y2={196} />
      <line className="pt-axis" x1={52} x2={52} y1={20} y2={196} />
      {([[0.001, '0.1%'], [0.01, '1%'], [0.1, '10%'], [0.5, '50%']] as const).map(([v, s]) => (
        <g key={s}>
          <line className="pt-axis" x1={LX(v)} x2={LX(v)} y1={196} y2={201} />
          <text className="pt-tick" x={LX(v)} y={220} textAnchor={v === 0.5 ? 'end' : 'middle'}>{s}</text>
        </g>
      ))}
      {[0, 0.5, 1].map((v) => (
        <text key={v} className="pt-tick" x={46} y={LY(v) + 5} textAnchor="end">{v * 100}%</text>
      ))}
      <line className="pt-coin" x1={LX(bStar)} x2={LX(bStar)} y1={20} y2={196} />
      <line className="pt-coin" x1={52} x2={380} y1={LY(0.5)} y2={LY(0.5)} />
      {/* above the plot, so it never sits on the curve or your mark at any false alarm rate */}
      <text className="pt-coin-label" x={clampX(LX(bStar), 120, 330)} y={6} textAnchor="middle">coin flip at {pct(bStar)} sick</text>
      <path className="pt-truth" d={d} />
      <text className="pt-truth-label" x={LX(0.15) - 6} y={LY(ppv({ ...test, baseRate: 0.15 })) - 8} textAnchor="end">real</text>
      <rect className="pt-gap" x={LX(cardBase) - 6} y={LY(Math.max(g, atCard))} width={12} height={Math.abs(LY(g) - LY(atCard))} />
      <circle className="pt-you-dot" cx={LX(cardBase)} cy={LY(g)} r={6} />
      <text className="pt-you-label" x={LX(cardBase) + (youRight ? -10 : 10)} y={clampX(LY(g) + 5, 30, 188)} textAnchor={youRight ? 'end' : 'start'}>
        you, {guess}%
      </text>
      <circle className="pt-now" cx={LX(test.baseRate)} cy={LY(now)} r={7} />
    </svg>
  )
}
