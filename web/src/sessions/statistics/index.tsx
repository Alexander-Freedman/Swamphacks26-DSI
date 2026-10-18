import type { SessionDef } from '../registry'
import { StatisticsSession } from './StatisticsSession'

export const session: SessionDef = {
  slug: 'statistics',
  title: 'Statistics',
  blurb: 'Chance, averages and evidence, played out instead of memorized.',
  order: 4,
  Component: StatisticsSession,
}
