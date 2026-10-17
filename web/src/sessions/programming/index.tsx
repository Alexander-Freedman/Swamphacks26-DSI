import type { SessionDef } from '../registry'
import { ProgrammingSession } from './ProgrammingSession'

export const session: SessionDef = {
  slug: 'programming',
  title: 'Programming',
  blurb: 'Step through code and watch what the computer actually does.',
  order: 3,
  Component: ProgrammingSession,
}
