import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { sx, sy, useWidth, type Box } from './plot'
import { groups, groupSum, harmonic, MAX_TERMS, partialSums, SERIES, SERIES_LABELS, term, type SeriesId, type SeriesMistake } from './seriesMath'

// Calc 2, does it add up? The terms of a series are bars on the ground; stacking each bar on top of the
// running total builds a staircase, and you can see whether it levels off (1 + ½ + ¼ + … stops at 2)
// or keeps climbing (1 + ½ + ⅓ + … never stops, however small the bars get).

type Q1 = 'two' | 'climb' | 'onehalf'
const Q1S: { id: Q1; text: string; why?: string }[] = [
  { id: 'two', text: 'It levels off at 2' },
  { id: 'climb', text: 'It keeps climbing: there are infinitely many bars', why: 'Each bar is half the one before, so each one adds half of what’s still missing to 2. The stack creeps up to 2 and never gets past it.' },
  { id: 'onehalf', text: 'It levels off at 1.5', why: 'The first two bars alone reach 1.5, and there are infinitely many more to put on top.' },
]
type Q2 = 'settles' | 'climbs' | 'fast'
const Q2S: { id: Q2; text: string; why?: string; mistake?: SeriesMistake }[] = [
  { id: 'settles', text: 'Yes: the bars shrink to nothing, so the total settles', mistake: 'terms-shrink-so-it-converges', why: 'Shrinking bars are needed, but not enough. These shrink too slowly: the bars from 3 to 4 add more than ½, so do 5 to 8, so do 9 to 16, … Every doubling adds another ½, forever.' },
  { id: 'climbs', text: 'No: it keeps climbing, slower and slower, past any height' },
  { id: 'fast', text: 'No: it shoots up faster and faster', why: 'The bars shrink, so each step up is smaller than the one before. It climbs, but ever more slowly.' },
]

// the harmonic total far out, computed once (a million terms)
const FAR = [60, 1000, 1_000_000].map(harmonic)

const H = 362
const Y_MAX = 5
const box = (w: number, n: number): Box => ({ l: 34, t: 14, w: w - 48, h: 270, x0: 0.5, x1: n + 0.5, y0: 0, y1: Y_MAX })

