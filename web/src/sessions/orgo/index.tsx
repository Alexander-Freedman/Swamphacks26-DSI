import type { SessionDef } from '../registry'
import { OrgoSession, SLUG } from './OrgoSession'

export const session: SessionDef = {
  slug: SLUG,
  title: 'Push the electrons',
  blurb: 'Snap a molecule together, then draw the arrows of a real reaction.',
  order: 5,
  Component: OrgoSession,
}
