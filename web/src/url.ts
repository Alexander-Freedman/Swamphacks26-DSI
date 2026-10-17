// Which screen is open lives in the URL, so Back, Forward and refresh work.
// Sessions are ?session=<slug>, showcase rounds are ?round=<slug>, Home is the bare base URL.
export type Screen = { kind: 'home' } | { kind: 'session'; slug: string } | { kind: 'round'; slug: string }

export const HOME: Screen = { kind: 'home' }

export function readScreen(search: string): Screen {
  const q = new URLSearchParams(search)
  const session = q.get('session')
  if (session) return { kind: 'session', slug: session }
  const round = q.get('round')
  if (round) return { kind: 'round', slug: round }
  return HOME
}

export function screenUrl(screen: Screen, base: string = import.meta.env.BASE_URL): string {
  if (screen.kind === 'home') return base
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
