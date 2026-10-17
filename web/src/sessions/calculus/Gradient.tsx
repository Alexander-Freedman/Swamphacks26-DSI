import { useEffect, useRef, useState } from 'react'
import { record } from '../../notebook'
import { ARROWS, atTop, climb, GRAD_LABELS, grad, gz, len, RIDGE, START, walk, type ArrowId, type GradMistake, type Vec } from './gradientMath'
import { FloorArrow, SliceChart, SurfaceView, type Project, type View } from './Surface'

// Calc 3, the gradient: on a long hill, pick which arrow on the floor points steepest uphill,
// see the real one built from the two slices' slopes, then walk uphill along it until it shrinks to nothing.

const PICK_WHY: Record<Exclude<ArrowId, 'grad'>, string> = {
  top: `A points straight at the top, but walking that way climbs only ${climb(START, ARROWS[0].dir).toFixed(2)} per step. The hill is narrow in y, so it's steeper to head across it first.`,
  level: 'C runs along the side of the hill: walking that way your height stays the same (it climbs 0.00 per step).',
}

type Grow = 'longer' | 'shrinks' | 'same'
const GROW: { id: Grow; text: string; why?: string }[] = [
  { id: 'longer', text: 'It gets longer: higher up is steeper', why: 'Height isn’t steepness. Near the top the hill flattens out, the same way the slope of a curve is 0 at the top of a hill.' },
  { id: 'shrinks', text: 'It shrinks to nothing at the top' },
  { id: 'same', text: 'It stays the same length', why: 'The arrow’s length is how steep the hill is right where you stand, and that changes as you climb.' },
]

/** Arrows on the floor are drawn this many floor units per unit of steepness, so a length of 1.23 reads clearly. */
const k = 1.5
const n2 = (v: number) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2)

