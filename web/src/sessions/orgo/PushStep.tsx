import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { frontSide, gradeSN2, HINTS, MISTAKES, type Arrow, type ArrowGrade, type ArrowMistake, type Pt, type Source, type Target } from './chem'
import { dist, reducedMotion, svgPoint } from './geom'
import { mid, nearest, pointAlong, shapeArrow, type Cand, type Drawn } from './arrows'
import { CurvedArrow, Scene } from './Scene'
import { ease, lpPos, RX, sceneAt, VW, type Rx } from './sn2'

// Step 2: draw the curved arrows of HO⁻ + CH₃Br yourself (pencil), then watch the real
// mechanism in ink over them. Arrow checks are in chem.ts.

const START = sceneAt(RX['oh-mebr'], 0)
const ATOM = new Map(START.atoms.map((a) => [a.id, a]))
const NAME: Record<string, string> = { back: 'H', nu: 'O', c: 'C', h1: 'H', h2: 'H', h3: 'H', lg: 'Br' }
const bondName = (a: string, b: string) => `${NAME[a]}–${NAME[b]} bond`
const SIDE: Record<number, string> = { 0: 'right', 70: 'top', 90: 'top', 180: 'left', 270: 'bottom', 290: 'bottom' }

/** Every place an arrow can start: lone pairs, bonds, and (wrongly) bare atoms. */
function sources(rx: Rx = RX['oh-mebr']): Cand<Source>[] {
  const s = sceneAt(rx, 0)
  const at = new Map(s.atoms.map((a) => [a.id, a]))
  const lp = s.atoms.flatMap((a) => a.lp.map((deg, slot) => ({ v: { kind: 'lp', atom: a.id, slot } as Source, at: lpPos(a, deg), name: `lone pair on ${NAME[a.id]}${a.lp.length > 1 ? ` (${SIDE[deg] ?? deg})` : ''}` })))
  const bonds = s.bonds.map((b) => ({ v: { kind: 'bond', a: b.a, b: b.b } as Source, at: mid(at.get(b.a)!, at.get(b.b)!), name: bondName(b.a, b.b) + (b.a === 'c' && b.b.startsWith('h') ? ` (${b.b})` : '') }))
  const atoms = s.atoms.map((a) => ({ v: { kind: 'atom', atom: a.id } as Source, at: { x: a.x, y: a.y }, name: `the ${NAME[a.id]} atom` + (a.id.startsWith('h') || a.id === 'back' ? ` (${a.id})` : '') }))
  return [...lp, ...bonds, ...atoms]
}
function targets(rx: Rx = RX['oh-mebr']): Cand<Target>[] {
  return sources(rx).flatMap((c) => (c.v.kind === 'lp' ? [] : [{ ...c, v: c.v as Target, name: c.name.replace(/^the /, '') }]))
}
const SRC = sources()
const TGT = targets()

const C = ATOM.get('c')!
const LG = ATOM.get('lg')!
/** The real mechanism's two arrows, in ink. */
const REAL: Drawn[] = [
  shapeArrow({ from: { kind: 'lp', atom: 'nu', slot: 0 }, to: { kind: 'atom', atom: 'c' } }, lpPos(ATOM.get('nu')!, 0), C, { x: C.x - 70, y: C.y - 24 }),
  shapeArrow({ from: { kind: 'bond', a: 'c', b: 'lg' }, to: { kind: 'atom', atom: 'lg' } }, mid(C, LG), LG, { x: (C.x + LG.x) / 2 - 9, y: C.y - 24 }),
]

const CAPTION = (t: number) =>
  t < 0.3 ? 'The O’s lone pair heads for the back of the carbon.' : t < 0.68 ? 'Halfway: O–C forming, C–Br breaking, the H’s flat.' : 'Br leaves with the bond’s two electrons. The carbon turned inside out.'

