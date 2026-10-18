import type { LayerReport } from '../../components/session/helpSpot'
import type { OrgoStep } from './topics'

// Ask-panel layers for SN2, HO⁻ + CH₃Br (#243). Facts match analysis.ts (SN2_CASE) and chem.ts.

export const SN2_FACTS: string[] = [
  'Reaction: HO⁻ + CH₃Br → CH₃OH + Br⁻',
  'Nucleophile: HO⁻ (oxygen with a − charge and three lone pairs), a strong nucleophile',
  'Substrate carbon: the carbon bonded to Br; it is a methyl carbon (three H, no other carbons), so its back side is open',
  'Leaving group: Br, which leaves as Br⁻; a good leaving group (HBr is a strong acid)',
  'SN2 is one step with backside attack: the new C–O bond forms as the C–Br bond breaks',
  'Curved arrows start on a pair of electrons and end where that pair goes',
  'FC = valence − nonbonding electrons − bonds',
]

const LAYERS: Partial<Record<OrgoStep, Omit<LayerReport, 'facts'>>> = {
  parts: {
    title: 'Find the parts',
    onScreen: 'HO⁻ + CH₃Br drawn as molecules. The learner taps the nucleophile, the substrate carbon and the leaving group.',
    suggested: ['What is a nucleophile?', 'Which carbon is the substrate?', 'Why is Br the leaving group?'],
    hint: 'The nucleophile is the atom with lone pairs and a − charge (the O of HO⁻). The substrate carbon is the one holding Br. Br is what breaks off.',
  },
  size: {
    title: 'Size them up',
    onScreen: 'Three questions: how strong is HO⁻, what kind of carbon holds the Br, and is Br a good leaving group?',
    suggested: ['What makes a nucleophile strong?', 'How do I tell methyl from 1°, 2°, 3°?', 'What makes a good leaving group?'],
    hint: 'Count the carbons bonded to the carbon holding Br: none means methyl. A − charge makes a strong nucleophile. A big ion like Br⁻ is a good leaving group.',
  },
  decide: {
    title: 'Pick the mechanism',
    onScreen: 'The three answers point to one spot on a chart of SN1, SN2, E1 and E2. The learner picks the mechanism that belongs there.',
    suggested: ['Why not SN1 here?', 'What does the 2 in SN2 mean?', 'Why can’t this be E2?'],
    hint: 'A strong nucleophile and a methyl carbon: nothing blocks the back side, so it all happens in one step. A methyl carbocation is far too unstable for SN1.',
  },
  push: {
    title: 'Draw the arrows',
    onScreen: 'The learner draws curved arrows for HO⁻ + CH₃Br, then watches the reaction play out in one step.',
    suggested: ['Where does the first arrow start?', 'Why does the attack come from the back?', 'What happens to the Br?'],
    hint: 'Two arrows: one from a lone pair on O to the carbon, one from the C–Br bond to Br. Arrows always start on electrons.',
  },
}

/** The SN2 layer for this step, for the topics that work HO⁻ + CH₃Br. */
export function sn2Layer(topicId: string, step: OrgoStep, layerN: number): LayerReport | undefined {
  if (topicId !== 'sn2' && topicId !== 'full') return undefined
  const l = LAYERS[step]
  return l && { ...l, facts: SN2_FACTS, subject: 'Organic chemistry', topic: 'SN2: HO⁻ + CH₃Br', layerN }
}
