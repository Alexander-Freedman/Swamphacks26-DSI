import { pMatch, sizeForChance } from '../sessions/birthday/math'
import { expectedLongest } from '../sessions/coin/math'
import { CARD, POP, ppv } from '../sessions/positive/math'

// "How it works" for the three sessions: what each one computes, the formula, and the numbers
// taken from the session's own math module (read-only), so the drawer can't drift from the screen.

export type Result = { label: string; value: string; work?: string }

export type SessionSpec = {
  question: string
  computes: string
  formula: string
  method: string
  results: () => Result[]
  extraSources?: { label: string; url: string }[]
}

const round2 = (x: number) => Number(x.toFixed(2))
const pct1 = (p: number) => `${(p * 100).toFixed(1)}%`
const pct2 = (p: number) => `${(p * 100).toFixed(2)}%`

export const sessionHowItWorks: Record<string, SessionSpec> = {
  birthday: {
    question: 'How many people does a room need before a shared birthday is more likely than not?',
    computes: 'The exact chance that at least two of n people share a birthday (365 equally likely days, Feb 29 ignored).',
    formula: 'P(match) = 1 − ∏ (365 − k) ÷ 365, k = 0 … n − 1',
    method: 'Exact product, no sampling. The room you watch fill up is a seeded simulation; the headline numbers are exact.',
    results: () => [
      { label: '23 people', value: pct1(pMatch(23)) },
      { label: 'smallest room past 50%', value: `${sizeForChance(0.5)} people` },
    ],
    extraSources: [{ label: 'Birthday problem', url: 'https://en.wikipedia.org/wiki/Birthday_problem' }],
  },
  'coin-streak': {
    question: "Flip a fair coin. What's the longest run of the same side in a row?",
    computes: 'The expected longest run of the same side in n fair coin flips.',
    formula: 'E[longest] = Σ P(longest > k), k = 0 … n − 1',
    method: 'Exact dynamic program over all flip sequences: a recurrence gives P(longest ≤ k) for every k, no sampling.',
    results: () => [
      { label: '20 flips', value: round2(expectedLongest(20)).toFixed(2) },
      { label: '100 flips', value: round2(expectedLongest(100)).toFixed(2) },
    ],
  },
  'positive-test': {
    question: '1% have it, the test catches 90%, and wrongly says yes for 9% of healthy people. You test positive: what are the odds you have it?',
    computes: 'The chance you are sick given one positive test.',
    formula: 'P(sick | positive) = true positives ÷ (true positives + false positives)',
    method: `Base-rate arithmetic over ${POP.toLocaleString('en-US')} people, closed form, no simulation.`,
    results: () => {
      const sick = POP * CARD.baseRate
      const tp = round2(sick * CARD.sensitivity)
      const fp = round2((POP - sick) * CARD.falseAlarm)
      return [
        { label: 'true positives', value: String(tp), work: `${sick} sick × ${CARD.sensitivity * 100}% caught` },
        { label: 'false positives', value: String(fp), work: `${POP - sick} healthy × ${CARD.falseAlarm * 100}% false alarms` },
        { label: 'chance you are sick', value: pct2(ppv(CARD)), work: `${tp} ÷ (${tp} + ${fp})` },
      ]
    },
    extraSources: [{ label: 'Base rate fallacy', url: 'https://en.wikipedia.org/wiki/Base_rate_fallacy' }],
  },
}
