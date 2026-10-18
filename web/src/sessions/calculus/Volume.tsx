import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { CalcEnd } from './CalcEnd'
import { clamp, ix, local, sx, useWidth, type Box } from './plot'
import { Scene3D, SurfaceMesh, type Project, type View } from './Surface'
import { COARSE, columns, columnSum, EXACT, GRIDS, GUESS_MAX, readVolume, ROOF, VOLUME_LABELS, type VolumeMistake } from './volumeMath'

// Calc 3, volume under a surface: fill the space under a curved roof with columns (a 3D Riemann sum).
// Guess the volume first, predict what thinner columns do, then slide to finer grids and watch the
// total close in on the exact double integral.

const FIT = { cx: (ROOF.x0 + ROOF.x1) / 2, cy: (ROOF.y0 + ROOF.y1) / 2, scale: 80, lift: 42 }

/** The columns, each as its visible faces (two sides and the top), drawn back to front, then the roof as a net. */
function Columns({ P, n }: { P: Project; n: number }) {
  const cols = columns(n)
  const height = (i: number, j: number) => (i < 0 || j < 0 || i >= n || j >= n ? 0 : cols[i * n + j][4])
  const boxes = cols.map(([x, y, w, d, h], k) => {
    const i = Math.floor(k / n)
    const j = k % n
    const c = P(x + w / 2, y + d / 2, 0)
    // the four sides as [corner a, corner b, the neighbor across it]; keep the ones that face the viewer,
    // and only the part above that neighbor (it hides the rest), so 40 × 40 stays light enough to turn
    const sides = (
      [
        [x, y, x + w, y, height(i, j - 1)],
        [x + w, y, x + w, y + d, height(i + 1, j)],
        [x + w, y + d, x, y + d, height(i, j + 1)],
        [x, y + d, x, y, height(i - 1, j)],
      ] as const
    )
      .filter(([ax, ay, bx, by, hn]) => hn < h && P((ax + bx) / 2, (ay + by) / 2, 0).depth < c.depth)
      .map(([ax, ay, bx, by, hn]) => [P(ax, ay, hn), P(bx, by, hn), P(bx, by, h), P(ax, ay, h)])
    const top = [P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)]
    return { depth: c.depth, sides, top }
  })
  boxes.sort((a, b) => b.depth - a.depth)
  const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <g className={'calc-3d-cols' + (n > 12 ? ' fine' : '')}>
      {boxes.map((b, i) => (
        <g key={i}>
          {b.sides.map((s, k) => (
            <polygon key={k} className="calc-3d-face" points={pts(s)} />
          ))}
          <polygon className="calc-3d-top" points={pts(b.top)} />
        </g>
      ))}
    </g>
  )
}

/** The guess bar: drag the pencil to a volume; the 2 × 2 total is always marked, the exact one once it's earned. */
function VolumeBar({ w, guess, onGuess, sum, exact }: { w: number; guess: number | null; onGuess?: (v: number) => void; sum?: number; exact: boolean }) {
  const b: Box = { l: 14, t: 34, w: w - 28, h: 26, x0: 0, x1: GUESS_MAX, y0: 0, y1: 1 }
  const h = 104
  const X = (v: number) => sx(b, v)
  const active = useRef(false)
  const set = (e: PointerEvent<SVGSVGElement>) => onGuess?.(Math.round(clamp(ix(b, local(e).px), 0, GUESS_MAX) * 10) / 10)
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!onGuess) return
    const v = guess ?? 7
    const d = e.shiftKey ? 1 : 0.1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onGuess(Math.min(GUESS_MAX, Math.round((v + d) * 10) / 10))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onGuess(Math.max(0, Math.round((v - d) * 10) / 10))
    else return
    e.preventDefault()
  }
  const ticks = Array.from({ length: GUESS_MAX + 1 }, (_, i) => i)
  return (
    <svg
      className={'calc-svg calc-bar' + (onGuess ? ' calc-touch calc-drag' : '')}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role={onGuess ? 'slider' : 'img'}
      tabIndex={onGuess ? 0 : undefined}
      aria-label={onGuess ? 'your volume guess, in cubic units' : `your guess ${guess ?? 'none'}${exact ? ` vs exact ${EXACT}` : ''}`}
      aria-valuemin={onGuess ? 0 : undefined}
      aria-valuemax={onGuess ? GUESS_MAX : undefined}
      aria-valuenow={onGuess && guess != null ? guess : undefined}
      onKeyDown={key}
      onPointerDown={onGuess ? (e) => (e.currentTarget.setPointerCapture?.(e.pointerId), (active.current = true), set(e)) : undefined}
      onPointerMove={onGuess ? (e) => active.current && set(e) : undefined}
      onPointerUp={() => (active.current = false)}
      onPointerCancel={() => (active.current = false)}
    >
      <rect className="calc-track" x={b.l} y={b.t} width={b.w} height={b.h} />
      {exact && guess != null && <rect className="calc-gap" x={Math.min(X(guess), X(EXACT))} y={b.t} width={Math.abs(X(guess) - X(EXACT))} height={b.h} />}
      {ticks.map((t) => (
        <g key={t}>
          <line className="calc-tick" x1={X(t)} x2={X(t)} y1={b.t + b.h} y2={b.t + b.h + 5} />
          {(w > 420 || t % 2 === 0) && <text className="calc-axis" x={X(t)} y={b.t + b.h + 19} textAnchor="middle">{t}</text>}
        </g>
      ))}
      <line className="calc-onerect" x1={X(COARSE)} x2={X(COARSE)} y1={b.t - 4} y2={b.t + b.h} />
      <text className="calc-note" x={X(COARSE)} y={h - 6} textAnchor="middle">2 × 2</text>
      {exact && (
        <>
          <line className="calc-exactline" x1={X(EXACT)} x2={X(EXACT)} y1={b.t - 6} y2={b.t + b.h + 6} />
          <text className="calc-exactlab" x={X(EXACT)} y={h - 6} textAnchor="middle">exact {EXACT}</text>
        </>
      )}
      {sum != null && <rect className="calc-sumtick" x={X(Math.min(GUESS_MAX, sum)) - 2} y={b.t + 3} width={4} height={b.h - 6} />}
      {guess != null && (
        <g>
          <line className="calc-pencil" x1={X(guess)} x2={X(guess)} y1={b.t - 4} y2={b.t + b.h + 4} />
          {onGuess && <circle className="calc-phandle" cx={X(guess)} cy={b.t + b.h / 2} r={11} />}
          <text className="calc-you" x={clamp(X(guess), 20, w - 20)} y={b.t - 10} textAnchor="middle">you</text>
        </g>
      )}
    </svg>
  )
}

