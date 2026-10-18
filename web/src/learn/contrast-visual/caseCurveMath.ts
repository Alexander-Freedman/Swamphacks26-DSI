// Contrast cards as pictures: on a curve topic, a contrasting case that carries its own `curve`
// (a different expression and/or knob values) gets a tiny version of the topic's curve drawn its way.
// Evaluated in code (mathjs via curveFn); the model never draws it. A case without its own curve gets
// no picture, so two cards never show the same line and imply a difference that isn't there.
import { curveFn } from '../../truth'
import { curveSpec, type CurveSpec } from '../learn-guess-anchor'
import type { Topic } from '../types'

/** Optional per-case override, next to label/detail/oneLine in rubric.contrastingCases[i]. */
export type CaseCurveData = { expr?: string; knobs?: Record<string, number>; label?: string }

export type CaseCurve = { spec: CurveSpec; f: (x: number) => number; caption: string }

export function caseCurve(topic: Topic, i: number): CaseCurve | null {
  const spec = curveSpec(topic)
  const c = topic.rubric.contrastingCases[i] as { curve?: CaseCurveData } | undefined
  const own = c?.curve
  if (!spec || !own || (typeof own.expr !== 'string' && !own.knobs)) return null
  const knobs: Record<string, number> = {}
  for (const v of spec.variables ?? []) knobs[v.name] = v.value
  if (spec.curve.knob) knobs[spec.curve.knob.param] = spec.curve.knob.default
  for (const [k, v] of Object.entries(own.knobs ?? {})) if (typeof v === 'number') knobs[k] = v
  try {
    const f = curveFn({ ...spec.curve, expr: own.expr ?? spec.curve.expr }, knobs)
    if (!Number.isFinite(f(spec.curve.x_min)) || !Number.isFinite(f(spec.curve.x_max))) return null
    return { spec, f, caption: own.label ?? '' }
  } catch {
    return null
  }
}
