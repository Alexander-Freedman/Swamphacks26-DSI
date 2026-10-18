import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, SessionHead, Title } from '../../components/session/Shell'
import { BackToTopics, Choices, SubjectMenu, Verdict } from '../../components/subject/SubjectMenu'
import { bondDirs, lonePairDirs, MOLECULES, SHAPE_MISTAKES, SHAPE_NAME, type Molecule, type P3, type Shape, type ShapeMistake } from './vsepr'
import { SECTIONS, type ChemTopic } from './topics'
import './chemistry.css'

/** General chemistry opens on a chapter menu, so practice is on purpose, not a fixed path. */
export function ChemistrySession({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState<ChemTopic | null>(null)
  const [play, setPlay] = useState(0)
  const pick = (t: ChemTopic) => {
    setTopic(t)
    setPlay((p) => p + 1)
  }
  if (!topic) return <SubjectMenu subject="General chemistry" className="chem" sections={SECTIONS} onPick={pick} />
  return <ShapesRun key={play} topic={topic} onTopics={() => setTopic(null)} onDone={onDone} />
}

/* ---------- molecule shapes in 3D ---------- */

const CHOICES: Record<string, { shapes: Shape[]; traps: Partial<Record<Shape, ShapeMistake>> }> = {
  ch4: { shapes: ['square-planar', 'tetrahedral', 'trigonal-pyramidal'], traps: { 'square-planar': 'flat-drawing-is-shape' } },
  nh3: { shapes: ['trigonal-planar', 'trigonal-pyramidal', 'tetrahedral'], traps: { 'trigonal-planar': 'lone-pairs-ignored' } },
  h2o: { shapes: ['linear', 'bent', 'trigonal-planar'], traps: { linear: 'lone-pairs-ignored' } },
}
const WHY: Record<string, string> = {
  ch4: 'Four bonds spread out in 3D to get as far apart as possible: the corners of a tetrahedron, 109.5° apart.',
  nh3: 'Four electron groups, but one is a lone pair. The three H atoms sit on a pyramid, squeezed to 107° by the lone pair.',
  h2o: 'Four electron groups again, two of them lone pairs. The two H atoms are left in a bent shape, pushed down to 104.5°.',
}
const SUB: Record<Shape, string> = {
  tetrahedral: '4 corners, 109.5°',
  'square-planar': 'flat, 90° apart',
  'trigonal-pyramidal': 'H’s on a pyramid',
  'trigonal-planar': 'flat, 120° apart',
  bent: 'a V shape',
  linear: '180° apart',
}

function ShapesRun({ topic, onTopics, onDone }: { topic: ChemTopic; onTopics: () => void; onDone: () => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  const [k, setK] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [wrong, setWrong] = useState<Shape[]>([])
  const [verdict, setVerdict] = useState<{ right: boolean; label?: string; line: string } | null>(null)
  const [mistakes, setMistakes] = useState<ShapeMistake[]>([])
  const [done, setDone] = useState(false)
  const m = MOLECULES[k]
  const opts = CHOICES[m.id]

  const answer = (s: Shape) => {
    if (s === m.shape) {
      setWrong([])
      setRevealed(true)
      setVerdict({ right: true, line: WHY[m.id] })
      return
    }
    setWrong((w) => [...w, s])
    const t = opts.traps[s]
    if (t) {
      setMistakes((all) => (all.includes(t) ? all : [...all, t]))
      setVerdict({ right: false, label: SHAPE_MISTAKES[t].label, line: SHAPE_MISTAKES[t].line })
    } else setVerdict({ right: false, line: 'Count the electron groups around the center, lone pairs included.' })
  }
  const next = () => {
    setVerdict(null)
    setRevealed(false)
    setK((n) => n + 1)
  }

  const saved = useRef(false)
  const finish = () => {
    setDone(true)
    if (saved.current) return
    saved.current = true
    record({ session: 'chemistry', at: new Date().toISOString(), guess: '', misconception: mistakes[0] ?? null, rematch: null, mistakes, chemTopic: topic.id })
  }

  return (
    <Frame className="subject chem">
      <SessionHead chip={`General chemistry · ${topic.title}`} step={k + 1} total={MOLECULES.length} />
      <BackToTopics subject="General chemistry" onClick={onTopics} />
      <Title
        h="Molecule shapes in 3D."
        sub="Electron groups around the center atom push each other as far apart as they can. Lone pairs count, even though you can’t see them in the shape. Predict from the flat drawing, then turn the real molecule around."
        headingRef={title}
      />
      <div className="sj-two">
        <div className="sj-card ch-viewcard">
          <div className="sj-k">{revealed ? `${m.formula}, ${m.name} · drag to turn it` : `${m.formula} as drawn on paper`}</div>
          {revealed ? <Model m={m} /> : <Lewis m={m} />}
          {revealed && (
            <p className="sj-small">
              H–{m.center}–H angle: <b className="sj-num">{m.angle}°</b>
              {m.bonds < 4 && <> · {4 - m.bonds} lone pair{m.bonds < 3 ? 's' : ''} (the clouds)</>}
            </p>
          )}
        </div>
        <div className="sj-col">
          {!revealed && (
            <div className="sj-card">
              <p className="sj-ask">
                Molecule {k + 1} of {MOLECULES.length}: in 3D, what shape do the atoms of {m.formula} make?
              </p>
              <Choices choices={opts.shapes.map((s) => ({ id: s, text: SHAPE_NAME[s], sub: SUB[s] }))} wrong={wrong} onPick={answer} label="the shape" />
            </div>
          )}
          {verdict && <Verdict {...verdict} />}
          {revealed && k < MOLECULES.length - 1 && <button className="sj-btn sj-go" onClick={next}>Next molecule →</button>}
          {revealed && k === MOLECULES.length - 1 && !done && (
            <div className="sj-card">
              <p className="sj-rule">
                <span>4 electron groups → <span className="sj-hl">tetrahedron</span> of directions.</span>
                <span>Lone pairs take corners but don’t show: <span className="sj-hl">pyramid</span>, <span className="sj-hl">bent</span>.</span>
                <span>Lone pairs push harder: 109.5° → 107° → 104.5°.</span>
              </p>
              <button className="sj-btn sj-go ch-finish" onClick={finish}>Finish ✓</button>
            </div>
          )}
          {done && (
            <EndBar
              caught={null}
              rematch="right"
              line={mistakes.length ? <>Caught: {mistakes.map((t) => `“${SHAPE_MISTAKES[t].label}”`).join(', ')}.</> : <span className="ch-mastered">✓ mastered</span>}
              remix="Next: is the molecule polar?"
              onDone={onDone}
            />
          )}
        </div>
      </div>
    </Frame>
  )
}

/* ---------- drawings ---------- */

const W = 420
const H = 340

/** The flat Lewis drawing: bonds at right angles, lone pairs as dots. Tempting, and wrong in 3D. */
function Lewis({ m }: { m: Molecule }) {
  const c = { x: W / 2, y: H / 2 }
  const spots = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ]
  // H's first on the sides, so water reads H–O–H in a straight line on paper
  const order = m.bonds === 2 ? [3, 1, 0, 2] : m.bonds === 3 ? [3, 1, 2, 0] : [0, 1, 2, 3]
  const L = 95
  return (
    <svg className="sj-svg ch-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Lewis structure of ${m.formula}: ${m.bonds} bonds${m.bonds < 4 ? ` and ${4 - m.bonds} lone pairs` : ''}, drawn flat`}>
      {order.map((s, i) => {
        const p = spots[s]
        if (i < m.bonds)
          return (
            <g key={s}>
              <line className="ch-bond" x1={c.x + p.x * 24} y1={c.y + p.y * 24} x2={c.x + p.x * (L - 18)} y2={c.y + p.y * (L - 18)} />
              <circle className="ch-atom h" cx={c.x + p.x * L} cy={c.y + p.y * L} r={18} />
              <text className="ch-el" x={c.x + p.x * L} y={c.y + p.y * L}>H</text>
            </g>
          )
        return (
          <g key={s} className="ch-dots">
            <circle cx={c.x + p.x * 40 - p.y * 7} cy={c.y + p.y * 40 + p.x * 7} r={4} />
            <circle cx={c.x + p.x * 40 + p.y * 7} cy={c.y + p.y * 40 - p.x * 7} r={4} />
          </g>
        )
      })}
      <circle className="ch-atom c" cx={c.x} cy={c.y} r={24} />
      <text className="ch-el" x={c.x} y={c.y}>{m.center}</text>
    </svg>
  )
}

type View = { yaw: number; pitch: number }
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function project(p: P3, v: View) {
  const [x, y, z] = p
  const cy = Math.cos(v.yaw)
  const sy = Math.sin(v.yaw)
  const x1 = x * cy + z * sy
  const z1 = -x * sy + z * cy
  const cp = Math.cos(v.pitch)
  const sp = Math.sin(v.pitch)
  const y2 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  return { x: W / 2 + x1 * 110, y: H / 2 - y2 * 110, depth: z2 }
}

/** The real molecule: ball and stick, lone pairs as clouds. Turns by itself until you grab it. */
function Model({ m }: { m: Molecule }) {
  const [view, setView] = useState<View>({ yaw: 0.5, pitch: 0.25 })
  const [spin, setSpin] = useState(() => !reducedMotion())
  useEffect(() => {
    if (!spin) return
    const id = setInterval(() => setView((v) => ({ ...v, yaw: v.yaw + 0.012 })), 30)
    return () => clearInterval(id)
  }, [spin])
  const drag = useRef<{ x: number; y: number } | null>(null)
  const down = (e: PointerEvent<SVGSVGElement>) => {
    setSpin(false)
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setView((v) => ({ yaw: v.yaw + dx * 0.012, pitch: Math.max(-1.3, Math.min(1.3, v.pitch + dy * 0.012)) }))
  }
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d: Record<string, [number, number]> = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }
    const k = d[e.key]
    if (!k) return
    e.preventDefault()
    setSpin(false)
    setView((v) => ({ yaw: v.yaw + k[0], pitch: Math.max(-1.3, Math.min(1.3, v.pitch + k[1])) }))
  }
  const c = project([0, 0, 0], view)
  const items = [
    ...bondDirs(m).map((d) => ({ kind: 'h' as const, p: project(d, view) })),
    ...lonePairDirs(m).map((d) => ({ kind: 'lp' as const, p: project([d[0] * 0.62, d[1] * 0.62, d[2] * 0.62], view), d })),
  ].sort((a, b) => a.p.depth - b.p.depth)
  const behind = items.filter((it) => it.p.depth < 0)
  const front = items.filter((it) => it.p.depth >= 0)
  const draw = (it: (typeof items)[number], i: number) =>
    it.kind === 'h' ? (
      <g key={'h' + i}>
        <line className="ch-bond" x1={c.x} y1={c.y} x2={it.p.x} y2={it.p.y} />
        <circle className="ch-atom h" cx={it.p.x} cy={it.p.y} r={18 + it.p.depth * 3} />
        <text className="ch-el" x={it.p.x} y={it.p.y}>H</text>
      </g>
    ) : (
      <g key={'lp' + i} className="ch-lp">
        <ellipse cx={(c.x + it.p.x) / 2 + (it.p.x - c.x) * 0.25} cy={(c.y + it.p.y) / 2 + (it.p.y - c.y) * 0.25} rx={30} ry={20} transform={`rotate(${(Math.atan2(it.p.y - c.y, it.p.x - c.x) * 180) / Math.PI} ${(c.x + it.p.x) / 2 + (it.p.x - c.x) * 0.25} ${(c.y + it.p.y) / 2 + (it.p.y - c.y) * 0.25})`} />
        <circle cx={it.p.x - 5} cy={it.p.y} r={3.5} />
        <circle cx={it.p.x + 5} cy={it.p.y} r={3.5} />
      </g>
    )
  return (
    <svg
      className="sj-svg ch-svg ch-model"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      tabIndex={0}
      aria-label={`3D model of ${m.formula}: ${SHAPE_NAME[m.shape].toLowerCase()}, H–${m.center}–H ${m.angle}°. Drag or use the arrow keys to turn it.`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={key}
    >
      {behind.map(draw)}
      <circle className="ch-atom c" cx={c.x} cy={c.y} r={26} />
      <text className="ch-el" x={c.x} y={c.y}>{m.center}</text>
      {front.map(draw)}
    </svg>
  )
}
