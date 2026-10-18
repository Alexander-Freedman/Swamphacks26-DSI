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

const short = (t: string, n = 140) => {
  const s = t.split(/[:;.(]/)[0].trim()
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

/** When the tutor can't answer: a real, topic-specific nudge (never the answer, never a restatement). */
const HINT: Record<Stage, (t: Topic) => string> = {
  guess: (t) => `There's no wrong guess here. Name one thing you think makes ${t.topic} happen, in your own words.`,
  anchor: (t) => `Reread the fact: "${short(t.rubric.anchorDescription, 220)}." What does it make happen, and what would that predict?`,
  contrast: (t) => {
    const [a, b] = t.rubric.contrastingCases
    return a && b ? `Look for the one thing that differs: "${a.oneLine}" versus "${b.oneLine}". Why would that change the outcome?` : 'Look for the one thing that differs between the two cases.'
  },
  stress: () => "Take the card's numbers and apply your rule word for word. Does it still give a sensible answer at that extreme?",
  draw: (t) => `Start with the pieces: ${t.rubric.entities.slice(0, 3).map((e) => short(e, 40)).join(', ')}. Then draw what pushes on what.`,
  neighbor: (t) => {
    const n = t.rubric.confusableNeighbors[0]
    return n ? `Ask what each one is about: ${t.topic} versus ${n.label}. What changes in one but not the other?` : 'Ask what each idea is about, and what changes in one but not the other.'
  },
  transfer: () => 'Think of a totally different place where the same cause-and-effect pattern shows up: money, sports, cooking, games.',
  done: () => 'Read the fix on the card, then say it back in your own words without looking.',
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
    hint: HINT[stage](topic).slice(0, 590),
  }
}
