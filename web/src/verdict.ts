import type { Answer } from './components/Predict'
import type { Item } from './types'

export type Verdict = 'called' | 'close' | 'off'

// Which misconception (if any) the answer maps to: a band or option lookup, no model call.
export function misconceptionFor(item: Item, a: Answer): string | null {
  if (item.input_type === 'choice') return item.options?.find((o) => o.id === a.optionId)?.misconception_id ?? null
  if (item.input_type === 'slider' && a.value != null) {
    // Sorted so the lowest matching band wins, whatever order the JSON lists them in.
    const bands = [...(item.bands ?? [])].sort((x, y) => x.min - y.min)
    return bands.find((b) => a.value! >= b.min && a.value! <= b.max)?.misconception_id ?? null
  }
  return null
}

// tol: how far from the truth still counts as close (default: the rule below).
export function verdictFor(item: Item, a: Answer, truth: number | null, tol?: number): Verdict {
  if (misconceptionFor(item, a) === null) return 'called'
  if (item.input_type !== 'slider' || truth == null || a.value == null || !item.slider) return 'off'
  // Close = within 25% of the truth, or 5% of the slider's span, whichever is wider.
  const within = tol ?? Math.max(0.25 * Math.abs(truth), 0.05 * (item.slider.max - item.slider.min))
  return Math.abs(a.value - truth) <= within ? 'close' : 'off'
}

export const verdictLabel: Record<Verdict, string> = { called: 'Spot on', close: 'Close', off: 'Way off' }

// Confidence no longer changes the label (#194: no "how sure?" step); the parameter stays for callers.
export function verdictText(v: Verdict, _confidence?: Answer['confidence']): string {
  return verdictLabel[v]
}

export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
