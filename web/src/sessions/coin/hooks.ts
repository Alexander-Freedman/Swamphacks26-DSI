import { percent } from '../../components/session/percent'
import { useEffect, useRef, useState } from 'react'

// Charts draw in real pixels (viewBox = measured width), so 12px labels stay 12px on a phone.
export function useWidth<T extends HTMLElement>(fallback = 560) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setW(Math.max(260, Math.min(640, Math.round(el.clientWidth || fallback))))
    set()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fallback])
  return [ref, w] as const
}

export const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Capped (#161): a 99.97% chance reads ">99.9%", never "100.0%". */
export const pct = (x: number, digits = 0) => percent(x, digits)
export const fmt = (x: number) => x.toLocaleString('en-US')

// What the sample label says: strips you flipped one by one and/or a simulated batch, counted apart.
export function sampleLabel(sim: number, flipped: number): string {
  const runsOf = (n: number) => `${fmt(n)} ${n === 1 ? 'run' : 'runs'}`
  if (!sim) return `Flipped here: ${runsOf(flipped)} of 100 flips`
  if (!flipped) return `Simulated: ${runsOf(sim)} of 100 flips`
  return `Simulated: ${runsOf(sim)} + ${fmt(flipped)} you flipped, of 100 flips each`
}
