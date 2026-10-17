import type { SessionDef } from '../registry'
import { CalculusSession } from './CalculusSession'

export const session: SessionDef = {
  slug: 'calculus',
  title: 'Slopes and areas',
  blurb: 'Drag a tangent. Fill an area. Watch calculus happen.',
  order: 4,
  Component: CalculusSession,
}
