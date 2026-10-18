// Orgo as a Learn topic: the generic steps, with the orgo tools where they teach best.
// Anchor = build ethanol (carbon makes four bonds). Stress = the same SN2 pattern in a new reaction,
// run side by side. Draw = push the SN2 arrows, then scrub the reaction. Neighbor = its look-alike, E2.
import { OrgoSession } from '../../../sessions/orgo/OrgoSession'
import type { OrgoTopic } from '../../../sessions/orgo/topics'
import type { StageProps } from '../../types'
import '../derivative/derivative.css'

const piece = (id: string, title: string, steps: OrgoTopic['steps']): OrgoTopic => ({ id, title, blurb: '', steps, ready: true })

const BUILD = piece('build-ethanol', 'Build ethanol', ['build'])
const PATTERN = piece('sn2-pattern', 'Same pattern, new reaction', ['compare'])
const ARROWS = piece('sn2-arrows', 'SN2 arrows', ['push'])
const LOOK_ALIKE = piece('sn2-vs-e2', 'SN2 vs E2', ['contrast'])

function Tool({ stage, lead, topic, next }: { stage: string; lead: string; topic: OrgoTopic; next: () => void }) {
  return (
    <section className="learn-step learn-tool" aria-label={stage}>
      <p className="learn-tool-lead">{lead}</p>
      <OrgoSession topic={topic} onDone={next} embedded />
    </section>
  )
}

export const Anchor = ({ next }: StageProps) => (
  <Tool stage="anchor" lead="One true fact: carbon makes exactly four bonds. Build ethanol and let the bond slots show it." topic={BUILD} next={next} />
)
export const Stress = ({ next }: StageProps) => (
  <Tool stage="stress" lead="Push the rule onto a new reaction: cyanide and CH₃I. Find the same three parts, then run both side by side." topic={PATTERN} next={next} />
)
export const Draw = ({ next }: StageProps) => (
  <Tool stage="draw" lead="Draw the mechanism: a curved arrow from each pair of electrons that moves to where it goes. Then run it." topic={ARROWS} next={next} />
)
export const Neighbor = ({ next }: StageProps) => (
  <Tool stage="neighbor" lead="SN2’s look-alike is E2: the same HO⁻ can swap in or pull off an H. The carbon decides which." topic={LOOK_ALIKE} next={next} />
)
