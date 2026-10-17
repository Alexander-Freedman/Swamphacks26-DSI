import type { Answer } from './components/Predict'
import type { Item } from './types'

export type Verdict = 'called' | 'close' | 'off'

// Which misconception (if any) the answer maps to: a band or option lookup, no model call.
export function misconceptionFor(item: Item, a: Answer): string | null {
  if (item.input_type === 'choice') return item.options?.find((o) => o.id === a.optionId)?.misconception_id ?? null
  if (item.input_type === 'slider' && a.value != null) {
    return item.bands?.find((b) => a.value! >= b.min && a.value! <= b.max)?.misconception_id ?? null
  }
  return null
}

export function verdictFor(item: Item, a: Answer, truth: number | null): Verdict {
  if (misconceptionFor(item, a) === null) return 'called'
  if (item.input_type !== 'slider' || truth == null || a.value == null || !item.slider) return 'off'
  // Close = within 25% of the truth, or 5% of the slider's span, whichever is wider.
  const tol = Math.max(0.25 * Math.abs(truth), 0.05 * (item.slider.max - item.slider.min))
  return Math.abs(a.value - truth) <= tol ? 'close' : 'off'
}

export function verdictText(v: Verdict, confidence: Answer['confidence']): string {
  if (v === 'off' && confidence === 'certain') return 'Sure and wrong'
  return { called: 'Called it', close: 'Close', off: 'Way off' }[v]
}

export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
