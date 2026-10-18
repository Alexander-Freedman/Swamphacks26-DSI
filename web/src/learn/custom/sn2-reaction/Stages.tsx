// Orgo as a Learn topic: the generic steps, with the orgo tools where they teach best.
// Anchor = build ethanol (carbon makes four bonds). Stress = the same SN2 pattern in a new reaction,
// run side by side. Draw = push the SN2 arrows, then scrub the reaction. Neighbor = its look-alike, E2.
import { OrgoSession, type OrgoResult } from '../../../sessions/orgo/OrgoSession'
import type { OrgoTopic } from '../../../sessions/orgo/topics'
import type { LearnState, StageProps } from '../../types'
import '../derivative/derivative.css'

const piece = (id: string, title: string, steps: OrgoTopic['steps']): OrgoTopic => ({ id, title, blurb: '', steps, ready: true })

const BUILD = piece('build-ethanol', 'Build ethanol', ['build'])
const PATTERN = piece('sn2-pattern', 'Same pattern, new reaction', ['compare'])
const ARROWS = piece('sn2-arrows', 'SN2 arrows', ['push'])
const LOOK_ALIKE = piece('sn2-vs-e2', 'SN2 vs E2', ['contrast'])

type Recorder = (r: OrgoResult) => Partial<LearnState>

/** Runs one orgo tool; when it finishes, what it caught goes into the Learn state (step summaries, done card, notebook). */
function Tool({ stage, lead, topic, next, update, record }: { stage: string; lead: string; topic: OrgoTopic; record: Recorder } & Pick<StageProps, 'next' | 'update'>) {
  const done = (r: OrgoResult) => {
    update(record(r))
    next()
  }
  return (
    <section className="learn-step learn-tool" aria-label={stage}>
      <p className="learn-tool-lead">{lead}</p>
      <OrgoSession topic={topic} onDone={done} embedded />
    </section>
  )
}

const caught = (r: OrgoResult) => (r.mistakes.length ? `, caught: ${r.mistakes.join(', ')}` : '')

const recordBuild: Recorder = (r) => ({ anchorAnswer: `built ethanol, C₂H₆O${caught(r)}` })
const recordPattern: Recorder = (r) => ({
  stressHistory: [{ caseIndex: 0, fix: 'the same three parts in N≡C⁻ + CH₃I', verdict: r.mistakes.length ? 'breaks' : 'survives' }],
})
const recordArrows: Recorder = (r) => ({
  drawVerdicts: [
    {
      id: 'links',
      verdict: r.mistakes.length ? 'contradicted' : 'demonstrated',
      note: r.mistakes.length ? r.mistakes.join(', ') : 'lone pair on O → C, C–Br bond → Br',
    },
  ],
})
const recordLookAlike: Recorder = (r) => ({
  neighborAnswer: r.mistakes.length ? `mixed up SN2 and E2${caught(r)}` : 'SN2 on the open carbon, E2 on the crowded one',
})

export const Anchor = ({ next, update }: StageProps) => (
  <Tool stage="anchor" lead="One true fact: carbon makes exactly four bonds. Build ethanol and let the bond slots show it." topic={BUILD} next={next} update={update} record={recordBuild} />
)
export const Stress = ({ next, update }: StageProps) => (
  <Tool stage="stress" lead="Push the rule onto a new reaction: cyanide and CH₃I. Find the same three parts, then run both side by side." topic={PATTERN} next={next} update={update} record={recordPattern} />
)
export const Draw = ({ next, update }: StageProps) => (
  <Tool stage="draw" lead="Draw the mechanism: a curved arrow from each pair of electrons that moves to where it goes. Then press Show me to run it." topic={ARROWS} next={next} update={update} record={recordArrows} />
)
export const Neighbor = ({ next, update }: StageProps) => (
  <Tool stage="neighbor" lead="SN2’s look-alike is E2: the same HO⁻ can swap in or pull off an H. The carbon decides which." topic={LOOK_ALIKE} next={next} update={update} record={recordLookAlike} />
)
