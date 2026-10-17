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


/** Rough width of a hand-font label in px (Shantell Sans 600 at 14px runs about 0.6em a character). */
export const handWidth = (s: string, size = 14) => s.length * size * 0.62

export type Box = { x0: number; x1: number; y0: number; y1: number }

/** True when any segment of a curve (stroke padded by `pad`) passes through the box. */
export function curveHits(f: Frame, ys: number[], b: Box, pad = 3) {
  const B = { x0: b.x0 - pad, x1: b.x1 + pad, y0: b.y0 - pad, y1: b.y1 + pad }
  for (let x = X_MIN; x < X_MAX; x++) {
    const ax = sx(f, x), ay = sy(f, ys[x]), bx = sx(f, x + 1), by = sy(f, ys[x + 1])
    if (Math.max(ax, bx) < B.x0 || Math.min(ax, bx) > B.x1) continue
    // clip the segment to the box's x range, then compare its y span
    const t0 = bx === ax ? 0 : Math.max(0, Math.min(1, (B.x0 - ax) / (bx - ax)))
    const t1 = bx === ax ? 1 : Math.max(0, Math.min(1, (B.x1 - ax) / (bx - ax)))
    const y0 = ay + (by - ay) * t0, y1 = ay + (by - ay) * t1
    if (Math.max(y0, y1) >= B.y0 && Math.min(y0, y1) <= B.y1) return true
  }
  return false
}

/**
 * Where "your guess: n" goes next to the guess line: the first spot (top or bottom of the plot,
 * right or left of the line) that keeps clear of every curve on the chart, so the label never sits on a line.
 */
export function guessLabelSpot(f: Frame, guess: number, text: string, curves: number[][], avoid: Box[] = [], size = 14) {
  const w = handWidth(text, size)
  const gx = sx(f, guess)
  const sides: ('start' | 'end')[] = guess > 60 ? ['end', 'start'] : ['start', 'end']
  const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
  // top of the plot first, then walk down in small steps; last resort is the margin above the plot
  const ys: number[] = []
  for (let y = f.t + size + 2; y <= f.h - f.b - 6; y += 4) ys.push(y)
  // the strip above the plot is clear from edge to edge, so the label may run past the axes there
  ys.push(f.t - 10)
  for (const y of ys)
    for (const side of sides)
      for (const off of [6, 14]) {
        const x = side === 'start' ? gx + off : gx - off
        const box = { x0: side === 'start' ? x : x - w, x1: side === 'start' ? x + w : x, y0: y - size, y1: y + size * 0.3 }
        const above = y < f.t
        if (box.x0 < (above ? 4 : f.l + 2) || box.x1 > (above ? f.w - 4 : f.w - f.r)) continue
        if (!curves.some((c) => curveHits(f, c, box)) && !avoid.some((a) => overlaps(a, box))) return { x, y, textAnchor: side }
      }
  return { x: gx + (guess > 60 ? -6 : 6), y: f.t + size + 2, textAnchor: (guess > 60 ? 'end' : 'start') as 'start' | 'end' }
}
