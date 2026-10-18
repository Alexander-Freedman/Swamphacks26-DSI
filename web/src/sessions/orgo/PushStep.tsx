import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { frontSide, gradeSN2, HINTS, MISTAKES, type Arrow, type ArrowGrade, type ArrowMistake, type Pt, type Source } from './chem'
import { dist, reducedMotion, svgPoint } from './geom'
import { nearest, pointAlong, shapeArrow, type Cand, type Drawn } from './arrows'
import { C, CAPTION, describe, LG, REAL, SRC, TGT } from './sn2Arrows'
import { CurvedArrow, Scene } from './Scene'
import { ease, RX, sceneAt, VW } from './sn2'

// Step 2: draw the curved arrows of HO⁻ + CH₃Br yourself (pencil), then watch the real
// mechanism in ink over them. Arrow checks are in chem.ts.

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