/** Bars on the ground for the terms, each one stacked again on top of the running total, and the total as a line. */
function StackChart({ w, s, n, stack, grouped }: { w: number; s: SeriesId; n: number; stack: boolean; grouped: boolean }) {
  const b = box(w, n)
  const sums = partialSums(s, n)
  const bw = (b.w / n) * 0.8
  const X = (k: number) => sx(b, k) - bw / 2
  const limit = SERIES[s].limit
  const last = sums[n - 1]
  const gs = grouped ? groups(n) : []
  const groupOf = (k: number) => gs.findIndex(([a, c]) => k >= a && k <= c)
  const yTicks = Array.from({ length: Y_MAX + 1 }, (_, i) => i)
  const xTicks = [1, 5, 10, 20, 30, 40, 50, 60].filter((k) => k <= n)
  const label = `${n} ${n === 1 ? 'term' : 'terms'} of ${SERIES[s].text}: the stack is ${last.toFixed(2)} high${stack ? '' : ' (hidden until you predict)'}`
  return (
    <svg className="calc-svg calc-ser-chart" width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={label}>
      <g className="calc-grid">
        {yTicks.map((y) => <line key={y} x1={b.l} x2={b.l + b.w} y1={sy(b, y)} y2={sy(b, y)} />)}
      </g>
      {yTicks.map((y) => (
        <text key={y} className="calc-axis" x={b.l - 6} y={sy(b, y) + 4} textAnchor="end">{y}</text>
      ))}
      {xTicks.map((k) => (
        <text key={k} className="calc-axis" x={sx(b, k)} y={b.t + b.h + 14} textAnchor="middle">{k}</text>
      ))}
      <text className="calc-sidelab" x={b.l + b.w} y={b.t + b.h + 30} textAnchor="end">term number</text>
      <line className="calc-zero" x1={b.l} x2={b.l + b.w} y1={sy(b, 0)} y2={sy(b, 0)} />
      {stack && limit != null && (
        <>
          <line className="calc-ser-limit" x1={b.l} x2={b.l + b.w} y1={sy(b, limit)} y2={sy(b, limit)} />
          <text className="calc-note" x={b.l + 6} y={sy(b, limit) - 6}>levels off at {limit}</text>
        </>
      )}
      {/* the bars on the ground: how big each term is */}
      {sums.map((_, i) => (
        <rect key={i} className="calc-ser-bar" x={X(i + 1)} y={sy(b, term(s, i + 1))} width={bw} height={sy(b, 0) - sy(b, term(s, i + 1))} />
      ))}
      {/* the same bars stacked: each one sits on the total so far */}
      {stack &&
        sums.map((S, i) => {
          const g = groupOf(i + 1)
          return <rect key={i} className={'calc-ser-block' + (g >= 0 && g % 2 ? ' alt' : '')} x={X(i + 1)} y={sy(b, S)} width={bw} height={Math.max(0.5, sy(b, i ? sums[i - 1] : 0) - sy(b, S))} />
        })}
      {stack && <polyline className="calc-ser-total" points={sums.map((S, i) => `${sx(b, i + 1).toFixed(1)},${sy(b, S).toFixed(1)}`).join(' ')} />}
      {stack && (
        <>
          <circle className="calc-dot" cx={sx(b, n)} cy={sy(b, last)} r={5} />
          <text className="calc-note" x={Math.min(sx(b, n), b.l + b.w - 50)} y={sy(b, last) - 10} textAnchor="middle">{last.toFixed(2)}</text>
        </>
      )}
      {/* the doubling groups under the axis: each complete one adds more than ½ */}
      {stack &&
        gs.map(([a, c], i) => {
          const whole = c === 2 ** (i + 1)
          const y = b.t + b.h + 42
          const wide = X(c) + bw - X(a) // only label a bracket that has room for its text
          return (
            <g key={a} className="calc-ser-group">
              <line x1={X(a)} x2={X(c) + bw} y1={y} y2={y} />
              <line x1={X(a)} x2={X(a)} y1={y - 5} y2={y + 5} />
              <line x1={X(c) + bw} x2={X(c) + bw} y1={y - 5} y2={y + 5} />
              {whole && wide >= 44 && <text className="calc-note" x={(X(a) + X(c) + bw) / 2} y={y + 17} textAnchor="middle">+{groupSum(s, [a, c]).toFixed(2)}{wide >= 80 ? ' > ½' : ''}</text>}
            </g>
          )
        })}
    </svg>
  )
}

