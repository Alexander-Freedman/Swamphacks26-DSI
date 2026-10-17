import { longestRunAt, type Side } from './math'

// 100 shots from a made-up 50% shooter, drawn as balls: made = ink ball, missed = empty hoop ring.
// Same 0/1 sequence as a coin (H = made), so the same exact math applies. Marker band = the longest streak.
const COLS = 20
const CELL = 20

export function ShotRow({ seq, label }: { seq: readonly Side[]; label: string }) {
  const rows = Math.ceil(seq.length / COLS)
  const best = longestRunAt(seq)
  const bands: { x: number; y: number; w: number }[] = []
  if (best) {
    // the streak can wrap onto the next row: one band per row it touches
    let i = best.start
    const end = best.start + best.len
    while (i < end) {
      const rowEnd = (Math.floor(i / COLS) + 1) * COLS
      const j = Math.min(end, rowEnd)
      bands.push({ x: (i % COLS) * CELL + 1, y: Math.floor(i / COLS) * CELL + 1, w: (j - i) * CELL - 2 })
      i = j
    }
  }
  return (
    <svg className="shots" viewBox={`0 0 ${COLS * CELL} ${rows * CELL}`} role="img" aria-label={label}>
      {bands.map((b, k) => (
        <rect key={k} className="shot-run" x={b.x} y={b.y} width={b.w} height={CELL - 2} rx={(CELL - 2) / 2} />
      ))}
      {seq.map((s, i) => {
        const cx = (i % COLS) * CELL + CELL / 2
        const cy = Math.floor(i / COLS) * CELL + CELL / 2
        return s === 'H' ? (
          <g key={i} className="shot made">
            <circle cx={cx} cy={cy} r={6.5} />
            <path d={`M${cx - 6.5} ${cy}H${cx + 6.5}M${cx} ${cy - 6.5}V${cy + 6.5}`} />
          </g>
        ) : (
          <g key={i} className="shot missed">
            <circle cx={cx} cy={cy} r={5.5} />
          </g>
        )
      })}
    </svg>
  )
}
