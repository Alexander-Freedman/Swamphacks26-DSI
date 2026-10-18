import type { SessionDef } from '../registry'
import { PositiveSession } from './PositiveSession'

export const session: SessionDef = {
  slug: 'positive-test',
  title: 'You tested positive. Are you sick?',
  blurb: 'Test 1,000 people and watch where the positives really come from.',
  order: 3,
  home: false,
  Component: PositiveSession,
}
