// Which screen is open lives in the URL, so Back, Forward and refresh work.
// Sessions are ?session=<slug>, showcase rounds are ?round=<slug>, Learn sessions are ?learn=<slug>, the notebook is ?notebook=1,
// the research page is ?research=1, the how-it-was-built page is ?built=1,
// Home is the bare base URL, except on the published static site: there the bare URL is the
// How-we-built-it page and the app's Home is ?app=1.
import { isStatic } from './demo/demo'

/** The published static site (no AI server) opens on How we built it; dev and tests keep Home first. */
export const builtFirst = () => isStatic() && !!import.meta.env.PROD
export type Screen = { kind: 'home' } | { kind: 'notebook' } | { kind: 'research' } | { kind: 'built' } | { kind: 'session'; slug: string } | { kind: 'round'; slug: string } | { kind: 'learn'; slug: string }

export const HOME: Screen = { kind: 'home' }

export function readScreen(search: string): Screen {
  const q = new URLSearchParams(search)
  const session = q.get('session')
  if (session) return { kind: 'session', slug: session }
  const learn = q.get('learn')
  if (learn) return { kind: 'learn', slug: learn }
  const round = q.get('round')
  if (round) return { kind: 'round', slug: round }
  if (q.has('notebook')) return { kind: 'notebook' }
  if (q.has('research')) return { kind: 'research' }
  if (q.has('built')) return { kind: 'built' }
  if (q.has('app')) return HOME
  return builtFirst() ? { kind: 'built' } : HOME
}

export function screenUrl(screen: Screen, base: string = import.meta.env.BASE_URL): string {
  if (screen.kind === 'home') return builtFirst() ? `${base}?app=1` : base
  if (screen.kind === 'notebook') return `${base}?notebook=1`
  if (screen.kind === 'research') return `${base}?research=1`
  if (screen.kind === 'built') return builtFirst() ? base : `${base}?built=1`
  return `${base}?${screen.kind}=${encodeURIComponent(screen.slug)}`
}

// Push a history entry for the screen, unless the URL already shows it.
export function pushScreen(screen: Screen, base: string = import.meta.env.BASE_URL): void {
  const url = screenUrl(screen, base)
  if (location.pathname + location.search === url) return
  history.pushState(null, '', url)
}

// Replace the current entry (e.g. to drop a slug that doesn't exist).
export function replaceScreen(screen: Screen, base: string = import.meta.env.BASE_URL): void {
  history.replaceState(null, '', screenUrl(screen, base))
}

// Call back with the screen the URL now shows on Back/Forward. Returns an unsubscribe.
export function onScreenChange(cb: (s: Screen) => void): () => void {
  const handler = () => cb(readScreen(location.search))
  window.addEventListener('popstate', handler)
  return () => window.removeEventListener('popstate', handler)
}
