import type { CSSProperties, PointerEvent, ReactNode, Ref } from 'react'
import type { Pt } from './chem'
import { AtomDisc, BondLines, PairDots } from './draw'
import { lpPos, VH, VW, type Scene as S } from './sn2'

/** The SN2 picture at one moment. Atoms can be buttons (compare step); `over` draws on top. */
export function Scene(p: {
  scene: S
  label: string
  ref?: Ref<SVGSVGElement>
  className?: string
  marks?: Record<string, string>
  onAtom?: (id: string) => void
  atomName?: (id: string) => string
  under?: ReactNode
  over?: ReactNode
  handlers?: Partial<Record<'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel', (e: PointerEvent<SVGSVGElement>) => void>>
}) {
  const { scene, marks = {}, onAtom, ref, label, className = '', atomName, under, over, handlers } = p
  const at = new Map<string, Pt>(scene.atoms.map((a) => [a.id, a]))
  return (
    <svg ref={ref} className={`og-scene ${className}`} viewBox={`0 0 ${VW} ${VH}`} role="group" aria-label={label} {...handlers}>
      {under}
      {scene.atoms.map((a) =>
        marks[a.id] ? (
          <g key={'m' + a.id} className="og-mark">
            <circle cx={a.x} cy={a.y} r={21} />
            {/* tags sit on one row under the picture, joined to their atom */}
            <line x1={a.x} y1={a.y + 21} x2={a.x} y2={VH - 21} />
            <rect x={a.x - 18} y={VH - 21} width={36} height={17} rx={4} />
            <text x={a.x} y={VH - 8.5} textAnchor="middle">{marks[a.id]}</text>
          </g>
        ) : null,
      )}
      {scene.bonds.map((b) => (
        <g key={b.id} opacity={b.opacity}>
          <BondLines a={at.get(b.a)!} b={at.get(b.b)!} order={b.order} dashed={b.dashed} className="og-ink-bond" />
        </g>
      ))}
      {scene.atoms.map((a) => (
        <g key={a.id} opacity={a.opacity}>
          {a.lp.map((deg) => (
            <PairDots key={deg} at={lpPos(a, deg)} deg={deg} />
          ))}
          {onAtom ? (
            <g
              className="og-tap"
              role="button"
              tabIndex={0}
              aria-label={atomName?.(a.id) ?? a.el}
              onClick={() => onAtom(a.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onAtom(a.id)
                }
              }}
            >
              <circle cx={a.x} cy={a.y} r={22} className="og-hit" />
              <AtomDisc el={a.el} x={a.x} y={a.y} charge={a.charge} partial={a.partial} />
            </g>
          ) : (
            <AtomDisc el={a.el} x={a.x} y={a.y} charge={a.charge} partial={a.partial} />
          )}
        </g>
      ))}
      {scene.pair && <PairDots at={scene.pair} deg={90} className="og-lp og-pair" />}
      {over}
    </svg>
  )
}

/** A curved arrow: quadratic Bezier with a full head (a pair of electrons). */
export function CurvedArrow({ p0, c, p3, className, style }: { p0: Pt; c: Pt; p3: Pt; className: string; style?: CSSProperties }) {
  const dx = p3.x - c.x
  const dy = p3.y - c.y
  const d = Math.hypot(dx, dy) || 1
  const ux = dx / d
  const uy = dy / d
  const s = 10
  const base = { x: p3.x - ux * s, y: p3.y - uy * s }
  const head = `M${p3.x} ${p3.y} L${base.x - uy * s * 0.55} ${base.y + ux * s * 0.55} L${base.x + uy * s * 0.55} ${base.y - ux * s * 0.55} Z`
  return (
    <g className={className} style={style}>
      <path d={`M${p0.x} ${p0.y} Q${c.x} ${c.y} ${base.x} ${base.y}`} pathLength={1} className="og-arrow-line" />
      <path d={head} className="og-arrow-head" />
    </g>
  )
}
