import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { A, curve, LIMIT_LABELS, limitOf, valueAt, walkers, zoomToWidth, type Curve, type LimitMistake } from './limitMath'
import { CalcEnd } from './CalcEnd'

// Calc 1, what a limit is: a zoom lens over x = 2. Two walkers come in from either side; as you
// zoom in, the window shrinks around the point and you watch where their heights settle.
// First a curve with a hole (the walkers agree: limit 4), then a jump (they don't: no limit).

const W = 520
const H = 300
const PAD = { l: 44, r: 16, t: 16, b: 34 }

/** The lens: the curve inside a window of half-width w around x = A, both walkers, and the point itself. */
function Lens({ c, z, done }: { c: Curve; z: number; done: boolean }) {
  const f = curve(c)
  const { l, r, yl, yr, w } = walkers(c, z)
  // the window in y is centred on the midpoint of the two sides, as tall as it is wide (plus the jump's gap)
  const mid = (yl + yr) / 2
  const hh = w + Math.abs(yr - yl) / 2
  const sx = (x: number) => PAD.l + ((x - (A - w)) / (2 * w)) * (W - PAD.l - PAD.r)
  const sy = (y: number) => PAD.t + (1 - (y - (mid - hh)) / (2 * hh)) * (H - PAD.t - PAD.b)
  const seg = (a: number, b: number) =>
    Array.from({ length: 41 }, (_, k) => a + ((b - a) * k) / 40)
      .map((x) => `${sx(x).toFixed(1)},${sy(f(x)).toFixed(1)}`)
      .join(' ')
  const eps = w * 1e-6
  const v = valueAt(c)
  const lim = limitOf(c)
  const fmt = (t: number) => (w >= 0.05 ? t.toFixed(2) : t.toFixed(4))
  const ticks = [A - w, A, A + w]
  return (
    <svg className="calc-svg calc-lens" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`zoom lens on x = ${A}, window ${fmt(A - w)} to ${fmt(A + w)}: left walker at height ${fmt(yl)}, right walker at ${fmt(yr)}`}>
      <rect className="calc-lens-glass" x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
      {/* the height both sides head for, once you've said so */}
      {done && lim != null && <line className="calc-lens-target" x1={PAD.l} x2={W - PAD.r} y1={sy(lim)} y2={sy(lim)} />}
      <line className="calc-link" x1={sx(A)} x2={sx(A)} y1={PAD.t} y2={H - PAD.b} />
      {/* the curve, left and right of the point */}
      <polyline className="calc-ink" points={seg(A - w, A - eps)} fill="none" />
      <polyline className="calc-ink" points={seg(A + eps, A + w)} fill="none" />
      {/* the point itself: a hole, or a dot */}
      {c === 'hole' ? (
        <circle className="calc-lens-hole" cx={sx(A)} cy={sy(4)} r={7} />
      ) : (
        <>
          <circle className="calc-lens-hole" cx={sx(A)} cy={sy(4)} r={7} />
          <circle className="calc-dot" cx={sx(A)} cy={sy(v!)} r={7} />
        </>
      )}
      {/* the walkers and their heights */}
      <line className="calc-link" x1={sx(l)} x2={PAD.l} y1={sy(yl)} y2={sy(yl)} />
      <line className="calc-link" x1={sx(r)} x2={PAD.l} y1={sy(yr)} y2={sy(yr)} />
      <circle className="calc-handle" cx={sx(l)} cy={sy(yl)} r={8} />
      <circle className="calc-handle right" cx={sx(r)} cy={sy(yr)} r={8} />
      <text className="calc-note" x={sx(l)} y={sy(yl) - 14} textAnchor="middle">from the left</text>
      <text className="calc-note" x={sx(r)} y={sy(yr) + (c === 'jump' ? -14 : 26)} textAnchor="middle">from the right</text>
      <text className="calc-axis" x={PAD.l - 4} y={sy(yl) + 4} textAnchor="end">{fmt(yl)}</text>
      {Math.abs(sy(yr) - sy(yl)) > 12 && <text className="calc-axis" x={PAD.l - 4} y={sy(yr) + 4} textAnchor="end">{fmt(yr)}</text>}
      {ticks.map((t) => (
        <text key={t} className="calc-axis" x={sx(t)} y={H - 12} textAnchor="middle">{t === A ? `x = ${A}` : fmt(t)}</text>
      ))}
    </svg>
  )
}

type Pick = { id: string; text: string; right?: boolean; mistake?: LimitMistake; why?: string }
const Q1: Pick[] = [
  { id: 'four', text: 'They both head for 4: the limit is 4', right: true },
  { id: 'none', text: 'There’s a hole, so there is no limit', mistake: 'limit-needs-the-point', why: 'The limit is about where the walkers are heading, not whether anything is there when they arrive. Both sides close in on 4.' },
  { id: 'two', text: 'The limit is 2, where the hole is', why: 'x = 2 is where you’re walking to; the limit is the height you reach as you get there. Read the walkers’ heights.' },
]
const Q2: Pick[] = [
  { id: 'none', text: 'No limit: the two sides disagree', right: true },
  { id: 'five', text: 'The limit is 5, that’s the dot', mistake: 'limit-is-the-value', why: 'The dot is the value AT x = 2. The limit asks where the walkers are heading, and the left one is heading for 4, not 5.' },
  { id: 'four', text: 'The limit is 4', why: 'From the left, yes. But the walker from the right is heading for 5, and a limit needs both sides to agree.' },
]

