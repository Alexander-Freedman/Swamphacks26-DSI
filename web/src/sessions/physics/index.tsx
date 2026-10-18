import type { SessionDef } from '../registry'
import { PhysicsSession } from './PhysicsSession'

export const session: SessionDef = {
  slug: 'physics',
  title: 'Physics',
  blurb: 'Launch, push and spin things, then watch the laws behind them.',
  order: 5,
  Component: PhysicsSession,
}
