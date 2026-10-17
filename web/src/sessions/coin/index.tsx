import type { SessionDef } from '../registry'
import { CoinSession } from './CoinSession'

export const session: SessionDef = {
  slug: 'coin-streak',
  title: 'Be a coin',
  blurb: 'Tap out 100 flips, then watch a real coin out-streak you.',
  order: 2,
  Component: CoinSession,
}
