import type { CurveTruth, Item, Round } from '../types'
import { num } from '../format'

// Which engine v4 curve items play on the picture, and how (#184).

export type PlayMode = 'tangent' | 'riemann' | 'limit' | 'value-y' | 'value-x'

/** An item from engine v4 (or any computed curve item). Old reviewed rounds don't have these. */
export function isV4(round: Round | undefined, item: Item): boolean {
  return round?.spec_version === 4 || item.computed === true
}

/** How a v4 curve item is guessed on the picture; null = not a curve we can play this way. */
export function playMode(item: Item): PlayMode | null {
  const t = item.truth
  if (t.widget !== 'curve' || t.preset || !t.expr || item.input_type !== 'slider' || !item.slider) return null
  if (t.show === 'tangent' && t.ask_x != null) return 'tangent'
  if (t.show === 'riemann' && t.area_from != null && t.area_to != null && t.area_to > t.area_from) return 'riemann'
  if (t.show === 'limit' && t.ask_x != null) return 'limit'
  if (!t.show && t.ask_x != null) return 'value-y'
  if (!t.show && t.ask_y != null) return 'value-x'
  return null
}

const at = (label: string, x: number) => `${label || 'x'} = ${num(x)}`

/** The one instruction line under the picture before you've touched it. */
export function instruction(mode: PlayMode, t: CurveTruth): string {
  switch (mode) {
    case 'tangent':
      return `Drag on the graph to tilt your tangent at ${at(t.x_label, t.ask_x!)}.`
    case 'riemann':
      return 'Drag up or down: your box is your guess for the shaded area.'
    case 'limit':
      return `Drag the dot to where the curve is heading at ${at(t.x_label, t.ask_x!)}.`
    case 'value-y':
      return `Drag the dot to where you think the curve is at ${at(t.x_label, t.ask_x!)}.`
    case 'value-x':
      return 'Drag the dot along the line to where the curve gets there.'
  }
}

