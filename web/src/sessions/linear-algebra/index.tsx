import type { SessionDef } from '../registry'
import { LinearAlgebraSession } from './LinearAlgebraSession'

export const session: SessionDef = {
  slug: 'linear-algebra',
  title: 'Linear algebra',
  blurb: 'Drag two arrows and watch a matrix move the whole plane.',
  order: 6,
  // Off Home until more of its topics are built; ?session= still opens it.
  home: false,
  Component: LinearAlgebraSession,
}
