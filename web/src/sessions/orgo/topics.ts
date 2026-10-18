// What you can practice in orgo, grouped so you pick a topic on purpose instead of a fixed path.
// A topic is a list of steps from the session (build; parts, size, decide, push for a mechanism; compare). Topics that aren't built yet
// stay on the menu as "coming next" so the map of the subject is visible.

import type { MechId } from './mechs'

export type OrgoStep = 'build' | 'parts' | 'size' | 'decide' | 'push' | 'compare' | 'contrast' | 'layers'

export type OrgoTopic = {
  id: string
  title: string
  blurb: string
  steps: OrgoStep[]
  /** false = on the menu, not playable yet */
  ready: boolean
  /** the push step draws this mechanism instead of SN2 */
  mech?: MechId
}

export type OrgoSection = { id: string; title: string; blurb: string; topics: OrgoTopic[] }

export const SECTIONS: OrgoSection[] = [
  {
    id: 'molecules',
    title: 'Molecules',
    blurb: 'Snap atoms together until every bond slot is full.',
    topics: [{ id: 'build-ethanol', title: 'Build ethanol', blurb: 'C₂H₆O, one bond at a time.', steps: ['build'], ready: true }],
  },
  {
    id: 'mechanisms',
    title: 'Mechanisms',
    blurb: 'Work it out step by step: find the parts, size them up, pick the mechanism, then draw the arrows.',
    topics: [
      { id: 'sn2-layers', title: 'Peel SN2', blurb: 'One picture, five layers: atoms, electron pairs, arrows, the energy hill, crowding.', steps: ['layers'], ready: true },
      { id: 'sn2', title: 'SN2 step by step', blurb: 'One step: the nucleophile hits the back side as the leaving group leaves.', steps: ['parts', 'size', 'decide', 'push'], ready: true },
      { id: 'sn1', title: 'SN1', blurb: 'Two steps: the leaving group goes first, then the carbocation is attacked.', steps: ['parts', 'size', 'decide', 'push'], ready: true, mech: 'sn1' },
      { id: 'e2', title: 'E2', blurb: 'One step: a base pulls a proton as the double bond forms.', steps: ['parts', 'size', 'decide', 'push'], ready: true, mech: 'e2' },
      { id: 'e1', title: 'E1', blurb: 'Two steps: carbocation first, then a proton leaves.', steps: ['parts', 'size', 'decide', 'push'], ready: true, mech: 'e1' },
      { id: 'sn2-vs-e2', title: 'SN2 vs E2', blurb: 'Same HO⁻, two carbons. Predict the path for each, then watch both.', steps: ['contrast'], ready: true },
    ],
  },
  {
    id: 'path',
    title: 'Guided path',
    blurb: 'All of it in order, from building a molecule to drawing a mechanism.',
    topics: [{ id: 'full', title: 'Start to finish', blurb: 'Build ethanol, work out HO⁻ + CH₃Br, draw its arrows, then spot the same pattern in a new reaction.', steps: ['build', 'parts', 'size', 'decide', 'push', 'compare'], ready: true }],
  },
]

export const TOPICS: OrgoTopic[] = SECTIONS.flatMap((s) => s.topics)
export const topicById = (id: string | null) => TOPICS.find((t) => t.id === id && t.ready) ?? null
