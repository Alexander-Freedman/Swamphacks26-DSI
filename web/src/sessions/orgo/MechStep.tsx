import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { HINTS, MISTAKES, type Arrow, type Pt, type Source, type Target } from './chem'
import { dist, reducedMotion, svgPoint } from './geom'
import { mid, nearest, pointAlong, shapeArrow, type Cand, type Drawn } from './arrows'
import { CurvedArrow, Scene } from './Scene'
import { gradeStage, keys, mechScene, mechText, type AnyMistake, type Mech, type MechGrade } from './mechs'
import { ease, lpPos, VW } from './sn2'

// SN1, E2, E1: draw the curved arrows of each step in pencil, then the real ones in ink and the
// atoms move. Two-step mechanisms stop at the carbocation so you draw step 2 on it.

const SIDE: Record<number, string> = { 0: 'right', 40: 'upper right', 90: 'top', 132: 'upper left', 180: 'left', 222: 'lower left', 270: 'bottom', 330: 'lower right' }

/** Every place an arrow can start at key k: lone pairs, bonds, and (wrongly) bare atoms. */
function sources(m: Mech, k: number): Cand<Source>[] {
  const s = mechScene(m, k)
  const at = new Map(s.atoms.map((a) => [a.id, a]))
  const name = new Map(m.atoms.map((a) => [a.id, a.name]))
  const lp = s.atoms.flatMap((a) => a.lp.map((deg, slot) => ({ v: { kind: 'lp', atom: a.id, slot } as Source, at: lpPos(a, deg), name: `lone pair on ${name.get(a.id)}${a.lp.length > 1 ? ` (${SIDE[deg] ?? deg})` : ''}` })))
  const bonds = s.bonds.map((b) => ({ v: { kind: 'bond', a: b.a, b: b.b } as Source, at: mid(at.get(b.a)!, at.get(b.b)!), name: `${name.get(b.a)}–${name.get(b.b)} bond` }))
  const atoms = s.atoms.map((a) => ({ v: { kind: 'atom', atom: a.id } as Source, at: { x: a.x, y: a.y }, name: `the ${name.get(a.id)}` }))
  return [...lp, ...bonds, ...atoms]
}
const targets = (src: Cand<Source>[]): Cand<Target>[] => src.flatMap((c) => (c.v.kind === 'lp' ? [] : [{ ...c, v: c.v as Target, name: c.name.replace(/^the /, '') }]))

/** The real arrows of step `si`, in ink. A lone-pair arrow starts at the pair nearest its target. */
function realArrows(m: Mech, si: number, src: Cand<Source>[]): Drawn[] {
  const end = (t: Target) => src.find((c) => c.v.kind === t.kind && (t.kind === 'bond' ? c.v.kind === 'bond' && ((c.v.a === t.a && c.v.b === t.b) || (c.v.a === t.b && c.v.b === t.a)) : c.v.kind === 'atom' && c.v.atom === t.atom))!.at
  return m.stages[si].real.map((r) => {
    const to = end(r.pat.to)
    const from = r.pat.from
    const p0 =
      from.kind === 'lp'
        ? src.filter((c) => c.v.kind === 'lp' && c.v.atom === from.atom).sort((a, b) => dist(a.at, to) - dist(b.at, to))[0].at
        : end(from as Target)
    return shapeArrow({ from, to: r.pat.to }, p0, to, r.bend ?? null, m.vh)
  })
}

