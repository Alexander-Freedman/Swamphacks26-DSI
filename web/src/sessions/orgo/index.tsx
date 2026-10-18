import type { SessionDef } from '../registry'
import { OrgoSession, SLUG } from './OrgoSession'

export const session: SessionDef = {
  slug: SLUG,
  title: 'Organic chemistry',
  blurb: 'Snap a molecule together, then draw the arrows of a real reaction.',
  order: 1,
  Component: OrgoSession,
}
