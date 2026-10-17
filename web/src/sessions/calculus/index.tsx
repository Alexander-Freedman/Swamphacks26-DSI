import type { SessionDef } from '../registry'
import { CalculusSession } from './CalculusSession'

export const session: SessionDef = {
  slug: 'calculus',
  title: 'Calculus',
  blurb: 'Drag a tangent. Fill an area. Watch calculus happen.',
  order: 2,
  Component: CalculusSession,
}
