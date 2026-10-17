import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react'
import {
  bondCount,
  charges,
  checkBuild,
  ELEMENTS,
  ETHANOL,
  formula,
  formulaText,
  HINTS,
  MISTAKES,
  overfilled,
  type Atom,
  type Bond,
  type BuildCheck,
  type BuildMistake,
  type El,
  type Mol,
  type Pt,
} from './chem'
import { AtomDisc, BondLines } from './draw'
import { dist, R, svgPoint } from './geom'

const W = 400
const H = 280
const PALETTE: El[] = ['C', 'H', 'O', 'N', 'Br']
const RING = R + 6
const TARGET = formulaText(formula(ETHANOL))

type Drag =
  | { kind: 'new'; el: El; x0: number; y0: number; p: (Pt & { inside: boolean }) | null; moved: boolean }
  | { kind: 'atom'; id: string; x0: number; y0: number; p: (Pt & { inside: boolean }) | null; moved: boolean }

const clampPt = (p: Pt): Pt => ({ x: Math.min(W - 24, Math.max(24, p.x)), y: Math.min(H - 24, Math.max(24, p.y)) })
const sameBond = (b: Bond, x: string, y: string) => (b.a === x && b.b === y) || (b.a === y && b.b === x)

/** Arc slots around an atom: one per bond it usually makes, filled as bonds use them. */
function Slots({ el, used }: { el: El; used: number }) {
  const n = ELEMENTS[el].bonds
  const over = used > n
  if (n === 1) return <circle r={RING} className={'og-slot' + (used ? ' full' : '') + (over ? ' over' : '')} />
  const gap = 16
  const arcs = Array.from({ length: n }, (_, i) => {
    const a0 = ((-90 + (i * 360) / n + gap / 2) * Math.PI) / 180
    const a1 = ((-90 + ((i + 1) * 360) / n - gap / 2) * Math.PI) / 180
    const d = `M${(RING * Math.cos(a0)).toFixed(2)} ${(RING * Math.sin(a0)).toFixed(2)} A${RING} ${RING} 0 0 1 ${(RING * Math.cos(a1)).toFixed(2)} ${(RING * Math.sin(a1)).toFixed(2)}`
    return <path key={i} d={d} className={'og-slot' + (i < used ? ' full' : '') + (over ? ' over' : '')} />
  })
  return <>{arcs}</>
}

