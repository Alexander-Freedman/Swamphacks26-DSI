// Stress cards as pictures: when the topic has a curve, card i shows that curve with its knob pushed to
// extremes[i]. The curve is evaluated in code (mathjs via curveFn); the model never draws it.
import { curveFn } from '../../truth'
import { curveSpec, type CurveSpec } from '../learn-guess-anchor'
import type { Topic } from '../types'

export type Extreme = { param: string; value: number; watch: string }

export type ExtremeCurve = {
  spec: CurveSpec
  f: (x: number) => number
  /** what the picture is drawn at, e.g. "yearly rate (%) = 1" */
  at: string
  watch: string
}

/** The extremes list from a curve topic's visual spec (empty when there isn't one). */
export function extremesOf(topic: Topic): Extreme[] {
  const s = topic.visual?.spec as { extremes?: unknown } | undefined
  const list = Array.isArray(s?.extremes) ? s.extremes : []
  return list.filter(
    (e): e is Extreme => !!e && typeof e === 'object' && typeof (e as Extreme).param === 'string' && typeof (e as Extreme).value === 'number',
  )
}

/** The picture for stress card i, or null: no curve visual, no extreme for this card, or an expression that won't evaluate. */
export function extremeCurve(topic: Topic, i: number): ExtremeCurve | null {
  const spec = curveSpec(topic)
  const e = extremesOf(topic)[i]
  if (!spec || !e) return null
  const knobs: Record<string, number> = {}
  for (const v of spec.variables ?? []) knobs[v.name] = v.value
  // the knob sits at its default unless this extreme is the knob (an extreme can move a variable instead)
  if (spec.curve.knob) knobs[spec.curve.knob.param] = spec.curve.knob.default
  knobs[e.param] = e.value
  try {
    const f = curveFn(spec.curve, knobs)
    if (!Number.isFinite(f(spec.curve.x_max))) return null
    // the knob's label, or the variable's meaning ("how far north the city is"), else its name
    const variable = (spec.variables as { name: string; meaning?: string }[] | undefined)?.find((v) => v.name === e.param)
    const label = spec.curve.knob?.param === e.param ? spec.curve.knob.label : (variable?.meaning ?? e.param)
    return { spec, f, at: `${label} = ${e.value}`, watch: e.watch ?? '' }
  } catch {
    return null
  }
}
