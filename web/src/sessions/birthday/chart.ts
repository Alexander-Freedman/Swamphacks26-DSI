import { useEffect, useState } from 'react'
import { pMatch, X_MAX, X_MIN } from './math'

/** Width of an element in CSS px, so charts draw 1 unit = 1 px and text stays readable on a phone. */
export function useWidth<T extends HTMLElement>(fallback = 600) {
  const [el, setEl] = useState<T | null>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    if (!el) return
    const set = () => setW(Math.max(260, Math.round(el.getBoundingClientRect().width)))
    set()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return [setEl, w] as const
}

export type Frame = { w: number; h: number; l: number; r: number; t: number; b: number }
export const frameFor = (w: number): Frame => ({ w, h: Math.round(Math.min(380, Math.max(250, w * 0.62))), l: 46, r: 16, t: 28, b: 46 })
export const sx = (f: Frame, x: number) => f.l + ((x - X_MIN) / (X_MAX - X_MIN)) * (f.w - f.l - f.r)
export const sy = (f: Frame, y: number) => f.t + (1 - y) * (f.h - f.t - f.b)
export const ix = (f: Frame, px: number) => X_MIN + ((px - f.l) / (f.w - f.l - f.r)) * (X_MAX - X_MIN)
export const iy = (f: Frame, py: number) => 1 - (py - f.t) / (f.h - f.t - f.b)

export function pathOf(f: Frame, ys: number[]) {
  let d = ''
  for (let x = X_MIN; x <= X_MAX; x++) d += (x === X_MIN ? 'M' : 'L') + sx(f, x).toFixed(1) + ' ' + sy(f, ys[x]).toFixed(1)
  return d
}

export const TRUTH: number[] = []
for (let x = X_MIN; x <= X_MAX; x++) TRUTH[x] = pMatch(x)

