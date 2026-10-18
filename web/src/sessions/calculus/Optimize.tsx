import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { atBest, BEST, BOX_LABELS, CUTS, SHEET, V, V_BEST, Vp, X_MAX, type BoxMistake } from './boxMath'
import { CalcEnd } from './CalcEnd'
import { pathOf, sx, sy, type Box } from './plot'

// Calc 1, maximums and minimums: a box folded from a 12 × 12 sheet with its corners cut out.
// Slide the cut and the sheet redraws; the volume curve builds up as you go; the tangent on it
// goes flat at the biggest box (x = 2) and again at x = 6, where there's no box at all.

/** The sheet with four corners of side x cut away, the fold lines dashed, the floor of the box in marker. */
function Sheet({ x }: { x: number }) {
  const S = 200
  const p = 14
  const k = (v: number) => p + (v / SHEET) * S
  const cut = k(x) - k(0)
  const corners = [
    [p, p],
    [p + S - cut, p],
    [p, p + S - cut],
    [p + S - cut, p + S - cut],
  ]
  return (
    <svg className="calc-mini calc-sheet" width={S + 2 * p} height={S + 2 * p} viewBox={`0 0 ${S + 2 * p} ${S + 2 * p}`} role="img" aria-label={`a 12 by 12 sheet with ${x.toFixed(1)} cut from each corner; the box's floor is ${(SHEET - 2 * x).toFixed(1)} square`}>
      <rect className="calc-sheet-paper" x={p} y={p} width={S} height={S} />
      <rect className="calc-sheet-floor" x={k(x)} y={k(x)} width={S - 2 * cut} height={S - 2 * cut} />
      {corners.map(([cx, cy], i) => (
        <rect key={i} className="calc-sheet-cut" x={cx} y={cy} width={cut} height={cut} />
      ))}
      {/* fold lines */}
      <line className="calc-sheet-fold" x1={k(x)} x2={k(x)} y1={k(x)} y2={k(SHEET - x)} />
      <line className="calc-sheet-fold" x1={k(SHEET - x)} x2={k(SHEET - x)} y1={k(x)} y2={k(SHEET - x)} />
      <line className="calc-sheet-fold" x1={k(x)} x2={k(SHEET - x)} y1={k(x)} y2={k(x)} />
      <line className="calc-sheet-fold" x1={k(x)} x2={k(SHEET - x)} y1={k(SHEET - x)} y2={k(SHEET - x)} />
      <text className="calc-note" x={k(SHEET / 2)} y={k(SHEET / 2) + 5} textAnchor="middle">{(SHEET - 2 * x).toFixed(1)} × {(SHEET - 2 * x).toFixed(1)}</text>
      {x > 0.6 && <text className="calc-note" x={k(x / 2)} y={k(x / 2) + 5} textAnchor="middle">{x.toFixed(1)}</text>}
    </svg>
  )
}

/** V(x) with the part you've visited in ink, the tangent at x, and the two flat spots once you've been past them. */
function VolumeChart({ x, seen }: { x: number; seen: number }) {
  const w = 300
  const h = 190
  const b: Box = { l: 36, t: 14, w: w - 48, h: h - 44, x0: 0, x1: X_MAX, y0: 0, y1: 140 }
  const s = Vp(x)
  const tan = (t: number) => V(x) + s * (t - x)
  const ta = Math.max(0, x - 0.7)
  const tb = Math.min(X_MAX, x + 0.7)
  return (
    <svg className="calc-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`volume of the box against the cut; at x = ${x.toFixed(1)} the volume is ${V(x).toFixed(0)} and the slope is ${s.toFixed(0)}`}>
      <g className="calc-grid">
        {[0, 2, 4, 6].map((t) => (
          <line key={t} x1={sx(b, t)} x2={sx(b, t)} y1={b.t} y2={b.t + b.h} />
        ))}
      </g>
      <line className="calc-zero" x1={b.l} x2={b.l + b.w} y1={sy(b, 0)} y2={sy(b, 0)} />
      <path className="calc-pencil" d={pathOf(b, V)} />
      <path className="calc-ink" d={pathOf(b, V, 0, seen)} />
      {seen >= 5.9 && FLATS.map((t) => <circle key={t} className="calc-mk" cx={sx(b, t)} cy={sy(b, V(t))} r={5} />)}
      <line className="calc-tangent" x1={sx(b, ta)} y1={sy(b, Math.max(0, tan(ta)))} x2={sx(b, tb)} y2={sy(b, Math.max(0, tan(tb)))} />
      <circle className="calc-handle" cx={sx(b, x)} cy={sy(b, V(x))} r={7} />
      {[0, 2, 4, 6].map((t) => (
        <text key={t} className="calc-axis" x={sx(b, t)} y={h - 10} textAnchor="middle">{t}</text>
      ))}
      <text className="calc-axis" x={b.l - 6} y={sy(b, V_BEST) + 4} textAnchor="end">128</text>
      <text className="calc-sidelab" x={w - 10} y={b.t + 12} textAnchor="end">cut x</text>
    </svg>
  )
}
const FLATS = [2, 6]

type Pick = { id: string; text: string; right?: boolean; mistake?: BoxMistake; why?: string }
const Q2: Pick[] = [
  { id: 'two', text: 'x = 2: the top of the hill', right: true },
  { id: 'both', text: 'Both: slope 0 always means a maximum', mistake: 'flat-means-max', why: 'Slope 0 only says the curve is flat there. At x = 6 it’s flat at the bottom: the sides are gone and the box holds nothing.' },
  { id: 'six', text: 'x = 6: the slope is 0 there too', mistake: 'flat-means-max', why: 'The slope is 0 at x = 6, but look at the curve: that’s the bottom, with volume 0. Flat doesn’t mean highest.' },
]

