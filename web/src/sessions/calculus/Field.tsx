import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { FIELD_LABELS, FIELDS, fieldOf, flow, GRID, len, R, speed, type FieldId, type FieldMistake, type Vec } from './fieldMath'
import { reducedMotion } from './plot'

// Calc 3, vector fields: a grid of small arrows (which way the water flows at each spot, and how fast).
// Predict where a leaf goes in the whirl, drop leaves and watch the arrows carry them along a dotted
// trail (equal time steps, so dots far apart = fast), then the same on the source field.

const W = 400 // viewBox, square
const px = (x: number) => ((x + R) / (2 * R)) * W
const py = (y: number) => W - ((y + R) / (2 * R)) * W
const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

type Leaf = { id: number; trail: Vec[]; shown: number }

/** The arrows on their grid, then every leaf's trail so far and the leaf itself at its end. */
function FieldView({ id, leaves, onDrop, label }: { id: FieldId; leaves: Leaf[]; onDrop?: (p: Vec) => void; label: string }) {
  const f = fieldOf(id)
  const toField = (e: PointerEvent<SVGSVGElement>): Vec => {
    const r = e.currentTarget.getBoundingClientRect()
    const k = r.width ? W / r.width : 1
    const ux = (e.clientX - r.left) * k
    const uy = (e.clientY - r.top) * k
    const c = (v: number) => Math.min(R - 0.15, Math.max(-R + 0.15, v))
    return { x: c((ux / W) * 2 * R - R), y: c(R - (uy / W) * 2 * R) }
  }
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!onDrop) return
    e.preventDefault()
    onDrop(toField(e))
  }
  // keyboard: Enter or Space drops a leaf at a spot that shows off this field
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!onDrop || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    onDrop({ x: 1.5, y: 0.5 })
  }
  return (
    <svg className={'calc-fld' + (onDrop ? ' tap' : '')} viewBox={`0 0 ${W} ${W}`} role="img" tabIndex={onDrop ? 0 : undefined} aria-label={label} onPointerDown={down} onKeyDown={key}>
      <rect className="calc-ctr-paper" x={0} y={0} width={W} height={W} />
      <line className="calc-3d-axis" x1={0} y1={py(0)} x2={W} y2={py(0)} />
      <line className="calc-3d-axis" x1={px(0)} y1={0} x2={px(0)} y2={W} />
      <text className="calc-3d-lab" x={W - 12} y={py(0) - 5}>x</text>
      <text className="calc-3d-lab" x={px(0) + 6} y={13}>y</text>
      <g className="calc-fld-arrows">
        {GRID.map((p, i) => {
          const v = f.F(p)
          const l = len(v)
          if (l < 0.05) return <circle key={i} cx={px(p.x)} cy={py(p.y)} r={2.5} />
          const L = Math.min(0.5, 0.14 * l) // drawn length: longer = faster, capped so neighbours don't touch
          const u = { x: v.x / l, y: v.y / l }
          const a = { x: p.x - (L / 2) * u.x, y: p.y - (L / 2) * u.y }
          const b = { x: p.x + (L / 2) * u.x, y: p.y + (L / 2) * u.y }
          const head = Math.min(0.14, L * 0.45)
          const side = (s: number) => ({ x: px(b.x - head * u.x - s * head * 0.6 * u.y), y: py(b.y - head * u.y + s * head * 0.6 * u.x) })
          return (
            <g key={i} style={{ opacity: 0.45 + 0.55 * Math.min(1, l / 3.5) }}>
              <line x1={px(a.x)} y1={py(a.y)} x2={px(b.x - head * u.x * 0.7)} y2={py(b.y - head * u.y * 0.7)} />
              <polygon points={pts([{ x: px(b.x), y: py(b.y) }, side(1), side(-1)])} />
            </g>
          )
        })}
      </g>
      {leaves.map((lf) => {
        const seen = lf.trail.slice(0, lf.shown)
        const end = seen[seen.length - 1]
        const gone = Math.max(Math.abs(end.x), Math.abs(end.y)) > R // off the picture (the svg clips the trail there)
        return (
          <g key={lf.id} className="calc-fld-leaf">
            {seen.filter((_, k) => k % 2 === 0).map((q, k) => (
              <circle key={k} className="calc-fld-dot" cx={px(q.x)} cy={py(q.y)} r={2.2} />
            ))}
            <circle className="calc-fld-start" cx={px(lf.trail[0].x)} cy={py(lf.trail[0].y)} r={4} />
            {!gone && <circle className="calc-fld-end" cx={px(end.x)} cy={py(end.y)} r={7} />}
          </g>
        )
      })}
    </svg>
  )
}

/* ---------- the activity ---------- */

