import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { BackToTopics, Choices, SubjectMenu, Verdict } from '../../components/subject/SubjectMenu'
import { apply, det, HOUSE, I, lerp, LIN_MISTAKES, near, QUARTER, snap, type LinMistake, type M, type V } from './linalg'
import { SECTIONS, type LinTopic } from './topics'
import './linear-algebra.css'

/** Linear algebra opens on a chapter menu, so practice is on purpose, not a fixed path. */
export function LinearAlgebraSession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<LinTopic | null>(null)
  const [play, setPlay] = useState(0)
  const pick = (t: LinTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <SubjectMenu subject="Linear algebra" className="linalg" sections={SECTIONS} onPick={pick} />
  return <TransformRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

/* ---------- a matrix moves the whole grid ---------- */

const STRETCH: M = { i: { x: 2, y: 0 }, j: { x: 0, y: 1 } }
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = 'predict' | 'morph' | 'rotate' | 'squash' | 'undo' | 'done'

const Q_PREDICT = {
  ask: 'This matrix’s first column is (2, 0) and its second is (0, 1). What will it do to the house?',
  choices: [
    { id: 'wide' as const, text: 'Stretch it sideways ×2', sub: 'twice as wide' },
    { id: 'tall' as const, text: 'Stretch it up ×2', sub: 'twice as tall' },
    { id: 'turn' as const, text: 'Turn it', sub: 'a rotation' },
  ],
  answer: 'wide',
  traps: { tall: 'rows-vs-columns' } as Partial<Record<string, LinMistake>>,
  why: 'The first column is where î lands: (2, 0), twice as far right. ĵ stays put, so every point slides out sideways to twice its x.',
}
const Q_UNDO = {
  ask: 'The whole plane is flat on one line now. Could another matrix move everything back where it was?',
  choices: [
    { id: 'yes' as const, text: 'Yes', sub: 'just reverse the move' },
    { id: 'no' as const, text: 'No', sub: 'the information is gone' },
  ],
  answer: 'no',
  traps: { yes: 'squash-undoable' } as Partial<Record<string, LinMistake>>,
  why: 'Many points landed on the same spot, so nothing can tell them apart again. Determinant 0 means the matrix has no inverse.',
}

function TransformRun({ topic, onTopics, onDone }: { topic: LinTopic; onTopics: () => void; onDone: () => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  const [phase, setPhase] = useState<Phase>('predict')
  const [m, setM] = useState<M>(I)
  const [wrong, setWrong] = useState<string[]>([])
  const [verdict, setVerdict] = useState<{ right: boolean; label?: string; line: string } | null>(null)
  const [mistakes, setMistakes] = useState<LinMistake[]>([])
  const [morphing, setMorphing] = useState(false)

  // the stretch plays out from the identity
  useEffect(() => {
    if (!morphing) return
    const start = performance.now()
    const id = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / 1400)
      setM(lerp(I, STRETCH, t))
      if (t >= 1) {
        clearInterval(id)
        setMorphing(false)
      }
    }, 30)
    return () => clearInterval(id)
  }, [morphing])

  const q = phase === 'predict' ? Q_PREDICT : phase === 'undo' ? Q_UNDO : null
  const answer = (id: string) => {
    if (!q) return
    if (id === q.answer) {
      setWrong([])
      setVerdict({ right: true, line: q.why })
      if (phase === 'predict') {
        setPhase('morph')
        if (reducedMotion()) setM(STRETCH)
        else setMorphing(true)
      } else setPhase('done')
      return
    }
    setWrong((w) => [...w, id])
    const k = q.traps[id]
    if (k) {
      setMistakes((all) => (all.includes(k) ? all : [...all, k]))
      setVerdict({ right: false, label: LIN_MISTAKES[k].label, line: LIN_MISTAKES[k].line })
    } else setVerdict({ right: false, line: 'Try another one.' })
  }

  const rotated = phase === 'rotate' && near(m.i, QUARTER.i) && near(m.j, QUARTER.j)
  const squashed = phase === 'squash' && Math.abs(det(m)) < 0.01 && (m.i.x !== 0 || m.i.y !== 0) && (m.j.x !== 0 || m.j.y !== 0)
  const drag = phase === 'rotate' || phase === 'squash' ? (which: 'i' | 'j', p: V) => setM((cur) => ({ ...cur, [which]: snap(p) })) : undefined

  const saved = useRef(false)
  useEffect(() => {
    if (phase !== 'done' || saved.current) return
    saved.current = true
    record({ session: 'linear-algebra', at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, linTopic: topic.id })
  }, [phase, mistakes, topic.id])

  const step = phase === 'predict' || phase === 'morph' ? 1 : phase === 'rotate' ? 2 : 3
  return (
    <Frame className="subject linalg">
      <SessionHead chip={`Linear algebra · ${topic.title}`} step={step} total={3} />
      <BackToTopics subject="Linear algebra" onClick={onTopics} />
      <Title
        h="A matrix moves the whole grid."
        sub="A 2×2 matrix is a move of the whole plane. Its two columns say where the arrows î and ĵ land, and every other point follows along. Predict, then drag the arrows yourself."
        headingRef={title}
      />
      <div className="sj-two la-two">
        <div className="sj-card la-planecard">
          <Plane m={m} onDrag={drag} squashed={phase === 'squash' || phase === 'undo' || phase === 'done'} />
        </div>
        <div className="sj-col">
          <MatrixCard m={m} />
          {q && (
            <div className="sj-card">
              <p className="sj-ask">{q.ask}</p>
              <Choices choices={q.choices} wrong={wrong} onPick={answer} label="your answer" />
            </div>
          )}
          {verdict && <Verdict {...verdict} />}
          {phase === 'morph' && !morphing && (
            <button className="sj-btn sj-go" onClick={() => { setVerdict(null); setM(I); setPhase('rotate') }}>Now build one yourself →</button>
          )}
          {phase === 'rotate' && (
            <div className="sj-card">
              <p className="sj-ask">Make the house turn a quarter turn counterclockwise. Drag the tips of î and ĵ (or select one and use the arrow keys).</p>
              {!rotated ? (
                <p className="sj-small">Hint: after a quarter turn, where should the arrow pointing right end up? And the one pointing up?</p>
              ) : (
                <>
                  <Verdict right line="î now points up and ĵ points left, so the matrix is [0 −1; 1 0]: every point turns 90°." />
                  <button className="sj-btn sj-go la-next" onClick={() => setPhase('squash')}>Last one →</button>
                </>
              )}
            </div>
          )}
          {phase === 'squash' && (
            <div className="sj-card">
              <p className="sj-ask">The shaded square is how much one grid square grows or shrinks: that’s the determinant. Drag the arrows until the square has no area at all.</p>
              {!squashed ? (
                <p className="sj-small">Hint: what if î and ĵ point along the same line?</p>
              ) : (
                <>
                  <Verdict right line="Both arrows lie on one line, so the square is flat: determinant 0. The whole plane collapsed onto that line." />
                  <button className="sj-btn sj-go la-next" onClick={() => { setVerdict(null); setPhase('undo') }}>One question →</button>
                </>
              )}
            </div>
          )}
          {phase === 'done' && (
            <EndBar
              caught={null}
              rematch="right"
              line={mistakes.length ? <>Caught: {mistakes.map((k) => `“${LIN_MISTAKES[k].label}”`).join(', ')}.</> : <span className="la-mastered">✓ mastered</span>}
              remix="Next: multiplying matrices, one move after another."
              onDone={onDone}
            />
          )}
        </div>
      </div>
    </Frame>
  )
}

