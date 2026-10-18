import type { SessionDef } from '../registry'
import { ChemistrySession } from './ChemistrySession'

export const session: SessionDef = {
  slug: 'chemistry',
  title: 'General chemistry',
  blurb: 'Turn molecules around in 3D and watch electrons push them into shape.',
  order: 2.5,
  Component: ChemistrySession,
}