type Phase = 'q1' | 'drop1' | 'q2' | 'explore'
type Whirl = 'circle' | 'in' | 'out' | 'straight'
const WHIRL: { id: Whirl; text: string; why?: string }[] = [
  { id: 'circle', text: 'Round and round in a circle' },
  { id: 'in', text: 'Spirals in to the middle', why: 'Every arrow is at right angles to the line from the middle: the water pushes the leaf sideways, never inward. Its distance from the middle never changes.' },
  { id: 'out', text: 'Spirals out to the edge', why: 'Every arrow is at right angles to the line from the middle: the water pushes the leaf sideways, never outward. Its distance from the middle never changes.' },
  { id: 'straight', text: 'Straight along the arrow it lands on', why: 'An arrow is only the push at that one spot. A moment later the leaf is somewhere new, with a new arrow pushing a new way, so the path bends.' },
]
type Source = 'outFast' | 'outSlow' | 'in'
const SOURCE: { id: Source; text: string; why?: string }[] = [
  { id: 'outFast', text: 'Away from the middle, speeding up' },
  { id: 'outSlow', text: 'Away from the middle, slowing down', why: 'An arrow’s length is the speed there. The arrows get longer the further out you look, so the leaf speeds up as it flies out.' },
  { id: 'in', text: 'In to the middle, where the arrows are shortest', why: 'The arrows point away from the middle, so that’s the way they carry the leaf. Short arrows at the middle mean slow there, not “come here”.' },
]

