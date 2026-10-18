// Shared bits for the guess + anchor screens (kept out of the .tsx files so fast refresh stays happy).
import type { CurveTruth } from '../types'
import type { Offline, Topic } from './types'
import { offlineText } from './useGraded'

export const RATE_LIMITED = 'Lots of questions right now; try again in a minute, or keep going with the offline check.'

/** Offline copy for these screens; a 429 (rate limit) gets a friendly line instead of an error. */
export function offlineLine(o: Offline, saved: string) {
  return /\b429\b|rate|too many/i.test(o.detail ?? '') ? RATE_LIMITED : `${offlineText(o)}. ${saved}`
}

export type Knob = { param: string; label: string; min: number; max: number; step: number; default: number }
export type CurveSpec = {
  variables?: { name: string; unit?: string; value: number }[]
  curve: CurveTruth & { knob?: Knob | null }
  prediction?: { prompt?: string; slider?: { min: number; max: number; step: number; unit?: string } | null } | null
}

/** The v4 curve spec for curve topics, or null (then the screen is a one-line text answer). */
export function curveSpec(topic: Topic): CurveSpec | null {
  const v = topic.visual
  if (v?.widget !== 'curve' || !v.spec || typeof v.spec !== 'object') return null
  const s = v.spec as Partial<CurveSpec>
  const c = s.curve
  if (!c || typeof c.expr !== 'string' || typeof c.x_min !== 'number' || typeof c.x_max !== 'number') return null
  if (typeof c.ask_x !== 'number') return null
  return s as CurveSpec
}
