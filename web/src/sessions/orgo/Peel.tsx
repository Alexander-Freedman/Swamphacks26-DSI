import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react'
import { record } from '../../notebook'
import { EndBar, Frame, Title } from '../../components/session/Shell'
import { useReportSpot } from '../../components/session/helpSpot'
import { frontSide, gradeSN2, HINTS, MISTAKES, type Arrow, type ArrowGrade, type ArrowMistake, type Pt, type Source } from './chem'
import { dist, reducedMotion, svgPoint } from './geom'
import { nearest, pointAlong, shapeArrow, type Cand, type Drawn } from './arrows'
import { C, CAPTION, describe, LG, REAL, SRC, TGT } from './sn2Arrows'
import { CurvedArrow, Scene } from './Scene'
import { ease, lpPos, RX, sceneAt, VH, VW } from './sn2'
import {
  backBlocked, bare, BULK_R, crowdScene, FC_LINES, gradeAtomTap, gradeCrowd, gradeHill, gradePairTap, HILL, HILL_SAY, hillPath, hillPt, hillSpot,
  KIND_FORMULA, KIND_SHORT, KINDS, LAYER_MISTAKES, LAYERS, SN2_ORDER, TS_T, type Kind, type LayerId, type LayerMistake,
} from './layers'

// "Peel SN2": one picture, a layer slider under it. Every layer adds one idea and one thing to do.

export type PeelMistake = LayerMistake | ArrowMistake | 'sn2-on-tertiary'
const ALL: Record<string, { label: string; line: string }> = { ...MISTAKES, ...LAYER_MISTAKES }
const peelLabel = (m: PeelMistake) => ALL[m].label

const RXN = RX['oh-mebr']
const START = sceneAt(RXN, 0)
const NAME: Record<string, string> = { back: 'H of hydroxide', nu: 'O of hydroxide', c: 'carbon of CH₃Br', h1: 'top H on carbon', h2: 'bottom H on carbon', h3: 'front H on carbon', lg: 'Br' }
const SIDE: Record<number, string> = { 0: 'right', 70: 'top', 90: 'top', 180: 'left', 270: 'bottom', 290: 'bottom' }
/** Every lone pair in the starting picture, for layer 2. */
const PAIRS = START.atoms.flatMap((a) => a.lp.map((deg) => ({ key: `${a.id}-${deg}`, atom: a.id, at: lpPos(a, deg), name: `lone pair on ${a.id === 'nu' ? 'O' : 'Br'} (${SIDE[deg] ?? deg})` })))

type V = { ok: boolean; mistake: PeelMistake | null; note?: string }

const WHY_OK: Record<LayerId, string> = {
  atoms: 'Br pulls electrons off that carbon, so it’s δ+.',
  pairs: 'O carries the − charge: its pairs do the attacking.',
  arrows: 'One step: O–C forms as C–Br breaks. The carbon flips.',
  hill: 'One step, one hill. The top is the transition state.',
  crowd: 'Nothing blocks the back of a methyl carbon.',
}