export function FieldStep({ onDone, topic }: { onDone: () => void; topic: string }) {
  const [phase, setPhase] = useState<Phase>('q1')
  const [id, setId] = useState<FieldId>('whirl')
  const [leaves, setLeaves] = useState<Leaf[]>([])
  const [dropped, setDropped] = useState(0) // leaves dropped in this phase
  const [wrongWhirl, setWrongWhirl] = useState<Whirl[]>([])
  const [wrongSource, setWrongSource] = useState<Source[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [missed, setMissed] = useState(0)
  const [caught, setCaught] = useState<FieldMistake[]>([])
  const f = fieldOf(id)
  const canDrop = phase === 'drop1' || phase === 'explore'
  const done = phase === 'explore' && dropped > 0

  const miss = (m: FieldMistake | null, why: string) => {
    setMissed((k) => k + 1)
    if (m) setCaught((c) => (c.includes(m) ? c : [...c, m]))
    setNote(why)
  }
  const pickWhirl = (c: (typeof WHIRL)[number]) => {
    if (c.id === 'circle') {
      setPhase('drop1')
      setNote(null)
      return
    }
    setWrongWhirl((w) => [...w, c.id])
    miss(c.id === 'in' ? 'whirl-spirals-in' : c.id === 'straight' ? 'field-arrows-are-paths' : null, c.why ?? '')
  }
  const pickSource = (c: (typeof SOURCE)[number]) => {
    if (c.id === 'outFast') {
      setPhase('explore')
      setNote(null)
      return
    }
    setWrongSource((w) => [...w, c.id])
    miss(c.id === 'outSlow' ? 'field-length-ignored' : null, c.why ?? '')
  }
  const switchTo = (to: FieldId) => {
    if (to === id) return
    setId(to)
    setLeaves([])
  }
  const toSource = () => {
    switchTo('source')
    setDropped(0)
    setPhase('q2')
  }
  const drop = (p: Vec) => {
    const trail = flow(f, p)
    setLeaves((ls) => [...ls.slice(-7), { id: Date.now() + ls.length, trail, shown: reducedMotion() ? trail.length : 1 }])
    setDropped((n) => n + 1)
  }

  // the trails grow a few dots a frame; with reduced motion they're drawn whole from the start
  const animating = leaves.some((l) => l.shown < l.trail.length)
  useEffect(() => {
    if (!animating) return
    const t = setInterval(() => setLeaves((ls) => ls.map((l) => (l.shown < l.trail.length ? { ...l, shown: Math.min(l.trail.length, l.shown + 2) } : l))), 16)
    return () => clearInterval(t)
  }, [animating])

  const saved = useRef(false)
  useEffect(() => {
    if (!done || saved.current) return
    saved.current = true
    record({ session: 'calculus', at: new Date().toISOString(), guess: '', misconception: caught[0] ?? null, rematch: null, mastered: missed === 0, calcTopic: topic })
  }, [done, caught, missed, topic])

  const last = leaves[leaves.length - 1]
  const label = `the ${f.name}, ${f.formula}: ${GRID.length} arrows on a grid${leaves.length ? `, ${leaves.length} ${leaves.length === 1 ? 'leaf' : 'leaves'} with their trails` : ''}.${canDrop ? ' Tap anywhere to drop a leaf; Enter drops one at x = 1.5, y = 0.5.' : ''}`

  return (
    <section className="calc-surface calc-fld-step">
      <div className="calc-3d-layout">
        <div className="calc-card calc-tight calc-3d-main">
          <div className="calc-row calc-fld-head">
            <div className="calc-seg" role="group" aria-label="which field">
              {FIELDS.map((o) => (
                <button key={o.id} aria-pressed={o.id === id} disabled={(o.id === 'source' && phase !== 'explore') || (o.id === 'whirl' && phase === 'q2')} onClick={() => switchTo(o.id)}>
                  {o.name}
                </button>
              ))}
            </div>
            <span className="calc-k calc-num">{f.formula}</span>
          </div>
          <FieldView id={id} leaves={leaves} onDrop={canDrop ? drop : undefined} label={label} />
          <p className="calc-pair">
            {canDrop ? (
              <>
                <b>{dropped}</b> {dropped === 1 ? 'leaf' : 'leaves'} dropped · the dots are equal time steps: far apart = moving fast
              </>
            ) : (
              'each arrow: which way the water pushes there, and how hard (longer = faster)'
            )}
          </p>
        </div>

        <div className="calc-3d-side">
          {phase === 'q1' && (
            <div className="calc-card">
              <div className="calc-k">question 1 of 2 · the whirl</div>
              <p className="calc-ask">Drop a leaf anywhere in this whirl. Where do the arrows carry it?</p>
              <div className="calc-picks" role="group" aria-label="where does the leaf go">
                {WHIRL.map((c) => (
                  <button key={c.id} className={'calc-pick' + (wrongWhirl.includes(c.id) ? ' wrong' : '')} disabled={wrongWhirl.includes(c.id)} onClick={() => pickWhirl(c)}>
                    {wrongWhirl.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                    {c.text}
                  </button>
                ))}
              </div>
              {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
            </div>
          )}

          {phase === 'drop1' && (
            <div className="calc-card">
              <p className="calc-correct" role="status">
                <span className="calc-check" aria-hidden="true">✓</span>
                <span><b>Correct!</b> F = (−y, x) is always at right angles to the line from the middle, so the push is sideways only: the leaf keeps its distance and goes round in a circle. Further out the arrows are longer, so the outer leaves go faster, but a lap takes every leaf the same time (2π).</span>
              </p>
              <p className="calc-ask">Now drop some leaves: tap anywhere on the field. Try one near the middle and one near the edge.</p>
              <button className="calc-btn calc-go" disabled={dropped === 0} onClick={toSource}>{dropped === 0 ? 'Drop a leaf first' : 'Now the source field →'}</button>
            </div>
          )}

          {phase === 'q2' && (
            <div className="calc-card">
              <div className="calc-k">question 2 of 2 · the source</div>
              <p className="calc-ask">New field: F = (x, y). Drop leaves anywhere here. Where do they end up?</p>
              <div className="calc-picks" role="group" aria-label="where do the leaves end up">
                {SOURCE.map((c) => (
                  <button key={c.id} className={'calc-pick' + (wrongSource.includes(c.id) ? ' wrong' : '')} disabled={wrongSource.includes(c.id)} onClick={() => pickSource(c)}>
                    {wrongSource.includes(c.id) && <span className="calc-mark" aria-hidden="true">✗</span>}
                    {c.text}
                  </button>
                ))}
              </div>
              {note && <p className="calc-wrong" role="status"><b>✗ Not quite.</b> {note} Try again.</p>}
            </div>
          )}

          {phase === 'explore' && (
            <>
              <div className="calc-card">
                <p className="calc-correct" role="status">
                  <span className="calc-check" aria-hidden="true">✓</span>
                  <span><b>Correct!</b> F = (x, y) points straight away from the middle everywhere, and gets longer the further out you are. A leaf flies out along a straight line, faster and faster, and leaves the picture. The middle is a <b>source</b>: everything flows out of it.</span>
                </p>
                <p className="calc-ask">{dropped === 0 ? 'Drop a few leaves to see it. Then switch back to the whirl if you like.' : 'Watch the dots: close together near the middle (slow), spread out further away (fast). Switch fields to compare.'}</p>
              </div>
              <div className="calc-card calc-grad-read" aria-live="polite">
                <div className="calc-k">the last leaf</div>
                {last ? (
                  <p className="calc-pair">
                    dropped at (<b className="calc-num">{last.trail[0].x.toFixed(1)}</b>, <b className="calc-num">{last.trail[0].y.toFixed(1)}</b>) · speed there <b className="calc-hl calc-num">{speed(f, last.trail[0]).toFixed(2)}</b>
                    {' · '}at its end <b className="calc-hl calc-num">{speed(f, last.trail[last.trail.length - 1]).toFixed(2)}</b>
                  </p>
                ) : (
                  <p className="calc-small">Tap the field to drop one.</p>
                )}
                <p className="calc-rule">
                  <span>A vector field = an arrow at every point.</span>
                  <span>Arrow direction = which way it pushes. Length = how fast.</span>
                  <span>A leaf’s path follows the arrows one tiny step at a time.</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {done && (
        <div className="calc-end" role="status">
          <p>
            <b>Saved to your notebook.</b> {caught.length ? `Caught: ${caught.map((m) => `“${FIELD_LABELS[m]}”`).join(' and ')}.` : missed ? 'No mistake named this time.' : <span className="calc-mastered" aria-label="mastered">✓ mastered</span>} That’s every Calc 3 topic. Next: pick another from the menu.
          </p>
          <div className="calc-endact">
            <button className="calc-btn" onClick={onDone}>Done</button>
          </div>
        </div>
      )}
    </section>
  )
}
