import { useCallback, useEffect, useRef, useState } from 'react'
import { type Pt, type View, pathLength, pointAt, resample, toScreen, toWorld } from './geometry'
import { handFont, ink } from './ink'
import { type EdgeParams, DEFAULT_EDGE, arcLength, fallTime, landingX, position, speed } from './offTheEdge'
import './stage.css'

export type Phase = 'draw' | 'race' | 'done'

const SLOWMO = 4 // the real fall takes ~0.4 s; nobody sees that
const ASPECT = 1.5
const MARBLE_R = 0.03

function viewFor(w: number, p: EdgeParams): View {
  const y0 = -p.h - 0.12
  const y1 = 0.3
  const span = (y1 - y0) * ASPECT
  return { x0: -0.45, x1: -0.45 + span, y0, y1, w, h: w / ASPECT }
}

// Ghost distance along the drawn path matches the real marble's distance travelled, so it's a fair race.
function ghostS(p: EdgeParams, t: number) {
  const T = fallTime(p)
  return t <= T ? arcLength(p, t) : arcLength(p, T) + speed(p, T) * (t - T)
}

type Props = {
  params?: EdgeParams
  phase: Phase
  onStroke: (points: Pt[] | null) => void
  onRaceEnd: () => void
  replayKey: number
}

export function OffTheEdge({ params = DEFAULT_EDGE, phase, onStroke, onRaceEnd, replayKey }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(720)
  const stroke = useRef<Pt[]>([])
  const drawing = useRef(false)
  const clock = useRef(0)
  const view = viewFor(width, params)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const paint = useCallback(
    (t: number | null) => {
      const c = canvas.current
      if (!c) return
      const dpr = window.devicePixelRatio || 1
      c.width = Math.round(view.w * dpr)
      c.height = Math.round(view.h * dpr)
      const g = c.getContext('2d')!
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawScene(g, view, params)

      const user = stroke.current
      if (t === null) {
        if (user.length > 1) line(g, view, user, ink.pencil, 3)
        marble(g, view, [0, MARBLE_R], ink.truth, 1)
        if (user.length < 2) hint(g, view)
        return
      }

      // Race: truth trail in ink, the drawn path faded, ghost marble riding it.
      const T = fallTime(params)
      const tt = Math.min(t, T)
      const n = Math.max(2, Math.ceil((tt / T) * 64))
      const trail = Array.from({ length: n }, (_, i) => position(params, (tt * i) / (n - 1)))
      if (user.length > 1) line(g, view, user, ink.ghost, 3, [6, 6])
      line(g, view, trail, ink.truth, 3)
      const gp = pointAt(user, ghostS(params, t))
      marble(g, view, [gp[0], gp[1] + MARBLE_R], ink.ghost, 1, true)
      const rp = position(params, t)
      marble(g, view, [rp[0], rp[1] + MARBLE_R], ink.truth, 1)

      if (t >= T) {
        label(g, view, [landingX(params), -params.h], 'real', ink.truth, 'below')
        const end = user[user.length - 1]
        if (end && Math.abs(end[0] - landingX(params)) > 0.04) label(g, view, [end[0], end[1]], 'you', ink.pencil, 'below')
      }
    },
    [view, params],
  )

  // Repaint on resize / phase change.
  useEffect(() => {
    if (phase === 'draw') paint(null)
    if (phase === 'done') paint(clock.current)
  }, [phase, paint])

  // Race animation.
  useEffect(() => {
    if (phase !== 'race') return
    const user = stroke.current
    const T = fallTime(params)
    const userLen = pathLength(user)
    let end = T
    while (ghostS(params, end) < userLen && end < 5 * T) end += 0.01
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / 1000 / SLOWMO
      clock.current = Math.min(t, end)
      paint(clock.current)
      if (t < end) raf = requestAnimationFrame(tick)
      else onRaceEnd()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, params, paint, onRaceEnd, replayKey])

  const at = (e: React.PointerEvent): Pt => {
    const r = canvas.current!.getBoundingClientRect()
    return toWorld(view, [e.clientX - r.left, e.clientY - r.top])
  }

  const down = (e: React.PointerEvent) => {
    if (phase !== 'draw') return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    // Every path starts at the marble, wherever the pen lands.
    stroke.current = [[0, 0], at(e)]
    onStroke(null)
    paint(null)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const p = at(e)
    // Stop at the floor.
    stroke.current.push([p[0], Math.max(p[1], -params.h)])
    paint(null)
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    const s = stroke.current
    const ok = pathLength(s) > 0.15
    if (ok) stroke.current = resample(s, 64)
    onStroke(ok ? stroke.current : null)
    paint(null)
  }

  return (
    <div ref={wrap} className="stage">
      <canvas
        ref={canvas}
        style={{ width: view.w, height: view.h, touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label="Drawing area: draw the path the marble takes after it leaves the desk"
      />
    </div>
  )
}

function drawScene(g: CanvasRenderingContext2D, v: View, p: EdgeParams) {
  g.fillStyle = ink.paper
  g.fillRect(0, 0, v.w, v.h)
  // 5 cm grid, bold every 50 cm.
  for (let k = Math.ceil(v.x0 / 0.05); k * 0.05 <= v.x1; k++) {
    const [sx] = toScreen(v, [k * 0.05, 0])
    g.strokeStyle = k % 10 === 0 ? ink.gridBold : ink.grid
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(sx, 0)
    g.lineTo(sx, v.h)
    g.stroke()
  }
  for (let k = Math.ceil(v.y0 / 0.05); k * 0.05 <= v.y1; k++) {
    const [, sy] = toScreen(v, [0, k * 0.05])
    g.strokeStyle = k % 10 === 0 ? ink.gridBold : ink.grid
    g.beginPath()
    g.moveTo(0, sy)
    g.lineTo(v.w, sy)
    g.stroke()
  }
  // Desk.
  const [dx0, dy0] = toScreen(v, [v.x0, 0])
  const [dx1, dy1] = toScreen(v, [0, -p.h])
  g.fillStyle = ink.desk
  g.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0)
  g.fillStyle = ink.deskTop
  g.fillRect(dx0, dy0, dx1 - dx0, 6)
  // Floor.
  const [, fy] = toScreen(v, [0, -p.h])
  g.strokeStyle = ink.floor
  g.lineWidth = 3
  g.beginPath()
  g.moveTo(0, fy)
  g.lineTo(v.w, fy)
  g.stroke()
  // Speed arrow on the desk.
  const [ax, ay] = toScreen(v, [-0.3, MARBLE_R])
  const [bx] = toScreen(v, [-0.08, 0])
  g.strokeStyle = ink.marker
  g.fillStyle = ink.marker
  g.lineWidth = 2.5
  g.beginPath()
  g.moveTo(ax, ay - 22)
  g.lineTo(bx, ay - 22)
  g.stroke()
  g.beginPath()
  g.moveTo(bx + 8, ay - 22)
  g.lineTo(bx - 2, ay - 28)
  g.lineTo(bx - 2, ay - 16)
  g.fill()
  g.font = handFont(22)
  g.fillText(`${p.v} m/s, steady`, ax, ay - 32)
}

function line(g: CanvasRenderingContext2D, v: View, pts: Pt[], color: string, w: number, dash: number[] = []) {
  g.save()
  g.strokeStyle = color
  g.lineWidth = w
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.setLineDash(dash)
  g.beginPath()
  pts.forEach((p, i) => {
    const [x, y] = toScreen(v, p)
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  })
  g.stroke()
  g.restore()
}

function marble(g: CanvasRenderingContext2D, v: View, c: Pt, color: string, alpha: number, outline = false) {
  const [x, y] = toScreen(v, c)
  const r = (MARBLE_R / (v.x1 - v.x0)) * v.w
  g.save()
  g.globalAlpha = alpha
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  if (outline) {
    g.setLineDash([4, 3])
    g.strokeStyle = ink.pencil
    g.lineWidth = 2
    g.fillStyle = color
    g.fill()
    g.stroke()
  } else {
    g.fillStyle = color
    g.fill()
  }
  g.restore()
}

function label(g: CanvasRenderingContext2D, v: View, at: Pt, text: string, color: string, where: 'below' | 'above') {
  const [x, y] = toScreen(v, at)
  g.save()
  g.font = handFont(24)
  g.fillStyle = color
  g.textAlign = 'center'
  g.fillText(text, x, where === 'below' ? y + 26 : y - 12)
  g.strokeStyle = color
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(x, y - 6)
  g.lineTo(x, y + 6)
  g.stroke()
  g.restore()
}

function hint(g: CanvasRenderingContext2D, v: View) {
  const [x, y] = toScreen(v, [0.12, -0.12])
  g.save()
  g.font = handFont(26)
  g.fillStyle = ink.marker
  g.fillText('draw where it goes, down to the floor', x, y)
  g.restore()
}