export function GradientStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [view, setView] = useState<View>({ yaw: -0.25, pitch: 0.95 })
  const [phase, setPhase] = useState<'pick' | 'grow' | 'walk'>('pick')
  const [wrongArrows, setWrongArrows] = useState<ArrowId[]>([])
  const [wrongGrow, setWrongGrow] = useState<Grow[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<GradMistake[]>([])
  const [path, setPath] = useState<Vec[]>([START])
  const p = path[path.length - 1]
  const g = grad(p)
  const top = phase === 'walk' && atTop(p)

  const miss = (m: GradMistake | null, why: string) => {
    setMissed((k) => k + 1)
    if (m) setCaught((c) => (c.includes(m) ? c : [...c, m]))
    setNote(why)
  }
  const pick = (id: ArrowId) => {
    if (id === 'grad') {
      setPhase('grow')
      setNote(null)
      return
    }
    setWrongArrows((w) => [...w, id])
    miss(id === 'top' ? 'gradient-points-at-peak' : null, PICK_WHY[id])
  }
  const guessGrow = (c: (typeof GROW)[number]) => {
    if (c.id === 'shrinks') {
      setPhase('walk')
      setNote(null)
      return
    }
    setWrongGrow((w) => [...w, c.id])
    miss(c.id === 'longer' ? 'gradient-is-height' : null, c.why ?? '')
  }

  const saved = useRef(false)
  useEffect(() => {
    if (!top || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [top, caught, missed, topic])

  const shown = phase !== 'pick'
  const trail = (P: Project, onSurface: boolean) =>
    path.map((q) => P(q.x, q.y, onSurface ? gz(q.x, q.y) : 0)).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')

  return (
    <section className="calc-surface">
      <div className="calc-two calc-3d-wrap">
        <div className="calc-card calc-tight">
          <div className="calc-k calc-pad">a long hill · drag to turn it</div>
          <SurfaceView
            view={view}
            setView={setView}
            surf={RIDGE}
            x0={p.x}
            y0={p.y}
            showX={shown}
            showY={shown}
            overlay={(P) => (
              <>
                {path.length > 1 && <polyline className="calc-3d-trail" points={trail(P, false)} />}
                {path.length > 1 && <polyline className="calc-3d-trail on" points={trail(P, true)} />}
                {!shown &&
                  ARROWS.map((a) => (
                    <FloorArrow key={a.id} P={P} x={p.x} y={p.y} dx={a.dir.x * 1.6} dy={a.dir.y * 1.6} label={a.name} className={'pick' + (wrongArrows.includes(a.id) ? ' out' : '')} />
                  ))}
                {shown && (
                  <>
                    <FloorArrow P={P} x={p.x} y={p.y} dx={k * g.x} dy={0} className="sx" />
                    <FloorArrow P={P} x={p.x + k * g.x} y={p.y} dx={0} dy={k * g.y} className="sy" />
                    <FloorArrow P={P} x={p.x} y={p.y} dx={k * g.x} dy={k * g.y} label="∇f" className="grad" />
                  </>
                )}
              </>
            )}
          />
          <p className="calc-pair">
            dot at x = <b className="calc-num">{p.x.toFixed(2)}</b>, y = <b className="calc-num">{p.y.toFixed(2)}</b> · height <b className="calc-box calc-num">{gz(p.x, p.y).toFixed(2)}</b>
          </p>
        </div>
        <div className="calc-side calc-slices">
          {shown ? (
            <>
              <div className="calc-card calc-grad-read" aria-live="polite">
                <div className="calc-k">the gradient under the dot</div>
                <p className="calc-grad-eq">
                  ∇f = (<b className="calc-num calc-gx">{n2(g.x)}</b>, <b className="calc-num calc-gy">{n2(g.y)}</b>)
                </p>
                <p className="calc-pair">
                  length <b className="calc-hl calc-num">{n2(len(g))}</b> = how steep it is here
                </p>
              </div>
              <div className="calc-slice-pair">
                <div className="calc-card calc-tight">
                  <div className="calc-k calc-pad">slice along x</div>
                  <SliceChart along="x" x0={p.x} y0={p.y} surf={RIDGE} />
                  <p className="calc-pair">∂f/∂x = <b className="calc-num calc-gx">{n2(g.x)}</b></p>
                </div>
                <div className="calc-card calc-tight">
                  <div className="calc-k calc-pad">slice along y</div>
                  <SliceChart along="y" x0={p.x} y0={p.y} surf={RIDGE} />
                  <p className="calc-pair">∂f/∂y = <b className="calc-num calc-gy">{n2(g.y)}</b></p>
                </div>
              </div>
            </>
          ) : (
            <p className="calc-small">Turn the hill around first: it’s long in the x direction and narrow in y. The gradient and both slices show up here once you pick.</p>
          )}
        </div>
      </div>

      {phase === 'pick' && (
        <div className="calc-card">
          <div className="calc-k">question 1 of 2</div>
          <p className="calc-ask">Three arrows start under the dot. If you stand on the dot, which one points the steepest way up the hill?</p>
          <div className="calc-picks calc-picks-row" role="group" aria-label="which arrow is steepest uphill">
            {ARROWS.map((a) => (
              <button key={a.id} className={'calc-pick' + (wrongArrows.includes(a.id) ? ' wrong' : '')} disabled={wrongArrows.includes(a.id)} onClick={() => pick(a.id)}>
                {wrongArrows.includes(a.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                arrow {a.name}
              </button>
            ))}
          </div>
          {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another arrow.</p>}
        </div>
      )}

      {phase === 'grow' && (
        <div className="calc-card">
          <p className="calc-correct" role="status">
            <span className="calc-check" aria-hidden="true">✓</span>
            <span>
              <b>Correct!</b> B climbs {len(grad(START)).toFixed(2)} per step, faster than any other direction (A climbs {climb(START, ARROWS[0].dir).toFixed(2)}, C stays level). That arrow is the <b>gradient</b>, ∇f. It’s built from the two slices: go ∂f/∂x along x, then ∂f/∂y along y.
            </span>
          </p>
          <div className="calc-k">question 2 of 2</div>
          <p className="calc-ask">Next you’ll walk uphill by following the arrow. As you climb, what happens to the arrow?</p>
          <div className="calc-picks" role="group" aria-label="what happens to the arrow">
            {GROW.map((c) => (
              <button key={c.id} className={'calc-pick' + (wrongGrow.includes(c.id) ? ' wrong' : '')} disabled={wrongGrow.includes(c.id)} onClick={() => guessGrow(c)}>
                {wrongGrow.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                {c.text}
              </button>
            ))}
          </div>
          {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try another one.</p>}
        </div>
      )}

      {phase === 'walk' && (
        <div className="calc-card">
          {!top ? (
            <>
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span><b>Correct!</b> The arrow’s length is how steep the hill is. At the very top nothing goes up, so it shrinks to nothing.</span>
              </p>
              <p className="calc-ask">Now walk: each step moves the dot along the arrow. Keep stepping until the arrow is gone.</p>
              <div className="calc-row">
                <button className="calc-btn calc-go" onClick={() => setPath((a) => [...a, walk(a[a.length - 1])])}>Take a step along the arrow</button>
                <span className="calc-small">
                  {path.length - 1} {path.length === 2 ? 'step' : 'steps'} · arrow length <b className="calc-num">{n2(len(g))}</b>
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span>
                  <b>Correct!</b> You’re on top: the arrow has shrunk to almost nothing (length {n2(len(g))}), and right at the peak ∇f = (0, 0), so no direction goes up. Look at your path: it curved. It cut across to the ridge first, then ran along it, because the arrow points steepest uphill, not straight at the top.
                </span>
              </p>
              <p className="calc-rule">
                <span><span className="calc-hl">∇f</span> = (∂f/∂x, ∂f/∂y): the two slopes, put together.</span>
                <span>It points the steepest way uphill.</span>
                <span>Its length is how steep. At the top it’s 0.</span>
              </p>
            </>
          )}
        </div>
      )}
      {top && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${GRAD_LABELS[m]}”`).join(' and ')}.` : missed ? 'No mistake named this time.' : <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} Next: the volume under a surface.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
