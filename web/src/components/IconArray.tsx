import type { baseRate } from '../truth'
import './IconArray.css'

// 1,000 people, filled in reading order: true positives, then false positives, then everyone else.
// Grouped, labelled and built in one by one (docs/research/reveal-patterns.md, icon arrays).
export function IconArray({ counts }: { counts: ReturnType<typeof baseRate> }) {
  const tp = Math.round(counts.truePos)
  const fp = Math.round(counts.falsePos)
  const cols = 40
  const cells = Array.from({ length: counts.population }, (_, i) => (i < tp ? 'tp' : i < tp + fp ? 'fp' : 'neg'))
  return (
    <figure className="icons">
      <svg viewBox={`0 0 ${cols * 16} ${Math.ceil(counts.population / cols) * 16}`} role="img" aria-label={`${tp + fp} of ${counts.population} test positive; ${tp} of them are sick`}>
        {cells.map((k, i) => (
          <circle key={i} className={`icon ${k}`} cx={(i % cols) * 16 + 8} cy={Math.floor(i / cols) * 16 + 8} r={5.5} style={k === 'neg' ? undefined : { animationDelay: `${i * 8}ms` }} />
        ))}
      </svg>
      <figcaption>
        <span className="key-item"><span className="key tp" /> sick + tested positive: <strong>{tp}</strong></span>
        <span className="key-item"><span className="key fp" /> healthy but tested positive: <strong>{fp}</strong></span>
      </figcaption>
    </figure>
  )
}
