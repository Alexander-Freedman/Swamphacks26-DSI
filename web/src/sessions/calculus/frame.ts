import { useEffect, useState } from 'react'
import type { Fn, Pt } from './math'

// Plot helpers for the calculus screens: pixel-sized frames (so text is real px on a phone)
// and paths from functions or points.

export type Box = { w: number; h: number; l: number; r: number; t: number; b: number; x0: number; x1: number; y0: number; y1: number }

export const box = (w: number, h: number, x: [number, number], y: [number, number], pad: Partial<Pick<Box, 'l' | 'r' | 't' | 'b'>> = {}): Box => ({
  w,
  h,
  l: pad.l ?? 34,
  r: pad.r ?? 12,
  t: pad.t ?? 10,
  b: pad.b ?? 24,
  x0: x[0],
  x1: x[1],
  y0: y[0],
  y1: y[1],
})

export const sx = (f: Box, x: number) => f.l + ((x - f.x0) / (f.x1 - f.x0)) * (f.w - f.l - f.r)
export const sy = (f: Box, y: number) => f.t + ((f.y1 - y) / (f.y1 - f.y0)) * (f.h - f.t - f.b)
export const ix = (f: Box, px: number) => f.x0 + ((px - f.l) / (f.w - f.l - f.r)) * (f.x1 - f.x0)
export const iy = (f: Box, py: number) => f.y1 - ((py - f.t) / (f.h - f.t - f.b)) * (f.y1 - f.y0)

export const fnPath = (f: Box, fn: Fn, a = f.x0, b = f.x1, n = 160) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = a + ((b - a) * i) / n
    return `${i ? 'L' : 'M'}${sx(f, x).toFixed(1)} ${sy(f, fn(x)).toFixed(1)}`
  }).join('')

export const ptsPath = (f: Box, pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(f, p.x).toFixed(1)} ${sy(f, p.y).toFixed(1)}`).join('')

/** Width of a container, in px, kept current on resize. */
export function useWidth<T extends HTMLElement>(fallback = 600) {
  const [el, setEl] = useState<T | null>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    if (!el) return
    const set = () => setW(Math.max(260, Math.round(el.getBoundingClientRect().width) || fallback))
    set()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el, fallback])
  return [setEl, w] as const
}

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
