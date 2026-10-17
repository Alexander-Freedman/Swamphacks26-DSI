import { memo, useRef, type CSSProperties, type PointerEvent } from 'react'

// 1,000 people as a 40 x 25 grid of dots in a 400 x 250 viewBox (10 units per person).
const COLS = 40
const ROWS = 25
const CELL = 10

function dotXY(i: number): [number, number] {
  return [CELL / 2 + (i % COLS) * CELL, CELL / 2 + Math.floor(i / COLS) * CELL]
}

type DotsProps = {
  classes: string[]
  moves?: Map<number, [number, number]>
}

/** The dots only: re-renders when the class list or the pile positions change. */
export const Dots = memo(function Dots({ classes, moves }: DotsProps) {
  return (
    <g>
      {classes.map((c, i) => {
        const [x, y] = dotXY(i)
        const to = moves?.get(i)
        const style: CSSProperties | undefined = to ? { transform: `translate(${to[0] - x}px, ${to[1] - y}px)` } : undefined
        return <circle key={i} cx={x} cy={y} r={3.6} className={`pt-dot ${c}`} style={style} />
      })}
    </g>
  )
})

/** Paintable grid: drag (mouse or touch) to paint with the current brush. */
export function PaintGrid({ classes, onPaint, label }: { classes: string[]; onPaint: (i: number) => void; label: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const painting = useRef(false)
  const at = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect()
    const c = Math.floor(((e.clientX - r.left) / r.width) * COLS)
    const row = Math.floor(((e.clientY - r.top) / r.height) * ROWS)
    if (c >= 0 && c < COLS && row >= 0 && row < ROWS) onPaint(row * COLS + c)
  }
  return (
    <svg
      ref={svg}
      className="pt-grid pt-paint"
      viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
      role="img"
      aria-label={label}
      onPointerDown={(e) => {
        painting.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        at(e)
      }}
      onPointerMove={(e) => painting.current && at(e)}
      onPointerUp={() => (painting.current = false)}
      onPointerCancel={() => (painting.current = false)}
    >
      <Dots classes={classes} />
    </svg>
  )
}