export function BuildStep({ onCheck, onNext }: { onCheck: (mistakes: BuildMistake[]) => void; onNext: () => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const [atoms, setAtoms] = useState<Atom[]>([])
  const [bonds, setBonds] = useState<Bond[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [bondFrom, setBondFrom] = useState<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [result, setResult] = useState<BuildCheck | null>(null)
  const [say, setSay] = useState('')
  const nextId = useRef(0)
  const suppressClick = useRef(false)

  const mol: Mol = { atoms, bonds }
  const fc = charges(mol)
  const over = overfilled(mol)
  const overIds = new Set(over.map((o) => o.id))
  const live = [...new Set(over.flatMap((o) => (o.mistake ? [o.mistake] : [])))]
  const f = formula(mol)
  const byId = (id: string | null) => atoms.find((a) => a.id === id)

  // Every change goes through edit(), so Undo (button or Ctrl/Cmd+Z) steps back one change at a time:
  // an added atom, a bond, a double bond, a removed bond or atom, a move, even Clear.
  const history = useRef<{ atoms: Atom[]; bonds: Bond[] }[]>([])
  const edit = (a: Atom[], b: Bond[]) => {
    history.current.push({ atoms, bonds })
    setAtoms(a)
    setBonds(b)
    setResult(null)
  }
  const undo = () => {
    const prev = history.current.pop()
    if (!prev) return
    setAtoms(prev.atoms)
    setBonds(prev.bonds)
    setResult(null)
    setSel(null)
    setBondFrom(null)
    setSay('undone')
  }
  const undoRef = useRef(undo)
  undoRef.current = undo
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undoRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const atomAt = (p: Pt, except?: string) => {
    let best: Atom | null = null
    for (const a of atoms) if (a.id !== except && dist(a, p) < RING + 4 && (!best || dist(a, p) < dist(best, p))) best = a
    return best
  }
  const free = (p: Pt, list: Atom[]) => list.every((a) => dist(a, p) >= 44) && p.x >= 24 && p.x <= W - 24 && p.y >= 24 && p.y <= H - 24
  const spotNear = (a: Atom, el: El, list: Atom[]): Pt | null => {
    const r = el === 'H' || a.el === 'H' ? 50 : 62
    for (const deg of [0, 180, 90, 270, 45, 135, 225, 315, 30, 150, 210, 330, 60, 120, 240, 300]) {
      const p = { x: a.x + r * Math.cos((deg * Math.PI) / 180), y: a.y - r * Math.sin((deg * Math.PI) / 180) }
      if (free(p, list)) return p
    }
    return null
  }
  const spotAnywhere = (list: Atom[]): Pt => {
    for (let ring = 0; ring < 8; ring++)
      for (let k = 0; k < Math.max(1, ring * 8); k++) {
        const a = (k / Math.max(1, ring * 8)) * Math.PI * 2
        const p = { x: Math.round(W / 2 + ring * 30 * Math.cos(a)), y: Math.round(H / 2 + ring * 26 * Math.sin(a)) }
        if (free(p, list)) return p
      }
    return { x: 30, y: 30 }
  }

  const label = (a: Atom) => `${ELEMENTS[a.el].name} ${a.el}${a.id.slice(1)}`

  /** Add an atom; dropped on (or added next to) another atom, it bonds to it. */
  const add = (el: El, at: Pt | null, onto: Atom | null) => {
    const id = `a${nextId.current++}`
    const p = onto ? spotNear(onto, el, atoms) ?? spotAnywhere(atoms) : at ? clampPt(at) : spotAnywhere(atoms)
    const atom: Atom = { id, el, ...p }
    edit([...atoms, atom], onto ? [...bonds, { a: onto.id, b: id, order: 1 }] : bonds)
    if (el !== 'H') setSel(id)
    setSay(onto ? `${ELEMENTS[el].name} added, bonded to ${label(onto)}` : `${ELEMENTS[el].name} added`)
  }

  const bond = (x: string, y: string) => {
    const b = bonds.find((q) => sameBond(q, x, y))
    if (b) edit(atoms, bonds.map((q) => (q === b ? { ...q, order: b.order === 1 ? 2 : b.order } : q)))
    else edit(atoms, [...bonds, { a: x, b: y, order: 1 }])
    setSay(`bonded ${label(byId(x)!)} to ${label(byId(y)!)}`)
  }
  /** Tap a bond: single → double → gone. */
  const cycle = (b: Bond) => {
    if (b.order === 1) edit(atoms, bonds.map((q) => (q === b ? { ...q, order: 2 } : q)))
    else edit(atoms, bonds.filter((q) => q !== b))
    setSay(b.order === 1 ? 'double bond' : 'bond removed')
  }
  const remove = (id: string) => {
    edit(
      atoms.filter((a) => a.id !== id),
      bonds.filter((b) => b.a !== id && b.b !== id),
    )
    if (sel === id) setSel(null)
    if (bondFrom === id) setBondFrom(null)
    setSay('atom removed')
  }
  const clear = () => {
    edit([], [])
    nextId.current = 0
    setSel(null)
    setBondFrom(null)
    setSay('cleared')
  }
  const moveTo = (id: string, p: Pt) => edit(atoms.map((a) => (a.id === id ? { ...a, ...clampPt(p) } : a)), bonds)

  // ---- palette: drag onto the paper, or tap to add (next to the picked atom if it has room)
  const palDown = (el: El) => (e: RPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ kind: 'new', el, x0: e.clientX, y0: e.clientY, p: null, moved: false })
  }
  const move = (e: RPointerEvent) => {
    if (!drag) return
    const p = svgPoint(svg.current, e.clientX, e.clientY, W)
    const moved = drag.moved || Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6
    setDrag({ ...drag, p, moved })
  }
  const palUp = (e: RPointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.kind !== 'new') return
    const p = svgPoint(svg.current, e.clientX, e.clientY, W)
    if (drag.moved) {
      suppressClick.current = true
      if (p.inside) add(drag.el, p, atomAt(p))
    }
    setDrag(null)
  }
  const palClick = (el: El) => {
    if (suppressClick.current) return void (suppressClick.current = false)
    const s = byId(sel)
    add(el, null, s && bondCount(mol, s.id) < ELEMENTS[s.el].bonds ? s : null)
  }

  // ---- atoms: drag to another atom to bond, to empty paper to move, off the paper to remove; tap to pick
  const atomDown = (a: Atom) => (e: RPointerEvent<SVGGElement>) => {
    e.stopPropagation()
    svg.current?.setPointerCapture?.(e.pointerId)
    setDrag({ kind: 'atom', id: a.id, x0: e.clientX, y0: e.clientY, p: null, moved: false })
  }
  const svgUp = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drag || drag.kind !== 'atom') return
    const p = svgPoint(svg.current, e.clientX, e.clientY, W)
    setDrag(null)
    if (!drag.moved) {
      setSel(drag.id)
      return
    }
    const onto = atomAt(p, drag.id)
    if (onto) bond(drag.id, onto.id)
    else if (!p.inside) remove(drag.id)
    else moveTo(drag.id, p)
  }

  const atomKey = (a: Atom) => (e: KeyboardEvent<SVGGElement>) => {
    const step = e.shiftKey ? 30 : 10
    const d: Record<string, Pt> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } }
    if (d[e.key]) moveTo(a.id, { x: a.x + d[e.key].x, y: a.y + d[e.key].y })
    else if (e.key === 'Enter' || e.key === ' ') {
      if (bondFrom && bondFrom !== a.id) {
        bond(bondFrom, a.id)
        setBondFrom(null)
      } else if (bondFrom === a.id) {
        setBondFrom(null)
        setSay('bonding cancelled')
      } else {
        setBondFrom(a.id)
        setSay(`bonding from ${label(a)}: pick another atom and press Enter`)
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') remove(a.id)
    else if (e.key === 'Escape') {
      setBondFrom(null)
      setSel(null)
    } else return
    e.preventDefault()
  }

  const check = () => {
    const r = checkBuild(mol, ETHANOL, 'ethanol')
    setResult(r)
    if (!r.ok) onCheck(r.mistakes)
  }

  const dragAtom = drag?.kind === 'atom' && drag.moved ? byId(drag.id) : null
  const dropOn = drag?.moved && drag.p?.inside ? atomAt(drag.p, drag.kind === 'atom' ? drag.id : undefined) : null
  const ok = result?.ok === true

  return (
    <section className="og-step og-build">
      <div className="og-work">
        <div className="og-palette" role="group" aria-label="atoms: drag onto the paper, or press to add">
          {PALETTE.map((el) => (
            <button
              key={el}
              className="og-pal"
              aria-label={`add ${ELEMENTS[el].name}`}
              onPointerDown={palDown(el)}
              onPointerMove={move}
              onPointerUp={palUp}
              onPointerCancel={() => setDrag(null)}
              onClick={() => palClick(el)}
            >
              <svg viewBox="-22 -22 44 44" aria-hidden="true">
                <g className="og-ring">
                  <Slots el={el} used={0} />
                </g>
                <AtomDisc el={el} x={0} y={0} />
              </svg>
            </button>
          ))}
          <button className="og-btn og-ghost og-undo" onClick={undo} disabled={!history.current.length} aria-keyshortcuts="Control+Z Meta+Z" title="Undo (Ctrl+Z)">
            ↶ Undo
          </button>
          <button className="og-btn og-ghost og-clear" onClick={clear} disabled={!atoms.length}>
            Clear
          </button>
        </div>

        <svg
          ref={svg}
          className={'og-canvas' + (drag ? ' dragging' : '')}
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label="molecule canvas"
          onPointerMove={move}
          onPointerUp={svgUp}
          onPointerCancel={() => setDrag(null)}
        >
          <rect width={W} height={H} className="og-paper" onClick={() => (setSel(null), setBondFrom(null))} />
          {!atoms.length && (
            <text x={W / 2} y={H / 2} className="og-empty" textAnchor="middle">
              drag atoms here
            </text>
          )}
          {bonds.map((b) => {
            const a1 = byId(b.a)!
            const a2 = byId(b.b)!
            const name = `${label(a1)} to ${label(a2)}, ${b.order === 1 ? 'single' : 'double'} bond`
            return (
              <g
                key={b.a + b.b}
                className="og-bondhit"
                role="button"
                tabIndex={0}
                aria-label={`${name}. Press to change.`}
                onClick={() => cycle(b)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    cycle(b)
                  }
                }}
              >
                <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} className="og-hit" />
                <BondLines a={a1} b={a2} order={b.order} trim={RING + 1} />
              </g>
            )
          })}
          {dragAtom && drag?.p && <line x1={dragAtom.x} y1={dragAtom.y} x2={drag.p.x} y2={drag.p.y} className="og-pencil-line" />}
          {atoms.map((a) => {
            const used = bondCount(mol, a.id)
            const n = ELEMENTS[a.el].bonds
            return (
              <g
                key={a.id}
                className={'og-node' + (sel === a.id ? ' sel' : '') + (bondFrom === a.id ? ' from' : '') + (dropOn?.id === a.id ? ' drop' : '')}
                transform={`translate(${a.x} ${a.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${label(a)}, ${used} of ${n} bonds${fc[a.id] ? `, charge ${fc[a.id] > 0 ? '+' : ''}${fc[a.id]}` : ''}`}
                aria-pressed={sel === a.id}
                onPointerDown={atomDown(a)}
                onKeyDown={atomKey(a)}
                onFocus={() => setSel(a.id)}
              >
                <circle r={RING + 8} className="og-halo" />
                <g className="og-ring">
                  <Slots el={a.el} used={used} />
                </g>
                <AtomDisc el={a.el} x={0} y={0} charge={used && !(overIds.has(a.id) && (a.el === 'C' || a.el === 'H')) ? fc[a.id] : 0} tone={overIds.has(a.id) ? 'off' : 'ink'} />
              </g>
            )
          })}
          {drag?.kind === 'new' && drag.moved && drag.p?.inside && (
            <g className="og-ghost" pointerEvents="none">
              <AtomDisc el={drag.el} x={drag.p.x} y={drag.p.y} tone="pencil" />
            </g>
          )}
          {ok && (
            <g className="og-correct" transform={`translate(${W - 20} 20)`} pointerEvents="none" aria-hidden="true">
              <circle cx={-26} cy={26} r={22} />
              <path d="M -37 26 l 8 8 l 15 -16" />
              <text x={-56} y={33} textAnchor="end">Correct!</text>
            </g>
          )}
        </svg>
        <p className="og-cap">
          drag atom → atom to bond · tap a bond: single → double → none · drag off the paper to remove
        </p>
        <p className="og-sr" aria-live="polite">{say}</p>
      </div>

      <aside className="og-side">
        <div className="og-tag">your formula</div>
        <div className={'og-formula' + (f.length ? '' : ' empty')} aria-live="polite">
          {f.length ? formulaText(f) : '—'}
        </div>
        <div className="og-target">
          <span className="og-pencil-text">target: ethanol</span> <b>{TARGET}</b>
        </div>
        {live.length > 0 && !result && (
          <div className="og-live">
            {live.map((m) => (
              <div key={m} className="og-mname">{MISTAKES[m].label}</div>
            ))}
          </div>
        )}
        {result && <BuildVerdict r={result} />}
        {ok ? (
          <button className="og-btn og-next" onClick={onNext}>Push the electrons →</button>
        ) : (
          <button className="og-btn og-go" onClick={check} disabled={!atoms.length}>Check it</button>
        )}
      </aside>
    </section>
  )
}

