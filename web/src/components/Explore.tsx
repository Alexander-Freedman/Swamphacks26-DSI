import { useState } from 'react'
import type { Item } from '../types'
import './Explore.css'

type Props = { explore: NonNullable<Item['explore']>; value: number; onChange: (v: number) => void }

export const fmtParam = (v: number, max: number) => (max <= 1 ? `${+(v * 100).toFixed(1)}%` : v.toLocaleString())

// "Run it at the extremes": one slider on the key parameter, nudged toward both ends.
export function Explore({ explore: e, value, onChange }: Props) {
  const [hit, setHit] = useState({ min: false, max: false })
  const set = (v: number) => {
    setHit((h) => ({ min: h.min || v <= e.min, max: h.max || v >= e.max }))
    onChange(v)
  }
  const nudge = hit.min && hit.max
    ? 'Both edges done. Did it do what you expected out there?'
    : hit.min || hit.max
      ? `Now the other edge: ${fmtParam(hit.min ? e.max : e.min, e.max)}.`
      : `Push it to the edges: ${fmtParam(e.min, e.max)} and ${fmtParam(e.max, e.max)}.`
  return (
    <div className="explore">
      <p className="explore-head">
        <strong>Play with it.</strong> {e.label}: <span className="explore-value">{fmtParam(value, e.max)}</span>
      </p>
      <input type="range" min={e.min} max={e.max} step={e.step} value={value} aria-label={e.label} onChange={(ev) => set(Number(ev.target.value))} />
      <div className="range-ends"><span>{fmtParam(e.min, e.max)}</span><span>{fmtParam(e.max, e.max)}</span></div>
      <p className="explore-nudge hand">{nudge}</p>
    </div>
  )
}
