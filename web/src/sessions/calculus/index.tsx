import type { SessionDef } from '../registry'
import { CalculusSession } from './CalculusSession'

export const session: SessionDef = {
  slug: 'calculus',
  title: 'Slope and area, by hand',
  blurb: 'Drag a tangent, sketch the derivative, fill the area with rectangles.',
  order: 4,
  Component: CalculusSession,
}
