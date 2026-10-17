import type { Verdict } from '../../verdict'

// Words the session shell uses everywhere, so every session says the same thing (#149).

export type Confidence = 'unsure' | 'pretty sure' | 'certain'
export const CONFS: Confidence[] = ['unsure', 'pretty sure', 'certain']

/** Same lock copy in every session: "Move the slider first" → "Pick how sure you are" → "Lock it in". */
export function lockLabel(moved: boolean, conf: Confidence | null): string {
  return !moved ? 'Move the slider first' : conf ? 'Lock it in' : 'Pick how sure you are'
}

/** The guidance line on the card: a called-it guess gets its own line (#150). */
export function cardGuide(called: boolean): string {
  return called
    ? "You called it. Here's the idea that makes it work, so you can do it again."
    : 'This is the mistake your guess points to, and the one idea that fixes it.'
}

export const STAMP: Record<Verdict, string> = { called: 'Called it', close: 'Close', off: 'Way off' }

export type RematchResult = 'right' | 'close' | 'wrong'

/** First guess + rematch, in one line (#135, #148). */
export function endLine(caught: string | null, rematch: RematchResult): string {
  const first = caught ? `Caught: “${caught}”.` : 'Your first guess called it.'
  const second = rematch === 'right' ? 'Rematch: right.' : rematch === 'close' ? 'Rematch: close.' : 'Rematch missed; it stays in your notebook to try again.'
  return `${first} ${second}`
}
