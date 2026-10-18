// Orgo as a Learn topic: the generic steps, with the orgo tools where they teach best (see Stages.tsx).
import type { CustomStages } from '../registry'
import { Anchor, Draw, Neighbor, Stress } from './Stages'

export const custom: CustomStages = {
  slug: 'sn2-reaction',
  homeCard: 'orgo',
  stages: { anchor: Anchor, stress: Stress, draw: Draw, neighbor: Neighbor },
}
