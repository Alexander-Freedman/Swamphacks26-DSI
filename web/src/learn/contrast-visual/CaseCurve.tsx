import { useMemo } from 'react'
import { Curve } from '../../components/Curve'
import type { Topic } from '../types'
import { caseCurve } from './caseCurveMath'
import './case-curve.css'

/** A tiny curve for contrast card `index`, or nothing when that case has no curve of its own. */
export function CaseCurve({ topic, index }: { topic: Topic; index: number }) {
  const pic = useMemo(() => caseCurve(topic, index), [topic, index])
  if (!pic) return null
  return (
    <figure className="lcv-pic">
      <Curve t={pic.spec.curve} f={pic.f} />
      {pic.caption && <figcaption>{pic.caption}</figcaption>}
    </figure>
  )
}
