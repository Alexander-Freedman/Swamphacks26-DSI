import type { LayerReport } from '../../components/session/helpSpot'
import { f, fPrime, LABELS, type SlopeRead } from './math'
import type { CalcStep } from './topics'

// Ask-panel layers for "The slope of a curve" (#243). Numbers come from math.ts, never typed in.

const n = (x: number) => String(Math.round(x * 100) / 100).replace('-', '−')

/** The true facts about this curve the tutor may use. */
export const SLOPE_FACTS: string[] = [
  "f(x) = (x³ − 6x² + 9x)/2 + 1 on 0 ≤ x ≤ 4, so f'(x) = 1.5(x − 1)(x − 3)",
  `f'(0) = ${n(fPrime(0))}`,
  `f'(1) = ${n(fPrime(1))} (the top of the hill, f(1) = ${n(f(1))})`,
  `f'(2) = ${n(fPrime(2))} (steepest downhill)`,
  `f'(3) = ${n(fPrime(3))} (the bottom of the dip, f(3) = ${n(f(3))})`,
  `f'(4) = ${n(fPrime(4))}`,
  'Slope above 0 means uphill, below 0 means downhill, 0 means flat',
]

const LAYERS: Partial<Record<CalcStep, Omit<LayerReport, 'facts'>>> = {
  draw: {
    title: 'Draw the slope',
    onScreen: 'A curve that climbs, dips, then climbs again. In the bottom box the learner draws how steep it is at each x: above 0 is uphill, below 0 downhill.',
    suggested: ['What does "slope" mean here?', 'Where should my line cross 0?', 'Can the slope be negative?'],
    hint: 'Walk along the curve from left to right. Where it goes uphill, draw above 0; downhill, below 0; at the top of the hill and the bottom of the dip it is flat, so your line crosses 0 there.',
  },
  tangent: {
    title: 'Drag the tangent',
    onScreen: 'A dot slides along the curve with a straight tangent line through it, and the real slope draws itself over the learner’s pencil sketch.',
    suggested: ['What is the tangent line?', 'Why is the slope 0 at the top?', 'Why is my sketch off?'],
    hint: 'Drag the dot to the top of the hill (x = 1) and the bottom of the dip (x = 3): the tangent goes flat, so the slope is 0. Between them it tilts down.',
  },
  card: {
    title: 'What your pencil says',
    onScreen: 'A card names the idea the learner’s slope sketch points to, with the one-line fix.',
    suggested: ['Can you explain the mistake?', 'How do I spot it next time?', 'Why does this matter?'],
    hint: 'Slope is how steep the curve is, not how high it is: a high point can be flat (slope 0) and a low point can be steep.',
  },
}

export function slopeLayer(step: CalcStep, layerN: number, slope: SlopeRead | null): LayerReport | undefined {
  const l = LAYERS[step]
  if (!l) return undefined
  const lastAction = step === 'draw' ? undefined : slope ? (slope.mistake ? `Their sketch showed: ${LABELS[slope.mistake]}` : 'Their sketch had the right shape') : undefined
  return { ...l, facts: SLOPE_FACTS, subject: 'Calculus', topic: 'The slope of a curve', layerN, lastAction }
}
