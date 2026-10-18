import type { LearnState } from './types'

export const initialState = (): LearnState => ({
  stage: 'guess',
  guess: '',
  confidence: 50,
  guessResult: null,
  misconceptionId: null,
  anchorAnswer: '',
  anchorResult: null,
  fix: '',
  stressHistory: [],
  stressCritiques: [],
  stressChoices: {},
  whyResult: null,
  revealResult: null,
  drawRule: '',
  drawNotes: '',
  drawVerdicts: [],
  neighborAnswer: '',
  neighborResult: null,
  transferAnalogy: '',
  transferResult: null,
})
