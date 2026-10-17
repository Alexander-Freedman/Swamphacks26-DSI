import type { Pt } from './chem'

// Geometry helpers for the orgo canvases.

export const R = 15

/** Pointer position in the SVG's viewBox units (the SVG keeps its aspect ratio, so one scale). */
export function svgPoint(svg: SVGSVGElement | null, clientX: number, clientY: number, vw: number): Pt & { inside: boolean } {
  const r = svg?.getBoundingClientRect()
  if (!r || !r.width) return { x: 0, y: 0, inside: false }
  const k = vw / r.width
  const x = (clientX - r.left) * k
  const y = (clientY - r.top) * k
  return { x, y, inside: clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom }
}

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export const chargeText = (c: number) => (c === 0 ? '' : (Math.abs(c) > 1 ? Math.abs(c) : '') + (c > 0 ? '+' : '−'))

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