/** The topic run: header, the peel view, then the notebook bar. */
export function PeelRun({ slug, onTopics, onDone }: { slug: string; onTopics: () => void; onDone: () => void }) {
  const [mistakes, setMistakes] = useState<PeelMistake[]>([])
  const [finished, setFinished] = useState(false)
  const saved = useRef(false)
  const latest = useRef<PeelMistake[]>([])
  useEffect(() => {
    latest.current = mistakes
  }, [mistakes])
  const caught = useCallback((m: PeelMistake) => setMistakes((all) => (all.includes(m) ? all : [...all, m])), [])
  const save = useCallback(
    (ms: PeelMistake[]) => {
      if (saved.current) return
      saved.current = true
      record({ session: slug, at: new Date().toISOString(), guess: '', misconception: ms[0] ?? null, rematch: null, mistakes: ms, orgoTopic: 'sn2-layers' })
    },
    [slug],
  )
  // leaving early still keeps the mistakes you made
  useEffect(() => () => void (latest.current.length && save(latest.current)), [save])
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!finished) return
    save(mistakes)
    end.current?.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' })
    end.current?.focus({ preventScroll: true })
  }, [finished, mistakes, save])

  return (
    <Frame className="orgo">
      <div className="ss-head">
        <span className="ss-chip">Orgo · Peel SN2</span>
      </div>
      <button className="og-btn og-ghost og-back" onClick={onTopics}>← All orgo topics</button>
      <PeelSN2 onMistake={caught} onFinish={() => setFinished(true)} />
      {finished && (
        <div ref={end} tabIndex={-1} className="og-endwrap">
          <EndBar
            caught={null}
            rematch="right"
            line={mistakes.length ? <>Caught: {mistakes.map((m) => `“${peelLabel(m)}”`).join(', ')}.</> : <span className="og-mastered">✓ mastered</span>}
            remix="Next: SN1, the same picture with a crowded carbon."
            onDone={onDone}
          />
        </div>
      )}
    </Frame>
  )
}

