import { useId, type ReactNode, type SVGProps } from 'react'
import { sx, sy, type Box } from './frame'

// SVG pieces for the calculus screens: graph paper inside the play area, and a px-sized chart with a clip path.

/** The play area: graph paper, axes at 0, tick labels at whole numbers (or `xStep`/`yStep`). */
export function Paper({ f, xStep = 1, yStep = 1, xLabel, yLabel }: { f: Box; xStep?: number; yStep?: number; xLabel?: string; yLabel?: string }) {
  const xs: number[] = []
  for (let x = Math.ceil(f.x0 / xStep) * xStep; x <= f.x1 + 1e-9; x += xStep) xs.push(+x.toFixed(6))
  const ys: number[] = []
  for (let y = Math.ceil(f.y0 / yStep) * yStep; y <= f.y1 + 1e-9; y += yStep) ys.push(+y.toFixed(6))
  const L = f.l
  const R = f.w - f.r
  const T = f.t
  const Bm = f.h - f.b
  const ax = f.y0 <= 0 && f.y1 >= 0 ? sy(f, 0) : Bm
  const ay = f.x0 <= 0 && f.x1 >= 0 ? sx(f, 0) : L
  return (
    <g className="calc-paper" aria-hidden="true">
      <rect x={L} y={T} width={R - L} height={Bm - T} className="calc-paperbg" />
      {xs.map((x) => <line key={'x' + x} x1={sx(f, x)} x2={sx(f, x)} y1={T} y2={Bm} className="calc-gridline" />)}
      {ys.map((y) => <line key={'y' + y} x1={L} x2={R} y1={sy(f, y)} y2={sy(f, y)} className="calc-gridline" />)}
      <line x1={L} x2={R} y1={ax} y2={ax} className="calc-axis" />
      <line x1={ay} x2={ay} y1={T} y2={Bm} className="calc-axis" />
      {xs.map((x) => (
        <text key={'tx' + x} x={sx(f, x)} y={Bm + 16} className="calc-tick" textAnchor="middle">{x}</text>
      ))}
      {ys.map((y) => (
        <text key={'ty' + y} x={L - 6} y={sy(f, y) + 4} className="calc-tick" textAnchor="end">{y}</text>
      ))}
      {xLabel && <text x={R} y={Bm - 6} className="calc-axislabel" textAnchor="end">{xLabel}</text>}
      {yLabel && <text x={L + 6} y={T + 14} className="calc-axislabel">{yLabel}</text>}
    </g>
  )
}

/** An SVG chart sized in px with a clip path for its play area. */
export function Chart({ f, label, children, className = '', ...rest }: { f: Box; label: string; children: (clip: string) => ReactNode; className?: string } & Omit<SVGProps<SVGSVGElement>, 'children'>) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} className={`calc-chart ${className}`} role="img" aria-label={label} {...rest}>
      <defs>
        <clipPath id={`clip${id}`}>
          <rect x={f.l} y={f.t} width={f.w - f.l - f.r} height={f.h - f.t - f.b} />
        </clipPath>
      </defs>
      {children(`url(#clip${id})`)}
    </svg>
  )
}
