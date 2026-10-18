import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import { record } from '../../notebook'
import { clamp, ix, local, pathOf, sx, sy, useWidth, type Box } from './plot'
import { bot, BOT_ONLY, ENCLOSED_LABELS, EXACT, gap, N_DONE, N_MAX, readArea, stripsOf, stripSum, top, TOP_ONLY, X0, X1, type AreaPick, type EnclosedMistake, type TopPick } from './enclosedMath'

// Calc 2, area enclosed by two curves: a line and a parabola cross twice. Say which is on top and
// what to add up, then drag one thin strip across the region (it reaches from the bottom curve to the
// top one and paints what it covers), then fill the region with more and more strips.

const STRIP_W = 0.12

type ChartProps = {
  w: number
  /** the strip you drag, and how much of [−1, 2] it has swept */
  x: number
  swept: [number, number] | null
  onDrag?: (x: number) => void
  /** the fill phase: n strips */
  n?: number
  label: string
}

function EnclosedChart({ w, x, swept, onDrag, n, label }: ChartProps) {
  const phone = w < 480
  const b: Box = { l: 30, t: 14, w: w - 40, h: phone ? 220 : 270, x0: -1.6, x1: 2.6, y0: -0.6, y1: 4.6 }
  const h = b.t + b.h + 26
  const active = useRef(false)
  const at = (e: RPointerEvent<SVGSVGElement>) => onDrag?.(clamp(Math.round(ix(b, local(e).px) * 20) / 20, X0, X1))
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!onDrag) return
    const d = e.shiftKey ? 0.5 : 0.1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onDrag(Math.min(X1, Math.round((x + d) * 10) / 10))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onDrag(Math.max(X0, Math.round((x - d) * 10) / 10))
    else return
    e.preventDefault()
  }
  // the region between the curves, from a to c
  const between = (a: number, c: number) => `${pathOf(b, top, a, c, 60)}${pathOf(b, bot, c, a, 60).replace('M', 'L')}Z`
  const sw = x - STRIP_W / 2
  return (
    <svg
      className={'calc-svg' + (onDrag ? ' calc-touch calc-drag' : '')}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role={onDrag ? 'slider' : 'img'}
      tabIndex={onDrag ? 0 : undefined}
      aria-label={label}
      aria-valuemin={onDrag ? X0 : undefined}
      aria-valuemax={onDrag ? X1 : undefined}
      aria-valuenow={onDrag ? x : undefined}
      onKeyDown={key}
      onPointerDown={onDrag ? (e) => (e.currentTarget.setPointerCapture?.(e.pointerId), (active.current = true), at(e)) : undefined}
      onPointerMove={onDrag ? (e) => active.current && at(e) : undefined}
      onPointerUp={() => (active.current = false)}
      onPointerCancel={() => (active.current = false)}
    >
      <g className="calc-grid calc-grid-strong">
        {[-1, 0, 1, 2].map((v) => <line key={'x' + v} x1={sx(b, v)} x2={sx(b, v)} y1={b.t} y2={b.t + b.h} />)}
        {[1, 2, 3, 4].map((v) => <line key={'y' + v} x1={b.l} x2={b.l + b.w} y1={sy(b, v)} y2={sy(b, v)} />)}
      </g>
      <rect className="calc-frame" x={b.l} y={b.t} width={b.w} height={b.h} />
      <line className="calc-zero" x1={b.l} x2={b.l + b.w} y1={sy(b, 0)} y2={sy(b, 0)} />
      <line className="calc-zero" x1={sx(b, 0)} x2={sx(b, 0)} y1={b.t} y2={b.t + b.h} />
      {/* what the strip has painted so far */}
      {swept && n == null && <path className="calc-enc-swept" d={between(swept[0], swept[1])} />}
      {/* the fill phase: n strips from the parabola up to the line */}
      {n != null && (
        <>
          <path className="calc-under" d={between(X0, X1)} />
          {stripsOf(n).map(([x0, sw, lo, hi], i) => (
            <rect key={i} className={'calc-rect' + (n > 40 ? ' thin' : '')} x={sx(b, x0)} y={sy(b, hi)} width={Math.max(0.5, sx(b, x0 + sw) - sx(b, x0))} height={sy(b, lo) - sy(b, hi)} />
          ))}
        </>
      )}
      <path className="calc-ink" d={pathOf(b, top, -1.5, 2.5, 4)} />
      <path className="calc-ink calc-enc-bot" d={pathOf(b, bot, -1.6, 2.2, 80)} />
      <text className="calc-ptitle" x={sx(b, 0.7)} y={sy(b, top(0.7)) - 9} textAnchor="middle">y = x + 2</text>
      <text className="calc-ptitle calc-enc-botlab" x={sx(b, -1.3)} y={sy(b, bot(-1.3)) - 10} textAnchor="middle">y = x²</text>
      {/* the crossings */}
      {[X0, X1].map((c) => <circle key={c} className="calc-dot" cx={sx(b, c)} cy={sy(b, top(c))} r={5} />)}
      {[-1, 0, 1, 2].map((v) => <text key={v} className="calc-axis" x={sx(b, v)} y={b.t + b.h + 18} textAnchor="middle">{v}</text>)}
      {/* the strip you drag: from the parabola up to the line, its height written beside it */}
      {onDrag && (
        <g>
          <rect className="calc-enc-strip" x={sx(b, sw)} y={sy(b, top(x))} width={sx(b, sw + STRIP_W) - sx(b, sw)} height={sy(b, bot(x)) - sy(b, top(x))} />
          <line className="calc-heightbar" x1={sx(b, x)} x2={sx(b, x)} y1={sy(b, top(x))} y2={sy(b, bot(x))} />
          <circle className="calc-handle" cx={sx(b, x)} cy={sy(b, (top(x) + bot(x)) / 2)} r={11} />
          <text className="calc-note" x={sx(b, x) + (x > 1.2 ? -16 : 16)} y={sy(b, (top(x) + bot(x)) / 2) + 5} textAnchor={x > 1.2 ? 'end' : 'start'}>
            {top(x).toFixed(2)} − {bot(x).toFixed(2)} = {gap(x).toFixed(2)}
          </text>
        </g>
      )}
    </svg>
  )
}

