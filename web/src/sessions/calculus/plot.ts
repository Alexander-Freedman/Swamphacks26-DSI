import { useEffect, useRef, useState } from 'react'

// Charts draw in real pixels (viewBox = measured width), so 12px labels stay 12px on a phone.
export function useWidth<T extends HTMLElement>(fallback = 600, max = 720) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setW(Math.max(260, Math.min(max, Math.round(el.clientWidth || fallback))))
    set()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fallback, max])
  return [ref, w] as const
}

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** A plot area inside an SVG: pixel box (left, top, width, height) and the data ranges it shows. */
export type Box = { l: number; t: number; w: number; h: number; x0: number; x1: number; y0: number; y1: number }

export const sx = (b: Box, x: number) => b.l + ((x - b.x0) / (b.x1 - b.x0)) * b.w
export const sy = (b: Box, y: number) => b.t + (1 - (y - b.y0) / (b.y1 - b.y0)) * b.h
export const ix = (b: Box, px: number) => b.x0 + ((px - b.l) / b.w) * (b.x1 - b.x0)
export const iy = (b: Box, py: number) => b.y0 + (1 - (py - b.t) / b.h) * (b.y1 - b.y0)
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** SVG path through y = g(x) sampled `n` times on [a, b]. */
export function pathOf(b: Box, g: (x: number) => number, a = b.x0, c = b.x1, n = 120): string {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const x = a + ((c - a) * i) / n
    d += (i ? 'L' : 'M') + sx(b, x).toFixed(1) + ' ' + sy(b, g(x)).toFixed(1)
  }
  return d
}

/** Path through (xs[i], ys[i]). */
export const pathThrough = (b: Box, xs: number[], ys: number[]) =>
  xs.map((x, i) => (i ? 'L' : 'M') + sx(b, x).toFixed(1) + ' ' + sy(b, clamp(ys[i], b.y0, b.y1)).toFixed(1)).join('')

/** Pointer position inside the SVG, in pixels. */
export function local(e: { clientX: number; clientY: number; currentTarget: Element }) {
  const r = e.currentTarget.getBoundingClientRect()
  return { px: e.clientX - r.left, py: e.clientY - r.top }
}