export function SeriesStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const [s, setS] = useState<SeriesId>('geometric')
  const [n, setN] = useState(8)
  const [maxH, setMaxH] = useState(0) // the most harmonic terms stacked so far
  const [phase, setPhase] = useState<'q1' | 'geo' | 'q2' | 'end'>('q1')
  const [wrong1, setWrong1] = useState<Q1[]>([])
  const [wrong2, setWrong2] = useState<Q2[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<SeriesMistake[]>([])
  const terms = (k: number) => {
    setN(k)
    if (s === 'harmonic' && phase === 'end') setMaxH((m) => Math.max(m, k))
  }
  const choose = (id: SeriesId) => {
    setS(id)
    if (id === 'harmonic' && phase === 'geo') setPhase('q2')
  }
  const miss = (m: SeriesMistake | undefined, why: string) => {
    setMissed((k) => k + 1)
    if (m) setCaught((c) => (c.includes(m) ? c : [...c, m]))
    setNote(why)
  }
  const pick1 = (c: (typeof Q1S)[number]) => {
    if (c.id === 'two') {
      setPhase('geo')
      setNote(null)
      return
    }
    setWrong1((x) => [...x, c.id])
    miss(undefined, c.why ?? '')
  }
  const pick2 = (c: (typeof Q2S)[number]) => {
    if (c.id === 'climbs') {
      setPhase('end')
      setNote(null)
      setMaxH(n)
      return
    }
    setWrong2((x) => [...x, c.id])
    miss(c.mistake, c.why ?? '')
  }
  const stack = s === 'geometric' ? phase !== 'q1' : phase === 'end'
  const done = phase === 'end' && maxH >= MAX_TERMS
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [done, caught, missed, topic])

  const total = partialSums(s, n)[n - 1]
  return (
    <section className="calc-split calc-ser">
      <div className="calc-side">
        {phase === 'q1' && (
          <div className="calc-card">
            <div className="calc-k">question 1 of 2</div>
            <p className="calc-ask">Stack the bars: 1, then ½ on top of it, then ¼ on top of that, and so on forever. Where does the top of the stack end up?</p>
            <div className="calc-picks" role="group" aria-label="where the halving stack ends up">
              {Q1S.map((c) => (
                <button key={c.id} className={'calc-pick' + (wrong1.includes(c.id) ? ' wrong' : '')} disabled={wrong1.includes(c.id)} onClick={() => pick1(c)}>
                  {wrong1.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  {c.text}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
          </div>
        )}
        {phase === 'geo' && (
          <div className="calc-card">
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> Every bar adds half of what’s still missing to 2, so the stack creeps up to 2 and stops there. Slide the terms and watch it flatten out. That’s a series that adds up: it <b>converges</b>.</span>
            </p>
            <p className="calc-ask">Now switch to the other bars: 1, ½, ⅓, ¼, … (the harmonic series).</p>
            <button className="calc-btn calc-go" onClick={() => choose('harmonic')}>Switch to 1 + ½ + ⅓ + … →</button>
          </div>
        )}
        {phase === 'q2' && (
          <div className="calc-card">
            <div className="calc-k">question 2 of 2</div>
            <p className="calc-ask">These bars shrink to nothing too: term 60 is only {term('harmonic', 60).toFixed(3)} tall. Does this stack level off?</p>
            <div className="calc-picks" role="group" aria-label="does the harmonic stack level off">
              {Q2S.map((c) => (
                <button key={c.id} className={'calc-pick' + (wrong2.includes(c.id) ? ' wrong' : '')} disabled={wrong2.includes(c.id)} onClick={() => pick2(c)}>
                  {wrong2.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  {c.text}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
          </div>
        )}
        {phase === 'end' && (
          <div className="calc-card">
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span>
                <b>Correct!</b> The bars shrink, but too slowly. Look under the axis: bars 3 to 4 add more than ½, bars 5 to 8 add more than ½, bars 9 to 16 again. Every doubling adds another ½, so the stack passes any height you name. It <b>diverges</b>.
              </span>
            </p>
            {!done && <p className="calc-ask">Slide to all {MAX_TERMS} terms to see how slowly it climbs.</p>}
            <div className="calc-ser-sums">
              <span>after 60 terms: <b className="calc-num">{FAR[0].toFixed(2)}</b></span>
              <span>after 1,000: <b className="calc-num">{FAR[1].toFixed(2)}</b></span>
              <span>after 1,000,000: <b className="calc-num">{FAR[2].toFixed(2)}</b></span>
            </div>
            <p className="calc-rule">
              <span>Terms → 0 is <span className="calc-hl">needed</span> for a sum to add up…</span>
              <span>…but it isn’t <span className="calc-hl">enough</span>.</span>
              <span>Halving: stops at 2. Harmonic: never stops.</span>
            </p>
          </div>
        )}
      </div>

      <div className="calc-card calc-tight calc-main">
        <div className="calc-row calc-pad">
          <span className="calc-seg" role="group" aria-label="which series">
            {(['geometric', 'harmonic'] as SeriesId[]).map((id) => (
              <button key={id} aria-pressed={s === id} disabled={id === 'harmonic' && phase === 'q1'} onClick={() => choose(id)}>{SERIES[id].text}</button>
            ))}
          </span>
        </div>
        <div ref={ref}>
          <StackChart w={w} s={s} n={n} stack={stack} grouped={s === 'harmonic' && phase === 'end'} />
        </div>
        <div className="calc-legend">
          <span><i className="calc-l rect" />each term, on the ground</span>
          <span><i className="calc-l gap" />the same term, stacked on the total so far</span>
        </div>
        <label className="calc-lab calc-ser-lab" htmlFor="calc-ser-n">
          Terms: <span className="calc-num">{n}</span>
        </label>
        <input id="calc-ser-n" type="range" min={1} max={MAX_TERMS} step={1} value={n} onChange={(e) => terms(+e.target.value)} />
        <div className="calc-ends"><span>1</span><span>{MAX_TERMS}</span></div>
        <p className="calc-pair" aria-live="polite">
          term {n} is <b className="calc-num">{term(s, n).toFixed(3)}</b> tall{stack ? <> · the stack is <b className="calc-box calc-num">{total.toFixed(3)}</b> high</> : ' · the stack shows once you predict'}
        </p>
      </div>

      {done && (
        <div className="calc-end calc-after" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${SERIES_LABELS[m]}”`).join(' and ')}.` : missed ? 'No mistake named this time.' : <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: polar curves.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