export function OptimizeStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [x, setX] = useState(1)
  const [seen, setSeen] = useState(1)
  const [guess, setGuess] = useState<number | null>(null)
  const [wrongCut, setWrongCut] = useState<number[]>([])
  const [wrong, setWrong] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [picked, setPicked] = useState(false)
  const [caught, setCaught] = useState<BoxMistake[]>([])
  const [missed, setMissed] = useState(0)
  const move = (v: number) => {
    setX(v)
    setSeen((s) => Math.max(s, v))
  }
  const guessCut = (c: number) => {
    if (c === BEST) {
      setGuess(c)
      setNote(null)
      return
    }
    setWrongCut((w) => [...w, c])
    setMissed((m) => m + 1)
    setNote(`A cut of ${c} makes a box of ${V(c)}; there's a bigger one. Look at the sheet: a small cut gives a wide, flat tray; a big cut gives a tall, narrow one.`)
  }
  const explored = seen >= 5.9
  const choose = (p: Pick) => {
    if (p.right) {
      setPicked(true)
      setNote(null)
      return
    }
    setWrong((w) => [...w, p.id])
    setMissed((m) => m + 1)
    if (p.mistake) setCaught((k) => (k.includes(p.mistake!) ? k : [...k, p.mistake!]))
    setNote(p.why ?? '')
  }
  const done = picked && atBest(x)
  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: guess ?? '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [done, guess, caught, missed, topic])

  return (
    <section>
      <div className="calc-two">
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">a 12 × 12 sheet · cut x from each corner, fold the sides up</div>
          <Sheet x={x} />
          <label className="calc-range">
            <span>cut {x.toFixed(1)}</span>
            <input type="range" min={0} max={X_MAX} step={0.1} value={x} onChange={(e) => move(+e.target.value)} disabled={guess == null} aria-label="the cut, x" />
          </label>
        </div>
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">volume of the box, V = x(12 − 2x)²</div>
          {guess != null ? <VolumeChart x={x} seen={seen} /> : <p className="calc-small">The volume curve draws itself here as you slide the cut.</p>}
          <p className="calc-pair">
            box <b className="calc-num">{(SHEET - 2 * x).toFixed(1)} × {(SHEET - 2 * x).toFixed(1)} × {x.toFixed(1)}</b> · volume <b className="calc-box calc-num">{V(x).toFixed(0)}</b>
            {guess != null && <> · slope <b className="calc-hl calc-num">{Vp(x).toFixed(0)}</b></>}
          </p>
        </div>
      </div>
      <div className="calc-card">
        {guess == null && (
          <>
            <div className="calc-k">question 1 of 2 · predict</div>
            <p className="calc-ask">Cutting bigger corners makes the box taller but its floor smaller. Which cut do you think holds the most?</p>
            <div className="calc-picks calc-picks-row" role="group" aria-label="which cut">
              {CUTS.map((c) => (
                <button key={c} className={'calc-pick' + (wrongCut.includes(c) ? ' wrong' : '')} disabled={wrongCut.includes(c)} onClick={() => guessCut(c)}>
                  {wrongCut.includes(c) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  cut {c}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another cut.</p>}
          </>
        )}
        {guess != null && !explored && (
          <>
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> A cut of 2 makes an 8 × 8 × 2 box: {V_BEST}. Now slide the cut all the way from 0 to 6 and watch the slope on the volume curve.</span>
            </p>
          </>
        )}
        {explored && !picked && (
          <>
            <div className="calc-k">question 2 of 2</div>
            <p className="calc-ask">The tangent went flat twice: at x = 2 and at x = 6 (the two marked dots). Which flat spot is the biggest box?</p>
            <div className="calc-picks" role="group" aria-label="which flat spot">
              {Q2.map((p) => (
                <button key={p.id} className={'calc-pick' + (wrong.includes(p.id) ? ' wrong' : '')} disabled={wrong.includes(p.id)} onClick={() => choose(p)}>
                  {wrong.includes(p.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                  {p.text}
                </button>
              ))}
            </div>
            {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
          </>
        )}
        {picked && !done && (
          <>
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> Slope 0 finds the candidates; you still have to look. At x = 2 the curve rises, flattens, then falls: a top. At x = 6 it falls to 0 and flattens: a bottom.</span>
            </p>
            <p className="calc-ask">Last step: slide the cut back to the top of the hill.</p>
          </>
        )}
        {done && (
          <>
            <p className="calc-correct" role="status">
              <span className="calc-check" aria-hidden="true">✓</span>
              <span><b>Correct!</b> Cut {x.toFixed(1)}: the biggest box, {V(x).toFixed(0)}, right where the slope is 0 and the curve turns from rising to falling.</span>
            </p>
            <p className="calc-rule">
              <span>To find the biggest (or smallest): find where <span className="calc-hl">slope = 0</span>.</span>
              <span>Then check each one: rising then falling = a max, falling then rising = a min.</span>
            </p>
          </>
        )}
      </div>
      {done && <CalcEnd caught={caught.map((m) => `“${BOX_LABELS[m]}”`)} mastered={missed === 0} remix="Next: two speeds tied together by a ladder." onDone={onDone} />}
    </section>
  )
}
