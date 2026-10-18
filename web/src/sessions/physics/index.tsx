import type { SessionDef } from '../registry'
import { PhysicsSession } from './PhysicsSession'

export const session: SessionDef = {
  slug: 'physics',
  title: 'Physics',
  blurb: 'Launch, push and spin things, then watch the laws behind them.',
  order: 5,
  // Off Home until more of its topics are built; ?session= still opens it.
  home: false,
  Component: PhysicsSession,
}