type More = 'bigger' | 'smaller' | 'same'
const MORE: { id: More; text: string; why?: string }[] = [
  { id: 'bigger', text: 'Bigger', why: 'There are more columns, but each one is thinner. The 2 × 2 columns already poke out above the roof; thinner ones hug the roof more closely, so they trim that extra.' },
  { id: 'smaller', text: 'Smaller' },
  { id: 'same', text: 'The same', why: 'The space under the roof stays the same, but the columns don’t fit it exactly: they poke out above it, and thinner columns poke out less.' },
]

export function VolumeStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [view, setView] = useState<View>({ yaw: -0.65, pitch: 0.55 })
  const [barRef, bw] = useWidth<HTMLDivElement>(640, 1000)
  const [phase, setPhase] = useState<'guess' | 'more' | 'fill'>('guess')
  const [guess, setGuess] = useState<number | null>(null)
  const [wrong, setWrong] = useState<More[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<VolumeMistake[]>([])
  const [gi, setGi] = useState(0) // which grid in GRIDS
  const [tried, setTried] = useState<number[]>([0]) // the grids you've looked at
  const n = GRIDS[gi]
  const sum = columnSum(n)
  const done = tried.includes(GRIDS.length - 1)
  const read = guess != null && done ? readVolume(guess) : null

  const goGrid = (i: number) => {
    setGi(i)
    setTried((t) => (t.includes(i) ? t : [...t, i]))
  }
  const more = (c: (typeof MORE)[number]) => {
    if (c.id === 'smaller') {
      setPhase('fill')
      goGrid(GRIDS.indexOf(4))
      setNote(null)
      return
    }
    setWrong((w) => [...w, c.id])
    setMissed((k) => k + 1)
    if (c.id === 'bigger') setCaught((m) => (m.includes('more-columns-more-volume') ? m : [...m, 'more-columns-more-volume']))
    setNote(c.why ?? '')
  }

  // the guess is read once the exact volume is on screen: it can name the same mistake
  const allCaught = read?.mistake && !caught.includes(read.mistake) ? [...caught, read.mistake] : caught
  const mastered = done && missed === 0 && !!read?.close
  const first = allCaught[0] ?? null
  const saved = useRef(false)
  useEffect(() => {
    if (!done || guess == null || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess, misconception: first, rematch: null, mastered, calcTopic: topic })
  }, [done, guess, first, mastered, topic])

  return (
    <section className="calc-surface">
      <div className="calc-split calc-volsplit">
        <div className="calc-card calc-tight calc-main">
          <div className="calc-k calc-pad">z = f(x, y) over a 3 × 2 rectangle · drag to turn it</div>
          <Scene3D
            view={view}
            setView={setView}
            surf={ROOF}
            fit={FIT}
            label={`A curved roof over a 3 by 2 rectangle, filled with ${n} × ${n} columns that add up to ${sum.toFixed(2)} cubic units. Drag or use the arrow keys to turn it.`}
          >
            {(P) => (
              <>
                <Columns P={P} n={n} />
                <SurfaceMesh P={P} surf={ROOF} wire n={12} />
              </>
            )}
          </Scene3D>
          <div className="calc-legend">
            <span><i className="calc-l col" />columns</span>
            <span><i className="calc-l roof" />the roof, z = f(x, y)</span>
          </div>
        </div>
        <div className="calc-side">
          <div className="calc-card calc-readout" aria-live="polite">
            <div className="calc-tag">{n} × {n} = {n * n} columns</div>
            <div className="calc-big">{sum.toFixed(2)}</div>
            <div className="calc-sub">
              {done ? (
                <>the exact volume is <b className="calc-truthnum">{EXACT}</b> <span className="calc-chip">exact</span></>
              ) : (
                <>your guess: <b className="calc-pencil-c">{guess == null ? '?' : guess.toFixed(1)}</b> cubic units</>
              )}
            </div>
          </div>
          {phase === 'fill' && (
            <div className="calc-card calc-controls">
              <label className="calc-lab" htmlFor="calc-grid">
                Columns per side: <span className="calc-num">{n}</span>
              </label>
              <input id="calc-grid" type="range" min={0} max={GRIDS.length - 1} step={1} value={gi} onChange={(e) => goGrid(+e.target.value)} />
              <div className="calc-ends"><span>2 × 2</span><span>40 × 40</span></div>
              <table className="calc-sums">
                <caption className="calc-tag">every grid you’ve tried</caption>
                <tbody>
                  {GRIDS.map((g, i) => (
                    <tr key={g} className={i === gi ? 'on' : undefined}>
                      <th scope="row">{g} × {g}</th>
                      <td className="calc-num">{tried.includes(i) ? columnSum(g).toFixed(2) : '?'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="calc-card calc-tight">
        <div className="calc-tag calc-pad">{phase === 'guess' ? 'drag your pencil to the real volume under the roof, in cubic units' : 'your pencil vs the columns'}</div>
        <div ref={barRef}>
          <VolumeBar w={bw} guess={guess} onGuess={phase === 'guess' ? setGuess : undefined} sum={phase === 'fill' ? sum : undefined} exact={done} />
        </div>
      </div>

      {phase === 'guess' && (
        <div className="calc-row">
          <button className="calc-btn calc-go" disabled={guess == null} onClick={() => setPhase('more')}>{guess == null ? 'Drag the pencil on the bar first' : 'Use thinner columns →'}</button>
        </div>
      )}

      {phase === 'more' && (
        <div className="calc-card">
          <div className="calc-k">predict</div>
          <p className="calc-ask">Next the grid goes from 2 × 2 to 4 × 4: four times as many columns, each standing on a quarter as much floor. Will their total be bigger, smaller, or the same as {COARSE.toFixed(1)}?</p>
          <div className="calc-picks" role="group" aria-label="bigger, smaller or the same">
            {MORE.map((c) => (
              <button key={c.id} className={'calc-pick' + (wrong.includes(c.id) ? ' wrong' : '')} disabled={wrong.includes(c.id)} onClick={() => more(c)}>
                {wrong.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                {c.text}
              </button>
            ))}
          </div>
          {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
        </div>
      )}

      {phase === 'fill' && (
        <div className="calc-card">
          {!done ? (
            <>
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span><b>Correct!</b> 4 × 4 gives {columnSum(4).toFixed(2)}, less than {COARSE.toFixed(1)}. Each column is as tall as the roof at its corner by the origin, where the roof is highest, so every column pokes out a little. Thinner columns poke out less.</span>
              </p>
              <p className="calc-ask">Keep going: slide to finer grids, all the way to 40 × 40, and watch where the total settles.</p>
            </>
          ) : (
            <>
              {read && <GuessVerdict guess={guess!} mistake={read.mistake} close={read.close} />}
              <p className="calc-rule">
                <span>Each column: <span className="calc-hl">height × floor area</span>. Add them all up.</span>
                <span>Thinner columns hug the roof, and the total settles on one number:</span>
                <span>the double integral <span className="calc-box calc-num">∬ f(x, y) dA = {EXACT}</span>.</span>
              </p>
            </>
          )}
        </div>
      )}
      {done && read && <CalcEnd caught={allCaught.map((m) => `“${VOLUME_LABELS[m]}”`)} mastered={mastered} remix="" onDone={onDone} />}
    </section>
  )
}

/** Was the first guess right? Read once the exact volume is on screen. */
function GuessVerdict({ guess, mistake, close }: { guess: number; mistake: VolumeMistake | null; close: boolean }) {
  if (close)
    return (
      <p className="calc-correct" role="status">
        <span className="calc-check" aria-hidden="true">✓</span>
        <span><b>Correct!</b> Your guess, {guess.toFixed(1)}, was within 15% of the exact volume, {EXACT}. You pictured the space under the roof, not the columns poking out above it.</span>
      </p>
    )
  return (
    <p className="calc-wrong" role="status">
      <b>✗ Not quite.</b> You guessed {guess.toFixed(1)}; the exact volume is {EXACT}.{' '}
      {mistake
        ? `That's at or above even the 2 × 2 total, ${COARSE.toFixed(1)}. Those columns already poke out above the roof, so the real volume has to be less: thinner columns only trim.`
        : guess < EXACT
          ? 'The columns only poke out a little above the roof, so the volume is just under their total, not far below it.'
          : 'The overshoot shrinks all the way to 0 as the columns get thinner, so the volume is lower than it looks.'}
    </p>
  )
}