export function PushStep({ onGrade, onNext, nextLabel = 'Find the same pattern →' }: { onGrade: (mistakes: ArrowMistake[]) => void; onNext: () => void; nextLabel?: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const [arrows, setArrows] = useState<Drawn[]>([])
  const [pen, setPen] = useState<{ from: Cand<Source>; pts: Pt[] } | null>(null)
  const [grade, setGrade] = useState<ArrowGrade | null>(null)
  const [t, setT] = useState(0)
  const [phase, setPhase] = useState<'draw' | 'ink' | 'run' | 'done'>('draw')
  const [say, setSay] = useState('')
  const [kFrom, setKFrom] = useState(0)
  const [kTo, setKTo] = useState(0)

  const add = (d: Drawn) => {
    setArrows((a) => [...a.slice(-3), d])
    setSay(`arrow added: ${describe(d.arrow)}`)
  }

  const down = (e: RPointerEvent<SVGSVGElement>) => {
    if (phase !== 'draw') return
    const p = svgPoint(svg.current, e.clientX, e.clientY, VW)
    const from = nearest(SRC, p, 20)
    if (!from) return
    svg.current?.setPointerCapture?.(e.pointerId)
    setPen({ from, pts: [from.at, p] })
  }
  const move = (e: RPointerEvent<SVGSVGElement>) => {
    if (!pen) return
    const p = svgPoint(svg.current, e.clientX, e.clientY, VW)
    setPen({ ...pen, pts: [...pen.pts, p] })
  }
  const up = (e: RPointerEvent<SVGSVGElement>) => {
    if (!pen) return
    const p = svgPoint(svg.current, e.clientX, e.clientY, VW)
    const pts = [...pen.pts, p]
    setPen(null)
    const to = nearest(TGT, p, 24)
    if (!to || dist(pts[0], p) < 14) return setSay('Arrows end on an atom or a bond.')
    const arrow: Arrow = { from: pen.from.v, to: to.v }
    if (to.v.kind === 'atom' && to.v.atom === 'c') arrow.front = frontSide(pointAlong(pts, 0.8), C, LG)
    add(shapeArrow(arrow, pen.from.at, to.at, pointAlong(pts, 0.5)))
  }

  const addFromLists = () => {
    const from = SRC[kFrom]
    const to = TGT[kTo]
    if (from.v.kind === 'atom' && to.v.kind === 'atom' && from.v.atom === to.v.atom) return
    const d = shapeArrow({ from: from.v, to: to.v }, from.at, to.at, null)
    if (to.v.kind === 'atom' && to.v.atom === 'c') d.arrow.front = frontSide(d.c, C, LG)
    add(d)
  }

  const showMe = () => {
    const g = gradeSN2(
      arrows.map((d) => d.arrow),
      RX['oh-mebr'].roles,
    )
    setGrade(g)
    onGrade(g.mistakes)
    const still = reducedMotion()
    setT(still ? 1 : 0)
    setPhase(still ? 'done' : 'ink')
  }

  useEffect(() => {
    if (phase === 'ink') {
      const id = setTimeout(() => setPhase('run'), 1700)
      return () => clearTimeout(id)
    }
    if (phase !== 'run') return
    let k = 0
    const id = setInterval(() => {
      k += 1
      setT(Math.min(1, k / 100))
      if (k >= 100) {
        clearInterval(id)
        setPhase('done')
      }
    }, 32)
    return () => clearInterval(id)
  }, [phase])

  const reset = () => {
    setArrows([])
    setGrade(null)
    setT(0)
    setPhase('draw')
  }

  const scene = sceneAt(RX['oh-mebr'], t)
  const fade = 1 - ease(t, 0.02, 0.18)
  const hover = pen ? nearest(TGT, pen.pts[pen.pts.length - 1], 24) : null
  const showInk = phase !== 'draw'
  const named = grade?.mistakes ?? []

  return (
    <section className="og-step og-push">
      <div className="og-scenebox">
        <Scene
          scene={scene}
          ref={svg}
          className={phase === 'draw' ? 'og-drawable' : ''}
          label={phase === 'draw' ? 'HO⁻ and CH₃Br. Drag from electrons (a lone pair or a bond) to an atom or a bond to draw an arrow.' : `the reaction, ${Math.round(t * 100)}% of the way`}
          handlers={{ onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: () => setPen(null) }}
          under={
            phase === 'draw' && (
              <g className="og-sources" aria-hidden="true">
                {SRC.filter((s) => s.v.kind === 'lp').map((s) => (
                  <circle key={s.name} cx={s.at.x} cy={s.at.y} r={10} />
                ))}
              </g>
            )
          }
          over={
            <>
              {hover && <circle cx={hover.at.x} cy={hover.at.y} r={20} className="og-target-hl" />}
              <g opacity={fade}>
                {arrows.map((d, i) => (
                  <CurvedArrow key={i} p0={d.p0} c={d.c} p3={d.p3} className="og-arrow og-pencil-arrow" />
                ))}
                {showInk && REAL.map((d, i) => <CurvedArrow key={'r' + i} p0={d.p0} c={d.c} p3={d.p3} className="og-arrow og-ink-arrow" style={{ ['--d' as string]: `${i * 0.8}s` }} />)}
              </g>
              {pen && <polyline points={pen.pts.map((p) => `${p.x},${p.y}`).join(' ')} className="og-pen" />}
            </>
          }
        />
        <div className="og-legend" aria-hidden="true">
          <span className="og-key-pencil">you</span>
          {showInk && <span className="og-key-ink">real</span>}
          <span className="og-rx">{t < 0.68 ? RX['oh-mebr'].text.reactants : RX['oh-mebr'].text.products}</span>
        </div>
        {phase === 'draw' ? (
          <p className="og-cap">start an arrow on the electrons that move (a lone pair <span className="og-dots" aria-hidden="true">••</span> or a bond) and drag it to the atom they move to</p>
        ) : (
          <>
            <p className="og-cap og-ink-cap">{CAPTION(t)}</p>
            <label className="og-scrub">
              <span>before</span>
              <input type="range" min={0} max={100} value={Math.round(t * 100)} disabled={phase !== 'done'} onChange={(e) => setT(+e.target.value / 100)} aria-label="scrub the reaction" />
              <span>after</span>
            </label>
          </>
        )}
        <p className="og-sr" aria-live="polite">{say}</p>
      </div>

      <aside className="og-side">
        {phase === 'draw' && (
          <>
            <div className="og-tag">your arrows: {arrows.length}</div>
            <ol className="og-arrowlist">
              {arrows.map((d, i) => (
                <li key={i}>{describe(d.arrow)}</li>
              ))}
            </ol>
            <details className="og-keys">
              <summary>Draw with lists</summary>
              <label>
                from
                <select value={kFrom} onChange={(e) => setKFrom(+e.target.value)}>
                  {SRC.map((s, i) => (
                    <option key={s.name} value={i}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label>
                to
                <select value={kTo} onChange={(e) => setKTo(+e.target.value)}>
                  {TGT.map((s, i) => (
                    <option key={s.name} value={i}>{s.name}</option>
                  ))}
                </select>
              </label>
              <button className="og-btn og-ghost" onClick={addFromLists}>Add arrow</button>
            </details>
            <div className="og-row">
              <button className="og-btn og-ghost" disabled={!arrows.length} onClick={() => setArrows((a) => a.slice(0, -1))}>Undo</button>
              <button className="og-btn og-go" disabled={!arrows.length} onClick={showMe}>Show me</button>
            </div>
          </>
        )}
        {grade && (
          <div className="og-verdict" role="status">
            {grade.ok ? (
              <div className="og-okay">
                <span className="og-check" aria-hidden="true">✓</span> your arrows match
              </div>
            ) : (
              <>
                {named.map((m) => (
                  <div key={m} className="og-mistake">
                    <div className="og-mname">{MISTAKES[m].label}</div>
                    <p>{MISTAKES[m].line}</p>
                  </div>
                ))}
                {grade.hints.map((h) => (
                  <p key={h} className="og-hint">{HINTS[h]}</p>
                ))}
              </>
            )}
          </div>
        )}
        {phase !== 'draw' && (
          <div className="og-row">
            <button className="og-btn og-ghost" onClick={reset}>Draw again</button>
            <button className="og-btn og-next" onClick={onNext}>{nextLabel}</button>
          </div>
        )}
      </aside>
    </section>
  )
}

const where = (s: Source | Target) =>
  s.kind === 'lp' ? `lone pair on ${NAME[s.atom]}` : s.kind === 'bond' ? bondName(s.a, s.b) : NAME[s.atom]
function describe(a: Arrow) {
  const back = a.to.kind === 'atom' && a.to.atom === 'c' && a.front !== undefined ? (a.front ? ', from the front' : ', from the back') : ''
  return `${a.from.kind === 'atom' ? `the ${NAME[a.from.atom]} atom` : where(a.from)} → ${where(a.to)}${back}`
}

