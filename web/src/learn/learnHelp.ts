// What "Ask Onion" knows on a Learn step: the topic, the step, what's on screen, and safe facts.
// Never the core rule while the learner is still building it (the done card is the exception).
import type { LayerReport } from '../components/session/helpSpot'
import type { LearnState, Stage, Topic } from './types'
import why from './why.json'
import { STEP_NAME } from './WhyPane'

const ON_SCREEN: Record<Stage, (t: Topic, s: LearnState) => string> = {
  guess: (t) => `The learner writes a first guess about "${t.topic}" before being taught anything.`,
  anchor: (t) => `One true fact is shown: ${t.rubric.anchorDescription} The question: ${t.rubric.anchorPrompt}`,
  contrast: (t) => `Two look-alike cases side by side: ${t.rubric.contrastingCases.map((c) => c.oneLine).join(' / ')}. The learner writes a one-line rule for why they differ.`,
  stress: (t, s) => `The learner's rule "${s.fix}" is tested on three extreme cases: ${t.extremeCases.map((e) => e.scenario).join(' / ')}`,
  draw: () => 'A blank pad: the learner sketches the whole idea from memory and writes the rule in one line.',
  neighbor: (t) => `Tell "${t.topic}" apart from a look-alike: ${t.rubric.confusableNeighbors.map((n) => n.label).join(', ') || 'a related idea'}.`,
  transfer: () => 'The learner writes the same idea as an example from a totally different field.',
  done: (t) => `The session is over; the mistake card names the wrong idea the learner started with about "${t.topic}".`,
}

export function learnHelp(topic: Topic, state: LearnState): LayerReport {
  const stage = state.stage
  const facts = [
    `Why this step works (learning research): ${why[stage].why} Source: ${why[stage].source}.`,
    `The steps in order, each backed by learning research: guess first (pretesting), one true fact (concrete before abstract), compare two cases (contrasting cases), stress test (extreme cases), draw it (drawing to learn), tell it apart (discrimination), carry it over (designed-for transfer).`,
    `The pieces of this idea: ${topic.rubric.entities.join('; ')}`,
    `A true starting fact: ${topic.rubric.anchorDescription}`,
    ...(stage === 'done' ? [`The rule: ${topic.rubric.coreRule}`] : []),
  ]
  return {
    subject: topic.topic,
    topic: topic.topic,
    layerN: Object.keys(why).indexOf(stage) + 1,
    title: STEP_NAME[stage],
    onScreen: ON_SCREEN[stage](topic, state).slice(0, 590),
    facts,
    suggested: ['What is this step asking me to do?', 'Can you give me a hint without the answer?', "What's the research behind this step?"],
    hint: why[stage].doing,
  }
}