export function LimitStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [c, setC] = useState<Curve>('hole')
  const [z, setZ] = useState(0)
  const [maxZ, setMaxZ] = useState(0)
  const [wrong, setWrong] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [done1, setDone1] = useState(false)
  const [done2, setDone2] = useState(false)
  const [caught, setCaught] = useState<LimitMistake[]>([])
  const [missed, setMissed] = useState(0)
  const zoom = (v: number) => {
    setZ(v)
    setMaxZ((m) => Math.max(m, v))
  }
  const zoomed = maxZ >= 80
  const picks = c === 'hole' ? Q1 : Q2
  const choose = (p: Pick) => {
    if (p.right) {
      setNote(null)
      setWrong([])
      if (c === 'hole') setDone1(true)
      else setDone2(true)
      return
    }
    setWrong((w) => [...w, p.id])
    setMissed((m) => m + 1)
    if (p.mistake) setCaught((k) => (k.includes(p.mistake!) ? k : [...k, p.mistake!]))
    setNote(p.why ?? '')
  }
  const next = () => {
    setC('jump')
    setZ(0)
    setMaxZ(0)
    setNote(null)
  }
  const saved = useRef(false)
  useEffect(() => {
    if (!done2 || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [done2, caught, missed, topic])
  const { yl, yr } = walkers(c, z)

  return (
    <section>
      <div className="calc-split">
        <div className="calc-card calc-tight calc-main">
          <div className="calc-k calc-pad">{c === 'hole' ? 'a curve with a hole at x = 2' : 'a curve that jumps at x = 2'} · zoom in on the point</div>
          <Lens c={c} z={z} done={c === 'hole' ? done1 : done2} />
          <label className="calc-range calc-zoom">
            <span>zoom {z === 0 ? '1×' : `${Math.round(1 / zoomToWidth(z) * 2)}×`}</span>
            <input type="range" min={0} max={100} value={z} onChange={(e) => zoom(+e.target.value)} aria-label="zoom in on x = 2" />
          </label>
        </div>
        <div className="calc-side">
          <div className="calc-card calc-readout" aria-live="polite">
            <div className="calc-tag">walking in from the left</div>
            <div className="calc-big">{yl.toFixed(z > 60 ? 3 : 2)}</div>
            <div className="calc-tag">walking in from the right</div>
            <div className="calc-big">{yr.toFixed(z > 60 ? 3 : 2)}</div>
            <div className="calc-sub">{zoomed ? (limitOf(c) != null ? 'closing in on the same height' : 'they never meet') : 'zoom in and watch these two'}</div>
          </div>
        </div>
        <div className="calc-after">
          <div className="calc-card">
            <div className="calc-k">{c === 'hole' ? 'question 1 of 2' : 'question 2 of 2'}</div>
            {!zoomed ? (
              <p className="calc-ask">Two walkers come in toward x = 2, one from each side. Drag the zoom all the way in and watch what height each one is heading for.</p>
            ) : (c === 'hole' && !done1) || (c === 'jump' && !done2) ? (
              <>
                <p className="calc-ask">{c === 'hole' ? 'There’s a hole at x = 2: nothing is there. What is the limit as x → 2?' : 'Now the curve jumps at x = 2, and the dot sits at 5. What is the limit as x → 2?'}</p>
                <div className="calc-picks" role="group" aria-label="what is the limit">
                  {picks.map((p) => (
                    <button key={p.id} className={'calc-pick' + (wrong.includes(p.id) ? ' wrong' : '')} disabled={wrong.includes(p.id)} onClick={() => choose(p)}>
                      {wrong.includes(p.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                      {p.text}
                    </button>
                  ))}
                </div>
                {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
              </>
            ) : c === 'hole' ? (
              <>
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> The limit is 4. Nothing has to be at the point: a limit is where you’re heading, read off the walkers, not what you find when you arrive.</span>
                </p>
                <button className="calc-btn calc-go" onClick={next}>Now a curve that jumps →</button>
              </>
            ) : (
              <>
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> From the left the walker heads for 4, from the right for 5. They never meet, so there is no limit, even though the curve has a perfectly good value (5) at x = 2.</span>
                </p>
                <p className="calc-rule">
                  <span><span className="calc-hl">The limit</span> = the height both walkers close in on.</span>
                  <span>It doesn’t care what’s at the point itself.</span>
                  <span>If the two sides disagree, there is no limit.</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {done2 && <CalcEnd caught={caught.map((m) => `“${LIMIT_LABELS[m]}”`)} mastered={missed === 0} remix="Next: the slope of a curve." onDone={onDone} />}
    </section>
  )
}