function BuildVerdict({ r }: { r: BuildCheck }) {
  if (r.ok)
    return (
      <div className="og-verdict og-okay" role="status">
        <span className="og-check" aria-hidden="true">✓</span> ethanol <span className="og-cond">CH₃–CH₂–OH</span>
      </div>
    )
  return (
    <div className="og-verdict" role="status">
      {r.mistakes.map((m) => (
        <div key={m} className="og-mistake">
          <div className="og-mname">{MISTAKES[m].label}</div>
          <p>{MISTAKES[m].line}</p>
          {m === 'same-formula-different-molecule' && <Skeletons />}
        </div>
      ))}
      {r.hint && <p className="og-hint">{HINTS[r.hint]}</p>}
    </div>
  )
}

/** Yours (pencil) next to ethanol (ink), heavy atoms only. */
function Skeletons() {
  const row = (els: string[], y: number, cls: string) => (
    <g className={cls}>
      {els.slice(1).map((_, i) => (
        <line key={i} x1={20 + i * 46 + R} y1={y} x2={20 + (i + 1) * 46 - R} y2={y} className="og-skl" />
      ))}
      {els.map((el, i) => (
        <g key={i} transform={`translate(${20 + i * 46} ${y})`}>
          <circle r={R} className="og-disc" />
          <text className="og-el" dy="0.36em" textAnchor="middle">{el}</text>
        </g>
      ))}
    </g>
  )
  return (
    <svg className="og-skel" viewBox="0 0 270 92" role="img" aria-label="yours: C–O–C, dimethyl ether. Ethanol: C–C–O–H.">
      {row(['C', 'O', 'C'], 22, 'og-atom og-pencil')}
      <text x={170} y={27} className="og-skel-l">yours</text>
      {row(['C', 'C', 'O', 'H'], 68, 'og-atom og-ink')}
      <text x={208} y={73} className="og-skel-l">ethanol</text>
    </svg>
  )
}