export function PeelSN2({ onMistake, onFinish }: { onMistake: (m: PeelMistake) => void; onFinish: () => void }) {
  const [n, setN] = useState(1)
  const layer = LAYERS[n - 1]
  const [done, setDone] = useState<Record<LayerId, boolean>>({ atoms: false, pairs: false, arrows: false, hill: false, crowd: false })
  const [say, setSay] = useState('')
  useReportSpot({ screen: `sn2-layer-${n}`, step: n, total: LAYERS.length, label: layer.title })

  const verdict = (id: LayerId, v: V) => {
    if (v.ok) setDone((d) => ({ ...d, [id]: true }))
    else if (v.mistake) onMistake(v.mistake)
    setSay(v.ok ? `Correct. ${WHY_OK[id]}` : `Not quite. ${v.mistake ? ALL[v.mistake].label : v.note ?? ''}`)
  }

  /* layer 1 */
  const [atomV, setAtomV] = useState<(V & { id: string }) | null>(null)
  const tapAtom = (id: string) => {
    const v = { ...gradeAtomTap(id), id }
    setAtomV(v)
    verdict('atoms', v)
  }

  /* layer 2 */
  const [pairV, setPairV] = useState<(V & { key: string }) | null>(null)
  const tapPair = (p: (typeof PAIRS)[number]) => {
    const g = gradePairTap(p.atom)
    const v = { ...g, key: p.key, note: g.ok ? undefined : 'Pick a pair on the atom that attacks.' }
    setPairV(v)
    verdict('pairs', v)
  }

  /* layer 3 */
  const svg = useRef<SVGSVGElement>(null)
  const [arrows, setArrows] = useState<Drawn[]>([])
  const [pen, setPen] = useState<{ from: Cand<Source>; pts: Pt[] } | null>(null)
  const [grade, setGrade] = useState<ArrowGrade | null>(null)
  const [t, setT] = useState(0)
  const [phase, setPhase] = useState<'draw' | 'ink' | 'run' | 'done'>('draw')
  const [kFrom, setKFrom] = useState(0)
  const [kTo, setKTo] = useState(0)
  const addArrow = (d: Drawn) => {
    setArrows((a) => [...a.slice(-3), d])
    setSay(`arrow added: ${describe(d.arrow)}`)
  }
  const addFromLists = () => {
    const from = SRC[kFrom]
    const to = TGT[kTo]
    if (from.v.kind === 'atom' && to.v.kind === 'atom' && from.v.atom === to.v.atom) return
    const d = shapeArrow({ from: from.v, to: to.v }, from.at, to.at, null)
    if (to.v.kind === 'atom' && to.v.atom === 'c') d.arrow.front = frontSide(d.c, C, LG)
    addArrow(d)
  }
  const showMe = () => {
    const g = gradeSN2(
      arrows.map((d) => d.arrow),
      RXN.roles,
    )
    setGrade(g)
    g.mistakes.forEach(onMistake)
    if (g.ok) setDone((d) => ({ ...d, arrows: true }))
    setSay(g.ok ? `Correct. ${WHY_OK.arrows}` : `Not quite. ${g.mistakes.map((m) => ALL[m].label).join(', ')}`)
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
  const redraw = () => {
    setArrows([])
    setGrade(null)
    setT(0)
    setPhase('draw')
  }

  /* layer 4 */
  const [hillT, setHillT] = useState(0.08)
  const [hillV, setHillV] = useState<V | null>(null)
  const [drag, setDrag] = useState(false)
  const moveDot = (u: number) => {
    setHillT(Math.min(1, Math.max(0, u)))
    setHillV(null)
  }
  const checkHill = () => {
    const g = gradeHill(hillT)
    const v = { ...g, note: HILL_SAY[hillSpot(hillT)] }
    setHillV(v)
    if (v.ok) setHillT(TS_T)
    verdict('hill', v)
  }

  /* layer 5 */
  const [kind, setKind] = useState<Kind>('methyl')
  const [crowdV, setCrowdV] = useState<(V & { kind: Kind }) | null>(null)
  const pickKind = () => {
    const v = { ...gradeCrowd(kind), kind }
    setCrowdV(v)
    verdict('crowd', v)
  }

  /* pointer: drawing arrows on layer 3, dragging the dot on layer 4 */
  const pt = (e: RPointerEvent<SVGSVGElement>) => svgPoint(svg.current, e.clientX, e.clientY, VW)
  const hillU = (p: Pt) => (p.x - HILL.x0) / (HILL.x1 - HILL.x0)
  const down = (e: RPointerEvent<SVGSVGElement>) => {
    const p = pt(e)
    if (n === 4 && p.y > HILL.top - 24) {
      svg.current?.setPointerCapture?.(e.pointerId)
      setDrag(true)
      return moveDot(hillU(p))
    }
    if (n !== 3 || phase !== 'draw') return
    const from = nearest(SRC, p, 20)
    if (!from) return
    svg.current?.setPointerCapture?.(e.pointerId)
    setPen({ from, pts: [from.at, p] })
  }
  const move = (e: RPointerEvent<SVGSVGElement>) => {
    if (drag) return moveDot(hillU(pt(e)))
    if (!pen) return
    setPen({ ...pen, pts: [...pen.pts, pt(e)] })
  }
  const up = (e: RPointerEvent<SVGSVGElement>) => {
    if (drag) return setDrag(false)
    if (!pen) return
    const p = pt(e)
    const pts = [...pen.pts, p]
    setPen(null)
    const to = nearest(TGT, p, 24)
    if (!to || dist(pts[0], p) < 14) return setSay('Arrows end on an atom or a bond.')
    const arrow: Arrow = { from: pen.from.v, to: to.v }
    if (to.v.kind === 'atom' && to.v.atom === 'c') arrow.front = frontSide(pointAlong(pts, 0.8), C, LG)
    addArrow(shapeArrow(arrow, pen.from.at, to.at, pointAlong(pts, 0.5)))
  }

  /* the one picture, as this layer shows it */
  let pic: { scene: ReturnType<typeof sceneAt>; vh: number; label: string; under?: ReactNode; over?: ReactNode; onAtom?: (id: string) => void; marks?: Record<string, string> }
  if (n === 1) {
    pic = {
      scene: bare(START),
      vh: VH,
      label: 'H–O and CH₃Br, atoms and bonds only. Tap the atom HO⁻ will attack.',
      onAtom: done.atoms ? undefined : tapAtom,
      marks: done.atoms ? { c: 'C' } : atomV ? { [atomV.id]: '?' } : {},
    }
  } else if (n === 2) {
    pic = {
      scene: START,
      vh: VH,
      label: 'HO⁻ and CH₃Br with lone pairs and charges. Tap a lone pair that will attack.',
      over: (
        <g className="og-pairhits">
          {PAIRS.map((p) => {
            const mine = pairV?.key === p.key
            return (
              <g
                key={p.key}
                role="button"
                tabIndex={0}
                aria-label={p.name}
                aria-pressed={mine}
                className={'og-pairhit' + (mine ? (pairV!.ok ? ' ok' : ' off') : '')}
                onClick={() => tapPair(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    tapPair(p)
                  }
                }}
              >
                <circle cx={p.at.x} cy={p.at.y} r={11} />
              </g>
            )
          })}
        </g>
      ),
    }
  } else if (n === 3) {
    const fade = 1 - ease(t, 0.02, 0.18)
    const hover = pen ? nearest(TGT, pen.pts[pen.pts.length - 1], 24) : null
    pic = {
      scene: sceneAt(RXN, t),
      vh: VH,
      label: phase === 'draw' ? 'HO⁻ and CH₃Br. Drag from electrons (a lone pair or a bond) to an atom or a bond to draw an arrow.' : `the reaction, ${Math.round(t * 100)}% of the way`,
      under:
        phase === 'draw' ? (
          <g className="og-sources" aria-hidden="true">
            {SRC.filter((s) => s.v.kind === 'lp').map((s) => (
              <circle key={s.name} cx={s.at.x} cy={s.at.y} r={10} />
            ))}
          </g>
        ) : null,
      over: (
        <>
          {hover && <circle cx={hover.at.x} cy={hover.at.y} r={20} className="og-target-hl" />}
          <g opacity={fade}>
            {arrows.map((d, i) => (
              <CurvedArrow key={i} p0={d.p0} c={d.c} p3={d.p3} className="og-arrow og-pencil-arrow" />
            ))}
            {phase !== 'draw' && REAL.map((d, i) => <CurvedArrow key={'r' + i} p0={d.p0} c={d.c} p3={d.p3} className="og-arrow og-ink-arrow" style={{ ['--d' as string]: `${i * 0.8}s` }} />)}
          </g>
          {pen && <polyline points={pen.pts.map((p) => `${p.x},${p.y}`).join(' ')} className="og-pen" />}
        </>
      ),
    }
  } else if (n === 4) {
    const dot = hillPt(hillT)
    const top = hillPt(TS_T)
    pic = {
      scene: sceneAt(RXN, hillT),
      vh: HILL.vh,
      label: `HO⁻ + CH₃Br over a one-hill energy diagram. The dot is ${Math.round(hillT * 100)}% along the reaction.`,
      over: (
        <g className="og-hill">
          <line x1={HILL.x0 - 14} y1={HILL.base + 4} x2={HILL.x0 - 14} y2={HILL.top - 6} className="og-axis" markerEnd="url(#og-tip)" />
          <line x1={HILL.x0 - 14} y1={HILL.base + 4} x2={HILL.x1} y2={HILL.base + 4} className="og-axis" markerEnd="url(#og-tip)" />
          <defs>
            <marker id="og-tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" className="og-tip" />
            </marker>
          </defs>
          <text x={HILL.x0 - 20} y={HILL.top + 4} className="og-hill-l" textAnchor="end" transform={`rotate(-90 ${HILL.x0 - 20} ${HILL.top + 4})`}>energy</text>
          <text x={HILL.x1} y={HILL.base + 4 + 9} className="og-hill-l" textAnchor="end">reaction →</text>
          <path d={hillPath()} className="og-hill-curve" />
          <text x={hillPt(0).x} y={hillPt(0).y - 8} className="og-hill-l">start</text>
          <text x={hillPt(1).x} y={hillPt(1).y - 8} className="og-hill-l" textAnchor="end">end</text>
          {done.hill && (
            <text x={top.x} y={top.y - 8} className="og-hill-ts" textAnchor="middle">TS ‡</text>
          )}
          <g
            role="slider"
            tabIndex={0}
            aria-label="dot on the energy hill"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(hillT * 100)}
            aria-valuetext={`${Math.round(hillT * 100)}% along the reaction`}
            className="og-hill-dot"
            onKeyDown={(e) => {
              const step = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02 }[e.key]
              if (step !== undefined) {
                e.preventDefault()
                moveDot(hillT + step)
              } else if (e.key === 'Home' || e.key === 'End') {
                e.preventDefault()
                moveDot(e.key === 'Home' ? 0 : 1)
              } else if (e.key === 'Enter') checkHill()
            }}
          >
            <circle cx={dot.x} cy={dot.y} r={18} className="og-hit" />
            <circle cx={dot.x} cy={dot.y} r={9} className={'og-dot' + (hillV ? (hillV.ok ? ' ok' : ' off') : '')} />
          </g>
        </g>
      ),
    }
  } else {
    const s = crowdScene(kind)
    const nu = s.atoms.find((a) => a.id === 'nu')!
    const blocked = backBlocked(kind)
    const end = blocked ? C.x - 58 : C.x - 22
    pic = {
      scene: s,
      vh: VH,
      label: `HO⁻ and ${KIND_FORMULA[kind]}: the ${KIND_SHORT[kind]} carbon. The path to its back side is ${blocked ? 'blocked' : 'open'}.`,
      under: (
        <g className="og-crowd" aria-hidden="true">
          {s.atoms
            .filter((a) => a.label === 'CH₃')
            .map((a) => (
              <circle key={a.id} cx={a.x} cy={a.y} r={BULK_R} className="og-bulk" />
            ))}
          <line x1={nu.x + 22} y1={nu.y} x2={end} y2={C.y} className={'og-path' + (blocked ? ' off' : '')} />
        </g>
      ),
      over: blocked ? (
        <g className="og-block" aria-hidden="true">
          <path d={`M${end - 7} ${C.y - 7} L${end + 7} ${C.y + 7} M${end + 7} ${C.y - 7} L${end - 7} ${C.y + 7}`} />
          <text x={end} y={C.y - 14} textAnchor="middle">blocked</text>
        </g>
      ) : null,
    }
  }

  const stamp = (v: V | null, okLine: string) =>
    v && (
      <div className="og-verdict" role="status">
        {v.ok ? (
          <div className="og-okay">
            <span className="og-check" aria-hidden="true">✓</span> Correct
            <span className="og-okwhy">{okLine}</span>
          </div>
        ) : (
          <div className="og-mistake">
            <div className="og-nq">✗ Not quite</div>
            {v.mistake ? (
              <>
                <div className="og-mname">{ALL[v.mistake].label}</div>
                <p>{ALL[v.mistake].line}</p>
              </>
            ) : (
              v.note && <p>{v.note}</p>
            )}
          </div>
        )}
      </div>
    )

  const next = done[layer.id] && n < LAYERS.length && (
    <button className="og-btn og-go" onClick={() => setN(n + 1)}>
      {LAYERS[n].title} →
    </button>
  )

  return (
    <section className="og-peel">
      <Title h={<>{n} · {layer.title}</>} sub={layer.ask} />
      <div className="og-scenebox">
        <Scene
          scene={pic.scene}
          vh={pic.vh}
          ref={svg}
          className={'og-peel-scene' + (n === 3 && phase === 'draw' ? ' og-drawable' : '') + (n === 4 ? ' og-dragline' : '')}
          label={pic.label}
          marks={pic.marks}
          onAtom={pic.onAtom}
          atomName={(id) => NAME[id] ?? id}
          under={pic.under}
          over={pic.over}
          handlers={{ onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: () => (setPen(null), setDrag(false)) }}
        />
        {n === 2 && (
          <p className="og-fc" aria-label="formal charges">
            <span>FC = valence − nonbonding − bonds</span>
            {FC_LINES.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
        )}
        {n === 3 && (
          <p className={'og-cap' + (phase === 'draw' ? '' : ' og-ink-cap')}>
            {phase === 'draw' ? 'start on electrons (a lone pair •• or a bond), drag to where they go' : CAPTION(t)}
          </p>
        )}
        {n === 3 && phase !== 'draw' && (
          <label className="og-scrub">
            <span>before</span>
            <input type="range" min={0} max={100} value={Math.round(t * 100)} disabled={phase !== 'done'} onChange={(e) => setT(+e.target.value / 100)} aria-label="scrub the reaction" />
            <span>after</span>
          </label>
        )}
      </div>

      <div className="og-layers">
        <input
          type="range"
          min={1}
          max={LAYERS.length}
          step={1}
          value={n}
          onChange={(e) => setN(+e.target.value)}
          aria-label="layer"
          aria-valuetext={`layer ${n} of ${LAYERS.length}: ${layer.title}`}
          className="og-layer-range"
        />
        <ol className="og-stops">
          {LAYERS.map((l) => (
            <li key={l.id}>
              <button className={'og-stop' + (l.n === n ? ' on' : '') + (done[l.id] ? ' done' : '')} aria-current={l.n === n ? 'step' : undefined} onClick={() => setN(l.n)}>
                <span className="og-stop-n">{done[l.id] ? '✓' : l.n}</span>
                <span className="og-stop-l">{l.short}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="og-doit">
        {n === 1 && stamp(atomV, WHY_OK.atoms)}
        {n === 2 && stamp(pairV, WHY_OK.pairs)}
        {n === 3 && (
          <>
            {phase === 'draw' ? (
              <>
                <ol className="og-arrowlist" aria-label="your arrows">
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
            ) : (
              <>
                {grade &&
                  stamp(
                    { ok: grade.ok, mistake: grade.mistakes[0] ?? null, note: grade.hints.map((h) => HINTS[h]).join(' ') },
                    WHY_OK.arrows,
                  )}
                {grade && grade.mistakes.length > 1 && (
                  <div className="og-mistake">
                    {grade.mistakes.slice(1).map((m) => (
                      <div key={m}>
                        <div className="og-mname">{ALL[m].label}</div>
                        <p>{ALL[m].line}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="og-row">
                  <button className="og-btn og-ghost" onClick={redraw}>Draw again</button>
                </div>
              </>
            )}
          </>
        )}
        {n === 4 && (
          <>
            <div className="og-row">
              <button className="og-btn og-go" onClick={checkHill}>Is this the top?</button>
            </div>
            {stamp(hillV, WHY_OK.hill)}
          </>
        )}
        {n === 5 && (
          <>
            <div className="og-kinds" role="group" aria-label="carbon">
              {KINDS.map((k) => (
                <button
                  key={k}
                  className={'og-kind' + (kind === k ? ' on' : '')}
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k)
                    setCrowdV(null)
                  }}
                >
                  <b>{KIND_SHORT[k]}</b>
                  <span>{KIND_FORMULA[k]}</span>
                </button>
              ))}
            </div>
            {done.crowd && (
              <p className="og-order">
                SN2 speed: {SN2_ORDER.map((k, i) => (i === 0 ? '' : i === SN2_ORDER.length - 1 ? ' >> ' : ' > ') + KIND_SHORT[k]).join('')}
              </p>
            )}
            <div className="og-row">
              <button className="og-btn og-go" onClick={pickKind} disabled={done.crowd}>SN2 works best on {KIND_SHORT[kind]}</button>
            </div>
            {stamp(crowdV, WHY_OK.crowd)}
            {done.crowd && (
              <div className="og-row">
                <button className="og-btn og-next" onClick={onFinish}>Finish ✓</button>
              </div>
            )}
          </>
        )}
        {next && <div className="og-row">{next}</div>}
      </div>
      <p className="og-sr" aria-live="polite">{say}</p>
    </section>
  )
}
