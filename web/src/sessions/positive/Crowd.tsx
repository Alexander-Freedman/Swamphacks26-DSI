import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

// 1,000 people as a 40 x 25 grid of dots, 10 units per person, 400 units wide.
// Drawn on a canvas: 1,000 SVG circles re-rendered on every slider tick were too slow on a phone.
const COLS = 40
const ROWS = 25
const CELL = 10
const R = 3.6
const W = COLS * CELL
const TWEEN = 900

const dotX = (i: number) => CELL / 2 + (i % COLS) * CELL
const dotY = (i: number) => CELL / 2 + Math.floor(i / COLS) * CELL

/** Dot kinds, same meaning as the legend swatches. '' = healthy, negative. */
export type Kind = '' | 'sk' | 'hp' | 'miss' | 'tp' | 'fp' | 'fade' | 'fp flash'

type Look = { fill: string; stroke?: string; lw?: number; dash?: number[] }

function looks(el: Element): Record<string, Look> {
  const v = (n: string, d: string) => getComputedStyle(el).getPropertyValue(n).trim() || d
  const ink = v('--ink', '#1b2340')
  const soft = v('--ink-soft', '#4a5170')
  const pencil = v('--pencil', '#85827a')
  const card = v('--card', '#fff')
  return {
    '': { fill: v('--pt-plain', '#ddd6c6') },
    fade: { fill: v('--pt-plain', '#ddd6c6') },
    sk: { fill: pencil },
    hp: { fill: card, stroke: pencil, lw: 1.6, dash: [2, 1.6] },
    miss: { fill: card, stroke: ink, lw: 1.4 },
    tp: { fill: ink, stroke: v('--called', '#1f8a4c'), lw: 1.6 },
    fp: { fill: v('--marker', '#ffd84d'), stroke: soft, lw: 1 },
  }
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

type Props = {
  kinds: Kind[]
  /** Where a dot flies to (viewBox units); dots not listed stay in the grid. */
  moves?: Map<number, [number, number]>
  /** Height in viewBox units (width is always 400). */
  height?: number
  label: string
  className?: string
  /** SVG labels drawn over the dots, same 400-wide coordinates. */
  children?: ReactNode
  onPointerDown?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove?: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerUp?: () => void
}

type Sprites = { scale: number; sprite: (k: string) => HTMLCanvasElement; plainGrid: HTMLCanvasElement }

function makeSprites(cv: HTMLCanvasElement, scale: number): Sprites {
  const L = looks(cv)
  const made = new Map<string, HTMLCanvasElement>()
  const sprite = (k: string) => {
    let sp = made.get(k)
    if (!sp) {
      const look = L[k] ?? L['']
      sp = document.createElement('canvas')
      sp.width = sp.height = Math.ceil((2 * R + 3) * scale)
      const c = sp.getContext('2d')!
      c.setTransform(scale, 0, 0, scale, sp.width / 2, sp.height / 2)
      c.beginPath()
      c.arc(0, 0, R, 0, Math.PI * 2)
      c.fillStyle = look.fill
      c.fill()
      if (look.stroke) {
        c.strokeStyle = look.stroke
        c.lineWidth = look.lw ?? 1
        c.setLineDash(look.dash ?? [])
        c.stroke()
      }
      made.set(k, sp)
    }
    return sp
  }
  const plainGrid = document.createElement('canvas')
  plainGrid.width = Math.round(W * scale)
  plainGrid.height = Math.round(ROWS * CELL * scale) + 1
  const g = plainGrid.getContext('2d')!
  const sp = sprite('')
  for (let i = 0; i < COLS * ROWS; i++) {
    const x = dotX(i)
    const y = dotY(i)
    g.drawImage(sp, Math.round(x * scale - sp.width / 2), Math.round(y * scale - sp.height / 2))
  }
  return { scale, sprite, plainGrid }
}

/** The crowd. Kinds change instantly; dots that move fly there over ~0.9 s (instantly with reduced motion). */
export function DotCanvas({ kinds, moves, height = ROWS * CELL, label, className = '', children, ...pointer }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  // where each dot is drawn right now, so a new target tweens from there
  const at = useRef<Float32Array | null>(null)
  const raf = useRef(0)
  const cache = useRef<Sprites | null>(null)
  const [cssW, setCssW] = useState(0)

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext?.('2d')
    if (!cv || !ctx) return // jsdom / no canvas: the aria-label still says it all
    const n = kinds.length
    if (!at.current || at.current.length !== n * 2) {
      at.current = new Float32Array(n * 2)
      for (let i = 0; i < n; i++) {
        at.current[2 * i] = dotX(i)
        at.current[2 * i + 1] = dotY(i)
      }
    }
    const from = at.current.slice()
    const targetOf = (i: number, axis: number) => {
      const m = moves?.get(i)
      return m ? m[axis] : axis ? dotY(i) : dotX(i)
    }
    const still = !moves?.size && !from.some((x, k) => x !== targetOf(k >> 1, k & 1))
    const animate = !reducedMotion() && !still
    const t0 = performance.now()

    const draw = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = cv.clientWidth || W
      const px = Math.round(w * dpr)
      const py = Math.round((w * height * dpr) / W)
      if (cv.width !== px || cv.height !== py) {
        cv.width = px
        cv.height = py
      }
      const s = px / W
      if (!cache.current || cache.current.scale !== s) cache.current = makeSprites(cv, s)
      const { sprite, plainGrid } = cache.current
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
      ctx.clearRect(0, 0, px, py)
      const p = animate ? Math.min(1, (now - t0) / TWEEN) : 1
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      const fpAlpha = !reducedMotion() && now - t0 < 1050 && Math.floor((now - t0) / 175) % 2 === 1 ? 0.2 : 1
      // Each kind is drawn once into a small sprite and stamped per dot. With nobody moving, the
      // 1,000 plain dots are one pre-drawn image and only the coloured dots are stamped on top:
      // cheap enough to redraw on every slider tick on a slow phone.
      if (still) ctx.drawImage(plainGrid, 0, 0)
      for (let i = 0; i < n; i++) {
        const k = kinds[i]
        if (still && k === '') continue
        const x = from[2 * i] + (targetOf(i, 0) - from[2 * i]) * e
        const y = from[2 * i + 1] + (targetOf(i, 1) - from[2 * i + 1]) * e
        at.current![2 * i] = x
        at.current![2 * i + 1] = y
        const sp = sprite(k === 'fp flash' ? 'fp' : k)
        ctx.globalAlpha = k === 'fade' ? 0.3 : k === 'fp flash' ? fpAlpha : 1
        ctx.drawImage(sp, Math.round(x * s - sp.width / 2), Math.round(y * s - sp.height / 2))
      }
      ctx.globalAlpha = 1
      const flashing = kinds.includes('fp flash') && now - t0 < 1100
      if ((animate && p < 1) || flashing) raf.current = requestAnimationFrame(draw)
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf.current)
  }, [kinds, moves, height, cssW])

  // redraw at the new size when the layout changes (rotation, desktop resize)
  useEffect(() => {
    const cv = ref.current
    if (!cv || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setCssW(cv.clientWidth))
    ro.observe(cv)
    return () => ro.disconnect()
  }, [])

  return (
    <div className={`pt-dots ${className}`} style={{ aspectRatio: `${W} / ${height}` }}>
      <canvas ref={ref} role="img" aria-label={label} {...pointer} onPointerCancel={pointer.onPointerUp} />
      {children && (
        <svg className="pt-dots-over" viewBox={`0 0 ${W} ${height}`} aria-hidden="true">
          {children}
        </svg>
      )}
    </div>
  )
}

/** Paintable grid: drag (mouse or touch) to paint with the current brush. */
export function PaintGrid({ kinds, onPaint, label }: { kinds: Kind[]; onPaint: (i: number) => void; label: string }) {
  const painting = useRef(false)
  const at = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const c = Math.floor(((e.clientX - r.left) / r.width) * COLS)
    const row = Math.floor(((e.clientY - r.top) / r.height) * ROWS)
    if (c >= 0 && c < COLS && row >= 0 && row < ROWS) onPaint(row * COLS + c)
  }
  return (
    <DotCanvas
      kinds={kinds}
      label={label}
      className="pt-paint"
      onPointerDown={(e) => {
        painting.current = true
        e.currentTarget.setPointerCapture?.(e.pointerId)
        at(e)
      }}
      onPointerMove={(e) => painting.current && at(e)}
      onPointerUp={() => (painting.current = false)}
    />
  )
}
