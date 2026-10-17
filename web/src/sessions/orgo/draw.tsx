import type { El, Pt } from './chem'
import { chargeText, dist, R } from './geom'

// Small SVG pieces both orgo canvases share: atom discs, bond lines, charges, pointer → SVG units.

export function AtomDisc({ el, label, x, y, charge = 0, partial = false, tone = 'ink', fill }: { el: El; label?: string; x: number; y: number; charge?: number; partial?: boolean; tone?: 'ink' | 'pencil' | 'off'; fill?: string }) {
  // around the transition state both ends carry part of the − charge
  const c = partial ? 'δ−' : chargeText(charge)
  return (
    <g className={`og-atom og-${tone}`} transform={`translate(${x} ${y})`}>
      <circle r={R} className="og-disc" style={fill ? { fill } : undefined} />
      <text className={'og-el' + (label ? ' og-el-sm' : '')} dy="0.36em" textAnchor="middle">{label ?? el}</text>
      {c && (
        <g transform="translate(13 -14)">
          <circle r={c.length > 1 ? 9.5 : 8} className="og-chg-bg" />
          <text className={'og-chg' + (c.length > 1 ? ' og-chg-sm' : '')} dy="0.35em" textAnchor="middle">{c}</text>
        </g>
      )}
    </g>
  )
}

/** One to three parallel lines between two atom centers, trimmed to the discs. */
export function BondLines({ a, b, order, className = '', dashed = false, trim = R + 2 }: { a: Pt; b: Pt; order: number; className?: string; dashed?: boolean; trim?: number }) {
  const d = dist(a, b) || 1
  const ux = (b.x - a.x) / d
  const uy = (b.y - a.y) / d
  const t = Math.min(trim, d / 2 - 1)
  const x1 = a.x + ux * t
  const y1 = a.y + uy * t
  const x2 = b.x - ux * t
  const y2 = b.y - uy * t
  const offs = order === 1 ? [0] : order === 2 ? [-3.5, 3.5] : [-5, 0, 5]
  return (
    <g className={`og-bond ${className}`}>
      {offs.map((o) => (
        <line key={o} x1={x1 - uy * o} y1={y1 + ux * o} x2={x2 - uy * o} y2={y2 + ux * o} strokeDasharray={dashed ? '5 5' : undefined} />
      ))}
    </g>
  )
}

/** A lone pair: two dots side by side, perpendicular to the direction from the atom. */
export function PairDots({ at, deg, className = 'og-lp' }: { at: Pt; deg: number; className?: string }) {
  const a = (deg * Math.PI) / 180
  const px = Math.sin(a) * 4
  const py = Math.cos(a) * 4
  return (
    <g className={className}>
      <circle cx={at.x - px} cy={at.y - py} r={2.6} />
      <circle cx={at.x + px} cy={at.y + py} r={2.6} />
    </g>
  )
}
