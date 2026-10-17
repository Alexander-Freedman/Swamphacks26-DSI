import { runs, type Side } from './math'

type Props = {
  seq: readonly Side[]
  size?: number
  mine?: boolean // pencil: your own sequence
  mini?: boolean
  fresh?: boolean // play the staggered flip
  hiLongest?: boolean // marker on the longest run
  hiAtLeast?: number // marker on every run of this length or more
  cols?: number
  label: string
}

// A row of coins. Ink coins are real flips, dashed pencil coins are yours, marker = the run that breaks your model.
export function CoinGrid({ seq, size, mine, mini, fresh, hiLongest, hiAtLeast, cols, label }: Props) {
  const rs = runs(seq)
  const hi = hiAtLeast
    ? rs.filter((r) => r.len >= hiAtLeast)
    : hiLongest && rs.length
      ? [rs.reduce((a, b) => (b.len > a.len ? b : a))]
      : []
  const mark = new Map<number, string>()
  for (const r of hi) {
    for (let i = r.start; i < r.start + r.len; i++) {
      mark.set(i, ' run' + (i === r.start ? ' run-start' : '') + (i === r.start + r.len - 1 ? ' run-end' : ''))
    }
  }
  const n = size ?? seq.length
  const cls = ['coins', mine && 'mine', mini && 'mini', cols && `cols-${cols}`].filter(Boolean).join(' ')
  return (
    <div className={cls} role="img" aria-label={label}>
      {Array.from({ length: n }, (_, i) => {
        const c = seq[i]
        let k = 'coin ' + (c ? c.toLowerCase() : 'empty') + (mark.get(i) ?? '')
        if (fresh && c) k += ' fresh'
        if (mine && i === seq.length - 1) k += ' last'
        return (
          <div key={i} className={k} style={{ ['--i' as string]: i }}>
            <b>{mini ? '' : c ?? ''}</b>
          </div>
        )
      })}
    </div>
  )
}

// One line meter: ink tick = truth, dashed pencil tick = you, marker band = the gap.
export function Track({
  you,
  truth,
  max,
  show,
  youLabel = 'you',
  truthLabel,
}: {
  you: number
  truth: number
  max: number
  show: (v: number) => string
  youLabel?: string
  truthLabel: string
}) {
  const p = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`
  const lo = Math.min(you, truth)
  const hi = Math.max(you, truth)
  const side = (v: number) => (v / max > 0.6 ? 'l' : 'r') // labels grow toward the middle, never off the edge
  return (
    <div className="track" role="img" aria-label={`${youLabel} ${show(you)}, ${truthLabel} ${show(truth)}`}>
      <div className="band" style={{ left: p(lo), width: `calc(${p(hi)} - ${p(lo)})` }} />
      <div className="tk truth" style={{ left: p(truth) }}>
        <span className={side(truth)}>
          {truthLabel} {show(truth)}
        </span>
      </div>
      <div className="tk you" style={{ left: p(you) }}>
        <span className={side(you)}>
          {youLabel} {show(you)}
        </span>
      </div>
    </div>
  )
}
