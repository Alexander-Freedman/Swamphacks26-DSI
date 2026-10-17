import type { Verdict } from '../../verdict'

// Words the session shell uses everywhere, so every session says the same thing (#149).

/** Same button copy in every session: "Move the slider first" → "Show me" (#194: no betting words, no confidence step). */
export function lockLabel(moved: boolean): string {
  return moved ? 'Show me' : 'Move the slider first'
}

/** The guidance line on the card: a right guess gets its own line (#150). */
export function cardGuide(called: boolean): string {
  return called
    ? "You were right. Here's the idea that makes it work, so you can do it again."
    : 'This is the mistake your guess points to, and the one idea that fixes it.'
}

/** Same stamps as birthday (#199). */
export const STAMP: Record<Verdict, string> = { called: 'Spot on', close: 'Close', off: 'Way off' }

export type RematchResult = 'right' | 'close' | 'wrong'

/** First guess + rematch, in one line (#135, #148). */
export function endLine(caught: string | null, rematch: RematchResult): string {
  const first = caught ? `Caught: “${caught}”.` : 'Your first guess was right.'
  const second = rematch === 'right' ? 'Rematch: right.' : rematch === 'close' ? 'Rematch: close.' : 'Rematch missed; it stays in your notebook to try again.'
  return `${first} ${second}`
}