export function MechStep({ mech, onGrade, onNext, nextLabel, onStage }: { mech: Mech; onGrade: (m: AnyMistake[]) => void; onNext: () => void; nextLabel: string; onStage?: (i: number) => void }) {
  const K = keys(mech)
  const svg = useRef<SVGSVGElement>(null)
  const [si, setSi] = useState(0)
  const [arrows, setArrows] = useState<Drawn[]>([])
  const [pen, setPen] = useState<{ from: Cand<Source>; pts: Pt[] } | null>(null)
  const [grade, setGrade] = useState<MechGrade | null>(null)
  const [t, setT] = useState(0)
  const [phase, setPhase] = useState<'draw' | 'ink' | 'run' | 'done'>('draw')
  const [say, setSay] = useState('')
  const [kFrom, setKFrom] = useState(0)
  const [kTo, setKTo] = useState(0)

  const SRC = sources(mech, si)
  const TGT = targets(SRC)
  const REAL = realArrows(mech, si, SRC)
  const stage = mech.stages[si]
  const name = (s: Source | Target) => {
    const n = (id: string) => mech.atoms.find((a) => a.id === id)!.name
    return s.kind === 'lp' ? `lone pair on ${n(s.atom)}` : s.kind === 'bond' ? `${n(s.a)}–${n(s.b)} bond` : n(s.atom)
  }
  const describe = (a: Arrow) => `${a.from.kind === 'atom' ? `the ${name(a.from)}` : name(a.from)} → ${name(a.to)}`

  const add = (d: Drawn) => {
    setArrows((a) => [...a.slice(-4), d])
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
    add(shapeArrow({ from: pen.from.v, to: to.v }, pen.from.at, to.at, pointAlong(pts, 0.5), mech.vh))
  }
  const addFromLists = () => {
    const from = SRC[kFrom]
    const to = TGT[kTo]
    if (!from || !to || (from.v.kind === 'atom' && to.v.kind === 'atom' && from.v.atom === to.v.atom)) return
    add(shapeArrow({ from: from.v, to: to.v }, from.at, to.at, null, mech.vh))
  }

  const showMe = () => {
    const g = gradeStage(
      stage,
      arrows.map((d) => d.arrow),
    )
    setGrade(g)
    onGrade(g.mistakes)
    const still = reducedMotion()
    setT(still ? si + 1 : si)
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
      setT(si + Math.min(1, k / 100))
      if (k >= 100) {
        clearInterval(id)
        setPhase('done')
      }
    }, 32)
    return () => clearInterval(id)
  }, [phase, si])

  const restart = (i: number) => {
    setArrows([])
    setGrade(null)
    setKFrom(0)
    setKTo(0)
    setT(i)
    setPhase('draw')
  }
  const nextStage = () => {
    setSi(si + 1)
    onStage?.(si + 1)
    restart(si + 1)
  }

  const scene = mechScene(mech, t)
  const fade = 1 - ease(t - si, 0.02, 0.18)
  const hover = pen ? nearest(TGT, pen.pts[pen.pts.length - 1], 24) : null
  const showInk = phase !== 'draw'
  const lastStage = si === K - 1
  // after the last step the slider runs the whole mechanism
  const lo = lastStage && phase === 'done' ? 0 : si

  return (
    <section className="og-step og-push">
      <div className="og-scenebox">
        <Scene
          scene={scene}
          vh={mech.vh}
          ref={svg}
          className={phase === 'draw' ? 'og-drawable' : ''}
          label={phase === 'draw' ? `${mech.text[si]}. Drag from electrons (a lone pair or a bond) to an atom or a bond to draw an arrow.` : `the reaction, step ${si + 1}, ${Math.round((t - si) * 100)}% of the way`}
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
              <g opacity={Math.max(0, fade)}>
                {arrows.map((d, i) => (
                  <CurvedArrow key={i} p0={d.p0} c={d.c} p3={d.p3} className="og-arrow og-pencil-arrow" />
                ))}
                {showInk && t <= si + 0.2 && REAL.map((d, i) => <CurvedArrow key={'r' + i} p0={d.p0} c={d.c} p3={d.p3} className="og-arrow og-ink-arrow" style={{ ['--d' as string]: `${i * 0.6}s` }} />)}
              </g>
              {pen && <polyline points={pen.pts.map((p) => `${p.x},${p.y}`).join(' ')} className="og-pen" />}
            </>
          }
        />
        <div className="og-legend" aria-hidden="true">
          <span className="og-key-pencil">you</span>
          {showInk && <span className="og-key-ink">real</span>}
          <span className="og-rx">{mechText(mech, t)}</span>
        </div>
        {phase === 'draw' ? (
          <p className="og-cap">drag from a lone pair <span className="og-dots" aria-hidden="true">••</span> or a bond to where the electrons go</p>
        ) : (
          <>
            <p className="og-cap og-ink-cap">{mech.stages[Math.min(K - 1, Math.floor(t === K ? K - 1 : t))].caption(t === K ? 1 : t % 1)}</p>
            <label className="og-scrub">
              <span>{lo === 0 && lastStage && K > 1 ? 'start' : 'before'}</span>
              <input type="range" min={lo * 100} max={(si + 1) * 100} value={Math.round(t * 100)} disabled={phase !== 'done'} onChange={(e) => setT(+e.target.value / 100)} aria-label="scrub the reaction" />
              <span>after</span>
            </label>
          </>
        )}
        <p className="og-sr" aria-live="polite">{say}</p>
      </div>

      <aside className="og-side">
        {K > 1 && (
          <div className="og-tag">
            step {si + 1} of {K}
          </div>
        )}
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
                {grade.mistakes.map((m) => (
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
            <button className="og-btn og-ghost" onClick={() => restart(si)}>Draw again</button>
            {lastStage ? (
              <button className="og-btn og-next" onClick={onNext}>{nextLabel}</button>
            ) : (
              <button className="og-btn og-next" disabled={phase !== 'done'} onClick={nextStage}>Step {si + 2} →</button>
            )}
          </div>
        )}
      </aside>
    </section>
  )
}
