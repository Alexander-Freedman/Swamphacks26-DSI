// Calculus as a Learn topic: the generic steps, with the calculus tools where they teach best.
// Anchor = sketch the slope, then drag the tangent. Neighbor = its look-alike, area.
// Transfer = slope and area undo each other (the fundamental theorem).
import { CalculusSession } from '../../../sessions/calculus/CalculusSession'
import type { CalcTopic } from '../../../sessions/calculus/topics'
import type { StageProps } from '../../types'
import type { CustomStages } from '../registry'
import './derivative.css'

const piece = (id: string, title: string, steps: CalcTopic['steps']): CalcTopic => ({ id, title, blurb: '', steps, ready: true })

const SLOPE = piece('slope', 'The slope of a curve', ['draw', 'tangent'])
const AREA = piece('area', 'Area under a curve', ['area'])
const FTC = piece('ftc', 'Slope and area undo each other', ['compare'])

function Tool({ stage, lead, topic, next }: { stage: string; lead: string; topic: CalcTopic; next: () => void }) {
  return (
    <section className="learn-step learn-tool" aria-label={stage}>
      <p className="learn-tool-lead">{lead}</p>
      <CalculusSession topic={topic} onDone={next} embedded />
    </section>
  )
}

const Anchor = ({ next }: StageProps) => (
  <Tool stage="anchor" lead="One true fact: the slope at a point is how steep the curve is right there. Sketch it first, then check with the tangent." topic={SLOPE} next={next} />
)
const Neighbor = ({ next }: StageProps) => (
  <Tool stage="neighbor" lead="Slope's look-alike cousin is area: not how steep, but how much is underneath." topic={AREA} next={next} />
)
const Transfer = ({ next }: StageProps) => (
  <Tool stage="transfer" lead="Carry it somewhere new: position and velocity. Slope and area turn out to undo each other." topic={FTC} next={next} />
)

export const custom: CustomStages = {
  slug: 'derivative',
  homeCard: 'calculus',
  stages: { anchor: Anchor, neighbor: Neighbor, transfer: Transfer },
}
