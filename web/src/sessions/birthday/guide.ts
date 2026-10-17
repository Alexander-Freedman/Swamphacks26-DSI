import { verdictOf } from './round'

export const TITLES: [string, string][] = [
  ['How many people?', "Guess first: how many people until it's a coin flip that two share a birthday? Your guess stays on screen so you can check it later."],
  ['Fill a room', 'Add people one by one and watch the lines: each line is a pair that could share a birthday. Notice how fast pairs pile up.'],
  ['The match', 'A match! Keep adding to watch matches pile up, or empty the room and try again: how many people does it usually take?'],
  ['Draw your curve', "Draw how you think the chance grows as the room fills, from 2 to 80 people. There's no wrong drawing; it's your model."],
  ['Your curve vs the real one', "Here's the real curve over yours. Drag the group size to see where your model and reality part."],
  ['What happened in your head', 'This is the mistake your guess points to, and the one idea that fixes it.'],
  ['Rematch', 'One more, with new numbers: does the idea stick?'],
]


export const CALLED_IT = "You called it. Here's why it works, so it sticks."

/** Title and guidance line for a step. A called-it card has no mistake to name, so it says why the guess works (#150). */
export function guideFor(step: number, guess: number): [string, string] {
  const [title, sub] = TITLES[step - 1]
  return [title, step === 6 && !verdictOf(guess).m ? CALLED_IT : sub]
}