const TOPS: { id: TopPick; text: string; why: string }[] = [
  { id: 'parabola', text: 'The parabola y = x²', why: 'Look at x = 0: the line is at 2, the parabola at 0. Between the two crossings the line stays above.' },
  { id: 'line', text: 'The line y = x + 2', why: '' },
  { id: 'turns', text: 'They take turns', why: 'They cross only twice, at x = −1 and x = 2, and between those the line never dips under the parabola.' },
]
const AREAS: { id: AreaPick; text: string; why: string }[] = [
  { id: 'top', text: 'The area under the line', why: 'That counts everything from the line down to the x-axis, including the 3 squares under the parabola, and those are not in the region.' },
  { id: 'minus', text: 'The area under the line minus the area under the parabola', why: '' },
  { id: 'plus', text: 'The area under the line plus the area under the parabola', why: 'Adding counts the part under the parabola twice. The region stops at the parabola, so take that part away.' },
]

export function EnclosedStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [ref, w] = useWidth<HTMLDivElement>(640)
  const [phase, setPhase] = useState<'top' | 'area' | 'strip' | 'fill'>('top')
  const [wrongTop, setWrongTop] = useState<TopPick[]>([])
  const [wrongArea, setWrongArea] = useState<AreaPick[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<EnclosedMistake[]>([])
  const [x, setX] = useState(0)
  const [swept, setSwept] = useState<[number, number] | null>(null)
  const [n, setN] = useState(1)
  const [maxN, setMaxN] = useState(1)

  const miss = (m: EnclosedMistake | null, why: string) => {
    setMissed((k) => k + 1)
    if (m) setCaught((c) => (c.includes(m) ? c : [...c, m]))
    setNote(why)
  }
  const pickTop = (c: (typeof TOPS)[number]) => {
    if (c.id === 'line') {
      setPhase('area')
      setNote(null)
      return
    }
    setWrongTop((ws) => [...ws, c.id])
    miss(null, c.why)
  }
  const pickArea = (c: (typeof AREAS)[number]) => {
    if (c.id === 'minus') {
      setPhase('strip')
      setNote(null)
      return
    }
    setWrongArea((ws) => [...ws, c.id])
    miss(readArea(c.id), c.why)
  }
  const drag = (v: number) => {
    setX(v)
    setSwept((s) => (s ? [Math.min(s[0], v), Math.max(s[1], v)] : [v, v]))
  }
  const share = swept ? (swept[1] - swept[0]) / (X1 - X0) : 0
  const sweptAll = share >= 0.95
  const setCount = (k: number) => {
    setN(k)
    setMaxN((m) => Math.max(m, k))
  }
  const done = phase === 'fill' && maxN >= N_DONE
  const mastered = done && missed === 0
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered, calcTopic: topic })
  }, [done, caught, mastered, topic])

  const sum = stripSum(n)
  const asking = phase === 'top' || phase === 'area'
  return (
    <section>
      <div className="calc-split">
        <div className="calc-card calc-tight calc-main">
          <div className="calc-k calc-pad">{phase === 'strip' ? 'drag the strip across the region' : phase === 'fill' ? `${n} ${n === 1 ? 'strip' : 'strips'}, each from the parabola up to the line` : 'a line and a parabola, crossing at x = −1 and x = 2'}</div>
          <div ref={ref}>
            <EnclosedChart
              w={w}
              x={x}
              swept={swept}
              onDrag={phase === 'strip' ? drag : undefined}
              n={phase === 'fill' ? n : undefined}
              label={phase === 'strip' ? 'drag the strip between the curves' : phase === 'fill' ? `the region between the curves filled with ${n} strips: ${sum.toFixed(3)} squares` : 'the line y = x + 2 and the parabola y = x², crossing at x = −1 and x = 2'}
            />
          </div>
          <div className="calc-legend">
            <span><i className="calc-l ink" />y = x + 2</span>
            <span><i className="calc-l enc" />y = x²</span>
            {phase === 'strip' && <span><i className="calc-l gap" />one strip: top − bottom</span>}
            {phase === 'fill' && <span><i className="calc-l rect" />strips</span>}
          </div>
        </div>
        <div className="calc-side">
          {phase === 'strip' && (
            <>
              <div className="calc-card calc-readout" aria-live="polite">
                <div className="calc-tag">strip at x = {x.toFixed(2)}</div>
                <div className="calc-big">{gap(x).toFixed(2)}</div>
                <div className="calc-sub">
                  tall: line <b className="calc-truthnum">{top(x).toFixed(2)}</b> − parabola <b className="calc-truthnum">{bot(x).toFixed(2)}</b>
                </div>
              </div>
              <div className="calc-meter" aria-label={`swept ${Math.round(share * 100)}% of the region`}>
                <i style={{ width: `${Math.round(share * 100)}%` }} />
              </div>
              <p className="calc-small">{sweptAll ? 'Whole region swept.' : `swept ${Math.round(share * 100)}%: drag from x = −1 all the way to x = 2`}</p>
            </>
          )}
          {phase === 'fill' && (
            <>
              <div className="calc-card calc-readout" aria-live="polite">
                <div className="calc-tag">{n} {n === 1 ? 'strip' : 'strips'}</div>
                <div className="calc-big">{sum.toFixed(3)}</div>
                <div className="calc-sub">
                  {done ? (
                    <>the exact area is <b className="calc-truthnum">{EXACT.toFixed(2)}</b> <span className="calc-chip">exact</span></>
                  ) : (
                    <>under the line alone it would be <b className="calc-truthnum">{TOP_ONLY.toFixed(2)}</b></>
                  )}
                </div>
              </div>
              <div className="calc-card calc-controls">
                <label className="calc-lab" htmlFor="calc-enc-n">
                  Strips: <span className="calc-num">{n}</span>
                </label>
                <input id="calc-enc-n" type="range" min={1} max={N_MAX} value={n} onChange={(e) => setCount(+e.target.value)} />
                <div className="calc-ends"><span>1</span><span>{N_MAX}</span></div>
              </div>
            </>
          )}
          {asking && (
            <div className="calc-card calc-readout">
              <div className="calc-tag">the region</div>
              <div className="calc-sub">Trapped between the two curves, from one crossing to the other. The dots mark the crossings.</div>
            </div>
          )}
        </div>
      </div>

      {phase === 'top' && (
        <div className="calc-card">
          <div className="calc-k">question 1 of 2</div>
          <p className="calc-ask">Between the crossings, which curve is on top?</p>
          <div className="calc-picks" role="group" aria-label="which curve is on top">
            {TOPS.map((c) => (
              <button key={c.id} className={'calc-pick' + (wrongTop.includes(c.id) ? ' wrong' : '')} disabled={wrongTop.includes(c.id)} onClick={() => pickTop(c)}>
                {wrongTop.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                {c.text}
              </button>
            ))}
          </div>
          {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
        </div>
      )}

      {phase === 'area' && (
        <div className="calc-card">
          <p className="calc-correct" role="status">
            <span className="calc-check" aria-hidden="true">✓</span>
            <span><b>Correct!</b> From x = −1 to 2 the line is the top curve and the parabola is the bottom one.</span>
          </p>
          <div className="calc-k">question 2 of 2</div>
          <p className="calc-ask">So the area trapped between them is…</p>
          <div className="calc-picks" role="group" aria-label="what the area between them is">
            {AREAS.map((c) => (
              <button key={c.id} className={'calc-pick' + (wrongArea.includes(c.id) ? ' wrong' : '')} disabled={wrongArea.includes(c.id)} onClick={() => pickArea(c)}>
                {wrongArea.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                {c.text}
              </button>
            ))}
          </div>
          {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
        </div>
      )}

      {phase === 'strip' && (
        <div className="calc-card">
          <p className="calc-correct" role="status">
            <span className="calc-check" aria-hidden="true">✓</span>
            <span><b>Correct!</b> Under the line is {TOP_ONLY}, under the parabola is {BOT_ONLY}, and the region is the difference. Strip by strip: each one is as tall as <b>top − bottom</b> right there.</span>
          </p>
          <p className="calc-ask">Drag the strip from one crossing to the other. It paints the region as it goes.</p>
          <div className="calc-row">
            <button className="calc-btn calc-go" disabled={!sweptAll} onClick={() => setPhase('fill')}>{sweptAll ? 'Fill it with strips →' : 'Sweep the whole region first'}</button>
          </div>
        </div>
      )}

      {phase === 'fill' && (
        <div className="calc-card">
          {!done ? (
            <p className="calc-ask">One strip, as tall as the middle, says {stripSum(1).toFixed(2)}. Slide to more strips and watch where the total settles.</p>
          ) : (
            <>
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span><b>{EXACT} squares.</b> The strips hug the region more closely the thinner they get, and their total settles on 9/2.</span>
              </p>
              <p className="calc-rule">
                <span>Each strip: <span className="calc-hl">(top − bottom) × width</span>. Add them all up.</span>
                <span className="calc-num">∫₋₁² (x + 2 − x²) dx = 9/2</span>
                <span>Not the top curve's area ({TOP_ONLY}): that keeps the {BOT_ONLY} under the parabola, which is outside the region.</span>
              </p>
            </>
          )}
        </div>
      )}

      {done && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${ENCLOSED_LABELS[m]}”`).join(' and ')}.` : null}{' '}
            {mastered && <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: spin a curve into a solid.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
