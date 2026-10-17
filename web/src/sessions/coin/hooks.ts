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

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`
export const fmt = (x: number) => x.toLocaleString('en-US')
