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
  // Close = within 15% of the slider's span from the truth.
  const span = item.slider.max - item.slider.min
  return Math.abs(a.value - truth) <= 0.15 * span ? 'close' : 'off'
}

export const verdictText: Record<Verdict, string> = { called: 'Called it', close: 'Close', off: 'Way off' }
