import type { Computed } from './truth'
import type { Item } from './types'

// How a truth or a guess reads on screen: "66.7%", "$110.41", "9.01 years", "9.22 quintillion grains".

const SCALES: [number, string][] = [
  [1e18, 'quintillion'],
  [1e15, 'quadrillion'],
  [1e12, 'trillion'],
  [1e9, 'billion'],
  [1e6, 'million'],
]

// money: cents ($110.41); pct: one decimal (66.7%); else 2 decimals under 10, 1 above.
export function num(v: number, kind: 'money' | 'pct' | null = null): string {
  const a = Math.abs(v)
  for (const [s, name] of SCALES) if (a >= s) return `${Number((v / s).toPrecision(3))} ${name}`
  if (a >= 1000) return Math.round(v).toLocaleString('en-US')
  if (Number.isInteger(v)) return String(v)
  if (kind === 'money') return v.toFixed(2)
  if (a > 0 && a < 0.01) return String(Number(v.toPrecision(2)))
  return String(Number(v.toFixed(a < 10 && kind !== 'pct' ? 2 : 1)))
}

// Units: "$" (and "$ per year") go in front, "%" (and "% of ...") sticks to the number, anything else follows it.
export function withUnit(v: number, unit: string): string {
  const u = unit.trim()
  if (u.startsWith('$')) {
    const rest = u.slice(1).trim()
    return `${v < 0 ? '-' : ''}$${num(Math.abs(v), 'money')}${rest ? ` ${rest}` : ''}`
  }
  if (u.startsWith('%')) return `${num(v, 'pct')}${u}`
  return u ? `${num(v)} ${u}` : num(v)
}

// Which unit the answer is in. A curve without one says what its axis measures instead.
export function answerUnit(item: Item, truth: Computed): { unit: string; label: string | null } {
  if (item.slider) return { unit: item.slider.unit, label: null }
  const t = item.truth
  if (t.widget === 'estimate') return { unit: t.unit ?? '', label: null }
  if (t.widget === 'curve' && truth.kind === 'curve' && truth.point) {
    const label = truth.point.axis === 'x' ? t.x_label : t.y_label
    if (/\(\$\)/.test(label)) return { unit: '$', label: null }
    if (/^%|\(%\)/.test(label.trim())) return { unit: '%', label: null }
    return { unit: '', label }
  }
  return { unit: '', label: null }
}

// The distance between guess and truth, in words: "16.7 points", "$4,000", "3 years".
export function gapText(guess: number, truth: number, unit: string): string {
  const d = Math.abs(guess - truth)
  return unit.trim().startsWith('%') ? `${num(d, 'pct')} points` : withUnit(d, unit)
}
