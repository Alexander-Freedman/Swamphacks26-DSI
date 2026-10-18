import type { SessionDef } from '../registry'
import { BiologySession, SLUG } from './BiologySession'

export const session: SessionDef = {
  slug: SLUG,
  title: 'Biology',
  blurb: 'Copy a gene into RNA, read its codons, build the protein, then change one letter.',
  order: 3,
  // Off Home until more of its topics are built; ?session= still opens it.
  home: false,
  Component: BiologySession,
}