function MatrixCard({ m }: { m: M }) {
  const f = (n: number) => (Math.abs(n) < 1e-9 ? '0' : Number.isInteger(n) ? String(n) : n.toFixed(1)).replace('-', '−')
  return (
    <div className="sj-card la-matrix">
      <div className="sj-k">the matrix · area ×{f(det(m))}</div>
      <div className="la-mat" role="img" aria-label={`matrix columns: i lands at (${f(m.i.x)}, ${f(m.i.y)}), j lands at (${f(m.j.x)}, ${f(m.j.y)}); determinant ${f(det(m))}`}>
        <span className="la-bracket">[</span>
        <span className="la-col i"><b>{f(m.i.x)}</b><b>{f(m.i.y)}</b><i>î</i></span>
        <span className="la-col j"><b>{f(m.j.x)}</b><b>{f(m.j.y)}</b><i>ĵ</i></span>
        <span className="la-bracket">]</span>
      </div>
    </div>
  )
}

/* ---------- the plane ---------- */

const S = 420
const U = 46 // px per unit
const px = (p: V) => ({ x: S / 2 + p.x * U, y: S / 2 - p.y * U })

function Plane({ m, onDrag, squashed }: { m: M; onDrag?: (which: 'i' | 'j', p: V) => void; squashed: boolean }) {
  const svg = useRef<SVGSVGElement>(null)
  const [held, setHeld] = useState<'i' | 'j' | null>(null)
  const toWorld = (e: PointerEvent<SVGSVGElement>): V | null => {
    const ctm = svg.current?.getScreenCTM?.()
    if (!ctm) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: (p.x - S / 2) / U, y: (S / 2 - p.y) / U }
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!held || !onDrag) return
    const w = toWorld(e)
    if (w) onDrag(held, { x: Math.max(-4, Math.min(4, w.x)), y: Math.max(-4, Math.min(4, w.y)) })
  }
  const key = (which: 'i' | 'j') => (e: KeyboardEvent<SVGGElement>) => {
    if (!onDrag) return
    const d: Record<string, V> = { ArrowLeft: { x: -0.5, y: 0 }, ArrowRight: { x: 0.5, y: 0 }, ArrowUp: { x: 0, y: 0.5 }, ArrowDown: { x: 0, y: -0.5 } }
    const k = d[e.key]
    if (!k) return
    e.preventDefault()
    const cur = m[which]
    onDrag(which, { x: cur.x + k.x, y: cur.y + k.y })
  }
  const line = (a: V, b: V, cls: string, key: string) => {
    const p = px(a)
    const q = px(b)
    return <line key={key} className={cls} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
  }
  const R = 8
  const grid = Array.from({ length: 2 * R + 1 }, (_, k) => k - R)
  const sq = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }].map((p) => px(apply(m, p)))
  const house = HOUSE.map((p) => px(apply(m, p)))
  const arrow = (which: 'i' | 'j') => {
    const tip = px(m[which])
    const o = px({ x: 0, y: 0 })
    return (
      <g
        key={which}
        className={`la-arrow ${which}` + (onDrag ? ' live' : '')}
        tabIndex={onDrag ? 0 : -1}
        role={onDrag ? 'slider' : undefined}
        aria-label={`${which === 'i' ? 'î' : 'ĵ'} tip at (${m[which].x}, ${m[which].y})`}
        aria-valuetext={`(${m[which].x}, ${m[which].y})`}
        onKeyDown={key(which)}
        onPointerDown={(e) => {
          if (!onDrag) return
          setHeld(which)
          svg.current?.setPointerCapture?.(e.pointerId)
        }}
      >
        <line x1={o.x} y1={o.y} x2={tip.x} y2={tip.y} markerEnd={`url(#la-head-${which})`} />
        {onDrag && <circle className="la-handle" cx={tip.x} cy={tip.y} r={13} />}
        <text x={tip.x + 10} y={tip.y - 10}>{which === 'i' ? 'î' : 'ĵ'}</text>
      </g>
    )
  }
  return (
    <svg ref={svg} className="sj-svg la-plane" viewBox={`0 0 ${S} ${S}`} role="group" aria-label="the plane" onPointerMove={move} onPointerUp={() => setHeld(null)} onPointerCancel={() => setHeld(null)}>
      <defs>
        {(['i', 'j'] as const).map((w) => (
          <marker key={w} id={`la-head-${w}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className={`la-head ${w}`} />
          </marker>
        ))}
      </defs>
      {/* the original grid, faint, stays put so you can see the move */}
      {grid.map((k) => line({ x: k, y: -R }, { x: k, y: R }, 'la-old', `ov${k}`))}
      {grid.map((k) => line({ x: -R, y: k }, { x: R, y: k }, 'la-old', `oh${k}`))}
      {/* the moved grid */}
      {grid.map((k) => line(apply(m, { x: k, y: -R }), apply(m, { x: k, y: R }), 'la-new', `nv${k}`))}
      {grid.map((k) => line(apply(m, { x: -R, y: k }), apply(m, { x: R, y: k }), 'la-new', `nh${k}`))}
      <polygon className={'la-square' + (squashed ? ' sq' : '')} points={sq.map((p) => `${p.x},${p.y}`).join(' ')} />
      <polygon className="la-house" points={house.map((p) => `${p.x},${p.y}`).join(' ')} />
      {arrow('i')}
      {arrow('j')}
    </svg>
  )
}
